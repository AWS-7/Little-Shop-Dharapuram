import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES } from '../../lib/constants';

export default function CategoryShowcase() {
  return (
    <section className="py-12 md:py-20 bg-gray-50">
      <div className="container-clean">
        <div className="bg-white p-6 md:p-8 shadow-sm border border-gray-100 rounded-sm">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight">
              Top Categories
            </h2>
            <Link to="/shop" className="text-purple-primary font-black text-xs uppercase tracking-widest hover:underline">
              View All
            </Link>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {CATEGORIES.map((cat, idx) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <CategoryCard cat={cat} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ cat }) {
  return (
    <Link
      to={`/shop?category=${encodeURIComponent(cat.name)}`}
      className="group flex flex-col items-center gap-3 text-center"
    >
      <div className="relative w-24 h-24 md:w-32 md:h-32 overflow-hidden rounded-full bg-gray-50 border border-gray-100 group-hover:shadow-md transition-all duration-300">
        <img
          src={cat.image}
          alt={cat.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <h3 className="text-xs md:text-sm font-black text-gray-900 uppercase tracking-wide group-hover:text-purple-primary transition-colors">
        {cat.name}
      </h3>
    </Link>
  );
}
