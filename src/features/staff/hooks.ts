import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createStaff, listStaffs, pushStaffToFirebase, updateStaff, deleteStaff } from '@/services/staffs'
import type { StaffSchema } from './validation'
import type { Staff } from './types'
import { useEffect, useRef } from 'react'
import { useConnectivity } from '@/hooks/use-connectivity'

export function useStaffs() {
  return useQuery({
    queryKey: ['staffs'],
    queryFn: listStaffs,
  })
}

type CreateStaffReturn = Awaited<ReturnType<typeof createStaff>>

export function useCreateStaff() {
  const queryClient = useQueryClient()
  
  return useMutation<
    CreateStaffReturn,
    Error,
    StaffSchema,
    { previousStaffs: Staff[] | undefined }
  >({
    mutationFn: (data: StaffSchema) => createStaff(data),
    onMutate: async (newStaff) => {
      await queryClient.cancelQueries({ queryKey: ['staffs'] })
      const previousStaffs = queryClient.getQueryData<Staff[]>(['staffs'])

      queryClient.setQueryData(['staffs'], (old: Staff[] = []) => {
        const optimisticEntry: Staff = { ...newStaff, id: `temp-${Date.now()}`, _localId: `temp-${Date.now()}`, _pendingSync: true, createdAt: Date.now() }
        return [optimisticEntry, ...old]
      })

      return { previousStaffs }
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['staffs'], (old: Staff[] = []) => {
        const withoutTemp = old.filter(s => !s.id.startsWith('temp-'))
        const final = [result.staff, ...withoutTemp.filter(s => s.id !== result.staff.id)]
        return final
      })
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
  const isOnline = useConnectivity()
  const { data: staffs } = useStaffs()
  const pendingCount = staffs?.filter(s => s._pendingSync).length ?? 0
  const syncingRef = useRef(false)

  const sync = async () => {
    if (syncingRef.current) return
    const pending = staffs?.filter(s => s._pendingSync)
    if (!pending || pending.length === 0) return
    
    syncingRef.current = true
    let anySynced = false
    let hasError = false

    try {
      for (const staff of pending) {
        const ok = await pushStaffToFirebase(staff)
        if (ok) {
          anySynced = true
        } else {
          hasError = true
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Erro crítico na sincronização:', err)
      hasError = true
    } finally {
      syncingRef.current = false
    }

    if (anySynced) {
      queryClient.invalidateQueries({ queryKey: ['staffs'] })
    }

    return { anySynced, hasError }
  }

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      sync()
    }
  }, [isOnline, pendingCount])

  return { pendingCount, sync }
}
