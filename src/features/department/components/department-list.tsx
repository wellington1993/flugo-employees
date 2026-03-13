import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  IconButton, 
  Typography, 
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  TextField,
  MenuItem
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { departmentService } from '@/services/departments';
import { type Department } from '../types';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';

export const DepartmentList: React.FC<{ onEdit: (dept: Department) => void; onAdd: () => void }> = ({ onEdit, onAdd }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [requiresTransfer, setRequiresTransfer] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await departmentService.getAll();
      setDepartments(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleDelete = async () => {
    if (deleteId) {
      try {
        if (requiresTransfer) {
          if (!transferTargetId) {
            setFeedback({ type: 'error', message: 'Selecione um departamento de destino para continuar.' });
            return;
          }
          await departmentService.transferAndDelete(deleteId, transferTargetId);
          setFeedback({ type: 'success', message: 'Departamento excluído com transferência concluída.' });
        } else {
          await departmentService.delete(deleteId);
          setFeedback({ type: 'success', message: 'Departamento excluído com sucesso.' });
        }
        setDeleteId(null);
        setTransferTargetId('');
        setRequiresTransfer(false);
        loadDepartments();
      } catch (error) {
        if (error instanceof Error && error.message === 'DEPARTMENT_HAS_STAFF') {
          setRequiresTransfer(true);
          setFeedback({
            type: 'error',
            message: 'Este departamento possui colaboradores ativos. Selecione um departamento de destino para transferir em lote antes de excluir.',
          });
          return;
        }
        setFeedback({ type: 'error', message: 'Não foi possível excluir o departamento.' });
      }
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Departamentos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
          Novo Departamento
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell>{dept.name}</TableCell>
                <TableCell>{dept.description || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => onEdit(dept)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => setDeleteId(dept.id || null)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {departments.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Nenhum departamento cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <DeleteConfirmDialog
        open={!!deleteId}
        onClose={() => {
          setDeleteId(null)
          setTransferTargetId('')
          setRequiresTransfer(false)
        }}
        onConfirm={handleDelete}
        title="Excluir Departamento"
        description={requiresTransfer
          ? 'Selecione o departamento de destino para transferir os colaboradores e concluir a exclusão.'
          : 'Tem certeza que deseja excluir este departamento? Esta ação não pode ser desfeita.'}
      />
      {requiresTransfer && (
        <Box mt={2} maxWidth={360}>
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
        </Box>
      )}
      <Snackbar
        open={!!feedback}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? <Alert severity={feedback.type}>{feedback.message}</Alert> : <></>}
      </Snackbar>
    </Box>
  );
};
