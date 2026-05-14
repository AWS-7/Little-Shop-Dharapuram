// MIGRATED: Using new backend API instead of Supabase
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
import { isValidImage, optimizeImage } from './imageOptimizer';

// ── Category definitions with category-specific fields ──
export const PRODUCT_CATEGORIES = [
  { value: 'Sarees', label: 'Sarees', fields: ['fabric', 'weaveType', 'care', 'origin'] },
  { value: 'Silk Sarees', label: 'Silk Sarees', fields: ['fabric', 'weaveType', 'care', 'origin'] },
  { value: 'Chudi Materials', label: 'Chudi Materials', fields: ['fabric', 'care', 'origin'] },
  { value: 'Imitation Jewellery', label: 'Imitation Jewellery', fields: ['material', 'gemstone', 'weight'] },
  { value: 'Bangles', label: 'Bangles', fields: ['material', 'size', 'weight'] },
  { value: 'Bags', label: 'Bags', fields: ['material', 'care', 'origin'] },
  { value: 'Kurtas', label: 'Kurtas', fields: ['fabric', 'fit', 'care', 'origin'] },
  { value: 'Lehengas', label: 'Lehengas', fields: ['fabric', 'weaveType', 'care', 'origin'] },
  { value: 'Gowns', label: 'Gowns', fields: ['fabric', 'fit', 'care'] },
  { value: 'Co-ords', label: 'Co-ord Sets', fields: ['fabric', 'care', 'origin'] },
  { value: 'Accessories', label: 'Accessories', fields: ['material', 'care'] },
];

// Field labels for category-specific fields
export const FIELD_LABELS = {
  fabric: 'Fabric / Material',
  weaveType: 'Weave Type',
  care: 'Care Instructions',
  origin: 'Place of Origin',
  fit: 'Fit / Style',
  material: 'Material',
  gemstone: 'Gemstone',
  weight: 'Weight',
  size: 'Size / Dimension',
};

