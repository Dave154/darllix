// hooks/useUser.ts
import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export function useUser() {
  const supabase = useSupabaseClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // If logged in, fetch profile
      if (currentUser) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (!error) {
          setProfile(data);
        }
      }

      setLoading(false);
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
