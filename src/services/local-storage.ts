import type { Staff } from '@/features/staff/types'
import type { StaffSchema } from '@/features/staff/validation'

const LS_KEY = 'flugo_pending_staffs'

function shortId() {
  return Math.random().toString(36).slice(2, 9)
}

export function getPendingStaffs(): Staff[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addPendingStaff(data: StaffSchema): Staff {
  const pending = getPendingStaffs()
  const staff: Staff = {
    ...data,
    id: `local_${shortId()}`,
    _localId: `local_${shortId()}`,
    _pendingSync: true,
  }
  localStorage.setItem(LS_KEY, JSON.stringify([...pending, staff]))
  return staff
}

export function removePendingStaff(localId: string) {
  const pending = getPendingStaffs()
  localStorage.setItem(LS_KEY, JSON.stringify(pending.filter((s) => s._localId !== localId)))
}

export function removePendingByEmail(email: string) {
  const pending = getPendingStaffs()
  localStorage.setItem(LS_KEY, JSON.stringify(pending.filter((s) => s.email !== email)))
}
