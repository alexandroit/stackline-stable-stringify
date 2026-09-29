# @stackline/stable-stringify

> Deterministic, cycle-aware JSON serialization with a fast-json-stable-stringify-compatible API and RFC 8785 canonicalization.

[![npm version](https://img.shields.io/npm/v/@stackline/stable-stringify.svg?style=flat-square)](https://www.npmjs.com/package/@stackline/stable-stringify)
[![license](https://img.shields.io/npm/l/@stackline/stable-stringify.svg?style=flat-square)](https://github.com/alexandroit/stackline-stable-stringify)
[![GitHub repository](https://img.shields.io/badge/GitHub-alexandroit%2Fstackline-stable-stringify-181717?style=flat-square&logo=github)](https://github.com/alexandroit/stackline-stable-stringify)
[![Docs](https://img.shields.io/badge/docs-alexandro.net-0f766e?style=flat-square)](https://alexandro.net/docs/vanilla/stable-stringify/)
[![Reddit community](https://img.shields.io/badge/community-r%2FStackline-ff4500?style=flat-square&logo=reddit&logoColor=white)](https://www.reddit.com/r/Stackline/)

**[Documentation](https://alexandro.net/docs/vanilla/stable-stringify/)** | **[npm](https://www.npmjs.com/package/@stackline/stable-stringify)** | **[Issues](https://github.com/alexandroit/stackline-stable-stringify/issues)** | **[Repository](https://github.com/alexandroit/stackline-stable-stringify)**

**Current package version:** `1.0.4`

---

## Why this package?

Deterministic JSON serialization, safe diagnostics, and RFC 8785 canonical
JSON in one zero-dependency package.

The default export follows the familiar `fast-json-stable-stringify` API. It
also handles circular arrays, deeply nested data without recursive call-stack
failure, BigInt policies, resource limits, safe logging, and strict JSON
Canonicalization Scheme output.

<a id="why-this-package"></a>

### Why this package

Stable serialization is infrastructure for cache keys, signatures, snapshots,
deduplication, logs, and reproducible builds. The JavaScript ecosystem has
separate high-volume packages for deterministic key order, circular data, safe
logging, and canonical JSON. This package provides those contracts through one
small, tested runtime while keeping the established call shape.

- recursive deterministic key ordering;
- compatible comparator and `{ cmp, cycles }` options;
- cycle policies for objects and arrays;
- safe defaults for diagnostics and logging;
- RFC 8785 / JCS canonical strings and UTF-8 bytes;
- iterative traversal for very deep input;
- opt-in depth, entry, and output-size limits;
- ESM, callable CommonJS, browser global, and TypeScript declarations;
- zero runtime dependencies.

## Compatibility

| Item | Value |
| --- | --- |
| Package | `@stackline/stable-stringify@1.0.4` |
| Node.js runtime | `>=14.17.0` |
| CommonJS / primary entry | `./dist/index.cjs` |
| ES module entry | `./dist/index.js` |
| Type declarations | `./dist/index.d.ts` |

The default contract is tested against `fast-json-stable-stringify@2.1.0`.
The regression suite includes 30,000 deterministic differential
serializations across generated values and comparator forms.

Intentional additions do not alter default output:

- circular arrays are handled instead of overflowing the call stack;
- very deep structures use an iterative task stack;
- replacer, indentation, BigInt, accessor, and resource policies are opt-in;
- safe and canonical modes are separate named APIs.

See [compatibility details](https://github.com/alexandroit/stackline-stable-stringify/blob/main/docs/COMPATIBILITY.md) before replacing a
serializer that relies on undocumented edge behavior.

<a id="runtime-support"></a>

### Runtime support

The package is tested on Node.js 14.17 through current releases, Linux,
Windows, macOS, Deno 2, Bun, and browsers. Type declarations are compiled in a
matrix from TypeScript 3.9 through 7.0.

## Installation

<a id="install"></a>

### Install

```bash
npm install @stackline/stable-stringify
```

Keep an existing package name and imports with an npm alias:

## Usage

```bash
npm install fast-json-stable-stringify@npm:@stackline/stable-stringify
```

```js
const stringify = require('fast-json-stable-stringify');
```

<a id="quick-start"></a>

### Quick start

```js
import stringify from '@stackline/stable-stringify';

const first = { z: 1, nested: { y: 2, x: 3 }, a: true };
const second = { a: true, nested: { x: 3, y: 2 }, z: 1 };

stringify(first) === stringify(second); // true
// {"a":true,"nested":{"x":3,"y":2},"z":1}
```

Arrays retain their input order. Object keys are sorted at every depth. Input
objects are never mutated.

<a id="commonjs"></a>

### CommonJS

```js
const stringify = require('@stackline/stable-stringify');

stringify({ z: 1, a: 2 });
stringify.safeStringify(value);
stringify.canonicalize(value);
```

## Features and Integrations

<a id="safe-serialization"></a>

### Safe serialization

`safeStringify` is intended for logs, diagnostics, and error reporting. It
serializes BigInt as strings, marks cycles, and applies bounded defaults.

```js
import { safeStringify } from '@stackline/stable-stringify';

const event = { id: 42n };
event.request = event;

safeStringify(event);
// {"id":"42","request":"[Circular]"}
```

Its default budgets are `maxDepth: 100`, `maxEntries: 100000`, and
`maxLength: 1000000`. A hostile getter, throwing `toJSON`, or exceeded limit
returns a controlled JSON string. Set `throwOnError: true` to propagate the
original error.

```js
safeStringify(value, replacer, 2, {
  depthLimit: 20,
  edgesLimit: 5000,
  maxLength: 250000,
  throwOnError: true
});
```

<a id="rfc-8785-canonical-json"></a>

### RFC 8785 canonical JSON

Use `canonicalize` when bytes must be reproducible across systems, such as
digital signatures, content-addressed storage, or cryptographic hashes.

```js
import {
  canonicalize,
  canonicalizeBytes
} from '@stackline/stable-stringify';

canonicalize({ amount: 4.50, currency: 'CAD', active: true });
// {"active":true,"amount":4.5,"currency":"CAD"}

const bytes = canonicalizeBytes({ z: 1, a: 2 });
// Uint8Array containing UTF-8 bytes for {"a":2,"z":1}
```

Canonical mode intentionally rejects data that cannot satisfy RFC 8785 and
I-JSON, including:

- `NaN`, `Infinity`, BigInt, `undefined`, functions, and symbols;
- circular references and sparse arrays;
- lone UTF-16 surrogates;
- accessors, enumerable symbol properties, and class instances.

It does not invoke getters or `toJSON`. Convert application objects to plain
JSON data before canonicalization.

<a id="browser"></a>

### Browser

```html
<script src="https://cdn.jsdelivr.net/npm/@stackline/stable-stringify/dist/index.min.js"></script>
<script>
  const output = StacklineStableStringify({ z: 1, a: 2 });
</script>
```

The browser global is callable and includes the same helper methods as the
CommonJS export.

<a id="performance"></a>

### Performance

Run the local comparison:

```bash
npm run benchmark
```

The benchmark reports native `JSON.stringify`,
`fast-json-stable-stringify@2.1.0`, stable mode, safe mode, and RFC 8785 mode
on the same payload. Native JSON is shown only as a throughput baseline; it
does not recursively sort object keys. Measure with representative production
data before selecting limits or modes.

<a id="adoption-resources"></a>

### Adoption resources

- [Stable, safe, canonical, and drop-in adoption guide](https://github.com/alexandroit/stackline-stable-stringify/blob/main/docs/ADOPTION.md)
- [Reproducible benchmark methodology](https://github.com/alexandroit/stackline-stable-stringify/blob/main/docs/BENCHMARKS.md)
- [Executable examples](https://github.com/alexandroit/stackline-stable-stringify/blob/main/examples)
- [Stackline open-source catalog](https://alexandro.net/docs/open-source/)

The examples ship in the npm tarball and cover deterministic cache keys,
canonical content digests, and bounded logging of cyclic BigInt data.

## Security

Read [SECURITY.md](https://github.com/alexandroit/stackline-stable-stringify/blob/main/SECURITY.md) for the supported versions, trust boundaries,
resource-limit guidance, and private reporting process.

## API Surface

<a id="api"></a>

### API

#### `stringify(value, options?)`

The default export and the named `stableStringify` and `stringify` exports are
the same function.

```js
import stringify from '@stackline/stable-stringify';

stringify(value);
stringify(value, comparator);
stringify(value, { cmp: comparator, cycles: true });
```

Like `JSON.stringify`, a root `undefined`, function, or symbol returns
`undefined`. Unsupported object properties are omitted and unsupported array
items become `null`.

#### Stable options

| Option | Default | Purpose |
| :--- | :--- | :--- |
| `cmp` | key order | Compare `{ key, value }` records |
| `cycles` | `false` | Compatible shortcut for a `__cycle__` marker |
| `onCycle` | `throw` | `throw`, `marker`, `path`, or `null` |
| `cycleValue` | `__cycle__` | Custom marker for `onCycle: 'marker'` |
| `bigint` | `throw` | `throw`, `string`, or safe `number` |
| `replacer` | none | Function or JSON-style property list |
| `space` | none | JSON-style indentation, capped at 10 characters |
| `accessors` | `invoke` | `invoke`, `omit`, or `throw` |
| `toJSON` | `true` | Invoke compatible `toJSON` hooks |
| `maxDepth` | unlimited | Maximum container nesting depth |
| `maxEntries` | unlimited | Maximum visited array items and object keys |
| `maxLength` | unlimited | Maximum UTF-16 output length |

Unlimited defaults preserve compatibility. Apply explicit limits at exposed
trust boundaries, or use `safeStringify`.

#### Cycle paths

```js
const value = { id: 1 };
value.child = { owner: value };

stringify(value, { onCycle: 'path' });
// {"child":{"owner":"[Circular <root>]"},"id":1}
```

Repeated sibling references are serialized normally; only references to an
active ancestor are cycles.

#### Comparator

```js
const descending = (left, right) =>
  right.key.localeCompare(left.key);

stringify({ a: 1, c: 3, b: 2 }, descending);
// {"c":3,"b":2,"a":1}
```

#### `configure(defaults?)`

Create a reusable serializer without rebuilding option objects at call sites.

```js
import { configure } from '@stackline/stable-stringify';

const cacheKey = configure({
  maxDepth: 50,
  maxEntries: 10000,
  maxLength: 500000
});

cacheKey({ route: '/users', query: { page: 2 } });
```

Per-call options override configured defaults.

#### Errors

`StableStringifyLimitError` extends `RangeError` and exposes `code`, `kind`,
`limit`, and `path`. `CanonicalizationError` extends `TypeError` and exposes
`code`, `reason`, and `path`.

## Local Development

```sh
git clone https://github.com/alexandroit/stackline-stable-stringify.git
cd stackline-stable-stringify
npm ci
npm run test
```

Release tooling uses Node.js 24.20.0 and npm 11.19.0. The consumer runtime contract remains the one documented above.

## Consumer Smoke Test

Run the repository's existing consumer/package check after installing development dependencies:

```sh
npm run test:install
```

## Release Checklist

<a id="verification"></a>

### Verification

Every release runs:

- 100% statement, line, and function coverage with at least 95% branches;
- differential compatibility tests;
- TypeScript 3.9 through 7.0 compilation;
- clean tarball installs for direct and aliased package names;
- ESM, CommonJS, browser, Deno, and Bun runtime checks;
- `publint`, `attw`, dependency audit, CodeQL, SBOM, and checksum generation.

The [live playground](https://alexandro.net/docs/vanilla/stable-stringify/)
runs the published browser bundle.

Run `npm run test` and inspect the package contents before release. Publish a new version through the [GitHub Actions publishing workflow](https://github.com/alexandroit/stackline-stable-stringify/actions/workflows/publish.yml), using the SHA-512 digest of the reviewed tarball. Verify the exact published version, tarball integrity, and npm provenance after the run.

## License

MIT. This is an independent implementation and is not affiliated with or
endorsed by the maintainers of the comparison packages. See [NOTICE](https://github.com/alexandroit/stackline-stable-stringify/blob/main/NOTICE)
for attribution and compatibility context.

## Credits and original authors

- Alexandro Paixao Marques.
- Copyright (c) 2026 Alexandro Paixao Marques and contributors.
- Stackline maintenance: [Alexandro Paixao Marques](https://www.linkedin.com/in/aleinfo/) and [Stackline contributors](https://github.com/alexandroit).

Original copyright, license notices and contributor acknowledgements remain part of this distribution. Stackline maintenance does not replace authorship of the original work.

## Community and Links

- [Stackline website](https://alexandro.net/)
- [GitHub projects](https://github.com/alexandroit)
- [npm packages](https://www.npmjs.com/~alex360qc)
- [Reddit community — r/Stackline](https://www.reddit.com/r/Stackline/)
- [Maintainer LinkedIn](https://www.linkedin.com/in/aleinfo/)

Use this repository's issue tracker for reproducible bugs and feature requests. Join r/Stackline for examples, usage questions and release discussions.
