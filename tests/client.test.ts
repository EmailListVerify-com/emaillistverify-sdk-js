import { describe, it, expect } from 'vitest';
import { EmailListVerifyClient, VERSION } from '../src';

describe('EmailListVerifyClient', () => {
  it('should have correct version', () => {
    expect(VERSION).toBe('1.0.0');
  });

  it('should throw error without API key', () => {
    expect(() => new EmailListVerifyClient('')).toThrow('API key is required');
  });

  it('should instantiate with valid API key', () => {
    const client = new EmailListVerifyClient('test-api-key');
    expect(client).toBeInstanceOf(EmailListVerifyClient);
  });
});
