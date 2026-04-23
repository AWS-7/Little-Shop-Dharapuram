/**
 * Flash Sale System - Database Operations
 * Dynamic flash sale management with countdown timer
 */

import { supabase } from './supabase';

/**
 * Get the currently active flash sale
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getActiveFlashSale() {
  try {
    console.log('🔍 Fetching active flash sale...');
    // Simple query first - just get active sales
    const { data, error } = await supabase
      .from('flash_sales')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      // PGRST116 = no rows returned (OK - no active sale)
      // 406 = table/column issue (OK - flash sales not set up)
      if (error.code === 'PGRST116' || error.status === 406 || error.status === 400) {
        console.log('ℹ️ No flash sale found or table not set up');
        return { data: null, error: null };
      }
      console.error('❌ Error fetching active flash sale:', error);
      return { data: null, error };
    }

    // No active sale
    if (!data || data.length === 0) {
      console.log('ℹ️ No active flash sale found');
      return { data: null, error: null };
    }

    const sale = data[0];
    console.log('✅ Flash sale found:', sale.product_name, 'Ends:', sale.end_time);

    // Check if sale has expired
    if (sale.end_time && new Date(sale.end_time) <= new Date()) {
      console.log('⏰ Flash sale expired, deactivating...');
      // Auto-deactivate
      await deactivateFlashSale(sale.id);
      return { data: null, error: null };
    }

    return { data: sale, error: null };
  } catch (e) {
    console.error('❌ Exception fetching flash sale:', e);
    return { data: null, error: null };
  }
}

/**
 * Create a new flash sale
 * @param {Object} flashSale - Flash sale data
 * @param {string} flashSale.productId - Product ID
 * @param {string} flashSale.productName - Product name
 * @param {string} flashSale.productImage - Product image URL
 * @param {number} flashSale.originalPrice - Original price
 * @param {number} flashSale.discountedPrice - Discounted price
 * @param {string} flashSale.endTime - ISO timestamp for end time
 * @param {string} flashSale.bannerText - Banner text message
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createFlashSale({
  productId,
  productName,
  productImage,
  originalPrice,
  discountedPrice,
  endTime,
  bannerText = 'Flash Sale! Limited Time Offer',
  customImage = null
}) {
  try {
    // Use custom image if provided, otherwise use product image
    const finalImage = customImage || productImage;
    
    // Debug logging
    console.log('💾 Saving Flash Sale to DB:', {
      productId,
      productName,
      productImage: finalImage,
      originalPrice,
      discountedPrice,
      isCustomImage: !!customImage
    });
    
    // First, deactivate any existing active sales
    await supabase
      .from('flash_sales')
      .update({ is_active: false })
      .eq('is_active', true);

    // Create new flash sale
    const { data, error } = await supabase
      .from('flash_sales')
      .insert([{
        product_id: productId,
        product_name: productName,
        product_image: finalImage,
        original_price: originalPrice,
        discounted_price: discountedPrice,
        end_time: endTime,
        banner_text: bannerText,
        is_active: true
      }])
      .select();

    if (error) {
      console.error('❌ Error creating flash sale:', error);
      // Check for RLS policy error
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        return { data: null, error: { message: 'Database permission denied. Please disable RLS for flash_sales table in Supabase.' } };
      }
      return { data: null, error };
    }
    
    console.log('✅ Flash Sale saved:', data);

    // Return first item from array
    return { data: data?.[0] || null, error: null };
  } catch (e) {
    console.error('Exception creating flash sale:', e);
    return { data: null, error: e };
  }
}

/**
 * Update an existing flash sale
 * @param {string} id - Flash sale ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateFlashSale(id, updates) {
  try {
    const { data, error } = await supabase
      .from('flash_sales')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating flash sale:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (e) {
    console.error('Exception updating flash sale:', e);
    return { data: null, error: e };
  }
}

/**
 * Deactivate a flash sale
 * @param {string} id - Flash sale ID
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deactivateFlashSale(id) {
  try {
    const { error } = await supabase
      .from('flash_sales')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deactivating flash sale:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (e) {
    console.error('Exception deactivating flash sale:', e);
    return { success: false, error: e };
  }
}

/**
 * Toggle flash sale on/off
 * @param {string} id - Flash sale ID
 * @param {boolean} isActive - New active status
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function toggleFlashSale(id, isActive) {
  try {
    if (isActive) {
      // Deactivate all other sales first
      await supabase
        .from('flash_sales')
        .update({ is_active: false })
        .eq('is_active', true);
    }

    const { data, error } = await supabase
      .from('flash_sales')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling flash sale:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (e) {
    console.error('Exception toggling flash sale:', e);
    return { data: null, error: e };
  }
}

/**
 * Get all flash sales (admin view)
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getAllFlashSales() {
  try {
    const { data, error } = await supabase
      .from('flash_sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching flash sales:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (e) {
    console.error('Exception fetching flash sales:', e);
    return { data: [], error: e };
  }
}

/**
 * Delete a flash sale
 * @param {string} id - Flash sale ID
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deleteFlashSale(id) {
  try {
    const { error } = await supabase
      .from('flash_sales')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting flash sale:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (e) {
    console.error('Exception deleting flash sale:', e);
    return { success: false, error: e };
  }
}

/**
 * Calculate time remaining for countdown
 * @param {string} endTime - ISO timestamp
 * @returns {Object|null} {hours, minutes, seconds, totalMilliseconds}
 */
export function calculateTimeRemaining(endTime) {
  const end = new Date(endTime).getTime();
  const now = new Date().getTime();
  const diff = end - now;

  if (diff <= 0) {
    return null; // Sale expired
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    hours,
    minutes,
    seconds,
    totalMilliseconds: diff
  };
}

/**
 * Subscribe to flash sale changes (real-time)
 * @param {Function} callback - Callback function
 * @returns {Object} Subscription channel
 */
export function subscribeToFlashSales(callback) {
  const channel = supabase
    .channel('flash-sales-realtime')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'flash_sales'
    }, (payload) => {
      callback(payload);
    })
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        // Table doesn't exist - silently ignore
        console.log('Flash sales real-time not available (table may not exist)');
        return;
      }
      console.log('Flash sales subscription:', status);
    });

  return channel;
}
