export interface Department {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly managerId?: string | null;
  readonly staffIds: readonly string[];
  readonly createdAt?: number;
}
