# Personal Website Agent Rules

本文件是本仓库的项目级 Agent 规则真源，适用于 Codex、Antigravity 及其他在本目录工作的 Agent。规则覆盖仓库根目录及全部子目录；若子目录以后出现更具体的 `AGENTS.md`，以更具体的规则为准。

## 1. 项目目标

- 这是「抽纸盒」（陈志鸿）的个人 IP 内容档案。2026-09-25 所有者把方向从求职改为个人 IP：面向用 AI 做内容的人，沉淀 AI 视频作品、制作笔记与电商素材案例；抖音、X、小红书负责分发，网站负责沉淀。设计约束见 `docs/superpowers/specs/2026-09-25-ip-archive-design.md`。
- 不要把网站改回求职站，也不要在未经所有者同意时再改变这个定位。
- 调整公开 URL 时，旧地址必须用 nginx 301 跳到新位置，不能让已分享出去的链接失效。
- 公开站点与受保护工具是两套边界。不能为了本地预览方便而削弱线上认证、暴露内部数据或把运行时文件纳入公开站点。

## 2. 开始工作前

1. 确认当前目录是仓库根目录，并先运行 `git status --short --branch`。
2. 阅读与任务直接相关的页面、共享资源、测试和 `docs/superpowers/` 设计文档，不凭文件名猜实现。
3. 识别用户已有的未提交改动。不得覆盖、回滚、格式化或删除与当前任务无关的改动。
4. 把需求拆成最小、可验证的单元；先确认真正要解决的问题，再选择实现方式。
5. 涉及简历、经历、数据、身份、线上状态或部署环境时，必须重新核验当前事实，不能沿用未经验证的旧结论。

## 3. 仓库结构与真源

- 公开页面：`index.html`、`works/index.html`（作品墙）、`works/<slug>/index.html`（作品详情）、`about/index.html`（含经历，原简历并入）、`contact/index.html`，以及隐私、条款等辅助页。
- 作品真源：`content/works/<slug>/note.md` 是每件作品的元数据与制作笔记；`scripts/build_works.py`（只用 Python 标准库，外加本机 ffmpeg）据此生成详情页、作品墙、首页作品区和 sitemap 条目。生成出来的 HTML 要提交；不要手改生成区块，改 `note.md` 后重新运行脚本。
- 视频与封面：源视频放在 `content/works/<slug>/`，生成的网页用媒体放在 `media/works/<slug>/`，两者都在 `.gitignore` 里，不进 Git（仓库是公开的 GitHub Pages 仓库，也不适合放大文件）。上线时按白名单单独复制到服务器。
- 公共前端资源：`assets/site-system.css`、`assets/site-motion.js` 与 `assets/materials/`。
- 新版公开站（Next.js，尚未上线）：`site/` 是所有者 2026-09-25 选定的 React 重写，静态导出到 `site/out/`（`cd site && npm run build`），交互参考 Skiper UI 免费组件并在页脚署名。它直接引用 `assets/site-system.css`，作品数据读 `build_works.py` 写出的 `site/src/data/works.json`。切换上线前，根目录页面仍是线上真源，两边都要保持一致；`site/node_modules`、`site/.next`、`site/out` 不进 Git。新站的浏览器验收：在 `site/out` 起本地服务后用 `SITE_URL` 指向它运行 `tests/browser_contract.cjs`。
- 工具入口：`tools/index.html`。工具页可能是受保护服务入口、跳转页或本地原型，不能一概当作公开静态页面。
- 受保护镜像：`cpa/`、`image-playground/`、`monitor/`、`proxy/`、`tools/image/`、`tools/proxy/`、`tools/sim/` 等目录可能包含本地镜像或运行时资产；先检查 `.gitignore`、现有跟踪状态和对应测试。
- 设计与运维约束：`docs/superpowers/specs/` 是设计约束，`docs/superpowers/plans/` 是执行记录。历史计划不能替代当前运行时核验。
- 验收脚本：`tests/`。修改行为时同步检查相关契约，不能只看页面外观。

## 4. 工作原则

