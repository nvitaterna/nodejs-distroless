#!/usr/bin/env bash
# Installs native addons (sharp, better-sqlite3) with npm ci in the official
# node:<version> image, the way the README's multi-stage build does, then
# loads and exercises them in the distroless image.
#
# Each addon is first run in node:<version> itself. If it fails there, the
# addon does not work on that Node.js release at all (e.g. better-sqlite3 13
# crashes on 22.0.0), which says nothing about this image, so it is skipped
# with a warning. Otherwise it must pass in the distroless image too.
#
# Every container gets a time limit: under QEMU a crashing addon can hang
# instead of exiting (better-sqlite3 on 22.0.0 arm64 ran until the job was
# cancelled), and a hang counts as a failure.
#
# usage: test/native-addons/run.sh <image> <node version> [platform]
#   test/native-addons/run.sh nvitaterna/nodejs-distroless:22.23.4 22.23.4 linux/arm64
set -euo pipefail

image=$1
version=$2
platform=${3:-}
dir=$(cd "$(dirname "$0")" && pwd)
addons=(sharp better-sqlite3)
platform_args=()
[[ -n "$platform" ]] && platform_args=(--platform "$platform")

# a volume rather than a bind mount: npm runs as root in the build container,
# and root-owned files in the checkout would be left behind on the host
volume=$(docker volume create)
trap 'docker volume rm "$volume" > /dev/null' EXIT

# docker run with a time limit. The container runs detached and the limit
# is put on docker wait: an attached docker run forwards timeout's SIGTERM
# to the container instead of exiting, so a hung addon would never stop.
run() {
  local limit=$1 id code
  shift
  id=$(docker run -d "$@")
  if ! code=$(timeout "$limit" docker wait "$id"); then
    docker logs "$id" 2>&1
    echo "timed out after $limit"
    docker rm -f "$id" > /dev/null
    return 124
  fi
  docker logs "$id" 2>&1
  docker rm -f "$id" > /dev/null
  return "$code"
}

run 15m "${platform_args[@]}" \
  -v "$dir:/src:ro" -v "$volume:/app" -w /app -e NPM_CONFIG_UPDATE_NOTIFIER=false \
  "node:$version" \
  sh -c 'cp /src/package.json /src/package-lock.json /src/check.js . && npm ci --omit=dev --no-audit --no-fund --loglevel=error'

failed=()
for addon in "${addons[@]}"; do
  echo "== $addon"
  if ! run 5m "${platform_args[@]}" \
    -v "$volume:/app:ro" -w /app --entrypoint node \
    "node:$version" check.js "$addon"; then
    echo "::warning::$addon fails in node:$version${platform:+ ($platform)} as well, skipping it for this version"
    continue
  fi
  if ! run 5m "${platform_args[@]}" \
    -v "$volume:/home/node/app:ro" -w /home/node/app \
    "$image" check.js "$addon"; then
    echo "::error::$addon works in node:$version but fails in $image${platform:+ ($platform)}"
    failed+=("$addon")
  fi
done

if (( ${#failed[@]} )); then
  exit 1
fi
