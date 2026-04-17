import { useState } from 'react';
import { CreditCard, Wallet, Banknote, Smartphone, ChevronRight, Shield, CheckCircle } from 'lucide-react';
import UPIDeepLink from './UPIDeepLink';

/**
 * PaymentMethods - Complete payment selection component
 * Shows all available payment options including UPI
 */
export default function PaymentMethods({
  orderDetails,
  onPaymentSuccess,
  onPaymentFailure
}) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showUPIModal, setShowUPIModal] = useState(false);

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI / GPay / PhonePe',
      description: 'Pay using any UPI app',
      icon: <Smartphone size={24} className="text-purple-primary" />,
      popular: true,
      discount: 'Extra ₹50 off'
    },
    {
      id: 'card',
      name: 'Credit / Debit Card',
      description: 'Visa, Mastercard, RuPay',
      icon: <CreditCard size={24} className="text-blue-600" />,
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      description: 'All major banks supported',
      icon: <Wallet size={24} className="text-green-600" />,
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      description: `Pay ₹${orderDetails.total + 50} (₹50 COD charges)`,
      icon: <Banknote size={24} className="text-orange-600" />,
      disabled: orderDetails.total > 5000  // COD not available for high value
    }
  ];

  const handleMethodSelect = (method) => {
    if (method.disabled) return;
    
    setSelectedMethod(method.id);
    
    if (method.id === 'upi') {
      setShowUPIModal(true);
    }
  };

  const handleUPISuccess = (paymentData) => {
    setShowUPIModal(false);
    onPaymentSuccess?.({
      method: 'upi',
      ...paymentData
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-black text-gray-900">Payment Method</h2>
        <p className="text-sm text-gray-500 mt-1">Select your preferred payment option</p>
      </div>

      {/* Payment Options */}
      <div className="divide-y divide-gray-100">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => handleMethodSelect(method)}
            disabled={method.disabled}
            className={`w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
              method.disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${selectedMethod === method.id ? 'bg-purple-light' : ''}`}
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
              {method.icon}
            </div>

            {/* Info */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{method.name}</span>
                {method.popular && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                    POPULAR
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{method.description}</p>
              {method.discount && (
                <p className="text-sm text-green-600 font-medium mt-0.5">{method.discount}</p>
              )}
            </div>

            {/* Radio / Arrow */}
            {selectedMethod === method.id ? (
              <CheckCircle size={24} className="text-purple-primary flex-shrink-0" />
            ) : (
              <ChevronRight size={20} className="text-gray-300 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Security Badge */}
      <div className="p-4 bg-gray-50 flex items-center justify-center gap-2 text-sm text-gray-600">
        <Shield size={16} className="text-green-600" />
        <span>Your payment is secured by 256-bit encryption</span>
      </div>

      {/* UPI Modal */}
      {showUPIModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <UPIDeepLink
            amount={orderDetails.total}
            orderId={orderDetails.orderNumber}
            orderDescription={orderDetails.items?.[0]?.name || 'Order'}
            userName={orderDetails.customer?.name}
            userPhone={orderDetails.customer?.phone}
            userEmail={orderDetails.customer?.email}
            onSuccess={handleUPISuccess}
            onCancel={() => setShowUPIModal(false)}
          />
        </div>
      )}
    </div>
  );
}
