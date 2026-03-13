import { describe, expect, it } from 'vitest';
import { StaffMapper } from './staff-mapper';

describe('StaffMapper', () => {
  it('should normalize email when mapping to firestore', () => {
    const data = StaffMapper.toFirestore({
      email: '  USER@Example.COM ',
    } as any);

    expect(data.email).toBe('user@example.com');
  });
});
