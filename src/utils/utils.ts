import { NodeVersion } from '../nodejs/nodejs.js';
import { major } from 'semver';

const UBUNTU_RELEASE = '24.10';

interface DockerBuildArgs {
  nodeVersion: NodeVersion;
  platforms: string[];
}

export const formatDockerBuildString = ({
  nodeVersion,
  platforms,
}: DockerBuildArgs) => {
  let output = 'docker build ';
  if (platforms?.length) {
    output += `--platform ${platforms.join(',')} `;
  }
  output += `\
    --build-arg UBUNTU_RELEASE=${UBUNTU_RELEASE} \
    --build-arg NODE_VERSION=${nodeVersion.version} \
    --label "maintainer=Nicolas Vitaterna" \
    --label "description=NodeJS distroless image" \
    --label "node_version=${nodeVersion.version}"`;

  output += ` \
    -t nvitaterna/nodejs-distroless:${nodeVersion.version}`;

  if (nodeVersion.isLts) {
    output += ` -t nvitaterna/nodejs-distroless:lts`;
  }
  if (nodeVersion.isLatestMajor) {
    output += ` -t nvitaterna/nodejs-distroless:${major(nodeVersion.version)}`;
  }
  if (nodeVersion.isLatest) {
    output += ` -t nvitaterna/nodejs-distroless:latest`;
  }

  output += ' .';

  output += `\ndocker push nvitaterna/nodejs-distroless:${nodeVersion.version}`;
  if (nodeVersion.isLts) {
    output += `\ndocker push nvitaterna/nodejs-distroless:lts`;
  }
  if (nodeVersion.isLatestMajor) {
    output += `\ndocker push nvitaterna/nodejs-distroless:${major(nodeVersion.version)}`;
  }
  if (nodeVersion.isLatest) {
    output += `\ndocker push nvitaterna/nodejs-distroless:latest`;
  }

  return output;
};
