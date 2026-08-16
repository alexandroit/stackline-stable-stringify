const presets = {
  cache: {
    accessors: 'invoke',
    bigint: 'throw',
    cycles: 'throw',
    indent: false,
    limits: [100, 100000, 1000000],
    mode: 'stable',
    value: {
      route: '/api/users',
      query: { sort: 'createdAt', page: 2, filters: { active: true } },
      tenant: { region: 'ca-central-1', id: 42 }
    }
  },
  circular: {
    accessors: 'invoke',
    bigint: 'throw',
    cycles: 'path',
    indent: true,
    limits: [100, 100000, 1000000],
    mode: 'stable',
    value: {
      id: 'request-42',
      owner: { name: 'Alex', request: { $ref: '$' } }
    }
  },
  bigint: {
    accessors: 'invoke',
    bigint: 'string',
    cycles: 'marker',
    indent: true,
    limits: [100, 100000, 1000000],
    mode: 'safe',
    value: {
      event: 'invoice.created',
      id: { $bigint: '9007199254740993' },
      totalMinor: { $bigint: '129900' }
    }
  },
  canonical: {
    accessors: 'throw',
    bigint: 'throw',
    cycles: 'throw',
    indent: false,
    limits: [1000, 100000, 16777216],
    mode: 'canonical',
    value: {
      numbers: [Number('333333333.33333329'), 1e30, 4.5, 0.002, 1e-27],
      string: '€$\u000f\nA\'B"\\"/',
      literals: [null, true, false]
    }
  },
  unicode: {
    accessors: 'throw',
    bigint: 'throw',
    cycles: 'throw',
    indent: false,
    limits: [1000, 100000, 16777216],
    mode: 'canonical',
    value: {
      '€': 'Euro',
      '\r': 'Carriage return',
      '😀': 'Emoji',
      '1': 'One',
      'ö': 'Latin',
      '\u0080': 'Control'
    }
  },
  getter: {
    accessors: 'invoke',
    bigint: 'string',
    cycles: 'marker',
    indent: false,
    limits: [100, 100000, 1000000],
    mode: 'safe',
    value: {
      requestId: 'req_7W4',
      credentials: { $throwingGetter: 'token' }
    }
  },
  limit: {
    accessors: 'invoke',
    bigint: 'throw',
    cycles: 'throw',
    indent: true,
    limits: [2, 100000, 1000000],
    mode: 'stable',
    value: { level1: { level2: { level3: { stopped: true } } } }
  }
};

const elements = {
  accessors: document.querySelector('#accessor-select'),
  bigint: document.querySelector('#bigint-select'),
  copyResult: document.querySelector('#copy-result-button'),
  cycles: document.querySelector('#cycle-select'),
  depth: document.querySelector('#max-depth'),
  entries: document.querySelector('#max-entries'),
  indent: document.querySelector('#indent-toggle'),
  length: document.querySelector('#max-length'),
  modeButtons: Array.from(document.querySelectorAll('[data-mode]')),
  modeStatus: document.querySelector('#mode-status'),
  output: document.querySelector('#result-output'),
  preset: document.querySelector('#preset-select'),
  reset: document.querySelector('#reset-button'),
  serialize: document.querySelector('#serialize-button'),
  share: document.querySelector('#share-button'),
  size: document.querySelector('#size-text'),
  status: document.querySelector('#status-text'),
  statusIndicator: document.querySelector('#status-indicator'),
  timing: document.querySelector('#timing-text'),
  value: document.querySelector('#value-input'),
  version: document.querySelector('#package-version')
};

const ROOT_REFERENCE = Symbol('root reference');
let debounceTimer;
let mode = 'stable';

loadVersion();
restoreState();
bindEvents();
runSerialization();

