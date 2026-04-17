import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ChevronRight, ShoppingBag, Sparkles, Shield } from 'lucide-react';
import { getCurrentUser } from '../lib/firebaseAuth';
import { getUserOrders } from '../lib/orders';
import { CURRENCY } from '../lib/constants';

const statusColor = (status) => {
  switch (status) {
    case 'Delivered': return 'bg-green-50 text-green-600';
    case 'Shipped':
    case 'Out for Delivery': return 'bg-blue-50 text-blue-600';
    case 'Packed': return 'bg-purple-50 text-purple-600';
    default: return 'bg-amber-50 text-amber-600';
  }
};

export default function MyOrders() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setAuthLoading(false);
    
    if (currentUser?.uid) {
      fetchOrders(currentUser.uid);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchOrders = async (uid) => {
    try {
      const { data } = await getUserOrders(uid);
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: { pathname: '/my-orders' } }} />;
  }

  return (
    <div className="container-clean pt-36 pb-24 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-purple-primary text-[10px] font-black uppercase tracking-[0.2em] mb-3">
              <Sparkles size={14} />
              <span>Purchase History</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight uppercase">My Orders</h1>
          </div>
          <p className="text-gray-400 text-sm font-medium max-w-xs">
            Track your luxury essentials from our boutique to your doorstep.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-purple-primary/10 border-t-purple-primary rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100"
          >
            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={40} className="text-gray-200" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-400 text-sm font-medium mb-10">Your curated collection is waiting to be started.</p>
            <Link to="/shop" className="bg-purple-primary text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-purple-primary/20 hover:bg-purple-secondary transition-all">
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order, idx) => (
              <motion.div
                key={order.order_id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={`/track-order?id=${order.order_id}`}
                  className="group block bg-white border border-gray-100 rounded-3xl p-6 md:p-8 hover:border-purple-primary hover:shadow-xl hover:shadow-purple-primary/5 transition-all relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-purple-light rounded-2xl flex items-center justify-center text-purple-primary shrink-0">
                        <Package size={30} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
                        <p className="text-lg font-black text-gray-900 tracking-tight">#{order.order_id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1 md:max-w-md">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Placed On</p>
                        <p className="text-sm font-bold text-gray-700">
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                        <p className="text-sm font-black text-purple-primary">{CURRENCY}{order.total?.toLocaleString()}</p>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                        <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-gray-300 group-hover:bg-purple-primary group-hover:text-white transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Security Footer */}
        <div className="mt-16 flex items-center justify-center gap-3 text-[10px] font-black text-gray-300 uppercase tracking-widest">
          <Shield size={16} />
          <span>Encrypted Transaction History</span>
        </div>
      </div>
    </div>
  );
}

