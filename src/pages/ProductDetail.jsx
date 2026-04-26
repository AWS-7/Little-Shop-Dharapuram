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
import { getProductById, getProductsByCategory, resolveImageUrl, PLACEHOLDER_IMG } from '../lib/products';
import { getActiveFlashSale } from '../lib/flashSales';
import ProductCard from '../components/home/ProductCard';
import ImageMagnifier from '../components/ImageMagnifier';
import { ProductDetailSkeleton } from '../components/ui/Skeleton';
import { createRestockRequest, checkProductRestockRequests } from '../lib/restock';

// Category-based fabric/material and care details
const CATEGORY_DETAILS = {
  'Sarees': {
    material: 'Premium Silk',
    care: 'Dry Clean Only',
    origin: 'Kanchipuram, India'
  },
  'Silk Sarees': {
    material: 'Pure Kanchipuram Silk',
    care: 'Dry Clean Only',
    origin: 'Kanchipuram, India'
  },
  'Cotton Sarees': {
    material: '100% Pure Cotton',
    care: 'Hand Wash Cold',
    origin: 'Coimbatore, India'
  },
  'Designer Sarees': {
    material: 'Premium Georgette/Chiffon',
    care: 'Dry Clean Recommended',
    origin: 'Mumbai, India'
  },
  'Bridal Sarees': {
    material: 'Pure Silk with Zari Work',
    care: 'Professional Dry Clean Only',
    origin: 'Kanchipuram, India'
  },
  'Jewellery': {
    material: '22k Gold Plated',
    care: 'Avoid Perfumes & Water',
    origin: 'Jaipur, India'
  },
  'Bangles': {
    material: '22k Gold Plated/Imitation',
    care: 'Keep away from moisture',
    origin: 'Hyderabad, India'
  },
  'Handbags': {
    material: 'Premium Vegan Leather',
    care: 'Wipe with damp cloth',
    origin: 'Delhi, India'
  },
  'Accessories': {
    material: 'Mixed Materials',
    care: 'Handle with care',
    origin: 'India'
  },
  'Kurtas': {
    material: 'Premium Cotton/Linen',
    care: 'Machine wash cold',
    origin: 'Lucknow, India'
  },
  'Lehengas': {
    material: 'Silk/Net with Embroidery',
    care: 'Dry Clean Only',
    origin: 'Delhi, India'
  },
  'Gowns': {
    material: 'Premium Georgette/Velvet',
    care: 'Dry Clean Only',
    origin: 'Mumbai, India'
  },
  'Co-ords': {
    material: 'Premium Cotton Blend',
    care: 'Machine wash cold',
    origin: 'Bangalore, India'
  },
  'Festive Sarees': {
    material: 'Silk Blend with Embellishments',
    care: 'Dry Clean Only',
    origin: 'Surat, India'
  }
};

// Get category details for a product
function getCategoryDetails(category) {
  // Try exact match first
  if (CATEGORY_DETAILS[category]) {
    return CATEGORY_DETAILS[category];
  }
  
  // Try partial match
  for (const [key, details] of Object.entries(CATEGORY_DETAILS)) {
    if (category?.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(category?.toLowerCase())) {
      return details;
    }
  }
  
  // Default fallback
  return {
    material: 'Premium Quality Material',
    care: 'Handle with care',
    origin: 'India'
  };
}

// Calculate delivery date (current date + 2 days)
function getDeliveryDate() {
  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + 2);
  
  // Format: 'Expected by Wed, 22 Apr'
  const options = { weekday: 'short', day: 'numeric', month: 'short' };
  return deliveryDate.toLocaleDateString('en-IN', options);
}

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

