/**
 * Restock Request / Notify Me Feature
 * Handle customer requests for out-of-stock products
 */

import { supabase } from './supabase';

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
    const { data: existingRequest } = await supabase
      .from('restock_requests')
      .select('id, status')
      .eq('product_id', productId)
      .eq('customer_email', email)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return {
        data: null,
        error: new Error('You have already requested to be notified when this product is back in stock.'),
        alreadyExists: true
      };
    }

    // Create the restock request
    const { data, error } = await supabase
      .from('restock_requests')
      .insert([{
        product_id: productId,
        product_name: productName,
        customer_email: email,
        customer_name: customerName || null,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating restock request:', error);
      return { data: null, error };
    }

    return { data, error: null };
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
    let query = supabase
      .from('restock_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.productId) {
      query = query.eq('product_id', filters.productId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching restock requests:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
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
    // Get all pending requests grouped by product
    const { data, error } = await supabase
      .from('restock_requests')
      .select('product_id, product_name, customer_email, customer_phone, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching aggregated restock requests:', error);
      return { data: [], error };
    }

    // Group and aggregate manually since Supabase doesn't support GROUP BY in the same way
    const aggregated = data.reduce((acc, request) => {
      const key = request.product_id;
      
      if (!acc[key]) {
        acc[key] = {
          product_id: request.product_id,
          product_name: request.product_name,
          request_count: 0,
          email_requests: 0,
          phone_requests: 0,
          last_request_date: request.created_at,
          requests: []
        };
      }
      
      acc[key].request_count++;
      if (request.customer_email) acc[key].email_requests++;
      if (request.customer_phone) acc[key].phone_requests++;
      acc[key].requests.push(request);
      
      // Update last request date if this is newer
      if (new Date(request.created_at) > new Date(acc[key].last_request_date)) {
        acc[key].last_request_date = request.created_at;
      }
      
      return acc;
    }, {});

    // Convert to array and sort by request count
    const sorted = Object.values(aggregated).sort((a, b) => b.request_count - a.request_count);

    return { data: sorted, error: null };
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
    const { data, error } = await supabase
      .from('restock_requests')
      .update({
        status: 'notified',
        notification_sent_at: new Date().toISOString()
      })
      .eq('product_id', productId)
      .eq('status', 'pending')
      .select();

    if (error) {
      console.error('Error marking requests as notified:', error);
      return { data: null, error };
    }

    return { data, error: null };
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
    const { error } = await supabase
      .from('restock_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('Error deleting restock request:', error);
      return { success: false, error };
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
    const { count, error } = await supabase
      .from('restock_requests')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching restock request count:', error);
      return { count: 0, error };
    }

    return { count: count || 0, error: null };
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
