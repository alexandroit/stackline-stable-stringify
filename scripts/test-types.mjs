import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const version =
  process.argv[2] ||
  process.env.TYPESCRIPT_VERSION ||
  packageJson.devDependencies.typescript;
const [major, minor = 0] = version.split('.').map(Number);
const work = await mkdtemp(path.join(os.tmpdir(), 'stackline-stable-stringify-types-'));
const packDirectory = path.join(work, 'pack');
const appDirectory = path.join(work, 'app');

try {
  await mkdir(packDirectory);
  await mkdir(appDirectory);

  const packOutput = run(
    'npm',
    ['pack', '--ignore-scripts', '--json', '--pack-destination', packDirectory],
    root
  );
  const [{ filename }] = JSON.parse(packOutput);
  const tarball = path.join(packDirectory, filename);

  run('npm', ['init', '--yes'], appDirectory);
  run(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      `typescript@${version}`,
      tarball
    ],
    appDirectory
  );

  await cp(
    path.join(appDirectory, 'node_modules', '@stackline', 'stable-stringify'),
    path.join(appDirectory, 'node_modules', 'fast-json-stable-stringify'),
    { recursive: true }
  );

  await writeFile(path.join(appDirectory, 'common.ts'), commonSource(), 'utf8');
  const files = ['common.ts'];
  if (major > 4 || (major === 4 && minor >= 7)) {
    await writeFile(path.join(appDirectory, 'module.mts'), moduleSource(), 'utf8');
    files.push('module.mts');
  }

  const modernModule = files.includes('module.mts');
  await writeFile(
    path.join(appDirectory, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          esModuleInterop: true,
          lib: ['ES2020'],
          module: modernModule ? 'Node16' : 'commonjs',
          moduleResolution: modernModule ? 'Node16' : 'node',
          noEmit: true,
          skipLibCheck: false,
          strict: true,
          target: 'ES2018'
        },
        files
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  run(path.join(appDirectory, 'node_modules', '.bin', 'tsc'), ['-p', 'tsconfig.json'], appDirectory);
  console.log(`TypeScript ${version} package compatibility passed`);
} finally {
  if (!process.env.KEEP_TYPES_TEST) await rm(work, { force: true, recursive: true });
}

function run(command, args, cwd) {
  const env = { ...process.env, npm_config_loglevel: 'error' };
  delete env.npm_config_dry_run;
  delete env.NPM_CONFIG_DRY_RUN;

  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function commonSource() {
  return `
import stringify = require('@stackline/stable-stringify');
import compatibleName = require('fast-json-stable-stringify');

const output: string | undefined = stringify({ z: 1, a: 2 });
const compatible: string | undefined = compatibleName(
  { z: 1, a: 2 },
  (left, right) => left.key.localeCompare(right.key)
);

const options: stringify.StableStringifyOptions = {
  accessors: 'omit',
  bigint: 'string',
  cmp: (left, right) => left.key.localeCompare(right.key),
  cycles: true,
  maxDepth: 100,
  maxEntries: 1000,
  maxLength: 10000,
  onCycle: 'path',
  replacer: ['id', 'name'],
  space: 2,
  toJSON: false
};

const configured = stringify.configure(options);
const configuredOutput: string | undefined = configured({ id: 1, name: 'demo' });
const safeOptions: stringify.SafeStringifyOptions = {
  depthLimit: 10,
  edgesLimit: 100,
  throwOnError: true
};
const safe: string | undefined = stringify.safeStringify({ value: 1 }, null, 2, safeOptions);
const canonicalOptions: stringify.CanonicalizeOptions = { maxDepth: 10 };
const canonical: string = stringify.canonicalize({ z: 1, a: 2 }, canonicalOptions);
const bytes: Uint8Array = stringify.canonicalizeBytes({ a: 1 });
const limitError = new stringify.StableStringifyLimitError('depth', 1);
const canonicalError = new stringify.CanonicalizationError('invalid input');
const direct: stringify.StringifyFunction = stringify.stableStringify;

void [
  output,
  compatible,
  configuredOutput,
  safe,
  canonical,
  bytes,
  limitError,
  canonicalError,
  direct
];
`;
}

function moduleSource() {
  return `
import stringify, {
  CanonicalizationError,
  StableStringifyLimitError,
  canonicalize,
  canonicalizeBytes,
  configure,
  safeStringify,
  stableStringify,
  type CanonicalizeOptions,
  type StableStringifyOptions
} from '@stackline/stable-stringify';

const options: StableStringifyOptions = { cycles: true, bigint: 'string' };
const output: string | undefined = stringify({ z: 1, a: 2 }, options);
const named: string | undefined = stableStringify({ z: 1, a: 2 });
const configured = configure({ maxDepth: 20 });
const configuredOutput: string | undefined = configured({ a: 1 });
const safe: string | undefined = safeStringify({ a: 1 });
const canonicalOptions: CanonicalizeOptions = { maxEntries: 100 };
const canonical: string = canonicalize({ a: 1 }, canonicalOptions);
const bytes: Uint8Array = canonicalizeBytes({ a: 1 });
const limitError = new StableStringifyLimitError('length', 10);
const canonicalError = new CanonicalizationError('invalid input');

void [
  output,
  named,
  configuredOutput,
  safe,
  canonical,
  bytes,
  limitError,
  canonicalError
];
`;
}
