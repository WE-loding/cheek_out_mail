// Cloudflare Pages Function - API 代理
// 将请求转发到后端 PMail 服务器
// 部署后访问：https://your-project.pages.dev/api/*

export const onRequest = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  
  // 从环境变量获取后端 API 地址
  // 在 Cloudflare Pages 控制台设置：Settings > Environment variables > Production
  const API_BASE_URL = context.env.VITE_APP_API_URL;
  
  if (!API_BASE_URL) {
    return new Response(
      JSON.stringify({
        error: 'Backend API URL not configured',
        message: 'Please set VITE_APP_API_URL environment variable in Cloudflare Pages settings'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // 构建目标 URL
  const targetUrl = new URL(url.pathname + url.search, API_BASE_URL);
  
  // 复制请求头（排除 hop-by-hop 头）
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  
  // 转发请求到后端
  const response = await fetch(targetUrl.toString(), {
    method: request.method,
    headers: headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
  });
  
  // 构建响应（添加 CORS 头）
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Lang, Token');
  
  // 处理 OPTIONS 预检请求
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
