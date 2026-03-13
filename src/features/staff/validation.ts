import { z } from 'zod';

export const hierarchicalLevels = ['ENTRY', 'MID', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR'] as const;

export const basicInfoSchema = z.object({
  name: z.string()
    .min(1, 'O nome é obrigatório')
    .min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string()
    .min(1, 'O e-mail é obrigatório')
    .email({ error: 'Insira um formato de e-mail válido' }),
  status: z.enum(['ACTIVE', 'INACTIVE'], { error: 'Selecione um status válido' }),
});

export const professionalInfoSchema = z.object({
  departmentId: z.string().min(1, 'O departamento é obrigatório'),
  role: z.string().min(1, 'O cargo é obrigatório'),
  admissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (AAAA-MM-DD)'),
  hierarchicalLevel: z.enum(hierarchicalLevels, { error: 'Selecione um nível hierárquico' }),
  managerId: z.string().optional().nullable(),
  baseSalary: z.number().min(0, 'O salário deve ser um valor positivo'),
});

export const staffSchema = basicInfoSchema.merge(professionalInfoSchema);
export type StaffSchema = z.infer<typeof staffSchema>;
export const stepSchemas = [basicInfoSchema, professionalInfoSchema];
