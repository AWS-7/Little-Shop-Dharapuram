import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Megaphone,
  Plus, Edit3, Trash2, Eye, TrendingUp, IndianRupee, Clock,
  Truck, CheckCircle, LogOut, ChevronDown, Timer, Bell, Search,
  AlertCircle, BarChart3, Boxes, Image, Send, Mail, FileText,
  MapPin, CheckSquare, Percent, Download, X, RefreshCw, Upload,
  Grid3X3, RotateCcw, Zap, Calendar, Sparkles, Star, Quote, User, Ticket,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PLACEHOLDER_PRODUCTS, CURRENCY, ORDER_STATUSES, ADMIN_EMAIL } from '../../lib/constants';
import { getAllOrders, updateOrderStatus, subscribeToOrders } from '../../lib/orders';
import { getAbandonedCarts, markReminderSent, sendAbandonedCartReminder, subscribeToCarts } from '../../lib/carts';
import { logoutAdmin, getAdminSession, getSessionTimeRemaining, isSessionExpiringSoon, isAdminAuthenticated } from '../../lib/adminAuth';
import {
  PRODUCT_CATEGORIES, FIELD_LABELS, uploadProductImage, createProduct,
  getAllProductsAdmin, updateProduct, deleteProduct, resolveImageUrl,
  getAllCategories, createCategory, updateCategory, deleteCategory, uploadCategoryImage
} from '../../lib/products';
import { generateProductDescription } from '../../lib/ai';
import { getAggregatedRestockRequests, markRequestsAsNotified, notifyRestockCustomers } from '../../lib/restock';
import { startOrderNotifications, stopOrderNotifications, notifyNewOrder, requestNotificationPermission, showLocalNotification } from '../../lib/notifications';
import {
  getActiveFlashSale,
  getAllFlashSales,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  toggleFlashSale,
  subscribeToFlashSales
} from '../../lib/flashSales';
import {
  getAllHeroBanners,
  createHeroBanner,
  updateHeroBanner,
  deleteHeroBanner,
  toggleHeroBanner,
  uploadHeroBannerImage
} from '../../lib/heroBanners';
import {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonialStatus,
  uploadTestimonialAvatar
} from '../../lib/testimonials';
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus
} from '../../lib/coupons';
import BulkImportModal from '../../components/admin/BulkImportModal';

