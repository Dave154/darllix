import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { getSubscriptionStatus } from './subscriptionUtils';

/**
 * Higher-order component to protect pages that require active subscription
 * @param {Function} Component - Next.js page component
 * @param {Object} options - Configuration options
 * @returns {Function} Wrapped component with subscription check
 */
export function withSubscription(Component, options = {}) {
  const { redirectTo = '/dashboard/pricing', allowedRoles = [] } = options;

  return function ProtectedComponent(props) {
    // Client-side check - redirect if not authenticated or no subscription
    if (props.subscription === null && typeof window !== 'undefined') {
      // On client, useEffect in parent component should handle redirect
      // This is just a fallback
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Server-side subscription check for getServerSideProps
 * @param {Object} context - Next.js context
 * @param {Object} options - Configuration
 * @returns {Object} { subscription, store, user, redirect? }
 */
export async function checkSubscription(context, options = {}) {
  const { redirectTo = '/dashboard/pricing' } = options;

  const supabase = createServerSupabaseClient(context);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // No session - redirect to login
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  try {
    // Fetch store
    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (!store) {
      return {
        redirect: {
          destination: '/dashboard',
          permanent: false,
        },
      };
    }

    // Fetch subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const subscriptionStatus = getSubscriptionStatus(subscription);

    // Check if subscription is active
    if (!subscriptionStatus.isActive) {
      return {
        redirect: {
          destination: redirectTo,
          permanent: false,
        },
      };
    }

    return {
      props: {
        subscription: subscriptionStatus,
        store,
        user: session.user,
      },
    };
  } catch (error) {
    console.error('Subscription check error:', error);
    return {
      redirect: {
        destination: redirectTo,
        permanent: false,
      },
    };
  }
}

/**
 * API route subscription check
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 * @returns {Object|null} subscription status or null if not authorized
 */
export async function checkSubscriptionAPI(req, res) {
  const supabase = createServerSupabaseClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  try {
    // Fetch subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const subscriptionStatus = getSubscriptionStatus(subscription);

    // Check if subscription is active
    if (!subscriptionStatus.isActive) {
      res.status(403).json({
        error: 'No active subscription',
        message: 'Your subscription has expired. Please renew to continue.',
        hasSubscription: false,
      });
      return null;
    }

    return {
      subscription: subscriptionStatus,
      user: session.user,
      isValid: true,
    };
  } catch (error) {
    console.error('API subscription check error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return null;
  }
}

/**
 * Check if store has active subscription
 * @param {Object} supabase - Supabase client
 * @param {String} storeId - Store ID
 * @param {String} userId - User ID (optional, for verification)
 * @returns {Promise<Boolean>}
 */
export async function hasActiveSubscription(supabase, storeId, userId = null) {
  try {
    const { data: store } = await supabase
      .from('stores')
      .select('subscription_id')
      .eq('id', storeId)
      .single();

    if (!store?.subscription_id) {
      return false;
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', store.subscription_id)
      .single();

    if (!subscription) {
      return false;
    }

    // Optional: verify user ownership
    if (userId && subscription.user_id !== userId) {
      return false;
    }

    const status = getSubscriptionStatus(subscription);
    return status.isActive;
  } catch (error) {
    console.error('hasActiveSubscription error:', error);
    return false;
  }
}

/**
 * Get store's current subscription
 * @param {Object} supabase - Supabase client
 * @param {String} storeId - Store ID
 * @returns {Promise<Object|null>}
 */
export async function getStoreSubscription(supabase, storeId) {
  try {
    const { data: store } = await supabase
      .from('stores')
      .select('subscription_id')
      .eq('id', storeId)
      .single();

    if (!store?.subscription_id) {
      return null;
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', store.subscription_id)
      .single();

    return subscription || null;
  } catch (error) {
    console.error('getStoreSubscription error:', error);
    return null;
  }
}

/**
 * Wrapper combining withAuth + subscription check
 * Works with existing withAuth pattern
 * @param {Function} getServerSidePropsFunc - Optional inner GSSP
 * @returns {Function} Complete GSSP with auth + subscription
 */
export function withAuthAndSubscription(getServerSidePropsFunc) {
  return async (ctx) => {
    // Import here to avoid circular dependency
    const { withAuth } = await import('./withAuth');

    // First run withAuth check
    const authResult = await withAuth(null)(ctx);

    // If auth redirect, return it
    if (authResult.redirect) {
      return authResult;
    }

    const { user, store } = authResult.props;

    // If no store, redirect to dashboard
    if (!store) {
      return {
        redirect: {
          destination: '/dashboard',
          permanent: false,
        },
      };
    }

    // Now check subscription
    try {
      const supabase = createServerSupabaseClient(ctx);

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const subscriptionStatus = getSubscriptionStatus(subscription);

      // If no active subscription, redirect to pricing
      if (!subscriptionStatus.isActive) {
        return {
          redirect: {
            destination: '/dashboard/pricing',
            permanent: false,
          },
        };
      }

      // Run additional GSSP if provided
      let extraProps = {};
      if (getServerSidePropsFunc) {
        const result = await getServerSidePropsFunc(ctx);
        extraProps = result?.props || {};
      }

      return {
        props: {
          ...authResult.props,
          subscription: subscriptionStatus,
          ...extraProps,
        },
      };
    } catch (error) {
      console.error('Subscription check error:', error);
      return {
        redirect: {
          destination: '/dashboard/pricing',
          permanent: false,
        },
      };
    }
  };
}

/**
 * Wrapper that provides subscription data without redirecting
 * Allows component to display overlay if subscription is inactive
 * @param {Function} getServerSidePropsFunc - Optional inner GSSP
 * @returns {Function} Complete GSSP with auth + subscription data (no redirect)
 */
export function withAuthAndSubscriptionData(getServerSidePropsFunc) {
  return async (ctx) => {
    // Import here to avoid circular dependency
    const { withAuth } = await import('./withAuth');

    // First run withAuth check
    const authResult = await withAuth(null)(ctx);

    // If auth redirect, return it
    if (authResult.redirect) {
      return authResult;
    }

    const { user, store } = authResult.props;

    // If no store, redirect to dashboard
    if (!store) {
      return {
        redirect: {
          destination: '/dashboard',
          permanent: false,
        },
      };
    }

    // Fetch subscription data but don't redirect if inactive
    try {
      const supabase = createServerSupabaseClient(ctx);

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const subscriptionStatus = getSubscriptionStatus(subscription);

      // Run additional GSSP if provided
      let extraProps = {};
      if (getServerSidePropsFunc) {
        const result = await getServerSidePropsFunc(ctx);
        extraProps = result?.props || {};
      }

      // Always return subscription data, component decides what to do
      return {
        props: {
          ...authResult.props,
          subscription: subscriptionStatus,
          hasActiveSubscription: subscriptionStatus.isActive,
          ...extraProps,
        },
      };
    } catch (error) {
      console.error('Subscription data fetch error:', error);
      // Return safe subscription data on error
      return {
        props: {
          ...authResult.props,
          subscription: { isActive: false },
          hasActiveSubscription: false,
        },
      };
    }
  };
}
