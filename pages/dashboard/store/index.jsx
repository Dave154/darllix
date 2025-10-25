"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ShoppingBag,
  Loader2,
  Plus,
  Trash2,
  Edit3,
  Tag,
  ImportIcon,
  ChevronDown,
  ListVideo,
  Pen,
  PenLine,
} from "lucide-react";
import DashboardLayout from "../../../components/dashboardComponents/dashboardLayout";
import SubdomainChecker from "../../../components/dashboardComponents/subdomainChecker";
import Loader from "../../../components/dashboardComponents/loader";
import { withAuth } from "../../../lib/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BsRecord2Fill } from "react-icons/bs";
import CustomerGraph from "../../../components/customerGraph";
import PreviewPanel from "../../../components/dashboardComponents/livePreview";
import AddProductButton from "../../../components/dashboardComponents/addProductButton";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/router";
import { useUser } from "../../../hooks/useUser";
import { supabaseBrowser } from "../../../lib/supabaseClient";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

/* ---------------------------
   Schema & stable defaults
   --------------------------- */
const schema = z.object({
  name: z.string().min(2, "Name is required"),
  subdomain: z
    .string()
    .min(3, "Subdomain too short")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  description: z.string().max(1000).optional().nullable(),
  banner_url: z.string().url().optional().nullable(),
  theme: z
    .object({
      primary: z.string().optional(),
      accent: z.string().optional(),
      background: z.string().optional(),
    })
    .optional(),
});

const BASE_DEFAULTS = {
  name: "",
  subdomain: "",
  description: "",
  banner_url: "",
  theme: { primary: "#0d0b33", accent: "#79efbd", background: "#f7f6ff" },
};


