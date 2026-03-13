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
  Alert,
  Snackbar,
  type TableCellProps,
} from '@mui/material'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import DeleteIcon from '@mui/icons-material/Delete'
import { Link } from 'react-router-dom'
import { useStaffs, useDepartments, useBulkDeleteStaff } from '@/features/staff/hooks'
import { useSortTable } from '@/hooks/use-sort-table'
import { getComparator } from '@/helpers/table-sorting'
import type { Staff } from '@/features/staff/types'
import { DeleteConfirmDialog } from './delete-confirm-dialog'

const columns: { id: keyof Staff | 'actions'; label: string; align?: TableCellProps['align'] }[] = [
  { id: 'name', label: 'Colaborador' },
  { id: 'email', label: 'E-mail', align: 'left' },
  { id: 'departmentId', label: 'Departamento', align: 'left' },
  { id: 'role', label: 'Cargo', align: 'left' },
  { id: 'status', label: 'Status', align: 'center' },
]

export function StaffList() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { data: staffs, isLoading, refetch } = useStaffs()
  const { data: departments } = useDepartments()
  const { mutateAsync: bulkDelete } = useBulkDeleteStaff()

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const { order, orderBy, createSortHandler } = useSortTable('name', setPage)
  
  const [selected, setSelected] = useState<string[]>([])
  const [filters, setFilters] = useState({ name: '', email: '', departmentId: '' })
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return
    setIsDeleting(true)
    try {
      await bulkDelete(selected)
      await refetch()
      setSelected([])
      setConfirmDelete(false)
      setFeedback({
        type: 'success',
        message: `${selected.length} colaborador(es) excluído(s) com sucesso.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao excluir colaboradores.'
      setFeedback({ type: 'error', message })
    } finally {
      setIsDeleting(false)
    }
  }

  const getDepartmentName = (id: string) => {
    return (departments || []).find(d => d.id === id)?.name || '-'
  }

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
        <Stack direction="row" spacing={2}>
          {selected.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmDelete(true)}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Excluir ({selected.length})
            </Button>
          )}
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
      </Stack>

      <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
           <TextField
            label="Filtrar por nome"
            size="small"
            value={filters.name}
            onChange={(e) => setFilters(f => ({ ...f, name: e.target.value }))}
            sx={{ minWidth: 200 }}
          />
          <TextField
            label="Filtrar por e-mail"
            size="small"
            value={filters.email}
            onChange={(e) => setFilters(f => ({ ...f, email: e.target.value }))}
            sx={{ minWidth: 200 }}
          />
          <TextField
            select
            label="Departamento"
            size="small"
            value={filters.departmentId}
            onChange={(e) => setFilters(f => ({ ...f, departmentId: e.target.value }))}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {(departments || []).map(d => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      <TableContainer 
        component={Paper} 
        elevation={0} 
        variant="outlined" 
        sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < paginated.length}
                  checked={paginated.length > 0 && selected.length === paginated.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align}
                  sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12, textTransform: 'uppercase' }}
                >
                  {col.id !== 'actions' ? (
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'asc'}
                      onClick={createSortHandler(col.id as keyof Staff)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading &&
              Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell padding="checkbox"><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
                  <TableCell><Skeleton variant="text" width={140} height={24} /></TableCell>
                  <TableCell><Skeleton variant="text" width={150} /></TableCell>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                  <TableCell align="center"><Skeleton variant="rounded" width={80} height={28} /></TableCell>
                </TableRow>
              ))}

            {!isLoading && paginated.map((row) => (
              <TableRow key={row.id} hover selected={selected.includes(row.id)}>
                <TableCell padding="checkbox">
                  <Checkbox checked={selected.includes(row.id)} onChange={() => handleSelectOne(row.id)} />
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}>
                      {(row.name || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </Avatar>
                    <Typography variant="subtitle2" fontWeight={700}>{row.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{getDepartmentName(row.departmentId)}</TableCell>
                <TableCell>{row.role}</TableCell>
                <TableCell align="center">
                  <Chip label={row.status === 'ACTIVE' ? 'Ativo' : 'Inativo'} color={row.status === 'ACTIVE' ? 'success' : 'default'} size="small" />
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
          onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </TableContainer>

      <DeleteConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteSelected}
        title="Excluir Colaboradores"
        description={`Tem certeza que deseja excluir ${selected.length} colaboradores selecionados?`}
        loading={isDeleting}
      />

      <Snackbar
        open={!!feedback}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? <Alert severity={feedback.type}>{feedback.message}</Alert> : <></>}
      </Snackbar>
    </Box>
  )
}

export default StaffList
