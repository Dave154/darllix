"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ShoppingBag,
  Package,
  Loader2,
  Plus,
  Trash2,
  Edit3,
  Tag,
} from "lucide-react";
import DashboardLayout from "../../../components/dashboardComponents/dashboardLayout";

/**
 * StoreCreator — Responsive premium multi-step store editor (single-file)
 * Focus: make it fully responsive across small -> large screens.
 * Keep as single file for quick iteration; split later.
 */

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  subdomain: z
    .string()
    .min(3, "Subdomain too short")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  description: z.string().max(1000).optional().nullable(),
  banner_url: z.string().url().optional().nullable(),
  theme: z.object({
    primary: z.string().optional(),
    accent: z.string().optional(),
    background: z.string().optional(),
  }).optional(),
});

function CTA({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={
        "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-md bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:from-sky-700 hover:to-indigo-700 disabled:opacity-60 " +
        className
      }
    >
      {children}
    </button>
  );
}

function Ghost({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={
        "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 " +
        className
      }
    >
      {children}
    </button>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div className="p-3 bg-white rounded-xl shadow-sm flex items-center gap-3">
      <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center text-sky-600 shadow-sm">{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}

function PublishLoader({ show }) {
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 backdrop-blur-md bg-gradient-to-br from-sky-300/8 via-indigo-200/6 to-transparent" />

      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        className="relative flex flex-col items-center gap-4 px-4"
      >
        <motion.div
          animate={{ scale: [1, 1.06, 1], boxShadow: ["0 10px 30px rgba(14,165,233,0.12)", "0 20px 40px rgba(99,102,241,0.16)", "0 10px 30px rgba(14,165,233,0.12)"] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-2xl"
        >
          <div className="text-2xl font-extrabold text-sky-600">DLX</div>
        </motion.div>

        <div className="text-sm text-white/90 text-center">Publishing your store — hold tight</div>
      </motion.div>
    </motion.div>
  );
}

function BannerUploader({ currentUrl, onUploaded }) {
  const [preview, setPreview] = useState(currentUrl || "");
  useEffect(() => setPreview(currentUrl || ""), [currentUrl]);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPreview(url);
    onUploaded?.(url);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Store banner</label>
      <div className="w-full h-44 bg-gradient-to-br from-gray-50 to-white border border-dashed border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="banner" className="object-cover w-full h-full" />
        ) : (
          <div className="text-sm text-gray-400 px-4 text-center">Drag & drop or choose an image (1200×300 recommended)</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input id="banner-file" type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <label htmlFor="banner-file" className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-white border border-gray-200 cursor-pointer">Upload</label>
        <button type="button" onClick={() => { setPreview(""); onUploaded?.(""); }} className="text-sm text-red-500">Remove</button>
      </div>
    </div>
  );
}

function ColorInput({ label, value = "#ffffff", onChange }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-2">{label}</label>
      <div className="flex items-center gap-3">
        <input type="color" value={value} onChange={(e) => onChange?.(e.target.value)} className="w-12 h-10 p-0 border rounded-md" />
        <input value={value} onChange={(e) => onChange?.(e.target.value)} className="border p-2 rounded-md w-full" />
      </div>
    </div>
  );
}

function ProductModal({ open, onClose, onSave, initial }) {
  const [name, setName] = useState(initial?.name || "");
  const [price, setPrice] = useState(initial?.price || "");

  useEffect(() => {
    setName(initial?.name || "");
    setPrice(initial?.price || "");
  }, [initial]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative z-50 bg-white rounded-2xl p-6 shadow-lg w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{initial ? 'Edit product' : 'Add product'}</h3>
          <button onClick={onClose} className="text-gray-500">Esc</button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" className="w-full border rounded p-3" />
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (e.g. 29.99)" className="w-full border rounded p-3" />
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
          <Ghost onClick={onClose}>Cancel</Ghost>
          <CTA onClick={() => onSave({ name, price })}><Plus className="w-4 h-4"/> Save product</CTA>
        </div>
      </motion.div>
    </div>
  );
}

function LivePreview({ store }) {
  const theme = store?.theme || { primary: "#0f172a", accent: "#2563eb", background: "#ffffff" };
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
                <button className="text-gray-400"><ShoppingBag className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoreCreator({ initialData = null, onDone }) {
  const [step, setStep] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);
  const [products, setProducts] = useState(initialData?.products || []);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showPreview, setShowPreview] = useState(true); // toggle preview on small screens

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
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

  useEffect(() => {
    const s = watchAll.subdomain;
    if (!s || s.length < 3) {
      setSubdomainAvailable(null);
      return;
    }
    setSubdomainAvailable("checking");
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stores/check?subdomain=${encodeURIComponent(s)}`);
        const json = await res.json();
        setSubdomainAvailable(json.available === true);
      } catch (err) {
        console.error(err);
        setSubdomainAvailable(null);
      }
    }, 600);
    return () => clearTimeout(id);
  }, [watchAll.subdomain]);

  function handleAddProduct(p) {
    setProducts((prev) => [{ id: Date.now(), ...p }, ...prev]);
    setProductModalOpen(false);
  }

  function handleEditProduct(id, payload) {
    setProducts((prev) => prev.map((x) => (x.id === id ? { ...x, ...payload } : x)));
    setProductModalOpen(false);
    setEditingProduct(null);
  }

  function handleRemoveProduct(id) {
    setProducts((prev) => prev.filter((x) => x.id !== id));
  }

  function next() { setStep((s) => Math.min(3, s + 1)); }
  function prev() { setStep((s) => Math.max(0, s - 1)); }

  async function saveDraft() {
    const payload = { ...watchAll, products };
    try {
      const res = await fetch(`/api/stores/save`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store: payload, publish: false }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Save failed");
      console.log("Draft saved");
    } catch (err) {
      console.error(err);
      alert("Failed to save draft: " + err.message);
    }
  }

  async function publish() {
    const payload = { ...watchAll, products };
    if (subdomainAvailable !== true) {
      alert("Please choose an available subdomain before publishing.");
      setStep(0);
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch(`/api/stores/save`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store: payload, publish: true }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Publish failed");

      const url = `${payload.subdomain}.darllix.shop`;
      alert("Store published: " + url);
      onDone && onDone(json);
    } catch (err) {
      console.error(err);
      alert("Publish failed: " + err.message);
    } finally {
      setPublishing(false);
    }
  }

  function StepContent() {
    switch (step) {
      case 0:
        return (
          <form onSubmit={handleSubmit(() => next())} className="space-y-5">
            <div>
              <label className="block text-sm font-medium">Store Name</label>
              <input {...register("name")} className="mt-2 w-full border rounded-lg p-3" />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Subdomain</label>
              <div className="flex items-center gap-2 mt-2">
                <input {...register("subdomain")} className="flex-1 border rounded-lg p-3" />
                <span className="text-sm text-gray-500">.darllix.shop</span>
              </div>
              <div className="mt-2 text-xs">
                {subdomainAvailable === null && <span className="text-gray-500">Choose a subdomain</span>}
                {subdomainAvailable === "checking" && <span className="text-yellow-600">Checking…</span>}
                {subdomainAvailable === true && <span className="text-green-600">Available ✓</span>}
                {subdomainAvailable === false && <span className="text-red-600">Taken ✕</span>}
              </div>
              {errors.subdomain && <p className="text-red-600 text-xs mt-1">{errors.subdomain.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Short description</label>
              <textarea {...register("description")} rows={4} className="mt-2 w-full border rounded-lg p-3" />
              {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Ghost onClick={saveDraft} className="w-full sm:w-auto">Save draft</Ghost>
              <div className="flex w-full sm:w-auto gap-2">
                <Ghost onClick={() => window.open(`/api/preview?payload=${encodeURIComponent(JSON.stringify({ ...watchAll, products }))}`, "_blank")}>Preview</Ghost>
                <CTA type="submit" className="flex-1 sm:flex-none">Continue</CTA>
              </div>
            </div>
          </form>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Products</h3>
              <div className="flex gap-2">
                <Ghost onClick={() => setProductModalOpen(true)}><Plus className="w-4 h-4"/> Add product</Ghost>
                <Ghost onClick={() => window.open('/products', '_blank')}>Manage products</Ghost>
              </div>
            </div>

            <div className="space-y-3">
              {products.length === 0 && <div className="p-4 text-sm text-gray-500 bg-gray-50 rounded-lg">No products yet. Create a product to start selling.</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map((p) => (
                  <div key={p.id} className="p-3 bg-white rounded-lg shadow-sm flex items-center justify-between">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500">₦{p.price}</div>
                    </div>
                    <div className="flex gap-2">
                      <Ghost onClick={() => { setEditingProduct(p); setProductModalOpen(true); }}><Edit3 className="w-4 h-4"/></Ghost>
                      <Ghost onClick={() => handleRemoveProduct(p.id)}><Trash2 className="w-4 h-4 text-red-500"/></Ghost>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between mt-4 gap-3">
                <Ghost onClick={prev} className="w-full sm:w-auto">Back</Ghost>
                <div className="flex w-full sm:w-auto gap-2">
                  <Ghost onClick={saveDraft} className="w-full sm:w-auto">Save draft</Ghost>
                  <CTA onClick={next} className="flex-1 sm:flex-none">Continue</CTA>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Customization</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <BannerUploader currentUrl={watchAll.banner_url} onUploaded={(url) => setValue('banner_url', url)} />
              </div>

              <div className="space-y-4">
                <ColorInput label="Primary color" value={watchAll.theme?.primary || '#0f172a'} onChange={(v) => setValue('theme.primary', v)} />
                <ColorInput label="Accent color" value={watchAll.theme?.accent || '#2563eb'} onChange={(v) => setValue('theme.accent', v)} />
                <ColorInput label="Background color" value={watchAll.theme?.background || '#ffffff'} onChange={(v) => setValue('theme.background', v)} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between mt-4 gap-3">
              <Ghost onClick={prev} className="w-full sm:w-auto">Back</Ghost>
              <div className="flex w-full sm:w-auto gap-2">
                <Ghost onClick={saveDraft} className="w-full sm:w-auto">Save draft</Ghost>
                <CTA onClick={next} className="flex-1 sm:flex-none">Continue</CTA>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Review & Launch</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500">Store details</div>
                <div className="mt-3 space-y-2">
                  <div className="p-3 border rounded">Name: <strong>{watchAll.name}</strong></div>
                  <div className="p-3 border rounded">Subdomain: <strong>{watchAll.subdomain}.darllix.shop</strong></div>
                  <div className="p-3 border rounded">Products: <strong>{products.length}</strong></div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500">Theme</div>
                <div className="mt-3 space-y-2">
                  <div className="p-3 border rounded">Primary: <span className="ml-2 font-mono">{watchAll.theme?.primary}</span></div>
                  <div className="p-3 border rounded">Accent: <span className="ml-2 font-mono">{watchAll.theme?.accent}</span></div>
                  <div className="p-3 border rounded">Background: <span className="ml-2 font-mono">{watchAll.theme?.background}</span></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between mt-4 gap-3">
              <Ghost onClick={prev} className="w-full sm:w-auto">Back</Ghost>
              <div className="flex w-full sm:w-auto gap-2">
                <Ghost onClick={saveDraft} className="w-full sm:w-auto">Save draft</Ghost>
                <CTA onClick={publish} className="flex-1 sm:flex-none"><Loader2 className="w-4 h-4"/> Launch store</CTA>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <DashboardLayout>

    <div className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PublishLoader show={publishing} />

      {/* Left: editor */}
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <header className="rounded-2xl bg-gradient-to-r from-white via-indigo-50 to-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold truncate">Create your store</h1>
              <p className="text-sm text-gray-500 mt-1">A premium guided flow to get your store live fast.</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">Premium</span>
              <div className="flex items-center gap-2">
                <Ghost onClick={() => window.open(`https://${watchAll.subdomain || 'your-subdomain'}.darllix.shop`, '_blank')}>Preview</Ghost>
                <CTA onClick={publish}><Loader2 className="w-4 h-4"/> Publish</CTA>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {["Details", "Products", "Customize", "Launch"].map((label, i) => (
                <div key={label} className={`flex-shrink-0 flex items-center gap-3 py-1 ${i === step ? 'opacity-100' : 'opacity-60'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${i === step ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{i + 1}</div>
                  <div className={`text-xs ${i === step ? 'text-gray-800 font-semibold' : 'text-gray-400'}`}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500">Step {step + 1} of 4</div>
              <h2 className="text-lg sm:text-xl font-bold">{["Details", "Products", "Customize", "Launch"][step]}</h2>
            </div>
{/* 
            <div className="flex items-center gap-2">
              <Ghost onClick={() => setStep(0)}>Details</Ghost>
              <Ghost onClick={() => setStep(1)}>Products</Ghost>
              <Ghost onClick={() => setStep(2)}>Customize</Ghost>
              <Ghost onClick={() => setStep(3)}>Launch</Ghost>
            </div> */}
          </div>

          <StepContent />
        </div>
      </motion.div>

      {/* Right: live preview + quick stats */}
      <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Live preview</h3>
              <div className="text-sm text-gray-500">Auto-updates as you type</div>
            </div>

            <div className="flex items-center gap-3">
              <Ghost onClick={saveDraft}>Save</Ghost>
              <CTA onClick={() => setProductModalOpen(true)}><Plus className="w-4 h-4"/> Add product</CTA>
            </div>
          </div>

          {/* preview toggle on small screens */}
          <div className="block lg:hidden">
            <button className="mb-3 text-sm text-sky-600" onClick={() => setShowPreview((s) => !s)}>{showPreview ? 'Hide preview' : 'Show preview'}</button>
          </div>

          {showPreview && <LivePreview store={{ ...watchAll, products }} />}

          <div className="grid grid-cols-1 gap-3">
            <MiniStat icon={<Tag />} label="Products" value={products.length || 0} />
            <MiniStat icon={<Edit3 />} label="Theme" value={watchAll.theme?.primary || '#0f172a'} />
            <div className="p-3 bg-white rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Live store</div>
                <div className="font-semibold">{watchAll.subdomain ? `${watchAll.subdomain}.darllix.shop` : 'Not live'}</div>
              </div>
              <div>
                <Ghost onClick={() => window.open(`https://${watchAll.subdomain || 'your-subdomain'}.darllix.shop`, '_blank')}>Open</Ghost>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <ProductModal
        open={productModalOpen}
        onClose={() => { setProductModalOpen(false); setEditingProduct(null); }}
        onSave={(p) => {
          if (editingProduct) handleEditProduct(editingProduct.id, p);
          else handleAddProduct(p);
        }}
        initial={editingProduct}
      />
    </div>
    </DashboardLayout>
  );
}
