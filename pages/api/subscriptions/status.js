import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { getSubscriptionStatus, formatSubscriptionInfo } from '../../../lib/subscriptionUtils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { storeId } = req.query;

    // If storeId provided, verify ownership
    if (storeId) {
      const { data: store } = await supabase
        .from('stores')
        .select('id, user_id')
        .eq('id', storeId)
        .eq('user_id', session.user.id)
        .single();

      if (!store) {
        return res.status(403).json({ error: 'Store not found or unauthorized' });
      }
    }

    // Fetch active subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Subscription fetch error:', subError);
      return res.status(500).json({ error: 'Failed to fetch subscription' });
    }

    const statusInfo = getSubscriptionStatus(subscription);
    const formattedInfo = formatSubscriptionInfo(subscription);

    return res.status(200).json({
      success: true,
      subscription: subscription ? {
        id: subscription.id,
        planType: subscription.plan_type,
        status: subscription.status,
        ...statusInfo,
        ...formattedInfo,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        amountPaid: subscription.amount_paid,
        paymentReference: subscription.payment_reference,
      } : null,
      hasActiveSubscription: statusInfo.isActive,
      daysRemaining: statusInfo.daysRemaining,
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