// ── Upload image to backend storage with optimization ──
export async function uploadProductImage(file) {
  try {
    console.log('Starting optimized image upload...', file.name, file.size);
    
    // Validate image
    if (!isValidImage(file)) {
      return { url: null, error: new Error('Invalid image format. Use JPG, PNG, or WebP.') };
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { url: null, error: new Error('Image too large. Max size: 5MB.') };
    }
    
    // Optimize image: resize to 1200x1200 max, compress, convert to WebP
    const optimizedBlob = await optimizeImage(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.85,
      format: 'webp',
    });
    
    console.log('Image optimized:', file.size, '->', optimizedBlob.size, 'bytes');
    
    // Generate filename with WebP extension
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
    const filePath = `products/${fileName}`;
    
    console.log('Uploading optimized image to:', filePath);

    // Upload via backend API
    const formData = new FormData();
    formData.append('file', optimizedBlob, fileName);
    
    const token = await getAuthToken();
    const uploadResponse = await fetch(`${API_URL}/uploads/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success) {
      console.error('Image upload failed:', uploadResult.message);
      return { url: null, error: new Error(uploadResult.message) };
    }

    console.log('Upload successful:', uploadResult.data);
    console.log('Public URL:', uploadResult.data.url);

    return { url: uploadResult.data.url, error: null };
  } catch (e) {
    console.error('Upload exception:', e);
    return { url: null, error: e };
  }
}

// ── Create product via API ──
export async function createProduct(productData) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { data: result.data, error: null };
  } catch (e) {
    console.error('Create product failed:', e);
    return { data: null, error: e };
  }
}

// ── Get all ACTIVE products (for client-side) ──
export async function getAllProducts() {
  try {
    console.log('🛍️ Fetching products from new backend...');
    
    const response = await fetch(`${API_URL}/products`);
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Error fetching products:', result.message);
      return { data: [], error: new Error(result.message) };
    }

    // Map database fields to client-side fields
    const mappedData = (result.data || [])
      .filter(p => p.is_active) // Only active products
      .map(p => ({
        ...p,
        image: resolveImageUrl(p.images?.[0] || p.image_url || p.image),
        image2: resolveImageUrl(p.images?.[1] || p.image2_url || p.image2),
        // Map stock_quantity (DB) to stockCount (UI)
        stockCount: p.stock_quantity !== undefined ? p.stock_quantity : p.stockCount || 0
      }));

    console.log('✅ Products fetched:', mappedData.length);
    return { data: mappedData, error: null };
  } catch (e) {
    console.error('❌ Exception fetching products:', e);
    return { data: [], error: e };
  }
}

// ── Get ALL products including inactive (for admin only) ──
export async function getAllProductsAdmin() {
  try {
    const response = await fetch(`${API_URL}/products?admin=true`);
    const result = await response.json();
    
    if (!result.success) throw new Error(result.message);
    
    // Map database fields to client-side fields
    const mappedData = (result.data || []).map(p => ({
      ...p,
      image: resolveImageUrl(p.images?.[0] || p.image_url || p.image),
      image2: resolveImageUrl(p.images?.[1] || p.image2_url || p.image2),
      stockCount: p.stock_quantity !== undefined ? p.stock_quantity : p.stockCount || 0
    }));

    return { data: mappedData, error: null };
  } catch (e) {
    console.error('Error fetching admin products:', e);
    return { data: [], error: e };
  }
}

// ── Get single ACTIVE product by ID ──
export async function getProductById(id) {
  try {
    const response = await fetch(`${API_URL}/products/${id}`);
    const result = await response.json();
    
    if (!result.success) {
      return { data: null, error: new Error(result.message) };
    }

    // Map database fields to client-side fields
    const data = result.data;
    if (data) {
      data.image = resolveImageUrl(data.image_url || data.image);
      data.image2 = resolveImageUrl(data.image2_url || data.image2);
      data.stockCount = data.stock_quantity !== undefined ? data.stock_quantity : data.stockCount || 0;
    }

    return { data, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

// ── Get single product by ID for Admin (ignores is_active) ──
export async function getProductByIdAdmin(id) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/products/${id}/admin`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();
    
    if (!result.success) {
      return { data: null, error: new Error(result.message) };
    }

    const data = result.data;
    if (data) {
      data.image = resolveImageUrl(data.image_url || data.image);
      data.image2 = resolveImageUrl(data.image2_url || data.image2);
      data.stockCount = data.stock_quantity !== undefined ? data.stock_quantity : data.stockCount || 0;
    }

    return { data, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

// ── Get latest N ACTIVE products for Featured Collection ──
export async function getLatestProducts(limit = 4) {
  try {
    const response = await fetch(`${API_URL}/products?limit=${limit}`);
    const result = await response.json();
    
    if (!result.success) {
      return { data: [], error: new Error(result.message) };
    }

    const mappedData = (result.data || []).map(p => ({
      ...p,
      image: resolveImageUrl(p.image_url || p.image),
      stockCount: p.stock_quantity !== undefined ? p.stock_quantity : p.stockCount || 0
    }));

    return { data: mappedData, error: null };
  } catch (e) {
    return { data: [], error: e };
  }
}

// ── Get one random ACTIVE product from each category (Handpicked) ──
export async function getHandpickedProducts(categories) {
  try {
    const results = [];

    for (const category of categories) {
      const response = await fetch(`${API_URL}/products/category/${category.name}?limit=1`);
      const result = await response.json();

      if (result.data && result.success) {
        const data = Array.isArray(result.data) ? result.data[0] : result.data;
        results.push({
          ...data,
          image: resolveImageUrl(data.image_url || data.image),
          image2: resolveImageUrl(data.image2_url || data.image2),
          categoryName: category.name,
          stockCount: data.stock_quantity !== undefined ? data.stock_quantity : data.stockCount || 0
        });
      }
    }

    return { data: results, error: null };
  } catch (e) {
    return { data: [], error: e };
  }
}

// ── Resolve image URL ──
// If the URL is already absolute (https://...), return as-is.
// If it's a relative storage path (e.g., "products/img.jpg"), prepend the backend uploads URL.
const PLACEHOLDER_IMG = 'https://placehold.co/600x800/f3f4f6/9ca3af?text=No+Image';

export function resolveImageUrl(url) {
  if (!url) return PLACEHOLDER_IMG;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Images now served from backend/public/uploads
  return `${API_URL}/uploads/${url}`;
}

export { PLACEHOLDER_IMG };

// ── Update product ──
export async function updateProduct(productId, updates) {
  try {
    if (!productId) {
      return { data: null, error: { message: 'Product ID is required' } };
    }
    if (!updates || Object.keys(updates).length === 0) {
      return { data: null, error: { message: 'No updates provided' } };
    }
    
    console.log('Updating product:', productId, 'Updates:', updates);
    
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    
    const result = await response.json();
    if (!result.success) {
      console.error('Update error:', result.message);
      return { data: null, error: new Error(result.message) };
    }
    
    console.log('Update successful:', result.data);
    return { data: result.data, error: null };
  } catch (e) {
    console.error('Update exception:', e);
    return { data: null, error: e };
  }
}

// ── Delete product ──
export async function deleteProduct(productId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to delete product');
    return { error: null };
  } catch (e) {
    return { error: e };
  }
}

// ── Categories Management ──
export async function getAllCategories() {
  try {
    const response = await fetch(`${API_URL}/categories`);
    const result = await response.json();
    return { data: result.data || [], error: result.success ? null : new Error(result.message) };
  } catch (e) {
    return { data: [], error: e };
  }
}

export async function createCategory(catData) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(catData)
    });
    const result = await response.json();
    return { data: result.data, error: result.success ? null : new Error(result.message) };
  } catch (e) {
    return { data: null, error: e };
  }
}

