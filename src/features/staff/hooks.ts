import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/libs/tanstack-query'
import { createStaff, listStaffs, pushStaffToFirebase } from '@/services/staffs'
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
    onMutate: async (newStaff) => {
      // Cancelar refetches em andamento para não sobrescrever o update otimista
      await queryClient.cancelQueries({ queryKey: ['staffs'] })

      // Snapshot do valor anterior para rollback em caso de erro
      const previousStaffs = queryClient.getQueryData(['staffs'])

      // Update otimista do cache
      queryClient.setQueryData(['staffs'], (old: any) => {
        const optimisticEntry = {
          id: `temp-${Date.now()}`,
          ...newStaff,
          _pendingSync: true, // Mostra como pendente até confirmar
        }
        return old ? [optimisticEntry, ...old] : [optimisticEntry]
      })

      return { previousStaffs }
    },
    onError: (_err, _newStaff, context) => {
      // Rollback para o estado anterior em caso de falha
      queryClient.setQueryData(['staffs'], context?.previousStaffs)
    },
    onSettled: () => {
      // Sincronizar com o servidor no final (sucesso ou erro)
      queryClient.invalidateQueries({ queryKey: ['staffs'] })
    },
  })
}

export function useSyncPending() {
  const pendingCount = getPendingStaffs().length

  const sync = async () => {
    const pending = getPendingStaffs()
    if (!pending.length) return

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
