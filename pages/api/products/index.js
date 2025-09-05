// // pages/api/products/index.js
// import { getSupabaseServer } from "@/lib/supabaseClient";
// import { createClient } from "@supabase/supabase-js";

// export default async function handler(req, res) {
//   try {
//     const supabase = getSupabaseServer({ req, res });
//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
//     const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

//     if (!SUPABASE_SERVICE_ROLE) {
//       console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var on server");
//       return res.status(500).json({ error: "Server misconfiguration" });
//     }

//     const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

//     // -------- CREATE PRODUCT --------
//     if (req.method === "POST") {
//       if (!user) return res.status(401).json({ error: "Unauthorized" });

//       const { product } = req.body;
//       if (!product?.name || product?.price == null) {
//         return res.status(400).json({ error: "Name and price are required" });
//       }

//       const { data: store } = await supabase
//         .from("stores")
//         .select("id")
//         .eq("owner_id", user.id)
//         .single();

//       if (!store) return res.status(400).json({ error: "User has no store" });

//       const payload = {
//         store_id: store.id,
//         name: product.name,
//         price: product.price,
//         discount_price: product.discountPrice ?? null,
//         description: product.description ?? null,
//         images: product.images ?? [],
//         status: product.status ?? "Active",
//         categories: product.categories ?? [],
//       };

//       const { data: created, error } = await supabaseAdmin
//         .from("products")
//         .insert([payload])
//         .select("*")
//         .single();

//       if (error) return res.status(500).json({ error: error.message });
//       return res.status(201).json({ product: created });
//     }

//     // -------- FETCH PRODUCTS (public) --------
//     if (req.method === "GET") {
//       let { storeId } = req.query;

//       // Fallback: auto-detect store if no storeId and user is logged in
//       if (!storeId && user) {
//         const { data: store, error: storeErr } = await supabase
//           .from("stores")
//           .select("id")
//           .eq("owner_id", user.id)
//           .single();

//         if (storeErr) {
//           console.error("Error fetching store:", storeErr);
//           return res.status(500).json({ error: "Failed to resolve store" });
//         }

//         if (store) storeId = store.id;
//       }

//       if (!storeId) {
//         return res.status(400).json({ error: "storeId query param required" });
//       }

//       const { data: products, error: prodErr } = await supabase
//         .from("products")
//         .select("*")
//         .eq("store_id", storeId)
//         .order("created_at", { ascending: false });

//       if (prodErr)
//         return res
//           .status(500)
//           .json({ error: prodErr.message || "Fetch failed" });

//       const { data: categories, error: catErr } = await supabase
//         .from("categories")
//         .select("*")
//         .eq("store_id", storeId)
//         .order("created_at", { ascending: true });

//       if (catErr)
//         return res
//           .status(500)
//           .json({ error: catErr.message || "Fetch categories failed" });

//       return res.status(200).json({ products, categories });
//     }

//     // -------- UPDATE PRODUCT --------
//     if (req.method === "PUT") {
//       if (!user) return res.status(401).json({ error: "Unauthorized" });

//       const { product } = req.body;
//       if (!product?.id) {
//         return res.status(400).json({ error: "Product id is required" });
//       }

//       const { data: store } = await supabase
//         .from("stores")
//         .select("id")
//         .eq("owner_id", user.id)
//         .single();

//       if (!store) return res.status(400).json({ error: "User has no store" });

//       const { data: updated, error } = await supabaseAdmin
//         .from("products")
//         .update({
//           name: product.name,
//           price: product.price,
//           discount_price: product.discountPrice ?? null,
//           description: product.description ?? null,
//           images: product.images ?? [],
//           status: product.status ?? "Active",
//           categories: product.categories ?? [],
//         })
//         .eq("id", product.id)
//         .eq("store_id", store.id)
//         .select("*")
//         .single();

//       if (error) return res.status(500).json({ error: error.message });
//       return res.status(200).json({ product: updated });
//     }

