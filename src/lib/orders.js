import { supabase } from './supabase';
import { completeReferral, checkUserReferralStatus } from './referrals';
import { createReferralRewardCoupon } from './coupons';
import { sendOrderStatusNotification, sendAdminOrderNotification, isWhatsAppConfigured } from './whatsapp';

// ── Create Order ──
export async function createOrder(orderData) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    // Check if this is user's first order and process referral reward
    if (data && orderData.user_id) {
      await processReferralReward(orderData.user_id, data);
    }

    // Send WhatsApp notification for new orders
    if (data && (data.status === 'paid' || data.status === 'pending')) {
      // 1. Notify Customer
      if (data.customer?.phone) {
        sendWhatsAppNotification(data, data.status).catch(err => {
          console.error('WhatsApp notification failed (non-blocking):', err);
        });
      }

      // 2. Notify Admin
      sendAdminOrderNotification(data).catch(err => {
        console.error('Admin WhatsApp notification failed:', err);
      });
    }

    return { data, error };
  } catch (e) {
    return { data: null, error: e };
  }
}

// ── Process Referral Reward on First Purchase ──
async function processReferralReward(userId, orderData) {
  try {
    // Check if user has any previous orders
    const { data: previousOrders, error: countError } = await supabase
      .from('orders')
      .select('order_id')
      .eq('user_id', userId)
      .lt('created_at', orderData.created_at || new Date().toISOString())
      .limit(1);

    if (countError || (previousOrders && previousOrders.length > 0)) {
      // Not first order, skip referral reward
      return;
    }

    // This is first order - check if user was referred
    const { wasReferred, referral, error: referralError } = await checkUserReferralStatus(userId);

    if (!wasReferred || !referral || referral.reward_claimed) {
      return;
    }

    // Complete the referral and reward the referrer
    const { success, referrerId, error: completeError } = await completeReferral(userId);

    if (success && referrerId) {
      // Create ₹100 reward coupon for referrer
      const referredUserName = orderData.customer?.name || 'a friend';
      const { data: coupon, error: couponError } = await createReferralRewardCoupon(
        referrerId,
        referredUserName
      );

      if (coupon) {
        console.log('Referral reward created:', coupon.code);
      }

      // Mark referral reward as claimed
      await supabase
        .from('referrals')
        .update({ reward_claimed: true, reward_coupon_id: coupon?.id })
        .eq('id', referral.id);
    }
  } catch (err) {
    console.error('Error processing referral reward:', err);
    // Don't block order creation if referral reward fails
  }
}

// ── Get Orders for logged-in user ──
export async function getUserOrders(userId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  } catch (e) {
    return { data: [], error: e };
  }
}

// ── Get single order by ID (admin or user) ──
export async function getOrderById(orderId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .single();
    return { data, error };
  } catch (e) {
    return { data: null, error: e };
  }
}

// ── Get ALL orders (admin) ──
export async function getAllOrders() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  } catch (e) {
    return { data: [], error: e };
  }
}

// ── Update order status (admin) ──
export async function updateOrderStatus(orderId, status) {
  try {
    console.log(`Updating order ${orderId} → status: ${status}`);
    
    // Get current order data before updating (for notification)
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .single();
    
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('order_id', orderId)
      .select();
    
    if (error) {
      console.error('Order status update failed:', error.message, error.details);
      return { data: null, error };
    }
    if (!data || data.length === 0) {
      console.warn(`No order found with order_id: ${orderId} (may be a demo order)`);
      return { data: null, error: null }; // Not a real error, just a demo order
    }
    
    console.log('Order status updated:', data[0]);
    
    // Send WhatsApp notification for important status changes
    const updatedOrder = data[0];
    const previousStatus = currentOrder?.status;
    
    // Trigger notification on status change to 'paid' (order confirmed)
    if (status === 'paid' && previousStatus !== 'paid') {
      // Non-blocking WhatsApp notification
      sendWhatsAppNotification(updatedOrder, 'paid').catch(err => {
        console.error('WhatsApp notification failed (non-blocking):', err);
      });
    }
    
    // Also notify on shipped and delivered
    if ((status === 'shipped' && previousStatus !== 'shipped') || 
        (status === 'delivered' && previousStatus !== 'delivered')) {
      sendWhatsAppNotification(updatedOrder, status).catch(err => {
        console.error('WhatsApp notification failed (non-blocking):', err);
      });
    }
    
    return { data: data[0], error: null };
  } catch (e) {
    console.error('Order status update exception:', e);
    return { data: null, error: e };
  }
}

// ── Update order tracking ID (admin) ──
export async function updateOrderTrackingId(orderId, trackingId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ courier_tracking_id: trackingId })
      .eq('order_id', orderId)
      .select();
    
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

/**
 * Send WhatsApp notification for order status
 * @param {Object} order - Order data
 * @param {string} status - Order status
 */
async function sendWhatsAppNotification(order, status) {
  // Skip if no customer phone
  if (!order?.customer?.phone) {
    console.log('Skipping WhatsApp notification: No phone number');
    return;
  }
  
  // Check if WhatsApp is configured
  if (!isWhatsAppConfigured()) {
    console.log('WhatsApp not configured. Notification would be sent:', {
      to: order.customer.phone,
      orderId: order.order_id,
      status: status
    });
    return;
  }
  
  // Send notification
  const result = await sendOrderStatusNotification(order, status);
  
  if (result.success) {
    console.log(`WhatsApp ${status} notification sent for order ${order.order_id}`);
  } else {
    console.error(`Failed to send WhatsApp ${status} notification:`, result.error);
  }
}

// ── Subscribe to order changes (realtime) ──
export function subscribeToOrders(callback) {
  const channel = supabase
    .channel('orders-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      callback(payload);
    })
    .subscribe((status) => {
      console.log('Orders realtime channel:', status);
    });
  return channel;
}

// ── Subscribe to single order (client tracking) ──
export function subscribeToOrder(orderId, callback) {
  const channel = supabase
    .channel(`order-${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `order_id=eq.${orderId}`,
    }, (payload) => {
      callback(payload.new);
    })
    .subscribe();
  return channel;
}
