import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { getTestimonials } from '../../lib/testimonials';

// Fallback testimonials if no database data
const fallbackTestimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    location: 'Chennai, TN',
    avatar: null, // Will use initials if no image
    rating: 5,
    title: 'Absolutely Gorgeous Saree!',
    review: 'The silk saree I ordered exceeded my expectations. The quality is premium and the zari work is exquisite. Perfect for my sister\'s wedding!',
    product: 'Banarasi Silk Saree',
    date: '2 weeks ago',
    verified: true,
  },
  {
    id: 2,
    name: 'Lakshmi Devi',
    location: 'Coimbatore, TN',
    avatar: null,
    rating: 5,
    title: 'Beautiful Jewelry Collection',
    review: 'I purchased the temple jewelry set and I\'m in love with the craftsmanship. The antique finish looks so authentic. Highly recommend!',
    product: 'Temple Jewelry Set',
    date: '1 month ago',
    verified: true,
  },
  {
    id: 3,
    name: 'Anitha Raj',
    location: 'Madurai, TN',
    avatar: null,
    rating: 4,
    title: 'Great Quality Cotton Sarees',
    review: 'The cotton sarees are perfect for daily wear. Soft fabric, beautiful colors, and very comfortable. Will definitely order more!',
    product: 'Cotton Saree Collection',
    date: '3 weeks ago',
    verified: true,
  },
  {
    id: 4,
    name: 'Kavitha Menon',
    location: 'Bangalore, KA',
    avatar: null,
    rating: 5,
    title: 'Excellent Service & Fast Delivery',
    review: 'Ordered a choker necklace and it arrived beautifully packaged within 3 days. The quality is outstanding. Little Shop is now my go-to!',
    product: 'Heritage Choker',
    date: '1 week ago',
    verified: true,
  },
  {
    id: 5,
    name: 'Meena Krishnan',
    location: 'Salem, TN',
    avatar: null,
    rating: 5,
    title: 'Traditional Elegance at its Best',
    review: 'The Kanjivaram saree I bought for my daughter\'s engagement was stunning. Everyone asked where I got it from. Thank you Little Shop!',
    product: 'Kanjivaram Silk Saree',
    date: '2 months ago',
    verified: true,
  },
];

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch testimonials from database
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await getTestimonials();
      if (data && data.length > 0) {
        setTestimonials(data);
      } else {
        setTestimonials(fallbackTestimonials);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    if (testimonials.length === 0) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const next = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-gradient-to-b from-white via-purple-50/30 to-white">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse bg-gray-200 h-64 rounded-3xl max-w-4xl mx-auto" />
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) return null;

  const current = testimonials[currentIndex];

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white via-purple-50/30 to-white overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-4"
          >
            <Star size={16} fill="currentColor" />
            Customer Love
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
          >
            What Our Customers Say
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-2xl mx-auto"
          >
            Join thousands of happy customers who trust Little Shop for their ethnic fashion needs
          </motion.p>
        </div>

        {/* Trust Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-8 md:gap-16 mb-12"
        >
          {[
            { value: '4.9', label: 'Average Rating', icon: Star },
            { value: '10,000+', label: 'Happy Customers', icon: User },
            { value: '98%', label: 'Would Recommend', icon: Quote },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <stat.icon size={20} className="text-purple-600" />
                <span className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Main Testimonial Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
            {/* Quote Icon */}
            <div className="absolute top-6 left-8 md:left-12">
              <Quote size={40} className="text-purple-100" />
            </div>

            {/* Testimonial Content */}
            <div className="relative min-h-[280px] flex items-center justify-center">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="w-full"
                >
                  {/* Rating Stars */}
                  <div className="flex justify-center gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={24}
                        fill={i < current.rating ? '#FBBF24' : 'none'}
                        className={i < current.rating ? 'text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>

                  {/* Review Title */}
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-4">
                    "{current.title}"
                  </h3>

                  {/* Review Text */}
                  <p className="text-gray-600 text-center text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
                    {current.review}
                  </p>

                  {/* Customer Info */}
                  <div className="flex flex-col items-center">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold mb-3 shadow-lg">
                      {current.avatar ? (
                        <img src={current.avatar} alt={current.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        current.name.charAt(0)
                      )}
                    </div>

                    {/* Name & Location */}
                    <h4 className="font-semibold text-gray-900">{current.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">{current.location}</p>

                    {/* Verified Badge */}
                    {current.verified && (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verified Purchase
                      </span>
                    )}

                    {/* Product Name */}
                    <p className="text-xs text-purple-600 mt-2 font-medium">
                      Purchased: {current.product}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-purple-600 hover:shadow-lg transition-all"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-purple-600 hover:shadow-lg transition-all"
              aria-label="Next testimonial"
            >
              <ChevronRight size={20} />
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentIndex ? 1 : -1);
                    setCurrentIndex(idx);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'bg-purple-600 w-8'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 mb-4">Join our community of satisfied customers</p>
          <a
            href="/shop"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Start Shopping Now
            <ChevronRight size={18} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
