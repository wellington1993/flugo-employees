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
const normalizeDepartmentName = (name: string) => name.trim().toLowerCase();

async function assertUniqueDepartmentName(name: string, currentId?: string) {
  const normalized = normalizeDepartmentName(name);
  const allDepartments = await getDocs(collection(db, COLLECTION_NAME));
  const duplicate = allDepartments.docs.some((departmentDoc) => {
    if (currentId && departmentDoc.id === currentId) return false;
    const currentName = (departmentDoc.data().name as string | undefined) ?? '';
    return normalizeDepartmentName(currentName) === normalized;
  });
  if (duplicate) {
    throw new Error('DUPLICATE_DEPARTMENT_NAME');
  }
}

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
    await assertUniqueDepartmentName(data.name);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      staffIds: [],
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<Department>): Promise<void> {
    if (data.name) {
      await assertUniqueDepartmentName(data.name, id);
    }
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  },

  async delete(id: string): Promise<void> {
    const staffsQuery = query(collection(db, STAFFS_COLLECTION), where('departmentId', '==', id));
    const staffsSnapshot = await getDocs(staffsQuery);
    if (staffsSnapshot.docs.length > 0) {
      throw new Error('DEPARTMENT_HAS_STAFF');
    }
    const batch = writeBatch(db);
    batch.delete(doc(db, COLLECTION_NAME, id));
    await batch.commit();
  },

  async transferAndDelete(sourceDepartmentId: string, targetDepartmentId: string): Promise<void> {
    if (!targetDepartmentId || sourceDepartmentId === targetDepartmentId) {
      throw new Error('INVALID_TARGET_DEPARTMENT');
    }

    const staffsQuery = query(collection(db, STAFFS_COLLECTION), where('departmentId', '==', sourceDepartmentId));
    const staffsSnapshot = await getDocs(staffsQuery);
    const hasActive = staffsSnapshot.docs.some((d) => d.data().status === 'ACTIVE');
    if (hasActive && !targetDepartmentId) {
      throw new Error('ACTIVE_STAFF_TRANSFER_REQUIRED');
    }

    const batch = writeBatch(db);
    const movedStaffIds: string[] = [];

    staffsSnapshot.docs.forEach((staffDoc) => {
      batch.update(staffDoc.ref, { departmentId: targetDepartmentId });
      movedStaffIds.push(staffDoc.id);
    });

    const sourceRef = doc(db, COLLECTION_NAME, sourceDepartmentId);
    const targetRef = doc(db, COLLECTION_NAME, targetDepartmentId);
    const targetSnap = await getDoc(targetRef);
    const targetStaffIds = (targetSnap.exists() ? (targetSnap.data().staffIds as string[] | undefined) : []) ?? [];
    batch.update(targetRef, { staffIds: Array.from(new Set([...targetStaffIds, ...movedStaffIds])) });
    batch.delete(sourceRef);
    await batch.commit();
  },
};
