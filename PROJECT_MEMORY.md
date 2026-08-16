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
- Deploy this documentation directory with a targeted rsync. The central
  staging script does not currently reproduce every legacy docs root or the
  aggregate sitemap, so it must not be synced to production with `--delete`.
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

## Current validation baseline (1.0.1)

- 33 source tests pass.
- 30,000 deterministic reference comparisons pass.
- Coverage is 100% statements, lines, and functions; 99.00% branches.
- A 25,000-level structure serializes without call-stack overflow.
- The RFC 8785 primary example, Unicode ordering, number vectors, strict input
  failures, and UTF-8 fallback pass.
- ESM, CommonJS, and browser bundle tests pass.
- Clean tarball installs pass directly and under the compatibility alias.
- The clean public-registry alias install passes in CommonJS and ESM.
- `publint` and `@arethetypeswrong/cli` pass.
- TypeScript 3.9.10, 4.7.4, 4.9.5, 5.9.3, 6.0.2, and 7.0.2 pass.
- GitHub CI passes on Linux, macOS, Windows, Node.js 14.17 through 24, Deno 2,
  Bun, and the complete TypeScript matrix.
- GitHub CI run `31956876432` and CodeQL run `31956876602` passed for commit
  `8c218cb2d9de6b4de9fabd989ecc42e568b7159d`.
- `npm audit` reports zero production vulnerabilities. The public tarball has
  a verified npm registry signature.
- Benchmark sample at 50,000 operations: native JSON 964,098 ops/s,
  `fast-json-stable-stringify` 340,117 ops/s, stable mode 207,047 ops/s, safe
  mode 200,690 ops/s, and canonical mode 160,391 ops/s. Native JSON is not a
  deterministic-key-order replacement.

## 2026-08-16 - Public release 1.0.0

- Published `@stackline/stable-stringify@1.0.0` with the `latest` tag to the
  local Verdaccio at `http://127.0.0.1:4873` and to the official public npm
  registry.
- Public npm package:
  `https://www.npmjs.com/package/@stackline/stable-stringify`.
- The package is public, has zero runtime dependencies, and installs directly
  with `npm install @stackline/stable-stringify`.
- The compatibility alias installs with
  `npm install fast-json-stable-stringify@npm:@stackline/stable-stringify`.
- Both registries serve the exact CI-built tarball. The public npm tarball was
  downloaded anonymously and compared byte for byte with the retained
  artifact.
- Retained release directory:
  `/storage/data/releases/stackline-stable-stringify/1.0.0-ci-31955842695`.
- Tarball SHA-1:
  `fbd98a810d65be5f75fa29d5f781faedcb6816d0`.
- Tarball SHA-512:
  `40f4bfe8e9991b2d57c30bc9cae3f92e1c21d3312b1028188403579532c3e09df585a1c649cb384508428880699ed828ea42c981f848c1e63f8b2eaf4b4ce2b5`.
- npm integrity:
  `sha512-QPS/6OmZGy1XwwvJyuP5Lhwh0zErECgYhANXlTLD4J31haHGScs4RQhCiIBpntgo6kLJgfhIweY/iy6vS0zitQ==`.
- GitHub tag `v1.0.0` points to the exact tested commit `419bd2a`.
- GitHub release:
  `https://github.com/alexandroit/stackline-stable-stringify/releases/tag/v1.0.0`.
- The GitHub release contains the exact npm tarball, portable `SHA512SUMS`,
  and a CycloneDX SBOM.
- Production documentation is deployed at
  `https://alexandro.net/docs/vanilla/stable-stringify/` and registered in
  `/storage/data/github/revivejs/tools/alexandro-docs.config.mjs`.
- Production browser checks pass at 1440x1000 and 390x844 with no horizontal
  overflow, console errors, page errors, or failed requests. All seven
  playground presets execute with their intended success, controlled fallback,
  or controlled rejection state.
- Browser evidence is retained as `browser-validation.json`,
  `docs-desktop.png`, and `docs-mobile.png` in the release directory.
- The local documentation preview remains available at
  `http://127.0.0.1:4174` while the current workstation session is running.
- The first public release has a verified npm registry signature. It was
  published with the authenticated npm CLI, so it does not claim GitHub OIDC
  provenance; trusted publishing is a future release-engineering improvement.

## 2026-08-16 - Public release 1.0.1

- The final adversarial review found that canonical object classification used
  `Object.prototype.toString`, which could consult a non-enumerable
  `Symbol.toStringTag` accessor, and that enumerable symbol properties were not
  rejected on arrays.
- Canonical validation no longer consults `Symbol.toStringTag`, does not invoke
  the regression getter, and rejects enumerable symbols consistently on arrays
  and objects. Stable mode, safe mode, public types, and import contracts are
  unchanged.
- Release automation no longer hardcodes versioned tarball names. Static HTML
  and the full LLM reference render the version directly from `package.json`.
- Published `@stackline/stable-stringify@1.0.1` as `latest` to Verdaccio and the
  official public npm registry from the same CI-built bytes.
- Retained release directory:
  `/storage/data/releases/stackline-stable-stringify/1.0.1-ci-31956876432`.
- Tarball SHA-1:
  `7faa93ae1daabd4f3a9cdae068486817228b2578`.
- Tarball SHA-512:
  `5f29f9cc9148ece6e93a1b6ff5fe67e49c2099ee0119ce25444cd32001b7a77525b6a9b7c99c70fdb964825734e07580b4dd5655d3b59e226342604c4fff3a45`.
- npm integrity:
  `sha512-Xyn5zJFI7ObpOhtv9f5n5Jwgme4BGc4lREzTIAG3p3Ultqm3yZxw/blkglc04HWAtN1WVdO1niJjQmBMT/86RQ==`.
- Anonymous npm download, local rebuild, and Verdaccio download all compared
  byte for byte with the CI artifact. Direct and aliased clean installs pass in
  CommonJS and ESM with zero production vulnerabilities and a verified npm
  registry signature.
- GitHub tag `v1.0.1` points to exact tested commit `8c218cb`; the release at
  `https://github.com/alexandroit/stackline-stable-stringify/releases/tag/v1.0.1`
  contains the tarball, portable `SHA512SUMS`, and CycloneDX SBOM.
- Production documentation and the local preview now expose `v1.0.1`.
  Production browser validation passed at 1440x1000 and 390x844 with all seven
  presets, no horizontal overflow, and no console, page, or network failures.
- Browser validation JSON and screenshots are retained beside the release
  artifacts.

## 2026-08-16 - Documentation mirror safeguard

- A full central staging sync exposed that
  `/storage/data/github/revivejs/tools/stage-alexandro-docs.mjs` omits the
  legacy `ai/` and nested `docs/` roots and does not generate the aggregate
  `sitemap.xml`.
- Those omitted paths were restored from the local canonical mirror at
  `/var/www/html/alexandro.net_docs` immediately after detection. The restored
  nested docs tree contains 4,977 files and the AI tree contains 7 files.
- The aggregate sitemap was restored, validated as XML, and extended with the
  public Deepmerge and Stable Stringify documentation URLs.
- Public checks return HTTP 200 for `/docs/ai/`, `/docs/sitemap.xml`, the new
  Stable Stringify docs, and sampled existing Angular, React, and Vanilla docs.
- Future deployments for this project must sync only
  `vanilla/stable-stringify/` plus intentional index or sitemap files until the
  central staging tool preserves every production-owned root.