function FabricCareAccordion({ fabric, category }) {
  const [open, setOpen] = useState(false);
  
  // Get dynamic category details
  const categoryDetails = getCategoryDetails(category);

  const items = [
    { 
      icon: Sparkles, 
      label: ['Jewellery', 'Bangles', 'Handbags', 'Accessories'].includes(category) ? 'Material' : 'Fabric', 
      value: fabric?.material || categoryDetails.material 
    },
    { icon: Scissors, label: 'Care', value: fabric?.care || categoryDetails.care },
    { icon: MapPin, label: 'Origin', value: fabric?.origin || categoryDetails.origin },
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
    image2: resolveImageUrl(p.image2_url || p.image2),
    gallery: p.gallery || [
      resolveImageUrl(p.image_url || p.image),
      ...(p.image2_url || p.image2 ? [resolveImageUrl(p.image2_url || p.image2)] : [])
    ].filter(Boolean),
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
  const [cartErrorLocal, setCartErrorLocal] = useState('');  // MOVED: must be before early returns
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [flashSale, setFlashSale] = useState(null);

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

  // Fetch related products from same category
  useEffect(() => {
    if (product?.category && product?.id) {
      getProductsByCategory(product.category, product.id, 4).then(({ data }) => {
        setRelatedProducts(data || []);
      });
    }
  }, [product?.category, product?.id]);

  // Fetch active flash sale for this product
  useEffect(() => {
    if (product?.id) {
      getActiveFlashSale().then(({ data }) => {
        if (data && data.product_id === product.id) {
          setFlashSale(data);
        } else {
          setFlashSale(null);
        }
      });
    }
  }, [product?.category, product?.id]);

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
  // Build gallery from image1, image2, and existing gallery
  const gallery = product.gallery || [
    product.image,
    ...(product.image2 ? [product.image2] : [])
  ].filter(Boolean);
  const related = PLACEHOLDER_PRODUCTS.filter((p) => p.id !== id && p.category === product.category).slice(0, 5);
  const completeTheLook = related.length < 2
    ? PLACEHOLDER_PRODUCTS.filter((p) => p.id !== id).slice(0, 5)
    : related;

  // cartErrorLocal useState moved to top (line 135) - must be before early returns

  const handleAddToCart = () => {
    clearCartError();
    setCartErrorLocal('');
    // Use flash sale price if available
    const productWithFlashPrice = flashSale 
      ? { ...product, price: flashSale.discounted_price, originalPrice: flashSale.original_price, isFlashSale: true }
      : product;
    const result = addToCart(productWithFlashPrice, quantity);
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
      <div className="container-clean mt-10 pt-4 md:pt-6 pb-32 md:pb-24">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">

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
            className="flex flex-col space-y-4"
          >
            <div className="space-y-2">
              {/* Category */}
              <p className="text-purple-primary text-xs font-bold uppercase tracking-[0.2em]">
                {product.category}
              </p>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>

              {/* Star Ratings - Only show if rating > 0 */}
              {Number(product.rating) > 0 && Number(product.reviewCount) > 0 && (
                <StarRating rating={Number(product.rating)} reviewCount={Number(product.reviewCount)} size="lg" />
              )}
            </div>

            {/* Price Block - Shows Flash Sale Price if Active */}
            <div className="flex items-center gap-4">
              {flashSale ? (
                <>
                  <span className="text-4xl font-bold text-red-600">
                    {CURRENCY}{flashSale.discounted_price?.toLocaleString()}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-lg text-gray-400 line-through">
                      {CURRENCY}{flashSale.original_price?.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 text-xs font-bold">
                        {Math.round((1 - flashSale.discounted_price / flashSale.original_price) * 100)}% OFF
                      </span>
                      <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        FLASH SALE
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

            <p className="text-gray-400 text-xs font-medium">Inclusive of all taxes</p>

            {/* Product Highlights - Dynamic based on category */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-light flex items-center justify-center shrink-0">
                  <Sparkles size={20} className="text-purple-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {['Jewellery', 'Bangles', 'Handbags', 'Accessories'].includes(product.category) ? 'Material' : 'Fabric'}
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {product.fabric?.material || getCategoryDetails(product.category).material}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-light flex items-center justify-center shrink-0">
                  <Scissors size={20} className="text-purple-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Care</p>
                  <p className="text-sm font-bold text-gray-900">
                    {product.fabric?.care || getCategoryDetails(product.category).care}
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Info - Dynamic Date */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <Truck size={20} className="text-purple-primary" />
                </div>
                <p className="text-sm font-bold text-gray-900">Delivery Details</p>
              </div>
              <p className="text-sm text-gray-600 pl-14">
                Expected by <span className="font-bold text-purple-primary">{getDeliveryDate()}</span>
              </p>
            </div>

            {/* Policies */}
            <div className="flex flex-wrap gap-8">
              <div className="flex items-center gap-3">
                <Ban size={18} className="text-purple-primary" />
                <span className="text-xs font-bold text-gray-600">No Returns</span>
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
            <FabricCareAccordion fabric={product.fabric} category={product.category} />

            {/* Desktop Actions - Modern MNC Style */}
            <div className="hidden md:flex flex-col gap-3 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3">
                {/* Quantity Selector */}
                <div className={`flex items-center rounded-lg border ${isInStock ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-200 opacity-50'}`}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!isInStock}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors disabled:cursor-not-allowed"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-semibold text-gray-900 text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stockCount || 99, quantity + 1))}
                    disabled={!isInStock}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Add to Cart / Notify Me */}
                {isInStock ? (
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-[#f2a20c] text-white h-11 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#d9910a] transition-all shadow-sm"
                  >
                    <ShoppingBag size={18} />
                    {addedToCart ? 'Added!' : 'Add to Cart'}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowNotifyModal(true)}
                    className="flex-1 bg-gray-800 text-white h-11 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-900 transition-all"
                  >
                    <Bell size={18} />
                    Notify Me
                  </button>
                )}

                {/* Wishlist */}
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`w-11 h-11 rounded-lg flex items-center justify-center border transition-all ${
                    wishlisted
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : 'bg-white border-gray-200 text-gray-400 hover:border-rose-400'
                  }`}
                >
                  <Heart size={20} fill={wishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Buy Now Button */}
              {isInStock && (
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-gray-900 text-white h-11 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-all"
                >
                  Buy Now
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══ Mobile Sticky Action Bar - Modern MNC Style ═══ */}
      <div className="fixed bottom-[72px] left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 px-4 py-2 shadow-lg">
        <div className="flex gap-2 max-w-lg mx-auto">
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
              className="flex-1 bg-[#f2a20c] text-white h-12 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#d9910a] transition-all"
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
                    <p className="font-inter text-sm text-purple-primary font-medium">
                      {flashSale 
                        ? <span className="text-red-600">{CURRENCY}{flashSale.discounted_price?.toLocaleString()}</span>
                        : `${CURRENCY}${product.price.toLocaleString()}`
                      }
                    </p>
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

        {/* Related Products - Same Category */}
        {relatedProducts.length > 0 && (
          <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gray-200" />
                <h2 className="text-xl font-bold text-gray-900 text-center">
                  More {product?.category || 'Products'}
                </h2>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((item, idx) => (
                  <ProductCard 
                    key={item.id} 
                    product={item} 
                    index={idx}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </AnimatePresence>
    </>
  );
}
