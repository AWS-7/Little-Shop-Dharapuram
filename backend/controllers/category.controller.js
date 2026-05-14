/**
 * Category Controller
 */

const database = require('../config/database');

/**
 * Get all categories
 */
exports.getAllCategories = async (req, res) => {
  try {
    const { isActive = true } = req.query;
    
    let sql = 'SELECT * FROM categories';
    const params = [];
    
    if (isActive === 'true' || isActive === true) {
      sql += ' WHERE is_active = TRUE';
    }
    
    sql += ' ORDER BY display_order ASC, name ASC';
    
    const categories = await database.getMany(sql, params);
    
    res.json({
      success: true,
      data: categories
    });
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

/**
 * Get category by slug
 */
exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const category = await database.getOne(
      'SELECT * FROM categories WHERE slug = ?',
      [slug]
    );
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Get product count for this category
    const countResult = await database.getOne(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = TRUE',
      [category.id]
    );
    
    category.productCount = countResult.count;
    
    res.json({
      success: true,
      data: category
    });
    
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category'
    });
  }
};

/**
 * Create category (Admin only)
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, slug, image, displayOrder, isActive } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    const categorySlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const categoryId = await database.insert(
      'INSERT INTO categories (name, slug, image, display_order, is_active) VALUES (?, ?, ?, ?, ?)',
      [name, categorySlug, image, displayOrder || 0, isActive !== undefined ? isActive : true]
    );
    
    const newCategory = await database.getOne(
      'SELECT * FROM categories WHERE id = ?',
      [categoryId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
    
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Category with this slug already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
};

/**
 * Update category (Admin only)
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    // Accept both camelCase and snake_case from frontend
    const name = req.body.name;
    const image = req.body.image;
    const displayOrder = req.body.displayOrder ?? req.body.display_order;
    const isActive = req.body.isActive ?? req.body.is_active;
    let slug = req.body.slug ?? req.body.slug_url;
    
    // Fetch existing category to get current slug if not provided
    const existing = await database.getOne('SELECT slug, name FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    // Generate slug from name if not provided
    if (!slug && name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (!slug) {
      slug = existing.slug;
    }
    
    // Sanitize undefined values to null/defaults
    const safeName = name !== undefined ? name : existing.name;
    const safeSlug = slug !== undefined ? slug : existing.slug;
    const safeImage = image !== undefined ? image : null;
    const safeDisplayOrder = displayOrder !== undefined ? displayOrder : 0;
    const safeIsActive = isActive !== undefined ? isActive : true;
    
    await database.query(
      'UPDATE categories SET name = ?, slug = ?, image = ?, display_order = ?, is_active = ? WHERE id = ?',
      [safeName, safeSlug, safeImage, safeDisplayOrder, safeIsActive, id]
    );
    
    const updatedCategory = await database.getOne(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
    
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
};

/**
 * Delete category (Admin only)
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category has products
    const productCount = await database.getOne(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );
    
    if (productCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${productCount.count} products are associated with it.`
      });
    }
    
    await database.query('DELETE FROM categories WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
};
