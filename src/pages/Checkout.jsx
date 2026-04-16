import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Lock, ShieldCheck, Truck, Ban, ArrowLeft, XCircle, MapPin, Check, ChevronDown, Phone, Star, User, Mail, Package, RefreshCw, Gift } from 'lucide-react';
import useStore from '../store/useStore';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../lib/orders';
import { markCartConverted } from '../lib/carts';
import { CURRENCY, POLICIES } from '../lib/constants';
import { getAddresses } from '../lib/addresses';

export default function Checkout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { cart, getCartTotal, getShipping, getOrderTotal, clearCart } = useStore();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', pincode: '', state: '',
  });
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null); // { title, message }
  const paymentInProgress = useRef(false);
  const rzpModalOpen = useRef(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Payment step and method selection
  const [currentStep, setCurrentStep] = useState('address'); // 'address' | 'payment'
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'wallet'

  // Gift wrap option
  const [isGiftWrap, setIsGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const GIFT_WRAP_PRICE = 50;

  // Fetch saved addresses
  useEffect(() => {
    if (user?.id) {
      getAddresses(user.id).then(({ data }) => {
        if (data && data.length > 0) {
          setSavedAddresses(data);
          // Auto-select default address
          const defaultAddr = data.find((a) => a.is_default) || data[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            setForm({
              name: defaultAddr.full_name,
              email: user?.email || '',
              phone: defaultAddr.phone,
              address: defaultAddr.address,
              city: defaultAddr.city,
              state: defaultAddr.state,
              pincode: defaultAddr.pincode,
            });
          }
        }
      });
    }
  }, [user?.id]);

  const selectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setForm({
      name: addr.full_name,
      email: form.email || user?.email || '',
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setShowAddressPicker(false);
  };

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/account" state={{ from: '/checkout' }} />;
  }

  const subtotal = getCartTotal();
  const shipping = getShipping();
  const giftWrapAmount = isGiftWrap ? GIFT_WRAP_PRICE : 0;
  const total = subtotal + shipping + giftWrapAmount;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateTrackingId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'LS-';
    for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  };

  const buildOrderPayload = (paymentId) => {
    const payload = {
      order_id: generateTrackingId(),
      payment_id: paymentId,
      status: 'Ordered',
      total,
      subtotal,
      shipping,
      gift_wrap: isGiftWrap,
      gift_wrap_amount: giftWrapAmount,
      gift_message: isGiftWrap ? giftMessage : null,
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
    // Only include user_id if user is logged in (avoids FK constraint errors)
    if (user?.id) payload.user_id = user.id;
    return payload;
  };

  const processOrder = async (paymentId) => {
    paymentInProgress.current = true;
    const payload = buildOrderPayload(paymentId);

    // Save to Supabase
    console.log('Creating order with payload:', payload);
    const { data: saved, error: orderError } = await createOrder(payload);
    if (orderError) {
      console.error('Order insert failed:', orderError);
      alert(`Order save failed: ${orderError.message || JSON.stringify(orderError)}`);
    } else {
      console.log('Order saved successfully:', saved);
    }

    // Mark cart as converted (prevents abandoned cart reminder)
    if (user) await markCartConverted(user.id);

    const orderData = {
      paymentId,
      orderId: payload.order_id,
      total,
      subtotal,
      shipping,
      items: payload.items,
      customer: payload.customer,
      date: saved?.created_at || new Date().toISOString(),
    };

    // Navigate FIRST, then clear cart
    navigate('/order-success', { state: orderData });
    clearCart();
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    // If on address step, validate and move to payment
    if (currentStep === 'address') {
      if (!form.name || !form.phone || !form.address || !form.city || !form.pincode) {
        setPaymentError({
          title: 'Missing Information',
          message: 'Please fill in all required address fields to continue.',
        });
        return;
      }
      setCurrentStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    // Prevent double-click while Razorpay modal is open
    if (rzpModalOpen.current) return;
    setPaymentError(null);

    // Enhanced Razorpay options with UPI Intent and all payment methods
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: total * 100,
      currency: 'INR',
      name: 'Little Shop',
      description: `Order for ${cart.length} item${cart.length !== 1 ? 's' : ''}`,
      order_id: null, // Will be generated by Razorpay
      image: 'https://little-shop.in/logo.png', // Your logo URL
      handler: async function (response) {
        rzpModalOpen.current = false;
        await processOrder(response.razorpay_payment_id);
      },
      prefill: {
        name: form.name,
        email: form.email || user?.email || '',
        contact: form.phone,
        method: selectedPaymentMethod === 'upi' ? 'upi' : selectedPaymentMethod,
      },
      notes: {
        address: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
        customer_name: form.name,
        customer_phone: form.phone,
      },
      theme: {
        color: '#064e3b',
        backdrop_color: '#064e3b20',
      },
      modal: {
        escape: false,
        backdropclose: false,
        ondismiss: function () {
          rzpModalOpen.current = false;
          setLoading(false);
          setPaymentError({
            title: 'Payment Cancelled',
            message: "Don't worry, your cart is safe. You can try again or choose a different payment method.",
          });
        },
      },
      // Enable all payment methods
      config: {
        display: {
          blocks: {
            upi: {
              name: 'Pay via UPI',
              instruments: [
                { method: 'upi', flows: ['intent', 'collect'], apps: ['google_pay', 'phonepe', 'paytm', 'bhim_upi', 'amazon_pay', 'whatsapp'] },
              ],
            },
            cards: {
              name: 'Credit/Debit Card',
              instruments: [{ method: 'card' }],
            },
            netbanking: {
              name: 'Net Banking',
              instruments: [{ method: 'netbanking' }],
            },
            wallet: {
              name: 'Wallets',
              instruments: [
                { method: 'wallet', wallets: ['paytm', 'amazonpay', 'phonepe', 'freecharge', 'mobikwik'] },
              ],
            },
          },
          sequence: ['block.upi', 'block.cards', 'block.netbanking', 'block.wallet'],
          preferences: {
            show_default_blocks: true,
          },
        },
      },
      // UPI specific options
      upi: {
        flow: 'intent', // This opens GPay/PhonePe apps directly on mobile
      },
    };

    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        console.error('Payment failed:', resp.error);
        rzpModalOpen.current = false;
        setLoading(false);
        setPaymentError({
          title: 'Payment Failed',
          message: resp.error?.description || "Something went wrong. Your cart is safe — please try again.",
        });
      });
      rzpModalOpen.current = true;
      rzp.open();
    } else {
      // Razorpay SDK not loaded — demo mode fallback
      console.warn('Razorpay SDK not loaded. Running in demo mode.');
      setTimeout(async () => {
        const demoPaymentId = `pay_demo_${Date.now().toString(36).toUpperCase()}`;
        await processOrder(demoPaymentId);
      }, 1500);
    }
  };

  // Only redirect to cart if empty AND no payment is in progress
  if (cart.length === 0 && !paymentInProgress.current) {
    navigate('/cart');
    return null;
  }
  // If payment completed and cart cleared, don't render anything
  if (cart.length === 0 && paymentInProgress.current) {
    return null;
  }

  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', placeholder: 'e.g. Priya Sharma', full: true, icon: User },
    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'priya@example.com', icon: Mail },
    { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210', icon: Phone },
    { name: 'address', label: 'Delivery Address', type: 'text', placeholder: '123, Main Street, Apt 4B', full: true, icon: MapPin },
    { name: 'city', label: 'City', type: 'text', placeholder: 'Chennai', icon: Package },
    { name: 'state', label: 'State', type: 'text', placeholder: 'Tamil Nadu', icon: Package },
    { name: 'pincode', label: 'PIN Code', type: 'text', placeholder: '600001', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Checkout Stepper */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-luxury py-6">
          <div className="flex items-center justify-center max-w-md mx-auto">
            {/* Step 1: ADDRESS */}
            <div className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  currentStep === 'address' ? 'bg-purple-primary text-white' : 'bg-purple-primary/10 text-purple-primary'
                }`}>
                  <MapPin size={18} strokeWidth={1.5} />
                </div>
                <span className={`font-inter text-[10px] uppercase tracking-wider mt-2 font-medium ${
                  currentStep === 'address' ? 'text-purple-primary' : 'text-purple-primary/70'
                }`}>Address</span>
              </div>
            </div>

            {/* Connecting Line */}
            <div className={`w-16 md:w-24 h-0.5 mx-4 transition-colors ${
              currentStep === 'payment' ? 'bg-purple-primary' : 'bg-gray-200'
            }`} />

            {/* Step 2: PAYMENT */}
            <div className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                  currentStep === 'payment' ? 'bg-purple-primary text-white border-purple-primary' : 'bg-gray-100 text-gray-400 border-gray-200'
                }`}>
                  <CreditCard size={18} strokeWidth={1.5} />
                </div>
                <span className={`font-inter text-[10px] uppercase tracking-wider mt-2 ${
                  currentStep === 'payment' ? 'text-purple-primary font-medium' : 'text-gray-400'
                }`}>Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-luxury section-spacing">
        {/* Back Link */}
        <Link to="/cart" className="inline-flex items-center gap-1.5 font-inter text-xs tracking-wider uppercase text-gray-400 hover:text-purple-primary transition-colors mb-6">
          <ArrowLeft size={14} /> Back to Bag
        </Link>

        <form id="checkout-form" onSubmit={handlePayment}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

            {/* ── LEFT COLUMN: Shipping Form ── */}
            <div className="md:col-span-2 lg:col-span-2 space-y-6">
              {/* ── Saved Address Picker ── */}
              {savedAddresses.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-sm p-5 md:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-inter text-xs tracking-[0.12em] uppercase text-gray-500 font-medium flex items-center gap-2">
                      <MapPin size={14} className="text-purple-primary" /> Select Saved Address
                    </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddressPicker(!showAddressPicker)}
                    className="font-inter text-[10px] text-purple-primary hover:underline flex items-center gap-1"
                  >
                    {showAddressPicker ? 'Hide' : `${savedAddresses.length} saved`} <ChevronDown size={12} className={`transition-transform ${showAddressPicker ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Selected address summary */}
                {selectedAddressId && !showAddressPicker && (
                  <div className="bg-purple-primary/5 border border-purple-primary/15 rounded-lg p-3">
                    {(() => {
                      const addr = savedAddresses.find((a) => a.id === selectedAddressId);
                      if (!addr) return null;
                      return (
                        <div className="flex items-center gap-3">
                          <Check size={16} className="text-purple-primary flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-inter text-sm font-medium text-gray-800 truncate">
                              {addr.full_name}
                              {addr.is_default && <span className="ml-2 text-[9px] bg-purple-primary text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">Default</span>}
                            </p>
                            <p className="font-inter text-xs text-gray-500 truncate">{addr.address}, {addr.city} — {addr.pincode}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Address list */}
                <AnimatePresence>
                  {showAddressPicker && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 pt-1">
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => selectAddress(addr)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              selectedAddressId === addr.id
                                ? 'border-purple-primary/40 bg-purple-primary/5'
                                : 'border-gray-100 hover:border-purple-primary/20 hover:bg-gray-50/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-inter text-sm font-medium text-gray-800">{addr.full_name}</p>
                                  {addr.is_default && <Star size={10} className="text-purple-primary" fill="currentColor" />}
                                  <span className="font-inter text-[9px] uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{addr.relationship_tag}</span>
                                </div>
                                <p className="font-inter text-xs text-gray-500 mt-0.5 truncate">{addr.address}, {addr.city}, {addr.state} — {addr.pincode}</p>
                                <p className="font-inter text-[10px] text-gray-400 mt-0.5 flex items-center gap-1"><Phone size={10} /> {addr.phone}</p>
                              </div>
                              {selectedAddressId === addr.id && (
                                <Check size={16} className="text-purple-primary flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Delivery Address Card */}
            <div className="bg-white border border-gray-100 rounded-lg p-6 md:p-8">
              <h2 className="font-playfair text-xl text-gray-900 mb-6">Delivery Address</h2>

              <div className="space-y-4">
                {fields.map((field) => {
                  const Icon = field.icon;
                  const isFullWidth = field.full;
                  return (
                    <div key={field.name} className={isFullWidth ? '' : 'md:w-1/2'}>
                      <label className="block font-inter text-[10px] tracking-wider uppercase text-gray-500 mb-2">
                        {field.label}
                      </label>
                      <div className="relative">
                        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
                        <input
                          type={field.type}
                          name={field.name}
                          value={form[field.name]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          required
                          className="w-full bg-gray-50/80 border border-gray-200 rounded-lg pl-10 pr-4 py-3 font-inter text-sm text-gray-800 outline-none focus:border-purple-primary focus:bg-white transition-all placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

              {/* Policy Notices */}
              <div className="mt-6 bg-cream border border-gray-100 rounded-sm p-5 flex flex-col sm:flex-row gap-4 sm:gap-8">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-purple-primary flex-shrink-0" />
                  <span className="font-inter text-xs text-gray-500">{POLICIES.payment}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ban size={16} className="text-rose-gold flex-shrink-0" />
                  <span className="font-inter text-xs text-rose-gold font-medium">{POLICIES.returns}</span>
                </div>
              </div>

              {/* ═══ GIFT WRAP OPTION ═══ */}
              <div className="mt-6 bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Checkbox */}
                <label className="flex items-center gap-4 p-5 cursor-pointer hover:bg-gray-50/50 transition-colors">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isGiftWrap ? 'bg-rose-gold' : 'bg-gray-100'}`}>
                    <Gift size={24} className={isGiftWrap ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-inter text-sm font-medium text-gray-800">Add Gift Wrap</p>
                      <span className="font-inter text-sm font-semibold text-rose-gold">+₹{GIFT_WRAP_PRICE}</span>
                    </div>
                    <p className="font-inter text-xs text-gray-400 mt-0.5">Premium gift wrapping with ribbon & personalized message card</p>
                  </div>
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${isGiftWrap ? 'border-rose-gold bg-rose-gold' : 'border-gray-300'}`}>
                    {isGiftWrap && <Check size={14} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={isGiftWrap}
                    onChange={(e) => setIsGiftWrap(e.target.checked)}
                    className="hidden"
                  />
                </label>

                {/* Gift Message Textarea - Shows when checked */}
                <AnimatePresence>
                  {isGiftWrap && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-2 border-t border-gray-100">
                        <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">
                          Personal Message Card <span className="text-gray-300 font-normal">(Optional)</span>
                        </label>
                        <textarea
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value)}
                          placeholder="Write a heartfelt message for your loved one... We'll print it on a beautiful card!"
                          maxLength={200}
                          rows={3}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-inter text-sm text-gray-800 outline-none focus:border-rose-gold focus:bg-white transition-all placeholder:text-gray-400 resize-none"
                        />
                        <p className="font-inter text-[10px] text-gray-400 mt-1.5 text-right">
                          {giftMessage.length}/200 characters
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── PAYMENT STEP: Payment Method Selection & Address Summary ── */}
              <AnimatePresence mode="wait">
                {currentStep === 'payment' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-6 space-y-6"
                  >
                    {/* Delivery Address Summary Card */}
                    <div className="bg-purple-primary/5 border border-purple-primary/20 rounded-lg p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-inter text-xs tracking-wider uppercase text-purple-primary font-medium flex items-center gap-2">
                          <MapPin size={14} /> Deliver To
                        </h3>
                        <button
                          type="button"
                          onClick={() => setCurrentStep('address')}
                          className="font-inter text-[11px] text-purple-primary hover:underline"
                        >
                          Change
                        </button>
                      </div>
                      <div className="space-y-1">
                        <p className="font-inter text-sm font-medium text-gray-800">{form.name}</p>
                        <p className="font-inter text-xs text-gray-600">{form.phone}</p>
                        <p className="font-inter text-xs text-gray-500 leading-relaxed">
                          {form.address}, {form.city}, {form.state} - {form.pincode}
                        </p>
                      </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="bg-white border border-gray-100 rounded-lg p-5 md:p-6">
                      <h3 className="font-playfair text-lg text-gray-900 mb-5 flex items-center gap-2">
                        <CreditCard size={18} className="text-purple-primary" />
                        Select Payment Method
                      </h3>

                      {/* UPI Options */}
                      <div className="space-y-3">
                        {/* UPI - GPay, PhonePe, Paytm */}
                        <label
                          className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedPaymentMethod === 'upi'
                              ? 'border-purple-primary bg-purple-primary/5'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="upi"
                            checked={selectedPaymentMethod === 'upi'}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            className="hidden"
                          />
                          <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center">
                            <svg viewBox="0 0 48 48" className="w-8 h-8">
                              <circle cx="24" cy="24" r="20" fill="#00875F"/>
                              <path d="M24 14v20M14 24h20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-inter text-sm font-medium text-gray-800">UPI Apps</p>
                            <p className="font-inter text-xs text-gray-400 mt-0.5">Google Pay, PhonePe, Paytm, BHIM</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'upi' ? 'border-purple-primary' : 'border-gray-300'
                          }`}>
                            {selectedPaymentMethod === 'upi' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-purple-primary" />
                            )}
                          </div>
                        </label>

                        {/* Cards */}
                        <label
                          className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedPaymentMethod === 'card'
                              ? 'border-purple-primary bg-purple-primary/5'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="card"
                            checked={selectedPaymentMethod === 'card'}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            className="hidden"
                          />
                          <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center gap-1">
                            <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-800 rounded-sm" />
                            <div className="w-6 h-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-sm absolute opacity-50" />
                          </div>
                          <div className="flex-1">
                            <p className="font-inter text-sm font-medium text-gray-800">Credit / Debit Card</p>
                            <p className="font-inter text-xs text-gray-400 mt-0.5">Visa, Mastercard, RuPay, Amex</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'card' ? 'border-purple-primary' : 'border-gray-300'
                          }`}>
                            {selectedPaymentMethod === 'card' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-purple-primary" />
                            )}
                          </div>
                        </label>

                        {/* Net Banking */}
                        <label
                          className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedPaymentMethod === 'netbanking'
                              ? 'border-purple-primary bg-purple-primary/5'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="netbanking"
                            checked={selectedPaymentMethod === 'netbanking'}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            className="hidden"
                          />
                          <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center">
                            <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
                              <rect x="8" y="20" width="32" height="20" rx="2" stroke="#6B7280" strokeWidth="2"/>
                              <path d="M12 20V14a2 2 0 012-2h20a2 2 0 012 2v6" stroke="#6B7280" strokeWidth="2"/>
                              <circle cx="24" cy="30" r="3" stroke="#6B7280" strokeWidth="2"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-inter text-sm font-medium text-gray-800">Net Banking</p>
                            <p className="font-inter text-xs text-gray-400 mt-0.5">All major banks supported</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'netbanking' ? 'border-purple-primary' : 'border-gray-300'
                          }`}>
                            {selectedPaymentMethod === 'netbanking' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-purple-primary" />
                            )}
                          </div>
                        </label>

                        {/* Wallets */}
                        <label
                          className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedPaymentMethod === 'wallet'
                              ? 'border-purple-primary bg-purple-primary/5'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="wallet"
                            checked={selectedPaymentMethod === 'wallet'}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            className="hidden"
                          />
                          <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center">
                            <svg viewBox="0 0 48 48" className="w-7 h-7">
                              <rect x="8" y="16" width="32" height="20" rx="3" fill="#00B9F5"/>
                              <circle cx="16" cy="26" r="3" fill="white"/>
                              <path d="M24 23h10v6H24z" fill="white" opacity="0.5"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-inter text-sm font-medium text-gray-800">Wallets</p>
                            <p className="font-inter text-xs text-gray-400 mt-0.5">Paytm, Amazon Pay, PhonePe</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'wallet' ? 'border-purple-primary' : 'border-gray-300'
                          }`}>
                            {selectedPaymentMethod === 'wallet' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-purple-primary" />
                            )}
                          </div>
                        </label>
                      </div>

                      {/* UPI Intent Info */}
                      {selectedPaymentMethod === 'upi' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 p-3 bg-purple-primary/5 rounded-lg"
                        >
                          <p className="font-inter text-xs text-purple-primary flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            On mobile, your preferred UPI app will open automatically
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── RIGHT COLUMN: Order Summary ── */}
          <div className="md:col-span-1 lg:col-span-1">
            <div className="bg-white border border-gray-100 rounded-lg p-6 lg:sticky lg:top-28">
              <h2 className="font-playfair text-xl text-gray-900 mb-6 pb-4 border-b border-gray-100">Order Summary</h2>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 flex-shrink-0 overflow-hidden bg-gray-100 rounded-lg">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-inter text-sm text-gray-800 truncate leading-tight">{item.name}</p>
                      <p className="font-inter text-xs text-gray-400 mt-0.5">Qty: {item.quantity} × {CURRENCY}{item.price.toLocaleString()}</p>
                    </div>
                    {/* Price */}
                    <p className="font-inter text-sm font-medium text-gray-800 flex-shrink-0">
                      {CURRENCY}{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-inter text-sm text-gray-500">Subtotal</span>
                  <span className="font-inter text-sm text-gray-800">{CURRENCY}{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-inter text-sm text-gray-500">Shipping</span>
                  {shipping === 0 ? (
                    <span className="font-inter text-sm text-purple-primary font-medium">FREE</span>
                  ) : (
                    <span className="font-inter text-sm text-gray-800">{CURRENCY}{shipping.toLocaleString()}</span>
                  )}
                </div>
                {/* Gift Wrap Line Item */}
                {isGiftWrap && (
                  <div className="flex justify-between items-center">
                    <span className="font-inter text-sm text-gray-500 flex items-center gap-1.5">
                      <Gift size={14} className="text-rose-gold" /> Gift Wrap
                    </span>
                    <span className="font-inter text-sm text-rose-gold font-medium">{CURRENCY}{giftWrapAmount}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="font-inter text-base font-medium text-gray-900">Total</span>
                  <span className="font-playfair text-2xl font-medium text-gray-900">{CURRENCY}{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Delivery Address Summary - Only on Payment Step */}
              {currentStep === 'payment' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-gray-100"
                >
                  <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-2 flex items-center gap-1.5">
                    <MapPin size={12} /> Deliver To
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="font-inter text-sm font-medium text-gray-800">{form.name}</p>
                    <p className="font-inter text-xs text-gray-500 mt-1 line-clamp-2">
                      {form.address}, {form.city} - {form.pincode}
                    </p>
                    <p className="font-inter text-xs text-gray-400 mt-1">{form.phone}</p>
                  </div>
                </motion.div>
              )}

              {/* Continue / Pay Button */}
              <div className="mt-6 hidden lg:block">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={loading}
                  className="w-full bg-purple-primary text-white font-inter text-sm font-semibold tracking-wider uppercase py-4 rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Processing...
                    </>
                  ) : currentStep === 'address' ? (
                    <>
                      Continue to Payment <CreditCard size={16} />
                    </>
                  ) : (
                    <>
                      <Lock size={16} /> PAY {CURRENCY}{total.toLocaleString()}
                    </>
                  )}
                </motion.button>

                <p className="text-center font-inter text-xs text-gray-400 mt-3">
                  Secured by Razorpay • 256-bit SSL Encryption
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Mobile Sticky Pay Button */}
      <div className="fixed bottom-[80px] left-0 right-0 z-40 lg:hidden px-4">
        <div className="bg-white rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4">
          {/* Total Row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400">Total to Pay</p>
              <p className="font-inter text-xs text-gray-500">{cart.length} item{cart.length !== 1 ? 's' : ''} · Secured</p>
            </div>
            <span className="font-playfair text-xl font-semibold text-purple-primary">{CURRENCY}{total.toLocaleString()}</span>
          </div>

          {/* Pay Button - Hide on address step */}
          {currentStep === 'payment' && (
            <motion.button
              type="submit"
              form="checkout-form"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-purple-primary text-white font-inter text-sm font-semibold tracking-wide py-3.5 rounded-full hover:bg-emerald-800 transition-colors disabled:opacity-50 shadow-lg shadow-purple-primary/20"
            >
              <Lock size={16} />
              {loading ? 'Processing...' : `PAY ${CURRENCY}${total.toLocaleString()}`}
            </motion.button>
          )}

          {/* Continue Button - Show only on address step */}
          {currentStep === 'address' && (
            <motion.button
              type="submit"
              form="checkout-form"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-purple-primary text-white font-inter text-sm font-semibold tracking-wide py-3.5 rounded-full hover:bg-emerald-800 transition-colors disabled:opacity-50 shadow-lg shadow-purple-primary/20"
            >
              Continue to Payment <CreditCard size={16} />
            </motion.button>
          )}

          {/* Razorpay Badge */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-full">
              <CreditCard size={12} className="text-gray-400" />
              <span className="font-inter text-[10px] text-gray-400">Secured by Razorpay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Error Toast */}
      <AnimatePresence>
        {paymentError && (
          <motion.div
            initial={{ opacity: 0, y: -30, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed top-6 right-6 z-50 max-w-sm w-full"
          >
            <div className="bg-white border border-red-100 rounded-sm shadow-lg p-5 flex gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"
              >
                <XCircle size={22} className="text-red-500" />
              </motion.div>
              <div className="flex-1">
                <p className="font-playfair text-sm font-semibold text-gray-800">{paymentError.title}</p>
                <p className="font-inter text-xs text-gray-500 mt-1 leading-relaxed">{paymentError.message}</p>
              </div>
              <button
                onClick={() => setPaymentError(null)}
                className="text-gray-300 hover:text-gray-500 self-start"
              >
                <XCircle size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
