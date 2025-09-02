// lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

/** Browser client: use in React components */
export const supabaseBrowser = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

/** Server client with cookies: use in pages/api & getServerSideProps */
export const getSupabaseServer = (ctx) =>
  createPagesServerClient(ctx, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

/** Admin client (server-only) */
export const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
