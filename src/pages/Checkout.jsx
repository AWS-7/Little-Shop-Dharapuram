import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Lock, ShieldCheck, Truck, Ban, ArrowLeft, XCircle, MapPin, Check, ChevronDown, Star, User, Mail, Package, RefreshCw, Gift, Sparkles, Shield } from 'lucide-react';
import useStore from '../store/useStore';
import { getCurrentUser } from '../lib/firebaseAuth';
import { createOrder } from '../lib/orders';
import { markCartConverted } from '../lib/carts';
import { CURRENCY, POLICIES } from '../lib/constants';
import { getAddresses } from '../lib/addresses';

export default function Checkout() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const { cart, getCartTotal, getShipping, getOrderTotal, clearCart } = useStore();
  
  const [form, setForm] = useState({
    name: '', email: '', address: '', city: '', pincode: '', state: '',
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

  useEffect(() => {
    if (user?.uid) {
      getAddresses(user.uid).then(({ data }) => {
        if (data && data.length > 0) {
          setSavedAddresses(data);
          const defaultAddr = data.find((a) => a.is_default) || data[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            setForm({
              name: defaultAddr.full_name,
              email: user?.email || '',
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
    if (user?.uid) payload.user_id = user.uid;
    return payload;
  };

  const processOrder = async (paymentId) => {
    paymentInProgress.current = true;
    const payload = buildOrderPayload(paymentId);
    const { data: saved, error: orderError } = await createOrder(payload);
    
    if (orderError) {
      console.error('Order insert failed:', orderError);
      alert(`Order save failed: ${orderError.message}`);
    }

    if (user) await markCartConverted(user.uid);

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

    navigate('/order-success', { state: orderData });
    clearCart();
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (currentStep === 'address') {
      if (!form.name || !form.address || !form.city || !form.pincode) {
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
      theme: { color: '#6A0DAD' },
      modal: {
        ondismiss: function () {
          rzpModalOpen.current = false;
          setLoading(false);
        },
      },
    };

    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        rzpModalOpen.current = false;
        setLoading(false);
        setPaymentError({ title: 'Payment Failed', message: resp.error?.description });
      });
      rzpModalOpen.current = true;
      rzp.open();
    } else {
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
    { name: 'address', label: 'Delivery Address', type: 'text', placeholder: '123, Main Street, Apt 4B', full: true, icon: MapPin },
    { name: 'city', label: 'City', type: 'text', placeholder: 'Chennai', icon: Package },
    { name: 'state', label: 'State', type: 'text', placeholder: 'Tamil Nadu', icon: Package },
    { name: 'pincode', label: 'PIN Code', type: 'text', placeholder: '600001', icon: Package },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pt-36 pb-24">
      <div className="container-clean">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-purple-primary text-[10px] font-black uppercase tracking-[0.2em] mb-3">
              <Shield size={14} />
              <span>Secure Checkout</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight uppercase">Checkout</h1>
          </div>
          {/* Stepper */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${currentStep === 'address' ? 'text-purple-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${currentStep === 'address' ? 'bg-purple-primary text-white' : 'bg-gray-200'}`}>1</div>
              <span className="text-xs font-black uppercase tracking-widest">Address</span>
            </div>
            <div className="w-8 h-px bg-gray-200" />
            <div className={`flex items-center gap-2 ${currentStep === 'payment' ? 'text-purple-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${currentStep === 'payment' ? 'bg-purple-primary text-white' : 'bg-gray-200'}`}>2</div>
              <span className="text-xs font-black uppercase tracking-widest">Payment</span>
            </div>
          </div>
        </div>

        <form onSubmit={handlePayment}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {currentStep === 'address' ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-10 shadow-sm">
                <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-50">
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Delivery Details</h2>
                  {savedAddresses.length > 0 && (
                    <button type="button" onClick={() => setShowAddressPicker(!showAddressPicker)} className="text-purple-primary text-xs font-black uppercase tracking-widest hover:underline">
                      {showAddressPicker ? 'Close' : 'Use Saved'}
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showAddressPicker && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-8 grid gap-4">
                      {savedAddresses.map(addr => (
                        <button key={addr.id} type="button" onClick={() => selectAddress(addr)} className={`text-left p-6 rounded-2xl border transition-all ${selectedAddressId === addr.id ? 'border-purple-primary bg-purple-light' : 'border-gray-100 hover:border-purple-200'}`}>
                          <p className="font-black text-gray-900">{addr.full_name}</p>
                          <p className="text-xs font-medium text-gray-500 mt-1">{addr.address}, {addr.city} — {addr.pincode}</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {fields.map(field => (
                    <div key={field.name} className={field.full ? 'md:col-span-2' : ''}>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{field.label}</label>
                      <div className="relative">
                        <field.icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input
                          type={field.type}
                          name={field.name}
                          value={form[field.name]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          required
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all placeholder:text-gray-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-10 shadow-sm">
                <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-50">
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Payment Method</h2>
                  <button type="button" onClick={() => setCurrentStep('address')} className="text-purple-primary text-xs font-black uppercase tracking-widest hover:underline">
                    Edit Address
                  </button>
                </div>
                
                <div className="grid gap-4">
                  {['upi', 'card', 'netbanking'].map(method => (
                    <button key={method} type="button" onClick={() => setSelectedPaymentMethod(method)} className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${selectedPaymentMethod === method ? 'border-purple-primary bg-purple-light shadow-lg shadow-purple-primary/5' : 'border-gray-100 hover:border-purple-200'}`}>
                      <span className="font-black text-gray-900 uppercase tracking-widest text-sm">{method}</span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === method ? 'border-purple-primary' : 'border-gray-200'}`}>
                        {selectedPaymentMethod === method && <div className="w-3 h-3 rounded-full bg-purple-primary" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gift Wrap */}
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isGiftWrap ? 'bg-purple-primary text-white shadow-lg' : 'bg-gray-50 text-gray-300'}`}>
                  <Gift size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-black text-gray-900 uppercase tracking-tight text-sm">Add Gift Wrap (+{CURRENCY}{GIFT_WRAP_PRICE})</p>
                  <p className="text-xs font-medium text-gray-400 mt-1">Premium luxury packaging with a personal note.</p>
                </div>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isGiftWrap ? 'bg-purple-primary border-purple-primary' : 'border-gray-200 group-hover:border-purple-primary'}`}>
                  {isGiftWrap && <Check size={14} className="text-white" />}
                </div>
                <input type="checkbox" checked={isGiftWrap} onChange={(e) => setIsGiftWrap(e.target.checked)} className="hidden" />
              </label>
              
              <AnimatePresence>
                {isGiftWrap && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-6 pt-6 border-t border-gray-50">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Gift Message</label>
                    <textarea value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} rows={3} placeholder="Write a heartfelt message..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all resize-none placeholder:text-gray-300" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-10 shadow-xl shadow-purple-primary/5 sticky top-40">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-8 pb-4 border-b border-gray-50">Order Summary</h2>
              
              {/* Item Details with Images */}
              <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-16 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-900 truncate">{item.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Qty: {item.quantity}</p>
                      <p className="text-xs font-black text-purple-primary mt-1">{CURRENCY}{item.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-6 mb-8 border-t border-gray-50 pt-6">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Items Total</span>
                  <span className="font-black text-gray-900">{CURRENCY}{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Shipping</span>
                  <span className={`font-black ${shipping === 0 ? 'text-green-600' : 'text-gray-900'}`}>{shipping === 0 ? 'FREE' : `${CURRENCY}${shipping}`}</span>
                </div>
                {isGiftWrap && (
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Gift Wrap</span>
                    <span className="font-black text-gray-900">{CURRENCY}{GIFT_WRAP_PRICE}</span>
                  </div>
                )}
              </div>

              <div className="bg-purple-light rounded-2xl p-6 mb-10 border border-purple-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-purple-primary uppercase tracking-widest">Total Amount</span>
                  <span className="text-2xl font-black text-purple-primary">{CURRENCY}{total.toLocaleString()}</span>
                </div>
              </div>

              {paymentError && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <p className="text-red-600 text-xs font-black uppercase tracking-widest mb-1">{paymentError.title}</p>
                  <p className="text-red-600 text-xs font-medium">{paymentError.message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-purple-primary/20 hover:bg-purple-secondary transition-all active:scale-[0.98] disabled:opacity-50 hidden lg:flex items-center justify-center gap-3"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : currentStep === 'address' ? 'Continue to Payment' : `PAY ${CURRENCY}${total.toLocaleString()}`}
              </button>
              
              <div className="mt-8 pt-8 border-t border-gray-50 space-y-4">
                <div className="flex items-center gap-3 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  <Lock size={14} className="text-purple-primary" />
                  <span>Secure SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-purple-primary" />
                  <span>100% Buyer Protection</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Sticky Pay Button */}
          <div className="fixed bottom-[80px] left-0 right-0 z-40 lg:hidden px-4">
            <div className="bg-white rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-black text-[10px] tracking-widest uppercase text-gray-400">Total to Pay</p>
                  <p className="font-bold text-xs text-gray-500">{cart.length} item{cart.length !== 1 ? 's' : ''} · Secured</p>
                </div>
                <span className="text-xl font-black text-purple-primary">{CURRENCY}{total.toLocaleString()}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-purple-primary text-white font-black text-sm uppercase tracking-widest py-4 rounded-full hover:bg-purple-secondary transition-all disabled:opacity-50 shadow-lg shadow-purple-primary/20"
              >
                {loading ? 'Processing...' : currentStep === 'address' ? 'Continue to Payment' : `PAY ${CURRENCY}${total.toLocaleString()}`}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Payment Error Toast */}
      <AnimatePresence>
        {paymentError && (
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-24 right-6 z-50 max-w-sm w-full bg-white border border-red-100 rounded-3xl shadow-2xl p-6 flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
              <XCircle size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{paymentError.title}</p>
              <p className="text-xs font-medium text-gray-400 mt-1 leading-relaxed">{paymentError.message}</p>
            </div>
            <button onClick={() => setPaymentError(null)} className="text-gray-300 hover:text-gray-500 self-start"><XCircle size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
