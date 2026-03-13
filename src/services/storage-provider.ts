import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/libs/firebase'
import { addPendingStaff, getPendingStaffs, removePendingByEmail } from '@/services/local-storage'
import type { Staff } from '@/features/staff/types'
import type { StaffSchema } from '@/features/staff/validation'

export interface StaffStorage {
  list(): Promise<Staff[]>;
  create(data: StaffSchema): Promise<{ staff: Staff; synced: boolean; error?: string }>;
  sync(staff: Staff): Promise<boolean>;
  update(id: string, data: StaffSchema): Promise<void>;
  delete(id: string): Promise<void>;
}

export const FirebaseStorage: StaffStorage = {
  async list(): Promise<Staff[]> {
    const pending = getPendingStaffs()
    if (!isFirebaseConfigured) return pending;

    try {
      const staffsCollection = collection(db, 'staffs')
      // O getDocs usará o cache local automaticamente se estiver offline
      const snapshot = await getDocs(staffsCollection)
      const fromFirebase = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Staff))
      
      const firebaseEmails = new Set(fromFirebase.map(s => s.email))
      // Filtra pendentes que já chegaram no Firebase para evitar duplicidade
      const stillPending = pending.filter(s => !firebaseEmails.has(s.email))
      
      // Sincroniza o localStorage se algum item pendente já foi detectado no Firebase
      if (stillPending.length !== pending.length) {
        localStorage.setItem('flugo_pending_staffs', JSON.stringify(stillPending))
      }
      
      return [...fromFirebase, ...stillPending]
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[Firebase] List failed or offline, returning pending + local cache if available.', err)
      return pending
    }
  },

  async create(data: StaffSchema): Promise<{ staff: Staff; synced: boolean; error?: string }> {
    if (!isFirebaseConfigured || !navigator.onLine) {
      const staffSalvo = addPendingStaff(data)
      return { staff: staffSalvo, synced: false, error: 'Offline' }
    }

    try {
      const now = Date.now()
      const newStaff: Staff = { ...data, id: data.email, createdAt: now }
      const staffDoc = doc(db, 'staffs', newStaff.id)
      
      // Verifica se já existe para evitar sobrescrita acidental
      const docSnap = await getDoc(staffDoc)
      if (docSnap.exists()) {
        throw new Error('Este e-mail já está em uso por outro colaborador.')
      }

      await setDoc(staffDoc, { ...data, createdAt: now })
      removePendingByEmail(data.email)
      return { staff: newStaff, synced: true }
    } catch (err: unknown) {
      const error = err as { message?: string }
      
      // Se for erro de duplicidade que acabamos de lançar, repassa para o form
      if (error.message?.includes('em uso')) {
        throw err
      }

      if (import.meta.env.DEV) console.warn('[Firebase] Create failed, falling back to offline.', err)
      const staffSalvo = addPendingStaff(data)
      return { staff: staffSalvo, synced: false, error: error.message || 'Network error' }
    }
  },

  async sync(staff: Staff): Promise<boolean> {
    if (!isFirebaseConfigured || !navigator.onLine) return false;
    try {
      const staffDoc = doc(db, 'staffs', staff.email)
      const docSnap = await getDoc(staffDoc)
      if (docSnap.exists()) {
        removePendingByEmail(staff.email)
        return true
      }
      const { _localId, _pendingSync, id, ...payload } = staff
      await setDoc(staffDoc, { ...payload, createdAt: staff.createdAt || Date.now() })
      removePendingByEmail(staff.email)
      return true
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error('[Firebase] Sync failed:', err)
      return false
    }
  },

  async update(id: string, data: StaffSchema): Promise<void> {
    if (!isFirebaseConfigured || !navigator.onLine) return;
    const staffDoc = doc(db, 'staffs', id)
    await updateDoc(staffDoc, { ...data, updatedAt: Date.now() })
  },

  async delete(id: string): Promise<void> {
    if (!isFirebaseConfigured || !navigator.onLine) return;
    const staffDoc = doc(db, 'staffs', id)
    await deleteDoc(staffDoc)
  }
}

export const LocalOnlyStorage: StaffStorage = {
  async list(): Promise<Staff[]> {
    return getPendingStaffs()
  },
  async create(data: StaffSchema): Promise<{ staff: Staff; synced: boolean; error?: string }> {
    const staffSalvo = addPendingStaff(data)
    return { staff: staffSalvo, synced: false, error: 'Offline' }
  },
  async sync(): Promise<boolean> {
    return false
  },
  async update(): Promise<void> {
    if (import.meta.env.DEV) console.warn('Update local not supported')
  },
  async delete(): Promise<void> {
    if (import.meta.env.DEV) console.warn('Delete local not supported')
  }
}
