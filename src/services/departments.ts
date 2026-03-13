import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  where,
  type DocumentData,
  type QuerySnapshot
} from 'firebase/firestore';
import { db } from '@/libs/firebase';
import { type Department } from '@/features/department/types';

const COLLECTION_NAME = 'departments';
const STAFFS_COLLECTION = 'staffs';

export const departmentService = {
  async getAll(): Promise<Department[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Department[];
  },

  async getById(id: string): Promise<Department | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Department;
    }
    return null;
  },

  async create(data: Omit<Department, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      staffIds: [],
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<Department>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  },

  async delete(id: string): Promise<void> {
    // 1. Busca todos os colaboradores vinculados a este departamento
    const staffsQuery = query(collection(db, STAFFS_COLLECTION), where('departmentId', '==', id));
    const staffsSnapshot = await getDocs(staffsQuery);
    
    const batch = writeBatch(db);
    
    // 2. Remove a referência de departamento nos colaboradores (limite 500 simplificado aqui)
    staffsSnapshot.docs.forEach(staffDoc => {
      batch.update(staffDoc.ref, { departmentId: null });
    });

    // 3. Deleta o departamento
    batch.delete(doc(db, COLLECTION_NAME, id));

    await batch.commit();
  },
};
