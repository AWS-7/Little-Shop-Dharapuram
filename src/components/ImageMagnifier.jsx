import { useState, useRef } from 'react';
import { PLACEHOLDER_IMG } from '../lib/products';

export default function ImageMagnifier({ src, alt, zoom = 2.5 }) {
  const [showZoom, setShowZoom] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef(null);
  
  const imageSrc = error ? PLACEHOLDER_IMG : src;

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursorPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-crosshair group"
      onMouseEnter={() => setShowZoom(true)}
      onMouseLeave={() => setShowZoom(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Loading skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading="eager"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
      
      {/* Zoom Lens Overlay - only show if image loaded successfully */}
      {showZoom && !error && loaded && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: `${zoom * 100}%`,
            backgroundPosition: `${cursorPos.x}% ${cursorPos.y}%`,
            backgroundRepeat: 'no-repeat',
            opacity: 0.95,
          }}
        />
      )}
      
      {/* Mobile: Double-tap hint */}
      <div className="absolute bottom-2 right-2 md:hidden bg-black/50 text-white text-[10px] px-2 py-1 rounded-sm font-inter opacity-0 group-hover:opacity-100 transition-opacity">
        Double-tap to zoom
      </div>
    </div>
  );
}
