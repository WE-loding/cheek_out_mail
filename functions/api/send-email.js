// Cloudflare Pages Function - 发送邮件（使用第三方邮件服务）
// 支持：Resend / SendGrid / Mailgun
// 需要在 Pages 控制台设置对应的 API Key 环境变量

export const onRequest = async (context) => {
  const { request } = context;
  
  // 只处理 POST 请求
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  // 从环境变量读取配置
  const EMAIL_PROVIDER = context.env.EMAIL_PROVIDER || 'resend'; // resend, sendgrid, mailgun
  const FROM_EMAIL = context.env.FROM_EMAIL; // 发件人邮箱
  
  // 解析请求体
  const body = await request.json();
  const { to, subject, text, html, reply_to } = body;
  
  if (!to || !subject) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: to, subject' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    let response;
    
    if (EMAIL_PROVIDER === 'resend') {
      // 使用 Resend (https://resend.com)
      const RESEND_API_KEY = context.env.RESEND_API_KEY;
      if (!RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY not configured');
      }
      
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: FROM_EMAIL || 'noreply@yourdomain.com',
          to: Array.isArray(to) ? to : [to],
          reply_to: reply_to,
          subject: subject,
          text: text,
          html: html
        })
      });
      
    } else if (EMAIL_PROVIDER === 'sendgrid') {
      // 使用 SendGrid (https://sendgrid.com)
      const SENDGRID_API_KEY = context.env.SENDGRID_API_KEY;
      if (!SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY not configured');
      }
      
      response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
            reply_to: reply_to ? { email: reply_to } : undefined
          }],
          from: { email: FROM_EMAIL || 'noreply@yourdomain.com' },
          subject: subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html }
          ].filter(c => c.value)
        })
      });
      
    } else if (EMAIL_PROVIDER === 'mailgun') {
      // 使用 Mailgun (https://mailgun.com)
      const MAILGUN_API_KEY = context.env.MAILGUN_API_KEY;
      const MAILGUN_DOMAIN = context.env.MAILGUN_DOMAIN;
      if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
        throw new Error('MAILGUN_API_KEY or MAILGUN_DOMAIN not configured');
      }
      
      const formData = new FormData();
      formData.append('from', FROM_EMAIL || `noreply@${MAILGUN_DOMAIN}`);
      formData.append('to', Array.isArray(to) ? to.join(',') : to);
      if (reply_to) formData.append('h:Reply-To', reply_to);
      formData.append('subject', subject);
      if (text) formData.append('text', text);
      if (html) formData.append('html', html);
      
      response = await fetch(
        `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`
          },
          body: formData
        }
      );
      
    } else {
      throw new Error(`Unknown email provider: ${EMAIL_PROVIDER}`);
    }
    
    // 处理响应
    const result = await response.json();
    
    if (!response.ok) {
      return new Response(JSON.stringify(result), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      id: result.id || result.message,
      provider: EMAIL_PROVIDER
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
