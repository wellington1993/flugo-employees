import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'

const App = lazy(() => import('@/App'))
const StaffList = lazy(() => import('@/components/staff-list'))
const StaffForm = lazy(() => import('@/components/staff-form'))

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
          <Route element={<App />}>
            <Route path="/staffs" element={<StaffList />} />
            <Route path="/staffs/new" element={<StaffForm />} />
            <Route path="*" element={<Navigate to="/staffs" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
