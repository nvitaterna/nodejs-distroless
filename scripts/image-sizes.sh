#!/usr/bin/env bash
# Prints the compressed (download) size of each image for one platform, as a
# Markdown table, by summing the layer sizes in the registry manifest. Nothing
# is pulled. Needs docker (with buildx) and jq.
#
#   scripts/image-sizes.sh [--platform linux/arm64] [image...]
#
# With no images, compares this project's image with other Node.js images on
# the same Node.js line (Chainguard's free image is only published as latest,
# so check that it is on the same line before comparing).
set -euo pipefail

platform=linux/amd64
if [[ "${1:-}" == "--platform" ]]; then
  platform=$2
  shift 2
fi

if [[ $# -eq 0 ]]; then
  set -- \
    nvitaterna/nodejs-distroless:26 \
    nvitaterna/nodejs-distroless:26-debug \
    gcr.io/distroless/nodejs26-debian13 \
    cgr.dev/chainguard/node:latest \
    node:26-alpine \
    node:26-slim \
    node:26
fi

os=${platform%%/*}
arch=${platform#*/}

echo "| Image | Size ($platform, compressed) |"
echo "|---|---:|"
# shellcheck disable=SC2016 # the backticks are Markdown
for image in "$@"; do
  if ! index=$(docker buildx imagetools inspect --raw "$image" 2> /dev/null); then
    printf '| `%s` | not found |\n' "$image"
    continue
  fi
  digest=$(jq -r --arg os "$os" --arg arch "$arch" '
    if .manifests then
      .manifests[] | select(.platform.os == $os and .platform.architecture == $arch) | .digest
    else empty end' <<< "$index" | head -n 1)
  if [[ -n "$digest" ]]; then
    manifest=$(docker buildx imagetools inspect --raw "${image%%@*}@$digest")
  else
    manifest=$index
  fi
  bytes=$(jq '[.layers[].size] | add' <<< "$manifest")
  printf '| `%s` | %s MB |\n' "$image" "$(awk -v b="$bytes" 'BEGIN { printf "%.1f", b / 1000000 }')"
done
