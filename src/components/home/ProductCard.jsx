import { memo, useState, useCallback } from 'react';
import { Heart, ShoppingBag, Star, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { CURRENCY } from '../../lib/constants';
import LazyImage from '../ui/LazyImage';

function ProductCard({ product, index = 0, variant = 'grid' }) {
  const [hovered, setHovered] = useState(false);
  const [showError, setShowError] = useState(false);
  const { addToCart, toggleWishlist, isWishlisted, openCartDrawer, cartError, clearCartError } = useStore();
  const wishlisted = isWishlisted(product.id);
  const navigate = useNavigate();

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Check stock status
  const stockCount = product.stockCount ?? product.stock_count ?? 0;
  const isInStock = product.inStock ?? stockCount > 0;
  const isLowStock = isInStock && stockCount <= 3;

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    clearCartError();
    const result = addToCart(product);
    if (result.success) {
      openCartDrawer();
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  }, [addToCart, clearCartError, openCartDrawer, product]);

  const handleWishlist = useCallback((e) => {
    e.stopPropagation();
    toggleWishlist(product);
  }, [toggleWishlist, product]);

  // Variant-based styles
  const isCompact = variant === 'compact';
  const isList = variant === 'list';
  
  // Simplified card classes for better performance
  const cardClasses = isList
    ? 'group bg-white rounded-lg overflow-hidden shadow-sm flex flex-row h-32 border border-gray-100'
    : isCompact
      ? 'group bg-white rounded-lg overflow-hidden shadow-sm flex flex-col h-full border border-gray-100'
      : 'group bg-white rounded-xl overflow-hidden shadow-sm flex flex-col h-full border border-gray-100';

  const imageAspect = isList ? '1/1' : isCompact ? '1/1' : '3/4';
  const imageHeight = isList ? 'h-32 w-32' : '';

  return (
    <div
      className={cardClasses}
      onClick={() => navigate(`/product/${product.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image Container - Variant Based Design */}
      <div className={`relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden ${isList ? 'h-32 w-32 shrink-0' : ''}`} style={!isList ? { aspectRatio: imageAspect } : {}}>
        <LazyImage
          src={product.image}
          alt={product.name}
          aspectRatio="3/4"
          className={`transition-transform duration-300 ${hovered ? 'scale-105' : 'scale-100'}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={index < 4}
          loading={index < 8 ? 'eager' : 'lazy'}
        />
        
        {/* Wishlist Button - Simplified for performance */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 p-2 rounded-full shadow-sm z-10 ${
            wishlisted 
              ? 'bg-red-500 text-white' 
              : 'bg-white text-gray-400 hover:text-red-500'
          }`}
        >
          <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>

        {/* Badges - Simplified */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-1">
          {!isInStock ? (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded">
              Only {stockCount} left
            </span>
          ) : discount > 20 && (
            <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded">
              {discount}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Info Section - Variant Based Styling */}
      <div className={`flex flex-col flex-1 bg-white ${isList ? 'p-3 justify-center' : isCompact ? 'p-2.5' : 'p-4'}`}>
        {/* Category Tag - Hide in list view */}
        {!isList && (
          <span className={`font-semibold text-purple-600 uppercase tracking-wider mb-1.5 ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
            {product.category || 'Collection'}
          </span>
        )}
        
        {/* Product Name */}
        <h3 className={`font-semibold text-gray-800 line-clamp-2 group-hover:text-purple-700 transition-colors leading-snug ${isList ? 'text-sm mb-1' : isCompact ? 'text-xs mb-1' : 'text-sm mb-2'}`}>
          {product.name}
        </h3>
        
        {/* Rating & Reviews - Simplified in compact/list */}
        <div className={`flex items-center gap-2 ${isList ? 'mb-2' : isCompact ? 'mb-1.5' : 'mb-3'}`}>
          <div className={`flex items-center gap-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-md shadow-sm ${isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1'}`}>
            <span>{product.rating || '4.5'}</span>
            <Star size={isCompact ? 8 : 10} fill="currentColor" />
          </div>
          {!isCompact && !isList && (
            <span className="text-[11px] font-medium text-gray-400">
              ({(product.reviewCount || 120).toLocaleString()} reviews)
            </span>
          )}
        </div>

        {/* Price Row - Variant Based */}
        <div className={`flex items-center gap-2 flex-wrap ${isList ? 'mb-2' : isCompact ? 'mb-2' : 'mb-3'}`}>
          {/* Original Price - Strikethrough */}
          {product.originalPrice && !isCompact && (
            <span className={`text-gray-400 line-through decoration-red-400 decoration-2 ${isList ? 'text-xs' : 'text-sm'}`}>
              {CURRENCY}{product.originalPrice.toLocaleString()}
            </span>
          )}
          {/* Discounted Price */}
          <span className={`font-bold text-purple-700 ${isCompact ? 'text-base' : isList ? 'text-lg' : 'text-xl'}`}>
            {CURRENCY}{product.price.toLocaleString()}
          </span>
          {/* Discount % Badge - Hide in compact */}
          {discount > 0 && !isCompact && (
            <span className="text-[10px] font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 px-2 py-1 rounded-full shadow-sm">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Error Message - Only in grid view */}
        {showError && cartError && !isCompact && !isList && (
          <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded flex items-start gap-2">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <span className="text-[11px] text-red-600 leading-tight font-medium">{cartError}</span>
          </div>
        )}

        {/* Add to Cart Button - Variant Based */}
        {!isList && (
          <div className="mt-auto">
            <button
              onClick={handleAddToCart}
              disabled={!isInStock}
              className={`w-full rounded-xl font-semibold uppercase tracking-wide shadow-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                isInStock
                  ? isCompact
                    ? 'bg-purple-primary text-white hover:bg-purple-secondary text-[10px] py-2'
                    : 'bg-purple-primary text-white shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.02] active:scale-[0.98] text-xs py-3'
                  : isCompact
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed text-[10px] py-2'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed text-xs py-3'
              }`}
            >
              <ShoppingBag size={isCompact ? 14 : 16} strokeWidth={2} />
              {isInStock ? (isCompact ? 'Add' : 'Add to Cart') : 'Out of Stock'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(ProductCard, (prevProps, nextProps) => {
  // Only re-render if product id changes or variant changes
  return prevProps.product.id === nextProps.product.id && 
         prevProps.variant === nextProps.variant;
});
