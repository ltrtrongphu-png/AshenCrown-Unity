import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
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
  'vendor/three.module.js',
  'vendor/three.core.js',
  'play-boot.js',
  'auth-config.js',
  'auth.js',
  'sw.js',
  'assets/ashen-crown-logo.svg',
  'Assets/Models/Bosses/AshenRegent.glb',
  'Assets/Models/Characters/AshenSentinel.glb',
  'resource-pack.json',
];
const generatedFiles = new Set(['resource-pack.json']);
const npmAssetSources = new Map([
  ['vendor/three.module.js', 'node_modules/three/build/three.module.js'],
  ['vendor/three.core.js', 'node_modules/three/build/three.core.js'],
]);
function sourcePath(file) {
  return join(repoRoot, npmAssetSources.get(file) || file);
}

// Build a content-derived identifier so the service worker and production
// shell cache is invalidated whenever any shipped web asset changes.
const buildHash = createHash('sha256');
for (const file of webFiles) {
  if (generatedFiles.has(file)) continue;
  const source = sourcePath(file);
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
  const source = sourcePath(file);
  if (generatedFiles.has(file)) continue;
  if (!existsSync(source) || !statSync(source).isFile()) {
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

// Parse browser scripts before shipping. This catches syntax regressions that a file-copy
// build would otherwise miss because the browser code is not executed by Node.
function checkJavaScriptSyntax(file, module = false) {
  const args = module ? ['--check', '--input-type=module'] : ['--check'];
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    input: readFileSync(sourcePath(file), 'utf8'),
    encoding: 'utf8',
  });
  if (result.error || result.status !== 0) {
    throw new Error(`JavaScript syntax check failed for ${file}: ${result.stderr || result.error?.message || 'unknown error'}`);
  }
}
for (const file of ['app.js', 'campaign.js', 'i18n.js', 'sw.js', 'play-boot.js', 'auth-config.js']) {
  checkJavaScriptSyntax(file, false);
}
for (const file of ['play.js', 'model3d.js', 'auth.js', 'vendor/three.module.js', 'vendor/three.core.js']) {
  checkJavaScriptSyntax(file, true);
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
  const source = sourcePath(file);
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
  } else if (existsSync(source)) {
    if (file === 'sw.js') {
      const worker = readFileSync(source, 'utf8');
      if (!worker.includes('__ASHEN_BUILD_ID__')) {
        throw new Error('sw.js is missing the __ASHEN_BUILD_ID__ cache-version placeholder.');
      }
      writeFileSync(destination, worker.replaceAll('__ASHEN_BUILD_ID__', buildId));
    } else {
      cpSync(source, destination);
    }
  }
}

const artifactBytes = webFiles.reduce((total, file) => total + statSync(join(outputDir, file)).size, 0);
console.log(`Prepared ${webFiles.length} browser files (${(artifactBytes / 1024 / 1024).toFixed(2)} MiB) in dist/ (build ${buildId}).`);
