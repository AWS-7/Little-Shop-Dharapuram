/**
 * Product Controller
 * Handles all product-related operations
 */

const database = require('../config/database');
const cloudinaryService = require('../services/cloudinary.service');

// Helper: Parse MySQL DECIMAL strings to numbers and JSON fields
function parseProduct(product) {
  if (!product) return product;
  return {
    ...product,
    price: product.price !== null && product.price !== undefined ? parseFloat(product.price) : 0,
    compare_price: product.compare_price !== null && product.compare_price !== undefined ? parseFloat(product.compare_price) : null,
    cost_price: product.cost_price !== null && product.cost_price !== undefined ? parseFloat(product.cost_price) : null,
    originalPrice: product.compare_price !== null && product.compare_price !== undefined ? parseFloat(product.compare_price) : null,
    images: product.images ? JSON.parse(product.images) : [],
    weight: product.weight !== null && product.weight !== undefined ? parseFloat(product.weight) : null,
    stock_quantity: product.stock_quantity !== null ? parseInt(product.stock_quantity) : 0,
    view_count: product.view_count !== null ? parseInt(product.view_count) : 0,
    sales_count: product.sales_count !== null ? parseInt(product.sales_count) : 0
  };
}

/**
 * Get all products with pagination, filtering, and sorting
 */
exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      sortBy = 'created_at',
      order = 'desc',
      search,
      isActive = true,
      isFeatured,
      inStock
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = ['1=1'];
    let params = [];
    
    if (category) {
      whereConditions.push('(p.category = ? OR p.category_id IN (SELECT id FROM categories WHERE slug = ?))');
      params.push(category, category);
    }
    
    if (minPrice) {
      whereConditions.push('p.price >= ?');
      params.push(minPrice);
    }
    
    if (maxPrice) {
      whereConditions.push('p.price <= ?');
      params.push(maxPrice);
    }
    
    if (isActive !== undefined) {
      whereConditions.push('p.is_active = ?');
      params.push(isActive === 'true' || isActive === true);
    }
    
    if (isFeatured !== undefined) {
      whereConditions.push('p.is_featured = ?');
      params.push(isFeatured === 'true' || isFeatured === true);
    }
    
    if (inStock === 'true') {
      whereConditions.push('p.stock_quantity > 0');
    }
    
    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Get total count
    const countResult = await database.getOne(
      `SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`,
      params
    );
    const totalCount = countResult.total;
    
    // Get products
    const sortColumn = ['name', 'price', 'created_at', 'view_count', 'sales_count'].includes(sortBy) 
      ? `p.${sortBy}` 
      : 'p.created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    const safeLimit = parseInt(limit) || 20;
    const safeOffset = parseInt(offset) || 0;

    const products = await database.getMany(
      `SELECT p.*,
              c.name as category_name,
              c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ${whereClause}
       ORDER BY ${sortColumn} ${sortOrder}
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
    );
    
    // Parse JSON fields
    const parsedProducts = products.map(parseProduct);
    
    res.json({
      success: true,
      data: parsedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get featured products
 */
exports.getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    const products = await database.getMany(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = TRUE AND p.is_featured = TRUE
       ORDER BY p.display_order ASC, p.created_at DESC
       LIMIT ?`,
      [limit]
    );
    
    const parsedProducts = products.map(parseProduct);
    
    res.json({
      success: true,
      data: parsedProducts
    });
    
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured products'
    });
  }
};

/**
 * Get new arrivals
 */
exports.getNewArrivals = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    const products = await database.getMany(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = TRUE AND p.is_new = TRUE
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [limit]
    );
    
    const parsedProducts = products.map(parseProduct);
    
    res.json({
      success: true,
      data: parsedProducts
    });
    
  } catch (error) {
    console.error('Get new arrivals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch new arrivals'
    });
  }
};

/**
 * Get bestsellers
 */
exports.getBestsellers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    const products = await database.getMany(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = TRUE AND p.is_bestseller = TRUE
       ORDER BY p.sales_count DESC, p.view_count DESC
       LIMIT ?`,
      [limit]
    );
    
    const parsedProducts = products.map(parseProduct);
    
    res.json({
      success: true,
      data: parsedProducts
    });
    
  } catch (error) {
    console.error('Get bestsellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bestsellers'
    });
  }
};

/**
 * Get handpicked products
 */
exports.getHandpickedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    // Handpicked = featured + new + bestseller combined
    const products = await database.getMany(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = TRUE 
       AND (p.is_featured = TRUE OR p.is_new = TRUE OR p.is_bestseller = TRUE)
       ORDER BY RAND()
       LIMIT ?`,
      [limit]
    );
    
    const parsedProducts = products.map(parseProduct);
    
    res.json({
      success: true,
      data: parsedProducts
    });
    
  } catch (error) {
    console.error('Get handpicked products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch handpicked products'
    });
  }
};

