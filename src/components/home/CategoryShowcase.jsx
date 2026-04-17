import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
    <section className="py-12 md:py-20 bg-white">
      <div className="container-clean">
        <div className="flex flex-col gap-10">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-4 border-purple-primary pl-6">
            <div>
              <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight uppercase">
                Top Categories
              </h2>
              <p className="text-gray-500 font-medium mt-2 text-sm md:text-base">
                Explore our handpicked premium collections
              </p>
            </div>
            <Link to="/shop" className="group flex items-center gap-2 text-purple-primary font-black text-xs uppercase tracking-[0.2em] hover:text-purple-dark transition-colors">
              Explore All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Categories Grid — Premium Layout */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {categories.slice(0, 8).map((cat, idx) => (
              <motion.div
                key={cat.id || cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className={idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}
              >
                <CategoryCard cat={cat} isLarge={idx === 0} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ cat, isLarge }) {
  return (
    <Link
      to={`/shop?category=${encodeURIComponent(cat.name)}`}
      className="group relative block aspect-square md:aspect-auto md:h-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-500"
    >
      <img
        src={cat.image}
        alt={cat.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
        <h3 className={`text-white font-black uppercase tracking-widest leading-tight ${isLarge ? 'text-2xl md:text-4xl mb-2' : 'text-sm md:text-lg mb-1'}`}>
          {cat.name}
        </h3>
        {isLarge && (
          <p className="text-white/70 text-xs md:text-sm font-medium mb-4 line-clamp-2 max-w-xs">
            Discover the latest trends and timeless classics in our {cat.name} collection.
          </p>
        )}
        <div className={`flex items-center gap-2 text-white/90 font-black uppercase tracking-[0.15em] transition-all duration-300 transform ${isLarge ? 'text-xs md:text-sm opacity-100 translate-y-0' : 'text-[10px] opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'}`}>
          Shop Now <ArrowRight size={isLarge ? 16 : 12} />
        </div>
      </div>
    </Link>
  );
}
