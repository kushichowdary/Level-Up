import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyDdmN5GVSKOgW75-bfj64i74e-8hx1s3F0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "levelup-ea8f0.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "levelup-ea8f0",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "levelup-ea8f0.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "501325338009",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:501325338009:web:e04ef7659185abbbd0ef08",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-0PHJYX5914"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with offline persistence enabled.
// This new API replaces the deprecated `enableIndexedDbPersistence`.
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({})
});