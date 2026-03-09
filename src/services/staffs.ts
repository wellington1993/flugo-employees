import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/libs/firebase'
import type { Staff } from '@/features/staff/types'
import type { StaffSchema } from '@/features/staff/validation'

const staffsCollection = collection(db, 'staffs')

export async function listStaffs(): Promise<Staff[]> {
  const snapshot = await getDocs(staffsCollection)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff))
}

export async function createStaff(data: StaffSchema): Promise<void> {
  const duplicate = await getDocs(query(staffsCollection, where('email', '==', data.email)))
  if (!duplicate.empty) {
    throw new Error('Já existe um colaborador cadastrado com esse e-mail.')
  }
  await addDoc(staffsCollection, data)
}
