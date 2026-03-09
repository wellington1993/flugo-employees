import { collection, addDoc, getDocs } from 'firebase/firestore'
import { db } from '@/libs/firebase'
import type { Staff } from '@/features/staff/types'
import type { StaffSchema } from '@/features/staff/validation'

const staffsCollection = collection(db, 'staffs')

export async function listStaffs(): Promise<Staff[]> {
  const snapshot = await getDocs(staffsCollection)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff))
}

export async function createStaff(data: StaffSchema): Promise<void> {
  await addDoc(staffsCollection, data)
}
