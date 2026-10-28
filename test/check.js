// smoke test, run inside the built image with its own node binary
const fs = require("fs");
const os = require("os");
const https = require("https");
const { X509Certificate } = require("crypto");

const CA_BUNDLE = "/etc/ssl/certs/ca-certificates.crt";
const ZONEINFO = "/usr/share/zoneinfo/America/Toronto";

// node verifies TLS with its own bundled roots, so point it at the image's
// bundle to prove that the ca-certificates slice is complete and usable
const httpsWithSystemCa = (host) =>
  new Promise((resolve) => {
    const req = https.request(
      { host, method: "HEAD", path: "/", ca: fs.readFileSync(CA_BUNDLE), timeout: 15000 },
      (res) => {
        res.resume();
        resolve(res.statusCode > 0);
      },
    );
    req.on("error", (err) => {
      console.error(`https://${host}/: ${err.message}`);
      resolve(false);
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.end();
  });

const caBundleParses = () => {
  const pems = fs.readFileSync(CA_BUNDLE, "utf8").match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) ?? [];
  return pems.length > 100 && pems.every((pem) => new X509Certificate(pem).subject.length > 0);
};

(async () => {
  const checks = {
    // prefix match: some upstream builds carry a suffix, e.g. v26.8.0-alpha.0.0.0 on arm64
    version: process.version.startsWith(`v${process.env.EXPECTED_NODE_VERSION}`),
    user: os.userInfo().username === "node" && process.getuid() === 1000,
    home: process.cwd() === "/home/node",
    osRelease: fs.readFileSync("/etc/os-release", "utf8").includes("VERSION_ID="),
    caBundle: caBundleParses(),
    tlsWithSystemCa: await httpsWithSystemCa("nodejs.org"),
    // TZif header: the slice copied real zone files, not just the directory
    tzdata: fs.readFileSync(ZONEINFO).subarray(0, 4).toString() === "TZif",
    timezone: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", timeZoneName: "short" })
      .formatToParts(new Date(Date.UTC(2026, 0, 15)))
      .some((part) => part.type === "timeZoneName" && part.value === "EST"),
    fetch: (await fetch("https://nodejs.org/", { method: "HEAD" })).status > 0,
  };
  console.log(process.version, process.arch, checks);
  if (Object.values(checks).includes(false)) process.exit(1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
