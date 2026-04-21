import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { CURRENCY } from '../../lib/constants';
import LazyImage from '../ui/LazyImage';

export default function ProductCard({ product, index = 0 }) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      className="group bg-white border border-gray-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full"
      onClick={() => navigate(`/product/${product.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image Container - Uses LazyImage for optimization */}
      <div className="relative bg-gray-50 overflow-hidden" style={{ aspectRatio: '3/4' }}>
        <LazyImage
          src={product.image}
          alt={product.name}
          aspectRatio="3/4"
          className={`transition-transform duration-300 ${hovered ? 'scale-105' : 'scale-100'}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={index < 4}  // Priority loading for above-fold products
        />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 p-2 rounded-full shadow-sm transition-all duration-200 z-10 ${
            wishlisted ? 'bg-red-50 text-red-500' : 'bg-white/90 text-gray-400 hover:text-red-500'
          }`}
        >
          <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Badge - Positioned bottom left */}
        {!isInStock ? (
          <div className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-sm z-10 uppercase tracking-wide">
            SOLD OUT
          </div>
        ) : isLowStock ? (
          <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-sm z-10">
            Only {stockCount} left
          </div>
        ) : discount > 20 && (
          <div className="absolute bottom-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm z-10">
            {discount}% OFF
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3 md:p-4 flex flex-col flex-1 border-t border-gray-50">
        <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-purple-primary transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 bg-green-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm">
            <span>{product.rating || '4.5'}</span>
            <Star size={10} fill="currentColor" />
          </div>
          <span className="text-[10px] font-bold text-gray-400">({(product.reviewCount || 120).toLocaleString()})</span>
        </div>

        {/* Price Row */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base md:text-lg font-black text-gray-900">
            {CURRENCY}{product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through">
              {CURRENCY}{product.originalPrice.toLocaleString()}
            </span>
          )}
          {discount > 0 && (
            <span className="text-xs font-black text-green-600">
              {discount}% off
            </span>
          )}
        </div>

        {/* Error Message */}
        {showError && cartError && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 p-2 bg-red-50 border border-red-100 rounded-sm flex items-start gap-1.5"
          >
            <AlertCircle size={12} className="text-red-500 shrink-0 mt-0.5" />
            <span className="text-[10px] text-red-600 leading-tight">{cartError}</span>
          </motion.div>
        )}

        {/* Flipkart Style Buttons — Bottom of card */}
        <div className="mt-auto grid grid-cols-1 gap-2">
          <button
            onClick={handleAddToCart}
            disabled={!isInStock}
            className={`w-full py-2 rounded-sm font-black text-[10px] md:text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-2 ${
              isInStock
                ? 'bg-purple-primary text-white hover:bg-purple-secondary'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBag size={14} />
            {isInStock ? 'Add to Cart' : 'Sold Out'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
