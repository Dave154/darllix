// components/product-modal/openProductModal.jsx
"use client";

import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";

// zod validation
const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  price: z
    .preprocess((v) => (v === "" ? undefined : Number(v)), z.number().nonnegative("Price must be >= 0")),
  discountPrice: z
    .preprocess((v) => (v === "" ? undefined : Number(v)), z.number().nonnegative("Discount must be >= 0").optional()),
  description: z.string().max(2000).optional(),
  // Validation expects an array of strings (IDs), which matches your DB logic
  categories: z.array(z.string()).max(3, "Max 3 categories").optional(),
  available: z
    .preprocess((v) => (v === "" ? undefined : Number(v)), z.number().int().min(0).optional()),
});

// helper: build public url for Supabase public bucket
function buildPublicUrl(supabaseUrl, bucketName, path) {
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${encodeURIComponent(bucketName)}/${encodeURIComponent(path)}`;
}

async function handleCreateProduct(product) {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "Failed to save product");
  }
  toast.success('Product Created succesfully');
  const { product: saved } = await res.json();
  return saved;
}

async function handleUpdateProduct(product) {
  const res = await fetch("/api/products", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "Failed to update product");
  }
  toast.success('Product updated succesfully');

  const { product: updated } = await res.json();
  return updated; 
}

function ModalImpl({ resolvePromise, options = {} }) {
  const {
    supabase,
    bucket = "product-images",
    onCreateProduct = handleCreateProduct,
    onUpdateProduct = handleUpdateProduct,
    storeId: passedStoreId = null,
    user,
    initialProduct = null,
  } = options;

  const supabaseClient = supabase;

  const {
    register,
    handleSubmit,
    reset,
    setValue, // Used to manually update field value
    getValues, // Used to read current form state (IDs) for hydration
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", price: "", discountPrice: "", description: "", categories: [],  available: 0 },
  });

  const [images, setImages] = useState([]); // { file|null, preview, id, path? }
  const [uploading, setUploading] = useState(false);
  const [storeId, setStoreId] = useState(passedStoreId);
  const [categories, setCategories] = useState([]); // { id, name }
  const [selectedCats, setSelectedCats] = useState([]); // array of category OBJECTS for UI
  const [loadingCats, setLoadingCats] = useState(false);

  // 1. PRELOAD INITIAL PRODUCT
  useEffect(() => {
    if (!initialProduct) return;
    const { name, price, discountPrice, description, available, images: imgs = [], categories: cats = [] } = initialProduct;
      
    // Extract IDs for the Form (Logic)
    // Handle cases where 'c' might be null or already an object
    const categoryIds = Array.isArray(cats) 
      ? cats.filter(Boolean).map(c => typeof c === 'object' ? c.id : c) 
      : [];

    reset({ 
      name, 
      price: price ?? "", 
      available: available ?? "", 
      discountPrice: discountPrice ?? "", 
      description: description ?? "", 
      categories: categoryIds 
    });

    // Set UI State (Visuals)
    // If we have Objects immediately (from initialProduct), use them.
    // If we only have IDs, use IDs for now (the Fetch effect below will "Hydrate" them into objects).
    const validCats = Array.isArray(cats) ? cats.filter(Boolean) : [];
    setSelectedCats(validCats.slice(0, 3));
 
    const imgsNormalized = imgs.map((it, idx) => {
      if (!it) return null;
      if (typeof it === "string") return { file: null, preview: it, id: `existing-${idx}`, path: null };
      return { file: null, preview: it.url || it.path || it, id: `existing-${idx}`, path: it.path || null };
    }).filter(Boolean);
    setImages(imgsNormalized);
  }, [initialProduct, reset]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.preview && img.file) URL.revokeObjectURL(img.preview);
      });
    };
  }, [images]);

  // 2. FETCH CATEGORIES & HYDRATE SELECTION
  useEffect(() => {
    let mounted = true;
    async function resolveStoreAndFetchCats() {
      try {
        if (!supabaseClient) return;
        let sId = passedStoreId;
        if (!sId) {
          if (user) {
            const { data: store } = await supabaseClient.from("stores").select("id").eq("owner_id", user.id).maybeSingle();
            sId = store?.id;
          }
        }
        if (mounted && sId) {
          setStoreId(sId);
          try {
            setLoadingCats(true);
            const res = await fetch(`/api/categories?storeId=${encodeURIComponent(sId)}`, { credentials: "same-origin" });
            if (res.ok) {
              const json = await res.json();
              if (mounted) {
                const fetchedCats = json.categories || [];
                setCategories(fetchedCats);

                // --- HYDRATION FIX ---
                // We grab the IDs currently in the Form (from Step 1)
                const currentFormIds = getValues("categories") || [];
                
                // We find the full Objects in the new data that match those IDs
                const hydratedSelection = fetchedCats.filter(c => currentFormIds.includes(c.id));
                
                // We update the UI state to use these full objects (so highlighting works)
                if (hydratedSelection.length > 0) {
                    setSelectedCats(hydratedSelection.slice(0, 3));
                }
              }
            } else {
              console.warn("Failed to fetch categories for store", sId);
            }
          } catch (err) {
            toast.error('Something went wrong');
            console.error("fetch categories error", err);
          } finally {
            if (mounted) setLoadingCats(false);
          }
        }
      } catch (err) {
        console.error("resolveStoreAndFetchCats", err);
      }
    }
    resolveStoreAndFetchCats();
    return () => { mounted = false; };
  }, [supabaseClient, passedStoreId, user, getValues]); // Added getValues dependency (stable)

  function onFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next = files.map((f) => ({ file: f, preview: URL.createObjectURL(f), id: `${Date.now()}-${Math.random()}` }));
    setImages((prev) => [...prev, ...next]);
    e.currentTarget.value = "";
  }

  function removeImage(id) {
    setImages((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found && found.file && found.preview) URL.revokeObjectURL(found.preview);
      return prev.filter((p) => p.id !== id);
    });
  }
  
  async function uploadFilesToSupabase(filesToUpload) {
    if (!filesToUpload.length) return [];
    
    const {data} = await supabaseClient.auth.getSession();
    if (!user) throw new Error("You must be signed in to upload images.");
    const userId = data.session.user.id;

    const results = [];
    for (const fobj of filesToUpload) {
      const file = fobj.file;
      const safeName = file.name.replace(/\s+/g, "_");
      const path = `${userId}/products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
      const { error } = await supabaseClient.storage.from('product-images').upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        console.log(error);
        toast.error('Failed to upload images / save product');
        throw new Error(error.message || "Upload failed");
      }
      const publicUrl = buildPublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL, bucket, path);
      results.push({ path, url: publicUrl });
    }
    return results;
  }

  // category toggle
  function toggleCategory(c) {
    setSelectedCats((prev) => {
      // Robust check: compare by ID if available, otherwise strict equality
      const has = prev.find(p => (p.id || p) === c.id);
      let newCats;
      
      if (has) {
        // Remove: Check against both full object ID and string ID
        newCats = prev.filter((p) => (p.id || p) !== c.id);
      } else {
        if (prev.length >= 3) return prev;
        newCats = [...prev, c];
      }

      // Sync with Form Data (Send only IDs to Zod/DB)
      const idsOnly = newCats.map(cat => cat.id || cat);
      setValue("categories", idsOnly, { shouldValidate: true });

      return newCats;
    });
  }

  async function onSubmit(values) {
    setUploading(true);
    try {
      // upload files that are real File objects
      const toUpload = images.filter((i) => i.file);
      const uploaded = await uploadFilesToSupabase(toUpload);
      // keep existing preview-only images (no file) as url-only entries
      const existingPreviews = images.filter((i) => !i.file).map((i) => ({ path: i.path || null, url: i.preview }));
      const finalImages = [...existingPreviews, ...uploaded];
      
      const productPayload = {
        ...(initialProduct?.id ? { id: initialProduct.id } : {}),
        name: values.name,
        price: typeof values.price === "string" ? Number(values.price) : values.price,
        discountPrice: values.discountPrice ? Number(values.discountPrice) : undefined,
        description: values.description || undefined,
        images: finalImages, // { path|null, url }
        previewUrls: images.map((i) => i.preview),
        status: initialProduct?.status || "Active",
        
        // --- CRITICAL FIX: Send IDs to API ---
        categories: selectedCats.map(c => c.id || c), 
        
        available: values.available != null ? Number(values.available) : 1,
      };

      let createdOrUpdated = null;
      if (initialProduct?.id) {
        // update flow
        if (typeof onUpdateProduct === "function") {
          createdOrUpdated = await onUpdateProduct(productPayload);
        }
      } else {
        // create flow
        if (typeof onCreateProduct === "function") {
          createdOrUpdated = await onCreateProduct(productPayload);
        }
      }

      // Return a combined object so the UI updates immediately with Names (not just IDs)
      const uiResult = {
          ...createdOrUpdated,
          ...productPayload,
          categories: selectedCats // Force the objects back into the UI result
      }

      resolvePromise(uiResult);
    } catch (err) {
      toast.error('Something went wrong. Try again');
      console.error("Upload error:", err);
      
    } finally {
      setUploading(false);
    }
  }

  const onError = (errors, e) => {
    console.error("Form Validation Failed:", errors);
    toast.error("Please check the form for errors");
  };

  function onCancel() {
    resolvePromise(null);
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{uploading ? "Uploading..." : (initialProduct ? "Edit product" : "Add product")}</h3>
          <button onClick={onCancel} className="p-2 rounded-md hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">Product name</label>
            <input {...register("name")} placeholder="Enter your product name" className="mt-2 w-full border rounded-lg p-3 focus:ring-2 focus:ring-sky-200" disabled={uploading} />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Price</label>
              <input {...register("price")} placeholder="Enter price eg. 4000" type="number" step="0.01" className="mt-2 w-full border rounded-lg p-3 focus:ring-2 focus:ring-sky-200" disabled={uploading} />
              {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price.message}</p>}
            </div>
             <div>
              <label className="block text-sm font-medium">Available</label>
              <input {...register("available")} placeholder="Enter Inventory Number eg. 40" type="number" step="1" min="1" className="mt-2 w-full border rounded-lg p-3 focus:ring-2 focus:ring-sky-200" disabled={uploading} />
              {errors.available && <p className="text-xs text-red-600 mt-1">{errors.available.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea {...register("description")} placeholder="Enter your product description" rows={4} className="mt-2 w-full border rounded-lg p-3 focus:ring-2 focus:ring-sky-200" disabled={uploading} />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
          </div>

          
          <div>
            <label className="block text-sm font-medium mb-2">Categories (up to 3)</label>

            {loadingCats ? <div className="flex items-center gap-2 text-sm text-gray-500 py-2"><Loader2 className="w-4 h-4 animate-spin"/> Loading categories...</div> : 
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 ? (
                <div className="text-sm text-gray-400 px-2 py-1">No categories available</div>
              ) : (
                categories.map((c) => {
                  // HIGHLIGHT FIX: Check against full Object ID OR string ID
                  const active = selectedCats.find(cat => (cat.id || cat) === c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c)}
                      className={`select-none transition inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${
                        active
                          ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                      disabled={uploading}
                      aria-pressed={!!active}
                    >
                      <span className="truncate max-w-[10rem]">{c.name}</span>
                    </button>
                  );
                })
              )}
            </div>
            }
            
            {errors.categories && <p className="text-xs text-red-600 mt-1">{errors.categories.message}</p>}

            <div className="text-xs text-muted-foreground mt-2">
                Selected: {selectedCats.length 
                ? selectedCats.filter(Boolean).map(cat => cat?.name || "Unknown").join(", ") 
                : "—"}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium mb-2">Images</label>
            <div className="flex items-center gap-3">
              <label className={`inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-md cursor-pointer hover:bg-gray-50 ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add images</span>
                <input type="file" accept="image/*" multiple onChange={onFilesSelected} className="sr-only" disabled={uploading} />
              </label>
              <div className="text-sm text-gray-500">You can add multiple images.</div>
            </div>

            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((img) => (
                  <div key={img.id} className="relative rounded-md overflow-hidden border bg-gray-50">
                    <img src={img.preview} alt="preview" className="object-cover w-full h-28" />
                    <button type="button" onClick={() => removeImage(img.id)} className="absolute top-2 right-2 bg-white/80 p-1 rounded-full" disabled={uploading}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-white border hover:bg-gray-50" disabled={uploading}>Cancel</button>
            <button type="button" onClick={handleSubmit(onSubmit, onError)} disabled={isSubmitting || uploading} className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700">
              {uploading ? "Uploading..." : (initialProduct ? "Save changes" : "Save product")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}

// Exported function to open the modal and return a Promise
export function openProductModal(options = {}) {
  const container = document.createElement("div");
  container.setAttribute("data-product-modal", "1");
  document.body.appendChild(container);

  return new Promise((resolve) => {
    const root = createRoot(container);

    function resolveAndClean(val) {
      try {
        resolve(val);
      } finally {
        try {
          root.unmount();
        } catch (err) {
          console.warn("root.unmount error:", err);
        }
        if (container.parentNode) container.parentNode.removeChild(container);
      }
    }

    root.render(<ModalImpl resolvePromise={resolveAndClean} options={options} />);
  });
}