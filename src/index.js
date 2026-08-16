const hasOwn = Object.prototype.hasOwnProperty;
const propertyIsEnumerable = Object.prototype.propertyIsEnumerable;
const objectToString = Object.prototype.toString;
const OMIT = Symbol('omit');
const ROOT_PATH = null;

const SAFE_DEFAULTS = Object.freeze({
  bigint: 'string',
  cycleValue: '[Circular]',
  maxDepth: 100,
  maxEntries: 100000,
  maxLength: 1000000,
  onCycle: 'marker'
});

const CANONICAL_DEFAULTS = Object.freeze({
  maxDepth: 1000,
  maxEntries: 100000,
  maxLength: 16 * 1024 * 1024
});

export class StableStringifyLimitError extends RangeError {
  constructor(kind, limit, path) {
    const location = formatPath(path);
    super(`Stable stringify ${kind} limit of ${limit} exceeded at ${location}`);
    this.name = 'StableStringifyLimitError';
    this.code = 'ERR_STABLE_STRINGIFY_LIMIT';
    this.kind = kind;
    this.limit = limit;
    this.path = location;
  }
}

export class CanonicalizationError extends TypeError {
  constructor(reason, path) {
    const location = formatPath(path);
    super(`JSON canonicalization failed at ${location}: ${reason}`);
    this.name = 'CanonicalizationError';
    this.code = 'ERR_JSON_CANONICALIZATION';
    this.path = location;
    this.reason = reason;
  }
}

export function stableStringify(value, inputOptions) {
  const options = normalizeStableOptions(inputOptions);
  return serialize(value, options, false);
}

export const stringify = stableStringify;

export function configure(inputDefaults) {
  const defaults =
    typeof inputDefaults === 'function'
      ? { cmp: inputDefaults }
      : normalizeInputObject(inputDefaults);
  normalizeStableOptions(defaults);

  return function configuredStableStringify(value, inputOptions) {
    const overrides =
      typeof inputOptions === 'function'
        ? { cmp: inputOptions }
        : normalizeInputObject(inputOptions);
    return stableStringify(value, { ...defaults, ...overrides });
  };
}

export function safeStringify(value, replacer, space, inputOptions) {
  const options = normalizeInputObject(inputOptions);
  const stableOptions = {
    ...SAFE_DEFAULTS,
    ...options,
    maxDepth:
      options.maxDepth === undefined ? options.depthLimit : options.maxDepth,
    maxEntries:
      options.maxEntries === undefined ? options.edgesLimit : options.maxEntries,
    replacer: replacer === undefined ? options.replacer : replacer,
    space: space === undefined ? options.space : space
  };

  if (stableOptions.maxDepth === undefined) {
    stableOptions.maxDepth = SAFE_DEFAULTS.maxDepth;
  }
  if (stableOptions.maxEntries === undefined) {
    stableOptions.maxEntries = SAFE_DEFAULTS.maxEntries;
  }

  try {
    return stableStringify(value, stableOptions);
  } catch (error) {
    if (options.throwOnError === true) throw error;
    let name = 'UnknownError';
    try {
      if (error && typeof error.name === 'string') {
        name = error.name.slice(0, 80);
      }
    } catch {
      // A thrown value can expose hostile accessors of its own.
    }
    return JSON.stringify(`[Unable to serialize: ${name}]`);
  }
}

export function canonicalize(value, inputOptions) {
  const options = normalizeCanonicalOptions(inputOptions);
  return serialize(value, options, true);
}

export function canonicalizeBytes(value, inputOptions) {
  return encodeUtf8(canonicalize(value, inputOptions));
}

function serialize(rootValue, options, canonical) {
  const state = {
    ancestors: new WeakMap(),
    canonical,
    chunks: [],
    entries: 0,
    length: 0,
    options
  };
  const holder = { '': rootValue };
  const prepared = prepareValue(rootValue, holder, '', ROOT_PATH, state);

  if (prepared === OMIT) return undefined;

  const tasks = [
    {
      depth: 0,
      path: ROOT_PATH,
      prepared,
      type: 'value'
    }
  ];

  while (tasks.length > 0) {
    const task = tasks.pop();
    if (task.type === 'value') {
      processValueTask(task, tasks, state);
    } else {
      processContainerTask(task, tasks, state);
    }
  }

  return state.chunks.join('');
}

