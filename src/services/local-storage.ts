import type { Staff } from '@/features/staff/types'
import type { StaffSchema } from '@/features/staff/validation'

const LS_KEY = 'flugo_pending_staffs'

function shortId() {
  return Math.random().toString(36).slice(2, 9)
}

export function getPendingStaffs(): Staff[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    const all: Staff[] = raw ? JSON.parse(raw) : []
    const seen = new Set<string>()
    return all.filter(s => {
      if (!s.email) return false
      if (seen.has(s.email)) return false
      seen.add(s.email)
      return true
    })
  } catch {
    return []
  }
}

export function addPendingStaff(data: StaffSchema): Staff {
  const pending = getPendingStaffs().filter(s => s.email !== data.email)
  const localId = `local_${shortId()}`
  const staff: Staff = {
    ...data,
    id: localId,
    _localId: localId,
    _pendingSync: true,
    createdAt: Date.now(),
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
