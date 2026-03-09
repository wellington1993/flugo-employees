import { z } from 'zod'

export const departments = [
  'TI',
  'Design',
  'Marketing',
  'Produto',
] as const

export type StaffDepartment = (typeof departments)[number]

export const staffSchema = z.object({
  name: z.string().min(3, 'O título deve ter pelo menos 3 caracteres').max(80, 'Nome muito longo'),
  email: z.string().email('E-mail inválido'),
  department: z.enum(departments, { error: 'Selecione um departamento' }),
  status: z.enum(['ACTIVE', 'INACTIVE'], { error: 'Status inválido' }),
})

export type StaffSchema = z.infer<typeof staffSchema>
