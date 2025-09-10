// // pages/api/customers.js
// import { getSupabaseServer } from "@/lib/supabaseClient";

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ message: "Method not allowed" });
//   }

//   const supabase = getSupabaseServer({ req, res });

//   const { storeId, name, email, phone, address, state, country, zip } = req.body || {};

//   if (!storeId || !email) {
//     return res.status(400).json({ message: "Missing storeId or email" });
//   }

//   try {
//     // First check if the customer exists
//     let { data: existing, error: fetchError } = await supabase
//       .from("customers")
//       .select("*")
//       .eq("email", email)
//       .eq("store_id", storeId)
//       .maybeSingle();

//     if (fetchError) throw fetchError;

//     if (existing) {
//       return res.status(200).json({ customer: existing });
//     }

//     // Build payload safely (only include fields that exist in your table)
//     const payload = {
//       store_id: storeId,
//       name,
//       email,
//       phone,
//       address,
//     };

//     // Optional fields – only add them if the table has these columns
//     if (state !== undefined) payload.state = state;
//     if (country !== undefined) payload.country = country;
//     if (zip !== undefined) payload.zip = zip;

//     const { data, error } = await supabase
//       .from("customers")
//       .insert([payload])
//       .select()
//       .single();

//     if (error) throw error;

//     res.status(200).json({ customer: data });
//   } catch (err) {
//     console.error("Customer API error:", err);
//     res.status(500).json({ message: err.message });
//   }
// }

import { getSupabaseServer, supabaseAdmin } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  const supabase = getSupabaseServer({ req, res });
  const admin = supabaseAdmin(); // service role client

  try {
    if (req.method === "POST") {
      const { storeId, name, email, phone, address, state, country, zip } = req.body || {};

      if (!storeId || !email) return res.status(400).json({ message: "Missing storeId or email" });

      // Check if customer exists
      const { data: existing, error: fetchError } = await supabase
        .from("customers")
        .select("*")
        .eq("email", email)
        .eq("store_id", storeId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (existing) return res.status(200).json({ customer: existing });

      const payload = { store_id: storeId, name, email, phone, address };
      if (state !== undefined) payload.state = state;
      if (country !== undefined) payload.country = country;
      if (zip !== undefined) payload.zip = zip;

      const { data, error } = await supabase
        .from("customers")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ customer: data });
    }

    // ------------------ GET customers ------------------
    if (req.method === "GET") {
      const {
        page = "1",
        limit = "20",
        store_id,
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
        // Fetch single customer by ID
        const { data: customer, error } = await admin
          .from("customers")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) return res.status(500).json({ error: error.message });
        if (!customer) return res.status(404).json({ error: "Customer not found" });

        return res.status(200).json({ customer });
      }

      // List customers with optional filters
      let qb = admin.from("customers").select("*", { count: "exact" });

      if (store_id) qb = qb.eq("store_id", store_id);

      // ------------------ FIXED SEARCH ------------------
      if (q) {
        const search = `%${q}%`;
        qb = qb.or(`name.ilike.${search},email.ilike.${search},phone.ilike.${search}`);
      }

      const allowedSort = new Set(["created_at", "name", "email"]);
      const sBy = allowedSort.has(sort_by) ? sort_by : "created_at";
      const sDir = sort_dir === "asc" ? "asc" : "desc";

      qb = qb.order(sBy, { ascending: sDir === "asc" }).range(from, to);

      const { data: rows, error: dataErr, count } = await qb;
      if (dataErr) return res.status(500).json({ error: dataErr.message });

      return res.status(200).json({
        customers: rows || [],
        total: typeof count === "number" ? count : (rows || []).length,
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error("Customers API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
