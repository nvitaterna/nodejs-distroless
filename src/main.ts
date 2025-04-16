import { getNodeVersions } from './nodejs/nodejs.js';
import { formatDockerBuildString } from './utils/utils.js';

import fs from 'fs/promises';

export const main = async (
  minNodeVersion?: string,
  maxNodeVersion?: string,
  platforms: string[] = [],
  outputFile = './.docker/build-all.sh'
) => {
  const nodeVersions = await getNodeVersions(minNodeVersion, maxNodeVersion);

  const dockerBuildStrings = nodeVersions.map((nodeVersion) => {
    return {
      ...nodeVersion,
      buildString: formatDockerBuildString({
        nodeVersion,
        platforms,
      }),
    };
  });

  let output = `#!/bin/bash

exit_on_int(){
  exit 0
}
trap 'exit_on_int' SIGINT\n\n`;

  output += dockerBuildStrings
    .map((nodeVersion) => {
      return `#----- node v${nodeVersion.version}-----#\n${nodeVersion.buildString}`;
    })
    .join('\n\n\n');

  await fs.writeFile(outputFile, output);

  await fs.chmod(outputFile, '755');
};
