
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// הגדרות הפרויקט - בסביבת Firebase Studio הערכים מוזרקים אוטומטית.
// השתמשנו בהגדרות התואמות לפרויקט masaon-app.
const firebaseConfig = {
  apiKey: "AIzaSyAs-example-key",
  authDomain: "masaon-app.firebaseapp.com",
  projectId: "masaon-app",
  storageBucket: "masaon-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// אתחול אפליקציה בצורה חכמה שמונעת כפילויות
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// אתחול Firestore עם הגדרות עמידות יותר לסביבת ענן וריבוי טאבים
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

const auth = getAuth(app);

export { app, db, auth };
