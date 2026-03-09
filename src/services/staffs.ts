import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/libs/firebase'
import type { Staff } from '@/features/staff/types'
import type { StaffSchema } from '@/features/staff/validation'

const staffsCollection = collection(db, 'staffs')

function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Não foi possível conectar ao banco de dados. Verifique sua conexão.')), ms)
  )
  return Promise.race([promise, timeout])
}

export async function listStaffs(): Promise<Staff[]> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase não configurado. Adicione as variáveis de ambiente.')
  }
  const snapshot = await withTimeout(getDocs(staffsCollection))
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff))
}

export async function createStaff(data: StaffSchema): Promise<void> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase não configurado. Adicione as variáveis de ambiente.')
  }
  const duplicate = await withTimeout(getDocs(query(staffsCollection, where('email', '==', data.email))))
  if (!duplicate.empty) {
    throw new Error('Já existe um colaborador cadastrado com esse e-mail.')
  }
  await withTimeout(addDoc(staffsCollection, data))
}
