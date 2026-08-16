# Releasing

## Preconditions

- `main` is the only default development branch.
- Version and changelog agree.
- Runtime dependencies remain zero or the exception is documented.
- The full local suite and GitHub CI pass.
- The npm and Verdaccio package names are available or authenticated.

## Local release gate

```bash
npm ci
npm test
npm run test:attw
npm run audit:dependencies
npm pack --dry-run
```

Run the benchmark for regression evidence, not as a pass/fail release gate.

## Artifact creation

Build once and retain one immutable tarball:

```bash
mkdir -p release/1.0.0
npm pack --ignore-scripts --pack-destination release/1.0.0
sha512sum release/1.0.0/*.tgz > release/1.0.0/SHA512SUMS
npm sbom --omit=dev --sbom-format cyclonedx > release/1.0.0/sbom.cdx.json
```

Run `scripts/smoke-install.mjs` against the retained path. The same bytes must
be published to Verdaccio and public npm.

## Registry order

1. publish the retained tarball to Verdaccio;
2. install directly and through the compatibility alias;
3. compare tarball integrity and run smoke tests;
4. publish the same tarball to public npm;
5. download it from npm and compare SHA-512;
6. verify `latest`, provenance metadata, dependency audit, and registry
   signature where available.

Never rebuild between registry publications.

## GitHub release

Tag the exact tested commit as `vX.Y.Z`. Attach the tarball, `SHA512SUMS`, and
CycloneDX SBOM. Confirm CI and CodeQL are green for the tagged source.

## Documentation

Build and test the static site, deploy it under
`/docs/vanilla/stable-stringify/`, update the central sitemap, and verify HTML,
CSS, JavaScript, image, robots, sitemap, metadata, LLM references, mobile
layout, and playground behavior in production.

## Rollback

npm versions are immutable. Do not unpublish a consumed release except for a
compelling security or legal reason. Deprecate a bad version with a precise
message and publish a patch from the last known-good source.
