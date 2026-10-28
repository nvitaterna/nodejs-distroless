import { http, HttpResponse } from 'msw';
import { NODEJS_SCHEDULE_URL } from '../../scheduled-version/fetch-schedule.js';
import { mockRawScheduleItem } from './schedule-item.js';
import { NODEJS_VERSIONS_URL } from '../../version/fetch-versions.js';
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

export const mockVersionsResponse = (input: string[] = []) => {
  return http.get(NODEJS_VERSIONS_URL, () => {
    const versions = input.length
      ? input
      : Array.from({ length: 10 }).map(() => {
          return faker.system.semver();
        });

    // return list of href strings in the format <a href="v${version}/">v${version}/</a>

    const hrefs = versions.map((version) => {
      return `<a href="v${version}/">v${version}/</a>`;
    });

    // return html page
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <body>
            ${hrefs.join('\n')}
        </body>
      </html>
    `;

    return HttpResponse.html(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  });
};

export const handlers = [mockScheduleResponse(), mockVersionsResponse()];
