const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Helper to get auth token
async function getAuthToken() {
  const token = localStorage.getItem('authToken');
  return token;
}

// Generate a unique referral code
export function generateReferralCode(userId) {
  // Create a 8-character code from userId + random chars
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const userPart = userId.substring(0, 4).toUpperCase();
  return `LS${userPart}${randomPart}`;
}

// Get or create referral code for a user
export async function getOrCreateReferralCode(userId) {
  // Skip if userId is not valid UUID (Firebase UID issue)
  if (!userId || userId.length > 36) {
    return { code: null, error: null };
  }
    try {
    // Check if user already has a referral code via backend
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    const profile = result.data;

    if (profile?.referral_code) {
      return { code: profile.referral_code, error: null };
    }

    // Generate new code
    const code = generateReferralCode(userId);

    // Update profile with referral code via backend
    const updateResponse = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ referral_code: code })
    });

    if (!updateResponse.ok) {
      console.error('Error saving referral code');
      return { code: null, error: new Error('Failed to save referral code') };
    }

    return { code, error: null };
  } catch (e) {
    return { code: null, error: e };
  }
}

// Validate a referral code
export async function validateReferralCode(code) {
  if (!code) return { valid: false, referrerId: null };
  
  try {
    const response = await fetch(`${API_URL}/referrals/validate/${code.toUpperCase()}`);
    const result = await response.json();
    
    if (!result.success || !result.data) {
      return { valid: false, referrerId: null, error: new Error('Invalid code') };
    }

    return { valid: true, referrerId: result.data.id, error: null };
  } catch (e) {
    return { valid: false, referrerId: null, error: e };
  }
}

// Record a referral
export async function recordReferral(referredUserId, referrerId, referralCode) {
  // Skip if IDs are not valid UUID (Firebase UID issue)
  if (!referredUserId || referredUserId.length > 36 || !referrerId || referrerId.length > 36) {
    return { data: null, error: null };
  }
  
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/referrals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        referred_user_id: referredUserId,
        referrer_id: referrerId,
        referral_code: referralCode.toUpperCase()
      })
    });
    
    const result = await response.json();
    return { data: result.data, error: result.success ? null : new Error(result.message) };
  } catch (e) {
    // Silently return for UUID errors
    if (e?.code === '22P02') return { data: null, error: null };
    return { data: null, error: e };
  }
}

// Get referral stats for a user
export async function getReferralStats(userId) {
  // Skip if userId is not valid UUID (Firebase UID issue)
  if (!userId || userId.length > 36) {
    return { total: 0, successful: 0, pending: 0, earned: 0, error: null };
  }
  
  try {
    // Get total referrals
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/referrals/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    if (!result.success) {
      console.error('Error fetching referrals:', result.message);
      return { total: 0, successful: 0, pending: 0, earned: 0, error: new Error(result.message) };
    }
    
    const referrals = result.data || [];

    const totalReferrals = referrals?.length || 0;
    const successfulReferrals = referrals?.filter(r => r.status === 'completed').length || 0;
    const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0;
    const totalRewards = successfulReferrals * 100; // ₹100 per successful referral

    return {
      stats: {
        totalReferrals,
        successfulReferrals,
        pendingReferrals,
        totalRewards,
      },
      referrals: referrals || [],
      error: null,
    };
  } catch (e) {
    return { stats: null, referrals: [], error: e };
  }
}

// Mark referral as completed (when referred user makes first purchase)
export async function completeReferral(referredUserId) {
  try {
    // Find and update referral record
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/referrals/complete/${referredUserId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    if (!result.success) {
      return { success: false, error: new Error(result.message) };
    }

    return { 
      success: true, 
      referrerId: referral.referrer_id,
      error: null 
    };
  } catch (e) {
    return { success: false, error: e };
  }
}

// Check if user was referred
export async function checkUserReferralStatus(userId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/referrals/status/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    return { 
      wasReferred: !!result.data, 
      referral: result.data,
      error: result.success ? null : new Error(result.message)
    };
  } catch (e) {
    return { wasReferred: false, referral: null, error: e };
  }
}
