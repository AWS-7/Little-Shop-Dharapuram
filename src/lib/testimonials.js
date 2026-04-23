import { supabase } from './supabase';

// Fetch all testimonials
export async function getTestimonials() {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching testimonials:', error);
    return { data: [], error };
  }

  return { data, error: null };
}

// Fetch all testimonials for admin (including inactive)
export async function getAllTestimonials() {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching testimonials:', error);
    return { data: [], error };
  }

  return { data, error: null };
}

// Create testimonial
export async function createTestimonial(testimonialData) {
  const { data, error } = await supabase
    .from('testimonials')
    .insert([testimonialData])
    .select()
    .single();

  if (error) {
    console.error('Error creating testimonial:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Update testimonial
export async function updateTestimonial(id, testimonialData) {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .update(testimonialData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating testimonial:', error);
      return { data: null, error };
    }

    // Check if any rows were updated
    if (!data || data.length === 0) {
      return { data: null, error: { message: 'Testimonial not found or no changes made' } };
    }

    return { data: data[0], error: null };
  } catch (e) {
    console.error('Exception updating testimonial:', e);
    return { data: null, error: e };
  }
}

// Delete testimonial
export async function deleteTestimonial(id) {
  const { error } = await supabase
    .from('testimonials')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting testimonial:', error);
    return { error };
  }

  return { error: null };
}

// Toggle testimonial active status
export async function toggleTestimonialStatus(id, isActive) {
  const { data, error } = await supabase
    .from('testimonials')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error toggling testimonial status:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Upload testimonial avatar image
export async function uploadTestimonialAvatar(file, testimonialId) {
  try {
    // Validate file
    if (!file) throw new Error('No file provided');
    if (file.size > 5 * 1024 * 1024) throw new Error('File size must be less than 5MB');
    if (!file.type.startsWith('image/')) throw new Error('File must be an image');

    const fileExt = file.name.split('.').pop();
    const fileName = `testimonial_${testimonialId}_${Date.now()}.${fileExt}`;
    const filePath = `testimonials/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('testimonials')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('testimonials')
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading testimonial avatar:', error);
    return { url: null, error };
  }
}

// Real-time subscription for testimonials
export function subscribeToTestimonials(callback) {
  const subscription = supabase
    .channel('testimonials_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'testimonials' },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}
