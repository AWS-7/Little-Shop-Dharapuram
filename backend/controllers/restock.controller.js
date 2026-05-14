/**
 * Restock Notification Controller
 */

const database = require('../config/database');

exports.getAggregated = async (req, res) => {
  try {
    const stats = await database.getOne(
      `SELECT
        COUNT(*) as totalRequests,
        COUNT(DISTINCT product_id) as uniqueProducts,
        SUM(CASE WHEN is_notified = TRUE THEN 1 ELSE 0 END) as notifiedCount
       FROM restock_notifications`
    );
    const recent = await database.getMany(
      `SELECT rn.*, p.name as product_name, p.stock_quantity as current_stock
       FROM restock_notifications rn
       JOIN products p ON rn.product_id = p.id
       ORDER BY rn.created_at DESC
       LIMIT 50`
    );
    res.json({
      success: true,
      data: {
        stats: stats || { totalRequests: 0, uniqueProducts: 0, notifiedCount: 0 },
        recent: recent || []
      }
    });
  } catch (error) {
    console.error('Restock aggregated error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch restock data' });
  }
};
