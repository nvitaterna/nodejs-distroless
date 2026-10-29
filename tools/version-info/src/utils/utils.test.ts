import {
  getNowMilli,
  getTimeMilli,
  sortVersions,
  isLts,
  isActive,
} from './utils.js';
import { faker } from '@faker-js/faker';
import { gt, lt } from 'semver';

import { describe, expect, it } from 'vitest';
import { mockScheduleItem } from '../test/mocks/schedule-item.js';

describe('utils', () => {
  describe('getNowMilli', () => {
    it('should return the current date in milliseconds', () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      expect(getNowMilli()).toBe(now.getTime());
    });

    it('should return the current date in milliseconds even if called multiple times', () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      expect(getNowMilli()).toBe(now.getTime());
      expect(getNowMilli()).toBe(now.getTime());
    });
  });

  describe('getTimeMilli', () => {
    it('should return the time in milliseconds for a given date', () => {
      const date = faker.date.past().toISOString();

      const expectedDate = new Date(date).setHours(0, 0, 0, 0);

      expect(getTimeMilli(date)).toBe(expectedDate);
    });
  });

  describe('sortVersions', () => {
    it('should sort a list of semantic versions', () => {
      const versions = Array(10)
        .fill(undefined)
        .map(() => faker.system.semver());

      versions[4] = versions[1];

      const expectedVersions = [...versions].sort((a, b) => {
        if (gt(a, b)) {
          return -1;
        } else if (lt(a, b)) {
          return 1;
        }
        return 0;
      });

      const sortedVersions = versions.sort(sortVersions);

      expect(sortedVersions).toEqual(expectedVersions);
    });
  });

  describe('isLts', () => {
    it('should return true if the schedule item is LTS and the date is in the past', () => {
      const scheduleItem = mockScheduleItem({
        lts: faker.date.past().toISOString(),
      });
      expect(isLts(scheduleItem)).toBe(true);
    });

    it('should return false if the schedule item is not LTS', () => {
      const scheduleItem = mockScheduleItem({ lts: undefined });

      expect(isLts(scheduleItem)).toBe(false);
    });

    it('should return false if the schedule item is LTS and the date is in the future', () => {
      const scheduleItem = mockScheduleItem({
        lts: faker.date.future().toISOString(),
      });
      expect(isLts(scheduleItem)).toBe(false);
    });
  });

  describe('isActive', () => {
    const day = 1000 * 60 * 60 * 24;

    it('should return true between the start and end dates', () => {
      const scheduleItem = mockScheduleItem({
        start: new Date(Date.now() - day).toISOString(),
        end: new Date(Date.now() + day).toISOString(),
      });
      expect(isActive(scheduleItem)).toBe(true);
    });

    it('should return false before the start date (alpha phase)', () => {
      const scheduleItem = mockScheduleItem({
        start: new Date(Date.now() + day).toISOString(),
        end: new Date(Date.now() + 365 * day).toISOString(),
      });
      expect(isActive(scheduleItem)).toBe(false);
    });

    it('should return false after the end date', () => {
      const scheduleItem = mockScheduleItem({
        start: new Date(Date.now() - 365 * day).toISOString(),
        end: new Date(Date.now() - day).toISOString(),
      });
      expect(isActive(scheduleItem)).toBe(false);
    });
  });
});
