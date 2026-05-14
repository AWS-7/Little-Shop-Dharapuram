// MIGRATED: Using new backend API instead of Supabase
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
import { sendAdminOrderNotification, isWhatsAppConfigured } from './whatsapp';

// Helper to get auth token
async function getAuthToken() {
  return localStorage.getItem('authToken')
    || localStorage.getItem('adminToken')
    || localStorage.getItem('firebase_auth_token')
    || null;
}

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

// ── Order Listener (via polling since realtime not available with REST API) ──
// Listen for new orders and trigger notifications

let pollInterval = null;
let lastCheckTime = new Date().toISOString();
const notifiedOrderIds = new Set(); // Track already-notified orders

export function startOrderNotifications(callback) {
  if (pollInterval) return;
  
  console.log('Starting order notifications (polling mode)...');
  
  // Poll every 30 seconds for new orders
  pollInterval = setInterval(async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/orders/new?since=${encodeURIComponent(lastCheckTime)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        let hasNewOrders = false;
        
        for (const order of result.data) {
          // Skip if already notified this order
          if (notifiedOrderIds.has(order.id)) continue;
          notifiedOrderIds.add(order.id);
          hasNewOrders = true;
          
          console.log('New order detected:', order);
          
          try {
            // Send email notification
            await sendOrderEmailNotification(order);
            
            // Send WhatsApp notification if configured
            const whatsappConfigured = isWhatsAppConfigured();
            if (whatsappConfigured) {
              await sendAdminOrderNotification(order);
            }
            
            // Call custom callback if provided
            if (callback) {
              callback(order);
            }
          } catch (error) {
            console.error('Error processing order notification:', error);
          }
        }
        
        // Only update time if we actually processed new orders
        if (hasNewOrders) {
          lastCheckTime = new Date().toISOString();
        }
      } else {
        // No orders — update check time to avoid re-fetching old ones
        lastCheckTime = new Date().toISOString();
      }
    } catch (error) {
      console.error('Error polling for new orders:', error);
    }
  }, 30000);
}

export function stopOrderNotifications() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    notifiedOrderIds.clear();
    console.log('Order notifications stopped');
  }
}

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@littleshop.com';
const WHATSAPP_NUMBER = import.meta.env.VITE_ADMIN_WHATSAPP || '';

// Send email notification via backend API
export async function sendOrderEmailNotification(order) {
  try {
    // Check if we're in development mode (localhost)
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDev) {
      console.log('DEV MODE: Email notification would be sent for order:', order.order_id);
      console.log('To:', ADMIN_EMAIL);
      return { success: true, data: { dev: true, message: 'Email logged in dev mode' } };
    }

    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/notifications/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'order_notification',
        order: order
      })
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error sending email notification:', error);
    return { success: false, error: error.message };
    // Silent fail - notification is not critical
    return { success: false, error: error.message, silent: true };
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
