/**
 * Banner Controller
 */

const database = require('../config/database');

exports.getAllBanners = async (req, res) => {
  try {
    const banners = await database.getMany(
      `SELECT hb.*, u.display_name as created_by_name
       FROM hero_banners hb
       LEFT JOIN users u ON hb.created_by = u.id
       WHERE hb.is_active = TRUE
       ORDER BY hb.display_order ASC, hb.created_at DESC`
    );
    res.json({ success: true, data: banners });
  } catch (error) {
    if (error.message && error.message.includes("doesn't exist")) {
      return res.json({ success: true, data: [], note: 'hero_banners table not created yet' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch banners' });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      image,
      mobileImage,
      buttonText,
      buttonLink,
      displayOrder,
      sort_order,
      startDate,
      endDate,
      is_active
    } = req.body;

    const id = await database.insert(
      `INSERT INTO hero_banners (title, subtitle, description, image, mobile_image, button_text, button_link, display_order, start_date, end_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title ?? null,
        subtitle ?? null,
        description ?? null,
        image ?? null,
        mobileImage ?? null,
        buttonText ?? null,
        buttonLink ?? null,
        displayOrder ?? sort_order ?? 0,
        startDate ?? null,
        endDate ?? null,
        is_active !== undefined ? is_active : true
      ]
    );
    const banner = await database.getOne('SELECT * FROM hero_banners WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    console.error('Create banner error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create banner: ' + error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const allowed = ['title','subtitle','description','image','mobile_image','button_text','button_link','display_order','is_active','start_date','end_date'];
    const sets = [];
    const vals = [];
    for (const [k, v] of Object.entries(updates)) {
      if (allowed.includes(k)) {
        sets.push(`${k} = ?`);
        vals.push(v === undefined ? null : v);
      }
    }
    if (sets.length === 0) return res.status(400).json({ success: false, message: 'No valid fields' });
    vals.push(id);
    await database.query(`UPDATE hero_banners SET ${sets.join(', ')} WHERE id = ?`, vals);
    const banner = await database.getOne('SELECT * FROM hero_banners WHERE id = ?', [id]);
    res.json({ success: true, data: banner });
  } catch (error) {
    console.error('Update banner error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update banner: ' + error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    await database.query('DELETE FROM hero_banners WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete banner' });
  }
};
