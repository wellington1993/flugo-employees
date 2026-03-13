import { Result } from '@/core/functional/result';
import { Staff } from '../entities/staff';

export interface IStaffRepository {
  getAll(): Promise<Result<Staff[]>>;
  getById(id: string): Promise<Result<Staff | null>>;
  create(staff: Omit<Staff, 'id'>): Promise<Result<string>>;
  update(id: string, staff: Partial<Staff>): Promise<Result<void>>;
  delete(id: string): Promise<Result<void>>;
  bulkDelete(ids: string[]): Promise<Result<void>>;
  getByDepartment(departmentId: string): Promise<Result<Staff[]>>;
}
