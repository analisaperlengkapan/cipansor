import { describe, it, expect } from 'vitest';
import { resolveJwtSecret } from './index';

const STRONG = 'a-sufficiently-long-random-secret-value-1234';

describe('resolveJwtSecret', () => {
  it('throws in production when JWT_SECRET is missing', () => {
    expect(() => resolveJwtSecret(undefined, 'production')).toThrow(/JWT_SECRET/);
  });

  it('throws in production when JWT_SECRET is the shipped placeholder', () => {
    expect(() => resolveJwtSecret('change-this-secret-in-production', 'production')).toThrow(
      /JWT_SECRET/
    );
  });

  it('throws in production when JWT_SECRET is shorter than 32 characters', () => {
    expect(() => resolveJwtSecret('short-secret', 'production')).toThrow(/32 characters/);
  });

  it('returns the secret in production when it is strong enough', () => {
    expect(resolveJwtSecret(STRONG, 'production')).toBe(STRONG);
  });

  it('falls back to the dev default outside production', () => {
    expect(resolveJwtSecret(undefined, 'development')).toBe('change-this-secret-in-production');
    expect(resolveJwtSecret(undefined, 'test')).toBe('change-this-secret-in-production');
    expect(resolveJwtSecret(undefined, undefined)).toBe('change-this-secret-in-production');
  });

  it('prefers an explicit secret outside production', () => {
    expect(resolveJwtSecret('my-dev-secret', 'development')).toBe('my-dev-secret');
  });
});
