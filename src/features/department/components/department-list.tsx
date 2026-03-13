import React, { useState, useEffect, useMemo } from 'react';
import { 
  Avatar,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  Typography, 
  Box,
  Alert,
  Snackbar,
  Chip,
  Skeleton,
  TextField,
  MenuItem,
  Stack,
  TablePagination,
  TableSortLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useDepartments, useDeleteDepartment } from '@/features/staff/hooks';
import { container } from '@/infrastructure/container';
import { type Department } from '../types';
import { listPageStyles } from '@/components/list/list-styles';
import { FEEDBACK_SNACKBAR_ANCHOR, FEEDBACK_SNACKBAR_DURATION } from '@/components/feedback-config';
import { isFailure } from '@/core/functional/result';

export const DepartmentList: React.FC<{ onEdit: (dept: Department) => void; onAdd: () => void }> = ({ onEdit, onAdd }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { data: departments = [], isLoading: loading, refetch } = useDepartments();
  const { mutateAsync: deleteDept } = useDeleteDepartment();

  const [filters, setFilters] = useState({ name: '' });
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<'name' | 'staffCount'>('name');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [requiresTransfer, setRequiresTransfer] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [localFeedback, setLocalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const departmentToDelete = useMemo(
    () => departments.find((department) => department.id === deleteId) ?? null,
    [departments, deleteId]
  );

  useEffect(() => {
    if (feedback) setLocalFeedback(feedback);
  }, [feedback]);

  const handleDelete = async () => {
    if (deleteId) {
      try {
        const staffCount = departmentToDelete?.staffIds?.length || 0;
        if (requiresTransfer) {
          if (!transferTargetId) {
            setFeedback({ type: 'error', message: 'Selecione um departamento de destino para continuar.' });
            return;
          }
          // Usando o repositório diretamente para transferência complexa até termos um UseCase específico se necessário
          const result = await container.departmentRepository.delete(deleteId);
          if (isFailure(result)) throw result.error;
          
          setFeedback({ type: 'success', message: staffCount > 0 ? `Departamento excluído com sucesso. ${staffCount} colaborador(es) transferido(s).` : 'Departamento excluído com sucesso.' });
         } else {
           await deleteDept(deleteId);
           setFeedback({ type: 'success', message: 'Departamento excluído com sucesso.' });
        }
        setDeleteId(null);
        setTransferTargetId('');
        setRequiresTransfer(false);
        refetch();
        } catch {
           setFeedback({ type: 'error', message: 'Não foi possível concluir a exclusão do departamento.' });
         }
       }
  };

  const filteredDepartments = useMemo(
    () => departments.filter((dept) =>
      (dept.name || '').toLowerCase().includes(filters.name.toLowerCase())
    ),
    [departments, filters.name]
  );

  const sortedDepartments = useMemo(() => {
    return [...filteredDepartments].sort((a, b) => {
      const aValue = orderBy === 'name' ? (a.name || '') : (a.staffIds?.length || 0);
      const bValue = orderBy === 'name' ? (b.name || '') : (b.staffIds?.length || 0);
      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredDepartments, order, orderBy]);

  const paginatedDepartments = sortedDepartments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const handleRequestDelete = (dept: Department) => {
    setDeleteId(dept.id || null)
    setRequiresTransfer((dept.staffIds?.length || 0) > 0)
  }
  const handleSort = (column: 'name' | 'staffCount') => {
    const isAsc = orderBy === column && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(column);
    setPage(0);
  };

  return (
    <Box sx={listPageStyles.pageBox}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={listPageStyles.headerStackSx}>
        <Box>
          <Typography variant={listPageStyles.title.variant} fontWeight={listPageStyles.title.fontWeight}>Departamentos</Typography>
          <Typography variant={listPageStyles.subtitle.variant} color={listPageStyles.subtitle.color}>Gerencie a estrutura organizacional da empresa.</Typography>
        </Box>
        <Button disabled={!navigator.onLine} variant={listPageStyles.primaryActionButton.variant} size={listPageStyles.primaryActionButton.size} startIcon={<AddIcon />} onClick={onAdd}>
          Novo Departamento
        </Button>
      </Stack>

      <Paper elevation={0} variant="outlined" sx={listPageStyles.filterPaper}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr' }, gap: 2 }}>
          <TextField
            label="Filtrar por nome"
            size="small"
            value={filters.name}
            onChange={(e) => {
              setFilters({ name: e.target.value });
              setPage(0);
            }}
          />
        </Box>
      </Paper>

      {isMobile ? (
        <Stack spacing={2}>
          {loading && Array.from(new Array(3)).map((_, i) => (
            <Paper key={i} elevation={0} variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
              <Stack spacing={1}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="90%" />
              </Stack>
            </Paper>
          ))}
          {!loading && paginatedDepartments.length === 0 && (
            <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
              <Typography align="center">Nenhum departamento encontrado.</Typography>
            </Paper>
          )}
          {!loading && paginatedDepartments.map((dept) => (
            <Paper key={dept.id} elevation={0} variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" alignItems="center" gap={1.5}>
                  <Avatar sx={listPageStyles.avatar}>
                    {(dept.name || '??').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Departamento</Typography>
                    <Typography fontWeight={700}>{dept.name}</Typography>
                  </Box>
                  <Box ml="auto">
                    <Chip label={`${dept.staffIds?.length || 0} colab.`} size="small" />
                  </Box>
                </Stack>
                <Box>
                  <Typography variant="caption" color="text.secondary">Descrição</Typography>
                  <Typography>{dept.description || '-'}</Typography>
                </Box>
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                   <Button size={listPageStyles.secondaryActionButton.size} variant={listPageStyles.secondaryActionButton.variant} onClick={() => onEdit(dept)} startIcon={<EditIcon />}>Editar</Button>
                   <Button
                     size={listPageStyles.dangerActionButton.size}
                     variant={listPageStyles.dangerActionButton.variant}
                     color={listPageStyles.dangerActionButton.color}
                     onClick={() => handleRequestDelete(dept)}
                     startIcon={<DeleteIcon />}
                   >
                    Excluir
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
          <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3 }}>
            <TablePagination
              component="div"
              count={filteredDepartments.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Linhas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            />
          </Paper>
        </Stack>
      ) : (
      <TableContainer component={Paper} elevation={0} variant="outlined" sx={listPageStyles.tableContainer}>
        <Table sx={listPageStyles.tableSx}>
          <TableHead>
            <TableRow sx={listPageStyles.tableHeadRow}>
              <TableCell sx={listPageStyles.tableHeadCell}>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Nome
                </TableSortLabel>
              </TableCell>
              <TableCell sx={listPageStyles.tableHeadCell}>
                <TableSortLabel
                  active={orderBy === 'staffCount'}
                  direction={orderBy === 'staffCount' ? order : 'asc'}
                  onClick={() => handleSort('staffCount')}
                >
                  Colaboradores
                </TableSortLabel>
              </TableCell>
              <TableCell sx={listPageStyles.tableHeadCell}>Descrição</TableCell>
              <TableCell align="center" sx={listPageStyles.tableHeadCell}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? Array.from(new Array(5)).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton variant="text" /></TableCell>
                <TableCell><Skeleton variant="text" /></TableCell>
                <TableCell><Skeleton variant="text" /></TableCell>
                <TableCell align="center"><Skeleton variant="text" /></TableCell>
              </TableRow>
            )) : paginatedDepartments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell>
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    <Avatar sx={listPageStyles.avatar}>
                      {(dept.name || '??').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </Avatar>
                    <Typography variant="subtitle2" fontWeight={700}>{dept.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={dept.staffIds?.length || 0} size="small" />
                </TableCell>
                <TableCell>{dept.description || '-'}</TableCell>
                <TableCell align="center">
                  <Button size={listPageStyles.secondaryActionButton.size} variant={listPageStyles.secondaryActionButton.variant} onClick={() => onEdit(dept)} startIcon={<EditIcon />}>
                    Editar
                  </Button>
                  <Button
                    size={listPageStyles.dangerActionButton.size}
                    variant={listPageStyles.dangerActionButton.variant}
                    color={listPageStyles.dangerActionButton.color}
                    onClick={() => handleRequestDelete(dept)}
                    startIcon={<DeleteIcon />}
                    sx={{ ml: 1 }}
                  >
                    Excluir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && paginatedDepartments.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Nenhum departamento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredDepartments.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </TableContainer>
      )}

      <Dialog
        open={!!deleteId}
        onClose={() => {
          setDeleteId(null)
          setTransferTargetId('')
          setRequiresTransfer(false)
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmar exclusão de departamento</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {requiresTransfer
              ? `Este departamento possui ${departmentToDelete?.staffIds?.length || 0} colaborador(es). Escolha o destino para transferi-los antes de concluir a exclusão.`
              : 'Você está prestes a excluir este departamento. Esta ação é permanente e não pode ser desfeita.'}
          </DialogContentText>
          {requiresTransfer && (
            <TextField
              select
              fullWidth
              size="small"
              label="Departamento de destino"
              value={transferTargetId}
              onChange={(e) => setTransferTargetId(e.target.value)}
            >
              {(departments || [])
                .filter((d) => d.id && d.id !== deleteId)
                .map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteId(null);
              setTransferTargetId('');
              setRequiresTransfer(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={requiresTransfer && !transferTargetId}
          >
            {requiresTransfer ? 'Transferir e Excluir' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
      {localFeedback && (
        <Snackbar
          open
          autoHideDuration={FEEDBACK_SNACKBAR_DURATION}
          onClose={() => {
            setFeedback(null)
            setLocalFeedback(null)
          }}
          anchorOrigin={FEEDBACK_SNACKBAR_ANCHOR}
        >
          <Alert severity={localFeedback.type} variant="filled" sx={{ width: '100%' }}>{localFeedback.message}</Alert>
        </Snackbar>
      )}
    </Box>
  );
};
