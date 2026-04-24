import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, X, Timer, ImageOff, ShoppingCart, Check, Sparkles, RotateCw, Tag, Truck, Shield } from 'lucide-react';
import { getActiveFlashSale } from '../../lib/flashSales';
import { CURRENCY } from '../../lib/constants';

export default function FlashSaleBanner({ onClosePopup, triggerHeroSlide }) {
  const [flashSale, setFlashSale] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Popup states
  const [showPopup, setShowPopup] = useState(false);
  const [popupClosed, setPopupClosed] = useState(false);
  
  // 3D Flip Card state
  const [isFlipped, setIsFlipped] = useState(false);

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
    // Poll every 2 minutes for updates (reduced from 30s for performance)
    const interval = setInterval(fetchFlashSale, 120000);
    return () => clearInterval(interval);
  }, []);

  // Show popup immediately when flash sale is available
  useEffect(() => {
    if (loading || !flashSale || popupClosed) return;
    
    // Small delay to let page load first (2 seconds)
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 2000);
    
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
          
          {/* 3D FLIP CARD CONTAINER */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateY: 90 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 25,
              duration: 0.5
            }}
            style={{ perspective: '1000px' }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="relative w-full max-w-xs sm:max-w-sm pointer-events-auto"
              style={{ perspective: '1000px' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* FLIP CARD INNER */}
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                style={{ 
                  transformStyle: 'preserve-3d',
                  perspective: '1000px'
                }}
                className="relative w-full"
              >
                {/* FRONT SIDE */}
                <div
                  style={{ backfaceVisibility: 'hidden' }}
                  className="relative w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl overflow-hidden"
                >
                  {/* Close Button */}
                  <button
                    onClick={handleClosePopup}
                    className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>

                  {/* Glowing Border Effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 p-[1px]">
                    <div className="w-full h-full rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
                  </div>

                  {/* Content */}
                  <div className="relative p-4 sm:p-6">
                    {/* Flash Badge */}
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 px-3 py-1.5 rounded-full">
                        <Sparkles size={14} />
                        <span className="font-bold text-xs tracking-wide">FLASH SALE</span>
                        <Zap size={14} fill="currentColor" />
                      </div>
                    </div>

                    {/* Product Image - Smaller */}
                    <div className="relative w-3/4 mx-auto aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-800">
                      {flashSale.product_image ? (
                        <img
                          src={flashSale.product_image}
                          alt={flashSale.product_name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                          <ImageOff size={48} className="text-gray-500 mb-2" />
                          <span className="text-gray-500 text-sm">No Image Available</span>
                        </div>
                      )}
                      
                      {/* Discount Badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-full">
                        <Tag size={14} />
                        <span className="font-bold text-sm">{discountPercent}% OFF</span>
                      </div>
                    </div>

                    {/* Timer */}
                    <div className="flex items-center justify-center gap-1.5 mb-3">
                      <Timer size={16} className="text-amber-400" />
                      <span className="text-amber-400 font-mono text-base font-bold tracking-wider">
                        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-lg sm:text-xl text-white font-bold text-center mb-2 leading-tight line-clamp-2">
                      {flashSale.product_name}
                    </h3>
                    
                    {/* Banner Text */}
                    <p className="text-gray-400 text-xs text-center mb-4 line-clamp-1">
                      {flashSale.banner_text || 'Limited time offer!'}
                    </p>

                    {/* Pricing */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-2xl sm:text-3xl text-white font-bold">
                        {CURRENCY}{flashSale.discounted_price?.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        {CURRENCY}{flashSale.original_price?.toLocaleString()}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link
                        to={`/product/${flashSale.product_id}`}
                        onClick={() => setShowPopup(false)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-gray-900 font-bold px-3 py-2.5 rounded-xl transition-all transform hover:scale-105 text-sm"
                      >
                        <ShoppingCart size={16} />
                        <span>BUY</span>
                      </Link>
                      
                      <button
                        onClick={() => setIsFlipped(true)}
                        className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2.5 rounded-xl transition-all"
                      >
                        <RotateCw size={16} />
                        <span className="hidden sm:inline text-sm">Info</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* BACK SIDE (Flipped) - Compact */}
                <div
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                  className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl overflow-hidden"
                >
                  {/* Close Button */}
                  <button
                    onClick={handleClosePopup}
                    className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>

                  {/* Content */}
                  <div className="relative p-4 sm:p-6 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2.5 py-1 rounded-full">
                        <Sparkles size={12} />
                        <span className="font-bold text-xs tracking-wide">INFO</span>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="text-lg text-white font-bold mb-3 line-clamp-2">
                        {flashSale.product_name}
                      </h3>

                      {/* Features List - Compact */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-gray-300 text-xs">
                          <Check size={14} className="text-green-400" />
                          <span>Premium Quality</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300 text-xs">
                          <Truck size={14} className="text-blue-400" />
                          <span>Free Shipping</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300 text-xs">
                          <Shield size={14} className="text-purple-400" />
                          <span>Secure Payment</span>
                        </div>
                      </div>

                      {/* Pricing on Back - Compact */}
                      <div className="bg-white/5 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="text-gray-400">Original</span>
                          <span className="text-gray-400 line-through">{CURRENCY}{flashSale.original_price?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white font-semibold text-sm">You Pay</span>
                          <span className="text-xl text-amber-400 font-bold">{CURRENCY}{flashSale.discounted_price?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Timer on Back */}
                    <div className="flex items-center justify-center gap-1.5 mb-3">
                      <Timer size={14} className="text-red-400" />
                      <span className="text-red-400 font-mono text-sm font-bold tracking-wider">
                        Ends: {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link
                        to={`/product/${flashSale.product_id}`}
                        onClick={() => setShowPopup(false)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-bold px-3 py-2 rounded-xl transition-all text-sm"
                      >
                        <ShoppingCart size={16} />
                        <span>GRAB</span>
                      </Link>
                      
                      <button
                        onClick={() => setIsFlipped(false)}
                        className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl transition-all"
                      >
                        <RotateCw size={16} />
                        <span className="hidden sm:inline text-sm">Back</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
