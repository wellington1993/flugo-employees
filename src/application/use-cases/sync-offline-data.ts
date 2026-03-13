import { Result, isFailure } from '@/core/functional/result';
import { IStaffRepository } from '@/domain/repositories/i-staff-repository';
import { IDepartmentRepository } from '@/domain/repositories/i-department-repository';
import { OfflineQueue } from '@/infrastructure/persistence/offline-queue';

export class SyncOfflineDataUseCase {
  constructor(
    private readonly staffRepository: IStaffRepository,
    private readonly departmentRepository: IDepartmentRepository
  ) {}

  async execute(): Promise<Result<{ processed: number; failed: number }>> {
    const mutations = await OfflineQueue.getAll();
    let processed = 0;
    let failed = 0;

    for (const mutation of mutations) {
      let result: Result<any>;

      try {
        if (mutation.collection === 'staffs') {
          result = await this.processStaffMutation(mutation);
        } else {
          result = await this.processDeptMutation(mutation);
        }

        if (isFailure(result)) {
          // Se for erro de rede, mantemos na fila. Se for erro de lógica, talvez devêssemos remover?
          // Para o PWA, geralmente mantemos até dar certo ou ser substituído.
          failed++;
        } else {
          await OfflineQueue.remove(mutation.id);
          processed++;
        }
      } catch {
        failed++;
      }
    }

    return { success: true, value: { processed, failed } };
  }

  private async processStaffMutation(mutation: any): Promise<Result<any>> {
    const { type, data } = mutation;
    switch (type) {
      case 'CREATE': return this.staffRepository.create(data);
      case 'UPDATE': return this.staffRepository.update(data.id, data);
      case 'DELETE': return this.staffRepository.delete(data.id);
      case 'BULK_DELETE': return this.staffRepository.bulkDelete(data.ids);
      default: return { success: true, value: undefined };
    }
  }

  private async processDeptMutation(mutation: any): Promise<Result<any>> {
    const { type, data, options } = mutation;
    switch (type) {
      case 'CREATE': return this.departmentRepository.create(data);
      case 'UPDATE': return this.departmentRepository.update(data.id, data, options);
      case 'DELETE': return this.departmentRepository.delete(data.id);
      default: return { success: true, value: undefined };
    }
  }
}
