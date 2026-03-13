import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import { ProtectedRoute } from '@/components/protected-route'
import { safeLazy } from '@/helpers/lazy-load'

const App = safeLazy(() => import('@/App'))
const StaffList = safeLazy(() => import('@/components/staff-list'))
const StaffForm = safeLazy(() => import('@/components/staff-form'))
const DepartmentsPage = safeLazy(() => import('@/pages/departments'))
const DepartmentFormPage = safeLazy(() => import('@/pages/department-form-page'))
const NotFound = safeLazy(() => import('@/components/not-found'))
const Login = safeLazy(() => import('@/components/login'))

function Loading() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/404" element={<NotFound />} />
          <Route
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          >
            <Route path="/staffs" element={<StaffList />} />
            <Route path="/staffs/new" element={<StaffForm />} />
            <Route path="/staffs/:staffId/edit" element={<StaffForm />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/departments/new" element={<DepartmentFormPage />} />
            <Route path="/departments/:departmentId/edit" element={<DepartmentFormPage />} />
            <Route index element={<Navigate to="/staffs" replace />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
