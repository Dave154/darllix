// pages/dashboard/store/edit.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button"; // shadcn button or fallback
import LivePreview from "../../../components/dashboardComponents/store/livePreview";
import BannerUploader from "../../../components/dashboardComponents/store/bannerUploader";
import ColorInput from "../../../components/dashboardComponents/store/colorInput";
import DashboardLayout from "../../../components/dashboardComponents/dashboardLayout";

// Supabase client (client-side)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  subdomain: z
    .string()
    .min(3, "Subdomain too short")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  description: z.string().max(1000).optional(),
  banner_url: z.string().url().optional(),
  theme: z.object({
    primary: z.string().optional(),
    accent: z.string().optional(),
    background: z.string().optional(),
  }).optional(),
});

export default function StoreEditor({ initialData = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);
  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      name: "",
      subdomain: "",
      description: "",
      banner_url: "",
      theme: { primary: "#0f172a", accent: "#2563eb", background: "#ffffff" },
    },
  });

  const watchAll = watch();

  // Subdomain availability check (debounced)
  useEffect(() => {
    const s = watch("subdomain");
    if (!s || s.length < 3) {
      setSubdomainAvailable(null);
      return;
    }
    const id = setTimeout(async () => {
      // simple check via supabase
      setSubdomainAvailable("checking");
      const { data, error } = await supabase.from("stores").select("id").eq("subdomain", s).maybeSingle();
      setSubdomainAvailable(data ? false : true);
    }, 500);
    return () => clearTimeout(id);
  }, [watchAll.subdomain]);

  async function saveDraft(values) {
    setLoading(true);
    try {
      // upsert: if store exists (owner has store) update, else insert
      // assume auth handled; you'll need server-side endpoint for secure owner_id writes.
      const resp = await fetch("/api/stores/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store: values, publish: false }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.message || "Save failed");
      // show success & maybe navigate
      alert("Draft saved");
    } catch (err) {
      console.error(err);
      alert("Failed to save: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function launchStore(values) {
    if (!subdomainAvailable) {
      alert("Please choose an available subdomain before launching.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch("/api/stores/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store: values, publish: true }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.message || "Publish failed");

      const url = `${values.subdomain}.darllix.shop`;
      alert("Store launched! URL: " + url);
      // optionally route to dashboard storefront
      router.push("/dashboard"); // or show preview link
    } catch (err) {
      console.error(err);
      alert("Failed to launch: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = (values) => {
    // default Save Draft
    saveDraft(values);
  };

  return (
    <DashboardLayout> 

    <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor form */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <h2 className="text-2xl font-bold">Edit Your Store</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Store Name</label>
            <input {...register("name")} className="mt-1 w-full border rounded p-2" />
            {errors.name && <p className="text-red-600 text-xs">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Subdomain</label>
            <div className="flex items-center gap-2 mt-1">
              <input {...register("subdomain")} className="flex-1 border rounded p-2" />
              <span className="text-sm text-gray-500">.darllix.shop</span>
            </div>
            <div className="mt-1 text-xs">
              {subdomainAvailable === null && <span className="text-gray-500">Choose a subdomain</span>}
              {subdomainAvailable === "checking" && <span className="text-yellow-600">Checking…</span>}
              {subdomainAvailable === true && <span className="text-green-600">Available ✓</span>}
              {subdomainAvailable === false && <span className="text-red-600">Taken ✕</span>}
            </div>
            {errors.subdomain && <p className="text-red-600 text-xs">{errors.subdomain.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea {...register("description")} rows={4} className="mt-1 w-full border rounded p-2" />
            {errors.description && <p className="text-red-600 text-xs">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Banner</label>
            <BannerUploader
              currentUrl={watchAll.banner_url}
              onUploaded={(url) => setValue("banner_url", url, { shouldDirty: true })}
            />
            {watchAll.banner_url && <p className="text-xs text-gray-500 mt-2">Previewed in right column</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Theme Colors</label>
            <div className="flex gap-3 mt-2">
              <ColorInput label="Primary" value={watchAll.theme?.primary} onChange={(v) => setValue("theme.primary", v)} />
              <ColorInput label="Accent" value={watchAll.theme?.accent} onChange={(v) => setValue("theme.accent", v)} />
              <ColorInput label="Bg" value={watchAll.theme?.background} onChange={(v) => setValue("theme.background", v)} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" onClick={() => saveDraft(watchAll)} disabled={loading}>Save draft</Button>
            <Button type="button" onClick={() => { /* open preview modal, client only */ window.open("/api/preview?payload=" + encodeURIComponent(JSON.stringify(watchAll)), "_blank") }} variant="outline">Preview</Button>
            <Button type="button" onClick={() => launchStore(watchAll)} className="bg-green-600 text-white" disabled={loading}>Launch store</Button>
          </div>
        </form>
      </motion.div>

      {/* Live preview */}
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
        <LivePreview store={watchAll} />
      </motion.div>
    </div>
    </DashboardLayout>
  );
}
