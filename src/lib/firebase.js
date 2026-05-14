import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Parse Firebase config from environment variable (JSON string)
let firebaseConfig;

try {
  const configString = import.meta.env.VITE_FIREBASE_CONFIG;
  if (configString) {
    firebaseConfig = JSON.parse(configString);
  } else {
    console.error('VITE_FIREBASE_CONFIG is not set in .env file');
  }
} catch (error) {
  console.error('Failed to parse VITE_FIREBASE_CONFIG:', error);
}

// Initialize Firebase
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export default app;