/**
 * Search products
 */
exports.searchProducts = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const searchTerm = `%${q}%`;
    
    const products = await database.getMany(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = TRUE 
       AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ? OR p.category LIKE ?)
       ORDER BY 
         CASE WHEN p.name LIKE ? THEN 1 
              WHEN p.sku LIKE ? THEN 2 
              ELSE 3 
         END,
         p.sales_count DESC
       LIMIT ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm, `%${q}%`, `%${q}%`, parseInt(limit)]
    );
    
    const parsedProducts = products.map(parseProduct);
    
    res.json({
      success: true,
      data: parsedProducts,
      query: q
    });
    
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products'
    });
  }
};

/**
 * Get products by category
 */
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 20, sortBy = 'created_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    
    // Get category info - try slug first, then name
    let category = await database.getOne(
      'SELECT * FROM categories WHERE slug = ?',
      [categorySlug]
    );

    // Fallback: try matching by name (for spaces like "Silk Sarees")
    if (!category) {
      category = await database.getOne(
        'SELECT * FROM categories WHERE name = ?',
        [categorySlug]
      );
    }

    const sortColumn = ['name', 'price', 'created_at', 'view_count'].includes(sortBy)
      ? sortBy
      : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const safeLimit = parseInt(limit) || 20;
    const safeOffset = parseInt(offset) || 0;

    let products;
    let countResult;

    if (category) {
      // Category found — use both category_id and category name
      countResult = await database.getOne(
        `SELECT COUNT(*) as total FROM products
         WHERE is_active = TRUE AND (category_id = ? OR category = ?)`,
        [category.id, category.name]
      );

      products = await database.getMany(
        `SELECT * FROM products
         WHERE is_active = TRUE AND (category_id = ? OR category = ?)
         ORDER BY ${sortColumn} ${sortOrder}
         LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        [category.id, category.name]
      );
    } else {
      // No category row — query products directly by category name
      countResult = await database.getOne(
        `SELECT COUNT(*) as total FROM products
         WHERE is_active = TRUE AND category = ?`,
        [categorySlug]
      );

      products = await database.getMany(
        `SELECT * FROM products
         WHERE is_active = TRUE AND category = ?
         ORDER BY ${sortColumn} ${sortOrder}
         LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        [categorySlug]
      );
    }

    const parsedProducts = products.map(parseProduct);

    res.json({
      success: true,
      data: {
        category: category || { name: categorySlug, slug: categorySlug },
        products: parsedProducts
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((countResult?.total || 0) / limit),
        totalItems: countResult?.total || 0,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};

/**
 * Get product by slug
 */
exports.getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Get product
    const product = await database.getOne(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ? OR p.id = ?`,
      [slug, isNaN(slug) ? 0 : parseInt(slug)]
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Increment view count
    await database.query(
      'UPDATE products SET view_count = view_count + 1 WHERE id = ?',
      [product.id]
    );
    
    // Parse product fields
    const parsedProduct = parseProduct(product);

    // Get related products
    const relatedProducts = await database.getMany(
      `SELECT id, name, slug, price, compare_price, featured_image, category
       FROM products
       WHERE is_active = TRUE
       AND id != ?
       AND (category_id = ? OR category = ?)
       ORDER BY sales_count DESC
       LIMIT 8`,
      [parsedProduct.id, parsedProduct.category_id, parsedProduct.category]
    );

    res.json({
      success: true,
      data: {
        product: parsedProduct,
        relatedProducts: relatedProducts.map(parseProduct)
      }
    });
    
  } catch (error) {
    console.error('Get product by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
};

/**
 * Create product (Admin only)
 * Supports both JSON body (images as URLs) and multipart file upload.
 */
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      comparePrice,
      costPrice,
      stockQuantity,
      categoryId,
      category,
      sku,
      images,
      featuredImage,
      isActive,
      isFeatured,
      isNew,
      isBestseller,
      metaTitle,
      metaDescription,
      weight,
      dimensions,
      material,
      careInstructions
    } = req.body;

    let finalFeaturedImage = featuredImage || null;
    let finalImages = images || [];

    // Handle direct featured image upload (multipart)
    if (req.file) {
      const result = await cloudinaryService.uploadProductImage(
        req.file.buffer,
        name || 'product'
      );
      finalFeaturedImage = result.secure_url;
    }

    // Handle direct multiple product images upload (multipart)
    if (req.files && req.files.length > 0) {
      const uploadResults = await cloudinaryService.uploadMultipleImages(
        req.files,
        { folder: 'littleshop/products' }
      );
      const uploadedUrls = uploadResults.map((r) => r.secure_url);
      finalImages = Array.isArray(finalImages) ? [...finalImages, ...uploadedUrls] : uploadedUrls;
    }

    // Generate slug
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();

    const productId = await database.insert(
      `INSERT INTO products (
        name, slug, description, price, compare_price, cost_price,
        stock_quantity, category_id, category, sku, images, featured_image,
        is_active, is_featured, is_new, is_bestseller,
        meta_title, meta_description, weight, dimensions, material, care_instructions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, slug, description, price, comparePrice, costPrice,
        stockQuantity, categoryId, category, sku,
        finalImages.length ? JSON.stringify(finalImages) : null, finalFeaturedImage,
        isActive !== undefined ? isActive : true,
        isFeatured !== undefined ? isFeatured : false,
        isNew !== undefined ? isNew : false,
        isBestseller !== undefined ? isBestseller : false,
        metaTitle, metaDescription, weight, dimensions, material, careInstructions
      ]
    );

    const newProduct = await database.getOne(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    newProduct.images = newProduct.images ? JSON.parse(newProduct.images) : [];

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

/**
 * Update product (Admin only)
 * Supports both JSON body updates and multipart file uploads.
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle direct featured image upload (multipart)
    if (req.file) {
      const result = await cloudinaryService.uploadProductImage(
        req.file.buffer,
        updateData.name || 'product'
      );
      updateData.featuredImage = result.secure_url;
    }

    // Handle direct multiple product images upload (multipart)
    if (req.files && req.files.length > 0) {
      const uploadResults = await cloudinaryService.uploadMultipleImages(
        req.files,
        { folder: 'littleshop/products' }
      );
      const uploadedUrls = uploadResults.map((r) => r.secure_url);
      const existingImages = Array.isArray(updateData.images) ? updateData.images : [];
      updateData.images = [...existingImages, ...uploadedUrls];
    }

    // Build update query dynamically
    const allowedFields = [
      'name', 'description', 'price', 'compare_price', 'cost_price',
      'stock_quantity', 'category_id', 'category', 'sku', 'images',
      'featured_image', 'is_active', 'is_featured', 'is_new', 'is_bestseller',
      'meta_title', 'meta_description', 'weight', 'dimensions', 'material', 'care_instructions'
    ];

    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      const dbField = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(dbField)) {
        updates.push(`${dbField} = ?`);
        values.push(dbField === 'images' ? JSON.stringify(value) : value);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(id);

    await database.query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedProduct = await database.getOne(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    updatedProduct.images = updatedProduct.images ? JSON.parse(updatedProduct.images) : [];

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
};

/**
 * Delete product (Admin only)
 * Soft-deletes product and optionally cleans up Cloudinary images.
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { cleanupImages = 'false' } = req.query;

    // Check if product exists
    const product = await database.getOne(
      'SELECT images, featured_image FROM products WHERE id = ?',
      [id]
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Optional: delete images from Cloudinary
    if (cleanupImages === 'true') {
      try {
        const images = product.images ? JSON.parse(product.images) : [];
        const allUrls = [...images];
        if (product.featured_image) allUrls.push(product.featured_image);

        const publicIds = allUrls
          .map((url) => cloudinaryService.extractPublicId(url))
          .filter(Boolean);

        if (publicIds.length) {
          await cloudinaryService.deleteMultipleImages(publicIds);
          console.log(`Cleaned up ${publicIds.length} Cloudinary image(s) for product ${id}`);
        }
      } catch (cleanupErr) {
        console.error('Cloudinary cleanup error (non-blocking):', cleanupErr);
      }
    }

    // Soft delete to preserve order history
    await database.query(
      'UPDATE products SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
};

/**
 * Update stock (Admin only)
 */
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    await database.query(
      'UPDATE products SET stock_quantity = ? WHERE id = ?',
      [quantity, id]
    );
    
    res.json({
      success: true,
      message: 'Stock updated successfully'
    });
    
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock'
    });
  }
};
