import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { SUBSCRIPTION_PLANS } from '../../../lib/subscriptionConfig';
import { calcSubscriptionEndDate } from '../../../lib/subscriptionUtils';
import { sendEmail } from '../../../lib/sendEmail';

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
    const { reference, subscriptionId } = req.body;

    if (!reference) {
      return res.status(400).json({ error: 'Payment reference is required' });
    }

    // Fetch subscription record
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', session.user.id)
      .single();

    if (subError || !subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Verify with Paystack
    try {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const paymentData = await response.json();

      // Check if payment was successful
      if (!paymentData.status || paymentData.data.status !== 'success') {
        // Update subscription status to failed
        await supabase
          .from('subscriptions')
          .update({ status: 'failed' })
          .eq('id', subscriptionId);

        return res.status(400).json({
          error: 'Payment verification failed',
          reference,
        });
      }

      const plan = SUBSCRIPTION_PLANS[subscription.plan_type];
      const endDate = calcSubscriptionEndDate(subscription.plan_type);

      // Update subscription record
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          amount_paid: paymentData.data.amount / 100, // Convert from kobo to naira
          payment_reference: reference,
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
        })
        .eq('id', subscriptionId);

      if (updateError) {
        console.error('Subscription update error:', updateError);
        return res.status(500).json({ error: 'Failed to update subscription' });
      }

      // Update store subscription status
      await supabase
        .from('stores')
        .update({
          is_active_subscription: true,
          subscription_status: 'active',
          subscription_id: subscriptionId,
        })
        .eq('id', subscription.store_id);

      // Update profile subscription status
      await supabase
        .from('profiles')
        .update({
          has_active_subscription: true,
          subscription_end_date: endDate.toISOString(),
        })
        .eq('id', session.user.id);

      // Send confirmation email
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', session.user.id)
          .single();

        const { data: store } = await supabase
          .from('stores')
          .select('name')
          .eq('id', subscription.store_id)
          .single();

        if (profile?.email) {
          await sendEmail({
            to: profile.email,
            subject: '✅ Subscription Payment Confirmed',
            template: 'subscription-confirmation',
            data: {
              name: profile.full_name || 'Vendor',
              storeName: store?.name || 'Your Store',
              planName: plan.name,
              amount: `₦${subscription.amount_paid.toLocaleString()}`,
              startDate: new Date().toLocaleDateString('en-NG'),
              endDate: endDate.toLocaleDateString('en-NG'),
              reference,
            },
          });
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the entire request if email fails
      }

      return res.status(200).json({
        success: true,
        message: 'Subscription activated successfully',
        subscription: {
          id: subscriptionId,
          reference,
          planType: subscription.plan_type,
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: endDate.toISOString(),
        },
      });
    } catch (paystackError) {
      console.error('Paystack verification error:', paystackError);
      return res.status(500).json({
        error: 'Payment verification failed',
        details: paystackError.message,
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
