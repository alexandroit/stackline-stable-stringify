# Changelog

All notable changes are documented here. This project follows Semantic
Versioning.

## [1.0.2] - 2026-08-21

### Added

- Executable examples for deterministic cache keys, RFC 8785 content digests,
  and bounded cyclic logging.
- Adoption guidance for direct installs, npm aliases, safe diagnostics, and
  canonical signatures.
- Reproducible benchmark methodology and Stackline package catalog link.
- First-party documentation analytics that never records serialized input.
- Trusted-publishing workflow for provenance-enabled future releases.

### Changed

- Package tarballs now include the public guides and executable examples.

No runtime API or declaration behavior changed in this release.

## [1.0.1] - 2026-08-16

### Fixed

- Canonical object validation no longer consults `Symbol.toStringTag`, so a
  non-enumerable accessor cannot run during strict validation.
- Canonical arrays now reject enumerable symbol properties with the same
  strict behavior as canonical objects.
- Documentation versions are rendered from package metadata during builds.

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

[1.0.1]: https://github.com/alexandroit/stackline-stable-stringify/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/alexandroit/stackline-stable-stringify/releases/tag/v1.0.0
[1.0.2]: https://github.com/alexandroit/stackline-stable-stringify/compare/v1.0.1...v1.0.2
