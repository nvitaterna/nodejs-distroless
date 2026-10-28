import { readFile } from 'fs/promises';
import { main } from './main.js';

// optional: a versions.json to treat as already published
const [, , knownVersionsFile] = process.argv;

const knownVersions: string[] = knownVersionsFile
  ? (
      JSON.parse(await readFile(knownVersionsFile, 'utf8')) as {
        version: string;
      }[]
    ).map((item) => item.version)
  : [];

const versionList = await main(knownVersions);

console.log(JSON.stringify(versionList, null, 2));
