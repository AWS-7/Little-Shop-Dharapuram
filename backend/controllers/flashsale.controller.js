/**
 * Flash Sale Controller
 */

const database = require('../config/database');

exports.getAllFlashSales = async (req, res) => {
  try {
    const sales = await database.getMany(
      'SELECT * FROM flash_sales ORDER BY created_at DESC'
    );
    res.json({ success: true, data: sales });
  } catch (error) {
    if (error.message && error.message.includes("doesn't exist")) {
      return res.json({ success: true, data: [], note: 'flash_sales table not created yet' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch flash sales' });
  }
};

exports.getActiveFlashSale = async (req, res) => {
  try {
    const sale = await database.getOne(
      `SELECT * FROM flash_sales
       WHERE is_active = TRUE
       AND start_time <= NOW()
       AND end_time >= NOW()
       LIMIT 1`
    );
    if (!sale) {
      return res.json({ success: true, data: null, message: 'No active flash sale' });
    }
    const products = await database.getMany(
      `SELECT p.*, fsp.special_price, fsp.quantity_limit, fsp.sold_count
       FROM flash_sale_products fsp
       JOIN products p ON fsp.product_id = p.id
       WHERE fsp.flash_sale_id = ?`,
      [sale.id]
    );
    sale.products = products;
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch active flash sale' });
  }
};

exports.createFlashSale = async (req, res) => {
  try {
    const { name, description, discountType, discountValue, startTime, endTime, isActive, bannerImage, displayOnHomepage } = req.body;
    const id = await database.insert(
      `INSERT INTO flash_sales (name, description, discount_type, discount_value, start_time, end_time, is_active, banner_image, display_on_homepage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, discountType || 'percentage', discountValue, startTime, endTime, isActive !== false, bannerImage, displayOnHomepage !== false]
    );
    const sale = await database.getOne('SELECT * FROM flash_sales WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create flash sale' });
  }
};

exports.updateFlashSale = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const allowed = ['name','description','discount_type','discount_value','start_time','end_time','is_active','banner_image','display_on_homepage'];
    const sets = [];
    const vals = [];
    for (const [k, v] of Object.entries(updates)) {
      if (allowed.includes(k)) { sets.push(`${k} = ?`); vals.push(v); }
    }
    if (sets.length === 0) return res.status(400).json({ success: false, message: 'No valid fields' });
    vals.push(id);
    await database.query(`UPDATE flash_sales SET ${sets.join(', ')} WHERE id = ?`, vals);
    const sale = await database.getOne('SELECT * FROM flash_sales WHERE id = ?', [id]);
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update flash sale' });
  }
};

exports.deleteFlashSale = async (req, res) => {
  try {
    await database.query('DELETE FROM flash_sales WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Flash sale deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete flash sale' });
  }
};
