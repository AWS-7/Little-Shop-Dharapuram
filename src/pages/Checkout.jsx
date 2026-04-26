import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Lock, ShieldCheck, Truck, Ban, ArrowLeft, XCircle, MapPin, Check, ChevronDown, Star, User, Mail, Package, RefreshCw, Gift, Sparkles, Shield, Ticket, Tag, Phone } from 'lucide-react';
import useStore from '../store/useStore';
import { getCurrentUser } from '../lib/firebaseAuth';
import { createOrder } from '../lib/orders';
import { markCartConverted } from '../lib/carts';
import { CURRENCY, POLICIES } from '../lib/constants';
import { getAddresses } from '../lib/addresses';
import { getProductByIdAdmin } from '../lib/products';
import { validateCheckoutCoupon, calculateDiscount, applyCouponAndIncrement } from '../lib/coupons';

export default function Checkout() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const { cart, getCartTotal, getShipping, getOrderTotal, clearCart } = useStore();
  
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', pincode: '', state: '',
  });
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const paymentInProgress = useRef(false);
  const rzpModalOpen = useRef(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  const [currentStep, setCurrentStep] = useState('address'); 
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');

  const [isGiftWrap, setIsGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const GIFT_WRAP_PRICE = 50;
  const [stockErrors, setStockErrors] = useState([]);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Validate stock availability before payment
  const validateCartStock = async () => {
    const errors = [];
    for (const item of cart) {
      const { data: product } = await getProductByIdAdmin(item.id);
      if (!product) {
        errors.push({ name: item.name, message: 'Product no longer available' });
      } else if (product.stock_count < item.quantity) {
        errors.push({
          name: item.name,
          message: `Only ${product.stock_count} available (you have ${item.quantity} in cart)`
        });
      }
    }
    return errors;
  };

  useEffect(() => {
    if (user?.uid) {
      getAddresses(user.uid).then(({ data, error }) => {
        if (error) {
          // Addresses table may not exist - silently ignore
          console.log('Addresses fetch skipped:', error.message);
          return;
        }
        if (data && data.length > 0) {
          setSavedAddresses(data);
          const defaultAddr = data.find((a) => a.is_default) || data[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            setForm({
              name: defaultAddr.full_name,
              email: user?.email || '',
              phone: defaultAddr.phone || '',
              address: defaultAddr.address,
              city: defaultAddr.city,
              state: defaultAddr.state,
              pincode: defaultAddr.pincode,
            });
          }
        }
      });
    }
  }, [user?.uid]);

  const selectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setForm({
      name: addr.full_name,
      email: form.email || user?.email || '',
      phone: addr.phone || '',
      address: addr.address,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setShowAddressPicker(false);
  };

  if (!user) {
    return <Navigate to="/login" state={{ from: { pathname: '/checkout' } }} />;
  }

  const subtotal = getCartTotal();
  const shipping = getShipping();
  const giftWrapAmount = isGiftWrap ? GIFT_WRAP_PRICE : 0;
  const totalBeforeDiscount = subtotal + shipping + giftWrapAmount;
  const total = Math.max(0, totalBeforeDiscount - couponDiscount);

  // Coupon handlers
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    setCouponLoading(true);
    setCouponError('');
    
    const result = await validateCheckoutCoupon(couponCode);
    
    if (result.valid) {
      const discount = calculateDiscount(subtotal, result.discount_percent);
      setCouponDiscount(discount);
      setAppliedCoupon(result);
      setCouponCode('');
      setCouponError('');
    } else {
      setCouponError(result.message);
      setAppliedCoupon(null);
      setCouponDiscount(0);
    }
    
    setCouponLoading(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponError('');
    setCouponCode('');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateTrackingId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'LS-';
    for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  };

  const buildOrderPayload = (paymentId, paymentMethod = null) => {
    const payload = {
      order_id: generateTrackingId(),
      payment_id: paymentId,
      // Try 'pending' for COD, 'confirmed' for online. If fails, run SQL:
      // ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
      // ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending','confirmed','Packed','Shipped','Out for Delivery','Delivered'));
      status: paymentMethod === 'cod' ? 'pending' : 'confirmed',
      total,
      subtotal,
      shipping,
      // Note: Extended columns (discount, coupon_code, gift_wrap, etc.) 
      // need to be added to Supabase orders table for full feature support
      user_id: user?.uid || null,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      customer: {
        ...form,
        email: form.email || user?.email || '',
      },
    };
    return payload;
  };

  const processOrder = async (paymentId, paymentMethod = null) => {
    paymentInProgress.current = true;
    const payload = buildOrderPayload(paymentId, paymentMethod);
    const { data: saved, error: orderError } = await createOrder(payload);
    
    if (orderError) {
      console.error('Order insert failed:', orderError);
      alert(`Order save failed: ${orderError.message}`);
    }

    // Apply coupon - increment usage count if coupon was used
    if (appliedCoupon && appliedCoupon.code) {
      try {
        await applyCouponAndIncrement(appliedCoupon.code);
      } catch (e) {
        console.error('Failed to apply coupon usage:', e);
        // Don't block order completion if coupon update fails
      }
    }

    if (user) {
      try {
        await markCartConverted(user.uid);
      } catch {
        // Ignore cart conversion errors
      }
    }

    const orderData = {
      paymentId,
      orderId: payload.order_id,
      total,
      subtotal,
      shipping,
      discount: couponDiscount,
      // Coupon info stored locally only until DB schema updated
      items: payload.items,
      customer: payload.customer,
      date: saved?.created_at || new Date().toISOString(),
    };

    navigate('/order-success', { state: orderData });
    clearCart();
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (currentStep === 'address') {
      if (!form.name || !form.phone || !form.address || !form.city || !form.pincode) {
        setPaymentError({
          title: 'Missing Information',
          message: 'Please fill in all required fields including phone number to continue.',
        });
        return;
      }
      // Validate phone number format (10 digits)
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(form.phone.replace(/\D/g, ''))) {
        setPaymentError({
          title: 'Invalid Phone Number',
          message: 'Please enter a valid 10-digit phone number.',
        });
        return;
      }
      setCurrentStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate stock before payment
    setLoading(true);
    const stockValidation = await validateCartStock();
    if (stockValidation.length > 0) {
      setStockErrors(stockValidation);
      setLoading(false);
      return;
    }
    setStockErrors([]);

    // Handle Cash on Delivery
    if (selectedPaymentMethod === 'cod') {
      const codOrderId = `COD-${Date.now().toString(36).toUpperCase()}`;
      await processOrder(codOrderId, 'cod');
      setLoading(false);
      return;
    }

    if (rzpModalOpen.current) return;
    setPaymentError(null);

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: total * 100,
      currency: 'INR',
      name: 'Little Shop',
      description: `Order for ${cart.length} item${cart.length !== 1 ? 's' : ''}`,
      handler: async function (response) {
        rzpModalOpen.current = false;
        await processOrder(response.razorpay_payment_id);
      },
      prefill: {
        name: form.name,
        email: form.email || user?.email || '',
        method: selectedPaymentMethod === 'upi' ? 'upi' : selectedPaymentMethod,
      },
      notes: {
        address: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
        customer_name: form.name,
      },
      theme: { color: '#0D9488' },
      modal: {
        ondismiss: function () {
          rzpModalOpen.current = false;
          setLoading(false);
        },
      },
    };

    if (window.Razorpay && options.key && !options.key.includes('placeholder')) {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        rzpModalOpen.current = false;
        setLoading(false);
        setPaymentError({ title: 'Payment Failed', message: resp.error?.description });
      });
      rzpModalOpen.current = true;
      rzp.open();
    } else {
      // Fallback to demo mode if Razorpay not configured
      setTimeout(async () => {
        const demoPaymentId = `pay_demo_${Date.now().toString(36).toUpperCase()}`;
        await processOrder(demoPaymentId);
      }, 1500);
    }
  };

  if (cart.length === 0 && !paymentInProgress.current) {
    navigate('/cart');
    return null;
  }
  if (cart.length === 0 && paymentInProgress.current) return null;

  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', placeholder: 'e.g. Priya Sharma', full: true, icon: User },
    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'priya@example.com', full: true, icon: Mail },
    { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '9876543210', full: true, icon: Phone },
    { name: 'address', label: 'Delivery Address', type: 'text', placeholder: '123, Main Street, Apt 4B', full: true, icon: MapPin },
    { name: 'city', label: 'City', type: 'text', placeholder: 'Chennai', icon: Package },
    { name: 'state', label: 'State', type: 'text', placeholder: 'Tamil Nadu', icon: Package },
    { name: 'pincode', label: 'PIN Code', type: 'text', placeholder: '600001', icon: Package },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-24">
      <div className="container-clean">
        {/* Header - Modern MNC Style */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-600 text-xs font-medium mb-2">
              <Shield size={14} className="text-green-500" />
              <span>Secure SSL Checkout</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Checkout</h1>
          </div>
          {/* Modern Stepper */}
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
            <div className={`flex items-center gap-2 ${currentStep === 'address' ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'address' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>
                {currentStep === 'payment' ? <Check size={12} /> : '1'}
              </div>
              <span className="text-xs font-medium">Address</span>
            </div>
            <div className="w-6 h-px bg-gray-200" />
            <div className={`flex items-center gap-2 ${currentStep === 'payment' ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'payment' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>2</div>
              <span className="text-xs font-medium">Payment</span>
            </div>
          </div>
        </div>

        <form onSubmit={handlePayment}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {currentStep === 'address' ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                      <MapPin size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Delivery Details</h2>
                      <p className="text-xs text-gray-500">Enter your shipping address</p>
                    </div>
                  </div>
                  {savedAddresses.length > 0 && (
                    <button 
                      type="button" 
                      onClick={() => setShowAddressPicker(!showAddressPicker)} 
                      className="text-purple-600 text-sm font-medium hover:text-purple-700 flex items-center gap-1"
                    >
                      {showAddressPicker ? 'Close' : 'Use Saved Address'}
                    </button>
                  )}
                </div>

                {/* Saved Address Picker */}
                <AnimatePresence>
                  {showAddressPicker && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }} 
                      className="mb-6 grid gap-3"
                    >
                      {savedAddresses.map(addr => (
                        <button 
                          key={addr.id} 
                          type="button" 
                          onClick={() => selectAddress(addr)} 
                          className={`text-left p-4 rounded-xl border transition-all ${selectedAddressId === addr.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{addr.full_name}</p>
                            {addr.is_default && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{addr.address}, {addr.city} — {addr.pincode}</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map(field => (
                    <div key={field.name} className={field.full ? 'md:col-span-2' : ''}>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">{field.label}</label>
                      <div className="relative">
                        <field.icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type={field.type}
                          name={field.name}
                          value={form[field.name]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          required
                          className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                      <CreditCard size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
                      <p className="text-xs text-gray-500">Choose how you want to pay</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setCurrentStep('address')} 
                    className="text-purple-600 text-sm font-medium hover:text-purple-700"
                  >
                    Edit Address
                  </button>
                </div>
                
                {/* Payment Options */}
                <div className="grid gap-3">
                  {[
                    { id: 'upi', label: 'UPI / QR Code', icon: '💳', desc: 'Pay using any UPI app' },
                    { id: 'card', label: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, RuPay' },
                    { id: 'netbanking', label: 'Net Banking', icon: '🏦', desc: 'All major banks supported' },
                    { id: 'cod', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when you receive' }
                  ].map(method => (
                    <button 
                      key={method.id} 
                      type="button" 
                      onClick={() => setSelectedPaymentMethod(method.id)} 
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${selectedPaymentMethod === method.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-xl">
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{method.label}</p>
                        <p className="text-xs text-gray-500">{method.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === method.id ? 'border-purple-600' : 'border-gray-300'}`}>
                        {selectedPaymentMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gift Wrap - Modern MNC Style */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${isGiftWrap ? 'bg-rose-500 text-white shadow-md' : 'bg-rose-50 text-rose-400'}`}>
                  <Gift size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Add Gift Wrap</p>
                  <p className="text-xs text-gray-500">Premium packaging + personal note (+{CURRENCY}{GIFT_WRAP_PRICE})</p>
                </div>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isGiftWrap ? 'bg-rose-500 border-rose-500' : 'border-gray-300 group-hover:border-rose-400'}`}>
                  {isGiftWrap && <Check size={14} className="text-white" />}
                </div>
                <input type="checkbox" checked={isGiftWrap} onChange={(e) => setIsGiftWrap(e.target.checked)} className="hidden" />
              </label>
              
              <AnimatePresence>
                {isGiftWrap && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    className="mt-4 pt-4 border-t border-gray-100"
                  >
                    <label className="block text-xs font-medium text-gray-700 mb-2">Gift Message (Optional)</label>
                    <textarea 
                      value={giftMessage} 
                      onChange={(e) => setGiftMessage(e.target.value)} 
                      rows={2} 
                      placeholder="Write a heartfelt message for your loved one..." 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-rose-400 focus:bg-white transition-all resize-none placeholder:text-gray-400" 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Order Summary - Modern MNC Style */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-32">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Package size={18} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              </div>
              
              {/* Cart Items */}
              <div className="space-y-3 mb-5 max-h-[280px] overflow-y-auto pr-1 scrollbar-hide">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-medium text-purple-600">{CURRENCY}{item.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-5 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">{CURRENCY}{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className={`font-medium ${shipping === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {shipping === 0 ? 'FREE' : `${CURRENCY}${shipping}`}
                  </span>
                </div>
                {isGiftWrap && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Gift Wrap</span>
                    <span className="font-medium text-gray-900">{CURRENCY}{giftWrapAmount}</span>
                  </div>
                )}
                
                {/* Coupon Section - Modern Style */}
                <div className="pt-3 border-t border-gray-100">
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Ticket size={14} className="text-purple-600" />
                        <span className="text-xs font-medium text-gray-600">Have a coupon?</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError('');
                          }}
                          placeholder="Enter code"
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 focus:bg-white transition-all uppercase placeholder:text-gray-400"
                          onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          disabled={couponLoading}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium text-xs hover:bg-purple-700 transition-all disabled:opacity-50"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <XCircle size={12} /> {couponError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                            <Check size={14} className="text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{appliedCoupon.code}</p>
                            <p className="text-xs text-green-600">{appliedCoupon.discount_percent}% OFF applied</p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-xs text-red-500 hover:text-red-600 px-2 py-1 hover:bg-red-50 rounded-md transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Discount Display */}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-green-600 flex items-center gap-1">
                      <Tag size={12} /> Discount
                    </span>
                    <span className="font-medium text-green-600">-{CURRENCY}{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Total Amount */}
              <div className="bg-gray-900 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Total Amount</span>
                  <span className="text-xl font-semibold text-white">{CURRENCY}{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Error Messages */}
              {paymentError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm font-medium">{paymentError.title}</p>
                  <p className="text-red-500 text-xs">{paymentError.message}</p>
                </div>
              )}

              {/* Stock Validation Errors */}
              {stockErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm font-medium flex items-center gap-1 mb-2">
                    <Ban size={14} />
                    Stock Issue
                  </p>
                  <ul className="space-y-1">
                    {stockErrors.map((error, idx) => (
                      <li key={idx} className="text-red-500 text-xs">
                        <span className="font-medium">{error.name}:</span> {error.message}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/cart')}
                    className="mt-2 text-xs font-medium text-red-600 underline hover:text-red-700"
                  >
                    Update Cart →
                  </button>
                </div>
              )}

              {/* Desktop Pay Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#f2a20c] text-white py-3.5 rounded-xl font-medium text-sm hover:bg-[#d9910a] transition-all active:scale-[0.98] disabled:opacity-50 hidden lg:flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : currentStep === 'address' ? (
                  <>Continue to Payment <ArrowLeft size={16} className="rotate-180" /></>
                ) : selectedPaymentMethod === 'cod' ? (
                  'Place Order'
                ) : (
                  `Pay ${CURRENCY}${total.toLocaleString()}`
                )}
              </button>
              
              {/* Trust Badges */}
              <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Lock size={12} className="text-green-500" />
                  <span>Secure SSL Encryption</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <ShieldCheck size={12} className="text-green-500" />
                  <span>100% Buyer Protection</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Pay Button - Modern Style */}
        <div className="fixed bottom-[80px] left-0 right-0 z-40 lg:hidden px-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-gray-500">Total to Pay</p>
                <p className="text-sm text-gray-600">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
              </div>
              <span className="text-lg font-semibold text-gray-900">{CURRENCY}{total.toLocaleString()}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#f2a20c] text-white font-medium text-sm py-3 rounded-lg hover:bg-[#d9910a] transition-all disabled:opacity-50 shadow-md"
            >
              {loading ? 'Processing...' : currentStep === 'address' ? 'Continue to Payment' : selectedPaymentMethod === 'cod' ? 'Place Order' : `Pay ${CURRENCY}${total.toLocaleString()}`}
            </button>
          </div>
        </div>
        </form>
      </div>

      {/* Payment Error Toast - Modern Style */}
      <AnimatePresence>
        {paymentError && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="fixed top-24 right-4 z-50 max-w-sm w-full bg-white border border-red-200 rounded-xl shadow-lg p-4 flex gap-3"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle size={20} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{paymentError.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{paymentError.message}</p>
            </div>
            <button onClick={() => setPaymentError(null)} className="text-gray-400 hover:text-gray-600">
              <XCircle size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
