/**
 * Testimonial Controller
 */

const database = require('../config/database');

exports.getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await database.getMany(
      `SELECT t.id,
              t.customer_name as name,
              t.customer_image as avatar,
              t.customer_location as location,
              t.rating,
              LEFT(t.content, 50) as title,
              t.content as review,
              t.product_id,
              t.is_active,
              t.display_order,
              t.created_at,
              p.name as product_name
       FROM testimonials t
       LEFT JOIN products p ON t.product_id = p.id
       WHERE t.is_active = TRUE
       ORDER BY t.display_order ASC, t.created_at DESC`
    );
    res.json({ success: true, data: testimonials });
  } catch (error) {
    if (error.message && error.message.includes("doesn't exist")) {
      return res.json({ success: true, data: [], note: 'testimonials table not created yet' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch testimonials' });
  }
};

exports.createTestimonial = async (req, res) => {
  try {
    const { customerName, customerImage, customerLocation, rating, content, productId, displayOrder } = req.body;
    const id = await database.insert(
      `INSERT INTO testimonials (customer_name, customer_image, customer_location, rating, content, product_id, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customerName, customerImage, customerLocation, rating, content, productId, displayOrder || 0]
    );
    const testimonial = await database.getOne('SELECT * FROM testimonials WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create testimonial' });
  }
};

exports.updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const allowed = ['customer_name','customer_image','customer_location','rating','content','product_id','is_active','display_order'];
    const sets = [];
    const vals = [];
    for (const [k, v] of Object.entries(updates)) {
      if (allowed.includes(k)) { sets.push(`${k} = ?`); vals.push(v); }
    }
    if (sets.length === 0) return res.status(400).json({ success: false, message: 'No valid fields' });
    vals.push(id);
    await database.query(`UPDATE testimonials SET ${sets.join(', ')} WHERE id = ?`, vals);
    const testimonial = await database.getOne('SELECT * FROM testimonials WHERE id = ?', [id]);
    res.json({ success: true, data: testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update testimonial' });
  }
};

exports.deleteTestimonial = async (req, res) => {
  try {
    await database.query('DELETE FROM testimonials WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Testimonial deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete testimonial' });
  }
};
