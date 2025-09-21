// hooks/useUser.ts
import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { toast } from "sonner";

export function useUser() {
  const supabase = useSupabaseClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const router = useRouter()

  useEffect(() => {
  const getUser = async () => {
    setLoading(true);

    try {
      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (error) {
          // Handle "no rows found" separately
          if (error.code === "PGRST116" || error.message.includes("No rows")) {
            router.push("/dashboard/profile");
          } else {
            toast.error("Something went wrong. Please try again.");
          }
        } else if (!data) {
          // No profile row exists
          router.push("/dashboard/profile");
        } else {
          setProfile(data);
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

    // Listen for auth changes (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, profile, loading };
}
