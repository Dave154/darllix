// pages/api/products/index.js
import { getSupabaseServer } from "@/lib/supabaseClient";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseServer({ req, res });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Admin client (service role) for writes & bypassing RLS safely (server-side)
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_SERVICE_ROLE) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
      return res.status(500).json({ error: "Server misconfiguration" });
    }
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // ---------------------- POST (create) ----------------------
    if (req.method === "POST") {
      // must be authenticated
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { product } = req.body;
      if (!product?.name || product?.price == null) {
        return res.status(400).json({ error: "Name and price are required" });
      }

      // ensure user has a store
      const { data: store, error: storeErr } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (storeErr) {
        console.error("fetch store error:", storeErr);
        return res.status(500).json({ error: "Failed to validate store" });
      }
      if (!store) return res.status(400).json({ error: "User has no store" });

      const payload = {
        store_id: store.id,
        name: product.name,
        price: product.price,
        discount_price: product.discountPrice ?? null,
        description: product.description ?? null,
        images: product.images ?? [],
        status: product.status ?? "Active",
        categories: product.categories ?? [], 
       available: Number.isFinite(Number(product.available)) ? Number(product.available) : 0,
      };

      const { data: created, error: insertErr } = await supabaseAdmin
        .from("products")
        .insert([payload])
        .select("*")
        .single();

      if (insertErr) {
        console.error("Insert error (admin):", insertErr);
        return res.status(500).json({ error: insertErr.message || "Insert failed" });
      }
      return res.status(201).json({ product: created });
    }

    // ---------------------- PUT (update) ----------------------
    if (req.method === "PUT") {
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const { product } = req.body;
      if (!product?.id) return res.status(400).json({ error: "Product id is required" });

      // validate ownership
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!store) return res.status(400).json({ error: "User has no store" });

      const updates = {
        name: product.name,
        price: product.price,
        discount_price: product.discountPrice ?? null,
        description: product.description ?? null,
        images: product.images ?? [],
        status: product.status ?? "Active",
        categories: product.categories ?? [],
        updated_at: new Date().toISOString(),
        available: Number.isFinite(Number(product.available)) ? Number(product.available) : 0,
      };

      const { data: updated, error: updateErr } = await supabaseAdmin
        .from("products")
        .update(updates)
        .eq("id", product.id)
        .eq("store_id", store.id)
        .select("*")
        .single();

      if (updateErr) {
        console.error("Update error (admin):", updateErr);
        return res.status(500).json({ error: updateErr.message || "Update failed" });
      }
      return res.status(200).json({ product: updated });
    }

    // ---------------------- DELETE ----------------------
    if (req.method === "DELETE") {
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "Product id required" });

      // validate ownership
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!store) return res.status(400).json({ error: "User has no store" });

      const { error: delErr } = await supabaseAdmin
        .from("products")
        .delete()
        .eq("id", id)
        .eq("store_id", store.id);

      if (delErr) {
        console.error("Delete error (admin):", delErr);
        return res.status(500).json({ error: delErr.message || "Delete failed" });
      }
      return res.status(204).end();
    }

    // ---------------------- GET (public) ----------------------
