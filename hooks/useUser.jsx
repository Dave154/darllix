import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { toast } from "sonner";

export function useUser() {
  const supabase = useSupabaseClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [store, setStore] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const [profileRes, storeRes] = await Promise.all([
            supabase
                .from("profiles")
                .select("*")
                .eq("id", currentUser.id)
                .single(),
            supabase
                .from("stores")
                .select("*")
                .eq("owner_id", currentUser.id)
                .maybeSingle()
          ]);

          if (profileRes.error) {
            if (profileRes.error.code === "PGRST116" || profileRes.error.message.includes("No rows")) {
              if (router.pathname !== "/dashboard/profile") {
                router.push("/dashboard/profile");
              }
            } else {
              toast.error("Something went wrong. Please try again.");
            }
          } else if (!profileRes.data) {
            if (router.pathname !== "/dashboard/profile") {
              router.push("/dashboard/profile");
            }
          } else {
            setProfile(profileRes.data);
          }

          if (storeRes.data) {
            setStore(storeRes.data);
          } else if (storeRes.error && storeRes.error.code !== "PGRST116") {
            console.error("Error fetching store:", storeRes.error);
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        toast.error("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase, router.pathname]);

  return { user, store, profile, loading };
}