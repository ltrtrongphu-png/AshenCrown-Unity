import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ignored = new Set(['.git', 'node_modules', 'dist', 'Library', 'Temp', 'obj', 'bin']);
const candidates = [];

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignored.has(entry.name)) await collect(join(directory, entry.name));
      continue;
    }
    if (!entry.isFile()) continue;
    if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) candidates.push(join(directory, entry.name));
  }
}

await collect(repoRoot);
let failed = 0;
for (const file of candidates) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed++;
    process.stderr.write('Syntax check failed: ' + relative(repoRoot, file) + '\n');
    if (result.stdout) process.stderr.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
}

if (failed > 0) {
  process.stderr.write('JavaScript syntax check failed for ' + failed + ' of ' + candidates.length + ' files.\n');
  process.exitCode = 1;
} else {
  process.stdout.write('JavaScript syntax OK: ' + candidates.length + ' files checked.\n');
}
