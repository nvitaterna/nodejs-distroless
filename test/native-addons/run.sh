#!/usr/bin/env bash
# Installs native addons (sharp, bcrypt) with npm ci in the official
# node:<version> image, the way the README's multi-stage build does, then
# loads and exercises them in the distroless image.
#
# Both are built on N-API, so one prebuilt binary works on every Node.js
# version and any failure here points at the image, not at the addon.
#
# usage: test/native-addons/run.sh <image> <node version> [platform]
#   test/native-addons/run.sh nvitaterna/nodejs-distroless:22.23.4 22.23.4 linux/arm64
set -euo pipefail

image=$1
version=$2
platform=${3:-}
dir=$(cd "$(dirname "$0")" && pwd)
addons=(sharp bcrypt)
platform_args=()
[[ -n "$platform" ]] && platform_args=(--platform "$platform")

# a volume rather than a bind mount: npm runs as root in the build container,
# and root-owned files in the checkout would be left behind on the host
volume=$(docker volume create)
trap 'docker volume rm "$volume" > /dev/null' EXIT

# the official image for a new Node.js release lands on Docker Hub hours to
# days after the release, while the PR adding the version here opens right
# away; until then, install with the newest official image of the same major.
# The addons are N-API prebuilts, so the builder's exact version doesn't matter
builder="node:$version"
if ! docker pull -q "${platform_args[@]}" "$builder" > /dev/null; then
  builder="node:${version%%.*}"
  echo "::warning::node:$version is not on Docker Hub yet, installing addons with $builder"
  docker pull -q "${platform_args[@]}" "$builder" > /dev/null
fi

docker run --rm "${platform_args[@]}" \
  -v "$dir:/src:ro" -v "$volume:/app" -w /app -e NPM_CONFIG_UPDATE_NOTIFIER=false \
  "$builder" \
  sh -c 'cp /src/package.json /src/package-lock.json /src/check.js . && npm ci --omit=dev --no-audit --no-fund --loglevel=error'

failed=()
for addon in "${addons[@]}"; do
  echo "== $addon"
  if ! docker run --rm "${platform_args[@]}" \
    -v "$volume:/home/node/app:ro" -w /home/node/app \
    "$image" check.js "$addon"; then
    echo "::error::$addon fails in $image${platform:+ ($platform)}"
    failed+=("$addon")
  fi
done

if (( ${#failed[@]} )); then
  exit 1
fi
