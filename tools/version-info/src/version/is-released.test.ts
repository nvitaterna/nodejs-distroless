import { describe, it, expect } from 'vitest';
import { server } from '../test/mocks/server.js';
import { mockShasumsResponse } from '../test/mocks/handlers.js';
import { filterReleased, isReleased } from './is-released.js';

describe('isReleased', () => {
  it('is true when SHASUMS256.txt exists', async () => {
    expect(await isReleased('22.0.0')).toBe(true);
  });

  it('is false while SHASUMS256.txt is missing', async () => {
    server.use(mockShasumsResponse(['22.1.0']));
    expect(await isReleased('22.1.0')).toBe(false);
    expect(await isReleased('22.0.0')).toBe(true);
  });
});

describe('filterReleased', () => {
  it('drops incomplete releases and keeps the order', async () => {
    server.use(mockShasumsResponse(['22.1.0', '24.0.0']));
    const versions = Array.from({ length: 20 }, (_, i) => `20.${i}.0`).concat(
      '22.0.0',
      '22.1.0',
      '24.0.0',
    );

    expect(await filterReleased(versions)).toEqual(
      versions.filter((v) => v !== '22.1.0' && v !== '24.0.0'),
    );
  });

  it('handles an empty list', async () => {
    expect(await filterReleased([])).toEqual([]);
  });
});
