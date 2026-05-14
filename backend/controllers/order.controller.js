/**
 * Order Controller
 * Handles order creation, management, and history
 */

const database = require('../config/database');

/**
 * Generate unique order number
 */
const generateOrderNumber = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `LS${year}${random}`;
};

/**
 * Create new order
 */
exports.createOrder = async (req, res) => {
  const connection = await database.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      items,
      shippingAddressId,
      shippingAddress,
      billingAddress,
      paymentMethod,
      couponCode,
      notes
    } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }
    
    const userId = req.userId;
    const firebaseUid = req.firebaseUid;
    
    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await database.getOne(
        'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
        [item.productId]
      );
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      
      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`);
      }
      
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      
      orderItems.push({
        productId: item.productId,
        productName: product.name,
        productSku: product.sku,
        productImage: product.featured_image,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal,
        size: item.size,
        color: item.color
      });
    }
    
    // Calculate totals
    const shippingCost = subtotal >= 999 ? 0 : 50; // Free shipping over ₹999
    const taxAmount = 0; // GST included in prices
    let discountAmount = 0;
    
    // Apply coupon if provided
    if (couponCode) {
      const coupon = await database.getOne(
        'SELECT * FROM coupons WHERE code = ? AND is_active = TRUE AND (end_date IS NULL OR end_date >= CURDATE())',
        [couponCode]
      );
      
      if (coupon && subtotal >= coupon.min_order_amount) {
        if (coupon.discount_type === 'percentage') {
          discountAmount = (subtotal * coupon.discount_value) / 100;
          if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
            discountAmount = coupon.max_discount_amount;
          }
        } else {
          discountAmount = coupon.discount_value;
        }
      }
    }
    
    const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;
    
    // Generate order number
    const orderNumber = generateOrderNumber();
    
    // Create order
    const orderId = await database.insert(
      `INSERT INTO orders (
        order_number, user_id, firebase_uid, 
        shipping_address_id, shipping_address, billing_address,
        subtotal, shipping_cost, tax_amount, discount_amount, coupon_code, total_amount,
        status, payment_status, payment_method, notes, ip_address, ordered_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, ?, ?, NOW())`,
      [
        orderNumber, userId, firebaseUid,
        shippingAddressId || null,
        shippingAddress ? JSON.stringify(shippingAddress) : null,
        billingAddress ? JSON.stringify(billingAddress) : null,
        subtotal, shippingCost, taxAmount, discountAmount, couponCode, totalAmount,
        paymentMethod || 'cod',
        notes,
        req.ip
      ]
    );
    
    // Create order items
    for (const item of orderItems) {
      await database.insert(
        `INSERT INTO order_items (
          order_id, product_id, product_name, product_sku, product_image,
          quantity, unit_price, total_price, size, color
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, item.productId, item.productName, item.productSku, item.productImage,
          item.quantity, item.unitPrice, item.totalPrice, item.size, item.color
        ]
      );
      
      // Update product stock
      await database.query(
        'UPDATE products SET stock_quantity = stock_quantity - ?, sales_count = sales_count + ? WHERE id = ?',
        [item.quantity, item.quantity, item.productId]
      );
    }
    
    // Clear user's cart
    if (userId) {
      await database.query('DELETE FROM carts WHERE user_id = ?', [userId]);
    } else if (firebaseUid) {
      await database.query('DELETE FROM carts WHERE firebase_uid = ?', [firebaseUid]);
    }
    
    // Update coupon usage
    if (couponCode) {
      await database.query(
        'UPDATE coupons SET usage_count = usage_count + 1 WHERE code = ?',
        [couponCode]
      );
    }
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId,
        orderNumber,
        totalAmount,
        status: 'pending',
        paymentStatus: 'pending'
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  } finally {
    connection.release();
  }
};

/**
 * Get my orders
 */
