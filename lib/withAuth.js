import { getSupabaseServer } from "@/lib/supabaseClient";

export function withAuth(getServerSidePropsFunc) {
  return async (ctx) => {
    const supabase = getSupabaseServer(ctx);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        redirect: {
          destination: "/auth/login",
          permanent: false,
        },
      };
    }

    let extraProps = {};
    if (getServerSidePropsFunc) {
      const result = await getServerSidePropsFunc(ctx, supabase, session);
      extraProps = result?.props || {};
    }

    return {
      props: {
        user: session.user,
        ...extraProps,
      },
    };
  };
}
