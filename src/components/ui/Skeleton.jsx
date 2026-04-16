import { motion } from 'framer-motion';

// Shimmer animation for skeleton
const shimmer = {
  initial: { x: '-100%' },
  animate: { 
    x: '100%',
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear'
    }
  }
};

// Base skeleton line
export function SkeletonLine({ className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-gray-200 rounded ${className}`}>
      <motion.div
        variants={shimmer}
        initial="initial"
        animate="animate"
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
      />
    </div>
  );
}

// Product Card Skeleton
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      {/* Image skeleton */}
      <div className="aspect-[3/4] relative overflow-hidden bg-gray-200 rounded-t-2xl">
        <motion.div
          variants={shimmer}
          initial="initial"
          animate="animate"
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
      </div>
      
      {/* Content skeleton */}
      <div className="p-3 space-y-2">
        <SkeletonLine className="h-4 w-3/4" />
        <SkeletonLine className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <SkeletonLine className="h-5 w-16" />
          <SkeletonLine className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Product Grid Skeleton (multiple cards)
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-4 md:gap-x-6 md:gap-y-10">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Text skeleton (for titles, descriptions)
export function TextSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine 
          key={i} 
          className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} 
        />
      ))}
    </div>
  );
}

// Hero/ Banner skeleton
export function HeroSkeleton() {
  return (
    <div className="aspect-[4/3] md:aspect-[16/7] relative overflow-hidden bg-gray-200 rounded-none">
      <motion.div
        variants={shimmer}
        initial="initial"
        animate="animate"
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <SkeletonLine className="h-8 w-48 mx-auto" />
          <SkeletonLine className="h-12 w-64 mx-auto" />
          <SkeletonLine className="h-10 w-32 mx-auto rounded-sm" />
        </div>
      </div>
    </div>
  );
}

// Category card skeleton
export function CategoryCardSkeleton() {
  return (
    <div className="aspect-[3/4] relative overflow-hidden bg-gray-200 rounded-2xl">
      <motion.div
        variants={shimmer}
        initial="initial"
        animate="animate"
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <SkeletonLine className="h-6 w-24" />
      </div>
    </div>
  );
}

// Product Detail Page Skeleton
export function ProductDetailSkeleton() {
  return (
    <div className="container-luxury section-spacing">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <SkeletonLine className="h-4 w-16" />
        <SkeletonLine className="h-4 w-4 rounded-full" />
        <SkeletonLine className="h-4 w-20" />
        <SkeletonLine className="h-4 w-4 rounded-full" />
        <SkeletonLine className="h-4 w-32" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Image gallery skeleton */}
        <div className="space-y-4">
          <div className="aspect-square relative overflow-hidden bg-gray-200 rounded-2xl">
            <motion.div
              variants={shimmer}
              initial="initial"
              animate="animate"
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </div>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg relative overflow-hidden">
                <motion.div
                  variants={shimmer}
                  initial="initial"
                  animate="animate"
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product info skeleton */}
        <div className="space-y-5">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="h-10 w-3/4" />
          <SkeletonLine className="h-6 w-32" />
          <div className="flex items-center gap-3">
            <SkeletonLine className="h-8 w-28" />
            <SkeletonLine className="h-6 w-20" />
            <SkeletonLine className="h-6 w-16" />
          </div>
          <div className="space-y-2 pt-4">
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-2/3" />
          </div>
          <SkeletonLine className="h-4 w-40" />
          <div className="flex items-center gap-4 pt-4">
            <SkeletonLine className="h-12 w-32 rounded-full" />
            <SkeletonLine className="h-12 w-12 rounded-full" />
            <SkeletonLine className="h-12 w-48 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
