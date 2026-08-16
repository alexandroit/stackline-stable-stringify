import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

import esmDefault, * as esm from '../dist/index.js';

const require = createRequire(import.meta.url);

test('CommonJS exposes a compatible callable export and modern helpers', () => {
  const commonjs = require('../dist/index.cjs');
  assert.equal(typeof commonjs, 'function');
  assert.equal(commonjs.default, commonjs);
  assert.equal(commonjs.stable, commonjs);
  assert.equal(commonjs.stableStringify, commonjs);
  assert.equal(commonjs.stringify, commonjs);
  assert.equal(typeof commonjs.safeStringify, 'function');
  assert.equal(typeof commonjs.canonicalize, 'function');
  assert.equal(typeof commonjs.canonicalizeBytes, 'function');
  assert.equal(typeof commonjs.configure, 'function');
  assert.equal(typeof commonjs.StableStringifyLimitError, 'function');
  assert.equal(typeof commonjs.CanonicalizationError, 'function');
  assert.equal(commonjs({ z: 1, a: 2 }), '{"a":2,"z":1}');
});

test('ESM exposes default and named APIs', () => {
  assert.equal(esmDefault, esm.stableStringify);
  assert.equal(esmDefault, esm.stringify);
  assert.equal(esmDefault.safeStringify, esm.safeStringify);
  assert.equal(esmDefault.canonicalize, esm.canonicalize);
  assert.equal(esmDefault.configure, esm.configure);
  assert.equal(esm.canonicalize({ z: 1, a: 2 }), '{"a":2,"z":1}');
});

test('browser build exposes the complete callable global', async () => {
  const code = await readFile(new URL('../dist/index.min.js', import.meta.url), 'utf8');
  const context = { globalThis: {} };
  vm.runInNewContext(code, context, { filename: 'index.min.js' });
  const browserStringify = context.globalThis.StacklineStableStringify;
  const cyclic = { z: 1 };
  cyclic.self = cyclic;

  assert.equal(typeof browserStringify, 'function');
  assert.equal(browserStringify({ z: 1, a: 2 }), '{"a":2,"z":1}');
  assert.equal(
    browserStringify(cyclic, { cycles: true }),
    '{"self":"__cycle__","z":1}'
  );
  assert.equal(
    vm.runInNewContext(
      'globalThis.StacklineStableStringify.canonicalize({ z: 1, a: 2 })',
      context
    ),
    '{"a":2,"z":1}'
  );
  assert.equal(
    browserStringify.canonicalize({ z: 1, a: 2 }),
    '{"a":2,"z":1}'
  );
});

test('distribution is small and carries the license banner', async () => {
  const minified = new URL('../dist/index.min.js', import.meta.url);
  const code = await readFile(minified, 'utf8');
  const info = await stat(minified);
  assert.match(code, /^\/\*! @stackline\/stable-stringify v1\.0\.0 \| MIT \*\//);
  assert.equal(code.includes('eval('), false);
  assert.equal(code.includes('new Function'), false);
  assert.ok(info.size < 20000, `browser bundle is ${info.size} bytes`);
});
