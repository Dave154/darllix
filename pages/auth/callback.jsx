
// // // // import { supabaseBrowser } from "@/lib/supabaseClient";

// // // // export default async function handler(req, res) {
// // // //   const supabase = supabaseBrowser();
// // // //   const { data, error } = await supabase.auth.exchangeCodeForSession(req.url);

// // // //   if (error) {
// // // //     return res.status(400).json({ error: error.message });
// // // //   }

// // // //   res.redirect("/dashboard");
// // // // }

// // // "use client";
// // // import { useRouter, useSearchParams } from "next/navigation";
// // // import { useEffect } from "react";
// // // import { supabaseBrowser } from "@/lib/supabaseClient";
// // // import Loader from "../../storefrontComponents/loader";

// // // export default function CallbackPage() {
// // //   const router = useRouter();
// // //   const params = useSearchParams();

// // //   useEffect(() => {
// // //     const code = params.get("code");
// // //     if (!code) return;

// // //     supabaseBrowser()
// // //       .auth.exchangeCodeForSession(code)
// // //       .then(({ error }) => {
// // //         if (error) console.error(error);
// // //         router.replace("/dashboard");
// // //       });
// // //   }, [params, router]);

// // //   return <Loader />;
// // // }


// // // pages/auth/callback.jsx
// // import { useRouter } from "next/router";
// // import { useEffect, useState } from "react";
// // import { supabaseBrowser } from "@/lib/supabaseClient";
// // import Loader from "../../storefrontComponents/loader";

// // export default function CallbackPage() {
// //   const router = useRouter();
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     const run = async () => {
// //       const code = router.query.code;
// //       if (!code) return;

// //       const { error } = await supabaseBrowser().auth.exchangeCodeForSession(code);

// //       if (error) {
// //         console.error("Auth error:", error.message);
// //         router.replace("/login?error=auth");
// //       } else {
// //         router.replace("/dashboard");
// //       }
// //       setLoading(false);
// //     };

// //     if (router.isReady) {
// //       run();
// //     }
// //   }, [router]);

// //   return (
// //     <div className="flex items-center justify-center min-h-screen">
// //      <Loader />
// //     </div>
// //   );
// // }


// // pages/auth/callback.jsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import Loader from "../../components/dashboardComponents/loader";

export default function CallbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try{

      const code = router.query.code;
      console.log(router.query)
      if (!code) return;

      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      console.log('test')
      if (error) {
        console.error("Auth error:", error.message);
        router.replace("/auth/login");
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log(user)
      if (!user) {
        router.replace("/login");
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();
        if (profile) {
        console.log(profile)
        router.replace("/dashboard");
      } else {
        router.replace("/dashboard/profile");
      }
      }catch (error){
          console.log(error)
      }finally{
        console.log('hmmm')
        setLoading(false);
      }

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

