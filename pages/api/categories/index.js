// pages/api/categories/index.js
import { getSupabaseServer } from "@/lib/supabaseClient";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseServer({ req, res });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return res.status(500).json({ error: "Server misconfiguration" });
    }
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // -------- CREATE CATEGORY --------
    if (req.method === "POST") {
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "Category name required" });

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!store) return res.status(400).json({ error: "User has no store" });

      const { data, error } = await supabaseAdmin
        .from("categories")
        .insert([{ store_id: store.id, name }])
        .select("*")
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ category: data });
    }

    // -------- GET CATEGORIES --------
    if (req.method === "GET") {
      const { storeId } = req.query;
      if (!storeId)
        return res.status(400).json({ error: "storeId query param required" });

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: true });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ categories: data });
    }

    // -------- UPDATE CATEGORY --------
    if (req.method === "PUT") {
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.query;
      const { name } = req.body;
      if (!id) return res.status(400).json({ error: "Category id required" });
      if (!name) return res.status(400).json({ error: "New name required" });

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      if (!store) return res.status(400).json({ error: "User has no store" });

      const { data, error } = await supabaseAdmin
        .from("categories")
        .update({ name })
        .eq("id", id)
        .eq("store_id", store.id)
        .select("*")
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ category: data });
    }

    // -------- DELETE CATEGORY --------
    if (req.method === "DELETE") {
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "Category id required" });

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      if (!store) return res.status(400).json({ error: "User has no store" });

      const { error } = await supabaseAdmin
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("store_id", store.id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(204).end();
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error("Categories API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
