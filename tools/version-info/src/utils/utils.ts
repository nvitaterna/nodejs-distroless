import { gt, lt } from 'semver';
import { ScheduleItem } from '../scheduled-version/schedule.schema.js';

const now = new Date();

now.setHours(0, 0, 0, 0);

// only using one date in the extremely rare case that this runs at midnight
export const getNowMilli = () => {
  return now.getTime();
};

export const getTimeMilli = (dateString: string) => {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const sortVersions = (a: string, b: string) => {
  if (gt(a, b)) {
    return -1;
  } else if (lt(a, b)) {
    return 1;
  }
  return 0;
};

export const isLts = (scheduleItem: ScheduleItem) => {
  if (!scheduleItem.lts) {
    return false;
  }

  const ltsDate = getTimeMilli(scheduleItem.lts);

  if (ltsDate > now.getTime()) {
    return false;
  }

  return true;
};

/**
 * A line is published from its first Current release (`start`) until its end
 * of life. Before `start` a line only has Alpha pre-releases (Node.js 27+),
 * which are not for production use.
 */
export const isActive = (scheduleItem: ScheduleItem) => {
  return (
    getTimeMilli(scheduleItem.start) <= getNowMilli() &&
    getTimeMilli(scheduleItem.end) > getNowMilli()
  );
};
