import { NODEJS_VERSIONS_URL } from './fetch-versions.js';

export const shasumsUrl = (version: string) =>
  `${NODEJS_VERSIONS_URL}v${version}/SHASUMS256.txt`;

/**
 * A version directory shows up on nodejs.org/dist before the release is
 * complete: the tarballs land first and SHASUMS256.txt last. The image build
 * verifies the tarball against that file, so a version only counts as
 * released once it exists.
 */
export const isReleased = async (version: string) => {
  const response = await fetch(shasumsUrl(version), { method: 'HEAD' });
  return response.ok;
};

/**
 * @returns the subset of `versions` whose release is complete, in the same
 * order. Versions are checked a few at a time to be polite to nodejs.org.
 */
export const filterReleased = async (versions: string[], concurrency = 8) => {
  const released = new Array<boolean>(versions.length);
  let next = 0;

  const worker = async () => {
    while (next < versions.length) {
      const index = next++;
      released[index] = await isReleased(versions[index]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, versions.length) }, worker),
  );

  return versions.filter((_, index) => released[index]);
};
