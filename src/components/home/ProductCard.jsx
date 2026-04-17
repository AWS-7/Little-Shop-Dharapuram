import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { CURRENCY } from '../../lib/constants';
import { PLACEHOLDER_IMG } from '../../lib/products';

export default function ProductCard({ product, index = 0 }) {
  const [hovered, setHovered] = useState(false);
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const wishlisted = isWishlisted(product.id);
  const navigate = useNavigate();

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group cursor-pointer bg-white rounded-xl overflow-hidden transition-all duration-300"
      onClick={() => navigate(`/product/${product.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 rounded-xl">
        <img
          src={product.image || PLACEHOLDER_IMG}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
            hovered ? 'scale-105' : 'scale-100'
          }`}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discount > 0 && (
            <span className="bg-purple-primary text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
              {discount}% OFF
            </span>
          )}
          {product.stockCount > 0 && product.stockCount < 5 && (
            <span className="bg-white/90 backdrop-blur-sm text-red-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm border border-red-100">
              Low Stock
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-300 ${
            wishlisted ? 'bg-purple-primary text-white' : 'bg-white/80 text-gray-900 hover:bg-white'
          }`}
        >
          <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Quick Add Button - Desktop Hover */}
        <div className="absolute inset-x-3 bottom-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className="w-full bg-white text-gray-900 hover:bg-purple-primary hover:text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag size={14} />
            Quick Add
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="pt-4 pb-2 px-1">
        <div className="flex justify-between items-start gap-2 mb-1">
          <p className="text-[10px] font-bold text-purple-primary uppercase tracking-widest truncate">
            {product.category}
          </p>
          <div className="flex items-center gap-1">
            <Star size={10} className="text-amber-400 fill-current" />
            <span className="text-[10px] font-bold text-gray-500">{product.rating || '4.8'}</span>
          </div>
        </div>
        
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-purple-primary transition-colors">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-gray-900">
            {CURRENCY}{product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through">
              {CURRENCY}{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
