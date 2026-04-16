import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import useStore from '../../store/useStore';
import { CURRENCY } from '../../lib/constants';

const responsive = {
  mobile: {
    breakpoint: { max: 640, min: 0 },
    items: 2,
    slidesToSlide: 1,
  },
  tablet: {
    breakpoint: { max: 1024, min: 641 },
    items: 3,
    slidesToSlide: 1,
  },
  desktop: {
    breakpoint: { max: 3000, min: 1025 },
    items: 4,
    slidesToSlide: 1,
  },
};

const CustomDot = ({ onClick, active }) => {
  return (
    <button
      onClick={onClick}
      className={`w-2 h-2 rounded-full mx-1 transition-colors ${
        active ? 'bg-purple-primary' : 'bg-gray-300'
      }`}
      aria-label="Go to slide"
    />
  );
};

export default function RecentlyViewed() {
  const { recentlyViewed } = useStore();

  if (recentlyViewed.length === 0) return null;

  // Limit to 8 items to keep carousel manageable
  const displayItems = recentlyViewed.slice(0, 8);

  return (
    <section className="container-luxury py-12 md:py-16">
      <div className="flex items-center gap-2 mb-6">
        <Clock size={16} className="text-rose-gold" />
        <h2 className="font-playfair text-xl md:text-2xl text-purple-primary">Recently Viewed</h2>
      </div>

      <Carousel
        responsive={responsive}
        infinite={true}
        autoPlay={true}
        autoPlaySpeed={3500}
        pauseOnHover={true}
        swipeable={true}
        draggable={true}
        showDots={true}
        customDot={<CustomDot />}
        arrows={false}
        dotListClassName="mt-4"
        containerClass="pb-8"
        itemClass="px-2"
      >
        {displayItems.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full"
          >
            <Link to={`/product/${product.id}`} className="block group">
              {/* Product Card - rounded-3xl as requested */}
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                {/* Image Container */}
                <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Content - Center Aligned */}
                <div className="p-3 text-center">
                  <p className="font-inter text-[9px] tracking-[0.15em] uppercase text-gray-400 mb-1">
                    {product.category}
                  </p>
                  <p className="font-inter text-xs text-gray-700 truncate group-hover:text-purple-primary transition-colors leading-tight">
                    {product.name}
                  </p>
                  <p className="font-inter text-xs font-semibold text-purple-primary mt-1">
                    {CURRENCY}{product.price?.toLocaleString()}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </Carousel>
    </section>
  );
}
