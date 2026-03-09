import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'

const App = lazy(() => import('@/App'))
const StaffList = lazy(() => import('@/components/staff-list'))
const StaffForm = lazy(() => import('@/components/staff-form'))
const StaffEditPage = lazy(() => import('@/components/staff-edit-page'))
const DebugSync = lazy(() => import('@/components/debug-sync'))
const NotFound = lazy(() => import('@/components/not-found'))

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
            <Route path="/staffs/:id/edit" element={<StaffEditPage />} />
            <Route path="/debug-sync" element={<DebugSync />} />
            <Route index element={<Navigate to="/staffs" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
