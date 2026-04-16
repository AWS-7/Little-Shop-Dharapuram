import { supabase } from './supabase';

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

// ── Upload image to Supabase Storage ──
export async function uploadProductImage(file) {
  try {
    console.log('Starting image upload...', file.name, file.size);
    
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `products/${fileName}`;
    
    console.log('Uploading to bucket: product-images, path:', filePath);

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
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

// ── Get all products ──
export async function getAllProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Map image_url to image for client-side compatibility
    const mappedData = (data || []).map(p => ({
      ...p,
      image: resolveImageUrl(p.image_url || p.image)
    }));
    
    return { data: mappedData, error };
  } catch (e) {
    return { data: [], error: e };
  }
}

// ── Get single product by ID ──
export async function getProductById(id) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    // Map image_url to image for client-side compatibility
    if (data) {
      data.image = resolveImageUrl(data.image_url || data.image);
    }
    
    return { data, error };
  } catch (e) {
    return { data: null, error: e };
  }
}

// ── Get latest N products for Featured Collection ──
export async function getLatestProducts(limit = 4) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    const mappedData = (data || []).map(p => ({
      ...p,
      image: resolveImageUrl(p.image_url || p.image)
    }));
    
    return { data: mappedData, error };
  } catch (e) {
    return { data: [], error: e };
  }
}

// ── Get one random product from each category (Handpicked) ──
export async function getHandpickedProducts(categories) {
  try {
    const results = [];
    
    for (const category of categories) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category.name)
        .limit(1)
        .maybeSingle();
      
      if (data && !error) {
        results.push({
          ...data,
          image: resolveImageUrl(data.image_url || data.image),
          categoryName: category.name
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
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select();
    
    if (error) return { data: null, error };
    
    // Return first item if array, or null if no rows
    const result = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!result) {
      return { data: null, error: { message: 'Product not found or no changes made' } };
    }
    
    return { data: result, error: null };
  } catch (e) {
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
