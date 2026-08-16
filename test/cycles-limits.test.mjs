import assert from 'node:assert/strict';
import test from 'node:test';

import stringify, {
  StableStringifyLimitError
} from '../src/index.js';

test('supports marker, path, null, and strict cycle policies', () => {
  const root = { child: {} };
  root.self = root;
  root.child.parent = root.child;

  assert.equal(
    stringify(root, { cycles: true }),
    '{"child":{"parent":"__cycle__"},"self":"__cycle__"}'
  );
  assert.equal(
    stringify(root, { onCycle: 'marker', cycleValue: '[Circular]' }),
    '{"child":{"parent":"[Circular]"},"self":"[Circular]"}'
  );
  assert.equal(
    stringify(root, { onCycle: 'path' }),
    '{"child":{"parent":"[Circular <root>.child]"},"self":"[Circular <root>]"}'
  );
  assert.equal(
    stringify(root, { onCycle: 'null' }),
    '{"child":{"parent":null},"self":null}'
  );
  assert.throws(() => stringify(root), {
    message: 'Converting circular structure to JSON',
    name: 'TypeError'
  });
});

test('does not treat repeated sibling references as cycles', () => {
  const shared = { z: 1, a: 2 };
  assert.equal(
    stringify({ first: shared, second: shared }),
    '{"first":{"a":2,"z":1},"second":{"a":2,"z":1}}'
  );
});

test('enforces depth, entry, and output limits with structured errors', () => {
  assert.throws(
    () => stringify({ nested: { value: true } }, { maxDepth: 0 }),
    (error) => {
      assert.equal(error instanceof StableStringifyLimitError, true);
      assert.equal(error.code, 'ERR_STABLE_STRINGIFY_LIMIT');
      assert.equal(error.kind, 'depth');
      assert.equal(error.limit, 0);
      assert.equal(error.path, '<root>.nested');
      return true;
    }
  );

  assert.throws(
    () => stringify({ 'odd-key': 1 }, { maxEntries: 0 }),
    (error) => {
      assert.equal(error.kind, 'entry');
      assert.equal(error.path, '<root>["odd-key"]');
      return true;
    }
  );

  assert.equal(stringify({ a: 1 }, { maxLength: 7 }), '{"a":1}');
  assert.throws(
    () => stringify({ a: 1 }, { maxLength: 6 }),
    (error) => error.kind === 'length' && error.limit === 6
  );
});

test('accepts explicit infinite limits', () => {
  assert.equal(
    stringify(
      { nested: { value: true } },
      { maxDepth: Infinity, maxEntries: Infinity, maxLength: Infinity }
    ),
    '{"nested":{"value":true}}'
  );
});

test('serializes extremely deep input without call-stack overflow', () => {
  const root = {};
  let cursor = root;
  for (let index = 0; index < 25000; index += 1) {
    cursor.next = {};
    cursor = cursor.next;
  }

  const output = stringify(root);
  assert.equal(output.startsWith('{"next":'), true);
  assert.equal(output.endsWith('}'.repeat(25001)), true);
  assert.equal(output.length, 225002);
});

test('reports array positions in limit errors', () => {
  assert.throws(
    () => stringify([[1]], { maxDepth: 0 }),
    (error) => error.path === '<root>[0]'
  );
  assert.throws(
    () => stringify([1], { maxEntries: 0 }),
    (error) => error.path === '<root>[0]'
  );
});
