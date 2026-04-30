import { useState } from 'react';
import { Truck, Gift, Tag, Clock, Percent, Sparkles, Star } from 'lucide-react';

const offers = [
  { icon: Truck, text: 'Free Shipping', subtext: '₹1499+' },
  { icon: Gift, text: 'New User', subtext: '₹100 OFF' },
  { icon: Tag, text: 'New Arrivals', subtext: 'Daily' },
  { icon: Percent, text: 'Flash Sale', subtext: '10-50% OFF' },
  { icon: Clock, text: 'Two Day', subtext: 'Delivery' },
  { icon: Star, text: '4.8+ Rating', subtext: '10K+ Followers' },
];

export default function OffersTicker() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div 
      className="bg-white border-b border-gray-100 py-2 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)} 
    >
      <div 
        className="flex gap-3"
        style={{
          animation: isPaused ? 'none' : 'scroll-left 5s linear infinite',
        }}
      >
        {/* First set */}
        {offers.map((offer, idx) => (
          <div
            key={`a-${idx}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-200 bg-white whitespace-nowrap flex-shrink-0"
          >
            <offer.icon size={12} className="shrink-0 text-gray-400" />
            <span className="font-inter text-[10px] sm:text-xs font-medium text-gray-700">
              {offer.text}
            </span>
            <span className="font-inter text-[9px] text-purple-primary font-semibold">
              {offer.subtext}
            </span>
          </div>
        ))}
        
        {/* Duplicate for seamless loop */}
        {offers.map((offer, idx) => (
          <div
            key={`b-${idx}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-200 bg-white whitespace-nowrap flex-shrink-0"
          >
            <offer.icon size={12} className="shrink-0 text-gray-400" />
            <span className="font-inter text-[10px] sm:text-xs font-medium text-gray-700">
              {offer.text}
            </span>
            <span className="font-inter text-[9px] text-purple-primary font-semibold">
              {offer.subtext}
            </span>
          </div>
        ))}

        {/* Third set for smoother loop */}
        {offers.map((offer, idx) => (
          <div
            key={`c-${idx}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-200 bg-white whitespace-nowrap flex-shrink-0"
          >
            <offer.icon size={12} className="shrink-0 text-gray-400" />
            <span className="font-inter text-[10px] sm:text-xs font-medium text-gray-700">
              {offer.text}
            </span>
            <span className="font-inter text-[9px] text-purple-primary font-semibold">
              {offer.subtext}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
      `}</style>
    </div>
  );
}
