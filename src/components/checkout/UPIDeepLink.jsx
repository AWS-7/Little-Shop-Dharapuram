import { useState, useEffect } from 'react';
import { Smartphone, Copy, CheckCircle, QrCode, X, ChevronRight, Wallet } from 'lucide-react';

/**
 * UPI Deep Link Payment Component
 * Allows users to pay directly via UPI apps (GPay, PhonePe, Paytm, etc.)
 * - Mobile: Opens UPI app directly with pre-filled details
 * - Desktop: Shows QR code to scan
 */

const UPI_APPS = [
  {
    id: 'gpay',
    name: 'Google Pay',
    scheme: 'tez://upi/pay',
    color: 'bg-blue-50',
    textColor: 'text-blue-600',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285F4"/>
        <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    scheme: 'phonepe://pay',
    color: 'bg-purple-50',
    textColor: 'text-purple-600',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#5F259F"/>
        <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 'paytm',
    name: 'Paytm',
    scheme: 'paytmmp://pay',
    color: 'bg-blue-50',
    textColor: 'text-blue-700',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="2" fill="#00BAF2"/>
        <text x="12" y="15" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">Paytm</text>
      </svg>
    )
  },
  {
    id: 'upi',
    name: 'Any UPI App',
    scheme: 'upi://pay',
    color: 'bg-gray-50',
    textColor: 'text-gray-700',
    icon: <Smartphone size={24} className="text-gray-600" />
  }
];

// Default merchant UPI ID - Replace with your actual UPI ID
const MERCHANT_UPI = 'littleshop@icici';  // Change this to your UPI ID
const MERCHANT_NAME = 'LittleShop';
const MERCHANT_CODE = '5411';  // Retail merchant category code

