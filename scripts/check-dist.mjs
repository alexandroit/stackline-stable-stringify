import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { access, readFile, stat } from 'node:fs/promises';

import esmDefault, * as esm from '../dist/index.js';

const require = createRequire(import.meta.url);
const commonjs = require('../dist/index.cjs');
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8')
);

assert.equal(Object.keys(packageJson.dependencies || {}).length, 0);
assert.equal(typeof commonjs, 'function');
assert.equal(commonjs.default, commonjs);
assert.equal(esmDefault, esm.stableStringify);
assert.equal(esmDefault, esm.stringify);
assert.equal(typeof commonjs.canonicalize, 'function');
assert.equal(typeof commonjs.safeStringify, 'function');

const value = { z: 1, nested: { z: 2, a: 1 }, a: true };
assert.equal(
  commonjs(value),
  '{"a":true,"nested":{"a":1,"z":2},"z":1}'
);
assert.equal(commonjs(value), esmDefault(value));
assert.equal(
  commonjs.canonicalize({ z: 1, a: 2 }),
  '{"a":2,"z":1}'
);
assert.equal(
  commonjs.canonicalize({ z: 1, a: 2 }),
  esm.canonicalize({ z: 1, a: 2 })
);

for (const file of [
  'index.cjs',
  'index.cjs.map',
  'index.d.cts',
  'index.d.mts',
  'index.d.ts',
  'index.js',
  'index.js.map',
  'index.min.js',
  'index.min.js.map'
]) {
  await access(new URL(`../dist/${file}`, import.meta.url));
}

const minified = await stat(new URL('../dist/index.min.js', import.meta.url));
assert.ok(minified.size < 20000, `minified bundle is ${minified.size} bytes`);

console.log(
  JSON.stringify({
    canonical: true,
    cjs: true,
    esm: true,
    minifiedBytes: minified.size,
    runtimeDependencies: 0,
    version: packageJson.version
  })
);
