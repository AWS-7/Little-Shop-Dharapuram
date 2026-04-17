import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Megaphone,
  Plus, Edit3, Trash2, Eye, TrendingUp, IndianRupee, Clock,
  Truck, CheckCircle, LogOut, ChevronDown, Timer, Bell, Search,
  AlertCircle, BarChart3, Boxes, Image, Send, Mail, FileText,
  MapPin, CheckSquare, Percent, Download, X, RefreshCw, Upload,
  Grid3X3, RotateCcw, Zap, Calendar,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PLACEHOLDER_PRODUCTS, CURRENCY, ORDER_STATUSES, ADMIN_EMAIL } from '../../lib/constants';
import { getAllOrders, updateOrderStatus, subscribeToOrders } from '../../lib/orders';
import { getAbandonedCarts, markReminderSent, sendAbandonedCartReminder, subscribeToCarts } from '../../lib/carts';
import { loginWithGoogle, logoutUser, getCurrentUser, isAuthenticated, isAdmin } from '../../lib/firebaseAuth';
import {
  PRODUCT_CATEGORIES, FIELD_LABELS, uploadProductImage, createProduct,
  getAllProducts, updateProduct, deleteProduct, resolveImageUrl,
  getAllCategories, createCategory, updateCategory, deleteCategory, uploadCategoryImage
} from '../../lib/products';
import { getAggregatedRestockRequests, markRequestsAsNotified } from '../../lib/restock';
import { startOrderNotifications, stopOrderNotifications, notifyNewOrder, requestNotificationPermission } from '../../lib/notifications';
import {
  getActiveFlashSale,
  getAllFlashSales,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  toggleFlashSale,
  subscribeToFlashSales
} from '../../lib/flashSales';
import BulkImportModal from '../../components/admin/BulkImportModal';

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'inventory', label: 'Inventory', icon: Boxes },
  { key: 'restock', label: 'Restock', icon: RotateCcw },
  { key: 'flashsale', label: 'Flash Sale', icon: Zap },
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
  if (!isAuthenticated() || !isAdmin(ADMIN_EMAIL)) {
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

  // Map raw Supabase order to dashboard format
  const mapOrder = (o) => ({
    id: o.order_id || o.id,
    customer: o.customer?.name || 'Unknown',
    email: o.customer?.email || '',
    total: o.total || 0,
    status: o.status || 'Ordered',
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
    // Replace state with real data (or keep demo if no real orders)
    if (data && data.length > 0) {
      setOrders(data.map(mapOrder));
    }
  }, []);

  // Manual refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    const { data } = await getAbandonedCarts();
    setAbandonedCarts(data || []);
    // Refresh products too (getAllProducts already maps image_url to image)
    const { data: productsData } = await getAllProducts();
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
    setSavingFlashSale(true);
    const { data, error } = await createFlashSale({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
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
    return () => channel.unsubscribe();
  }, [fetchOrders, playNotificationSound]);

  // Start order push notifications for admin
  useEffect(() => {
    // Request permission on mount
    requestNotificationPermission().then(granted => {
      if (granted) console.log('Notification permission granted');
    });

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

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      const { data: productsData } = await getAllProducts();
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
    await logoutUser();
    window.location.href = '/admin';
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
      alert('Demo products cannot be updated. Please create a new product or edit a product from the database.');
      return;
    }
    
    setSavingInventory((prev) => ({ ...prev, [productId]: true }));
    const updates = {};
    if (edits.price !== undefined) updates.price = parseFloat(edits.price);
    if (edits.stockCount !== undefined) updates.stock_count = parseInt(edits.stockCount);
    const { error } = await updateProduct(productId, updates);
    if (error) {
      showToast(`Failed to update inventory: ${error.message}`, 'error');
    } else {
      // Update local state
      setProducts(products.map((p) => (p.id === productId ? { ...p, ...edits, inStock: (edits.stockCount || p.stockCount) > 0 } : p)));
      setInventoryEdits((prev) => ({ ...prev, [productId]: undefined }));
      showToast('Inventory updated successfully!', 'success');
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

  // PDF Invoice Generator
  const generateInvoice = (order) => {
    const doc = new jsPDF();
    const raw = order._raw || {};
    const customer = raw.customer || {};
    const items = raw.items || [];

    // Header
    doc.setFontSize(20);
    doc.setTextColor(6, 78, 59); // purple-primary
    doc.text('Little Shop', 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Luxury Saree Boutique', 20, 28);
    doc.text('Invoice', 160, 20);

    // Order Details
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Order ID: ${order.id}`, 20, 45);
    doc.text(`Date: ${order.date}`, 20, 52);
    doc.text(`Status: ${order.status}`, 20, 59);

    // Customer Details
    doc.text('Bill To:', 130, 45);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(customer.name || order.customer || 'N/A', 130, 52);
    doc.text(customer.email || order.email || '', 130, 59);
    // Removed per "No phone number required" rule
    // doc.text(customer.phone || order.phone || '', 130, 66);

    // Items Table
    const tableData = items.map((item) => [
      item.name,
      item.quantity.toString(),
      `₹${(item.price || 0).toLocaleString()}`,
      `₹${((item.price || 0) * (item.quantity || 1)).toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [6, 78, 59], textColor: 255 },
      columnStyles: { 0: { cellWidth: 80 }, 3: { halign: 'right' } },
    });

    // Totals
    const finalY = (doc.lastAutoTable?.finalY || 120) + 10;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Subtotal: ₹${(raw.subtotal || 0).toLocaleString()}`, 140, finalY);
    doc.text(`Shipping: ${raw.shipping === 0 ? 'FREE' : `₹${raw.shipping}`}`, 140, finalY + 7);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(6, 78, 59);
    doc.text(`Total: ₹${(raw.total || 0).toLocaleString()}`, 140, finalY + 18);

    // Footer
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Thank you for shopping with Little Shop!', 20, 280);
    doc.text('No Returns / No Exchanges — All Sales Final', 20, 286);

    doc.save(`Invoice-${order.id}.pdf`);
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
  const pendingOrders = orders.filter((o) => o.status === 'Ordered' || o.status === 'Packed');
  const newUnaccepted = orders.filter((o) => o.status === 'Ordered').length;

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
        {/* Admin Header Bar with Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-playfair text-xl sm:text-2xl text-purple-primary">Dashboard</h1>
            <p className="font-inter text-xs text-gray-400 mt-1">Last refreshed: {new Date().toLocaleTimeString('en-IN')}</p>
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

        {/* Overview */}
        {activeTab === 'overview' && (
          <div>
            <h1 className="font-playfair text-2xl text-purple-primary mb-6">Dashboard Overview</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((s) => (
                <div key={s.label} className="bg-white rounded-lg p-5 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <s.icon size={20} className="text-rose-gold" />
                    {s.change && <span className="font-inter text-xs text-purple-primary font-medium">{s.change}</span>}
                  </div>
                  <p className="font-playfair text-2xl text-purple-primary">{s.value}</p>
                  <p className="font-inter text-xs text-gray-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <h2 className="font-playfair text-lg text-purple-primary mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <button
                onClick={() => { setActiveTab('products'); handleAddProduct(); }}
                className="bg-white rounded-lg p-4 border border-gray-100 hover:border-purple-primary hover:shadow-md transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-purple-primary/10 flex items-center justify-center mb-3 group-hover:bg-purple-primary group-hover:text-white transition-colors">
                  <Plus size={18} className="text-purple-primary group-hover:text-white" />
                </div>
                <p className="font-inter text-sm font-medium text-gray-800">Add New Saree</p>
                <p className="font-inter text-xs text-gray-400 mt-1">Create product listing</p>
              </button>
              <button
                onClick={() => setActiveTab('marketing')}
                className="bg-white rounded-lg p-4 border border-gray-100 hover:border-rose-gold hover:shadow-md transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-rose-gold/10 flex items-center justify-center mb-3 group-hover:bg-rose-gold group-hover:text-white transition-colors">
                  <TrendingUp size={18} className="text-rose-gold group-hover:text-white" />
                </div>
                <p className="font-inter text-sm font-medium text-gray-800">Update Flash Sale</p>
                <p className="font-inter text-xs text-gray-400 mt-1">Manage promotions</p>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className="bg-white rounded-lg p-4 border border-gray-100 hover:border-purple-primary hover:shadow-md transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-purple-primary/10 flex items-center justify-center mb-3 group-hover:bg-purple-primary group-hover:text-white transition-colors">
                  <IndianRupee size={18} className="text-purple-primary group-hover:text-white" />
                </div>
                <p className="font-inter text-sm font-medium text-gray-800">Today's Profit</p>
                <p className="font-inter text-xs text-gray-400 mt-1">{CURRENCY}{todayRevenue.toLocaleString()}</p>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className="bg-white rounded-lg p-4 border border-gray-100 hover:border-rose-gold hover:shadow-md transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-rose-gold/10 flex items-center justify-center mb-3 group-hover:bg-rose-gold group-hover:text-white transition-colors relative">
                  <Bell size={18} className="text-rose-gold group-hover:text-white" />
                  {newUnaccepted > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {newUnaccepted}
                    </span>
                  )}
                </div>
                <p className="font-inter text-sm font-medium text-gray-800">New Alerts</p>
                <p className="font-inter text-xs text-gray-400 mt-1">{newUnaccepted} pending</p>
              </button>
            </div>

            <h2 className="font-playfair text-lg text-purple-primary mb-4">Recent Orders</h2>
            <div className="bg-white rounded-lg border border-gray-100 overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-inter text-xs tracking-wider uppercase text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => navigate(`/admin/order/${order.id}`)}>
                      <td className="px-5 py-3 font-inter text-sm font-medium text-purple-primary">{order.id}</td>
                      <td className="px-5 py-3 font-inter text-sm text-gray-700">{order.customer}</td>
                      <td className="px-5 py-3 font-inter text-sm text-gray-700">{CURRENCY}{order.total.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full font-inter text-[10px] font-semibold tracking-wider uppercase ${
                          order.status === 'Delivered' ? 'bg-purple-primary/10 text-purple-primary' :
                          order.status === 'Shipped' || order.status === 'Out for Delivery' ? 'bg-blue-50 text-blue-600' :
                          order.status === 'Packed' ? 'bg-purple-50 text-purple-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-inter text-xs text-gray-400">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Products Management */}
        {activeTab === 'products' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h1 className="font-playfair text-2xl text-purple-primary">Products</h1>
                {selectedProducts.length > 0 && (
                  <p className="font-inter text-xs text-gray-400 mt-1">{selectedProducts.length} selected</p>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-sm font-inter text-sm outline-none focus:border-purple-primary w-48"
                  />
                </div>
                {/* Bulk Actions */}
                {selectedProducts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBulkActionMode('discount')}
                      className="flex items-center gap-1.5 bg-rose-gold/10 text-rose-gold border border-rose-gold/20 font-inter text-xs px-3 py-2 rounded-sm hover:bg-rose-gold hover:text-white transition-colors"
                    >
                      <Percent size={14} /> Bulk Discount
                    </button>
                    <button
                      onClick={() => setBulkActionMode('stock')}
                      className="flex items-center gap-1.5 bg-purple-primary/10 text-purple-primary border border-purple-primary/20 font-inter text-xs px-3 py-2 rounded-sm hover:bg-purple-primary hover:text-white transition-colors"
                    >
                      <Boxes size={14} /> Bulk Stock
                    </button>
                    <button
                      onClick={() => setSelectedProducts([])}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <button onClick={() => setShowBulkImport(true)} className="flex items-center gap-2 text-xs px-4 py-2 border border-purple-primary text-purple-primary hover:bg-purple-primary hover:text-white transition-colors">
                  <Upload size={14} /> Bulk Import
                </button>
                <button onClick={handleAddProduct} className="btn-primary flex items-center gap-2 text-xs">
                  <Plus size={14} /> Add Product
                </button>
              </div>
            </div>

            {/* Bulk Action Panel */}
            {bulkActionMode && (
              <div className="bg-cream border border-gray-200 rounded-sm p-4 mb-4">
                <div className="flex items-center gap-4">
                  {bulkActionMode === 'discount' ? (
                    <>
                      <span className="font-inter text-sm text-gray-700">Apply {bulkDiscount}% discount to {selectedProducts.length} products</span>
                      <input
                        type="number"
                        value={bulkDiscount}
                        onChange={(e) => setBulkDiscount(parseInt(e.target.value) || 0)}
                        placeholder="Discount %"
                        className="w-24 border border-gray-200 px-3 py-1.5 font-inter text-sm rounded-sm"
                        min="1"
                        max="99"
                      />
                      <button onClick={applyBulkDiscount} className="btn-primary text-xs px-4 py-2">Apply</button>
                    </>
                  ) : (
                    <>
                      <span className="font-inter text-sm text-gray-700">Set stock to {bulkStockUpdate} for {selectedProducts.length} products</span>
                      <input
                        type="number"
                        value={bulkStockUpdate}
                        onChange={(e) => setBulkStockUpdate(parseInt(e.target.value) || 0)}
                        placeholder="Stock count"
                        className="w-24 border border-gray-200 px-3 py-1.5 font-inter text-sm rounded-sm"
                        min="0"
                      />
                      <button onClick={applyBulkStockUpdate} className="btn-primary text-xs px-4 py-2">Apply</button>
                    </>
                  )}
                  <button onClick={() => setBulkActionMode(null)} className="font-inter text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-100 overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 font-inter text-xs tracking-wider uppercase text-gray-400 w-10">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onChange={(e) => setSelectedProducts(e.target.checked ? products.map((p) => p.id) : [])}
                        className="rounded-sm border-gray-300"
                      />
                    </th>
                    {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-inter text-xs tracking-wider uppercase text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter((p) =>
                      productSearch === '' ||
                      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.category.toLowerCase().includes(productSearch.toLowerCase())
                    )
                    .map((p) => (
                    <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedProducts.includes(p.id) ? 'bg-purple-primary/5' : ''}`}>
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(p.id)}
                          onChange={() => toggleProductSelection(p.id)}
                          className="rounded-sm border-gray-300"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt={p.name} className="w-10 h-12 object-cover rounded-sm bg-gray-100" />
                          <div>
                            <span className="font-inter text-sm text-gray-700">{p.name}</span>
                            {/* Demo badge for placeholder products */}
                            {typeof p.id === 'string' && /^\d+$/.test(p.id) && (
                              <span className="ml-2 inline-block bg-gray-200 text-gray-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Demo
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-inter text-xs text-gray-500">{p.category}</td>
                      <td className="px-5 py-3 font-inter text-sm font-medium text-purple-primary">{CURRENCY}{p.price.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className={`font-inter text-sm font-medium ${
                          p.stockCount === 0 ? 'text-rose-gold' :
                          p.stockCount < 5 ? 'text-red-500' :
                          'text-gray-700'
                        }`}>
                          {p.stockCount === 0 ? 'Out of Stock' : p.stockCount}
                          {p.stockCount > 0 && p.stockCount < 5 && (
                            <span className="ml-1.5 inline-block bg-red-50 text-red-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Low</span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          p.stockCount === 0 ? 'bg-rose-gold' :
                          p.stockCount < 5 ? 'bg-red-500 animate-pulse' :
                          'bg-purple-primary'
                        }`} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-primary/10 text-purple-primary hover:bg-purple-primary hover:text-white transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(p)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-rose-gold/10 text-rose-gold hover:bg-rose-gold hover:text-white transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
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

        {/* Revenue Analytics */}
        {activeTab === 'analytics' && (
          <div>
            <h1 className="font-playfair text-2xl text-purple-primary mb-6">Revenue Analytics</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg border border-gray-100 p-6">
                <p className="font-inter text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-2">Today's Earnings</p>
                <p className="font-playfair text-3xl text-purple-primary">{CURRENCY}{todayOrders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString()}</p>
                <p className="font-inter text-xs text-gray-400 mt-1">{todayOrders.length} order{todayOrders.length !== 1 ? 's' : ''} today</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 p-6">
                <p className="font-inter text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-2">All-Time Revenue</p>
                <p className="font-playfair text-3xl text-purple-primary">{CURRENCY}{totalRevenue.toLocaleString()}</p>
                <p className="font-inter text-xs text-gray-400 mt-1">{orders.length} total orders</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 p-6">
                <p className="font-inter text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-2">Average Order Value</p>
                <p className="font-playfair text-3xl text-purple-primary">{CURRENCY}{orders.length > 0 ? Math.round(totalRevenue / orders.length).toLocaleString() : 0}</p>
                <p className="font-inter text-xs text-gray-400 mt-1">Per order average</p>
              </div>
            </div>

            {/* Revenue Graph */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 mb-8">
              <h2 className="font-playfair text-lg text-purple-primary mb-4">Daily Revenue Trend</h2>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#064e3b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#064e3b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#064e3b" strokeWidth={2} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="font-inter text-sm text-gray-400 py-10 text-center">No revenue data to display yet.</p>
              )}
            </div>

            {/* Performance Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Sales by City */}
              <div className="bg-white rounded-lg border border-gray-100 p-6">
                <h3 className="font-playfair text-lg text-purple-primary mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-rose-gold" /> Sales by City
                </h3>
                {cityRankings.length === 0 ? (
                  <p className="font-inter text-sm text-gray-400">No city data available.</p>
                ) : (
                  <div className="space-y-3">
                    {cityRankings.slice(0, 5).map((city, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-inter text-xs text-gray-400 w-5">#{idx + 1}</span>
                          <span className="font-inter text-sm text-gray-700">{city.city}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-inter text-sm font-medium text-purple-primary">{CURRENCY}{city.revenue.toLocaleString()}</p>
                          <p className="font-inter text-[10px] text-gray-400">{city.orders} orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Best Sellers */}
              <div className="bg-white rounded-lg border border-gray-100 p-6">
                <h3 className="font-playfair text-lg text-purple-primary mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-purple-primary" /> Best Sellers
                </h3>
                {bestSellers.length === 0 ? (
                  <p className="font-inter text-sm text-gray-400">No sales data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {bestSellers.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-inter text-xs text-gray-400 w-5">#{idx + 1}</span>
                          <span className="font-inter text-sm text-gray-700 truncate max-w-[120px]">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-inter text-sm font-medium text-purple-primary">{item.sold} sold</p>
                          <p className="font-inter text-[10px] text-gray-400">{CURRENCY}{item.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Slow Moving Stock */}
              <div className="bg-white rounded-lg border border-gray-100 p-6">
                <h3 className="font-playfair text-lg text-purple-primary mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-rose-gold" /> Slow Moving Stock
                </h3>
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
                {orders.filter((o) => o.status === 'Ordered').map((order) => (
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

                  {/* Description */}
                  <div>
                    <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Description</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary h-24 resize-none"
                      placeholder="Product description..."
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
            const { data } = await getAllProducts();
            if (data && data.length > 0) {
              setProducts(data);
            }
          }}
        />

        {/* Order Detail Modal */}
        <AnimatePresence>
          {showOrderDetail && selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setShowOrderDetail(false)}
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
                    <div>
                      <h2 className="font-playfair text-xl text-purple-primary">Order Details</h2>
                      <p className="font-inter text-sm text-gray-400 mt-1">{selectedOrder.id}</p>
                    </div>
                    <button
                      onClick={() => setShowOrderDetail(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-cream p-4 rounded-sm">
                      <p className="font-inter text-xs tracking-wider uppercase text-gray-400 mb-1">Customer</p>
                      <p className="font-inter text-sm font-medium text-gray-800">{selectedOrder._raw?.customer?.name || selectedOrder.customer}</p>
                      <p className="font-inter text-xs text-gray-500">{selectedOrder._raw?.customer?.email || 'N/A'}</p>
                    </div>
                    <div className="bg-cream p-4 rounded-sm">
                      <p className="font-inter text-xs tracking-wider uppercase text-gray-400 mb-1">Phone</p>
                      <p className="font-inter text-sm font-medium text-gray-800">{selectedOrder._raw?.customer?.phone || selectedOrder.phone}</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="bg-cream p-4 rounded-sm">
                    <p className="font-inter text-xs tracking-wider uppercase text-gray-400 mb-2">Shipping Address</p>
                    <p className="font-inter text-sm text-gray-700">
                      {selectedOrder._raw?.shipping?.address || 'No address available'}
                    </p>
                    <p className="font-inter text-sm text-gray-700 mt-1">
                      {selectedOrder._raw?.shipping?.city}, {selectedOrder._raw?.shipping?.state} {selectedOrder._raw?.shipping?.pincode}
                    </p>
                  </div>

                  {/* Payment Status */}
                  <div className="flex items-center justify-between bg-purple-primary/5 p-4 rounded-sm">
                    <div>
                      <p className="font-inter text-xs tracking-wider uppercase text-gray-400 mb-1">Payment Status</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${selectedOrder._raw?.payment?.razorpay_payment_id ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <p className="font-inter text-sm font-medium text-gray-800">
                          {selectedOrder._raw?.payment?.razorpay_payment_id ? 'Paid via Razorpay' : 'Payment Pending'}
                        </p>
                      </div>
                    </div>
                    {selectedOrder._raw?.payment?.razorpay_payment_id && (
                      <p className="font-inter text-xs text-gray-400">
                        ID: {selectedOrder._raw.payment.razorpay_payment_id.slice(0, 16)}...
                      </p>
                    )}
                  </div>

                  {/* Order Items */}
                  <div>
                    <p className="font-inter text-xs tracking-wider uppercase text-gray-400 mb-3">Order Items</p>
                    <div className="space-y-3">
                      {(selectedOrder._raw?.items || []).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-sm flex items-center justify-center">
                              <Package size={20} className="text-gray-400" />
                            </div>
                            <div>
                              <p className="font-inter text-sm text-gray-800">{item.name}</p>
                              <p className="font-inter text-xs text-gray-400">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-inter text-sm font-medium text-purple-primary">
                            {CURRENCY}{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-purple-primary text-white p-4 rounded-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-inter text-sm">Subtotal</p>
                      <p className="font-inter text-sm">{CURRENCY}{(selectedOrder._raw?.subtotal || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-inter text-sm">Shipping</p>
                      <p className="font-inter text-sm">{selectedOrder._raw?.shipping === 0 ? 'FREE' : CURRENCY + (selectedOrder._raw?.shipping || 0)}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/20">
                      <p className="font-inter text-base font-medium">Total</p>
                      <p className="font-inter text-lg font-bold">{CURRENCY}{selectedOrder.total.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={() => generateInvoice(selectedOrder)}
                    className="flex-1 py-3 border border-gray-200 font-inter text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Download Invoice
                  </button>
                  <button
                    onClick={() => setShowOrderDetail(false)}
                    className="flex-1 py-3 bg-purple-primary text-white font-inter text-sm hover:bg-emerald-900 transition-colors"
                  >
                    Close
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
