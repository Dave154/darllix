// pages/api/save.js
import { getSupabaseServer } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const supabase = getSupabaseServer({ req, res });

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { store, publish } = req.body || {};
  if (!store) {
    return res.status(400).json({ message: "Missing store data" });
  }

  // Normalize payload
  const payload = {
    owner_id: user.id,
    name: store.name?.trim() || null,
    subdomain: store.subdomain?.trim() || null,
    description: store.description || null,
    banner_url: store.banner_url || null,
    theme: store.theme || {},
    is_published: !!publish,
    updated_at: new Date().toISOString(),
  };

  // Upsert (insert or update if conflict on owner_id)
  const { data, error } = await supabase
    .from("stores")
    .upsert(
      {
        ...payload,
        id: store.id ?? undefined, 
        created_at: store.id ? undefined : new Date().toISOString(),
      },
      { onConflict: "owner_id" } 
    )
    .select("*")
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  return res.status(200).json({ store: data });
}
