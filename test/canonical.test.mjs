import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';

import {
  CanonicalizationError,
  StableStringifyLimitError,
  canonicalize,
  canonicalizeBytes
} from '../src/index.js';

test('matches the RFC 8785 canonicalization example', () => {
  const input = {
    numbers: [Number('333333333.33333329'), 1e30, 4.5, 2e-3, 1e-27],
    string: `\u20ac$\u000f\nA'B"\\"/`,
    literals: [null, true, false]
  };
  const expected =
    `{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],"string":"€$\\u000f\\nA'B\\"\\\\\\"/"}`;

  assert.equal(canonicalize(input), expected);
  assert.deepEqual(
    canonicalizeBytes(input),
    new TextEncoder().encode(expected)
  );
});

test('uses RFC UTF-16 property ordering without normalization', () => {
  const input = {
    '\u20ac': 'Euro Sign',
    '\r': 'Carriage Return',
    '\ufb33': 'Hebrew Letter Dalet With Dagesh',
    1: 'One',
    '\ud83d\ude00': 'Emoji: Grinning Face',
    '\u0080': 'Control',
    '\u00f6': 'Latin Small Letter O With Diaeresis'
  };

  assert.equal(
    canonicalize(input),
    '{"\\r":"Carriage Return","1":"One","\u0080":"Control","ö":"Latin Small Letter O With Diaeresis","€":"Euro Sign","😀":"Emoji: Grinning Face","דּ":"Hebrew Letter Dalet With Dagesh"}'
  );
});

test('matches RFC number serialization vectors', () => {
  const values = [
    0,
    -0,
    5e-324,
    -5e-324,
    1.7976931348623157e308,
    -1.7976931348623157e308,
    9007199254740992,
    -9007199254740992,
    295147905179352830000,
    9.999999999999997e22,
    1e23,
    1.0000000000000001e23,
    1e21,
    9.999999999999997e-7,
    0.000001,
    333333333.3333333
  ];

  assert.equal(canonicalize(values), JSON.stringify(values));
});

test('rejects non-I-JSON values with paths and error codes', () => {
  const cases = [
    [NaN, /NaN and Infinity/],
    [Infinity, /NaN and Infinity/],
    [1n, /BigInt values/],
    [undefined, /not valid JSON data/],
    [() => true, /type function/],
    [Symbol('value'), /type symbol/],
    [{ nested: undefined }, /<root>\.nested/]
  ];

  for (const [value, pattern] of cases) {
    assert.throws(
      () => canonicalize(value),
      (error) => {
        assert.equal(error instanceof CanonicalizationError, true);
        assert.equal(error.code, 'ERR_JSON_CANONICALIZATION');
        assert.match(error.message, pattern);
        return true;
      }
    );
  }
});

test('rejects lone surrogates in values and property names', () => {
  for (const value of ['\ud800', '\udc00', { '\ud800': true }, { value: '\udc00' }]) {
    assert.throws(() => canonicalize(value), /lone UTF-16 surrogates/);
  }
  assert.equal(canonicalize('\ud83d\ude00'), '"😀"');
});

test('rejects cycles, sparse arrays, accessors, symbols, and class instances', () => {
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(() => canonicalize(cyclic), /circular references/);

  const sparse = new Array(1);
  assert.throws(() => canonicalize(sparse), /sparse arrays/);

  const accessor = {};
  Object.defineProperty(accessor, 'value', {
    enumerable: true,
    get() {
      return 1;
    }
  });
  assert.throws(() => canonicalize(accessor), /accessor properties/);

  const symbolObject = {};
  symbolObject[Symbol('visible')] = true;
  assert.throws(() => canonicalize(symbolObject), /symbol properties/);

  class RecordValue {
    constructor() {
      this.value = 1;
    }
  }
  assert.throws(() => canonicalize(new RecordValue()), /class instances/);
  assert.throws(() => canonicalize(new Date()), /only JSON objects/);
  assert.throws(
    () => canonicalize(Object.create({ inherited: true })),
    /class instances/
  );
});

test('accepts null-prototype data objects and ignores non-enumerable fields', () => {
  const input = Object.create(null);
  input.z = 1;
  input.a = 2;
  Object.defineProperty(input, 'hidden', { value: true });

  assert.equal(canonicalize(input), '{"a":2,"z":1}');

  const crossRealm = vm.runInNewContext('({ z: 1, nested: { b: 2, a: 1 } })');
  assert.equal(
    canonicalize(crossRealm),
    '{"nested":{"a":1,"b":2},"z":1}'
  );
});

test('canonical output limits are configurable', () => {
  assert.throws(
    () => canonicalize({ nested: {} }, { maxDepth: 0 }),
    StableStringifyLimitError
  );
  assert.throws(
    () => canonicalize({ a: 1 }, { maxEntries: 0 }),
    StableStringifyLimitError
  );
  assert.throws(
    () => canonicalize({ a: 1 }, { maxLength: 6 }),
    StableStringifyLimitError
  );
  assert.equal(
    canonicalize(
      { nested: {} },
      { maxDepth: Infinity, maxEntries: Infinity, maxLength: Infinity }
    ),
    '{"nested":{}}'
  );
  assert.throws(() => canonicalize({}, 1), /options must be an object/);
  assert.throws(
    () => canonicalize({}, { maxDepth: -1 }),
    /maxDepth must be/
  );
});

test('canonicalizeBytes includes a zero-dependency UTF-8 fallback', () => {
  const original = globalThis.TextEncoder;
  try {
    globalThis.TextEncoder = undefined;
    assert.deepEqual(
      canonicalizeBytes({ value: '©€😀' }),
      Uint8Array.from([
        0x7b, 0x22, 0x76, 0x61, 0x6c, 0x75, 0x65, 0x22, 0x3a, 0x22,
        0xc2, 0xa9, 0xe2, 0x82, 0xac, 0xf0, 0x9f, 0x98, 0x80, 0x22, 0x7d
      ])
    );
  } finally {
    globalThis.TextEncoder = original;
  }
});
