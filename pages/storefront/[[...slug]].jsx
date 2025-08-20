// import Global404 from "../../components/global404";
// import StoreFront404 from "../../storefrontComponents/storeFront404";
// import CartPage from "./cart";
// import Storefront from "./store";

// export default function StorefrontDynamic({ store, slug }) {
//   console.log("slug", slug);

//   if (!store) {
//     return <Global404 />; // No store found
//   }

//   // Handle cart route
//   if (slug.length > 0 && slug[0] === "cart") {
//     return <CartPage store={store} />;
//   }

//   // Home page (no slug)
//   if (slug.length === 1) {
//     return <Storefront/>
//   }

//   // Unknown route
//   return <StoreFront404 store={store} />;
// }

// export async function getServerSideProps({ params, req }) {
//   const host = req.headers.host || "";
//   let subdomain = null;

//   if (host.endsWith(".darllix.shop") || host.endsWith(".darllix.vercel.app")) {
//     subdomain = host.split(".")[0];
//   }

//   if (host.endsWith(".localhost:3000")) {
//     subdomain = host.split(".")[0];
//   }

//   if (!subdomain || subdomain === "www" || subdomain === "darllix") {
//     return { notFound: true };
//   }

//   const { createServerSupabaseClient } = await import("../../lib/supabaseClient");
//   const supabase = createServerSupabaseClient();

//   const { data: store } = await supabase
//     .from("stores")
//     .select("id, name, subdomain, banner_url")
//     .eq("subdomain", subdomain)
//     .maybeSingle();

//   return {
//     props: {
//       store,
//       slug: params.slug || [],
//     },
//   };
// }

import Global404 from "../../components/global404";
import StoreFront404 from "../../storefrontComponents/storeFront404";
import CartPage from "../../storefrontComponents/cart";
import Storefront from "../../storefrontComponents/store";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Checkout from "../../storefrontComponents/checkout";
import PaymentPage from "../../storefrontComponents/paymentPage";
import ShippingPage from "../../storefrontComponents/shipping";
import ProductPage from "../../storefrontComponents/productPage";
import PaymentSuccess from "../../storefrontComponents/success";

export default function StorefrontDynamic({ store, slug }) {
 
   const [pathname, setPath] = useState("");
 
  // useEffect(() => {

  //   setPath(window.location.pathname);
  //   console.log("Current Pathname:", window.location.pathname);
  //   console.log("Slug:", slug);
  //   console.log(pathname)
  // }, [pathname]);
  const router = useRouter();
 useEffect(() => {
    // Set immediately on mount
    setPath(window.location.pathname);

    // Listen for route changes
    const handleRouteChange = () => {
      setPath(window.location.pathname);
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  if (!store) return <Global404 />;
    console.log(slug, store)
      if (slug[0]===`storefront` && pathname.startsWith("/payment-success")) {
 return <PaymentSuccess />; 
}
  
  if (slug[0]===`storefront` && pathname === "/") {
    return <Storefront store={store} />; // Home
  }

  if (slug[0]===`storefront` && pathname === "/cart") {
    return <CartPage store={store} />;
  }
    if (slug[0]===`storefront` && pathname === "/checkout") {
    return <Checkout store={store} />;
  }
   if (slug[0]===`storefront` && pathname === "/checkout/payment") {
    return <PaymentPage  />; 
  }
   if (slug[0]===`storefront` && pathname === "/checkout/shipping") {
    return <ShippingPage  />; 
  }

  if (slug[0] === "storefront" && pathname.startsWith("/product/")) {
    const productId = pathname.split("/")[2];
    return <ProductPage store={store} productId={productId} />;
  }



  return <StoreFront404 store={store} />;
}

export async function getServerSideProps({ params, req }) {
  const host = req.headers.host || "";
  let subdomain = null;

  if (host.endsWith(".darllix.shop") || host.endsWith(".darllix.vercel.app")) {
    subdomain = host.split(".")[0];
  } else if (host.endsWith(".localhost:3000")) {
    subdomain = host.split(".")[0];
  }

  if (!subdomain || subdomain === "www" || subdomain === "darllix") {
    return { notFound: true };
  }

  const { createServerSupabaseClient } = await import("../../lib/supabaseClient");
  const supabase = createServerSupabaseClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, subdomain, banner_url")
    .eq("subdomain", subdomain)
    .maybeSingle();

  return {
    props: {
      store,
      slug: params.slug || [],
    },
  };
}
