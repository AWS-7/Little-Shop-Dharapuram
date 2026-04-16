import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, X, Scissors, Star, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { CURRENCY } from '../../lib/constants';
import { PLACEHOLDER_IMG } from '../../lib/products';

function StarRating({ rating = 0, count = 0 }) {
  return (
    <div className="flex items-center justify-center gap-0.5 md:gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={10}
          className={`md:w-3 md:h-3 ${i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}
          fill={i <= Math.round(rating) ? 'currentColor' : 'none'}
        />
      ))}
      {rating > 0 && (
        <span className="font-inter text-[9px] md:text-[10px] text-gray-400 ml-0.5 md:ml-1">{rating} <span className="hidden sm:inline">({count}+)</span></span>
      )}
    </div>
  );
}

export default function ProductCard({ product, index = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [quickPeek, setQuickPeek] = useState(false);
  const [flyToCart, setFlyToCart] = useState(false);
  const longPressRef = useRef(null);
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const wishlisted = isWishlisted(product.id);
  const navigate = useNavigate();

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const hasVariants = product.gallery?.length > 2 || product.colors?.length > 0;

  // Helper: Check if product is NEW (< 7 days)
  const isNewProduct = () => {
    if (!product.created_at) return false;
    const created = new Date(product.created_at);
    const now = new Date();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  // Helper: Check if LOW STOCK (< 5)
  const isLowStock = () => {
    return product.stockCount > 0 && product.stockCount < 5;
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  // Mobile long-press handlers
  const handleTouchStart = () => {
    longPressRef.current = setTimeout(() => {
      setQuickPeek(true);
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
    }
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    addToCart(product);
    setFlyToCart(true);
    setTimeout(() => setFlyToCart(false), 600);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-30px' }}
        transition={{
          duration: 0.6,
          delay: index * 0.05,
          ease: [0.25, 0.1, 0.25, 1], // Custom ease-out for gentle float
        }}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        className="group cursor-pointer bg-white border border-gray-100 rounded-2xl overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
        onClick={handleCardClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        animate={flyToCart ? { scale: [1, 0.95, 1.02, 1], transition: { duration: 0.4 } } : {}}
      >
      {/* Image Container */}
      <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden rounded-t-2xl bg-gray-50">
        <img
          src={product.image || PLACEHOLDER_IMG}
          alt={product.name}
          loading="lazy"
          onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMG; }}
          className={`w-full h-full object-cover transition-transform duration-700 ${
            hovered ? 'scale-110' : 'scale-100'
          }`}
        />

        {/* ═══════════════════════════════════════════════════════════
            DYNAMIC PRODUCT BADGES — Glassmorphism Design
            ═══════════════════════════════════════════════════════════ */}

        {/* NEW Badge — top-left (created < 7 days) */}
        {isNewProduct() && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 left-2 md:top-3 md:left-3 z-10 
                       bg-white/20 backdrop-blur-md 
                       text-emerald-600 font-inter text-[8px] md:text-[9px] font-semibold 
                       tracking-wider uppercase 
                       px-2.5 md:px-3 py-1 md:py-1.5 
                       rounded-full 
                       border border-white/30 
                       shadow-sm
                       flex items-center gap-1"
          >
            <Sparkles size={10} className="text-amber-500" />
            NEW
          </motion.span>
        )}

        {/* LOW STOCK Badge — top-left (stock < 5, red urgent) */}
        {isLowStock() && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 left-2 md:top-3 md:left-3 z-10 
                       bg-rose-500/90 backdrop-blur-md 
                       text-white font-inter text-[8px] md:text-[9px] font-bold 
                       tracking-wider uppercase 
                       px-2.5 md:px-3 py-1 md:py-1.5 
                       rounded-full 
                       border border-rose-400/50 
                       shadow-sm
                       flex items-center gap-1"
          >
            <AlertCircle size={10} />
            ONLY {product.stockCount} LEFT
          </motion.span>
        )}

        {/* Manual New/Bestseller Badge — positioned below dynamic badges */}
        {(product.badge === 'New' || product.badge === 'Bestseller') && (
          <span className={`absolute ${(isNewProduct() || isLowStock()) ? 'top-9 md:top-12' : 'top-2 md:top-3'} left-2 md:left-3 z-10 
                            bg-white/20 backdrop-blur-md 
                            ${product.badge === 'New' ? 'text-emerald-600 border-emerald-400/30' : 'text-amber-600 border-amber-400/30'} 
                            font-inter text-[8px] md:text-[9px] font-semibold 
                            tracking-wider uppercase 
                            px-2.5 md:px-3 py-1 md:py-1.5 
                            rounded-full 
                            border border-white/30 
                            shadow-sm`}>
            {product.badge === 'New' ? 'New Arrival' : 'Bestseller'}
          </span>
        )}

        {/* Discount Circle Badge — top-right (unchanged, keeps prominence) */}
        {discount > 0 && (
          <span className="absolute top-2 right-2 md:top-3 md:right-3 z-10 w-9 h-9 md:w-11 md:h-11 rounded-full bg-purple-primary text-white font-inter text-[8px] md:text-[10px] font-bold flex items-center justify-center shadow-md">
            -{discount}%
          </span>
        )}

        {/* Video overlay on hover */}
        {product.video && hovered && (
          <video
            src={product.video}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

      </div>

      {/* Info — Centered Layout */}
      <div className="px-3 pt-2.5 pb-3 md:px-4 md:pt-4 md:pb-5 text-center">
        <p className="font-inter text-[8px] md:text-[9px] tracking-[0.2em] md:tracking-[0.25em] uppercase text-gray-400 mb-1">
          {product.category}
        </p>
        <h3 className="font-playfair text-xs md:text-base font-semibold text-gray-800 mb-1.5 md:mb-2 leading-snug group-hover:text-purple-primary transition-colors line-clamp-2">
          {product.name}
        </h3>

        {/* Pricing */}
        <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
          <span className="font-inter text-xs md:text-sm font-bold text-purple-primary">
            {CURRENCY}{product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="font-inter text-[10px] md:text-xs text-gray-300 line-through">
              {CURRENCY}{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Star Rating */}
        <StarRating rating={product.rating || 4.8} count={product.reviewCount || 150} />

        {/* Button Container — Side by Side */}
        <div className="mt-2 md:mt-3 grid grid-cols-2 gap-2">
          {/* View Details — Outline Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${product.id}`);
            }}
            className="w-full py-1.5 md:py-2 px-2 rounded-full font-inter text-[9px] md:text-[11px] font-medium tracking-wide transition-colors duration-200 bg-transparent text-purple-primary border border-purple-primary hover:bg-purple-primary/5"
          >
            View Details
          </motion.button>

          {/* Add to Cart — Solid Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
              setFlyToCart(true);
              setTimeout(() => setFlyToCart(false), 600);
            }}
            className="w-full py-1.5 md:py-2 px-2 rounded-full font-inter text-[9px] md:text-[11px] font-medium tracking-wide transition-colors duration-200 bg-purple-primary text-white border border-purple-primary hover:bg-emerald-800"
          >
            <ShoppingBag size={11} className="inline mr-1 -mt-0.5" />
            Add to Cart
          </motion.button>
        </div>
      </div>
    </motion.div>

    {/* Quick Peek Modal (Mobile) */}
    <AnimatePresence>
      {quickPeek && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 md:hidden"
          onClick={() => setQuickPeek(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl overflow-hidden max-w-xs w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/3]">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              <button
                onClick={() => setQuickPeek(false)}
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 shadow-sm"
              >
                <X size={16} />
              </button>
              {/* Badges in Quick Peek */}
              {isNewProduct() && (
                <span className="absolute top-3 left-3 bg-white/20 backdrop-blur-md text-emerald-600 font-inter text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full border border-white/30 shadow-sm flex items-center gap-1">
                  <Sparkles size={10} className="text-amber-500" /> NEW
                </span>
              )}
              {isLowStock() && (
                <span className={`absolute ${isNewProduct() ? 'top-10' : 'top-3'} left-3 bg-rose-500/90 backdrop-blur-md text-white font-inter text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border border-rose-400/50 shadow-sm flex items-center gap-1`}>
                  <AlertCircle size={10} /> ONLY {product.stockCount} LEFT
                </span>
              )}
              {discount > 0 && (
                <span className="absolute top-3 right-3 w-11 h-11 rounded-full bg-purple-primary text-white font-inter text-[10px] font-bold flex items-center justify-center shadow-md">
                  -{discount}%
                </span>
              )}
            </div>
            <div className="p-5 text-center">
              <p className="font-inter text-[9px] tracking-[0.25em] uppercase text-gray-400 mb-1">{product.category}</p>
              <h3 className="font-playfair text-lg font-semibold text-purple-primary mb-2">{product.name}</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="font-inter text-lg font-bold text-purple-primary">{CURRENCY}{product.price.toLocaleString()}</span>
                {product.originalPrice && (
                  <span className="font-inter text-sm text-gray-300 line-through">{CURRENCY}{product.originalPrice.toLocaleString()}</span>
                )}
              </div>
              <StarRating rating={product.rating || 4.8} count={product.reviewCount || 150} />
              {product.fabric && typeof product.fabric === 'string' && (
                <div className="flex items-center justify-center gap-2 text-gray-500 mt-2 mb-1">
                  <Scissors size={13} />
                  <span className="font-inter text-xs">{product.fabric}</span>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setQuickPeek(false); navigate(`/product/${product.id}`); }}
                  className="flex-1 py-3 rounded-full font-inter text-xs font-medium bg-purple-primary text-white hover:bg-emerald-900 transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={handleQuickAdd}
                  className="w-12 h-12 bg-purple-primary/10 text-purple-primary rounded-full flex items-center justify-center hover:bg-purple-primary hover:text-white transition-colors"
                >
                  <ShoppingBag size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
