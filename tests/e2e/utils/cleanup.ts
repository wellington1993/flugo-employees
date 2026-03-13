import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega o .env da raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function cleanupTestRecords() {
  const staffsRef = collection(db, 'staffs');
  const departmentsRef = collection(db, 'departments');

  const snapshot = await getDocs(staffsRef);
  const departmentsSnapshot = await getDocs(departmentsRef);
  
  const deletions = snapshot.docs
    .filter(document => {
      const name = document.data().name || '';
      return name.includes('Wellington Teste E2E') || 
             name.includes('Offline Staff') || 
             name.includes('Offline User') ||
              name.includes('Teste Ativo ') ||
              name.includes('Teste Inativo ') ||
             name.includes('Primeiro ') ||
             name.includes('Dept Wizard Staff ');
    })
    .map(document => deleteDoc(doc(db, 'staffs', document.id)));
  
  const departmentDeletions = departmentsSnapshot.docs
    .filter(document => {
      const name = document.data().name || '';
      return name.includes('E2E Dept Wizard ');
    })
    .map(document => deleteDoc(doc(db, 'departments', document.id)));

  const totalDeletions = deletions.length + departmentDeletions.length

  if (totalDeletions > 0) {
    await Promise.all([...deletions, ...departmentDeletions]);
    console.log(`[Playwright Cleanup] ${totalDeletions} registros de teste removidos.`);
  }
}
