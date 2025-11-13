/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "darllix.shop" },
      { protocol: "https", hostname: "*.darllix.shop" },
       {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/storefront",
      },
      // {
      //   source: "/:slug",
      //   destination: "/storefront/:slug*",
      // },
      // {
      //   source: "/checkout",
      //   destination: "/storefront/checkout/",
      // },
      //  {
      //   source: "/checkout/payment",
      //   destination: "/storefront/checkout/payment",
      // },
      // {
      //   source: "/checkout/shipping",
      //   destination: "/storefront/checkout/shipping",
      // },
      // {
      //   source: "/cart",
      //   destination: "/storefront/cart/",
      // },
      // {
      //   source: "/payment-success",
      //   destination: "/storefront/payment-success/",
      // },
      //  {
      // source: "/product",
      // destination: "/storefront/product/",
    // },
    {
      source: "/:slug*",
      has: [
        { type: "host", value: "(?<subdomain>.*).darllix.shop" },
      ],
      destination: "/storefront/:slug*?store=:subdomain",
    },
    {
      source: "/",
      has: [
        { type: "host", value: "(?<subdomain>.*).darllix.shop" },
      ],
      destination: "/storefront?store=:subdomain",
    },
      {
      source: "/product/:id",
      destination: "/storefront/product/[id]",
    },
      // Subdomains
      {
        source: "/",
        has: [
          { type: "host", value: ":subdomain.darllix.shop" },
        ],
        destination: "/storefront",
      },
      {
        source: "/:slug*",
        has: [
          { type: "host", value: ":subdomain.darllix.shop" },
        ],
        destination: "/storefront/:slug*?store=:subdomain",
      },
    ];
  },
};

module.exports = nextConfig;
