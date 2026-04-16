import { supabase } from './supabase';

// ── CRUD operations for user addresses ──

export async function getAddresses(userId) {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function createAddress(userId, address) {
  console.log('Creating address for user:', userId, 'with data:', address);
  // If this is the first address or marked default, unset other defaults
  if (address.is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);
  }
  const { data, error } = await supabase
    .from('addresses')
    .insert({ ...address, user_id: userId })
    .select()
    .single();
  console.log('Create address result:', { data, error });
  return { data, error };
}

export async function updateAddress(addressId, updates) {
  // If setting as default, unset others first
  if (updates.is_default) {
    const { data: existing } = await supabase
      .from('addresses')
      .select('user_id')
      .eq('id', addressId)
      .single();
    if (existing) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', existing.user_id);
    }
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
  // Unset all defaults for this user
  await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', userId);
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
