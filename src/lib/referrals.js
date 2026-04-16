import { supabase } from './supabase';

// Generate a unique referral code
export function generateReferralCode(userId) {
  // Create a 8-character code from userId + random chars
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const userPart = userId.substring(0, 4).toUpperCase();
  return `LS${userPart}${randomPart}`;
}

// Get or create referral code for a user
export async function getOrCreateReferralCode(userId) {
  try {
    // Check if user already has a referral code in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (profile?.referral_code) {
      return { code: profile.referral_code, error: null };
    }

    // Generate new code
    const code = generateReferralCode(userId);

    // Update profile with referral code
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ referral_code: code })
      .eq('id', userId);

    if (updateError) {
      console.error('Error saving referral code:', updateError);
      return { code: null, error: updateError };
    }

    return { code, error: null };
  } catch (e) {
    return { code: null, error: e };
  }
}

// Validate a referral code
export async function validateReferralCode(code) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, referral_code')
      .eq('referral_code', code.toUpperCase())
      .single();

    if (error || !data) {
      return { valid: false, referrerId: null, error: error || new Error('Invalid code') };
    }

    return { valid: true, referrerId: data.id, error: null };
  } catch (e) {
    return { valid: false, referrerId: null, error: e };
  }
}

// Record a referral
export async function recordReferral(referredUserId, referrerId, referralCode) {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .insert([{
        referred_user_id: referredUserId,
        referrer_id: referrerId,
        referral_code: referralCode.toUpperCase(),
        status: 'pending',
        reward_claimed: false,
      }])
      .select()
      .single();

    return { data, error };
  } catch (e) {
    return { data: null, error: e };
  }
}

// Get referral stats for a user
export async function getReferralStats(userId) {
  try {
    // Get total referrals
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);

    if (error) return { stats: null, error };

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
    // Find the referral record
    const { data: referral, error: findError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_user_id', referredUserId)
      .eq('status', 'pending')
      .single();

    if (findError || !referral) {
      return { success: false, error: findError || new Error('No pending referral found') };
    }

    // Update referral status to completed
    const { error: updateError } = await supabase
      .from('referrals')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', referral.id);

    if (updateError) {
      return { success: false, error: updateError };
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
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_user_id', userId)
      .single();

    return { 
      wasReferred: !!data, 
      referral: data,
      error 
    };
  } catch (e) {
    return { wasReferred: false, referral: null, error: e };
  }
}
