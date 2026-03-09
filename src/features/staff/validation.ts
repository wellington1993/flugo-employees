import { z } from 'zod'

export const departments = [
  'TI',
  'Design',
  'Marketing',
  'Produto',
] as const

export const staffSchema = z.object({
  name: z.string().min(3, 'O título (nome) deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  department: z.enum(departments, {
    errorMap: () => ({ message: 'Selecione um departamento' }),
  }),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export type StaffSchema = z.infer<typeof staffSchema>
