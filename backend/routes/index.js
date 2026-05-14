/**
 * API Routes Index
 * Aggregates all route modules
 */

const express = require('express');
const router = express.Router();

// Import route modules
// const authRoutes = require('./auth.routes'); // TODO: Create this file
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');
const addressRoutes = require('./address.routes');
// const userRoutes = require('./user.routes'); // TODO: Create this file
// const couponRoutes = require('./coupon.routes'); // TODO: Create this file
// const bannerRoutes = require('./banner.routes'); // TODO: Create this file
// const flashSaleRoutes = require('./flashsale.routes'); // TODO: Create this file
// const testimonialRoutes = require('./testimonial.routes'); // TODO: Create this file
const uploadRoutes = require('./upload.routes');
// const settingsRoutes = require('./settings.routes'); // TODO: Create this file
// const adminRoutes = require('./admin.routes'); // TODO: Create this file

// Mount routes
// router.use('/auth', authRoutes); // TODO: Enable when auth.routes.js created
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/addresses', addressRoutes);
// router.use('/users', userRoutes); // TODO: Enable when created
// router.use('/coupons', couponRoutes); // TODO: Enable when created
// router.use('/banners', bannerRoutes); // TODO: Enable when created
// router.use('/flash-sales', flashSaleRoutes); // TODO: Enable when created
// router.use('/testimonials', testimonialRoutes); // TODO: Enable when created
router.use('/uploads', uploadRoutes);
// router.use('/settings', settingsRoutes); // TODO: Enable when created
// router.use('/admin', adminRoutes); // TODO: Enable when created

// Dashboard/Analytics routes
router.get('/dashboard/stats', async (req, res) => {
  try {
    const db = require('../config/database');
    
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      pendingOrders,
      todayOrders
    ] = await Promise.all([
      db.count('products', 'WHERE is_active = TRUE'),
      db.count('orders'),
      db.count('users'),
      db.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = "paid"'),
      db.count('orders', 'WHERE status = "pending"'),
      db.count('orders', 'WHERE DATE(ordered_at) = CURDATE()')
    ]);
    
    res.json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue: totalRevenue[0].total,
        pendingOrders,
        todayOrders,
        revenueGrowth: 0, // Calculate based on previous period
        orderGrowth: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
});

module.exports = router;
