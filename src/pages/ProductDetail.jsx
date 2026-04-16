import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, ShoppingBag, Truck, ShieldCheck, Ban, Minus, Plus,
  ChevronRight, ChevronLeft, Star, MapPin, Scissors, Sparkles,
  ChevronDown, AlertCircle, Share2, Package, Check, RotateCcw, Award,
  CalendarDays, Bell, X, Mail, Smartphone
} from 'lucide-react';
import useStore from '../store/useStore';
import { PLACEHOLDER_PRODUCTS, CURRENCY, SHIPPING_THRESHOLD } from '../lib/constants';
import { getProductById, resolveImageUrl, PLACEHOLDER_IMG } from '../lib/products';
import ProductCard from '../components/home/ProductCard';
import ImageMagnifier from '../components/ImageMagnifier';
import { ProductDetailSkeleton } from '../components/ui/Skeleton';
import { createRestockRequest, checkProductRestockRequests } from '../lib/restock';

function StarRating({ rating, reviewCount, size = 'sm' }) {
  const starSize = size === 'lg' ? 16 : 12;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.floor(rating);
          const half = !filled && star - 0.5 <= rating;
          return (
            <Star
              key={star}
              size={starSize}
              className={filled || half ? 'text-amber-400' : 'text-gray-200'}
              fill={filled ? 'currentColor' : half ? 'url(#half)' : 'none'}
              strokeWidth={filled || half ? 0 : 1.5}
            />
          );
        })}
      </div>
      <span className="font-inter text-xs font-medium text-gray-600">{rating}</span>
      <span className="font-inter text-xs text-gray-400">• {reviewCount} Ratings</span>
    </div>
  );
}

