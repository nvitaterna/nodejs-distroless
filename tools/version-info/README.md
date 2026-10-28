# version-info

Produces the list of Node.js versions (and the Docker tags each should get)
that this repo builds images for: the maintenance, LTS and current release
lines, read from nodejs.org's release schedule and download index.

The hourly `get-new-versions` workflow runs it and commits the result to
`versions.json` in the repo root.

```sh
pnpm install
pnpm build
node dist          # prints the version list as JSON
pnpm lint && pnpm test
```
