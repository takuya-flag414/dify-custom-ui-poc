import { initializeApp } from 'firebase/app';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyApnOR9-UMPl1n6F89ezd-7E8V0ninb-sY",
  authDomain: "aiagent-forrag.firebaseapp.com",
  projectId: "aiagent-forrag",
  storageBucket: "aiagent-forrag.firebasestorage.app",
  messagingSenderId: "1025955561874",
  appId: "1:1025955561874:web:58e56d5b0497f34c7c414b",
};

const departments = [
    { id: 1, name: '商品企画部' },
    { id: 2, name: '営業部' },
    { id: 3, name: 'クリエイティブマーケティング部' },
    { id: 4, name: 'その他' },
    { id: 5, name: 'カスタマーリレーション部' },
];

async function update() {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const batch = writeBatch(db);
    
    console.log('Updating departments...');
    departments.forEach(dept => {
        batch.set(doc(db, 'departments', dept.id.toString()), {
            name: dept.name,
            parent_id: null,
            org_path: dept.id.toString()
        });
    });
    
    await batch.commit();
    console.log('Departments updated successfully!');
    process.exit(0);
}

update().catch(err => {
    console.error('Failed to update departments:', err);
    process.exit(1);
});
