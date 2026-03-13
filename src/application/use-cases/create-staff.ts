import { Result, failure, isFailure } from '@/core/functional/result';
import { Staff } from '@/domain/entities/staff';
import { IStaffRepository } from '@/domain/repositories/i-staff-repository';
import { StaffDomainService } from '@/domain/services/staff-domain-service';
import { normalizeStaffEmail } from '@/features/staff/validation';

export interface CreateStaffInput extends Omit<Staff, 'id' | 'createdAt'> {}

export class CreateStaffUseCase {
  constructor(private readonly staffRepository: IStaffRepository) {}

  async execute(input: CreateStaffInput): Promise<Result<string>> {
    const normalizedInput: CreateStaffInput = {
      ...input,
      email: normalizeStaffEmail(input.email),
    };

    if (normalizedInput.managerId) {
      const managerResult = await this.staffRepository.getById(normalizedInput.managerId);
      
      if (isFailure(managerResult)) {
        return managerResult;
      }

      const manager = managerResult.value;
      if (!manager) {
        return failure(new Error('MANAGER_NOT_FOUND'));
      }

      const validationResult = StaffDomainService.validateHierarchy(
        normalizedInput.hierarchicalLevel,
        manager
      );

      if (isFailure(validationResult)) {
        return validationResult;
      }
    }

    return this.staffRepository.create(normalizedInput);
  }
}