export async function updateCategory(id, updates) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    const result = await response.json();
    return { data: result.data, error: result.success ? null : new Error(result.message) };
  } catch (e) {
    return { data: null, error: e };
  }
}

export async function deleteCategory(id) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to delete category');
    return { error: null };
  } catch (e) {
    return { error: e };
  }
}

export async function uploadCategoryImage(file) {
  try {
    // Validate image
    if (!isValidImage(file)) {
      return { url: null, error: new Error('Invalid image format. Use JPG, PNG, or WebP.') };
    }
    
    // Optimize image for categories (smaller size)
    const optimizedBlob = await optimizeImage(file, {
      maxWidth: 600,
      maxHeight: 600,
      quality: 0.8,
      format: 'webp',
    });
    
    const fileName = `cat-${Date.now()}.webp`;
    const filePath = `categories/${fileName}`;
    
    // Upload via backend API
    const formData = new FormData();
    formData.append('file', optimizedBlob, fileName);
    
    const token = await getAuthToken();
    const uploadResponse = await fetch(`${API_URL}/uploads/categories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success) {
      return { url: null, error: new Error(uploadResult.message) };
    }

    return { url: uploadResult.data.url, error: null };
  } catch (e) {
    return { url: null, error: e };
  }
}

// ── Subscribe to real-time product updates ──
// NOTE: Realtime not available with REST API - use polling instead
export function subscribeToProducts(callback) {
  console.log('⚠️ Realtime subscriptions not available with REST API');
  return {
    unsubscribe: () => {}
  };
}

// ── Get related products by category (for product detail page) ──
export async function getProductsByCategory(category, excludeId = null, limit = 4) {
  try {
    const response = await fetch(`${API_URL}/products/category/${category}?limit=${limit}${excludeId ? '&exclude=' + excludeId : ''}`);
    const result = await response.json();

    if (!result.success) throw new Error(result.message);
    
    // Map database fields to client-side fields
    const mappedData = (result.data || []).map(p => ({
      ...p,
      image: resolveImageUrl(p.image_url || p.image),
      stockCount: p.stock_quantity !== undefined ? p.stock_quantity : p.stockCount || 0
    }));
    
    return { data: mappedData, error: null };
  } catch (err) {
    console.error('Failed to fetch products by category:', err);
    return { data: [], error: err };
  }
}
