import { Breadcrumbs, Link, Typography } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'

const routeNames: Record<string, string> = {
  staffs: 'Colaboradores',
  new: 'Cadastrar Colaborador',
}

export function Breadcrumb() {
  const location = useLocation()
  const navigate = useNavigate()
  const parts = location.pathname.split('/').filter(Boolean)

  if (parts.length <= 1) return null

  return (
    <Breadcrumbs sx={{ mb: 3 }}>
      {parts.map((part, index) => {
        const isLast = index === parts.length - 1
        const path = '/' + parts.slice(0, index + 1).join('/')
        const label = routeNames[part] ?? part

        if (isLast) {
          return (
            <Typography key={path} color="text.primary" fontSize={14}>
              {label}
            </Typography>
          )
        }

        return (
          <Link
            key={path}
            underline="hover"
            color="inherit"
            fontSize={14}
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate(path)}
          >
            {label}
          </Link>
        )
      })}
    </Breadcrumbs>
  )
}
