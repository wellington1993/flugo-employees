import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/libs/tanstack-query'
import { createStaff, listStaffs } from '@/services/staffs'
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
