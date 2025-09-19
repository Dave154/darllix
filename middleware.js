// middleware.js
import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host")?.split(":")[0] || "";

  const rootDomain = "darllix.shop";
  const allowedRootHosts = [rootDomain, `www.${rootDomain}`];

  console.log("MIDDLEWARE HIT", {
    hostname,
    pathname: url.pathname,
    search: url.search,
  });

  if (
    allowedRootHosts.includes(hostname) ||
    hostname.endsWith(".vercel.app") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  ) {
    if (url.pathname === "/") {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  console.log('SUBDOMAIN HIT')

  if (hostname.endsWith(`.${rootDomain}`)) {
    const subdomain = hostname.replace(`.${rootDomain}`, "");

    if (subdomain && subdomain.trim() !== "") {
      url.searchParams.set("store", subdomain);
      url.pathname = `/storefront${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api|static|.*\\..*|favicon.ico).*)",
  ],
};
