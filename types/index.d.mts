export type CycleAction = 'throw' | 'marker' | 'path' | 'null';
export type BigIntAction = 'throw' | 'string' | 'number';
export type AccessorAction = 'invoke' | 'omit' | 'throw';
export type LimitKind = 'depth' | 'entry' | 'length';

export interface ComparatorNode {
  key: string;
  value: any;
}

export type Comparator = (
  left: ComparatorNode,
  right: ComparatorNode
) => number;

export type Replacer =
  | ((this: any, key: string, value: any) => any)
  | ReadonlyArray<string | number>;

export interface StableStringifyOptions {
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

export interface SafeStringifyOptions extends StableStringifyOptions {
  depthLimit?: number;
  edgesLimit?: number;
  throwOnError?: boolean;
}

export interface CanonicalizeOptions {
  maxDepth?: number;
  maxEntries?: number;
  maxLength?: number;
}

export interface StringifyFunction {
  (
    value: any,
    options?: StableStringifyOptions | Comparator
  ): string | undefined;
}

export interface StableStringify extends StringifyFunction {
  readonly CanonicalizationError: typeof CanonicalizationError;
  readonly StableStringifyLimitError: typeof StableStringifyLimitError;
  readonly canonicalize: typeof canonicalize;
  readonly canonicalizeBytes: typeof canonicalizeBytes;
  readonly configure: typeof configure;
  readonly default: StableStringify;
  readonly safeStringify: typeof safeStringify;
  readonly stable: StableStringify;
  readonly stableStringify: StableStringify;
  readonly stringify: StableStringify;
}

export declare class StableStringifyLimitError extends RangeError {
  constructor(kind: LimitKind, limit: number, path?: unknown);
  readonly code: 'ERR_STABLE_STRINGIFY_LIMIT';
  readonly kind: LimitKind;
  readonly limit: number;
  readonly path: string;
}

export declare class CanonicalizationError extends TypeError {
  constructor(reason: string, path?: unknown);
  readonly code: 'ERR_JSON_CANONICALIZATION';
  readonly path: string;
  readonly reason: string;
}

export declare function configure(
  defaults?: StableStringifyOptions | Comparator
): StringifyFunction;

export declare function safeStringify(
  value: any,
  replacer?: Replacer | null,
  space?: number | string,
  options?: SafeStringifyOptions
): string | undefined;

export declare function canonicalize(
  value: any,
  options?: CanonicalizeOptions
): string;

export declare function canonicalizeBytes(
  value: any,
  options?: CanonicalizeOptions
): Uint8Array;

export declare const stableStringify: StableStringify;
export declare const stringify: StableStringify;

declare const defaultExport: StableStringify;
export default defaultExport;
