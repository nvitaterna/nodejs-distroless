import { vi, describe, it, expect, beforeEach } from 'vitest';
import { main } from './main.js';
import { fetchVersions } from './version/fetch-versions.js';
import { fetchSchedule } from './scheduled-version/fetch-schedule.js';
import { ScheduledVersion } from './scheduled-version/scheduled-version.js';

vi.mock('./version/fetch-versions.js', () => ({
  fetchVersions: vi.fn(),
}));
vi.mock('./scheduled-version/fetch-schedule.js', () => ({
  fetchSchedule: vi.fn(),
}));
vi.mock('./scheduled-version/scheduled-version.js', () => ({
  ScheduledVersion: vi.fn(),
}));
vi.mock('./utils/utils.js', () => ({
  isLts: vi.fn(),
  sortVersions: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('main', () => {
  it('should fetch versions and schedule', async () => {
    const mockVersions = ['18.0.0', '19.0.0', '20.0.0'];
    const mockSchedule = [
      { version: 18, start: '2022-10-25', end: '2024-04-30', lts: 'Active' },
      { version: 19, start: '2023-10-25', end: '2025-04-30', lts: 'Active' },
      { version: 20, start: '2024-10-25', end: '2026-04-30', lts: 'Active' },
    ];

    vi.mocked(fetchVersions).mockResolvedValue(mockVersions);
    vi.mocked(fetchSchedule).mockResolvedValue(mockSchedule);

    const result = await main();

    expect(fetchVersions).toHaveBeenCalled();
    expect(fetchSchedule).toHaveBeenCalled();
    expect(ScheduledVersion).toHaveBeenCalledTimes(mockSchedule.length);
    expect(result).toEqual(expect.any(Array));
  });

  it('should create ScheduledVersion instances with correct parameters', async () => {
    const mockVersions = ['18.0.0', '19.0.0', '20.0.0'];
    const mockSchedule = [
      { version: 18, start: '2022-10-25', end: '2024-04-30', lts: 'Active' },
      { version: 19, start: '2023-10-25', end: '2025-04-30', lts: 'Active' },
      { version: 20, start: '2024-10-25', end: '2026-04-30', lts: 'Active' },
    ];

    vi.mocked(fetchVersions).mockResolvedValue(mockVersions);
    vi.mocked(fetchSchedule).mockResolvedValue(mockSchedule);

    await main();

    expect(ScheduledVersion).toHaveBeenCalledWith(
      mockSchedule[0],
      expect.any(Boolean),
      mockVersions,
    );
    expect(ScheduledVersion).toHaveBeenCalledWith(
      mockSchedule[1],
      expect.any(Boolean),
      mockVersions,
    );
    expect(ScheduledVersion).toHaveBeenCalledWith(
      mockSchedule[2],
      expect.any(Boolean),
      mockVersions,
    );
  });
});
