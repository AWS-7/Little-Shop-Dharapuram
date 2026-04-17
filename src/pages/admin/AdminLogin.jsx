import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ShieldCheck, Bell, BellRing, Sparkles } from 'lucide-react';
import { requestNotificationPermission, isNotificationSupported } from '../../lib/notifications';
import { loginWithGoogle, isAuthenticated, isAdmin } from '../../lib/firebaseAuth';
import { ADMIN_EMAIL } from '../../lib/constants';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  useEffect(() => {
    // If already logged in as admin, go to dashboard
    if (isAuthenticated() && isAdmin(ADMIN_EMAIL)) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    const res = await loginWithGoogle();
    
    if (res.success) {
      if (isAdmin(ADMIN_EMAIL)) {
        // Logged in as admin, check notifications
        if (isNotificationSupported() && Notification.permission !== 'granted') {
          setShowNotifPrompt(true);
          setLoading(false);
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        setError('Access Denied: You do not have admin privileges.');
        setLoading(false);
      }
    } else {
      setError(res.error || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleNotificationRequest = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setShowNotifPrompt(false);
      navigate('/admin/dashboard');
    }
  };

  const skipNotifications = () => {
    setShowNotifPrompt(false);
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-purple-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-primary/20 rotate-3">
            <ShieldCheck size={40} className="text-white" strokeWidth={1.5} />
          </div>
          <h1 className="font-playfair text-3xl text-purple-primary mb-1">Admin Access</h1>
          <p className="font-inter text-sm text-gray-400 uppercase tracking-widest font-bold">Little Shop Console</p>
        </div>

        <AnimatePresence mode="wait">
          {showNotifPrompt ? (
            <motion.div
              key="notif"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-10 text-center shadow-xl border border-gray-100"
            >
              <div className="w-16 h-16 bg-purple-light rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BellRing size={32} className="text-purple-primary animate-bounce" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Stay Updated!</h3>
              <p className="text-gray-500 text-sm font-medium mb-10 leading-relaxed">
                Enable push notifications to get real-time alerts for new orders and inventory updates.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={handleNotificationRequest}
                  className="w-full py-4 rounded-2xl bg-purple-primary text-white text-sm font-black hover:bg-purple-secondary transition-all shadow-lg shadow-purple-primary/20 uppercase tracking-widest"
                >
                  Enable Notifications
                </button>
                <button
                  onClick={skipNotifications}
                  className="w-full py-4 rounded-2xl border-2 border-gray-100 text-sm font-black text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          ) : (            <motion.div
              key="login"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 space-y-8"
            >
              {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-xs font-bold text-center animate-shake">
                  {error}
                </div>
              )}

              <div className="text-center">
                <p className="text-gray-500 text-sm font-medium mb-8">
                  Sign in with your authorized Google account to access the management dashboard.
                </p>

                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-100 py-4 rounded-2xl font-black text-gray-700 hover:border-purple-primary hover:bg-purple-light transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-purple-primary/20 border-t-purple-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-6 h-6" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      <span className="uppercase tracking-widest text-xs">Continue with Google</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-6 border-t border-gray-50 flex items-center justify-center gap-3 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                <Lock size={14} />
                Secure Encrypted Session
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
