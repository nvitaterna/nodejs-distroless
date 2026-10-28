// smoke test, run inside the built image with its own node binary
const fs = require("fs");
const os = require("os");
const checks = {
  // prefix match: some upstream builds carry a suffix, e.g. v26.8.0-alpha.0.0.0 on arm64
  version: process.version.startsWith(`v${process.env.EXPECTED_NODE_VERSION}`),
  user: os.userInfo().username === "node",
  home: process.cwd() === "/home/node",
  caCertificates: fs.existsSync("/etc/ssl/certs/ca-certificates.crt"),
  tzdata: fs.existsSync("/usr/share/zoneinfo/America/Toronto"),
  osRelease: fs.readFileSync("/etc/os-release", "utf8").includes("VERSION_ID="),
};
console.log(process.version, process.arch, checks);
if (Object.values(checks).includes(false)) process.exit(1);
