import { isFirebaseConfigured } from '@/libs/firebase'
import { FirebaseStorage, LocalOnlyStorage, type StaffStorage } from './storage-provider'
import type { Staff } from '@/features/staff/types'
import type { StaffSchema } from '@/features/staff/validation'

// 4. Seleção Dinâmica do Provider
const storage: StaffStorage = isFirebaseConfigured ? FirebaseStorage : LocalOnlyStorage

// 5. API Pública do Serviço (Mantendo compatibilidade)
export async function listStaffs(): Promise<Staff[]> {
  return storage.list()
}

export async function createStaff(data: StaffSchema): Promise<{ synced: boolean; error?: string }> {
  return storage.create(data)
}

export async function pushStaffToFirebase(staff: Staff): Promise<boolean> {
  return storage.sync(staff)
}

// Nota: updateStaff e deleteStaff foram removidos pois não fazem parte do escopo do figma.
// Caso precise no futuro, basta adicionar à interface StaffStorage e implementá-los nos providers.
