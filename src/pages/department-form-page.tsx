import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { DepartmentForm } from '@/features/department/components/department-form';
import { container } from '@/infrastructure/container';
import { type Department } from '@/features/department/types';
import { isFailure } from '@/core/functional/result';

const DepartmentFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { departmentId } = useParams<{ departmentId: string }>();
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(Boolean(departmentId));

  useEffect(() => {
    if (!departmentId) return;

    const loadDepartment = async () => {
      setLoading(true);
      const result = await container.departmentRepository.getById(departmentId);
      
      if (isFailure(result) || !result.value) {
        navigate('/404', { replace: true });
        return;
      }
      setDepartment(result.value);
      setLoading(false);
    };

    loadDepartment();
  }, [departmentId, navigate]);

  if (loading) {
    return (
      <Box py={6} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box py={1}>
      <DepartmentForm
        department={department}
        onCancel={() => navigate('/departments')}
        onSaved={() => navigate('/departments')}
      />
    </Box>
  );
};

export default DepartmentFormPage;
