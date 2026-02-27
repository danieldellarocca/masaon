
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// These values are typically injected at runtime or provided via environment variables.
// If you see errors about missing permissions, ensure Firestore is enabled in your console.
const firebaseConfig = {
  apiKey: "AIzaSyAs-example-key", // Replace with real key if needed
  authDomain: "masaon-app.firebaseapp.com",
  projectId: "masaon-app",
  storageBucket: "masaon-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Use idempotent initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
