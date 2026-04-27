import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Truck, Shield, Lock, BadgeCheck, Sparkles } from 'lucide-react';
import useStore from '../store/useStore';
import { CURRENCY, SHIPPING_THRESHOLD } from '../lib/constants';
import { PLACEHOLDER_IMG } from '../lib/products';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, getShipping, getOrderTotal } = useStore();
  const subtotal = getCartTotal();
  const shipping = getShipping();
  const total = getOrderTotal();

  if (cart.length === 0) {
    return (
      <div className="container-clean pt-48 pb-24 text-center min-h-[70vh]">
        <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <ShoppingBag size={48} className="text-gray-200" strokeWidth={1} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight uppercase">Your Bag is Empty</h2>
        <p className="text-gray-400 text-sm font-medium mb-12 max-w-xs mx-auto leading-relaxed">
          Looks like you haven't added anything to your curated collection yet.
        </p>
        <Link to="/shop" className="bg-purple-primary text-white px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-purple-primary/20 hover:bg-purple-secondary transition-all">
          Explore Boutique
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        <div className="container-clean pt-36 pb-32">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="flex items-center gap-2 text-purple-primary text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                <Sparkles size={14} />
                <span>Your Selections</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight uppercase">Shopping Bag</h1>
            </div>
            <p className="text-gray-400 text-sm font-medium">
              {cart.length} exclusive item{cart.length !== 1 ? 's' : ''} in your collection
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-8">
              {/* Free Shipping Progress */}
              <div className="bg-white border border-purple-50 rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-light flex items-center justify-center text-purple-primary shrink-0">
                    <Truck size={24} />
                  </div>
                  <div>
                    {subtotal < SHIPPING_THRESHOLD ? (
                      <>
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Almost There!</p>
                        <p className="text-xs font-medium text-gray-400 mt-1">
                          Add <span className="text-purple-primary font-black">{CURRENCY}{(SHIPPING_THRESHOLD - subtotal).toLocaleString()}</span> more for <span className="text-purple-primary font-black">COMPLIMENTARY shipping</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-black text-purple-primary uppercase tracking-tight">Priority Shipping Unlocked</p>
                        <p className="text-xs font-medium text-gray-400 mt-1">Your order qualifies for complimentary luxury delivery.</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (subtotal / SHIPPING_THRESHOLD) * 100)}%` }}
                    className="h-full bg-purple-primary rounded-full"
                  />
                </div>
              </div>

              {/* List */}
              <div className="grid gap-6">
                <AnimatePresence mode="popLayout">
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm hover:shadow-xl hover:shadow-purple-primary/5 transition-all relative group"
                    >
                      <div className="flex gap-8">
                        {/* Image */}
                        <Link to={`/product/${item.id}`} className="w-24 h-32 md:w-32 md:h-40 shrink-0 overflow-hidden rounded-2xl bg-gray-50 border border-gray-100">
                          <img src={item.image || PLACEHOLDER_IMG} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        </Link>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-between min-w-0 py-2">
                          <div>
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <p className="text-[10px] font-black text-purple-primary uppercase tracking-[0.2em]">{item.category}</p>
                              <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </div>
                            <Link to={`/product/${item.id}`}>
                              <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight leading-tight hover:text-purple-primary transition-colors truncate">{item.name}</h3>
                            </Link>
                            <p className="text-lg font-black text-purple-primary mt-3">{CURRENCY}{item.price.toLocaleString()}</p>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-4 mt-6">
                            <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-purple-primary transition-colors">
                                <Minus size={16} />
                              </button>
                              <span className="w-12 text-center text-sm font-black text-gray-900">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-purple-primary transition-colors">
                                <Plus size={16} />
                              </button>
                            </div>
                            <div className="h-6 w-px bg-gray-100" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                              Total: <span className="text-gray-900">{CURRENCY}{(item.price * item.quantity).toLocaleString()}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <Link to="/shop" className="inline-flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-purple-primary transition-all group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span>Continue Shopping</span>
              </Link>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-10 shadow-xl shadow-purple-primary/5 sticky top-40">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-8 pb-4 border-b border-gray-50">Order Summary</h2>
                
                <div className="space-y-6 mb-8">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Subtotal</span>
                    <span className="font-black text-gray-900">{CURRENCY}{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Shipping</span>
                    <span className={`font-black ${shipping === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {shipping === 0 ? 'FREE' : `${CURRENCY}${shipping}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Taxes (GST)</span>
                    <span className="font-black text-gray-900 uppercase text-[10px]">Included</span>
                  </div>
                </div>

                <div className="bg-purple-light rounded-2xl p-6 mb-8 border border-purple-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-purple-primary uppercase tracking-widest">Total Amount</span>
                    <span className="text-2xl font-black text-purple-primary">{CURRENCY}{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Trust Section */}
                <div className="space-y-3 mb-10">
                  <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <Lock size={14} className="text-purple-primary" />
                    <span>Secure SSL Encryption</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <Shield size={14} className="text-purple-primary" />
                    <span>Buyer Protection Guaranteed</span>
                  </div>
                </div>

                <Link to="/checkout" className="block w-full bg-purple-primary text-white text-center py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-teal-500/20 hover:bg-purple-secondary transition-all active:scale-[0.98]">
                  Secure Checkout
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Summary — Professional Boutique Style */}
      <div className="fixed bottom-[80px] left-0 right-0 z-40 md:hidden px-4">
        <div className="bg-white rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4">
          {/* Order Summary Row */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-50">
            <div>
              <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400">
                Your Order
              </p>
              <p className="font-inter text-xs text-gray-500">
                {cart.length} item{cart.length !== 1 ? 's' : ''} · {shipping === 0 ? 'Free Shipping' : `${CURRENCY}${shipping} shipping`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-playfair text-lg font-semibold text-purple-primary">{CURRENCY}{total.toLocaleString()}</p>
              <p className="font-inter text-[10px] text-gray-400">Inc. all taxes</p>
            </div>
          </div>

          {/* Secure Checkout Button */}
          <Link
            to="/checkout"
            className="flex items-center justify-center gap-2 w-full bg-purple-primary text-white font-inter text-sm font-semibold tracking-wide py-3.5 rounded-full hover:bg-purple-secondary transition-colors shadow-lg shadow-teal-500/20"
          >
            <Lock size={14} />
            PROCEED TO CHECKOUT
          </Link>
        </div>
      </div>
    </>
  );
}
