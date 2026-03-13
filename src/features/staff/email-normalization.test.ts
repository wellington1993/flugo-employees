import { describe, expect, it } from 'vitest';
import { normalizeStaffEmail } from './validation';

describe('normalizeStaffEmail', () => {
  it('should trim and lowercase email', () => {
    expect(normalizeStaffEmail('  JOHN.DOE@Example.COM  ')).toBe('john.doe@example.com');
  });

  it('should normalize mixed casing without extra spaces', () => {
    expect(normalizeStaffEmail('MaRy.Sue@Example.COM')).toBe('mary.sue@example.com');
  });
});
