import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/libs/tanstack-query'
import { createStaff, listStaffs } from '@/services/staffs'
import { getPendingStaffs } from '@/services/local-storage'
import type { StaffSchema } from './validation'

export function useStaffs() {
  return useQuery({
    queryKey: ['staffs'],
    queryFn: listStaffs,
  })
}

export function useCreateStaff() {
  return useMutation({
    mutationFn: (data: StaffSchema) => createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffs'] })
    },
  })
}

export function useSyncPending() {
  const pendingCount = getPendingStaffs().length

  const sync = async () => {
    const pending = getPendingStaffs()
    if (!pending.length) return

    for (const staff of pending) {
      try {
        const { _localId, _pendingSync, id, ...data } = staff
        await createStaff(data as StaffSchema)
      } catch {
        // ignore individual failures — will retry next time
      }
    }

    queryClient.invalidateQueries({ queryKey: ['staffs'] })
  }

  return { pendingCount, sync }
}
