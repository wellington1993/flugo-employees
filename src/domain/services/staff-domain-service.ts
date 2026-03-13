import { Result, failure, success } from '@/core/functional/result';
import { Staff, HIERARCHY_ORDER, HierarchicalLevel } from '../entities/staff';

export class StaffDomainService {
  static validateHierarchy(
    staffLevel: HierarchicalLevel,
    manager: Staff,
    currentStaffId?: string
  ): Result<void> {
    if (currentStaffId && manager.id === currentStaffId) {
      return failure(new Error('MANAGER_SELF_REFERENCE'));
    }

    if (manager.hierarchicalLevel !== 'MANAGER') {
      return failure(new Error('MANAGER_ROLE_INVALID'));
    }

    const managerLevelScore = HIERARCHY_ORDER[manager.hierarchicalLevel];
    const staffLevelScore = HIERARCHY_ORDER[staffLevel];

    if (managerLevelScore < staffLevelScore) {
      return failure(new Error('MANAGER_LEVEL_INVALID'));
    }

    return success(undefined);
  }
}
