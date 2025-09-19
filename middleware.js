import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") || "";
  const cleanHost = hostname.split(":")[0];

  const rootDomain = "darllix.shop";
  const isLocalhostRoot = cleanHost === "localhost" || cleanHost === "127.0.0.1";
  const isLocalhostSub = cleanHost.endsWith(".localhost") || cleanHost.endsWith(".127.0.0.1");

  console.log("MIDDLEWARE HIT", {
    hostname: cleanHost,
    pathname: url.pathname,
    search: url.search,
  });

  // Root domain or Vercel preview → dashboard
  if (cleanHost === rootDomain || cleanHost.endsWith(".vercel.app") || isLocalhostRoot) {
    console.log("→ ROOT / PREVIEW BRANCH");
    if (url.pathname === "/") {
      url.pathname = "/dashboard";
      console.log("Redirecting root → /dashboard");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Subdomain handling — only if it's NOT the root domain
  console.log(cleanHost)
if (
  (cleanHost.endsWith(`.${rootDomain}`) &&
    cleanHost !== rootDomain &&
    !cleanHost.startsWith("www.")) ||
  isLocalhostSub
) {
  const subdomain = isLocalhostSub
    ? cleanHost.replace(".localhost", "").replace(".127.0.0.1", "")
    : cleanHost.replace(`.${rootDomain}`, "");

  if (subdomain && subdomain.trim() !== "") {
    url.searchParams.set("store", subdomain);
    url.pathname = `/storefront${url.pathname}`;
    return NextResponse.rewrite(url);
  }
}

  console.log("→ FALLBACK NEXT()");
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api|static|.*\\..*|favicon.ico).*)",
  ],
};
