// MIGRATED: Using new backend API instead of Supabase
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Fetch all testimonials
export async function getTestimonials() {
  try {
    const response = await fetch(`${API_URL}/testimonials?active=true`);
    const result = await response.json();
    
    if (!result.success) {
      console.error('Error fetching testimonials:', result.message);
      return { data: [], error: new Error(result.message) };
    }

    return { data: result.data || [], error: null };
  } catch (e) {
    console.error('Error fetching testimonials:', e);
    return { data: [], error: e };
  }
}

// Fetch all testimonials for admin (including inactive)
export async function getAllTestimonials() {
  try {
    const response = await fetch(`${API_URL}/testimonials`);
    const result = await response.json();
    
    if (!result.success) {
      console.error('Error fetching testimonials:', result.message);
      return { data: [], error: new Error(result.message) };
    }

    return { data: result.data || [], error: null };
  } catch (e) {
    console.error('Error fetching testimonials:', e);
    return { data: [], error: e };
  }
}

// Create testimonial
export async function createTestimonial(testimonialData) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/testimonials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testimonialData)
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { data: result.data, error: null };
  } catch (e) {
    console.error('Error creating testimonial:', e);
    return { data: null, error: e };
  }
}

// Update testimonial
export async function updateTestimonial(id, testimonialData) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/testimonials/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testimonialData)
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { data: result.data, error: null };
  } catch (e) {
    console.error('Exception updating testimonial:', e);
    return { data: null, error: e };
  }
}

// Delete testimonial
export async function deleteTestimonial(id) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/testimonials/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to delete testimonial');
    return { error: null };
  } catch (e) {
    console.error('Error deleting testimonial:', e);
    return { error: e };
  }
}

// Toggle testimonial active status
export async function toggleTestimonialStatus(id, isActive) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/testimonials/${id}/toggle`, {
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
  } catch (e) {
    console.error('Error toggling testimonial status:', e);
    return { data: null, error: e };
  }
}

// Upload testimonial avatar image
export async function uploadTestimonialAvatar(file, testimonialId) {
  try {
    // Validate file
    if (!file) throw new Error('No file provided');
    if (file.size > 5 * 1024 * 1024) throw new Error('File size must be less than 5MB');
    if (!file.type.startsWith('image/')) throw new Error('File must be an image');

    const formData = new FormData();
    formData.append('file', file);

    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/uploads/testimonial/${testimonialId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    return { url: result.data.url, error: null };
  } catch (error) {
    console.error('Error uploading testimonial avatar:', error);
    return { url: null, error };
  }
}

// Real-time subscription for testimonials
// NOTE: Realtime not available with REST API - use polling instead
export function subscribeToTestimonials(callback) {
  console.log('⚠️ Realtime subscriptions not available with REST API');
  // Return dummy subscription
  return {
    unsubscribe: () => {}
  };
}
