# Architecture

## Scope

The runtime converts a JavaScript value into deterministic JSON text through
three policy surfaces:

- stable mode for compatibility and cache or snapshot keys;
- safe mode for bounded diagnostics and logs;
- canonical mode for RFC 8785 interoperable bytes.

All modes share one iterative serialization engine and have zero runtime
dependencies.

## Iterative task stack

Recursive serializers fail when object depth exceeds the JavaScript call-stack
limit. This implementation prepares a root value and processes explicit
`value` and `container` tasks in a loop. A container frame stores its key list,
index, depth, indentation, path, and emission state.

The approach makes nesting depth a policy decision instead of a runtime stack
accident. Stable mode is tested with 25,000 nested arrays. Safe and canonical
modes intentionally apply finite defaults.

## Preparation and emission

Each value goes through preparation before output:

1. stable mode optionally invokes `toJSON` and a replacer;
2. the value is classified as primitive, container, or omitted;
3. object keys are selected and sorted;
4. descriptors or accessors are read according to policy;
5. text chunks are appended while enforcing the output budget.

Arrays preserve order. Unsupported stable-mode array items become `null`,
matching JSON semantics. Unsupported object members are omitted.

## Cycle detection

An operation-scoped `WeakMap` tracks active ancestors and their paths. Entries
are removed when a container closes, so repeated sibling references are not
misclassified as cycles. The current ancestor path supports strict errors,
markers, null substitution, and descriptive path markers.

No graph is retained after serialization.

## Stable mode

Stable mode sorts own enumerable string keys by UTF-16 code units. A comparator
can instead order `{ key, value }` records. Property-list replacers are
normalized once, deduplicated, and applied at every object depth.

Compatibility defaults intentionally leave depth, entry, and length budgets
unlimited. BigInt throws, accessors and `toJSON` are invoked, and cycles throw
unless configured otherwise.

## Safe mode

Safe mode delegates to the same engine with cycle markers, BigInt strings, and
finite budgets. It catches traversal failures and returns a controlled JSON
string unless `throwOnError` is enabled. This prevents the diagnostic path from
hiding the original application error behind a second serialization error.

## Canonical mode

Canonical mode validates I-JSON data while traversing:

- keys use recursive UTF-16 ordering required by RFC 8785;
- numbers and strings use ECMAScript JSON serialization;
- malformed Unicode and non-finite numbers are rejected;
- only arrays, plain objects, and null-prototype objects are accepted;
- data descriptors are read without invoking accessors;
- symbols, cycles, sparse arrays, and non-JSON values are rejected;
- output contains no insignificant whitespace.

`canonicalizeBytes` encodes the resulting string as UTF-8. It uses
`TextEncoder` where available and includes a small standards-compatible
fallback for older environments.

## Resource accounting

The engine tracks:

- container depth;
- visited object keys and array positions;
- UTF-16 output length.

Limit errors include a structured kind, configured limit, and a path such as
`<root>.request.headers` or `<root>.items[4]`.

## Distribution

One source module builds to:

- `dist/index.js` for ESM;
- `dist/index.cjs` for callable CommonJS;
- `dist/index.min.js` for the `StacklineStableStringify` browser global;
- resolver-specific `.d.mts`, `.d.cts`, and `.d.ts` declarations;
- source maps for every JavaScript artifact.

The build banner identifies package version and MIT license. Package tests load
all three JavaScript forms and execute the browser artifact in an isolated VM.
