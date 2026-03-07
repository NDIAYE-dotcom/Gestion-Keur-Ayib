import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuration Firebase - GESTION KEUR AYIB IMMOBILIER
const firebaseConfig = {
  apiKey: "AIzaSyDys5It744jmk3hq8uMhm_h6HVZPQ6Jy0I",
  authDomain: "gestion-keur-ayib.firebaseapp.com",
  projectId: "gestion-keur-ayib",
  storageBucket: "gestion-keur-ayib.firebasestorage.app",
  messagingSenderId: "822841773384",
  appId: "1:822841773384:web:bed79957cc961ba459b77d"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser les services Firebase
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
export const storage = getStorage(app);

export default app;
