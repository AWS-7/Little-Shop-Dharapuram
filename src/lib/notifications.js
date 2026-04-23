import { supabase } from './supabase';

// ── Push Notification Service ──
// Handles browser notifications for new orders using Service Workers

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

// Check if notifications are supported
export function isNotificationSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

// Request notification permission with better UX
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    console.log('Notifications not supported');
    return { granted: false, error: 'Browser notifications not supported' };
  }

  // Check current permission status first
  const currentPermission = Notification.permission;
  console.log('Current notification permission:', currentPermission);
  
  // If already granted, just register service worker
  if (currentPermission === 'granted') {
    await registerServiceWorker();
    return { granted: true, error: null };
  }
  
  // If denied, we can't ask again - user must manually enable in browser settings
  if (currentPermission === 'denied') {
    return { 
      granted: false, 
      error: 'Notifications blocked. Please enable in browser settings (click lock icon in address bar).'
    };
  }
  
  // If default (not asked yet), request permission
  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission result:', permission);
    
    if (permission === 'granted') {
      await registerServiceWorker();
      return { granted: true, error: null };
    } else {
      return { 
        granted: false, 
        error: 'Notification permission denied. Click the notification bell to try again.'
      };
    }
  } catch (err) {
    console.error('Error requesting permission:', err);
    return { granted: false, error: err.message };
  }
}

// Register service worker
async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// Subscribe to push notifications
export async function subscribeToPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription && PUBLIC_VAPID_KEY) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });
      console.log('Push subscription:', subscription);
    }
    
    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

// Helper: Convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Show local notification (foreground)
export function showLocalNotification(title, options = {}) {
  if (!isNotificationSupported()) return;
  
  const defaultOptions = {
    icon: '/logo192.png',
    badge: '/badge-72x72.png',
    tag: 'new-order',
    requireInteraction: true,
    ...options
  };
  
  // Play custom notification sound
  playNotificationSound();
  
  // Show notification
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, defaultOptions);
    });
  }
}

// Play notification sound - with multiple fallback options
function playNotificationSound() {
  try {
    // Try Web Audio API first (more reliable)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
      
      // Also try the MP3 file
      setTimeout(() => {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => {});
      }, 100);
    }
  } catch (e) {
    console.log('Sound playback not available:', e);
  }
}

// ── Supabase Real-time Order Listener ──
// Listen for new orders and trigger notifications

let ordersSubscription = null;

export function startOrderNotifications(onNewOrder, onError) {
  // Stop any existing subscription
  stopOrderNotifications();
  
  console.log('Starting order notifications...');
  
  // Subscribe to orders table changes
  ordersSubscription = supabase
    .channel('orders-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      },
      (payload) => {
        console.log('New order received:', payload);
        
        const order = payload.new;
        const totalAmount = order.total || order.total_amount || 0;
        const customer = order.customer_name || order.user_email || 'Customer';
        
        // Trigger notification
        showLocalNotification('🛍️ New Order Received!', {
          body: `A new order has been placed for ₹${totalAmount} by ${customer}. Click to view details.`,
          data: {
            orderId: order.id,
            url: `/admin/orders/${order.id}`
          },
          actions: [
            {
              action: 'view',
              title: 'View Order'
            },
            {
              action: 'close',
              title: 'Dismiss'
            }
          ]
        });
        
        // Call callback if provided
        if (onNewOrder) {
          onNewOrder(order);
        }
      }
    )
    .subscribe((status) => {
      console.log('Order notification subscription status:', status);
      if (status === 'CHANNEL_ERROR' && onError) {
        onError('Failed to connect to order notifications');
      }
    });
  
  return ordersSubscription;
}

export function stopOrderNotifications() {
  if (ordersSubscription) {
    supabase.removeChannel(ordersSubscription);
    ordersSubscription = null;
    console.log('Order notifications stopped');
  }
}

// ── Fallback: WhatsApp/Email Integration ──
// Send instant WhatsApp or Email alert via API

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@littleshop.com';
const WHATSAPP_NUMBER = import.meta.env.VITE_ADMIN_WHATSAPP || '';

// Send email notification using Supabase Edge Function
export async function sendOrderEmailNotification(order) {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'order_notification',
        order: order
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      return { success: false, error: error.message };
    }

    console.log('Order email notification sent');
    return { success: true, data };
  } catch (error) {
    console.error('Email notification error:', error);
    return { success: false, error: error.message };
  }
}

// Send WhatsApp notification via WhatsApp Business API (placeholder)
export async function sendWhatsAppNotification(order) {
  if (!WHATSAPP_NUMBER) {
    console.log('WhatsApp number not configured');
    return { success: false, error: 'WhatsApp not configured' };
  }
  
  // This would integrate with WhatsApp Business API or Twilio
  console.log('WhatsApp notification would be sent to:', WHATSAPP_NUMBER);
  console.log('Order details:', order);
  
  return { success: true, message: 'WhatsApp integration placeholder' };
}

// Combined notification: Push + Email
export async function notifyNewOrder(order) {
  // 1. Browser Push Notification
  showLocalNotification('🛍️ New Order Received!', {
    body: `Order #${order.order_id || order.id} for ₹${order.total || order.total_amount}`,
    data: {
      orderId: order.id,
      url: `/admin/dashboard`
    }
  });
  
  // 2. Email Notification (async)
  const emailResult = await sendOrderEmailNotification(order);
  
  return {
    push: true,
    email: emailResult.success,
    emailError: emailResult.error
  };
}
