import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { v4 as uuidv4 } from 'uuid';
import { SUBSCRIPTION_PLANS } from '../../../lib/subscriptionConfig';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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
    const { planType, storeId } = req.body;

    if (!planType || !SUBSCRIPTION_PLANS[planType]) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    if (!storeId) {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, owner_id')
        .eq('id', storeId)
        .eq('owner_id', session.user.id)
        .single();

    if (storeError || !store) {
      return res.status(403).json({ error: 'Store not found or unauthorized' });
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', session.user.id)
        .single();

    if (profileError) {
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    const plan = SUBSCRIPTION_PLANS[planType];
    const paymentReference = `SUB-${Date.now()}-${uuidv4().substring(0, 8)}`;

    const { data: payment, error: paymentError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: session.user.id,
          store_id: storeId,
          plan_type: planType,
          status: 'pending',
          amount_paid: plan.price_naira,
          payment_provider: 'paystack',
          payment_reference: paymentReference,
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
        })
        .select()
        .single();

    if (paymentError) {
      return res.status(500).json({ error: 'Failed to create payment record' });
    }

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: profile.email || session.user.email,
        amount: plan.price_kobo,
        reference: paymentReference,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/subscription-success`,
        metadata: {
          userId: session.user.id,
          storeId: storeId,
          planType: planType,
          subscriptionId: payment.id,
          type: 'subscription',
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      return res.status(400).json({ error: 'Paystack initialization failed' });
    }

    return res.status(200).json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}