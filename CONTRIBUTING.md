# Contributing

Thank you for improving `@stackline/stable-stringify`.

## Development

Use Node.js 20 or newer for the development toolchain. Published runtime
support is tested separately.

```bash
npm ci
npm test
npm run test:attw
npm run benchmark
```

## Pull requests

Keep each change focused. Include:

- the behavior being changed;
- tests for normal and adversarial input;
- compatibility impact;
- performance and security impact for traversal changes;
- documentation for public API changes.

Do not reduce canonical strictness, safe-mode limits, or error visibility to
improve a benchmark.

## Compatibility changes

The default API tracks documented `fast-json-stable-stringify@2.1.0` behavior.
Before changing stable-mode semantics:

1. add a focused local regression;
2. update the differential corpus when applicable;
3. document every intentional difference;
4. validate direct and npm-alias installation shapes.

Canonical mode follows RFC 8785 and I-JSON constraints. Standards changes need
a source citation and interoperability vector.

## Security changes

Do not discuss a suspected vulnerability in a public issue before a patched
release exists. Follow [SECURITY.md](SECURITY.md).

## Commits

Use a short imperative subject. Keep generated output and unrelated formatting
out of the same commit.

By contributing, you agree that your contribution is licensed under the MIT
License.
