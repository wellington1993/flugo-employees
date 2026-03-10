import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createStaff, listStaffs, pushStaffToFirebase, updateStaff, deleteStaff } from '@/services/staffs'
import { getPendingStaffs } from '@/services/local-storage'
import type { StaffSchema } from './validation'
import type { Staff } from './types'

export function useStaffs() {
  return useQuery({
    queryKey: ['staffs'],
    queryFn: listStaffs,
  })
}

export function useCreateStaff() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: StaffSchema) => createStaff(data),
    onMutate: async (newStaff) => {
      await queryClient.cancelQueries({ queryKey: ['staffs'] })
      const previousStaffs = queryClient.getQueryData<Staff[]>(['staffs'])

      queryClient.setQueryData(['staffs'], (old: Staff[] | undefined) => {
        const optimisticEntry: Staff = {
          ...newStaff,
          id: `temp-${Date.now()}`,
          _localId: `temp-${Date.now()}`,
          _pendingSync: true,
          createdAt: Date.now()
        }
        return old ? [optimisticEntry, ...old] : [optimisticEntry]
      })

      return { previousStaffs }
    },
    onSuccess: (result, newStaff) => {
      if (result.synced) {
        // Online: Firebase é a fonte da verdade, busca os dados reais
        queryClient.invalidateQueries({ queryKey: ['staffs'] })
      } else {
        // Offline: substitui a entrada temporária pelo registro real do localStorage
        // sem disparar um refetch (Firebase está indisponível)
        const pendingEntry = getPendingStaffs().find(s => s.email === newStaff.email)
        if (pendingEntry) {
          queryClient.setQueryData(['staffs'], (old: Staff[] | undefined) => {
            const withoutTemp = (old || []).filter(s => !s.id.startsWith('temp-'))
            return [pendingEntry, ...withoutTemp]
          })
        }
      }
    },
    onError: (_err, _newStaff, context) => {
      if (context?.previousStaffs) {
        queryClient.setQueryData(['staffs'], context.previousStaffs)
      }
    },
  })
}

export function useUpdateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StaffSchema }) => updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffs'] })
    },
  })
}

export function useDeleteStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffs'] })
    },
  })
}

export function useSyncPending() {
  const queryClient = useQueryClient()
  const pending = getPendingStaffs()
  const pendingCount = pending.length

  const sync = async () => {
    if (pendingCount === 0) return
    let anySynced = false

    for (const staff of pending) {
      const ok = await pushStaffToFirebase(staff)
      if (ok) anySynced = true
    }

    if (anySynced) {
      queryClient.invalidateQueries({ queryKey: ['staffs'] })
    }
  }

  return { pendingCount, sync }
}
