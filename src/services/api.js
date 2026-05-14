/**
 * API Service Layer
 * Replaces Supabase client with custom REST API calls
 * Connects to Node.js + Express.js backend
 */

import { auth } from '../lib/firebase';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

/**
 * Get Firebase Auth Token
 */
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
};

/**
 * API Client with authentication
 */
const apiClient = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get auth token
  const token = await getAuthToken();
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };
  
  // For FormData, don't set Content-Type (browser will set with boundary)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }
  
  const config = {
    ...options,
    headers,
    credentials: 'include'
  };
  
  try {
    const response = await fetch(url, config);
    
    // Handle 401 - Unauthorized
    if (response.status === 401) {
      // Token expired or invalid
      console.warn('Authentication required or token expired');
    }
    
    // Parse response
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
    
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ============================================
// PRODUCTS API
// ============================================

export const productAPI = {
  // Get all products with filters
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient(`/products?${queryString}`);
  },
  
  // Get featured products
  getFeatured: async (limit = 8) => {
    return apiClient(`/products/featured?limit=${limit}`);
  },
  
  // Get new arrivals
  getNewArrivals: async (limit = 8) => {
    return apiClient(`/products/new-arrivals?limit=${limit}`);
  },
  
  // Get bestsellers
  getBestsellers: async (limit = 8) => {
    return apiClient(`/products/bestsellers?limit=${limit}`);
  },
  
  // Get handpicked products
  getHandpicked: async (limit = 8) => {
    return apiClient(`/products/handpicked?limit=${limit}`);
  },
  
  // Get single product
  getBySlug: async (slug) => {
    return apiClient(`/products/${slug}`);
  },
  
  // Search products
  search: async (query, limit = 20) => {
    return apiClient(`/products/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },
  
  // Get products by category
  getByCategory: async (categorySlug, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient(`/products/categories/${categorySlug}?${queryString}`);
  },
  
  // Admin: Create product
  create: async (productData) => {
    return apiClient('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },
  
  // Admin: Update product
  update: async (id, productData) => {
    return apiClient(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },
  
  // Admin: Delete product
  delete: async (id) => {
    return apiClient(`/products/${id}`, {
      method: 'DELETE'
    });
  },
  
  // Admin: Update stock
  updateStock: async (id, quantity) => {
    return apiClient(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity })
    });
  }
};

// ============================================
// CATEGORIES API
// ============================================

export const categoryAPI = {
  // Get all categories
  getAll: async () => {
    return apiClient('/categories');
  },
  
  // Get category by slug
  getBySlug: async (slug) => {
    return apiClient(`/categories/${slug}`);
  },
  
  // Admin: Create category
  create: async (categoryData) => {
    return apiClient('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  },
  
  // Admin: Update category
  update: async (id, categoryData) => {
    return apiClient(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
  },
  
  // Admin: Delete category
  delete: async (id) => {
    return apiClient(`/categories/${id}`, {
      method: 'DELETE'
    });
  }
};

// ============================================
// CART API
// ============================================

export const cartAPI = {
  // Get cart items
  getCart: async (sessionId = null) => {
    const headers = sessionId ? { 'X-Session-Id': sessionId } : {};
    return apiClient('/cart', { headers });
  },
  
  // Add to cart
  addToCart: async (productId, quantity = 1, size = null, color = null, sessionId = null) => {
    const headers = sessionId ? { 'X-Session-Id': sessionId } : {};
    return apiClient('/cart/add', {
      method: 'POST',
      headers,
      body: JSON.stringify({ productId, quantity, size, color })
    });
  },
  
  // Update cart item
  updateCartItem: async (cartItemId, quantity) => {
    return apiClient(`/cart/update/${cartItemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
  },
  
  // Remove from cart
  removeFromCart: async (cartItemId) => {
    return apiClient(`/cart/remove/${cartItemId}`, {
      method: 'DELETE'
    });
  },
  
  // Clear cart
  clearCart: async () => {
    return apiClient('/cart/clear', {
      method: 'DELETE'
    });
  },
  
  // Sync cart (guest to logged-in)
  syncCart: async (items) => {
    return apiClient('/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  },
  
  // Get cart summary
  getCartSummary: async () => {
    return apiClient('/cart/summary');
  }
};

// ============================================
// ORDERS API
// ============================================

export const orderAPI = {
  // Create order
  create: async (orderData) => {
    return apiClient('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },
  
  // Get my orders
  getMyOrders: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient(`/orders/my-orders?${queryString}`);
  },
  
  // Get order details
  getOrderDetails: async (orderId) => {
    return apiClient(`/orders/${orderId}`);
  },
  
  // Cancel order
  cancelOrder: async (orderId) => {
    return apiClient(`/orders/${orderId}/cancel`, {
      method: 'PUT'
    });
  },
  
  // Admin: Get all orders
  getAllOrders: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient(`/orders?${queryString}`);
  },
  
  // Admin: Update order status
  updateOrderStatus: async (orderId, status, data = {}) => {
    return apiClient(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...data })
    });
  },
  
  // Admin: Update payment status
  updatePaymentStatus: async (orderId, paymentStatus, data = {}) => {
    return apiClient(`/orders/${orderId}/payment`, {
      method: 'PUT',
      body: JSON.stringify({ paymentStatus, ...data })
    });
  }
};

// ============================================
// ADDRESSES API
// ============================================

export const addressAPI = {
  // Get all addresses
  getAll: async () => {
    return apiClient('/addresses');
  },
  
  // Create address
  create: async (addressData) => {
    return apiClient('/addresses', {
      method: 'POST',
      body: JSON.stringify(addressData)
    });
  },
  
  // Update address
  update: async (id, addressData) => {
    return apiClient(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(addressData)
    });
  },
  
  // Delete address
  delete: async (id) => {
    return apiClient(`/addresses/${id}`, {
      method: 'DELETE'
    });
  },
  
  // Set default address
  setDefault: async (id) => {
    return apiClient(`/addresses/${id}/default`, {
      method: 'PATCH'
    });
  }
};

