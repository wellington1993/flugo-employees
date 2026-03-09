export type StaffStatus = 'ACTIVE' | 'INACTIVE'
export type StaffDepartments = 'TI' | 'Design' | 'Marketing' | 'Produto'

export type Staff = {
  id: string
  name: string
  email: string
  department: StaffDepartments
  status: StaffStatus
  createdAt?: number
  _localId?: string
  _pendingSync?: true
}
