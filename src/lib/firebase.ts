// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { isStrictFEMode } from '../config/env';

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : (process.env || {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

let app: any, auth: any, adminAuth: any, db: any, functions: any;

if (isStrictFEMode) {
  console.info('🔒 [Strict FE Mode] Firebase initialization bypassed. Running entirely offline.');
  app = {};
  auth = { currentUser: null };
  adminAuth = { currentUser: null };
  db = {};
  functions = {};
} else {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  // 管理者による新規ユーザー作成用セカンダリアプリ (現在の管理者ログアウトを防ぐため)
  const secondaryApp = initializeApp(firebaseConfig, 'SecondaryAdminApp');

  // Initialize Services
  auth = getAuth(app);
  adminAuth = getAuth(secondaryApp);
  db = getFirestore(app);
  functions = getFunctions(app, 'asia-northeast1');
}

export { app, auth, adminAuth, db, functions };
export default app;
