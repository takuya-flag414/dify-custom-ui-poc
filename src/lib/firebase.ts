// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { isStrictFEMode } from '../config/env';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: any, auth: any, adminAuth: any, db: any;

if (isStrictFEMode) {
  console.info('🔒 [Strict FE Mode] Firebase initialization bypassed. Running entirely offline.');
  app = {};
  auth = { currentUser: null };
  adminAuth = { currentUser: null };
  db = {};
} else {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  // 管理者による新規ユーザー作成用セカンダリアプリ (現在の管理者ログアウトを防ぐため)
  const secondaryApp = initializeApp(firebaseConfig, 'SecondaryAdminApp');

  // Initialize Services
  auth = getAuth(app);
  adminAuth = getAuth(secondaryApp);
  db = getFirestore(app);
}

export { app, auth, adminAuth, db };
export default app;
