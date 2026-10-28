import { beforeEach, describe, expect, it, vi } from 'vitest';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

vi.mock('./main.js', () => ({
  main: vi.fn(async () => []),
}));

describe('index', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.argv = process.argv.slice(0, 2);
  });

  it('should run without errors', async () => {
    await expect(import('./index.js')).resolves.toBeDefined();
    const { main } = await import('./main.js');
    expect(main).toHaveBeenCalledWith([]);
  });

  it('should pass the versions from the given file as known', async () => {
    const file = join(tmpdir(), `versions-${process.pid}.json`);
    await writeFile(
      file,
      JSON.stringify([
        { version: '22.0.0', tags: ['22.0.0'] },
        { version: '22.1.0', tags: ['22.1.0', '22'] },
      ]),
    );
    process.argv.push(file);

    await import('./index.js');

    const { main } = await import('./main.js');
    expect(main).toHaveBeenCalledWith(['22.0.0', '22.1.0']);
  });
});
