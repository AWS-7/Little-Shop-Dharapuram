/**
 * Flash Sale System - Database Operations
 * Dynamic flash sale management with countdown timer
 * MIGRATED: Using new backend API instead of Supabase
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

/**
 * Get the currently active flash sale
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getActiveFlashSale() {
  try {
    console.log('🔍 Fetching active flash sale from backend...');
    
    // Use new backend API
    const response = await fetch(`${API_URL}/flash-sales/active`);
    const result = await response.json();
    
    if (!result.success || !result.data) {
      console.log('ℹ️ No active flash sale found');
      return { data: null, error: null };
    }

    const sale = result.data;
    console.log('✅ Flash sale found:', sale.product_name, 'Ends:', sale.end_time);

    // Check if sale has expired
    if (sale.end_time && new Date(sale.end_time) <= new Date()) {
      console.log('⏰ Flash sale expired, deactivating...');
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
    
    // Create new flash sale via backend
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/flash-sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        product_id: productId,
        product_name: productName,
        original_price: originalPrice,
        sale_price: discountedPrice,
        discount_percent: Math.floor(((originalPrice - discountedPrice) / originalPrice) * 100),
        end_time: endTime,
        is_active: true
      })
    });
    
    const result = await response.json();
    if (!result.success) {
      console.error('❌ Error creating flash sale:', result.message);
      return { data: null, error: new Error(result.message) };
    }

    console.log('✅ Flash sale created:', result.data);
    return { data: result.data, error: null };
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
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/flash-sales/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    
    const result = await response.json();
    if (!result.success) {
      console.error('❌ Error updating flash sale:', result.message);
      return { data: null, error: new Error(result.message) };
    }

    return { data: result.data, error: null };
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
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/flash-sales/${id}/deactivate`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    if (!result.success) {
      console.error('❌ Error deactivating flash sale:', result.message);
      return { error: new Error(result.message) };
    }

    console.log('✅ Flash sale deactivated');
    return { error: null };
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
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/flash-sales/${id}/toggle`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ is_active: isActive })
    });
    
    const result = await response.json();
    if (!result.success) {
      console.error('❌ Error toggling flash sale:', result.message);
      return { data: null, error: new Error(result.message) };
    }

    return { data: result.data, error: null };
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
    const response = await fetch(`${API_URL}/flash-sales`);
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Error fetching flash sales:', result.message);
      return { data: [], error: new Error(result.message) };
    }

    return { data: result.data || [], error: null };
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
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/flash-sales/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error('❌ Error deleting flash sale');
      return { error: new Error('Failed to delete flash sale') };
    }

    console.log('✅ Flash sale deleted');
    return { error: null };
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
  // Realtime not available with REST API
  console.log('⚠️ Realtime subscriptions not available with REST API');
  return {
    unsubscribe: () => {}
  };
}
