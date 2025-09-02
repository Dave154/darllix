// // pages/api/stores/save.js
// import { createClient } from "@supabase/supabase-js";

// const SUPA_URL = process.env.SUPABASE_URL;
// const SUPA_SERVICE = process.env.SUPABASE_ANON_KEY;

// const serverSupabase = createClient(SUPA_URL, SUPA_SERVICE);

// export default async function handler(req, res) {
//   if (req.method !== "POST") return res.status(405).end();
//   // You'll want to validate JWT and ensure owner is authenticated in production.
//   try {
//     const { store, publish } = req.body;
//     const userId = req.headers["x-user-id"] || 'f7e13b08-b909-4dd0-8bfa-3ed5dfacba07'; // replace with proper auth extraction

//     if (!userId) {
//       return res.status(401).json({ message: "Unauthorized: provide user id in header (dev only)" });
//     }

//     // Upsert by subdomain + owner
//     const payload = {
//       name: store.name,
//       subdomain: store.subdomain,
//     //   description: store.description || null,
//       banner_url: store.banner_url || null,
//     //   theme: store.theme || {},
//     //   published: !!publish,
//     //   updated_at: new Date().toISOString(),
//     };

//     // If existing store for this owner, update; else insert
//     const { data: existing } = await serverSupabase.from("stores").select("*").eq("owner_id", userId).maybeSingle();

//     if (existing) {
//       const { error } = await serverSupabase.from("stores").update(payload).eq("id", existing.id);
//       if (error) throw error;
//       return res.status(200).json({ ok: true, id: existing.id });
//     } else {
//       const insertPayload = { ...payload, owner_id: userId };
//       const { data, error } = await serverSupabase.from("stores").insert(insertPayload).select().single();
//       if (error) throw error;
//       return res.status(200).json({ ok: true, id: data.id });
//     }
//   } catch (err) {
//     console.error("save store error:", err);
//     return res.status(500).json({ message: err.message });
//   }
// }


import { createServerSupabaseClient } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const supabase = createServerSupabaseClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const { store, publish } = req.body;

  // Normalize payload
  const payload = {
    id: store.id ?? undefined,
    owner_id: user.id,
    name: store.name?.trim(),
    subdomain: store.subdomain?.trim(),
    description: store.description ?? null,
    banner_url: store.banner_url ?? null,
    theme: store.theme ?? {},
    is_published: !!publish,
    updated_at: new Date().toISOString(),
  };

  let result;
  if (payload.id) {
    result = await supabase
      .from("stores")
      .update(payload)
      .eq("id", payload.id)
      .select("*")
      .single();
  } else {
    result = await supabase
      .from("stores")
      .insert(payload)
      .select("*")
      .single();
  }

  if (result.error) {
    return res.status(400).json({ message: result.error.message });
  }

  return res.json({ store: result.data });
}
