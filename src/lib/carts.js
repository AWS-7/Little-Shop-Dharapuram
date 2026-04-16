import { supabase } from './supabase';

// ── Sync cart to Supabase (upsert) ──
export async function syncCartToSupabase(userId, email, name, items, total) {
  try {
    const { data, error } = await supabase
      .from('carts')
      .upsert({
        user_id: userId,
        items,
        total,
        status: items.length > 0 ? 'active' : 'converted',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) console.warn('Cart sync skipped:', error.message);
    return { data, error };
  } catch (e) {
    return { data: null, error: e };
  }
}

// ── Mark cart as converted (after order placed) ──
export async function markCartConverted(userId) {
  try {
    const { error } = await supabase
      .from('carts')
      .update({ status: 'converted', items: [], total: 0 })
      .eq('user_id', userId);
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

    const { data, error } = await supabase
      .from('carts')
      .select('*')
      .eq('status', 'active')
      .gt('total', 0)
      .lt('updated_at', oneMinuteAgo)
      .gt('updated_at', twentyFourHoursAgo)
      .order('updated_at', { ascending: false });

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
    const { data, error } = await supabase
      .from('carts')
      .select('*')
      .eq('status', 'active')
      .gt('total', 0)
      .order('updated_at', { ascending: false });
    return { data: data || [], error };
  } catch (e) {
    return { data: [], error: e };
  }
}

// ── Mark reminder sent ──
export async function markReminderSent(cartId) {
  try {
    const { error } = await supabase
      .from('carts')
      .update({ reminder_sent: true })
      .eq('id', cartId);
    return { error };
  } catch (e) {
    return { error: e };
  }
}

// ── Send abandoned cart reminder email via Supabase Edge Function ──
export async function sendAbandonedCartReminder(cart) {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'abandoned_cart_reminder',
        cart: cart
      }
    });

    if (error) {
      console.error('Edge function error:', error);
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
  const channel = supabase
    .channel('carts-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'carts' }, (payload) => {
      callback(payload);
    })
    .subscribe();
  return channel;
}
