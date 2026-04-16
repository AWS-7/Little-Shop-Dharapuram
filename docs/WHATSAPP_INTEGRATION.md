# 📱 WhatsApp Order Notifications Integration

This document describes the WhatsApp Business API integration for sending automated order notifications to customers.

## Features

- ✅ Automated WhatsApp messages on order status changes
- ✅ Supports **Twilio** and **Interakt** API providers
- ✅ Includes product image in notifications
- ✅ Professional message templates for each status
- ✅ Non-blocking (doesn't affect order processing)
- ✅ Phone number auto-formatting (India +91)

## Trigger Points

WhatsApp notifications are sent when:

1. **Order Confirmed** (`paid` status)
2. **Order Shipped** (`shipped` status)
3. **Order Delivered** (`delivered` status)

## Configuration

### 1. Choose Provider

Set in `.env`:

```bash
# Options: 'twilio' or 'interakt'
VITE_WHATSAPP_PROVIDER=twilio
```

### 2. Twilio Setup

1. Create account at [Twilio](https://www.twilio.com/)
2. Get WhatsApp Business API access
3. Get credentials from [Console](https://console.twilio.com/)

```bash
VITE_TWILIO_ACCOUNT_SID=your_account_sid
VITE_TWILIO_AUTH_TOKEN=your_auth_token
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Sandbox Testing:**
- Join sandbox by sending message: `join <sandbox-code>` to +1 415 523 8886
- Test with: `whatsapp:+91<your-phone>`

### 3. Interakt Setup

1. Create account at [Interakt](https://www.interakt.shop/)
2. Get API Key from dashboard

```bash
VITE_WHATSAPP_PROVIDER=interakt
VITE_INTERAKT_API_KEY=your_api_key
```

## Message Templates

### Order Confirmed (paid)

```
🎉 *Order Confirmed!*

Hi {Customer Name},

Thank you for shopping with *Little Shop*!

📦 *Order Details:*
Order ID: *#{OrderID}*
Items: {Item Summary}
Total: ₹{Amount}

Track your order here: {URL}

We appreciate your trust in us! 💚

— Little Shop
```

### Order Shipped

```
🚚 *Order Shipped!*

Hi {Customer Name},

Your order *#{OrderID}* is on its way!

📦 Items: {Item Summary}
Track: {URL}

Expected delivery soon! 📍

— Little Shop
```

### Order Delivered

```
✅ *Order Delivered!*

Hi {Customer Name},

Your order *#{OrderID}* has been delivered!

📦 Items: {Item Summary}

We hope you love your purchase! ❤️
Rate your experience: {URL}

— Little Shop
```

## Code Integration

### Main Module: `src/lib/whatsapp.js`

Key functions:

```javascript
// Send notification for any status
import { sendOrderStatusNotification } from './lib/whatsapp';

await sendOrderStatusNotification(order, 'paid');
await sendOrderStatusNotification(order, 'shipped');
await sendOrderStatusNotification(order, 'delivered');

// Convenience functions
import { 
  sendOrderConfirmation, 
  sendShippingNotification, 
  sendDeliveryNotification 
} from './lib/whatsapp';
```

### Auto-Integration: `src/lib/orders.js`

Already integrated! When you call:

```javascript
import { createOrder, updateOrderStatus } from './lib/orders';

// On new paid order → WhatsApp sent automatically
createOrder({ status: 'paid', customer: { phone: '+919876543210' }, ... });

// On status change to 'paid', 'shipped', 'delivered'
updateOrderStatus('order_123', 'shipped');
```

## Order Data Structure

Required fields for WhatsApp:

```javascript
{
  order_id: "ORD_12345",
  status: "paid",
  customer: {
    name: "John Doe",
    phone: "+919876543210"  // Required!
  },
  items: [
    {
      name: "Silk Saree",
      image: "https://.../saree.jpg"  // Optional, for media
    }
  ],
  total_amount: 2500
}
```

## Testing

### Without API Keys (Development Mode)

If no API keys are configured, the system logs what would be sent:

```
WhatsApp not configured. Notification would be sent: {
  to: "+919876543210",
  orderId: "ORD_12345",
  status: "paid"
}
```

### With Twilio Sandbox

1. Send WhatsApp message to +1 415 523 8886: `join <your-sandbox-code>`
2. Use your phone number in orders: `+919876543210`
3. Place a test order
4. Check Twilio logs in console

## Troubleshooting

### Notifications not sending

1. Check customer has phone number in order data
2. Verify `VITE_WHATSAPP_PROVIDER` is set correctly
3. Check API credentials are valid
4. Look at browser console for errors

### Phone number format

Auto-formatted to E.164:
- `9876543210` → `+919876543210`
- `+91 98765 43210` → `+919876543210`

### Image not showing

First product image is used. Ensure:
- Image URL is publicly accessible (HTTPS)
- URL is in `order.items[0].image`

## API Response

```javascript
// Success
{ 
  success: true, 
  messageId: "SM123456789",
  provider: "twilio" 
}

// Failure
{ 
  success: false, 
  error: "Invalid phone number" 
}
```

## Security Notes

- API keys are stored in environment variables only
- Phone numbers are never logged (except in error cases)
- Notifications are non-blocking (order works even if WhatsApp fails)

## Support

- Twilio Docs: https://www.twilio.com/docs/whatsapp
- Interakt Docs: https://docs.interakt.shop/
- WhatsApp Business API: https://business.whatsapp.com/products/business-platform
