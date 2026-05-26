import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { handlePostPromotion, handleProductOrder, handleSubscriptionPayment } from '../../../lib/paymentHandlers';


export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-paystack-signature'];

    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid Paystack signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody);

    res.status(200).json({ received: true });

    if (event.event === 'charge.success') {
      const { metadata } = event.data;

      if (!metadata || !metadata.type) {
        console.error('Webhook received without metadata.type');
        return;
      }

      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      switch (metadata.type) {
        case 'post_promotion':
          await handlePostPromotion(supabaseAdmin, metadata);
          break;
        case 'product_order':
          await handleProductOrder(supabaseAdmin, metadata);
          break;
        case 'subscription':
          await handleSubscriptionPayment(supabaseAdmin, metadata);
          break;
        default:
          console.log(`Unhandled payment type: ${metadata.type}`);
          break;
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
}