export default function UPIDeepLink({
  amount,
  orderId,
  orderDescription,
  onSuccess,
  onCancel,
  userName,
  userPhone,
  userEmail
}) {
  const [selectedApp, setSelectedApp] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect if mobile device
  useEffect(() => {
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    setIsMobile(mobileRegex.test(navigator.userAgent));
  }, []);

  // Generate UPI deep link
  const generateUPILink = (app) => {
    const params = new URLSearchParams({
      pa: MERCHANT_UPI,           // Payee UPI ID
      pn: MERCHANT_NAME,          // Payee name
      mc: MERCHANT_CODE,          // Merchant category code
      tn: `${orderDescription || 'Order'} #${orderId}`,  // Transaction note
      am: amount.toString(),      // Amount
      cu: 'INR',                  // Currency
      tr: orderId,                // Transaction reference
      url: `https://littleshop.in/order/${orderId}`,  // Redirect URL
    });

    // Add optional user details
    if (userName) params.append('mn', userName);

    return `${app.scheme}?${params.toString()}`;
  };

  // Generate standard UPI link for QR
  const generateStandardUPILink = () => {
    return generateUPILink({ scheme: 'upi://pay' });
  };

  // Open UPI app
  const openUPIApp = (app) => {
    setSelectedApp(app);
    setPaymentInitiated(true);

    if (isMobile) {
      const link = generateUPILink(app);
      
      // Try to open app
      window.location.href = link;
      
      // Fallback if app not installed (after 2 seconds)
      setTimeout(() => {
        if (document.hasFocus()) {
          // App didn't open, show manual payment option
          setShowQR(true);
        }
      }, 2000);
    } else {
      // Desktop - show QR code immediately
      setShowQR(true);
    }
  };

  // Copy UPI ID for manual payment
  const copyUPIId = async () => {
    try {
      await navigator.clipboard.writeText(MERCHANT_UPI);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = MERCHANT_UPI;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Copy UPI link
  const copyUPILink = () => {
    const link = generateStandardUPILink();
    navigator.clipboard.writeText(link);
    alert('UPI payment link copied! Paste it in your UPI app.');
  };

  // Handle payment verification
  const handleVerifyPayment = () => {
    // In production, verify with your backend
    onSuccess?.({
      method: 'upi',
      app: selectedApp?.name || 'UPI',
      orderId,
      amount,
      timestamp: new Date().toISOString()
    });
  };

  // Generate QR code URL (using QR Server API)
  const getQRCodeUrl = () => {
    const upiLink = generateStandardUPILink();
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
  };

  // If showing QR (desktop or fallback)
  if (showQR) {
    return (
      <div className="bg-white rounded-2xl p-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Scan to Pay</h3>
          <button onClick={() => setShowQR(false)} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* QR Code */}
        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
            <img
              src={getQRCodeUrl()}
              alt="UPI QR Code"
              className="w-48 h-48"
            />
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Scan with any UPI app
          </p>
        </div>

        {/* Amount Display */}
        <div className="text-center mb-6 p-4 bg-purple-light rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
          <p className="text-3xl font-black text-purple-primary">₹{amount}</p>
          <p className="text-xs text-gray-500 mt-1">Order #{orderId}</p>
        </div>

        {/* Manual UPI ID */}
        <div className="p-4 bg-gray-50 rounded-xl mb-4">
          <p className="text-sm text-gray-600 mb-2">Or pay to UPI ID:</p>
          <div className="flex items-center justify-between">
            <code className="text-lg font-bold text-gray-900">{MERCHANT_UPI}</code>
            <button
              onClick={copyUPIId}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Copy UPI Link */}
        <button
          onClick={copyUPILink}
          className="w-full py-3 mb-4 border-2 border-purple-primary text-purple-primary font-bold rounded-xl hover:bg-purple-light transition-colors"
        >
          Copy Payment Link
        </button>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleVerifyPayment}
            className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors"
          >
            I've Paid
          </button>
        </div>
      </div>
    );
  }

  // Default view - Select UPI App
  return (
    <div className="bg-white rounded-2xl p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-black text-gray-900 mb-2">Pay via UPI</h3>
        <p className="text-sm text-gray-500">Choose your preferred UPI app</p>
      </div>

      {/* Amount Display */}
      <div className="text-center mb-6 p-4 bg-gradient-to-br from-purple-primary to-purple-secondary rounded-xl text-white">
        <p className="text-sm text-white/80 mb-1">Total Amount</p>
        <p className="text-4xl font-black">₹{amount}</p>
        <p className="text-xs text-white/70 mt-1">Order #{orderId}</p>
      </div>

      {/* UPI Apps Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {UPI_APPS.map((app) => (
          <button
            key={app.id}
            onClick={() => openUPIApp(app)}
            className={`flex flex-col items-center gap-2 p-4 border-2 border-gray-100 rounded-xl hover:border-purple-primary hover:shadow-md transition-all ${app.color}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${app.color}`}>
              {app.icon}
            </div>
            <span className={`text-sm font-bold ${app.textColor}`}>{app.name}</span>
          </button>
        ))}
      </div>

      {/* QR Option for Mobile */}
      {isMobile && (
        <button
          onClick={() => setShowQR(true)}
          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-purple-primary hover:text-purple-primary transition-all mb-6"
        >
          <QrCode size={20} />
          <span className="font-bold">Show QR Code</span>
        </button>
      )}

      {/* Manual UPI ID */}
      <div className="p-4 bg-gray-50 rounded-xl mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Pay to UPI ID</p>
            <code className="text-base font-bold text-gray-900">{MERCHANT_UPI}</code>
          </div>
          <button
            onClick={copyUPIId}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-2 mb-6">
        <div className="flex items-start gap-3 text-sm text-gray-600">
          <div className="w-5 h-5 rounded-full bg-purple-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
          <p>Tap your preferred UPI app above</p>
        </div>
        <div className="flex items-start gap-3 text-sm text-gray-600">
          <div className="w-5 h-5 rounded-full bg-purple-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
          <p>Complete payment in the UPI app</p>
        </div>
        <div className="flex items-start gap-3 text-sm text-gray-600">
          <div className="w-5 h-5 rounded-full bg-purple-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
          <p>Return and tap "I've Paid"</p>
        </div>
      </div>

      {/* Cancel */}
      <button
        onClick={onCancel}
        className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
      >
        Cancel Payment
      </button>
    </div>
  );
}

/**
 * UPI Payment Button - Simplified version for quick integration
 */
export function UPIPayButton({ amount, orderId, onSuccess, className = '' }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center justify-center gap-2 ${className}`}
      >
        <Wallet size={20} />
        <span>Pay with UPI</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <UPIDeepLink
            amount={amount}
            orderId={orderId}
            onSuccess={(data) => {
              setShowModal(false);
              onSuccess?.(data);
            }}
            onCancel={() => setShowModal(false)}
          />
        </div>
      )}
    </>
  );
}

/**
 * Check if UPI is available on device
 */
export function isUPIAvailable() {
  return new Promise((resolve) => {
    // Try to detect if any UPI app is installed
    const testLink = document.createElement('a');
    testLink.href = 'upi://pay';
    
    // For Android, we can use this trick
    if (/Android/i.test(navigator.userAgent)) {
      const start = Date.now();
      window.location.href = 'upi://pay?pa=test@upi';
      
      setTimeout(() => {
        const elapsed = Date.now() - start;
        // If less than 100ms passed, app was opened
        resolve(elapsed < 100);
      }, 100);
    } else {
      // iOS - assume UPI is available
      resolve(/iPhone|iPad|iPod/i.test(navigator.userAgent));
    }
  });
}
