import { useEffect, useRef } from 'react';
import { Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Copy, Truck, CreditCard, MapPin, FileDown, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CURRENCY } from '../lib/constants';

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state;

  useEffect(() => {
    // Replace history so back button goes to home page
    window.history.replaceState(null, '', '/order-success');
    
    // Handle back button - redirect to home
    const handlePopState = () => {
      navigate('/', { replace: true });
    };
    
    window.addEventListener('popstate', handlePopState);
    
    if (!order) return;
    // Confetti Cannon — "Vetti Vedikkanum" effect
    const duration = 4000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#b76e79', '#064e3b', '#fdfbf7', '#d4af37', '#ff6b6b'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#b76e79', '#064e3b', '#fdfbf7', '#d4af37', '#ff6b6b'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // Big burst
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#b76e79', '#064e3b', '#fdfbf7', '#d4af37'],
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.4, x: 0.3 },
        colors: ['#b76e79', '#064e3b', '#fdfbf7'],
      });
    }, 300);

    frame();
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [order, navigate]);

  if (!order) return <Navigate to="/" />;

  const orderDate = order.date
    ? new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const invoiceRef = useRef(null);

  const downloadInvoice = async () => {
    if (!invoiceRef.current) return;
    
    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`LittleShop-Invoice-${order.orderId}.pdf`);
  };

  const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const shipping = order.shipping || 0;
  const total = order.total || subtotal + shipping;

  return (
    <div className="container-luxury section-spacing min-h-screen mt-8 md:mt-0">
      {/* Hero Success */}
      <div className="text-center mb-12">
        <div className="relative inline-block mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, duration: 0.5 }}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-green-500 flex items-center justify-center shadow-2xl shadow-green-500/30 relative z-10"
          >
            <motion.div
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            >
              <svg className="w-12 h-12 md:w-16 md:h-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </motion.div>
          </motion.div>
          
          {/* Pulsing rings */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-green-500 -z-0"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0.3 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.5 }}
            className="absolute inset-0 rounded-full bg-green-500 -z-0"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h1 className="font-playfair text-3xl md:text-5xl text-purple-primary mb-3">
            Order Confirmed!
          </h1>
          <p className="font-inter text-sm text-gray-500 max-w-lg mx-auto">
            Your order has been placed successfully. 
            We're preparing your luxury items with love.
          </p>
        </motion.div>
      </div>

      {/* ═══ Digital Receipt ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white border border-gray-100 rounded-sm overflow-hidden">
          {/* Receipt Header */}
          <div className="bg-purple-primary/5 border-b border-gray-100 px-6 md:px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-inter text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-1">Tracking ID</p>
                <div className="flex items-center gap-2">
                  <span className="font-inter text-lg font-semibold text-purple-primary tracking-wider">{order.orderId}</span>
                  <button
                    onClick={() => copyToClipboard(order.orderId)}
                    className="text-gray-400 hover:text-purple-primary transition-colors"
                    title="Copy Tracking ID"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-inter text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-1">Date</p>
                <p className="font-inter text-sm text-gray-700">{orderDate}</p>
              </div>
            </div>
          </div>

          {/* Order Details Grid */}
          <div className="px-6 md:px-8 py-5 border-b border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-start gap-2.5">
                <CreditCard size={14} className="text-rose-gold mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-0.5">Payment ID</p>
                  <p className="font-inter text-xs text-gray-700 break-all">{order.paymentId}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-purple-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle size={12} className="text-purple-primary" />
                </div>
                <div>
                  <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-0.5">Payment Status</p>
                  <p className="font-inter text-xs text-purple-primary font-medium flex items-center gap-1">
                    <CheckCircle size={10} /> Paid via Razorpay
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Truck size={14} className="text-rose-gold mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-0.5">Shipping</p>
                  <p className="font-inter text-xs text-gray-700">{order.shipping === 0 ? 'Free' : `${CURRENCY}${order.shipping}`}</p>
                </div>
              </div>
              {order.customer && (
                <div className="flex items-start gap-2.5">
                  <MapPin size={14} className="text-rose-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-0.5">Delivery</p>
                    <p className="font-inter text-xs text-gray-700">{order.customer.city || 'Processing'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items List */}
          {order.items && order.items.length > 0 && (
            <div className="px-6 md:px-8 py-5 border-b border-gray-100">
              <p className="font-inter text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-4">Items Ordered</p>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-12 h-14 flex-shrink-0 overflow-hidden bg-gray-50 rounded-sm">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-inter text-sm text-gray-700 truncate">{item.name}</p>
                      <p className="font-inter text-[10px] text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-inter text-sm font-medium text-purple-primary flex-shrink-0">
                      {CURRENCY}{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="px-6 md:px-8 py-4 border-b border-gray-100 bg-gray-50/50">
            <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-3">Price Breakdown</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-inter text-sm text-gray-600">Subtotal ({order.items?.length || 0} items)</span>
                <span className="font-inter text-sm text-gray-800">{CURRENCY}{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-inter text-sm text-gray-600">Shipping</span>
                <span className="font-inter text-sm text-gray-800">
                  {shipping === 0 ? (
                    <span className="text-purple-primary">Free</span>
                  ) : (
                    `${CURRENCY}${shipping.toLocaleString()}`
                  )}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-inter text-sm font-medium text-gray-800">Total Amount Paid</span>
                  <span className="font-playfair text-xl font-semibold text-purple-primary">
                    {CURRENCY}{total.toLocaleString()}
                  </span>
                </div>
                <p className="font-inter text-[10px] text-gray-400 text-right mt-0.5">Inclusive of all taxes</p>
              </div>
            </div>
          </div>

          {/* Deliver To Section */}
          {order.customer && (
            <div className="px-6 md:px-8 py-4 border-b border-gray-100">
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-rose-gold mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mb-1">Deliver To</p>
                  <p className="font-inter text-sm font-medium text-gray-800">{order.customer.name}</p>
                  <p className="font-inter text-sm text-gray-600">{order.customer.phone}</p>
                  <p className="font-inter text-sm text-gray-500 mt-1">
                    {order.customer.address}, {order.customer.city} - {order.customer.pincode}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <button
            onClick={downloadInvoice}
            className="btn-outline inline-flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <FileDown size={16} /> Download Invoice
          </button>
          <Link
            to="/track-order"
            className="btn-outline inline-flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Package size={16} /> Track Order
          </Link>
          <Link
            to="/shop"
            className="btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Printable Invoice Section (hidden visually but used for PDF) */}
        <div 
          ref={invoiceRef} 
          className="absolute left-[-9999px] bg-white p-8 w-[210mm]"
          style={{ minHeight: '297mm' }}
        >
          {/* Invoice Header - Business Details */}
          <div className="border-b-2 border-purple-primary pb-6 mb-6">
            <div className="flex items-start justify-between">
              {/* Left: Logo & Tagline */}
              <div>
                <h1 className="font-playfair text-3xl text-purple-primary mb-1">Little Shop</h1>
                <p className="font-inter text-sm text-gray-500">Premium Fashion & Accessories</p>
              </div>
              {/* Right: Business Address & GST */}
              <div className="text-right">
                <p className="font-inter text-sm font-semibold text-gray-800">Little Shop</p>
                <p className="font-inter text-xs text-gray-600">78/1 AnnaNagar, Kondarasampalayam</p>
                <p className="font-inter text-xs text-gray-600">Dharapuram, Tamil Nadu</p>
                <p className="font-inter text-xs text-purple-primary font-medium mt-2">GST: 33EJJPA8233H1ZD</p>
                <p className="font-inter text-xs text-gray-500 mt-1">arthithangavel22@okaxis</p>
                <p className="font-inter text-xs text-gray-500">9843096282 | 7598274834</p>
              </div>
            </div>
            {/* Invoice Title & Order ID */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="font-inter text-xl font-semibold text-gray-800">TAX INVOICE</h2>
                <div className="text-right">
                  <p className="font-inter text-xs text-gray-400">Order ID</p>
                  <p className="font-inter text-sm font-semibold text-gray-800">{order.orderId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To & Ship To Section */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            {/* Bill To */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-inter text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">Bill To</p>
              <p className="font-inter text-sm font-medium text-gray-800">{order.customer?.name || 'Customer'}</p>
              <p className="font-inter text-sm text-gray-600">{order.customer?.phone || ''}</p>
              <p className="font-inter text-sm text-gray-600">{order.customer?.email || ''}</p>
            </div>
            {/* Ship To */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-inter text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">Ship To</p>
              <p className="font-inter text-sm text-gray-800">{order.customer?.name || 'Customer'}</p>
              <p className="font-inter text-sm text-gray-600">{order.customer?.address || 'Address not available'}</p>
              <p className="font-inter text-sm text-gray-600">{order.customer?.city || ''} - {order.customer?.pincode || ''}</p>
            </div>
          </div>

          {/* Order Details */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <p className="font-inter text-xs text-gray-400 uppercase tracking-wider">Order Date</p>
              <p className="font-inter text-sm text-gray-800">{orderDate}</p>
            </div>
            <div>
              <p className="font-inter text-xs text-gray-400 uppercase tracking-wider">Payment ID</p>
              <p className="font-inter text-sm text-gray-800">{order.paymentId}</p>
            </div>
            <div className="text-right">
              <p className="font-inter text-xs text-gray-400 uppercase tracking-wider">Payment Status</p>
              <p className="font-inter text-sm text-purple-primary font-medium">Paid via Razorpay</p>
            </div>
          </div>

          {/* Items Table with Serial Number */}
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-2 font-inter text-xs text-gray-500 uppercase">Sl.No</th>
                <th className="text-left py-3 px-2 font-inter text-xs text-gray-500 uppercase">Product Name</th>
                <th className="text-center py-3 px-2 font-inter text-xs text-gray-500 uppercase">Qty</th>
                <th className="text-right py-3 px-2 font-inter text-xs text-gray-500 uppercase">Price</th>
                <th className="text-right py-3 px-2 font-inter text-xs text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-3 px-2 font-inter text-sm text-gray-600">{idx + 1}</td>
                  <td className="py-3 px-2 font-inter text-sm text-gray-800">{item.name}</td>
                  <td className="py-3 px-2 text-center font-inter text-sm text-gray-600">{item.quantity}</td>
                  <td className="py-3 px-2 text-right font-inter text-sm text-gray-600">{CURRENCY}{item.price.toLocaleString()}</td>
                  <td className="py-3 px-2 text-right font-inter text-sm text-gray-800 font-medium">{CURRENCY}{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t-2 border-gray-200 pt-4">
            <div className="flex justify-between mb-2">
              <span className="font-inter text-sm text-gray-600">Subtotal</span>
              <span className="font-inter text-sm text-gray-800">{CURRENCY}{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-inter text-sm text-gray-600">Shipping</span>
              <span className="font-inter text-sm text-gray-800">
                {shipping === 0 ? 'Free' : `${CURRENCY}${shipping.toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="font-inter text-base font-semibold text-gray-800">Total Amount Paid</span>
              <span className="font-inter text-base font-semibold text-purple-primary">{CURRENCY}{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Footer with Business Contact */}
          <div className="mt-12 pt-6 border-t-2 border-gray-200 text-center">
            <p className="font-inter text-sm text-purple-primary font-medium mb-2">Thank you for shopping with Little Shop!</p>
            <p className="font-inter text-xs text-gray-500">78/1 AnnaNagar, Kondarasampalayam, Dharapuram, Tamil Nadu</p>
            <p className="font-inter text-xs text-gray-500 mt-1">GST: 33EJJPA8233H1ZD | Email: arthithangavel22@okaxis</p>
            <p className="font-inter text-xs text-gray-600 font-medium mt-2">Contact: 9843096282 | 7598274834</p>
          </div>
        </div>
      </motion.div>

      {/* Business Info Footer - Visible on page */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="max-w-2xl mx-auto mt-12 pt-8 border-t border-gray-200"
      >
        <div className="text-center space-y-2">
          <h3 className="font-playfair text-lg text-purple-primary">Little Shop</h3>
          <p className="font-inter text-xs text-gray-500">78/1 AnnaNagar, Kondarasampalayam, Dharapuram, Tamil Nadu</p>
          <p className="font-inter text-xs text-gray-400">GST: 33EJJPA8233H1ZD</p>
          <p className="font-inter text-xs text-gray-500">Email: arthithangavel22@okaxis</p>
          <p className="font-inter text-sm text-gray-600 font-medium mt-3">
            Need help? Call: <span className="text-purple-primary">9843096282</span> | <span className="text-purple-primary">7598274834</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
