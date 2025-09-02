// components/store/BannerUploader.jsx
"use client";
import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function BannerUploader({ currentUrl, onUploaded }) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(currentUrl || null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    // create unique path
    const filePath = `banners/${Date.now()}-${file.name}`;
    const { data, error: upErr } = await supabase.storage.from("banners").upload(filePath, file, { cacheControl: "3600", upsert: false });
    if (upErr) {
      console.error(upErr);
      alert("Upload failed");
      setBusy(false);
      return;
    }
    // get public URL
    const { publicURL, error: urlErr } = supabase.storage.from("banners").getPublicUrl(data.path);
    if (urlErr) {
      console.error(urlErr);
      alert("Failed to get URL");
      setBusy(false);
      return;
    }
    setPreview(publicURL);
    onUploaded(publicURL);
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <input type="file" accept="image/*" onChange={handleFile} />
      {busy && <div className="text-xs text-gray-500">Uploading…</div>}
      {preview && <img src={preview} alt="banner preview" className="w-full h-40 object-cover rounded-md" />}
    </div>
  );
}
