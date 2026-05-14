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
  try {
    const {
      items,
      shippingAddressId,
      shippingAddress,
      billingAddress,
      paymentMethod,
      couponCode,
      notes,
      customer
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items are required' });
    }

    const userId = req.userId || null;
    const firebaseUid = req.firebaseUid || null;
    const finalShipping = shippingAddress || customer || null;
    const finalBilling = billingAddress || customer || null;
    const finalPayment = paymentMethod || 'cod';

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const pid = item.productId || item.id || item.product_id;
      if (!pid) continue;

      const product = await database.getOne('SELECT id, name, sku, featured_image, price, stock_quantity FROM products WHERE id = ? AND is_active = TRUE', [pid]);
      if (!product) throw new Error(`Product ${pid} not found`);
      if (product.stock_quantity < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      orderItems.push({ productId: pid, productName: product.name, productSku: product.sku, productImage: product.featured_image, quantity: item.quantity, unitPrice: product.price, totalPrice: itemTotal, size: item.size, color: item.color });
    }

    const shippingCost = subtotal >= 999 ? 0 : 50;
    const totalAmount = subtotal + shippingCost;
    const orderNumber = generateOrderNumber();

    // Build safe params array
    const params = [
      orderNumber,
      userId,
      firebaseUid,
      shippingAddressId || null,
      finalShipping ? JSON.stringify(finalShipping) : null,
      finalBilling ? JSON.stringify(finalBilling) : null,
      subtotal,
      shippingCost,
      0, // tax_amount
      0, // discount_amount
      couponCode || null,
      totalAmount,
      finalPayment,
      notes || null,
      req.ip || null
    ];

    // Ensure no undefined values
    const safeParams = params.map(v => v === undefined ? null : v);

    const orderId = await database.insert(
      `INSERT INTO orders (order_number, user_id, firebase_uid, shipping_address_id, shipping_address, billing_address, subtotal, shipping_cost, tax_amount, discount_amount, coupon_code, total_amount, status, payment_status, payment_method, notes, ip_address, ordered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, ?, ?, NOW())`,
      safeParams
    );

    // Insert order items and update stock
    for (const item of orderItems) {
      await database.insert(
        `INSERT INTO order_items (order_id, product_id, product_name, product_sku, product_image, quantity, unit_price, total_price, size, color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.productName, item.productSku || null, item.productImage || null, item.quantity, item.unitPrice, item.totalPrice, item.size || null, item.color || null]
      );
      await database.query('UPDATE products SET stock_quantity = stock_quantity - ?, sales_count = sales_count + ? WHERE id = ?', [item.quantity, item.quantity, item.productId]);
    }

    // Clear cart
    if (userId) await database.query('DELETE FROM carts WHERE user_id = ?', [userId]);
    else if (firebaseUid) await database.query('DELETE FROM carts WHERE firebase_uid = ?', [firebaseUid]);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { orderId, orderNumber, totalAmount, status: 'pending', paymentStatus: 'pending' }
    });

  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create order' });
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
    
    const safeLimit = parseInt(limit) || 10;
    const safeOffset = parseInt(offset) || 0;

    // Get orders — LIMIT/OFFSET interpolated directly
    const orders = await database.getMany(
      `SELECT id, order_number, total_amount, status, payment_status, ordered_at, shipping_address
       FROM orders
       ${whereClause}
       ORDER BY ordered_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
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
    if (error.message && error.message.includes("doesn't exist")) {
      return res.json({ success: true, data: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0 }, note: 'orders table not created yet' });
    }
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
    
    const safeLimit = parseInt(limit) || 20;
    const safeOffset = parseInt(offset) || 0;

    // Get total count
    const countResult = await database.getOne(
      `SELECT COUNT(*) as total FROM orders WHERE ${whereClause}`,
      params
    );

    // Get orders — LIMIT/OFFSET interpolated directly (mysql2 execute() can't handle these as params)
    const orders = await database.getMany(
      `SELECT * FROM orders
       WHERE ${whereClause}
       ORDER BY ordered_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
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
    if (error.message && error.message.includes("doesn't exist")) {
      return res.json({ success: true, data: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0 }, note: 'orders table not created yet' });
    }
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
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'Packed', 'Shipped', 'Out for Delivery', 'delivered', 'cancelled'];
    
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

/**
 * Get new orders since a timestamp (for admin notifications)
 */
exports.getNewOrders = async (req, res) => {
  try {
    const since = req.query.since;
    const query = since
      ? 'SELECT id, order_number, total_amount, status, payment_status, ordered_at FROM orders WHERE ordered_at > ? ORDER BY ordered_at DESC'
      : 'SELECT id, order_number, total_amount, status, payment_status, ordered_at FROM orders ORDER BY ordered_at DESC LIMIT 10';
    const params = since ? [since] : [];
    const orders = await database.getMany(query, params);
    res.json({ success: true, data: orders });
  } catch (error) {
    if (error.message && error.message.includes("doesn't exist")) {
      return res.json({ success: true, data: [], note: 'orders table not created yet' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch new orders' });
  }
};
