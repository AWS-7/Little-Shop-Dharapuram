import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ShieldCheck, Bell, BellRing } from 'lucide-react';
import { requestNotificationPermission, isNotificationSupported } from '../../lib/notifications';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  // Check if notifications were already enabled
  useEffect(() => {
    if (Notification.permission === 'granted') {
      setNotifEnabled(true);
    }
  }, []);

  const handleNotificationRequest = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotifEnabled(true);
      setShowNotifPrompt(false);
      // Navigate after a short delay
      setTimeout(() => navigate('/admin/dashboard'), 500);
    }
  };

  const skipNotifications = () => {
    setShowNotifPrompt(false);
    navigate('/admin/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simple localStorage auth (any non-empty credentials work)
    setTimeout(() => {
      if (form.email && form.password) {
        localStorage.setItem('admin_auth', 'true');
        localStorage.setItem('admin_email', form.email);
        
        // Check if we should show notification prompt
        if (isNotificationSupported() && Notification.permission !== 'granted') {
          setShowNotifPrompt(true);
          setLoading(false);
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        setError('Please enter email and password');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <ShieldCheck size={40} className="mx-auto text-purple-primary mb-4" strokeWidth={1.5} />
          <h1 className="font-playfair text-3xl text-purple-primary mb-1">Admin Access</h1>
          <p className="font-inter text-sm text-gray-400">Little Shop Management Console</p>
        </div>

        <AnimatePresence mode="wait">
          {!showNotifPrompt ? (
            <motion.form
              key="login"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSubmit}
              className="bg-white border border-gray-100 p-8 space-y-5"
            >
              {error && (
                <p className="font-inter text-sm text-rose-gold text-center">{error}</p>
              )}

              <div>
                <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-200 pl-11 pr-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors"
                    placeholder="littleshopboutiqueaws@gmail.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-gray-200 pl-11 pr-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </motion.button>
            </motion.form>
          ) : (
            <motion.div
              key="notif"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-gray-100 p-8 space-y-5"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BellRing size={32} className="text-purple-primary" />
                </div>
                <h3 className="font-playfair text-xl text-purple-primary mb-2">
                  Enable Order Notifications?
                </h3>
                <p className="font-inter text-sm text-gray-500 mb-6">
                  Get instant alerts when new orders arrive. You'll hear a chime sound and see a notification even when the tab is closed.
                </p>
              </div>

              <div className="space-y-3">
                <motion.button
                  onClick={handleNotificationRequest}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Bell size={18} />
                  Enable Notifications
                </motion.button>

                <motion.button
                  onClick={skipNotifications}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 font-inter text-sm text-gray-500 hover:text-gray-700"
                >
                  Skip for now
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
