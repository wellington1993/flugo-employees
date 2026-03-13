import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  writeBatch,
  arrayUnion,
  arrayRemove,
  type DocumentData,
  type QuerySnapshot,
  Firestore
} from 'firebase/firestore';
import { db } from '@/libs/firebase';
import { Department } from '@/domain/entities/department';
import { IDepartmentRepository } from '@/domain/repositories/i-department-repository';
import { Result, success, failure } from '@/core/functional/result';
import { DepartmentMapper } from '../mappers/department-mapper';
import { OfflineQueue } from '../persistence/offline-queue';
import { generateUUID } from '@/helpers/uuid';

const DEPTS_COLLECTION = 'departments';

export class FirebaseDepartmentRepository implements IDepartmentRepository {
  private readonly db: Firestore;

  constructor(customDb?: Firestore) {
    this.db = customDb || db;
  }

  private isNetworkError(e: any): boolean {
    return !navigator.onLine || 
           (e && (e.code === 'unavailable' || e.code === 'network-request-failed' || e.code === 'deadline-exceeded' || String(e).includes('network') || String(e).includes('transport')));
  }

  async getAll(): Promise<Result<Department[]>> {
    try {
      const q = query(collection(this.db, DEPTS_COLLECTION), orderBy('createdAt', 'desc'));
      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      const depts = querySnapshot.docs.map(doc => DepartmentMapper.toDomain(doc as any));
      return success(depts);
    } catch (e) {
      return failure(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getById(id: string): Promise<Result<Department | null>> {
    try {
      const docRef = doc(this.db, DEPTS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return success(DepartmentMapper.toDomain(docSnap as any));
      }
      return success(null);
    } catch (e) {
      return failure(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async create(dept: Omit<Department, 'id'>): Promise<Result<string>> {
    const timestamp = Date.now();
    const deptId = generateUUID();

    try {
      const docRef = doc(this.db, DEPTS_COLLECTION, deptId);
      const firestoreData = DepartmentMapper.toFirestore({
        ...dept,
        createdAt: timestamp,
      });

      const batch = writeBatch(this.db);
      batch.set(docRef, firestoreData);
      await batch.commit();
      
      return success(deptId);
    } catch (e) {
      if (this.isNetworkError(e)) {
        await OfflineQueue.add({
          type: 'CREATE',
          collection: 'departments',
          data: { ...dept, id: deptId, createdAt: timestamp }
        });
        return success(deptId);
      }
      return failure(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async update(id: string, dept: Partial<Department>, options?: { transferRemovedToDepartmentId?: string }): Promise<Result<void>> {
    try {
      const currentDeptRef = doc(this.db, DEPTS_COLLECTION, id);
      const currentDeptSnapshot = await getDoc(currentDeptRef);
      if (!currentDeptSnapshot.exists()) {
        throw new Error('DEPARTMENT_NOT_FOUND');
      }

      const currentDeptData = currentDeptSnapshot.data() as Department;
      const currentStaffIds = new Set((currentDeptData.staffIds ?? []) as string[]);
      const nextStaffIds = new Set((dept.staffIds ?? currentDeptData.staffIds ?? []) as string[]);
      const removedStaffIds = [...currentStaffIds].filter((staffId) => !nextStaffIds.has(staffId));
      const addedStaffIds = [...nextStaffIds].filter((staffId) => !currentStaffIds.has(staffId));
      const transferRemovedToDepartmentId = options?.transferRemovedToDepartmentId?.trim();

      if (removedStaffIds.length > 0 && !transferRemovedToDepartmentId) {
        throw new Error('DEPARTMENT_STAFF_REMOVAL_REQUIRES_TRANSFER');
      }

      if (transferRemovedToDepartmentId && transferRemovedToDepartmentId === id) {
        throw new Error('DEPARTMENT_TRANSFER_TARGET_INVALID');
      }

      let transferDepartmentExists = false;
      if (transferRemovedToDepartmentId) {
        const transferDeptSnapshot = await getDoc(doc(this.db, DEPTS_COLLECTION, transferRemovedToDepartmentId));
        transferDepartmentExists = transferDeptSnapshot.exists();
      }

      if (removedStaffIds.length > 0 && !transferDepartmentExists) {
        throw new Error('DEPARTMENT_TRANSFER_TARGET_INVALID');
      }

      let batch = writeBatch(this.db);
      let opCount = 0;
      const MAX_OPS = 500;
      const commitBatchIfNeeded = async () => {
        if (opCount >= MAX_OPS) {
          await batch.commit();
          batch = writeBatch(this.db);
          opCount = 0;
        }
      };
      const addOp = async (cb: () => void) => {
        await commitBatchIfNeeded();
        cb();
        opCount += 1;
      };

      await addOp(() => {
        batch.update(currentDeptRef, DepartmentMapper.toFirestore({
          ...dept,
          staffIds: Array.from(nextStaffIds),
        }));
      });

      for (const staffId of addedStaffIds) {
        const staffRef = doc(this.db, 'staffs', staffId);
        const staffSnapshot = await getDoc(staffRef);
        if (!staffSnapshot.exists()) continue;

        const previousDepartmentId = (staffSnapshot.data() as { departmentId?: string }).departmentId;
        if (previousDepartmentId && previousDepartmentId !== id) {
          const previousDeptRef = doc(this.db, DEPTS_COLLECTION, previousDepartmentId);
          const previousDeptSnapshot = await getDoc(previousDeptRef);
          if (previousDeptSnapshot.exists()) {
            await addOp(() => {
              batch.update(previousDeptRef, { staffIds: arrayRemove(staffId) });
            });
          }
        }

        await addOp(() => {
          batch.update(staffRef, { departmentId: id });
        });
      }

      if (removedStaffIds.length > 0 && transferRemovedToDepartmentId) {
        for (const staffId of removedStaffIds) {
          const staffRef = doc(this.db, 'staffs', staffId);
          await addOp(() => {
            batch.update(staffRef, { departmentId: transferRemovedToDepartmentId });
          });
        }

        await addOp(() => {
          batch.update(doc(this.db, DEPTS_COLLECTION, transferRemovedToDepartmentId), {
            staffIds: arrayUnion(...removedStaffIds),
          });
        });
      }

      if (opCount > 0) {
        await batch.commit();
      }
      return success(undefined);
    } catch (e) {
      if (this.isNetworkError(e)) {
        await OfflineQueue.add({
          type: 'UPDATE',
          collection: 'departments',
          data: { ...dept, id },
          options
        });
        return success(undefined);
      }
      return failure(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      const docRef = doc(this.db, DEPTS_COLLECTION, id);
      const deptSnap = await getDoc(docRef);
      if (!deptSnap.exists()) {
        throw new Error('DEPARTMENT_NOT_FOUND');
      }

      const department = deptSnap.data() as Department;
      if ((department.staffIds ?? []).length > 0) {
        throw new Error('DEPARTMENT_HAS_STAFF');
      }

      const batch = writeBatch(this.db);
      batch.delete(docRef);
      await batch.commit();
      return success(undefined);
    } catch (e) {
      if (this.isNetworkError(e)) {
        await OfflineQueue.add({
          type: 'DELETE',
          collection: 'departments',
          data: { id }
        });
        return success(undefined);
      }
      return failure(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
