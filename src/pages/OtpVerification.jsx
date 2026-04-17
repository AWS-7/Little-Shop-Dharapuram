import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowLeft, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { verifyOTP, resendOTP, initRecaptcha } from '../lib/firebaseAuth';
import { ADMIN_MOBILE_NUMBER } from '../lib/constants';

export default function OtpVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const inputRefs = useRef([]);
  const recaptchaVerifierRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { phoneNumber, isAdmin } = location.state || {};

  // Redirect if no phone number
  useEffect(() => {
    if (!phoneNumber) {
      navigate('/login');
    }
  }, [phoneNumber, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Initialize recaptcha for resend
  useEffect(() => {
    recaptchaVerifierRef.current = initRecaptcha('recaptcha-resend-container');
    
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    const numValue = value.replace(/\D/g, '');
    
    if (numValue.length > 1) {
      // Handle paste of full OTP
      const pastedOtp = numValue.slice(0, 6).split('');
      setOtp(pastedOtp.concat(new Array(6 - pastedOtp.length).fill('')));
      // Focus last filled input
      const lastIndex = Math.min(pastedOtp.length, 5);
      inputRefs.current[lastIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = numValue;
      setOtp(newOtp);
      setError('');

      // Auto-focus next input
      if (numValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pastedData.split('').concat(new Array(6 - pastedData.length).fill(''));
    setOtp(newOtp);
    
    // Focus appropriate input
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);

    try {
      const result = await verifyOTP(otpString);
      
      if (result.success) {
        setSuccess(true);
        
        // Small delay for success animation
        setTimeout(() => {
          if (isAdmin || phoneNumber === ADMIN_MOBILE_NUMBER) {
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate('/shop', { replace: true });
          }
        }, 1000);
      } else {
        let errorMessage = result.error || 'Invalid OTP. Please try again.';
        
        if (result.code === 'auth/invalid-verification-code') {
          errorMessage = 'Invalid OTP. Please check and try again.';
        } else if (result.code === 'auth/code-expired') {
          errorMessage = 'OTP has expired. Please request a new one.';
        } else if (result.code === 'auth/session-expired') {
          errorMessage = 'Session expired. Please go back and try again.';
        }
        
        setError(errorMessage);
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resendLoading) return;

    setResendLoading(true);
    setError('');

    try {
      const result = await resendOTP(recaptchaVerifierRef.current);
      
      if (result.success) {
        setCountdown(30);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      setError('Failed to resend OTP. Please refresh and try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/login');
  };

  // Format phone for display
  const formatPhone = (num) => {
    if (!num) return '';
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return `+91 ${cleaned}`;
  };

  if (!phoneNumber) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 px-4">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative max-w-md w-full">
        {/* Success Overlay */}
        {success && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl z-50 flex items-center justify-center animate-in fade-in duration-300">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Verified!</h3>
              <p className="text-gray-600">Redirecting you...</p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl shadow-purple-100/50 p-8 md:p-10 border border-purple-100">
          
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Enter OTP
            </h1>
            <p className="text-gray-600">
              Code sent to <span className="font-semibold text-purple-700">{formatPhone(phoneNumber)}</span>
            </p>
            {isAdmin && (
              <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                Admin Access
              </span>
            )}
          </div>

          {/* OTP Input */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={loading || success}
                    className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 disabled:opacity-50"
                  />
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6 || success}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-purple-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </button>
          </form>

          {/* Resend Section */}
          <div className="mt-8 text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="flex items-center justify-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors disabled:opacity-50 mx-auto"
              >
                <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
                {resendLoading ? 'Resending...' : 'Resend OTP'}
              </button>
            ) : (
              <p className="text-gray-500">
                Resend OTP in <span className="font-semibold text-purple-600">{countdown}s</span>
              </p>
            )}
          </div>

          {/* Help Text */}
          <p className="mt-6 text-center text-xs text-gray-400">
            Didn&apos;t receive the code? Check your spam folder or try resending.
          </p>
        </div>

        {/* Invisible reCAPTCHA Container for Resend */}
        <div id="recaptcha-resend-container" className="absolute -bottom-20 left-0" />
      </div>
    </div>
  );
}
