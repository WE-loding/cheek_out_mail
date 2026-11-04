# PMail 前端部署到 Cloudflare Pages 指南

## 概述

本指南说明如何将 PMail Vue3 前端部署到 Cloudflare Pages。Cloudflare Pages 提供免费的静态站点托管和边缘函数（Functions）能力。

**架构说明**：
- **前端**：部署到 Cloudflare Pages（全球 CDN 加速）
- **后端**：仍需运行在你的服务器/Docker（处理 SMTP/POP3/IMAP/邮件存储）
- **通信**：前端通过 HTTPS API 调用后端

## 前置条件

1. Cloudflare 账号
2. 已部署的 PMail 后端服务器（带公网 IP 或域名）
3. Node.js + yarn 本地环境

## 部署步骤

### 方法一：通过 Cloudflare 控制台（推荐）

1. **构建前端**
   ```bash
   cd fe
   yarn install
   yarn build
   ```
   输出目录：`fe/dist`

2. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com
   - 进入 **Workers & Pages** > **Create application** > **Pages**

3. **连接 Git 仓库（可选）**
   - 选择 **Connect to Git**
   - 选择你的 PMail 仓库
   - 设置构建配置：
     - **Build command**: `cd fe && yarn && yarn build`
     - **Build output directory**: `fe/dist`
     - **Root directory**: `/`

4. **设置环境变量**
   - 进入 **Settings** > **Environment variables** > **Production**
   - 添加变量：
     | Variable name | Value |
     |---------------|-------|
     | `VITE_APP_API_URL` | `https://你的后端域名.com` |

5. **部署**
   - 点击 **Save and Deploy**
   - Cloudflare 会自动构建并部署

### 方法二：通过 Wrangler CLI

1. **安装 Wrangler**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **配置环境变量**
   创建 `fe/.env.production`：
   ```env
   VITE_APP_API_URL=https://你的后端域名.com
   ```

3. **构建并部署**
   ```bash
   cd fe
   yarn install
   yarn build
   wrangler pages deploy dist
   ```

## 后端 CORS 配置

确保你的 PMail 后端允许跨域请求。如果使用 Nginx 反向代理，添加：

```nginx
location / {
    proxy_pass http://127.0.0.1:80;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    
    # CORS 头（如果后端未处理）
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header Access-Control-Allow-Headers 'Content-Type, Authorization, Lang, Token' always;
}
```

PMail 后端已在 `https_server.go` 的 `contextIterceptor` 中设置 `Content-Type`，但建议验证 CORS 行为。

## 使用 Cloudflare Functions（可选）

如果后端 API 有 CORS 限制，可以使用 Cloudflare Functions 作为代理：

1. **部署时自动包含 Functions**
   ```bash
   wrangler pages deploy dist
   ```
   `fe/functions/` 目录下的函数会自动部署。

2. **设置环境变量**
   - 在 Cloudflare Pages 控制台：**Settings** > **Environment variables**
   - 添加 `VITE_APP_API_URL` = 后端地址

3. **前端配置**
   - 如果 Functions 已部署，前端可以直接调用 `/api/*`，Functions 会转发到后端
   - 无需设置 `VITE_APP_API_URL` 环境变量

## 自定义域名

1. 进入 **Workers & Pages** > 你的项目 > **Custom domains**
2. 点击 **Add custom domain**
3. 输入你的域名（如 `mail.yourdomain.com`）
4. Cloudflare 会自动配置 DNS

## 环境变量说明

| 变量 | 必填 | 描述 | 示例 |
|------|------|------|------|
| `VITE_APP_API_URL` | 是 | 后端 API 基础 URL | `https://mail.example.com` |

## 故障排查

### 前端无法连接后端

1. 检查 `VITE_APP_API_URL` 是否正确
2. 确认后端服务器可公网访问
3. 检查防火墙是否放行 80/443 端口

### CORS 错误

- 在 Network 面板查看 `Access-Control-Allow-Origin` 头
- 确认后端或 Nginx 已配置 CORS
- 或使用 Cloudflare Functions 代理（见上文）

### 刷新后 404

已配置 `_redirects` 规则，应该自动重定向到 `index.html`。如仍有问题，检查：
- `_redirects` 文件是否在 `dist` 目录
- Cloudflare Pages 是否正确处理 SPA 路由

## 更新部署

### Git 连接模式
- 推送代码后自动构建部署

### Wrangler CLI 模式
```bash
cd fe
yarn build
wrangler pages deploy dist
```

## 成本

Cloudflare Pages 免费额度：
- 无限站点
- 每月 500 次构建
- 每月 10 万次请求
- 全球 CDN

对于个人邮箱，免费额度通常足够。

## 安全建议

1. **强制 HTTPS**：Cloudflare 默认启用
2. **设置 Token 有效期**：PMail 默认 5 秒，已较安全
3. **限制访问 IP**：可在 Cloudflare WAF 设置规则
4. **定期更新后端**：保持最新安全补丁
