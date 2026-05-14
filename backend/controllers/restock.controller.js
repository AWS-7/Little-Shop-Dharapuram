/**
 * Restock Notification Controller
 */

const database = require('../config/database');

exports.getPendingByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const requests = await database.getMany(
      `SELECT * FROM restock_notifications
       WHERE product_id = ? AND is_notified = FALSE
       ORDER BY created_at DESC`,
      [productId]
    );
    res.json({ success: true, data: requests || [] });
  } catch (error) {
    if (error.message && error.message.includes("doesn't exist")) {
      return res.json({ success: true, data: [], note: 'restock_notifications table not created yet' });
    }
    console.error('Get pending restock error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending restock requests' });
  }
};

exports.getRequestCount = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await database.getOne(
      'SELECT COUNT(*) as count FROM restock_notifications WHERE product_id = ?',
      [productId]
    );
    res.json({ success: true, data: result?.count || 0 });
  } catch (error) {
    if (error.message && error.message.includes("doesn't exist")) {
      return res.json({ success: true, data: 0, note: 'restock_notifications table not created yet' });
    }
    console.error('Get restock count error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch restock count' });
  }
};

exports.markRequestsAsNotified = async (req, res) => {
  try {
    const { productId } = req.params;
    await database.query(
      'UPDATE restock_notifications SET is_notified = TRUE, notified_at = NOW() WHERE product_id = ? AND is_notified = FALSE',
      [productId]
    );
    res.json({ success: true, message: 'Restock requests marked as notified' });
  } catch (error) {
    if (error.message && error.message.includes("doesn't exist")) {
      return res.json({ success: true, data: [], note: 'restock_notifications table not created yet' });
    }
    console.error('Mark restock notified error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark restock requests' });
  }
};

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
