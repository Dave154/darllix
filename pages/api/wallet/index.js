// pages/api/wallet/index.js
import { getSupabaseServer, supabaseAdmin } from "@/lib/supabaseClient";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

async function createPaystackRecipient(bank_name, bank_code, account_number, account_name) {
  // Create transfer recipient to Paystack to get recipient_code
  const url = "https://api.paystack.co/transferrecipient";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name: account_name,
      account_number,
      bank_code,
      currency: "NGN",
      metadata: {},
    }),
  });
  const json = await res.json().catch(() => null);

  if (!res.ok) throw new Error(json?.message || "Failed creating recipient");
  // json.data.recipient_code expected
  return json.data;
}

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseServer({ req, res }); // server client from request
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return res.status(401).json({ error: "Unauthorized" });

    const admin = supabaseAdmin();

    if (req.method === "GET") {
      // Return profile balances + recent withdrawals
      const { data: profile, error: profErr } = await admin.from("profiles").select("id, available_balance, pending_balance, paystack_recipient_code, account_number, bank_name, account_name").eq("id", user.id).maybeSingle();
      if (profErr) return res.status(500).json({ error: profErr.message });

      const { data: withdrawals } = await admin.from("withdrawals").select("*").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(20);
      return res.status(200).json({ profile, withdrawals });
    }

    if (req.method === "POST") {
      // withdraw: { amount } in NGN (decimal)
      const { amount } = req.body;
      const requestedAmount = Number(amount);
      if (!requestedAmount || requestedAmount <= 0) return res.status(400).json({ error: "Invalid amount" });

      // fetch profile
      const { data: profile, error: profErr } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (profErr) return res.status(500).json({ error: profErr.message });
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const available = Number(profile.available_balance || 0);
      if (requestedAmount > available) return res.status(400).json({ error: "Insufficient balance" });

      // ensure profile has bank details
      if (!profile.account_number || !profile.bank_name || !profile.account_name || !profile.bank_code) {
        return res.status(400).json({ error: "Missing bank details" });
      }

      // ensure paystack recipient exists: store recipient_code in profiles.paystack_recipient_code
      let recipientCode = profile.paystack_recipient_code;
      if (!recipientCode) {
        // Create recipient in Paystack
        if (!PAYSTACK_SECRET) return res.status(500).json({ error: "Payment provider not configured" });
        // We need bank code; ideally map bank_name to code here or ask user for bank_code.
        // For simplicity: use transferrecipient with account_number and account_name and bank_code if available.
        // NOTE: you should map bank_name -> bank_code or store bank_code in profile in production.
        const payload = {
          type: "nuban",
          name: profile.account_name,
          account_number: profile.account_number,
          currency: "NGN",
          metadata: { userId: user.id },
          bank_code: profile.bank_code
        };



        const createRes = await fetch("https://api.paystack.co/transferrecipient", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const createJson = await createRes.json().catch(() => null);
        if (!createRes.ok) {
          console.error("Paystack create recipient error", createJson);
          return res.status(500).json({ error: createJson?.message || "Failed creating transfer recipient" });
        }
        recipientCode = createJson.data?.recipient_code;
        // store recipientCode in profile
        await admin.from("profiles").update({ paystack_recipient_code: recipientCode }).eq("id", profile.id);
      }

      // create withdrawal row (reserve funds) and immediately reduce available_balance
      const amountKobo = Math.round(requestedAmount * 100); // Paystack expects kobo (integer)
      const { data: withdrawalRow, error: wrErr } = await admin.from("withdrawals").insert([{
        profile_id: user.id,
        amount: requestedAmount,
        amount_kobo: amountKobo,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]).select("*").single();

      if (wrErr || !withdrawalRow) {
        console.error("withdraw insert err", wrErr);
        return res.status(500).json({ error: wrErr?.message || "Failed to create withdrawal" });
      }

      // deduct available_balance (optimistically reserve)
      const newAvailable = (Number(profile.available_balance || 0) - requestedAmount);
      const { error: updProfErr } = await admin.from("profiles").update({ available_balance: newAvailable }).eq("id", user.id);
      if (updProfErr) {
        console.error("failed to deduct balance", updProfErr);
        // attempt to mark withdrawal failed
        await admin.from("withdrawals").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", withdrawalRow.id);
        return res.status(500).json({ error: "Failed to reserve balance" });
      }

      // Initiate Paystack transfer
      if (!PAYSTACK_SECRET) {
        // If payment provider not configured, leave withdrawal in pending for manual processing
        return res.status(200).json({ withdrawal: withdrawalRow, message: "Withdrawal queued; paystack not configured" });
      }
      const deductedamount = amountKobo * 95/100
      console.log(deductedamount)
      const transferPayload = {
        source: "balance",
        amount: deductedamount,
        recipient: recipientCode,
        reason: `Darllix payout for ${user.id}`,
      };

      const transferResRaw = await fetch("https://api.paystack.co/transfer", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferPayload),
      });

      const transferJson = await transferResRaw.json().catch(() => null);
      if (!transferResRaw.ok) {
        console.error("Paystack transfer error:", transferJson);
        // mark withdrawal failed and refund user's available_balance
        await admin.from("withdrawals").update({ status: "failed", paystack_response: transferJson, updated_at: new Date().toISOString() }).eq("id", withdrawalRow.id);
        // refund available_balance
        await admin.from("profiles").update({ available_balance: (newAvailable + requestedAmount) }).eq("id", user.id);
        return res.status(500).json({ error: transferJson?.message || "Transfer failed" });
      }

      // success -> update withdrawal
      await admin.from("withdrawals").update({
        status: transferJson.data?.status || "processing",
        paystack_reference: transferJson.data?.reference || null,
        paystack_response: transferJson,
        updated_at: new Date().toISOString(),
      }).eq("id", withdrawalRow.id);

      return res.status(200).json({ withdrawal: { ...withdrawalRow, status: transferJson.data?.status, paystack_reference: transferJson.data?.reference }, paystack: transferJson });
    }

    return res.setHeader("Allow", ["GET", "POST"]).status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error("wallet handler err", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
