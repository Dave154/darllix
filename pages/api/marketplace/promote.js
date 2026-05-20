import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reference, postId, days } = req.body;

  if (!reference || !postId || !days) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Securely verify the transaction with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackRes.json();

    // 2. Ensure the payment was actually successful
    if (!paystackData.status || paystackData.data.status !== 'success') {
      console.error("Paystack verification failed:", paystackData);
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // 3. Calculate the exact expiration date based on the plan they bought
    const promotedUntil = new Date();
    promotedUntil.setDate(promotedUntil.getDate() + parseInt(days));

    // 4. Update the post in Supabase
    const { data: updatedPost, error: updateError } = await supabase
      .from('marketplace_posts')
      .update({
        is_promoted: true,
        promoted_until: promotedUntil.toISOString(),
      })
      .eq('id', postId)
      .select()
      .single();

    if (updateError) {
      console.error("Supabase update error:", updateError);
      throw updateError;
    }

    return res.status(200).json({ success: true, post: updatedPost });

  } catch (error) {
    console.error('Promotion Server Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}