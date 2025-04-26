ARG UBUNTU_RELEASE=24.10

ARG TARGETOS

ARG TARGETARCH

ARG XZUTILS_VERSION=5.6.2-2ubuntu0.2

# set up node arch-specific stage requirements
FROM ubuntu:${UBUNTU_RELEASE} AS setup-pre-node
ARG XZUTILS_VERSION
RUN apt-get update \
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
# add node user, set uesr to node, and set workdir to home dir
FROM nvitaterna/chisel-nodejs-base:latest
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