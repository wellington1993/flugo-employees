import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  writeBatch,
  where,
  arrayUnion,
  arrayRemove,
  type DocumentData,
  type QuerySnapshot
} from 'firebase/firestore';
import { db } from '@/libs/firebase';
import { type Staff } from '../features/staff/types';

const STAFFS_COLLECTION = 'staffs';
const DEPTS_COLLECTION = 'departments';

export const staffService = {
  async getAll(): Promise<Staff[]> {
    const q = query(collection(db, STAFFS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Staff[];
  },

  async getById(id: string): Promise<Staff | null> {
    const docRef = doc(db, STAFFS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Staff;
    }
    return null;
  },

  async create(data: Omit<Staff, 'id' | 'createdAt'>): Promise<string> {
    const batch = writeBatch(db);
    const staffRef = doc(collection(db, STAFFS_COLLECTION));
    const timestamp = Date.now();
    
    batch.set(staffRef, {
      ...data,
      createdAt: timestamp,
    });

    if (data.departmentId) {
      const deptRef = doc(db, DEPTS_COLLECTION, data.departmentId);
      batch.update(deptRef, {
        staffIds: arrayUnion(staffRef.id)
      });
    }

    await batch.commit();
    return staffRef.id;
  },

  async update(id: string, data: Partial<Staff>): Promise<void> {
    const oldStaff = await this.getById(id);
    if (!oldStaff) throw new Error('Colaborador não encontrado');

    const batch = writeBatch(db);
    const staffRef = doc(db, STAFFS_COLLECTION, id);
    batch.update(staffRef, data);

    if (data.departmentId && data.departmentId !== oldStaff.departmentId) {
      if (oldStaff.departmentId) {
        const oldDeptRef = doc(db, DEPTS_COLLECTION, oldStaff.departmentId);
        batch.update(oldDeptRef, {
          staffIds: arrayRemove(id)
        });
      }
      const newDeptRef = doc(db, DEPTS_COLLECTION, data.departmentId);
      batch.update(newDeptRef, {
        staffIds: arrayUnion(id)
      });
    }

    await batch.commit();
  },

  async delete(id: string): Promise<void> {
    const staff = await this.getById(id);
    const batch = writeBatch(db);
    const staffRef = doc(db, STAFFS_COLLECTION, id);
    batch.delete(staffRef);

    if (staff?.departmentId) {
      const deptRef = doc(db, DEPTS_COLLECTION, staff.departmentId);
      batch.update(deptRef, {
        staffIds: arrayRemove(id)
      });
    }

    await batch.commit();
  },

  async bulkDelete(ids: string[]): Promise<void> {
    const MAX_OPERATIONS = 500;
    let currentBatch = writeBatch(db);
    let operationCount = 0;

    const staffSnapshots = await Promise.all(
      ids.map(id => getDoc(doc(db, STAFFS_COLLECTION, id)))
    );

    const staffData = staffSnapshots
      .filter(snap => snap.exists())
      .map(snap => ({ ...(snap.data() as Staff), id: snap.id }));

    const deptRemovals: Record<string, string[]> = {};
    staffData.forEach(staff => {
      if (staff.departmentId) {
        deptRemovals[staff.departmentId] = deptRemovals[staff.departmentId] || [];
        deptRemovals[staff.departmentId].push(staff.id);
      }
    });

    for (const staff of staffData) {
      if (operationCount >= MAX_OPERATIONS) {
        await currentBatch.commit();
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
      currentBatch.delete(doc(db, STAFFS_COLLECTION, staff.id));
      operationCount++;
    }

    for (const [deptId, staffIdsToRemove] of Object.entries(deptRemovals)) {
      if (operationCount >= MAX_OPERATIONS) {
        await currentBatch.commit();
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
      const deptRef = doc(db, DEPTS_COLLECTION, deptId);
      currentBatch.update(deptRef, {
        staffIds: arrayRemove(...staffIdsToRemove)
      });
      operationCount++;
    }

    if (operationCount > 0) {
      await currentBatch.commit();
    }
  },

  async getByDepartment(departmentId: string): Promise<Staff[]> {
    const q = query(collection(db, STAFFS_COLLECTION), where('departmentId', '==', departmentId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Staff[];
  }
};
