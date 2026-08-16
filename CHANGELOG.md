# Changelog

All notable changes are documented here. This project follows Semantic
Versioning.

## [1.0.0] - 2026-08-16

### Added

- Deterministic recursive JSON serialization with zero runtime dependencies.
- Compatible `fast-json-stable-stringify` comparator and cycle options.
- Circular object and array policies: throw, marker, path, and null.
- Iterative traversal tested with 25,000 nested containers.
- BigInt, replacer, indentation, accessor, and `toJSON` policies.
- Opt-in depth, entry, and output-length limits with structured errors.
- Safe diagnostic serialization with bounded defaults and controlled fallback.
- Strict RFC 8785 JSON canonicalization and UTF-8 byte output.
- ESM, callable CommonJS, browser-global, and source-map distributions.
- TypeScript declarations tested from 3.9 through 7.0.
- 30,000 differential cases against `fast-json-stable-stringify@2.1.0`.
- Public documentation, security policy, CI matrix, and live playground.

[1.0.0]: https://github.com/alexandroit/stackline-stable-stringify/releases/tag/v1.0.0