- 保持代码库整洁：不留下临时文件、调试截图、一次性脚本、死代码、死链接、无引用资源或无必要目录。
- Measure twice, cut once：动手前确认影响面、真源和验证方法；优先做范围最小、可回退的修改。
- 遵循现有 HTML、CSS 和 JavaScript 风格。没有明确收益时，不引入框架、构建系统、依赖或新抽象。
- 优先使用结构化解析和现有工具；搜索文件和文本时优先使用 `rg` 与 `rg --files`。
- 不执行与任务无关的重构，不批量改格式，不顺手清理用户正在进行的工作。
- 未经用户明确要求，不创建提交、不推送远端、不改写历史、不切换或删除分支。
- 删除文件、覆盖关键数据、修改认证配置、发布线上内容等不可逆或高风险操作，必须在执行前得到用户明确确认。
- 其他不需要用户亲自输入密码、付款、授权或确认的低风险步骤，应由 Agent 主动完成并验证。

## 5. 内容与隐私边界

- 所有个人经历、职责、业绩、时间、公司、工具能力和项目成果必须有仓库内容或用户提供的证据支持。
- 对外主定位是「抽纸盒 · 用 AI 做视频的编导」。经历描述仍可使用 `信息流素材编导`、`广告素材策划`、`千川素材编导`。不得擅自扩写为女鞋运营、全链路负责人或其他未经证实的身份。
- 作品归属：个人作品可以直接公开；给公司或客户做的作品，只有在已公开发布或对方同意时才能放，并且不放后台数据。`note.md` 必须写明归属，拿不准的不放。
- 制作笔记只写所有者提供的工具、提示词、步骤和踩坑，不补写未提供的参数、效果或数据。
- 不捏造 GMV、ROI、转化率、客户、奖项、管理规模、从业年限或归因关系。
- 不把私人手机号、详细住址、证件、账号、密钥、令牌、内部 IP、服务凭据或未公开业务数据写入 HTML、JavaScript、日志、测试夹具或提交历史。
- `.env`、密钥、认证文件和服务器状态文件必须保持本地，不得强制加入 Git。
- 修改公开文案时保留自然、克制、可信的中文表达，避免营销夸张、空洞自评和 AI 套话。

## 6. 前端约束

- 保留 Kami 浅色纸张质感与中文语气。视频、封面和作品墙直接放在纸面上，不加深色「放映框」边框（所有者 2026-09-25 决定，新站 `site/` 已执行；旧的根目录页面在切换前仍保留旧样式）。主导航固定为「首页 / 作品 / 关于」，工具箱入口只在页脚。除非用户明确要求，不做整体品牌重设计。
- 站内视频为 1080p H.264，必须 faststart、`preload="none"` 并带封面；首页不自动加载视频。服务器在新加坡且没有 CDN，国内加载慢，新增媒体时注意文件大小。
- 页面必须在 320、390、768 和 1440 像素宽度下无横向溢出、无文字或控件重叠、无破图。
- 使用语义化 HTML，维持合理标题层级、键盘操作、焦点状态、跳转锚点、替代文本和足够的触控尺寸。
- 动效必须尊重 `prefers-reduced-motion`；打印页面不能隐藏尚未触发动画的正文。
- 不禁用浏览器缩放，不用脚本全局拦截多指缩放或浏览器手势。
- 图片应服务于真实作品和内容表达。优先复用或优化现有素材；新增公开图片时检查格式、尺寸、文件大小、引用路径和版权来源。
- 公共导航、canonical、`robots.txt` 与 `sitemap.xml` 的 URL 必须保持一致。

## 7. 公开与受保护路由

