/**
 * WhatsApp Notification Service
 * Supports Twilio WhatsApp API and Interakt API
 * Sends order notifications to customers
 */

// ═══════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════

// API Provider: 'twilio' | 'interakt'
const WHATSAPP_PROVIDER = import.meta.env.VITE_WHATSAPP_PROVIDER || 'twilio';

// Twilio Configuration
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER; // e.g., "whatsapp:+14155238886"

// Interakt Configuration
const INTERAKT_API_KEY = import.meta.env.VITE_INTERAKT_API_KEY;
const INTERAKT_BASE_URL = 'https://api.interakt.ai/v1';

// Business Info
const BUSINESS_NAME = 'Little Shop';
const TRACK_ORDER_URL = import.meta.env.VITE_TRACK_ORDER_URL || `${window.location.origin}/track-order`;

// ═══════════════════════════════════════════════════════════
// Main Send Function
// ═══════════════════════════════════════════════════════════

/**
 * Send WhatsApp notification for order status update
 * @param {Object} order - Order object with customer details
 * @param {string} status - Order status (paid, shipped, delivered, etc.)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendOrderStatusNotification(order, status) {
  try {
    // Validate required fields
    if (!order?.customer?.phone) {
      console.warn('No phone number found for order:', order?.order_id);
      return { success: false, error: 'No customer phone number' };
    }

    const phone = formatPhoneNumber(order.customer.phone);
    if (!phone) {
      return { success: false, error: 'Invalid phone number' };
    }

    // Build message based on status
    const message = buildOrderMessage(order, status);

    // Send via configured provider
    let result;
    switch (WHATSAPP_PROVIDER) {
      case 'interakt':
        result = await sendViaInterakt(phone, message, order);
        break;
      case 'twilio':
      default:
        result = await sendViaTwilio(phone, message, order);
        break;
    }

    console.log(`WhatsApp notification sent for order ${order.order_id}:`, result);
    return result;

  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send order confirmation notification (when status becomes 'paid')
 * @param {Object} order - Order object
 */
export async function sendOrderConfirmation(order) {
  return sendOrderStatusNotification(order, 'paid');
}

/**
 * Send shipping notification
 * @param {Object} order - Order object
 */
export async function sendShippingNotification(order) {
  return sendOrderStatusNotification(order, 'shipped');
}

/**
 * Send delivery notification
 * @param {Object} order - Order object
 */
export async function sendDeliveryNotification(order) {
  return sendOrderStatusNotification(order, 'delivered');
}

// ═══════════════════════════════════════════════════════════
// Message Builders
// ═══════════════════════════════════════════════════════════

/**
 * Build formatted WhatsApp message for order
 * @param {Object} order - Order data
 * @param {string} status - Current status
 * @returns {string} Formatted message
 */
function buildOrderMessage(order, status) {
  const { order_id, customer, items = [], total_amount } = order;
  const customerName = customer?.name || 'Valued Customer';
  
  // Get first item for image (if sending media)
  const firstItem = items[0];
  const itemSummary = items.length > 1 
    ? `${firstItem?.name || 'Product'} + ${items.length - 1} more item(s)`
    : firstItem?.name || 'Your order';

  // Status-specific messages
  const messages = {
    paid: `🎉 *Order Confirmed!*

Hi ${customerName},

Thank you for shopping with *${BUSINESS_NAME}*!

📦 *Order Details:*
Order ID: *#${order_id}*
Items: ${itemSummary}
Total: ₹${total_amount}

Track your order here: ${TRACK_ORDER_URL}?id=${order_id}

We appreciate your trust in us! 💚

— ${BUSINESS_NAME}`,

    shipped: `🚚 *Order Shipped!*

Hi ${customerName},

Your order *#${order_id}* is on its way!

📦 Items: ${itemSummary}
Track: ${TRACK_ORDER_URL}?id=${order_id}

Expected delivery soon! 📍

— ${BUSINESS_NAME}`,

    delivered: `✅ *Order Delivered!*

Hi ${customerName},

Your order *#${order_id}* has been delivered!

📦 Items: ${itemSummary}

We hope you love your purchase! ❤️
Rate your experience: ${window.location.origin}/review/${order_id}

— ${BUSINESS_NAME}`,

    cancelled: `❌ *Order Cancelled*

Hi ${customerName},

Your order *#${order_id}* has been cancelled.

If you have questions, please contact us.

— ${BUSINESS_NAME}`
  };

  return messages[status] || messages.paid;
}

