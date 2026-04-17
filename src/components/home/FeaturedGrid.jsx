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
    <section className="py-12 md:py-20 bg-gray-50">
      <div className="container-clean">
        {/* Handpicked for You Section */}
        {handpicked.length > 0 && (
          <div className="mb-16 md:mb-24 bg-white p-4 md:p-6 shadow-sm border border-gray-100 rounded-sm">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
              <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight">
                Handpicked Selection
              </h2>
              <Link to="/shop" className="bg-purple-primary text-white px-6 py-2 rounded-sm font-black text-xs uppercase tracking-widest hover:bg-purple-secondary transition-all">
                View All
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
              {handpicked.map((product, idx) => (
                <ProductCard key={`handpicked-${product.id}`} product={product} index={idx} />
              ))}
            </div>
          </div>
        )}

        {/* Featured Collection Section */}
        <div className="bg-white p-4 md:p-6 shadow-sm border border-gray-100 rounded-sm">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight">
              Featured Collection
            </h2>
            <Link to="/shop" className="bg-purple-primary text-white px-6 py-2 rounded-sm font-black text-xs uppercase tracking-widest hover:bg-purple-secondary transition-all">
              View All
            </Link>
          </div>

          {/* Featured Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-sm" />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
              {featured.map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white">
              <p className="text-gray-500 font-black">No products available yet.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
