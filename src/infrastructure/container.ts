import { FirebaseStaffRepository } from './firebase/staff-repository';
import { FirebaseDepartmentRepository } from './firebase/department-repository';
import { CreateStaffUseCase } from '@/application/use-cases/create-staff';
import { UpdateStaffUseCase } from '@/application/use-cases/update-staff';
import { SyncOfflineDataUseCase } from '@/application/use-cases/sync-offline-data';

// Repositories
const staffRepository = new FirebaseStaffRepository();
const departmentRepository = new FirebaseDepartmentRepository();

// Use Cases
const createStaffUseCase = new CreateStaffUseCase(staffRepository);
const updateStaffUseCase = new UpdateStaffUseCase(staffRepository);
const syncOfflineDataUseCase = new SyncOfflineDataUseCase(staffRepository, departmentRepository);

export const container = {
  staffRepository,
  departmentRepository,
  createStaffUseCase,
  updateStaffUseCase,
  syncOfflineDataUseCase,
};
