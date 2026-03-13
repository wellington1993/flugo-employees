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
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { departmentService } from '@/services/departments';
import { type Department } from '../types';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';

export const DepartmentList: React.FC<{ onEdit: (dept: Department) => void; onAdd: () => void }> = ({ onEdit, onAdd }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      await departmentService.delete(deleteId);
      setDeleteId(null);
      loadDepartments();
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
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Departamento"
        description="Tem certeza que deseja excluir este departamento? Esta ação não pode ser desfeita."
      />
    </Box>
  );
};
