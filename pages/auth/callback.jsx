
// // import { supabaseBrowser } from "@/lib/supabaseClient";

// // export default async function handler(req, res) {
// //   const supabase = supabaseBrowser();
// //   const { data, error } = await supabase.auth.exchangeCodeForSession(req.url);

// //   if (error) {
// //     return res.status(400).json({ error: error.message });
// //   }

// //   res.redirect("/dashboard");
// // }

// "use client";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useEffect } from "react";
// import { supabaseBrowser } from "@/lib/supabaseClient";
// import Loader from "../../storefrontComponents/loader";

// export default function CallbackPage() {
//   const router = useRouter();
//   const params = useSearchParams();

//   useEffect(() => {
//     const code = params.get("code");
//     if (!code) return;

//     supabaseBrowser()
//       .auth.exchangeCodeForSession(code)
//       .then(({ error }) => {
//         if (error) console.error(error);
//         router.replace("/dashboard");
//       });
//   }, [params, router]);

//   return <Loader />;
// }


// pages/auth/callback.jsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import Loader from "../../storefrontComponents/loader";

export default function CallbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const code = router.query.code;
      if (!code) return;

      const { error } = await supabaseBrowser().auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth error:", error.message);
        router.replace("/login?error=auth");
      } else {
        router.replace("/dashboard");
      }
      setLoading(false);
    };

    if (router.isReady) {
      run();
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
     <Loader />
    </div>
  );
}
