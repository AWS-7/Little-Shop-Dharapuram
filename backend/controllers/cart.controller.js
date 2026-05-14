/**
 * Cart Controller
 * Handles cart operations
 */

const database = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Get cart items
 */
exports.getCart = async (req, res) => {
  try {
    let userId = req.userId || null;
    let firebaseUid = req.firebaseUid || null;
    let sessionId = req.headers['x-session-id'] || null;
    
    // Build query based on available identifiers
    let sql = `
      SELECT c.*, 
             p.name as product_name, 
             p.price as product_price,
             p.compare_price as compare_price,
             p.featured_image as product_image,
             p.stock_quantity as available_stock,
             p.sku as product_sku
      FROM carts c
      JOIN products p ON c.product_id = p.id
      WHERE 1=1
    `;
    const params = [];
    
    if (userId) {
      sql += ' AND c.user_id = ?';
      params.push(userId);
    } else if (firebaseUid) {
      sql += ' AND c.firebase_uid = ?';
      params.push(firebaseUid);
    } else if (sessionId) {
      sql += ' AND c.session_id = ?';
      params.push(sessionId);
    } else {
      // Return empty cart for new visitors
      return res.json({
        success: true,
        data: {
          items: [],
          summary: {
            totalItems: 0,
            subtotal: 0,
            total: 0
          }
        },
        sessionId: uuidv4() // Generate new session for guest
      });
    }
    
    sql += ' ORDER BY c.added_at DESC';
    
    const cartItems = await database.getMany(sql, params);
    
    // Calculate totals
    let subtotal = 0;
    let totalItems = 0;
    
    const formattedItems = cartItems.map(item => {
      const itemTotal = item.product_price * item.quantity;
      subtotal += itemTotal;
      totalItems += item.quantity;
      
      return {
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        productPrice: item.product_price,
        comparePrice: item.compare_price,
        productImage: item.product_image,
        productSku: item.product_sku,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        maxQuantity: item.available_stock,
        itemTotal: itemTotal,
        addedAt: item.added_at
      };
    });
    
    res.json({
      success: true,
      data: {
        items: formattedItems,
        summary: {
          totalItems,
          subtotal,
          total: subtotal
        }
      },
      ...(sessionId && { sessionId })
    });
    
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart'
    });
  }
};

/**
 * Add to cart
 */
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, size, color } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Check if product exists and has stock
    const product = await database.getOne(
      'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
      [productId]
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (product.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock_quantity} items available in stock`
      });
    }
    
    let userId = req.userId || null;
    let firebaseUid = req.firebaseUid || null;
    let sessionId = req.headers['x-session-id'];
    
    // Generate session ID for guests
    if (!userId && !firebaseUid && !sessionId) {
      sessionId = uuidv4();
    }
    
    // Check if item already exists in cart
    let existingCartItem = null;
    
    if (userId) {
      existingCartItem = await database.getOne(
        'SELECT * FROM carts WHERE user_id = ? AND product_id = ? AND (size = ? OR (size IS NULL AND ? IS NULL)) AND (color = ? OR (color IS NULL AND ? IS NULL))',
        [userId, productId, size, size, color, color]
      );
    } else if (firebaseUid) {
      existingCartItem = await database.getOne(
        'SELECT * FROM carts WHERE firebase_uid = ? AND product_id = ? AND (size = ? OR (size IS NULL AND ? IS NULL)) AND (color = ? OR (color IS NULL AND ? IS NULL))',
        [firebaseUid, productId, size, size, color, color]
      );
    } else if (sessionId) {
      existingCartItem = await database.getOne(
        'SELECT * FROM carts WHERE session_id = ? AND product_id = ? AND (size = ? OR (size IS NULL AND ? IS NULL)) AND (color = ? OR (color IS NULL AND ? IS NULL))',
        [sessionId, productId, size, size, color, color]
      );
    }
    
    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity;
      
      if (newQuantity > product.stock_quantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Only ${product.stock_quantity} items available.`
        });
      }
      
      await database.query(
        'UPDATE carts SET quantity = ? WHERE id = ?',
        [newQuantity, existingCartItem.id]
      );
      
      return res.json({
        success: true,
        message: 'Cart updated successfully',
        data: {
          cartItemId: existingCartItem.id,
          quantity: newQuantity
        },
        ...(sessionId && { sessionId })
      });
    }
    
    // Insert new cart item
    const cartItemId = await database.insert(
      'INSERT INTO carts (user_id, firebase_uid, session_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, firebaseUid, sessionId, productId, quantity, size, color]
    );
    
    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: {
        cartItemId,
        quantity
      },
      ...(sessionId && { sessionId })
    });
    
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart'
    });
  }
};

/**
 * Update cart item quantity
 */
