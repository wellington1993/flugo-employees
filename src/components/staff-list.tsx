import { useState, useMemo } from 'react'
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
  Typography,
  Skeleton,
  useMediaQuery,
  useTheme,
  Checkbox,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import DeleteIcon from '@mui/icons-material/Delete'
import { Link } from 'react-router-dom'
import { useStaffs, useDepartments, useBulkDeleteStaff } from '@/features/staff/hooks'
import { useSortTable } from '@/hooks/use-sort-table'
import { getComparator } from '@/helpers/table-sorting'
import { DeleteConfirmDialog } from './delete-confirm-dialog'

const columns = [
  { id: 'name', label: 'Colaborador' },
  { id: 'email', label: 'E-mail', align: 'left' },
  { id: 'departmentId', label: 'Departamento', align: 'left' },
  { id: 'role', label: 'Cargo', align: 'left' },
  { id: 'status', label: 'Status', align: 'center' },
]

export function StaffList() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { data: staffs, isLoading, isError } = useStaffs()
  const { data: departments } = useDepartments()
  const { mutateAsync: bulkDelete } = useBulkDeleteStaff()

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const { order, orderBy, createSortHandler } = useSortTable('name', setPage)
  
  const [selected, setSelected] = useState<string[]>([])
  const [filters, setFilters] = useState({ name: '', email: '', departmentId: '' })
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const filteredStaffs = useMemo(() => {
    return (staffs ?? []).filter(s => {
      const matchName = (s.name || '').toLowerCase().includes(filters.name.toLowerCase())
      const matchEmail = (s.email || '').toLowerCase().includes(filters.email.toLowerCase())
      const matchDept = !filters.departmentId || s.departmentId === filters.departmentId
      return matchName && matchEmail && matchDept
    })
  }, [staffs, filters])

  const sorted = useMemo(() => {
    return filteredStaffs.slice().sort(getComparator(order, orderBy))
  }, [filteredStaffs, order, orderBy])

  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(paginated.map(n => n.id))
      return
    }
    setSelected([])
  }

  const handleSelectOne = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleDeleteSelected = async () => {
    setIsDeleting(true)
    try {
      await bulkDelete(selected)
      setToast({ message: `${selected.length} colaboradores excluídos com sucesso.`, severity: 'success' })
      setSelected([])
      setConfirmDelete(false)
    } catch (e) {
      setToast({ message: 'Erro ao excluir colaboradores.', severity: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  const getDepartmentName = (id: string) => {
    return (departments || []).find(d => d.id === id)?.name || '-'
  }

  if (isError) {
    return <Box p={4} textAlign="center"><Typography color="error">Não conseguimos carregar a lista de colaboradores.</Typography></Box>
  }

  return (
    <Box sx={{ p: isMobile ? 1 : 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" mb={4} gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Colaboradores</Typography>
          <Typography variant="body2" color="text.secondary">Gerencie a equipe da sua empresa.</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          {selected.length > 0 && (
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDelete(true)}>
              Excluir ({selected.length})
            </Button>
          )}
          <Button variant="contained" component={Link} to="/staffs/new" startIcon={<PersonAddAlt1Icon />}>
            Novo Colaborador
          </Button>
        </Stack>
      </Stack>

      <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
           <TextField label="Filtrar por nome" size="small" value={filters.name} onChange={(e) => setFilters(f => ({ ...f, name: e.target.value }))} />
           <TextField label="Filtrar por e-mail" size="small" value={filters.email} onChange={(e) => setFilters(f => ({ ...f, email: e.target.value }))} />
           <TextField select label="Departamento" size="small" value={filters.departmentId} onChange={(e) => setFilters(f => ({ ...f, departmentId: e.target.value }))}>
            <MenuItem value="">Todos</MenuItem>
            {(departments || []).map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </TextField>
        </Box>
      </Paper>

      <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 3 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell padding="checkbox">
                <Checkbox indeterminate={selected.length > 0 && selected.length < paginated.length} checked={paginated.length > 0 && selected.length === paginated.length} onChange={handleSelectAll} />
              </TableCell>
              {columns.map((col) => (
                <TableCell key={col.id} align={col.align as any} sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>
                  {col.id !== 'actions' ? (
                    <TableSortLabel active={orderBy === col.id} direction={orderBy === col.id ? order : 'asc'} onClick={createSortHandler(col.id as any)}>
                      {col.label}
                    </TableSortLabel>
                  ) : col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? Array.from(new Array(5)).map((_, i) => (
              <TableRow key={i}>
                <TableCell padding="checkbox"><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
                {Array.from(new Array(5)).map((__, j) => <TableCell key={j}><Skeleton variant="text" /></TableCell>)}
              </TableRow>
            )) : paginated.map((row) => (
              <TableRow key={row.id} hover selected={selected.includes(row.id)}>
                <TableCell padding="checkbox"><Checkbox checked={selected.includes(row.id)} onChange={() => handleSelectOne(row.id)} /></TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                      {(row.name || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </Avatar>
                    <Typography variant="subtitle2" fontWeight={700}>{row.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{getDepartmentName(row.departmentId)}</TableCell>
                <TableCell>{row.role}</TableCell>
                <TableCell align="center"><Chip label={row.status === 'ACTIVE' ? 'Ativo' : 'Inativo'} color={row.status === 'ACTIVE' ? 'success' : 'default'} size="small" /></TableCell>
              </TableRow>
            ))}
            {!isLoading && paginated.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" sx={{ py: 4 }}>Nenhum colaborador encontrado.</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" count={sorted.length} page={page} rowsPerPage={rowsPerPage} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))} />
      </TableContainer>

      <DeleteConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDeleteSelected} title="Excluir Colaboradores" description={`Tem certeza que deseja excluir ${selected.length} colaboradores?`} loading={isDeleting} />
      
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.severity} onClose={() => setToast(null)} variant="filled" sx={{ width: '100%' }}>{toast?.message}</Alert>
      </Snackbar>
    </Box>
  )
}

export default StaffList
