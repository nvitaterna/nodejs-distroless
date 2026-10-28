ARG UBUNTU_TAG="26.04@sha256:0e73b71479e7bc5f006bca872e25c3cd680dc052a0116f90d63ae363537db0dd"

ARG TARGETOS
ARG TARGETARCH

###############################################################################
# chisel base: the runtime dependencies node needs, cut from Ubuntu with
# Canonical's chisel (no shell, no package manager)
###############################################################################
FROM ubuntu:${UBUNTU_TAG} AS setup-base
ARG TARGETARCH

# renovate-chisel: depName=canonical-chisel-releases
ARG UBUNTU_CHISEL_VERSION="26.04"

# renovate-apt-docker: arch=amd64 versioning=loose depName=golang
ARG GOLANG_amd64_VERSION="2:1.26~1"
# renovate-apt-docker: arch=arm64 versioning=loose depName=golang
ARG GOLANG_arm64_VERSION="2:1.26~1"

# renovate-apt-docker: arch=amd64 versioning=loose depName=ca-certificates
ARG CACERTIFICATES_amd64_VERSION="20260816ubuntu0.26.04.1"
# renovate-apt-docker: arch=arm64 versioning=loose depName=ca-certificates
ARG CACERTIFICATES_arm64_VERSION="20260816ubuntu0.26.04.1"

# renovate-apt-docker: arch=amd64 versioning=loose depName=file
ARG FILE_amd64_VERSION="1:5.46-5build2"
# renovate-apt-docker: arch=arm64 versioning=loose depName=file
ARG FILE_arm64_VERSION="1:5.46-5build2"

# renovate-apt-docker: arch=amd64 versioning=loose depName=libatomic1
ARG LIBATOMIC_amd64_VERSION="16-20260322-1ubuntu1"
# renovate-apt-docker: arch=arm64 versioning=loose depName=libatomic1
ARG LIBATOMIC_arm64_VERSION="16-20260322-1ubuntu1"

# install dependencies
RUN GOLANG_VERSION=$(eval "echo \$GOLANG_${TARGETARCH}_VERSION") \
  && CACERTIFICATES_VERSION=$(eval "echo \$CACERTIFICATES_${TARGETARCH}_VERSION") \
  && FILE_VERSION=$(eval "echo \$FILE_${TARGETARCH}_VERSION") \
  && LIBATOMIC_VERSION=$(eval "echo \$LIBATOMIC_${TARGETARCH}_VERSION") \
  && apt-get update \
  -q \
  && apt-get install \
  -y \
  --no-install-recommends \
  golang=$GOLANG_VERSION \
  ca-certificates=$CACERTIFICATES_VERSION \
  file=${FILE_VERSION} \
  libatomic1=$LIBATOMIC_VERSION

# build chisel
WORKDIR /builder
ADD https://github.com/canonical/chisel.git .
WORKDIR /builder/cmd/chisel
RUN go install
RUN ln -sf /root/go/bin/chisel /usr/bin/chisel

# create chiseled rootfs
WORKDIR /setup
ADD https://github.com/canonical/rocks-toolbox.git .
RUN mkdir -p /rootfs/var/lib/dpkg \
  && ./chisel-wrapper \
  --generate-dpkg-status /rootfs/var/lib/dpkg/status \
  -- \
  --release ubuntu-${UBUNTU_CHISEL_VERSION} \
  --root /rootfs/ \
  ca-certificates_data \
  tzdata_zoneinfo \
  libstdc++6_libs \
  base-files_release-info \
  base-files_base \
  libatomic1_libs

# the chiseled rootfs plus the node user; CI builds this stage once per arch
# and passes it to every version build with --build-context base=...
FROM scratch AS base
COPY --from=setup-base /rootfs /
COPY <<EOF /etc/passwd
node:x:1000:1000:node:/home/node:
EOF
COPY <<EOF /etc/group
node:x:1000:
EOF
USER node
WORKDIR /home/node

###############################################################################
# node: download the official binary for the target arch
###############################################################################
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

# the tarball is checked against nodejs.org's checksums wherever it is downloaded from:
# CI passes NODE_DIST_URL pointing at this repo's "node-dist" release cache
# (see .github/actions/node-dist), local builds default to nodejs.org

# node amd64/x64
FROM setup-pre-node AS setup-node-linux-amd64
ARG NODE_VERSION
ARG NODE_DIST_URL="https://nodejs.org/dist/v${NODE_VERSION}"
ENV ARCH=x64
ADD "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt" .
ADD "${NODE_DIST_URL}/node-v${NODE_VERSION}-linux-${ARCH}.tar.xz" .
RUN grep " node-v${NODE_VERSION}-linux-${ARCH}.tar.xz$" SHASUMS256.txt | sha256sum -c - \
  && tar --strip-components=1 -xf node-v${NODE_VERSION}-linux-${ARCH}.tar.xz \
  -C ./rootfs/usr/ \
  node-v${NODE_VERSION}-linux-${ARCH}/bin/node \
  node-v${NODE_VERSION}-linux-${ARCH}/LICENSE \
  node-v${NODE_VERSION}-linux-${ARCH}/share


# node arm64/arm64
FROM setup-pre-node AS setup-node-linux-arm64
ARG NODE_VERSION
ARG NODE_DIST_URL="https://nodejs.org/dist/v${NODE_VERSION}"
ENV ARCH=arm64
ADD "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt" .
ADD "${NODE_DIST_URL}/node-v${NODE_VERSION}-linux-${ARCH}.tar.xz" .
RUN grep " node-v${NODE_VERSION}-linux-${ARCH}.tar.xz$" SHASUMS256.txt | sha256sum -c - \
  && tar --strip-components=1 -xf node-v${NODE_VERSION}-linux-${ARCH}.tar.xz \
  -C ./rootfs/usr/ \
  node-v${NODE_VERSION}-linux-${ARCH}/bin/node \
  node-v${NODE_VERSION}-linux-${ARCH}/LICENSE \
  node-v${NODE_VERSION}-linux-${ARCH}/share

# cant seem to do --from=setup-node-${TARGETOS}-${TARGETARCH} so we rename the stage here
FROM setup-node-${TARGETOS}-${TARGETARCH} AS compiled

###############################################################################
# final image: node on top of the chisel base
###############################################################################
FROM base
COPY --from=compiled \
  /download/rootfs/ \
  /
ENTRYPOINT ["/usr/bin/node"]
