import { scheduleSchema } from './schedule.schema.js';

export const NODEJS_SCHEDULE_URL =
  'https://raw.githubusercontent.com/nodejs/Release/refs/heads/main/schedule.json';

/**
 * Fetches the Node.js release schedule from the official GitHub repository.
 * @returns a promise that resolves to an array of scheduled versions.
 * @example
 * // returns [{ version: 18, start: '2022-10-25', end: '2024-04-30', lts: 'Active' }]
 */
export const fetchSchedule = async () => {
  const response = await fetch(NODEJS_SCHEDULE_URL);

  const data = scheduleSchema.parse(await response.json());

  return Object.entries(data)
    .filter(([version]) => {
      // omimtting out the 0.x versions
      return !version.includes('.');
    })
    .map(([version, { start, end, lts }]) => {
      return {
        version: parseInt(version.replace('v', '')),
        start,
        end,
        lts,
      };
    });
};
