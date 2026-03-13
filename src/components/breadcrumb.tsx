import { Breadcrumbs, Link, Typography } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'

const routeNames: Record<string, string> = {
  staffs: 'Colaboradores',
  departments: 'Departamentos',
  new: 'Cadastrar Colaborador',
  edit: 'Editar',
}

export function Breadcrumb() {
  const location = useLocation()
  const navigate = useNavigate()
  const rawParts = location.pathname.split('/').filter(Boolean)
  const parts = rawParts.filter((part, index) => {
    const previous = rawParts[index - 1]
    const next = rawParts[index + 1]
    const isEntityIdInEditRoute = !!part && next === 'edit' && (previous === 'staffs' || previous === 'departments')
    return !isEntityIdInEditRoute
  })

  if (parts.length <= 1) return null

  return (
    <Breadcrumbs sx={{ mb: 3 }}>
      {parts.map((part, index) => {
        const isLast = index === parts.length - 1
        const path = '/' + parts.slice(0, index + 1).join('/')
        const previous = parts[index - 1]
        const label =
          part === 'new' && previous === 'departments'
            ? 'Cadastrar Departamento'
            : part === 'new' && previous === 'staffs'
              ? 'Cadastrar Colaborador'
              : part === 'edit' && previous === 'departments'
                ? 'Editar Departamento'
                : part === 'edit' && previous === 'staffs'
                  ? 'Editar Colaborador'
                  : routeNames[part] ?? part

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
