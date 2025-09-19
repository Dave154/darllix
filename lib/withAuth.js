// lib/withAuth.js
import { getSupabaseServer } from "@/lib/supabaseClient";

export function withAuth(getServerSidePropsFunc) {
  return async (ctx) => {
    const supabase = getSupabaseServer(ctx);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // console.log("Session from GSSP:", session);

    if (!session) {
      return {
        redirect: {
          destination: "/auth/login",
          permanent: false,
        },
      };
    }

    // Fetch the user’s store
    const { data: store, error } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", session.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // only log unexpected errors (PGRST116 = no rows)
      console.error("Error fetching store:", error);
    }

    let extraProps = {};
    if (getServerSidePropsFunc) {
      const result = await getServerSidePropsFunc(ctx, supabase, session, store);
      extraProps = result?.props || {};
    }

    return {
      props: {
        user: session.user,
        store: store ?? null,
        hasStore: !!store,
        ...extraProps,
      },
    };
  };
}
