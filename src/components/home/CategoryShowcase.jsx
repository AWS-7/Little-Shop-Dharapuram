import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES } from '../../lib/constants';

export default function CategoryShowcase() {
  return (
    <section className="py-20 md:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Elegant Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="font-inter text-[10px] md:text-xs tracking-[0.3em] uppercase text-gray-400 mb-4 block">
            Curated Selection
          </span>
          <h2 className="font-playfair text-4xl md:text-6xl lg:text-7xl text-gray-900 font-light tracking-tight">
            Shop by <span className="italic">Category</span>
          </h2>
          <div className="w-24 h-[1px] bg-gray-300 mx-auto mt-8" />
        </motion.div>

        {/* Horizontal Scroll on Mobile, Grid on Desktop */}
        <div className="md:grid md:grid-cols-3 md:gap-8 lg:gap-12 flex gap-4 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {CATEGORIES.map((cat, idx) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex-shrink-0 w-[280px] md:w-auto snap-center"
            >
              <CategoryCard cat={cat} index={idx} />
            </motion.div>
          ))}
        </div>

        {/* View All Link */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center mt-12 md:mt-16"
        >
          <Link 
            to="/shop" 
            className="group inline-flex items-center gap-3 font-inter text-sm tracking-[0.1em] uppercase text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>View All Collections</span>
            <span className="w-8 h-[1px] bg-gray-400 group-hover:w-12 group-hover:bg-gray-900 transition-all duration-300" />
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// Elegant Category Card
function CategoryCard({ cat, index }) {
  return (
    <Link
      to={`/shop?category=${encodeURIComponent(cat.name)}`}
      className="group block"
    >
      {/* Image Container - Square with subtle shadow */}
      <div className="relative aspect-square mb-5 overflow-hidden bg-gray-100">
        <img
          src={cat.image}
          alt={cat.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        
        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
        
        {/* Index number - elegant positioning */}
        <span className="absolute top-4 left-4 font-inter text-[10px] tracking-wider text-white/80 mix-blend-difference">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Hover arrow */}
        <div className="absolute bottom-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <ArrowRight size={16} className="text-gray-900" />
        </div>
      </div>

      {/* Text Content - Clean and minimal */}
      <div className="text-center md:text-left">
        <h3 className="font-playfair text-xl md:text-2xl text-gray-900 mb-1 group-hover:text-gray-600 transition-colors">
          {cat.name}
        </h3>
        <p className="font-inter text-xs text-gray-400 tracking-wide">
          Explore Collection
        </p>
      </div>
    </Link>
  );
}
