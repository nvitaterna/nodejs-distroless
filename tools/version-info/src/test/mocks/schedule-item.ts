import {
  Schedule,
  ScheduleItem,
} from '../../scheduled-version/schedule.schema.js';
import { faker } from '@faker-js/faker';

export const mockRawScheduleItem = (input: Schedule = {}): Schedule => {
  const version =
    Object.entries(input)[0] ||
    faker.number.int({ min: 1, max: 100 }).toString();
  const { start, end, lts } = input[version[0]] ?? {};

  return {
    [`${version}`]: {
      start: start ?? faker.date.past().toISOString(),
      end: end ?? faker.date.future().toISOString(),
      lts: 'lts' in input ? lts : faker.date.past().toISOString(),
    },
  };
};

export const mockScheduleItem = (
  input: Partial<ScheduleItem> = {},
): ScheduleItem => {
  const { version, start, end, lts } = input;

  return {
    version: version ?? faker.number.int({ min: 1, max: 100 }),
    start: start ?? faker.date.past().toISOString(),
    end: end ?? faker.date.future().toISOString(),
    lts: 'lts' in input ? lts : faker.date.past().toISOString(),
  };
};
