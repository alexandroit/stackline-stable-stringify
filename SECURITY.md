# Security Policy

## Supported versions

| Version | Security updates |
| :--- | :---: |
| `1.x` | Yes |
| `< 1.0.0` | No public releases |

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use the repository's
[private security advisory form](https://github.com/alexandroit/stackline-stable-stringify/security/advisories/new).

Include the affected version, a minimal reproducer, observed impact, runtime,
module system, and proposed mitigation when available. Complete reports are
normally acknowledged within three business days. Confirmed issues are fixed
privately, covered by regression tests, and disclosed after a patched release.

## Trust boundaries

Stable mode preserves `JSON.stringify`-style behavior for compatibility. It
may invoke a value's `toJSON`, a replacer callback, custom comparator, or
property getter. Those are executable application code and must not be sourced
from untrusted input.

For hostile or externally supplied object graphs:

- use `accessors: 'omit'` or `accessors: 'throw'`;
- use `toJSON: false`;
- set finite `maxDepth`, `maxEntries`, and `maxLength` values;
- do not accept comparator or replacer functions from users.

`safeStringify` applies finite defaults but preserves compatible getter and
`toJSON` behavior unless explicitly disabled. Its fallback prevents a logging
path from throwing by default; use `throwOnError: true` when failure must be
observable by the caller.

## Canonical mode

`canonicalize` is the strictest input boundary. It does not invoke getters or
`toJSON` and rejects accessors, class instances, symbol members, cycles, sparse
arrays, non-finite numbers, BigInt, and malformed Unicode. It still traverses
the supplied data, so keep finite limits when the input size is attacker
controlled.

Canonical JSON only provides deterministic bytes. It does not validate domain
schemas, authenticate input, create signatures, or choose a cryptographic hash.

## Denial-of-service controls

The iterative traversal avoids JavaScript call-stack exhaustion. Memory and
CPU use still grow with visited input and produced output. Resource limits are
part of the security contract for public endpoints, log ingestion, and build
systems processing third-party data.
