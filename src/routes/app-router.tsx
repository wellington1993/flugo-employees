import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import { ProtectedRoute } from '@/components/protected-route'

// Imports estáticos para evitar problemas de resolução do Vite durante o dev
import DepartmentsPage from '@/pages/departments'

const App = lazy(() => import('@/App'))
const StaffList = lazy(() => import('@/components/staff-list'))
const StaffForm = lazy(() => import('@/components/staff-form'))
const NotFound = lazy(() => import('@/components/not-found'))
const Login = lazy(() => import('@/components/login'))

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
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/404" element={<NotFound />} />
          
          {/* Rotas Protegidas */}
          <Route
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          >
            <Route path="/staffs" element={<StaffList />} />
            <Route path="/staffs/new" element={<StaffForm />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            
            <Route index element={<Navigate to="/staffs" replace />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
          
          {/* Redirecionamento Padrão */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
