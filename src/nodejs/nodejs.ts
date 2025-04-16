import * as cheerio from 'cheerio';
import { gte, lte, major, rsort, sort } from 'semver';
import { z } from 'zod';

export interface NodeVersion {
  version: string;
  isLts: boolean;
  isLatestMajor: boolean;
  isLatest: boolean;
}

const nodeScheduleSchema = z.record(
  z.string(),
  z.object({
    start: z.string(),
    end: z.string(),
    lts: z.string().optional(),
    maintenance: z.string().optional(),
  })
);

const getNodeSchedule = async () => {
  const response = await fetch(
    'https://raw.githubusercontent.com/nodejs/Release/refs/heads/main/schedule.json'
  );

  const data = nodeScheduleSchema.parse(await response.json());

  return Object.entries(data)
    .filter(([version]) => !version.includes('.'))
    .map(([version, { start, end, lts, maintenance }]) => {
      return {
        start,
        end,
        version: parseInt(version.replace('v', '')),
        lts,
        maintenance,
      };
    });
};

const getLatestLtsVersion = async (nodeVersions: string[]) => {
  const scheduledVersions = await getNodeSchedule();
  // Get the current date
  const currentDate = new Date().toISOString().split('T')[0];

  // Filter scheduled versions to find valid LTS versions based on the date
  const validLTSVersions = scheduledVersions
    .filter(({ lts }) => lts && lts <= currentDate) // Ensure LTS date is in the past or today
    .sort((a, b) => b.version - a.version); // Sort by version descending

  if (validLTSVersions.length === 0) {
    throw new Error('No valid LTS versions found.');
  }

  // Get the latest valid LTS entry
  const latestLTS = validLTSVersions[0];

  // Find the latest version in the nodeVersions array that matches the major version of the latest LTS
  const latestLTSVersion = rsort([...nodeVersions]).find((version) => {
    return major(version) === latestLTS.version;
  });

  return latestLTSVersion || null; // Return null if no matching version is found
};

export const getNodeVersions = async (
  minVersion?: string,
  maxVersion?: string
): Promise<NodeVersion[]> => {
  const response = await fetch('https://nodejs.org/dist/');

  const $ = cheerio.load(await response.text());

  let versions = Array.from($('a'))
    .filter((element) => {
      return $(element).text().startsWith('v');
    })
    .map((element) => {
      const versionName = $(element).text();
      return versionName.split('v')[1].replace('/', '');
    });

  // sort by lowest to highest, so newer versions get pushed last
  versions = sort(versions);

  if (minVersion) {
    versions = versions.filter((version) => {
      return gte(version, minVersion);
    });
  }

  if (maxVersion) {
    versions = versions.filter((version) => {
      return lte(version, maxVersion);
    });
  }

  const latestVersionsByMajor = Object.values(
    versions.reduce(
      (acc, version) => {
        const majorVersion = major(version).toString();
        if (!acc[majorVersion] || gte(version, acc[majorVersion])) {
          acc[majorVersion] = version;
        }
        return acc;
      },
      {} as Record<string, string>
    )
  );

  const latestLtsVersion = await getLatestLtsVersion(versions);
  const latestVersion = rsort([...versions])[0];

  return versions.map((version) => {
    return {
      version,
      isLts: version === latestLtsVersion,
      isLatestMajor: latestVersionsByMajor.includes(version),
      isLatest: version === latestVersion,
    };
  });
};
