import { fetchVersions } from './version/fetch-versions.js';
import { fetchSchedule } from './scheduled-version/fetch-schedule.js';
import { ScheduledVersion } from './scheduled-version/scheduled-version.js';
import { isLts, sortVersions } from './utils/utils.js';

export const main = async () => {
  const [versions, schedule] = await Promise.all([
    fetchVersions(),
    fetchSchedule(),
  ]);

  return schedule
    .map((scheduleItem) => {
      const lts =
        schedule.filter(isLts).sort((a, b) => {
          return b.version - a.version;
        })[0] === scheduleItem;

      return new ScheduledVersion(scheduleItem, lts, versions);
    })
    .filter((item) => item.isActive)
    .map((item) => item.mapVersionList())
    .flat()
    .sort((a, b) => {
      return sortVersions(a.version, b.version);
    });
};
