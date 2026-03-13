import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateStaffUseCase } from './create-staff';
import { IStaffRepository } from '@/domain/repositories/i-staff-repository';
import { failure, success } from '@/core/functional/result';
import { Staff } from '@/domain/entities/staff';

describe('CreateStaffUseCase', () => {
  let repository: IStaffRepository;
  let useCase: CreateStaffUseCase;

  beforeEach(() => {
    repository = {
      getById: vi.fn(),
      create: vi.fn(),
      getAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      bulkDelete: vi.fn(),
      getByDepartment: vi.fn(),
    };
    useCase = new CreateStaffUseCase(repository);
  });

  const validStaffInput = {
    name: 'John Doe',
    email: 'john@example.com',
    status: 'ACTIVE' as const,
    departmentId: 'dept-1',
    role: 'Developer',
    admissionDate: '2023-01-01',
    hierarchicalLevel: 'MID' as const,
    baseSalary: 5000,
  };

  it('should create staff successfully when no manager is provided', async () => {
    vi.mocked(repository.create).mockResolvedValue(success('new-id'));

    const result = await useCase.execute(validStaffInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe('new-id');
    }
    expect(repository.create).toHaveBeenCalledWith(validStaffInput);
  });

  it('should normalize email before creating staff', async () => {
    vi.mocked(repository.create).mockResolvedValue(success('new-id'));

    await useCase.execute({
      ...validStaffInput,
      email: '  JOHN@Example.COM  ',
    });

    expect(repository.create).toHaveBeenCalledWith({
      ...validStaffInput,
      email: 'john@example.com',
    });
  });

  it('should fail if manager is not found', async () => {
    vi.mocked(repository.getById).mockResolvedValue(success(null));

    const result = await useCase.execute({ ...validStaffInput, managerId: 'invalid-manager' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('MANAGER_NOT_FOUND');
    }
  });

  it('should fail if manager has invalid level', async () => {
    const manager: Staff = {
      id: 'mgr-1',
      name: 'Manager',
      email: 'mgr@ex.com',
      status: 'ACTIVE',
      departmentId: 'dept-1',
      role: 'Manager',
      admissionDate: '2020-01-01',
      hierarchicalLevel: 'MID', // Same level as staff
      baseSalary: 8000,
    };
    vi.mocked(repository.getById).mockResolvedValue(success(manager));

    const result = await useCase.execute({ ...validStaffInput, hierarchicalLevel: 'MID', managerId: 'mgr-1' });

    expect(result.success).toBe(false);
    if (!result.success) {
      // MANAGER_ROLE_INVALID logic: Manager needs to be 'MANAGER' level in our logic
      expect(result.error.message).toBe('MANAGER_ROLE_INVALID');
    }
  });

  it('should fail if manager role is not MANAGER', async () => {
    const manager: Staff = {
        id: 'mgr-1',
        name: 'Manager',
        email: 'mgr@ex.com',
        status: 'ACTIVE',
        departmentId: 'dept-1',
        role: 'Manager',
        admissionDate: '2020-01-01',
        hierarchicalLevel: 'SENIOR', // Not 'MANAGER'
        baseSalary: 8000,
      };
      vi.mocked(repository.getById).mockResolvedValue(success(manager));
  
      const result = await useCase.execute({ ...validStaffInput, managerId: 'mgr-1' });
  
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('MANAGER_ROLE_INVALID');
      }
  });

  it('should succeed if manager is valid', async () => {
    const manager: Staff = {
      id: 'mgr-1',
      name: 'Real Manager',
      email: 'mgr@ex.com',
      status: 'ACTIVE',
      departmentId: 'dept-1',
      role: 'Manager',
      admissionDate: '2020-01-01',
      hierarchicalLevel: 'MANAGER',
      baseSalary: 10000,
    };
    vi.mocked(repository.getById).mockResolvedValue(success(manager));
    vi.mocked(repository.create).mockResolvedValue(success('new-id'));

    const result = await useCase.execute({ ...validStaffInput, managerId: 'mgr-1' });

    expect(result.success).toBe(true);
    expect(repository.create).toHaveBeenCalled();
  });

  it('should allow manager chain when staff hierarchical level is MANAGER', async () => {
    const manager: Staff = {
      id: 'mgr-1',
      name: 'Real Manager',
      email: 'mgr@ex.com',
      status: 'ACTIVE',
      departmentId: 'dept-1',
      role: 'Manager',
      admissionDate: '2020-01-01',
      hierarchicalLevel: 'MANAGER',
      baseSalary: 10000,
    };

    vi.mocked(repository.getById).mockResolvedValue(success(manager));
    vi.mocked(repository.create).mockResolvedValue(success('new-id'));

    const result = await useCase.execute({
      ...validStaffInput,
      hierarchicalLevel: 'MANAGER',
      managerId: 'mgr-1',
    });

    expect(result.success).toBe(true);
    expect(repository.create).toHaveBeenCalled();
  });
});
