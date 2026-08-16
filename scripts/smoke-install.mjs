import { execFileSync } from 'node:child_process';
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCli =
  process.platform === 'win32'
    ? path.join(
        path.dirname(process.execPath),
        'node_modules',
        'npm',
        'bin',
        'npm-cli.js'
      )
    : null;
const work = await mkdtemp(path.join(os.tmpdir(), 'stackline-stable-stringify-install-'));

try {
  const tarball = process.argv[2]
    ? await resolveTarball(process.argv[2])
    : await createTarball(path.join(work, 'artifact'));

  await smokeDirect(tarball, path.join(work, 'direct'));
  await smokeAlias(tarball, path.join(work, 'alias'));

  const packageJson = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf8')
  );
  console.log(
    `${packageJson.name}@${packageJson.version} clean-install smoke passed on ${process.version}`
  );
} finally {
  if (!process.env.KEEP_INSTALL_TEST) {
    await rm(work, { force: true, recursive: true });
  }
}

async function resolveTarball(input) {
  const resolved = path.resolve(input);
  const info = await stat(resolved);
  if (info.isFile()) return resolved;
  if (!info.isDirectory()) throw new TypeError(`${resolved} is not a file or directory`);

  const tarballs = (await readdir(resolved)).filter((entry) => entry.endsWith('.tgz'));
  if (tarballs.length !== 1) {
    throw new Error(`Expected one package tarball in ${resolved}; found ${tarballs.length}`);
  }
  return path.join(resolved, tarballs[0]);
}

async function createTarball(directory) {
  await mkdir(directory, { recursive: true });
  const output = runNpm(
    ['pack', '--ignore-scripts', '--json', '--pack-destination', directory],
    root
  );
  const [{ filename }] = JSON.parse(output);
  return path.join(directory, filename);
}

async function smokeDirect(tarball, directory) {
  await prepare(directory, {
    '@stackline/stable-stringify': `file:${tarball}`
  });

  await writeFile(
    path.join(directory, 'smoke.cjs'),
    `'use strict';
const assert = require('assert');
const stringify = require('@stackline/stable-stringify');
const cyclic = { id: 7 };
cyclic.self = cyclic;
assert.strictEqual(typeof stringify, 'function');
assert.strictEqual(stringify.default, stringify);
assert.strictEqual(stringify({ z: 1, a: 2 }), '{"a":2,"z":1}');
assert.strictEqual(stringify(cyclic, { cycles: true }), '{"id":7,"self":"__cycle__"}');
assert.strictEqual(stringify.safeStringify({ value: 12n }), '{"value":"12"}');
assert.strictEqual(stringify.canonicalize({ z: 1, a: 2 }), '{"a":2,"z":1}');
`,
    'utf8'
  );

  await writeFile(
    path.join(directory, 'smoke.mjs'),
    `import assert from 'assert';
import stringify, { canonicalize, canonicalizeBytes, safeStringify } from '@stackline/stable-stringify';
assert.strictEqual(stringify({ z: 1, a: 2 }), '{"a":2,"z":1}');
assert.strictEqual(canonicalize({ z: 1, a: 2 }), '{"a":2,"z":1}');
assert.deepStrictEqual(Array.from(canonicalizeBytes({ a: 1 })), Array.from(new TextEncoder().encode('{"a":1}')));
assert.strictEqual(safeStringify({ value: 12n }), '{"value":"12"}');
`,
    'utf8'
  );

  run(process.execPath, ['smoke.cjs'], directory);
  run(process.execPath, ['smoke.mjs'], directory);
  if (!process.env.SKIP_INSTALL_AUDIT) {
    runNpm(['audit', '--omit=dev', '--audit-level=high'], directory);
  }
}

async function smokeAlias(tarball, directory) {
  await prepare(directory, { 'fast-json-stable-stringify': `file:${tarball}` });

  await writeFile(
    path.join(directory, 'smoke.cjs'),
    `'use strict';
const assert = require('assert');
const stringify = require('fast-json-stable-stringify');
assert.strictEqual(typeof stringify, 'function');
assert.strictEqual(stringify({ z: 1, a: 2 }), '{"a":2,"z":1}');
assert.strictEqual(stringify({ one: 1, two: 2 }, (a, b) => b.key.localeCompare(a.key)), '{"two":2,"one":1}');
`,
    'utf8'
  );

  await writeFile(
    path.join(directory, 'smoke.mjs'),
    `import assert from 'assert';
import stringify from 'fast-json-stable-stringify';
assert.strictEqual(stringify({ z: 1, a: 2 }), '{"a":2,"z":1}');
`,
    'utf8'
  );

  run(process.execPath, ['smoke.cjs'], directory);
  run(process.execPath, ['smoke.mjs'], directory);
}

async function prepare(directory, dependencies) {
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, 'package.json'),
    `${JSON.stringify({ private: true, dependencies }, null, 2)}\n`,
    'utf8'
  );
  runNpm(['install', '--ignore-scripts', '--no-fund'], directory);
}

function runNpm(args, cwd) {
  return npmCli
    ? run(process.execPath, [npmCli, ...args], cwd)
    : run('npm', args, cwd);
}

function run(command, args, cwd) {
  const env = { ...process.env, npm_config_loglevel: 'error' };
  delete env.npm_config_dry_run;
  delete env.NPM_CONFIG_DRY_RUN;

  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
}
