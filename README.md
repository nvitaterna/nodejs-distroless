# nodejs-distroless

**Distroless Node.js Docker images, built from Ubuntu LTS with Canonical's Chisel**

[![Docker Pulls](https://img.shields.io/docker/pulls/nvitaterna/nodejs-distroless)](https://hub.docker.com/r/nvitaterna/nodejs-distroless)
[![Image size](https://img.shields.io/docker/image-size/nvitaterna/nodejs-distroless/lts?label=size%20(lts))](https://hub.docker.com/r/nvitaterna/nodejs-distroless/tags)
[![Latest version](https://img.shields.io/docker/v/nvitaterna/nodejs-distroless/latest?label=latest)](https://hub.docker.com/r/nvitaterna/nodejs-distroless/tags)
[![Publish](https://github.com/nvitaterna/nodejs-distroless/actions/workflows/publish.yml/badge.svg)](https://github.com/nvitaterna/nodejs-distroless/actions/workflows/publish.yml)
[![License](https://img.shields.io/github/license/nvitaterna/nodejs-distroless)](LICENSE)

---

## Overview

`nodejs-distroless` provides minimal, production-ready Docker images for running Node.js applications. Each image contains the official Node.js binary and only the runtime libraries it needs, cut from Ubuntu LTS with [Canonical's Chisel](https://github.com/canonical/chisel) and inspired by Google's distroless approach. There is no shell, no package manager and no unnecessary OS files, which keeps the images small and the attack surface low.

Images are published for `linux/amd64` and `linux/arm64` to:

- Docker Hub: [`nvitaterna/nodejs-distroless`](https://hub.docker.com/r/nvitaterna/nodejs-distroless)
- GitHub Container Registry: [`ghcr.io/nvitaterna/nodejs-distroless`](https://github.com/nvitaterna/nodejs-distroless/pkgs/container/nodejs-distroless)

Both carry the same tags and the same image digests. If Docker Hub's pull rate limits get in your way, pull from `ghcr.io` instead.

---

## Why?

**OS updates for every Node.js version, not just the newest one.**

Public distroless Node.js images, such as Google's distroless and Chainguard's free images, only keep the newest release up to date. Pin an exact Node.js version and that image is frozen the moment a newer patch ships: it never gets another OS or library security update.

Sometimes you cannot move to the newest patch right away, because of a regression, a compatibility test cycle or a release freeze. Here, every published version of every supported Node.js line is rebuilt whenever the Ubuntu base changes, so `22.15.0` keeps receiving the same OS fixes as `22.23.4`. You choose when to upgrade Node.js, without giving up OS patches in the meantime.

Because of this, exact-version tags are rebuilt and move to new digests over time. Pin by digest if you need a byte-for-byte reproducible image.

---

## Compared to other images

| | nodejs-distroless | [Google distroless](https://github.com/GoogleContainerTools/distroless) | [Chainguard](https://images.chainguard.dev/directory/image/node/overview) (free) | `node:*-alpine` | `node:*-slim` |
|---|---|---|---|---|---|
| Base | Ubuntu LTS (Chisel) | Debian | Wolfi | Alpine | Debian |
| libc | glibc | glibc | glibc | musl | glibc |
| Shell / package manager | No (`-debug` has BusyBox) | No (`:debug` has BusyBox) | No (`-dev` has both) | Yes | Yes |
| Runs as non-root by default | Yes | `:nonroot` tags | Yes | No | No |
| Node.js versions | every release of every supported line | newest of each supported line | newest only | every release | every release |
| OS updates for older Node.js versions | Yes, every version is rebuilt | No | No | No | No |
| Size, amd64 compressed | 55.0 MB | 60.3 MB | 66.1 MB | 62.9 MB | 85.7 MB |

Sizes are the download size of the Node.js 26 images for `linux/amd64` (Chainguard: `latest`, also 26.x), measured on 2026-11-04 with [`scripts/image-sizes.sh`](scripts/image-sizes.sh). Run it to get current numbers or other platforms:

```sh
scripts/image-sizes.sh                       # linux/amd64
scripts/image-sizes.sh --platform linux/arm64
scripts/image-sizes.sh node:22-slim nvitaterna/nodejs-distroless:22   # any images
```

Alpine uses musl, which some native addons and prebuilt binaries don't support. The Debian-based official images include a shell, package manager and many OS packages that a production container doesn't need, each one something to patch.

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

| Tag | Example | Points to |
|---|---|---|
| full version | `22.23.4` | that exact release |
| major.minor | `22.23` | newest patch of that minor |
| major | `22` | newest release of that line |
| `lts` | `lts` | newest release of the newest Active LTS line |
| `latest` | `latest` | newest release of the newest line, which may be a Current (non-LTS) line |

Every tag also has a [debug variant](#debugging) with a `-debug` suffix, e.g. `22-debug`, `lts-debug`, `latest-debug`.

For production, `lts` or a major tag such as `22` is usually the right choice: you get Node.js patches and OS updates without jumping to a new major. The full list of versions and their tags is in [`versions.json`](versions.json).

### Support and end of life

Which Node.js lines are published follows the official [Node.js release schedule](https://github.com/nodejs/release#release-schedule) ([schedule.json](https://github.com/nodejs/Release/blob/main/schedule.json)):

- **A line is added** when its first Current release ships, e.g. `26.0.0`. Alpha pre-releases are not published.
- **While a line is supported** (Current, Active LTS or Maintenance LTS), every new release is published, and every published version of it is rebuilt whenever the Ubuntu base changes.
- **On its end-of-life date**, the line is dropped from [`versions.json`](versions.json). Its images and tags (including the major tag, e.g. `20`) stay on Docker Hub and GHCR, but are never rebuilt or rescanned again, so they stop receiving OS security updates. `lts` and `latest` will already point to a newer line by then.

Plan to move off a line before its end-of-life date. The dates for every line are on the [Node.js releases page](https://nodejs.org/en/about/previous-releases).

---

## Usage

These images are for running pre-built applications. Use a multi-stage build: install and build in a standard Node.js image, then copy the result into the distroless image.

```Dockerfile
# Build stage: the same Node.js version as the runtime, so native addons
# are compiled against the right ABI
FROM node:22.23.4 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# skip this step if your app has no build script
RUN npm run build
RUN npm prune --omit=dev

# Production stage
FROM nvitaterna/nodejs-distroless:22.23.4
WORKDIR /home/node/app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
CMD ["dist/index.js"]
```

_Replace `dist` and `dist/index.js` with your app's build output and entry point._

Add a `.dockerignore` so `COPY . .` doesn't send your local `node_modules`, build output, `.git` or secrets to the build:

```
node_modules
dist
.git
.env*
```

**Notes:**

- The entrypoint is `node`, so `CMD` takes the arguments you would pass to `node`.
- The only user is `node` (uid 1000), with home directory `/home/node`. There is no root user to switch to, and you do not need a `USER` instruction.
- Copied files are owned by root and read-only to the app, which is usually what you want. If the app needs to write to a directory, create it in the build stage and copy it with `COPY --chown=node:node`.
- The image does not set `NODE_ENV`. Set it yourself (as above) if your app or its dependencies rely on it.
- The image includes CA certificates and timezone data.
- Use the same Node.js version in both stages. `node:22` and `nodejs-distroless:22` both track the newest 22.x but are updated at different times, so pinning the full version keeps them in step.

### Pinning by digest

Tags are rebuilt whenever the Ubuntu base changes (see [Why?](#why)). For a byte-for-byte reproducible build, pin the digest as well as the tag:

```sh
docker buildx imagetools inspect nvitaterna/nodejs-distroless:22.23.4 --format '{{.Manifest.Digest}}'
```

```Dockerfile
FROM nvitaterna/nodejs-distroless:22.23.4@sha256:<digest>
```

The tag is kept for readability; the digest decides what is pulled. It is the digest of the multi-arch manifest list, so the same line works on amd64 and arm64, and it is the same on Docker Hub and GHCR. [Renovate](https://docs.renovatebot.com/docker/#digest-pinning) and [Dependabot](https://docs.github.com/en/code-security/dependabot) can update pinned digests for you, so you still pick up base image updates, through reviewed PRs.

### Stopping cleanly (signals and PID 1)

The image has no init process, so `node` runs as PID 1. Linux does not apply the default action for `SIGTERM` or `SIGINT` to PID 1, so unless your app handles those signals itself, `docker stop` waits out its timeout (10 seconds by default) and then kills the container with `SIGKILL`. PID 1 is also responsible for reaping zombie child processes.

Google's distroless Node.js images behave the same way. Either:

- run with an init process: `docker run --init` or `init: true` in Docker Compose; or
- handle the signals in your app and shut down gracefully:

  ```js
  function shutdown() {
    // stop accepting connections; exit once in-flight requests finish
    server.close(() => process.exit(0));
    // don't let a slow request outlive the grace period and get SIGKILLed mid-write
    setTimeout(() => process.exit(1), 8000).unref();
  }
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
  ```

  Keep the timeout below the stop timeout: 10 seconds for `docker stop`, `terminationGracePeriodSeconds` (30 by default) in Kubernetes.

Kubernetes has no equivalent of `--init`, so in a pod, handling the signals in the app is the usual answer. [`shareProcessNamespace: true`](https://kubernetes.io/docs/tasks/configure-pod-container/share-process-namespace/) makes the pod's pause container PID 1 instead, but it also lets every container in the pod see the others' processes and, through `/proc`, their filesystems.

Handling the signals yourself is worth doing even with an init process, so in-flight requests can finish before the container exits.

To check, time a stop: it should take well under the timeout.

```sh
docker run -d --name app my-image && sleep 2 && time docker stop app
```

---

## Debugging

The images have no shell, so `docker exec -it <container> sh` does not work. Options, from least to most invasive:

**Run a one-off script with `node`.** The entrypoint is `node`, so you can inspect the filesystem or environment without a shell:

```sh
docker run --rm nvitaterna/nodejs-distroless:22 -e 'console.log(require("fs").readdirSync("/home/node"))'
docker exec <container> node -e 'console.log(process.env)'
```

**Attach a debugging container** that shares the target's namespaces, so you keep the production image unchanged:

```sh
# Kubernetes: an ephemeral container in the pod, sharing the app's process namespace
kubectl debug -it <pod> --image=busybox --target=<container> --profile=general
# Docker: a busybox container in the app container's PID and network namespaces
docker run --rm -it --pid=container:<container> --network=container:<container> --cap-add SYS_PTRACE busybox
```

Through the shared PID namespace, the app's filesystem is visible under `/proc/1/root/` (this needs `SYS_PTRACE`, which `--profile=general` and `--cap-add` grant). Docker Desktop's [`docker debug`](https://docs.docker.com/reference/cli/docker/debug/) does the same with one command.

**Use the `-debug` variant.** Every tag has a `-debug` counterpart (`22-debug`, `22.23.4-debug`, `latest-debug`, ...) that is the same image plus a statically linked [BusyBox](https://busybox.net/) shell and utilities in `/busybox`. The entrypoint is still `node`, so it is a drop-in replacement; override the entrypoint to get a shell:

```sh
docker run --rm -it --entrypoint sh nvitaterna/nodejs-distroless:22-debug
docker exec -it <container> sh   # in a container started from a -debug image
```

It runs as the `node` user like the regular image. If you need root, start it with `--user 0`. Use the debug variant for troubleshooting only, not in production: a shell is exactly what the regular image leaves out.

---

## Verifying images

Every published image is signed with [cosign](https://github.com/sigstore/cosign) (keyless, through the publish workflow's GitHub identity, logged in the public [Rekor](https://docs.sigstore.dev/logging/overview/) transparency log), and carries an SBOM and SLSA provenance generated by BuildKit.

**Check the signature** to confirm an image was built by this repository's publish workflow from `main`:

```sh
cosign verify nvitaterna/nodejs-distroless:22 \
  --certificate-identity https://github.com/nvitaterna/nodejs-distroless/.github/workflows/publish.yml@refs/heads/main \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

The same works for `ghcr.io/nvitaterna/nodejs-distroless`, and the per-arch images are signed too. To enforce this at deploy time, use an admission controller such as [Kyverno](https://kyverno.io/docs/writing-policies/verify-images/sigstore/) or the [Sigstore policy-controller](https://docs.sigstore.dev/policy-controller/overview/) with the same identity and issuer.

**Read the SBOM** (SPDX, every OS package and the Node.js binary) or the **build provenance** (source commit, build arguments, base images):

```sh
docker buildx imagetools inspect nvitaterna/nodejs-distroless:22 --format '{{json .SBOM}}'
docker buildx imagetools inspect nvitaterna/nodejs-distroless:22 --format '{{json .Provenance}}'
```

Both are keyed by platform. To save one platform's SBOM and scan it without pulling the image:

```sh
docker buildx imagetools inspect nvitaterna/nodejs-distroless:22 \
  --format '{{json (index .SBOM "linux/amd64").SPDX}}' > sbom.spdx.json
grype sbom:sbom.spdx.json
```

---

## Limitations

- No shell or package manager: you cannot `docker exec` into a container or install packages at runtime (see [Debugging](#debugging)).
- No `npm` or `npx`: all dependencies must be installed at build time and copied in.
- Cannot run as root or perform privileged operations.
- Only maintenance, LTS and current Node.js lines receive updates; see [Support and end of life](#support-and-end-of-life).

---

## How it is built

Everything lives in this repository and runs without manual steps:

| Part | Where | What it does |
|---|---|---|
| Chisel base | `Dockerfile` (`base` stage) | Builds Chisel and cuts the runtime rootfs (CA certificates, tzdata, libstdc++, libatomic1) from Ubuntu LTS; adds the `node` user. |
| Node.js layer | `Dockerfile` (`release` stage) | Downloads the official Node.js tarball, verifies it against nodejs.org's `SHASUMS256.txt`, and copies `node` onto the base. |
| Debug variant | `Dockerfile` (`debug-tools` and `debug` stages) | Cuts `busybox-static` with Chisel (so scanners see it in the dpkg status) and layers it over the release image, with its applets in `/busybox`. |
| Version list | `versions.json`, kept current by `tools/version-info/` | The hourly `get-new-versions` workflow runs the tool and commits any new versions. |
| Publishing | `.github/workflows/publish.yml` | On every change to `main`: builds the base once per arch, builds and smoke-tests each version on it, then pushes annotated manifest lists to Docker Hub and GHCR and signs them with cosign. A base change republishes every version; a version list change publishes only the new ones. The last published commit is recorded on the orphan `published` branch. |
| Tarball cache | `.github/actions/node-dist` | Keeps each Node.js tarball on the `node-dist` GitHub release so builds do not depend on nodejs.org being fast. |
| Vulnerability scans | `.github/workflows/pr-build-and-test.yml`, `.github/workflows/scan-images.yml` | Every PR-built image is scanned with Grype and fails on fixable High/Critical findings. The newest image of each line is rescanned daily and the results go to the repository's Security tab. |
| Updates | `renovate.json` | Ubuntu LTS, Chisel release, apt packages, GitHub Actions and the tool's npm dependencies. Non-major updates merge automatically once checks pass; majors wait for review. |

Pull requests build the oldest and newest version of each major line on both architectures, in both variants, and run `test/check.js` inside the image. They also install [sharp](https://sharp.pixelplumbing.com/) and [bcrypt](https://github.com/kelektiv/node.bcrypt.js) with `npm ci` in the matching `node:<version>` image and load them in the distroless one (`test/native-addons/`), checking that the native binaries, not a WebAssembly fallback, load and work, to catch missing shared libraries or a libc or architecture mismatch.

### Building locally

```sh
docker build --build-arg NODE_VERSION=22.23.4 -t nodejs-distroless:22.23.4 .
docker run --rm nodejs-distroless:22.23.4 --version

# the debug variant
docker build --target debug --build-arg NODE_VERSION=22.23.4 -t nodejs-distroless:22.23.4-debug .
```

The build downloads Node.js from nodejs.org and verifies its checksum. Set `NODE_DIST_URL` to download the tarball from elsewhere.

---

## References

- Inspired by [GoogleContainerTools/distroless](https://github.com/GoogleContainerTools/distroless)
- Built with [Canonical Chisel](https://github.com/canonical/chisel) and [chisel-releases](https://github.com/canonical/chisel-releases)

---

## License

The code in this repository (the Dockerfile, workflows and tools) is licensed under the [MIT License](LICENSE).

The published images also contain third-party software under its own licenses: Node.js (license at `/usr/LICENSE` in the image) and Ubuntu packages (copyright files under `/usr/share/doc/`).

---

## Getting help and contributing

- Questions, bugs and feature requests: [open an issue](https://github.com/nvitaterna/nodejs-distroless/issues/new/choose).
- Security vulnerabilities: report them privately, see [SECURITY.md](SECURITY.md).
- Contributions are welcome, see [CONTRIBUTING.md](CONTRIBUTING.md).