function processValueTask(task, tasks, state) {
  if (task.prepared.kind === 'primitive') {
    append(state, task.prepared.text, task.path);
    return;
  }

  const value = task.prepared.value;
  const previousPath = state.ancestors.get(value);
  if (previousPath !== undefined || state.ancestors.has(value)) {
    appendCycle(state, previousPath, task.path);
    return;
  }

  enforceDepth(state, task.depth, task.path);
  const isArray = Array.isArray(value);
  if (state.canonical) {
    rejectEnumerableSymbols(value, task.path);
    if (!isArray) validateCanonicalObject(value, task.path);
  }

  state.ancestors.set(value, task.path);
  const frame = createContainerFrame(
    value,
    isArray,
    task.depth,
    task.path,
    state
  );
  append(state, isArray ? '[' : '{', task.path);

  if (frame.total === 0) {
    append(state, isArray ? ']' : '}', task.path);
    state.ancestors.delete(value);
    return;
  }

  tasks.push(frame);
}

function processContainerTask(frame, tasks, state) {
  if (frame.index >= frame.total) {
    if (frame.emitted && state.options.gap !== '') {
      append(state, `\n${frame.indent}`, frame.path);
    }
    append(state, frame.isArray ? ']' : '}', frame.path);
    state.ancestors.delete(frame.value);
    return;
  }

  if (frame.isArray) {
    const index = frame.index;
    frame.index += 1;
    const path = createPath(frame.path, index);
    consumeEntry(state, path);
    const rawValue = readArrayValue(frame.value, index, path, state);
    let prepared = prepareValue(
      rawValue,
      frame.value,
      String(index),
      path,
      state
    );
    if (prepared === OMIT) prepared = primitive('null');

    appendItemPrefix(frame, path, state);
    tasks.push(frame);
    tasks.push({
      depth: frame.depth + 1,
      path,
      prepared,
      type: 'value'
    });
    return;
  }

  while (frame.index < frame.total) {
    const key = frame.keys[frame.index];
    frame.index += 1;
    const path = createPath(frame.path, key);
    consumeEntry(state, path);
    const rawValue = readObjectValue(frame.value, key, path, state);
    const prepared = prepareValue(rawValue, frame.value, key, path, state);
    if (prepared === OMIT) continue;

    appendItemPrefix(frame, path, state);
    append(state, JSON.stringify(key), path);
    append(state, state.options.gap === '' ? ':' : ': ', path);
    tasks.push(frame);
    tasks.push({
      depth: frame.depth + 1,
      path,
      prepared,
      type: 'value'
    });
    return;
  }

  tasks.push(frame);
}

function createContainerFrame(value, isArray, depth, path, state) {
  let keys;
  let total;

  if (isArray) {
    total = value.length;
  } else {
    keys = getObjectKeys(value, path, state);
    total = keys.length;
  }

  return {
    depth,
    emitted: false,
    indent:
      state.options.gap === '' ? '' : state.options.gap.repeat(depth),
    index: 0,
    isArray,
    keys,
    path,
    total,
    type: 'container',
    value
  };
}

function getObjectKeys(value, path, state) {
  let keys;
  if (state.canonical || state.options.propertyList === undefined) {
    keys = Object.keys(value);
  } else {
    keys = state.options.propertyList.slice();
  }

  if (state.canonical) {
    for (const key of keys) {
      if (hasLoneSurrogate(key)) {
        throw new CanonicalizationError(
          'property names must not contain lone UTF-16 surrogates',
          createPath(path, key)
        );
      }
    }
    return keys.sort();
  }

  if (state.options.accessors !== 'invoke') {
    keys = keys.filter((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || (!descriptor.get && !descriptor.set)) return true;
      if (state.options.accessors === 'throw') {
        throw new TypeError(
          `Refusing to invoke accessor at ${formatPath(createPath(path, key))}`
        );
      }
      return false;
    });
  }

  if (state.options.cmp) {
    const comparator = state.options.cmp;
    keys.sort((left, right) =>
      comparator(
        { key: left, value: readForComparator(value, left, path, state) },
        { key: right, value: readForComparator(value, right, path, state) }
      )
    );
  } else {
    keys.sort();
  }
  return keys;
}