// ============================================
// UPLOADS API
// ============================================

export const uploadAPI = {
  // Upload single file
  uploadFile: async (file, type = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    return apiClient('/uploads/single', {
      method: 'POST',
      body: formData
    });
  },
  
  // Upload multiple files
  uploadMultiple: async (files, type = 'general') => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('type', type);
    
    return apiClient('/uploads/multiple', {
      method: 'POST',
      body: formData
    });
  },
  
  // Upload product image
  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient('/uploads/product-image', {
      method: 'POST',
      body: formData
    });
  },
  
  // Upload category image
  uploadCategoryImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient('/uploads/category-image', {
      method: 'POST',
      body: formData
    });
  },
  
  // Upload banner
  uploadBanner: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient('/uploads/banner', {
      method: 'POST',
      body: formData
    });
  },
  
  // Upload payment proof
  uploadPaymentProof: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient('/uploads/payment-proof', {
      method: 'POST',
      body: formData
    });
  },
  
  // Delete file
  deleteFile: async (filename, type = 'general') => {
    return apiClient(`/uploads/${filename}?type=${type}`, {
      method: 'DELETE'
    });
  }
};

// ============================================
// DASHBOARD / ADMIN API
// ============================================

export const dashboardAPI = {
  // Get dashboard stats
  getStats: async () => {
    return apiClient('/dashboard/stats');
  }
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthAPI = {
  // Check API health
  check: async () => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`);
      return await response.json();
    } catch (error) {
      return { success: false, message: 'API is not reachable' };
    }
  }
};

// ============================================
// EXPORT ALL APIs
// ============================================

export default {
  products: productAPI,
  categories: categoryAPI,
  cart: cartAPI,
  orders: orderAPI,
  addresses: addressAPI,
  uploads: uploadAPI,
  dashboard: dashboardAPI,
  health: healthAPI
};
