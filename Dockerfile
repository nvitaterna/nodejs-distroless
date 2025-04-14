ARG UBUNTU_RELEASE=24.10

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
WORKDIR /download
RUN ARCH=$(echo $TARGETPLATFORM | grep -Po "\/.*" | tr -d "/" | awk '{sub(/amd/,"x")} 1') \
  && wget "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${ARCH}.tar.xz" \
  && tar --strip-components=2 -xf node-v${NODE_VERSION}-linux-${ARCH}.tar.xz node-v${NODE_VERSION}-linux-${ARCH}/bin/node

FROM scratch
COPY --from=installer [ "/staging/", "/" ]
COPY --from=downloader \
  /download/node \
  /usr/bin/
COPY <<EOF /etc/passwd
node:x:1000:1000:node:/home/node:/bin/bash
EOF
COPY <<EOF /etc/group
node:x:1000:
EOF
USER node
ENTRYPOINT ["/usr/bin/node"]