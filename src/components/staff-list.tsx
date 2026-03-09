import { useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
  type TableCellProps,
} from '@mui/material'
import { visuallyHidden } from '@mui/utils'
import { Link } from 'react-router-dom'
import { useStaffs } from '@/features/staff/hooks'
import { useSortTable } from '@/hooks/use-sort-table'
import { getComparator } from '@/helpers/table-sorting'
import type { Staff } from '@/features/staff/types'

const columns: { id: keyof Staff; label: string; align?: TableCellProps['align'] }[] = [
  { id: 'name', label: 'Nome' },
  { id: 'email', label: 'Email' },
  { id: 'department', label: 'Departamento' },
  { id: 'status', label: 'Status', align: 'right' },
]

export function StaffList() {
  const { data: staffs, isLoading, isError } = useStaffs()
  const { order, orderBy, createSortHandler } = useSortTable('name')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const sorted = staffs?.slice().sort(getComparator(order, orderBy)) ?? []
  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Colaboradores
        </Typography>
        <Button variant="contained" component={Link} to="/staffs/new" size="large">
          Novo Colaborador
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={0} variant="outlined">
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              {columns.map((col) => (
                <TableCell key={col.id} align={col.align}>
                  <TableSortLabel
                    active={orderBy === col.id}
                    direction={orderBy === col.id ? order : 'asc'}
                    onClick={createSortHandler(col.id)}
                  >
                    {col.label}
                    {orderBy === col.id && (
                      <Box component="span" sx={visuallyHidden}>
                        {order === 'desc' ? 'decrescente' : 'crescente'}
                      </Box>
                    )}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={20} />
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'error.main' }}>
                  Não foi possível carregar os colaboradores. Verifique sua conexão e tente novamente.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && !staffs?.length && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Nenhum colaborador cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
            {staffs?.length ? paginated.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" gap={1.5}>
                      <Avatar sx={{ width: 36, height: 36, fontSize: 14, bgcolor: 'primary.light' }}>
                        {row.name
                          .split(' ')
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join('')
                          .toUpperCase()}
                      </Avatar>
                      {row.name}
                    </Stack>
                  </TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.department}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={row.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                      color={row.status === 'ACTIVE' ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              )) : null}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={sorted.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </TableContainer>
    </Box>
  )
}

export default StaffList
