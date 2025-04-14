const os = require("os");
const assert = require("assert");

// this is a simple test to ensure that a node script runs and that the arch/version match the expected inputs

const arch = os.arch();
const { gid, uid, username } = os.userInfo();
const version = process.versions.node;

const entries = [
  {
    key: "arch",
    value: arch,
  },
  {
    key: "gid",
    value: gid,
  },
  {
    key: "uid",
    value: uid,
  },
  {
    key: "username",
    value: username,
  },
  {
    key: "version",
    value: version,
  },
];

const args = process.argv.slice(2);

for (let i = 0; i < entries.length; i++) {
  const key = entries[i].key;
  const value = entries[i].value;
  const argValue = args[i];

  assert.equal(
    value,
    argValue,
    `Node reported ${key} of value ${value} did not match argument of value ${argValue}`
  );
}
