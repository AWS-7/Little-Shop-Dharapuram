import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { CURRENCY } from '../../lib/constants';
import LazyImage from '../ui/LazyImage';

export default function ProductCard({ product, index = 0, variant = 'grid' }) {
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

  const handleAddToCart = (e) => {
    e.stopPropagation();
    clearCartError();
    const result = addToCart(product);
    if (result.success) {
      openCartDrawer();
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  // Variant-based styles
  const isCompact = variant === 'compact';
  const isList = variant === 'list';
  
  const cardClasses = isList
    ? 'group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-row h-32 border border-gray-100'
    : isCompact
      ? 'group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full border border-gray-100/50'
      : 'group bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(106,13,173,0.12)] hover:-translate-y-1 transition-all duration-400 flex flex-col h-full border border-gray-100/50';

  const imageAspect = isList ? '1/1' : isCompact ? '1/1' : '3/4';
  const imageHeight = isList ? 'h-32 w-32' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
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
          className={`transition-all duration-500 ease-out ${hovered ? 'scale-110' : 'scale-100'}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={index < 4}
        />
        
        {/* Premium Overlay on Hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-purple-900/20 via-transparent to-transparent transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`} />

        {/* Wishlist Button - Enhanced */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md shadow-lg transition-all duration-300 transform hover:scale-110 z-10 ${
            wishlisted 
              ? 'bg-red-500 text-white shadow-red-500/30' 
              : 'bg-white/95 text-gray-400 hover:text-red-500 hover:bg-white'
          }`}
        >
          <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>

        {/* Premium Badges */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
          {!isInStock ? (
            <div className="bg-red-500/95 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wide">
              Sold Out
            </div>
          ) : isLowStock ? (
            <div className="bg-amber-500/95 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
              Only {stockCount} left
            </div>
          ) : discount > 20 && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
              {discount}% OFF
            </div>
          )}
        </div>
        
        {/* Quick View Button on Hover */}
        <div className={`absolute bottom-3 right-3 transition-all duration-300 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <span className="bg-white/95 backdrop-blur-sm text-purple-700 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
            View
          </span>
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
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-2.5 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2"
          >
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <span className="text-[11px] text-red-600 leading-tight font-medium">{cartError}</span>
          </motion.div>
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
                    ? 'bg-purple-600 text-white hover:bg-purple-700 text-[10px] py-2'
                    : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] text-xs py-3'
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
    </motion.div>
  );
}
