import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Department } from '@/domain/entities/department';

export class DepartmentMapper {
  static toDomain(doc: QueryDocumentSnapshot<DocumentData>): Department {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      description: data.description,
      managerId: data.managerId,
      staffIds: data.staffIds || [],
      createdAt: data.createdAt,
    };
  }

  static toFirestore(dept: Partial<Department>): DocumentData {
    const data: DocumentData = { ...dept };
    delete data.id;
    return data;
  }
}
