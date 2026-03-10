import { z } from 'zod'

export const departments = [
  'TI',
  'Design',
  'Marketing',
  'Produto',
] as const

export const staffSchema = z.object({
  name: z.string()
    .min(1, 'O título é obrigatório')
    .min(3, 'O título deve ter pelo menos 3 caracteres'),
  
  email: z.string()
    .min(1, 'O e-mail é obrigatório')
    .email('Insira um formato de e-mail válido (ex: nome@empresa.com)'),
  
  department: z.enum(departments, {
    errorMap: () => ({ message: 'Selecione um departamento da lista' }),
  }),
  
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    errorMap: () => ({ message: 'Selecione um status válido' }),
  }),
})

export type StaffSchema = z.infer<typeof staffSchema>
