import { z } from 'zod';

export const hierarchicalLevels = ['ENTRY', 'MID', 'SENIOR', 'MANAGER'] as const;
export const staffStatusValues = ['ACTIVE', 'INACTIVE'] as const;
export type NormalizedStaffStatus = (typeof staffStatusValues)[number];

export function normalizeStaffEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeStaffStatus(status: unknown): NormalizedStaffStatus {
  if (status === 'ACTIVE') return 'ACTIVE';
  if (status === 'INACTIVE') return 'INACTIVE';

  if (typeof status === 'string' && status.toUpperCase() === 'ERROR') {
    return 'INACTIVE';
  }

  return 'INACTIVE';
}

export const basicInfoSchema = z.object({
  name: z.string()
    .min(1, 'O nome é obrigatório')
    .min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string()
    .trim()
    .toLowerCase()
    .min(1, 'O e-mail é obrigatório')
    .email({ error: 'Insira um formato de e-mail válido' }),
  status: z.enum(staffStatusValues, { error: 'Selecione um status válido' }),
});

// Step 1 schema
export const professionalInfoSchema = z.object({
  departmentId: z.string({ error: 'O departamento é obrigatório' }).min(1, 'O departamento é obrigatório'),
  role: z.string().min(1, 'O cargo é obrigatório'),
  admissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (AAAA-MM-DD)'),
  hierarchicalLevel: z.enum(hierarchicalLevels, { error: 'Selecione um nível hierárquico' }),
  managerId: z.string().optional().nullable(),
  baseSalary: z.number().min(0, 'O salário deve ser um valor positivo'),
});

export const staffSchema = basicInfoSchema.merge(professionalInfoSchema);

export type StaffSchema = z.infer<typeof staffSchema>;
export const stepSchemas = [basicInfoSchema, professionalInfoSchema];
