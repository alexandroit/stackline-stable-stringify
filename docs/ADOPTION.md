# Adoption Guide

## Stable cache keys

Use the default export when object insertion order must not change a cache key,
snapshot, deduplication identifier, or content hash.

```js
import stringify from '@stackline/stable-stringify';

const key = stringify({ tenant: 42, query: { status: 'open' } });
```

## Drop-in package alias

Applications already using `fast-json-stable-stringify` can preserve their
imports:

```bash
npm uninstall fast-json-stable-stringify
npm install fast-json-stable-stringify@npm:@stackline/stable-stringify
```

Commit the lockfile and run the complete application suite. The default call
shape and comparator contract are covered by differential compatibility tests.

## Safe diagnostics

Use `safeStringify` for logs and error paths that can contain cycles, BigInt,
getters, or deeply nested data. Its bounded defaults keep diagnostic output
from becoming another failure source.

## Cryptographic canonicalization

Use `canonicalize` or `canonicalizeBytes` only when strict RFC 8785 behavior is
required. Canonical mode intentionally rejects values outside its I-JSON
contract instead of silently applying safe-logging policies.
