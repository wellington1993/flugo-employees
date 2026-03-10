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
    
    // 🛡️ Defesa de Arquiteto: Optimistic Update para UX instantânea
    onMutate: async (newStaff) => {
      // Cancela queries em andamento para não sobrescrever o cache otimista
      await queryClient.cancelQueries({ queryKey: ['staffs'] })
      
      // Snapshot do cache atual para rollback em caso de erro
      const previousStaffs = queryClient.getQueryData<Staff[]>(['staffs'])

      // Atualiza o cache instantaneamente
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
    
    // Em caso de erro real (ex: timeout longo), restaura o cache anterior
    onError: (_err, _newStaff, context) => {
      if (context?.previousStaffs) {
        queryClient.setQueryData(['staffs'], context.previousStaffs)
      }
    },
    
    // Sempre invalida após finalizar para sincronizar com a "verdade" do servidor
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['staffs'] })
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
