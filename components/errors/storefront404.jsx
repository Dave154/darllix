"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Store, Home } from "lucide-react";

export default function StoreFront404({ store }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(1200px_700px_at_80%_-10%,#6fd8ac_0%,transparent_60%),radial-gradient(1200px_700px_at_20%_110%,#4a21ef_0%,#0d0b33_60%)]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 12 }}
        className="mx-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl p-10 text-center"
      >
        <Store className="h-16 w-16 text-primary mx-auto mb-6 animate-pulse" />
        <h1 className="text-3xl font-bold mb-3 text-slate-900">
          Page Not Found in{" "}
          <span className="text-primary">{store?.name || "this store"}</span>
        </h1>
        <p className="text-slate-600 mb-6">
          The page you’re trying to visit doesn’t exist in this store.
        </p>
        <Button asChild className="h-11 px-6 text-base">
          <Link href="/">
            <Home className="mr-2 h-5 w-5" /> Back to Store Home
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
