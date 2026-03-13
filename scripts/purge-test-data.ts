import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function purge() {
  if (!firebaseConfig.projectId) {
    console.error('Firebase Project ID não encontrado no .env.local');
    return;
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const collections = ['staffs', 'departments'];
  const patterns = ['Error', 'Optimistic User', 'Teste', 'Scalability'];

  for (const colName of collections) {
    console.log(`Limpando coleção: ${colName}...`);
    const colRef = collection(db, colName);
    const snapshot = await getDocs(colRef);
    
    let count = 0;
    for (const document of snapshot.docs) {
      const data = document.data();
      const name = data.name || '';
      
      const shouldDelete = patterns.some(p => name.includes(p));
      
      if (shouldDelete) {
        await deleteDoc(doc(db, colName, document.id));
        count++;
      }
    }
    console.log(`Removidos ${count} documentos de ${colName}.`);
  }
}

purge().catch(console.error);
