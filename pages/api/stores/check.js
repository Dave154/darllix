// pages/api/stores/check.js
import { getSupabaseServer } from "@/lib/supabaseClient";

const RESERVED = [
  "www",
  "app",
  "admin",
  "dashboard",
  "support",
  "api",
  "mail",
  "blog",
];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { subdomain, storeId } = req.query;

  if (!subdomain || subdomain.length < 3) {
    return res.status(400).json({ available: false, message: "Invalid subdomain" });
  }

  // Reserved check
  if (RESERVED.includes(subdomain.toLowerCase())) {
    return res.status(200).json({ available: false, message: "Subdomain reserved" });
  }

  const supabase = getSupabaseServer({ req, res });

  // Check if already taken by another store
  const { data, error } = await supabase
    .from("stores")
    .select("id")
    .eq("subdomain", subdomain.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("Error checking subdomain:", error);
    return res.status(500).json({ available: false, message: "Server error" });
  }

  // If subdomain is taken by a different store
  if (data && (!storeId || data.id !== storeId)) {
    return res.status(200).json({ available: false, message: "Subdomain already in use" });
  }

  return res.status(200).json({ available: true });
}