function bindEvents() {
  elements.serialize.addEventListener('click', runSerialization);
  elements.preset.addEventListener('change', () => {
    applyPreset(elements.preset.value);
    runSerialization();
  });
  elements.modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setMode(button.dataset.mode);
      elements.preset.value = '';
      runSerialization();
    });
  });
  for (const input of [
    elements.value,
    elements.cycles,
    elements.bigint,
    elements.accessors,
    elements.indent,
    elements.depth,
    elements.entries,
    elements.length
  ]) {
    input.addEventListener('input', scheduleSerialization);
    input.addEventListener('change', scheduleSerialization);
  }
  elements.reset.addEventListener('click', () => {
    elements.preset.value = 'cache';
    applyPreset('cache');
    runSerialization();
  });
  elements.copyResult.addEventListener('click', async () => {
    await copyText(elements.output.textContent);
    flashButton(elements.copyResult, 'Copied');
  });
  elements.share.addEventListener('click', async () => {
    persistState();
    await copyText(location.href);
    flashButton(elements.share, 'Link copied');
  });
  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      await copyText(button.dataset.copy);
      flashButton(button, 'Copied');
    });
  });
}

function scheduleSerialization() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    elements.preset.value = '';
    runSerialization();
  }, 180);
}

function runSerialization() {
  const startedAt = performance.now();

  try {
    const parsed = JSON.parse(elements.value.value);
    const value = materialize(parsed);
    const limits = {
      maxDepth: parseLimit(elements.depth.value, 'Max depth'),
      maxEntries: parseLimit(elements.entries.value, 'Max entries'),
      maxLength: parseLimit(elements.length.value, 'Max length')
    };
    const api = globalThis.StacklineStableStringify;
    let output;

    if (mode === 'canonical') {
      output = api.canonicalize(value, limits);
    } else if (mode === 'safe') {
      output = api.safeStringify(value, null, elements.indent.checked ? 2 : 0, {
        ...limits,
        accessors: elements.accessors.value,
        bigint: elements.bigint.value,
        onCycle: elements.cycles.value,
        toJSON: true
      });
    } else {
      output = api(value, {
        ...limits,
        accessors: elements.accessors.value,
        bigint: elements.bigint.value,
        onCycle: elements.cycles.value,
        space: elements.indent.checked ? 2 : 0
      });
    }

    const text = output === undefined ? 'undefined' : output;
    const controlledFallback = /^"\[Unable to serialize:/.test(text);
    elements.output.textContent = text;
    setStatus(
      controlledFallback ? 'Controlled fallback' : 'Serialization complete',
      controlledFallback,
      performance.now() - startedAt,
      text
    );
  } catch (error) {
    const name = error && error.name ? error.name : 'Error';
    const message = error && error.message ? error.message : String(error);
    const text = `${name}: ${message}`;
    elements.output.textContent = text;
    setStatus('Serialization rejected', true, performance.now() - startedAt, text);
  }

  persistState();
}

function materialize(input) {
  const root = decodeValue(input);
  if (root === ROOT_REFERENCE) {
    throw new TypeError('The root value cannot reference itself directly');
  }
  replaceRootReferences(root, root, new WeakSet());
  return root;
}

function decodeValue(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(decodeValue);

  const keys = Object.keys(value);
  if (keys.length === 1 && keys[0] === '$bigint') {
    if (typeof value.$bigint !== 'string' || !/^-?\d+$/.test(value.$bigint)) {
      throw new TypeError('$bigint must contain an integer string');
    }
    return BigInt(value.$bigint);
  }
  if (keys.length === 1 && keys[0] === '$ref') {
    if (value.$ref !== '$') throw new TypeError('Only the root $ref is supported');
    return ROOT_REFERENCE;
  }
  if (keys.length === 1 && keys[0] === '$sparse') {
    if (!Number.isSafeInteger(value.$sparse) || value.$sparse < 0) {
      throw new TypeError('$sparse must contain a non-negative integer');
    }
    return new Array(value.$sparse);
  }
  if (keys.length === 1 && keys[0] === '$throwingGetter') {
    if (typeof value.$throwingGetter !== 'string') {
      throw new TypeError('$throwingGetter must contain a property name');
    }
    const output = {};
    Object.defineProperty(output, value.$throwingGetter, {
      enumerable: true,
      get() {
        throw new Error('Getter access denied');
      }
    });
    return output;
  }

  const output = Object.create(null);
  for (const key of keys) output[key] = decodeValue(value[key]);
  return output;
}

