// pages/api/wallet/release.js
import { supabaseAdmin } from "@/lib/supabaseClient"; // your service role client
export default async function handler(req, res) {
  try {
    // protect: only POST and require a cron secret header
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const secret = req.headers["x-cron-key"] || req.query.cronKey;
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const admin = supabaseAdmin();

   
    const query = admin
      .from("orders")
      .select("id, store_id, total, buyer_id, buyer_name")
      .eq("payout_released", false)
      .lte("delivered_at", new Date(Date.now() -  60 * 60 * 1000).toISOString()) // delivered_at <= now()-3d
      .is("delivered_at", null)
      ;

    // Supabase PostgREST query must check not null - we'll build using RPC-like approach:
    const { data: orders, error: err } = await admin
      .from("orders")
      .select("id, store_id, total, buyer_id, buyer_name, delivered_at")
      .eq("payout_released", false)
      .not("delivered_at", "is", null)
      .lte("delivered_at", new Date(Date.now() -  60 * 60 * 1000).toISOString());

    if (err) {
      console.error("release: fetch orders error", err);
      return res.status(500).json({ error: err.message || "Error fetching orders" });
    }
    if (!orders || orders.length === 0) {
      return res.status(200).json({ released: 0, summary: [], message: "No payouts to release" });
    }

    //
    const storeIds = [...new Set(orders.map((o) => o.store_id))];
    const { data: stores, error: storesErr } = await admin
      .from("stores")
      .select("id, owner_id")
      .in("id", storeIds);

    if (storesErr) {
      console.error("release: fetch stores err", storesErr);
      return res.status(500).json({ error: storesErr.message });
    }

    const storeOwnerById = {};
    for (const s of stores || []) storeOwnerById[s.id] = s.owner_id;

    // group totals by owner/profile id
    const totalsByOwner = {};
    for (const o of orders) {
      const owner = storeOwnerById[o.store_id];
      if (!owner) continue;
      totalsByOwner[owner] = (totalsByOwner[owner] || 0) + Number(o.total || 0);
    }

    // Start transaction-like sequence (no real pg transaction via PostgREST; do best-effort)
    const summary = [];
    for (const [ownerId, amount] of Object.entries(totalsByOwner)) {
      // update profile available_balance = available_balance + amount
      const { data: updatedProfile, error: updProfErr } = await admin
        .from("profiles")
        .update({
          available_balance: admin.raw('coalesce(available_balance, 0) + ?', [amount]),
        })
        .eq("id", ownerId)
        .select("*")
        .maybeSingle();

      // If admin.raw isn't supported in your client, do a two-step read then update
      if (updProfErr) {
        // fallback: fetch, then update
        const { data: pRow } = await admin.from("profiles").select("available_balance").eq("id", ownerId).maybeSingle();
        const newBal = (pRow?.available_balance || 0) + amount;
        await admin.from("profiles").update({ available_balance: newBal }).eq("id", ownerId);
      }

      summary.push({ ownerId, amount: Math.round((Number(amount) + Number.EPSILON) * 100) / 100 });
    }

    // mark orders payout_released = true
    const orderIds = orders.map((o) => o.id);
    const { error: markErr } = await admin.from("orders").update({ payout_released: true, updated_at: new Date().toISOString() }).in("id", orderIds);

    if (markErr) {
      console.error("release: failed to mark orders", markErr);
      // still return success but note the marking failure
      return res.status(200).json({ released: orderIds.length, summary, warning: "Released but failed to mark orders as released" });
    }

    return res.status(200).json({ released: orderIds.length, summary });
  } catch (err) {
    console.error("release error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
