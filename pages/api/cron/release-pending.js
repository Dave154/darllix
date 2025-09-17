// pages/api/cron/release-pending.js
import { supabaseAdmin } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Check secret header
  const secret = req.headers["x-cron-secret"] || req.headers["x-cron-token"];
  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const admin = supabaseAdmin();
    // Call DB function
    const { data, error } = await admin.rpc("release_pending_orders");
    if (error) {
      console.error("release_pending_orders RPC error:", error);
      return res.status(500).json({ error: error.message || "RPC failed" });
    }
    // data will usually be an integer count
    return res.status(200).json({ processed: data });
  } catch (err) {
    console.error("cron handler error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
