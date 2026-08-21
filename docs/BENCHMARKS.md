# Benchmark Methodology

The benchmark runs native `JSON.stringify`,
`fast-json-stable-stringify@2.1.0`, stable mode, safe mode, and RFC 8785 mode
against the same representative payload in one Node.js process.

```bash
npm ci
npm run benchmark
```

Control the sample size with `BENCHMARK_ITERATIONS`:

```bash
BENCHMARK_ITERATIONS=250000 npm run benchmark
```

Native JSON is a throughput baseline only. It does not recursively sort object
keys and is not behaviorally equivalent. Stable, safe, and canonical modes
also implement different contracts, so compare a mode only with alternatives
that provide the same guarantees.

When publishing results, include the command, Node.js version, CPU, complete
raw output, and payload shape. Do not present one machine's result as a
universal ranking.
