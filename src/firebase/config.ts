
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// These values are injected by the environment in Firebase Studio.
// Placeholder values are used for local development until the backend is fully provisioned.
const firebaseConfig = {
  apiKey: "AIzaSyAs-example-key",
  authDomain: "masaon-app.firebaseapp.com",
  projectId: "masaon-app",
  storageBucket: "masaon-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Idempotent initialization to prevent "Firebase App already exists" errors
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
