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
  const { addToCart, toggleWishlist, isWishlisted, addToRecentlyViewed, cartError, clearCartError, openCartDrawer } = useStore();
  const scrollRef = useRef(null);

  // Notify Me modal state
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
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

    if (!notifyEmail) {
      setNotifyError('Please provide your email address');
      setNotifyLoading(false);
      return;
    }

    const { data, error, alreadyExists } = await createRestockRequest({
      productId: product.id,
      productName: product.name,
      email: notifyEmail,
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

  const [cartErrorLocal, setCartErrorLocal] = useState('');

  const handleAddToCart = () => {
    clearCartError();
    setCartErrorLocal('');
    const result = addToCart(product, quantity);
    if (result.success) {
      setAddedToCart(true);
      setFlyIn(true);
      setTimeout(() => setAddedToCart(false), 2000);
      setTimeout(() => setFlyIn(false), 1000);
      openCartDrawer();
    } else {
      setCartErrorLocal(result.error || cartError);
    }
  };

  const handleBuyNow = () => {
    // Add to cart first, then go to checkout
    clearCartError();
    setCartErrorLocal('');
    const result = addToCart(product, quantity);
    if (result.success) {
      navigate('/checkout');
    } else {
      setCartErrorLocal(result.error || cartError);
    }
  };

  // Check stock status
  const isInStock = product?.inStock ?? (product?.stockCount > 0);
  const isLowStock = isInStock && product?.stockCount <= 3;

  const scrollRelated = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="container-clean pt-36 md:pt-48 pb-32 md:pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-inter text-gray-400 mb-8 px-1">
          <Link to="/" className="hover:text-purple-primary transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/shop" className="hover:text-purple-primary transition-colors">Shop</Link>
          <ChevronRight size={12} />
          <Link to={`/shop?category=${product.category}`} className="hover:text-purple-primary transition-colors">{product.category}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-900 font-medium truncate max-w-[100px] sm:max-w-none">{product.name}</span>
        </nav>

        {/* ═══ Main 2-Column Layout ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 lg:gap-20">

          {/* ── LEFT: Image Gallery ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col-reverse md:flex-row gap-4 items-center"
          >
            {/* Thumbnail Strip */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:max-h-[600px] pb-2 md:pb-0 scrollbar-hide items-center md:items-start w-full md:w-auto">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`flex-shrink-0 w-16 h-20 md:w-20 md:h-24 overflow-hidden rounded-xl transition-all duration-200 border-2 bg-gray-50 ${
                    activeImage === idx
                      ? 'border-purple-primary shadow-md opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMG; }}
                    className="w-full h-full object-cover object-center"
                  />
                </button>
              ))}
            </div>

            {/* Main Image with Zoom */}
            <div className="relative flex-1 w-full aspect-[3/4] overflow-hidden bg-gray-50 rounded-2xl shadow-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center text-gray-900 hover:text-purple-primary transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setActiveImage((prev) => (prev + 1) % gallery.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center text-gray-900 hover:text-purple-primary transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Badge */}
              {product.badge && (
                <span className={`absolute top-6 left-6 z-10 ${product.badge === 'Sale' ? 'bg-red-500' : 'bg-purple-primary'} text-white text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-lg shadow-lg`}>
                  {product.badge}
                </span>
              )}

              {/* Image Counter */}
              <span className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full">
                {activeImage + 1} / {gallery.length}
              </span>
            </div>
          </motion.div>

          {/* ── RIGHT: Product Info ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col space-y-8"
          >
            <div className="space-y-4">
              {/* Category */}
              <p className="text-purple-primary text-xs font-bold uppercase tracking-[0.2em]">
                {product.category}
              </p>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>

              {/* Star Ratings */}
              {product.rating && (
                <StarRating rating={product.rating} reviewCount={product.reviewCount} size="lg" />
              )}
            </div>

            {/* Price Block */}
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-gray-900">
                {CURRENCY}{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <div className="flex flex-col">
                  <span className="text-lg text-gray-400 line-through">
                    {CURRENCY}{product.originalPrice.toLocaleString()}
                  </span>
                  <span className="text-red-500 text-xs font-bold">
                    {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                  </span>
                </div>
              )}
            </div>

            <p className="text-gray-400 text-xs font-medium -mt-4">Inclusive of all taxes</p>

            {/* Product Highlights */}
            <div className="grid grid-cols-2 gap-6 py-8 border-y border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-light flex items-center justify-center shrink-0">
                  <Sparkles size={20} className="text-purple-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Fabric</p>
                  <p className="text-sm font-bold text-gray-900">{product.fabric?.material || 'Premium Silk'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-light flex items-center justify-center shrink-0">
                  <Scissors size={20} className="text-purple-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Care</p>
                  <p className="text-sm font-bold text-gray-900">{product.fabric?.care || 'Dry Clean Only'}</p>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <Truck size={20} className="text-purple-primary" />
                </div>
                <p className="text-sm font-bold text-gray-900">Delivery Details</p>
              </div>
              <p className="text-sm text-gray-600 pl-14">
                Expected by <span className="font-bold text-purple-primary">Wed, 22 Apr</span>
              </p>
            </div>

            {/* Policies */}
            <div className="flex flex-wrap gap-8">
              <div className="flex items-center gap-3">
                <RotateCcw size={18} className="text-purple-primary" />
                <span className="text-xs font-bold text-gray-600">7 Day Returns</span>
              </div>
              <div className="flex items-center gap-3">
                <Award size={18} className="text-purple-primary" />
                <span className="text-xs font-bold text-gray-600">100% Authentic</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4 pt-4">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Product Highlights</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-primary" />
                  <span>Handpicked designer piece for elegant look</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-primary" />
                  <span>Premium quality fabric with intricate detail</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-primary" />
                  <span>Perfect for weddings and festive occasions</span>
                </li>
              </ul>
              <p className="text-gray-500 text-sm leading-relaxed mt-4">
                {product.description || 'Exquisitely crafted with premium materials and meticulous attention to detail.'}
              </p>
            </div>

            {/* Cart Error Message */}
            {cartErrorLocal && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100"
              >
                <AlertCircle size={18} />
                <p className="text-sm font-bold">{cartErrorLocal}</p>
              </motion.div>
            )}

            {/* Stock Status */}
            <div className="pt-4">
              {!isInStock ? (
                <div className="flex items-center gap-3 bg-gray-100 text-gray-500 px-4 py-3 rounded-xl border border-gray-200">
                  <Ban size={18} />
                  <p className="text-sm font-bold">Sold Out — Notify me when available</p>
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-3 bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100">
                  <AlertCircle size={18} />
                  <p className="text-sm font-bold">Only {product.stockCount} left — Order fast!</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-purple-primary">
                  <div className="w-2 h-2 rounded-full bg-purple-primary animate-pulse" />
                  <p className="text-sm font-bold tracking-wide uppercase">In Stock</p>
                </div>
              )}
            </div>

            {/* Fabric & Care */}
            {product.fabric && (
              <FabricCareAccordion fabric={product.fabric} />
            )}

            {/* Desktop Actions */}
            <div className="hidden md:flex flex-col gap-4 pt-8 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`flex items-center rounded-xl border p-1 ${isInStock ? 'bg-gray-50 border-gray-100' : 'bg-gray-100 border-gray-200 opacity-50'}`}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!isInStock}
                    className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-purple-primary transition-colors disabled:cursor-not-allowed"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stockCount || 99, quantity + 1))}
                    disabled={!isInStock}
                    className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-purple-primary transition-colors disabled:cursor-not-allowed"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {isInStock ? (
                  <button
                    onClick={handleAddToCart}
                    className="btn-primary flex-1 gap-3 h-14"
                  >
                    <ShoppingBag size={20} />
                    {addedToCart ? 'Added to Bag!' : 'Add to Bag'}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowNotifyModal(true)}
                    className="flex-1 bg-gray-900 text-white h-14 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                  >
                    <Bell size={20} />
                    Notify Me
                  </button>
                )}
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-all ${
                    wishlisted
                      ? 'bg-purple-primary border-purple-primary text-white shadow-lg'
                      : 'bg-white border-gray-200 text-gray-400 hover:border-purple-primary'
                  }`}
                >
                  <Heart size={22} fill={wishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>
              {isInStock ? (
                <button
                  onClick={handleBuyNow}
                  className="btn-outline w-full h-14"
                >
                  Buy Now
                </button>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══ Mobile Sticky Action Bar ═══ */}
      <div className="fixed bottom-[72px] left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button
            onClick={() => toggleWishlist(product)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
              wishlisted
                ? 'bg-purple-primary border-purple-primary text-white'
                : 'bg-gray-50 border-gray-100 text-gray-400'
            }`}
          >
            <Heart size={20} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
          {isInStock ? (
            <button
              onClick={handleAddToCart}
              className="flex-1 btn-primary h-12 text-sm gap-2"
            >
              <ShoppingBag size={18} />
              {addedToCart ? 'Added!' : 'Add to Cart'}
            </button>
          ) : (
            <button
              onClick={() => setShowNotifyModal(true)}
              className="flex-1 bg-gray-900 text-white h-12 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Bell size={18} />
              Notify Me
            </button>
          )}
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
              <div className="bg-gradient-to-r from-purple-primary to-purple-secondary p-6 text-white">
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
                    <p className="font-inter text-sm text-purple-primary font-medium">{CURRENCY}{product.price.toLocaleString()}</p>
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
                          className="w-full border border-gray-200 rounded-lg pl-11 pr-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">
                        Email Address <span className="text-purple-primary font-black">*</span>
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          value={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full border border-gray-200 rounded-lg pl-11 pr-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors"
                          required
                        />
                      </div>
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
                      className="w-full bg-purple-primary text-white font-inter text-sm font-medium py-4 rounded-lg hover:bg-purple-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
