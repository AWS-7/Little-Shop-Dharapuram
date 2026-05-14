// MIGRATED: Using new backend API instead of Supabase
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Helper to get auth token
async function getAuthToken() {
  return localStorage.getItem('authToken')
    || localStorage.getItem('adminToken')
    || localStorage.getItem('firebase_auth_token')
    || null;
}

// ── Sync cart to backend (upsert) ──
export async function syncCartToBackend(userId, email, name, items, total) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/carts/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: userId,
        items,
        total,
        status: items.length > 0 ? 'active' : 'converted'
      })
    });
    
    const result = await response.json();
    if (!result.success) console.warn('Cart sync skipped:', result.message);
    return { data: result.data, error: result.success ? null : new Error(result.message) };
  } catch (e) {
    return { data: null, error: e };
  }
}

// ── Mark cart as converted (after order placed) ──
export async function markCartConverted(userId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/carts/${userId}/convert`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { error };
  } catch (e) {
    return { error: e };
  }
}

// ── Get abandoned carts (admin) — active carts 1-24 hours old (1 min for demo) ──
export async function getAbandonedCarts() {
  try {
    const now = Date.now();
    const oneMinuteAgo = new Date(now - 1 * 60 * 1000).toISOString(); // 1 min for demo
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/carts/abandoned?since=${twentyFourHoursAgo}&until=${oneMinuteAgo}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();
    const data = result.data || [];

    // Calculate time elapsed for each cart
    const cartsWithTimeElapsed = (data || []).map(cart => {
      const updatedAt = new Date(cart.updated_at).getTime();
      const minutesAgo = Math.round((now - updatedAt) / 60000);
      const timeElapsed = minutesAgo < 60
        ? `${minutesAgo}m ago`
        : minutesAgo < 1440
          ? `${Math.round(minutesAgo / 60)}h ago`
          : `${Math.round(minutesAgo / 1440)}d ago`;

      return {
        ...cart,
        time_elapsed: timeElapsed,
        minutes_ago: minutesAgo,
        total_items: cart.items?.length || 0
      };
    });

    return { data: cartsWithTimeElapsed, error };
  } catch (e) {
    return { data: [], error: e };
  }
}

// ── Get all active carts (admin overview) ──
export async function getAllActiveCarts() {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/carts/active`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();
    const data = result.data || [];
    return { data: data || [], error };
  } catch (e) {
    return { data: [], error: e };
  }
}

// ── Mark reminder sent ──
export async function markReminderSent(cartId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/carts/${cartId}/reminder`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to mark reminder');
    return { error };
  } catch (e) {
    return { error: e };
  }
}

// ── Send abandoned cart reminder email via backend API ──
export async function sendAbandonedCartReminder(cart) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/notifications/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'abandoned_cart_reminder',
        cart: cart
      })
    });
    
    if (!response.ok) {
      console.error('Email notification failed');
      return { success: false, error: error.message };
    }

    console.log('Abandoned cart reminder sent to:', cart.user_email);
    return { success: true, data };
  } catch (error) {
    console.error('Abandoned cart email error:', error);
    return { success: false, error: error.message };
  }
}

// ── Subscribe to cart changes (admin realtime) ──
export function subscribeToCarts(callback) {
  // Realtime not available with REST API
  console.log('⚠️ Realtime subscriptions not available with REST API');
  return {
    unsubscribe: () => {}
  };
}
