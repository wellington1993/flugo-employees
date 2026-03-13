import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  writeBatch,
  arrayRemove,
  arrayUnion,
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

const DEPTS_COLLECTION = 'departments';
const STAFFS_COLLECTION = 'staffs';
const uniqueIds = (ids: readonly string[] = []) => Array.from(new Set(ids.filter(Boolean)));

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
    const deptId = crypto.randomUUID();

    try {
      const docRef = doc(this.db, DEPTS_COLLECTION, deptId);
      const requestedStaffIds = uniqueIds(dept.staffIds ?? []);
      const firestoreData = DepartmentMapper.toFirestore({
        ...dept,
        staffIds: requestedStaffIds,
        createdAt: timestamp,
      });

      const batch = writeBatch(this.db);
      batch.set(docRef, firestoreData);

      const previousDepartmentsToUpdate = new Set<string>();
      for (const staffId of requestedStaffIds) {
        const staffRef = doc(this.db, STAFFS_COLLECTION, staffId);
        const staffSnapshot = await getDoc(staffRef);
        if (!staffSnapshot.exists()) continue;

        const staffData = staffSnapshot.data() as { departmentId?: string | null };
        if (staffData.departmentId && staffData.departmentId !== deptId) {
          previousDepartmentsToUpdate.add(staffData.departmentId);
        }

        batch.update(staffRef, { departmentId: deptId });
      }

      for (const sourceDepartmentId of previousDepartmentsToUpdate) {
        batch.update(doc(this.db, DEPTS_COLLECTION, sourceDepartmentId), {
          staffIds: arrayRemove(...requestedStaffIds),
        });
      }

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

  async update(
    id: string,
    dept: Partial<Department>,
    options?: { transferRemovedToDepartmentId?: string }
  ): Promise<Result<void>> {
    try {
      const currentDepartmentRef = doc(this.db, DEPTS_COLLECTION, id);
      const currentDepartmentSnap = await getDoc(currentDepartmentRef);
      if (!currentDepartmentSnap.exists()) {
        return failure(new Error('DEPARTMENT_NOT_FOUND'));
      }

      const currentDepartment = DepartmentMapper.toDomain(currentDepartmentSnap as any);
      const currentStaffIds = uniqueIds(currentDepartment.staffIds ?? []);
      const requestedStaffIds = uniqueIds(dept.staffIds ?? currentStaffIds);
      const addedStaffIds = requestedStaffIds.filter((staffId) => !currentStaffIds.includes(staffId));
      const removedStaffIds = currentStaffIds.filter((staffId) => !requestedStaffIds.includes(staffId));
      if (removedStaffIds.length > 0 && !options?.transferRemovedToDepartmentId) {
        return failure(new Error('DEPARTMENT_STAFF_REMOVAL_REQUIRES_TRANSFER'));
      }
      if (options?.transferRemovedToDepartmentId && options.transferRemovedToDepartmentId === id) {
        return failure(new Error('DEPARTMENT_TRANSFER_TARGET_INVALID'));
      }

      const docRef = doc(this.db, DEPTS_COLLECTION, id);
      const batch = writeBatch(this.db);
      const sourceDepartments = new Set<string>();

      for (const staffId of addedStaffIds) {
        const staffRef = doc(this.db, STAFFS_COLLECTION, staffId);
        const staffSnapshot = await getDoc(staffRef);
        if (!staffSnapshot.exists()) continue;

        const staffData = staffSnapshot.data() as { departmentId?: string | null };
        if (staffData.departmentId && staffData.departmentId !== id) {
          sourceDepartments.add(staffData.departmentId);
        }

        batch.update(staffRef, { departmentId: id });
      }

      for (const sourceDepartmentId of sourceDepartments) {
        batch.update(doc(this.db, DEPTS_COLLECTION, sourceDepartmentId), {
          staffIds: arrayRemove(...addedStaffIds),
        });
      }

      if (removedStaffIds.length > 0 && options?.transferRemovedToDepartmentId) {
        const targetDepartmentRef = doc(this.db, DEPTS_COLLECTION, options.transferRemovedToDepartmentId);
        batch.update(targetDepartmentRef, {
          staffIds: arrayUnion(...removedStaffIds),
        });

        for (const staffId of removedStaffIds) {
          const staffRef = doc(this.db, STAFFS_COLLECTION, staffId);
          batch.update(staffRef, { departmentId: options.transferRemovedToDepartmentId });
        }
      }

      batch.update(docRef, DepartmentMapper.toFirestore({
        ...dept,
        staffIds: requestedStaffIds,
      }));
      await batch.commit();
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
