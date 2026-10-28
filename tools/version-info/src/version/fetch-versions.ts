import { z } from 'zod';

export const NODEJS_VERSIONS_URL = 'https://nodejs.org/dist/';
export const NODEJS_INDEX_URL = `${NODEJS_VERSIONS_URL}index.json`;

/** The tarballs the image build needs. */
export const REQUIRED_FILES = ['linux-x64', 'linux-arm64'];

const indexSchema = z.array(
  z.object({
    version: z.string(),
    files: z.array(z.string()),
  }),
);

/**
 * @returns a list of node.js versions from nodejs.org's release index.
 * This only returns versions that are v1 or higher in the format "x.y.z" and
 * that ship the tarballs the image build needs.
 */
export const fetchVersions = async () => {
  const response = await fetch(NODEJS_INDEX_URL);

  if (!response.ok) {
    throw new Error(`GET ${NODEJS_INDEX_URL} failed: ${response.status}`);
  }

  const index = indexSchema.parse(await response.json());

  return index
    .filter((release) => {
      return (
        /^v[1-9]/.test(release.version) &&
        REQUIRED_FILES.every((file) => release.files.includes(file))
      );
    })
    .map((release) => release.version.replace(/^v/, ''));
};
