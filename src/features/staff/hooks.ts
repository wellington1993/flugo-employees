import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { container } from '@/infrastructure/container'
import { type Staff } from '@/domain/entities/staff'
import { type Department } from '@/domain/entities/department'
import { isFailure } from '@/core/functional/result'
import { OfflineQueue } from '@/infrastructure/persistence/offline-queue'

export function useStaffs() {
  return useQuery({
    queryKey: ['staffs'],
    queryFn: async () => {
      const result = await container.staffRepository.getAll()
      if (isFailure(result)) throw result.error
      return result.value
    },
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const result = await container.departmentRepository.getAll()
      if (isFailure(result)) throw result.error
      return result.value
    },
    refetchOnMount: 'always',
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Department, 'id'>) => {
      const result = await container.departmentRepository.create(data)
      if (isFailure(result)) throw result.error
      return result.value
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['departments'] }),
        queryClient.invalidateQueries({ queryKey: ['staffs'] }),
      ])
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['departments'], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['staffs'], type: 'active' }),
      ])
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await container.departmentRepository.delete(id)
      if (isFailure(result)) throw result.error
      return result.value
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['departments'] }),
        queryClient.invalidateQueries({ queryKey: ['staffs'] }),
      ])
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['departments'], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['staffs'], type: 'active' }),
      ])
    },
  })
}

export function useCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Staff, 'id'>) => {
      const result = await container.createStaffUseCase.execute(data)
      if (isFailure(result)) throw result.error
      return result.value
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staffs'] }),
        queryClient.invalidateQueries({ queryKey: ['departments'] }),
      ])
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['staffs'], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['departments'], type: 'active' }),
      ])
    },
  })
}

export function useUpdateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Staff> }) => {
      const result = await container.updateStaffUseCase.execute(id, data)
      if (isFailure(result)) throw result.error
      return result.value
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staffs'] }),
        queryClient.invalidateQueries({ queryKey: ['departments'] }),
      ])
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['staffs'], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['departments'], type: 'active' }),
      ])
    },
  })
}

export function useDeleteStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await container.staffRepository.delete(id)
      if (isFailure(result)) throw result.error
      return result.value
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staffs'] }),
        queryClient.invalidateQueries({ queryKey: ['departments'] }),
      ])
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['staffs'], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['departments'], type: 'active' }),
      ])
    },
  })
}

export function useBulkDeleteStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const result = await container.staffRepository.bulkDelete(ids)
      if (isFailure(result)) throw result.error
      return result.value
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staffs'] }),
        queryClient.invalidateQueries({ queryKey: ['departments'] }),
      ])
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['staffs'], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['departments'], type: 'active' }),
      ])
    },
  })
}

export function useSyncPending() {
  const [pendingCount, setPendingCount] = useState(0)
  const queryClient = useQueryClient()

  const sync = async () => {
    const result = await container.syncOfflineDataUseCase.execute()
    if (!isFailure(result)) {
      if (result.value.processed > 0) {
        queryClient.invalidateQueries()
      }
      const pending = await OfflineQueue.getAll()
      setPendingCount(pending.length)
    }
  }

  useEffect(() => {
    const updateCount = async () => {
      const pending = await OfflineQueue.getAll()
      setPendingCount(pending.length)
    }
    updateCount()

    window.addEventListener('online', sync)
    return () => window.removeEventListener('online', sync)
  }, [])

  return {
    pendingCount,
    sync,
  }
}
