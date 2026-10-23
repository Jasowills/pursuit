// Run on the target runner after Tauri bundling. Does not publish a release.
import { readFileSync, readdirSync, statSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const [target, formats] = process.argv.slice(2);
const expected = {
  'aarch64-apple-darwin': ['darwin', 'arm64'],
  'x86_64-apple-darwin': ['darwin', 'x64'],
  'x86_64-pc-windows-msvc': ['win32', 'x64'],
  'x86_64-unknown-linux-gnu': ['linux', 'x64'],
}[target];
assert(expected, 'Unsupported target');
assert.equal(process.platform, expected[0], 'Build must run on its native OS');
assert.equal(process.arch, expected[1], 'Build must run on its native architecture');
const root = resolve('apps/desktop/src-tauri/target', target, 'release');
const executable = join(root, `pursuit-desktop${process.platform === 'win32' ? '.exe' : ''}`);
const binary = readFileSync(executable);
if (process.platform === 'darwin') {
  assert.equal(binary.readUInt32LE(0), 0xfeedfacf, 'Expected 64-bit Mach-O');
  assert.equal(binary.readUInt32LE(4), process.arch === 'arm64' ? 0x100000c : 0x1000007);
} else if (process.platform === 'win32') {
  assert.equal(binary.toString('ascii', 0, 2), 'MZ');
  const pe = binary.readUInt32LE(0x3c);
  assert.equal(binary.toString('ascii', pe, pe + 4), 'PE\0\0');
  assert.equal(binary.readUInt16LE(pe + 4), 0x8664, 'Expected x64 PE');
} else {
  assert.equal(binary.toString('hex', 0, 4), '7f454c46');
  assert.equal(binary[4], 2, 'Expected 64-bit ELF');
  assert.equal(binary.readUInt16LE(18), 62, 'Expected x64 ELF');
}
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
  );
}
const bundleFiles = files(join(root, 'bundle'));
const out = resolve('release-artifacts', target);
mkdirSync(out, { recursive: true });
const artifacts = [];
for (const extension of formats.split(',')) {
  const matches = bundleFiles.filter((p) => p.endsWith(`.${extension}`));
  assert.equal(matches.length, 1, `Expected one ${extension} installer`);
  const path = matches[0];
  assert(statSync(path).size > 1000000, 'Installer unexpectedly small');
  const filename = basename(path);
  copyFileSync(path, join(out, filename));
  artifacts.push({ filename, bytes: statSync(path).size, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') });
}
// Verify the resources Tauri consumed, including runtime-resolved browser code.
assert(statSync('apps/desktop/engine/worker.cjs').size > 1000);
assert(statSync('apps/desktop/engine/node_modules/playwright-core/package.json').size > 0);
if (process.platform === 'darwin') {
  const resources = join(root, 'bundle/macos/Pursuit.app/Contents/Resources/engine');
  assert.equal(readFileSync(join(resources, 'worker.cjs')).compare(readFileSync('apps/desktop/engine/worker.cjs')), 0);
  assert(statSync(join(resources, 'node_modules/playwright-core/package.json')).size > 0);
}
const manifest = {
  version: JSON.parse(readFileSync('apps/desktop/src-tauri/tauri.conf.json', 'utf8')).version,
  commit: process.env.GITHUB_SHA ?? null,
  target, platform: process.platform, architecture: process.arch,
  distribution: 'unsigned-internal-alpha',
  requirements: ['Node >=22.13 for the career engine', 'Configured Chromium for application execution', 'Configured model access for AI drafts'],
  checks: ['native-runner', 'binary-header-architecture', 'installer-present', 'engine-staging-resources', ...(process.platform === 'darwin' ? ['app-bundle-resources'] : [])],
  limitations: ['Not signed or notarized', 'Clean-machine installation and native UI smoke test remain required'],
  artifacts,
};
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(join(out, 'SHA256SUMS'), artifacts.map((a) => `${a.sha256}  ${a.filename}`).join('\n') + '\n');
console.log(JSON.stringify(manifest, null, 2));