exports.getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE user_id = ? OR firebase_uid = ?';
    const params = [req.userId, req.firebaseUid];
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    // Get total count
    const countResult = await database.getOne(
      `SELECT COUNT(*) as total FROM orders ${whereClause}`,
      params
    );
    
    // Get orders
    const orders = await database.getMany(
      `SELECT id, order_number, total_amount, status, payment_status, ordered_at, shipping_address
       FROM orders
       ${whereClause}
       ORDER BY ordered_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await database.getMany(
          'SELECT product_name, product_image, quantity, unit_price, total_price FROM order_items WHERE order_id = ?',
          [order.id]
        );
        return {
          ...order,
          items,
          shippingAddress: order.shipping_address ? JSON.parse(order.shipping_address) : null
        };
      })
    );
    
    res.json({
      success: true,
      data: ordersWithItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.total / limit),
        totalItems: countResult.total
      }
    });
    
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

/**
 * Get order details
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await database.getOne(
      `SELECT * FROM orders WHERE id = ? AND (user_id = ? OR firebase_uid = ?)`,
      [orderId, req.userId, req.firebaseUid]
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Get order items
    const items = await database.getMany(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );
    
    res.json({
      success: true,
      data: {
        ...order,
        shippingAddress: order.shipping_address ? JSON.parse(order.shipping_address) : null,
        billingAddress: order.billing_address ? JSON.parse(order.billing_address) : null,
        items
      }
    });
    
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details'
    });
  }
};

/**
 * Cancel order
 */
exports.cancelOrder = async (req, res) => {
  const connection = await database.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { orderId } = req.params;
    
    const order = await database.getOne(
      'SELECT * FROM orders WHERE id = ? AND (user_id = ? OR firebase_uid = ?)',
      [orderId, req.userId, req.firebaseUid]
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }
    
    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order that has been shipped or delivered'
      });
    }
    
    // Restore stock
    const orderItems = await database.getMany(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );
    
    for (const item of orderItems) {
      await database.query(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }
    
    // Update order status
    await database.query(
      'UPDATE orders SET status = "cancelled" WHERE id = ?',
      [orderId]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  } finally {
    connection.release();
  }
};

/**
 * Get all orders (Admin)
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      paymentStatus,
      startDate,
      endDate,
      search
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereConditions = ['1=1'];
    let params = [];
    
    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }
    
    if (paymentStatus) {
      whereConditions.push('payment_status = ?');
      params.push(paymentStatus);
    }
    
    if (startDate) {
      whereConditions.push('DATE(ordered_at) >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push('DATE(ordered_at) <= ?');
      params.push(endDate);
    }
    
    if (search) {
      whereConditions.push('(order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Get total count
    const countResult = await database.getOne(
      `SELECT COUNT(*) as total FROM orders WHERE ${whereClause}`,
      params
    );
    
    // Get orders
    const orders = await database.getMany(
      `SELECT * FROM orders
       WHERE ${whereClause}
       ORDER BY ordered_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.total / limit),
        totalItems: countResult.total
      }
    });
    
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

/**
 * Update order status (Admin)
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, shippingCarrier, notes } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const updateFields = ['status = ?'];
    const params = [status];
    
    if (trackingNumber) {
      updateFields.push('tracking_number = ?');
      params.push(trackingNumber);
    }
    
    if (shippingCarrier) {
      updateFields.push('shipping_carrier = ?');
      params.push(shippingCarrier);
    }
    
    if (notes) {
      updateFields.push('admin_notes = ?');
      params.push(notes);
    }
    
    params.push(orderId);
    
    await database.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
    
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
};

/**
 * Update payment status (Admin)
 */
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, transactionId, paymentProof } = req.body;
    
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }
    
    await database.query(
      'UPDATE orders SET payment_status = ?, transaction_id = ?, payment_proof = ? WHERE id = ?',
      [paymentStatus, transactionId, paymentProof, orderId]
    );
    
    res.json({
      success: true,
      message: 'Payment status updated successfully'
    });
    
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status'
    });
  }
};
