import { Result } from '@/core/functional/result';
import { Department } from '../entities/department';

export interface IDepartmentRepository {
  getAll(): Promise<Result<Department[]>>;
  getById(id: string): Promise<Result<Department | null>>;
  create(dept: Omit<Department, 'id'>): Promise<Result<string>>;
  update(
    id: string,
    dept: Partial<Department>,
    options?: { transferRemovedToDepartmentId?: string }
  ): Promise<Result<void>>;
  delete(id: string): Promise<Result<void>>;
}
