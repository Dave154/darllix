import CartPage from "../../storefrontComponents/cart";
import Storefront from "../../storefrontComponents/store";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Checkout from "../../storefrontComponents/checkout";
import PaymentPage from "../../storefrontComponents/paymentPage";
import ShippingPage from "../../storefrontComponents/shipping";
import ProductPage from "../../storefrontComponents/productPage";
import PaymentSuccess from "../../storefrontComponents/success";
import Global404 from "../../components/errors/global404";
import StoreFront404 from "../../components/errors/storefront404";
import { Toaster } from "@/components/ui/sonner";

export default function StorefrontDynamic({ store, slug }) {

  const [pathname, setPath] = useState("");
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

  // Determine what to render based on store, slug and pathname
  let content = null;

  if (!store && slug[0] === "storefront") {
    content = <Global404 />;
  } else if (slug[0] === "storefront" && pathname.startsWith("/payment-success")) {
    content = <PaymentSuccess />;
  } else if (slug[0] === "storefront" && pathname === "/") {
    content = <Storefront store={store} />;
  } else if (slug[0] === "storefront" && pathname === "/cart") {
    content = <CartPage store={store} />;
  } else if (slug[0] === "storefront" && pathname === "/checkout") {
    content = <Checkout store={store} />;
  } else if (slug[0] === "storefront" && pathname === "/checkout/payment") {
    content = <PaymentPage store={store} />;
  } else if (slug[0] === "storefront" && pathname === "/checkout/shipping") {
    content = <ShippingPage store={store} />;
  } else if (slug[0] === "storefront" && pathname.startsWith("/product/")) {
    const productId = pathname.split("/")[2];
    content = <ProductPage store={store} productId={productId} />;
  } else if(slug[0] === "storefront") {
    content = <StoreFront404 store={store} />;
  }else{
    window.location.reload(true)
  }


    const themeVars = {
    "--color2": store?.theme?.accent || '',
    "--color3": store?.theme?.primary || '' ,
    "--color4": store?.theme?.background || '' ,
  };

  return (
    <main style={themeVars}>
     <Toaster
        position="top-center"
      />

      {content}
    </ main>
  );
}

import { getSupabaseServer } from "../../lib/supabaseClient";
import { toast } from "sonner";

export async function getServerSideProps({ params, req, res }) {
  const slug = params.slug
  console.log(slug,req.headers.host)
  if(!slug){
     return { notFound: true };
  }
  const host = req.headers.host || "";
  let subdomain = null;

  if (host.endsWith(".darllix.shop") || host.endsWith(".darllix.vercel.app")) {
    subdomain = host.split(".")[0];
  } else if (host.endsWith(".localhost:3000")) {
    subdomain = host.split(".")[0];
  }

  if (!subdomain || subdomain === "www" || subdomain === "darllix") {
    return {
    props: {
      store: null,
      slug: params.slug || [],
    },
  };
  }
  

  const supabase = getSupabaseServer({ req, res });

  const { data: store, error } = await supabase
    .from("stores")
    .select("id, name, subdomain ,description ,banner_url ,theme ,is_published")
    .eq("subdomain", subdomain)
    .maybeSingle();

  if (error) {
        toast.error("Something went wrong. Try again")

    console.error("Supabase error fetching store:", error);
    return { notFound: true };
  }

  return {
    props: {
      store,
      slug: params.slug || [],
    },
  };
}
