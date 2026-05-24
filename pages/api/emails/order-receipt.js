import { sendEmail } from '../../../lib/sendEmail'; // Your reusable Resend utility

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { recipientType, to_email, buyer_name, order_id, order_amount } = req.body;

  try {
    let subject = '';
    let htmlContent = '';

    if (recipientType === 'buyer') {
      subject = `Order Confirmation: #${order_id}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Thank you for your order, ${buyer_name}!</h2>
          <p>Your payment of <strong>₦${order_amount.toLocaleString()}</strong> was successful.</p>
          <p>Order ID: ${order_id}</p>
        </div>
      `;
    } else if (recipientType === 'seller') {
      subject = `🎉 New Order Received! (#${order_id})`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>You made a sale!</h2>
          <p><strong>${buyer_name}</strong> just placed an order for <strong>₦${order_amount.toLocaleString()}</strong>.</p>
          <p>Log in to your Darllix dashboard to view the order details.</p>
        </div>
      `;
    }

    await sendEmail({
      to: to_email,
      subject: subject,
      html: htmlContent
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}