function FabricCareAccordion({ fabric }) {
  const [open, setOpen] = useState(false);

  const items = [
    { icon: Sparkles, label: 'Material', value: fabric.material },
    { icon: Scissors, label: 'Care', value: fabric.care },
    { icon: MapPin, label: 'Origin', value: fabric.origin },
  ];

  return (
    <div className="border border-gray-100 rounded-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
      >
        <span className="font-inter text-xs tracking-[0.15em] uppercase font-medium text-purple-primary">
          Fabric & Care Details
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-gray-400" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
              {items.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={14} className="text-purple-primary" />
                  </div>
                  <div>
                    <p className="font-inter text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-0.5">{label}</p>
                    <p className="font-inter text-sm text-gray-700">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Map a raw Supabase row to the shape our UI expects
function mapSupabaseProduct(p) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.original_price,
    image: resolveImageUrl(p.image_url || p.image),
    gallery: p.gallery || [resolveImageUrl(p.image_url || p.image)],
    category: p.category,
    badge: p.badge,
    inStock: p.stock_count > 0,
    stockCount: p.stock_count,
    rating: p.rating || 0,
    reviewCount: p.review_count || 0,
    fabric: p.fabric || {},
    description: p.description,
    colors: p.colors || [],
  };
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [flyIn, setFlyIn] = useState(false);
  const [product, setProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(true);
  const { addToCart, toggleWishlist, isWishlisted, addToRecentlyViewed } = useStore();
  const scrollRef = useRef(null);

  // Notify Me modal state
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyPhone, setNotifyPhone] = useState('');
  const [notifyName, setNotifyName] = useState('');
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [notifyError, setNotifyError] = useState('');
  const [restockRequestCount, setRestockRequestCount] = useState(0);

  // Try placeholder first, then fetch from Supabase
  useEffect(() => {
    const placeholder = PLACEHOLDER_PRODUCTS.find((p) => p.id === id);
    if (placeholder) {
      setProduct(placeholder);
      setProductLoading(false);
      return;
    }
    // Not a placeholder ID — fetch from Supabase
    getProductById(id).then(({ data, error }) => {
      if (!error && data) {
        setProduct(mapSupabaseProduct(data));
      }
      setProductLoading(false);
    });
  }, [id]);

  // Track recently viewed
  useEffect(() => {
    if (product) addToRecentlyViewed(product);
  }, [product?.id]);

  // Fetch restock request count for this product
  useEffect(() => {
    if (product?.id && product?.stockCount === 0) {
      checkProductRestockRequests(product.id).then(({ count }) => {
        setRestockRequestCount(count);
      });
    }
  }, [product?.id, product?.stockCount]);

  // Handle Notify Me form submission
  const handleNotifySubmit = async (e) => {
    e.preventDefault();
    setNotifyLoading(true);
    setNotifyError('');

    if (!notifyEmail && !notifyPhone) {
      setNotifyError('Please provide either email or phone number');
      setNotifyLoading(false);
      return;
    }

    const { data, error, alreadyExists } = await createRestockRequest({
      productId: product.id,
      productName: product.name,
      email: notifyEmail,
      phone: notifyPhone,
      customerName: notifyName
    });

    if (error) {
      if (alreadyExists) {
        setNotifyError('You have already requested to be notified for this product!');
      } else {
        setNotifyError(error.message || 'Failed to submit request. Please try again.');
      }
    } else {
      setNotifySuccess(true);
      setRestockRequestCount(prev => prev + 1);
      // Reset form after 3 seconds
      setTimeout(() => {
        setShowNotifyModal(false);
        setNotifySuccess(false);
        setNotifyEmail('');
        setNotifyPhone('');
        setNotifyName('');
      }, 3000);
    }

    setNotifyLoading(false);
  };

  if (productLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="container-luxury section-spacing text-center">
        <h2 className="font-playfair text-2xl text-gray-400">Product not found</h2>
        <Link to="/shop" className="btn-primary inline-block mt-6">Back to Shop</Link>
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const gallery = product.gallery || [product.image];
  const related = PLACEHOLDER_PRODUCTS.filter((p) => p.id !== id && p.category === product.category).slice(0, 5);
  const completeTheLook = related.length < 2
    ? PLACEHOLDER_PRODUCTS.filter((p) => p.id !== id).slice(0, 5)
    : related;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedToCart(true);
    setFlyIn(true);
    setTimeout(() => setAddedToCart(false), 2000);
    setTimeout(() => setFlyIn(false), 1000);
  };

  const handleBuyNow = () => {
    // Add to cart first, then go to checkout
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const scrollRelated = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="container-luxury pt-20 md:pt-8 pb-32 md:pb-24 section-spacing">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-inter text-gray-400 mb-8">
          <Link to="/" className="hover:text-purple-primary transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/shop" className="hover:text-purple-primary transition-colors">Shop</Link>
          <ChevronRight size={12} />
          <Link to={`/shop?category=${product.category}`} className="hover:text-purple-primary transition-colors">{product.category}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-700 truncate max-w-[140px]">{product.name}</span>
        </nav>

        {/* ═══ Main 2-Column Layout ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 lg:gap-16">

          {/* ── LEFT: Image Gallery ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 items-center"
          >
            {/* Thumbnail Strip */}
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[600px] pb-1 md:pb-0 md:pr-1 scrollbar-hide items-center md:items-start justify-center md:justify-start">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`flex-shrink-0 w-16 h-20 md:w-[72px] md:h-[90px] overflow-hidden rounded-sm transition-all duration-300 ${
                    activeImage === idx
                      ? 'ring-2 ring-rose-gold ring-offset-2 opacity-100'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt={`${product.name} view ${idx + 1}`} onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMG; }} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Image with Zoom */}
            <div className="relative flex-1 aspect-[3/4] overflow-hidden bg-gray-50 rounded-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35 }}
                  className="w-full h-full"
                >
                  <ImageMagnifier src={gallery[activeImage]} alt={product.name} zoom={2.5} />
                </motion.div>
              </AnimatePresence>

              {/* Image Nav Arrows */}
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((prev) => (prev - 1 + gallery.length) % gallery.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-600 hover:text-purple-primary transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setActiveImage((prev) => (prev + 1) % gallery.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-600 hover:text-purple-primary transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}

              {/* Badge */}
              {product.badge && (
                <span className={`absolute top-4 left-4 z-10 ${product.badge === 'Sale' ? 'bg-rose-gold' : 'bg-purple-primary'} text-white text-[10px] font-inter font-semibold tracking-widest uppercase px-3 py-1`}>
                  {product.badge}
                </span>
              )}

              {/* Image Counter */}
              <span className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm text-white font-inter text-[10px] tracking-wider px-2.5 py-1 rounded-full">
                {activeImage + 1} / {gallery.length}
              </span>
            </div>
          </motion.div>

          {/* ── RIGHT: Product Info ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col space-y-6"
          >
            {/* Category */}
            <p className="font-inter text-[10px] tracking-[0.25em] uppercase text-gray-400 mb-1">
              {product.category}
            </p>

            {/* Title */}
            <h1 className="font-playfair text-2xl md:text-3xl text-gray-900 leading-snug capitalize mt-2">
              {product.name}
            </h1>

            {/* Star Ratings - Below Title */}
            {product.rating && (
              <div className="-mt-4">
                <StarRating rating={product.rating} reviewCount={product.reviewCount} />
              </div>
            )}

            {/* Compact Price Block */}
            <div className="flex items-center gap-3">
              <span className="font-playfair text-3xl font-medium text-gray-900">
                {CURRENCY}{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="font-inter text-base text-gray-400 line-through">
                  {CURRENCY}{product.originalPrice.toLocaleString()}
                </span>
              )}
              {product.originalPrice && (
                <span className="bg-rose-gold text-white text-xs font-inter font-medium px-2 py-0.5">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </span>
              )}
            </div>

            {/* GST */}
            <p className="font-inter text-[11px] text-gray-400 -mt-4">Inclusive of all taxes</p>

            {/* Product Details Cards */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              {/* Material & Weight */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Check size={14} className="text-purple-primary" />
                  </div>
                  <div>
                    <p className="font-inter text-[10px] text-gray-400 uppercase tracking-wider">Material</p>
                    <p className="font-inter text-sm text-gray-700">22K Gold Plated</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Check size={14} className="text-purple-primary" />
                  </div>
                  <div>
                    <p className="font-inter text-[10px] text-gray-400 uppercase tracking-wider">Weight</p>
                    <p className="font-inter text-sm text-gray-700">45 grams</p>
                  </div>
                </div>
              </div>

              {/* Delivery Card */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Truck size={18} className="text-purple-primary" />
                  <p className="font-inter text-sm font-medium text-gray-800">Delivery</p>
                </div>
                <p className="font-inter text-sm text-gray-600 pl-9">
                  by <span className="font-medium text-purple-primary">Wed, 22 Apr</span>
                </p>
              </div>

              {/* Policies */}
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <RotateCcw size={14} className="text-gray-400" />
                  <span className="font-inter text-xs text-gray-500">7 Day Easy Return</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award size={14} className="text-gray-400" />
                  <span className="font-inter text-xs text-gray-500">100% Authentic</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="font-inter text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-6">
              {product.description || 'Exquisitely crafted with premium materials and meticulous attention to detail.'}
            </p>

            {/* Stock Indicator */}
            {product.stockCount > 0 && product.stockCount <= 5 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-sm px-4 py-2.5"
              >
                <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
                <p className="font-inter text-xs text-amber-700 font-medium">
                  Only {product.stockCount} left in stock — order soon!
                </p>
              </motion.div>
            )}
            {product.stockCount > 5 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-primary" />
                <p className="font-inter text-xs text-purple-primary font-medium">In Stock ({product.stockCount} available)</p>
              </div>
            )}
            {/* Out of Stock - Notify Me */}
            {product.stockCount === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 border border-rose-100 rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <Ban size={18} className="text-rose-500" />
                  </div>
                  <div>
                    <p className="font-inter text-sm font-medium text-rose-700">Out of Stock</p>
                    <p className="font-inter text-xs text-rose-500">
                      {restockRequestCount > 0 
                        ? `${restockRequestCount} customer${restockRequestCount > 1 ? 's' : ''} waiting for restock`
                        : 'Be the first to know when it\'s back!'
                      }
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowNotifyModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-rose-gold text-white font-inter text-sm font-medium py-3 rounded-lg hover:bg-rose-600 transition-colors"
                >
                  <Bell size={16} />
                  Notify me when available
                </motion.button>
              </motion.div>
            )}

            {/* Fabric & Care Accordion */}
            {product.fabric && (
              <div className="border-t border-gray-100 pt-6">
                <FabricCareAccordion fabric={product.fabric} />
              </div>
            )}

            {/* Quantity & Actions */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="font-inter text-xs tracking-wider uppercase text-gray-500">Quantity</span>
                <div className="flex items-center border border-gray-200 rounded-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center font-inter text-sm font-medium border-x border-gray-200">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Premium Action Buttons — Equal Width */}
              <div className="hidden md:grid grid-cols-2 gap-3 z-30 relative">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleAddToCart}
                  animate={flyIn ? { x: [0, -5, 5, 0], transition: { duration: 0.3 } } : {}}
                  className="py-4 md:py-5 border-2 border-purple-primary text-purple-primary font-inter text-sm md:text-base font-medium tracking-wide rounded-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 min-h-[56px] md:min-h-[64px]"
                >
                  <ShoppingBag size={18} strokeWidth={1.5} />
                  {addedToCart ? 'Added!' : 'Add to Bag'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleBuyNow}
                  className="py-4 md:py-5 bg-[#c9a89a] text-white font-inter text-sm md:text-base font-medium tracking-wide rounded-sm hover:bg-[#b8988a] transition-colors flex items-center justify-center gap-2 min-h-[56px] md:min-h-[64px] z-30"
                  style={{ backgroundColor: '#c9a89a' }}  /* Soft mauve/rose gold */
                >
                  <span className="font-light">Buy Now</span>
                </motion.button>
              </div>

              {/* Wishlist & Share - Secondary Actions */}
              <div className="hidden md:flex items-center gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleWishlist(product)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-sm transition-colors text-sm font-inter text-gray-600 hover:border-rose-gold hover:text-rose-gold"
                >
                  <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} strokeWidth={1.5} />
                  {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                </motion.button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-sm transition-colors text-sm font-inter text-gray-600 hover:border-gray-400">
                  <Share2 size={16} strokeWidth={1.5} />
                  Share
                </button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-t border-gray-100 pt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-500 font-inter">
                <ShieldCheck size={16} className="text-purple-primary flex-shrink-0" strokeWidth={1.5} />
                <span>Secure Payment & Easy Checkout</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-rose-gold font-inter font-medium">
                <Ban size={16} className="flex-shrink-0" strokeWidth={1.5} />
                <span>No Returns / No Exchanges — All Sales Final</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══ Complete the Look / Related Products ═══ */}
        {completeTheLook.length > 0 && (
          <div className="mt-20 md:mt-28">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="font-inter text-xs tracking-[0.3em] uppercase text-rose-gold mb-2">
                  Curated For You
                </p>
                <h2 className="font-playfair text-2xl md:text-3xl text-purple-primary">
                  {related.length >= 2 ? 'Complete the Look' : 'You May Also Like'}
                </h2>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => scrollRelated(-1)}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-primary hover:text-purple-primary transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => scrollRelated(1)}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-primary hover:text-purple-primary transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Horizontal Scroll Grid */}
            <div
              ref={scrollRef}
              className="flex gap-4 md:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0"
            >
              {completeTheLook.map((p, idx) => (
                <div key={p.id} className="flex-shrink-0 w-[48%] md:w-[calc(25%-18px)] lg:w-[calc(20%-19px)] snap-start">
                  <ProductCard product={p} index={idx} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Mobile/Tablet Sticky Action Bar — sits above bottom nav ═══ */}
      <div className="fixed bottom-[64px] left-0 right-0 z-50 lg:hidden">
        <div className="bg-white border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] px-4 md:px-6 py-3 md:py-4">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              className="py-3 md:py-4 border-2 border-purple-primary text-purple-primary font-inter text-sm md:text-base font-medium rounded-sm flex items-center justify-center gap-2 min-h-[52px] md:min-h-[56px]"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {addedToCart ? 'Added!' : 'Add to Bag'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleBuyNow}
              className="py-3 md:py-4 text-white font-inter text-sm md:text-base font-medium rounded-sm flex items-center justify-center min-h-[52px] md:min-h-[56px] z-50"
              style={{ backgroundColor: '#c9a89a' }}  /* Soft mauve/rose gold */
            >
              <span className="font-light">Buy Now</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* ═══ NOTIFY ME MODAL ═══ */}
      <AnimatePresence>
        {showNotifyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => !notifyLoading && setShowNotifyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-rose-gold to-rose-400 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Bell size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-playfair text-lg">Get Notified</h3>
                      <p className="font-inter text-xs text-white/80">When this product is back in stock</p>
                    </div>
                  </div>
                  <button
                    onClick={() => !notifyLoading && setShowNotifyModal(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    disabled={notifyLoading}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Product Info */}
                <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                    onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
                  />
                  <div>
                    <p className="font-inter text-sm font-medium text-gray-800 line-clamp-1">{product.name}</p>
                    <p className="font-inter text-sm text-rose-gold font-medium">{CURRENCY}{product.price.toLocaleString()}</p>
                  </div>
                </div>

                {notifySuccess ? (
                  /* Success Message */
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <Check size={32} className="text-purple-primary" />
                    </div>
                    <h4 className="font-playfair text-xl text-gray-800 mb-2">You're on the list!</h4>
                    <p className="font-inter text-sm text-gray-500">
                      We'll notify you as soon as {product.name} is back in stock.
                    </p>
                  </motion.div>
                ) : (
                  /* Form */
                  <form onSubmit={handleNotifySubmit} className="space-y-4">
                    {/* Name (Optional) */}
                    <div>
                      <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">
                        Your Name <span className="text-gray-300 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                          <span className="font-inter text-sm">👤</span>
                        </div>
                        <input
                          type="text"
                          value={notifyName}
                          onChange={(e) => setNotifyName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full border border-gray-200 rounded-lg pl-11 pr-4 py-3 font-inter text-sm outline-none focus:border-rose-gold transition-colors"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">
                        Email <span className="text-gray-300 font-normal">(Required if no phone)</span>
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          value={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full border border-gray-200 rounded-lg pl-11 pr-4 py-3 font-inter text-sm outline-none focus:border-rose-gold transition-colors"
                        />
                      </div>
                    </div>

                    {/* Phone/WhatsApp */}
                    <div>
                      <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">
                        WhatsApp / Phone <span className="text-gray-300 font-normal">(Required if no email)</span>
                      </label>
                      <div className="relative">
                        <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          value={notifyPhone}
                          onChange={(e) => setNotifyPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full border border-gray-200 rounded-lg pl-11 pr-4 py-3 font-inter text-sm outline-none focus:border-rose-gold transition-colors"
                        />
                      </div>
                      <p className="font-inter text-[10px] text-gray-400 mt-1.5">
                        We recommend WhatsApp for instant notifications
                      </p>
                    </div>

                    {/* Error */}
                    {notifyError && (
                      <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 flex items-center gap-2">
                        <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
                        <p className="font-inter text-xs text-rose-600">{notifyError}</p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      disabled={notifyLoading}
                      className="w-full bg-rose-gold text-white font-inter text-sm font-medium py-4 rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {notifyLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Bell size={18} />
                          Notify Me When Available
                        </>
                      )}
                    </motion.button>

                    <p className="text-center font-inter text-[10px] text-gray-400">
                      We'll only use your contact info to notify you about this product
                    </p>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
