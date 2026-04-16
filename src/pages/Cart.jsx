import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Truck, Shield, Lock, BadgeCheck } from 'lucide-react';
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
      <div className="container-luxury section-spacing text-center">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
        <h2 className="font-playfair text-2xl text-gray-400 mb-2">Your bag is empty</h2>
        <p className="font-inter text-sm text-gray-400 mb-8">Discover our curated collections</p>
        <Link to="/shop" className="btn-primary inline-block">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <>
      <div className="container-luxury section-spacing pb-36 md:pb-16">
        {/* Page Title — Elegant & Centered */}
        <div className="text-center mb-8 border-b border-gray-100 pb-6">
          <h1 className="font-playfair text-xl md:text-2xl text-gray-800 tracking-wide">Shopping Bag</h1>
          <p className="font-inter text-xs text-gray-400 mt-2">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Free Shipping Progress - Luxury Style */}
            {subtotal < SHIPPING_THRESHOLD ? (
              <div className="bg-gradient-to-r from-rose-gold/10 to-purple-primary/5 border border-rose-gold/20 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-rose-gold/20 flex items-center justify-center">
                    <Truck size={18} className="text-rose-gold" />
                  </div>
                  <div>
                    <p className="font-playfair text-sm text-purple-primary font-medium">
                      You're almost there!
                    </p>
                    <p className="font-inter text-xs text-gray-500">
                      Add <span className="text-rose-gold font-semibold">{CURRENCY}{(SHIPPING_THRESHOLD - subtotal).toLocaleString()}</span> more for <span className="text-purple-primary font-medium">FREE shipping</span>
                    </p>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-gold to-purple-primary rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (subtotal / SHIPPING_THRESHOLD) * 100)}%` }}
                  />
                </div>
                <p className="font-inter text-[10px] text-gray-400 mt-2 text-right">
                  {Math.round((subtotal / SHIPPING_THRESHOLD) * 100)}% completed
                </p>
              </div>
            ) : (
              <div className="bg-purple-primary/10 border border-purple-primary/20 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-primary/20 flex items-center justify-center">
                  <BadgeCheck size={20} className="text-purple-primary" />
                </div>
                <div>
                  <p className="font-playfair text-sm text-purple-primary font-medium">
                    Congratulations! You get FREE shipping
                  </p>
                  <p className="font-inter text-xs text-gray-500">
                    Your order qualifies for complimentary delivery
                  </p>
                </div>
              </div>
            )}

            {/* Cart Items — New Card Design with gap-y-6 */}
            <div className="space-y-6">
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5"
                >
                  {/* Remove Icon — Top Right */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-rose-gold/10 hover:text-rose-gold transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="flex gap-4">
                    {/* Image — Larger Square */}
                    <Link to={`/product/${item.id}`} className="w-24 h-24 flex-shrink-0 overflow-hidden bg-gray-100 rounded-xl">
                      <img src={item.image || PLACEHOLDER_IMG} alt={item.name} onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMG; }} className="w-full h-full object-cover" />
                    </Link>

                    {/* Content Div */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      {/* Title Stack */}
                      <div>
                        <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-1">
                          {item.category}
                        </p>
                        <Link to={`/product/${item.id}`} className="block">
                          <h3 className="font-playfair text-sm font-semibold text-gray-800 leading-tight hover:text-purple-primary transition-colors line-clamp-2">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="font-inter text-sm font-semibold text-purple-primary mt-1.5">
                          {CURRENCY}{item.price.toLocaleString()}
                          {item.quantity > 1 && (
                            <span className="text-gray-400 font-normal text-[11px] ml-1">
                              x {item.quantity}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Quantity Controls — Center Aligned */}
                      <div className="flex items-center justify-center mt-3">
                        <div className="flex items-center bg-gray-50 rounded-full p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-purple-primary shadow-sm hover:bg-purple-primary hover:text-white transition-colors"
                          >
                            <Minus size={14} strokeWidth={2.5} />
                          </button>
                          <span className="w-10 text-center text-sm font-inter font-semibold text-gray-700">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-purple-primary shadow-sm hover:bg-purple-primary hover:text-white transition-colors"
                          >
                            <Plus size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link to="/shop" className="inline-flex items-center gap-2 font-inter text-xs tracking-wider uppercase text-gray-500 hover:text-purple-primary transition-colors">
              <ArrowLeft size={14} /> Continue Shopping
            </Link>
          </div>

          {/* Order Summary — Desktop - Luxury Design */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white border-2 border-rose-gold/20 p-8 sticky top-28 rounded-lg shadow-lg shadow-rose-gold/5">
              {/* Header with accent */}
              <div className="border-b-2 border-rose-gold/20 pb-4 mb-6">
                <h3 className="font-playfair text-xl text-purple-primary">Order Summary</h3>
                <p className="font-inter text-xs text-gray-400 mt-1">Review your selections</p>
              </div>

              {/* Line Items */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between font-inter text-sm">
                  <span className="text-gray-500">Subtotal ({cart.length} items)</span>
                  <span className="text-gray-700 font-medium">{CURRENCY}{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-inter text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className={shipping === 0 ? 'text-purple-primary font-semibold' : 'text-gray-700'}>
                    {shipping === 0 ? 'FREE' : `${CURRENCY}${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between font-inter text-sm">
                  <span className="text-gray-500">Taxes (GST)</span>
                  <span className="text-gray-700">Included</span>
                </div>
              </div>

              {/* Total with Rose Gold accent */}
              <div className="bg-gradient-to-r from-rose-gold/10 to-purple-primary/5 border border-rose-gold/20 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-playfair text-base text-purple-primary">Order Total</span>
                    <p className="font-inter text-[10px] text-gray-400 mt-0.5">Inclusive of all taxes</p>
                  </div>
                  <span className="font-playfair text-2xl text-purple-primary font-semibold">{CURRENCY}{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-purple-primary/10 flex items-center justify-center flex-shrink-0">
                    <Lock size={16} className="text-purple-primary" />
                  </div>
                  <div>
                    <p className="font-inter text-xs font-medium text-gray-700">Secure SSL Encrypted</p>
                    <p className="font-inter text-[10px] text-gray-400">Your data is protected</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-rose-gold/10 flex items-center justify-center flex-shrink-0">
                    <Shield size={16} className="text-rose-gold" />
                  </div>
                  <div>
                    <p className="font-inter text-xs font-medium text-gray-700">Trusted Payments</p>
                    <p className="font-inter text-[10px] text-gray-400">Razorpay Verified</p>
                  </div>
                </div>
              </div>

              {/* Policy Notes */}
              <div className="space-y-2 mb-6 text-xs font-inter">
                <p className="text-rose-gold font-medium flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-rose-gold" /> Online Payment Only
                </p>
                <p className="text-gray-400 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-gray-300" /> No Returns / No Exchanges
                </p>
              </div>

              {/* CTA Button */}
              <Link
                to="/checkout"
                className="btn-primary block text-center w-full py-4 text-sm tracking-wider uppercase font-medium"
              >
                Proceed to Secure Checkout
              </Link>
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
            className="flex items-center justify-center gap-2 w-full bg-purple-primary text-white font-inter text-sm font-semibold tracking-wide py-3.5 rounded-full hover:bg-emerald-800 transition-colors shadow-lg shadow-purple-primary/20"
          >
            <Lock size={14} />
            PROCEED TO CHECKOUT
          </Link>
        </div>
      </div>
    </>
  );
}
