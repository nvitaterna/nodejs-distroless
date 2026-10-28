import { mockVersionsResponse } from '../test/mocks/handlers.js';
import { server } from '../test/mocks/server.js';
import { fetchVersions } from './fetch-versions.js';
import { describe, it, expect } from 'vitest';

describe('fetchVersions', () => {
  it('should return an array of versions', async () => {
    const versions = await fetchVersions();
    expect(Array.isArray(versions)).toBe(true);
  });

  it('should filter out versions that start with 0', async () => {
    server.use(
      mockVersionsResponse([
        '18.0.0',
        '18.1.0',
        '18.2.0',
        '18.2.1',
        '18.2.2',
        '0.1.0',
        '0.2.0',
        '0.3.0',
      ]),
    );

    const versions = await fetchVersions();

    expect(versions).toEqual([
      '18.0.0',
      '18.1.0',
      '18.2.0',
      '18.2.1',
      '18.2.2',
    ]);
  });

  it('should filter out versions without linux x64 and arm64 tarballs', async () => {
    server.use(
      mockVersionsResponse(['18.0.0', '18.1.0', '18.2.0'], {
        '18.1.0': ['linux-x64', 'win-x64'],
        '18.2.0': [],
      }),
    );

    expect(await fetchVersions()).toEqual(['18.0.0']);
  });

  it('should fail when the index cannot be fetched', async () => {
    server.use(mockVersionsResponse([], {}, 503));

    await expect(fetchVersions()).rejects.toThrow('503');
  });
});
