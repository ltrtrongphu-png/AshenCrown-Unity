import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(repoRoot, 'dist');
const expectedOutputDir = join(repoRoot, 'dist');

if (outputDir !== expectedOutputDir || relative(repoRoot, outputDir).startsWith('..')) {
  throw new Error(`Refusing to write outside the repository: ${outputDir}`);
}

// Keep the Vercel artifact limited to files used by the browser experience.
// Unity source, model meshes, textures, backend code and docs stay in GitHub only.
const webFiles = [
  'index.html',
  'play.html',
  'styles.css',
  'play.css',
  'model3d.css',
  'app.js',
  'i18n.js',
  'campaign.js',
  'model3d.js',
  'play.js',
  'Assets/ashen-crown-logo.svg',
];

for (const file of webFiles) {
  const source = join(repoRoot, file);
  if (!existsSync(source) || !statSync(source).isFile()) {
    throw new Error(`Required web deployment file is missing: ${file}`);
  }
}

for (const page of ['index.html', 'play.html']) {
  const html = readFileSync(join(repoRoot, page), 'utf8');
  const references = html.matchAll(/(?:href|src)="([^"]+\.(?:js|css|svg|png|jpe?g|webp|woff2|json)(?:\?[^\"]*)?)"/gi);
  for (const [, reference] of references) {
    if (/^(?:[a-z]+:|\/\/|data:|#)/i.test(reference)) continue;
    const localPath = reference.split(/[?#]/, 1)[0].replace(/^\.\//, '');
    if (!webFiles.includes(localPath)) {
      throw new Error(`${page} references a file outside the web deployment allow-list: ${reference}`);
    }
  }
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
for (const file of webFiles) {
  const destination = join(outputDir, file);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(join(repoRoot, file), destination);
}

const artifactBytes = webFiles.reduce((total, file) => total + statSync(join(outputDir, file)).size, 0);
console.log(`Prepared ${webFiles.length} browser files (${(artifactBytes / 1024).toFixed(1)} KiB) in dist/.`);
