import { isFirebaseConfigured } from '@/libs/firebase'
import { FirebaseStorage, LocalOnlyStorage, type StaffStorage } from './storage-provider'
import type { Staff } from '@/features/staff/types'
import type { StaffSchema } from '@/features/staff/validation'

const storage: StaffStorage = isFirebaseConfigured ? FirebaseStorage : LocalOnlyStorage

export async function listStaffs(): Promise<Staff[]> {
  return storage.list()
}

export async function createStaff(data: StaffSchema) {
  return storage.create(data)
}

export async function pushStaffToFirebase(staff: Staff): Promise<boolean> {
  return storage.sync(staff)
}

export async function updateStaff(id: string, data: StaffSchema): Promise<void> {
  return storage.update(id, data)
}

export async function deleteStaff(id: string): Promise<void> {
  return storage.delete(id)
}
