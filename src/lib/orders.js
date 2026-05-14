// MIGRATED: Using new backend API instead of Supabase
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

import { completeReferral, checkUserReferralStatus } from './referrals';
import { createReferralRewardCoupon } from './coupons';
import { sendOrderStatusNotification, sendAdminOrderNotification, isWhatsAppConfigured } from './whatsapp';

// Helper to get auth token
async function getAuthToken() {
  return localStorage.getItem('authToken')
    || localStorage.getItem('adminToken')
    || localStorage.getItem('firebase_auth_token')
    || null;
}

// ── Create Order ──
export async function createOrder(orderData) {
  try {
    // Validate stock availability before creating order
    const items = orderData.items || [];
    for (const item of items) {
      // Check stock via backend API
      const response = await fetch(`${API_URL}/products/${item.id}`);
      const result = await response.json();
      
      if (!result.success || !result.data) {
        return { data: null, error: { message: `Product ${item.name} not found` } };
      }
      
      const product = result.data;

      if (product.stock_quantity < item.quantity) {
        return {
          data: null,
          error: {
            message: `Insufficient stock for "${item.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}`
          }
        };
      }
    }

    // All stock validated - proceed with order creation
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    if (!result.success) {
      return { data: null, error: new Error(result.message) };
    }
    
    const data = result.data;

    // Deduct inventory for each item
    for (const item of items) {
      // Get current stock via API
      const prodResponse = await fetch(`${API_URL}/products/${item.id}`);
      const prodResult = await prodResponse.json();

      if (prodResult.data) {
        const newStockCount = Math.max(0, prodResult.data.stock_quantity - item.quantity);
        // Update stock via API
        const updateResponse = await fetch(`${API_URL}/products/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ stock_quantity: newStockCount })
        });

        if (!updateResponse.ok) {
          console.error(`Failed to deduct stock for product ${item.id}`);
        }
      }
    }

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
    // Check if user has any previous orders via API
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/orders/user/${userId}`);
    const result = await response.json();
    
    const previousOrders = result.data || [];
    
    if (previousOrders.length > 0) {
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
      await fetch(`${API_URL}/referrals/${referral.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reward_claimed: true, reward_coupon_id: coupon?.id })
      });
    }
  } catch (err) {
    console.error('Error processing referral reward:', err);
    // Don't block order creation if referral reward fails
  }
}

// ── Get Orders for logged-in user ──
export async function getUserOrders(userId) {
  try {
    console.log('🔍 Fetching orders for userId:', userId);
    const response = await fetch(`${API_URL}/orders/user/${userId}`);
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Error fetching orders:', result.message);
    } else {
      console.log('✅ Orders fetched:', result.data?.length || 0, 'orders found');
    }
    
    return { data: data || [], error };
  } catch (e) {
    console.error('❌ Exception fetching orders:', e);
    return { data: [], error: e };
  }
}

// ── Get single order by ID (admin or user) ──
export async function getOrderById(orderId) {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`);
    const result = await response.json();
    return { data: result.data, error: result.success ? null : new Error(result.message) };
  } catch (e) {
    return { data: null, error: e };
  }
}

// ── Get ALL orders (admin) ──
export async function getAllOrders() {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();
    return { data: result.data || [], error: result.success ? null : new Error(result.message) };
  } catch (e) {
    return { data: [], error: e };
  }
}

// ── Update order status (admin) ──
export async function updateOrderStatus(orderId, status) {
  try {
    console.log(`Updating order ${orderId} → status: ${status}`);
    
    // Get current order data before updating
    const getResponse = await fetch(`${API_URL}/orders/${orderId}`);
    const getResult = await getResponse.json();
    const currentOrder = getResult.data;
    
    // Update via API
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    
    const result = await response.json();
    if (!result.success) {
      console.error('Order status update failed:', result.message);
      return { data: null, error: new Error(result.message) };
    }
    
    console.log('Order status updated:', result.data);
    
    // Send WhatsApp notification for important status changes
    const updatedOrder = result.data;
    const previousStatus = currentOrder?.status;
    
    // Trigger notification on status change to 'paid' (order confirmed)
    if (status === 'paid' && previousStatus !== 'paid') {
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
    
    return { data: result.data, error: null };
  } catch (e) {
    console.error('Order status update exception:', e);
    return { data: null, error: e };
  }
}

// ── Update order tracking ID (admin) ──
export async function updateOrderTrackingId(orderId, trackingId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/orders/${orderId}/tracking`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ courier_tracking_id: trackingId })
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { data: result.data, error: null };
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
// NOTE: Realtime not available with REST API - use polling instead
export function subscribeToOrders(callback) {
  console.log('⚠️ Realtime subscriptions not available with REST API');
  return {
    unsubscribe: () => {}
  };
}

// ── Subscribe to single order (client tracking) ──
export function subscribeToOrder(orderId, callback) {
  console.log('⚠️ Realtime subscriptions not available with REST API');
  return {
    unsubscribe: () => {}
  };
}

// ── Delete Order ──
export async function deleteOrder(orderId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to delete order');
    return { success: true, error: null };
  } catch (e) {
    console.error('Delete exception:', e);
    return { success: false, error: e };
  }
}

// ── Reset All Orders (Delete all order data) ──
export async function resetAllOrders() {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/orders/reset`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to reset orders');
    return { success: true, error: null };
  } catch (e) {
    console.error('Reset orders exception:', e);
    return { success: false, error: e };
  }
}
