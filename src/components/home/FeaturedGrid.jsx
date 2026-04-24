import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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
    <section className="py-10 md:py-16 bg-gray-50">
      <div className="container-clean">
        {/* Handpicked for You Section - Modern MNC Style */}
        {handpicked.length > 0 && (
          <div className="mb-12 md:mb-16">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl">✨</span>
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    Handpicked for You
                  </h2>
                  <p className="text-xs text-gray-500">Curated selection from each category</p>
                </div>
              </div>
              <Link 
                to="/shop" 
                className="text-purple-600 text-sm font-medium hover:text-purple-700 flex items-center gap-1"
              >
                View All →
              </Link>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {handpicked.map((product, idx) => (
                <ProductCard key={`handpicked-${product.id}`} product={product} index={idx} />
              ))}
            </div>
          </div>
        )}

        {/* Featured Collection Section - Modern MNC Style */}
        <div>
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">🔥</span>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                  Featured Collection
                </h2>
                <p className="text-xs text-gray-500">Latest arrivals in our store</p>
              </div>
            </div>
            <Link 
              to="/shop" 
              className="text-purple-600 text-sm font-medium hover:text-purple-700 flex items-center gap-1"
            >
              View All →
            </Link>
          </div>

          {/* Featured Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-gray-200 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {featured.map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500 font-medium">No products available yet.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
