// Cloudflare Pages Function - Attachments 代理
// 将附件请求转发到后端 PMail 服务器

export const onRequest = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  
  const API_BASE_URL = context.env.VITE_APP_API_URL;
  
  if (!API_BASE_URL) {
    return new Response('Backend API URL not configured', { status: 500 });
  }
  
  // 构建目标 URL（保持 /attachments/ 路径）
  const targetUrl = new URL(url.pathname + url.search, API_BASE_URL);
  
  // 复制请求头
  const headers = new Headers(request.headers);
  headers.delete('host');
  
  // 转发请求
  const response = await fetch(targetUrl.toString(), {
    method: request.method,
    headers: headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
  });
  
  // 构建响应（添加 CORS 头）
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Authorization, Lang, Token');
  
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: responseHeaders
    });
  }
  
  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders
  });
};