exports.updateCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }
    
    // Get cart item with product details
    const cartItem = await database.getOne(
      `SELECT c.*, p.stock_quantity, p.price, p.name 
       FROM carts c
       JOIN products p ON c.product_id = p.id
       WHERE c.id = ? AND (c.user_id = ? OR c.firebase_uid = ?)`,
      [cartItemId, req.userId, req.firebaseUid]
    );
    
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }
    
    if (quantity > cartItem.stock_quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${cartItem.stock_quantity} items available in stock`
      });
    }
    
    await database.query(
      'UPDATE carts SET quantity = ? WHERE id = ?',
      [quantity, cartItemId]
    );
    
    res.json({
      success: true,
      message: 'Quantity updated',
      data: {
        cartItemId,
        quantity,
        itemTotal: cartItem.price * quantity
      }
    });
    
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item'
    });
  }
};

/**
 * Remove from cart
 */
exports.removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    
    const result = await database.query(
      'DELETE FROM carts WHERE id = ? AND (user_id = ? OR firebase_uid = ?)',
      [cartItemId, req.userId, req.firebaseUid]
    );
    
    res.json({
      success: true,
      message: 'Item removed from cart'
    });
    
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item'
    });
  }
};

/**
 * Clear cart
 */
exports.clearCart = async (req, res) => {
  try {
    if (req.userId) {
      await database.query('DELETE FROM carts WHERE user_id = ?', [req.userId]);
    } else if (req.firebaseUid) {
      await database.query('DELETE FROM carts WHERE firebase_uid = ?', [req.firebaseUid]);
    }
    
    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
    
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
};

/**
 * Sync cart (guest to logged-in user)
 */
exports.syncCart = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.userId;
    const firebaseUid = req.firebaseUid;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({
        success: true,
        message: 'No items to sync'
      });
    }
    
    for (const item of items) {
      // Check if item already exists
      const existingItem = await database.getOne(
        'SELECT * FROM carts WHERE user_id = ? AND product_id = ?',
        [userId, item.productId]
      );
      
      if (existingItem) {
        // Update quantity
        await database.query(
          'UPDATE carts SET quantity = quantity + ? WHERE id = ?',
          [item.quantity, existingItem.id]
        );
      } else {
        // Insert new item
        await database.insert(
          'INSERT INTO carts (user_id, firebase_uid, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, firebaseUid, item.productId, item.quantity, item.size, item.color]
        );
      }
    }
    
    res.json({
      success: true,
      message: 'Cart synced successfully'
    });
    
  } catch (error) {
    console.error('Sync cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync cart'
    });
  }
};

/**
 * Get cart summary
 */
exports.getCartSummary = async (req, res) => {
  try {
    let sql = `
      SELECT 
        COUNT(c.id) as totalItems,
        SUM(c.quantity) as totalQuantity,
        SUM(c.quantity * p.price) as subtotal
      FROM carts c
      JOIN products p ON c.product_id = p.id
      WHERE 1=1
    `;
    const params = [];
    
    if (req.userId) {
      sql += ' AND c.user_id = ?';
      params.push(req.userId);
    } else if (req.firebaseUid) {
      sql += ' AND c.firebase_uid = ?';
      params.push(req.firebaseUid);
    } else {
      return res.json({
        success: true,
        data: {
          totalItems: 0,
          totalQuantity: 0,
          subtotal: 0,
          total: 0
        }
      });
    }
    
    const summary = await database.getOne(sql, params);
    
    res.json({
      success: true,
      data: {
        totalItems: summary.totalItems || 0,
        totalQuantity: summary.totalQuantity || 0,
        subtotal: summary.subtotal || 0,
        total: summary.subtotal || 0
      }
    });
    
  } catch (error) {
    console.error('Get cart summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart summary'
    });
  }
};

/**
 * Get abandoned carts (admin only)
 */
exports.getAbandonedCarts = async (req, res) => {
  try {
    const { since, until } = req.query;
    // Abandoned = carts updated more than 24h ago (no is_abandoned column in schema)
    let sql = `
      SELECT c.*,
             p.name as product_name,
             p.price as product_price,
             p.featured_image as product_image,
             u.email as user_email,
             u.display_name as user_name
      FROM carts c
      JOIN products p ON c.product_id = p.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.updated_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;
    const params = [];
    if (since) {
      sql += ' AND c.updated_at >= ?';
      params.push(since);
    }
    if (until) {
      sql += ' AND c.updated_at <= ?';
      params.push(until);
    }
    sql += ' ORDER BY c.updated_at DESC';
    const carts = await database.getMany(sql, params);
    res.json({ success: true, data: carts });
  } catch (error) {
    console.error('Get abandoned carts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch abandoned carts' });
  }
};

/**
 * Mark cart as converted (after order placed)
 */
exports.markCartConverted = async (req, res) => {
  try {
    const { userId } = req.params;
    // userId is a Firebase UID string, not an INT — only match firebase_uid column
    await database.query(
      'DELETE FROM carts WHERE firebase_uid = ?',
      [userId]
    );
    res.json({ success: true, message: 'Cart marked as converted' });
  } catch (error) {
    console.error('Mark cart converted error:', error);
    res.status(500).json({ success: false, message: 'Failed to convert cart' });
  }
};

/**
 * Mark reminder as sent for abandoned cart
 */
exports.markReminderSent = async (req, res) => {
  try {
    const { cartId } = req.params;
    await database.query(
      'UPDATE carts SET reminder_sent = TRUE WHERE id = ?',
      [cartId]
    );
    res.json({ success: true, message: 'Reminder marked as sent' });
  } catch (error) {
    console.error('Mark reminder sent error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark reminder' });
  }
};
