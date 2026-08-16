# Compatibility

## Default contract

The default export follows documented `fast-json-stable-stringify@2.1.0`
behavior:

- object keys are sorted recursively;
- arrays retain their order;
- a comparator receives `{ key, value }` records;
- comparator functions can be passed directly or as `cmp`;
- `{ cycles: true }` writes `__cycle__` for circular objects;
- `toJSON` runs before value serialization;
- JSON omission, primitive, wrapper-object, and non-finite number behavior is
  preserved.

The suite performs 30,000 deterministic differential serializations across
generated JSON-compatible values, comparators, and option forms.

## Intentional additions

| Area | Compatible default | Addition |
| :--- | :--- | :--- |
| Circular arrays | Upstream can overflow | Same policy as circular objects |
| Deep input | Recursive stack limit | Iterative traversal |
| Cycles | Throw or `__cycle__` | Path, null, and custom marker policies |
| BigInt | Throw | String or safe-number policies |
| Replacer | Not exposed | Function and JSON property list |
| Formatting | Compact | JSON-style `space` option |
| Accessors | Invoke | Omit or throw policies |
| Resources | Unbounded | Opt-in depth, entry, and length limits |
| Diagnostics | Separate ecosystem | `safeStringify` named export |
| Canonical JSON | Separate ecosystem | RFC 8785 string and byte exports |

No addition changes output unless its option or named API is used, except that
circular arrays now return the configured cycle behavior instead of causing a
call-stack failure.

## Package forms

| Consumer | Supported form |
| :--- | :--- |
| ESM | default and named imports |
| CommonJS | callable `require()` plus static helpers |
| Browser | `StacklineStableStringify` global |
| TypeScript | resolver-specific declarations |
| npm alias | `fast-json-stable-stringify@npm:@stackline/stable-stringify` |

## TypeScript

The public declarations use syntax accepted by TypeScript 3.9. ESM-specific
`.d.mts` resolution is validated from TypeScript 4.7 onward. The release matrix
currently covers 3.9.10, 4.7.4, 4.9.5, 5.9.3, 6.0.2, and 7.0.2.

Return types remain `string | undefined`, matching JSON root-value behavior.
Canonical APIs return `string` or `Uint8Array` because invalid values throw.

## Migration

Direct migration:

```js
import stringify from '@stackline/stable-stringify';
```

No-import-change migration:

```bash
npm install fast-json-stable-stringify@npm:@stackline/stable-stringify
```

The clean-install test executes both names in ESM and CommonJS from the packed
tarball, rather than resolving against the development workspace.

## Standards boundary

Stable output is deterministic for the same JavaScript data and options. It is
not automatically RFC 8785 canonical output. Use `canonicalize` when another
system, signature specification, or protocol requires JCS.
