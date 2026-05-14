/**
 * Cloudinary Service
 * Handles upload, delete, optimize, and URL generation
 * Uses multer memoryStorage + sharp pre-compression for full control.
 */

const cloudinary = require('../config/cloudinary');
const sharp = require('sharp');
const path = require('path');

// ──────────────────────────────────────────
// Upload helpers
// ──────────────────────────────────────────

/**
 * Upload a single image buffer to Cloudinary
 * @param {Buffer} buffer  – raw file buffer from multer
 * @param {Object} options – { folder, filename, tags, eager }
 * @returns {Promise<Object>} Cloudinary upload result
 */
async function uploadImage(buffer, options = {}) {
  const {
    folder = 'littleshop/general',
    filename = `img_${Date.now()}`,
    tags = [],
    eager = [],
  } = options;

  // Pre-compress / resize with sharp to save bandwidth & storage
  const compressedBuffer = await sharp(buffer)
    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true, mozjpeg: true })
    .toBuffer();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        overwrite: true,
        resource_type: 'image',
        tags: tags.length ? tags : undefined,
        eager: eager.length ? eager : undefined,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(compressedBuffer);
  });
}

/**
 * Upload multiple image buffers
 * @param {Array<{buffer:Buffer, originalname:string}>} files
 * @param {Object} options
 * @returns {Promise<Array<Object>>} upload results
 */
async function uploadMultipleImages(files, options = {}) {
  const results = [];
  for (const file of files) {
    const safeName = path
      .parse(file.originalname || 'image')
      .name
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 40);
    const filename = `${safeName}_${Date.now()}`;
    const result = await uploadImage(file.buffer, {
      ...options,
      filename,
    });
    results.push(result);
  }
  return results;
}

// ──────────────────────────────────────────
// Delete helpers
// ──────────────────────────────────────────

/**
 * Delete an image from Cloudinary by public_id
 * @param {string} publicId
 * @returns {Promise<Object>}
 */
async function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

/**
 * Delete multiple images
 * @param {string[]} publicIds
 * @returns {Promise<Object[]>}
 */
async function deleteMultipleImages(publicIds) {
  return Promise.all(publicIds.map((id) => deleteImage(id)));
}

// ──────────────────────────────────────────
// URL / optimization helpers
// ──────────────────────────────────────────

/**
 * Extract Cloudinary public_id from a full URL.
 * Works for URLs like:
 *   https://res.cloudinary.com/cloud/image/upload/v123/folder/img.jpg
 * @param {string} url
 * @returns {string|null} public_id or null
 */
function extractPublicId(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const match = url.match(/\/upload\/.*?\/(.+?)\.[a-zA-Z]{3,4}$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Generate an optimized delivery URL with automatic format/quality.
 * @param {string} url     – base Cloudinary URL (stored in DB)
 * @param {Object} options – { width, height, crop }
 * @returns {string} optimized URL
 */
function getOptimizedUrl(url, options = {}) {
  if (!url || typeof url !== 'string') return url || '';
  if (!url.includes('res.cloudinary.com')) return url;

  // Parse base URL to reconstruct with transformations
  const { width, height, crop = 'fill' } = options;
  const transformation = [];

  if (width) transformation.push(`w_${width}`);
  if (height) transformation.push(`h_${height}`);
  if (width || height) transformation.push(`c_${crop}`);
  transformation.push('f_auto', 'q_auto'); // auto WebP/AVIF + quality

  const transformString = transformation.join(',');

  // Insert transformations before /v<version> or before the folder path
  return url.replace(
    /\/upload\/((?:v\d+\/)?)/,
    `/upload/${transformString}/$1`
  );
}

/**
 * Build a responsive srcset string for a Cloudinary URL.
 * @param {string} url
 * @param {number[]} widths – default [320, 640, 960, 1280, 1920]
 * @returns {string} srcset attribute value
 */
function getSrcSet(url, widths = [320, 640, 960, 1280, 1920]) {
  return widths
    .map((w) => `${getOptimizedUrl(url, { width: w })} ${w}w`)
    .join(', ');
}

// ──────────────────────────────────────────
// Product image helpers
// ──────────────────────────────────────────

/**
 * Upload a product image with product-specific folder & eager transforms.
 * @param {Buffer} buffer
 * @param {string} productSlug – used for filename context
 * @returns {Promise<Object>}
 */
async function uploadProductImage(buffer, productSlug = '') {
  const safeSlug = (productSlug || 'product')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 30);
  const filename = `${safeSlug}_${Date.now()}`;

  return uploadImage(buffer, {
    folder: 'littleshop/products',
    filename,
    tags: ['product', 'ecommerce'],
    eager: [
      { width: 600, height: 600, crop: 'fill', fetch_format: 'auto', quality: 'auto' },
      { width: 1200, height: 1200, crop: 'fill', fetch_format: 'auto', quality: 'auto' },
      { width: 300, height: 300, crop: 'fill', fetch_format: 'auto', quality: 'auto' },
    ],
  });
}

/**
 * Upload a category image.
 */
async function uploadCategoryImage(buffer, categorySlug = '') {
  const safeSlug = (categorySlug || 'category')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 30);
  const filename = `cat_${safeSlug}_${Date.now()}`;

  return uploadImage(buffer, {
    folder: 'littleshop/categories',
    filename,
    tags: ['category'],
    eager: [
      { width: 600, height: 600, crop: 'fill', fetch_format: 'auto', quality: 'auto' },
      { width: 300, height: 300, crop: 'fill', fetch_format: 'auto', quality: 'auto' },
    ],
  });
}

/**
 * Upload a hero/banner image with desktop + mobile eager transforms.
 */
async function uploadBannerImage(buffer, bannerName = '') {
  const safeName = (bannerName || 'banner')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 30);
  const filename = `banner_${safeName}_${Date.now()}`;

  return uploadImage(buffer, {
    folder: 'littleshop/banners',
    filename,
    tags: ['banner', 'hero'],
    eager: [
      { width: 1920, height: 800, crop: 'fill', fetch_format: 'auto', quality: 'auto' },
      { width: 768, height: 500, crop: 'fill', fetch_format: 'auto', quality: 'auto' },
    ],
  });
}

/**
 * Upload a payment proof image.
 */
async function uploadPaymentProofImage(buffer, userId = '') {
  const filename = `proof_${userId}_${Date.now()}`;
  return uploadImage(buffer, {
    folder: 'littleshop/payment-proofs',
    filename,
    tags: ['payment-proof'],
  });
}

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  extractPublicId,
  getOptimizedUrl,
  getSrcSet,
  uploadProductImage,
  uploadCategoryImage,
  uploadBannerImage,
  uploadPaymentProofImage,
};
