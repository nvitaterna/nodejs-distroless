import { describe, expect, it } from 'vitest';
import { fetchSchedule } from './fetch-schedule.js';
import { server } from '../test/mocks/server.js';
import { mockScheduleResponse } from '../test/mocks/handlers.js';

describe('fetchSchedule', () => {
  it('should fetch the schedule from the correct URL', async () => {
    const response = await fetchSchedule();
    expect(response).toBeDefined();
  });

  it('should only return versions that do not include a dot', async () => {
    server.use(
      mockScheduleResponse({
        '0.1': {
          start: '2022-10-25',
          end: '2024-04-30',
          lts: 'Active',
        },
        '1': {
          start: '2022-10-25',
          end: '2024-04-30',
          lts: 'Active',
        },
      }),
    );

    const response = await fetchSchedule();

    expect(response).toHaveLength(1);
    expect(response[0].version).toBe(1);
  });
});
