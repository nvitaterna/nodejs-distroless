import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('index', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should run without errors', async () => {
    await expect(import('./index.js')).resolves.toBeDefined();
  });
});
