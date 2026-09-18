# 社媒下载工具

## 范围与状态

已于 2026-09-18 部署生产。入口为 `/tools/social-download/`，沿用工具箱与
`assets/site-system.css`，未引入前端框架。工具页、API 和文件均沿用现有工具箱认证。
工具箱含“素材 / 社媒下载”入口，下载页含“返回工具箱”。

页面接受六个平台的单条视频链接和分享文字。接受链接不代表该平台所有视频都可下载；
私密内容、平台登录要求、地区和 IP 限制仍然适用。只保存有权下载的内容。
本版本不导入浏览器 Cookie，不提供 Cookie 上传、付费解析或绕过访问权限功能。

## 组成

| 部分 | 路径或版本 |
| --- | --- |
| 页面 | `tools/social-download/` |
| 同源 API 与进程启动器 | `services/social-download/server.py` |
| 抖音解析桥接 | `services/social-download/yt_dlp_plugins/extractor/douyin_share.py` |
| 离线契约 | `tests/social_download_contract.py` |
| 前端浏览器契约 | `tests/social_download_frontend_contract.mjs` |
| MeTube | `alexta69/metube`，提交 `6708a882294a6e8c5ffe097354c7eee42eb0f309` |
| yt-dlp | MeTube 锁文件中的 `2026.8.19` |
| 可选抖音解析器 | `wujunwei928/parse-video-py`，提交 `5fcf87256edb5ffcdebf0e4aac2a5a41745da76e` |

MeTube 管理队列和下载，网关只暴露提交、状态、重试、移除、文件读取五类 API。
抖音插件在独立 Python 环境调用解析器，返回的媒体仍交给 MeTube/yt-dlp 下载。
未修改两套上游源码。插件仅在提供 `--parser-root` 时启用，只接管抖音。
它不保证分辨率选择，画质选项均为优先级而非转码或硬上限。

MeTube 队列键是 URL，不是视频 ID。外部任务 ID 为 URL 的 SHA-256；
操作队列时在服务端映射回 URL。新任务文件名加 URL 哈希前缀，避免不同分享链接
指向同一视频时互相覆盖缓存。上游重试保留原任务参数，旧测试任务不自动迁移参数。

上游许可证分别为 AGPL-3.0 和 MIT；页面提供固定版本源码入口。
部署或分发时保留适用的许可与源码义务，不应把上游整体换皮后当作自有闭源软件分发。
图标来源及许可随 `icons.svg` 保留。

## 本地启动

依赖：Git、uv、FFmpeg/ffprobe，以及两个上游锁定的 Python 环境。
下载、状态、日志、依赖和上游源码全部放在网站仓库外。

首次准备示例，目录若已经存在应先核验，不要覆盖：

```bash
git clone https://github.com/alexta69/metube.git /tmp/personal-website-metube-20260918
git -C /tmp/personal-website-metube-20260918 checkout --detach 6708a882294a6e8c5ffe097354c7eee42eb0f309
uv sync --project /tmp/personal-website-metube-20260918 --frozen --no-dev

git clone https://github.com/wujunwei928/parse-video-py.git /tmp/personal-website-parse-video-probe-20260918
git -C /tmp/personal-website-parse-video-probe-20260918 checkout --detach 5fcf87256edb5ffcdebf0e4aac2a5a41745da76e
cp services/social-download/parser.uv.lock /tmp/personal-website-parse-video-probe-20260918/uv.lock
uv sync --project /tmp/personal-website-parse-video-probe-20260918 --frozen --no-dev
```

备用解析器上游忽略了 `uv.lock`；本仓库保存本地验收所用的生成锁文件
`services/social-download/parser.uv.lock`，安装前复制到其独立检出目录。

在网站仓库根目录前台启动，Ctrl+C 会一同关闭下载引擎：

```bash
/tmp/personal-website-metube-20260918/.venv/bin/python -B \
  services/social-download/server.py \
  --metube-root /tmp/personal-website-metube-20260918 \
  --parser-root /tmp/personal-website-parse-video-probe-20260918 \
  --runtime-root /tmp/personal-website-social-download-runtime
```

