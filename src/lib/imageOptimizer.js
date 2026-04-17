/**
 * Image Optimization Utility
 * Resizes, compresses, and converts images to WebP before upload
 */

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Target dimensions for different use cases
export const IMAGE_SIZES = {
  thumbnail: { width: 300, height: 300 },
  product: { width: 600, height: 600 },
  zoom: { width: 1200, height: 1200 },
};

/**
 * Compress and resize image before upload
 * @param {File} file - Original image file
 * @param {Object} options - Compression options
 * @returns {Promise<Blob>} - Optimized image blob
 */
export async function optimizeImage(file, options = {}) {
  const {
    maxWidth = 600,
    maxHeight = 600,
    quality = 0.8,
    format = 'webp',
  } = options;

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Image too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create optimized image'));
            }
          },
          `image/${format}`,
          quality
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate multiple sizes for a single image
 * @param {File} file - Original image file
 * @returns {Promise<Object>} - Object with different size blobs
 */
export async function generateImageSizes(file) {
  const sizes = {};
  
  try {
    // Thumbnail (300x300)
    sizes.thumbnail = await optimizeImage(file, {
      maxWidth: IMAGE_SIZES.thumbnail.width,
      maxHeight: IMAGE_SIZES.thumbnail.height,
      quality: 0.7,
    });

    // Product view (600x600)
    sizes.product = await optimizeImage(file, {
      maxWidth: IMAGE_SIZES.product.width,
      maxHeight: IMAGE_SIZES.product.height,
      quality: 0.8,
    });

    // Zoom view (1200x1200) - only if original is larger
    if (file.size > 100 * 1024) { // Only for images > 100KB
      sizes.zoom = await optimizeImage(file, {
        maxWidth: IMAGE_SIZES.zoom.width,
        maxHeight: IMAGE_SIZES.zoom.height,
        quality: 0.85,
      });
    }

    return sizes;
  } catch (error) {
    console.error('Error generating image sizes:', error);
    throw error;
  }
}

/**
 * Get file extension from mime type
 */
function getExtensionFromMimeType(mimeType) {
  const map = {
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/png': 'png',
  };
  return map[mimeType] || 'webp';
}

/**
 * Check if file is a valid image
 */
export function isValidImage(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  return validTypes.includes(file.type);
}

/**
 * Get optimized image URL with Supabase transformations
 * @param {string} url - Original image URL
 * @param {Object} options - Transform options
 * @returns {string} - Optimized URL
 */
export function getOptimizedImageUrl(url, options = {}) {
  if (!url) return '';
  
  const {
    width = 600,
    quality = 75,
    format = 'webp',
  } = options;

  // If URL is from Supabase storage, add transformation params
  if (url.includes('supabase.co')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=${quality}&format=${format}`;
  }

  return url;
}

/**
 * Get image size based on use case
 */
export function getImageSizeForUseCase(useCase) {
  switch (useCase) {
    case 'thumbnail':
    case 'cart':
    case 'wishlist':
      return IMAGE_SIZES.thumbnail;
    case 'product':
    case 'listing':
      return IMAGE_SIZES.product;
    case 'zoom':
    case 'detail':
      return IMAGE_SIZES.zoom;
    default:
      return IMAGE_SIZES.product;
  }
}
