import * as z from 'zod'
import type { StaffDepartments, StaffStatus } from './types'

export const departments: StaffDepartments[] = ['Design', 'TI', 'Marketing', 'Produto', 'RH', 'Financeiro', 'Comercial', 'Operações']
const statuses: StaffStatus[] = ['ACTIVE', 'INACTIVE']

export const staffSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres').max(100),
  email: z.string().email('E-mail inválido'),
  department: z.enum(departments as [StaffDepartments, ...StaffDepartments[]]),
  status: z.enum(statuses as [StaffStatus, ...StaffStatus[]]),
})

export type StaffSchema = z.infer<typeof staffSchema>
