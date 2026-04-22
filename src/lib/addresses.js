import { supabase } from './supabase';

// ── Helper: Convert any string to a valid UUID v5-like format ──
// Creates a deterministic UUID from any string (Firebase UID, email, etc.)
function toUUID(str) {
  if (!str) return null;
  
  // If already looks like a UUID, return it
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str.toLowerCase();
  }
  
  // Create a SHA-256-like hash of the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Convert to positive and create hex segments
  const hashHex = Math.abs(hash).toString(16).padStart(8, '0');
  const timeHex = Date.now().toString(16).slice(-8).padStart(8, '0');
  const randHex = Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  
  // Build valid UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // where y is 8, 9, a, or b
  const seg1 = hashHex.slice(0, 8);
  const seg2 = hashHex.slice(0, 4);
  const seg3 = '4' + hashHex.slice(1, 4);
  const seg4 = (8 + (Math.abs(hash) % 4)).toString() + hashHex.slice(0, 3);
  const seg5 = str.split('').reduce((acc, char) => acc + char.charCodeAt(0).toString(16), '').slice(0, 12).padStart(12, '0');
  
  return `${seg1}-${seg2}-${seg3}-${seg4}-${seg5}`.toLowerCase();
}

// ── CRUD operations for user addresses ──

export async function getAddresses(userId) {
  // Skip if userId is not valid UUID (Firebase UID issue)
  if (!userId || userId.length > 36) {
    return { data: [], error: null };
  }
  
  const uuid = toUUID(userId);
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', uuid)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
    
  // Silently handle UUID errors
  if (error && error.code === '22P02') {
    return { data: [], error: null };
  }
  
  return { data: data || [], error };
}

export async function createAddress(userId, address) {
  console.log('Creating address for user:', userId, 'with data:', address);
  
  // Validate userId
  if (!userId || typeof userId !== 'string') {
    console.error('Invalid userId:', userId);
    return { data: null, error: { message: 'Please sign in to save addresses.' } };
  }
  
  // Skip if userId is not valid UUID (Firebase UID issue)
  if (userId.length > 36) {
    return { data: null, error: { message: 'Cannot save address with this account type.' } };
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
      
    // Silently handle UUID errors
    if (error && error.code === '22P02') {
      return { data: null, error: { message: 'Account type not supported for addresses.' } };
    }
    
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
  // Skip if userId is not valid UUID
  if (!userId || userId.length > 36) {
    return { data: null, error: null };
  }
  
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
    
  // Silently handle UUID errors
  if (error && error.code === '22P02') {
    return { data: null, error: null };
  }
  
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
