// middleware.js
import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host")?.split(":")[0] || "";

  const rootDomain = "darllix.shop";
  const allowedRootHosts = [rootDomain, `www.${rootDomain}`];

  // Log for debugging in prod
  console.log("MIDDLEWARE HIT", {
    hostname,
    pathname: url.pathname,
    search: url.search,
  });

  // 1. Root domain + preview deployments + localhost → normal app
  if (
    allowedRootHosts.includes(hostname) ||
    hostname.endsWith(".vercel.app") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  ) {
    // Redirect root path → /dashboard
    if (url.pathname === "/") {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 2. Real subdomains → storefront
  if (hostname.endsWith(`.${rootDomain}`)) {
    const subdomain = hostname.replace(`.${rootDomain}`, "");

    if (subdomain && subdomain.trim() !== "") {
      url.searchParams.set("store", subdomain);
      url.pathname = `/storefront${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // 3. Fallback → let Next.js handle it
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    "/((?!_next|api|static|.*\\..*|favicon.ico).*)",
  ],
};
