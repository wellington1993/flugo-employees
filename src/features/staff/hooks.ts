import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { staffService } from '@/services/staffs'
import { departmentService } from '@/services/departments'
import { type Staff } from './types'
import { type Department } from '../department/types'

export function useStaffs() {
  return useQuery({
    queryKey: ['staffs'],
    queryFn: () => staffService.getAll(),
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Department, 'id'>) => departmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => departmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })
}

type CreateStaffReturn = Awaited<ReturnType<typeof createStaff>>

export function useCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Staff, 'id'>) => staffService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffs'] })
    },
  })
}

export function useUpdateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Staff> }) => staffService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffs'] })
    },
  })
}

export function useDeleteStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => staffService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffs'] })
    },
  })
}

export function useBulkDeleteStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => staffService.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffs'] })
    },
  })
}

export function useSyncPending() {
  return {
    pendingCount: 0,
    sync: async () => {},
  }
}
