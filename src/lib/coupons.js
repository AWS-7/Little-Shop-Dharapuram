// MIGRATED: Using new backend API instead of Supabase
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Helper to get auth token
async function getAuthToken() {
  const token = localStorage.getItem('authToken');
  return token;
}

// Create a reward coupon for referrer
export async function createReferralRewardCoupon(userId, referredUserName) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/coupons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'referral_reward',
        discount_amount: 100,
        description: `₹100 off referral reward for inviting ${referredUserName || 'a friend'}`
      })
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { data: result.data, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

// Get user's coupons
export async function getUserCoupons(userId, options = {}) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/coupons/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { data: result.data || [], error: null };
  } catch (e) {
    return { data: [], error: e };
  }
}

// Validate a coupon code
export async function validateCoupon(code, userId, orderAmount) {
  try {
    const response = await fetch(`${API_URL}/coupons/validate/${code.toUpperCase()}`);
    const result = await response.json();

    if (!result.success || !result.data) {
      return { valid: false, message: 'Invalid coupon code', discount: 0 };
    }

    const coupon = result.data;

    // Check if coupon is expired
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return { valid: false, message: 'Coupon has expired', discount: 0 };
    }

    // Check if minimum order amount is met
    if (coupon.min_order_amount && orderAmount < coupon.min_order_amount) {
      return {
        valid: false,
        message: `Minimum order amount of ₹${coupon.min_order_amount} required`,
        discount: 0
      };
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_percent) {
      discount = Math.round((orderAmount * coupon.discount_percent) / 100);
      if (coupon.max_discount) {
        discount = Math.min(discount, coupon.max_discount);
      }
    } else if (coupon.discount_amount) {
      discount = coupon.discount_amount;
    }

    return {
      valid: true,
      message: 'Coupon applied successfully',
      discount,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type
      }
    };
  } catch (e) {
    return { valid: false, message: 'Error validating coupon', discount: 0 };
  }
}

// Mark coupon as used
export async function markCouponUsed(couponId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/coupons/${couponId}/use`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    return { data: result.data, error: result.success ? null : new Error(result.message) };
  } catch (e) {
    return { data: null, error: e };
  }
}

// Get coupon stats
export async function getCouponStats(userId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/coupons/stats/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();

    if (!result.success) return { stats: null, error: new Error(result.message) };

    const data = result.data || [];
    const totalCoupons = data.length || 0;
    const activeCoupons = data.filter(c => !c.is_used && new Date(c.valid_until) > new Date()).length || 0;
    const usedCoupons = data.filter(c => c.is_used).length || 0;
    const totalSavings = data
      .filter(c => c.is_used)
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
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/coupons`, {
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

// Create new coupon (admin only)
export async function createCoupon(couponData) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/coupons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        code: couponData.code.toUpperCase(),
        discount_percent: couponData.discount_percent,
        usage_limit: couponData.usage_limit,
        usage_count: 0,
        expiry_date: couponData.expiry_date,
        is_active: couponData.is_active ?? true,
      })
    });

    const result = await response.json();

    if (!result.success) {
      console.error('Error creating coupon:', result.message);
      return { data: null, error: new Error(result.message) };
    }

    return { data: result.data, error: null };
  } catch (e) {
    console.error('Exception creating coupon:', e);
    return { data: null, error: e };
  }
}

// Update coupon (admin only)
export async function updateCoupon(couponId, updates) {
  try {
    console.log('Updating coupon:', couponId, updates);
    
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/coupons/${couponId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    const result = await response.json();

    if (!result.success) {
      console.error('Error updating coupon:', result.message);
      return { data: null, error: new Error(result.message) };
    }

    return { data: result.data, error: null };
  } catch (e) {
    console.error('Exception updating coupon:', e);
    return { data: null, error: e };
  }
}

// Delete coupon (admin only)
export async function deleteCoupon(couponId) {
  try {
    console.log('Deleting coupon:', couponId);
    
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/coupons/${couponId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to delete coupon');

    return { success: true, error: null };
  } catch (e) {
    console.error('Exception deleting coupon:', e);
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
    const response = await fetch(`${API_URL}/coupons/validate/${code.toUpperCase()}`);
    const result = await response.json();

    if (!result.success || !result.data) {
      return { 
        valid: false, 
        message: 'Invalid coupon code',
        discount_percent: 0 
      };
    }

    const coupon = result.data;

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
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
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
    const response = await fetch(`${API_URL}/coupons/apply/${code.toUpperCase()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();

    if (!result.success) {
      console.error('Coupon validation error:', result.message);
      return { applied: false, error: result.message, discount: 0 };

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
