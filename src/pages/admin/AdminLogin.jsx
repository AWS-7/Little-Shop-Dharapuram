import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, ShieldCheck, Bell, BellRing, Eye, EyeOff, Clock } from 'lucide-react';
import { requestNotificationPermission, isNotificationSupported } from '../../lib/notifications';
import { 
  loginAdmin, 
  isAdminAuthenticated 
} from '../../lib/adminAuth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Check if redirected due to session expiration
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setSessionExpired(true);
      setError('Session expired. Please login again.');
    }
    
    // If already logged in as admin, go to dashboard
    if (isAdminAuthenticated()) {
      navigate('/admin/dashboard');
    }
  }, [navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const res = await loginAdmin(username, password);
    
    if (res.success) {
      // Login successful - check notifications
      if (isNotificationSupported() && Notification.permission !== 'granted') {
        setShowNotifPrompt(true);
        setLoading(false);
      } else {
        navigate('/admin/dashboard');
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
                  {sessionExpired && <Clock size={16} className="inline mr-1" />}
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Admin Username
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-purple-primary focus:bg-white transition-all disabled:opacity-50"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      disabled={loading}
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-purple-primary focus:bg-white transition-all disabled:opacity-50"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-purple-primary text-white text-sm font-black hover:bg-purple-secondary transition-all shadow-lg shadow-purple-primary/20 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="pt-6 border-t border-gray-50 space-y-2">
                <div className="flex items-center justify-center gap-3 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  <Lock size={14} />
                  Secure Admin Session (1 Hour)
                </div>
                <p className="text-[10px] text-center text-gray-400">
                  Session expires automatically after 1 hour for security
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
