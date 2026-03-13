export type StaffStatus = 'ACTIVE' | 'INACTIVE';
export type HierarchicalLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'MANAGER';

export interface Staff {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly status: StaffStatus;
  readonly departmentId: string;
  readonly role: string;
  readonly admissionDate: string;
  readonly hierarchicalLevel: HierarchicalLevel;
  readonly managerId?: string | null;
  readonly baseSalary: number;
  readonly createdAt?: number;
}

export const HIERARCHY_ORDER: Record<HierarchicalLevel, number> = {
  ENTRY: 0,
  MID: 1,
  SENIOR: 2,
  MANAGER: 3,
};
