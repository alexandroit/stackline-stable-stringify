import assert from 'node:assert/strict';
import test from 'node:test';

import stringify, {
  CanonicalizationError,
  StableStringifyLimitError,
  canonicalize,
  canonicalizeBytes,
  configure,
  safeStringify,
  stableStringify
} from '../src/index.js';

test('sorts object keys recursively without mutating input', () => {
  const input = {
    z: 1,
    nested: { z: 2, a: 1 },
    list: [{ y: true, x: false }],
    a: 2
  };
  const before = JSON.stringify(input);

  assert.equal(
    stringify(input),
    '{"a":2,"list":[{"x":false,"y":true}],"nested":{"a":1,"z":2},"z":1}'
  );
  assert.equal(JSON.stringify(input), before);
});

test('matches JSON primitive, array, and omission semantics', () => {
  const symbol = Symbol('ignored');
  const input = {
    array: [undefined, () => true, symbol, NaN, Infinity, -Infinity, -0],
    boolean: true,
    function: () => true,
    infinity: Infinity,
    null: null,
    number: 12.5,
    string: 'text',
    symbol,
    undefined
  };

  assert.equal(
    stringify(input),
    '{"array":[null,null,null,null,null,null,0],"boolean":true,"infinity":null,"null":null,"number":12.5,"string":"text"}'
  );
  assert.equal(stringify(undefined), undefined);
  assert.equal(stringify(() => true), undefined);
  assert.equal(stringify(Symbol('root')), undefined);
  assert.equal(stringify(null), 'null');
});

test('keeps legacy wrapper and toJSON behavior', () => {
  const calls = [];
  const value = {
    wrapped: new String('ab'),
    date: new Date('2026-08-16T00:00:00.000Z'),
    custom: {
      toJSON(...args) {
        calls.push(args.length);
        return { z: 1, a: 2 };
      }
    }
  };

  assert.equal(
    stringify(value),
    '{"custom":{"a":2,"z":1},"date":"2026-08-16T00:00:00.000Z","wrapped":{"0":"a","1":"b"}}'
  );
  assert.deepEqual(calls, [0]);
});

test('supports comparator functions in both compatible forms', () => {
  const input = { a: 3, c: 1, b: 2 };
  const reverseKeys = (left, right) =>
    left.key < right.key ? 1 : left.key > right.key ? -1 : 0;
  const values = (left, right) => left.value - right.value;

  assert.equal(stringify(input, reverseKeys), '{"c":1,"b":2,"a":3}');
  assert.equal(stringify(input, { cmp: values }), '{"c":1,"b":2,"a":3}');
});

test('supports replacer functions, property lists, and indentation', () => {
  const seen = [];
  const input = { z: 1, private: true, nested: { b: 2, a: 1 } };
  const output = stringify(input, {
    replacer(key, value) {
      seen.push([key, this]);
      return key === 'private' ? undefined : value;
    },
    space: 2
  });

  assert.equal(
    output,
    '{\n  "nested": {\n    "a": 1,\n    "b": 2\n  },\n  "z": 1\n}'
  );
  assert.equal(seen[0][0], '');
  assert.equal(seen.some(([key]) => key === 'private'), true);

  const inherited = Object.create({ inherited: 3 });
  Object.defineProperty(inherited, 'hidden', {
    enumerable: false,
    value: 2
  });
  inherited.z = 1;
  assert.equal(
    stringify(inherited, {
      replacer: ['z', 'hidden', 'inherited', 'z', {}, new String('missing')]
    }),
    '{"hidden":2,"inherited":3,"z":1}'
  );
  assert.equal(stringify({ a: 1 }, { space: 100 }), '{\n          "a": 1\n}');
  assert.equal(stringify({ a: 1 }, { space: 'abcdefghijk' }), '{\nabcdefghij"a": 1\n}');
});

