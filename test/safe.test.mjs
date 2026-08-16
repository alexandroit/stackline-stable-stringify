import assert from 'node:assert/strict';
import test from 'node:test';

import stringify, { safeStringify } from '../src/index.js';

test('serializes cycles and BigInt using safe defaults', () => {
  const input = { value: 9007199254740993n };
  input.self = input;

  assert.equal(
    safeStringify(input),
    '{"self":"[Circular]","value":"9007199254740993"}'
  );

  const array = [];
  array.push(array);
  assert.equal(safeStringify(array), '["[Circular]"]');
});

test('supports familiar replacer, space, depthLimit, and edgesLimit arguments', () => {
  assert.equal(
    safeStringify(
      { z: 1, private: true, a: 2 },
      (key, value) => (key === 'private' ? undefined : value),
      2
    ),
    '{\n  "a": 2,\n  "z": 1\n}'
  );

  assert.equal(
    safeStringify({ nested: { value: true } }, null, 0, { depthLimit: 0 }),
    '"[Unable to serialize: StableStringifyLimitError]"'
  );
  assert.equal(
    safeStringify({ a: 1 }, null, 0, { edgesLimit: 0 }),
    '"[Unable to serialize: StableStringifyLimitError]"'
  );
});

test('returns a controlled fallback for hostile getters and toJSON hooks', () => {
  const getter = {};
  Object.defineProperty(getter, 'value', {
    enumerable: true,
    get() {
      throw new Error('secret');
    }
  });
  assert.equal(
    safeStringify(getter),
    '"[Unable to serialize: Error]"'
  );

  const hook = {
    toJSON() {
      throw new RangeError('failed');
    }
  };
  assert.equal(
    safeStringify(hook),
    '"[Unable to serialize: RangeError]"'
  );

  const hostileError = {
    get name() {
      throw new Error('second failure');
    }
  };
  assert.equal(
    safeStringify({
      toJSON() {
        throw hostileError;
      }
    }),
    '"[Unable to serialize: UnknownError]"'
  );

  assert.equal(
    safeStringify({
      toJSON() {
        throw { name: 'x'.repeat(200) };
      }
    }),
    `"[Unable to serialize: ${'x'.repeat(80)}]"`
  );
});

test('supports strict errors and explicit safe-option overrides', () => {
  assert.throws(
    () =>
      safeStringify({ nested: {} }, null, 0, {
        maxDepth: 0,
        throwOnError: true
      }),
    /depth limit/
  );
  assert.equal(
    safeStringify({ value: 42n }, null, 0, {
      bigint: 'number',
      maxLength: Infinity
    }),
    '{"value":42}'
  );
  assert.equal(
    safeStringify(
      { private: true, visible: 1 },
      undefined,
      undefined,
      { replacer: ['visible'], space: 2 }
    ),
    '{\n  "visible": 1\n}'
  );
  assert.equal(safeStringify(undefined), undefined);
  assert.equal(safeStringify.stable, stringify);
  assert.equal(safeStringify.stableStringify, stringify);
});
