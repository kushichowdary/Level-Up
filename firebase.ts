import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdmN5GVSKOgW75-bfj64i74e-8hx1s3F0",
  authDomain: "levelup-ea8f0.firebaseapp.com",
  projectId: "levelup-ea8f0",
  storageBucket: "levelup-ea8f0.firebasestorage.app",
  messagingSenderId: "501325338009",
  appId: "1:501325338009:web:e04ef7659185abbbd0ef08",
  measurementId: "G-0PHJYX5914"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
