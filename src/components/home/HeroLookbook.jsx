import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HERO_SLIDES } from '../../lib/constants';

const HeroLookbook = forwardRef(function HeroLookbook(props, ref) {
  const [current, setCurrent] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState(null);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
    setActiveHotspot(null);
  }, []);

  // Expose nextSlide to parent via ref
  useImperativeHandle(ref, () => ({
    nextSlide: () => {
      next();
    }
  }));

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    setActiveHotspot(null);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = HERO_SLIDES[current];

  return (
    <section className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          </div>

          {/* Hotspots */}
          {slide.hotspots.map((hotspot, idx) => (
            <div
              key={idx}
              className="absolute z-20 cursor-pointer"
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
              onClick={() =>
                setActiveHotspot(activeHotspot === idx ? null : idx)
              }
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center"
              >
                <Plus size={14} className="text-white" />
              </motion.div>

              <AnimatePresence>
                {activeHotspot === idx && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                    className="absolute left-10 top-0 glass-dark text-white px-4 py-2.5 rounded-sm whitespace-nowrap"
                  >
                    <Link
                      to={`/product/${hotspot.productId}`}
                      className="font-inter text-xs tracking-wide hover:text-rose-gold transition-colors"
                    >
                      {hotspot.label}
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Content */}
          <div className="container-luxury relative z-10 h-full flex flex-col justify-end pb-20 md:pb-28">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <p className="font-inter text-xs tracking-[0.3em] uppercase text-white/70 mb-3">
                {HERO_SLIDES[current].subtitle}
              </p>
              <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white font-semibold mb-6 leading-tight">
                {slide.title}
              </h2>
              <Link to="/shop" className="inline-block">
                <motion.span
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary inline-block"
                >
                  {slide.cta}
                </motion.span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full glass flex items-center justify-center text-gray-700 hover:text-purple-primary transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full glass flex items-center justify-center text-gray-700 hover:text-purple-primary transition-colors"
      >
        <ChevronRight size={20} />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => { setCurrent(idx); setActiveHotspot(null); }}
            className={`h-[2px] transition-all duration-500 ${
              idx === current ? 'w-8 bg-white' : 'w-4 bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
});

export default HeroLookbook;
