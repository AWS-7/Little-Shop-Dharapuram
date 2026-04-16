import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ChevronRight, Clock, Truck, CheckCircle, MapPin, PackageCheck, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserOrders } from '../lib/orders';
import { CURRENCY } from '../lib/constants';

const statusColor = (status) => {
  switch (status) {
    case 'Delivered': return 'bg-purple-primary/10 text-purple-primary';
    case 'Shipped':
    case 'Out for Delivery': return 'bg-blue-50 text-blue-600';
    case 'Packed': return 'bg-purple-50 text-purple-600';
    default: return 'bg-amber-50 text-amber-600';
  }
};

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const { data } = await getUserOrders(user.id);
      setOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  if (authLoading) {
    return (
      <div className="container-luxury section-spacing flex items-center justify-center min-h-[50vh]">
        <p className="font-inter text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/account" />;

  return (
    <div className="container-luxury section-spacing">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="font-inter text-xs tracking-[0.3em] uppercase text-rose-gold mb-3">Your Account</p>
          <h1 className="font-playfair text-3xl md:text-4xl text-purple-primary mb-3">My Orders</h1>
          <p className="font-inter text-sm text-gray-400">View and track all your past and current orders</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="font-inter text-sm text-gray-400">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" strokeWidth={1} />
            <p className="font-playfair text-xl text-gray-400 mb-2">No orders yet</p>
            <p className="font-inter text-sm text-gray-400 mb-6">Your order history will appear here once you make a purchase</p>
            <Link to="/shop" className="btn-primary inline-block">Start Shopping</Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => (
              <motion.div
                key={order.order_id || idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={`/track-order?id=${order.order_id}`}
                  className="block bg-white border border-gray-100 rounded-sm p-5 md:p-6 hover:border-purple-primary/20 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-inter text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-0.5">Order ID</p>
                      <p className="font-inter text-sm font-semibold text-purple-primary tracking-wider">{order.order_id}</p>
                    </div>
                    <span className={`inline-block px-2.5 py-1 rounded-full font-inter text-[10px] font-semibold tracking-wider uppercase ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-0.5">Date</p>
                        <p className="font-inter text-xs text-gray-700">
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-0.5">Total</p>
                        <p className="font-inter text-xs font-medium text-purple-primary">{CURRENCY}{order.total?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-0.5">Items</p>
                        <p className="font-inter text-xs text-gray-700">{order.items?.length || 0} product{(order.items?.length || 0) !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
