export async function handlePostPromotion(supabaseAdmin, metadata) {
    const { postId, planDays } = metadata;
    
    const promotedUntil = new Date();
    promotedUntil.setDate(promotedUntil.getDate() + parseInt(planDays));
  
    const { error } = await supabaseAdmin
      .from('marketplace_posts')
      .update({
        is_promoted: true,
        promoted_until: promotedUntil.toISOString(),
      })
      .eq('id', postId);
  
    if (error) {
      console.error("Promotion Webhook Error:", error);
      throw error;
    }
    
    console.log(`Successfully promoted post ${postId}`);
  }
  
  export async function handleProductOrder(supabaseAdmin, metadata) {
    const { orderId } = metadata;
    
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*, stores(store_email)')
      .eq('id', orderId)
      .single();
  
    if (fetchError || !order) throw fetchError;
  
    // Prevent duplicate webhook processing/emails
    if (order.meta?.receipt_sent) return; 
  
    const origin = process.env.NEXT_PUBLIC_BASE_URL || 'https://darllix.shop';
    const buyerEmail = order.meta?.buyer_email;
    const storeEmail = order.stores?.store_email;
  
    // Send Buyer Receipt
    if (buyerEmail) {
      await fetch(`${origin}/api/emails/order-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientType: "buyer",
          to_email: buyerEmail,
          buyer_name: order.buyer_name,
          order_id: orderId,
          order_amount: order.total,
        }),
      }).catch(console.error);
    }
  
    // Send Seller Notification
    if (storeEmail) {
      await fetch(`${origin}/api/emails/order-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientType: "seller",
          to_email: storeEmail,
          buyer_name: order.buyer_name,
          order_id: orderId,
          order_amount: order.total, 
        }),
      }).catch(console.error);
    }
  
    // Update order status and flag receipt as sent
    await supabaseAdmin
      .from('orders')
      .update({ 
        payment_status: 'paid', 
        status: 'processing',
        payment_verified: true,
        meta: { ...order.meta, receipt_sent: true },
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
  }