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

docker run --rm "${platform_args[@]}" \
  -v "$dir:/src:ro" -v "$volume:/app" -w /app -e NPM_CONFIG_UPDATE_NOTIFIER=false \
  "node:$version" \
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
