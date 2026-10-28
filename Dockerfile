ARG UBUNTU_TAG="26.04@sha256:0e73b71479e7bc5f006bca872e25c3cd680dc052a0116f90d63ae363537db0dd"

ARG TARGETOS
ARG TARGETARCH

# set up node arch-specific stage requirements
FROM ubuntu:${UBUNTU_TAG} AS setup-pre-node
ARG TARGETARCH

# renovate-apt-docker: arch=amd64 versioning=loose depName=xz-utils
ARG XZUTILS_amd64_VERSION="5.8.3-1ubuntu0.1"
# renovate-apt-docker: arch=arm64 versioning=loose depName=xz-utils
ARG XZUTILS_arm64_VERSION="5.8.3-1ubuntu0.1"

RUN XZUTILS_VERSION=$(eval "echo \$XZUTILS_${TARGETARCH}_VERSION") \
  && apt-get update \
  -q \
  && apt-get install \
  -y \
  --no-install-recommends \
  xz-utils=${XZUTILS_VERSION}
WORKDIR /download
RUN mkdir -p /download/rootfs/usr

# node amd64/x64
FROM setup-pre-node AS setup-node-linux-amd64
ARG NODE_VERSION
ENV ARCH=x64
ADD "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${ARCH}.tar.xz" .
RUN tar --strip-components=1 -xf node-v${NODE_VERSION}-linux-${ARCH}.tar.xz \
  -C ./rootfs/usr/ \
  node-v${NODE_VERSION}-linux-${ARCH}/bin/node \
  node-v${NODE_VERSION}-linux-${ARCH}/LICENSE \
  node-v${NODE_VERSION}-linux-${ARCH}/share 


# node arm64/arm64
FROM setup-pre-node AS setup-node-linux-arm64
ARG NODE_VERSION
ENV ARCH=arm64
ADD "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${ARCH}.tar.xz" .
RUN tar --strip-components=1 -xf node-v${NODE_VERSION}-linux-${ARCH}.tar.xz \
  -C ./rootfs/usr/ \
  node-v${NODE_VERSION}-linux-${ARCH}/bin/node \
  node-v${NODE_VERSION}-linux-${ARCH}/LICENSE \
  node-v${NODE_VERSION}-linux-${ARCH}/share 

# cant seem to do --from=setup-node-${TARGETOS}-${TARGETARCH} so we rename the stage here
FROM setup-node-${TARGETOS}-${TARGETARCH} AS compiled

# use the base chisel nodejs image that contains dependencies for the final image
# combine the rootfs from chisel along with the rootfs from the compiled node stages
# add node user, set user to node, and set workdir to home dir
FROM nvitaterna/chisel-nodejs-base:latest@sha256:c4f52e8c6bbccd5ea759e7f6de52e05d340469e74ef1e4184cac9ff215b2a975
COPY --from=compiled \
  /download/rootfs/ \
  /
WORKDIR /home
COPY <<EOF /etc/passwd
node:x:1000:1000:node:/home/node:
EOF
COPY <<EOF /etc/group
node:x:1000:
EOF
USER node
WORKDIR /home/node
ENTRYPOINT ["/usr/bin/node"]