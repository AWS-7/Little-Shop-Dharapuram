/**
 * UPI Payment Utilities
 * Helper functions for UPI deep linking and payment processing
 */

const MERCHANT_UPI = import.meta.env.VITE_MERCHANT_UPI || 'littleshop@icici';
const MERCHANT_NAME = 'LittleShop';

/**
 * Generate UPI deep link for any app
 */
export function generateUPIDeepLink({
  amount,
  orderId,
  description,
  app = 'generic',  // 'gpay', 'phonepe', 'paytm', 'generic'
  userDetails = {}
}) {
  // App-specific schemes
  const schemes = {
    gpay: 'tez://upi/pay',
    phonepe: 'phonepe://pay',
    paytm: 'paytmmp://pay',
    generic: 'upi://pay'
  };

  const params = new URLSearchParams({
    pa: MERCHANT_UPI,
    pn: MERCHANT_NAME,
    mc: '5411',
    tn: description || `Order #${orderId}`,
    am: amount.toString(),
    cu: 'INR',
    tr: orderId,
  });

  // Add redirect URL if provided
  if (userDetails.redirectUrl) {
    params.append('url', userDetails.redirectUrl);
  }

  return `${schemes[app] || schemes.generic}?${params.toString()}`;
}

/**
 * Open UPI app on mobile
 */
export function openUPIApp(app, paymentDetails) {
  const link = generateUPIDeepLink({ ...paymentDetails, app });
  
  // Check if mobile
  if (!isMobileDevice()) {
    return { success: false, error: 'UPI apps only available on mobile' };
  }

  // Open app
  window.location.href = link;

  // Return promise that resolves when user returns
  return new Promise((resolve) => {
    const checkReturn = setInterval(() => {
      if (document.hasFocus()) {
        clearInterval(checkReturn);
        resolve({ success: true, message: 'User returned from UPI app' });
      }
    }, 1000);

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(checkReturn);
      resolve({ success: false, error: 'Timeout' });
    }, 300000);
  });
}

/**
 * Generate QR code for UPI payment
 */
export function generateUPIQRCode(paymentDetails, size = 250) {
  const upiLink = generateUPIDeepLink(paymentDetails);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiLink)}`;
}

/**
 * Detect if device is mobile
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Detect if specific UPI app is installed
 * Note: This is not 100% reliable due to browser security
 */
export async function isUPIAppInstalled(appName) {
  const testUrls = {
    gpay: 'tez://upi/pay',
    phonepe: 'phonepe://',
    paytm: 'paytmmp://',
  };

  if (!testUrls[appName]) return false;

  return new Promise((resolve) => {
    const start = Date.now();
    window.location.href = testUrls[appName];
    
    setTimeout(() => {
      // If we're still here after timeout, app likely not installed
      resolve(Date.now() - start > 500);
    }, 100);
  });
}

/**
 * Save UPI payment details to database
 */
export async function saveUPITransaction(supabase, transactionDetails) {
  const { data, error } = await supabase
    .from('upi_transactions')
    .insert({
      order_id: transactionDetails.orderId,
      amount: transactionDetails.amount,
      upi_id: MERCHANT_UPI,
      app_used: transactionDetails.app,
      status: 'pending',  // Will be updated after verification
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Verify UPI payment (manual verification)
 * In production, integrate with your payment gateway or check bank statement
 */
export async function verifyUPIPayment(orderId, expectedAmount) {
  // This is a placeholder - implement actual verification
  // Options:
  // 1. Razorpay/Stripe webhook verification
  // 2. Manual admin verification
  // 3. Bank statement API integration
  // 4. Wait for user to upload screenshot
  
  return {
    verified: false,
    message: 'Manual verification required',
    orderId,
    expectedAmount,
  };
}

/**
 * Generate payment request that works across all platforms
 */
export function generateUniversalPaymentLink(paymentDetails) {
  const upiLink = generateUPIDeepLink(paymentDetails);
  
  // For sharing via WhatsApp, SMS, etc.
  const shareText = `Pay ₹${paymentDetails.amount} to ${MERCHANT_NAME} for order #${paymentDetails.orderId}\n\nTap to pay: ${upiLink}`;
  
  return {
    upiLink,
    shareText,
    whatsappLink: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    smsLink: `sms:?body=${encodeURIComponent(shareText)}`,
  };
}

/**
 * Payment status polling (for async verification)
 */
export function pollPaymentStatus(orderId, interval = 5000, timeout = 300000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkStatus = async () => {
      try {
        // Check status from your backend
        const response = await fetch(`/api/payment-status/${orderId}`);
        const data = await response.json();
        
        if (data.status === 'success') {
          resolve(data);
        } else if (data.status === 'failed') {
          reject(new Error('Payment failed'));
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Payment verification timeout'));
        } else {
          setTimeout(checkStatus, interval);
        }
      } catch (error) {
        reject(error);
      }
    };
    
    checkStatus();
  });
}
