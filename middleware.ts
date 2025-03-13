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

  return new Response("Basic認証が必要です", {
    status: 401,
    headers: {
      "WWW-Authenticate": "Basic",
      "Content-Type": "text/plain"
    },
  });
} 