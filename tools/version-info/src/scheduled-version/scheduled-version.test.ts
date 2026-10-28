import { mockScheduleItem } from '../test/mocks/schedule-item.js';
import { ScheduledVersion } from './scheduled-version.js';
import { describe, expect, it } from 'vitest';

describe('ScheduledVersion', () => {
  describe('constructor', () => {
    it('should create a ScheduledVersion instance', () => {
      const scheduleItem = mockScheduleItem();
      const isLts = true;
      const versions = ['18.0.0', '18.1.0', '18.2.0'];

      const scheduledVersion = new ScheduledVersion(
        scheduleItem,
        isLts,
        versions,
      );

      expect(scheduledVersion).toBeInstanceOf(ScheduledVersion);
    });

    it('should correctly set isLatest', () => {
      const scheduleItem = mockScheduleItem({
        version: 18,
      });
      const versions = ['18.0.0', '18.1.0', '18.2.0', '17.3.2'];

      const scheduledVersion = new ScheduledVersion(
        scheduleItem,
        true,
        versions,
      );

      expect(scheduledVersion.isLatest).toBe(true);
    });

    it('should correctly set isActive if end date is in the future', () => {
      const scheduleItem = mockScheduleItem({
        end: new Date(Date.now() + 1000 * 60 * 60 * 24).toString(),
      });
      const versions = ['18.0.0', '18.1.0', '18.2.0'];

      const scheduledVersion = new ScheduledVersion(
        scheduleItem,
        true,
        versions,
      );

      expect(scheduledVersion.isActive).toBe(true);
    });

    it('should correctly set isActive if end date is in the past', () => {
      const scheduleItem = mockScheduleItem({
        end: new Date(Date.now() - 1000 * 60 * 60 * 24).toString(),
      });
      const versions = ['18.0.0', '18.1.0', '18.2.0'];

      const scheduledVersion = new ScheduledVersion(
        scheduleItem,
        true,
        versions,
      );

      expect(scheduledVersion.isActive).toBe(false);
    });
  });

  describe('mapVersionList', () => {
    describe('lts', () => {
      it('should map the lts tag when lts', () => {
        const scheduleItem = mockScheduleItem({
          version: 18,
        });
        const versions = ['18.0.0', '18.1.0', '18.2.0'];

        const scheduledVersion = new ScheduledVersion(
          scheduleItem,
          true,
          versions,
        );

        const mappedVersions = scheduledVersion.mapVersionList();

        expect(mappedVersions[0].tags).toContain('lts');
        expect(mappedVersions[0].version).toBe('18.2.0');
      });

      it('should not map the lts tag when not lts', () => {
        const scheduleItem = mockScheduleItem({
          version: 18,
        });
        const versions = ['18.0.0', '18.1.0', '18.2.0'];

        const scheduledVersion = new ScheduledVersion(
          scheduleItem,
          false,
          versions,
        );

        const mappedVersions = scheduledVersion.mapVersionList();

        expect(mappedVersions[0].tags).not.toContain('lts');
        expect(mappedVersions[0].version).toBe('18.2.0');
      });
    });

    describe('latest', () => {
      it('should map the latest tag when latest', () => {
        const scheduleItem = mockScheduleItem({
          version: 18,
        });
        const versions = ['18.0.0', '18.1.0', '18.2.0'];

        const scheduledVersion = new ScheduledVersion(
          scheduleItem,
          true,
          versions,
        );

        const mappedVersions = scheduledVersion.mapVersionList();

        expect(mappedVersions[0].tags).toContain('latest');
        expect(mappedVersions[0].version).toBe('18.2.0');
      });

      it('should not map the latest tag when not latest', () => {
        const scheduleItem = mockScheduleItem({
          version: 18,
        });
        const versions = ['18.0.0', '18.1.0', '18.2.0', '19.0.0'];

        const scheduledVersion = new ScheduledVersion(
          scheduleItem,
          false,
          versions,
        );

        const mappedVersions = scheduledVersion.mapVersionList();

        expect(mappedVersions[0].tags).not.toContain('latest');
        expect(mappedVersions[0].version).toBe('18.2.0');
      });
    });

    describe('major', () => {
      it('should map the major tag on the highest version', () => {
        const scheduleItem = mockScheduleItem({
          version: 18,
        });
        const versions = ['18.0.0', '18.1.0', '18.2.0'];

        const scheduledVersion = new ScheduledVersion(
          scheduleItem,
          true,
          versions,
        );

        const mappedVersions = scheduledVersion.mapVersionList();

        expect(mappedVersions[0].tags).toContain('18');
        expect(mappedVersions[0].version).toBe('18.2.0');
        expect(mappedVersions[1].tags).not.toContain('18');
      });
    });

    describe('minor', () => {
      it('should map the minor tag on the highest version', () => {
        const scheduleItem = mockScheduleItem({
          version: 18,
        });
        const versions = ['18.0.0', '18.1.0', '18.2.0', '18.2.1'];

        const scheduledVersion = new ScheduledVersion(
          scheduleItem,
          true,
          versions,
        );

        const mappedVersions = scheduledVersion.mapVersionList();

        expect(mappedVersions[0].tags).toContain('18.2');
        expect(mappedVersions[0].version).toBe('18.2.1');
        expect(mappedVersions[1].tags).not.toContain('18.2');
        expect(mappedVersions[2].tags).toContain('18.1');
      });
    });
  });
});