function prepareValue(rawValue, holder, key, path, state) {
  if (state.canonical) return prepareCanonicalValue(rawValue, path);

  let value = rawValue;
  if (state.options.toJSON && value !== null && value !== undefined) {
    const method = value.toJSON;
    if (typeof method === 'function') value = method.call(value);
  }

  if (state.options.replacerFunction) {
    value = state.options.replacerFunction.call(holder, key, value);
  }

  if (value === null) return primitive('null');

  switch (typeof value) {
    case 'string':
      return primitive(JSON.stringify(value));
    case 'number':
      return primitive(Number.isFinite(value) ? String(value) : 'null');
    case 'boolean':
      return primitive(value ? 'true' : 'false');
    case 'bigint':
      return prepareBigInt(value, state.options.bigint, path);
    case 'object':
      return { kind: 'object', value };
    default:
      return OMIT;
  }
}

function prepareCanonicalValue(value, path) {
  if (value === null) return primitive('null');

  switch (typeof value) {
    case 'string':
      if (hasLoneSurrogate(value)) {
        throw new CanonicalizationError(
          'strings must not contain lone UTF-16 surrogates',
          path
        );
      }
      return primitive(JSON.stringify(value));
    case 'number':
      if (!Number.isFinite(value)) {
        throw new CanonicalizationError(
          'NaN and Infinity are not valid I-JSON numbers',
          path
        );
      }
      return primitive(JSON.stringify(value));
    case 'boolean':
      return primitive(value ? 'true' : 'false');
    case 'object':
      return { kind: 'object', value };
    case 'bigint':
      throw new CanonicalizationError(
        'BigInt values must be represented as JSON strings',
        path
      );
    default:
      throw new CanonicalizationError(
        `values of type ${typeof value} are not valid JSON data`,
        path
      );
  }
}

function prepareBigInt(value, mode, path) {
  if (mode === 'string') return primitive(JSON.stringify(String(value)));
  if (mode === 'number') {
    const number = Number(value);
    if (!Number.isSafeInteger(number)) {
      throw new RangeError(
        `BigInt at ${formatPath(path)} cannot be represented as a safe JSON number`
      );
    }
    return primitive(String(number));
  }
  throw new TypeError('Do not know how to serialize a BigInt');
}

function primitive(text) {
  return { kind: 'primitive', text };
}

function readArrayValue(array, index, path, state) {
  if (state.canonical) {
    if (!hasOwn.call(array, index)) {
      throw new CanonicalizationError(
        'sparse arrays are not valid I-JSON data',
        path
      );
    }
    return readCanonicalDescriptor(array, String(index), path);
  }
  return readStableProperty(array, String(index), path, state.options.accessors);
}

function readObjectValue(object, key, path, state) {
  if (state.canonical) return readCanonicalDescriptor(object, key, path);
  return readStableProperty(object, key, path, state.options.accessors);
}

function readCanonicalDescriptor(object, key, path) {
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  if (!descriptor || descriptor.get || descriptor.set) {
    throw new CanonicalizationError(
      'accessor properties are not valid canonical JSON input',
      path
    );
  }
  return descriptor.value;
}

function readStableProperty(object, key, path, accessors) {
  if (accessors === 'invoke') return object[key];

  const seen = new WeakSet();
  let current = object;
  while (current !== null && !seen.has(current)) {
    seen.add(current);
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor) {
      if (!descriptor.get && !descriptor.set) return descriptor.value;
      if (accessors === 'throw') {
        throw new TypeError(`Refusing to invoke accessor at ${formatPath(path)}`);
      }
      return undefined;
    }
    current = Object.getPrototypeOf(current);
  }
  return undefined;
}

function readForComparator(object, key, path, state) {
  return readStableProperty(
    object,
    key,
    createPath(path, key),
    state.options.accessors
  );
}

function validateCanonicalObject(value, path) {
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && Object.getPrototypeOf(prototype) !== null) {
    throw new CanonicalizationError(
      'class instances must be converted to plain JSON objects',
      path
    );
  }
}

