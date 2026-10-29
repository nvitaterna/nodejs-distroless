# nodejs-distroless

**Distroless Node.js Docker images, built from Ubuntu LTS with Canonical's Chisel**

---

## Overview

`nodejs-distroless` provides minimal, production-ready Docker images for running Node.js applications. Each image contains the official Node.js binary and only the runtime libraries it needs, cut from Ubuntu LTS with [Canonical's Chisel](https://github.com/canonical/chisel) and inspired by Google's distroless approach. There is no shell, no package manager and no unnecessary OS files, which keeps the images small and the attack surface low.

Images are published to Docker Hub as [`nvitaterna/nodejs-distroless`](https://hub.docker.com/r/nvitaterna/nodejs-distroless) for `linux/amd64` and `linux/arm64`.

---

## Features

- Runs only as the non-root `node` user.
- Only the Node.js runtime and the libraries it needs: no shell, no package manager.
- Built from Ubuntu LTS with Chisel; the base is rebuilt and all images republished whenever it changes.
- New Node.js releases are detected and published automatically, usually within the hour.
- Multi-arch: `linux/amd64` and `linux/arm64`.

---

## Tags

Every maintenance, LTS and current Node.js release line is published, tagged by:

- full version, e.g. `22.23.4`
- major.minor, e.g. `22.23` (newest patch of that line)
- major, e.g. `22` (newest release of that line)
- `latest` (newest release of the newest line)

Images for Node.js lines that have reached end of life stay on Docker Hub but are not rebuilt, so they stop receiving base image updates.

---

## Usage

These images are for running pre-built applications. Use a multi-stage build: install and build in a standard Node.js image, then copy the result into the distroless image.

```Dockerfile
# Build stage
FROM node:22 AS build
WORKDIR /app
COPY . .
RUN npm ci --omit=dev

# Production stage
FROM nvitaterna/nodejs-distroless:22
WORKDIR /home/node/app
COPY --from=build /app /home/node/app
CMD ["index.js"]
```

_Replace `index.js` with your app's entry point._

**Notes:**

- The entrypoint is `node`, so `CMD` takes the arguments you would pass to `node`.
- The only user is `node` (uid 1000), with home directory `/home/node`. There is no root user to switch to, and you do not need a `USER` instruction.
- The image includes CA certificates and timezone data.

---

## Limitations

- No shell or package manager: you cannot `docker exec` into a container or install packages at runtime.
- No `npm` or `npx`: all dependencies must be installed at build time and copied in.
- Cannot run as root or perform privileged operations.
- Only maintenance, LTS and current Node.js lines receive updates; see [Tags](#tags).

---

## How it is built

Everything lives in this repository and runs without manual steps:

| Part | Where | What it does |
|---|---|---|
| Chisel base | `Dockerfile` (`base` stage) | Builds Chisel and cuts the runtime rootfs (CA certificates, tzdata, libstdc++, libatomic1) from Ubuntu LTS; adds the `node` user. |
| Node.js layer | `Dockerfile` (node stages) | Downloads the official Node.js tarball, verifies it against nodejs.org's `SHASUMS256.txt`, and copies `node` onto the base. |
| Version list | `versions.json`, kept current by `tools/version-info/` | The hourly `get-new-versions` workflow runs the tool and commits any new versions. |
| Publishing | `.github/workflows/publish.yml` | On every change to `main`: builds the base once per arch, builds and smoke-tests each version on it, then pushes manifest lists. A base change republishes every version; a version list change publishes only the new ones. |
| Tarball cache | `.github/actions/node-dist` | Keeps each Node.js tarball on the `node-dist` GitHub release so builds do not depend on nodejs.org being fast. |
| Vulnerability scans | `.github/workflows/pr-build-and-test.yml`, `.github/workflows/scan-images.yml` | Every PR-built image is scanned with Grype and fails on fixable High/Critical findings. The newest image of each line is rescanned weekly and the results go to the repository's Security tab. |
| Updates | `renovate.json` | Ubuntu LTS, Chisel release, apt packages, GitHub Actions and the tool's npm dependencies. Non-major updates merge automatically once checks pass; majors wait for review. |

Pull requests build the oldest and newest version of each major line on both architectures and run `test/check.js` inside the image.

### Building locally

```sh
docker build --build-arg NODE_VERSION=22.23.4 -t nodejs-distroless:22.23.4 .
docker run --rm nodejs-distroless:22.23.4 --version
```

The build downloads Node.js from nodejs.org and verifies its checksum. Set `NODE_DIST_URL` to download the tarball from elsewhere.

---

## References

- Inspired by [GoogleContainerTools/distroless](https://github.com/GoogleContainerTools/distroless)
- Built with [Canonical Chisel](https://github.com/canonical/chisel) and [chisel-releases](https://github.com/canonical/chisel-releases)

---

**Contact:**  
For questions or support, open an issue on the [GitHub repository](https://github.com/nvitaterna/nodejs-distroless).
