import { fetchVersions } from './version/fetch-versions.js';
import { filterReleased } from './version/is-released.js';
import { fetchSchedule } from './scheduled-version/fetch-schedule.js';
import { ScheduledVersion } from './scheduled-version/scheduled-version.js';
import { isActive, isLts, sortVersions } from './utils/utils.js';
import { major } from 'semver';

export const main = async () => {
  const [allVersions, schedule] = await Promise.all([
    fetchVersions(),
    fetchSchedule(),
  ]);

  // Only versions of lines still in the schedule are published, so only those
  // need the (one request per version) release check.
  const activeMajors = new Set(
    schedule.filter(isActive).map((item) => item.version),
  );

  const versions = await filterReleased(
    allVersions.filter((version) => activeMajors.has(major(version))),
  );

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
