ARG UBUNTU_RELEASE=24.10
ARG WITH_NPM=false

FROM ubuntu:${UBUNTU_RELEASE} AS chisel-builder
RUN apt-get update && apt-get install -y golang ca-certificates
RUN go install github.com/canonical/chisel/cmd/chisel@latest

FROM ubuntu:${UBUNTU_RELEASE} AS chisel-installer
RUN apt-get update && apt-get install -y ca-certificates
COPY --from=chisel-builder /root/go/bin/chisel /usr/bin
WORKDIR /rootfs
RUN chisel cut --root /rootfs libc6_libs ca-certificates_data bash_bins

FROM scratch AS chisel
COPY --from=chisel-installer ["/rootfs", "/"]
COPY --from=chisel-builder /root/go/bin/chisel /usr/bin/chisel

FROM chisel AS installer
ARG UBUNTU_RELEASE
WORKDIR /staging
SHELL ["/usr/bin/bash", "-c"]
RUN chisel cut \
  --release ubuntu-${UBUNTU_RELEASE} \
  --root /staging/ \
  ca-certificates_data \
  libstdc++6_libs

FROM ubuntu:${UBUNTU_RELEASE} AS downloader
RUN apt update -y && apt install -y wget xz-utils
ARG NODE_VERSION
ARG TARGETPLATFORM
ARG WITH_NPM
WORKDIR /download
RUN mkdir usr
RUN ARCH=$(echo $TARGETPLATFORM | grep -Po "\/.*" | tr -d "/" | awk '{sub(/amd/,"x")} 1') \
  && wget "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${ARCH}.tar.xz" \
  && tar --strip-components=1 -xf node-v${NODE_VERSION}-linux-${ARCH}.tar.xz \
  -C ./usr/ \
  node-v${NODE_VERSION}-linux-${ARCH}/bin/node \
  && bash -c "[[ \"$WITH_NPM\" == \"true\" ]]" \
  &&  tar --strip-components=1 -xf node-v${NODE_VERSION}-linux-${ARCH}.tar.xz \
  -C ./usr/ \
  node-v${NODE_VERSION}-linux-${ARCH}/bin/npm \
  node-v${NODE_VERSION}-linux-${ARCH}/lib/node_modules/npm/bin \
  node-v${NODE_VERSION}-linux-${ARCH}/lib/node_modules/npm/lib \
  node-v${NODE_VERSION}-linux-${ARCH}/lib/node_modules/npm/node_modules \
  node-v${NODE_VERSION}-linux-${ARCH}/lib/node_modules/npm/index.js \
  node-v${NODE_VERSION}-linux-${ARCH}/lib/node_modules/npm/package.json \
  && sed -i -e 's/env node/node/' usr/lib/node_modules/npm/bin/npm-cli.js \
  || true

FROM scratch
COPY --from=installer [ "/staging/", "/" ]
COPY --from=downloader \
  /download/usr \
  /usr/
COPY <<EOF /etc/passwd
node:x:1000:1000:node::
EOF
COPY <<EOF /etc/group
node:x:1000:
EOF
USER node
ENTRYPOINT ["/usr/bin/node"]