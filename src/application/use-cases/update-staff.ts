import { Result, failure, isFailure } from '@/core/functional/result';
import { Staff } from '@/domain/entities/staff';
import { IStaffRepository } from '@/domain/repositories/i-staff-repository';
import { StaffDomainService } from '@/domain/services/staff-domain-service';
import { normalizeStaffEmail } from '@/features/staff/validation';

export class UpdateStaffUseCase {
  constructor(private readonly staffRepository: IStaffRepository) {}

  async execute(id: string, data: Partial<Staff>): Promise<Result<void>> {
    const normalizedData: Partial<Staff> = {
      ...data,
      ...(typeof data.email === 'string' ? { email: normalizeStaffEmail(data.email) } : {}),
    };

    const oldStaffResult = await this.staffRepository.getById(id);
    if (isFailure(oldStaffResult)) return oldStaffResult;

    const oldStaff = oldStaffResult.value;
    if (!oldStaff) return failure(new Error('STAFF_NOT_FOUND'));

    const updatedStaff: Staff = { ...oldStaff, ...normalizedData };

    if (updatedStaff.managerId) {
      const managerResult = await this.staffRepository.getById(updatedStaff.managerId);
      if (isFailure(managerResult)) return managerResult;

      const manager = managerResult.value;
      if (!manager) return failure(new Error('MANAGER_NOT_FOUND'));

      const validationResult = StaffDomainService.validateHierarchy(
        updatedStaff.hierarchicalLevel,
        manager,
        id
      );

      if (isFailure(validationResult)) return validationResult;
    }

    return this.staffRepository.update(id, normalizedData);
  }
}
