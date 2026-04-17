import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { CURRENCY } from '../../lib/constants';
import { PLACEHOLDER_IMG } from '../../lib/products';

export default function ProductCard({ product, index = 0 }) {
  const [hovered, setHovered] = useState(false);
  const { addToCart, toggleWishlist, isWishlisted, openCartDrawer } = useStore();
  const wishlisted = isWishlisted(product.id);
  const navigate = useNavigate();

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    openCartDrawer();
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
      {/* Image Container - Clean, no extra padding */}
      <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
        <img
          src={product.image || PLACEHOLDER_IMG}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-500 ${
            hovered ? 'scale-105' : 'scale-100'
          }`}
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
        {discount > 20 && (
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

        {/* Flipkart Style Buttons — Bottom of card */}
        <div className="mt-auto grid grid-cols-1 gap-2">
          <button
            onClick={handleAddToCart}
            className="w-full bg-purple-primary text-white py-2 rounded-sm font-black text-[10px] md:text-xs uppercase tracking-wider shadow-sm hover:bg-purple-secondary transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag size={14} />
            Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
}
