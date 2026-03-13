import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateStaffUseCase } from './update-staff';
import { IStaffRepository } from '@/domain/repositories/i-staff-repository';
import { success } from '@/core/functional/result';
import { Staff } from '@/domain/entities/staff';

describe('UpdateStaffUseCase', () => {
  let repository: IStaffRepository;
  let useCase: UpdateStaffUseCase;

  const existingStaff: Staff = {
    id: 'staff-1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'ACTIVE',
    departmentId: 'dept-1',
    role: 'Developer',
    admissionDate: '2023-01-01',
    hierarchicalLevel: 'MID',
    managerId: null,
    baseSalary: 5000,
  };

  beforeEach(() => {
    repository = {
      getById: vi.fn().mockResolvedValue(success(existingStaff)),
      create: vi.fn(),
      getAll: vi.fn(),
      update: vi.fn().mockResolvedValue(success(undefined)),
      delete: vi.fn(),
      bulkDelete: vi.fn(),
      getByDepartment: vi.fn(),
    };
    useCase = new UpdateStaffUseCase(repository);
  });

  it('should normalize email before updating staff', async () => {
    const result = await useCase.execute('staff-1', { email: '  NEW@Example.COM  ' });

    expect(result.success).toBe(true);
    expect(repository.update).toHaveBeenCalledWith('staff-1', {
      email: 'new@example.com',
    });
  });
});
