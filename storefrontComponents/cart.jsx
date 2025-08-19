// pages/cart.jsx
import { useStore } from '@/store';

export default function CartPage({ store }) {
  const cartItems = useStore((state) => state.cart);
  
  return (
    <div>
      <h1>{store?.name} - Your Cart</h1>
      {cartItems.length === 0 ? <p>No items yet</p> : (
        <ul>
          {cartItems.map((item) => (
            <li key={item.id}>{item.name} - {item.quantity}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  let host = context.req.headers.host || "";
  let subdomain = null;

  // Production domains
  if (
    host.endsWith(".darllix.shop") ||
    host.endsWith(".darllix.vercel.app")
  ) {
    subdomain = host.split(".")[0];
  }

  // Local development
  if (host.endsWith(".localhost:3000")) {
    subdomain = host.split(".")[0];
  }

  // Reject invalid subdomains
  if (!subdomain || subdomain === "www" || subdomain === "darllix") {
    return { notFound: true };
  }

  
  const { createServerSupabaseClient } = await import("../lib/supabaseClient");
  const supabase = createServerSupabaseClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, subdomain, banner_url")
    .eq("subdomain", subdomain)
    .maybeSingle();

  if (!store) {
    return { notFound: true };
  }

  return { props: { store } };
}
