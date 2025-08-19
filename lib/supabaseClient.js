
import { createClient } from "@supabase/supabase-js";

export const createServerSupabaseClient = () => {
  const url = process.env.SUPABASE_URL || "****";
  const key = process.env.SUPABASE_ANON_KEY || "****";
  return createClient(url, key);
};

export const createBrowserSupabaseClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
};
