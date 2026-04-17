import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Sparkles, LogIn } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebaseAuth';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state, default to home
  const from = location.state?.from?.pathname || "/";

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await loginWithGoogle();
      
      if (result.success) {
        // Successful login, navigate back to previous page or home
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Failed to login with Google. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="relative max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(106,13,189,0.1)] p-8 md:p-12 border border-purple-50 flex flex-col items-center">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-purple-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-purple-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
              Sign In
            </h1>
            <p className="text-gray-500 font-medium">
              Join our exclusive community for a premium shopping experience.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl animate-shake">
              <p className="text-red-600 text-sm font-bold flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                {error}
              </p>
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-100 py-4 px-6 rounded-2xl font-black text-gray-700 hover:border-purple-primary hover:bg-purple-light transition-all duration-300 disabled:opacity-50 group relative overflow-hidden shadow-sm hover:shadow-md"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-purple-primary/30 border-t-purple-primary rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                <span className="text-base uppercase tracking-wider">Continue with Google</span>
              </>
            )}
          </button>

          {/* Security Note */}
          <div className="mt-12 flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-[0.15em]">
            <Shield className="w-4 h-4 text-purple-primary" />
            <span>Encrypted Google Auth</span>
          </div>

          {/* Brand Footer */}
          <div className="mt-8 pt-8 border-t border-gray-50 w-full text-center">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
              Little Shop Premium Identity
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
