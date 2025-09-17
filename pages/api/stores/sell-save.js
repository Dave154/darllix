// pages/api/stores/sell-save.js
import { getSupabaseServer } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const supabase = getSupabaseServer({ req, res });

  // 🔐 Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { storeId, percentage } = req.body || {};
  if (!storeId || percentage == null) {
    return res.status(400).json({ message: "storeId and percentage required" });
  }

  const { data, error } = await supabase
    .from("stores")
    .update({
      sell_save_percentage: percentage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)
    .eq("owner_id", user.id)
    .select("*")
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  return res.status(200).json({ store: data });
}
