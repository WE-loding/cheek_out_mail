# Cloudflare Pages 发送邮件配置指南

## 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **代理到 PMail 后端** | 复用现有后端、支持完整邮箱功能 | 需要维护服务器 | 已有 PMail 后端 |
| **第三方邮件 API** | 无需 SMTP 服务器、送达率高 | 有费用、功能受限 | 仅需发信通知 |

## 方案一：代理到 PMail 后端（推荐）

### 环境变量配置

Cloudflare Pages 控制台 → **Settings** → **Environment variables** → **Production**：

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `VITE_APP_API_URL` | `https://mail.yourdomain.com` | PMail 后端地址 |

### 前端调用

前端无需改动，`/api/email/send` 会自动通过 Functions 代理到后端。

---

## 方案二：使用第三方邮件服务

### 1. 选择服务商

推荐 **Resend**（开发者友好，免费额度充足）：
- 免费：每月 3000 封
- 支持自定义域名
- API 简洁

其他选择：
- **SendGrid**: 免费 100 封/天
- **Mailgun**: 免费 5000 封/月（前 3 个月）

### 2. 配置 Resend

#### 注册并验证域名
1. 访问 https://resend.com
2. 添加发信域名（如 `yourdomain.com`）
3. 按提示添加 DNS 记录（TXT/MX）

#### 获取 API Key
- Resend Dashboard → **API Keys** → 创建密钥

### 3. Cloudflare Pages 环境变量

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `EMAIL_PROVIDER` | `resend` | 服务商：resend/sendgrid/mailgun |
| `FROM_EMAIL` | `noreply@yourdomain.com` | 默认发件人 |
| `RESEND_API_KEY` | `re_xxxxx` | Resend API Key |
| `SENDGRID_API_KEY` | `SG.xxxxx` | SendGrid API Key（可选） |
| `MAILGUN_API_KEY` | `key-xxxxx` | Mailgun API Key（可选） |
| `MAILGUN_DOMAIN` | `mg.yourdomain.com` | Mailgun 域名（可选） |

### 4. 前端集成

创建发信组件调用新接口：

```javascript
// 在 Vue 组件中调用
import { http } from '@/utils/axios';

async function sendEmail({ to, subject, text, html, reply_to }) {
  const response = await http.post('/api/send-email', {
    to,
    subject,
    text,
    html,
    reply_to
  });
  return response.data;
}

// 使用示例
sendEmail({
  to: 'user@example.com',
  subject: '测试邮件',
  text: '这是一封测试邮件',
  html: '<p>这是一封<strong>测试邮件</strong></p>',
  reply_to: 'noreply@yourdomain.com'
});
```

### 5. 费用参考

| 服务商 | 免费额度 | 超出价格 |
|--------|---------|---------|
| Resend | 3000 封/月 | $0.50/1000 封 |
| SendGrid | 100 封/天 | $15/月起 |
| Mailgun | 5000 封/月（3 个月） | $0.60/1000 封 |

---

## 方案选择建议

**已有 PMail 后端** → 用方案一（代理模式）
- 复用现有用户系统
- 支持完整收件/发信/规则功能
- 无需额外费用

**仅需发信通知** → 用方案二（第三方 API）
- 无需维护 SMTP 服务器
- 送达率更高（专业服务商）
- 适合验证码、通知邮件场景

---

## 测试

### 测试代理到后端

```bash
# 设置环境变量后访问
curl https://your-project.pages.dev/api/ping
# 应返回 "pong"
```

### 测试 Resend

```bash
curl -X POST https://your-project.pages.dev/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["test@example.com"],
    "subject": "Test Email",
    "text": "Hello from Cloudflare Pages"
  }'
```

---

## 安全建议

1. **添加认证**：在 Functions 中验证 Token
2. **限流**：使用 Cloudflare Rate Limiting
3. **日志**：添加日志监控异常
4. **域名验证**：确保 `FROM_EMAIL` 域名已通过 SPF/DKIM 验证
