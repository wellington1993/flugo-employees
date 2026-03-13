import { z } from 'zod';
import { staffSchema } from './validation';

export type StaffStatus = 'ACTIVE' | 'INACTIVE';
export type HierarchicalLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'MANAGER' | 'DIRECTOR';

export type Staff = z.infer<typeof staffSchema> & {
  id: string;
  createdAt?: number;
  _localId?: string;
  _pendingSync?: boolean;
};
