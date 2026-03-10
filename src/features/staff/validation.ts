import { z } from 'zod'

export const departments = [
  'TI',
  'Design',
  'Marketing',
  'Produto',
] as const

// Sub-schemas por etapa do formulário para evitar acoplamento de strings
export const basicInfoSchema = z.object({
  name: z.string()
    .min(1, 'O nome é obrigatório')
    .min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string()
    .min(1, 'O e-mail é obrigatório')
    .email({ error: 'Insira um formato de e-mail válido' }),
  status: z.enum(['ACTIVE', 'INACTIVE'], { error: 'Selecione um status válido' }),
})

export const professionalInfoSchema = z.object({
  department: z.enum(departments, { error: 'Selecione um departamento' }),
})

// Schema principal unificado para o banco de dados
export const staffSchema = basicInfoSchema.merge(professionalInfoSchema)

export type StaffSchema = z.infer<typeof staffSchema>

// Mapa para facilitar a validação dinâmica no hook do formulário
export const stepSchemas = [basicInfoSchema, professionalInfoSchema]
