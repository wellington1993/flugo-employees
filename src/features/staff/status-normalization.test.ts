import { describe, expect, it } from 'vitest';
import { normalizeStaffStatus } from './validation';

describe('normalizeStaffStatus', () => {
  it('mantém ACTIVE e INACTIVE', () => {
    expect(normalizeStaffStatus('ACTIVE')).toBe('ACTIVE');
    expect(normalizeStaffStatus('INACTIVE')).toBe('INACTIVE');
  });

  it('converte Error/ERROR para INACTIVE', () => {
    expect(normalizeStaffStatus('Error')).toBe('INACTIVE');
    expect(normalizeStaffStatus('ERROR')).toBe('INACTIVE');
  });

  it('usa INACTIVE para valores fora do enum', () => {
    expect(normalizeStaffStatus('UNKNOWN')).toBe('INACTIVE');
    expect(normalizeStaffStatus(undefined)).toBe('INACTIVE');
  });
});
