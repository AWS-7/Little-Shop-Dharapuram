import { useState, useRef } from 'react';

export default function ImageMagnifier({ src, alt, zoom = 2.5 }) {
  const [showZoom, setShowZoom] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

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
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      
      {/* Zoom Lens Overlay */}
      {showZoom && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${src})`,
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