/**
 * Build interactive message template (for supported providers)
 * @param {Object} order - Order data
 * @param {string} status - Order status
 * @returns {Object} Template object
 */
export function buildMessageTemplate(order, status) {
  const { order_id, customer, items = [], total_amount } = order;
  const customerName = customer?.name || 'Valued Customer';
  const firstItem = items[0];

  return {
    name: status === 'paid' ? 'order_confirmation' : 'order_update',
    language: { code: 'en' },
    components: [
      {
        type: 'header',
        parameters: firstItem?.image ? [
          { type: 'image', image: { link: firstItem.image } }
        ] : []
      },
      {
        type: 'body',
        parameters: [
          { type: 'text', text: customerName },
          { type: 'text', text: BUSINESS_NAME },
          { type: 'text', text: order_id },
          { type: 'text', text: items.length.toString() },
          { type: 'text', text: `₹${total_amount}` }
        ]
      },
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [
          { type: 'text', text: order_id }
        ]
      }
    ]
  };
}

// ═══════════════════════════════════════════════════════════
// Provider Implementations
// ═══════════════════════════════════════════════════════════

/**
 * Send message via Twilio WhatsApp API
 * @param {string} to - Phone number (E.164 format)
 * @param {string} message - Message text
 * @param {Object} order - Order data (for media)
 */
async function sendViaTwilio(to, message, order) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    console.warn('Twilio credentials not configured');
    // Simulate success for development
    return { success: true, messageId: `simulated_${Date.now()}`, simulated: true };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  
  const formData = new URLSearchParams();
  formData.append('From', TWILIO_WHATSAPP_NUMBER);
  formData.append('To', `whatsapp:${to}`);
  formData.append('Body', message);

  // Add media if first item has image
  const firstItem = order?.items?.[0];
  if (firstItem?.image) {
    formData.append('MediaUrl', firstItem.image);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio API error: ${error}`);
  }

  const data = await response.json();
  return { 
    success: true, 
    messageId: data.sid,
    provider: 'twilio'
  };
}

/**
 * Send message via Interakt API
 * @param {string} to - Phone number
 * @param {string} message - Message text
 * @param {Object} order - Order data
 */
async function sendViaInterakt(to, message, order) {
  if (!INTERAKT_API_KEY) {
    console.warn('Interakt API key not configured');
    // Simulate success for development
    return { success: true, messageId: `simulated_${Date.now()}`, simulated: true };
  }

  const url = `${INTERAKT_BASE_URL}/messages`;
  
  const payload = {
    to: to,
    type: 'text',
    text: {
      body: message
    }
  };

  // Add image if available (using Interakt's image message type)
  const firstItem = order?.items?.[0];
  if (firstItem?.image) {
    payload.type = 'image';
    payload.image = {
      link: firstItem.image,
      caption: message.substring(0, 100) // Caption limited to 100 chars
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${INTERAKT_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Interakt API error: ${error}`);
  }

  const data = await response.json();
  return { 
    success: true, 
    messageId: data.id || data.message_id,
    provider: 'interakt'
  };
}

// ═══════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════

/**
 * Format phone number to E.164 format
 * @param {string} phone - Raw phone number
 * @returns {string|null} Formatted number or null
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Add country code if missing (assuming India +91)
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  
  // Already has country code
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  
  // International format
  if (digits.length > 10) {
    return `+${digits}`;
  }
  
  return null;
}

/**
 * Check if WhatsApp notifications are configured
 * @returns {boolean}
 */
export function isWhatsAppConfigured() {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) || !!INTERAKT_API_KEY;
}

/**
 * Get current provider name
 * @returns {string}
 */
export function getWhatsAppProvider() {
  return WHATSAPP_PROVIDER;
}
