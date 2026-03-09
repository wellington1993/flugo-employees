import { useParams, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useStaffs } from '@/features/staff/hooks'
import { StaffForm } from './staff-form'
import type { StaffSchema } from '@/features/staff/validation'

export function StaffEditPage() {
  const { id } = useParams<{ id: string }>()
  const { data: staffs, isLoading } = useStaffs()

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    )
  }

  const staff = staffs?.find((s) => s.id === id)

  if (!staff) return <Navigate to="/staffs" replace />

  const initialValues: StaffSchema = {
    name: staff.name,
    email: staff.email,
    department: staff.department,
    status: staff.status,
  }

  return <StaffForm staffId={staff.id} initialValues={initialValues} isEdit />
}

export default StaffEditPage