function replaceRootReferences(value, root, seen) {
  if (value === null || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);

  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) continue;
    if (descriptor.value === ROOT_REFERENCE) {
      Object.defineProperty(value, key, {
        ...descriptor,
        value: root
      });
    } else {
      replaceRootReferences(descriptor.value, root, seen);
    }
  }
}

function parseLimit(value, label) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new TypeError(`${label} must be a non-negative integer`);
  }
  return parsed;
}

function setStatus(message, isError, elapsed, output) {
  elements.status.textContent = message;
  elements.statusIndicator.classList.toggle('error', isError);
  elements.timing.textContent = `${elapsed.toFixed(3)} ms`;
  elements.size.textContent = `${output.length.toLocaleString()} characters`;
  elements.modeStatus.textContent = modeLabel(mode);
}

function setMode(nextMode) {
  mode = ['stable', 'safe', 'canonical'].includes(nextMode)
    ? nextMode
    : 'stable';
  elements.modeButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  });

  const canonical = mode === 'canonical';
  elements.cycles.disabled = canonical;
  elements.bigint.disabled = canonical;
  elements.accessors.disabled = canonical;
  elements.indent.disabled = canonical;
  elements.modeStatus.textContent = modeLabel(mode);
}

function modeLabel(value) {
  if (value === 'canonical') return 'RFC 8785';
  return value === 'safe' ? 'Safe' : 'Stable';
}

function applyPreset(name) {
  const preset = presets[name] || presets.cache;
  elements.value.value = JSON.stringify(preset.value, null, 2);
  elements.cycles.value = preset.cycles;
  elements.bigint.value = preset.bigint;
  elements.accessors.value = preset.accessors;
  elements.indent.checked = preset.indent;
  elements.depth.value = String(preset.limits[0]);
  elements.entries.value = String(preset.limits[1]);
  elements.length.value = String(preset.limits[2]);
  setMode(preset.mode);
}

function persistState() {
  const params = new URLSearchParams({
    accessors: elements.accessors.value,
    bigint: elements.bigint.value,
    cycles: elements.cycles.value,
    depth: elements.depth.value,
    entries: elements.entries.value,
    indent: elements.indent.checked ? '1' : '0',
    length: elements.length.value,
    mode,
    value: elements.value.value
  });
  history.replaceState(null, '', `${location.pathname}${location.search}#${params}`);
}

function restoreState() {
  const params = new URLSearchParams(location.hash.slice(1));
  if (params.has('value')) {
    elements.value.value = params.get('value');
    elements.cycles.value = params.get('cycles') || 'throw';
    elements.bigint.value = params.get('bigint') || 'throw';
    elements.accessors.value = params.get('accessors') || 'invoke';
    elements.indent.checked = params.get('indent') === '1';
    elements.depth.value = params.get('depth') || '100';
    elements.entries.value = params.get('entries') || '100000';
    elements.length.value = params.get('length') || '1000000';
    elements.preset.value = '';
    setMode(params.get('mode'));
    return;
  }
  applyPreset('cache');
  setMode('stable');
}

async function loadVersion() {
  try {
    const response = await fetch('./package-meta.json');
    if (!response.ok) return;
    const metadata = await response.json();
    elements.version.textContent = `v${metadata.version}`;
  } catch {
    // Static HTML carries the release version when metadata is unavailable.
  }
}

async function copyText(value) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const temporary = document.createElement('textarea');
  temporary.value = value;
  temporary.setAttribute('readonly', '');
  temporary.style.position = 'fixed';
  temporary.style.opacity = '0';
  document.body.appendChild(temporary);
  temporary.select();
  document.execCommand('copy');
  temporary.remove();
}

function flashButton(button, label) {
  const original = button.textContent;
  button.textContent = label;
  setTimeout(() => {
    button.textContent = original;
  }, 1200);
}
