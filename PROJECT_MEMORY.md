# Project Memory

## Permanent rules

- Public package: `@stackline/stable-stringify`.
- Public repository:
  `https://github.com/alexandroit/stackline-stable-stringify`.
- Public documentation:
  `https://alexandro.net/docs/vanilla/stable-stringify/`.
- Primary branch: `main`; never maintain a duplicate default branch.
- License: MIT.
- Runtime dependencies remain zero unless a future major release documents a
  compelling supply-chain review.
- Preserve direct imports and the npm alias migration shape:
  `fast-json-stable-stringify@npm:@stackline/stable-stringify`.
- Preserve TypeScript 3.9 compatibility throughout 1.x.
- Stable-mode defaults remain compatible; stronger behavior is opt-in or a
  separate named API.
- Canonical mode follows RFC 8785 and must never silently coerce invalid data.
- Publish one validated tarball to Verdaccio and public npm; never rebuild
  between registries.
- Do not publish until local tests, clean installs, GitHub CI, and CodeQL pass.
- Record every release, incident, and operational decision in this file.

## 2026-08-16 - Product selection

The official npm API reported 1,127,973,517 combined downloads from 2026-07-17
through 2026-08-15 across `fast-json-stable-stringify`,
`safe-stable-stringify`, `fast-safe-stringify`, and `json-stringify-safe`.
The prior fixed 30-day period totaled 1,104,244,204. These are package
downloads, not unique users.

The opportunity is one focused serializer covering three related contracts:
stable cache or snapshot output, safe diagnostics, and RFC 8785 canonical
bytes. The implementation is original. `fast-json-stable-stringify@2.1.0` is
used only as a development dependency and behavioral reference.

## Implementation contract

- Recursive UTF-16 object-key ordering; array order is preserved.
- Comparator, `cycles`, `toJSON`, wrapper, omission, and primitive behavior
  compatible with the reference package.
- Iterative task-stack traversal; 25,000 nested containers are tested.
- Cycle modes: throw, marker, path, and null.
- BigInt modes: throw, string, and safe number.
- Replacer, indentation, accessor, `toJSON`, depth, entry, and length options.
- Safe mode defaults: depth 100, entries 100,000, output 1,000,000.
- Canonical mode rejects non-I-JSON values, malformed Unicode, accessors,
  symbols, classes, sparse arrays, and cycles without invoking user hooks.
- ESM, callable CommonJS, browser global, source maps, and resolver-specific
  types.
- Node.js floor 14.17; TypeScript matrix 3.9 through 7.0.
- Zero runtime dependencies.

## Validation completed so far

- 32 source tests pass.
- 30,000 deterministic reference comparisons pass.
- Coverage is 100% statements, lines, and functions; 98.31% branches.
- A 25,000-level structure serializes without call-stack overflow.
- The RFC 8785 primary example, Unicode ordering, number vectors, strict input
  failures, and UTF-8 fallback pass.
- ESM, CommonJS, and browser bundle tests pass.
- Clean tarball installs pass directly and under the compatibility alias.
- `publint` passes.
- TypeScript 3.9.10, 4.7.4, 4.9.5, 5.9.3, 6.0.2, and 7.0.2 pass.

## Release status

Version `1.0.0` is under validation. Verdaccio, GitHub, public npm, production
documentation, release hashes, SBOM, CI run IDs, and CodeQL run IDs must be
recorded here after they are verified.
