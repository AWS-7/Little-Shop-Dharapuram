import { supabase } from './supabase';

// Create a reward coupon for referrer
export async function createReferralRewardCoupon(userId, referredUserName) {
  // Skip if userId is not valid UUID (Firebase UID issue)
  if (!userId || userId.length > 36) {
    return { data: null, error: null };
  }
  
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

    if (error && error.code === '22P02') {
      return { data: [], error: null };
    }

    if (error) {
      console.error('Error creating coupon:', error);
      return { data: [], error };
    }

    return { data, error };
  } catch (e) {
    return { data: null, error: e };
  }
}

// Get user's coupons
export async function getUserCoupons(userId, options = {}) {
  // Skip if userId is not valid UUID (Firebase UID issue)
  if (!userId || userId.length > 36) {
    return { data: [], error: null };
  }
  
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

// ============================================
// ADMIN COUPON MANAGEMENT FUNCTIONS
// ============================================

// Get all coupons (for admin)
export async function getAllCoupons() {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  } catch (e) {
    return { data: [], error: e };
  }
}

// Create new coupon (admin only)
export async function createCoupon(couponData) {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .insert([{
        code: couponData.code.toUpperCase(),
        discount_percent: couponData.discount_percent,
        usage_limit: couponData.usage_limit,
        used_count: 0,
        expiry_date: couponData.expiry_date,
        is_active: couponData.is_active ?? true,
      }])
      .select()
      .single();

    return { data, error };
  } catch (e) {
    return { data: null, error: e };
  }
}

// Update coupon (admin only)
export async function updateCoupon(couponId, updates) {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', couponId)
      .select()
      .single();

    return { data, error };
  } catch (e) {
    return { data: null, error: e };
  }
}

// Delete coupon (admin only)
export async function deleteCoupon(couponId) {
  try {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId);

    return { success: !error, error };
  } catch (e) {
    return { success: false, error: e };
  }
}

// Toggle coupon active status
export async function toggleCouponStatus(couponId, isActive) {
  return updateCoupon(couponId, { is_active: isActive });
}

// ============================================
// CHECKOUT COUPON VALIDATION
// ============================================

// Validate coupon for checkout (public - no user restriction)
export async function validateCheckoutCoupon(code) {
  try {
    // Check if code exists and is valid
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !coupon) {
      return { 
        valid: false, 
        message: 'Invalid coupon code',
        discount_percent: 0 
      };
    }

    // Check if active
    if (!coupon.is_active) {
      return { 
        valid: false, 
        message: 'Coupon is not active',
        discount_percent: 0 
      };
    }

    // Check expiry
    if (new Date(coupon.expiry_date) < new Date()) {
      return { 
        valid: false, 
        message: 'Coupon has expired',
        discount_percent: 0 
      };
    }

    // Check usage limit
    if (coupon.used_count >= coupon.usage_limit) {
      return { 
        valid: false, 
        message: 'Usage limit reached',
        discount_percent: 0 
      };
    }

    return { 
      valid: true, 
      message: 'Coupon applied successfully!',
      discount_percent: coupon.discount_percent,
      coupon_id: coupon.id,
      code: coupon.code
    };
  } catch (e) {
    return { 
      valid: false, 
      message: 'Error validating coupon',
      discount_percent: 0 
    };
  }
}

// Apply coupon and increment usage count (call this after successful order)
export async function applyCouponAndIncrement(code) {
  try {
    // Use the database function for atomic operation
    const { data, error } = await supabase.rpc('validate_and_use_coupon', {
      coupon_code: code.toUpperCase()
    });

    if (error) {
      // Fallback: manual validation and update
      const validation = await validateCheckoutCoupon(code);
      if (!validation.valid) {
        return { success: false, ...validation };
      }

      // Increment usage count
      const { error: updateError } = await supabase
        .from('coupons')
        .update({ 
          used_count: supabase.raw('used_count + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', validation.coupon_id);

      if (updateError) {
        return { success: false, message: 'Failed to apply coupon' };
      }

      return { success: true, ...validation };
    }

    return { 
      success: data.valid, 
      ...data 
    };
  } catch (e) {
    return { 
      success: false, 
      message: 'Error applying coupon',
      discount_percent: 0 
    };
  }
}

// Calculate discount amount
export function calculateDiscount(totalAmount, discountPercent) {
  return Math.round((totalAmount * discountPercent) / 100);
}
