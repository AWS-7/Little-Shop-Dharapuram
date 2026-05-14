/**
 * Coupon Controller
 */

const database = require('../config/database');

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await database.getMany(
      'SELECT * FROM coupons ORDER BY created_at DESC'
    );
    res.json({ success: true, data: coupons });
  } catch (error) {
    if (error.message && error.message.includes("doesn't exist")) {
      return res.json({ success: true, data: [], note: 'coupons table not created yet' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, userLimit, startDate, endDate, isActive, applicableCategories, applicableProducts } = req.body;
    const id = await database.insert(
      `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, user_limit, start_date, end_date, is_active, applicable_categories, applicable_products)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, description, discountType || 'percentage', discountValue, minOrderAmount, maxDiscount, usageLimit, userLimit, startDate, endDate, isActive !== false, JSON.stringify(applicableCategories || []), JSON.stringify(applicableProducts || [])]
    );
    const coupon = await database.getOne('SELECT * FROM coupons WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create coupon' });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const allowed = ['code','description','discount_type','discount_value','min_order_amount','max_discount','usage_limit','user_limit','start_date','end_date','is_active','applicable_categories','applicable_products'];
    const sets = [];
    const vals = [];
    for (const [k, v] of Object.entries(updates)) {
      if (allowed.includes(k)) {
        sets.push(`${k} = ?`);
        vals.push((k === 'applicable_categories' || k === 'applicable_products') ? JSON.stringify(v) : v);
      }
    }
    if (sets.length === 0) return res.status(400).json({ success: false, message: 'No valid fields' });
    vals.push(id);
    await database.query(`UPDATE coupons SET ${sets.join(', ')} WHERE id = ?`, vals);
    const coupon = await database.getOne('SELECT * FROM coupons WHERE id = ?', [id]);
    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update coupon' });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    await database.query('DELETE FROM coupons WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
};
