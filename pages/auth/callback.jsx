
import { supabaseBrowser } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase.auth.exchangeCodeForSession(req.url);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.redirect("/dashboard");
}
