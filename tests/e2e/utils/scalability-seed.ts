import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export async function seedScalabilityData(count: number = 50) {
  console.log(`[E2E Seed] Criando departamento e ${count} colaboradores...`);
  
  const deptRef = await addDoc(collection(db, 'departments'), {
    name: 'Scalability Dept',
    description: 'Department for testing many employees',
    staffIds: [],
    createdAt: Date.now(),
  });

  const staffPromises = [];
  for (let i = 1; i <= count; i++) {
    staffPromises.push(
      addDoc(collection(db, 'staffs'), {
        name: `Scalability Employee ${i}`,
        email: `scale${i}@test.com`,
        status: 'ACTIVE',
        departmentId: deptRef.id,
        role: 'Tester',
        admissionDate: '2024-01-01',
        hierarchicalLevel: 'ENTRY',
        baseSalary: 1000,
        createdAt: Date.now(),
      })
    );
  }

  const staffDocs = await Promise.all(staffPromises);
  console.log(`[E2E Seed] Concluído. Dept ID: ${deptRef.id}`);
  
  return {
    deptId: deptRef.id,
    staffIds: staffDocs.map(d => d.id),
  };
}

export async function cleanupScalabilityData(deptId: string) {
  console.log(`[E2E Cleanup] Removendo dados de escalabilidade do dept ${deptId}...`);
  
  // Delete employees
  const staffsRef = collection(db, 'staffs');
  const q = query(staffsRef, where('departmentId', '==', deptId));
  const snapshot = await getDocs(q);
  const employeeDeletions = snapshot.docs.map(d => deleteDoc(doc(db, 'staffs', d.id)));
  
  // Delete department
  await deleteDoc(doc(db, 'departments', deptId));
  await Promise.all(employeeDeletions);
  
  console.log(`[E2E Cleanup] ${employeeDeletions.length + 1} registros removidos.`);
}
