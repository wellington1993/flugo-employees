import { z } from 'zod';

export const hierarchicalLevels = ['ENTRY', 'MID', 'SENIOR', 'MANAGER'] as const;
export const staffStatusValues = ['ACTIVE', 'INACTIVE'] as const;
export const departments = ['TI', 'Design', 'Marketing', 'Produto'] as const;
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
    .min(1, 'O e-mail é obrigatório')
    .email({ error: 'Insira um formato de e-mail válido' }),
  status: z.enum(staffStatusValues, { error: 'Selecione um status válido' }),
});

// Step 1 schema (for step validation, department field)
export const professionalInfoSchema = z.object({
  department: z
    .enum(departments, { error: 'Selecione um departamento' }),
  departmentId: z.string().optional(),
  role: z.string().min(1, 'O cargo é obrigatório').optional(),
  admissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (AAAA-MM-DD)').optional(),
  hierarchicalLevel: z.enum(hierarchicalLevels, { error: 'Selecione um nível hierárquico' }).optional(),
  managerId: z.string().optional().nullable(),
  baseSalary: z.number().min(0, 'O salário deve ser um valor positivo').optional(),
});

// Full staff schema (for forms - requires all fields from both steps)
export const staffSchema = basicInfoSchema.extend({
  department: z
    .enum(departments, { error: 'Selecione um departamento' }),
  departmentId: z.string().optional(),
  role: z.string().min(1, 'O cargo é obrigatório').optional(),
  admissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (AAAA-MM-DD)').optional(),
  hierarchicalLevel: z.enum(hierarchicalLevels, { error: 'Selecione um nível hierárquico' }).optional(),
  managerId: z.string().optional().nullable(),
  baseSalary: z.number().min(0, 'O salário deve ser um valor positivo').optional(),
});

export type StaffSchema = z.infer<typeof staffSchema>;
export const stepSchemas = [basicInfoSchema, professionalInfoSchema];
