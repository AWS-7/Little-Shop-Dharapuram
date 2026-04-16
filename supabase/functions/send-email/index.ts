import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'admin@littleshop.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, to, subject, html, order, cart } = await req.json()

    let emailHtml = html
    let emailSubject = subject
    let recipient = to

    // Build email content based on type
    if (type === 'order_notification') {
      const orderData = order
      const itemsList = orderData.items?.map((item: any) =>
        `<li>${item.name || item.product_name} x ${item.quantity} - ₹${item.price}</li>`
      ).join('') || ''

      emailSubject = `🛍️ New Order #${orderData.order_id || orderData.id} - ₹${orderData.total || orderData.total_amount}`
      recipient = ADMIN_EMAIL
      emailHtml = `
        <div style="font-family: 'Playfair Display', serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafafa;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #6a1b9a; margin-bottom: 20px;">🛍️ New Order Received!</h1>
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">A new order has been placed on Little Shop.</p>
            <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0;"><strong>Order ID:</strong> #${orderData.order_id || orderData.id}</p>
              <p style="margin: 0 0 10px 0;"><strong>Customer:</strong> ${orderData.customer_name || orderData.user_email}</p>
              <p style="margin: 0 0 10px 0;"><strong>Total Amount:</strong> ₹${orderData.total || orderData.total_amount}</p>
              <p style="margin: 0;"><strong>Status:</strong> ${orderData.status || 'Ordered'}</p>
            </div>
            <h3 style="color: #4a148c;">Order Items:</h3>
            <ul style="color: #555; line-height: 1.8;">${itemsList}</ul>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${req.headers.get('origin') || 'https://littleshop.com'}/admin/dashboard"
                 style="background: #6a1b9a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
                View Order in Admin Panel
              </a>
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">Little Shop - Luxury Boutique</p>
          </div>
        </div>
      `
    } else if (type === 'abandoned_cart_reminder') {
      const cartData = cart
      const customerName = cartData.user_name || cartData.user_email?.split('@')[0] || 'Customer'
      const itemsList = cartData.items?.map((item: any) =>
        `<li>${item.name || item.product_name} x ${item.quantity} - ₹${item.price}</li>`
      ).join('') || ''

      emailSubject = `Hi ${customerName}, you left something beautiful in your cart!`
      recipient = cartData.user_email
      emailHtml = `
        <div style="font-family: 'Playfair Display', serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafafa;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #6a1b9a; margin-bottom: 20px;">Hi ${customerName},</h1>
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">You left something beautiful in your cart!</p>
            <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #4a148c; margin: 0 0 15px 0;">Your Cart:</h3>
              <ul style="color: #555; line-height: 1.8; margin: 0;">${itemsList}</ul>
              <p style="margin: 15px 0 0 0; font-weight: bold; color: #6a1b9a;">Total: ₹${cartData.total || 0}</p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${req.headers.get('origin') || 'https://littleshop.com'}/cart"
                 style="background: #6a1b9a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Complete Your Purchase
              </a>
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">Little Shop - Luxury Boutique</p>
          </div>
        </div>
      `
    }

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Little Shop <onboarding@resend.dev>',
        to: recipient,
        subject: emailSubject,
        html: emailHtml,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(error)
    }

    const data = await res.json()

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
