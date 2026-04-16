import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { getLatestProducts, getHandpickedProducts } from '../../lib/products';
import { CATEGORIES } from '../../lib/constants';

export default function FeaturedGrid() {
  const [featured, setFeatured] = useState([]);
  const [handpicked, setHandpicked] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      // Fetch latest 4 products for Featured Collection
      const { data: latest } = await getLatestProducts(4);
      if (latest) setFeatured(latest);

      // Fetch one product from each category for Handpicked
      const { data: handpickedData } = await getHandpickedProducts(CATEGORIES);
      if (handpickedData) setHandpicked(handpickedData);

      setLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <section className="section-spacing bg-white">
      <div className="container-luxury">
        {/* Handpicked for You Section */}
        {handpicked.length > 0 && (
          <>
            <div className="text-center mb-12">
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="font-inter text-xs tracking-[0.3em] uppercase text-purple-secondary mb-3"
              >
                Handpicked for You
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-playfair text-3xl md:text-4xl text-purple-primary mb-4"
              >
                Curated Selection
              </motion.h2>
              <div className="w-24 h-[2px] bg-purple-primary/30 mx-auto" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-4 md:gap-x-6 md:gap-y-10 mb-20">
              {handpicked.map((product, idx) => (
                <ProductCard key={`handpicked-${product.id}`} product={product} index={idx} />
              ))}
            </div>
          </>
        )}

        {/* Featured Collection Section */}
        <div className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-inter text-xs tracking-[0.3em] uppercase text-purple-secondary mb-3"
          >
            New Arrivals
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-playfair text-3xl md:text-4xl text-purple-primary mb-4"
          >
            Featured Collection
          </motion.h2>
          <div className="w-24 h-[2px] bg-purple-primary/30 mx-auto" />
        </div>

        {/* Featured Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-4 md:gap-x-6 md:gap-y-10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-4 md:gap-x-6 md:gap-y-10">
            {featured.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 font-inter">No products available yet.</p>
          </div>
        )}

        {/* View All */}
        <div className="text-center mt-12">
          <Link to="/shop">
            <motion.span
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-8 py-3 border-2 border-purple-primary text-purple-primary font-inter text-sm tracking-wider hover:bg-purple-primary hover:text-white transition-all duration-300 rounded-full"
            >
              View All Products
            </motion.span>
          </Link>
        </div>
      </div>
    </section>
  );
}
