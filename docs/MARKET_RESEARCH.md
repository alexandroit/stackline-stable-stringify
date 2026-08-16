# Market Research

## Decision

The selected opportunity is a unified deterministic JSON serializer with a
compatible stable API, safe diagnostic mode, and RFC 8785 canonical mode.

It addresses a mature, high-volume need without copying an abandoned codebase.
The runtime is original; comparison packages are development references only.

## Evidence window

The research uses the official npm downloads and registry APIs. The fixed
30-day window is 2026-07-17 through 2026-08-15. The comparison window is
2026-06-17 through 2026-07-16. Fixed dates make the findings reproducible.

| Package | Recent 30 days | Prior 30 days | Change | Latest release |
| :--- | ---: | ---: | ---: | :--- |
| `fast-json-stable-stringify` | 587,334,858 | 581,507,983 | +1.00% | 2.1.0, 2019-12-14 |
| `safe-stable-stringify` | 210,997,298 | 206,370,668 | +2.24% | 2.5.0, 2024-08-24 |
| `fast-safe-stringify` | 172,544,640 | 161,813,217 | +6.63% | 2.1.1, 2021-09-08 |
| `json-stringify-safe` | 157,096,721 | 154,552,336 | +1.65% | 5.0.1, 2015-05-19 |
| **Combined package activity** | **1,127,973,517** | **1,104,244,204** | **+2.15%** | four contracts |

The same packages recorded 9,395,146,202 combined downloads from 2025-08-16
through 2026-08-15.

These sums measure package activity, not unique users. Dependency trees can
install more than one package and repeated CI installs count again. The figures
demonstrate category scale and fragmentation; they do not guarantee adoption
for a new package.

## Primary sources

- [fast-json-stable-stringify downloads](https://api.npmjs.org/downloads/point/2026-07-17:2026-08-15/fast-json-stable-stringify)
- [safe-stable-stringify downloads](https://api.npmjs.org/downloads/point/2026-07-17:2026-08-15/safe-stable-stringify)
- [fast-safe-stringify downloads](https://api.npmjs.org/downloads/point/2026-07-17:2026-08-15/fast-safe-stringify)
- [json-stringify-safe downloads](https://api.npmjs.org/downloads/point/2026-07-17:2026-08-15/json-stringify-safe)
- [npm registry metadata](https://registry.npmjs.org/fast-json-stable-stringify)
- [RFC 8785: JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785.html)
- [ECMAScript JSON.stringify algorithm](https://tc39.es/ecma262/multipage/structured-data.html#sec-json.stringify)

## Product gap

The category is split by concern:

- the largest compatibility package offers stable key order but no current ESM
  declaration surface, safe diagnostic mode, resource limits, or JCS API;
- safe serializers focus on cycles and logging but differ in BigInt, getter,
  `toJSON`, depth, edge, and fallback behavior;
- canonical JSON implementations form another package category even though
  cache keys and signatures often exist in the same systems;
- several established releases are between two and eleven years old while
  download activity continues to grow.

Open issue themes in the comparison repositories include ESM, TypeScript
options, RFC 8785 support, wrapper semantics, output limits, getters, `toJSON`,
BigInt, and deep-stack behavior. The product contract directly tests those
boundaries instead of bundling unrelated utilities.

## Why this shape can grow

The adoption path has three levels:

1. existing users can keep the established function signature;
2. npm alias users can keep the existing import specifier;
3. new users gain safe and canonical modes without adding two more packages.

Zero runtime dependencies reduce supply-chain exposure. TypeScript 3.9 through
7.0, Node.js 14.17+, browsers, Deno, and Bun widen the usable install base.

## Rejected directions

### Another generic utility collection

Broad utility packages compete on dozens of unrelated APIs and create a larger
maintenance and security surface. The selected package owns one data boundary.

### Canonical JSON only

Standards compliance is valuable but is a smaller migration surface. Combining
it with the established stable call shape creates a practical entry point.

### Forking a legacy serializer

Forking would accelerate initial code volume but inherit architecture and
maintenance constraints. Behavioral compatibility is validated through tests;
the runtime remains independently designed and licensed.

## Success metrics

Potential is evaluated through measurable signals, not a promised download
number:

- direct and alias installs that need no code changes;
- issue resolution time and compatibility reports;
- reverse dependencies and weekly npm downloads;
- bundle size and runtime dependency count;
- regression-free releases across the supported matrix;
- adoption of safe and canonical named APIs.