//     // -------- DELETE PRODUCT --------
//     if (req.method === "DELETE") {
//       if (!user) return res.status(401).json({ error: "Unauthorized" });

//       const { id } = req.query;
//       if (!id) return res.status(400).json({ error: "Product id required" });

//       const { data: store } = await supabase
//         .from("stores")
//         .select("id")
//         .eq("owner_id", user.id)
//         .single();

//       if (!store) return res.status(400).json({ error: "User has no store" });

//       const { error } = await supabaseAdmin
//         .from("products")
//         .delete()
//         .eq("id", id)
//         .eq("store_id", store.id);

//       if (error) return res.status(500).json({ error: error.message });
//       return res.status(204).end();
//     }

//     res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
//     return res.status(405).end(`Method ${req.method} Not Allowed`);
//   } catch (err) {
//     console.error("Products API unexpected error:", err);
//     return res.status(500).json({ error: err.message || "Server error" });
//   }
// }



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
      // expected query params:
      // store_id (required for storefront or dashboard)
      // page, limit, q, status, sort_by, sort_dir
      const {
        page = "1",
        limit = "10",
        q = "",
        status,
        storeId,
        sort_by = "created_at",
        sort_dir = "desc",
      } = req.query;

      if (!storeId) {
        return res.status(400).json({ error: "storeId query param required" });
      }

      const p = Math.max(1, parseInt(page, 10) || 1);
      const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
      const from = (p - 1) * l;
      const to = p * l - 1;

      // Build base query
      let queryBuilder = supabaseAdmin
        .from("products")
        .select("*, created_at", { count: "exact" }) // count exact for total
        .eq("store_id", storeId);

      // status filter
      if (status && status !== "All") {
        queryBuilder = queryBuilder.eq("status", status);
      }

      // full-text-ish search (name OR description)
      if (q && String(q).trim()) {
        const clean = String(q).trim().replace(/%/g, "\\%");
        // Supabase/Postgres ilike pattern match; use .or for name/description
        queryBuilder = queryBuilder.or(`name.ilike.%${clean}%,description.ilike.%${clean}%`);
      }

      // sorting safety: allow only a small set of columns
      const allowedSort = new Set(["created_at", "updated_at", "price", "name"]);
      const sortBy = allowedSort.has(sort_by) ? sort_by : "created_at";
      const sortDir = sort_dir === "asc" ? "asc" : "desc";

      // apply range and order
      queryBuilder = queryBuilder.order(sortBy, { ascending: sortDir === "asc" }).range(from, to);

      const { data: products, error: prodErr, count } = await queryBuilder;
      if (prodErr) {
        console.error("Fetch products error:", prodErr);
        return res.status(500).json({ error: prodErr.message || "Fetch failed" });
      }

      // fetch store categories once to map ids -> names
      const { data: categories = [], error: catErr } = await supabaseAdmin
        .from("categories")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: true });

      if (catErr) {
        console.warn("Failed to fetch categories (non-fatal):", catErr);
      }

      // Build a lookup map of category id -> name
      const catMap = new Map();
      (categories || []).forEach((c) => catMap.set(String(c.id), c.name));

      // map products' categories (which is stored as array of uuids) -> a readable string
      const mapped = (products || []).map((p) => {
        let categoryDisplay = "—";
        if (Array.isArray(p.categories) && p.categories.length) {
          // map IDs to names, fallback to id substring if name missing
          const names = p.categories
            .map((cid) => (catMap.get(String(cid)) ? catMap.get(String(cid)) : String(cid).slice(0, 8)))
            .filter(Boolean);
          categoryDisplay = names.join(", ");
        }
        return {
          ...p,
          category: categoryDisplay,
        };
      });

      const total = typeof count === "number" ? count : mapped.length;
      return res.status(200).json({ products: mapped, categories: categories || [], total });
    }

    // method not allowed
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error("Products API unexpected error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
