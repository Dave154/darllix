// components/SilverBigWave.jsx
import Head from "next/head";
import React from "react";

export default function Backround({ store, children }) {
  console.log(store)
  return (
    <>
    <Head>
        <title>{store?.name ? `${store.name} | Darllix Store` : "Darllix Store"}</title>
        <meta
          name="description"
          content={store?.description || "Browse our premium products"}
        />
        <link rel="icon" href="/favicon.ico" /> 
        
      </Head>
    <div className="" style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "" }}>
      {/* Base silver gradient */}
      <div className="absolute inset-0 store_bg"
      />

      {/* Moving wave */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(
              150% 80% at 0% 50%, 
              rgba(255,255,255,0.7) 0%, 
              rgba(255,255,255,0) 60%
            )
          `,
          mixBlendMode: "screen",
          transform: "rotate(135deg) scale(2)",
          animation: "bigWave 12s ease-in-out infinite"
        }}
      />

      {/* Shine pass */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `
            linear-gradient(
              120deg, 
              transparent 40%, 
              rgba(255,255,255,0.8) 50%, 
              transparent 60%
            )
          `,
          backgroundSize: "200% 200%",
          mixBlendMode: "screen",
          animation: "shinePass 20s linear infinite"
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, }}>
        {children}
      </div>

      <style jsx>{`
        @keyframes bigWave {
          0% { transform: rotate(135deg) scale(2) translateX(-15%); }
          50% { transform: rotate(135deg) scale(2) translateX(15%); }
          100% { transform: rotate(135deg) scale(2) translateX(-15%); }
        }
        @keyframes shinePass {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
    </>
  );
}
