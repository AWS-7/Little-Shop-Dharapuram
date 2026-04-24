import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Eye } from 'lucide-react';
import useStore from '../../store/useStore';
import { CURRENCY } from '../../lib/constants';
import { useState, useEffect } from 'react';
import { getProductById } from '../../lib/products';

// Empty component - no carousel needed for single item

export default function RecentlyViewed() {
  const { recentlyViewed } = useStore();
  const [liveProduct, setLiveProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the most recent live product from database
  useEffect(() => {
    const fetchLiveProduct = async () => {
      if (recentlyViewed.length === 0) {
        setLoading(false);
        return;
      }

      // Try to find the first live product (most recent first)
      for (const viewedProduct of recentlyViewed) {
        try {
          const { data: product } = await getProductById(viewedProduct.id);
          if (product) {
            // Product exists - use live data
            setLiveProduct({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image || product.image_url,
              category: product.category
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          console.log('Product not found or error:', viewedProduct.id);
        }
      }

      // No live products found
      setLiveProduct(null);
      setLoading(false);
    };

    fetchLiveProduct();
  }, [recentlyViewed]);

  // Don't render if no products or still loading
  if (loading || !liveProduct) return null;

  return (
    <section className="container-clean py-6 md:py-10 bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Eye size={16} className="text-blue-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">Recently Viewed</h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to={`/product/${liveProduct.id}`} className="block group">
            {/* Single Product Card - Modern MNC Style */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              {/* Image Container */}
              <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                  src={liveProduct.image}
                  alt={liveProduct.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/400x300/f3f4f6/9ca3af?text=No+Image';
                  }}
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                  {liveProduct.category}
                </p>
                <p className="text-sm font-medium text-gray-800 truncate group-hover:text-purple-600 transition-colors leading-tight mb-1">
                  {liveProduct.name}
                </p>
                <p className="text-base font-semibold text-purple-600">
                  {CURRENCY}{liveProduct.price?.toLocaleString()}
                </p>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
