import React from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DepartmentList } from '@/features/department/components/department-list';
import { type Department } from '@/features/department/types';

const DepartmentsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleEdit = (dept: Department) => {
    if (dept.id) {
      navigate(`/departments/${dept.id}/edit`);
    }
  };

  const handleAdd = () => {
    navigate('/departments/new');
  };

  return (
    <Box py={1}>
      <DepartmentList onEdit={handleEdit} onAdd={handleAdd} />
    </Box>
  );
};

export default DepartmentsPage;
