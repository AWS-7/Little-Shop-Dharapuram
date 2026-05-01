import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getAllCategories } from '../../lib/products';

export default function CategoryShowcase() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await getAllCategories();
      if (data && data.length > 0) {
        setCategories(data);
      }
      setLoading(false);
    };
    fetchCats();
  }, []);

  if (loading) return (
    <div className="py-20 flex justify-center">
      <div className="w-10 h-10 border-4 border-purple-primary/10 border-t-purple-primary rounded-full animate-spin" />
    </div>
  );

  if (categories.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Elegant Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          {/* Title with Double Line Underline */}
          <div className="relative inline-block">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-800 tracking-wide text-center font-serif">
              Top Categories
            </h2>
            {/* Double Lines with Center Diamond */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: 60 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                className="h-0.5 bg-gradient-to-r from-transparent to-purple-primary rounded-full"
              />
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                whileInView={{ scale: 1, rotate: 45 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.4, type: "spring" }}
                className="w-2.5 h-2.5 bg-purple-primary rotate-45 shadow-lg shadow-purple-primary/40"
              />
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: 60 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                className="h-0.5 bg-gradient-to-l from-transparent to-purple-primary rounded-full"
              />
            </div>
          </div>
          
        </motion.div>

        {/* Mobile: Horizontal scrolling with enhanced cards */}
        <div className="md:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory flex gap-5 pb-6 -mx-4 px-4">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id || cat.name}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="flex-shrink-0 snap-start"
            >
              <CategoryCardMobile cat={cat} />
            </motion.div>
          ))}
        </div>
        
        {/* Desktop: Beautiful Bento Grid Layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id || cat.name}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6, type: "spring" }}
              className="group"
            >
              <CategoryCard cat={cat} isLarge={false} />
            </motion.div>
          ))}
        </div>

        {/* View All Button - Below Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Link 
            to="/shop" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-purple-primary text-white font-bold rounded-full hover:bg-purple-secondary transition-all duration-300 group shadow-lg shadow-purple-primary/30 hover:shadow-xl"
          >
            Explore All Collections
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function CategoryCard({ cat, isLarge }) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/shop?category=${encodeURIComponent(cat.name)}`);
  };
  
  return (
    <div
      onClick={handleClick}
      className={`group relative block overflow-hidden rounded-3xl bg-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer ${isLarge ? 'aspect-[1/1.1] md:aspect-auto md:h-full min-h-[300px] lg:min-h-[400px]' : 'aspect-square min-h-[240px]'}`}
    >
      {/* Image with Zoom Effect */}
      <img
        src={cat.image}
        alt={cat.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"
        loading="lazy"
      />
      
      {/* Beautiful Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-all duration-500" />
      
      {/* Teal Accent Border on Hover */}
      <div className="absolute inset-0 rounded-3xl border-4 border-transparent group-hover:border-purple-primary/50 transition-colors duration-500" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
        {/* Category Name */}
        <h3 className={`text-white font-black uppercase tracking-widest leading-tight drop-shadow-lg ${isLarge ? 'text-2xl lg:text-3xl mb-3' : 'text-lg lg:text-xl mb-2'}`}>
          {cat.name}
        </h3>
        
        {/* Shop Button */}
        <div className="flex items-center gap-2 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-purple-primary text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
            Shop Now
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
      
      {/* Corner Badge */}
      <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <ArrowRight size={16} className="text-white -rotate-45" />
      </div>
    </div>
  );
}

// Mobile-specific card - enhanced design
function CategoryCardMobile({ cat }) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/shop?category=${encodeURIComponent(cat.name)}`);
  };
  
  return (
    <div
      onClick={handleClick}
      className="group relative block overflow-hidden rounded-2xl bg-gray-100 w-[160px] h-[200px] flex-shrink-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      <img
        src={cat.image}
        alt={cat.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      
      {/* Teal Border on Hover */}
      <div className="absolute inset-0 rounded-2xl border-3 border-transparent group-hover:border-purple-primary/40 transition-colors duration-300" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider leading-tight drop-shadow-md">
          {cat.name}
        </h3>
        <span className="mt-2 inline-flex items-center gap-1 text-white/80 text-[10px] font-semibold uppercase opacity-0 group-hover:opacity-100 transition-opacity">
          Shop Now <ArrowRight size={10} />
        </span>
      </div>
    </div>
  );
}
