import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Package, Truck, CheckCircle, Clock, PackageCheck, MapPin, Check } from 'lucide-react';
import { CURRENCY } from '../lib/constants';
import { getOrderById, subscribeToOrder } from '../lib/orders';

const statusSteps = [
  { key: 'Ordered', icon: Clock, label: 'Ordered', desc: 'Order placed successfully' },
  { key: 'Packed', icon: PackageCheck, label: 'Packed', desc: 'Items packed & ready' },
  { key: 'Shipped', icon: Truck, label: 'Shipped', desc: 'On the way to courier' },
  { key: 'Out for Delivery', icon: MapPin, label: 'Out for Delivery', desc: 'Arriving today' },
  { key: 'Delivered', icon: CheckCircle, label: 'Delivered', desc: 'Order delivered' },
];

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('id') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-search if ?id= param is present
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      setQuery(idParam);
      searchOrder(idParam);
    }
  }, [searchParams]);

  const searchOrder = async (searchId) => {
    setLoading(true);
    setError('');
    setResult(null);

    const { data, error: err } = await getOrderById(searchId);

    if (err || !data) {
      setError('No order found. Please check your Order ID.');
      setLoading(false);
      return;
    }

    setResult({
      orderId: data.order_id,
      status: data.status,
      courierTrackingId: data.courier_tracking_id,
      date: new Date(data.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      estimatedDelivery: data.status !== 'Delivered' ? 'Estimated 3-5 business days' : null,
      items: data.items || [],
      total: data.total,
      customer: data.customer,
    });
    setLoading(false);

    // Subscribe for realtime updates
    const channel = subscribeToOrder(searchId, (updated) => {
      setResult((prev) => prev ? { ...prev, status: updated.status } : prev);
    });
    // Cleanup on next search
    return () => channel.unsubscribe();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    await searchOrder(query.trim());
  };

  const currentStep = result ? statusSteps.findIndex((s) => s.key === result.status) : -1;

  return (
    <div className="container-luxury section-spacing">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="font-inter text-xs tracking-[0.3em] uppercase text-rose-gold mb-3">
            Stay Updated
          </p>
          <h1 className="font-playfair text-3xl md:text-4xl text-purple-primary mb-3">
            Track Your Order
          </h1>
          <p className="font-inter text-sm text-gray-400 max-w-md mx-auto">
            Enter your Tracking ID or registered phone number to see real-time order status
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center mb-10 max-w-lg mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. LS-A3K7YM2P or 9876543210"
            className="flex-1 border border-gray-200 rounded-l-sm px-5 py-3.5 font-inter text-sm outline-none focus:border-purple-primary transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-primary text-white px-6 py-3.5 rounded-r-sm hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <span className="font-inter text-sm">Searching...</span>
            ) : (
              <><Search size={16} /><span className="font-inter text-sm hidden sm:inline">Track</span></>
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-rose-gold/5 border border-rose-gold/20 rounded-sm p-4 mb-8 max-w-lg mx-auto"
          >
            <p className="font-inter text-sm text-rose-gold">{error}</p>
          </motion.div>
        )}

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Order Info Card */}
            <div className="bg-white border border-gray-100 rounded-sm p-6 md:p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-inter text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-1">Tracking ID</p>
                  <p className="font-inter text-lg font-semibold text-purple-primary tracking-wider">{result.orderId}</p>
                </div>
                {result.estimatedDelivery && currentStep < statusSteps.length - 1 && (
                  <div className="text-right">
                    <p className="font-inter text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-1">Estimated Delivery</p>
                    <p className="font-inter text-sm font-medium text-purple-primary">{result.estimatedDelivery}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-gray-100">
                <div>
                  <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-1">Order Date</p>
                  <p className="font-inter text-sm text-gray-700">{result.date}</p>
                </div>
                <div>
                  <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-1">Items</p>
                  <p className="font-inter text-sm text-gray-700">{result.items.length} product{result.items.length > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-1">Total</p>
                  <p className="font-inter text-sm font-semibold text-purple-primary">{CURRENCY}{result.total.toLocaleString()}</p>
                </div>
                {result.customer && (
                  <div>
                    <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-1">Delivery To</p>
                    <p className="font-inter text-sm text-gray-700">{result.customer.city}</p>
                  </div>
                )}
              </div>

              {/* Courier Tracking ID Display */}
              {result.courierTrackingId && (
                <div className="mt-6 p-4 bg-purple-light border border-purple-100 rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="text-purple-primary" size={20} />
                    <div>
                      <p className="font-inter text-[10px] tracking-widest uppercase text-purple-primary/60 font-bold">Courier Tracking ID</p>
                      <p className="font-inter text-sm font-black text-purple-primary tracking-widest uppercase">{result.courierTrackingId}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(result.courierTrackingId);
                      alert('Tracking ID copied!');
                    }}
                    className="text-purple-primary hover:text-purple-dark transition-colors"
                  >
                    <Check size={16} />
                  </button>
                </div>
              )}

              {/* Items */}
              <div className="pt-5 space-y-3">
                {result.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-gray-300" />
                      <span className="font-inter text-sm text-gray-700">{item.name}</span>
                      <span className="font-inter text-[10px] text-gray-400">×{item.quantity}</span>
                    </div>
                    <span className="font-inter text-sm text-purple-primary font-medium">
                      {CURRENCY}{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ Visual Progress Stepper ═══ */}
            <div className="bg-white border border-gray-100 rounded-sm p-6 md:p-8">
              <h3 className="font-playfair text-lg text-purple-primary mb-8">Order Progress</h3>

              {/* Desktop Horizontal Stepper */}
              <div className="hidden md:block">
                <div className="relative flex justify-between items-start">
                  {/* Background connector */}
                  <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-gray-200 -z-0" />
                  {/* Filled connector */}
                  {currentStep > 0 && (
                    <div
                      className="absolute top-5 left-[10%] h-[2px] bg-purple-primary -z-0 transition-all duration-700"
                      style={{ width: `${(currentStep / (statusSteps.length - 1)) * 80}%` }}
                    />
                  )}

                  {statusSteps.map((step, idx) => {
                    const completed = idx <= currentStep;
                    const active = idx === currentStep;
                    const StepIcon = completed && idx < currentStep ? Check : step.icon;
                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1 relative z-10">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                            completed
                              ? 'bg-purple-primary text-white shadow-md shadow-purple-primary/20'
                              : 'bg-gray-100 text-gray-400'
                          } ${active ? 'ring-4 ring-purple-primary/20 scale-110' : ''}`}
                        >
                          <StepIcon size={16} />
                        </motion.div>
                        <p className={`font-inter text-xs text-center font-medium ${completed ? 'text-purple-primary' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        <p className={`font-inter text-[10px] text-center mt-0.5 ${completed ? 'text-gray-500' : 'text-gray-300'}`}>
                          {step.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Vertical Stepper */}
              <div className="md:hidden space-y-0">
                {statusSteps.map((step, idx) => {
                  const completed = idx <= currentStep;
                  const active = idx === currentStep;
                  const isLast = idx === statusSteps.length - 1;
                  const StepIcon = completed && idx < currentStep ? Check : step.icon;
                  return (
                    <div key={step.key} className="flex gap-4">
                      {/* Step indicator + connector */}
                      <div className="flex flex-col items-center">
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: idx * 0.08 }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            completed
                              ? 'bg-purple-primary text-white'
                              : 'bg-gray-100 text-gray-400'
                          } ${active ? 'ring-4 ring-purple-primary/20' : ''}`}
                        >
                          <StepIcon size={14} />
                        </motion.div>
                        {!isLast && (
                          <div className={`w-[2px] h-10 ${idx < currentStep ? 'bg-purple-primary' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      {/* Label */}
                      <div className={`pb-6 ${isLast ? '' : ''}`}>
                        <p className={`font-inter text-sm font-medium ${completed ? 'text-purple-primary' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        <p className={`font-inter text-xs ${completed ? 'text-gray-500' : 'text-gray-300'}`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