function rejectEnumerableSymbols(value, path) {
  if (typeof Object.getOwnPropertySymbols !== 'function') return;
  const symbols = Object.getOwnPropertySymbols(value);
  if (symbols.some((symbol) => propertyIsEnumerable.call(value, symbol))) {
    throw new CanonicalizationError(
      'symbol properties are not valid JSON object members',
      path
    );
  }
}

function appendItemPrefix(frame, path, state) {
  if (state.options.gap === '') {
    if (frame.emitted) append(state, ',', path);
  } else {
    const indentation = state.options.gap.repeat(frame.depth + 1);
    append(state, frame.emitted ? `,\n${indentation}` : `\n${indentation}`, path);
  }
  frame.emitted = true;
}

function appendCycle(state, previousPath, currentPath) {
  if (state.canonical) {
    throw new CanonicalizationError('circular references are not valid JSON', currentPath);
  }

  switch (state.options.onCycle) {
    case 'marker':
      append(state, JSON.stringify(state.options.cycleValue), currentPath);
      return;
    case 'path':
      append(
        state,
        JSON.stringify(`[Circular ${formatPath(previousPath)}]`),
        currentPath
      );
      return;
    case 'null':
      append(state, 'null', currentPath);
      return;
    default:
      throw new TypeError('Converting circular structure to JSON');
  }
}

function append(state, text, path) {
  const nextLength = state.length + text.length;
  if (nextLength > state.options.maxLength) {
    throw new StableStringifyLimitError(
      'length',
      state.options.maxLength,
      path
    );
  }
  state.length = nextLength;
  state.chunks.push(text);
}

function enforceDepth(state, depth, path) {
  if (depth > state.options.maxDepth) {
    throw new StableStringifyLimitError(
      'depth',
      state.options.maxDepth,
      path
    );
  }
}

function consumeEntry(state, path) {
  state.entries += 1;
  if (state.entries > state.options.maxEntries) {
    throw new StableStringifyLimitError(
      'entry',
      state.options.maxEntries,
      path
    );
  }
}

function normalizeStableOptions(inputOptions) {
  const input =
    typeof inputOptions === 'function'
      ? { cmp: inputOptions }
      : normalizeInputObject(inputOptions);

  if (input.cmp !== undefined && typeof input.cmp !== 'function') {
    throw new TypeError('cmp must be a function');
  }
  if (input.cycles !== undefined && typeof input.cycles !== 'boolean') {
    throw new TypeError('cycles must be a boolean');
  }
  if (
    input.replacer !== undefined &&
    input.replacer !== null &&
    typeof input.replacer !== 'function' &&
    !Array.isArray(input.replacer)
  ) {
    throw new TypeError('replacer must be a function or an array');
  }

  const onCycle =
    input.onCycle === undefined
      ? input.cycles === true
        ? 'marker'
        : 'throw'
      : input.onCycle;
  if (!['throw', 'marker', 'path', 'null'].includes(onCycle)) {
    throw new TypeError(
      "onCycle must be 'throw', 'marker', 'path', or 'null'"
    );
  }

  const bigint = input.bigint === undefined ? 'throw' : input.bigint;
  if (!['throw', 'string', 'number'].includes(bigint)) {
    throw new TypeError("bigint must be 'throw', 'string', or 'number'");
  }

  const accessors = input.accessors === undefined ? 'invoke' : input.accessors;
  if (!['invoke', 'omit', 'throw'].includes(accessors)) {
    throw new TypeError("accessors must be 'invoke', 'omit', or 'throw'");
  }

  if (input.toJSON !== undefined && typeof input.toJSON !== 'boolean') {
    throw new TypeError('toJSON must be a boolean');
  }
  if (
    input.cycleValue !== undefined &&
    typeof input.cycleValue !== 'string'
  ) {
    throw new TypeError('cycleValue must be a string');
  }

  return {
    accessors,
    bigint,
    cmp: input.cmp,
    cycleValue:
      input.cycleValue === undefined ? '__cycle__' : input.cycleValue,
    gap: normalizeGap(input.space),
    maxDepth: normalizeLimit(input.maxDepth, Infinity, 'maxDepth'),
    maxEntries: normalizeLimit(input.maxEntries, Infinity, 'maxEntries'),
    maxLength: normalizeLimit(input.maxLength, Infinity, 'maxLength'),
    onCycle,
    propertyList: Array.isArray(input.replacer)
      ? normalizePropertyList(input.replacer)
      : undefined,
    replacerFunction:
      typeof input.replacer === 'function' ? input.replacer : undefined,
    toJSON: input.toJSON === undefined ? true : input.toJSON
  };
}

