import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import * as fs from 'fs';
import { resolve } from 'path';

// .env.local を手動でパースする
const envPath = '.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/(^"|"$)/g, '');
  }
});

const firebaseConfig = {
  apiKey: env['VITE_FIREBASE_API_KEY'],
  authDomain: env['VITE_FIREBASE_AUTH_DOMAIN'],
  projectId: env['VITE_FIREBASE_PROJECT_ID'],
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testSignup() {
  const testEmail = `test_${Date.now()}@iflag.co.jp`;
  console.log(`Testing signup with ${testEmail}...`);
  try {
    const credential = await createUserWithEmailAndPassword(auth, testEmail, 'Password123!');
    console.log('SUCCESS! UID:', credential.user.uid);
    process.exit(0);
  } catch (error: any) {
    console.error('FAILED!');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Full Error Object:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

testSignup();
