import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { v4 as uuidv4 } from 'uuid';
import { SUBSCRIPTION_PLANS } from '../../../lib/subscriptionConfig';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Initialize Supabase client with auth context
  const supabase = createServerSupabaseClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { planType, storeId } = req.body;

    // Validate inputs
    if (!planType || !SUBSCRIPTION_PLANS[planType]) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    if (!storeId) {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    // Verify store ownership
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, user_id')
      .eq('id', storeId)
      .eq('user_id', session.user.id)
      .single();

    if (storeError || !store) {
      return res.status(403).json({ error: 'Store not found or unauthorized' });
    }

    // Get user profile for email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    const plan = SUBSCRIPTION_PLANS[planType];
    const paymentReference = `SUB-${Date.now()}-${uuidv4().substring(0, 8)}`;

    // Create payment record in DB
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
        // end_date will be set after payment verification
        end_date: new Date().toISOString(), // Placeholder
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment record creation error:', paymentError);
      return res.status(500).json({ error: 'Failed to create payment record' });
    }

    // Build Paystack config
    const paystackConfig = {
      reference: paymentReference,
      email: profile.email || session.user.email,
      amount: plan.price_kobo, // Amount in kobo
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
      metadata: {
        userId: session.user.id,
        storeId: storeId,
        planType: planType,
        subscriptionId: payment.id,
        type: 'subscription', // CRITICAL: Routes to webhook handler
      },
    };

    return res.status(200).json({
      success: true,
      paymentReference,
      paystackConfig,
      subscription: {
        id: payment.id,
        planType,
        amount: plan.price_naira,
        currency: 'NGN',
      },
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
