import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { validateReferralCode, recordReferral, getOrCreateReferralCode } from '../lib/referrals';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getInitialSession();

    // Listen for auth changes (handles OAuth callbacks, sign in/out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Refresh user data from server
  const refreshUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    return user;
  };

  const signUp = async (email, password, name, referralCode = null) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error || !data.user) {
      return { data, error };
    }

    // Handle referral code if provided
    if (referralCode && referralCode.trim()) {
      try {
        // Validate the referral code
        const { valid, referrerId, error: validationError } = await validateReferralCode(referralCode.trim());
        
        if (valid && referrerId && referrerId !== data.user.id) {
          // Record the referral
          await recordReferral(data.user.id, referrerId, referralCode.trim());
          console.log('Referral recorded:', referralCode);
        }
      } catch (err) {
        console.error('Error processing referral:', err);
        // Don't block signup if referral fails
      }
    }

    // Generate referral code for the new user
    try {
      await getOrCreateReferralCode(data.user.id);
    } catch (err) {
      console.error('Error creating referral code:', err);
    }

    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) setUser(null);
    return { error };
  };

  // Google OAuth Sign In
  const signInWithGoogle = async (redirectTo = '/account') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${redirectTo}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { data, error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, signInWithGoogle, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
