import { describe, it, expect } from 'vitest';

describe('useJobPolling', () => {
  it('exports useJobPolling function', async () => {
    const mod = await import('../../src/hooks/useJobPolling');
    expect(typeof mod.useJobPolling).toBe('function');
  });
});
