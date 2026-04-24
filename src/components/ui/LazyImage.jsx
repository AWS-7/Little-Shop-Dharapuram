import { useState, useEffect } from 'react';
import { PLACEHOLDER_IMG } from '../../lib/products';

/**
 * LazyImage - Optimized image component with:
 * - Lazy loading (only loads when in viewport)
 * - Fade-in animation
 * - WebP format support
 * - Responsive srcset
 * - Error fallback
 */
export default function LazyImage({
  src,
  alt,
  className = '',
  aspectRatio = '3/4',
  containerClassName = '',
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  quality = 75,
  priority = false,
  loading = 'lazy',
  onLoad,
  onError
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(priority || loading === 'eager');

  // Only lazy load when priority is false and loading is lazy
  useEffect(() => {
    if (priority || loading === 'eager') {
      setInView(true);
    }
  }, [priority, loading]);

  // Generate optimized image URLs
  const getOptimizedUrl = (url, width) => {
    if (!url || url === PLACEHOLDER_IMG) return url;
    
    // Supabase Storage with image transformation
    if (url.includes('supabase.co')) {
      return `${url}?width=${width}&quality=${quality}&format=webp`;
    }
    
    // Cloudinary
    if (url.includes('cloudinary.com')) {
      return url.replace('/upload/', `/upload/w_${width},q_${quality},f_webp/`);
    }
    
    // External images - use as is
    return url;
  };

  // Generate srcSet for responsive images
  const widths = [300, 400, 600, 800];
  const srcSet = inView
    ? widths
        .map(w => `${getOptimizedUrl(src, w)} ${w}w`)
        .join(', ')
    : '';

  // Tiny placeholder for blur effect
  const placeholderUrl = getOptimizedUrl(src, 20);
  
  // Main image URL
  const mainUrl = getOptimizedUrl(src, 400);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    onError?.();
  };

  // Parse aspect ratio for contain-intrinsic-size
  const [w, h] = aspectRatio.split('/').map(Number);
  const intrinsicHeight = w && h ? `${(h / w) * 100}%` : '75%';

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-gray-100 contain-paint ${containerClassName}`}
      style={{
        aspectRatio,
        containIntrinsicSize: `300px ${intrinsicHeight}`,
        contentVisibility: 'auto'
      }}
    >
      {/* Shimmer loading effect - faster animation */}
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gray-100">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      )}

      {/* Tiny blurred placeholder for progressive loading feel */}
      {!loaded && !error && inView && (
        <img
          src={placeholderUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center blur-md opacity-60"
          aria-hidden="true"
          loading="eager"
          decoding="sync"
        />
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-400">Failed to load</span>
          </div>
        </div>
      )}

      {/* Main image - only loads when in viewport */}
      {inView && (
        <img
          src={mainUrl}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          className={`absolute inset-0 w-full h-full object-cover object-center will-change-transform ${
            loaded ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-300 ${className}`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}

/**
 * PreloadImage - For critical above-fold images
 * Preloads image in <head> for faster loading
 */
export function PreloadImage({ href }) {
  if (!href) return null;
  
  const optimizedHref = `${href}?width=800&quality=75&format=webp`;
  
  return (
    <link
      rel="preload"
      as="image"
      href={optimizedHref}
      type="image/webp"
      fetchPriority="high"
    />
  );
}

/**
 * ResponsiveImage - Complete responsive image solution
 */
export function ResponsiveImage({
  src,
  alt,
  className = '',
  aspectRatio = '3/4',
  mobileWidth = 300,
  tabletWidth = 400,
  desktopWidth = 600
}) {
  const getUrl = (w) => {
    if (src.includes('supabase.co')) {
      return `${src}?width=${w}&quality=75&format=webp`;
    }
    return src;
  };

  return (
    <picture className={`block ${className}`} style={{ aspectRatio }}>
      {/* Desktop */}
      <source
        media="(min-width: 1024px)"
        srcSet={getUrl(desktopWidth)}
        type="image/webp"
      />
      {/* Tablet */}
      <source
        media="(min-width: 640px)"
        srcSet={getUrl(tabletWidth)}
        type="image/webp"
      />
      {/* Mobile */}
      <source
        srcSet={getUrl(mobileWidth)}
        type="image/webp"
      />
      {/* Fallback */}
      <img
        src={getUrl(mobileWidth)}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover"
      />
    </picture>
  );
}
