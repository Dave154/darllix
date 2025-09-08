// pages/api/payments/webhook.js
import { supabaseAdmin } from "@/lib/supabaseClient";
import crypto from "crypto";

export default async function handler(req, res) {
  // Paystack sends JSON bodies. We must verify the signature with PAYSTACK_SECRET_KEY
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET) {
    console.error("Missing PAYSTACK secret");
    return res.status(500).end("Server misconfigured");
  }

  // raw body required to compute signature. In Next.js API routes the body is parsed by default.
  // If you're using Next.js bodyParser, you should disable it for this route in config:
  // export const config = { api: { bodyParser: false } }
  // Then read raw body. For brevity here we'll assume signature header approach with JSON.
  try {
    const signature = req.headers["x-paystack-signature"];
    const body = JSON.stringify(req.body);

    const expected = crypto.createHmac("sha512", PAYSTACK_SECRET).update(body).digest("hex");
    if (signature !== expected) {
      console.warn("Invalid webhook signature");
      return res.status(401).end("Invalid signature");
    }

    const event = req.body;
    if (!event || !event.event) return res.status(400).end("Bad payload");

    const admin = supabaseAdmin();

    if (event.event === "charge.success" || event.event === "transfer.success" || event.event === "transaction.success") {
      const reference = event.data?.reference;
      if (!reference) return res.status(400).end("No reference");

      // update order to paid
      await admin
        .from("orders")
        .update({
          payment_status: "paid",
          payment_verified: true,
          payment_metadata: event.data,
          status: "processing",
        })
        .eq("payment_reference", reference);

      // respond 200
      return res.status(200).json({ ok: true });
    }

    // handle other events as needed
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("webhook error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
