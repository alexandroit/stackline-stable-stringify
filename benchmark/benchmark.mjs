import { performance } from 'node:perf_hooks';

import fastJsonStableStringify from 'fast-json-stable-stringify';
import stringify, { canonicalize, safeStringify } from '../dist/index.js';

const payload = {
  request: {
    headers: {
      accept: 'application/json',
      authorization: 'Bearer redacted'
    },
    id: 'req_01JQXQ4M5P',
    query: { limit: 25, sort: 'createdAt' }
  },
  roles: ['reader', 'editor'],
  tenant: { id: 42, region: 'ca-central-1' }
};

for (const candidate of [
  JSON.stringify,
  fastJsonStableStringify,
  stringify,
  safeStringify,
  canonicalize
]) {
  for (let index = 0; index < 5000; index += 1) candidate(payload);
}

const iterations = Number(process.env.BENCHMARK_ITERATIONS || 100000);
const results = [
  run('JSON.stringify (not stable)', JSON.stringify, iterations),
  run('fast-json-stable-stringify@2.1.0', fastJsonStableStringify, iterations),
  run('@stackline/stable-stringify', stringify, iterations),
  run('@stackline/stable-stringify safe', safeStringify, iterations),
  run('@stackline/stable-stringify RFC 8785', canonicalize, iterations)
].sort((left, right) => right.operationsPerSecond - left.operationsPerSecond);

console.table(results);
console.log(
  'JSON.stringify is shown as a native baseline only; it does not sort object keys recursively.'
);

function run(name, candidate, count) {
  const startedAt = performance.now();
  for (let index = 0; index < count; index += 1) candidate(payload);
  const elapsedMs = performance.now() - startedAt;
  return {
    name,
    iterations: count,
    elapsedMs: Math.round(elapsedMs),
    operationsPerSecond: Math.round((count / elapsedMs) * 1000)
  };
}