function CTA({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={
        " flex items-center justify-center whitespace-nowrap gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-md bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-center hover:from-sky-700 hover:to-indigo-700 disabled:opacity-60 " +
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
        "w-full sm:w-auto inline-flex justify-center items-center gap-2 px-3 py-2 rounded-md text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 " +
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




// helper: build public url
function buildPublicUrl(supabaseUrl, bucketName, path) {
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${encodeURIComponent(bucketName)}/${encodeURIComponent(path)}`;
}

export async function getAuthUserId(supabase) {
    const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    console.error("No authenticated user found:", error);
    return null;
  }

  return user.id; // This is the auth.uid()
}

export  function BannerUploader({ currentUrl, onUploaded, bucket = "store-assets" }) {
  const [preview, setPreview] = useState(currentUrl || "");
  const [uploading, setUploading] = useState(false);
   const supabase = useSupabaseClient();

  // supabase client
  const supabaseClient = supabase
  

  useEffect(() => {
    setPreview(currentUrl || "");
  }, [currentUrl]);

  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setUploading(true);
      // const userId = await getAuthUserId(supabase);
      // console.log(userId)


      // get user (needed for folder structure)
      const { data: userData, error: userErr } = await supabaseClient.auth.getUser();
      if (userErr || !userData?.user) {
        throw new Error("You must be signed in to upload a banner.");
      }
      console.log(userData.id)
      const userId = userData.id
      const safeName = f.name.replace(/\s+/g, "_");
      const path = `${userId}/banners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

      const { error: uploadErr } = await supabaseClient.storage
        .from(bucket)
        .upload(path, f, { cacheControl: "3600", upsert: false });

      if (uploadErr) throw new Error(uploadErr.message);

      const publicUrl = buildPublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL, bucket, path);

      setPreview(publicUrl); // replace  preview with hosted one
      console.log(preview)
      onUploaded?.(publicUrl);
    } catch (err) {
      console.error("Banner upload failed:", err);
      toast.error("Failed to upload banner ");
    } finally {
      setUploading(false);
    }
  }

  function removeBanner() {
    setPreview("");
    onUploaded?.("");
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Store banner</label>
      <div className="w-full h-44 bg-gradient-to-br from-gray-50 to-white border border-dashed border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="banner" className="object-cover w-full h-full" />
        ) : (
          <div className="text-sm text-gray-400 px-4 text-center">
            Drag & drop or choose an image (1200×300 recommended)
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          id="banner-file"
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
          disabled={uploading}
        />
        <label
          htmlFor="banner-file"
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-white border border-gray-200 cursor-pointer ${
            uploading ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          {uploading ? "Uploading..." : "Upload"}
        </label>
        {preview && (
          <button
            type="button"
            onClick={removeBanner}
            className="text-sm text-red-500"
            disabled={uploading}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}


function ColorInput({ label, value = "#ffffff", onChange }) {
  
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-2">{label}</label>
      <div className="flex items-center gap-3">
        <input type="color" value={value} onChange={(e) => {

          onChange(e.target.value)
          
        }
         
         } className="w-12 h-10 p-0 border rounded-md" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="border p-2 rounded-md w-full" />
      </div>
    </div>
  );
}


/* Header preview link that watches subdomain only (keeps header reactive without re-rendering parent) */
function HeaderPreview({ control }) {
  const subdomain = useWatch({ control, name: "subdomain" });
  const href = `https://${(subdomain || "your-subdomain")}.darllix.shop`;
  return <Ghost onClick={() => window.open(href, "_blank")}>Preview</Ghost>;
}

export default function StoreCreator({ hasStore, store,onDone }) {
  const [step, setStep] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);
  const [categories,setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [total,setTotal] = useState(0)
  const [products, setProducts] = useState([])
  const [showPreview, setShowPreview] = useState(true);
  const [editing, setEditing]= useState(false)
  const router = useRouter()
  const {user}= useUser()
  

  // useEffect(()=>{
  //       console.log(user)
  // },[user])

const fetchProducts = useCallback(
  async (opts = {}) => {
    if (!hasStore) {
      setProducts([]);
      setCategories([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products?page=1&limit=10&storeId=${store.id}&sort_by=created_at&sort_dir=desc`, {
        credentials: "same-origin",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Fetch failed: ${res.status}`);
      }
      const json = await res.json();
      setProducts(json.products || []);
      setCategories(json.categories || []); 
      console.log(json.categories)
      setTotal(json.total || 0);
    } catch (err) {
      console.error("fetchProducts", err);
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  },
  [hasStore]
);



const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: BASE_DEFAULTS,
  });
  
  // const theme = useWatch({ control, name: "theme" });

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
useEffect(() => {
  if (editing && store) {
    reset({
      name:  store.mystore?.name || store.name ||  "",
      subdomain:  store.mystore?.subdomain || store.subdomain || "",
      description: store.mystore?.description || store.description || "",
      banner_url: store.mystore?.banner_url || store.banner_url ||"",
      theme:  store.mystore?.theme || store.theme|| BASE_DEFAULTS.theme,
    });

  }
}, [editing, store, reset]);



  function next() {
    setStep((s) => Math.min(3, s + 1));
  }
  function prev() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function saveDraft() {
    const values = getValues();

    const payload = { ...values, products};
    try {
      const res = await fetch(`/api/stores/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store: payload, publish: false }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Save failed");
      console.log("Draft saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save draft");
    }
  }



  
async function publish() {
  const values = getValues();
  const payload = { ...values, products };

  if (!editing && subdomainAvailable !== true) {
    toast.error("Please choose an available subdomain before publishing.");
    setStep(0);
    return;
  }


  setPublishing(true);
  try {
    const res = await fetch(`/api/stores/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store: { ...payload, id: editing ? store.id : undefined },
        publish: true,
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || "Publish failed");

    const url = `${payload.subdomain}.darllix.shop`;
    toast.success(editing ? "Store updated: " + url : "Store published: " + url);
    onDone && onDone(json);
    setEditing(false)
    router.push('/dashboard/store')

  } catch (err) {
    console.error(err);
    toast.error("Publish failed");
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
                <input {...register("subdomain")} disabled={editing} className="flex-1 border rounded-lg p-3" />
                <span className="text-xs sm:text-sm text-gray-500">.darllix.shop</span>
              </div>
              {!editing && (
              <div className="mt-2 text-xs">
                {subdomainAvailable === null && <span className="text-gray-500">Choose a subdomain</span>}
                {subdomainAvailable === "checking" && <span className="text-yellow-600">Checking…</span>}
                {subdomainAvailable === true && <span className="text-green-600">Available ✓</span>}
                {subdomainAvailable === false && <span className="text-red-600">Taken ✕</span>}
              </div>
            )}
              {errors.subdomain && <p className="text-red-600 text-xs mt-1">{errors.subdomain.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Short description</label>
              <textarea {...register("description")} rows={4} className="mt-2 w-full border rounded-lg p-3" />
              {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* <Ghost onClick={saveDraft} className="w-full sm:w-auto">Save draft</Ghost> */}
              <div className="flex w-full sm:w-auto gap-2">
                  <CTA onClick={()=>{
                    next()
                    if(!editing){

                      next()
                    }
                  }} className="flex-1 sm:flex-none">Continue</CTA>

              </div>
            </div>
          </form>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {/* <h3 className="font-semibold">Products</h3> */}
              <div className="flex gap-2">

                <AddProductButton onCreated={()=>fetchProducts()}/>
                <Ghost onClick={() =>router.push('/dashboard/products')}>Manage products</Ghost>
              </div>
            </div>
              <div className="flex flex-col max-h-96 overflow-auto">
                {
                  products.map((product,index)=>{
                    return <div className="flex gap-3 border-b pb-1 items-center" key={products.id + index}>
                       <img src={product.images[0]?.url} alt={product.name} className="w-10 h-10 border-1 rounded-lg "/>
                        {product.name}
                    </div>
                  })
                }
              </div>
            <div className="space-y-3">         
              <div className="flex flex-col sm:flex-row justify-between mt-4 gap-3">
                <Ghost onClick={prev} className="w-full sm:w-auto">Back</Ghost>
                <div className="flex w-full sm:w-auto gap-2">
                  {/* <Ghost onClick={saveDraft} className="w-full sm:w-auto">Save draft</Ghost> */}
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
              <BannerUploader
                  currentUrl={getValues().banner_url}
                  onUploaded={(url) =>  setValue("banner_url", url)}
                />
              </div>

              <div className="space-y-4">
                <Controller
  name="theme.primary"
  control={control}
  render={({ field }) => (
    <ColorInput
      label="Primary color"
      value={field.value}
      onChange={field.onChange}
    />
  )}
/>

<Controller
  name="theme.accent"
  control={control}
  render={({ field }) => (
    <ColorInput
      label="Accent color"
      value={field.value}
      onChange={field.onChange}
    />
  )}
/>

<Controller
  name="theme.background"
  control={control}
  render={({ field }) => (
    <ColorInput
      label="Background color"
      value={field.value}
      onChange={field.onChange}
    />
  )}
/>
            </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between mt-4 gap-3">
              <Ghost onClick={()=>{
                prev()
                 if(!editing){

                      prev()
                    }
              }} className="w-full sm:w-auto">Back</Ghost>
              <div className="flex w-full sm:w-auto gap-2">
                {/* <Ghost onClick={saveDraft} className="w-full sm:w-auto">Save draft</Ghost> */}
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
                  <div className="p-3 border rounded">Name: <strong>{getValues().name}</strong></div>
                  <div className="p-3 border rounded overflow-hidden">Subdomain: <strong>{getValues().subdomain}.darllix.shop</strong></div>
                  <div className="p-3 border rounded">Products: <strong>{products.length}</strong></div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500">Theme</div>
                <div className="mt-3 space-y-2">
                  <div className="p-3 border rounded">Primary: <span className="ml-2 font-mono">{getValues().theme?.primary}</span></div>
                  <div className="p-3 border rounded">Accent: <span className="ml-2 font-mono">{getValues().theme?.accent}</span></div>
                  <div className="p-3 border rounded">Background: <span className="ml-2 font-mono">{getValues().theme?.background}</span></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between mt-4 gap-3">
              <Ghost onClick={prev} className="w-full sm:w-auto">Back</Ghost>
              <div className="flex w-full sm:w-auto gap-2">
                {/* <Ghost onClick={saveDraft} className="w-full sm:w-auto">Save draft</Ghost> */}
                <CTA onClick={publish} className="flex-1 sm:flex-none"><Loader2 className="w-4 h-4" /> Launch store</CTA>
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

  {
    (!editing && hasStore ) ? (
      <>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className=" space-y-6"
        >
          {/* Header row + actions */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-semibold">My Store</h1>
            {hasStore && (
              <div className="flex items-center gap-2">
                {/* <Button variant="outline" className="hidden sm:inline-flex gap-2">
                  <BsRecord2Fill className="h-4 w-4" /> Live Preview
                </Button> */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      More actions <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                
                </DropdownMenu>
                <AddProductButton />
              </div>
            )}
          </div>

          {hasStore && (
            <>
            <div className="grid grid-cols-1 gap-3">
              <Card className="border-dashed">
                <CardContent className="py-3">
                  <p className="text-xs text-muted-foreground">Products available. </p>
                  <p className="text-[11px] text-muted-foreground mt-1"> {products.map(p=> p.available > 0).length} </p>
                </CardContent>
              </Card>
               <Card className="border-dashed">
               <CardContent  className="py-3">
                  
              <div className=" flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Live store</div>
                  <div className="font-semibold">{store?.subdomain ? `${store?.subdomain}.darllix.shop` : "Not live"}</div>
                </div>
                <div>
                  {
                     store?.subdomain &&
                  <Ghost onClick={() => window.open(`https://${store?.subdomain}.darllix.shop`, "_blank")}>Open</Ghost>
                  }
                </div>
              </div>
                </CardContent>
               </Card>

              
            </div>
             {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="">
                  <p className="text-gray-500 text-sm md:text-lg ml-3 mb-3 ">Sales</p>
                  <CustomerGraph/>
                  </div>
                  <div className="">
                <p className="text-gray-500 text-sm md:text-lg ml-3 mb-3 ">Finance</p>

                  <CustomerGraph/>
                  </div>

               </div> */}
               
            </>
          )}
        </motion.div>
       <Button className='text-color4' onClick={() => setEditing(true)}>
          <PenLine/> Edit Store
        </Button>
        <PreviewPanel control={control} mystore={store} products={products} categories={categories} />
      </>
    ) : (
      <>
         <div className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {
          publishing &&
        <Loader/>

        }

        {/* Left: editor */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <header className="rounded-2xl bg-gradient-to-r from-white via-indigo-50 to-white p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between w-full">
                <h1 className="text-2xl sm:text-3xl font-extrabold truncate">
                   {editing ? 'Edit' : "Create" } your store
                  </h1>
                  {
                    editing &&

                  <Button className={'bg-color1'} onClick={()=>{
                    setEditing(false)
                  }}>
                    Cancel
                  </Button>
                  }
                </div>
                <p className="text-sm text-gray-500 mt-1">A premium guided flow to get your store live fast.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {/* isolated header preview watch */}
                  {/* <HeaderPreview control={control} /> */}
                  <CTA onClick={publish}><Loader2 className="w-4 h-4" /> Publish</CTA>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {["Details", "Products", "Customize", "Launch"].map((label, i) => {
                  return (
                      ( !editing && label === 'Products') ? '':
                      <div key={label + i} className={`flex-shrink-0 flex items-center gap-3 py-1 ${i === step ? "opacity-100" : "opacity-60"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${i === step ? "bg-sky-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                     { editing ? i + 1 : i === 0 ? 1 : i  }
                      
                      </div>
                    <div className={`text-xs ${i === step ? "text-gray-800 font-semibold" : "text-gray-400"}`}>{label}</div>
                  </div>
                  )        
})
                }
              </div>
            </div>
          </header>

          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-500">Step { editing ? step + 1 : step === 0 ? 1 : step  } of {!editing? 3 : 4}</div>
                <h2 className="text-lg sm:text-xl font-bold">{["Details", "Products", "Customize", "Launch"][step]}</h2>
              </div>
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

                {
                  editing &&
              <div className="flex items-center gap-3">
                <Ghost onClick={saveDraft}>Save</Ghost>
                <AddProductButton />
              </div>
                }
            </div>
            <SubdomainChecker control={control} onAvailableChange={setSubdomainAvailable} />

            <div className="block lg:hidden">
              <button className="mb-3 text-sm text-sky-600" onClick={() => setShowPreview((s) => !s)}>{showPreview ? "Hide preview" : "Show preview"}</button>
            </div>

            {showPreview && <PreviewPanel control={control} products={products} categories={categories} />}

            <div className="grid grid-cols-1 gap-3">
              <MiniStat icon={<Tag />} label="Products" value={products?.length || 0} />
              {/* <MiniStat icon={<Edit3 />} label="Theme" value={getValues().theme?.primary} /> */}
              {
                            editing &&
              <div className="p-3 bg-white rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Live store</div>
                  <div className="font-semibold">{getValues().subdomain ? `${getValues().subdomain}.darllix.shop` : "Not live"}</div>
                </div>
                <div>

                          

                  <Ghost onClick={() => window.open(`https://${getValues().subdomain}.darllix.shop`, "_blank")}>Open</Ghost>
                </div>
              </div>
                          }
            </div>
          </div>
        </motion.div>

       
      </div>

      </>
    )
  }
         </DashboardLayout>
  );
}
export const getServerSideProps = withAuth();
