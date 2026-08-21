import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { canonicalizeBytes } from '@stackline/stable-stringify';

const document = {
  issuedAt: '2026-08-21T00:00:00Z',
  subject: 'release-manifest',
  version: 1
};

const digest = createHash('sha256')
  .update(canonicalizeBytes(document))
  .digest('hex');

assert.equal(digest.length, 64);
console.log(digest);
