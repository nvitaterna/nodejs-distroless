import { http, HttpResponse } from 'msw';
import { NODEJS_SCHEDULE_URL } from '../../scheduled-version/fetch-schedule.js';
import { mockRawScheduleItem } from './schedule-item.js';
import {
  NODEJS_INDEX_URL,
  REQUIRED_FILES,
} from '../../version/fetch-versions.js';
import { shasumsUrl } from '../../version/is-released.js';
import { faker } from '@faker-js/faker';
import {
  Schedule,
  scheduleSchema,
} from '../../scheduled-version/schedule.schema.js';
import { z } from 'zod';

export const mockScheduleResponse = (input: Schedule = {}) => {
  return http.get(NODEJS_SCHEDULE_URL, () => {
    if (Object.keys(input).length > 0) {
      return HttpResponse.json(input, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    const scheduleItems = Array.from({ length: 10 }).map(() =>
      mockRawScheduleItem({
        [`${faker.number.int()}`]: {
          start: faker.date.anytime().toString(),
          end: faker.date.anytime().toString(),
          lts: faker.date.anytime().toString(),
        },
      }),
    );

    const schedule: z.infer<typeof scheduleSchema> = {};

    scheduleItems.forEach((item) => {
      const version = Object.keys(item)[0];
      const data = item[version];
      schedule[version] = {
        start: data.start,
        end: data.end,
        lts: data.lts,
      };
    });

    return HttpResponse.json(schedule, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });
};

/**
 * nodejs.org's release index. Every version ships the files the image build
 * needs unless `files` says otherwise for it.
 */
export const mockVersionsResponse = (
  input: string[] = [],
  files: Record<string, string[]> = {},
  status = 200,
) => {
  return http.get(NODEJS_INDEX_URL, () => {
    const versions = input.length
      ? input
      : Array.from({ length: 10 }).map(() => {
          return faker.system.semver();
        });

    const index = versions.map((version) => ({
      version: `v${version}`,
      date: faker.date.past().toISOString().slice(0, 10),
      files: files[version] ?? [...REQUIRED_FILES, 'win-x64', 'osx-arm64-tar'],
    }));

    return HttpResponse.json(index, { status });
  });
};

/**
 * SHASUMS256.txt exists for every version except those in `notReleased`.
 */
export const mockShasumsResponse = (notReleased: string[] = []) => {
  return http.head(shasumsUrl(':version'), ({ params }) => {
    const version = String(params.version).replace(/^v/, '');
    return new HttpResponse(null, {
      status: notReleased.includes(version) ? 404 : 200,
    });
  });
};

export const handlers = [
  mockScheduleResponse(),
  mockVersionsResponse(),
  mockShasumsResponse(),
];
