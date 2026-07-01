// Firebase client initialization.
//
// NOTE ON SECURITY: These VITE_FIREBASE_* values are *web client config*,
// not secrets. Firebase intentionally ships them to the browser. They appear
// in the built JavaScript bundle either way. Your real security boundary is:
//   1. Firestore Security Rules (deny-by-default, role/approval checks)
//   2. Firebase Authentication
//   3. The "Authorized domains" list in Firebase Auth settings
// Do NOT put any admin/service-account credentials in this file or the repo.
import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
