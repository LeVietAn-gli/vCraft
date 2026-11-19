import { readdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const all = await Promise.all(entries.map((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : Promise.resolve(path.endsWith('.js') || path.endsWith('.mjs') ? [path] : []);
  }));
  return all.flat();
}
let checked = 0;
for (const folder of ['src', 'scripts', 'prisma', 'tests']) {
  for (const file of await files(resolve(dirname(fileURLToPath(import.meta.url)), '..', folder))) {
    const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status || 1);
    checked++;
  }
}
console.log(`Backend syntax: ${checked} files OK`);