访问 `http://127.0.0.1:8766/tools/social-download/`。网关与引擎分别只绑定
`127.0.0.1:8766`、`127.0.0.1:18081`；冲突时用 `--port` 和 `--engine-port`
指定空闲端口，不要停止他人的进程。

可通过 `SOCIAL_DOWNLOAD_PROXY` 指定自己的既有代理；默认空值。
本次测试使用本机已有代理，未调整代理节点。生产出口需要单独测试。
不要把含代理认证信息的环境变量写入 Git、网页或公开日志。

新运行目录必须为空；启动器自动写入 `.social-download-runtime` 标记。
已有未标记目录会被拒绝，不要手工给陌生目录补标记来绕过保护。
已有本地验收目录由本工具创建，包含短期样本。`/tmp` 只用于本地验收，
不是持久化生产目录。

## 资源与安全边界

- 网关限制初始链接的域名、路径、协议、端口；拒绝主页、列表、自定义参数和任意文件路径。
- POST 检查 Host、Origin、自定义请求头和 JSON 类型，未开放跨域。
- 非本机 origin 要求可信代理写入 `X-Authenticated-User`，不是独立认证机制。
- 队列最多 6 条，并发下载 2 条；提交间隔至少 2 秒。
- 文件上限 500 MiB，同时使用 yt-dlp 上限与 Unix 文件大小资源限制。
- 缓存 2 GiB 为每 15 秒检查的软阈值，不是文件系统硬配额。
- 任务排队及下载最多约 600 秒，文件链接从任务创建起保留 24 小时。
- 自动维护会移除过期任务及专用缓存目录内的过期文件；日志另需运维轮转。
- 浏览器只收到经过筛选的状态字段；不收到上游 options、媒体直链或原始异常。
- 提交超时不会自动重试，先刷新队列再由用户决定，避免重复下载。
- 自动清理、上限与错误处理有离线覆盖；没有进行满 24 小时或满 2 GiB 压测。

**不是完整 SSRF 沙箱。** 上游提取阶段、外部解析进程、代理和 FFmpeg 的请求链
不能仅靠初始 URL 白名单保证隔离；插件的媒体域名校验也不能替代网络隔离。
本地原型只供可信用户使用。上线前必须限制服务出站访问内网、回环、链路本地地址、
云元数据及管理服务，包括代理出口；以独立用户和受限运行环境运行。
不能为了解决平台故障关闭 MeTube 私有地址保护。

## 发布要求

仅在用户明确授权上线后执行，后续发布仍须重新核验：

1. 重新核验实际服务器、Nginx 加载配置、路由和已有认证，保留原站点公开/私有边界。
2. 仅将 `/tools/social-download/` 前缀反代至网关，其他路由继续由原站点拥有。
3. 同时保护页面、状态、提交和文件端点；验证匿名返回 401。
4. Nginx 成功认证后覆盖 `X-Authenticated-User` 为 `$remote_user`，不透传客户端同名头；
   设置可信 Host，并用 `--origin` 配置准确外部 origin。生产必须使用 HTTPS。
5. 引擎与网关只监听回环；不用 Nginx 暴露 MeTube 原生管理 API、日志或缓存目录。
6. 配置非特权服务用户、出站隔离、磁盘配额、日志轮转和进程监管；
   反代提交超时应容纳 120 秒元数据解析，并保留 Range 与下载响应头。
7. 逐平台使用新鲜、可访问且有权保存的样本在生产出口重新验收。
8. 精确白名单发布、webroot 外备份、哈希核对与回滚，遵守根目录 `AGENTS.md`。

浏览器界面为单用户/可信共享工具，所有登录用户共享一套任务列表和缓存，
没有实现多租户隔离。不要直接开放给匿名互联网用户。

## 2026-09-18 本地实测

以下只证明列出的样本和当前本地出口，不是整个平台稳定可用的保证。

