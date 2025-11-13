// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     remotePatterns: [
//       { protocol: "https", hostname: "darllix.shop" },
//       { protocol: "https", hostname: "*.darllix.shop" },
//        {
//         protocol: "https",
//         hostname: "images.unsplash.com",
//       },
//     ],
//   },
//   async rewrites() {
//     return [
//       // Root domain
//       {
//         source: "/",
//         destination: "/storefront",
//       },
//       {
//         source: "/:slug*",
//         destination: "/storefront/:slug*",
//       },

//         {
//       source: "/product/:id",
//       destination: "/storefront/product/[id]",
//     },
//       // Subdomains
//       {
//         source: "/",
//         has: [
//           { type: "host", value: ":subdomain.darllix.shop" },
//         ],
//         destination: "/storefront",
//       },
//       {
//         source: "/:slug*",
//         has: [
//           { type: "host", value: ":subdomain.darllix.shop" },
//         ],
//         destination: "/storefront/:slug*?store=:subdomain",
//       },
//     ];
//   },
// };

// module.exports = nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "darllix.shop" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async rewrites() {
    return [
      // === Subdomain storefronts only ===
      // Example: store.darllix.shop/   -> /storefront?store=store
      {
        source: "/",
        has: [{ type: "host", value: ":subdomain.darllix.shop" }],
        destination: "/storefront?store=:subdomain",
      },

      // Example: store.darllix.shop/product/123  -> /storefront/product/123?store=store
      {
        source: "/:path*",
        has: [{ type: "host", value: ":subdomain.darllix.shop" }],
        destination: "/storefront/:path*?store=:subdomain",
      },

      // === Optional explicit product route mapping for non-subdomain requests to storefront ===
      // If you keep product pages on the storefront under the root domain as well,
      // map them explicitly (avoid a global :slug* rule).
      {
        source: "/product/:id",
        destination: "/storefront/product/:id",
      },

      // Add any other explicit mappings you actually need here.
      // Do NOT use a global `"/:slug*"` -> `"/storefront/:slug*"` rewrite
      // unless you intend every path to hit the storefront.
    ]
  },
}

module.exports = nextConfig;
