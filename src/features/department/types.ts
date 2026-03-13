import { z } from 'zod';

export const departmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  managerId: z.string().optional().nullable(),
  staffIds: z.array(z.string()).optional().default([]),
  createdAt: z.number().optional(),
});

export type Department = z.infer<typeof departmentSchema>;