| 平台 | 样本 | 实测 |
| --- | --- | --- |
| 抖音 | `6961737553342991651` | 原生 yt-dlp 要求新 Cookie；抖音插件完成下载。576×1024，H264/AAC，19.782 秒，3,676,544 字节。 |
| Instagram | Reel `Chunk8-jurw` | 完成下载。720×1280，H264，4.967 秒，1,949,801 字节；该次选择的源无音轨。 |
| X | `captainamerica/status/719944021058060289` | 完成下载。1280×720，H264/AAC，3.179 秒，539,285 字节。 |
| YouTube | `YE7VzlLtp-4` | 要求登录以确认非机器人，未完成下载。 |
| TikTok | `@leenabhushan/video/6748451240264420610` | 明确返回当前 IP 被限制，未完成下载。 |
| 小红书 | `6411cf99000000001300b6d9` | yt-dlp 无可用视频格式；独立备用解析返回 note id undefined，未接入备用路径。 |

三个成功文件均经过 ffprobe 检查并在 Ego 浏览器中加载、播放。
X 和抖音通过页面保存到本机，并核对服务器原件哈希。
实际浏览器还覆盖空输入、错误反馈、关闭预览与焦点恢复、移除确认的取消/接受、
失败任务重试、运行中取消。新的抖音分享路径以服务原有队列和文件 API 完成闭环。

验证命令：

```bash
/tmp/personal-website-metube-20260918/.venv/bin/python -B tests/social_download_contract.py
bash tests/site_contract.sh
bash tests/asset_contract.sh
node --check tools/social-download/app.js
git diff --check
SITE_URL=http://127.0.0.1:8766 BROWSER_CHANNEL=chrome node tests/browser_contract.cjs
```

21 项离线测试通过。既有浏览器契约在 320、390、768、1440 宽度通过；
测试环境的 Playwright 从 Codex 已安装依赖通过 `NODE_PATH` 加载，没有加入仓库依赖。
新工具使用 Ego TaskSpace 单独验收。未做生产负载、生产认证或全天候平台稳定性测试。

## Gemini 前端重写后的回归

保留新版布局、配色和组件外观，仅修复本轮审查确认的问题：

- 弹窗内容超高时滚动，不再压缩视频容器并裁掉原生播放控件。
- 窄屏工具栏和筛选栏允许整体换行，按钮文字不折行。
- 删除中使用任务级请求锁、原生按钮禁用和链接拦截；轮询重建按钮后仍保留禁用状态。
- 筛选 Tab 补齐方向键、Home/End、单一 Tab 焦点入口及共享面板关联。
- 移除全平台无水印、原画无损等未验证承诺，注明实际可用性和画质取决于解析结果。

本地服务运行后执行：

```bash
ego-browser nodejs < tests/social_download_frontend_contract.mjs
```

该脚本使用 Ego 原生 TaskSpace，在独立页面拦截 API 写请求，不会删除真实任务。
以合成竖屏媒体流和长标题检查 320、390、768、1440 宽度的控件边界、
视频容器和弹窗滚动，再检查筛选键盘操作、删除防重入、轮询更新及失败恢复。
截图写入系统临时目录，测试结束恢复页面并关闭测试 TaskSpace。
这类 UI 回归不替代真实平台下载验收；本轮没有重新验证六个平台的可用性。

## 2026-09-18 生产部署

### 运行边界

- 前后端代码在 `/opt/social-download/site/`，不将 Python、依赖和缓存发布到公开 webroot。
- 上游检出目录为 `/opt/social-download/metube` 和 `/opt/social-download/parser`，
  固定到本文的两个提交；独立 Python 3.14.7 和 uv 0.12.8，不升级其他服务的运行环境。
- `social-download.service` 使用独立非登录用户，禁用提权，系统目录只读，
  隐藏网站、Nginx 配置、其他受保护配置和主目录；内存上限 1 GiB，并限制 CPU 和进程数量。
- 仅监听回环的 8766、18081。`social-download-network.service` 在应用前安装
  专用 nftables 表，只约束此 UID，不清空或替代服务器其他防火墙规则。
