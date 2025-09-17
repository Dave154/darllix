// pages/api/orders/index.js
import { getSupabaseServer, supabaseAdmin } from "@/lib/supabaseClient";


export default async function handler(req, res) {
  try {
    const supabase = getSupabaseServer({ req, res });
    const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    const user = userData?.user || null;

    const admin = supabaseAdmin(); // service role client
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || null;

    // ------------------ CREATE ORDER ------------------
    if (req.method === "POST" && !req.query.action) {
      // expected body: { order: { store_id, buyer_id?, items: [...], shipping_address?, billing_address?, currency?, payment_method?, payment_reference?, payment_provider?, meta? } }
      const { order } = req.body;
      if (!order || !order.store_id || !Array.isArray(order.items) || order.items.length === 0) {
        return res.status(400).json({ error: "Invalid order payload" });
      }

      // normalize items
      const items = order.items.map((it) => {
        const qty = Math.max(1, Number(it.quantity || 1));
        const price = Number(it.unit_price ?? it.price ?? 0);
        const line = Math.round((price * qty + Number.EPSILON) * 100) / 100;
        return {
          product_id: it.product_id || null,
          product_name: it.name || it.product_name || "Product",
          unit_price: price,
          quantity: qty,
          line_total: line,
          meta: it.meta || {},
        };
      });

      const total = items.reduce((s, it) => s + Number(it.line_total || 0), 0);

      const orderPayload = {
        store_id: order.store_id,
        buyer_id: order.buyer_id,
        buyer_name:order.buyer_name,
        status: order.status || "pending",
        total: Math.round((Number(total) + Number.EPSILON) * 100) / 100,
        currency: order.currency || "NGN",
        shipping_address: order.shipping_address || null,
        billing_address: order.billing_address || null,
        payment_method: order.payment_method || null,
        payment_provider: order.payment_provider || null,
        payment_reference: order.payment_reference || null,
        payment_status: order.payment_reference ? "pending" : (order.payment_status || "unpaid"),
        payment_verified: false,
        meta: order.meta || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Insert order
      const { data: createdOrder, error: orderErr } = await admin
        .from("orders")
        .insert([orderPayload])
        .select("*")
        .single();

      if (orderErr) {
        console.error("Order insert error:", orderErr);
        return res.status(500).json({ error: orderErr.message || "Failed to create order" });
      }

      // Insert items linked to order.id
      const itemsToInsert = items.map((it) => ({ ...it, order_id: createdOrder.id }));
      const { data: insertedItems, error: itemsErr } = await admin
        .from("order_items")
        .insert(itemsToInsert)
        .select("*");

      if (itemsErr) {
        console.error("Order items insert error:", itemsErr);
        // attempt cleanup of created order
        await admin.from("orders").delete().eq("id", createdOrder.id);
        return res.status(500).json({ error: itemsErr.message || "Failed to insert order items" });
      }

      const created = { ...createdOrder, items: insertedItems || [] };
      return res.status(201).json({ order: created });
    }

    // ------------------ PAYSTACK VERIFY ------------------
    // POST /api/orders?action=verify with { reference, orderId? }
    if (req.method === "POST" && req.query.action === "verify") {
      if (!PAYSTACK_SECRET) {
        console.error("Missing PAYSTACK_SECRET_KEY");
        return res.status(500).json({ error: "Payment provider not configured" });
      }

      const { reference, orderId } = req.body;
      if (!reference) return res.status(400).json({ error: "reference required" });

      const verifyUrl = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;
      const payRes = await fetch(verifyUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      });

      if (!payRes.ok) {
        const errBody = await payRes.text().catch(() => null);
        console.error("Paystack verify HTTP error", payRes.status, errBody);
        return res.status(502).json({ error: "Payment provider verify failed" });
      }

      const payJson = await payRes.json().catch(() => null);
      if (!payJson || typeof payJson.status === "undefined") {
        console.error("Invalid response from Paystack verify", payJson);
        return res.status(502).json({ error: "Invalid verify response" });
      }

      const success = payJson.status === true && payJson.data && payJson.data.status === "success";

      // find order by id or payment_reference
      let orderRow = null;
      if (orderId) {
        console.log(orderId)
        const { data } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
        orderRow = data;
      } else {
        const { data } = await admin.from("orders").select("*").eq("payment_reference", reference).maybeSingle();
        console.log(data)
        orderRow = data;
      }

      if (!orderRow) {
        console.warn("Verified payment but order not found locally for reference", reference);
      }

      if (orderRow) {
        const updates = {
          payment_verified: success,
          payment_reference: reference,
          payment_provider: "paystack",
          payment_status: success ? "paid" : (payJson.data?.status || "failed"),
          payment_metadata: payJson.data || {},
          updated_at: new Date().toISOString(),
        };

        const { data: updated, error: updErr } = await admin
          .from("orders")
          .update(updates)
          .eq("id", orderRow.id)
          .select("*")
          .maybeSingle();

        if (updErr) {
          console.error("Failed to update order payment status", updErr);
          return res.status(500).json({ error: "Failed to update order" });
        }
        console.log(updated)

        return res.status(200).json({ verified: success, order: updated, paystack: payJson });
      }

      // no local order: return paystack info
      return res.status(200).json({ verified: success, order: null, paystack: payJson });
    }

// ------------------ GET (single or list) ------------------
if (req.method === "GET") {
  const {
    page = "1",
    limit = "20",
    store_id,
    status,
    id,
    q,
    sort_by = "created_at",
    sort_dir = "desc",
  } = req.query;

  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const from = (p - 1) * l;
  const to = p * l - 1;

  if (id) {
    // single order fetch: require auth & authorization (owner or buyer)
    const { data: orderRow, error: orderErr } = await admin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", id)
      .maybeSingle();

    if (orderErr) return res.status(500).json({ error: orderErr.message });
    if (!orderRow) return res.status(404).json({ error: "Order not found" });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // check owner or buyer
    const { data: storeRow } = await admin
      .from("stores")
      .select("owner_id")
      .eq("id", orderRow.store_id)
      .maybeSingle();

    const isOwner = storeRow?.owner_id === user.id;
    const isBuyer = orderRow.buyer_id === user.id;
    if (!isOwner && !isBuyer) return res.status(403).json({ error: "Forbidden" });

    return res.status(200).json({ order: orderRow });
  }

  // list orders — seller only (for their stores)
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { data: stores, error: storesErr } = await admin
    .from("stores")
    .select("id")
    .eq("owner_id", user.id);

  if (storesErr) return res.status(500).json({ error: storesErr.message });
  const storeIds = (stores || []).map((s) => s.id);
  if (!storeIds.length) return res.status(200).json({ orders: [], total: 0, totalSales: 0 });

  let qb = admin
    .from("orders")
    .select("*, order_items(*)", { count: "exact" })
    .in("store_id", storeIds);

  if (store_id) qb = qb.eq("store_id", store_id);
  if (status) qb = qb.eq("status", status);

  // --- ✅ universal search (q) ---
  if (q) {
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(q);
    if (isUuid) {
      qb = qb.or(`id.eq.${q},buyer_id.eq.${q}`);
    } else {
      // Search by buyer_name (extendable to email/phone later)
      qb = qb.ilike("buyer_name", `%${q}%`);
    }
  }

  // --- sorting + pagination ---
  const allowedSort = new Set(["created_at", "updated_at", "total"]);
  const sBy = allowedSort.has(sort_by) ? sort_by : "created_at";
  const sDir = sort_dir === "asc" ? "asc" : "desc";

  qb = qb.order(sBy, { ascending: sDir === "asc" }).range(from, to);

  const { data: rows, error: dataErr, count } = await qb;
  if (dataErr) return res.status(500).json({ error: dataErr.message });

  // ------------------ compute totalSales (DB-side) ------------------
  
  let totalSales = 0;
  try {

    const { data: rpcResult, error: rpcErr } = await admin.rpc("sum_delivered_totals", { store_ids: storeIds });
    if (!rpcErr && rpcResult !== null && rpcResult !== undefined) {
      // rpcResult may be: number | string | [{ sum: "123" }] | { sum: "123" }
      const parseRpc = (v) => {
        if (Array.isArray(v) && v.length > 0) return parseFloat(Object.values(v[0])[0]) || 0;
        if (typeof v === "object") {
          const vals = Object.values(v);
          if (vals.length) return parseFloat(vals[0]) || 0;
          return 0;
        }
        return parseFloat(v) || 0;
      };
      totalSales = parseRpc(rpcResult);
    } else {
      // RPC not available or failed -> fallback
      throw rpcErr || new Error("RPC unavailable");
    }
  } catch (err) {
    // Fallback: PostgREST aggregate
    try {
      const { data: agg, error: aggErr } = await admin
        .from("orders")
        .select("sum(total)")
        .in("store_id", storeIds)
        .eq("status", "delivered")
        .maybeSingle();

      if (!aggErr && agg) {
        // agg may be { sum: "123.45" } or { sum_total: "123.45" } depending on pg version
        const raw = agg.sum ?? agg.sum_total ?? Object.values(agg || {})[0] ?? null;
        totalSales = raw !== null && raw !== undefined ? parseFloat(raw) || 0 : 0;
      } else {
        console.warn("Aggregate fallback error:", aggErr);
        totalSales = 0;
      }
    } catch (e) {
      console.error("Failed to calculate totalSales fallback:", e);
      totalSales = 0;
    }
  }

  // round to 2 decimals
  totalSales = Math.round((Number(totalSales) + Number.EPSILON) * 100) / 100;

  return res.status(200).json({
    orders: rows || [],
    total: typeof count === "number" ? count : (rows || []).length,
    totalSales,
  });
}

    // ------------------ UPDATE order (seller) ------------------
    if (req.method === "PUT") {
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const { order } = req.body;
      if (!order?.id) return res.status(400).json({ error: "Order id required" });

      // ensure user owns store for this order
      const { data: orderRow } = await admin.from("orders").select("id, store_id").eq("id", order.id).maybeSingle();
      if (!orderRow) return res.status(404).json({ error: "Order not found" });

      const { data: storeRow } = await admin.from("stores").select("owner_id").eq("id", orderRow.store_id).maybeSingle();
      if (!storeRow || storeRow.owner_id !== user.id) return res.status(403).json({ error: "Forbidden" });

      const updatePayload = {
        ...(order.status ? { status: order.status } : {}),
        ...(order.payment_status ? { payment_status: order.payment_status } : {}),
        ...(order.payment_verified !== undefined ? { payment_verified: !!order.payment_verified } : {}),
        ...(order.meta ? { meta: order.meta } : {}),
        updated_at: new Date().toISOString(),
      };
      if (order.status === "delivered") {
        updatePayload.delivered_at = order.delivered_at ?? new Date().toISOString();
  updatePayload.completed_at = order.completed_at ?? new Date().toISOString();
 
}

      const { data: updated, error: updErr } = await admin
        .from("orders")
        .update(updatePayload)
        .eq("id", order.id)
        .select("*")
        .maybeSingle();

      if (updErr) return res.status(500).json({ error: updErr.message });

      return res.status(200).json({ order: updated });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error("Orders API unexpected error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
