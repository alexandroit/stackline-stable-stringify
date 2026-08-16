import assert from 'node:assert/strict';
import test from 'node:test';

import reference from 'fast-json-stable-stringify';
import stringify from '../src/index.js';

test('matches fast-json-stable-stringify 2.1.0 documented scenarios', () => {
  const values = [
    { c: 8, b: [{ z: 6, y: 5, x: 4 }, 7], a: 3 },
    { nullable: null, truthy: true, falsy: false, number: 0 },
    [3, undefined, { z: 1, a: 2 }],
    new String('text'),
    new Date('2026-08-16T00:00:00.000Z'),
    undefined,
    NaN,
    Infinity
  ];

  for (const value of values) {
    assert.equal(stringify(value), reference(value));
  }
});

test('matches compatible comparator and toJSON hooks', () => {
  const input = {
    c: 5,
    b: [{ z: 3, y: 2, x: 1 }, 9],
    a: 10,
    custom: {
      toJSON() {
        return { right: 2, left: 1 };
      }
    }
  };
  const comparators = [
    (left, right) => (left.key < right.key ? 1 : -1),
    (left, right) =>
      String(left.value).localeCompare(String(right.value)) ||
      left.key.localeCompare(right.key)
  ];

  for (const cmp of comparators) {
    assert.equal(stringify(input, cmp), reference(input, cmp));
    assert.equal(stringify(input, { cmp }), reference(input, { cmp }));
  }
});

test('matches object-cycle compatibility and improves array cycles', () => {
  const object = { name: 'root' };
  object.self = object;

  assert.throws(
    () => stringify(object),
    /Converting circular structure to JSON/
  );
  assert.equal(
    stringify(object, { cycles: true }),
    reference(object, { cycles: true })
  );

  const array = [];
  array.push(array);
  assert.equal(stringify(array, { cycles: true }), '["__cycle__"]');
});

test('matches 30,000 deterministic reference serializations', () => {
  const random = createRandom(0x7a21f00d);
  const comparators = [
    undefined,
    (left, right) =>
      left.key < right.key ? 1 : left.key > right.key ? -1 : 0,
    (left, right) =>
      String(left.value).localeCompare(String(right.value)) ||
      left.key.localeCompare(right.key)
  ];

  for (let index = 0; index < 10000; index += 1) {
    const input = randomValue(random, 0);
    for (const cmp of comparators) {
      assert.equal(
        stringify(input, cmp),
        reference(input, cmp),
        `differential case ${index}`
      );
    }
  }
});

function createRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function randomValue(random, depth) {
  const choice =
    depth >= 5 ? Math.floor(random() * 7) : Math.floor(random() * 11);
  if (choice === 0) return null;
  if (choice === 1) return random() > 0.5;
  if (choice === 2) return Math.floor(random() * 2000) - 1000;
  if (choice === 3) return random() * 100 - 50;
  if (choice === 4) return `value-${Math.floor(random() * 100)}`;
  if (choice === 5) return undefined;
  if (choice === 6) return random() > 0.5 ? NaN : Infinity;
  if (choice === 7) {
    return Array.from({ length: Math.floor(random() * 6) }, () =>
      randomValue(random, depth + 1)
    );
  }

  const output = {};
  const count = Math.floor(random() * 6);
  for (let index = 0; index < count; index += 1) {
    output[`key${Math.floor(random() * 12)}`] = randomValue(
      random,
      depth + 1
    );
  }
  return output;
}
