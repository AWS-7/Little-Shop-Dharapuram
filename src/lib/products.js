import { supabase } from './supabase';
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

// ── Upload image to Supabase Storage with optimization ──
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

    // Upload with long-term caching headers
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, optimizedBlob, {
        cacheControl: 'public, max-age=31536000, immutable', // 1 year cache
        upsert: false,
        contentType: 'image/webp',
      });

    if (error) {
      console.error('Image upload failed:', error.message, error);
      return { url: null, error };
    }

    console.log('Upload successful:', data);

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    console.log('Public URL:', urlData.publicUrl);

    return { url: urlData.publicUrl, error: null };
  } catch (e) {
    console.error('Upload exception:', e);
    return { url: null, error: e };
  }
}

// ── Create product in Supabase ──
export async function createProduct(productData) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();
    if (error) console.error('Create product failed:', error.message);
    return { data, error };
  } catch (e) {
    return { data: null, error: e };
  }
}

// ── Get all ACTIVE products (for client-side) ──
export async function getAllProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)  // Only return active products
      .order('created_at', { ascending: false });

    // Map database fields to client-side fields
    const mappedData = (data || []).map(p => ({
      ...p,
      image: resolveImageUrl(p.image_url || p.image),
      // Map stock_count (DB) to stockCount (UI)
      stockCount: p.stock_count !== undefined ? p.stock_count : p.stockCount || 0
    }));

    return { data: mappedData, error };
  } catch (e) {
    return { data: [], error: e };
  }
}

// ── Get ALL products including inactive (for admin only) ──
export async function getAllProductsAdmin() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    // Map database fields to client-side fields
    const mappedData = (data || []).map(p => ({
      ...p,
      image: resolveImageUrl(p.image_url || p.image),
      // Map stock_count (DB) to stockCount (UI)
      stockCount: p.stock_count !== undefined ? p.stock_count : p.stockCount || 0
    }));

    return { data: mappedData, error };
  } catch (e) {
    return { data: [], error: e };
  }
}

// ── Get single ACTIVE product by ID ──
export async function getProductById(id) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)  // Only return if active
      .single();

    // Map database fields to client-side fields
    if (data) {
      data.image = resolveImageUrl(data.image_url || data.image);
      data.stockCount = data.stock_count !== undefined ? data.stock_count : data.stockCount || 0;
    }

    return { data, error };
  } catch (e) {
    return { data: null, error: e };
  }
}

// ── Get single product by ID for Admin (ignores is_active) ──
export async function getProductByIdAdmin(id) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    // Map database fields to client-side fields
    if (data) {
      data.image = resolveImageUrl(data.image_url || data.image);
      data.stockCount = data.stock_count !== undefined ? data.stock_count : data.stockCount || 0;
    }

    return { data, error };
  } catch (e) {
    return { data: null, error: e };
  }
}

// ── Get latest N ACTIVE products for Featured Collection ──
export async function getLatestProducts(limit = 4) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)  // Only active products
      .order('created_at', { ascending: false })
      .limit(limit);

    const mappedData = (data || []).map(p => ({
      ...p,
      image: resolveImageUrl(p.image_url || p.image),
      stockCount: p.stock_count !== undefined ? p.stock_count : p.stockCount || 0
    }));

    return { data: mappedData, error };
  } catch (e) {
    return { data: [], error: e };
  }
}

// ── Get one random ACTIVE product from each category (Handpicked) ──
export async function getHandpickedProducts(categories) {
  try {
    const results = [];

    for (const category of categories) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category.name)
        .eq('is_active', true)  // Only active products
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        results.push({
          ...data,
          image: resolveImageUrl(data.image_url || data.image),
          categoryName: category.name,
          stockCount: data.stock_count !== undefined ? data.stock_count : data.stockCount || 0
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
// If it's a relative storage path (e.g., "products/img.jpg"), prepend the Supabase storage base URL.
const PLACEHOLDER_IMG = 'https://placehold.co/600x800/f3f4f6/9ca3af?text=No+Image';

export function resolveImageUrl(url) {
  if (!url) return PLACEHOLDER_IMG;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Build the public URL from supabase storage
  const { data } = supabase.storage.from('product-images').getPublicUrl(url);
  return data?.publicUrl || PLACEHOLDER_IMG;
}

export { PLACEHOLDER_IMG };

// ── Update product ──
export async function updateProduct(productId, updates) {
  try {
    // Validate inputs
    if (!productId) {
      return { data: null, error: { message: 'Product ID is required' } };
    }
    if (!updates || Object.keys(updates).length === 0) {
      return { data: null, error: { message: 'No updates provided' } };
    }
    
    console.log('Updating product:', productId, 'Updates:', updates);
    
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select();
    
    if (error) {
      console.error('Supabase update error:', error);
      return { data: null, error };
    }
    
    // Return first item if array, or null if no rows
    const result = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!result) {
      return { data: null, error: { message: 'Product not found or no changes made' } };
    }
    
    console.log('Update successful:', result);
    return { data: result, error: null };
  } catch (e) {
    console.error('Update exception:', e);
    return { data: null, error: e };
  }
}

// ── Delete product ──
export async function deleteProduct(productId) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    return { error };
  } catch (e) {
    return { error: e };
  }
}

// ── Categories Management ──
export async function getAllCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });
    return { data, error };
  } catch (e) {
    return { data: [], error: e };
  }
}

export async function createCategory(catData) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([catData])
      .select()
      .single();
    return { data, error };
  } catch (e) {
    return { data: null, error: e };
  }
}

export async function updateCategory(id, updates) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  } catch (e) {
    return { data: null, error: e };
  }
}

export async function deleteCategory(id) {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    return { error };
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
    
    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, optimizedBlob, {
        cacheControl: 'public, max-age=31536000, immutable',
        contentType: 'image/webp',
      });

    if (error) return { url: null, error };

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, error: null };
  } catch (e) {
    return { url: null, error: e };
  }
}

// ── Subscribe to real-time product updates ──
export function subscribeToProducts(callback) {
  const channelName = `products-${Math.random().toString(36).substring(7)}`;
  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', table: 'products' },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
}

// ── Get related products by category (for product detail page) ──
export async function getProductsByCategory(category, excludeId = null, limit = 4) {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .limit(limit);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Map database fields to client-side fields
    const mappedData = (data || []).map(p => ({
      ...p,
      image: resolveImageUrl(p.image_url || p.image),
      stockCount: p.stock_count !== undefined ? p.stock_count : p.stockCount || 0
    }));
    
    return { data: mappedData, error: null };
  } catch (err) {
    console.error('Failed to fetch products by category:', err);
    return { data: [], error: err };
  }
}