- 预期公开：`/`、`/works/`、`/works/<slug>/`、`/about/`、`/contact/`、`/privacy/`、`/terms/`、`/media/works/*` 和对应公共静态资源。
- 旧地址跳转（nginx 301）：`/resume/` → `/about/#experience`，`/methods/` → 素材编导方法页。`/works/#nv` 这类旧锚点由作品墙页面脚本跳到对应新页。
- 预期受保护：`/tools/`、`/tools/*`、`/monitor/`、`/image-playground/`、`/cpa/`、`/s` 等内部工具入口。匿名访问返回 `401` 通常是正确边界，不得误判为站点故障。
- 例外：按所有者 2026-09-24 的决定，`/tools/sim/` 页面不加 Nginx Basic Auth，匿名访问返回 `200`，只靠 SIM 自己的 Telegram 登录；不要把它当成漏洞去补。`/tools/sim/api/` 由应用令牌鉴权，也不能叠加 Basic Auth，否则会和应用自己的 `Authorization` 请求头冲突。
- `tools/ecommerce-video-breakdown/index.html` 是本地预览与说明页面；线上同路径由后端服务拥有，不能用静态原型覆盖线上后端模板。
- 浏览器端不得包含服务器内部令牌。Nginx Basic Auth、应用凭据和 API Key 是彼此独立的认证层，不能互相替代。

## 8. 验证要求

按修改范围运行最小充分验证。公开网站的基础验收为：

```bash
bash tests/site_contract.sh
bash tests/asset_contract.sh
```

涉及 SIM 工具时运行：

```bash
bash tests/sim_contract.sh
```

涉及受保护本地镜像时运行：

```bash
bash tests/protected_mirror_contract.sh
```

发布前必须要求所有受保护镜像存在并通过：

```bash
REQUIRE_PROTECTED_MIRRORS=1 bash tests/protected_mirror_contract.sh
```

浏览器契约默认使用本地 `8765` 端口：

```bash
python3 -m http.server 8765
BROWSER_CHANNEL=chrome node tests/browser_contract.cjs
```

- 若 Playwright 自带浏览器不可用，使用已安装 Chrome 的 `BROWSER_CHANNEL=chrome`，并把环境问题与页面测试失败分开报告。
- 所有网页打开、点击、表单填写、截图、数据提取、登录态复用、线上检查和交互式 QA，默认必须使用 `ego-browser` 控制 Ego Lite 的 TaskSpace。
- 不要调用 Antigravity 内置的 Chrome `/browser` 子代理，也不要自行启动 Playwright、Chrome 或其他浏览器。只有 `ego-browser` 已确认不可用、用户明确指定其他浏览器，或既有自动化契约明确要求 Playwright 时，才可改用其他路线，并在交付中说明原因。
- 测试失败时先定位真实原因并修复，不通过删断言、放宽关键边界或隐藏错误来制造通过。

## 9. 上线规则

- 只有用户明确要求“上线”“部署”或同等意思时，才修改生产环境。
- 当前公开站点的已知 webroot 是 `/var/www/personal_website`，但每次发布前都必须重新核验服务器、Nginx 配置、目录、路由和当前文件哈希。
- 2026-09-13 实机核验显示，Coco 当前加载的是独立文件 `/etc/nginx/sites-enabled/cliproxyapi`，不是 `/etc/nginx/sites-available/cliproxyapi`。每次应先用 `nginx -T` 确认真实加载来源，不能按目录惯例猜测或覆盖未生效副本。
- 发布前运行本地验收和 `nginx -t`，并检查公开路由为 `200`、受保护路由匿名访问为 `401`。
- 采用精确白名单发布，只复制本次审查过的页面、共享资源和明确批准的静态镜像。
- 回滚备份必须放在 webroot 之外并限制权限。禁止对整个 webroot 执行 `rsync --delete`。
- 禁止发布 `.env`、密钥、认证文件、运行时状态、SIM 数据、服务器配置或未审查的本地镜像。
- 发布后对比目标文件哈希，并用真实浏览器检查线上页面；若关键检查失败，回滚本次精确目标集。

## 10. 对抗式审查与交付

交付前切换成最挑剔的审查者，按实际风险检查：

1. 逻辑是否解决了用户真正的问题，是否存在更简单的实现。
2. 个人事实、页面文案、链接、路径和线上状态是否有证据。
3. 响应式、可访问性、隐私、认证边界和部署范围是否被破坏。
4. 是否留下临时文件、无引用资源、重复规则或不必要依赖。
5. 相关测试是否真实运行，失败、跳过项和残余风险是否如实说明。

发现影响验收的问题应先修复再交付。最终汇报只陈述实际完成内容、验证证据、未验证项和必要的后续动作，不用“看起来没问题”代替证据。
