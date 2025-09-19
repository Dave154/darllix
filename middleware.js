import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") || "";
  const cleanHost = hostname.split(":")[0];

  const rootDomain = "darllix.shop";
  const allowedRootHosts = [rootDomain, `www.${rootDomain}`];

  console.log("MIDDLEWARE HIT", { cleanHost, pathname: url.pathname });

  // Root domain or preview
  if (allowedRootHosts.includes(cleanHost) || cleanHost.endsWith(".vercel.app") || cleanHost === "localhost" || cleanHost === "127.0.0.1") {
    if (url.pathname === "/") {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // // Real subdomains only
  // if (cleanHost.endsWith(`.${rootDomain}`) && !allowedRootHosts.includes(cleanHost)) {
  //   const subdomain = cleanHost.replace(`.${rootDomain}`, "");
  //   if (subdomain) {
  //     url.searchParams.set("store", subdomain);
  //     url.pathname = `/storefront${url.pathname}`;
  //     return NextResponse.rewrite(url);
  //   }
  // }

  // return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|.*\\..*|favicon.ico).*)"],
};