if (req.method === "GET") {
  const {
    page = "1",
    limit = "10",
    q = "",
    status,
    storeId,
    id,
    sort_by = "created_at",
    sort_dir = "desc",
    category,
  } = req.query;

  if (!storeId) {
    return res.status(400).json({ error: "storeId query param required" });
  }

  try {
    // Fetch store categories up-front so we can:
    //  - map product category ids -> names for the response
    //  - resolve a category filter supplied as a name -> id
    const { data: categories = [], error: catFetchErr } = await supabaseAdmin
      .from("categories")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: true });

    if (catFetchErr) {
      // non-fatal: keep going but warn
      console.warn("Failed to fetch categories (non-fatal):", catFetchErr);
    }

    // Build lookup map id => name
    const catMap = new Map();
    (categories || []).forEach((c) => catMap.set(String(c.id), c.name));

    // If `id` provided, return single product (with mapped categories)
    if (id) {
      const { data: singleProd, error: singleErr } = await supabaseAdmin
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (singleErr) {
        console.error("Fetch single product error:", singleErr);
        return res.status(500).json({ error: singleErr.message || "Fetch failed" });
      }
      if (!singleProd) return res.status(404).json({ error: "Product not found" });

      // ensure store matches (optional safety)
      if (String(singleProd.store_id) !== String(storeId)) {
        return res.status(404).json({ error: "Product not found for this store" });
      }

      // // normalize categories into [{id, name}, ...]
      // let productCategoriesReadable = [];
      // if (Array.isArray(singleProd.categories) && singleProd.categories.length) {
      //   productCategoriesReadable = singleProd.categories.map((cid) => {
      //     const cidStr = String(cid);
      //     return { id: cidStr, name: catMap.get(cidStr) || cidStr };
      //   });
      // } else if (singleProd.categories && typeof singleProd.categories === "string") {
      //   // legacy text stored
      //   productCategoriesReadable = [{ id: singleProd.categories, name: singleProd.categories }];
      // }

      // available normalization
      const available = typeof singleProd.available === "number"
        ? singleProd.available
        : (singleProd.available ? Number(singleProd.available) : 0);
        console.log(singleProd)
      return res.status(200).json({
        product: {
          ...singleProd,
          // categories: productCategoriesReadable,
          available,
        },
        categories: categories || [],
      });
    }

    // Pagination values
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const from = (p - 1) * l;
    const to = p * l - 1;

    // Determine if a category filter was supplied and resolve it to an id (if name was provided)
    let categoryIdToFilter = null;
    if (category && String(category).trim()) {
      const catCandidate = String(category).trim();

      // Try to match by id first
      const foundById = (categories || []).find((c) => String(c.id) === catCandidate);
      if (foundById) categoryIdToFilter = String(foundById.id);
      else {
        // Try to match by name (case-insensitive)
        const foundByName = (categories || []).find((c) => String(c.name).toLowerCase() === catCandidate.toLowerCase());
        if (foundByName) categoryIdToFilter = String(foundByName.id);
      }

      // If not found, we will return empty result set (no products match unknown category)
      if (!categoryIdToFilter) {
        return res.status(200).json({ products: [], categories: categories || [], total: 0 });
      }
    }

    // Build base query
    let queryBuilder = supabaseAdmin
      .from("products")
      .select("*, created_at", { count: "exact" })
      .eq("store_id", storeId);

    // status filter
    if (status && status !== "All") {
      queryBuilder = queryBuilder.eq("status", status);
    }

    // category server-side filter: expect categories column to be a JSON array of ids (text/uuid)
    if (categoryIdToFilter) {
      queryBuilder = queryBuilder.contains("categories_ids", [categoryIdToFilter]);


    }


    // full-text-ish search (name OR description)
    if (q && String(q).trim()) {
      const clean = String(q).trim().replace(/%/g, "\\%");
      queryBuilder = queryBuilder.or(`name.ilike.%${clean}%,description.ilike.%${clean}%`);
    }

    // sorting safety
    const allowedSort = new Set(["created_at", "updated_at", "price", "name"]);
    const sortBy = allowedSort.has(sort_by) ? sort_by : "created_at";
    const sortDir = sort_dir === "asc" ? "asc" : "desc";

    // apply order + pagination
    queryBuilder = queryBuilder.order(sortBy, { ascending: sortDir === "asc" }).range(from, to);

    const { data: products, error: prodErr, count } = await queryBuilder;
    if (prodErr) {
      console.error("Fetch products error:", prodErr);
      return res.status(500).json({ error: prodErr.message || "Fetch failed" });
    }

    // Map each product's categories (array of ids) to readable array of {id,name}
    // const mapped = (products || []).map((p) => {
    //   let productCats = [];
    //   if (Array.isArray(p.categories) && p.categories.length) {
    //     productCats = p.categories.map((cid) => {
    //       const cidStr = String(cid);
    //       return { id: cidStr, name: catMap.get(cidStr) || cidStr };
    //     });
    //   } else if (p.categories && typeof p.categories === "string") {
    //     // legacy text category - return as single-item object
    //     productCats = [{ id: p.categories.id, name: p.categories.name }];
    //   }

    //   return {
    //     ...p,
    //     categories: productCats,
    //     // also keep a convenient string fallback for older UI if needed
    //     category: Array.isArray(productCats) && productCats.length ? productCats.map((c) => c.name).join(", ") : "—",
    //     available: typeof p.available === "number" ? p.available : (p.available ? Number(p.available) : 0),
    //   };
    // });

    const total = typeof count === "number" ? count : mapped.length;
    return res.status(200).json({ products, categories: categories || [], total });
  } catch (err) {
    console.error("Products GET unexpected error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}

    // method not allowed
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error("Products API unexpected error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
