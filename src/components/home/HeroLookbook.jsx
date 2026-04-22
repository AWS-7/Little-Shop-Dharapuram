import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getHeroBanners, subscribeToHeroBanners } from '../../lib/heroBanners';

// Default fallback banners
const DEFAULT_BANNERS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop',
    title: 'Huge Summer Sale',
    subtitle: 'Up to 50% Off on All Collections',
    cta: 'Shop Now',
    color: 'bg-purple-primary',
    link: '/shop'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2000&auto=format&fit=crop',
    title: 'New Arrivals 2026',
    subtitle: 'Premium Lifestyle Essentials',
    cta: 'Explore More',
    color: 'bg-indigo-600',
    link: '/shop'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=2000&auto=format&fit=crop',
    title: 'Exclusive Jewellery',
    subtitle: 'Timeless Elegance in Every Piece',
    cta: 'View Collection',
    color: 'bg-pink-600',
    link: '/shop'
  }
];

const HeroLookbook = () => {
  const [banners, setBanners] = useState(DEFAULT_BANNERS);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch banners from database
  useEffect(() => {
    const fetchBanners = async () => {
      const { data, error } = await getHeroBanners();
      if (data && data.length > 0) {
        setBanners(data);
      }
      setLoading(false);
    };

    fetchBanners();

    // Subscribe to real-time changes
    const channel = subscribeToHeroBanners(() => {
      fetchBanners();
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % banners.length);
  const prev = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length);

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (loading) {
    return (
      <section 
        className="relative w-full bg-gray-100 flex items-center justify-center overflow-hidden"
        style={{ aspectRatio: '2048/818' }}
      >
        <Loader2 size={40} className="text-purple-primary animate-spin" />
      </section>
    );
  }

  if (banners.length === 0) return null;

  return (
    <section 
      className="relative w-full overflow-hidden bg-gray-100"
      style={{ aspectRatio: '2048/818' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div className="relative h-full w-full">
            <img 
              src={banners[current].image} 
              alt={banners[current].title}
              loading={current === 0 ? 'eager' : 'lazy'}
              fetchPriority={current === 0 ? 'high' : 'low'}
              decoding="async"
              className="w-full h-full object-cover object-center"
            />
            {/* Gradient Overlay for Text Visibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            
            {/* Content Container */}
            <div className="container-clean h-full flex flex-col justify-center relative z-10 text-white">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight drop-shadow-lg">
                  {banners[current].title}
                </h2>
                <p className="text-lg md:text-xl lg:text-2xl font-medium mb-8 text-white/90 drop-shadow-md">
                  {banners[current].subtitle}
                </p>
                <Link 
                  to={banners[current].link || '/shop'}
                  className="inline-block bg-white text-gray-900 px-8 md:px-12 py-3 md:py-4 rounded-sm font-black text-sm uppercase tracking-wider hover:bg-gray-100 transition-all shadow-xl active:scale-95"
                >
                  {banners[current].cta}
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button 
        onClick={prev}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-4 rounded-r-md backdrop-blur-sm transition-all hidden md:block"
      >
        <ChevronLeft size={32} />
      </button>
      <button 
        onClick={next}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-4 rounded-l-md backdrop-blur-sm transition-all hidden md:block"
      >
        <ChevronRight size={32} />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              idx === current ? 'bg-white w-8' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroLookbook;
