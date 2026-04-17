import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES } from '../../lib/constants';

export default function CategoryShowcase() {
  return (
    <section className="py-24 bg-white">
      <div className="container-clean">
        {/* Section Header */}
        <div className="mb-16">
          <span className="text-purple-primary text-xs font-bold uppercase tracking-[0.2em] mb-3 block">
            The Collection
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Shop by Category
          </h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {CATEGORIES.map((cat, idx) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <CategoryCard cat={cat} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ cat }) {
  return (
    <Link
      to={`/shop?category=${encodeURIComponent(cat.name)}`}
      className="group block relative overflow-hidden rounded-2xl bg-gray-50 aspect-[4/5]"
    >
      <img
        src={cat.image}
        alt={cat.name}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        <h3 className="text-xl font-bold text-white mb-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          {cat.name}
        </h3>
        <p className="text-white/80 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Explore Now
        </p>
      </div>
    </Link>
  );
}
