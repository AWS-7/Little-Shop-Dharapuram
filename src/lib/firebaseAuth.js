import { auth } from './firebase';
import { 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();

// Google Login
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Store auth data in localStorage for persistence
    const authData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('firebase_auth_user', JSON.stringify(authData));
    localStorage.setItem('firebase_auth_token', await user.getIdToken());
    
    return { success: true, user: authData };
  } catch (error) {
    console.error('Error logging in with Google:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('firebase_auth_user');
    localStorage.removeItem('firebase_auth_token');
    return { success: true };
  } catch (error) {
    console.error('Error logging out:', error);
    return { success: false, error: error.message };
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const authUser = localStorage.getItem('firebase_auth_user');
  const authToken = localStorage.getItem('firebase_auth_token');
  return !!(authUser && authToken);
};

// Get current user
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('firebase_auth_user');
  return userStr ? JSON.parse(userStr) : null;
};

// Check if user is admin
export const isAdmin = (adminEmail) => {
  const user = getCurrentUser();
  if (!user) return false;
  return user.email === adminEmail;
};

// Subscribe to auth state changes
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        isAuthenticated: true
      });
    } else {
      callback({ isAuthenticated: false });
    }
  });
};

