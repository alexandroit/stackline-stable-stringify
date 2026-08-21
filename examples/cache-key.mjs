import assert from 'node:assert/strict';

import stringify from '@stackline/stable-stringify';

const first = { query: { page: 2, status: 'open' }, tenant: 42 };
const second = { tenant: 42, query: { status: 'open', page: 2 } };

const firstKey = stringify(first);
const secondKey = stringify(second);

assert.equal(firstKey, secondKey);
console.log(firstKey);
