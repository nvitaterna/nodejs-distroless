# nodejs-distroless

**Distroless Node.js Docker Images Built with Canonical's Chisel**

---

## Overview

`nodejs-distroless` provides ultra-minimal, production-ready Docker images for running Node.js applications. These images are built using Canonical's Chisel and inspired by Google's distroless approach, resulting in containers that contain only Node.js and its essential runtime libraries—no shell, no package manager, and no unnecessary OS files. This dramatically reduces image size and attack surface, making deployments faster and more secure.

---

## Features

- Can only be run as a non-root user for improved security.
- Minimal image size for fast deployment and reduced attack surface.
- Only includes Node.js runtime and required libraries—no shell or package manager.
- Built with Canonical's Chisel .
- Suitable for running Node.js apps in production environments.

---

## Usage

These images are intended for running pre-built Node.js applications. You should use a multi-stage Docker build:  
- Build and package your app (and dependencies) in a standard Node.js image.
- Copy the built application and `node_modules` into the distroless image for runtime.

**Example Dockerfile:**

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

- The only user available is `node`. This does **not** run as root. You do not need to switch users in your Dockerfile.

---

## Why Distroless?

- **Security:** Fewer packages and no root user mean fewer vulnerabilities.
- **Performance:** Smaller images pull and start faster.
- **Best Practices:** Forces separation of build and runtime, following modern container recommendations.

---

## Limitations

- No shell or package manager inside the image—debugging and installing additional packages at runtime is not possible.
- No `npm` or `npx`—all dependencies must be installed at build time and copied into the image.
- Cannot run as root or perform privileged operations inside the container.
- This only supports maintenance, LTS, and current node versions. Older versions may be available but they will not receive updates made to the base image.

---

## References

- Inspired by [GoogleContainerTools/distroless](https://github.com/GoogleContainerTools/distroless)
- Built with [Canonical Chisel](https://github.com/canonical/chisel)

---

**Contact:**  
For questions or support, open an issue on the [GitHub repository](https://github.com/nvitaterna/nodejs-distroless).
