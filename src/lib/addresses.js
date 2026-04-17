import { supabase } from './supabase';

// ── Helper: Convert any string to a valid UUID v4 format ──
// This allows Firebase UIDs to work with Supabase UUID columns
function toUUID(str) {
  if (!str) return null;
  
  // If already looks like a UUID, return it
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  
  // Hash the string to create a consistent UUID
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Create UUID v4 format from hash
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const hex2 = Math.abs(hash >> 8).toString(16).padStart(4, '0');
  const hex3 = Math.abs(hash >> 16).toString(16).padStart(4, '0');
  const hex4 = Math.abs(hash >> 24).toString(16).padStart(4, '0');
  const hex5 = str.slice(-12).padStart(12, '0').substring(0, 12);
  
  return `${hex}-${hex2}-4${hex3.substring(1)}-a${hex4.substring(1)}-${hex5}`;
}

// ── CRUD operations for user addresses ──

export async function getAddresses(userId) {
  const uuid = toUUID(userId);
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', uuid)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function createAddress(userId, address) {
  console.log('Creating address for user:', userId, 'with data:', address);
  
  // Validate userId
  if (!userId || typeof userId !== 'string') {
    console.error('Invalid userId:', userId);
    return { data: null, error: { message: 'Please sign in to save addresses.' } };
  }
  
  const uuid = toUUID(userId);
  
  try {
    // If this is the first address or marked default, unset other defaults
    if (address.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', uuid);
    }
    
    const { data, error } = await supabase
      .from('addresses')
      .insert({ ...address, user_id: uuid })
      .select()
      .single();
      
    if (error) {
      console.error('Supabase error creating address:', error);
      return { data: null, error: { message: 'Failed to save address. Please try again.' } };
    }
    
    console.log('Create address result:', { data, error });
    return { data, error };
  } catch (err) {
    console.error('Exception creating address:', err);
    return { data: null, error: { message: err.message || 'Failed to save address' } };
  }
}

export async function updateAddress(userId, addressId, updates) {
  const uuid = toUUID(userId);
  // If setting as default, unset others first
  if (updates.is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', uuid);
  }
  const { data, error } = await supabase
    .from('addresses')
    .update(updates)
    .eq('id', addressId)
    .select()
    .single();
  return { data, error };
}

export async function deleteAddress(addressId) {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId);
  return { error };
}

export async function setDefaultAddress(userId, addressId) {
  const uuid = toUUID(userId);
  // Unset all defaults for this user
  await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', uuid);
  // Set the selected one
  const { data, error } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .select()
    .single();
  return { data, error };
}

// Relationship tag options
export const RELATIONSHIP_TAGS = [
  { value: 'self', label: 'Self' },
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'friend', label: 'Friend' },
  { value: 'office', label: 'Office' },
];