test('supports BigInt policies', () => {
  assert.throws(() => stringify({ value: 1n }), {
    message: 'Do not know how to serialize a BigInt',
    name: 'TypeError'
  });
  assert.equal(
    stringify({ value: 9007199254740993n }, { bigint: 'string' }),
    '{"value":"9007199254740993"}'
  );
  assert.equal(
    stringify({ value: 42n }, { bigint: 'number' }),
    '{"value":42}'
  );
  assert.throws(
    () => stringify({ value: 9007199254740993n }, { bigint: 'number' }),
    RangeError
  );
});

test('controls accessors and toJSON invocation', () => {
  let reads = 0;
  const input = {
    plain: 1,
    get computed() {
      reads += 1;
      return 2;
    }
  };

  assert.equal(stringify(input), '{"computed":2,"plain":1}');
  assert.equal(reads, 1);
  assert.equal(
    stringify(input, { accessors: 'omit' }),
    '{"plain":1}'
  );
  assert.throws(
    () => stringify(input, { accessors: 'throw' }),
    /Refusing to invoke accessor at <root>\.computed/
  );

  const inheritedAccessor = Object.create({
    get secret() {
      throw new Error('must not run');
    }
  });
  assert.equal(
    stringify(inheritedAccessor, {
      accessors: 'omit',
      replacer: ['secret']
    }),
    '{}'
  );
  assert.throws(
    () =>
      stringify(inheritedAccessor, {
        accessors: 'throw',
        replacer: ['secret']
      }),
    /Refusing to invoke accessor at <root>\.secret/
  );
  assert.equal(
    stringify({}, { accessors: 'omit', replacer: ['missing'] }),
    '{}'
  );

  const array = [];
  Object.defineProperty(array, '0', {
    configurable: true,
    enumerable: true,
    get() {
      return 1;
    }
  });
  array.length = 1;
  assert.equal(stringify(array, { accessors: 'omit' }), '[null]');
  assert.throws(() => stringify(array, { accessors: 'throw' }), TypeError);
  assert.equal(
    stringify(new Date('2026-01-01T00:00:00.000Z'), { toJSON: false }),
    '{}'
  );
});

test('configure and static exports expose one coherent API', () => {
  const reverse = configure((left, right) =>
    left.key < right.key ? 1 : -1
  );
  const pretty = configure({ space: 2 });

  assert.equal(reverse({ a: 1, b: 2 }), '{"b":2,"a":1}');
  assert.equal(
    pretty({ b: 2, a: 1 }, { space: 0 }),
    '{"a":1,"b":2}'
  );
  assert.equal(stringify, stableStringify);
  assert.equal(stringify.default, stringify);
  assert.equal(stringify.stringify, stringify);
  assert.equal(stringify.stable, stringify);
  assert.equal(stringify.stableStringify, stringify);
  assert.equal(stringify.configure, configure);
  assert.equal(stringify.safeStringify, safeStringify);
  assert.equal(stringify.canonicalize, canonicalize);
  assert.equal(stringify.canonicalizeBytes, canonicalizeBytes);
  assert.equal(stringify.CanonicalizationError, CanonicalizationError);
  assert.equal(stringify.StableStringifyLimitError, StableStringifyLimitError);
});

test('rejects invalid option values early', () => {
  const cases = [
    [42, /options must be an object/],
    [{ cmp: true }, /cmp must be a function/],
    [{ cycles: 'yes' }, /cycles must be a boolean/],
    [{ replacer: true }, /replacer must be a function or an array/],
    [{ onCycle: 'skip' }, /onCycle must be/],
    [{ bigint: 'raw' }, /bigint must be/],
    [{ accessors: 'read' }, /accessors must be/],
    [{ toJSON: 'yes' }, /toJSON must be a boolean/],
    [{ cycleValue: 1 }, /cycleValue must be a string/],
    [{ maxDepth: -1 }, /maxDepth must be/],
    [{ maxEntries: 1.5 }, /maxEntries must be/],
    [{ maxLength: Number.MAX_SAFE_INTEGER + 1 }, /maxLength must be/]
  ];

  for (const [options, pattern] of cases) {
    assert.throws(() => stringify({}, options), pattern);
  }
  assert.equal(stringify({ b: 2, a: 1 }, null), '{"a":1,"b":2}');
});
