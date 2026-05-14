/**
 * Restock Request / Notify Me Feature
 * Handle customer requests for out-of-stock products
 */

// MIGRATED: Using new backend API instead of Supabase
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Helper to get auth token
async function getAuthToken() {
  return localStorage.getItem('authToken')
    || localStorage.getItem('adminToken')
    || localStorage.getItem('firebase_auth_token')
    || null;
}

/**
 * Create a new restock request
 * @param {Object} request - Restock request data
 * @param {string} request.productId - Product ID
 * @param {string} request.productName - Product name
 * @param {string} request.email - Customer email (optional)
 * @param {string} request.phone - Customer phone/WhatsApp (optional)
 * @param {string} request.customerName - Customer name (optional)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createRestockRequest({ productId, productName, email, customerName }) {
  try {
    // Validate that email is provided
    if (!email) {
      return { 
        data: null, 
        error: new Error('Please provide your email address') 
      };
    }

    // Check if this email already requested for this product
    const checkResponse = await fetch(`${API_URL}/restock/check?product_id=${productId}&email=${email}`);
    const checkResult = await checkResponse.json();

    if (checkResult.data) {
      return { success: false, error: 'You already have a pending request for this product', data: null };
    }

    // Create the restock request
    const response = await fetch(`${API_URL}/restock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: productId,
        product_name: productName,
        customer_email: email,
        customer_phone: phone,
        customer_name: customerName
      })
    });
    const result = await response.json();

    if (result.error) {
      console.error('Error creating restock request:', result.error);
      return { data: null, error: result.error };
    }

    return { data: result.data, error: null };
  } catch (e) {
    console.error('Exception creating restock request:', e);
    return { data: null, error: e };
  }
}

/**
 * Get all restock requests (for admin)
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status (pending, notified, etc.)
 * @param {string} filters.productId - Filter by product
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getRestockRequests(filters = {}) {
  try {
    // Build query params
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.productId) params.append('product_id', filters.productId);
    
    const response = await fetch(`${API_URL}/restock?${params.toString()}`);
    const result = await response.json();

    if (result.error) {
      console.error('Error fetching restock requests:', result.error);
      return { data: [], error: result.error };
    }

    return { data: result.data, error: null };
  } catch (e) {
    console.error('Exception fetching restock requests:', e);
    return { data: [], error: e };
  }
}

/**
 * Get aggregated restock requests by product (for admin dashboard)
 * Shows most requested out-of-stock products
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getAggregatedRestockRequests() {
  try {
    const token = await getAuthToken();
    // Get all pending requests grouped by product
    const response = await fetch(`${API_URL}/restock/aggregated`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();

    if (!result.success) {
      return { data: [], error: new Error(result.message) };
    }

    return { data: result.data, error: null };
  } catch (e) {
    console.error('Exception fetching aggregated restock requests:', e);
    return { data: [], error: e };
  }
}

/**
 * Mark restock requests as notified
 * @param {string} productId - Product ID that was restocked
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function markRequestsAsNotified(productId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/restock/${productId}/notify`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();

    if (result.error) {
      console.error('Error marking requests as notified:', result.error);
      return { data: null, error: result.error };
    }

    return { data: result.data, error: null };
  } catch (e) {
    console.error('Exception marking requests as notified:', e);
    return { data: null, error: e };
  }
}

/**
 * Delete a restock request
 * @param {string} requestId - Request ID to delete
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deleteRestockRequest(requestId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/restock/${requestId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to delete request');

    const result = await response.json();

    if (result.error) {
      console.error('Error deleting restock request:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true, error: null };
  } catch (e) {
    console.error('Exception deleting restock request:', e);
    return { success: false, error: e };
  }
}

/**
 * Get the count of restock requests for a specific product
 * @param {string} productId - Product ID
 * @returns {Promise<{count: number, error: Error|null}>}
 */
export async function getRestockRequestCount(productId) {
  try {
    const response = await fetch(`${API_URL}/restock/count/${productId}`);
    const result = await response.json();

    if (result.error) {
      console.error('Error fetching restock request count:', result.error);
      return { count: 0, error: result.error };
    }

    return { count: result.data, error: null };
  } catch (e) {
    console.error('Exception fetching restock request count:', e);
    return { count: 0, error: e };
  }
}

// ═══════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════

/**
 * Normalize phone number to international format
 * @param {string} phone - Raw phone number
 * @returns {string|null} Normalized phone number
 */
function normalizePhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Add country code if missing (assuming India +91)
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  
  // Already has country code
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  
  // International format
  if (digits.length > 10) {
    return `+${digits}`;
  }
  
  return phone; // Return as-is if doesn't match patterns
}

/**
 * Check if a product has pending restock requests
 * @param {string} productId - Product ID
 * @returns {Promise<{hasRequests: boolean, count: number, error: Error|null}>}
 */
export async function checkProductRestockRequests(productId) {
  const { count, error } = await getRestockRequestCount(productId);

  if (error) {
    return { hasRequests: false, count: 0, error };
  }

  return { hasRequests: count > 0, count, error: null };
}

/**
 * Auto-notify customers when product is restocked
 * This function checks if there are pending requests and sends notifications
 * @param {string} productId - Product ID that was restocked
 * @param {string} productName - Product name
 * @param {number} newStockCount - New stock count
 * @returns {Promise<{notified: number, error: Error|null}>}
 */
export async function notifyRestockCustomers(productId, productName, newStockCount) {
  try {
    const token = await getAuthToken();
    // Get pending requests for this product
    const response = await fetch(`${API_URL}/restock/pending/${productId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();
    const requests = result.data || [];

    if (result.error || !requests || requests.length === 0) {
      return { notified: 0, error: null };
    }

    // Mark all as notified
    const updateResponse = await fetch(`${API_URL}/restock/${productId}/notify`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const updateResult = await updateResponse.json();

    if (updateResult.error) {
      console.error('Error marking restock requests as notified:', updateResult.error);
      return { notified: 0, error: updateResult.error };
    }

    // Send WhatsApp notifications if phone numbers available
    let notifiedCount = 0;
    for (const request of requests) {
      if (request.customer_phone) {
        // WhatsApp notification would be sent here
        // For now, just log it
        console.log(`Would send WhatsApp to ${request.customer_phone}: ${productName} is back in stock!`);
        notifiedCount++;
      }
    }

    return { notified: requests.length, whatsappNotified: notifiedCount, error: null };
  } catch (e) {
    console.error('Exception in notifyRestockCustomers:', e);
    return { notified: 0, error: e };
  }
}
