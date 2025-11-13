
// // middleware.js
// import { NextResponse } from "next/server";

// export function middleware(req) {
//   const url = req.nextUrl.clone();
//   const hostname = req.headers.get("host") || "";
//   const cleanHost = hostname.split(":")[0];

//   const rootDomain = "darllix.shop";
//   const isLocalhostRoot = cleanHost === "localhost" || cleanHost === "127.0.0.1";
//   const isLocalhostSub = cleanHost.endsWith(".localhost") || cleanHost.endsWith(".127.0.0.1");

//   // Root domain or local root → dashboard
//   if (cleanHost === rootDomain || cleanHost.endsWith(".vercel.app") || isLocalhostRoot) {
//     if (url.pathname === "/") {
//      return NextResponse.redirect(new URL("/dashboard", req.url));
//     }
//     return NextResponse.next();
//   }

//   // Subdomain handling
//   if (cleanHost.endsWith(`.${rootDomain}`) || isLocalhostSub) {
//     const subdomain = isLocalhostSub
//       ? cleanHost.replace(".localhost", "").replace(".127.0.0.1", "")
//       : cleanHost.replace(`.${rootDomain}`, "");

//     if (subdomain && subdomain.trim() !== "") {
//       console.log(subdomain)
//       if (url.pathname === "/" || url.pathname === "") {
//         url.searchParams.set("store", subdomain);
//         url.pathname = "/storefront";
//         return NextResponse.rewrite(url);
//   }
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/((?!_next|api|static|.*\\..*|favicon.ico).*)",
//   ],
// };


import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") || "";
  const cleanHost = hostname.split(":")[0];

  const rootDomain = "darllix.shop";
  const isLocalhostRoot = cleanHost === "localhost" || cleanHost === "127.0.0.1";
  const isLocalhostSub = cleanHost.endsWith(".localhost") || cleanHost.endsWith(".127.0.0.1");

  // Root domain or Vercel root or localhost root → dashboard for root path
  if (cleanHost === rootDomain || cleanHost.endsWith(".vercel.app") || isLocalhostRoot) {
    if (url.pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Subdomain handling: only rewrite when request is the subdomain root
  if (cleanHost.endsWith(`.${rootDomain}`) || isLocalhostSub) {
    const subdomain = isLocalhostSub
      ? cleanHost.replace(".localhost", "").replace(".127.0.0.1", "")
      : cleanHost.replace(`.${rootDomain}`, "");

    if (subdomain && subdomain.trim() !== "") {
      if (url.pathname === "/" || url.pathname === "") {
        url.searchParams.set("store", subdomain);
        url.pathname = "/storefront";
        return NextResponse.rewrite(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|api|static|.*\\..*|favicon.ico|dashboard|admin).*)',
  ],
};
