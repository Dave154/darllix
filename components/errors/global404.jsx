"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function Global404() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(1200px_700px_at_80%_-10%,#6fd8ac_0%,transparent_60%),radial-gradient(1200px_700px_at_20%_110%,#4a21ef_0%,#fff_60%)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl p-10 text-center"
      >
        <h1 className="text-7xl font-extrabold text-slate-900 mb-4">404</h1>
        <p className="text-slate-600 text-lg mb-6">
          This page could not be found.
        </p>
        <Button asChild className="h-11 px-6 text-base">
          <Link href="https://darllix.shop">
            <Home className="mr-2 h-5 w-5" /> Back to Homepage
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
