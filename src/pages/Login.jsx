import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { initRecaptcha, sendOTP } from '../lib/firebaseAuth';
import { ADMIN_MOBILE_NUMBER } from '../lib/constants';

export default function Login() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const recaptchaVerifierRef = useRef(null);
  const navigate = useNavigate();

  // Initialize invisible reCAPTCHA on mount
  useEffect(() => {
    const initInvisibleRecaptcha = async () => {
      try {
        recaptchaVerifierRef.current = initRecaptcha('recaptcha-container', () => {
          setRecaptchaReady(true);
        });
      } catch (err) {
        console.error('Failed to initialize recaptcha:', err);
        setError('Failed to initialize security check. Please refresh the page.');
      }
    };

    initInvisibleRecaptcha();

    // Cleanup
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate mobile number
    const cleanedNumber = mobileNumber.replace(/\D/g, '');
    if (!cleanedNumber || cleanedNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!recaptchaVerifierRef.current) {
      setError('Security verification not ready. Please wait a moment and try again.');
      return;
    }

    setLoading(true);

    try {
      // Send OTP via Firebase
      const result = await sendOTP(cleanedNumber, recaptchaVerifierRef.current);
      
      if (result.success) {
        // Navigate to OTP verification page
        navigate('/verify-otp', { 
          state: { 
            phoneNumber: cleanedNumber,
            isAdmin: cleanedNumber === ADMIN_MOBILE_NUMBER
          } 
        });
      } else {
        // Handle specific Firebase errors
        let errorMessage = result.error || 'Failed to send OTP. Please try again.';
        
        if (result.code === 'auth/invalid-phone-number') {
          errorMessage = 'Invalid phone number format. Please check and try again.';
        } else if (result.code === 'auth/too-many-requests') {
          errorMessage = 'Too many attempts. Please try again later.';
        } else if (result.code === 'auth/captcha-check-failed') {
          errorMessage = 'Security verification failed. Please refresh and try again.';
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(value);
    setError('');
  };

  // Format display number with spaces
  const formatDisplayNumber = (num) => {
    if (num.length <= 5) return num;
    return `${num.slice(0, 5)} ${num.slice(5)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 px-4">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-8 left-20 w-56 h-56 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative max-w-md w-full">
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl shadow-purple-100/50 p-8 md:p-10 border border-purple-100">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-200">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Enter your mobile number to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Mobile Number Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mobile Number
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={formatDisplayNumber(mobileNumber)}
                  onChange={handleMobileChange}
                  placeholder="98765 43210"
                  className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 text-lg font-medium tracking-wide"
                  disabled={loading}
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Phone className="w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                </div>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-red-600 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Security Note */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Secured with Firebase Authentication</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || mobileNumber.length !== 10}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-purple-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  Get OTP
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Info Footer */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-gray-400">
              You will receive a 6-digit verification code
            </p>
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="text-gray-400">Demo Admin:</span>
              <code className="bg-purple-50 text-purple-700 px-2 py-1 rounded font-mono">
                {ADMIN_MOBILE_NUMBER}
              </code>
            </div>
          </div>
        </div>

        {/* Invisible reCAPTCHA Container */}
        <div id="recaptcha-container" className="absolute -bottom-20 left-0" />
      </div>
    </div>
  );
}
