#!/bin/bash
UBUNTU_RELEASE="${UBUNTU_RELEASE:-24.10}"
MIN_NODE_VERSION=20

readarray -t NODE_VERSIONS < <(curl -s https://nodejs.org/dist/ | grep -Po '(?<=">v)[^\/<"]*' | sort -h)

for NODE_VERSION in "${NODE_VERSIONS[@]}"; do
  MAJOR_VERSION=$(echo $NODE_VERSION | grep -oE '^\s*[0-9]+')
  (("${MAJOR_VERSION}" >= MIN_NODE_VERSION)) && BUILD_VERSIONS+=("$NODE_VERSION")
  (("${MAJOR_VERSION}" % 2)) || LTS_VERSIONS+=("$NODE_VERSION")

done

LATEST=${BUILD_VERSIONS[$(( ${#BUILD_VERSIONS[*]} - 1 ))]}
LATEST_LTS=${LTS_VERSIONS[$(( ${#LTS_VERSIONS[*]} - 1 ))]}

exit_on_int(){
  exit 0
}

trap 'exit_on_int' SIGINT

for NODE_VERSION in "${BUILD_VERSIONS[@]}"; do
  unset TAGS
  unset TAGSTRING
  echo "Building node v$NODE_VERSION"
  TAGS+=("$NODE_VERSION")
  if [ "$NODE_VERSION" = "$LATEST" ]; then
    TAGS+=("latest")
  fi
  if [ "$NODE_VERSION" = "$LATEST_LTS" ]; then
    TAGS+=("lts")
  fi
  for TAG in "${TAGS[@]}"; do
    TAGSTRING="${TAGSTRING} -t nvitaterna/nodejs-distroless:$TAG"
  done
  docker build \
    --platform linux/amd64,linux/arm64 \
    --build-arg UBUNTU_RELEASE=$UBUNTU_RELEASE \
    --build-arg NODE_VERSION=$NODE_VERSION \
    $TAGSTRING \
    .

  docker build \
    --platform linux/amd64,linux/arm64 \
    --build-arg UBUNTU_RELEASE=$UBUNTU_RELEASE \
    --build-arg NODE_VERSION=$NODE_VERSION \
    --build-arg WITH_NPM=true \
    $TAGSTRING-npm \
    .

  # test both archs
  docker run --platform=linux/amd64 -v ./test.js:/test.js nvitaterna/nodejs-distroless:${NODE_VERSION} test.js x64 1000 1000 node ${NODE_VERSION} || (echo "x64 for ${NODE_VERSION} failed" && exit 1)
  docker run --platform=linux/arm64 -v ./test.js:/test.js nvitaterna/nodejs-distroless:${NODE_VERSION} test.js arm64 1000 1000 node ${NODE_VERSION} || (echo "arm64 for ${NODE_VERSION} failed" && exit 1)

done

docker push -a nvitaterna/nodejs-distroless