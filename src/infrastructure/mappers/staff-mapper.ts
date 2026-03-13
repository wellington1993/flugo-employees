import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Staff, StaffStatus, HierarchicalLevel } from '@/domain/entities/staff';
import { normalizeStaffEmail, normalizeStaffStatus } from '@/features/staff/validation';

export class StaffMapper {
  static toDomain(doc: QueryDocumentSnapshot<DocumentData>): Staff {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      email: data.email || '',
      status: normalizeStaffStatus(data.status) as StaffStatus,
      departmentId: data.departmentId || '',
      role: data.role || '',
      admissionDate: data.admissionDate || '',
      hierarchicalLevel: (data.hierarchicalLevel as HierarchicalLevel) || 'ENTRY',
      managerId: data.managerId || null,
      baseSalary: Number(data.baseSalary) || 0,
      createdAt: data.createdAt,
    };
  }

  static toFirestore(staff: Partial<Staff>): DocumentData {
    const data: DocumentData = { ...staff };
    if (typeof data.email === 'string') {
      data.email = normalizeStaffEmail(data.email);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
      data.status = normalizeStaffStatus(data.status);
    }
    // Removemos o ID do objeto de dados, pois o Firestore usa o ID do documento
    delete data.id;
    return data;
  }
}
