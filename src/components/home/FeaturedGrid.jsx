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
      <div className="container-clean">
        {/* Handpicked for You Section */}
        {handpicked.length > 0 && (
          <div className="mb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
              <div>
                <span className="text-purple-primary text-xs font-bold uppercase tracking-[0.2em] mb-3 block">
                  Curated for You
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Handpicked Selection
                </h2>
              </div>
              <Link to="/shop" className="text-purple-primary font-bold text-sm hover:underline">
                View All Handpicked
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {handpicked.map((product, idx) => (
                <ProductCard key={`handpicked-${product.id}`} product={product} index={idx} />
              ))}
            </div>
          </div>
        )}

        {/* Featured Collection Section */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <span className="text-purple-primary text-xs font-bold uppercase tracking-[0.2em] mb-3 block">
                Fresh Arrivals
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Featured Collection
              </h2>
            </div>
            <Link to="/shop" className="text-purple-primary font-bold text-sm hover:underline">
              Browse Everything
            </Link>
          </div>

          {/* Featured Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-gray-50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {featured.map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl">
              <p className="text-gray-500 font-bold">No products available yet.</p>
            </div>
          )}

          {/* View All Button */}
          <div className="text-center mt-16">
            <Link to="/shop" className="btn-outline inline-flex px-12">
              View All Products
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