// Session Timer Component
function SessionTimer() {
  const [timeRemaining, setTimeRemaining] = useState(getSessionTimeRemaining());
  const [expiringSoon, setExpiringSoon] = useState(isSessionExpiringSoon());
  
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getSessionTimeRemaining();
      setTimeRemaining(remaining);
      setExpiringSoon(isSessionExpiringSoon());
      
      // Auto logout if expired
      if (remaining <= 0) {
        logoutAdmin();
        window.location.href = '/admin/login?expired=true';
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  const formatTime = (minutes) => {
    if (minutes <= 0) return 'Expired';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
      expiringSoon 
        ? 'bg-red-100 text-red-700 border border-red-200' 
        : 'bg-purple-primary/10 text-purple-primary border border-purple-primary/20'
    }`}>
      <Clock size={14} />
      <span>Session: {formatTime(timeRemaining)}</span>
    </div>
  );
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'inventory', label: 'Inventory', icon: Boxes },
  { key: 'restock', label: 'Restock', icon: RotateCcw },
  { key: 'flashsale', label: 'Flash Sale', icon: Zap },
  { key: 'hero-banners', label: 'Hero Banners', icon: Image },
  { key: 'testimonials', label: 'Testimonials', icon: Star },
  { key: 'coupons', label: 'Coupons', icon: Ticket },
  { key: 'top-categories', label: 'Top Categories', icon: Grid3X3 },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'notifications', label: 'Alerts', icon: Bell },
  { key: 'banners', label: 'Banners', icon: Image },
  { key: 'marketing', label: 'Marketing', icon: Megaphone },
];

const demoOrders = [
  { id: 'LS-A3K7YM2P', customer: 'Priya Sharma', email: 'priya@example.com', total: 5300, status: 'Ordered', date: '2025-04-12', items: 2 },
  { id: 'LS-BF9HNWQ4', customer: 'Anita Verma', email: 'anita@example.com', total: 8500, status: 'Shipped', date: '2025-04-11', items: 1 },
  { id: 'LS-CK2DTPE6', customer: 'Meera Iyer', email: 'meera@example.com', total: 2800, status: 'Delivered', date: '2025-04-10', items: 3 },
  { id: 'LS-DM5XRLJ8', customer: 'Kavya Nair', email: 'kavya@example.com', total: 1800, status: 'Packed', date: '2025-04-13', items: 1 },
];


// Flash Sale Countdown Component
function FlashSaleCountdown({ endTime }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeRemaining(endTime));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(endTime);
      setTimeLeft(remaining);
      if (!remaining) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (!timeLeft) {
    return <span className="font-inter text-sm text-rose-400">Expired</span>;
  }

  const { hours, minutes, seconds } = timeLeft;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <div className="bg-white/20 rounded px-2 py-1 min-w-[40px] text-center">
          <span className="font-playfair text-xl font-bold">{String(hours).padStart(2, '0')}</span>
        </div>
        <span className="text-white/60">:</span>
        <div className="bg-white/20 rounded px-2 py-1 min-w-[40px] text-center">
          <span className="font-playfair text-xl font-bold">{String(minutes).padStart(2, '0')}</span>
        </div>
        <span className="text-white/60">:</span>
        <div className="bg-white/20 rounded px-2 py-1 min-w-[40px] text-center">
          <span className="font-playfair text-xl font-bold">{String(seconds).padStart(2, '0')}</span>
        </div>
      </div>
      <span className="font-inter text-xs text-white/60 ml-2">remaining</span>
    </div>
  );
}

// Helper function to calculate time remaining
function calculateTimeRemaining(endTime) {
  const end = new Date(endTime).getTime();
  const now = new Date().getTime();
  const diff = end - now;

  if (diff <= 0) return null;

  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    totalMilliseconds: diff
  };
}

export default function AdminDashboard() {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState(demoOrders);
  const [products, setProducts] = useState(PLACEHOLDER_PRODUCTS);
  const [flashSale, setFlashSale] = useState({ active: false, endsAt: '', discount: '' });
  const [salesPopup, setSalesPopup] = useState({ active: false, city: 'Chennai', product: 'Silk Organza Saree' });
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [bannerSettings, setBannerSettings] = useState({
    heroImage: '',
    heroTitle: 'Timeless Elegance',
    heroSubtitle: 'Handcrafted luxury sarees for the modern woman',
    flashText: '',
  });
  const [reminderSending, setReminderSending] = useState({});

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Bulk order selection for invoices
  const [selectedOrders, setSelectedOrders] = useState([]);

  // Bulk actions state
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkDiscount, setBulkDiscount] = useState(0);
  const [bulkStockUpdate, setBulkStockUpdate] = useState(0);
  const [bulkActionMode, setBulkActionMode] = useState(null); // 'discount' | 'stock' | null

  // Add Product Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    originalPrice: '',
    category: '',
    stockCount: '',
    badge: '',
    image: '',
    description: '',
    // Category-specific fields
    fabric: '',
    weaveType: '',
    care: '',
    origin: '',
    fit: '',
    material: '',
    gemstone: '',
    weight: '',
  });

  // AI Description generation
  const handleGenerateDescription = async () => {
    if (!newProduct.name || !newProduct.category) {
      showToast('Please enter Product Name and select a Category to generate description.', 'error');
      return;
    }
    setSaving(true); // Use saving state to indicate AI generation
    const generatedDescription = await generateProductDescription(newProduct.name, newProduct.category);
    setNewProduct(prev => ({ ...prev, description: generatedDescription }));
    setSaving(false);
    showToast('Description generated by AI!', 'success');
  };

  // Order Detail state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  // Edit Product Modal state
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Delete confirmation state
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Inventory edit state
  const [inventoryEdits, setInventoryEdits] = useState({});
  const [savingInventory, setSavingInventory] = useState(false);

  // Search states
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Restock requests state
  const [restockRequests, setRestockRequests] = useState([]);
  const [restockLoading, setRestockLoading] = useState(false);
  const [notifyingProduct, setNotifyingProduct] = useState(null);

  // Flash sale state
  const [flashSales, setFlashSales] = useState([]);
  const [flashSaleLoading, setFlashSaleLoading] = useState(false);
  const [activeFlashSale, setActiveFlashSale] = useState(null);
  const [flashSaleForm, setFlashSaleForm] = useState({
    isActive: false,
    productId: '',
    discountedPrice: '',
    endTime: '',
    bannerText: 'Flash Sale! Limited Time Offer'
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [savingFlashSale, setSavingFlashSale] = useState(false);

  // Hero banners state
  const [heroBanners, setHeroBanners] = useState([]);
  const [heroBannerLoading, setHeroBannerLoading] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    image: '',
    title: '',
    subtitle: '',
    cta: 'Shop Now',
    link: '/shop',
    color: 'bg-purple-primary',
    sortOrder: 0,
    isActive: true
  });
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState(null);
  const [uploadingBannerImage, setUploadingBannerImage] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);

  // Testimonials state
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    location: '',
    avatar: '',
    rating: 5,
    title: '',
    review: '',
    product: '',
    is_active: true,
    sort_order: 0,
    verified: true
  });
  const [testimonialAvatarFile, setTestimonialAvatarFile] = useState(null);
  const [testimonialAvatarPreview, setTestimonialAvatarPreview] = useState(null);
  const [uploadingTestimonialAvatar, setUploadingTestimonialAvatar] = useState(false);
  const [savingTestimonial, setSavingTestimonial] = useState(false);

  // Coupons management state
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_percent: 10,
    usage_limit: 100,
    expiry_date: '',
    is_active: true
  });
  const [savingCoupon, setSavingCoupon] = useState(false);

  // Categories management state
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', image: '', displayOrder: 0 });
  const [catImageFile, setCatImageFile] = useState(null);
  const [catImagePreview, setCatImagePreview] = useState(null);

  // Sound notification ref
  const audioRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Notification permission state
  const [notifPermission, setNotifPermission] = useState({ granted: false, error: null });
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Map raw Supabase order to dashboard format
  const mapOrder = (o) => ({
    id: o.order_id || o.id,
    customer: o.customer?.name || 'Unknown',
    email: o.customer?.email || '',
    total: o.total || 0,
    status: o.status || 'confirmed',
    date: o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '',
    items: o.items?.length || 0,
    user_id: o.user_id || null,
    _raw: o,
  });

  // Reusable fetch function
  const fetchOrders = useCallback(async () => {
    const { data, error } = await getAllOrders();
    console.log('Fetched orders:', data?.length || 0, error ? `Error: ${error.message}` : 'OK');
    if (error) {
      console.error('Failed to fetch orders:', error);
      return;
    }
    // Always update orders state (even if empty)
    setOrders(data ? data.map(mapOrder) : []);
  }, []);

  // Manual refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    const { data } = await getAbandonedCarts();
    setAbandonedCarts(data || []);
    // Refresh products too (getAllProductsAdmin already maps image_url to image)
    const { data: productsData } = await getAllProductsAdmin();
    if (productsData && productsData.length > 0) {
      setProducts(productsData);
    }
    // Refresh restock requests
    await fetchRestockRequests();
    setRefreshing(false);
  };

  // Fetch restock requests
  const fetchRestockRequests = async () => {
    setRestockLoading(true);
    const { data, error } = await getAggregatedRestockRequests();
    if (!error && data) {
      setRestockRequests(data);
    }
    setRestockLoading(false);
  };

  // Handle notify all customers for a product
  const handleNotifyRestock = async (productId) => {
    setNotifyingProduct(productId);
    const { data, error } = await markRequestsAsNotified(productId);
    if (!error) {
      showToast(`Notified ${data?.length || 0} customers about restock!`);
      await fetchRestockRequests();
    } else {
      showToast('Failed to notify customers', 'error');
    }
    setNotifyingProduct(null);
  };

  // Fetch flash sales
  const fetchFlashSales = async () => {
    setFlashSaleLoading(true);
    const { data: allSales } = await getAllFlashSales();
    const { data: activeSale } = await getActiveFlashSale();
    setFlashSales(allSales || []);
    setActiveFlashSale(activeSale);
    if (activeSale) {
      setFlashSaleForm({
        isActive: activeSale.is_active,
        productId: activeSale.product_id,
        discountedPrice: activeSale.discounted_price,
        endTime: new Date(activeSale.end_time).toISOString().slice(0, 16),
        bannerText: activeSale.banner_text
      });
    }
    setFlashSaleLoading(false);
  };

  // Handle flash sale form submit
  const handleFlashSaleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !flashSaleForm.discountedPrice || !flashSaleForm.endTime) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    
    // Debug logging
    console.log('🔥 Creating Flash Sale with product:', {
      id: selectedProduct.id,
      name: selectedProduct.name,
      image: selectedProduct.image,
      price: selectedProduct.price
    });
    
    setSavingFlashSale(true);
    const { data, error } = await createFlashSale({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productImage: selectedProduct.image,
      originalPrice: selectedProduct.price,
      discountedPrice: parseInt(flashSaleForm.discountedPrice),
      endTime: new Date(flashSaleForm.endTime).toISOString(),
      bannerText: flashSaleForm.bannerText
    });
    if (!error && data) {
      showToast('Flash sale created successfully!');
      await fetchFlashSales();
    } else {
      showToast('Failed to create flash sale', 'error');
    }
    setSavingFlashSale(false);
  };

  // Handle toggle flash sale
  const handleToggleFlashSale = async (saleId, currentStatus) => {
    const { data, error } = await toggleFlashSale(saleId, !currentStatus);
    if (!error) {
      showToast(`Flash sale ${!currentStatus ? 'activated' : 'deactivated'}!`);
      await fetchFlashSales();
    }
  };

  // Handle delete flash sale
  const handleDeleteFlashSale = async (saleId) => {
    if (!confirm('Delete this flash sale?')) return;
    const { success, error } = await deleteFlashSale(saleId);
    if (success) {
      showToast('Flash sale deleted');
      await fetchFlashSales();
    } else {
      showToast('Failed to delete flash sale', 'error');
    }
  };

  // Hero Banner handlers
  const fetchHeroBanners = async () => {
    setHeroBannerLoading(true);
    const { data, error } = await getAllHeroBanners();
    if (!error && data) {
      setHeroBanners(data);
    }
    setHeroBannerLoading(false);
  };

  const handleBannerImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerImageFile(file);
      setBannerImagePreview(URL.createObjectURL(file));
      // Auto-upload when file selected
      handleUploadBannerImage(file);
    }
  };

  const handleUploadBannerImage = async (file) => {
    if (!file) return;
    setUploadingBannerImage(true);
    const { url, error } = await uploadHeroBannerImage(file);
    if (url) {
      setBannerForm(prev => ({ ...prev, image: url }));
      showToast('Image uploaded successfully!', 'success');
    } else {
      showToast(`Upload failed: ${error?.message || 'Unknown error'}`, 'error');
    }
    setUploadingBannerImage(false);
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (!bannerForm.title || !bannerForm.image) {
      showToast('Please fill title and image URL', 'error');
      return;
    }
    
    setSavingBanner(true);
    
    if (editingBanner) {
      const { data, error } = await updateHeroBanner(editingBanner.id, {
        ...bannerForm,
        sort_order: parseInt(bannerForm.sortOrder) || 0
      });
      if (!error) {
        showToast('Banner updated!');
        await fetchHeroBanners();
        setShowBannerModal(false);
        resetBannerForm();
      } else {
        showToast('Failed to update banner', 'error');
      }
    } else {
      const { data, error } = await createHeroBanner({
        image: bannerForm.image,
        title: bannerForm.title,
        subtitle: bannerForm.subtitle,
        cta: bannerForm.cta,
        link: bannerForm.link,
        color: bannerForm.color,
        sortOrder: parseInt(bannerForm.sortOrder) || 0,
        isActive: bannerForm.isActive
      });
      if (!error && data) {
        showToast('Banner created!');
        await fetchHeroBanners();
        setShowBannerModal(false);
        resetBannerForm();
      } else {
        showToast('Failed to create banner', 'error');
      }
    }
    setSavingBanner(false);
  };

  const resetBannerForm = () => {
    setEditingBanner(null);
    setBannerForm({
      image: '',
      title: '',
      subtitle: '',
      cta: 'Shop Now',
      link: '/shop',
      color: 'bg-purple-primary',
      sortOrder: 0,
      isActive: true
    });
    setBannerImageFile(null);
    setBannerImagePreview(null);
    setUploadingBannerImage(false);
  };

  const handleEditBanner = (banner) => {
    setEditingBanner(banner);
    setBannerForm({
      image: banner.image || '',
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      cta: banner.cta || 'Shop Now',
      link: banner.link || '/shop',
      color: banner.color || 'bg-purple-primary',
      sortOrder: banner.sort_order || 0,
      isActive: banner.is_active !== false
    });
    setShowBannerModal(true);
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!confirm('Delete this banner?')) return;
    const { success, error } = await deleteHeroBanner(bannerId);
    if (success) {
      showToast('Banner deleted');
      await fetchHeroBanners();
    } else {
      showToast('Failed to delete banner', 'error');
    }
  };

  const handleToggleBanner = async (bannerId, currentStatus) => {
    const { data, error } = await toggleHeroBanner(bannerId, !currentStatus);
    if (!error) {
      showToast(`Banner ${!currentStatus ? 'activated' : 'deactivated'}!`);
      await fetchHeroBanners();
    }
  };

  // Testimonials handlers
  const fetchTestimonials = async () => {
    setTestimonialsLoading(true);
    const { data, error } = await getAllTestimonials();
    if (!error && data) {
      setTestimonials(data);
    }
    setTestimonialsLoading(false);
  };

  const handleTestimonialAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTestimonialAvatarFile(file);
      setTestimonialAvatarPreview(URL.createObjectURL(file));
      handleUploadTestimonialAvatarImage(file);
    }
  };

  const handleUploadTestimonialAvatarImage = async (file) => {
    if (!file) return;
    setUploadingTestimonialAvatar(true);
    const { url, error } = await uploadTestimonialAvatar(file, editingTestimonial?.id || 'new');
    if (url) {
      setTestimonialForm(prev => ({ ...prev, avatar: url }));
      showToast('Avatar uploaded successfully!', 'success');
    } else {
      showToast(`Upload failed: ${error?.message || 'Unknown error'}`, 'error');
    }
    setUploadingTestimonialAvatar(false);
  };

  const handleSaveTestimonial = async (e) => {
    e.preventDefault();
    if (!testimonialForm.name || !testimonialForm.review || !testimonialForm.title) {
      showToast('Please fill name, title and review', 'error');
      return;
    }
    
    setSavingTestimonial(true);
    
    if (editingTestimonial) {
      const { data, error } = await updateTestimonial(editingTestimonial.id, {
        name: testimonialForm.name,
        location: testimonialForm.location,
        avatar: testimonialForm.avatar,
        rating: parseInt(testimonialForm.rating) || 5,
        title: testimonialForm.title,
        review: testimonialForm.review,
        product: testimonialForm.product,
        is_active: testimonialForm.is_active,
        sort_order: parseInt(testimonialForm.sort_order) || 0,
        verified: testimonialForm.verified
      });
      if (!error) {
        showToast('Testimonial updated!');
        await fetchTestimonials();
        setShowTestimonialModal(false);
        resetTestimonialForm();
      } else {
        showToast('Failed to update testimonial', 'error');
      }
    } else {
      const { data, error } = await createTestimonial({
        name: testimonialForm.name,
        location: testimonialForm.location,
        avatar: testimonialForm.avatar,
        rating: parseInt(testimonialForm.rating) || 5,
        title: testimonialForm.title,
        review: testimonialForm.review,
        product: testimonialForm.product,
        is_active: testimonialForm.is_active,
        sort_order: parseInt(testimonialForm.sort_order) || 0,
        verified: testimonialForm.verified
      });
      if (!error && data) {
        showToast('Testimonial created!');
        await fetchTestimonials();
        setShowTestimonialModal(false);
        resetTestimonialForm();
      } else {
        showToast('Failed to create testimonial', 'error');
      }
    }
    setSavingTestimonial(false);
  };

  const resetTestimonialForm = () => {
    setEditingTestimonial(null);
    setTestimonialForm({
      name: '',
      location: '',
      avatar: '',
      rating: 5,
      title: '',
      review: '',
      product: '',
      is_active: true,
      sort_order: 0,
      verified: true
    });
    setTestimonialAvatarFile(null);
    setTestimonialAvatarPreview(null);
    setUploadingTestimonialAvatar(false);
  };

  const handleEditTestimonial = (testimonial) => {
    setEditingTestimonial(testimonial);
    setTestimonialForm({
      name: testimonial.name || '',
      location: testimonial.location || '',
      avatar: testimonial.avatar || '',
      rating: testimonial.rating || 5,
      title: testimonial.title || '',
      review: testimonial.review || '',
      product: testimonial.product || '',
      is_active: testimonial.is_active !== false,
      sort_order: testimonial.sort_order || 0,
      verified: testimonial.verified !== false
    });
    setShowTestimonialModal(true);
  };

  const handleDeleteTestimonial = async (testimonialId) => {
    if (!confirm('Delete this testimonial?')) return;
    const { error } = await deleteTestimonial(testimonialId);
    if (!error) {
      showToast('Testimonial deleted');
      await fetchTestimonials();
    } else {
      showToast('Failed to delete testimonial', 'error');
    }
  };

  const handleToggleTestimonial = async (testimonialId, currentStatus) => {
    const { data, error } = await toggleTestimonialStatus(testimonialId, !currentStatus);
    if (!error) {
      showToast(`Testimonial ${!currentStatus ? 'activated' : 'deactivated'}!`);
      await fetchTestimonials();
    }
  };

  // Coupons handlers
  const fetchCoupons = async () => {
    setCouponsLoading(true);
    const { data, error } = await getAllCoupons();
    if (!error && data) {
      setCoupons(data);
    }
    setCouponsLoading(false);
  };

  const resetCouponForm = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: '',
      discount_percent: 10,
      usage_limit: 100,
      expiry_date: '',
      is_active: true
    });
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!couponForm.code.trim()) {
      showToast('Please enter a coupon code', 'error');
      return;
    }
    if (couponForm.discount_percent < 1 || couponForm.discount_percent > 100) {
      showToast('Discount must be between 1 and 100', 'error');
      return;
    }
    if (couponForm.usage_limit < 1) {
      showToast('Usage limit must be at least 1', 'error');
      return;
    }
    if (!couponForm.expiry_date) {
      showToast('Please select an expiry date', 'error');
      return;
    }
    
    // Check if expiry is in future
    const expiryDate = new Date(couponForm.expiry_date);
    if (expiryDate <= new Date()) {
      showToast('Expiry date must be in the future', 'error');
      return;
    }

    setSavingCoupon(true);

    if (editingCoupon) {
      const { error } = await updateCoupon(editingCoupon.id, {
        code: couponForm.code.toUpperCase(),
        discount_percent: parseInt(couponForm.discount_percent),
        usage_limit: parseInt(couponForm.usage_limit),
        expiry_date: couponForm.expiry_date,
        is_active: couponForm.is_active
      });
      if (!error) {
        showToast('Coupon updated successfully!');
        await fetchCoupons();
        setShowCouponModal(false);
        resetCouponForm();
      } else {
        showToast('Failed to update coupon', 'error');
      }
    } else {
      const { data, error } = await createCoupon({
        code: couponForm.code.toUpperCase(),
        discount_percent: parseInt(couponForm.discount_percent),
        usage_limit: parseInt(couponForm.usage_limit),
        expiry_date: couponForm.expiry_date,
        is_active: couponForm.is_active
      });
      if (!error && data) {
        showToast('Coupon created successfully!');
        await fetchCoupons();
        setShowCouponModal(false);
        resetCouponForm();
      } else {
        showToast('Failed to create coupon. Code might already exist.', 'error');
      }
    }
    setSavingCoupon(false);
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    const { success, error } = await deleteCoupon(couponId);
    if (success) {
      showToast('Coupon deleted');
      await fetchCoupons();
    } else {
      showToast('Failed to delete coupon', 'error');
    }
  };

  const handleToggleCoupon = async (couponId, currentStatus) => {
    const { data, error } = await toggleCouponStatus(couponId, !currentStatus);
    if (!error) {
      showToast(`Coupon ${!currentStatus ? 'activated' : 'deactivated'}!`);
      await fetchCoupons();
    }
  };

  // Play notification sound (Web Audio API)
  const playNotificationSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      // Two-tone chime: C5 → E5
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // Silent fail — browser may block audio before interaction
    }
  }, []);

  // Fetch orders from Supabase + realtime subscription
  useEffect(() => {
    fetchOrders();

    // Realtime: listen for INSERT and UPDATE on orders table
    const channel = subscribeToOrders((payload) => {
      console.log('Realtime order event:', payload.eventType, payload.new?.order_id);
      if (payload.eventType === 'INSERT' && payload.new) {
        setOrders((prev) => {
          // Prevent duplicates
          const exists = prev.some((o) => o.id === (payload.new.order_id || payload.new.id));
          if (exists) return prev;
          return [mapOrder(payload.new), ...prev];
        });
        playNotificationSound();
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const o = payload.new;
        setOrders((prev) => prev.map((order) =>
          order.id === (o.order_id || o.id) ? { ...order, status: o.status, _raw: o } : order
        ));
      }
    });

    // Fallback: Refresh orders every 30 seconds
    const interval = setInterval(() => {
      console.log('Auto-refreshing orders...');
      fetchOrders();
    }, 30000);

    // Refresh when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab visible - refreshing orders');
        fetchOrders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchOrders, playNotificationSound]);

  // Start order push notifications for admin
  useEffect(() => {
    // Check and request permission on mount
    const initNotifications = async () => {
      const result = await requestNotificationPermission();
      setNotifPermission(result);
      console.log('Notification permission result:', result);
    };
    
    // Small delay to ensure page is loaded
    setTimeout(initNotifications, 1000);

    const notifSubscription = startOrderNotifications(
      async (newOrder) => {
        console.log('New order notification:', newOrder);
        // Also send email notification
        await notifyNewOrder(newOrder);
        // Refresh orders list
        fetchOrders();
      },
      (error) => console.error('Notification error:', error)
    );
    
    return () => stopOrderNotifications();
  }, [fetchOrders]);
  
  // Manual request notification permission
  const handleRequestNotification = async () => {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
    
    if (result.granted) {
      showToast('✅ Notifications enabled! You will receive order alerts.', 'success');
      // Send test notification
      setTimeout(() => {
        showLocalNotification('🔔 Test Notification', {
          body: 'Notifications are working! You will receive order alerts.',
          data: { url: '/admin/dashboard' }
        });
      }, 500);
    } else {
      showToast(`❌ ${result.error || 'Permission denied'}`, 'error');
    }
  };

  // Fetch abandoned carts with realtime subscription
  useEffect(() => {
    const fetchAbandoned = async () => {
      const { data } = await getAbandonedCarts();
      setAbandonedCarts(data);
    };
    fetchAbandoned();

    // Real-time subscription for cart changes
    const cartSubscription = subscribeToCarts((payload) => {
      console.log('Cart change detected:', payload);
      // Refresh abandoned carts list when carts are updated
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        fetchAbandoned();
      }
    });

    // Poll every 60s as backup
    const interval = setInterval(fetchAbandoned, 60_000);

    return () => {
      clearInterval(interval);
      if (cartSubscription) {
        cartSubscription.unsubscribe();
      }
    };
  }, []);

  // Load flash sale from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('flashSale');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFlashSale(parsed);
      } catch (e) {
        console.error('Failed to parse flash sale from localStorage');
      }
    }
  }, []);

  // Fetch restock requests on mount
  useEffect(() => {
    fetchRestockRequests();
  }, []);

  // Fetch flash sales on mount
  useEffect(() => {
    fetchFlashSales();
    // Subscribe to real-time flash sale updates
    const channel = subscribeToFlashSales((payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
        fetchFlashSales();
      }
    });
    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Fetch hero banners on mount
  useEffect(() => {
    fetchHeroBanners();
  }, []);

  // Fetch testimonials on mount
  useEffect(() => {
    fetchTestimonials();
  }, []);

  // Fetch coupons on mount
  useEffect(() => {
    fetchCoupons();
  }, []);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      const { data: productsData } = await getAllProductsAdmin();
      if (productsData && productsData.length > 0) {
        setProducts(productsData);
      }
    };
    fetchProducts();
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      setLoadingCategories(true);
      const { data } = await getAllCategories();
      if (data) setCategories(data);
      setLoadingCategories(false);
    };
    fetchCats();
  }, []);

  const handleSendReminder = async (cart) => {
    setReminderSending((prev) => ({ ...prev, [cart.id]: true }));
    
    // Send email reminder via Resend
    const emailResult = await sendAbandonedCartReminder(cart);
    
    if (emailResult.success) {
      // Mark as sent in database
      await markReminderSent(cart.id);
      setAbandonedCarts((prev) => prev.map((c) => c.id === cart.id ? { ...c, reminder_sent: true } : c));
      showToast('Reminder sent successfully!', 'success');
    } else {
      showToast('Failed to send reminder: ' + emailResult.error, 'error');
    }
    
    setReminderSending((prev) => ({ ...prev, [cart.id]: false }));
  };

  const handleStatusChange = async (orderId, newStatus) => {
    // Optimistic update
    const prevOrders = [...orders];
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    const { error } = await updateOrderStatus(orderId, newStatus);
    if (error) {
      // Revert on failure
      setOrders(prevOrders);
      alert(`Status update failed: ${error.message || 'Unknown error'}\n\nCheck if the orders table has a "status" column (not "order_status") and that RLS allows UPDATE.`);
    }
  };

  const handleLogout = async () => {
    logoutAdmin();
    window.location.href = '/admin/login';
  };

  // Add Product handlers
  const handleAddProduct = () => {
    setShowProductModal(true);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const getCategoryFields = () => {
    const cat = PRODUCT_CATEGORIES.find((c) => c.value === newProduct.category);
    return cat?.fields || [];
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      alert('Please fill in Product Name, Price, and Category.');
      return;
    }

    setSaving(true);
    let imageUrl = newProduct.image;

    // Upload image to Supabase Storage if file selected
    if (imageFile) {
      const { url, error: uploadErr } = await uploadProductImage(imageFile);
      if (uploadErr) {
        console.warn('Image upload failed:', uploadErr.message);
        // Show specific error based on the issue
        if (uploadErr.message?.includes('bucket') || uploadErr.message?.includes('not found')) {
          alert('❌ Image upload failed: Storage bucket "product-images" not found.\n\nPlease run the SQL migration in Supabase:\n\n1. Go to Supabase Dashboard > SQL Editor\n2. Run: supabase/migrations/20250116_create_storage_bucket.sql\n\nProduct will be saved without image.');
        } else if (uploadErr.message?.includes('permission') || uploadErr.message?.includes('policy')) {
          alert('❌ Image upload failed: Storage permission denied.\n\nPlease check RLS policies in Supabase Storage.\n\nProduct will be saved without image.');
        } else {
          alert(`❌ Image upload failed: ${uploadErr.message}\n\nProduct will be saved without image.`);
        }
        // Use a placeholder or empty image
        imageUrl = newProduct.image || '/placeholder.jpg';
      } else {
        imageUrl = url;
      }
    }

    // Build category-specific metadata (append to description, not separate column)
    const catFields = getCategoryFields();
    let extraInfo = '';
    catFields.forEach((field) => {
      if (newProduct[field]) {
        const label = FIELD_LABELS[field] || field;
        extraInfo += `\n${label}: ${newProduct[field]}`;
      }
    });

    // Generate a unique ID for the product
    const productId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    // Build product data - only include image if provided (schema may not have image_url column)
    const productData = {
      id: productId,
      name: newProduct.name,
      price: parseFloat(newProduct.price) || 0,
      original_price: parseFloat(newProduct.originalPrice) || null,
      category: newProduct.category,
      badge: newProduct.badge || null,
      stock_count: parseInt(newProduct.stockCount) || 0,
      description: newProduct.description + extraInfo,
    };

    // Only add image fields if image was uploaded (handle schema cache errors)
    if (imageUrl && imageUrl !== '/placeholder.jpg') {
      try {
        productData.image_url = imageUrl;
        // Image URL will be saved
      } catch (e) {
        console.warn('Image field not available in schema');
      }
    }

    let { data: saved, error } = await createProduct(productData);

    // Check for schema cache error - retry without image field
    if (error && (error.message?.includes('schema cache') || error.message?.includes('image_url') || error.message?.includes('column'))) {
      console.warn('Schema cache error, retrying without image...');
      delete productData.image_url;
      const retry = await createProduct(productData);
      saved = retry.data;
      error = retry.error;
      if (!error) {
        showToast('Product added (image saved locally)', 'success');
      }
    }

    if (error) {
      showToast(`Save failed: ${error.message}`, 'error');
      setSaving(false);
      return;
    }

    // Add to local state (map to match PLACEHOLDER_PRODUCTS shape)
    const localProduct = {
      id: saved?.id || productId,
      name: productData.name,
      price: productData.price,
      originalPrice: productData.original_price,
      image: imageUrl || '/placeholder.jpg',
      category: productData.category,
      badge: productData.badge,
      inStock: productData.stock_count > 0,
      stockCount: productData.stock_count,
      rating: 0,
      reviewCount: 0,
      fabric: null,
      description: productData.description,
    };
    setProducts([localProduct, ...products]);
    if (!error) showToast('Product added successfully!', 'success');

    // Reset form
    setShowProductModal(false);
    setSaving(false);
    setImageFile(null);
    setImagePreview(null);
    setNewProduct({
      name: '', price: '', originalPrice: '', category: '', stockCount: '', badge: '',
      image: '', description: '', fabric: '', weaveType: '', care: '', origin: '',
      fit: '', material: '', gemstone: '', weight: '',
    });
  };

  // Edit Product handlers
  const handleEditClick = (product) => {
    setEditingProduct({ ...product });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct.name || !editingProduct.price) {
      alert('Please fill in Product Name and Price.');
      return;
    }
    
    // Check if it's a placeholder product (numeric ID) - can't update in Supabase
    if (typeof editingProduct.id === 'string' && /^\d+$/.test(editingProduct.id)) {
      alert('Demo products cannot be updated. Please create a new product or edit a product from the database.');
      setSaving(false);
      return;
    }
    
    setSaving(true);
    const { error } = await updateProduct(editingProduct.id, {
      name: editingProduct.name,
      price: parseFloat(editingProduct.price),
      original_price: editingProduct.originalPrice ? parseFloat(editingProduct.originalPrice) : null,
      category: editingProduct.category,
      stock_count: parseInt(editingProduct.stockCount) || 0,
      badge: editingProduct.badge,
      description: editingProduct.description,
    });
    if (error) {
      showToast(`Failed to update product: ${error.message}`, 'error');
    } else {
      // Update local state
      setProducts(products.map((p) => p.id === editingProduct.id ? { ...editingProduct, inStock: editingProduct.stockCount > 0 } : p));
      showToast('Product updated successfully!', 'success');
      setShowEditModal(false);
      setEditingProduct(null);
    }
    setSaving(false);
  };

  // Delete Product handlers
  const handleDeleteClick = (product) => {
    setDeletingProduct(product);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingProduct) return;
    
    // Check if it's a demo product (numeric ID) - just remove from local state
    const isDemo = typeof deletingProduct.id === 'string' && /^\d+$/.test(deletingProduct.id);
    
    if (isDemo) {
      // Demo products only exist in local state, just remove them
      setProducts(products.filter((p) => p.id !== deletingProduct.id));
      setShowDeleteConfirm(false);
      setDeletingProduct(null);
      return;
    }
    
    // Real products - delete from Supabase
    const { error } = await deleteProduct(deletingProduct.id);
    if (error) {
      showToast(`Failed to delete product: ${error.message}`, 'error');
    } else {
      setProducts(products.filter((p) => p.id !== deletingProduct.id));
      showToast('Product deleted successfully!', 'success');
      setShowDeleteConfirm(false);
      setDeletingProduct(null);
    }
  };

  // Inventory handlers
  const handleInventoryChange = (productId, field, value) => {
    setInventoryEdits((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  };

  const handleSaveInventory = async (productId) => {
    const edits = inventoryEdits[productId];
    if (!edits) return;

    // Check if it's a demo product (numeric ID) - can't update in Supabase
    if (typeof productId === 'string' && /^\d+$/.test(productId)) {
      showToast('Demo products cannot be updated in Supabase. Create a real product first.', 'error');
      return;
    }

    // Get current product to check if stock is being added
    const currentProduct = products.find((p) => p.id === productId);
    const oldStock = currentProduct?.stockCount || 0;
    
    // Validate stock value
    let newStock = oldStock;
    if (edits.stockCount !== undefined && edits.stockCount !== '') {
      const parsedStock = parseInt(edits.stockCount);
      if (isNaN(parsedStock) || parsedStock < 0) {
        showToast('Invalid stock value. Please enter a valid number.', 'error');
        return;
      }
      newStock = parsedStock;
    }

    // Validate price value
    let newPrice = null;
    if (edits.price !== undefined && edits.price !== '') {
      const parsedPrice = parseFloat(edits.price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        showToast('Invalid price value. Please enter a valid number.', 'error');
        return;
      }
      newPrice = parsedPrice;
    }

    setSavingInventory((prev) => ({ ...prev, [productId]: true }));
    
    // Build updates object only with valid values
    const updates = {};
    if (newPrice !== null) updates.price = newPrice;
    if (edits.stockCount !== undefined && edits.stockCount !== '') updates.stock_count = newStock;
    
    // Check if there are any updates to make
    if (Object.keys(updates).length === 0) {
      showToast('No changes to save.', 'info');
      setSavingInventory((prev) => ({ ...prev, [productId]: false }));
      return;
    }
    
    console.log('Updating product:', productId, 'with updates:', updates);
    
    const { data, error } = await updateProduct(productId, updates);
    if (error) {
      console.error('Update failed:', error);
      showToast(`Failed to update inventory: ${error.message || 'Unknown error'}`, 'error');
    } else {
      // Update local state
      setProducts(products.map((p) => (p.id === productId ? { ...p, ...edits, inStock: (edits.stockCount || p.stockCount) > 0 } : p)));
      setInventoryEdits((prev) => ({ ...prev, [productId]: undefined }));
      showToast('Inventory updated successfully!', 'success');

      // Auto-notify customers if stock was added and there were pending requests
      if (newStock > 0 && oldStock === 0 && currentProduct) {
        const { notified, whatsappNotified } = await notifyRestockCustomers(productId, currentProduct.name, newStock);
        if (notified > 0) {
          showToast(`${notified} customer${notified > 1 ? 's' : ''} notified about restock!`, 'success');
        }
      }
    }
    setSavingInventory((prev) => ({ ...prev, [productId]: false }));
  };

  const handleSaveAllInventory = async () => {
    const productIds = Object.keys(inventoryEdits);
    if (productIds.length === 0) return;
    setSavingInventory((prev) => ({ ...prev, all: true }));
    for (const productId of productIds) {
      await handleSaveInventory(productId);
    }
    setSavingInventory((prev) => ({ ...prev, all: false }));
  };

  // Category handlers
  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', image: '', displayOrder: categories.length + 1 });
    setCatImageFile(null);
    setCatImagePreview(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, image: cat.image, displayOrder: cat.display_order });
    setCatImageFile(null);
    setCatImagePreview(cat.image);
    setShowCategoryModal(true);
  };

  const handleCatImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCatImageFile(file);
      setCatImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name) return alert('Category name is required');
    setSaving(true);
    let imageUrl = categoryForm.image;

    if (catImageFile) {
      const { url, error } = await uploadCategoryImage(catImageFile);
      if (error) {
        alert('Image upload failed');
      } else {
        imageUrl = url;
      }
    }

    const catData = {
      name: categoryForm.name,
      image: imageUrl,
      display_order: parseInt(categoryForm.displayOrder) || 0
    };

    if (editingCategory) {
      const { data, error } = await updateCategory(editingCategory.id, catData);
      if (!error) {
        setCategories(categories.map(c => c.id === editingCategory.id ? data : c));
        showToast('Category updated');
      }
    } else {
      const { data, error } = await createCategory(catData);
      if (!error) {
        setCategories([...categories, data]);
        showToast('Category created');
      }
    }
    setShowCategoryModal(false);
    setSaving(false);
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;
    const { error } = await deleteCategory(id);
    if (!error) {
      setCategories(categories.filter(c => c.id !== id));
      showToast('Category deleted');
    }
  };

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Toggle order selection for bulk invoices
  const toggleOrderSelection = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  // Generate bulk invoices PDF
  const generateBulkInvoices = () => {
    if (selectedOrders.length === 0) {
      showToast('Please select at least one order', 'error');
      return;
    }

    const doc = new jsPDF();
    const selectedOrdersData = orders.filter((o) => selectedOrders.includes(o.id));

    selectedOrdersData.forEach((order, index) => {
      if (index > 0) doc.addPage();

      const raw = order._raw || {};
      const customer = raw.customer || {};
      const items = raw.items || [];
      const shipping = raw.shipping || 0;
      const subtotal = raw.subtotal || order.total - shipping;

      // Store Header
      doc.setFontSize(22);
      doc.setTextColor(6, 78, 59); // purple-primary
      doc.text('Little Shop', 20, 20);

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text('123, Fashion Street, T Nagar, Chennai - 600017', 20, 27);
      doc.text('GST: 33ABCDE1234F1Z5 | Phone: +91 98765 43210', 20, 32);
      doc.text('Email: care@littleshop.in | www.littleshop.in', 20, 37);

      // Invoice Title
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('TAX INVOICE', 160, 20, { align: 'right' });

      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Order ID: ${order.id}`, 160, 27, { align: 'right' });
      doc.text(`Date: ${order.date}`, 160, 32, { align: 'right' });
      doc.text(`Status: ${order.status}`, 160, 37, { align: 'right' });

      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 45, 190, 45);

      // Customer Details Section
      doc.setFontSize(11);
      doc.setTextColor(6, 78, 59);
      doc.text('BILL TO:', 20, 55);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(customer.name || order.customer || 'N/A', 20, 62);
      doc.setTextColor(80, 80, 80);
      const addressLines = [
        customer.address || '',
        `${customer.city || ''}${customer.city && customer.state ? ', ' : ''}${customer.state || ''}`,
        customer.pincode || '',
      ].filter(Boolean);
      addressLines.forEach((line, i) => {
        doc.text(line, 20, 69 + (i * 5));
      });

      // Phone numbers
      // Removed per "No phone number required" rule
      // doc.text(`Phone: ${phones.join(' / ')}`, 20, 69 + (addressLines.length * 5));

      // Payment Details
      doc.setFontSize(11);
      doc.setTextColor(6, 78, 59);
      doc.text('PAYMENT DETAILS:', 120, 55);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Method: ${raw.payment_method || 'Online'}`, 120, 62);
      if (raw.razorpay_payment_id) {
        doc.setTextColor(80, 80, 80);
        doc.text(`Razorpay ID: ${raw.razorpay_payment_id}`, 120, 69);
      }
      doc.setTextColor(0, 0, 0);
      doc.text(`Payment Status: ${raw.payment_status || 'Paid'}`, 120, 76);

      // Items Table
      const tableStartY = 95;
      const tableData = items.map((item) => [
        item.name,
        item.quantity.toString(),
        `₹${(item.price || 0).toLocaleString()}`,
        `₹${((item.price || 0) * (item.quantity || 1)).toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: tableStartY,
        head: [['Item Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [6, 78, 59], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 40, halign: 'right' },
        },
        styles: { cellPadding: 4 },
      });

      // Totals Section - get final Y position from last table
      const finalY = (doc.lastAutoTable?.finalY || 140) + 10;

      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Subtotal:`, 140, finalY);
      doc.text(`₹${subtotal.toLocaleString()}`, 190, finalY, { align: 'right' });

      doc.text(`Shipping:`, 140, finalY + 7);
      if (shipping === 0) {
        doc.setTextColor(6, 78, 59);
        doc.text('FREE', 190, finalY + 7, { align: 'right' });
      } else {
        doc.setTextColor(80, 80, 80);
        doc.text(`₹${shipping.toLocaleString()}`, 190, finalY + 7, { align: 'right' });
      }

      // Total with highlight
      doc.setDrawColor(6, 78, 59);
      doc.line(140, finalY + 12, 190, finalY + 12);

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(6, 78, 59);
      doc.text(`TOTAL:`, 140, finalY + 22);
      doc.text(`₹${(order.total || 0).toLocaleString()}`, 190, finalY + 22, { align: 'right' });

      // Footer
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text('Thank you for shopping with Little Shop!', 20, 280);
      doc.text('No Returns / No Exchanges — All Sales Final', 20, 286);
      doc.text(`Page ${index + 1} of ${selectedOrdersData.length}`, 190, 286, { align: 'right' });
    });

    doc.save(`Bulk-Invoices-${selectedOrders.length}-Orders.pdf`);
    showToast(`${selectedOrders.length} invoices generated successfully!`, 'success');
    setSelectedOrders([]);
  };

  // Order Detail handlers
  const handleViewOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  // HTML Print Invoice Generator
  const generateInvoice = (order) => {
    const raw = order._raw || {};
    const customer = raw.customer || order.customer_data || {};
    const items = raw.items || order.items || [];
    
    // Extract shipping address from multiple possible locations
    const shipping = raw.shipping || {};
    const shippingAddress = shipping.address || 
                           customer.address || 
                           order.address || 
                           order.shipping_address ||
                           (order.delivery_details?.address) ||
                           'No address available';
    
    const shippingCity = shipping.city || customer.city || order.city || order.shipping_city || (order.delivery_details?.city) || '';
    const shippingState = shipping.state || customer.state || order.state || order.shipping_state || (order.delivery_details?.state) || '';
    const shippingPincode = shipping.pincode || customer.pincode || order.pincode || order.shipping_pincode || (order.delivery_details?.pincode) || '';
    
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${order.id}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    .header { background: #111; color: white; padding: 20px; display: flex; justify-content: space-between; }
    .header-left h1 { margin: 0; font-size: 24px; letter-spacing: 2px; }
    .header-left p { margin: 5px 0 0; font-size: 12px; color: #aaa; }
    .header-right { text-align: right; }
    .header-right .badge { background: rgba(255,255,255,0.1); padding: 8px 15px; display: inline-block; }
    .header-right .badge-label { font-size: 10px; color: #888; text-transform: uppercase; }
    .header-right .badge-value { font-size: 16px; font-weight: bold; }
    .header-right .gst { font-size: 11px; color: #888; margin-top: 5px; }
    
    .info-section { display: flex; gap: 30px; margin: 25px 0; }
    .info-box { flex: 1; border-left: 3px solid #111; padding-left: 15px; }
    .info-box.ship { border-color: #ccc; }
    .info-label { font-size: 10px; font-weight: bold; color: #888; text-transform: uppercase; margin-bottom: 8px; }
    .info-value { font-size: 14px; font-weight: 600; color: #111; }
    .info-sub { font-size: 12px; color: #666; margin-top: 4px; }
    
    .meta-bar { display: flex; gap: 30px; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 12px 0; margin: 20px 0; font-size: 12px; }
    .meta-item span:first-child { color: #888; }
    .meta-item span:last-child { font-weight: 600; margin-left: 5px; }
    .status-badge { background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 3px; font-size: 10px; }
    
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
    th { background: #f5f5f5; border-bottom: 2px solid #ddd; padding: 10px; text-align: left; font-weight: 600; }
    td { padding: 12px 10px; border-bottom: 1px solid #eee; }
    td.price, th.price { text-align: right; }
    td.qty, th.qty { text-align: center; }
    .item-icon { width: 30px; height: 30px; background: #f5f5f5; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; }
    
    .totals { width: 280px; margin-left: auto; margin-top: 20px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; }
    .totals-row.total { border-top: 2px solid #111; padding-top: 12px; margin-top: 8px; font-size: 16px; font-weight: bold; }
    .totals-row span:first-child { color: #666; }
    .free { color: #2e7d32; font-weight: 600; }
    
    .footer { background: #f9f9f9; padding: 15px; text-align: center; font-size: 11px; color: #888; margin-top: 30px; }
    .footer p { margin: 3px 0; }
    
    .print-btn { position: fixed; top: 20px; right: 20px; background: #111; color: white; border: none; padding: 10px 20px; cursor: pointer; }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
  
  <div class="header">
    <div class="header-left">
      <h1>LITTLE SHOP</h1>
      <p>Premium Fashion & Accessories</p>
      <p>Dharapuram, Tamil Nadu</p>
    </div>
    <div class="header-right">
      <div class="badge">
        <div class="badge-label">Tax Invoice</div>
        <div class="badge-value">${order.id}</div>
      </div>
      <div class="gst">GST: 33EJJPA8233H1ZD</div>
    </div>
  </div>
  
  <div class="info-section">
    <div class="info-box">
      <div class="info-label">Bill To</div>
      <div class="info-value">${customer.name || order.customer || 'N/A'}</div>
      <div class="info-sub">${customer.email || order.email || 'N/A'}</div>
      <div class="info-sub">${customer.phone || order.phone || ''}</div>
    </div>
    <div class="info-box ship">
      <div class="info-label">Ship To</div>
      <div class="info-value">${shippingAddress}</div>
      <div class="info-sub">${shippingCity}${shippingCity ? ', ' : ''}${shippingState}${shippingPincode ? ' - ' : ''}${shippingPincode}</div>
    </div>
  </div>
  
  <div class="meta-bar">
    <div class="meta-item">
      <span>Order Date:</span>
      <span>${order.date}</span>
    </div>
    <div class="meta-item">
      <span>Status:</span>
      <span class="status-badge">${order.status}</span>
    </div>
    <div class="meta-item">
      <span>Payment:</span>
      <span>${raw.payment?.razorpay_payment_id ? 'Paid' : 'Pending'}</span>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="qty">Qty</th>
        <th class="price">Price</th>
        <th class="price">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
      <tr>
        <td>
          <span class="item-icon">📦</span>
          ${item.name}
        </td>
        <td class="qty">${item.quantity}</td>
        <td class="price">₹${item.price.toLocaleString()}</td>
        <td class="price">₹${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>₹${(raw.subtotal || 0).toLocaleString()}</span>
    </div>
    <div class="totals-row">
      <span>Shipping</span>
      <span class="${raw.shipping === 0 ? 'free' : ''}">${raw.shipping === 0 ? 'FREE' : '₹' + (raw.shipping || 0)}</span>
    </div>
    <div class="totals-row total">
      <span>Total</span>
      <span>₹${(order.total || 0).toLocaleString()}</span>
    </div>
  </div>
  
  <div class="footer">
    <p>No Returns / No Exchanges — All Sales Final</p>
    <p>Thank you for shopping with Little Shop!</p>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  // Bulk Actions Handlers
  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const applyBulkDiscount = () => {
    if (selectedProducts.length === 0 || bulkDiscount <= 0) return;
    setProducts((prev) =>
      prev.map((p) =>
        selectedProducts.includes(p.id)
          ? { ...p, price: Math.round(p.price * (1 - bulkDiscount / 100)), originalPrice: p.originalPrice || p.price }
          : p
      )
    );
    setSelectedProducts([]);
    setBulkActionMode(null);
    setBulkDiscount(0);
  };

  const applyBulkStockUpdate = () => {
    if (selectedProducts.length === 0) return;
    setProducts((prev) =>
      prev.map((p) =>
        selectedProducts.includes(p.id)
          ? { ...p, stockCount: bulkStockUpdate, inStock: bulkStockUpdate > 0 }
          : p
      )
    );
    setSelectedProducts([]);
    setBulkActionMode(null);
    setBulkStockUpdate(0);
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const todayStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const todayOrders = orders.filter((o) => o.date === todayStr);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = orders.filter((o) => ['confirmed', 'pending', 'paid', 'Packed', 'Shipped', 'Out for Delivery'].includes(o.status));
  const newUnaccepted = orders.filter((o) => ['confirmed', 'pending', 'paid'].includes(o.status)).length;

  const lowStockProducts = products.filter((p) => p.stockCount > 0 && p.stockCount < 5);
  const alertCount = newUnaccepted + abandonedCarts.filter((c) => !c.reminder_sent).length;

  const stats = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee, change: '' },
    { label: 'Orders Today', value: todayOrders.length.toString(), icon: ShoppingCart, change: '' },
    { label: 'Pending Orders', value: pendingOrders.length.toString(), icon: Clock, change: '' },
    { label: 'Low Stock', value: lowStockProducts.length.toString(), icon: AlertCircle, change: lowStockProducts.length > 0 ? 'Action needed' : '' },
  ];

  // Revenue chart data — group orders by date
  const revenueByDate = {};
  orders.forEach((o) => {
    const d = o.date || 'Unknown';
    if (!revenueByDate[d]) revenueByDate[d] = { date: d, revenue: 0, count: 0 };
    revenueByDate[d].revenue += o.total || 0;
    revenueByDate[d].count += 1;
  });
  const chartData = Object.values(revenueByDate).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);

  // Top customers
  const customerSpend = {};
  orders.forEach((o) => {
    const name = o.customer || 'Unknown';
    if (!customerSpend[name]) customerSpend[name] = { name, total: 0, orders: 0 };
    customerSpend[name].total += o.total || 0;
    customerSpend[name].orders += 1;
  });
  const topCustomers = Object.values(customerSpend).sort((a, b) => b.total - a.total).slice(0, 10);

  // Sales by City
  const salesByCity = {};
  orders.forEach((o) => {
    const city = o._raw?.customer?.city || 'Unknown';
    if (!salesByCity[city]) salesByCity[city] = { city, orders: 0, revenue: 0 };
    salesByCity[city].orders += 1;
    salesByCity[city].revenue += o.total || 0;
  });
  const cityRankings = Object.values(salesByCity).sort((a, b) => b.revenue - a.revenue);

  // Best Sellers & Slow Moving Stock
  const productPerformance = {};
  orders.forEach((o) => {
    const raw = o._raw;
    if (raw?.items) {
      raw.items.forEach((item) => {
        if (!productPerformance[item.id]) {
          productPerformance[item.id] = { id: item.id, name: item.name, sold: 0, revenue: 0 };
        }
        productPerformance[item.id].sold += item.quantity || 1;
        productPerformance[item.id].revenue += (item.price || 0) * (item.quantity || 1);
      });
    }
  });
  const bestSellers = Object.values(productPerformance).sort((a, b) => b.sold - a.sold).slice(0, 5);
  const slowMovingStock = products
    .filter((p) => !productPerformance[p.id] || productPerformance[p.id].sold < 3)
    .map((p) => ({ ...p, sold: productPerformance[p.id]?.sold || 0 }))
    .sort((a, b) => a.sold - b.sold)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-purple-primary text-white min-h-screen sticky top-0">
        <div className="p-6 border-b border-white/10">
          <h2 className="font-playfair text-xl font-semibold">Little Shop</h2>
          <p className="font-inter text-xs text-white/50 mt-1">Admin Console</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-inter text-sm transition-colors relative ${
                activeTab === key ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} /> {label}
              {key === 'notifications' && alertCount > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[20px] h-5 bg-rose-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {alertCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-inter text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-10 min-w-0">
        {/* Admin Header Bar with Refresh and Session Timer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-playfair text-xl sm:text-2xl text-purple-primary">Dashboard</h1>
            <p className="font-inter text-xs text-gray-400 mt-1">Last refreshed: {new Date().toLocaleTimeString('en-IN')}</p>
          </div>
          <div className="flex items-center gap-3">
            <SessionTimer />
            
            {/* Notification Bell Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className={`flex items-center gap-2 px-4 py-2 font-inter text-xs rounded-sm transition-colors ${
                  notifPermission.granted 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-amber-500 text-white hover:bg-amber-600'
                }`}
                title={notifPermission.granted ? 'Notifications enabled' : 'Click to enable notifications'}
              >
                <Bell size={14} />
                {notifPermission.granted ? '🔔 On' : '🔔 Off'}
              </button>
              
              {/* Notification Panel Dropdown */}
              {showNotifPanel && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4"
                >
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Bell size={16} className={notifPermission.granted ? 'text-green-600' : 'text-amber-500'} />
                    Order Notifications
                  </h3>
                  
                  {notifPermission.granted ? (
                    <div className="space-y-3">
                      <p className="text-sm text-green-600 flex items-center gap-2">
                        <CheckCircle size={16} />
                        Notifications are enabled!
                      </p>
                      <button
                        onClick={() => {
                          showLocalNotification('🔔 Test Alert', {
                            body: 'This is a test notification. You will receive alerts for new orders!',
                            data: { url: '/admin/dashboard' }
                          });
                          showToast('Test notification sent!', 'success');
                        }}
                        className="w-full px-4 py-2 bg-purple-primary text-white text-sm rounded-lg hover:bg-purple-primary/90 transition-colors"
                      >
                        🔔 Send Test Notification
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-amber-600">
                        {notifPermission.error || 'Notifications are disabled. Enable to get instant order alerts!'}
                      </p>
                      <button
                        onClick={handleRequestNotification}
                        className="w-full px-4 py-2 bg-purple-primary text-white text-sm rounded-lg hover:bg-purple-primary/90 transition-colors flex items-center justify-center gap-2"
                      >
                        <Bell size={16} />
                        Enable Notifications
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-purple-primary text-white font-inter text-xs rounded-sm hover:bg-purple-primary/90 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
        {/* Mobile Tab Bar */}
        <div className="flex md:hidden items-center gap-2 mb-6 overflow-x-auto pb-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-inter text-xs whitespace-nowrap transition-colors ${
                activeTab === key ? 'bg-purple-primary text-white' : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-full font-inter text-xs bg-white text-gray-500 border border-gray-200">
            <LogOut size={14} />
          </button>
        </div>

        {/* Dashboard Overview - MNC Professional Style */}
        {activeTab === 'overview' && (
          <div>
            {/* Header with Live Status */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-playfair text-2xl text-purple-primary">Dashboard Overview</h1>
                <p className="font-inter text-xs text-gray-400 mt-1">Real-time business operations center</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-inter text-xs text-green-700 font-medium">System Online</span>
              </div>
            </div>

            {/* KPI Stats Cards - MNC Gradient Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((s, idx) => (
                <div key={s.label} className={`relative overflow-hidden rounded-xl p-5 text-white shadow-lg ${
                  idx === 0 ? 'bg-gradient-to-br from-purple-primary to-purple-700' :
                  idx === 1 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                  idx === 2 ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
                  'bg-gradient-to-br from-rose-500 to-rose-600'
                }`}>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                        <s.icon size={18} />
                      </div>
                      {s.change && (
                        <span className="px-2 py-1 bg-white/20 rounded-lg font-inter text-xs font-medium">
                          {s.change}
                        </span>
                      )}
                    </div>
                    <p className="font-playfair text-2xl font-bold mb-1">{s.value}</p>
                    <p className="font-inter text-xs text-white/70">{s.label}</p>
                  </div>
                  <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                </div>
              ))}
            </div>

            {/* Quick Actions - MNC Style Cards */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-inter text-base font-semibold text-gray-800">Quick Actions</h2>
                <span className="font-inter text-xs text-gray-400">Frequently used operations</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => { setActiveTab('products'); handleAddProduct(); }}
                  className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-primary transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4 group-hover:bg-purple-primary group-hover:text-white transition-colors">
                    <Plus size={22} className="text-purple-primary group-hover:text-white" />
                  </div>
                  <p className="font-inter text-sm font-semibold text-gray-800 mb-1">Add Product</p>
                  <p className="font-inter text-xs text-gray-400">Create new listing</p>
                </button>
                <button
                  onClick={() => setActiveTab('flash-sale')}
                  className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-orange-400 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <Zap size={22} className="text-orange-500 group-hover:text-white" />
                  </div>
                  <p className="font-inter text-sm font-semibold text-gray-800 mb-1">Flash Sale</p>
                  <p className="font-inter text-xs text-gray-400">Manage promotions</p>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <IndianRupee size={22} className="text-emerald-500 group-hover:text-white" />
                  </div>
                  <p className="font-inter text-sm font-semibold text-gray-800 mb-1">Revenue</p>
                  <p className="font-inter text-xs text-gray-400">{CURRENCY}{todayRevenue.toLocaleString()}</p>
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-rose-400 transition-all text-left group relative"
                >
                  <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center mb-4 group-hover:bg-rose-500 group-hover:text-white transition-colors relative">
                    <Bell size={22} className="text-rose-500 group-hover:text-white" />
                    {newUnaccepted > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center animate-bounce">
                        {newUnaccepted}
                      </span>
                    )}
                  </div>
                  <p className="font-inter text-sm font-semibold text-gray-800 mb-1">Notifications</p>
                  <p className="font-inter text-xs text-gray-400">{newUnaccepted} pending</p>
                </button>
              </div>
            </div>

            {/* Recent Orders - MNC Style */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="font-inter text-base font-semibold text-gray-800">Recent Orders</h2>
                  <p className="font-inter text-xs text-gray-400 mt-0.5">Latest 5 orders from all customers</p>
                </div>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="font-inter text-xs text-purple-primary font-medium hover:underline"
                >
                  View All →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map((h) => (
                        <th key={h} className="text-left px-6 py-3 font-inter text-[11px] font-semibold uppercase text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order, idx) => (
                      <tr 
                        key={order.id} 
                        className="border-b border-gray-100 hover:bg-purple-50/30 cursor-pointer transition-colors"
                        onClick={() => navigate(`/admin/order/${order.id}`)}
                      >
                        <td className="px-6 py-4">
                          <span className="font-inter text-sm font-semibold text-purple-primary">{order.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="font-inter text-xs font-semibold text-purple-primary">
                                {order.customer.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-inter text-sm text-gray-700">{order.customer}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-inter text-sm font-medium text-gray-800">{CURRENCY}{order.total.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-inter text-[11px] font-semibold ${
                            order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' :
                            order.status === 'Shipped' || order.status === 'Out for Delivery' ? 'bg-blue-50 text-blue-600' :
                            order.status === 'Packed' ? 'bg-purple-50 text-purple-600' :
                            order.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              order.status === 'Delivered' ? 'bg-emerald-500' :
                              order.status === 'Shipped' || order.status === 'Out for Delivery' ? 'bg-blue-500' :
                              order.status === 'Packed' ? 'bg-purple-500' :
                              order.status === 'confirmed' ? 'bg-green-500' :
                              'bg-amber-500'
                            }`} />
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-inter text-xs text-gray-500">{order.date}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products Management - MNC Professional Style */}
        {activeTab === 'products' && (
          <div>
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-playfair text-2xl text-purple-primary">Products</h1>
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg font-inter text-xs font-semibold">
                    {products.length} items
                  </span>
                </div>
                {selectedProducts.length > 0 && (
                  <p className="font-inter text-xs text-gray-500 mt-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-primary rounded-full" />
                    {selectedProducts.length} products selected for bulk action
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search Bar - Modern Style */}
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl font-inter text-sm outline-none focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/10 w-56 transition-all"
                  />
                </div>
                
                {/* Bulk Actions Panel */}
                {selectedProducts.length > 0 && (
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                    <span className="font-inter text-xs text-gray-500 mr-1">Bulk:</span>
                    <button
                      onClick={() => setBulkActionMode('discount')}
                      className="flex items-center gap-1.5 bg-orange-50 text-orange-600 border border-orange-200 font-inter text-xs px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      <Percent size={14} /> Discount
                    </button>
                    <button
                      onClick={() => setBulkActionMode('stock')}
                      className="flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-200 font-inter text-xs px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Boxes size={14} /> Stock
                    </button>
                    <button
                      onClick={() => setSelectedProducts([])}
                      className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                {/* Action Buttons */}
                <button 
                  onClick={() => setShowBulkImport(true)} 
                  className="flex items-center gap-2 text-xs px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:border-purple-primary hover:text-purple-primary transition-colors shadow-sm"
                >
                  <Upload size={14} /> Bulk Import
                </button>
                <button 
                  onClick={handleAddProduct} 
                  className="flex items-center gap-2 text-xs px-5 py-2.5 bg-purple-primary text-white rounded-xl hover:bg-purple-700 transition-colors shadow-md shadow-purple-primary/20"
                >
                  <Plus size={14} /> Add Product
                </button>
              </div>
            </div>

            {/* Bulk Action Panel - MNC Style */}
            {bulkActionMode && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 mb-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      {bulkActionMode === 'discount' ? <Percent size={20} className="text-orange-500" /> : <Boxes size={20} className="text-blue-500" />}
                    </div>
                    {bulkActionMode === 'discount' ? (
                      <>
                        <span className="font-inter text-sm text-gray-700">Apply discount to <strong>{selectedProducts.length}</strong> selected products</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={bulkDiscount}
                            onChange={(e) => setBulkDiscount(parseInt(e.target.value) || 0)}
                            placeholder="%"
                            className="w-20 border border-gray-200 px-3 py-2 font-inter text-sm rounded-lg focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20 outline-none"
                            min="1"
                            max="99"
                          />
                          <span className="font-inter text-sm text-gray-500">%</span>
                        </div>
                        <button onClick={applyBulkDiscount} className="bg-orange-500 text-white text-xs px-5 py-2.5 rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-sm">Apply Discount</button>
                      </>
                    ) : (
                      <>
                        <span className="font-inter text-sm text-gray-700">Set stock for <strong>{selectedProducts.length}</strong> selected products</span>
                        <input
                          type="number"
                          value={bulkStockUpdate}
                          onChange={(e) => setBulkStockUpdate(parseInt(e.target.value) || 0)}
                          placeholder="Stock"
                          className="w-24 border border-gray-200 px-3 py-2 font-inter text-sm rounded-lg focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20 outline-none"
                          min="0"
                        />
                        <button onClick={applyBulkStockUpdate} className="bg-blue-500 text-white text-xs px-5 py-2.5 rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm">Update Stock</button>
                      </>
                    )}
                  </div>
                  <button onClick={() => setBulkActionMode(null)} className="font-inter text-sm text-gray-500 hover:text-gray-700 px-3 py-2 hover:bg-white rounded-lg transition-colors">Cancel</button>
                </div>
              </div>
            )}

            {/* Products Table - MNC Professional Style */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-6 py-4 font-inter text-[11px] font-semibold uppercase text-gray-500 w-10">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onChange={(e) => setSelectedProducts(e.target.checked ? products.map((p) => p.id) : [])}
                        className="rounded border-gray-300 w-4 h-4 text-purple-primary focus:ring-purple-primary/20"
                      />
                    </th>
                    {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-6 py-4 font-inter text-[11px] font-semibold uppercase text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter((p) =>
                      productSearch === '' ||
                      (p.name?.toLowerCase() || '').includes(productSearch.toLowerCase()) ||
                      (p.category?.toLowerCase() || '').includes(productSearch.toLowerCase())
                    )
                    .map((p) => (
                    <tr key={p.id} className={`border-b border-gray-100 hover:bg-purple-50/20 transition-all duration-200 ${selectedProducts.includes(p.id) ? 'bg-purple-50/40' : ''}`}>
                      {/* Checkbox */}
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(p.id)}
                          onChange={() => toggleProductSelection(p.id)}
                          className="rounded border-gray-300 w-4 h-4 text-purple-primary focus:ring-purple-primary/20 cursor-pointer"
                        />
                      </td>
                      
                      {/* Product Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img 
                              src={p.image} 
                              alt={p.name} 
                              className="w-12 h-14 object-cover rounded-xl bg-gray-100 shadow-sm" 
                            />
                            {typeof p.id === 'string' && /^\d+$/.test(p.id) && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                D
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-inter text-sm font-medium text-gray-800">{p.name}</p>
                            <p className="font-inter text-xs text-gray-400 mt-0.5">ID: {p.id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="font-inter text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">{p.category}</span>
                      </td>
                      
                      {/* Price */}
                      <td className="px-6 py-4">
                        <span className="font-inter text-sm font-semibold text-gray-800">{CURRENCY}{p.price.toLocaleString()}</span>
                      </td>
                      
                      {/* Stock */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-inter text-sm font-medium ${
                            p.stockCount === 0 ? 'text-rose-500' :
                            p.stockCount < 5 ? 'text-orange-500' :
                            'text-emerald-600'
                          }`}>
                            {p.stockCount === 0 ? '0' : p.stockCount}
                          </span>
                          {p.stockCount === 0 && (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-semibold rounded-full">Out</span>
                          )}
                          {p.stockCount > 0 && p.stockCount < 5 && (
                            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-semibold rounded-full">Low</span>
                          )}
                          {p.stockCount >= 5 && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-semibold rounded-full">Good</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Status Toggle */}
                      <td className="px-6 py-4">
                        <button
                          onClick={async () => {
                            if (typeof p.id === 'string' && /^\d+$/.test(p.id)) {
                              showToast('Demo products cannot be updated. Create a real product first.', 'error');
                              return;
                            }
                            const newStatus = !(p.is_active !== false);
                            const { error } = await updateProduct(p.id, { is_active: newStatus });
                            if (!error) {
                              setProducts(products.map((prod) =>
                                prod.id === p.id ? { ...prod, is_active: newStatus } : prod
                              ));
                              showToast(`Product ${newStatus ? 'activated' : 'deactivated'}!`, 'success');
                            } else {
                              showToast(`Failed to update: ${error.message || 'Check if is_active column exists in Supabase'}`, 'error');
                            }
                          }}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-inter text-xs font-medium transition-all ${
                            p.is_active !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                          }`}
                          title={p.is_active !== false ? 'Click to hide from customers' : 'Click to show to customers'}
                        >
                          <span className={`w-2 h-2 rounded-full ${p.is_active !== false ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {p.is_active !== false ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(p)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Management */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h1 className="font-playfair text-2xl text-purple-primary">Order Management</h1>
                {selectedOrders.length > 0 && (
                  <p className="font-inter text-xs text-gray-400 mt-1">{selectedOrders.length} orders selected</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Bulk Print Button */}
                {selectedOrders.length > 0 && (
                  <button
                    onClick={generateBulkInvoices}
                    className="flex items-center gap-1.5 bg-purple-primary text-white font-inter text-xs px-4 py-2 rounded-sm hover:bg-purple-primary/90 transition-colors"
                  >
                    <Download size={14} /> Print {selectedOrders.length} Invoices
                  </button>
                )}
                {/* Order Search */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-sm font-inter text-sm outline-none focus:border-purple-primary w-full sm:w-64"
                  />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 font-inter text-xs tracking-wider uppercase text-gray-400 w-10">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === orders.length && orders.length > 0}
                        onChange={(e) => setSelectedOrders(e.target.checked ? orders.map((o) => o.id) : [])}
                        className="rounded-sm border-gray-300"
                      />
                    </th>
                    {['Order ID', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-inter text-xs tracking-wider uppercase text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .filter((order) =>
                      orderSearch === '' ||
                      order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
                      order.customer.toLowerCase().includes(orderSearch.toLowerCase()) ||
                      order.email.toLowerCase().includes(orderSearch.toLowerCase())
                    )
                    .map((order) => (
                    <tr key={order.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${selectedOrders.includes(order.id) ? 'bg-purple-primary/5' : ''}`}>
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="rounded-sm border-gray-300"
                        />
                      </td>
                      <td className="px-5 py-3 font-inter text-sm font-medium text-purple-primary">{order.id}</td>
                      <td className="px-5 py-3 font-inter text-sm text-gray-700">{order.customer}</td>
                      <td className="px-5 py-3 font-inter text-xs text-gray-500">{order.email}</td>
                      <td className="px-5 py-3 font-inter text-sm text-gray-700">{order.items}</td>
                      <td className="px-5 py-3 font-inter text-sm font-medium text-purple-primary">{CURRENCY}{order.total.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`font-inter text-xs px-3 py-1.5 rounded-full outline-none cursor-pointer ${
                            order.status === 'Delivered' ? 'bg-purple-primary/10 text-purple-primary' :
                            order.status === 'Shipped' || order.status === 'Out for Delivery' ? 'bg-blue-50 text-blue-600' :
                            order.status === 'Packed' ? 'bg-purple-50 text-purple-600' :
                            order.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                            'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewOrderDetail(order); }}
                            className="text-gray-400 hover:text-purple-primary transition-colors"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); generateInvoice(order); }}
                            className="text-gray-400 hover:text-purple-primary transition-colors"
                            title="Download Invoice"
                          >
                            <FileText size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inventory Manager */}
        {activeTab === 'inventory' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h1 className="font-playfair text-2xl text-purple-primary">Inventory Manager</h1>
              {Object.keys(inventoryEdits).length > 0 && (
                <button
                  onClick={handleSaveAllInventory}
                  disabled={savingInventory.all}
                  className="flex items-center gap-2 bg-purple-primary text-white font-inter text-xs px-5 py-2.5 rounded-sm hover:bg-purple-primary/90 transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={14} />
                  {savingInventory.all ? 'Saving...' : `Save All Changes (${Object.keys(inventoryEdits).length})`}
                </button>
              )}
            </div>
            <div className="bg-white rounded-lg border border-gray-100 overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Product', 'Category', 'Current Price', 'New Price', 'Stock', 'New Stock', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-inter text-xs tracking-wider uppercase text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, idx) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt={p.name} className="w-8 h-10 object-cover rounded-sm bg-gray-100" />
                          <div>
                            <span className="font-inter text-sm text-gray-700">{p.name}</span>
                            {typeof p.id === 'string' && /^\d+$/.test(p.id) && (
                              <span className="ml-2 inline-block bg-gray-200 text-gray-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Demo
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-inter text-xs text-gray-500">{p.category}</td>
                      <td className="px-5 py-3 font-inter text-sm text-gray-500">{CURRENCY}{p.price.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <input
                          type="number"
                          defaultValue={p.price}
                          onChange={(e) => handleInventoryChange(p.id, 'price', e.target.value)}
                          className="w-24 border border-gray-200 px-3 py-2 font-inter text-sm rounded-sm outline-none focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/10 transition-all"
                          placeholder={p.price}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <span className={`font-inter text-sm ${p.stockCount === 0 ? 'text-rose-gold font-semibold' : 'text-gray-700'}`}>
                          {p.stockCount}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="number"
                          defaultValue={p.stockCount}
                          onChange={(e) => handleInventoryChange(p.id, 'stockCount', e.target.value)}
                          className="w-24 border border-gray-200 px-3 py-2 font-inter text-sm rounded-sm outline-none focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/10 transition-all"
                          placeholder={p.stockCount}
                        />
                      </td>
                      <td className="px-5 py-3">
                        {inventoryEdits[p.id] && (
                          <button
                            onClick={() => handleSaveInventory(p.id)}
                            disabled={savingInventory[p.id]}
                            className="flex items-center gap-1.5 bg-purple-primary text-white font-inter text-xs px-3 py-2 rounded-sm hover:bg-purple-primary/90 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={12} />
                            {savingInventory[p.id] ? 'Saving...' : 'Update'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="font-inter text-xs text-gray-400 mt-4">Changes are pushed to Supabase immediately when you click Update.</p>
          </div>
        )}

        {/* Restock Requests */}
        {activeTab === 'restock' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h1 className="font-playfair text-2xl text-purple-primary">Restock Requests</h1>
                <p className="font-inter text-sm text-gray-500 mt-1">
                  {restockRequests.length} product{restockRequests.length !== 1 ? 's' : ''} with pending requests
                </p>
              </div>
              <button
                onClick={fetchRestockRequests}
                disabled={restockLoading}
                className="flex items-center gap-2 bg-purple-primary text-white font-inter text-xs px-4 py-2 rounded-sm hover:bg-purple-primary/90 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={restockLoading ? 'animate-spin' : ''} />
                {restockLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {restockRequests.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <RotateCcw size={24} className="text-gray-400" />
                </div>
                <h3 className="font-playfair text-lg text-gray-800 mb-2">No Restock Requests</h3>
                <p className="font-inter text-sm text-gray-500 max-w-md mx-auto">
                  When customers request to be notified about out-of-stock products, they will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {restockRequests.map((request) => (
                  <motion.div
                    key={request.product_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg border border-gray-100 p-5"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package size={24} className="text-gray-400" />
                          </div>
                          <div>
                            <h3 className="font-inter text-base font-medium text-gray-800">{request.product_name}</h3>
                            <p className="font-inter text-xs text-gray-400">ID: {request.product_id}</p>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-amber-50 rounded-lg p-3 text-center">
                            <p className="font-playfair text-2xl text-amber-600">{request.request_count}</p>
                            <p className="font-inter text-[10px] text-gray-500 uppercase tracking-wider">Total Requests</p>
                          </div>
                          <div className="bg-purple-light rounded-lg p-3 text-center">
                            <p className="font-playfair text-2xl text-purple-primary">{request.email_requests}</p>
                            <p className="font-inter text-[10px] text-gray-500 uppercase tracking-wider">Email Requests</p>
                          </div>
                        </div>

                        <p className="font-inter text-xs text-gray-400 mt-3">
                          Last request: {new Date(request.last_request_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => navigate(`/admin/products?search=${encodeURIComponent(request.product_name)}`)}
                          className="flex items-center gap-2 bg-purple-primary text-white font-inter text-xs px-4 py-2.5 rounded-sm hover:bg-purple-primary/90 transition-colors"
                        >
                          <Package size={14} />
                          View Product
                        </button>
                        <button
                          onClick={() => handleNotifyRestock(request.product_id)}
                          disabled={notifyingProduct === request.product_id}
                          className="flex items-center gap-2 bg-rose-gold text-white font-inter text-xs px-4 py-2.5 rounded-sm hover:bg-rose-gold/90 transition-colors disabled:opacity-50"
                        >
                          {notifyingProduct === request.product_id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Notifying...
                            </>
                          ) : (
                            <>
                              <Bell size={14} />
                              Notify All ({request.request_count})
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Flash Sale Manager */}
        {activeTab === 'flashsale' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h1 className="font-playfair text-2xl text-purple-primary">Flash Sale Manager</h1>
                <p className="font-inter text-sm text-gray-500 mt-1">
                  Create time-limited offers with countdown timers
                </p>
              </div>
              <button
                onClick={fetchFlashSales}
                disabled={flashSaleLoading}
                className="flex items-center gap-2 bg-purple-primary text-white font-inter text-xs px-4 py-2 rounded-sm hover:bg-purple-primary/90 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={flashSaleLoading ? 'animate-spin' : ''} />
                {flashSaleLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Create New Flash Sale Form */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 mb-8">
              <h2 className="font-playfair text-lg text-purple-primary mb-4 flex items-center gap-2">
                <Zap size={18} className="text-amber-500" />
                Create Flash Sale
              </h2>

              <form onSubmit={handleFlashSaleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Selection */}
                  <div>
                    <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">
                      Select Product *
                    </label>
                    <select
                      value={flashSaleForm.productId}
                      onChange={(e) => {
                        const product = products.find(p => p.id === e.target.value);
                        setFlashSaleForm({ ...flashSaleForm, productId: e.target.value });
                        setSelectedProduct(product);
                      }}
                      className="w-full border border-gray-200 rounded-sm px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary"
                      required
                    >
                      <option value="">Choose a product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({CURRENCY}{p.price.toLocaleString()})
                        </option>
                      ))}
                    </select>
                    {selectedProduct && (
                      <p className="font-inter text-xs text-gray-500 mt-1">
                        Original Price: <span className="line-through">{CURRENCY}{selectedProduct.price.toLocaleString()}</span>
                      </p>
                    )}
                  </div>

                  {/* Sale Price */}
                  <div>
                    <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">
                      Sale Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={flashSaleForm.discountedPrice}
                      onChange={(e) => setFlashSaleForm({ ...flashSaleForm, discountedPrice: e.target.value })}
                      placeholder="Enter discounted price"
                      className="w-full border border-gray-200 rounded-sm px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary"
                      required
                      min="1"
                    />
                    {selectedProduct && flashSaleForm.discountedPrice && (
                      <p className="font-inter text-xs text-purple-primary mt-1">
                        Discount: {Math.round((1 - parseInt(flashSaleForm.discountedPrice) / selectedProduct.price) * 100)}% OFF
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* End Time */}
                  <div>
                    <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">
                      End Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={flashSaleForm.endTime}
                      onChange={(e) => setFlashSaleForm({ ...flashSaleForm, endTime: e.target.value })}
                      className="w-full border border-gray-200 rounded-sm px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary"
                      required
                    />
                  </div>

                  {/* Banner Text */}
                  <div>
                    <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">
                      Banner Message
                    </label>
                    <input
                      type="text"
                      value={flashSaleForm.bannerText}
                      onChange={(e) => setFlashSaleForm({ ...flashSaleForm, bannerText: e.target.value })}
                      placeholder="Flash Sale! Limited Time Offer"
                      className="w-full border border-gray-200 rounded-sm px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={savingFlashSale}
                  className="flex items-center gap-2 bg-amber-500 text-white font-inter text-sm px-6 py-3 rounded-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {savingFlashSale ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      Launch Flash Sale
                    </>
                  )}
                </motion.button>
              </form>
            </div>

            {/* Active Flash Sale Banner */}
            {activeFlashSale && (
              <div className="mb-8">
                <h2 className="font-playfair text-lg text-purple-primary mb-4 flex items-center gap-2">
                  <Timer size={18} />
                  Currently Active
                </h2>
                <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 rounded-lg p-6 text-white relative overflow-hidden">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,_rgba(251,191,36,0.3)_0%,_transparent_50%)]" />
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,_rgba(251,191,36,0.2)_0%,_transparent_50%)]" />
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap size={20} className="text-amber-400" />
                        <span className="font-inter text-xs tracking-wider uppercase text-amber-400">Live Now</span>
                      </div>
                      <h3 className="font-playfair text-2xl mb-1">{activeFlashSale.product_name}</h3>
                      <p className="font-inter text-sm text-white/70">{activeFlashSale.banner_text}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="font-inter text-lg">
                          <span className="line-through text-white/50">{CURRENCY}{activeFlashSale.original_price?.toLocaleString()}</span>
                          <span className="text-amber-400 font-bold ml-2">{CURRENCY}{activeFlashSale.discounted_price?.toLocaleString()}</span>
                        </span>
                        <span className="bg-amber-500 text-emerald-900 text-xs font-bold px-2 py-1 rounded">
                          {Math.round((1 - activeFlashSale.discounted_price / activeFlashSale.original_price) * 100)}% OFF
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <FlashSaleCountdown endTime={activeFlashSale.end_time} />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleFlashSale(activeFlashSale.id, activeFlashSale.is_active)}
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-inter text-xs rounded transition-colors"
                        >
                          Deactivate
                        </button>
                        <button
                          onClick={() => handleDeleteFlashSale(activeFlashSale.id)}
                          className="px-4 py-2 bg-rose-gold hover:bg-rose-600 text-white font-inter text-xs rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Previous Flash Sales */}
            {flashSales.length > 0 && (
              <div>
                <h2 className="font-playfair text-lg text-purple-primary mb-4">Flash Sale History</h2>
                <div className="bg-white rounded-lg border border-gray-100 overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-3 font-inter text-xs tracking-wider uppercase text-gray-400">Product</th>
                        <th className="text-left px-5 py-3 font-inter text-xs tracking-wider uppercase text-gray-400">Original</th>
                        <th className="text-left px-5 py-3 font-inter text-xs tracking-wider uppercase text-gray-400">Sale Price</th>
                        <th className="text-left px-5 py-3 font-inter text-xs tracking-wider uppercase text-gray-400">Status</th>
                        <th className="text-left px-5 py-3 font-inter text-xs tracking-wider uppercase text-gray-400">End Time</th>
                        <th className="text-left px-5 py-3 font-inter text-xs tracking-wider uppercase text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flashSales.map((sale) => (
                        <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-5 py-3">
                            <p className="font-inter text-sm text-gray-800">{sale.product_name}</p>
                            <p className="font-inter text-xs text-gray-400 truncate max-w-[200px]">{sale.banner_text}</p>
                          </td>
                          <td className="px-5 py-3 font-inter text-sm text-gray-500 line-through">
                            {CURRENCY}{sale.original_price?.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 font-inter text-sm font-medium text-purple-primary">
                            {CURRENCY}{sale.discounted_price?.toLocaleString()}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-block px-2.5 py-1 rounded-full font-inter text-[10px] font-semibold tracking-wider uppercase ${
                              sale.is_active && new Date(sale.end_time) > new Date()
                                ? 'bg-purple-primary/10 text-purple-primary'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {sale.is_active && new Date(sale.end_time) > new Date() ? 'Active' : 'Expired'}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-inter text-xs text-gray-500">
                            {new Date(sale.end_time).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleFlashSale(sale.id, sale.is_active)}
                                className={`px-3 py-1.5 rounded font-inter text-xs transition-colors ${
                                  sale.is_active
                                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    : 'bg-purple-primary text-white hover:bg-purple-primary/90'
                                }`}
                              >
                                {sale.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteFlashSale(sale.id)}
                                className="p-1.5 text-rose-gold hover:bg-rose-gold/10 rounded transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Category Manager */}
        {activeTab === 'categories' && (
          <CategoryManager />
        )}

        {/* Revenue Analytics - Professional MNC Style */}
        {activeTab === 'analytics' && (
          <div>
            {/* Header with Live Indicator */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-playfair text-2xl text-purple-primary">Revenue Analytics</h1>
                <p className="font-inter text-xs text-gray-400 mt-1">Real-time business intelligence dashboard</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-inter text-xs text-green-700 font-medium">Live Data</span>
              </div>
            </div>

            {/* KPI Cards - MNC Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Today's Revenue */}
              <div className="relative overflow-hidden bg-gradient-to-br from-purple-primary to-purple-700 rounded-xl p-6 text-white shadow-lg">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <IndianRupee size={16} />
                    </div>
                    <p className="font-inter text-xs text-white/70 uppercase tracking-wider">Today's Revenue</p>
                  </div>
                  <p className="font-playfair text-3xl font-bold mb-1">{CURRENCY}{todayOrders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-inter text-xs text-white/60">{todayOrders.length} orders</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-medium">+12% vs yesterday</span>
                  </div>
                </div>
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              </div>

              {/* All-Time Revenue */}
              <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-white shadow-lg">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <TrendingUp size={16} />
                    </div>
                    <p className="font-inter text-xs text-white/70 uppercase tracking-wider">Total Revenue</p>
                  </div>
                  <p className="font-playfair text-3xl font-bold mb-1">{CURRENCY}{totalRevenue.toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-inter text-xs text-white/60">{orders.length} orders</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-medium">All time</span>
                  </div>
                </div>
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              </div>

              {/* Average Order Value */}
              <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-6 text-white shadow-lg">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Package size={16} />
                    </div>
                    <p className="font-inter text-xs text-white/70 uppercase tracking-wider">Avg Order Value</p>
                  </div>
                  <p className="font-playfair text-3xl font-bold mb-1">{CURRENCY}{orders.length > 0 ? Math.round(totalRevenue / orders.length).toLocaleString() : 0}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-inter text-xs text-white/60">Per transaction</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-medium">Industry avg</span>
                  </div>
                </div>
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              </div>
            </div>

            {/* Main Revenue Chart - Professional Style */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-inter text-lg font-semibold text-gray-800">Revenue Performance</h2>
                  <p className="font-inter text-xs text-gray-400 mt-0.5">Daily revenue trends over last 30 days</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-purple-primary rounded-full" />
                  <span className="font-inter text-xs text-gray-500">Revenue</span>
                </div>
              </div>
              
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenueMNC" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: '#9ca3af' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#9ca3af' }} 
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        fontSize: '13px',
                        padding: '12px 16px'
                      }}
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                      labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#7c3aed" 
                      strokeWidth={3} 
                      fill="url(#colorRevenueMNC)"
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#7c3aed' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 size={24} className="text-gray-400" />
                    </div>
                    <p className="font-inter text-sm text-gray-500">No revenue data available</p>
                    <p className="font-inter text-xs text-gray-400 mt-1">Orders will appear here once placed</p>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Cards Grid - MNC Style */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Sales by City */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-inter text-base font-semibold text-gray-800">Sales by City</h3>
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <MapPin size={16} className="text-blue-600" />
                  </div>
                </div>
                {cityRankings.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MapPin size={20} className="text-gray-400" />
                    </div>
                    <p className="font-inter text-sm text-gray-500">No city data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cityRankings.slice(0, 5).map((city, idx) => (
                      <div key={idx} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-inter text-xs font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-700' :
                            idx === 1 ? 'bg-gray-100 text-gray-600' :
                            idx === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-50 text-gray-500'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className="font-inter text-sm text-gray-700 font-medium">{city.city}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-inter text-sm font-semibold text-gray-800">{CURRENCY}{city.revenue.toLocaleString()}</p>
                          <p className="font-inter text-[10px] text-gray-400">{city.orders} orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Best Sellers */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-inter text-base font-semibold text-gray-800">Top Products</h3>
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <TrendingUp size={16} className="text-emerald-600" />
                  </div>
                </div>
                {bestSellers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp size={20} className="text-gray-400" />
                    </div>
                    <p className="font-inter text-sm text-gray-500">No sales data yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bestSellers.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-inter text-xs font-bold ${
                            idx === 0 ? 'bg-emerald-100 text-emerald-700' :
                            idx === 1 ? 'bg-teal-100 text-teal-700' :
                            idx === 2 ? 'bg-cyan-100 text-cyan-700' :
                            'bg-gray-50 text-gray-500'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className="font-inter text-sm text-gray-700 font-medium truncate max-w-[120px]">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-inter text-sm font-semibold text-emerald-600">{item.sold} units</p>
                          <p className="font-inter text-[10px] text-gray-400">{CURRENCY}{item.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Slow Moving Stock */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-inter text-base font-semibold text-gray-800">Inventory Alert</h3>
                  <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                    <Clock size={16} className="text-rose-500" />
                  </div>
                </div>
                {slowMovingStock.length === 0 ? (
                  <p className="font-inter text-sm text-gray-400">All products are selling well!</p>
                ) : (
                  <div className="space-y-3">
                    {slowMovingStock.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt={item.name} className="w-8 h-10 object-cover rounded-sm bg-gray-100" />
                          <span className="font-inter text-sm text-gray-700 truncate max-w-[100px]">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-inter text-sm font-medium text-rose-gold">{item.sold} sold</p>
                          <p className="font-inter text-[10px] text-gray-400">{item.stockCount} in stock</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <h2 className="font-playfair text-lg text-purple-primary mb-4">Most Sold Products</h2>
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              {(() => {
                const productSales = {};
                orders.forEach((o) => {
                  const raw = o._raw;
                  if (raw?.items) {
                    raw.items.forEach((item) => {
                      if (!productSales[item.name]) productSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
                      productSales[item.name].quantity += item.quantity || 1;
                      productSales[item.name].revenue += (item.price || 0) * (item.quantity || 1);
                    });
                  }
                });
                const sorted = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);
                if (sorted.length === 0) {
                  return <p className="font-inter text-sm text-gray-400">No sales data available yet.</p>;
                }
                return (
                  <div className="space-y-3">
                    {sorted.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="font-inter text-xs text-gray-400 w-6">#{idx + 1}</span>
                          <span className="font-inter text-sm text-gray-700">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-inter text-xs text-gray-500">{item.quantity} sold</span>
                          <span className="font-inter text-sm font-medium text-purple-primary">{CURRENCY}{item.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Top Customers */}
        {activeTab === 'customers' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h1 className="font-playfair text-2xl text-purple-primary">Customer Insights</h1>
              {/* Customer Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-sm font-inter text-sm outline-none focus:border-purple-primary w-full sm:w-64"
                />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['#', 'Customer', 'Orders', 'Total Spent'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-inter text-xs tracking-wider uppercase text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center font-inter text-sm text-gray-400">No customer data yet.</td></tr>
                  ) : topCustomers
                    .filter((c) =>
                      customerSearch === '' ||
                      c.name.toLowerCase().includes(customerSearch.toLowerCase())
                    )
                    .map((c, idx) => (
                    <tr key={idx} className="border-b border-gray-50">
                      <td className="px-5 py-3 font-inter text-xs text-gray-400">{idx + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-primary/10 flex items-center justify-center">
                            <span className="font-inter text-xs font-bold text-purple-primary">{c.name.charAt(0)}</span>
                          </div>
                          <span className="font-inter text-sm text-gray-700">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-inter text-sm text-gray-500">{c.orders}</td>
                      <td className="px-5 py-3 font-inter text-sm font-medium text-purple-primary">{CURRENCY}{c.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Banner Manager */}
        {activeTab === 'banners' && (
          <div>
            <h1 className="font-playfair text-2xl text-purple-primary mb-6">Banner Manager</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-100 p-6">
                <h3 className="font-playfair text-lg text-purple-primary mb-4 flex items-center gap-2">
                  <Image size={18} className="text-rose-gold" /> Hero Section
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block font-inter text-xs text-gray-500 mb-1">Hero Image URL</label>
                    <input
                      type="url"
                      value={bannerSettings.heroImage}
                      onChange={(e) => setBannerSettings({ ...bannerSettings, heroImage: e.target.value })}
                      placeholder="https://example.com/hero.jpg"
                      className="w-full border border-gray-200 px-3 py-2 font-inter text-sm outline-none focus:border-purple-primary rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-inter text-xs text-gray-500 mb-1">Hero Title</label>
                    <input
                      value={bannerSettings.heroTitle}
                      onChange={(e) => setBannerSettings({ ...bannerSettings, heroTitle: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-2 font-inter text-sm outline-none focus:border-purple-primary rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-inter text-xs text-gray-500 mb-1">Hero Subtitle</label>
                    <input
                      value={bannerSettings.heroSubtitle}
                      onChange={(e) => setBannerSettings({ ...bannerSettings, heroSubtitle: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-2 font-inter text-sm outline-none focus:border-purple-primary rounded-sm"
                    />
                  </div>
                  {bannerSettings.heroImage && (
                    <div className="mt-3">
                      <p className="font-inter text-[10px] uppercase tracking-wider text-gray-400 mb-2">Preview</p>
                      <div className="aspect-video bg-gray-100 rounded-sm overflow-hidden">
                        <img src={bannerSettings.heroImage} alt="Hero preview" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-100 p-6">
                <h3 className="font-playfair text-lg text-purple-primary mb-4 flex items-center gap-2">
                  <Timer size={18} className="text-rose-gold" /> Flash Sale Banner
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block font-inter text-xs text-gray-500 mb-1">Flash Sale Text</label>
                    <input
                      value={bannerSettings.flashText}
                      onChange={(e) => setBannerSettings({ ...bannerSettings, flashText: e.target.value })}
                      placeholder="e.g. 🔥 Flat 30% off on all Silk Sarees!"
                      className="w-full border border-gray-200 px-3 py-2 font-inter text-sm outline-none focus:border-purple-primary rounded-sm"
                    />
                  </div>
                  {bannerSettings.flashText && (
                    <div className="bg-rose-gold/10 border border-rose-gold/20 rounded-sm p-4 text-center">
                      <p className="font-playfair text-lg text-rose-gold">{bannerSettings.flashText}</p>
                    </div>
                  )}
                  <p className="font-inter text-[10px] text-gray-400">In production, saving will update the Supabase <code>settings</code> table and reflect on the live storefront.</p>
                  <button className="btn-primary text-xs px-5 py-2">Save Banner Settings</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Center */}
        {activeTab === 'notifications' && (
          <div>
            <h1 className="font-playfair text-2xl text-purple-primary mb-6">Alerts & Notifications</h1>

            {/* New Order Alerts */}
            <h2 className="font-playfair text-lg text-purple-primary mb-3 flex items-center gap-2">
              <ShoppingCart size={16} className="text-rose-gold" /> New Orders
              {newUnaccepted > 0 && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{newUnaccepted}</span>}
            </h2>
            {newUnaccepted === 0 ? (
              <div className="bg-white rounded-lg border border-gray-100 p-6 text-center mb-8">
                <CheckCircle size={32} className="mx-auto text-purple-primary/30 mb-2" strokeWidth={1} />
                <p className="font-inter text-sm text-gray-400">No new orders waiting for acceptance.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {orders.filter((o) => ['confirmed', 'pending', 'paid'].includes(o.status)).map((order) => (
                  <div key={order.id} className="bg-white rounded-lg border border-amber-200 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                        <AlertCircle size={18} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="font-inter text-sm font-medium text-gray-700">New order from <span className="text-purple-primary">{order.customer}</span></p>
                        <p className="font-inter text-xs text-gray-400">{order.id} · {CURRENCY}{order.total.toLocaleString()} · {order.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleStatusChange(order.id, 'Packed')} className="btn-primary text-xs px-4 py-2">Accept</button>
                      <button onClick={() => navigate(`/admin/order/${order.id}`)} className="text-gray-400 hover:text-purple-primary transition-colors"><Eye size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Abandoned Cart Alerts */}
            <h2 className="font-playfair text-lg text-purple-primary mb-3 flex items-center gap-2">
              <ShoppingCart size={16} className="text-rose-gold" /> Abandoned Carts
              {abandonedCarts.filter((c) => !c.reminder_sent).length > 0 && (
                <span className="bg-rose-gold/10 text-rose-gold text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {abandonedCarts.filter((c) => !c.reminder_sent).length} new
                </span>
              )}
            </h2>
            {abandonedCarts.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-100 p-6 text-center mb-8">
                <CheckCircle size={32} className="mx-auto text-purple-primary/30 mb-2" strokeWidth={1} />
                <p className="font-inter text-sm text-gray-400">No abandoned carts detected.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {abandonedCarts.map((cart) => {
                  const minutesAgo = Math.round((Date.now() - new Date(cart.updated_at).getTime()) / 60000);
                  const timeLabel = minutesAgo < 60 ? `${minutesAgo}m ago` : minutesAgo < 1440 ? `${Math.round(minutesAgo / 60)}h ago` : `${Math.round(minutesAgo / 1440)}d ago`;
                  return (
                    <div key={cart.id} className={`bg-white rounded-lg border p-5 flex items-center justify-between ${cart.reminder_sent ? 'border-gray-100' : 'border-rose-gold/30'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cart.reminder_sent ? 'bg-gray-100' : 'bg-rose-gold/10'}`}>
                          <ShoppingCart size={18} className={cart.reminder_sent ? 'text-gray-400' : 'text-rose-gold'} />
                        </div>
                        <div>
                          <p className="font-inter text-sm font-medium text-gray-700">
                            {cart.user_name || cart.user_email || 'Anonymous'}
                            {cart.reminder_sent && <span className="ml-2 text-[10px] text-purple-primary font-medium">Reminder sent</span>}
                          </p>
                          <p className="font-inter text-xs text-gray-400">
                            {cart.items?.length || 0} items · {CURRENCY}{(cart.total || 0).toLocaleString()} · {timeLabel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!cart.reminder_sent && (
                          <button
                            onClick={() => handleSendReminder(cart)}
                            disabled={reminderSending[cart.id]}
                            className="flex items-center gap-1.5 bg-rose-gold text-white font-inter text-xs px-4 py-2 rounded-sm hover:bg-rose-gold/90 transition-colors disabled:opacity-50"
                          >
                            <Send size={12} />
                            {reminderSending[cart.id] ? 'Sending...' : 'Send Reminder'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="bg-cream border border-gray-100 rounded-sm p-4 mt-2">
                  <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-1">Reminder Template</p>
                  <p className="font-inter text-xs text-gray-600 italic">"Hi [Name], your favorite saree is waiting! Complete your purchase now and get a special surprise."</p>
                </div>
              </div>
            )}

            {/* Low Stock Alerts */}
            {lowStockProducts.length > 0 && (
              <>
                <h2 className="font-playfair text-lg text-purple-primary mb-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500" /> Low Stock Alerts
                  <span className="bg-red-50 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{lowStockProducts.length}</span>
                </h2>
                <div className="bg-white rounded-lg border border-red-100 overflow-hidden">
                  {lowStockProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-8 h-10 object-cover rounded-sm bg-gray-100" />
                        <div>
                          <p className="font-inter text-sm text-gray-700">{p.name}</p>
                          <p className="font-inter text-[10px] text-gray-400">{p.category}</p>
                        </div>
                      </div>
                      <span className="font-inter text-sm font-bold text-red-500">{p.stockCount} left</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Hero Banner Manager */}
        {activeTab === 'hero-banners' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h1 className="font-playfair text-2xl text-purple-primary">Hero Banner Manager</h1>
                <p className="font-inter text-sm text-gray-500 mt-1">
                  Manage home page carousel banners
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchHeroBanners}
                  disabled={heroBannerLoading}
                  className="flex items-center gap-2 bg-purple-primary text-white font-inter text-xs px-4 py-2 rounded-sm hover:bg-purple-primary/90 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={heroBannerLoading ? 'animate-spin' : ''} />
                  {heroBannerLoading ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={() => {
                    resetBannerForm();
                    setShowBannerModal(true);
                  }}
                  className="flex items-center gap-2 bg-green-600 text-white font-inter text-xs px-4 py-2 rounded-sm hover:bg-green-700 transition-colors"
                >
                  <Plus size={14} />
                  Add Banner
                </button>
              </div>
            </div>

            {/* Banner Grid */}
            {heroBanners.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
                <Plus size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="font-inter text-gray-500">No banners found</p>
                <p className="font-inter text-xs text-gray-400 mt-2">Create your first hero banner</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {heroBanners.map((banner, index) => (
                  <div key={banner.id} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                    {/* Banner Preview */}
                    <div className="relative h-40 bg-gray-100">
                      <img
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/600x400/f3f4f6/9ca3af?text=No+Image';
                        }}
                      />
                      <div className="absolute top-2 left-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm ${banner.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                          {banner.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <span className="text-xs font-bold bg-black/50 text-white px-2 py-1 rounded-sm">
                          #{banner.sort_order || index + 1}
                        </span>
                      </div>
                    </div>

                    {/* Banner Info */}
                    <div className="p-4">
                      <h3 className="font-inter text-sm font-semibold text-gray-800 mb-1 line-clamp-1">
                        {banner.title}
                      </h3>
                      <p className="font-inter text-xs text-gray-500 mb-3 line-clamp-1">
                        {banner.subtitle}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                        <span>CTA: {banner.cta}</span>
                        <span className={`w-3 h-3 rounded-full ${banner.color}`}></span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleEditBanner(banner)}
                          className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 hover:bg-blue-50 py-2 rounded-sm transition-colors"
                        >
                          <Edit3 size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleBanner(banner.id, banner.is_active)}
                          className={`flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-sm transition-colors ${banner.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                        >
                          {banner.is_active ? <><Eye size={12} /> Hide</> : <><Eye size={12} /> Show</>}
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="flex-1 flex items-center justify-center gap-1 text-xs text-red-600 hover:bg-red-50 py-2 rounded-sm transition-colors"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Top Categories Management */}
        {activeTab === 'top-categories' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-playfair text-2xl text-purple-primary uppercase tracking-tight">Top Categories</h1>
                <p className="font-inter text-xs text-gray-500 mt-1 uppercase tracking-widest">Manage your home page featured categories</p>
              </div>
              <button
                onClick={handleAddCategory}
                className="bg-purple-primary text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-purple-secondary transition-all flex items-center gap-2 shadow-lg shadow-purple-primary/20"
              >
                <Plus size={16} /> Add New Category
              </button>
            </div>

            {loadingCategories ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-purple-primary/10 border-t-purple-primary rounded-full animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Grid3X3 size={32} className="text-gray-200" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tight">No Categories Found</h3>
                <p className="text-gray-400 text-sm font-medium mb-8">Add categories to showcase them on your home page.</p>
                <button onClick={handleAddCategory} className="bg-purple-primary text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-primary/20">
                  Create First Category
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => (
                  <div key={cat.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-6 bg-gray-50 border border-gray-100">
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                      <div className="absolute top-4 right-4 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <button onClick={() => handleEditCategory(cat)} className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl text-gray-700 hover:text-purple-primary shadow-sm hover:scale-110 transition-all">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl text-gray-700 hover:text-red-500 shadow-sm hover:scale-110 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md text-purple-primary text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">
                        Display Order: {cat.display_order}
                      </div>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest leading-tight">{cat.name}</h3>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Edit Category Modal */}
            <AnimatePresence>
              {showCategoryModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCategoryModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl">
                    <div className="p-8 md:p-10">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{editingCategory ? 'Edit' : 'Add'} Category</h3>
                        <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Category Name</label>
                          <input type="text" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="e.g. Silk Sarees" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all" />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Display Order (Sorting)</label>
                          <input type="number" value={categoryForm.displayOrder} onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all" />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Category Image</label>
                          <div className="grid grid-cols-1 gap-4">
                            {catImagePreview && (
                              <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                                <img src={catImagePreview} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:border-purple-primary hover:bg-purple-light transition-all cursor-pointer group">
                              <Upload size={32} className="text-gray-300 group-hover:text-purple-primary mb-2" />
                              <span className="text-xs font-bold text-gray-400 group-hover:text-purple-primary">Click to upload image</span>
                              <input type="file" onChange={handleCatImageSelect} className="hidden" accept="image/*" />
                            </label>
                          </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                          <button onClick={() => setShowCategoryModal(false)} className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-sm font-black text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest">Cancel</button>
                          <button onClick={handleSaveCategory} disabled={saving} className="flex-1 py-4 rounded-2xl bg-purple-primary text-white text-sm font-black hover:bg-purple-secondary transition-all disabled:opacity-50 shadow-lg shadow-purple-primary/20 uppercase tracking-widest">
                            {saving ? 'Saving...' : 'Save Category'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Testimonials Management */}
        {activeTab === 'testimonials' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-playfair text-2xl text-purple-primary">Customer Testimonials</h1>
                <p className="text-sm text-gray-500 mt-1">Manage customer reviews and ratings</p>
              </div>
              <button
                onClick={() => {
                  resetTestimonialForm();
                  setShowTestimonialModal(true);
                }}
                className="flex items-center gap-2 bg-purple-primary text-white px-6 py-3 rounded-xl hover:bg-purple-secondary transition-all"
              >
                <Plus size={18} />
                <span className="font-medium">Add Testimonial</span>
              </button>
            </div>

            {testimonialsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="animate-spin text-purple-primary" size={24} />
                <span className="ml-3 text-gray-500">Loading testimonials...</span>
              </div>
            ) : testimonials.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <Star size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">No testimonials yet</p>
                <button
                  onClick={() => {
                    resetTestimonialForm();
                    setShowTestimonialModal(true);
                  }}
                  className="text-purple-primary font-medium hover:underline"
                >
                  Add your first testimonial
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className={`bg-white rounded-3xl p-6 border shadow-sm transition-all ${testimonial.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="shrink-0">
                        {testimonial.avatar ? (
                          <img 
                            src={testimonial.avatar} 
                            alt={testimonial.name} 
                            className="w-16 h-16 rounded-full object-cover border-2 border-purple-primary/20"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-primary to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                            {testimonial.name?.charAt(0)?.toUpperCase() || <User size={24} />}
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{testimonial.name}</h3>
                          {testimonial.verified && (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Verified</span>
                          )}
                          {!testimonial.is_active && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{testimonial.location || 'Customer'}</p>
                        
                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={14} 
                              className={star <= testimonial.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                            />
                          ))}
                          <span className="ml-2 text-xs text-gray-500">({testimonial.rating}/5)</span>
                        </div>
                        
                        <h4 className="font-semibold text-gray-800 mb-2 line-clamp-1">{testimonial.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-3 mb-3">{testimonial.review}</p>
                        {testimonial.product && (
                          <p className="text-xs text-purple-primary mb-3">Purchased: {testimonial.product}</p>
                        )}
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditTestimonial(testimonial)}
                            className="p-2 hover:bg-purple-light rounded-lg transition-colors"
                          >
                            <Edit3 size={16} className="text-purple-primary" />
                          </button>
                          <button
                            onClick={() => handleDeleteTestimonial(testimonial.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                          <button
                            onClick={() => handleToggleTestimonial(testimonial.id, testimonial.is_active)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${testimonial.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}
                          >
                            {testimonial.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Edit Testimonial Modal */}
            <AnimatePresence>
              {showTestimonialModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setShowTestimonialModal(false)} 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                    className="relative bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
                  >
                    <div className="p-8 md:p-10">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                          {editingTestimonial ? 'Edit' : 'Add'} Testimonial
                        </h3>
                        <button onClick={() => setShowTestimonialModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <X size={24} />
                        </button>
                      </div>

                      <form onSubmit={handleSaveTestimonial} className="space-y-6">
                        {/* Avatar Upload */}
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Customer Photo</label>
                          <div className="flex items-center gap-4">
                            <div className="shrink-0">
                              {testimonialAvatarPreview ? (
                                <img src={testimonialAvatarPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-purple-primary" />
                              ) : testimonialForm.avatar ? (
                                <img src={testimonialForm.avatar} alt="Current" className="w-20 h-20 rounded-full object-cover border-2 border-purple-primary" />
                              ) : (
                                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                  <User size={32} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-purple-primary hover:bg-purple-light transition-all cursor-pointer group">
                                <Upload size={20} className="text-gray-300 group-hover:text-purple-primary mb-1" />
                                <span className="text-xs font-bold text-gray-400 group-hover:text-purple-primary">Upload Photo</span>
                                <input type="file" onChange={handleTestimonialAvatarSelect} className="hidden" accept="image/*" />
                              </label>
                              {uploadingTestimonialAvatar && (
                                <p className="text-xs text-purple-primary mt-2 flex items-center gap-1">
                                  <RefreshCw size={12} className="animate-spin" /> Uploading...
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Name */}
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Customer Name *</label>
                          <input 
                            type="text" 
                            value={testimonialForm.name} 
                            onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })} 
                            placeholder="e.g. Priya Sharma"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all"
                            required
                          />
                        </div>

                        {/* Location */}
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Location</label>
                          <input 
                            type="text" 
                            value={testimonialForm.location} 
                            onChange={(e) => setTestimonialForm({ ...testimonialForm, location: e.target.value })} 
                            placeholder="e.g. Mumbai, India"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all"
                          />
                        </div>

                        {/* Rating */}
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rating (1-5) *</label>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setTestimonialForm({ ...testimonialForm, rating: star })}
                                className="focus:outline-none"
                              >
                                <Star 
                                  size={28} 
                                  className={star <= testimonialForm.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                                />
                              </button>
                            ))}
                            <span className="ml-2 text-sm font-bold text-gray-700">{testimonialForm.rating} / 5</span>
                          </div>
                        </div>

                        {/* Title */}
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Review Title *</label>
                          <input 
                            type="text" 
                            value={testimonialForm.title} 
                            onChange={(e) => setTestimonialForm({ ...testimonialForm, title: e.target.value })} 
                            placeholder="e.g. Amazing quality saree!"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all"
                            required
                          />
                        </div>

                        {/* Review */}
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Review Text *</label>
                          <textarea 
                            value={testimonialForm.review} 
                            onChange={(e) => setTestimonialForm({ ...testimonialForm, review: e.target.value })} 
                            placeholder="Write the customer review here..."
                            rows={4}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all resize-none"
                            required
                          />
                        </div>

                        {/* Product */}
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Product Purchased</label>
                          <input 
                            type="text" 
                            value={testimonialForm.product} 
                            onChange={(e) => setTestimonialForm({ ...testimonialForm, product: e.target.value })} 
                            placeholder="e.g. Banarasi Silk Saree"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all"
                          />
                        </div>

                        {/* Sort Order */}
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Display Order</label>
                          <input 
                            type="number" 
                            value={testimonialForm.sort_order} 
                            onChange={(e) => setTestimonialForm({ ...testimonialForm, sort_order: parseInt(e.target.value) || 0 })} 
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all"
                          />
                        </div>

                        {/* Status Toggles */}
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={testimonialForm.is_active}
                              onChange={(e) => setTestimonialForm({ ...testimonialForm, is_active: e.target.checked })}
                              className="w-5 h-5 accent-purple-primary"
                            />
                            <span className="text-sm font-medium text-gray-700">Active</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={testimonialForm.verified}
                              onChange={(e) => setTestimonialForm({ ...testimonialForm, verified: e.target.checked })}
                              className="w-5 h-5 accent-purple-primary"
                            />
                            <span className="text-sm font-medium text-gray-700">Verified Purchase</span>
                          </label>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 flex gap-4">
                          <button 
                            type="button"
                            onClick={() => setShowTestimonialModal(false)} 
                            className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-sm font-black text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            disabled={savingTestimonial} 
                            className="flex-1 py-4 rounded-2xl bg-purple-primary text-white text-sm font-black hover:bg-purple-secondary transition-all disabled:opacity-50 shadow-lg shadow-purple-primary/20 uppercase tracking-widest"
                          >
                            {savingTestimonial ? 'Saving...' : (editingTestimonial ? 'Update' : 'Create')}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Coupons Management */}
        {activeTab === 'coupons' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-playfair text-2xl text-purple-primary">Coupon Management</h1>
                <p className="text-sm text-gray-500 mt-1">Create and manage discount coupons</p>
              </div>
              <button
                onClick={() => {
                  resetCouponForm();
                  setShowCouponModal(true);
                }}
                className="flex items-center gap-2 bg-purple-primary text-white px-6 py-3 rounded-xl font-inter text-sm font-bold hover:bg-purple-primary/90 transition-colors shadow-lg shadow-purple-primary/20"
              >
                <Plus size={18} />
                Create Coupon
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-5 border border-purple-100">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">Total Coupons</p>
                <p className="text-2xl font-black text-purple-primary mt-1">{coupons.length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-5 border border-green-100">
                <p className="text-xs font-bold text-green-400 uppercase tracking-wider">Active</p>
                <p className="text-2xl font-black text-green-600 mt-1">{coupons.filter(c => c.is_active).length}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-5 border border-amber-100">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Total Used</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{coupons.reduce((sum, c) => sum + (c.used_count || 0), 0)}</p>
              </div>
            </div>

            {/* Coupons Table */}
            {couponsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="animate-spin text-purple-primary" size={24} />
                <span className="ml-3 text-gray-500">Loading coupons...</span>
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <Ticket size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">No coupons yet</p>
                <button
                  onClick={() => {
                    resetCouponForm();
                    setShowCouponModal(true);
                  }}
                  className="bg-purple-primary text-white px-6 py-2 rounded-lg font-inter text-sm font-bold hover:bg-purple-primary/90 transition-colors"
                >
                  Create First Coupon
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Code</th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Discount</th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Usage</th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Expiry</th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="text-right px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {coupons.map((coupon) => (
                        <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-purple-primary bg-purple-50 px-3 py-1 rounded-lg">
                              {coupon.code}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-gray-900">{coupon.discount_percent}% OFF</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                                  style={{ width: `${Math.min((coupon.used_count / coupon.usage_limit) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-600">
                                {coupon.used_count} / {coupon.usage_limit}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-medium ${new Date(coupon.expiry_date) < new Date() ? 'text-red-500' : 'text-gray-600'}`}>
                              {new Date(coupon.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleCoupon(coupon.id, coupon.is_active)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                coupon.is_active 
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              {coupon.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingCoupon(coupon);
                                  setCouponForm({
                                    code: coupon.code,
                                    discount_percent: coupon.discount_percent,
                                    usage_limit: coupon.usage_limit,
                                    expiry_date: coupon.expiry_date?.split('T')[0] || '',
                                    is_active: coupon.is_active
                                  });
                                  setShowCouponModal(true);
                                }}
                                className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                              >
                                <Edit3 size={16} className="text-purple-primary" />
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} className="text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Create/Edit Coupon Modal */}
            <AnimatePresence>
              {showCouponModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowCouponModal(false)}
                    className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="font-playfair text-xl text-purple-primary">
                          {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
                        </h2>
                        <button onClick={() => setShowCouponModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <X size={20} className="text-gray-400" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveCoupon} className="space-y-5">
                        {/* Code */}
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Coupon Code *</label>
                          <input
                            type="text"
                            value={couponForm.code}
                            onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                            placeholder="e.g. LITTLE10"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all uppercase"
                            required
                          />
                        </div>

                        {/* Discount & Usage */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Discount % *</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={couponForm.discount_percent}
                              onChange={(e) => setCouponForm({ ...couponForm, discount_percent: parseInt(e.target.value) || 0 })}
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Usage Limit *</label>
                            <input
                              type="number"
                              min="1"
                              value={couponForm.usage_limit}
                              onChange={(e) => setCouponForm({ ...couponForm, usage_limit: parseInt(e.target.value) || 0 })}
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all"
                              required
                            />
                          </div>
                        </div>

                        {/* Expiry Date */}
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Expiry Date *</label>
                          <input
                            type="date"
                            value={couponForm.expiry_date}
                            onChange={(e) => setCouponForm({ ...couponForm, expiry_date: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all"
                            required
                          />
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="coupon-active"
                            checked={couponForm.is_active}
                            onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                            className="w-5 h-5 accent-purple-primary rounded"
                          />
                          <label htmlFor="coupon-active" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Active (immediately available)
                          </label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowCouponModal(false)}
                            className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-wider"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={savingCoupon}
                            className="flex-1 py-3 rounded-xl bg-purple-primary text-white text-sm font-bold hover:bg-purple-primary/90 transition-all disabled:opacity-50 uppercase tracking-wider"
                          >
                            {savingCoupon ? 'Saving...' : (editingCoupon ? 'Update' : 'Create')}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Marketing Tools */}
        {activeTab === 'marketing' && (
          <div>
            <h1 className="font-playfair text-2xl text-purple-primary mb-6">Marketing Tools</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Abandoned Carts */}
              <div className="bg-white rounded-lg border border-gray-100 p-6">
                <h3 className="font-playfair text-lg text-purple-primary mb-4 flex items-center gap-2">
                  <ShoppingCart size={18} /> Abandoned Carts
                </h3>
                {abandonedCarts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle size={32} className="mx-auto text-purple-primary/30 mb-2" strokeWidth={1} />
                    <p className="font-inter text-sm text-gray-400">No abandoned carts detected.</p>
                    <p className="font-inter text-xs text-gray-400 mt-1">Carts appear here after 1 hour of inactivity.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {abandonedCarts.map((cart) => (
                      <div key={cart.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="font-inter text-sm text-gray-700">
                            {cart.user_name || cart.user_email?.split('@')[0] || 'Customer'}
                          </p>
                          <p className="font-inter text-xs text-purple-secondary">{cart.user_email}</p>
                          <p className="font-inter text-xs text-gray-400">
                            {cart.total_items} items — {CURRENCY}{cart.total?.toLocaleString()} — {cart.time_elapsed}
                          </p>
                        </div>
                        <button
                          onClick={() => handleSendReminder(cart)}
                          disabled={cart.reminder_sent || reminderSending[cart.id]}
                          className={`font-inter text-xs px-3 py-1.5 rounded-sm transition-colors ${
                            cart.reminder_sent
                              ? 'bg-purple-primary/10 text-purple-primary cursor-default'
                              : 'bg-rose-gold text-white hover:bg-rose-gold/90'
                          }`}
                        >
                          {reminderSending[cart.id] ? 'Sending...' : cart.reminder_sent ? 'Sent' : 'Send Reminder'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Sales Pop-up */}
              <div className="bg-white rounded-lg border border-gray-100 p-6">
                <h3 className="font-playfair text-lg text-purple-primary mb-4 flex items-center gap-2">
                  <Bell size={18} /> Live Sales Pop-up
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-inter text-sm text-gray-600 italic">
                      "Someone from <strong>{salesPopup.city}</strong> just bought <strong>{salesPopup.product}</strong>"
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-inter text-xs text-gray-500 mb-1">City</label>
                      <input
                        value={salesPopup.city}
                        onChange={(e) => setSalesPopup({ ...salesPopup, city: e.target.value })}
                        className="w-full border border-gray-200 px-3 py-2 font-inter text-sm outline-none focus:border-purple-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-xs text-gray-500 mb-1">Product</label>
                      <input
                        value={salesPopup.product}
                        onChange={(e) => setSalesPopup({ ...salesPopup, product: e.target.value })}
                        className="w-full border border-gray-200 px-3 py-2 font-inter text-sm outline-none focus:border-purple-primary"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setSalesPopup({ ...salesPopup, active: !salesPopup.active })}
                    className={`font-inter text-xs px-4 py-2 rounded ${salesPopup.active ? 'bg-rose-gold text-white' : 'btn-primary'}`}
                  >
                    {salesPopup.active ? 'Disable Pop-up' : 'Enable Pop-up'}
                  </button>
                </div>
              </div>

              {/* Flash Sale Countdown */}
              <div className="bg-white rounded-lg border border-gray-100 p-6 lg:col-span-2">
                <h3 className="font-playfair text-lg text-purple-primary mb-4 flex items-center gap-2">
                  <Timer size={18} /> Flash Sale Countdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-inter text-xs text-gray-500 mb-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={flashSale.endsAt}
                      onChange={(e) => {
                        const newFlashSale = { ...flashSale, endsAt: e.target.value };
                        setFlashSale(newFlashSale);
                        localStorage.setItem('flashSale', JSON.stringify(newFlashSale));
                      }}
                      className="w-full border border-gray-200 px-3 py-2 font-inter text-sm outline-none focus:border-purple-primary rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-inter text-xs text-gray-500 mb-1">Discount %</label>
                    <input
                      type="number"
                      value={flashSale.discount}
                      onChange={(e) => {
                        const newFlashSale = { ...flashSale, discount: e.target.value };
                        setFlashSale(newFlashSale);
                        localStorage.setItem('flashSale', JSON.stringify(newFlashSale));
                      }}
                      className="w-full border border-gray-200 px-3 py-2 font-inter text-sm outline-none focus:border-purple-primary rounded-sm"
                      placeholder="e.g. 20"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        const newFlashSale = { ...flashSale, active: !flashSale.active };
                        setFlashSale(newFlashSale);
                        localStorage.setItem('flashSale', JSON.stringify(newFlashSale));
                        console.log(`[Flash Sale] ${newFlashSale.active ? 'Started' : 'Ended'} - Discount: ${newFlashSale.discount}%, Ends: ${newFlashSale.endsAt}`);
                      }}
                      className={`font-inter text-xs px-6 py-2.5 rounded-sm transition-colors ${
                        flashSale.active
                          ? 'bg-rose-gold text-white hover:bg-rose-gold/90'
                          : 'bg-purple-primary text-white hover:bg-purple-primary/90'
                      }`}
                    >
                      {flashSale.active ? 'End Sale' : 'Start Flash Sale'}
                    </button>
                  </div>
                </div>
                {flashSale.active && (
                  <div className="mt-4 p-3 bg-purple-primary/10 border border-purple-primary/20 rounded-sm">
                    <p className="font-inter text-xs text-purple-primary">
                      <span className="font-semibold">Flash Sale is ACTIVE</span> — {flashSale.discount}% off until {new Date(flashSale.endsAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Product Modal */}
        <AnimatePresence>
          {showProductModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setShowProductModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="font-playfair text-xl text-purple-primary">Add New Product</h2>
                    <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {/* Product Name */}
                  <div>
                    <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Product Name *</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary"
                      placeholder="e.g., Silk Banarasi Saree"
                    />
                  </div>

                  {/* Price Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Price (₹) *</label>
                      <input
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary"
                        placeholder="4999"
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Original Price (₹)</label>
                      <input
                        type="number"
                        value={newProduct.originalPrice}
                        onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary"
                        placeholder="5999"
                      />
                    </div>
                  </div>

                  {/* Category + Stock */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Category *</label>
                      <select
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary bg-white"
                      >
                        <option value="">Select Category</option>
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Stock Count</label>
                      <input
                        type="number"
                        value={newProduct.stockCount}
                        onChange={(e) => setNewProduct({ ...newProduct, stockCount: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary"
                        placeholder="10"
                      />
                    </div>
                  </div>

                  {/* Category-Specific Fields */}
                  {getCategoryFields().length > 0 && (
                    <div className="border border-dashed border-purple-primary/30 rounded-sm p-4 bg-purple-primary/5">
                      <p className="font-inter text-[10px] tracking-wider uppercase text-purple-primary mb-3 font-medium">
                        {newProduct.category} Details
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        {getCategoryFields().map((field) => (
                          <div key={field}>
                            <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">
                              {FIELD_LABELS[field] || field}
                            </label>
                            <input
                              type="text"
                              value={newProduct[field] || ''}
                              onChange={(e) => setNewProduct({ ...newProduct, [field]: e.target.value })}
                              className="w-full border border-gray-200 px-4 py-2.5 font-inter text-sm outline-none focus:border-purple-primary bg-white"
                              placeholder={`Enter ${(FIELD_LABELS[field] || field).toLowerCase()}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Badge */}
                  <div>
                    <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Badge</label>
                    <select
                      value={newProduct.badge}
                      onChange={(e) => setNewProduct({ ...newProduct, badge: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary bg-white"
                    >
                      <option value="">No Badge</option>
                      <option value="New">New Arrival</option>
                      <option value="Sale">Sale</option>
                      <option value="Bestseller">Bestseller</option>
                    </select>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Product Image</label>
                    <div className="flex gap-4 items-start">
                      <label className="flex-1 border-2 border-dashed border-gray-200 rounded-sm p-4 text-center cursor-pointer hover:border-purple-primary/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <Upload size={24} className="mx-auto text-gray-300 mb-2" />
                        <p className="font-inter text-xs text-gray-400">
                          {imageFile ? imageFile.name : 'Click to upload high-res image'}
                        </p>
                        <p className="font-inter text-[10px] text-gray-300 mt-1">JPG, PNG, WebP</p>
                      </label>
                      {imagePreview && (
                        <div className="w-20 h-24 rounded-sm overflow-hidden border border-gray-200 flex-shrink-0">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="font-inter text-[10px] text-gray-400 mb-1">Or paste an image URL:</p>
                      <input
                        type="url"
                        value={newProduct.image}
                        onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-2 font-inter text-xs outline-none focus:border-purple-primary"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>

                  {/* Description with AI Generate */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block font-inter text-xs tracking-wider uppercase text-gray-500">Description</label>
                      <button
                        onClick={handleGenerateDescription}
                        disabled={!newProduct.name || !newProduct.category || saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-md hover:from-purple-700 hover:to-purple-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} />
                            AI Generate
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary h-24 resize-none"
                      placeholder="Product description... (Click AI Generate to auto-create based on name & category)"
                    />
                  </div>
                </div>
                <div className="p-6 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="flex-1 py-3 border border-gray-200 font-inter text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProduct}
                    disabled={!newProduct.name || !newProduct.price || !newProduct.category || saving}
                    className="flex-1 py-3 bg-purple-primary text-white font-inter text-sm hover:bg-emerald-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save Product'
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Import Modal */}
        <BulkImportModal
          isOpen={showBulkImport}
          onClose={() => setShowBulkImport(false)}
          onImportComplete={async () => {
            const { data } = await getAllProductsAdmin();
            if (data && data.length > 0) {
              setProducts(data);
            }
          }}
        />

        {/* Order Detail Modal - Professional Invoice Style */}
        <AnimatePresence>
          {showOrderDetail && selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
              onClick={() => setShowOrderDetail(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-none max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Invoice Header */}
                <div className="bg-gray-900 text-white p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">LITTLE SHOP</h1>
                      <p className="text-gray-400 text-sm mt-1">Premium Fashion & Accessories</p>
                      <p className="text-gray-500 text-xs mt-0.5">Dharapuram, Tamil Nadu</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-white/10 px-4 py-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Tax Invoice</p>
                        <p className="text-lg font-bold">{selectedOrder.id}</p>
                      </div>
                      <p className="text-gray-400 text-xs mt-2">GST: 33EJJPA8233H1ZD</p>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowOrderDetail(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>

                <div className="p-6 space-y-6">
                  {/* Bill To / Ship To */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="border-l-4 border-gray-900 pl-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
                      <p className="font-semibold text-gray-900">{selectedOrder._raw?.customer?.name || selectedOrder.customer}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedOrder._raw?.customer?.email || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{selectedOrder._raw?.customer?.phone || selectedOrder.phone}</p>
                    </div>
                    <div className="border-l-4 border-gray-300 pl-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ship To</p>
                      <p className="text-sm text-gray-700">{selectedOrder._raw?.shipping?.address || 'No address available'}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedOrder._raw?.shipping?.city}, {selectedOrder._raw?.shipping?.state} - {selectedOrder._raw?.shipping?.pincode}
                      </p>
                    </div>
                  </div>

                  {/* Order Meta */}
                  <div className="flex gap-6 text-sm border-y border-gray-200 py-3">
                    <div>
                      <span className="text-gray-500">Order Date:</span>
                      <span className="ml-2 font-medium">{selectedOrder.date}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs font-medium ${
                        selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                        selectedOrder.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                        selectedOrder.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{selectedOrder.status}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Payment:</span>
                      <span className={`ml-2 ${selectedOrder._raw?.payment?.razorpay_payment_id ? 'text-green-600' : 'text-orange-600'}`}>
                        {selectedOrder._raw?.payment?.razorpay_payment_id ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th className="text-left py-3 px-3 font-semibold text-gray-700">Item</th>
                          <th className="text-center py-3 px-3 font-semibold text-gray-700 w-20">Qty</th>
                          <th className="text-right py-3 px-3 font-semibold text-gray-700 w-28">Price</th>
                          <th className="text-right py-3 px-3 font-semibold text-gray-700 w-28">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedOrder._raw?.items || []).map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 flex items-center justify-center">
                                  <Package size={16} className="text-gray-400" />
                                </div>
                                <span className="font-medium text-gray-800">{item.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">{item.quantity}</td>
                            <td className="py-3 px-3 text-right">{CURRENCY}{item.price.toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-medium">{CURRENCY}{(item.price * item.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span>{CURRENCY}{(selectedOrder._raw?.subtotal || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className={selectedOrder._raw?.shipping === 0 ? 'text-green-600 font-medium' : ''}>
                          {selectedOrder._raw?.shipping === 0 ? 'FREE' : CURRENCY + (selectedOrder._raw?.shipping || 0)}
                        </span>
                      </div>
                      <div className="border-t-2 border-gray-900 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="font-bold text-gray-900 text-lg">Total</span>
                          <span className="font-bold text-gray-900 text-lg">{CURRENCY}{selectedOrder.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Note */}
                  <div className="bg-gray-50 p-4 text-center text-xs text-gray-500">
                    <p>No Returns / No Exchanges — All Sales Final</p>
                    <p className="mt-1">Thank you for shopping with Little Shop!</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 border-t border-gray-200 flex gap-3 bg-gray-50">
                  <button
                    onClick={() => generateInvoice(selectedOrder)}
                    className="flex-1 py-3 bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Download PDF Invoice
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium text-sm hover:bg-white transition-colors"
                  >
                    Print
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Product Modal */}
        <AnimatePresence>
          {showEditModal && editingProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-playfair text-xl text-purple-primary">Edit Product</h3>
                  <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Product Name</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Price (₹)</label>
                      <input
                        type="number"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Original Price</label>
                      <input
                        type="number"
                        value={editingProduct.originalPrice || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Stock Count</label>
                      <input
                        type="number"
                        value={editingProduct.stockCount}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stockCount: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Category</label>
                      <select
                        value={editingProduct.category}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full border border-gray-200 px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary bg-white"
                      >
                        <option value="">Select Category</option>
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Badge</label>
                    <select
                      value={editingProduct.badge || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary bg-white"
                    >
                      <option value="">No Badge</option>
                      <option value="New">New Arrival</option>
                      <option value="Sale">Sale</option>
                      <option value="Bestseller">Bestseller</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Description</label>
                    <textarea
                      value={editingProduct.description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary h-24 resize-none"
                    />
                  </div>
                  {/* Active/Inactive Toggle */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      editingProduct.is_active !== false ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    onClick={() => setEditingProduct({ ...editingProduct, is_active: editingProduct.is_active === false ? true : false })}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                        editingProduct.is_active !== false ? 'left-[22px]' : 'left-0.5'
                      }`} />
                    </div>
                    <div>
                      <p className="font-inter text-sm font-medium text-gray-800">
                        {editingProduct.is_active !== false ? 'Product is Active' : 'Product is Hidden'}
                      </p>
                      <p className="font-inter text-xs text-gray-500">
                        {editingProduct.is_active !== false ? 'Visible to customers' : 'Hidden from customers'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 border border-gray-200 font-inter text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex-1 py-3 bg-purple-primary text-white font-inter text-sm hover:bg-emerald-900 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && deletingProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg w-full max-w-md p-6 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-rose-gold/10 flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={24} className="text-rose-gold" />
                </div>
                <h3 className="font-playfair text-xl text-purple-primary mb-2">Delete Product?</h3>
                <p className="font-inter text-sm text-gray-500 mb-6">
                  Are you sure you want to delete <strong>{deletingProduct.name}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 border border-gray-200 font-inter text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 bg-rose-gold text-white font-inter text-sm hover:bg-rose-gold/90 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Banner Modal */}
        <AnimatePresence>
          {showBannerModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setShowBannerModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h2 className="font-playfair text-lg text-purple-primary">
                      {editingBanner ? 'Edit Banner' : 'Add Banner'}
                    </h2>
                    <button
                      onClick={() => setShowBannerModal(false)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form id="banner-form" onSubmit={handleSaveBanner} className="p-4 space-y-3 overflow-y-auto flex-1">
                  {/* Image Upload */}
                  <div>
                    <label className="block font-inter text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      Banner Image *
                    </label>
                    
                    {/* File Upload Area */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerImageSelect}
                        className="hidden"
                        id="banner-image-upload"
                      />
                      <label
                        htmlFor="banner-image-upload"
                        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                          bannerImagePreview || bannerForm.image
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-purple-primary'
                        }`}
                      >
                        {uploadingBannerImage ? (
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 border-2 border-purple-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                            <span className="text-xs text-gray-500">Uploading...</span>
                          </div>
                        ) : bannerImagePreview || bannerForm.image ? (
                          <div className="flex flex-col items-center">
                            <img
                              src={bannerImagePreview || bannerForm.image}
                              alt="Preview"
                              className="w-full h-20 object-cover rounded-lg mb-2"
                            />
                            <span className="text-xs text-green-600 font-medium">✓ Image ready</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload size={24} className="text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">Click to upload image</span>
                            <span className="text-[10px] text-gray-400 mt-1">JPG, PNG, WebP (max 5MB)</span>
                          </div>
                        )}
                      </label>
                    </div>
                    
                    {/* Or URL Input */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-xs text-gray-400">OR</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    
                    <input
                      type="url"
                      value={bannerForm.image}
                      onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                      placeholder="Enter image URL directly"
                      className="w-full mt-3 px-4 py-3 border border-gray-200 rounded-xl font-inter text-sm focus:outline-none focus:border-purple-primary"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block font-inter text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      placeholder="Summer Sale"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl font-inter text-sm focus:outline-none focus:border-purple-primary"
                      required
                    />
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="block font-inter text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={bannerForm.subtitle}
                      onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                      placeholder="Up to 50% off on all products"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl font-inter text-sm focus:outline-none focus:border-purple-primary"
                    />
                  </div>

                  {/* CTA & Link */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                        Button Text
                      </label>
                      <input
                        type="text"
                        value={bannerForm.cta}
                        onChange={(e) => setBannerForm({ ...bannerForm, cta: e.target.value })}
                        placeholder="Shop Now"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl font-inter text-sm focus:outline-none focus:border-purple-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-inter text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                        Link
                      </label>
                      <input
                        type="text"
                        value={bannerForm.link}
                        onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                        placeholder="/shop"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl font-inter text-sm focus:outline-none focus:border-purple-primary"
                      />
                    </div>
                  </div>

                  {/* Color & Sort Order */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                        Color Theme
                      </label>
                      <select
                        value={bannerForm.color}
                        onChange={(e) => setBannerForm({ ...bannerForm, color: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl font-inter text-sm focus:outline-none focus:border-purple-primary"
                      >
                        <option value="bg-purple-primary">Purple</option>
                        <option value="bg-indigo-600">Indigo</option>
                        <option value="bg-pink-600">Pink</option>
                        <option value="bg-blue-600">Blue</option>
                        <option value="bg-green-600">Green</option>
                        <option value="bg-red-600">Red</option>
                        <option value="bg-amber-500">Amber</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-inter text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={bannerForm.sortOrder}
                        onChange={(e) => setBannerForm({ ...bannerForm, sortOrder: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl font-inter text-sm focus:outline-none focus:border-purple-primary"
                      />
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={bannerForm.isActive}
                      onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-purple-primary focus:ring-purple-primary"
                    />
                    <label htmlFor="isActive" className="font-inter text-sm text-gray-700">
                      Active (visible on home page)
                    </label>
                  </div>

                  {/* Preview */}
                  {bannerForm.image && (
                    <div className="mt-4">
                      <p className="font-inter text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Preview</p>
                      <div className="h-32 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={bannerForm.image}
                          alt="Banner preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/600x200/f3f4f6/9ca3af?text=Invalid+Image+URL';
                          }}
                        />
                      </div>
                    </div>
                  )}

                </form>

                {/* Sticky Buttons */}
                <div className="p-4 border-t border-gray-100 flex-shrink-0 bg-white">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowBannerModal(false)}
                      className="flex-1 py-2.5 border border-gray-200 font-inter text-sm text-gray-600 hover:bg-gray-50 transition-colors rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="banner-form"
                      disabled={savingBanner}
                      className="flex-1 py-2.5 bg-purple-primary text-white font-inter text-sm hover:bg-purple-primary/90 transition-colors rounded-xl disabled:opacity-50"
                    >
                      {savingBanner ? 'Saving...' : editingBanner ? 'Update' : 'Create'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast.show && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              className={`fixed bottom-6 left-1/2 z-50 px-6 py-3 rounded-lg shadow-lg font-inter text-sm flex items-center gap-2 ${
                toast.type === 'success'
                  ? 'bg-purple-primary text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Category Manager Component ──
function CategoryManager() {
  const [categories, setCategories] = useState(() =>
    PRODUCT_CATEGORIES.map(cat => ({
      ...cat,
      coverImage: null,
      previewUrl: null,
    }))
  );
  const [uploading, setUploading] = useState(null);
  const fileInputRefs = useRef({});

  const handleImageSelect = (catValue, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setCategories(prev =>
      prev.map(c =>
        c.value === catValue ? { ...c, coverImage: file, previewUrl } : c
      )
    );
  };

  const handleUpload = async (catValue) => {
    const cat = categories.find(c => c.value === catValue);
    if (!cat?.coverImage) return;

    setUploading(catValue);
    const { url, error } = await uploadProductImage(cat.coverImage);
    setUploading(null);

    if (error) {
      alert('Upload failed: ' + error.message);
      return;
    }

    // Save to localStorage for persistence (in production, save to Supabase)
    const savedImages = JSON.parse(localStorage.getItem('categoryImages') || '{}');
    savedImages[catValue] = url;
    localStorage.setItem('categoryImages', JSON.stringify(savedImages));

    setCategories(prev =>
      prev.map(c =>
        c.value === catValue ? { ...c, image: url, coverImage: null } : c
      )
    );
    alert(`Cover image updated for ${cat.label}`);
  };

  // Load saved images on mount
  useEffect(() => {
    const savedImages = JSON.parse(localStorage.getItem('categoryImages') || '{}');
    setCategories(prev =>
      prev.map(c => ({
        ...c,
        image: savedImages[c.value] || c.image,
      }))
    );
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-playfair text-2xl text-purple-primary">Category Manager</h1>
          <p className="font-inter text-sm text-gray-500 mt-1">Upload cover images for each category</p>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <motion.div
            key={cat.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-100 overflow-hidden"
          >
            {/* Image Preview */}
            <div className="aspect-[4/3] bg-gray-100 relative">
              {cat.previewUrl || cat.image ? (
                <img
                  src={cat.previewUrl || cat.image}
                  alt={cat.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Image size={48} strokeWidth={1} />
                </div>
              )}

              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => fileInputRefs.current[cat.value]?.click()}
                  className="flex items-center gap-2 bg-white text-gray-800 px-4 py-2 rounded-full font-inter text-sm"
                >
                  <Upload size={16} />
                  {cat.image ? 'Change' : 'Upload'}
                </button>
              </div>

              {/* Hidden File Input */}
              <input
                ref={el => fileInputRefs.current[cat.value] = el}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(cat.value, e.target.files[0])}
                className="hidden"
              />
            </div>

            {/* Category Info */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-playfair text-lg text-gray-800">{cat.label}</h3>
                <span className="font-inter text-[10px] uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  {cat.fields.length} fields
                </span>
              </div>

              <p className="font-inter text-xs text-gray-500 mb-3">
                Fields: {cat.fields.map(f => FIELD_LABELS[f] || f).join(', ')}
              </p>

              {/* Action Buttons */}
              {cat.previewUrl && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpload(cat.value)}
                    disabled={uploading === cat.value}
                    className="flex-1 bg-purple-primary text-white py-2 rounded font-inter text-xs font-medium disabled:opacity-50"
                  >
                    {uploading === cat.value ? 'Uploading...' : 'Save Image'}
                  </button>
                  <button
                    onClick={() => {
                      setCategories(prev =>
                        prev.map(c =>
                          c.value === cat.value ? { ...c, coverImage: null, previewUrl: null } : c
                        )
                      );
                    }}
                    className="px-3 py-2 border border-gray-200 rounded text-gray-500 hover:bg-gray-50"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-purple-primary/5 border border-purple-primary/20 rounded-lg p-4">
        <p className="font-inter text-sm text-purple-primary">
          <strong>Note:</strong> Cover images are stored locally for demo. In production, connect to your Supabase storage bucket.
        </p>
      </div>
    </div>
  );
}
