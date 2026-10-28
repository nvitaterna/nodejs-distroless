import { load } from 'cheerio';

export const NODEJS_VERSIONS_URL = 'https://nodejs.org/dist/';

/**
 * @returns a list of node.js versions from the nodejs.org downloads page.
 * This only returns versions that are v10 or higher in the format "x.y.z".
 */
export const fetchVersions = async () => {
  const response = await fetch(NODEJS_VERSIONS_URL);

  const $ = load(await response.text());

  const versions = Array.from($('a'))
    .map((element) => {
      return $(element).text();
    })
    .filter((version) => {
      return version.match(/^v[1-9].+?\/$/);
    })
    .map((version) => {
      return version.replace('/', '').replace('v', '');
    });

  return versions;
};
