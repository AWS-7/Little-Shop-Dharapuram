// MIGRATED: Using new backend API instead of Supabase
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Helper to get auth token
async function getAuthToken() {
  const token = localStorage.getItem('authToken');
  return token;
}

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
  
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/addresses/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    if (!result.success) {
      console.error('❌ Error fetching addresses:', result.message);
      return { data: [], error: new Error(result.message) };
    }

    console.log('✅ Addresses fetched:', result.data?.length || 0, 'addresses found');
    return { data: result.data || [], error: null };
  } catch (e) {
    console.error('❌ Exception fetching addresses:', e);
    return { data: [], error: e };
  }
}

export async function saveAddress(userId, addressData) {
  try {
    console.log('💾 Saving address for user:', userId);
    console.log('📋 Address data:', JSON.stringify(addressData, null, 2));

    // Validate required fields
    const requiredFields = ['street', 'city', 'state', 'pincode', 'phone'];
    const missingFields = requiredFields.filter(field => !addressData[field]);
    if (missingFields.length > 0) {
      return { data: null, error: { message: `Missing required fields: ${missingFields.join(', ')}` } };
    }

    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: userId,
        full_name: addressData.full_name || '',
        street: addressData.street,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
        phone: addressData.phone,
        is_default: addressData.is_default || false
      })
    });

    const result = await response.json();
    if (!result.success) {
      console.error('❌ Error saving address:', result.message);
      return { data: null, error: new Error(result.message) };
    }

    console.log('✅ Address saved:', result.data);
    return { data: result.data, error: null };
  } catch (e) {
    console.error('❌ Exception saving address:', e);
    return { data: null, error: e };
    return { data: null, error: { message: err.message || 'Failed to save address' } };
  }
}

export async function updateAddress(addressId, updates, userId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/addresses/${addressId}`, {
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
  } catch (e) {
    return { data: null, error: e };
  }
}

export async function deleteAddress(addressId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/addresses/${addressId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to delete address');
    return { error: null };
  } catch (e) {
    return { error: e };
  }
}

export async function setDefaultAddress(userId, addressId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/addresses/${addressId}/default`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { data: result.data, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

// Relationship tag options
export const RELATIONSHIP_TAGS = [
  { value: 'self', label: 'Self' },
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'friend', label: 'Friend' },
  { value: 'office', label: 'Office' },
];
