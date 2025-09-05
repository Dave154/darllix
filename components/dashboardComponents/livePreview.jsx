import React from "react";

import { useForm, useWatch } from "react-hook-form";
const BASE_DEFAULTS = {
  name: "",
  subdomain: "",
  description: "",
  banner_url: "",
  theme: { primary: "#0f172a", accent: "#2563eb", background: "#ffffff" },
};
function LivePreview({ store }) {
  const theme = store?.theme || BASE_DEFAULTS.theme;
  const products = store?.products || [];

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-md border" style={{ backgroundColor: theme.background }}>
      <div className="h-36 w-full bg-gradient-to-r from-gray-100 to-white overflow-hidden">
        {store?.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.banner_url} alt="banner" className="object-cover w-full h-full" />
        ) : (
          <div className="h-36 w-full flex items-center justify-center text-gray-400">Banner preview</div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
          <div>
            <h3 className="text-xl font-bold" style={{ color: theme.primary }}>{store?.name || "Your store"}</h3>
            <p className="text-sm text-gray-500">{store?.description || "Short store description"}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">URL</div>
            <div className="text-sm font-mono">{(store?.subdomain && `${store.subdomain}.darllix.shop`) || "your-subdomain.darllix.shop"}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <div className="text-xs text-gray-500">Orders</div>
            <div className="font-semibold">—</div>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <div className="text-xs text-gray-500">Revenue</div>
            <div className="font-semibold">—</div>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-sm text-gray-600 mb-2">Featured products</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.length === 0 && (
              <div className="p-4 text-sm text-gray-400 bg-white/60 rounded-lg">No products yet — add one to showcase here.</div>
            )}
            {products.slice(0, 4).map((p) => (
              <div key={p.id} className="p-3 bg-white rounded-lg shadow-sm flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-500">🖼</div>
                <div className="flex-1">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-500">₦{p.price}</div>
                </div>
                <button className="text-gray-400"><ShoppingBag className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
const MemoLivePreview = React.memo(LivePreview);




export default function PreviewPanel({ control, products }) {
  const name = useWatch({ control, name: "name" });
  const subdomain = useWatch({ control, name: "subdomain" });
  const description = useWatch({ control, name: "description" });
  const banner_url = useWatch({ control, name: "banner_url" });
  const theme = useWatch({ control, name: "theme" });

  const store = React.useMemo(() => ({ name, subdomain, description, banner_url, theme, products }), [name, subdomain, description, banner_url, theme, products]);

  return <MemoLivePreview store={store} />;
}