import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  CircularProgress
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { departmentSchema, type Department } from '../types';
import { departmentService } from '@/services/departments';
import { staffService } from '@/services/staffs';
import { type Staff } from '@/features/staff/types';

interface DepartmentFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  department?: Department | null;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({ open, onClose, onSaved, department }) => {
  type DepartmentFormData = z.input<typeof departmentSchema>;
  const [managers, setManagers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      description: '',
      managerId: '',
      staffIds: [],
    },
  });

  useEffect(() => {
    if (department) {
      reset({
        name: department.name,
        description: department.description || '',
        managerId: department.managerId || '',
        staffIds: department.staffIds ?? [],
      });
    } else {
      reset({
        name: '',
        description: '',
        managerId: '',
        staffIds: [],
      });
    }
  }, [department, reset]);

  useEffect(() => {
    const loadManagers = async () => {
      try {
        const data = await staffService.getAll();
        setManagers(data || []);
      } catch (e) {
        setManagers([]);
      }
    };
    if (open) loadManagers();
  }, [open]);

  const onSubmit = async (data: DepartmentFormData) => {
    setLoading(true);
    try {
      const payload: Omit<Department, 'id' | 'createdAt'> = {
        name: data.name,
        description: data.description,
        managerId: data.managerId,
        staffIds: data.staffIds ?? [],
      };
      if (department?.id) {
        await departmentService.update(department.id, payload);
      } else {
        await departmentService.create(payload);
      }
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{department ? 'Editar Departamento' : 'Novo Departamento'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nome do Departamento"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Descrição"
                  multiline
                  rows={3}
                  fullWidth
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />
            <FormControl fullWidth error={!!errors.managerId}>
              <InputLabel>Gerente do Departamento</InputLabel>
              <Controller
                name="managerId"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Gerente do Departamento">
                    <MenuItem value=""><em>Nenhum</em></MenuItem>
                    {managers.map((m) => (
                      <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
