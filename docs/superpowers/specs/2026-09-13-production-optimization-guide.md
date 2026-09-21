# 生产服务器 Nginx 与域名配置优化指南

本指南针对 `chenzhihong.online` 现网实测发现的服务器传输性能、错误兜底、安全响应头与 DNS 配置问题，提供精确、可回滚的配置变更方案。

---

## 1. Nginx Gzip 压缩优化（立竿见影缩短首屏加载）

### 问题现状
现网实测：
- `assets/site-system.css` 未压缩传输，体积为完整 **35,121 字节（35 KB）**，拉取耗时超过 2 秒；
- `assets/site-motion.js` 未压缩传输。

### 优化配置
先用 `nginx -T` 确认真实加载来源。2026-09-13 实机显示当前生效站点配置是独立文件 `/etc/nginx/sites-enabled/cliproxyapi`，并非 `sites-available` 下同名文件。在实际加载配置的 `http` 或 `server` 块中加入：

```nginx
# 开启 Gzip 并指定静态资源类型
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_min_length 1024;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/javascript
    application/x-javascript
    application/json
    application/xml
    image/svg+xml;
```

**预期效果**：CSS 传输体积直降至约 **7 KB（减少 80%）**，JS 压缩至约 **2 KB**。

---

## 2. 404 静态错误页拦截（防止请求穿透至后端代理）

### 问题现状
现网访问任意不存在路径（如 `https://chenzhihong.online/work`），Nginx 会将请求代理至底层 CLI Proxy API，导致返回空白页面，并在响应头中泄露 `X-CPA-TRACE-ID`、`OpenAI-Request-Id` 等内部服务特征。

### 优化配置
先确认受保护工具的精确 `location` 仍保持原有鉴权和代理配置。随后让公开站点的兜底 `location /` 只读取静态 webroot，不再把未知路径交给后端代理：

```nginx
# 受保护的 /tools/、/monitor/、/cpa/、/s 等 location 保持在前，不在这里改写。
location / {
    root /var/www/personal_website;
    try_files $uri $uri/ =404;
}

error_page 404 /404.html;

location = /404.html {
    root /var/www/personal_website;
    internal;
}
```

如果现有架构确实要求某个独立代理 `location` 接管请求，且需要把该上游返回的 404 换成本地页面，则必须只在那个代理块中额外配置：

```nginx
proxy_intercept_errors on;
error_page 404 = /404.html;
```

`proxy_intercept_errors` 只能接管上游的错误状态，不能阻止上游把未知路径错误地返回为 `200`。因此公开路径仍应优先通过 `try_files` 明确截断。

---

## 3. 补充现代安全响应头与隐藏版本

### 问题现状
缺少标准安全头，且响应头包含 `server: nginx/1.24.0 (Ubuntu)`。

### 优化配置
在主 server 块中添加：

```nginx
# 隐藏 Nginx 版本号
server_tokens off;

# 现代安全响应头
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000" always;
```

只有在 `www` 等全部子域都已具备有效 HTTPS 证书并完成访问验证后，才考虑追加 `includeSubDomains`。提前启用会让浏览器强制用 HTTPS 访问尚未准备好的子域。

---

## 4. `www.` 域名 DNS 解析与 301 重定向

### 问题现状
`host www.chenzhihong.online` 返回 `NXDOMAIN`，用户手动输入带 `www` 的网址无法访问。

### 优化步骤
1. **DNS 服务商后台**（如 Cloudflare / 阿里云 / 腾讯云等）：
   - 添加一条 `CNAME` 记录：
     - 主机记录（Name）：`www`
     - 记录类型（Type）：`CNAME`
     - 记录值（Value）：`chenzhihong.online`
2. **证书与 Nginx 配置**：
   先签发或更新同时覆盖 `chenzhihong.online` 与 `www.chenzhihong.online` 的证书。证书路径没有确认前，不要启用 `listen 443 ssl`。

   HTTP 可以先安全重定向：

```nginx
server {
    listen 80;
    server_name www.chenzhihong.online;
    return 301 https://chenzhihong.online$request_uri;
}
```

   证书签发并核对真实路径后，再增加 HTTPS 重定向块。以下路径必须替换成服务器上的真实证书路径后才能执行 `nginx -t`：

```nginx
server {
    listen 443 ssl;
    server_name www.chenzhihong.online;

    ssl_certificate /真实路径/fullchain.pem;
    ssl_certificate_key /真实路径/privkey.pem;

    return 301 https://chenzhihong.online$request_uri;
}
```

---

## 5. 验证与上线步骤

在服务器上执行：
```bash
# 1. 检查配置语法
sudo nginx -t

# 2. 安全重载
sudo systemctl reload nginx

# 3. 验证 Gzip 压缩
curl -sI -H "Accept-Encoding: gzip" https://chenzhihong.online/assets/site-system.css | grep -i content-encoding
# 预期输出: content-encoding: gzip

# 4. 验证 404 拦截
curl -sI https://chenzhihong.online/non-existent-test-path | grep -i "404"

# 5. 确认错误响应不再包含后端代理头
curl -sI https://chenzhihong.online/non-existent-test-path | grep -Ei "x-cpa-trace-id|openai-request-id"
# 预期：无输出

# 6. 验证 www 的证书和重定向
curl -sI https://www.chenzhihong.online/ | head
```

发布共享 CSS/JS 时同步更新 HTML 中的查询版本，例如 `?v=20260913-trust-r1`，避免七天静态资源缓存让旧访客继续使用上一版交互。
