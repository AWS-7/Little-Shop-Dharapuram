import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, X, Timer, ImageOff } from 'lucide-react';
import { getActiveFlashSale } from '../../lib/flashSales';
import { CURRENCY } from '../../lib/constants';

export default function FlashSaleBanner({ onClosePopup, triggerHeroSlide }) {
  const [flashSale, setFlashSale] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Popup states - NO sticky banner
  const [showPopup, setShowPopup] = useState(false);
  const [popupClosed, setPopupClosed] = useState(false);

  // Fetch active flash sale
  useEffect(() => {
    const fetchFlashSale = async () => {
      const { data, error } = await getActiveFlashSale();
      if (!error && data) {
        setFlashSale(data);
      }
      setLoading(false);
    };

    fetchFlashSale();
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchFlashSale, 30000);
    return () => clearInterval(interval);
  }, []);

  // 30s delay before showing popup
  useEffect(() => {
    if (loading || !flashSale || popupClosed) return;
    
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 30000); // 30 seconds
    
    return () => clearTimeout(timer);
  }, [loading, flashSale, popupClosed]);

  // Auto-close popup after 8 seconds
  useEffect(() => {
    if (!showPopup) return;
    
    const autoCloseTimer = setTimeout(() => {
      handleClosePopup();
    }, 8000); // 8 seconds
    
    return () => clearTimeout(autoCloseTimer);
  }, [showPopup]);

  // Handle popup close - triggers hero slide and disappears completely
  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    setPopupClosed(true);
    // NO sticky bar - completely disappears
    
    // Trigger hero slider
    if (triggerHeroSlide) {
      triggerHeroSlide();
    }
    
    // Notify parent
    if (onClosePopup) {
      onClosePopup();
    }
  }, [triggerHeroSlide, onClosePopup]);

  // Countdown timer
  useEffect(() => {
    if (!flashSale?.end_time) return;

    const calculateTimeLeft = () => {
      const end = new Date(flashSale.end_time).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setFlashSale(null); // Auto-hide when expired
        return null;
      }

      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (!remaining) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSale]);

  // Don't render anything if loading, no flash sale, or timer expired
  if (loading || !flashSale || !timeLeft) return null;

  const discountPercent = Math.round(
    (1 - flashSale.discounted_price / flashSale.original_price) * 100
  );

  return (
    <AnimatePresence>
      {showPopup && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
            onClick={handleClosePopup}
          />
          
          {/* PREMIUM HORIZONTAL POPUP */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 30,
              duration: 0.3
            }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col sm:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleClosePopup}
                className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X size={18} />
              </button>

              {/* LEFT: Product Image (40% on desktop) */}
              <div className="relative w-full sm:w-[45%] aspect-[4/3] sm:aspect-auto sm:min-h-[280px] bg-gray-100">
                {flashSale.product_image ? (
                  <img
                    src={flashSale.product_image}
                    alt={flashSale.product_name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <ImageOff size={40} className="text-gray-400 mb-2" />
                    <span className="text-gray-400 text-sm font-inter">No Image</span>
                  </div>
                )}
                
                {/* Flash Badge on Image */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-500 text-gray-900 px-2 py-1 rounded-full">
                  <Zap size={12} fill="currentColor" />
                  <span className="font-inter text-xs font-bold">{discountPercent}% OFF</span>
                </div>
              </div>

              {/* RIGHT: Content (60% on desktop) */}
              <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-inter text-[10px] tracking-[0.15em] uppercase text-amber-600 font-semibold">
                    Flash Sale
                  </span>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Timer size={12} />
                    <span className="font-inter text-xs tabular-nums">
                      {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Product Name */}
                <h3 className="font-playfair text-lg sm:text-xl text-gray-900 mb-2 line-clamp-2 leading-tight">
                  {flashSale.product_name}
                </h3>
                
                <p className="font-inter text-xs text-gray-500 mb-3 line-clamp-1">
                  {flashSale.banner_text || 'Limited time offer!'}
                </p>

                {/* Pricing */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-playfair text-2xl text-gray-900 font-bold">
                    {CURRENCY}{flashSale.discounted_price?.toLocaleString()}
                  </span>
                  <span className="font-inter text-sm text-gray-400 line-through">
                    {CURRENCY}{flashSale.original_price?.toLocaleString()}
                  </span>
                </div>

                {/* CTA Button */}
                <Link
                  to={`/product/${flashSale.product_id}`}
                  onClick={() => setShowPopup(false)}
                  className="group flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-gray-800 text-white font-inter font-medium text-sm px-4 py-3 rounded-xl transition-all"
                >
                  <span>SHOP NOW</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Progress bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 8, ease: "linear" }}
                className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 origin-left"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
