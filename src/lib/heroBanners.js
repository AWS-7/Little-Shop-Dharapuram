/**
 * Hero Banner Management System
 * Admin-controlled carousel banners
 */

// MIGRATED: Using new backend API instead of Supabase
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

/**
 * Get all active hero banners
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getHeroBanners() {
  try {
    console.log('🎯 Fetching hero banners from new backend...');
    
    // Using new backend API
    const response = await fetch(`${API_URL}/banners`);
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Error fetching hero banners:', result.message);
      return getDefaultHeroBanners();
    }

    // Filter active banners and sort
    const data = (result.data || [])
      .filter(b => b.is_active)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    if (!data || data.length === 0) {
      console.log('ℹ️ No active hero banners found, using defaults');
      return getDefaultHeroBanners();
    }

    console.log('✅ Hero banners fetched from backend:', data.length);
    return { data, error: null };
  } catch (e) {
    console.error('❌ Exception fetching hero banners:', e);
    return getDefaultHeroBanners();
  }
}

function getDefaultHeroBanners() {
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

/**
 * Get all banners (for admin)
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getAllHeroBanners() {
  try {
    const response = await fetch(`${API_URL}/banners`);
    const result = await response.json();
    
    if (!result.success) throw new Error(result.message);
    return { data: result.data || [], error: null };
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
export async function createHeroBanner({ title, image, sort_order = 0 }) {
  try {
    console.log('💾 Creating hero banner:', { title, image });
    
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/banners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        image,
        title,
        sort_order,
        is_active: true
      })
    });
    
    const result = await response.json();
    if (!result.success) {
      console.error('❌ Error creating banner:', result.message);
      throw new Error(result.message);
    }
    
    console.log('✅ Banner created:', result.data);
    return { data: result.data, error: null };
  } catch (error) {
    console.error('❌ Exception creating banner:', error);
    return { data: null, error };
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
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/banners/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { data: result.data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Delete a hero banner
 * @param {string} id - Banner ID
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deleteHeroBanner(id) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/banners/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to delete banner');
    return { error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * Upload hero banner image to backend API
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
    
    // Upload via backend API
    const formData = new FormData();
    formData.append('file', uploadBlob, fileName);
    
    const token = await getAuthToken();
    const uploadResponse = await fetch(`${API_URL}/uploads/banners`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success) {
      console.error('Upload failed:', uploadResult.message);
      throw new Error(uploadResult.message);
    }
    
    console.log('✅ Upload successful:', uploadResult.data.url);
    return { url: uploadResult.data.url, error: null };
    
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
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/banners/${id}/toggle`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ is_active: isActive })
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { data: result.data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Subscribe to hero banner changes
 * @param {Function} callback - Callback function
 * @returns {Object} Subscription channel
 */
export function subscribeToHeroBanners(callback) {
  // Realtime not available with REST API - use polling instead
  console.log('⚠️ Realtime subscriptions not available with REST API');
  return {
    unsubscribe: () => {}
  };
}
