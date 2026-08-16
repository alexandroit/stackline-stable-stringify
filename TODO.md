# Roadmap

## Release 1.x

- [ ] Make the central Alexandro.Net docs staging tool preserve legacy roots
  and regenerate the aggregate sitemap before allowing full `--delete` syncs.
- [ ] Configure npm trusted publishing and GitHub OIDC provenance before the
  next public release.
- [ ] Publish cross-language RFC 8785 interoperability vectors.
- [ ] Add Web Streams output without changing the synchronous API.
- [ ] Evaluate a deterministic `Map` and `Set` conversion policy as opt-in.
- [ ] Add framework smoke projects when a real compatibility gap is reported.
- [ ] Track benchmark history across supported Node.js LTS releases.
- [ ] Publish the differential corpus as a machine-readable fixture package.
- [ ] Evaluate WebAssembly hashing examples while keeping cryptography outside
  the serializer runtime.

## Maintenance rules

- Never weaken canonical validation for convenience.
- Never hide a limit failure in strict mode.
- Never add a runtime dependency without a documented supply-chain review.
- Never narrow TypeScript support in a patch release.
- Keep direct and alias installation tests in every release.
- Record release evidence and operational changes in `PROJECT_MEMORY.md`.
