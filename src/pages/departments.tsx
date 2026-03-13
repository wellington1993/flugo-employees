import React, { useState } from 'react';
import { Box, Container } from '@mui/material';
import { DepartmentList } from '@/features/department/components/department-list';
import { DepartmentForm } from '@/features/department/components/department-form';
import { type Department } from '@/features/department/types';

const DepartmentsPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (dept: Department) => {
    setSelectedDept(dept);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedDept(null);
    setIsFormOpen(true);
  };

  const handleSaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <DepartmentList 
          key={refreshKey}
          onEdit={handleEdit} 
          onAdd={handleAdd} 
        />
        <DepartmentForm
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSaved={handleSaved}
          department={selectedDept}
        />
      </Box>
    </Container>
  );
};

export default DepartmentsPage;
