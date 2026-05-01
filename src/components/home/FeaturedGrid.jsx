import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Sparkles } from 'lucide-react';
import ProductCard from './ProductCard';
import { getLatestProducts, getHandpickedProducts } from '../../lib/products';
import { CATEGORIES } from '../../lib/constants';
import { supabase } from '../../lib/supabase';

export default function FeaturedGrid() {
  const [featured, setFeatured] = useState([]);
  const [handpicked, setHandpicked] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchProducts();

    // Real-time subscription to products table
    const channel = supabase
      .channel('products-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products'
      }, () => {
        // Refetch products when any change happens
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white via-gray-50/50 to-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Handpicked for You Section - Beautiful Redesign */}
        {handpicked.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 md:mb-16"
          >
            {/* Elegant Section Header */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              {/* Title with Double Line Diamond Underline */}
              <div className="relative inline-block">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-wide text-center">
                  Handpicked for You
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

            {/* Beautiful Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
              {handpicked.map((product, idx) => (
                <motion.div
                  key={`handpicked-${product.id}`}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
                  className="group"
                >
                  <ProductCard product={product} index={idx} />
                </motion.div>
              ))}
            </div>
            
            {/* View All Button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-10 text-center"
            >
              <Link 
                to="/shop" 
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-full hover:border-purple-primary hover:text-purple-primary transition-all duration-300 group shadow-md hover:shadow-lg"
              >
                Explore All Products
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        )}

        {/* Featured Collection Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {/* Elegant Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            {/* Title with Double Line Diamond Underline */}
            <div className="relative inline-block">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-wide text-center">
                Featured Collection
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

          {/* Featured Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-gray-200 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
              {featured.map((product, idx) => (
                <motion.div
                  key={`featured-${product.id}`}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
                  className="group"
                >
                  <ProductCard product={product} index={idx} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500 font-medium">No products available yet.</p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
