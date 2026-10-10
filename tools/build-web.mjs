import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(repoRoot, 'dist');
const expectedOutputDir = join(repoRoot, 'dist');

if (outputDir !== expectedOutputDir || relative(repoRoot, outputDir).startsWith('..')) {
  throw new Error(`Refusing to write outside the repository: ${outputDir}`);
}

// Keep the Vercel artifact limited to files used by the browser experience.
// Unity source, unused art, textures, backend code and docs stay in GitHub only.
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
  'sw.js',
  'Assets/ashen-crown-logo.svg',
  'Assets/Models/Bosses/AshenRegent.glb',
  'Assets/Models/Characters/AshenSentinel.glb',
  'resource-pack.json',
];
const optionalAssets = new Set(['Assets/ashen-crown-logo.svg']);
const generatedFiles = new Set(['resource-pack.json']);

// Build a content-derived identifier so the service worker and production
// shell cache is invalidated whenever any shipped web asset changes.
const buildHash = createHash('sha256');
for (const file of webFiles) {
  if (generatedFiles.has(file)) continue;
  const source = join(repoRoot, file);
  if (!existsSync(source) || !statSync(source).isFile()) continue;
  buildHash.update(file).update('\\0');
  buildHash.update(readFileSync(source));
  buildHash.update('\\0');
}
const buildId = buildHash.digest('hex').slice(0, 16);
const resourceFiles = [
  'Assets/Models/Characters/AshenSentinel.glb',
  'Assets/Models/Bosses/AshenRegent.glb',
];

for (const file of webFiles) {
  const source = join(repoRoot, file);
  if (generatedFiles.has(file)) continue;
  if ((!existsSync(source) || !statSync(source).isFile()) && !optionalAssets.has(file)) {
    throw new Error(`Required web deployment file is missing: ${file}`);
  }
}

const resourceHash = createHash('sha256');
for (const file of resourceFiles) {
  resourceHash.update(file).update('\\0');
  resourceHash.update(readFileSync(join(repoRoot, file)));
  resourceHash.update('\\0');
}
const resourceVersion = 'ashen-production-' + resourceHash.digest('hex').slice(0, 16);

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
  if (file === 'resource-pack.json') {
    const manifest = {
      version: `${resourceVersion}`,
      label: 'Ashen Crown Production Models',
      files: resourceFiles.map((path) => ({
        url: `/${path.replaceAll('\\', '/')}`,
        size: statSync(join(repoRoot, path)).size,
      })),
    };
    writeFileSync(destination, `${JSON.stringify(manifest, null, 2)}\n`);
  } else if (existsSync(join(repoRoot, file))) {
    if (file === 'sw.js') {
      const worker = readFileSync(join(repoRoot, file), 'utf8');
      if (!worker.includes('__ASHEN_BUILD_ID__')) {
        throw new Error('sw.js is missing the __ASHEN_BUILD_ID__ cache-version placeholder.');
      }
      writeFileSync(destination, worker.replaceAll('__ASHEN_BUILD_ID__', buildId));
    } else {
      cpSync(join(repoRoot, file), destination);
    }
  } else if (file === 'Assets/ashen-crown-logo.svg') {
    writeFileSync(destination, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Ashen Crown emblem"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f3c08a"/><stop offset=".5" stop-color="#c96b3d"/><stop offset="1" stop-color="#71331f"/></linearGradient></defs><path d="M128 18 159 69 204 38 194 104c-13 43-38 68-66 81-28-13-53-38-66-81L52 38l45 31z" fill="#0b0908" stroke="url(#g)" stroke-width="6" stroke-linejoin="round"/><path d="M69 104c18 13 38 19 59 19s41-6 59-19M83 105l10-37 35 55 35-55 10 37m-87 40c17 12 30 18 42 22 12-4 25-10 42-22" fill="none" stroke="#d98a58" stroke-width="4"/><path d="m128 91 13 25-13 29-13-29z" fill="#f0a46d"/><circle cx="128" cy="116" r="7" fill="#fff0d8"/></svg>\n`);
    console.warn('Logo source is absent from the checkout; generated the branded fallback SVG.');
  }
}

const artifactBytes = webFiles.reduce((total, file) => total + statSync(join(outputDir, file)).size, 0);
console.log(`Prepared ${webFiles.length} browser files (${(artifactBytes / 1024 / 1024).toFixed(2)} MiB) in dist/ (build ${buildId}).`);
