/**
 * Hero Banner Management System
 * Admin-controlled carousel banners
 */

import { supabase } from './supabase';

/**
 * Get all active hero banners
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getHeroBanners() {
  try {
    console.log('🎯 Fetching hero banners...');
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('❌ Error fetching hero banners:', error);
      // Return fallback banners if table not set up
      if (error.code === '42P01' || error.status === 406) {
        console.log('ℹ️ Hero banners table not found, using defaults');
        return { 
          data: [
            {
              id: 1,
              image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop',
              title: 'Huge Summer Sale',
              subtitle: 'Up to 50% Off on All Collections',
              cta: 'Shop Now',
              color: 'bg-purple-primary'
            },
            {
              id: 2,
              image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2000&auto=format&fit=crop',
              title: 'New Arrivals 2026',
              subtitle: 'Premium Lifestyle Essentials',
              cta: 'Explore More',
              color: 'bg-indigo-600'
            },
            {
              id: 3,
              image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=2000&auto=format&fit=crop',
              title: 'Exclusive Jewellery',
              subtitle: 'Timeless Elegance in Every Piece',
              cta: 'View Collection',
              color: 'bg-pink-600'
            }
          ], 
          error: null 
        };
      }
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      console.log('ℹ️ No active hero banners found');
      return { data: [], error: null };
    }

    console.log('✅ Hero banners fetched:', data.length);
    return { data, error: null };
  } catch (e) {
    console.error('❌ Exception fetching hero banners:', e);
    return { data: null, error: e };
  }
}

/**
 * Get all banners (for admin)
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getAllHeroBanners() {
  try {
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (e) {
    console.error('Error fetching all hero banners:', e);
    return { data: [], error: e };
  }
}

/**
 * Create a new hero banner
 * @param {Object} banner - Banner data
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createHeroBanner({
  image,
  title,
  subtitle,
  cta = 'Shop Now',
  link = '/shop',
  color = 'bg-purple-primary',
  sortOrder = 0,
  isActive = true
}) {
  try {
    console.log('💾 Creating hero banner:', { title, image });
    
    const { data, error } = await supabase
      .from('hero_banners')
      .insert([{
        image,
        title,
        subtitle,
        cta,
        link,
        color,
        sort_order: sortOrder,
        is_active: isActive
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating hero banner:', error);
      return { data: null, error };
    }

    console.log('✅ Hero banner created:', data);
    return { data, error: null };
  } catch (e) {
    console.error('Exception creating hero banner:', e);
    return { data: null, error: e };
  }
}

/**
 * Update a hero banner
 * @param {string} id - Banner ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateHeroBanner(id, updates) {
  try {
    const { data, error } = await supabase
      .from('hero_banners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (e) {
    console.error('Error updating hero banner:', e);
    return { data: null, error: e };
  }
}

/**
 * Delete a hero banner
 * @param {string} id - Banner ID
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deleteHeroBanner(id) {
  try {
    const { error } = await supabase
      .from('hero_banners')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (e) {
    console.error('Error deleting hero banner:', e);
    return { success: false, error: e };
  }
}

/**
 * Upload hero banner image to Supabase Storage
 * @param {File} file - Image file
 * @returns {Promise<{url: string|null, error: Error|null}>}
 */
export async function uploadHeroBannerImage(file) {
  try {
    console.log('📤 Uploading hero banner image...', file.name);
    
    // Validate file
    if (!file || !file.type?.startsWith('image/')) {
      return { url: null, error: new Error('Please select a valid image file') };
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return { url: null, error: new Error('Image size should be less than 5MB') };
    }
    
    const fileName = `banner-${Date.now()}-${Math.random().toString(36).slice(2, 11)}.webp`;
    const filePath = `banners/${fileName}`;
    
    // Convert to WebP for better compression
    let uploadBlob = file;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
      
      // Resize for banner (1920x800 aspect ratio)
      const maxWidth = 1920;
      const maxHeight = 800;
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      uploadBlob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/webp', 0.85);
      });
      
      URL.revokeObjectURL(img.src);
    } catch (e) {
      console.warn('Image optimization failed, using original:', e);
    }
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, uploadBlob, {
        cacheControl: 'public, max-age=31536000, immutable',
        contentType: 'image/webp',
      });
    
    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return { url: null, error: uploadError };
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);
    
    console.log('✅ Banner image uploaded:', urlData.publicUrl);
    return { url: urlData.publicUrl, error: null };
    
  } catch (e) {
    console.error('❌ Error uploading banner image:', e);
    return { url: null, error: e };
  }
}

/**
 * Toggle banner active status
 * @param {string} id - Banner ID
 * @param {boolean} isActive - New status
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function toggleHeroBanner(id, isActive) {
  try {
    const { data, error } = await supabase
      .from('hero_banners')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (e) {
    console.error('Error toggling hero banner:', e);
    return { data: null, error: e };
  }
}

/**
 * Subscribe to hero banner changes
 * @param {Function} callback - Callback function
 * @returns {Object} Subscription channel
 */
export function subscribeToHeroBanners(callback) {
  const channel = supabase
    .channel('hero-banners-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'hero_banners'
      },
      (payload) => {
        console.log('🔄 Hero banner change:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return channel;
}
