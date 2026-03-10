import { z } from 'zod'

export const departments = [
  'TI',
  'Design',
  'Marketing',
  'Produto',
] as const

export const staffSchema = z.object({
  name: z.string()
    .min(1, 'O nome é obrigatório')
    .min(3, 'O nome deve ter pelo menos 3 caracteres'),
  
  email: z.string()
    .min(1, 'O e-mail é obrigatório')
    .email({ error: 'Insira um formato de e-mail válido (ex: nome@empresa.com)' }),
  
  department: z.enum(departments, { error: 'Selecione um departamento' }),
  
  status: z.enum(['ACTIVE', 'INACTIVE'], { error: 'Selecione um status válido' }),
})

export type StaffSchema = z.infer<typeof staffSchema>
