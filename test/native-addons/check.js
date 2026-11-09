// usage: node check.js <sharp|bcrypt>
// run inside the distroless image with node_modules installed by node:<version>,
// so a missing shared library, a libc mismatch or a wrong architecture fails
// here instead of in a user's deployment. One addon per process: a crash in
// one must not hide the result of the other
const assert = require("assert");

const arch = { x64: "x64", arm64: "arm64" }[process.arch];

const addons = {
  sharp: {
    // libvips round trip: encode, decode and resize
    async run() {
      const sharp = require("sharp");
      const png = await sharp({ create: { width: 64, height: 32, channels: 3, background: "#336699" } }).png().toBuffer();
      const { data, info } = await sharp(png).resize(16, 8).raw().toBuffer({ resolveWithObject: true });
      assert.deepStrictEqual([info.width, info.height, info.channels], [16, 8, 3]);
      assert.deepStrictEqual([...data.subarray(0, 3)], [0x33, 0x66, 0x99]);
      // sharp falls back to its WebAssembly build when the native one fails
      // to load, which would pass the checks above without testing the image
      assert.ok(!("emscripten" in sharp.versions), "sharp loaded its WebAssembly fallback, not the native binary");
      return { sharp: sharp.versions.sharp, libvips: sharp.versions.vips };
    },
    native: {
      binding: new RegExp(`/@img/sharp-linux-${arch}/lib/sharp-linux-${arch}-[\\d.]+\\.node$`),
      libvips: new RegExp(`/sharp-libvips-linux-${arch}/lib/libvips-cpp\\.so`),
    },
  },
  // a C++ addon on N-API, so one prebuilt binary serves every Node.js
  // version; links libstdc++, libgcc_s, libm and libc
  bcrypt: {
    async run() {
      const bcrypt = require("bcrypt");
      const hash = await bcrypt.hash("distroless", 4);
      assert.ok(await bcrypt.compare("distroless", hash));
      assert.ok(!(await bcrypt.compare("distrofull", hash)));
      return { bcrypt: require("bcrypt/package.json").version };
    },
    native: {
      binding: new RegExp(`/bcrypt/(prebuilds/linux-${arch}/bcrypt\\.glibc|build/Release/bcrypt_lib)\\.node$`),
    },
  },

};

(async () => {
  const name = process.argv[2];
  const addon = addons[name];
  assert.ok(addon, `unknown addon "${name}", expected one of: ${Object.keys(addons).join(", ")}`);
  const versions = await addon.run();
  // the native binaries, and the libraries they link against, must actually
  // be loaded into this process
  const loaded = process.report.getReport().sharedObjects;
  const missing = Object.keys(addon.native).filter((lib) => !loaded.some((path) => addon.native[lib].test(path)));
  assert.deepStrictEqual(missing, [], `${name}: not loaded natively: ${missing.join(", ")}`);
  console.log(process.version, process.arch, versions, "ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
