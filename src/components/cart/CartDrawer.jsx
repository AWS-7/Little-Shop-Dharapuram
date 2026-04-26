import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import useStore from '../../store/useStore';
import { CURRENCY } from '../../lib/constants';

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, updateQuantity, removeFromCart } = useStore();
  const navigate = useNavigate();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md md:max-w-[40%] lg:max-w-md bg-white z-50 flex flex-col"
            style={{ maxHeight: '100dvh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-playfair text-lg text-gray-900">
                Your Bag ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-600" strokeWidth={1.5} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center h-full px-6">
                  <ShoppingBag size={48} className="text-gray-300 mb-4" strokeWidth={1} />
                  <p className="font-playfair text-xl text-gray-400 mb-2">Your bag is empty</p>
                  <p className="font-inter text-sm text-gray-400 mb-6 text-center">
                    Looks like you haven't added anything yet
                  </p>
                  <Link
                    to="/shop"
                    onClick={onClose}
                    className="px-8 py-3 bg-purple-primary text-white font-inter text-sm font-medium rounded-full hover:bg-emerald-900 transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-5">
                      {/* Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.image || '/placeholder.jpg'}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                          onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-inter text-sm font-medium text-gray-900 truncate mb-0.5">
                          {item.name}
                        </h3>
                        <p className="font-inter text-xs text-gray-400 uppercase tracking-wider mb-2">
                          {item.category}
                        </p>
                        <p className="font-playfair text-sm font-medium text-gray-900">
                          {CURRENCY}{(item.price * item.quantity).toLocaleString()}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-3">
                          {/* Quantity */}
                          <div className="flex items-center border border-gray-200 rounded-md">
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-10 h-8 flex items-center justify-center font-inter text-sm font-medium border-x border-gray-200">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="flex items-center gap-1.5 text-rose-gold font-inter text-xs font-medium hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            {cart.length > 0 && (
              <div className="border-t border-gray-100 bg-white p-5 pb-safe">
                {/* Subtotal */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-inter text-sm text-gray-600">Subtotal</span>
                  <span className="font-playfair text-xl font-medium text-gray-900">
                    {CURRENCY}{subtotal.toLocaleString()}
                  </span>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full py-4 bg-[#f2a20c] text-white font-inter text-sm font-medium uppercase tracking-wider rounded-full hover:bg-[#d9910a] transition-colors"
                >
                  Proceed to Checkout
                </button>

                <p className="text-center font-inter text-xs text-gray-400 mt-3">
                  Shipping & taxes calculated at checkout
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
