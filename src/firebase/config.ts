
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAs-example-key",
  authDomain: "masaon-app.firebaseapp.com",
  projectId: "masaon-app",
  storageBucket: "masaon-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// אילוץ Long Polling לשיפור יציבות בסביבות ענן ומניעת שגיאות Offline
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ 
    tabManager: persistentMultipleTabManager() 
  }),
  experimentalForceLongPolling: true
});

const auth = getAuth(app);

export { app, db, auth };
