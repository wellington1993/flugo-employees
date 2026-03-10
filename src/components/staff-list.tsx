import { useEffect, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
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
  Tooltip,
  Typography,
  Skeleton,
  useMediaQuery,
  useTheme,
  type TableCellProps,
} from '@mui/material'
import SyncIcon from '@mui/icons-material/Sync'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import { visuallyHidden } from '@mui/utils'
import { Link } from 'react-router-dom'
import { useStaffs, useSyncPending } from '@/features/staff/hooks'
import { useSortTable } from '@/hooks/use-sort-table'
import { getComparator } from '@/helpers/table-sorting'
import type { Staff } from '@/features/staff/types'

const columns: { id: keyof Staff; label: string; align?: TableCellProps['align'] }[] = [
  { id: 'name', label: 'Colaborador' },
  { id: 'email', label: 'E-mail', align: 'left' },
  { id: 'department', label: 'Departamento', align: 'left' },
  { id: 'status', label: 'Status', align: 'center' },
]

export function StaffList() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { data: staffs, isLoading, isError } = useStaffs()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const { order, orderBy, createSortHandler } = useSortTable('name', setPage)
  const { pendingCount, sync } = useSyncPending()

  useEffect(() => {
    if (pendingCount > 0) {
      sync().catch(console.error)
    }
  }, [pendingCount, sync])

  const sorted = (staffs ?? []).slice().sort(getComparator(order, orderBy))
  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Box sx={{ p: isMobile ? 1 : 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        mb={4}
        gap={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            Colaboradores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie e visualize a equipe da sua empresa.
          </Typography>
        </Box>
        <Button
          variant="contained"
          component={Link}
          to="/staffs/new"
          startIcon={<PersonAddAlt1Icon />}
          sx={{ 
            px: 3, 
            py: 1.2, 
            borderRadius: 2, 
            fontWeight: 600, 
            boxShadow: 0,
            '&:hover': { boxShadow: theme.shadows[2] }
          }}
          fullWidth={isMobile}
        >
          Novo Colaborador
        </Button>
      </Stack>

      <TableContainer 
        component={Paper} 
        elevation={0} 
        variant="outlined" 
        sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align}
                  sx={{
                    fontWeight: 700,
                    color: 'text.secondary',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display:
                      col.id === 'email' || col.id === 'department'
                        ? { xs: 'none', md: 'table-cell' }
                        : 'table-cell',
                  }}
                >
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
            {isLoading &&
              Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Stack direction="row" alignItems="center" gap={2}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Skeleton variant="text" width={140} height={24} />
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Skeleton variant="text" width={200} />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Skeleton variant="text" width={100} />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton variant="rounded" width={80} height={28} />
                  </TableCell>
                </TableRow>
              ))}

            {isError && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="error" fontWeight={500}>
                    Ops! Não conseguimos carregar a lista.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verifique sua conexão e tente atualizar a página.
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && !sorted.length && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                  <Typography variant="h6" color="text.secondary" fontWeight={500}>
                    Nenhum colaborador encontrado.
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Clique em "Novo Colaborador" para começar.
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {paginated.map((row) => (
              <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>
                  <Stack direction="row" alignItems="center" gap={2}>
                    <Avatar 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        fontSize: 15, 
                        fontWeight: 700,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText'
                      }}
                    >
                      {row.name
                        .split(' ')
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        {row.name}
                      </Typography>
                      {isMobile && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {row.email}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: 'text.secondary' }}>
                  {row.email}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: 'text.secondary' }}>
                  {row.department}
                </TableCell>
                <TableCell align="center">
                  {row._pendingSync ? (
                    <Tooltip title="Salvo localmente, aguardando conexão">
                      <Chip
                        icon={<SyncIcon sx={{ fontSize: 14 }} />}
                        label="Sincronizando"
                        color="warning"
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, borderStyle: 'dashed' }}
                      />
                    </Tooltip>
                  ) : (
                    <Chip
                      label={row.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                      color={row.status === 'ACTIVE' ? 'success' : 'default'}
                      size="small"
                      variant="filled"
                      sx={{ 
                        fontWeight: 700, 
                        fontSize: 11,
                        bgcolor: row.status === 'ACTIVE' ? 'success.light' : 'grey.100',
                        color: row.status === 'ACTIVE' ? 'success.dark' : 'grey.600'
                      }}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <TablePagination
          component="div"
          count={sorted.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage={isMobile ? '' : 'Linhas por página:'}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </TableContainer>
    </Box>
  )
}

export default StaffList
