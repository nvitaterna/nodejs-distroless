import { main } from './main.js';

const versionList = await main();

console.log(JSON.stringify(versionList, null, 2));
