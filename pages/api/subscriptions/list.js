import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { getSubscriptionStatus } from '../../../lib/subscriptionUtils';

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
    const { storeId, limit = 50, offset = 0, status } = req.query;

    let query = supabase
      .from('subscriptions')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id);

    // Filter by store if provided
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

      query = query.eq('store_id', storeId);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const { data: subscriptions, error: subError, count } = await query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (subError) {
      console.error('Subscriptions fetch error:', subError);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    // Enrich with status info
    const enrichedSubscriptions = subscriptions.map((sub) => {
      const statusInfo = getSubscriptionStatus(sub);
      return {
        id: sub.id,
        planType: sub.plan_type,
        storeName: sub.store_name,
        status: sub.status,
        amountPaid: sub.amount_paid,
        paymentReference: sub.payment_reference,
        startDate: sub.start_date,
        endDate: sub.end_date,
        createdAt: sub.created_at,
        ...statusInfo,
      };
    });

    return res.status(200).json({
      success: true,
      subscriptions: enrichedSubscriptions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count,
        hasMore: parseInt(offset) + parseInt(limit) < count,
      },
    });
  } catch (error) {
    console.error('List subscriptions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
