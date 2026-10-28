import { major, minor } from 'semver';
import { ScheduleItem } from './schedule.schema.js';
import { getNowMilli, getTimeMilli, sortVersions } from '../utils/utils.js';

export class ScheduledVersion {
  readonly versions: string[];

  readonly isLatest: boolean;

  readonly isActive: boolean;

  constructor(
    private readonly scheduleItem: ScheduleItem,
    private readonly isLts: boolean,
    versions: string[],
  ) {
    this.versions = versions
      .filter((version) => {
        return major(version) === scheduleItem.version;
      })
      .sort(sortVersions);

    this.isLatest = versions.sort(sortVersions)[0] === this.versions[0];

    this.isActive = getTimeMilli(scheduleItem.end) > getNowMilli();
  }

  public mapVersionList() {
    return this.versions.map((version) => {
      const tags = [version];

      const isLatestOfMajor = this.versionIsLatestOfMajor(version);
      const isLatestOfMinor = this.versionIsLatestOfMinor(version);

      if (isLatestOfMajor) {
        tags.push(major(version).toString());
      }

      if (this.isLts && isLatestOfMajor) {
        tags.push('lts');
      }

      if (this.isLatest && isLatestOfMajor) {
        tags.push('latest');
      }

      if (isLatestOfMinor) {
        tags.push(`${major(version)}.${minor(version)}`);
      }

      return {
        version,
        tags,
      };
    });
  }

  private versionIsLatestOfMajor(version: string): boolean {
    return version === this.versions[0];
  }

  private versionIsLatestOfMinor(version: string): boolean {
    const minorVersions = this.versions.filter((v) => {
      return minor(v) === minor(version);
    });

    return version === minorVersions[0];
  }
}
