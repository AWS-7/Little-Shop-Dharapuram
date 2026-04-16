import { supabase } from './supabase';

// Create a reward coupon for referrer
export async function createReferralRewardCoupon(userId, referredUserName) {
  try {
    // Generate unique coupon code
    const couponCode = `REF${Date.now().toString(36).toUpperCase().slice(-6)}`;
    
    const { data, error } = await supabase
      .from('coupons')
      .insert([{
        code: couponCode,
        user_id: userId,
        type: 'referral_reward',
        discount_amount: 100, // ₹100
        discount_percent: null,
        min_order_amount: 0,
        max_discount: 100,
        description: `₹100 off referral reward for inviting ${referredUserName || 'a friend'}`,
        is_used: false,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days valid
        usage_limit: 1,
        usage_count: 0,
      }])
      .select()
      .single();

    return { data, error };
  } catch (e) {
    return { data: null, error: e };
  }
}

// Get user's coupons
export async function getUserCoupons(userId, options = {}) {
  try {
    const { onlyActive = true } = options;
    
    let query = supabase
      .from('coupons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (onlyActive) {
      query = query
        .eq('is_used', false)
        .gte('valid_until', new Date().toISOString());
    }

    const { data, error } = await query;

    return { data: data || [], error };
  } catch (e) {
    return { data: [], error: e };
  }
}

// Validate a coupon code
export async function validateCoupon(code, userId, orderAmount) {
  try {
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('user_id', userId)
      .single();

    if (error || !coupon) {
      return { valid: false, message: 'Invalid coupon code', discount: 0 };
    }

    if (coupon.is_used) {
      return { valid: false, message: 'Coupon already used', discount: 0 };
    }

    if (new Date(coupon.valid_until) < new Date()) {
      return { valid: false, message: 'Coupon has expired', discount: 0 };
    }

    if (orderAmount < coupon.min_order_amount) {
      return { 
        valid: false, 
        message: `Minimum order amount of ₹${coupon.min_order_amount} required`,
        discount: 0 
      };
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_amount) {
      discount = Math.min(coupon.discount_amount, orderAmount);
    } else if (coupon.discount_percent) {
      discount = Math.min(
        (orderAmount * coupon.discount_percent) / 100,
        coupon.max_discount || Infinity
      );
    }

    return { 
      valid: true, 
      message: 'Coupon applied successfully',
      discount,
      coupon 
    };
  } catch (e) {
    return { valid: false, message: 'Error validating coupon', discount: 0 };
  }
}

// Mark coupon as used
export async function markCouponUsed(couponId) {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .update({ 
        is_used: true,
        usage_count: 1,
        used_at: new Date().toISOString(),
      })
      .eq('id', couponId)
      .select()
      .single();

    return { data, error };
  } catch (e) {
    return { data: null, error: e };
  }
}

// Get coupon stats
export async function getCouponStats(userId) {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('user_id', userId);

    if (error) return { stats: null, error };

    const totalCoupons = data?.length || 0;
    const activeCoupons = data?.filter(c => !c.is_used && new Date(c.valid_until) > new Date()).length || 0;
    const usedCoupons = data?.filter(c => c.is_used).length || 0;
    const totalSavings = data
      ?.filter(c => c.is_used)
      .reduce((sum, c) => sum + (c.discount_amount || 0), 0) || 0;

    return {
      stats: {
        totalCoupons,
        activeCoupons,
        usedCoupons,
        totalSavings,
      },
      error: null,
    };
  } catch (e) {
    return { stats: null, error: e };
  }
}
