import { useEffect, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
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
  TextField,
  Tooltip,
  Typography,
  Skeleton,
  useMediaQuery,
  useTheme,
  type TableCellProps,
} from '@mui/material'
import SyncIcon from '@mui/icons-material/Sync'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import SearchIcon from '@mui/icons-material/Search'
import { visuallyHidden } from '@mui/utils'
import { Link } from 'react-router-dom'
import { useStaffs, useSyncPending, useDeleteStaff } from '@/features/staff/hooks'
import { useSortTable } from '@/hooks/use-sort-table'
import { getComparator } from '@/helpers/table-sorting'
import type { Staff, StaffDepartments, StaffStatus } from '@/features/staff/types'
import { departments } from '@/features/staff/validation'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'

const columns: { id: keyof Staff; label: string; align?: TableCellProps['align'] }[] = [
  { id: 'name', label: 'Nome' },
  { id: 'email', label: 'Email' },
  { id: 'department', label: 'Departamento' },
  { id: 'status', label: 'Status', align: 'center' },
]

const statusOptions: { value: StaffStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
]

const departmentOptions: { value: StaffDepartments | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  ...departments.map((d) => ({ value: d, label: d })),
]

export function StaffList() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { data: staffs, isLoading, isError } = useStaffs()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const { order, orderBy, createSortHandler } = useSortTable('name', setPage)
  const { pendingCount, sync } = useSyncPending()
  const { mutateAsync: deleteStaff, isPending: isDeleting } = useDeleteStaff()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StaffStatus | ''>('')
  const [filterDepartment, setFilterDepartment] = useState<StaffDepartments | ''>('')
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null)

  useEffect(() => {
    if (pendingCount > 0) sync()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = (staffs ?? []).filter((s) => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    const matchStatus = !filterStatus || s.status === filterStatus
    const matchDept = !filterDepartment || s.department === filterDepartment
    return matchSearch && matchStatus && matchDept
  })

  const sorted = filtered.slice().sort(getComparator(order, orderBy))
  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteStaff(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        mb={3}
        gap={2}
      >
        <Typography variant="h5" fontWeight={600}>
          Colaboradores
        </Typography>
        <Button
          variant="contained"
          component={Link}
          to="/staffs/new"
          startIcon={<PersonAddAlt1Icon />}
          fullWidth={isMobile}
        >
          Novo Colaborador
        </Button>
      </Stack>

      {/* Filters hidden to align with original challenge scope */}
      <Box sx={{ display: 'none' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} mb={2}>
          <TextField
            size="small"
            placeholder="Buscar por nome ou e-mail"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as StaffStatus | '')
              setPage(0)
            }}
            sx={{ minWidth: 130 }}
          >
            {statusOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Departamento"
            value={filterDepartment}
            onChange={(e) => {
              setFilterDepartment(e.target.value as StaffDepartments | '')
              setPage(0)
            }}
            sx={{ minWidth: 160 }}
          >
            {departmentOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Box>

      <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align}
                  sx={{
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
                    <Stack direction="row" alignItems="center" gap={1.5}>
                      <Skeleton variant="circular" width={36} height={36} />
                      <Skeleton variant="text" width={120} />
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Skeleton variant="text" width={180} />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Skeleton variant="text" width={100} />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton variant="rounded" width={80} height={24} />
                  </TableCell>
                </TableRow>
              ))}
            {isError && (
              <TableRow>
                <TableCell colSpan={isMobile ? 2 : 4} align="center" sx={{ py: 4, color: 'error.main' }}>
                  Não foi possível carregar os colaboradores. Verifique sua conexão e tente novamente.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && !filtered.length && (
              <TableRow>
                <TableCell colSpan={isMobile ? 2 : 4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  {staffs?.length
                    ? 'Nenhum resultado para os filtros aplicados.'
                    : 'Nenhum colaborador cadastrado ainda.'}
                </TableCell>
              </TableRow>
            )}
            {paginated.map((row) => (
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
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
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
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{row.email}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{row.department}</TableCell>
                <TableCell align="center">
                  {row._pendingSync ? (
                    <Tooltip title="Salvo localmente, aguardando sincronização com o banco de dados">
                      <Chip
                        icon={<SyncIcon sx={{ fontSize: 14 }} />}
                        label="Pendente"
                        color="warning"
                        size="small"
                        variant="outlined"
                      />
                    </Tooltip>
                  ) : (
                    <Chip
                      label={row.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                      color={row.status === 'ACTIVE' ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
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
          labelRowsPerPage={isMobile ? '' : 'Por página:'}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </TableContainer>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        staffName={deleteTarget?.name ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </Box>
  )
}

export default StaffList
