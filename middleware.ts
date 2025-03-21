import { next } from "@vercel/edge";

export const config = {
  matcher: "/(.*)",  // すべてのルートに適用
};

export default function middleware(request: Request) {
  const authorizationHeader = request.headers.get("authorization");

  if (authorizationHeader) {
    const basicAuth = authorizationHeader.split(" ")[1];
    const [user, password] = atob(basicAuth).toString().split(":");

    if (user === process.env.BASIC_AUTH_USER && password === process.env.BASIC_AUTH_PASSWORD) {
      return next();
    }
  }

  // 認証失敗時はHTML形式で返す
  return new Response(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>認証が必要です</title>
  <style>
    body { font-family: sans-serif; text-align: center; padding: 50px; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>Basic認証が必要です</h1>
  <p>このページにアクセスするには認証が必要です。</p>
</body>
</html>`, {
    status: 401,
    headers: {
      "WWW-Authenticate": "Basic",
      "Content-Type": "text/html; charset=utf-8"
    },
  });
} 