function normalizeCanonicalOptions(inputOptions) {
  const input = normalizeInputObject(inputOptions);
  return {
    accessors: 'throw',
    bigint: 'throw',
    cmp: undefined,
    cycleValue: '',
    gap: '',
    maxDepth: normalizeLimit(
      input.maxDepth,
      CANONICAL_DEFAULTS.maxDepth,
      'maxDepth'
    ),
    maxEntries: normalizeLimit(
      input.maxEntries,
      CANONICAL_DEFAULTS.maxEntries,
      'maxEntries'
    ),
    maxLength: normalizeLimit(
      input.maxLength,
      CANONICAL_DEFAULTS.maxLength,
      'maxLength'
    ),
    onCycle: 'throw',
    propertyList: undefined,
    replacerFunction: undefined,
    toJSON: false
  };
}

function normalizeInputObject(value) {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object') {
    throw new TypeError('options must be an object when provided');
  }
  return { ...value };
}

function normalizeLimit(value, fallback, name) {
  const resolved = value === undefined ? fallback : value;
  if (resolved === Infinity) return resolved;
  if (!Number.isSafeInteger(resolved) || resolved < 0) {
    throw new TypeError(
      `${name} must be a non-negative safe integer or Infinity`
    );
  }
  return resolved;
}

function normalizeGap(space) {
  if (typeof space === 'number') {
    return ' '.repeat(Math.min(10, Math.max(0, Math.trunc(space))));
  }
  if (typeof space === 'string') return space.slice(0, 10);
  return '';
}

function normalizePropertyList(input) {
  const output = [];
  const seen = new Set();
  for (const item of input) {
    let key;
    if (typeof item === 'string' || typeof item === 'number') {
      key = String(item);
    } else if (
      item &&
      (objectToString.call(item) === '[object String]' ||
        objectToString.call(item) === '[object Number]')
    ) {
      key = String(item);
    }
    if (key !== undefined && !seen.has(key)) {
      seen.add(key);
      output.push(key);
    }
  }
  return output;
}

function hasLoneSurrogate(value) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

function createPath(parent, key) {
  return { key, parent };
}

function formatPath(path) {
  if (path === ROOT_PATH) return '<root>';
  const parts = [];
  let current = path;
  while (current !== ROOT_PATH) {
    parts.push(current.key);
    current = current.parent;
  }
  parts.reverse();

  let output = '<root>';
  for (const part of parts) {
    if (typeof part === 'number') {
      output += `[${part}]`;
    } else if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(part)) {
      output += `.${part}`;
    } else {
      output += `[${JSON.stringify(part)}]`;
    }
  }
  return output;
}

function encodeUtf8(value) {
  if (typeof TextEncoder === 'function') return new TextEncoder().encode(value);

  const bytes = [];
  for (let index = 0; index < value.length; index += 1) {
    let code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      code = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
      index += 1;
    }

    if (code <= 0x7f) {
      bytes.push(code);
    } else if (code <= 0x7ff) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code <= 0xffff) {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return Uint8Array.from(bytes);
}

Object.defineProperties(stableStringify, {
  CanonicalizationError: { value: CanonicalizationError },
  StableStringifyLimitError: { value: StableStringifyLimitError },
  canonicalize: { value: canonicalize },
  canonicalizeBytes: { value: canonicalizeBytes },
  configure: { value: configure },
  default: { value: stableStringify },
  safeStringify: { value: safeStringify },
  stable: { value: stableStringify },
  stableStringify: { value: stableStringify },
  stringify: { value: stableStringify }
});

Object.defineProperties(safeStringify, {
  stable: { value: stableStringify },
  stableStringify: { value: stableStringify }
});

export default stableStringify;
