/**
 * Address Controller
 */

const database = require('../config/database');

/**
 * Convert Firebase UID to UUID for database
 */
const toUUID = (str) => {
  if (!str) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str.toLowerCase();
  }
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const hashHex = Math.abs(hash).toString(16).padStart(8, '0');
  const seg1 = hashHex.slice(0, 8);
  const seg2 = hashHex.slice(0, 4);
  const seg3 = '4' + hashHex.slice(1, 4);
  const seg4 = (8 + (Math.abs(hash) % 4)).toString() + hashHex.slice(0, 3);
  const seg5 = str.split('').reduce((acc, char) => acc + char.charCodeAt(0).toString(16), '').slice(0, 12).padStart(12, '0');
  
  return `${seg1}-${seg2}-${seg3}-${seg4}-${seg5}`.toLowerCase();
};

/**
 * Get all addresses for user
 */
exports.getAddresses = async (req, res) => {
  try {
    const userId = req.userId;
    const firebaseUid = req.firebaseUid;
    
    let sql = 'SELECT * FROM addresses WHERE 1=1';
    const params = [];
    
    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    } else if (firebaseUid) {
      sql += ' AND firebase_uid = ?';
      params.push(firebaseUid);
    } else {
      return res.json({
        success: true,
        data: []
      });
    }
    
    sql += ' ORDER BY is_default DESC, created_at DESC';
    
    const addresses = await database.getMany(sql, params);
    
    res.json({
      success: true,
      data: addresses
    });
    
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses'
    });
  }
};

/**
 * Create new address
 */
exports.createAddress = async (req, res) => {
  try {
    const {
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country = 'India',
      landmark,
      addressType = 'home',
      relationshipTag,
      isDefault
    } = req.body;
    
    if (!name || !phone || !addressLine1 || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const userId = req.userId;
    const firebaseUid = req.firebaseUid;
    const uuid = firebaseUid ? toUUID(firebaseUid) : null;
    
    // If setting as default, unset other defaults first
    if (isDefault) {
      if (userId) {
        await database.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
      } else if (firebaseUid) {
        await database.query('UPDATE addresses SET is_default = FALSE WHERE firebase_uid = ?', [firebaseUid]);
      }
    }
    
    const addressId = await database.insert(
      `INSERT INTO addresses (
        user_id, firebase_uid, name, phone, address_line1, address_line2,
        city, state, postal_code, country, landmark, address_type, relationship_tag, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, firebaseUid, name, phone, addressLine1, addressLine2,
        city, state, postalCode, country, landmark, addressType, relationshipTag,
        isDefault !== undefined ? isDefault : false
      ]
    );
    
    const newAddress = await database.getOne(
      'SELECT * FROM addresses WHERE id = ?',
      [addressId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: newAddress
    });
    
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create address'
    });
  }
};

/**
 * Update address
 */
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const firebaseUid = req.firebaseUid;
    
    // Check ownership
    const address = await database.getOne(
      'SELECT * FROM addresses WHERE id = ? AND (user_id = ? OR firebase_uid = ?)',
      [id, userId, firebaseUid]
    );
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    const {
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      landmark,
      addressType,
      relationshipTag
    } = req.body;
    
    await database.query(
      `UPDATE addresses SET 
        name = ?, phone = ?, address_line1 = ?, address_line2 = ?,
        city = ?, state = ?, postal_code = ?, country = ?, landmark = ?,
        address_type = ?, relationship_tag = ?
       WHERE id = ?`,
      [
        name || address.name,
        phone || address.phone,
        addressLine1 || address.address_line1,
        addressLine2 || address.address_line2,
        city || address.city,
        state || address.state,
        postalCode || address.postal_code,
        country || address.country,
        landmark || address.landmark,
        addressType || address.address_type,
        relationshipTag || address.relationship_tag,
        id
      ]
    );
    
    const updatedAddress = await database.getOne(
      'SELECT * FROM addresses WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Address updated successfully',
      data: updatedAddress
    });
    
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address'
    });
  }
};

/**
 * Delete address
 */
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const firebaseUid = req.firebaseUid;
    
    const result = await database.query(
      'DELETE FROM addresses WHERE id = ? AND (user_id = ? OR firebase_uid = ?)',
      [id, userId, firebaseUid]
    );
    
    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address'
    });
  }
};

/**
 * Set default address
 */
exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const firebaseUid = req.firebaseUid;
    
    // Check ownership
    const address = await database.getOne(
      'SELECT * FROM addresses WHERE id = ? AND (user_id = ? OR firebase_uid = ?)',
      [id, userId, firebaseUid]
    );
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // Unset all defaults first
    if (userId) {
      await database.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
    } else if (firebaseUid) {
      await database.query('UPDATE addresses SET is_default = FALSE WHERE firebase_uid = ?', [firebaseUid]);
    }
    
    // Set new default
    await database.query(
      'UPDATE addresses SET is_default = TRUE WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Default address updated'
    });
    
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update default address'
    });
  }
};
