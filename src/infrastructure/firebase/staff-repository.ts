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
  type QuerySnapshot,
  Firestore
} from 'firebase/firestore';
import { db } from '@/libs/firebase';
import { Staff } from '@/domain/entities/staff';
import { IStaffRepository } from '@/domain/repositories/i-staff-repository';
import { Result, success, failure } from '@/core/functional/result';
import { StaffMapper } from '../mappers/staff-mapper';
import { OfflineQueue } from '../persistence/offline-queue';

const STAFFS_COLLECTION = 'staffs';
const DEPTS_COLLECTION = 'departments';

export class FirebaseStaffRepository implements IStaffRepository {
  private readonly db: Firestore;

  constructor(customDb?: Firestore) {
    this.db = customDb || db;
  }

  private isNetworkError(e: any): boolean {
    return !navigator.onLine || 
           (e && (e.code === 'unavailable' || e.code === 'network-request-failed' || String(e).includes('network')));
  }

  async getAll(): Promise<Result<Staff[]>> {
    try {
      const q = query(collection(this.db, STAFFS_COLLECTION), orderBy('createdAt', 'desc'));
      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      const staffs = querySnapshot.docs.map(doc => StaffMapper.toDomain(doc as any));
      return success(staffs);
    } catch (e) {
      return failure(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getById(id: string): Promise<Result<Staff | null>> {
    try {
      const docRef = doc(this.db, STAFFS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return success(StaffMapper.toDomain(docSnap as any));
      }
      return success(null);
    } catch (e) {
      return failure(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async create(staff: Omit<Staff, 'id'>): Promise<Result<string>> {
    const timestamp = Date.now();
    const staffId = crypto.randomUUID(); // Geramos ID localmente para manter consistência offline

    try {
      const batch = writeBatch(this.db);
      const staffRef = doc(this.db, STAFFS_COLLECTION, staffId);
      
      const firestoreData = StaffMapper.toFirestore({
        ...staff,
        createdAt: timestamp,
      });

      batch.set(staffRef, firestoreData);

      if (staff.departmentId) {
        const deptRef = doc(this.db, DEPTS_COLLECTION, staff.departmentId);
        batch.update(deptRef, {
          staffIds: arrayUnion(staffId)
        });
      }

      await batch.commit();
      return success(staffId);
    } catch (e) {
      if (this.isNetworkError(e)) {
        await OfflineQueue.add({
          type: 'CREATE',
          collection: 'staffs',
          data: { ...staff, id: staffId, createdAt: timestamp }
        });
        return success(staffId); // Retornamos sucesso pois o PWA cuidará da sincronização
      }
      return failure(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async update(id: string, staff: Partial<Staff>): Promise<Result<void>> {
    try {
      const batch = writeBatch(this.db);
      const staffRef = doc(this.db, STAFFS_COLLECTION, id);
      batch.update(staffRef, StaffMapper.toFirestore(staff));

      const oldDoc = await getDoc(staffRef);
      if (oldDoc.exists()) {
        const oldStaff = oldDoc.data() as Staff;
        if (staff.departmentId && staff.departmentId !== oldStaff.departmentId) {
          if (oldStaff.departmentId) {
            batch.update(doc(this.db, DEPTS_COLLECTION, oldStaff.departmentId), {
              staffIds: arrayRemove(id)
            });
          }
          batch.update(doc(this.db, DEPTS_COLLECTION, staff.departmentId), {
            staffIds: arrayUnion(id)
          });
        }
      }

      await batch.commit();
      return success(undefined);
    } catch (e) {
      if (this.isNetworkError(e)) {
        await OfflineQueue.add({
          type: 'UPDATE',
          collection: 'staffs',
          data: { ...staff, id }
        });
        return success(undefined);
      }
      return failure(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      const staffSnap = await getDoc(doc(this.db, STAFFS_COLLECTION, id));
      const batch = writeBatch(this.db);
      batch.delete(doc(this.db, STAFFS_COLLECTION, id));

      if (staffSnap.exists()) {
        const staff = staffSnap.data() as Staff;
        if (staff.departmentId) {
          batch.update(doc(this.db, DEPTS_COLLECTION, staff.departmentId), {
            staffIds: arrayRemove(id)
          });
        }
      }

      await batch.commit();
      return success(undefined);
    } catch (e) {
      if (this.isNetworkError(e)) {
        await OfflineQueue.add({
          type: 'DELETE',
          collection: 'staffs',
          data: { id }
        });
        return success(undefined);
      }
      return failure(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async bulkDelete(ids: string[]): Promise<Result<void>> {
    try {
      const MAX_OPERATIONS = 500;
      let currentBatch = writeBatch(this.db);
      let operationCount = 0;

      const staffSnapshots = await Promise.all(
        ids.map(id => getDoc(doc(this.db, STAFFS_COLLECTION, id)))
      );

      const deptRemovals: Record<string, string[]> = {};
      
      for (const snap of staffSnapshots) {
        if (!snap.exists()) continue;
        const id = snap.id;
        const data = snap.data() as Staff;

        if (operationCount >= MAX_OPERATIONS) {
          await currentBatch.commit();
          currentBatch = writeBatch(this.db);
          operationCount = 0;
        }
        currentBatch.delete(doc(this.db, STAFFS_COLLECTION, id));
        operationCount++;

        if (data.departmentId) {
          deptRemovals[data.departmentId] = deptRemovals[data.departmentId] || [];
          deptRemovals[data.departmentId]!.push(id);
        }
      }

      for (const [deptId, staffIdsToRemove] of Object.entries(deptRemovals)) {
        if (operationCount >= MAX_OPERATIONS) {
          await currentBatch.commit();
          currentBatch = writeBatch(this.db);
          operationCount = 0;
        }
        currentBatch.update(doc(this.db, DEPTS_COLLECTION, deptId), {
          staffIds: arrayRemove(...staffIdsToRemove)
        });
        operationCount++;
      }

      if (operationCount > 0) {
        await currentBatch.commit();
      }
      return success(undefined);
    } catch (e) {
      if (this.isNetworkError(e)) {
        await OfflineQueue.add({
          type: 'BULK_DELETE',
          collection: 'staffs',
          data: { ids }
        });
        return success(undefined);
      }
      return failure(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getByDepartment(departmentId: string): Promise<Result<Staff[]>> {
    try {
      const q = query(collection(this.db, STAFFS_COLLECTION), where('departmentId', '==', departmentId));
      const querySnapshot = await getDocs(q);
      const staffs = querySnapshot.docs.map(doc => StaffMapper.toDomain(doc as any));
      return success(staffs);
    } catch (e) {
      return failure(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
