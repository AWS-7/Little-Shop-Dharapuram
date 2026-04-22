import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, CreditCard,
  User, Phone, PackageCheck, Check, ChevronDown, Mail,
} from 'lucide-react';
import { getOrderById, updateOrderStatus, updateOrderTrackingId, subscribeToOrder } from '../../lib/orders';
import { CURRENCY, ORDER_STATUSES } from '../../lib/constants';

const statusSteps = [
  { key: 'Ordered', icon: Clock, label: 'Ordered' },
  { key: 'Packed', icon: PackageCheck, label: 'Packed' },
  { key: 'Shipped', icon: Truck, label: 'Shipped' },
  { key: 'Out for Delivery', icon: MapPin, label: 'Out for Delivery' },
  { key: 'Delivered', icon: CheckCircle, label: 'Delivered' },
];

const statusColor = (status) => {
  switch (status) {
    case 'Delivered': return 'bg-purple-primary/10 text-purple-primary';
    case 'Shipped':
    case 'Out for Delivery': return 'bg-blue-50 text-blue-600';
    case 'Packed': return 'bg-purple-50 text-purple-600';
    default: return 'bg-amber-50 text-amber-600';
  }
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const isAuth = localStorage.getItem('admin_auth');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      const { data, error: err } = await getOrderById(id);
      if (err) setError('Order not found');
      else {
        setOrder(data);
        setTrackingId(data.courier_tracking_id || '');
      }
      setLoading(false);
    };
    fetchOrder();

    // Realtime subscription
    const channel = subscribeToOrder(id, (updated) => {
      setOrder(updated);
    });
    return () => channel.unsubscribe();
  }, [id]);

  if (!isAuth) return <Navigate to="/admin" />;

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    const { data, error: err } = await updateOrderStatus(id, newStatus);
    if (!err && data) setOrder(data);
    setUpdating(false);
  };

  const handleTrackingUpdate = async () => {
    setUpdating(true);
    const { data, error: err } = await updateOrderTrackingId(id, trackingId);
    if (!err && data) {
      setOrder(data);
      alert('Tracking ID updated successfully!');
    }
    setUpdating(false);
  };

  const currentStep = order ? statusSteps.findIndex((s) => s.key === order.status) : -1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="font-inter text-sm text-gray-400">Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package size={48} className="mx-auto text-gray-200 mb-4" strokeWidth={1} />
          <p className="font-playfair text-xl text-gray-400 mb-2">Order Not Found</p>
          <p className="font-inter text-sm text-gray-400 mb-6">{error || `No order with ID "${id}" exists`}</p>
          <Link to="/admin/dashboard" className="btn-primary inline-block">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const customer = order.customer || {};
  const items = order.items || [];
  const isPaid = !!(order.payment_id || order.razorpay_payment_id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-purple-primary text-white px-6 md:px-10 py-4">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-2 font-inter text-sm text-white/70 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <p className="font-inter text-xs text-white/50">Admin Console</p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <p className="font-inter text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-1">Order Detail</p>
            <h1 className="font-playfair text-2xl md:text-3xl text-purple-primary">{order.order_id}</h1>
            <p className="font-inter text-xs text-gray-400 mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-block px-3 py-1.5 rounded-full font-inter text-xs font-semibold tracking-wider uppercase ${statusColor(order.status)}`}>
              {order.status}
            </span>
            <span className={`inline-block px-3 py-1.5 rounded-full font-inter text-xs font-semibold tracking-wider uppercase ${
              isPaid ? 'bg-purple-primary/10 text-purple-primary' : 'bg-rose-gold/10 text-rose-gold'
            }`}>
              {isPaid ? 'Paid' : 'Pending'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Order Info (2/3) ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Stepper */}
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-playfair text-lg text-purple-primary">Order Progress</h2>
                <div className="relative">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={updating}
                    className="appearance-none bg-purple-primary text-white font-inter text-xs px-4 py-2 pr-8 rounded-sm cursor-pointer outline-none disabled:opacity-50"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                </div>
              </div>

              {/* Horizontal stepper */}
              <div className="relative flex justify-between items-start">
                <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-gray-200" />
                {currentStep > 0 && (
                  <div
                    className="absolute top-5 left-[10%] h-[2px] bg-purple-primary transition-all duration-700"
                    style={{ width: `${(currentStep / (statusSteps.length - 1)) * 80}%` }}
                  />
                )}
                {statusSteps.map((step, idx) => {
                  const completed = idx <= currentStep;
                  const active = idx === currentStep;
                  const StepIcon = completed && idx < currentStep ? Check : step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1 relative z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                        completed ? 'bg-purple-primary text-white shadow-md shadow-purple-primary/20' : 'bg-gray-100 text-gray-400'
                      } ${active ? 'ring-4 ring-purple-primary/20 scale-110' : ''}`}>
                        <StepIcon size={16} />
                      </div>
                      <p className={`font-inter text-[10px] md:text-xs text-center font-medium ${completed ? 'text-purple-primary' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <h2 className="font-playfair text-lg text-purple-primary mb-4">Items Ordered</h2>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                    {item.image && (
                      <div className="w-14 h-[70px] flex-shrink-0 overflow-hidden bg-gray-50 rounded-sm">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-inter text-sm text-gray-700">{item.name}</p>
                      <p className="font-inter text-[10px] text-gray-400">Qty: {item.quantity} × {CURRENCY}{item.price?.toLocaleString()}</p>
                    </div>
                    <p className="font-inter text-sm font-medium text-purple-primary flex-shrink-0">
                      {CURRENCY}{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
                <div className="flex justify-between font-inter text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="text-gray-700">{CURRENCY}{order.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-inter text-sm text-gray-500">
                  <span>Shipping</span>
                  <span className={order.shipping === 0 ? 'text-purple-primary font-medium' : 'text-gray-700'}>
                    {order.shipping === 0 ? 'FREE' : `${CURRENCY}${order.shipping}`}
                  </span>
                </div>
                <div className="flex justify-between font-inter text-sm font-medium border-t border-dashed border-gray-200 pt-3 mt-3">
                  <span className="text-gray-700">Total</span>
                  <span className="font-playfair text-xl text-purple-primary">{CURRENCY}{order.total?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Customer & Payment (1/3) ── */}
          <div className="space-y-6">
            {/* Payment Info */}
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <h3 className="font-playfair text-lg text-purple-primary mb-4 flex items-center gap-2">
                <CreditCard size={16} className="text-rose-gold" /> Payment
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-0.5">Status</p>
                  <p className={`font-inter text-sm font-semibold ${isPaid ? 'text-purple-primary' : 'text-rose-gold'}`}>
                    {isPaid ? 'Paid & Verified' : 'Payment Pending'}
                  </p>
                </div>
                {(order.payment_id || order.razorpay_payment_id) && (
                  <div>
                    <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-0.5">Payment ID</p>
                    <p className="font-inter text-xs text-gray-700 break-all">{order.payment_id || order.razorpay_payment_id}</p>
                  </div>
                )}
                <div>
                  <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-0.5">Amount</p>
                  <p className="font-inter text-sm font-semibold text-purple-primary">{CURRENCY}{order.total?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <h3 className="font-playfair text-lg text-purple-primary mb-4 flex items-center gap-2">
                <User size={16} className="text-rose-gold" /> Customer
              </h3>
              <div className="space-y-3">
                {customer.name && (
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    <span className="font-inter text-sm text-gray-700">{customer.name}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="font-inter text-sm text-gray-700">{customer.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <h3 className="font-playfair text-lg text-purple-primary mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-rose-gold" /> Shipping Address
              </h3>
              <div className="font-inter text-sm text-gray-700 leading-relaxed mb-6">
                {customer.name && <p className="font-medium">{customer.name}</p>}
                {customer.address && <p>{customer.address}</p>}
                {(customer.city || customer.state || customer.pincode) && (
                  <p>{[customer.city, customer.state, customer.pincode].filter(Boolean).join(', ')}</p>
                )}
              </div>

              {/* Courier Tracking ID Input */}
              <div className="pt-6 border-t border-gray-100">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Courier Tracking ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="Enter Tracking ID"
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-sm px-4 py-2 text-xs font-medium outline-none focus:border-purple-primary transition-all"
                  />
                  <button
                    onClick={handleTrackingUpdate}
                    disabled={updating}
                    className="bg-purple-primary text-white px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-purple-secondary transition-all disabled:opacity-50"
                  >
                    Update
                  </button>
                </div>
                <p className="text-[9px] text-gray-400 mt-2 italic">Update this to notify the customer about their courier tracking ID.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