- 出站只允许公网 TCP 80/443、本地 DNS stub 和指定引擎端口；拒绝内网、
  主机其他本地端口、链路本地、云元数据、Tailscale 范围及 IPv6。未配置生产代理。
- `/var/lib/social-download-storage/cache.ext4` 是独立 3 GiB 预分配文件系统，
  以 `nosuid,nodev,noexec` 挂载至 `/var/lib/social-download`。
  应用仍保留 2 GiB 软缓存限制；运行数据、临时文件及引擎日志在此卷内。
- `runtime.mount` 安装名由
  `systemd-escape --path --suffix=mount /var/lib/social-download` 生成。
  应用通过 `RequiresMountsFor` 依赖此卷，避免挂载失败后写满网站所在文件系统。
- 日志配置为 `social-download.logrotate`；所有配置模板位于 `services/social-download/`。

### 精确发布与回退

此次只更新生产工具箱中的说明和新增入口，不覆盖其余线上工具卡片与设计。
下载页及网关独立安装；现有共享 CSS、JS、favicon 经哈希确认与本地相同，未重新发布。
Git 提交只包含本工具、相关测试、依赖锁和必要 favicon；其他既有网站整改单独保留，
没有将整个脏工作区打包上线。

实际生效的 Nginx 文件仍为 `/etc/nginx/sites-enabled/cliproxyapi`。
仅增加对 `/etc/nginx/snippets/social-download.conf` 的 include。
该 snippet 复用既有认证，并覆盖可信用户头为 `$remote_user`，不接受客户端伪造的同名头。
原认证文件未修改。

本次回滚备份位于 webroot 外 `/root/social-download-release-20260918/`，
目录权限 0700，含原 Nginx 文件、原工具箱 HTML 及发布前哈希。
后续发布需创建新的精确备份，不得覆盖此记录或盲目还原整站。
回退本次路由时，先确认当前文件没有后续更新，再恢复上述两个原文件，
执行 `nginx -t`、reload 并重新验证公开/受保护路由。后台服务、挂载和数据不要自动删除；
确认没有依赖或待保留下载后再另行处理。

### 验收证据

- 21 项离线契约、站点契约、资源契约及强制受保护镜像契约通过。
- Nginx 配置检查通过；公开页面返回 200，工具箱、下载页、API、文件和脚本匿名访问为 401。
  匿名请求即使伪造 `X-Authenticated-User` 也仍为 401。
- 专用 UID 实测无法访问本机管理端口、RFC1918、云元数据和 Tailscale 地址；
  公网 HTTPS 与 DNS 可用。两服务仅监听回环，独立卷和资源限制实际生效。
- Ego 通过线上工具箱进入下载页；320、390、768、1440 宽度无横向溢出。
- 抖音生产出口返回 `v3-dy-o.zjcdn.com`。核验为公网 IP、206 视频响应及 MP4 文件头后，
  补充 `zjcdn.com` 媒体白名单，并增加伪造后缀域名拒绝用例；没有放宽内网出站限制。
- 抖音样本 `6961737553342991651` 在线下载、播放、保存成功：
  H264/AAC，576x1024，19.735 秒，3,676,544 字节。
  浏览器保存件与服务器原件 SHA-256 均为
  `af479be42a1f90e57b9305a57807732393324c62c8fa80930780fea023f13881`。
- Instagram 样本 `Chunk8-jurw` 在线下载成功，720x1280，4.967 秒，
  1,949,801 字节，所选源无音轨。
- X 样本 `captainamerica/status/719944021058060289` 在线下载成功，539,285 字节。
- 同一生产出口的其余样本：YouTube `YE7VzlLtp-4` 和小红书
  `6411cf99000000001300b6d9` 最终没有可下载格式；
  TikTok `@leenabhushan/video/6748451240264420610` 返回平台访问限制。
  “接受链接”和 HTTP 202 不代表最终下载成功，以上三项仍未通过。

以上是单个样本的结果，不是平台整体可用性或长期稳定性的承诺。
