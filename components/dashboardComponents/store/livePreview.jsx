// components/store/LivePreview.jsx
"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LivePreview({ store }) {
  const theme = store.theme || { primary: "#0f172a", accent: "#2563eb", background: "#ffffff" };
  const bannerUrl = store.banner_url || "/test_store_banner.png";

  return (
    <div className="rounded-md overflow-hidden border" style={{ background: theme.background }}>
      {/* Header */}
      <div style={{ background: theme.primary }} className="p-4 text-white flex items-center justify-between">
        <div className="text-lg font-bold">{store.name || "Your Store Name"}</div>
        <div className="text-sm opacity-80">{store.subdomain ? `${store.subdomain}.darllix.shop` : "your-subdomain.darllix.shop"}</div>
      </div>

      {/* Banner */}
      <motion.div initial={{ opacity: 0.8 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <img src={bannerUrl} alt="banner" className="w-full h-44 object-cover" />
      </motion.div>

      {/* Hero overlay */}
      <div className="p-4">
        <h2 className="text-2xl font-bold" style={{ color: theme.accent }}>{store.name || "Store Name"}</h2>
        <p className="text-sm text-gray-600 mt-1">{store.description || "Short store description..."}</p>
      </div>

      {/* Example product strip */}
      <div className="p-4 border-t">
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map((i)=>(
            <div key={i} className="bg-white rounded p-2 shadow-sm">
              <div className="h-28 bg-gray-100 mb-2 rounded" />
              <div className="text-xs font-semibold">Product {i}</div>
              <div className="text-sm text-gray-500">₦{(i*1000).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
