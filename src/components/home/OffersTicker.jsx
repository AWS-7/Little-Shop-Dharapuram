import { useEffect, useRef, useState } from 'react';
import { Truck, Gift, Tag, Clock, Percent, Sparkles, Star } from 'lucide-react';

const offers = [
  { icon: Truck, text: 'FREE Shipping on orders over ₹999' },
  { icon: Gift, text: 'Get ₹100 OFF on first order' },
  { icon: Tag, text: 'New Arrivals - Shop Now' },
  { icon: Percent, text: 'Flash Sale - Up to 50% OFF' },
  { icon: Clock, text: 'Same Day Delivery Available' },
  { icon: Sparkles, text: 'Premium Quality Guaranteed' },
  { icon: Star, text: '4.8+ Rating from 10,000+ Customers' },
];

export default function OffersTicker() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div 
      className="bg-purple-primary text-white overflow-hidden py-2 pb-3 mb-2 sm:mt-15 lg:mt-7 md:mt-2 relative z-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div 
        className={`flex gap-8 md:gap-12 whitespace-nowrap ${isPaused ? '' : 'animate-marquee'}`}
        style={{
          animation: isPaused ? 'none' : 'marquee 25s linear infinite',
        }}
      >
        {/* First set */}
        {offers.map((offer, idx) => (
          <div key={`a-${idx}`} className="flex items-center gap-2 px-2 md:px-4">
            <offer.icon size={12} className="shrink-0 md:w-3.5 md:h-3.5" />
            <span className="font-inter text-[10px] md:text-xs font-medium tracking-wide whitespace-nowrap">
              {offer.text}
            </span>
            <span className="text-white/30 mx-1 md:mx-2">|</span>
          </div>
        ))}
        
        {/* Duplicate for seamless loop */}
        {offers.map((offer, idx) => (
          <div key={`b-${idx}`} className="flex items-center gap-2 px-2 md:px-4">
            <offer.icon size={12} className="shrink-0 md:w-3.5 md:h-3.5" />
            <span className="font-inter text-[10px] md:text-xs font-medium tracking-wide whitespace-nowrap">
              {offer.text}
            </span>
            <span className="text-white/30 mx-1 md:mx-2">|</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
