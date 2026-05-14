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
const couponRoutes = require('./coupon.routes');
const bannerRoutes = require('./banner.routes');
const flashSaleRoutes = require('./flashsale.routes');
const testimonialRoutes = require('./testimonial.routes');
const restockRoutes = require('./restock.routes');
const uploadRoutes = require('./upload.routes');
const authRoutes = require('./auth.routes');
const productController = require('../controllers/product.controller');

// Mount routes
router.use('/auth', authRoutes);

// Direct category route (ensure it matches before nested router)
router.get('/products/category/:categorySlug', productController.getProductsByCategory);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/carts', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/addresses', addressRoutes);
router.use('/coupons', couponRoutes);
router.use('/banners', bannerRoutes);
router.use('/flash-sales', flashSaleRoutes);
router.use('/testimonials', testimonialRoutes);
router.use('/restock', restockRoutes);
router.use('/uploads', uploadRoutes);

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
