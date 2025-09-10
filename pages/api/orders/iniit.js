// pages/api/orders/init.js
import { getSupabaseServer, supabaseAdmin } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  try {
    const supabase = getSupabaseServer({ req, res });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // require auth for creating orders tied to a user (you can allow guest orders by removing this)
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { buyerEmail, storefrontId, orderDetails = {}, payment_provider = "paystack" } = req.body;
    if (!storefrontId) return res.status(400).json({ error: "storefrontId required" });

    // Create a pending order in DB (use supabaseAdmin to bypass RLS after verifying ownership if needed)
    const payload = {
      store_id: storefrontId,
      buyer_id: user?.id ?? null,
      buyer_email: buyerEmail ?? null,
      total: orderDetails.total ?? 0,
      currency: orderDetails.currency ?? "NGN",
      items: orderDetails.items ?? [],
      payment_provider: payment_provider,
      payment_status: "pending",
      status: "pending",
      payment_reference: null,
      payment_metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // insert order with admin client (supabaseAdmin)
    const supabaseAdminClient = supabaseAdmin();
    const { data: createdOrder, error: insertErr } = await supabaseAdminClient
      .from("orders")
      .insert([payload])
      .select("*")
      .single();

    if (insertErr) {
      console.error("order insert error", insertErr);
      return res.status(500).json({ error: insertErr.message || "Failed to create order" });
    }

    // Initialize Paystack transaction server-side (use your PAYSTACK_SECRET environment key)
    if (payment_provider === "paystack") {
      const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
      if (!PAYSTACK_SECRET) {
        return res.status(500).json({ error: "Paystack secret not configured" });
      }

      // Build initialize payload
      const initPayload = {
        amount: Math.round((createdOrder.total || 0) * 100), // kobo
        email: buyerEmail || user.email || "no-email@example.com",
        reference: `order_${createdOrder.id}`, // unique reference for Paystack
        metadata: {
          order_id: createdOrder.id,
          store_id: storefrontId,
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/payment-success`, // optional
      };

      // Call Paystack initialize endpoint
      const initResp = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(initPayload),
      });

      const initJson = await initResp.json();
      if (!initResp.ok || !initJson.status) {
        console.error("Paystack init error", initJson);
        return res.status(500).json({ error: initJson?.message || "Failed to initialize Paystack" });
      }

      // update order with reference
      const paystackRef = initJson.data.reference;
      await supabaseAdminClient
        .from("orders")
        .update({ payment_reference: paystackRef, payment_metadata: initJson.data })
        .eq("id", createdOrder.id);

      // return authorization url
      return res.status(200).json({
        authorization_url: initJson.data.authorization_url,
        reference: paystackRef,
        order: createdOrder,
      });
    }

    // fallback: return created order if not paystack
    return res.status(201).json({ order: createdOrder });
  } catch (err) {
    console.error("orders/init error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
