// // pages/auth/callback.jsx
// import { useEffect } from "react";
// import { supabaseBrowser } from "@/lib/supabaseClient";
// import { useRouter } from "next/router";

// export default function AuthCallback() {
//   const router = useRouter();

//   useEffect(() => {
//     // Supabase handles the session in the URL automatically.
//     // Give it a tick, then route into the app.
//     const go = async () => {
//       const supabase = supabaseBrowser();
//       await supabase.auth.getSession(); // ensures cookies set
//       router.replace("/dashboard");
//     };
//     go();
//   }, [router]);

//   return <div className="p-6">Signing you in…</div>;
// }
import { supabaseBrowser } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase.auth.exchangeCodeForSession(req.url);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.redirect("/dashboard");
}
