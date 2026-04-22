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
    <section className="container-luxury py-8 md:py-12">
      <div className="flex items-center gap-2 mb-4">
        <Eye size={16} className="text-rose-gold" />
        <h2 className="font-playfair text-lg md:text-xl text-purple-primary">Recently Viewed</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xs mx-auto"
      >
        <Link to={`/product/${liveProduct.id}`} className="block group">
          {/* Single Product Card */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
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
            <div className="p-4 text-center">
              <p className="font-inter text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1">
                {liveProduct.category}
              </p>
              <p className="font-inter text-sm text-gray-700 truncate group-hover:text-purple-primary transition-colors leading-tight">
                {liveProduct.name}
              </p>
              <p className="font-inter text-sm font-semibold text-purple-primary mt-1">
                {CURRENCY}{liveProduct.price?.toLocaleString()}
              </p>
              <button className="mt-3 px-4 py-2 bg-purple-primary text-white text-xs font-medium rounded-lg hover:bg-purple-primary/90 transition-colors">
                View Product
              </button>
            </div>
          </div>
        </Link>
      </motion.div>
    </section>
  );
}
