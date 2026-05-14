/**
 * Upload Controller
 * Handles file uploads via Cloudinary (memory storage)
 * Response format kept identical for zero frontend breakage.
 */

const cloudinaryService = require('../services/cloudinary.service');

// ──────────────────────────────────────────
// Single file upload (general purpose)
// ──────────────────────────────────────────
exports.uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const folder = req.body.folder || 'littleshop/general';
    const result = await cloudinaryService.uploadImage(req.file.buffer, {
      folder,
      filename: `file_${Date.now()}`,
    });

    const url = result.secure_url;

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: result.public_id,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url,
        fullUrl: url,
      },
    });
  } catch (error) {
    console.error('Upload single error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file to Cloudinary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ──────────────────────────────────────────
// Multiple files upload
// ──────────────────────────────────────────
exports.uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const folder = req.body.folder || 'littleshop/general';
    const results = await cloudinaryService.uploadMultipleImages(req.files, { folder });

    const files = results.map((result, index) => ({
      filename: result.public_id,
      originalName: req.files[index].originalname,
      size: req.files[index].size,
      mimetype: req.files[index].mimetype,
      url: result.secure_url,
      fullUrl: result.secure_url,
    }));

    res.json({
      success: true,
      message: `${files.length} files uploaded successfully`,
      data: files,
    });
  } catch (error) {
    console.error('Upload multiple error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files to Cloudinary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ──────────────────────────────────────────
// Product image upload
// ──────────────────────────────────────────
exports.uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded',
      });
    }

    console.log('Uploading product image:', req.file.originalname, 'size:', req.file.size, 'mimetype:', req.file.mimetype);

    const productSlug = req.body.productSlug || req.body.slug || 'product';
    const result = await cloudinaryService.uploadProductImage(
      req.file.buffer,
      productSlug
    );

    const url = result.secure_url || result.url;

    res.json({
      success: true,
      message: 'Product image uploaded and optimized',
      data: {
        filename: result.public_id,
        originalName: req.file.originalname,
        url,
        fullUrl: url,
      },
    });
  } catch (error) {
    console.error('Upload product image error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to upload product image: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ──────────────────────────────────────────
// Category image upload
// ──────────────────────────────────────────
exports.uploadCategoryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded',
      });
    }

    const categorySlug = req.body.categorySlug || req.body.slug || 'category';
    const result = await cloudinaryService.uploadCategoryImage(
      req.file.buffer,
      categorySlug
    );

    const url = result.secure_url;

    res.json({
      success: true,
      message: 'Category image uploaded',
      data: {
        filename: result.public_id,
        url,
        fullUrl: url,
      },
    });
  } catch (error) {
    console.error('Upload category image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload category image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ──────────────────────────────────────────
// Hero banner upload (desktop + mobile eager transforms)
// ──────────────────────────────────────────
exports.uploadBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No banner image uploaded',
      });
    }

    const bannerName = req.body.bannerName || req.body.name || 'banner';
    const result = await cloudinaryService.uploadBannerImage(
      req.file.buffer,
      bannerName
    );

    const baseUrl = result.secure_url || result.url;
    const isLocal = !baseUrl?.includes('res.cloudinary.com');

    res.json({
      success: true,
      message: 'Banner uploaded with desktop and mobile versions',
      data: {
        url: baseUrl,
        filename: result.public_id,
        desktop: isLocal ? {
          filename: result.public_id,
          url: baseUrl,
          fullUrl: baseUrl,
        } : {
          filename: result.public_id,
          url: cloudinaryService.getOptimizedUrl(baseUrl, {
            width: 1920,
            height: 800,
            crop: 'fill',
          }),
          fullUrl: cloudinaryService.getOptimizedUrl(baseUrl, {
            width: 1920,
            height: 800,
            crop: 'fill',
          }),
        },
        mobile: isLocal ? {
          filename: result.public_id,
          url: baseUrl,
          fullUrl: baseUrl,
        } : {
          filename: result.public_id,
          url: cloudinaryService.getOptimizedUrl(baseUrl, {
            width: 768,
            height: 500,
            crop: 'fill',
          }),
          fullUrl: cloudinaryService.getOptimizedUrl(baseUrl, {
            width: 768,
            height: 500,
            crop: 'fill',
          }),
        },
      },
    });
  } catch (error) {
    console.error('Upload banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload banner',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ──────────────────────────────────────────
// Payment proof upload
// ──────────────────────────────────────────
exports.uploadPaymentProof = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No payment proof uploaded',
      });
    }

    const userId = req.userId || req.firebaseUid || 'unknown';
    const result = await cloudinaryService.uploadPaymentProofImage(
      req.file.buffer,
      userId
    );

    const url = result.secure_url;

    res.json({
      success: true,
      message: 'Payment proof uploaded',
      data: {
        filename: result.public_id,
        url,
        fullUrl: url,
      },
    });
  } catch (error) {
    console.error('Upload payment proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload payment proof',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ──────────────────────────────────────────
// Delete file from Cloudinary
// ──────────────────────────────────────────
exports.deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename or public_id is required',
      });
    }

    // Try to extract public_id from a full Cloudinary URL
    let publicId = filename;
    if (filename.includes('res.cloudinary.com')) {
      publicId = cloudinaryService.extractPublicId(filename) || filename;
    }

    await cloudinaryService.deleteImage(publicId);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete file error:', error);
    // Return 200 even if Cloudinary delete fails (idempotent)
    res.json({
      success: true,
      message: 'File delete request processed',
    });
  }
};

// ──────────────────────────────────────────
// Get uploaded files list (placeholder – Cloudinary folder listing
// via admin API is discouraged in production. Use Cloudinary console.)
// ──────────────────────────────────────────
exports.getUploadedFiles = async (req, res) => {
  try {
    const { type = 'general' } = req.query;

    res.json({
      success: true,
      data: [],
      note: `Cloudinary folder "littleshop/${type}" listing is not exposed via public API. Manage images via Cloudinary console.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get files list',
    });
  }
};
