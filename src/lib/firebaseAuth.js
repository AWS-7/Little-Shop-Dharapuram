import { auth } from './firebase';
import { 
  signInWithPhoneNumber, 
  signOut, 
  onAuthStateChanged,
  RecaptchaVerifier 
} from 'firebase/auth';

// Store confirmation result globally for OTP verification
let confirmationResult = null;

// Initialize RecaptchaVerifier
export const initRecaptcha = (containerId, callback) => {
  try {
    // Clear any existing recaptcha
    const existingContainer = document.getElementById(containerId);
    if (existingContainer) {
      existingContainer.innerHTML = '';
    }

    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber
        console.log('Recaptcha verified');
        if (callback) callback(response);
      },
      'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again
        console.log('Recaptcha expired');
      }
    });

    return recaptchaVerifier;
  } catch (error) {
    console.error('Error initializing recaptcha:', error);
    throw error;
  }
};

// Send OTP to phone number
export const sendOTP = async (phoneNumber, recaptchaVerifier) => {
  try {
    // Format phone number with +91 if not present
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    
    // Store phone number in session for later use
    sessionStorage.setItem('firebase_temp_phone', formattedPhone);
    
    return { success: true, confirmationResult };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

// Verify OTP code
export const verifyOTP = async (otpCode) => {
  try {
    if (!confirmationResult) {
      return { 
        success: false, 
        error: 'Session expired. Please request OTP again.' 
      };
    }

    const result = await confirmationResult.confirm(otpCode);
    const user = result.user;

    // Store auth data in localStorage for persistence
    const authData = {
      uid: user.uid,
      phoneNumber: user.phoneNumber,
      loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('firebase_auth_user', JSON.stringify(authData));
    localStorage.setItem('firebase_auth_token', await user.getIdToken());
    
    // Clear temp phone from session
    sessionStorage.removeItem('firebase_temp_phone');
    
    return { 
      success: true, 
      user: {
        uid: user.uid,
        phoneNumber: user.phoneNumber
      }
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

// Resend OTP
export const resendOTP = async (recaptchaVerifier) => {
  try {
    const phoneNumber = sessionStorage.getItem('firebase_temp_phone');
    if (!phoneNumber) {
      return { 
        success: false, 
        error: 'Phone number not found. Please start again.' 
      };
    }

    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    
    return { success: true, confirmationResult };
  } catch (error) {
    console.error('Error resending OTP:', error);
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
    confirmationResult = null;
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
export const isAdmin = (adminMobileNumber) => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Remove +91 prefix for comparison if present
  const userPhone = user.phoneNumber.replace('+91', '');
  const adminPhone = adminMobileNumber.replace('+91', '');
  
  return userPhone === adminPhone;
};

// Subscribe to auth state changes
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        phoneNumber: user.phoneNumber,
        isAuthenticated: true
      });
    } else {
      callback({ isAuthenticated: false });
    }
  });
};

// Format phone number for display
export const formatPhoneForDisplay = (phoneNumber) => {
  if (!phoneNumber) return '';
  // Remove +91 and format
  const cleaned = phoneNumber.replace('+91', '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phoneNumber;
};
