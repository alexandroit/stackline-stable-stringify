declare function stableStringify(
  value: any,
  options?: stableStringify.StableStringifyOptions | stableStringify.Comparator
): string | undefined;

declare namespace stableStringify {
  type CycleAction = 'throw' | 'marker' | 'path' | 'null';
  type BigIntAction = 'throw' | 'string' | 'number';
  type AccessorAction = 'invoke' | 'omit' | 'throw';
  type LimitKind = 'depth' | 'entry' | 'length';

  interface ComparatorNode {
    key: string;
    value: any;
  }

  type Comparator = (
    left: ComparatorNode,
    right: ComparatorNode
  ) => number;

  type Replacer =
    | ((this: any, key: string, value: any) => any)
    | ReadonlyArray<string | number>;

  interface StableStringifyOptions {
    accessors?: AccessorAction;
    bigint?: BigIntAction;
    cmp?: Comparator;
    cycles?: boolean;
    cycleValue?: string;
    maxDepth?: number;
    maxEntries?: number;
    maxLength?: number;
    onCycle?: CycleAction;
    replacer?: Replacer;
    space?: number | string;
    toJSON?: boolean;
  }

  interface SafeStringifyOptions extends StableStringifyOptions {
    depthLimit?: number;
    edgesLimit?: number;
    throwOnError?: boolean;
  }

  interface CanonicalizeOptions {
    maxDepth?: number;
    maxEntries?: number;
    maxLength?: number;
  }

  interface StringifyFunction {
    (
      value: any,
      options?: StableStringifyOptions | Comparator
    ): string | undefined;
  }

  class StableStringifyLimitError extends RangeError {
    constructor(kind: LimitKind, limit: number, path?: unknown);
    readonly code: 'ERR_STABLE_STRINGIFY_LIMIT';
    readonly kind: LimitKind;
    readonly limit: number;
    readonly path: string;
  }

  class CanonicalizationError extends TypeError {
    constructor(reason: string, path?: unknown);
    readonly code: 'ERR_JSON_CANONICALIZATION';
    readonly path: string;
    readonly reason: string;
  }

  function configure(
    defaults?: StableStringifyOptions | Comparator
  ): StringifyFunction;

  function safeStringify(
    value: any,
    replacer?: Replacer | null,
    space?: number | string,
    options?: SafeStringifyOptions
  ): string | undefined;

  function canonicalize(
    value: any,
    options?: CanonicalizeOptions
  ): string;

  function canonicalizeBytes(
    value: any,
    options?: CanonicalizeOptions
  ): Uint8Array;

  const stable: StringifyFunction;
  const stableStringify: StringifyFunction;
  const stringify: StringifyFunction;
}

export = stableStringify;
