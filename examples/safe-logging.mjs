import assert from 'node:assert/strict';

import { safeStringify } from '@stackline/stable-stringify';

const event = { id: 42n, name: 'checkout.failed' };
event.context = event;

const output = safeStringify(event);

assert.equal(
  output,
  '{"context":"[Circular]","id":"42","name":"checkout.failed"}'
);
console.log(output);
