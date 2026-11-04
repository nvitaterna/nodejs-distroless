# Security policy

## Supported images

Only images for Node.js release lines that have not reached end of life are rebuilt. That covers every published version of each maintenance, LTS and current line (see [Support and end of life](README.md#support-and-end-of-life)). Images for end-of-life lines stay on the registries but get no further updates, so security reports about them won't be fixed.

## What is already covered automatically

- **OS packages:** every image built for a pull request is scanned with [Grype](https://github.com/anchore/grype) and blocked on fixable High or Critical findings. The newest image of each line is rescanned daily, and the results appear in this repository's [Security tab](https://github.com/nvitaterna/nodejs-distroless/security/code-scanning).
- **Ubuntu updates:** Renovate tracks the Ubuntu base image, the Chisel release and the pinned apt packages. A base change republishes every supported version.
- **Node.js releases:** new Node.js versions, including security releases, are published automatically, usually within the hour. Security releases only reach you if you move to the new version: a pinned full version such as `22.15.0` keeps receiving OS fixes, but never a newer Node.js.

You don't need to report a CVE that is fixed in Ubuntu or Node.js and is already shown in the Security tab. It will be picked up by the next base update or Node.js release.

## Reporting a vulnerability

Please **do not open a public issue** for a vulnerability. Report it privately through GitHub instead: [Security → Report a vulnerability](https://github.com/nvitaterna/nodejs-distroless/security/advisories/new).

Examples of what to report here:

- a problem in how the images are built or published, e.g. the Node.js checksum check could be bypassed, or a workflow could be made to publish untrusted content
- an image that is missing a fix even though Ubuntu or Node.js shipped it more than a few days ago
- a misconfiguration in the image itself, such as file permissions or users

Vulnerabilities in Node.js itself go to the [Node.js security team](https://github.com/nodejs/node/security/policy), and vulnerabilities in Ubuntu packages to [Ubuntu Security](https://ubuntu.com/security/disclosure-policy).

Please include the image reference (tag and digest), the platform, and how to reproduce the problem.
