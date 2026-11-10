// node_modules/@opencode/plugin/dist/promise/plugin.js
function define(plugin) {
  return plugin;
}
// node_modules/@opencode/schema/node_modules/effect/dist/Pipeable.js
var pipeArguments = (self, args) => {
  switch (args.length) {
    case 0:
      return self;
    case 1:
      return args[0](self);
    case 2:
      return args[1](args[0](self));
    case 3:
      return args[2](args[1](args[0](self)));
    case 4:
      return args[3](args[2](args[1](args[0](self))));
    case 5:
      return args[4](args[3](args[2](args[1](args[0](self)))));
    case 6:
      return args[5](args[4](args[3](args[2](args[1](args[0](self))))));
    case 7:
      return args[6](args[5](args[4](args[3](args[2](args[1](args[0](self)))))));
    case 8:
      return args[7](args[6](args[5](args[4](args[3](args[2](args[1](args[0](self))))))));
    case 9:
      return args[8](args[7](args[6](args[5](args[4](args[3](args[2](args[1](args[0](self)))))))));
    default: {
      let ret = self;
      for (let i = 0, len = args.length;i < len; i++) {
        ret = args[i](ret);
      }
      return ret;
    }
  }
};
var Prototype = {
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var Class = /* @__PURE__ */ function() {
  function PipeableBase() {}
  PipeableBase.prototype = Prototype;
  return PipeableBase;
}();

// node_modules/@opencode/schema/node_modules/effect/dist/Function.js
var dual = function(arity, body) {
  if (typeof arity === "function") {
    return function() {
      return arity(arguments) ? body.apply(this, arguments) : (self) => body(self, ...arguments);
    };
  }
  switch (arity) {
    case 0:
    case 1:
      throw new RangeError(`Invalid arity ${arity}`);
    case 2:
      return function(a, b) {
        if (arguments.length >= 2) {
          return body(a, b);
        }
        return function(self) {
          return body(self, a);
        };
      };
    case 3:
      return function(a, b, c) {
        if (arguments.length >= 3) {
          return body(a, b, c);
        }
        return function(self) {
          return body(self, a, b);
        };
      };
    default:
      return function() {
        if (arguments.length >= arity) {
          return body.apply(this, arguments);
        }
        const args = arguments;
        return function(self) {
          return body(self, ...args);
        };
      };
  }
};
var identity = (a) => a;
var constant = (value) => () => value;
var constTrue = /* @__PURE__ */ constant(true);
var constUndefined = /* @__PURE__ */ constant(undefined);
var constVoid = constUndefined;
function memoize(f) {
  const cache = new WeakMap;
  return (a) => {
    const cached = cache.get(a);
    if (cached !== undefined)
      return cached;
    const result = f(a);
    cache.set(a, result);
    return result;
  };
}
function memoizeIdempotent(f) {
  const cache = new WeakMap;
  return (a) => {
    const cached = cache.get(a);
    if (cached !== undefined)
      return cached;
    const result = f(a);
    cache.set(a, result);
    if (result !== a) {
      cache.set(result, result);
    }
    return result;
  };
}

// node_modules/@opencode/schema/node_modules/effect/dist/internal/equal.js
var getAllObjectKeys = (obj) => {
  const keys = new Set(Reflect.ownKeys(obj));
  if (obj.constructor === Object)
    return keys;
  if (obj instanceof Error) {
    keys.delete("stack");
  }
  const proto = Object.getPrototypeOf(obj);
  let current = proto;
  while (current !== null && current !== Object.prototype) {
    const ownKeys = Reflect.ownKeys(current);
    for (let i = 0;i < ownKeys.length; i++) {
      keys.add(ownKeys[i]);
    }
    current = Object.getPrototypeOf(current);
  }
  if (keys.has("constructor") && typeof obj.constructor === "function" && proto === obj.constructor.prototype) {
    keys.delete("constructor");
  }
  return keys;
};
var byReferenceInstances = /* @__PURE__ */ new WeakSet;
var viewBytes = (view) => new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
var isArrayBufferLike = (u) => u instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && u instanceof SharedArrayBuffer;
var bufferBytes = (buffer) => {
  try {
    return new Uint8Array(buffer);
  } catch {
    return;
  }
};

// node_modules/@opencode/schema/node_modules/effect/dist/internal/hash.js
var backEdges = 0;
var addBackEdge = () => {
  backEdges++;
};

// node_modules/@opencode/schema/node_modules/effect/dist/Predicate.js
function isString(input) {
  return typeof input === "string";
}
function isNumber(input) {
  return typeof input === "number";
}
function isBoolean(input) {
  return typeof input === "boolean";
}
function isSymbol(input) {
  return typeof input === "symbol";
}
function isPropertyKey(u) {
  return isString(u) || isNumber(u) || isSymbol(u);
}
function isFunction(input) {
  return typeof input === "function";
}
function isNotNullish(input) {
  return input != null;
}
function isUnknown(_) {
  return true;
}
function isObject(input) {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
function isObjectKeyword(input) {
  return typeof input === "object" && input !== null || isFunction(input);
}
var hasProperty = /* @__PURE__ */ dual(2, (self, property) => isObjectKeyword(self) && (property in self));
function isError(input) {
  return input instanceof Error;
}

// node_modules/@opencode/schema/node_modules/effect/dist/Hash.js
var symbol = "~effect/Hash";
var hash = (self) => {
  switch (typeof self) {
    case "number":
      return number(self);
    case "bigint":
      return string(self.toString(10));
    case "string":
      return string(self);
    case "function":
    case "object": {
      if (self === null) {
        break;
      } else if (self instanceof Date) {
        if (Number.isNaN(self.getTime())) {
          return string("Invalid Date");
        }
        return string(self.toISOString());
      } else if (self instanceof RegExp) {
        return string(self.toString());
      } else {
        if (byReferenceInstances.has(self)) {
          return random(self);
        }
        const cached = hashCache.get(self);
        if (cached !== undefined) {
          return cached;
        }
        if (visitedObjects.has(self)) {
          addBackEdge();
          return string("[Circular]");
        }
        visitedObjects.add(self);
        const seen = backEdges;
        let h;
        try {
          if (symbol in self) {
            h = self[symbol]();
          } else if (typeof self === "function") {
            h = random(self);
          } else if (isArrayBufferLike(self)) {
            const bytes = bufferBytes(self);
            h = bytes === undefined ? random(self) : array(bytes);
          } else if (self instanceof DataView) {
            h = array(viewBytes(self));
          } else if (Array.isArray(self) || ArrayBuffer.isView(self)) {
            h = array(self);
          } else if (self instanceof Map) {
            h = hashMap(self);
          } else if (self instanceof Set) {
            h = hashSet(self);
          } else {
            h = structure(self);
          }
        } finally {
          visitedObjects.delete(self);
        }
        if (seen === backEdges) {
          hashCache.set(self, h);
        }
        return h;
      }
    }
  }
  return optimize(mix(string(String(self))));
};
var random = (self) => {
  if (!randomHashCache.has(self)) {
    randomHashCache.set(self, optimize(Math.random() * 4294967296 | 0));
  }
  return randomHashCache.get(self);
};
var mix = (h) => {
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  return h ^ h >>> 16;
};
var combine = /* @__PURE__ */ dual(2, (self, b) => mix(Math.imul(self, 2654435761) + Math.imul(b, 2246822507)));
var optimize = (n) => n & 3221225471 | n >>> 1 & 1073741824;
var float64 = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
var number = (n) => {
  const h = n | 0;
  if (h === n) {
    return optimize(h);
  }
  float64.setFloat64(0, n !== n ? NaN : n);
  return optimize(combine(float64.getInt32(0), float64.getInt32(4)));
};
var string = (str) => {
  let h = 5381, i = str.length;
  while (i) {
    h = h * 33 ^ str.charCodeAt(--i);
  }
  return optimize(h);
};
var structureKeys = (o, keys) => {
  let h = 12289;
  for (const key of keys) {
    h ^= combine(hash(key), hash(o[key]));
  }
  return optimize(h);
};
var structure = (o) => structureKeys(o, getAllObjectKeys(o));
var unordered = (seed, f) => (iter) => {
  let h = seed;
  for (const element of iter) {
    h ^= f(element);
  }
  return optimize(h);
};
var array = (arr) => {
  let h = 6151;
  for (const element of arr) {
    h = combine(h, hash(element));
  }
  return optimize(h);
};
var hashMap = /* @__PURE__ */ unordered(/* @__PURE__ */ string("Map"), ([k, v]) => combine(hash(k), hash(v)));
var setSeed = /* @__PURE__ */ string("Set");
var hashSet = /* @__PURE__ */ unordered(setSeed, (element) => combine(setSeed, hash(element)));
var randomHashCache = /* @__PURE__ */ new WeakMap;
var hashCache = /* @__PURE__ */ new WeakMap;
var visitedObjects = /* @__PURE__ */ new WeakSet;

// node_modules/@opencode/schema/node_modules/effect/dist/Equal.js
var symbol2 = "~effect/Equal";
function equals() {
  if (arguments.length === 1) {
    return (self) => compareBoth(self, arguments[0]);
  }
  return compareBoth(arguments[0], arguments[1]);
}
function compareBoth(self, that) {
  if (self === that)
    return true;
  if (self == null || that == null)
    return false;
  const selfType = typeof self;
  if (selfType !== typeof that) {
    return false;
  }
  if (selfType === "number" && self !== self && that !== that) {
    return true;
  }
  if (selfType !== "object" && selfType !== "function") {
    return false;
  }
  if (byReferenceInstances.has(self) || byReferenceInstances.has(that)) {
    return false;
  }
  return compareObjects(self, that);
}
function compareObjects(self, that) {
  const depth = pathLeft.length;
  for (let i = depth;i-- > 0; ) {
    if (pathLeft[i] === self && pathRight[i] === that)
      return true;
  }
  if (depth)
    return compareOnPath(self, that);
  let known = results.get(self);
  if (!known)
    results.set(self, known = new WeakMap);
  let result = known.get(that);
  if (result === undefined)
    known.set(that, result = compareOnPath(self, that));
  return result;
}
function compareOnPath(self, that) {
  pathLeft.push(self);
  pathRight.push(that);
  try {
    return compareStructure(self, that);
  } finally {
    pathLeft.pop();
    pathRight.pop();
  }
}
var pathLeft = [];
var pathRight = [];
var results = /* @__PURE__ */ new WeakMap;
function compareStructure(self, that) {
  if (hash(self) !== hash(that)) {
    return false;
  } else if (self instanceof Date) {
    if (!(that instanceof Date))
      return false;
    const selfTime = self.getTime();
    const thatTime = that.getTime();
    return selfTime === thatTime || Number.isNaN(selfTime) && Number.isNaN(thatTime);
  } else if (self instanceof RegExp) {
    return that instanceof RegExp && self.toString() === that.toString();
  }
  const bothEquals = isEqual(self);
  if (bothEquals !== isEqual(that) || typeof self === "function" && !bothEquals) {
    return false;
  } else if (bothEquals) {
    return self[symbol2](that);
  } else if (Array.isArray(self)) {
    if (!Array.isArray(that) || self.length !== that.length) {
      return false;
    }
    return compareArrays(self, that);
  } else if (isArrayBufferLike(self)) {
    if (!isArrayBufferLike(that) || self instanceof ArrayBuffer !== that instanceof ArrayBuffer) {
      return false;
    }
    const selfBytes = bufferBytes(self);
    const thatBytes = bufferBytes(that);
    return selfBytes !== undefined && thatBytes !== undefined && compareTypedArrays(selfBytes, thatBytes);
  } else if (ArrayBuffer.isView(self)) {
    const selfIsDataView = self instanceof DataView;
    if (!ArrayBuffer.isView(that) || self.byteLength !== that.byteLength || selfIsDataView !== that instanceof DataView) {
      return false;
    }
    if (selfIsDataView) {
      return compareTypedArrays(viewBytes(self), viewBytes(that));
    }
    return compareTypedArrays(self, that);
  } else if (self instanceof Map) {
    if (!(that instanceof Map) || self.size !== that.size) {
      return false;
    }
    return compareHashed(self, that, entryHash, equalEntries);
  } else if (self instanceof Set) {
    if (!(that instanceof Set) || self.size !== that.size) {
      return false;
    }
    return compareHashed(self, that, hash, compareBoth);
  }
  return compareRecords(self, that);
}
function compareArrays(self, that) {
  for (let i = 0;i < self.length; i++) {
    if (!compareBoth(self[i], that[i])) {
      return false;
    }
  }
  return true;
}
function compareTypedArrays(self, that) {
  if (self.length !== that.length) {
    return false;
  }
  for (let i = 0;i < self.length; i++) {
    if (self[i] !== that[i]) {
      return false;
    }
  }
  return true;
}
function compareRecords(self, that) {
  const selfKeys = getAllObjectKeys(self);
  const thatKeys = getAllObjectKeys(that);
  if (selfKeys.size !== thatKeys.size) {
    return false;
  }
  for (const key of selfKeys) {
    if (!thatKeys.has(key) || !compareBoth(self[key], that[key])) {
      return false;
    }
  }
  return true;
}
function compareHashed(self, that, hashOf, equivalent) {
  const groups = new Map;
  let remaining = 0;
  for (const item of that) {
    const h = hashOf(item);
    const group = groups.get(h);
    if (group)
      group.push(item);
    else
      groups.set(h, [item]);
    remaining++;
  }
  outer:
    for (const item of self) {
      const group = groups.get(hashOf(item));
      if (group) {
        for (let i = 0;i < group.length; i++) {
          if (equivalent(item, group[i])) {
            group[i] = group[group.length - 1];
            group.pop();
            remaining--;
            continue outer;
          }
        }
      }
      return false;
    }
  return remaining === 0;
}
var entryHash = (entry) => hash(entry[0]);
var equalEntries = (self, that) => compareBoth(self[0], that[0]) && compareBoth(self[1], that[1]);
var sameGroup = () => 0;
function makeCompareMap(keyEquivalence, valueEquivalence) {
  return makeCompareSet((self, that) => keyEquivalence(self[0], that[0]) && valueEquivalence(self[1], that[1]));
}
function makeCompareSet(equivalence) {
  return function compareSets(self, that) {
    return compareHashed(self, that, sameGroup, equivalence);
  };
}
var isEqual = (u) => hasProperty(u, symbol2);

// node_modules/@opencode/schema/node_modules/effect/dist/Redactable.js
var symbolRedactable = /* @__PURE__ */ Symbol.for("~effect/Redactable");
var isRedactable = (u) => hasProperty(u, symbolRedactable);
function redact(u) {
  if (isRedactable(u))
    return getRedacted(u);
  return u;
}
function getRedacted(redactable) {
  return redactable[symbolRedactable](globalThis[currentFiberTypeId]?.context ?? emptyContext);
}
var currentFiberTypeId = "~effect/Fiber/currentFiber";
var emptyMap = /* @__PURE__ */ new Map;
var emptyContext = {
  "~effect/Context": {},
  base: emptyMap,
  depth: 0,
  mapUnsafe: emptyMap,
  pipe() {
    return pipeArguments(this, arguments);
  }
};

// node_modules/@opencode/schema/node_modules/effect/dist/Formatter.js
function format(input, options) {
  const space = options?.space ?? 0;
  const ancestors = new WeakSet;
  const gap = !space ? "" : typeof space === "number" ? " ".repeat(space) : space;
  const ind = (d) => gap.repeat(d);
  const wrap = (v, body) => {
    const ctor = v?.constructor;
    return ctor && ctor !== Object.prototype.constructor && ctor.name ? `${ctor.name}(${body})` : body;
  };
  const ownKeys = (o) => {
    try {
      return Reflect.ownKeys(o);
    } catch {
      return ["[ownKeys threw]"];
    }
  };
  function recur(v, d = 0) {
    try {
      return recurUnsafe(v, d);
    } catch {
      if (typeof v === "object" && v !== null || typeof v === "function")
        ancestors.delete(v);
      return "[inspection threw]";
    }
  }
  function recurUnsafe(v, d = 0) {
    if (typeof v === "string")
      return JSON.stringify(v);
    if (typeof v === "number" || v == null || typeof v === "boolean" || typeof v === "symbol")
      return String(v);
    if (typeof v === "bigint")
      return String(v) + "n";
    if (typeof v === "object" || typeof v === "function") {
      if (ancestors.has(v))
        return CIRCULAR;
      ancestors.add(v);
      let output;
      if (symbolRedactable in v) {
        output = recur(getRedacted(v), d);
      } else if (Array.isArray(v)) {
        output = !gap || v.length <= 1 ? `[${v.map((x) => recur(x, d)).join(",")}]` : `[
${ind(d + 1)}${v.map((x) => recur(x, d + 1)).join(`,
` + ind(d + 1))}
${ind(d)}]`;
      } else if (v instanceof Date) {
        output = formatDate(v);
      } else if (!options?.ignoreToString && hasProperty(v, "toString") && typeof v["toString"] === "function" && v["toString"] !== Object.prototype.toString && v["toString"] !== Array.prototype.toString) {
        const s = safeToString(v);
        output = v instanceof Error && v.cause !== undefined ? `${s} (cause: ${recur(v.cause, d)})` : s;
      } else if (Symbol.iterator in v) {
        output = `${v.constructor.name}(${recur(Array.from(v), d)})`;
      } else {
        const keys = ownKeys(v);
        if (!gap || keys.length <= 1) {
          const body = `{${keys.map((k) => `${formatPropertyKey(k)}:${recur(safeGet(v, k), d)}`).join(",")}}`;
          output = wrap(v, body);
        } else {
          const body = `{
${keys.map((k) => `${ind(d + 1)}${formatPropertyKey(k)}: ${recur(safeGet(v, k), d + 1)}`).join(`,
`)}
${ind(d)}}`;
          output = wrap(v, body);
        }
      }
      ancestors.delete(v);
      return output;
    }
    return String(v);
  }
  return recur(input, 0);
}
var CIRCULAR = "[Circular]";
function formatPropertyKey(name) {
  return typeof name === "string" ? JSON.stringify(name) : String(name);
}
function formatPath(path) {
  return path.map((key) => `[${formatPropertyKey(key)}]`).join("");
}
function formatDate(date) {
  try {
    return date.toISOString();
  } catch {
    return "Invalid Date";
  }
}
function safeToString(input) {
  try {
    const s = input.toString();
    return typeof s === "string" ? s : String(s);
  } catch {
    return "[toString threw]";
  }
}
function safeGet(input, key) {
  try {
    return input[key];
  } catch {
    return "[property access threw]";
  }
}
function formatJson(input, options) {
  const ancestors = [];
  const sources = new WeakMap;
  return JSON.stringify(input, function(key, value) {
    const original = Object.getOwnPropertyDescriptor(sources.get(this) ?? this, key)?.value;
    const redacted = hasProperty(original, symbolRedactable) ? redact(original) : redact(value);
    if (typeof redacted === "bigint") {
      return format(redacted);
    }
    if (typeof redacted !== "object" || redacted === null) {
      return redacted;
    }
    const current = redacted instanceof Error && !hasProperty(redacted, "toJSON") ? {
      ...redacted,
      name: redacted.name,
      message: redacted.message
    } : redacted;
    while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) {
      ancestors.pop();
    }
    if (ancestors.includes(redacted)) {
      return;
    }
    ancestors.push(redacted);
    if (current !== redacted) {
      ancestors.push(current);
    }
    if (!hasGetter(current) || isJsonPrimitiveWrapper(current)) {
      return current;
    }
    const view = redactingView(current);
    sources.set(view, current);
    ancestors.push(view);
    return view;
  }, options?.space) ?? "null";
}
function hasGetter(object) {
  for (const key of Object.getOwnPropertyNames(object)) {
    if (Object.getOwnPropertyDescriptor(object, key)?.get !== undefined) {
      return true;
    }
  }
  return false;
}
function redactingView(object) {
  const view = Array.isArray(object) ? [] : {};
  const keys = Array.isArray(object) ? Array.from({
    length: object.length
  }, (_, i) => String(i)) : Object.keys(object);
  for (const key of keys) {
    Object.defineProperty(view, key, {
      enumerable: true,
      get: () => {
        const value = Reflect.get(object, key);
        return Object.getOwnPropertyDescriptor(object, key)?.get !== undefined ? redact(value) : value;
      }
    });
  }
  return view;
}
function isJsonPrimitiveWrapper(object) {
  for (const valueOf of [Number.prototype.valueOf, Boolean.prototype.valueOf, String.prototype.valueOf]) {
    try {
      Reflect.apply(valueOf, object, []);
      return true;
    } catch {}
  }
  return false;
}

// node_modules/@opencode/schema/node_modules/effect/dist/Inspectable.js
var NodeInspectSymbol = /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
var toJson = (input) => {
  try {
    input = redact(input);
    if (hasProperty(input, "toJSON") && isFunction(input["toJSON"]) && input["toJSON"].length === 0) {
      return input.toJSON();
    } else if (Array.isArray(input)) {
      return input.map(toJson);
    }
    return input;
  } catch {
    return "[toJSON threw]";
  }
};
var BaseProto = {
  toJSON() {
    return toJson(this);
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  toString() {
    return format(this.toJSON());
  }
};

// node_modules/@opencode/schema/node_modules/effect/dist/internal/stackTraceLimit.js
var isStackTraceLimitWritable = () => {
  const desc = Object.getOwnPropertyDescriptor(Error, "stackTraceLimit");
  if (desc === undefined) {
    return Object.isExtensible(Error);
  }
  return Object.hasOwn(desc, "writable") ? desc.writable === true : desc.set !== undefined;
};
var canWriteStackTraceLimit = /* @__PURE__ */ isStackTraceLimitWritable();
var getStackTraceLimit = () => Error.stackTraceLimit;
var setStackTraceLimit = (value) => {
  if (canWriteStackTraceLimit) {
    Error.stackTraceLimit = value;
  }
};

// node_modules/@opencode/schema/node_modules/effect/dist/Utils.js
class SingleShotGen {
  constructor(self) {
    this.value = self;
    this.done = false;
  }
  next(a) {
    if (this.done) {
      this.value = a;
      return this;
    }
    this.done = true;
    return {
      value: this.value,
      done: false
    };
  }
}
var pickInternalCall = () => {
  const InternalTypeId = "~effect/Utils/internal";
  const standard = {
    [InternalTypeId]: (body) => {
      return body();
    }
  };
  const forced = {
    [InternalTypeId]: (body) => {
      try {
        return body();
      } finally {}
    }
  };
  const limit = getStackTraceLimit();
  if (limit === 0)
    return forced[InternalTypeId];
  setStackTraceLimit(2);
  const error = standard[InternalTypeId](() => new Error);
  setStackTraceLimit(limit);
  return error.stack?.includes(InternalTypeId) === true ? standard[InternalTypeId] : forced[InternalTypeId];
};
var internalCall = /* @__PURE__ */ pickInternalCall();

// node_modules/@opencode/schema/node_modules/effect/dist/internal/record.js
function assignProperty(self, key, value) {
  if (key === "__proto__") {
    Object.defineProperty(self, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true
    });
  } else {
    self[key] = value;
  }
}
function assignProperties(self, source) {
  if (!Object.hasOwn(source, "__proto__")) {
    Object.assign(self, source);
    return;
  }
  for (const key of Reflect.ownKeys(source)) {
    if (Object.prototype.propertyIsEnumerable.call(source, key)) {
      assignProperty(self, key, source[key]);
    }
  }
}

// node_modules/@opencode/schema/node_modules/effect/dist/internal/core.js
var EffectTypeId = `~effect/Effect`;
var ExitTypeId = `~effect/Exit`;
var effectVariance = {
  _A: identity,
  _E: identity,
  _R: identity
};
var identifier = `${EffectTypeId}/identifier`;
var args = `${EffectTypeId}/args`;
var evaluate = `${EffectTypeId}/evaluate`;
var contA = `${EffectTypeId}/successCont`;
var contE = `${EffectTypeId}/failureCont`;
var contAll = `${EffectTypeId}/ensureCont`;
var Yield = /* @__PURE__ */ Symbol.for("effect/Effect/Yield");
var PipeInspectableProto = {
  pipe() {
    return pipeArguments(this, arguments);
  },
  toJSON() {
    return {
      ...this
    };
  },
  toString() {
    return format(this.toJSON(), {
      ignoreToString: true,
      space: 2
    });
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
};
var StructuralProto = {
  [symbol]() {
    return structureKeys(this, Object.keys(this));
  },
  [symbol2](that) {
    const selfKeys = Object.keys(this);
    const thatKeys = Object.keys(that);
    if (selfKeys.length !== thatKeys.length)
      return false;
    for (let i = 0;i < selfKeys.length; i++) {
      if (selfKeys[i] !== thatKeys[i] || !equals(this[selfKeys[i]], that[selfKeys[i]])) {
        return false;
      }
    }
    return true;
  }
};
var EffectProto = {
  [EffectTypeId]: effectVariance,
  ...PipeInspectableProto,
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  },
  toJSON() {
    return {
      _id: "Effect",
      op: this[identifier],
      ...args in this ? {
        args: this[args]
      } : undefined
    };
  }
};
var isExit = (u) => hasProperty(u, ExitTypeId);
var CauseTypeId = "~effect/Cause";
var CauseReasonTypeId = "~effect/Cause/Reason";
var isCause = (self) => hasProperty(self, CauseTypeId);
class CauseImpl {
  constructor(failures) {
    this[CauseTypeId] = CauseTypeId;
    this.reasons = failures;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toJSON() {
    return {
      _id: "Cause",
      reasons: this.reasons.map((f) => f.toJSON())
    };
  }
  toString() {
    return `Cause(${format(this.reasons)})`;
  }
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  [symbol2](that) {
    return isCause(that) && this.reasons.length === that.reasons.length && this.reasons.every((e, i) => equals(e, that.reasons[i]));
  }
  [symbol]() {
    return array(this.reasons);
  }
}
var annotationsMap = /* @__PURE__ */ new WeakMap;

class ReasonBase {
  [CauseReasonTypeId];
  annotations;
  _tag;
  constructor(_tag, annotations, originalError) {
    this[CauseReasonTypeId] = CauseReasonTypeId;
    this._tag = _tag;
    if (annotations !== constEmptyAnnotations && typeof originalError === "object" && originalError !== null && annotations.size > 0) {
      const prevAnnotations = annotationsMap.get(originalError);
      if (prevAnnotations) {
        annotations = new Map([...prevAnnotations, ...annotations]);
      }
      annotationsMap.set(originalError, annotations);
    }
    this.annotations = annotations;
  }
  annotate(annotations, options) {
    if (annotations.mapUnsafe.size === 0)
      return this;
    const newAnnotations = new Map(this.annotations);
    annotations.mapUnsafe.forEach((value, key) => {
      if (options?.overwrite !== true && newAnnotations.has(key))
        return;
      newAnnotations.set(key, value);
    });
    if (options?.overwrite !== true && newAnnotations.size === this.annotations.size)
      return this;
    const self = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    self.annotations = newAnnotations;
    return self;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toString() {
    return format(this);
  }
  [NodeInspectSymbol]() {
    return this.toString();
  }
}
var constEmptyAnnotations = /* @__PURE__ */ new Map;

class Fail extends ReasonBase {
  constructor(error, annotations = constEmptyAnnotations) {
    super("Fail", annotations, error);
    this.error = error;
  }
  toString() {
    return `Fail(${format(this.error)})`;
  }
  toJSON() {
    return {
      _tag: "Fail",
      error: this.error
    };
  }
  [symbol2](that) {
    return isFailReason(that) && equals(this.error, that.error) && equals(this.annotations, that.annotations);
  }
  [symbol]() {
    return combine(string(this._tag))(combine(hash(this.error))(hash(this.annotations)));
  }
}
var causeFromReasons = (reasons) => new CauseImpl(reasons);
var dedupeReasons = (self, that) => {
  const buckets = new Map;
  const out = [];
  for (const reason of self.concat(that)) {
    const hash2 = hash(reason);
    const bucket = buckets.get(hash2);
    if (bucket === undefined) {
      buckets.set(hash2, [reason]);
    } else if (bucket.some((previous) => equals(previous, reason))) {
      continue;
    } else {
      bucket.push(reason);
    }
    out.push(reason);
  }
  return out;
};
var causeCombine = /* @__PURE__ */ dual(2, (self, that) => {
  if (self.reasons.length === 0) {
    return that;
  } else if (that.reasons.length === 0) {
    return self;
  }
  const newCause = new CauseImpl(dedupeReasons(self.reasons, that.reasons));
  return equals(self, newCause) ? self : newCause;
});
var causeAddInterrupts = (self, interrupts) => {
  const reasons = self.reasons.slice();
  for (const reason of interrupts.reasons) {
    if (isInterruptReason(reason) && !reasons.some((r) => isInterruptReason(r) && r.fiberId === reason.fiberId && r.annotations === reason.annotations)) {
      reasons.push(reason);
    }
  }
  return reasons.length === self.reasons.length ? self : new CauseImpl(reasons);
};
var causeFail = (error) => new CauseImpl([new Fail(error)]);

class Die extends ReasonBase {
  constructor(defect, annotations = constEmptyAnnotations) {
    super("Die", annotations, defect);
    this.defect = defect;
  }
  toString() {
    return `Die(${format(this.defect)})`;
  }
  toJSON() {
    return {
      _tag: "Die",
      defect: this.defect
    };
  }
  [symbol2](that) {
    return isDieReason(that) && equals(this.defect, that.defect) && equals(this.annotations, that.annotations);
  }
  [symbol]() {
    return combine(string(this._tag))(combine(hash(this.defect))(hash(this.annotations)));
  }
}
var causeDie = (defect) => new CauseImpl([new Die(defect)]);
var causeAnnotate = /* @__PURE__ */ dual((args) => isCause(args[0]), (self, annotations, options) => {
  if (annotations.mapUnsafe.size === 0)
    return self;
  return new CauseImpl(self.reasons.map((f) => f.annotate(annotations, options)));
});
var isFailReason = (self) => self._tag === "Fail";
var isDieReason = (self) => self._tag === "Die";
var isInterruptReason = (self) => self._tag === "Interrupt";
function defaultEvaluate(_fiber) {
  return exitDie(`Effect.evaluate: Not implemented`);
}
var makePrimitiveProto = (options) => ({
  ...EffectProto,
  [identifier]: options.op,
  [evaluate]: options[evaluate] ?? defaultEvaluate,
  [contA]: options[contA],
  [contE]: options[contE],
  [contAll]: options[contAll]
});
var makePrimitive = (options) => {
  const Proto = makePrimitiveProto(options);
  const PrimitiveImpl = function(value) {
    this[args] = value;
  };
  PrimitiveImpl.prototype = Proto;
  return function(value) {
    return new PrimitiveImpl(value);
  };
};
var makeExit = (options) => {
  const Proto = {
    [ExitTypeId]: ExitTypeId,
    _tag: options.op,
    get [options.prop]() {
      return this[args];
    },
    ...makePrimitiveProto(options),
    toString() {
      return `${options.op}(${format(this[args])})`;
    },
    toJSON() {
      return {
        _id: "Exit",
        _tag: options.op,
        [options.prop]: this[args]
      };
    },
    [symbol2](that) {
      return isExit(that) && that._tag === this._tag && equals(this[args], that[args]);
    },
    [symbol]() {
      return combine(string(options.op), hash(this[args]));
    }
  };
  const ExitPrimitive = function(value) {
    this[args] = value;
  };
  ExitPrimitive.prototype = Proto;
  return function(value) {
    return new ExitPrimitive(value);
  };
};
var exitSucceed = /* @__PURE__ */ makeExit({
  op: "Success",
  prop: "value",
  [evaluate](fiber) {
    const cont = fiber.getCont(contA);
    return cont ? cont[contA](this[args], fiber, this) : fiber.yieldWith(this);
  }
});
var StackTraceKey = {
  key: "effect/Cause/StackTrace"
};
var InterruptorStackTrace = {
  key: "effect/Cause/InterruptorStackTrace"
};
var exitFailCause = /* @__PURE__ */ makeExit({
  op: "Failure",
  prop: "cause",
  [evaluate](fiber) {
    let cause = this[args];
    let annotated = false;
    if (fiber.cache.stackFrame) {
      cause = causeAnnotate(cause, {
        mapUnsafe: new Map([[StackTraceKey.key, fiber.cache.stackFrame]])
      });
      annotated = true;
    }
    let cont = fiber.getCont(contE);
    const interruptedCause = fiber._interruptedCause;
    if (interruptedCause && fiber.interruptible) {
      let skippedHandler = false;
      while (cont && fiber.interruptible) {
        skippedHandler ||= identifier in cont;
        cont = fiber.getCont(contE);
      }
      if (skippedHandler) {
        cause = causeFromReasons(cause.reasons.filter((reason) => reason._tag !== "Fail"));
      }
      cause = causeAddInterrupts(cause, interruptedCause);
      annotated = true;
    }
    return cont ? cont[contE](cause, fiber, annotated ? undefined : this) : fiber.yieldWith(annotated ? exitFailCause(cause) : this);
  }
});
var exitFail = (e) => exitFailCause(causeFail(e));
var exitDie = (defect) => exitFailCause(causeDie(defect));
var withFiber = /* @__PURE__ */ makePrimitive({
  op: "WithFiber",
  [evaluate](fiber) {
    return this[args](fiber);
  }
});
var withFiberSucceed = /* @__PURE__ */ makePrimitive({
  op: "WithFiberSucceed",
  [evaluate](fiber) {
    const value = this[args](fiber);
    const cont = fiber.getCont(contA);
    return cont ? cont[contA](value, fiber) : fiber.yieldWith(exitSucceed(value));
  }
});
var YieldableError = /* @__PURE__ */ function() {

  class YieldableError extends globalThis.Error {
  }
  const proto = /* @__PURE__ */ makePrimitiveProto({
    op: "YieldableError",
    [evaluate]() {
      return exitFail(this);
    }
  });
  delete proto.toString;
  Object.assign(YieldableError.prototype, proto);
  return YieldableError;
}();
var Error2 = /* @__PURE__ */ function() {
  const plainArgsSymbol = /* @__PURE__ */ Symbol.for("effect/Data/Error/plainArgs");
  return class Base extends YieldableError {
    constructor(args) {
      super(args?.message, args?.cause ? {
        cause: args.cause
      } : undefined);
      if (args) {
        assignProperties(this, args);
        Object.defineProperty(this, plainArgsSymbol, {
          value: args,
          enumerable: false
        });
      }
    }
    toJSON() {
      return {
        ...this[plainArgsSymbol],
        ...this
      };
    }
  };
}();
var TaggedError = (tag) => {

  class Base extends Error2 {
    _tag = tag;
  }
  Base.prototype.name = tag;
  return Base;
};
var DoneTypeId = "~effect/Cause/Done";
var isDone = (u) => hasProperty(u, DoneTypeId);
var DoneVoid = {
  [DoneTypeId]: DoneTypeId,
  _tag: "Done",
  value: undefined
};

// node_modules/@opencode/schema/node_modules/effect/dist/Effectable.js
var Prototype2 = (options) => makePrimitiveProto({
  op: options.label,
  [evaluate]: options.evaluate
});

// node_modules/@opencode/schema/node_modules/effect/dist/Equivalence.js
var make = (isEquivalent) => (self, that) => self === that || isEquivalent(self, that);
var isStrictEquivalent = (x, y) => x === y;
var strictEqual = () => isStrictEquivalent;
function Array_(item) {
  return make((self, that) => {
    if (self.length !== that.length)
      return false;
    for (let i = 0;i < self.length; i++) {
      if (!item(self[i], that[i]))
        return false;
    }
    return true;
  });
}

// node_modules/@opencode/schema/node_modules/effect/dist/internal/option.js
var TypeId = "~effect/Option";
var CommonProto = {
  [TypeId]: {
    _A: (_) => _
  },
  ...PipeInspectableProto,
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  }
};
var SomeProto = /* @__PURE__ */ Object.defineProperty(/* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto), {
  _tag: "Some",
  _op: "Some",
  [symbol2](that) {
    return isOption(that) && isSome(that) && equals(this.value, that.value);
  },
  [symbol]() {
    return combine(hash(this._tag))(hash(this.value));
  },
  toString() {
    return `some(${format(this.value)})`;
  },
  toJSON() {
    return {
      _id: "Option",
      _tag: this._tag,
      value: toJson(this.value)
    };
  }
}), "valueOrUndefined", {
  get() {
    return this.value;
  }
});
var NoneHash = /* @__PURE__ */ hash("None");
var NoneProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto), {
  _tag: "None",
  _op: "None",
  valueOrUndefined: undefined,
  [symbol2](that) {
    return isOption(that) && isNone(that);
  },
  [symbol]() {
    return NoneHash;
  },
  toString() {
    return `none()`;
  },
  toJSON() {
    return {
      _id: "Option",
      _tag: this._tag
    };
  }
});
var isOption = (input) => hasProperty(input, TypeId);
var isNone = (fa) => fa._tag === "None";
var isSome = (fa) => fa._tag === "Some";
var none = /* @__PURE__ */ Object.create(NoneProto);
var SomeImpl = function(value) {
  this.value = value;
};
SomeImpl.prototype = SomeProto;
var some = (value) => new SomeImpl(value);

// node_modules/@opencode/schema/node_modules/effect/dist/internal/result.js
var TypeId2 = "~effect/Result";
var CommonProto2 = {
  [TypeId2]: {
    _A: (_) => _,
    _E: (_) => _
  },
  ...PipeInspectableProto,
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  }
};
var SuccessProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto2), {
  _tag: "Success",
  _op: "Success",
  [symbol2](that) {
    return isResult(that) && isSuccess(that) && equals(this.success, that.success);
  },
  [symbol]() {
    return combine(hash(this._tag))(hash(this.success));
  },
  toString() {
    return `success(${format(this.success)})`;
  },
  toJSON() {
    return {
      _id: "Result",
      _tag: this._tag,
      value: toJson(this.success)
    };
  }
});
var FailureProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto2), {
  _tag: "Failure",
  _op: "Failure",
  [symbol2](that) {
    return isResult(that) && isFailure(that) && equals(this.failure, that.failure);
  },
  [symbol]() {
    return combine(hash(this._tag))(hash(this.failure));
  },
  toString() {
    return `failure(${format(this.failure)})`;
  },
  toJSON() {
    return {
      _id: "Result",
      _tag: this._tag,
      failure: toJson(this.failure)
    };
  }
});
var isResult = (input) => hasProperty(input, TypeId2);
var isFailure = (result) => result._tag === "Failure";
var isSuccess = (result) => result._tag === "Success";
var FailureImpl = function(failure) {
  this.failure = failure;
};
FailureImpl.prototype = FailureProto;
var fail = (failure) => new FailureImpl(failure);
var SuccessImpl = function(success) {
  this.success = success;
};
SuccessImpl.prototype = SuccessProto;
var succeed = (success) => new SuccessImpl(success);

// node_modules/@opencode/schema/node_modules/effect/dist/Order.js
function make2(compare) {
  return (self, that) => self === that ? 0 : compare(self, that);
}
var Number2 = /* @__PURE__ */ make2((self, that) => {
  if (globalThis.Number.isNaN(self) && globalThis.Number.isNaN(that))
    return 0;
  if (globalThis.Number.isNaN(self))
    return -1;
  if (globalThis.Number.isNaN(that))
    return 1;
  return self < that ? -1 : 1;
});
var isLessThan = (O) => dual(2, (self, that) => O(self, that) === -1);
var isGreaterThan = (O) => dual(2, (self, that) => O(self, that) === 1);
var isLessThanOrEqualTo = (O) => dual(2, (self, that) => O(self, that) !== 1);
var isGreaterThanOrEqualTo = (O) => dual(2, (self, that) => O(self, that) !== -1);

// node_modules/@opencode/schema/node_modules/effect/dist/Option.js
var none2 = () => none;
var some2 = some;
var isNone2 = isNone;
var isSome2 = isSome;
var match = /* @__PURE__ */ dual(2, (self, {
  onNone,
  onSome
}) => isNone2(self) ? onNone() : onSome(self.value));
var liftThrowable = (f) => (...a) => {
  try {
    return some2(f(...a));
  } catch {
    return none2();
  }
};
var filter = /* @__PURE__ */ dual(2, (self, predicate) => isNone2(self) ? none2() : predicate(self.value) ? some2(self.value) : none2());

// node_modules/@opencode/schema/node_modules/effect/dist/Context.js
var ServiceTypeId = "~effect/Context/Service";
var Service = function() {
  function KeyClass() {}
  const self = KeyClass;
  Object.setPrototypeOf(self, ServiceProto);
  const init = (key, options) => {
    self.key = key;
    if (options?.defaultValue) {
      self[ReferenceTypeId] = ReferenceTypeId;
      self.defaultValue = options.defaultValue;
    }
    if (options?.make) {
      self.make = options.make;
    }
    if (options?.fiberCached) {
      cacheKeys.add(key);
    }
    return self;
  };
  return arguments.length > 0 ? init(arguments[0], arguments[1]) : init;
};
var ServiceProto = {
  [ServiceTypeId]: ServiceTypeId,
  .../* @__PURE__ */ Prototype2({
    label: "Service",
    evaluate(fiber) {
      return exitSucceed(get(fiber.context, this));
    }
  }),
  toJSON() {
    return {
      _id: "Service",
      key: this.key
    };
  },
  of(self) {
    return self;
  },
  context(self) {
    return make3(this, self);
  },
  use(f) {
    return withFiber((fiber) => f(get(fiber.context, this)));
  },
  useSync(f) {
    return withFiber((fiber) => exitSucceed(f(get(fiber.context, this))));
  }
};
var cacheKeys = /* @__PURE__ */ new Set;
var ReferenceTypeId = "~effect/Context/Reference";
var TypeId3 = "~effect/Context";
var FlattenAfterBaseHits = 8;
var makeImpl = (cacheRoot, base, overlay, depth, maxDepth) => {
  const self = Object.create(Proto);
  self.cacheRoot = cacheRoot ?? self;
  self.base = base;
  self.overlay = overlay;
  self.depth = depth;
  self._flat = undefined;
  self.baseHits = 0;
  self.maxDepth = maxDepth;
  return self;
};
var applyOverlays = (map, overlay) => {
  if (!overlay)
    return;
  applyOverlays(map, overlay.parent);
  map.set(overlay.key, overlay.value);
};
var flatten = (self) => {
  if (self._flat)
    return self._flat;
  if (!self.overlay)
    return self._flat = self.base;
  const map = new Map(self.base);
  applyOverlays(map, self.overlay);
  return self._flat = map;
};
var notFound = /* @__PURE__ */ Symbol();
var lookup = (self, key) => {
  const impl = self;
  for (let overlay = impl.overlay;overlay; overlay = overlay.parent) {
    if (overlay.key === key)
      return overlay.value;
  }
  const value = impl.base.get(key);
  if (value === undefined && !impl.base.has(key))
    return notFound;
  if (impl.overlay && ++impl.baseHits >= impl.base.size && impl.baseHits >= FlattenAfterBaseHits) {
    impl.base = flatten(impl);
    impl.overlay = undefined;
    impl.depth = 0;
  }
  return value;
};
var makeUnsafe = (mapUnsafe, options) => {
  const maxDepth = options?.maxDepth;
  return makeImpl(undefined, mapUnsafe, undefined, 0, Number.isInteger(maxDepth) && maxDepth >= 0 ? maxDepth : 8);
};
var Proto = {
  get mapUnsafe() {
    return flatten(this);
  },
  ...PipeInspectableProto,
  [TypeId3]: {
    _Services: (_) => _
  },
  toJSON() {
    return {
      _id: "Context",
      services: Array.from(this.mapUnsafe).map(([key, value]) => ({
        key,
        value
      }))
    };
  },
  [symbol2](that) {
    if (!isContext(that))
      return false;
    const self = this.mapUnsafe;
    const other = that.mapUnsafe;
    if (self.size !== other.size)
      return false;
    for (const [key, value] of self) {
      if (!other.has(key) || !equals(value, other.get(key)))
        return false;
    }
    return true;
  },
  [symbol]() {
    return number(this.mapUnsafe.size);
  }
};
var hasSameCache = (self, that) => self.cacheRoot === that.cacheRoot;
var isContext = (u) => hasProperty(u, TypeId3);
var isReference = (u) => !!u[ReferenceTypeId];
var empty = () => emptyContext2;
var emptyContext2 = /* @__PURE__ */ makeUnsafe(/* @__PURE__ */ new Map);
var make3 = (key, service) => makeUnsafe(new Map([[key.key, service]]));
var add = /* @__PURE__ */ dual(3, (self, key, service) => addUnsafe(self, key.key, service));
var addUnsafe = (self, key, service) => {
  const impl = self;
  const cacheRoot = cacheKeys.has(key) ? undefined : impl.cacheRoot;
  if (impl.depth >= impl.maxDepth) {
    const map = new Map(impl._flat ?? impl.base);
    if (!impl._flat)
      applyOverlays(map, impl.overlay);
    map.set(key, service);
    return makeImpl(cacheRoot, map, undefined, 0, impl.maxDepth);
  }
  return makeImpl(cacheRoot, impl.base, {
    key,
    value: service,
    parent: impl.overlay
  }, impl.depth + 1, impl.maxDepth);
};
var getOrUndefinedUnsafe = (self, key) => {
  const value = lookup(self, key);
  return value === notFound ? undefined : value;
};
var getUnsafe = /* @__PURE__ */ dual(2, (self, service) => {
  const value = lookup(self, service.key);
  if (value === notFound) {
    if (isReference(service))
      return getDefaultValue(service);
    throw serviceNotFoundError(service);
  }
  return value;
});
var get = getUnsafe;
var defaultValueCacheKey = "~effect/Context/defaultValue";
var getDefaultValue = (ref) => {
  if (defaultValueCacheKey in ref) {
    return ref[defaultValueCacheKey];
  }
  return ref[defaultValueCacheKey] = ref.defaultValue();
};
var serviceNotFoundError = (service) => {
  const error = new Error(`Service not found${service.key ? `: ${String(service.key)}` : ""}`);
  if (error.stack) {
    const lines = error.stack.split(`
`);
    lines.splice(1, 3);
    error.stack = lines.join(`
`);
  }
  return error;
};
var Reference = Service;

// node_modules/@opencode/schema/node_modules/effect/dist/internal/array.js
var isArrayNonEmpty = (self) => self.length > 0;

// node_modules/@opencode/schema/node_modules/effect/dist/Result.js
var succeed2 = succeed;
var fail2 = fail;
var isFailure2 = isFailure;
var isSuccess2 = isSuccess;
var map = /* @__PURE__ */ dual(2, (self, f) => isSuccess2(self) ? succeed2(f(self.success)) : self);
var match2 = /* @__PURE__ */ dual(2, (self, {
  onFailure,
  onSuccess
}) => isFailure2(self) ? onFailure(self.failure) : onSuccess(self.success));

// node_modules/@opencode/schema/node_modules/effect/dist/Array.js
var Array2 = globalThis.Array;
var append = /* @__PURE__ */ dual(2, (self, last) => [...self, last]);
var isArray = Array2.isArray;
var isArrayNonEmpty2 = isArrayNonEmpty;
var isReadonlyArrayNonEmpty = isArrayNonEmpty;
var empty2 = () => [];
var map2 = /* @__PURE__ */ dual(2, (self, f) => self.map(f));

// node_modules/@opencode/schema/node_modules/effect/dist/Scheduler.js
var Scheduler = /* @__PURE__ */ Reference("effect/Scheduler", {
  fiberCached: true,
  defaultValue: () => new MixedScheduler
});
var setMicrotask = (f) => {
  let cancelled = false;
  Promise.resolve().then(() => {
    if (!cancelled)
      f();
  });
  return () => {
    cancelled = true;
  };
};
var setTimer = "setImmediate" in globalThis ? (f) => {
  const timer = globalThis.setImmediate(f);
  return () => globalThis.clearImmediate(timer);
} : (f) => {
  const timer = setTimeout(f, 0);
  return () => clearTimeout(timer);
};
var setImmediate = (f) => {
  try {
    return setTimer(f);
  } catch {
    return setMicrotask(f);
  }
};

class PriorityBuckets {
  buckets = [];
  scheduleTask(task, priority) {
    const buckets = this.buckets;
    const len = buckets.length;
    let bucket;
    let index = 0;
    for (;index < len; index++) {
      if (buckets[index][0] > priority)
        break;
      bucket = buckets[index];
    }
    if (bucket && bucket[0] === priority) {
      bucket[1].push(task);
    } else if (index === len) {
      buckets.push([priority, [task]]);
    } else {
      buckets.splice(index, 0, [priority, [task]]);
    }
  }
  drain() {
    const buckets = this.buckets;
    this.buckets = [];
    return buckets;
  }
}

class MixedScheduler {
  executionMode;
  setImmediate;
  constructor(executionMode = "async", setImmediateFn) {
    this.executionMode = executionMode;
    this.setImmediate = setImmediateFn ?? (executionMode === "sync" ? setMicrotask : setImmediate);
  }
  shouldYield(fiber) {
    return fiber.currentOpCount >= fiber.cache.maxOpsBeforeYield;
  }
  makeDispatcher() {
    return new MixedSchedulerDispatcher(this.setImmediate);
  }
}

class MixedSchedulerDispatcher {
  tasks = /* @__PURE__ */ new PriorityBuckets;
  running = undefined;
  setImmediate;
  constructor(setImmediateFn = setImmediate) {
    this.setImmediate = setImmediateFn;
  }
  scheduleTask(task, priority) {
    this.tasks.scheduleTask(task, priority);
    if (this.running === undefined) {
      this.running = this.setImmediate(this.afterScheduled);
    }
  }
  afterScheduled = () => {
    this.running = undefined;
    this.runTasks();
  };
  runTasks() {
    const buckets = this.tasks.drain();
    for (let i = 0;i < buckets.length; i++) {
      const toRun = buckets[i][1];
      for (let j = 0;j < toRun.length; j++) {
        toRun[j]();
      }
    }
  }
  flush() {
    while (this.tasks.buckets.length > 0) {
      if (this.running !== undefined) {
        this.running();
        this.running = undefined;
      }
      this.runTasks();
    }
  }
}
var MaxOpsBeforeYield = /* @__PURE__ */ Reference("effect/Scheduler/MaxOpsBeforeYield", {
  fiberCached: true,
  defaultValue: () => 2048
});
var PreventSchedulerYield = /* @__PURE__ */ Reference("effect/Scheduler/PreventSchedulerYield", {
  fiberCached: true,
  defaultValue: () => false
});

// node_modules/@opencode/schema/node_modules/effect/dist/Data.js
var Class2 = class extends Class {
  constructor(props) {
    super();
    if (props) {
      assignProperties(this, props);
    }
  }
};
var TaggedError2 = TaggedError;

// node_modules/@opencode/schema/node_modules/effect/dist/encoding/EncodingError.js
var EncodingErrorTypeId = "~effect/encoding/EncodingError";

class EncodingError extends (/* @__PURE__ */ TaggedError2("EncodingError")) {
  [EncodingErrorTypeId] = EncodingErrorTypeId;
}

// node_modules/@opencode/schema/node_modules/effect/dist/Tracer.js
var ParentSpanKey = "effect/Tracer/ParentSpan";
var TracerKey = "effect/Tracer";

// node_modules/@opencode/schema/node_modules/effect/dist/internal/metric.js
var FiberRuntimeMetricsKey = "effect/Metric/FiberRuntimeMetrics";

// node_modules/@opencode/schema/node_modules/effect/dist/internal/references.js
var CurrentStackFrame = /* @__PURE__ */ Reference("effect/References/CurrentStackFrame", {
  fiberCached: true,
  defaultValue: constUndefined
});
var TracerEnabled = /* @__PURE__ */ Reference("effect/References/TracerEnabled", {
  fiberCached: true,
  defaultValue: constTrue
});
var CurrentLogLevel = /* @__PURE__ */ Reference("effect/References/CurrentLogLevel", {
  fiberCached: true,
  defaultValue: () => "Info"
});
var MinimumLogLevel = /* @__PURE__ */ Reference("effect/References/MinimumLogLevel", {
  fiberCached: true,
  defaultValue: () => "Info"
});

// node_modules/@opencode/schema/node_modules/effect/dist/internal/effect.js
class Interrupt extends ReasonBase {
  constructor(fiberId, annotations = constEmptyAnnotations) {
    super("Interrupt", annotations, "Interrupted");
    this.fiberId = fiberId;
  }
  toString() {
    return `Interrupt(${this.fiberId})`;
  }
  toJSON() {
    return {
      _tag: "Interrupt",
      fiberId: this.fiberId
    };
  }
  [symbol2](that) {
    return isInterruptReason(that) && this.fiberId === that.fiberId && this.annotations === that.annotations;
  }
  [symbol]() {
    return string(`${this._tag}:${this.fiberId}`);
  }
}
var causeInterrupt = (fiberId) => new CauseImpl([new Interrupt(fiberId)]);
var hasFails = (self) => self.reasons.some(isFailReason);
var hasDies = (self) => self.reasons.some(isDieReason);
var causeElectDefects = (self) => hasDies(self) && hasFails(self) ? causeFromReasons(self.reasons.map((reason) => reason._tag === "Fail" && !isDone(reason.error) ? new Die(reason.error, reason.annotations) : reason)) : self;
var hasInterrupts = (self) => self.reasons.some(isInterruptReason);
var causeMap = /* @__PURE__ */ dual(2, (self, f) => {
  let hasFail = false;
  const failures = self.reasons.map((failure) => {
    if (isFailReason(failure)) {
      hasFail = true;
      return new Fail(f(failure.error), failure.annotations);
    }
    return failure;
  });
  return hasFail ? causeFromReasons(failures) : self;
});
var FiberTypeId = "~effect/Fiber";
var fiberVariance = {
  _A: identity,
  _E: identity
};
var fiberIdStore = {
  id: 0
};
var AsyncResource = /* @__PURE__ */ (() => {
  try {
    return globalThis.process?.getBuiltinModule?.("node:async_hooks")?.AsyncResource;
  } catch {
    return;
  }
})();
var captureAsyncContext = () => AsyncResource === undefined ? undefined : new AsyncResource("effect/Fiber");
var getCurrentFiber = () => globalThis[currentFiberTypeId];

class FiberImpl {
  constructor(context, interruptible = true) {
    this.setContext(context);
    this.id = ++fiberIdStore.id;
    this.currentOpCount = 0;
    this.interruptible = interruptible;
    this._stack = [];
    this._observers = undefined;
    this._exit = undefined;
    this._children = undefined;
    this._interruptedCause = undefined;
    this._yielded = undefined;
    this._running = false;
    this._deferredInterrupt = false;
    this._parent = undefined;
    this._asyncContext = undefined;
    this.cache.runtimeMetrics?.recordFiberStart(this.context);
  }
  get [FiberTypeId]() {
    return fiberVariance;
  }
  get currentDispatcher() {
    return this._dispatcher ??= this.cache.scheduler.makeDispatcher();
  }
  getRef(ref) {
    return get(this.context, ref);
  }
  addObserver(cb) {
    if (this._exit) {
      cb(this._exit);
      return constVoid;
    }
    if (this._observers === undefined) {
      this._observers = [cb];
    } else {
      this._observers.push(cb);
    }
    return () => this.removeObserver(cb);
  }
  removeObserver(cb) {
    if (this._exit || this._observers === undefined)
      return;
    const index = this._observers.indexOf(cb);
    if (index >= 0) {
      this._observers.splice(index, 1);
    }
  }
  interruptUnsafe(fiberId, annotations) {
    if (this._exit) {
      return;
    }
    let cause = causeInterrupt(fiberId);
    if (this.cache.stackFrame) {
      cause = causeAnnotate(cause, make3(StackTraceKey, this.cache.stackFrame));
    }
    if (annotations) {
      cause = causeAnnotate(cause, annotations);
    }
    this._interruptedCause = this._interruptedCause ? causeAddInterrupts(this._interruptedCause, cause) : cause;
    if (this.interruptible) {
      if (this._running) {
        this._deferredInterrupt = true;
      } else {
        this.evaluate(failCause(this._interruptedCause));
      }
    }
  }
  pollUnsafe() {
    return this._exit;
  }
  evaluate(effect) {
    if (this._exit) {
      return;
    } else if (this._asyncContext !== undefined) {
      const asyncContext = this._asyncContext;
      this._asyncContext = undefined;
      try {
        return asyncContext.runInAsyncScope(this.evaluate, this, effect);
      } finally {
        asyncContext.emitDestroy();
      }
    } else if (this._yielded !== undefined) {
      const yielded = this._yielded;
      this._yielded = undefined;
      yielded();
    }
    const exit = this.runLoop(effect);
    if (exit === Yield) {
      this._asyncContext = captureAsyncContext();
      return;
    }
    const interruptChildren = fiberMiddleware.interruptChildren && fiberMiddleware.interruptChildren(this);
    if (interruptChildren !== undefined) {
      return this.evaluate(flatMap(interruptChildren, () => exit));
    }
    this._exit = exit;
    this.cache.runtimeMetrics?.recordFiberEnd(this.context, this._exit);
    if (this._parent) {
      this._parent._children?.delete(this);
      this._parent = undefined;
    }
    if (this._observers !== undefined) {
      const observers = this._observers;
      this._observers = undefined;
      for (let i = 0;i < observers.length; i++) {
        observers[i](exit);
      }
    }
    this._stack.length = 0;
    this._children = undefined;
    this.context = empty();
  }
  runLoop(effect) {
    const prevFiber = globalThis[currentFiberTypeId];
    globalThis[currentFiberTypeId] = this;
    const prevRunning = this._running;
    this._running = true;
    let yielding = false;
    let current = effect;
    this.currentOpCount = 0;
    try {
      while (true) {
        try {
          if (this._deferredInterrupt) {
            this._deferredInterrupt = false;
            current = failCause(this._interruptedCause);
          }
          this.currentOpCount++;
          const cache = this.cache;
          if (!yielding && !cache.preventYield && cache.scheduler.shouldYield(this)) {
            yielding = true;
            const prev = current;
            current = flatMap(yieldNow, () => prev);
          }
          current = cache.tracerContext ? cache.tracerContext(current, this) : current[evaluate](this);
          if (current === Yield) {
            const yielded = this._yielded;
            if (ExitTypeId in yielded) {
              this._deferredInterrupt = false;
              this._yielded = undefined;
              return yielded;
            } else if (this._deferredInterrupt) {
              this._yielded = undefined;
              yielded();
              continue;
            }
            return Yield;
          }
        } catch (error) {
          if (!hasProperty(current, evaluate)) {
            return exitDie(`Fiber.runLoop: Not a valid effect: ${String(current)}`);
          }
          current = exitDie(error);
        }
      }
    } finally {
      this._running = prevRunning;
      globalThis[currentFiberTypeId] = prevFiber;
    }
  }
  getCont(symbol) {
    if (this._deferredInterrupt) {
      this._deferredInterrupt = false;
      return deferredInterruptCont;
    }
    while (true) {
      const op = this._stack.pop();
      if (!op)
        return;
      const all = op[contAll];
      if (all !== undefined) {
        const cont = all.call(op, this);
        if (cont) {
          cont[symbol] = cont;
          return cont;
        }
      }
      if (op[symbol])
        return op;
    }
  }
  succeedWith(value) {
    if ((++this.currentOpCount & maxInlineSteps - 1) === 0) {
      return exitSucceed(value);
    }
    const cont = this.getCont(contA);
    return cont ? cont[contA](value, this) : this.yieldWith(exitSucceed(value));
  }
  yieldWith(value) {
    this._yielded = value;
    return Yield;
  }
  children() {
    return this._children ??= new Set;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  setContext(context) {
    const previous = this.context;
    this.context = context;
    if (previous !== undefined && hasSameCache(previous, context))
      return;
    const root = context.cacheRoot;
    const cache = root._fiberCache ??= makeFiberContextCache(context);
    if (this.cache?.scheduler !== cache.scheduler) {
      this._dispatcher = undefined;
    }
    this.cache = cache;
  }
  get currentSpanLocal() {
    const span = this.cache.span;
    return span?._tag === "Span" ? span : undefined;
  }
}
var makeFiberContextCache = (context) => {
  const currentTracer = getOrUndefinedUnsafe(context, TracerKey);
  return {
    scheduler: get(context, Scheduler),
    tracer: currentTracer,
    tracerContext: currentTracer ? currentTracer["context"] : undefined,
    tracerEnabled: get(context, TracerEnabled),
    span: getOrUndefinedUnsafe(context, ParentSpanKey),
    logLevel: get(context, CurrentLogLevel),
    minimumLogLevel: get(context, MinimumLogLevel),
    stackFrame: get(context, CurrentStackFrame),
    runtimeMetrics: getOrUndefinedUnsafe(context, FiberRuntimeMetricsKey),
    maxOpsBeforeYield: get(context, MaxOpsBeforeYield),
    preventYield: get(context, PreventSchedulerYield)
  };
};
var deferredInterruptCont = {
  [contA](_value, fiber) {
    return failCause(fiber._interruptedCause);
  },
  [contE](_cause, fiber) {
    return failCause(fiber._interruptedCause);
  }
};
var maxInlineSteps = 32;
var fiberMiddleware = {
  interruptChildren: undefined
};
var fiberStackAnnotations = (fiber) => {
  if (!fiber.cache.stackFrame)
    return;
  const annotations = new Map;
  annotations.set(InterruptorStackTrace.key, fiber.cache.stackFrame);
  return makeUnsafe(annotations);
};
var fiberAwaitAll = (self) => callback((resume) => {
  const iter = self[Symbol.iterator]();
  const exits = [];
  let cancel = undefined;
  function loop() {
    let result = iter.next();
    while (!result.done) {
      if (result.value._exit) {
        exits.push(result.value._exit);
        result = iter.next();
        continue;
      }
      cancel = result.value.addObserver((exit) => {
        exits.push(exit);
        loop();
      });
      return;
    }
    resume(succeed3(exits));
  }
  loop();
  return sync(() => cancel?.());
});
var fiberInterruptAll = (fibers) => withFiber((parent) => {
  const annotations = fiberStackAnnotations(parent);
  let fiberArr = empty2();
  for (const fiber of fibers) {
    fiber.interruptUnsafe(parent.id, annotations);
    fiberArr.push(fiber);
  }
  return asVoid(fiberAwaitAll(fiberArr));
});
var succeed3 = exitSucceed;
var failCause = exitFailCause;
var fail3 = exitFail;
var sync = /* @__PURE__ */ makePrimitive({
  op: "Sync",
  [evaluate](fiber) {
    const thunk = this[args];
    const value = thunk();
    const cont = fiber.getCont(contA);
    return cont ? cont[contA](value, fiber) : fiber.yieldWith(exitSucceed(value));
  }
});
var suspend = /* @__PURE__ */ makePrimitive({
  op: "Suspend",
  [evaluate](_fiber) {
    const thunk = this[args];
    return thunk();
  }
});
var fromResult = /* @__PURE__ */ match2({
  onFailure: fail3,
  onSuccess: succeed3
});
var yieldNowWith = /* @__PURE__ */ makePrimitive({
  op: "Yield",
  [evaluate](fiber) {
    let resumed = false;
    fiber.currentDispatcher.scheduleTask(() => {
      if (resumed)
        return;
      fiber.evaluate(exitVoid);
    }, this[args] ?? 0);
    return fiber.yieldWith(() => {
      resumed = true;
    });
  }
});
var yieldNow = /* @__PURE__ */ yieldNowWith(0);
var failCauseSync = (evaluate) => suspend(() => failCause(evaluate()));
var die = (defect) => exitDie(defect);
var void_ = /* @__PURE__ */ succeed3(undefined);
var try_ = (options) => {
  const evaluate = typeof options === "function" ? options : options.try;
  const catcher = typeof options === "function" ? (cause) => new UnknownError(cause, "An error occurred in Effect.try") : options.catch;
  return suspend(() => {
    try {
      return succeed3(evaluate());
    } catch (err) {
      return fail3(catcher(err));
    }
  });
};
var tryPromise = (options) => {
  const f = typeof options === "function" ? options : options.try;
  const catcher = typeof options === "function" ? (cause) => new UnknownError(cause, "An error occurred in Effect.tryPromise") : options.catch;
  return callbackOptions(function(resume, signal) {
    const failWithCatch = (cause) => suspend(() => {
      try {
        return fail3(internalCall(() => catcher(cause)));
      } catch (err) {
        return die(err);
      }
    });
    try {
      f(signal).then((a) => resume(succeed3(a)), (e) => resume(failWithCatch(e)));
    } catch (err) {
      resume(failWithCatch(err));
    }
  }, f.length !== 0);
};
var callbackOptions = /* @__PURE__ */ function() {
  const Proto = /* @__PURE__ */ makePrimitiveProto({
    op: "Async",
    [evaluate](fiber) {
      let resumed = false;
      let yielded = false;
      const controller = this.withSignal ? new AbortController : undefined;
      const onCancel = this.register.call(fiber.cache.scheduler, (effect) => {
        if (resumed)
          return;
        resumed = true;
        if (yielded) {
          fiber.evaluate(effect);
        } else {
          yielded = effect;
        }
      }, controller?.signal);
      if (yielded !== false)
        return yielded;
      yielded = true;
      fiber.yieldWith(() => {
        resumed = true;
      });
      if (controller === undefined && onCancel === undefined) {
        return Yield;
      }
      fiber._stack.push(asyncFinalizer(() => {
        resumed = true;
        controller?.abort();
        return onCancel ?? exitVoid;
      }));
      return Yield;
    }
  });
  const AsyncImpl = function(register, withSignal) {
    this.register = register;
    this.withSignal = withSignal;
  };
  AsyncImpl.prototype = Proto;
  return function(register, withSignal) {
    return new AsyncImpl(register, withSignal);
  };
}();
var asyncFinalizer = /* @__PURE__ */ makePrimitive({
  op: "AsyncFinalizer",
  [contAll](fiber) {
    if (fiber.interruptible) {
      fiber.interruptible = false;
      fiber._stack.push(setInterruptibleTrue);
    }
  },
  [contE](cause, _fiber) {
    return hasInterrupts(cause) ? flatMap(combineFinalizerCause(exitFailCause(cause), this[args]()), () => failCause(cause)) : failCause(cause);
  }
});
var callback = (register) => callbackOptions(register, register.length >= 2);
var fnBody = (bodyOrOptions, pipeables) => typeof bodyOrOptions === "function" ? bodyOrOptions : pipeables.shift().bind(bodyOrOptions.self);
var defineFunctionLength = (length, fn) => Object.defineProperty(fn, "length", {
  value: length,
  configurable: true
});
var fnUntracedEager = (bodyOrOptions, ...pipeables) => {
  const body = fnBody(bodyOrOptions, pipeables);
  return defineFunctionLength(body.length, pipeables.length === 0 ? function() {
    return fromIteratorEagerUnsafe(() => body.apply(this, arguments));
  } : function() {
    let effect = fromIteratorEagerUnsafe(() => body.apply(this, arguments));
    for (const pipeable of pipeables) {
      effect = pipeable(effect, ...arguments);
    }
    return effect;
  });
};
var fromIteratorEagerUnsafe = (evaluate) => {
  try {
    const iterator = evaluate();
    let value = undefined;
    while (true) {
      const state = iterator.next(value);
      if (state.done) {
        return succeed3(state.value);
      }
      const primitive = state.value;
      if (primitive && primitive._tag === "Success") {
        value = primitive.value;
        continue;
      } else if (primitive && primitive._tag === "Failure") {
        return state.value;
      } else {
        let isFirstExecution = true;
        return suspend(() => {
          if (isFirstExecution) {
            isFirstExecution = false;
            return flatMap(state.value, (value) => fromIteratorUnsafe(iterator, value));
          } else {
            return suspend(() => fromIteratorUnsafe(evaluate()));
          }
        });
      }
    }
  } catch (error) {
    return die(error);
  }
};
var fromIteratorUnsafe = /* @__PURE__ */ function() {
  const Proto = /* @__PURE__ */ makePrimitiveProto({
    op: "Iterator",
    [contA](value, fiber) {
      const iter = this.iterator;
      while (true) {
        const state = iter.next(value);
        if (state.done)
          return succeed3(state.value);
        if (!effectIsExit(state.value)) {
          fiber._stack.push(this);
          return state.value;
        } else if (state.value._tag === "Failure") {
          return state.value;
        }
        value = state.value.value;
      }
    },
    [evaluate](fiber) {
      return this[contA](this.initial, fiber);
    }
  });
  const IteratorImpl = function(iterator, initial) {
    this.iterator = iterator;
    this.initial = initial;
  };
  IteratorImpl.prototype = Proto;
  return function(iterator, initial) {
    return new IteratorImpl(iterator, initial);
  };
}();
var evaluateCont = function(fiber) {
  fiber._stack.push(this);
  return this[args];
};
var OnSuccessProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnSuccess",
  [evaluate]: evaluateCont
});
var ContImpl = function(self, cont, payload) {
  this[args] = self;
  this[contA] = cont;
  this.payload = payload;
};
ContImpl.prototype = OnSuccessProto;
var returnPayload = function() {
  return this.payload;
};
var continuationMarksStack = /* @__PURE__ */ (() => {
  const limit = /* @__PURE__ */ getStackTraceLimit();
  if (limit === 0)
    return false;
  const marker = "~effect/Effect/stackProbe";
  const probe = {
    [marker]: function stackProbe() {
      return new Error;
    }
  };
  setStackTraceLimit(1);
  const error = /* @__PURE__ */ probe[marker]();
  setStackTraceLimit(limit);
  return error.stack?.includes("[as " + marker + "]") === true;
})();
var mapCont = function(value, fiber) {
  const f = this.payload;
  return fiber.succeedWith(continuationMarksStack ? f(value) : internalCall(() => f(value)));
};
var andThenCont = function(value) {
  const f = this.payload;
  return f(value);
};
var asVoid = (self) => new ContImpl(self, returnPayload, exitVoid);
var flatMap = /* @__PURE__ */ dual(2, (self, f) => new ContImpl(self, andThenCont, f));
var effectIsExit = (effect) => effect[ExitTypeId] !== undefined;
var flatMapEager = /* @__PURE__ */ dual(2, (self, f) => {
  if (effectIsExit(self)) {
    return self._tag === "Success" ? f(self.value) : self;
  }
  return flatMap(self, f);
});
var map3 = /* @__PURE__ */ dual(2, (self, f) => new ContImpl(self, mapCont, f));
var mapEager = /* @__PURE__ */ dual(2, (self, f) => effectIsExit(self) ? exitMap(self, f) : map3(self, f));
var mapErrorEager = /* @__PURE__ */ dual(2, (self, f) => effectIsExit(self) ? exitMapError(self, f) : mapError(self, f));
var mapBothEager = /* @__PURE__ */ dual(2, (self, options) => effectIsExit(self) ? exitMapBoth(self, options) : mapBoth(self, options));
var exitIsSuccess = (self) => self._tag === "Success";
var exitVoid = /* @__PURE__ */ exitSucceed(undefined);
var exitMap = /* @__PURE__ */ dual(2, (self, f) => self._tag === "Success" ? exitSucceed(f(self.value)) : self);
var exitMapError = /* @__PURE__ */ dual(2, (self, f) => {
  if (self._tag === "Success")
    return self;
  return exitFailCause(causeMap(self.cause, f));
});
var exitMapBoth = /* @__PURE__ */ dual(2, (self, options) => {
  if (self._tag === "Success")
    return exitSucceed(options.onSuccess(self.value));
  return exitFailCause(causeMap(self.cause, options.onFailure));
});
var catchCause = /* @__PURE__ */ dual(2, (self, f) => new OnFailureImpl(self, f.length !== 1 ? (cause) => f(cause) : f));
var OnFailureProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnFailure",
  [evaluate]: evaluateCont
});
var OnFailureImpl = function(self, f) {
  this[args] = self;
  this[contE] = f;
};
OnFailureImpl.prototype = OnFailureProto;
var mapError = /* @__PURE__ */ dual(2, (self, f) => catchCause(self, (cause) => failCause(causeMap(cause, f))));
var mapBoth = /* @__PURE__ */ dual(2, (self, options) => matchCauseEffect(self, {
  onFailure: (cause) => failCause(causeMap(cause, options.onFailure)),
  onSuccess: (a) => sync(() => options.onSuccess(a))
}));
var matchCauseEffect = /* @__PURE__ */ dual(2, (self, options) => new OnSuccessAndFailureImpl(self, options.onSuccess.length !== 1 ? (a) => options.onSuccess(a) : options.onSuccess, options.onFailure.length !== 1 ? (cause) => options.onFailure(cause) : options.onFailure));
var OnSuccessAndFailureProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnSuccessAndFailure",
  [evaluate]: evaluateCont
});
var OnSuccessAndFailureImpl = function(self, onSuccess, onFailure) {
  this[args] = self;
  this[contA] = onSuccess;
  this[contE] = onFailure;
};
OnSuccessAndFailureImpl.prototype = OnSuccessAndFailureProto;
var exit = (self) => effectIsExit(self) ? exitSucceed(self) : exitPrimitive(self);
var exitPrimitive = /* @__PURE__ */ makePrimitive({
  op: "Exit",
  [evaluate](fiber) {
    fiber._stack.push(this);
    return this[args];
  },
  [contA](value, fiber, exit) {
    return fiber.succeedWith(exit ?? exitSucceed(value));
  },
  [contE](cause, fiber, exit) {
    return fiber.succeedWith(exit ?? exitFailCause(cause));
  }
});
var combineFinalizerCause = (exit_, finalizer) => exitIsSuccess(exit_) ? finalizer : catchCause(finalizer, (cause) => failCause(causeElectDefects(causeCombine(exit_.cause, cause))));
var uninterruptible = (self) => withFiber((fiber) => {
  if (!fiber.interruptible)
    return self;
  fiber.interruptible = false;
  fiber._stack.push(setInterruptibleTrue);
  return self;
});
var setInterruptible = /* @__PURE__ */ makePrimitive({
  op: "SetInterruptible",
  [contAll](fiber) {
    fiber.interruptible = this[args];
    if (fiber._interruptedCause && fiber.interruptible) {
      return () => failCause(fiber._interruptedCause);
    }
  }
});
var setInterruptibleTrue = /* @__PURE__ */ setInterruptible(true);
var whileLoop = /* @__PURE__ */ makePrimitive({
  op: "While",
  [contA](value, fiber) {
    this[args].step(value);
    if (this[args].while()) {
      fiber._stack.push(this);
      return this[args].body();
    }
    return exitVoid;
  },
  [evaluate](fiber) {
    if (this[args].while()) {
      fiber._stack.push(this);
      return this[args].body();
    }
    return exitVoid;
  }
});
var resolveConcurrency = (concurrency) => concurrency === "unbounded" ? Number.POSITIVE_INFINITY : Math.max(1, concurrency ?? 1);
var iterateEager = () => (options) => {
  const onItem = options.onItem;
  const step = options.step;
  const resumeSequential = (state, items, index, end, effect) => flatMap(exit(effect), (itemExit) => step(state, items[index], itemExit, index) ?? runSequential(state, items, index + 1, end) ?? void_);
  const runSequential = (state, items, index = 0, end = items.length) => {
    for (;index < end; index++) {
      const item = items[index];
      const effect = onItem(state, item, index);
      if (!effectIsExit(effect)) {
        return resumeSequential(state, items, index, end, effect);
      }
      const terminal = step(state, item, effect, index);
      if (terminal)
        return terminal._tag === "Failure" ? terminal : undefined;
    }
  };
  return runSequential;
};
var iterateConcurrentImpl = (options) => {
  const onItem = options.onItem;
  const step = options.step;
  return (state, items, opts) => {
    let index = 0;
    const end = opts.end ?? items.length;
    const concurrency = opts.concurrency;
    let done = false;
    let parentFiber;
    let fibers;
    let resume;
    let terminal;
    let effect;
    const failDefect = (error) => {
      const defect = exitDie(error);
      terminal = defect;
      done = true;
      return fibers && fibers.size > 0 ? flatMap(uninterruptible(fiberInterruptAll(Array.from(fibers))), () => terminal ?? defect) : defect;
    };
    const go = () => {
      let paused = false;
      for (;!terminal && index < end; index++) {
        const item = items[index];
        const eff = effect ?? onItem(state, item, index);
        if (effectIsExit(eff)) {
          terminal = step(state, item, eff, index);
          if (terminal)
            break;
        } else if (!parentFiber) {
          return callback((cb) => {
            parentFiber = getCurrentFiber();
            fibers = new Set;
            effect = eff;
            resume = cb;
            let result;
            try {
              result = go();
            } catch (error) {
              return cb(failDefect(error));
            }
            if (result)
              return cb(result);
            return suspend(() => {
              terminal ??= exitVoid;
              return flatMap(fibers ? fiberInterruptAll(fibers) : void_, () => terminal?._tag === "Failure" ? terminal : void_);
            });
          });
        } else {
          effect = undefined;
          const fiber = forkUnsafe(parentFiber, eff, true, true, "inherit");
          if (fiber._exit) {
            terminal = step(state, item, fiber._exit, index);
            if (terminal)
              break;
            continue;
          }
          fibers.add(fiber);
          const currentIndex = index;
          fiber.addObserver((exit) => {
            fibers.delete(fiber);
            try {
              if (terminal) {
                if (exit._tag === "Failure") {
                  const reasons = exit.cause.reasons.filter((reason) => reason._tag !== "Interrupt");
                  if (reasons.length > 0) {
                    const cause = causeFromReasons(reasons);
                    terminal = exitFailCause(terminal._tag === "Failure" ? causeElectDefects(causeCombine(terminal.cause, cause)) : cause);
                  }
                }
              } else {
                const result = step(state, item, exit, currentIndex);
                if (result) {
                  terminal = result;
                  go();
                }
              }
              if (paused) {
                const eff = go();
                if (eff)
                  resume(eff);
              } else if (done && fibers.size === 0) {
                resume(terminal ?? void_);
              }
            } catch (error) {
              resume(failDefect(error));
            }
          });
          if (fibers.size < concurrency)
            continue;
          paused = true;
          index++;
          return;
        }
      }
      done = true;
      if (terminal) {
        if (fibers && fibers.size > 0) {
          const annotations = fiberStackAnnotations(parentFiber);
          fibers.forEach((f) => f.interruptUnsafe(parentFiber.id, annotations));
          return;
        }
        if (resume || terminal._tag === "Failure") {
          return terminal;
        }
      } else if (resume) {
        if (!fibers) {
          return exitVoid;
        } else if (fibers.size === 0) {
          resume(void_);
        }
      }
    };
    return go();
  };
};
var iterateConcurrent = () => (options) => iterateConcurrentImpl(options);
var forkUnsafe = (parent, effect, immediate = false, daemon = false, uninterruptible = false) => {
  const parentRuntime = parent;
  const interruptible = uninterruptible === "inherit" ? parentRuntime.interruptible : !uninterruptible;
  const child = new FiberImpl(parentRuntime.context, interruptible);
  if (!daemon) {
    parentRuntime.children().add(child);
    child._parent = parentRuntime;
  }
  if (immediate) {
    child.evaluate(effect);
  } else {
    child._asyncContext = captureAsyncContext();
    parentRuntime.currentDispatcher.scheduleTask(() => child.evaluate(effect), 0);
  }
  return child;
};
var runForkWith = (context) => (effect, options) => {
  const fiber = new FiberImpl(options?.scheduler ? add(context, Scheduler, options.scheduler) : context, options?.uninterruptible !== true);
  fiber.evaluate(effect);
  if (fiber._exit)
    return fiber;
  if (options?.signal) {
    if (options.signal.aborted) {
      fiber.interruptUnsafe();
    } else {
      const abort = () => fiber.interruptUnsafe();
      options.signal.addEventListener("abort", abort, {
        once: true
      });
      fiber.addObserver(() => options.signal.removeEventListener("abort", abort));
    }
  }
  if (options?.onFiberStart) {
    options.onFiberStart(fiber);
  }
  return fiber;
};
var runSyncExitWith = (context) => {
  const runFork = runForkWith(context);
  return (effect) => {
    if (effectIsExit(effect))
      return effect;
    const scheduler = new MixedScheduler("sync");
    const fiber = runFork(effect, {
      scheduler
    });
    fiber._dispatcher?.flush();
    return fiber._exit ?? exitDie(new AsyncFiberError(fiber));
  };
};
var runSyncExit = /* @__PURE__ */ runSyncExitWith(/* @__PURE__ */ empty());
var MAX_TIMER_MILLIS = 2 ** 31 - 1;
var IllegalArgumentErrorTypeId = "~effect/Cause/IllegalArgumentError";
class IllegalArgumentError extends (/* @__PURE__ */ TaggedError("IllegalArgumentError")) {
  [IllegalArgumentErrorTypeId] = IllegalArgumentErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
}
var AsyncFiberErrorTypeId = "~effect/Cause/AsyncFiberError";
class AsyncFiberError extends (/* @__PURE__ */ TaggedError("AsyncFiberError")) {
  [AsyncFiberErrorTypeId] = AsyncFiberErrorTypeId;
  constructor(fiber) {
    super({
      message: "An asynchronous Effect was executed with Effect.runSync",
      fiber
    });
  }
}
var UnknownErrorTypeId = "~effect/Cause/UnknownError";
class UnknownError extends (/* @__PURE__ */ TaggedError("UnknownError")) {
  [UnknownErrorTypeId] = UnknownErrorTypeId;
  constructor(cause, message) {
    super({
      message,
      cause
    });
  }
}
var LoggerTypeId = "~effect/Logger";
var LoggerProto = {
  [LoggerTypeId]: {
    _Message: identity,
    _Output: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var colors = {
  bold: "1",
  red: "31",
  green: "32",
  yellow: "33",
  blue: "34",
  cyan: "36",
  white: "37",
  gray: "90",
  black: "30",
  bgBrightRed: "101"
};
var logLevelColors = {
  None: [],
  All: [],
  Trace: [colors.gray],
  Debug: [colors.blue],
  Info: [colors.green],
  Warn: [colors.yellow],
  Error: [colors.red],
  Fatal: [colors.bgBrightRed, colors.black]
};

// node_modules/@opencode/schema/node_modules/effect/dist/Cause.js
var isFailReason2 = isFailReason;
var die2 = causeDie;
var map4 = causeMap;
var IllegalArgumentError2 = IllegalArgumentError;

// node_modules/@opencode/schema/node_modules/effect/dist/Exit.js
var succeed4 = exitSucceed;
var failCause2 = exitFailCause;
var fail4 = exitFail;
var void_2 = exitVoid;
var isSuccess3 = exitIsSuccess;

// node_modules/@opencode/schema/node_modules/effect/dist/internal/dateTime.js
var TypeId4 = "~effect/DateTime";
var TimeZoneTypeId = "~effect/DateTime/TimeZone";
var Proto2 = {
  [TypeId4]: TypeId4,
  pipe() {
    return pipeArguments(this, arguments);
  },
  [NodeInspectSymbol]() {
    return this.toString();
  },
  toJSON() {
    return toDateUtc(this).toJSON();
  }
};
var ProtoUtc = {
  ...Proto2,
  _tag: "Utc",
  [symbol]() {
    return number(this.epochMilliseconds);
  },
  [symbol2](that) {
    return isDateTime(that) && that._tag === "Utc" && this.epochMilliseconds === that.epochMilliseconds;
  },
  toString() {
    return `DateTime.Utc(${toDateUtc(this).toJSON()})`;
  }
};
var ProtoZoned = {
  ...Proto2,
  _tag: "Zoned",
  [symbol]() {
    return combine(number(this.epochMilliseconds))(hash(this.zone));
  },
  [symbol2](that) {
    return isDateTime(that) && that._tag === "Zoned" && this.epochMilliseconds === that.epochMilliseconds && equals(this.zone, that.zone);
  },
  toString() {
    return `DateTime.Zoned(${formatIsoZoned(this)})`;
  }
};
var ProtoTimeZone = {
  [TimeZoneTypeId]: TimeZoneTypeId,
  [NodeInspectSymbol]() {
    return this.toString();
  }
};
var ProtoTimeZoneNamed = {
  ...ProtoTimeZone,
  _tag: "Named",
  [symbol]() {
    return string(`Named:${this.id}`);
  },
  [symbol2](that) {
    return isTimeZone(that) && that._tag === "Named" && this.id === that.id;
  },
  toString() {
    return `TimeZone.Named(${this.id})`;
  },
  toJSON() {
    return {
      _id: "TimeZone",
      _tag: "Named",
      id: this.id
    };
  }
};
var ProtoTimeZoneOffset = {
  ...ProtoTimeZone,
  _tag: "Offset",
  [symbol]() {
    return string(`Offset:${this.offset}`);
  },
  [symbol2](that) {
    return isTimeZone(that) && that._tag === "Offset" && this.offset === that.offset;
  },
  toString() {
    return `TimeZone.Offset(${offsetToString(this.offset)})`;
  },
  toJSON() {
    return {
      _id: "TimeZone",
      _tag: "Offset",
      offset: this.offset
    };
  }
};
var isDateTime = (u) => hasProperty(u, TypeId4);
var isTimeZone = (u) => hasProperty(u, TimeZoneTypeId);
var isUtc = (self) => self._tag === "Utc";
var makeUtc = (epochMillis) => {
  const self = Object.create(ProtoUtc);
  self.epochMilliseconds = epochMillis;
  Object.defineProperty(self, "partsUtc", {
    value: undefined,
    enumerable: false,
    writable: true
  });
  return self;
};
var fromDateUnsafe = (date) => {
  const epochMillis = date.getTime();
  if (Number.isNaN(epochMillis)) {
    throw new IllegalArgumentError2("Invalid date");
  }
  return makeUtc(epochMillis);
};
var makeUnsafe2 = (input) => {
  if (isDateTime(input)) {
    return input;
  } else if (input instanceof Date) {
    return fromDateUnsafe(input);
  } else if (typeof input === "object") {
    if ("epochMilliseconds" in input) {
      return fromDateUnsafe(new Date(input.epochMilliseconds));
    }
    const date = new Date(0);
    setPartsDate(date, input);
    return fromDateUnsafe(date);
  } else if (typeof input === "string" && !hasZone(input)) {
    return fromDateUnsafe(new Date(input + "Z"));
  }
  return fromDateUnsafe(new Date(input));
};
var hasZone = (input) => /Z|GMT|[+-]\d{2}$|[+-]\d{2}:?\d{2}$|\]$/.test(input) || /z$|gmt$/i.test(input);
var minEpochMillis = -8640000000000000 + 12 * 60 * 60 * 1000;
var maxEpochMillis = 8640000000000000 - 14 * 60 * 60 * 1000;
var make4 = /* @__PURE__ */ liftThrowable(makeUnsafe2);
var toUtc = (self) => makeUtc(self.epochMilliseconds);
var toDateUtc = (self) => new Date(self.epochMilliseconds);
var toDate = (self) => {
  if (self._tag === "Utc") {
    return new Date(self.epochMilliseconds);
  } else if (self.zone._tag === "Offset") {
    return new Date(self.epochMilliseconds + self.zone.offset);
  } else if (self.adjustedEpochMilliseconds !== undefined) {
    return new Date(self.adjustedEpochMilliseconds);
  }
  let bc = false;
  const parts = self.zone.format.formatToParts(self.epochMilliseconds).filter((_) => {
    if (_.type === "era") {
      bc = _.value === "BC";
      return false;
    }
    return _.type !== "literal";
  });
  const year = Number(parts[2].value);
  const date = new Date(0);
  date.setUTCFullYear(bc ? 1 - year : year, Number(parts[0].value) - 1, Number(parts[1].value));
  date.setUTCHours(Number(parts[3].value), Number(parts[4].value), Number(parts[5].value), parts[6]?.type === "fractionalSecond" ? Number(parts[6].value) : (self.epochMilliseconds % 1000 + 1000) % 1000);
  self.adjustedEpochMilliseconds = date.getTime();
  return date;
};
var zonedOffset = (self) => {
  const date = toDate(self);
  return date.getTime() - toEpochMillis(self);
};
var offsetToString = (offset) => {
  const abs = Math.abs(offset);
  let hours = Math.floor(abs / (60 * 60 * 1000));
  let minutes = Math.round(abs % (60 * 60 * 1000) / (60 * 1000));
  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }
  return `${offset < 0 ? "-" : "+"}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};
var zonedOffsetIso = (self) => offsetToString(zonedOffset(self));
var toEpochMillis = (self) => self.epochMilliseconds;
var setPartsDate = (date, parts) => {
  if (parts.year !== undefined || parts.month !== undefined || parts.day !== undefined) {
    date.setUTCFullYear(parts.year ?? date.getUTCFullYear(), parts.month !== undefined ? parts.month - 1 : date.getUTCMonth(), parts.day ?? date.getUTCDate());
  }
  if (parts.weekDay !== undefined) {
    const diff = parts.weekDay - date.getUTCDay();
    date.setUTCDate(date.getUTCDate() + diff);
  }
  if (parts.hour !== undefined) {
    date.setUTCHours(parts.hour);
  }
  if (parts.minute !== undefined) {
    date.setUTCMinutes(parts.minute);
  }
  if (parts.second !== undefined) {
    date.setUTCSeconds(parts.second);
  }
  if (parts.millisecond !== undefined) {
    date.setUTCMilliseconds(parts.millisecond);
  }
};
var constDayMillis = 24 * 60 * 60 * 1000;
var formatIso = (self) => toDateUtc(self).toISOString();
var formatIsoOffset = (self) => {
  const date = toDate(self);
  return self._tag === "Utc" ? date.toISOString() : `${date.toISOString().slice(0, -1)}${zonedOffsetIso(self)}`;
};
var formatIsoZoned = (self) => self.zone._tag === "Offset" ? formatIsoOffset(self) : `${formatIsoOffset(self)}[${self.zone.id}]`;

// node_modules/@opencode/schema/node_modules/effect/dist/String.js
var String2 = globalThis.String;
var trim = (self) => self.trim();

// node_modules/@opencode/schema/node_modules/effect/dist/Effect.js
var tryPromise2 = tryPromise;
var succeed5 = succeed3;
var suspend2 = suspend;
var fail5 = fail3;
var failCauseSync2 = failCauseSync;
var die3 = die;
var try_2 = try_;
var fromResult2 = fromResult;
var flatMap2 = flatMap;
var exit2 = exit;
var catchCause2 = catchCause;
var mapError2 = mapError;
var runSyncExit2 = runSyncExit;
var mapEager2 = mapEager;
var mapErrorEager2 = mapErrorEager;
var mapBothEager2 = mapBothEager;
var flatMapEager2 = flatMapEager;
var fnUntracedEager2 = fnUntracedEager;

// node_modules/@opencode/schema/node_modules/effect/dist/encoding/Base64.js
var encode = (input) => encodeBytes(typeof input === "string" ? encoder.encode(input) : input);
var decode = (str) => {
  const stripped = stripCrlf(str);
  const length = stripped.length;
  if (length % 4 !== 0) {
    return fail2(new EncodingError({
      kind: "Decode",
      module: "Base64",
      input: stripped,
      message: `Length must be a multiple of 4, but is ${length}`
    }));
  }
  const index = stripped.indexOf("=");
  if (index !== -1 && (index < length - 2 || index === length - 2 && stripped[length - 1] !== "=")) {
    return fail2(new EncodingError({
      kind: "Decode",
      module: "Base64",
      input: stripped,
      message: "Found a '=' character, but it is not at the end"
    }));
  }
  try {
    const missingOctets = stripped.endsWith("==") ? 2 : stripped.endsWith("=") ? 1 : 0;
    const result = new Uint8Array(3 * (length / 4) - missingOctets);
    for (let i = 0, j = 0;i < length; i += 4, j += 3) {
      const buffer = getCode(stripped.charCodeAt(i)) << 18 | getCode(stripped.charCodeAt(i + 1)) << 12 | getCode(stripped.charCodeAt(i + 2)) << 6 | getCode(stripped.charCodeAt(i + 3));
      result[j] = buffer >> 16;
      result[j + 1] = buffer >> 8 & 255;
      result[j + 2] = buffer & 255;
    }
    return succeed2(result);
  } catch (cause) {
    return fail2(new EncodingError({
      kind: "Decode",
      module: "Base64",
      input: stripped,
      message: cause instanceof Error ? cause.message : "Invalid input"
    }));
  }
};
var encodeBytes = (bytes) => {
  const length = bytes.length;
  const toBase64 = Uint8Array.prototype.toBase64;
  if (length >= 32 && typeof toBase64 === "function")
    return toBase64.call(bytes);
  return length < 128 ? encodeShort(bytes) : encodeLong(bytes);
};
var encodeShort = (bytes) => {
  const length = bytes.length;
  let result = "";
  let i;
  for (i = 2;i < length; i += 3) {
    result += alphabet[bytes[i - 2] >> 2];
    result += alphabet[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
    result += alphabet[(bytes[i - 1] & 15) << 2 | bytes[i] >> 6];
    result += alphabet[bytes[i] & 63];
  }
  if (i === length + 1) {
    result += alphabet[bytes[i - 2] >> 2];
    result += alphabet[(bytes[i - 2] & 3) << 4];
    result += "==";
  }
  if (i === length) {
    result += alphabet[bytes[i - 2] >> 2];
    result += alphabet[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
    result += alphabet[(bytes[i - 1] & 15) << 2];
    result += "=";
  }
  return result;
};
var encodeLong = (bytes) => {
  const length = bytes.length;
  const result = new Uint8Array(Math.ceil(length / 3) * 4);
  let i;
  let j = 0;
  for (i = 2;i < length; i += 3, j += 4) {
    result[j] = alphabetCodes[bytes[i - 2] >> 2];
    result[j + 1] = alphabetCodes[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
    result[j + 2] = alphabetCodes[(bytes[i - 1] & 15) << 2 | bytes[i] >> 6];
    result[j + 3] = alphabetCodes[bytes[i] & 63];
  }
  if (i === length + 1) {
    result[j] = alphabetCodes[bytes[i - 2] >> 2];
    result[j + 1] = alphabetCodes[(bytes[i - 2] & 3) << 4];
    result[j + 2] = paddingCode;
    result[j + 3] = paddingCode;
  }
  if (i === length) {
    result[j] = alphabetCodes[bytes[i - 2] >> 2];
    result[j + 1] = alphabetCodes[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
    result[j + 2] = alphabetCodes[(bytes[i - 1] & 15) << 2];
    result[j + 3] = paddingCode;
  }
  return decoder.decode(result);
};
var encoder = /* @__PURE__ */ new TextEncoder;
var decoder = /* @__PURE__ */ new TextDecoder;
var stripCrlf = (str) => str.replace(/[\n\r]/g, "");
var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var alphabetCodes = /* @__PURE__ */ encoder.encode(alphabet);
var paddingCode = 61;
var codes = /* @__PURE__ */ new Uint8Array(123).fill(255);
for (let i = 0;i < alphabet.length; i++)
  codes[/* @__PURE__ */ alphabet.charCodeAt(i)] = i;
codes[61] = 0;
var getCode = (charCode) => {
  if (charCode >= codes.length || codes[charCode] === 255) {
    throw new TypeError(`Invalid character ${String.fromCharCode(charCode)}`);
  }
  return codes[charCode];
};

// node_modules/@opencode/schema/node_modules/effect/dist/encoding/Base64Url.js
var encode2 = (input) => encode(input).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
var decode2 = (str) => {
  const stripped = str.replace(/[\n\r]/g, "");
  const length = stripped.length;
  const padded = stripped.endsWith("=");
  if (padded ? length % 4 !== 0 : length % 4 === 1) {
    return fail2(new EncodingError({
      module: "Base64Url",
      kind: "Decode",
      input: stripped,
      message: padded ? `Padded length should be a multiple of 4, but is ${length}` : `Unpadded length should not be 1 more than a multiple of 4, but is ${length}`
    }));
  }
  if (!/^[-_A-Z0-9]*?={0,2}$/i.test(stripped)) {
    return fail2(new EncodingError({
      module: "Base64Url",
      kind: "Decode",
      input: stripped,
      message: "Invalid input"
    }));
  }
  let sanitized = length % 4 === 2 ? `${stripped}==` : length % 4 === 3 ? `${stripped}=` : stripped;
  sanitized = sanitized.replace(/-/g, "+").replace(/_/g, "/");
  return decode(sanitized);
};
var decodeString = (str) => map(decode2(str), (_) => decoder2.decode(_));
var decoder2 = /* @__PURE__ */ new TextDecoder;

// node_modules/@opencode/schema/node_modules/effect/dist/DateTime.js
var isDateTime2 = isDateTime;
var isUtc2 = isUtc;
var makeUnsafe3 = makeUnsafe2;
var make5 = make4;
var toUtc2 = toUtc;
var toEpochMillis2 = toEpochMillis;
var formatIso2 = formatIso;

// node_modules/@opencode/schema/node_modules/effect/dist/internal/schema/annotations.js
function resolve(ast) {
  return ast.checks ? ast.checks[ast.checks.length - 1].annotations : ast.annotations;
}
var STRUCTURAL_ANNOTATION_KEY = "~structural";
var SENTINELS_ANNOTATION_KEY = "~sentinels";
var CONSTRUCTOR_ANNOTATION_KEY = "~constructor";
var getExpected = /* @__PURE__ */ memoize((ast) => {
  const identifier = resolve(ast)?.identifier;
  if (typeof identifier === "string")
    return identifier;
  return ast.getExpected(getExpected);
});

// node_modules/@opencode/schema/node_modules/effect/dist/internal/schema/parser.js
var missing = /* @__PURE__ */ Symbol();
var succeed6 = succeed4;
var missingExit = /* @__PURE__ */ succeed6(missing);
var sameExit = /* @__PURE__ */ succeed6(missing);
var toOption = (value) => value === missing ? none2() : some2(value);
var fromOptionExit = (option) => option._tag === "None" ? missingExit : succeed6(option.value);

// node_modules/@opencode/schema/node_modules/effect/dist/SchemaIssue.js
var TypeId5 = "~effect/SchemaIssue/Issue";
function isIssue(u) {
  return hasProperty(u, TypeId5) && u[TypeId5] === TypeId5;
}
function hasInput(issue) {
  return Object.hasOwn(issue, "input");
}

class IssueNodeImpl {
  [TypeId5] = TypeId5;
  constructor(input, options) {
    if (options?.reportInput === true && input !== missing) {
      this.input = input;
    }
  }
}
var Filter = class extends IssueNodeImpl {
  _tag = "Filter";
  filter;
  issue;
  constructor(filter, issue, input, options) {
    super(input, options);
    this.filter = filter;
    this.issue = issue;
  }
};
var Encoding = class extends IssueNodeImpl {
  _tag = "Encoding";
  ast;
  issue;
  constructor(ast, issue, input, options) {
    super(input, options);
    this.ast = ast;
    this.issue = issue;
  }
};
var Pointer = class extends IssueNodeImpl {
  _tag = "Pointer";
  path;
  issue;
  constructor(path, issue) {
    super();
    this.path = path;
    this.issue = issue;
  }
};
var MissingKey = class extends IssueNodeImpl {
  _tag = "MissingKey";
  annotations;
  constructor(annotations) {
    super();
    this.annotations = annotations;
  }
};
var UnexpectedKey = class extends IssueNodeImpl {
  _tag = "UnexpectedKey";
  ast;
  constructor(ast, input, options) {
    super(input, options);
    this.ast = ast;
  }
};
var Composite = class extends IssueNodeImpl {
  _tag = "Composite";
  ast;
  issues;
  constructor(ast, issues, input, options) {
    super(input, options);
    this.ast = ast;
    this.issues = issues;
  }
};
var InvalidType = class extends IssueNodeImpl {
  _tag = "InvalidType";
  ast;
  constructor(ast, input, options) {
    super(input, options);
    this.ast = ast;
  }
};
var InvalidValue = class extends IssueNodeImpl {
  _tag = "InvalidValue";
  annotations;
  constructor(annotations, input, options) {
    super(input, options);
    this.annotations = annotations;
  }
};
var Forbidden = class extends IssueNodeImpl {
  _tag = "Forbidden";
  annotations;
  constructor(annotations, input, options) {
    super(input, options);
    this.annotations = annotations;
  }
};
var AnyOf = class extends IssueNodeImpl {
  _tag = "AnyOf";
  ast;
  issues;
  constructor(ast, issues, input, options) {
    super(input, options);
    this.ast = ast;
    this.issues = issues;
  }
};
var OneOf = class extends IssueNodeImpl {
  _tag = "OneOf";
  ast;
  successes;
  constructor(ast, successes, input, options) {
    super(input, options);
    this.ast = ast;
    this.successes = successes;
  }
};
function makeFilterIssue(entry, input, options) {
  if (isIssue(entry)) {
    return entry;
  }
  if (typeof entry === "string") {
    return new InvalidValue({
      message: entry
    }, input, options);
  }
  const inner = typeof entry.issue === "string" ? new InvalidValue({
    message: entry.issue
  }, input, options) : entry.issue;
  return new Pointer(entry.path, inner);
}
function makeSingle(out, input, options) {
  if (out === undefined) {
    return;
  }
  if (typeof out === "boolean") {
    return out ? undefined : new InvalidValue(undefined, input, options);
  }
  return makeFilterIssue(out, input, options);
}
function normalizeFilterOutput(ast, out, input, options) {
  if (Array.isArray(out)) {
    if (!isReadonlyArrayNonEmpty(out)) {
      return;
    }
    return out.length === 1 ? makeFilterIssue(out[0], input, options) : new Composite(ast, map2(out, (entry) => makeFilterIssue(entry, input, options)), input, options);
  }
  return makeSingle(out, input, options);
}
var defaultLeafHook = (issue) => {
  const message = findMessage(issue);
  if (message !== undefined)
    return message;
  switch (issue._tag) {
    case "InvalidType":
      return getExpectedMessage(getExpected(issue.ast), issue);
    case "InvalidValue": {
      const expected = findExpected(issue);
      if (expected !== undefined)
        return getExpectedMessage(expected, issue);
      const input = formatInput(issue);
      return input === undefined ? "Expected a valid value" : `Invalid data ${input}`;
    }
    case "MissingKey":
      return "Missing key";
    case "UnexpectedKey": {
      const input = formatInput(issue);
      return input === undefined ? "Expected no excess property" : `Unexpected key with value ${input}`;
    }
    case "Forbidden":
      return "Forbidden operation";
    case "OneOf": {
      const input = formatInput(issue);
      return input === undefined ? "Expected exactly one member to match" : `Expected exactly one member to match the input ${input}`;
    }
  }
};
var defaultCheckHook = (issue) => findMessage(issue) ?? findMessage(issue.issue);
function formatInput(issue) {
  return hasInput(issue) ? format(issue.input) : undefined;
}
function findExpected(issue) {
  const expected = issue.annotations?.expected;
  return typeof expected === "string" ? expected : undefined;
}
function getExpectedMessage(expected, issue) {
  const input = formatInput(issue);
  return input === undefined ? `Expected ${expected}` : `Expected ${expected}, got ${input}`;
}
function getFilterMessage(issue, checkHook) {
  const message = checkHook(issue);
  if (message !== undefined || issue.issue._tag !== "InvalidValue")
    return message;
  const expected = findExpected(issue.issue);
  return expected === undefined ? getExpectedMessage(formatCheck(issue.filter), issue) : getExpectedMessage(expected, issue.issue);
}
function formatCheck(check) {
  const expected = check.annotations?.expected;
  if (typeof expected === "string")
    return expected;
  switch (check._tag) {
    case "Filter":
      return "<filter>";
    case "FilterGroup":
      return check.checks.map((check) => formatCheck(check)).join(" & ");
  }
}
function makeFormatterDefault() {
  return (issue) => formatIssue(issue, "");
}
var defaultFormatter = /* @__PURE__ */ makeFormatterDefault();
function formatIssue(issue, path, messageOverride) {
  let message;
  switch (issue._tag) {
    case "Filter":
      return formatIssue(issue.issue, path, messageOverride ?? getFilterMessage(issue, defaultCheckHook));
    case "Encoding":
      return formatIssue(issue.issue, path, messageOverride);
    case "Pointer":
      return formatIssue(issue.issue, path + formatPath(issue.path), messageOverride);
    case "Composite":
    case "AnyOf": {
      if (issue._tag === "Composite" || issue.issues.length > 0) {
        return issue.issues.map((issue) => formatIssue(issue, path, messageOverride)).join(`
`);
      }
      message = messageOverride ?? findMessage(issue) ?? getExpectedMessage(getExpected(issue.ast), issue);
      break;
    }
    default:
      message = messageOverride ?? defaultLeafHook(issue);
      break;
  }
  return path ? `${message}
  at ${path}` : message;
}
function findMessage(issue) {
  if (issue._tag === "Pointer" || issue._tag === "Composite")
    return;
  if (issue._tag === "Encoding")
    return findMessage(issue.issue);
  const annotations = issue._tag === "Filter" ? issue.filter.annotations : ("annotations" in issue) ? issue.annotations : issue.ast.annotations;
  const message = annotations?.[issue._tag === "MissingKey" ? "messageMissingKey" : issue._tag === "UnexpectedKey" ? "messageUnexpectedKey" : "message"];
  if (typeof message === "string")
    return message;
}

// node_modules/@opencode/schema/node_modules/effect/dist/internal/schema/cause.js
function getSchemaIssue(cause) {
  let issue;
  for (const reason of cause.reasons) {
    if (!isFailReason2(reason) || !isIssue(reason.error)) {
      return;
    }
    issue ??= reason.error;
  }
  return issue;
}
function getSchemaIssueOrThrow(cause, message) {
  const issue = getSchemaIssue(cause);
  if (issue === undefined) {
    throw new Error(message, {
      cause
    });
  }
  return issue;
}

// node_modules/@opencode/schema/node_modules/effect/dist/SchemaGetter.js
var makeGetter = (fields) => Object.assign(Object.create(Prototype), fields);
function fail6(f) {
  return transformOptionalEffect((oe, options) => fail5(f(oe, options)));
}
function forbidden(message) {
  return fail6((oe, options) => {
    const annotations = {
      message: message(oe)
    };
    return isSome2(oe) ? new Forbidden(annotations, oe.value, options) : new Forbidden(annotations);
  });
}
var forbiddenEncoding = /* @__PURE__ */ forbidden(() => "Encoding is not supported");
var passthrough_ = /* @__PURE__ */ makeGetter({
  _tag: "Passthrough"
});
function passthrough() {
  return passthrough_;
}
function transform(f) {
  return makeGetter({
    _tag: "Transform",
    transform: f
  });
}
function transformEffect(f) {
  return makeGetter({
    _tag: "TransformEffect",
    transform: f
  });
}
function transformOptional(f) {
  return makeGetter({
    _tag: "TransformOptional",
    transform: f
  });
}
function transformOptionalEffect(f) {
  return makeGetter({
    _tag: "TransformOptionalEffect",
    transform: f
  });
}
function String3() {
  return transform(globalThis.String);
}
function Number3() {
  return transform(globalThis.Number);
}
function trim2() {
  return transform(trim);
}
function parseJson(options) {
  return transformEffect((input, parseOptions) => try_2({
    try: () => JSON.parse(input, options?.reviver),
    catch: () => new InvalidValue({
      expected: "a valid JSON string"
    }, input, parseOptions)
  }));
}
function stringifyJson(options) {
  return transformEffect((input, parseOptions) => try_2({
    try: () => {
      const output = JSON.stringify(input, options?.replacer, options?.space);
      if (output === undefined) {
        throw new TypeError("Value cannot be represented as JSON");
      }
      return output;
    },
    catch: () => new InvalidValue({
      expected: "a JSON-serializable value"
    }, input, parseOptions)
  }));
}
function encodeBase64() {
  return transform(encode);
}
function decodeBase64() {
  return transformEffect((input, options) => mapErrorEager2(fromResult2(decode(input)), () => new InvalidValue({
    expected: "a valid Base64 string"
  }, input, options)));
}

// node_modules/@opencode/schema/node_modules/effect/dist/internal/schema/content.js
var ContentTypeId = /* @__PURE__ */ Symbol.for("~effect/Schema/content");
function setContent(operation, content) {
  Object.defineProperty(operation, ContentTypeId, {
    value: content
  });
  return operation;
}

// node_modules/@opencode/schema/node_modules/effect/dist/SchemaTransformation.js
var TypeId6 = "~effect/SchemaTransformation/Transformation";
var Transformation = class extends Class {
  [TypeId6] = TypeId6;
  _tag = "Transformation";
  decode;
  encode;
  constructor(decode, encode) {
    super();
    this.decode = decode;
    this.encode = encode;
  }
  flip() {
    return new Transformation(this.encode, this.decode);
  }
};
function isTransformation(u) {
  return hasProperty(u, TypeId6) && u[TypeId6] === TypeId6;
}
var makeTransformation = (options) => {
  if (isTransformation(options)) {
    return options;
  }
  return new Transformation(options.decode, options.encode);
};
function transformEffect2(options) {
  return new Transformation(transformEffect(options.decode), transformEffect(options.encode));
}
function transform2(options) {
  return new Transformation(transform(options.decode), transform(options.encode));
}
function trim3() {
  return new Transformation(trim2(), passthrough());
}
var passthrough_2 = /* @__PURE__ */ new Transformation(/* @__PURE__ */ passthrough(), /* @__PURE__ */ passthrough());
function passthrough2() {
  return passthrough_2;
}
var numberFromString = /* @__PURE__ */ new Transformation(/* @__PURE__ */ Number3(), /* @__PURE__ */ String3());
var isJsonError = (input) => isObject(input) && typeof input["message"] === "string";
var decodeJsonError = (input) => {
  const hasCause = Object.hasOwn(input, "cause");
  const err = hasCause ? new Error(input.message, {
    cause: decodeDefect(input.cause)
  }) : new Error(input.message);
  if (typeof input.name === "string" && input.name !== "Error")
    err.name = input.name;
  if (typeof input.stack === "string")
    err.stack = input.stack;
  return err;
};
var encodeUnknownAsJson = (input) => {
  try {
    const json = formatJson(input);
    return json === undefined ? format(input) : JSON.parse(json);
  } catch {
    return format(input);
  }
};
var encodeJsonError = (input, options, encodeDefect) => {
  const encoded = {
    name: input.name,
    message: typeof input.message === "string" ? input.message : ""
  };
  if (options?.includeStack && typeof input.stack === "string") {
    encoded.stack = input.stack;
  }
  if (!options?.excludeCause && input.cause !== undefined) {
    encoded.cause = encodeDefect(input.cause);
  }
  return encoded;
};
var makeEncodeDefect = (options) => {
  const seen = new WeakSet;
  const encode = (input) => {
    if (isError(input)) {
      if (seen.has(input)) {
        return "[Circular]";
      }
      seen.add(input);
      const encoded = encodeJsonError(input, options, encode);
      seen.delete(input);
      return encoded;
    }
    return encodeUnknownAsJson(input);
  };
  return encode;
};
var decodeDefect = (input) => isJsonError(input) ? decodeJsonError(input) : input;
var defectFromJson = (options) => transform2({
  decode: decodeDefect,
  encode: makeEncodeDefect(options)
});
var urlFromString = /* @__PURE__ */ transformEffect2({
  decode: (s, options) => URL.canParse(s) ? succeed5(new URL(s)) : fail5(new InvalidValue({
    expected: "a valid URL string"
  }, s, options)),
  encode: (url) => succeed5(url.href)
});
var uint8ArrayFromBase64String = /* @__PURE__ */ new Transformation(/* @__PURE__ */ decodeBase64(), /* @__PURE__ */ encodeBase64());
function fromJsonString(options) {
  return new Transformation(parseJson(options ?? {}), setContent(stringifyJson(options), {
    mediaType: "application/json",
    preserveSchema: options?.reviver === undefined && options?.replacer === undefined
  }));
}

// node_modules/@opencode/schema/node_modules/effect/dist/SchemaAST.js
function makeGuard(tag) {
  return (ast) => ast._tag === tag;
}
var isDeclaration = /* @__PURE__ */ makeGuard("Declaration");
var isNever2 = /* @__PURE__ */ makeGuard("Never");
var isLiteral = /* @__PURE__ */ makeGuard("Literal");
var isUniqueSymbol = /* @__PURE__ */ makeGuard("UniqueSymbol");
var isArrays = /* @__PURE__ */ makeGuard("Arrays");
var isObjects = /* @__PURE__ */ makeGuard("Objects");
var isUnion = /* @__PURE__ */ makeGuard("Union");
var isSuspend = /* @__PURE__ */ makeGuard("Suspend");
var Link = class {
  to;
  transformation;
  constructor(to, transformation) {
    this.to = to;
    this.transformation = transformation;
  }
};
var defaultParseOptions = {};
var Context = class {
  isOptional;
  isMutable;
  constructorDefault;
  annotations;
  constructor(isOptional, isMutable, constructorDefault = undefined, annotations = undefined) {
    this.isOptional = isOptional;
    this.isMutable = isMutable;
    this.constructorDefault = constructorDefault;
    this.annotations = annotations;
  }
};
var TypeId7 = "~effect/Schema";

class ASTNodeImpl {
  [TypeId7] = TypeId7;
  annotations;
  checks;
  encoding;
  context;
  constructor(annotations = undefined, checks = undefined, encoding = undefined, context = undefined) {
    this.annotations = annotations;
    this.checks = checks;
    this.encoding = encoding;
    this.context = context;
  }
  toString() {
    return `<${this._tag}>`;
  }
}
var Declaration = class extends ASTNodeImpl {
  _tag = "Declaration";
  typeParameters;
  run;
  encodingChecks;
  encodingRun;
  constructor(typeParameters, run, annotations, checks, encoding, context, encodingChecks, encodingRun) {
    super(annotations, checks, encoding, context);
    this.typeParameters = typeParameters;
    this.run = run;
    this.encodingChecks = encodingChecks;
    this.encodingRun = encodingRun;
  }
  getParser() {
    let run;
    return (input, options) => {
      if (input === missing)
        return missingExit;
      run ??= this.run(this.typeParameters);
      try {
        return run(input, this, options);
      } catch (error) {
        return die3(error);
      }
    };
  }
  _rebuild(recur, checks, encodingChecks, run, encodingRun) {
    const tps = mapOrSame(this.typeParameters, recur);
    return tps === this.typeParameters && checks === this.checks && encodingChecks === this.encodingChecks && run === this.run && encodingRun === this.encodingRun ? this : new Declaration(tps, run, this.annotations, checks, undefined, this.context, encodingChecks, encodingRun);
  }
  recur(recur) {
    return this._rebuild(recur, this.checks, this.encodingChecks, this.run, this.encodingRun);
  }
  flip(recur) {
    return this._rebuild(recur, this.encodingChecks, this.checks, this.encodingRun ?? this.run, this.run);
  }
  getExpected() {
    const expected = this.annotations?.expected;
    if (typeof expected === "string")
      return expected;
    return "<Declaration>";
  }
};
var Null = class extends ASTNodeImpl {
  _tag = "Null";
  getParser() {
    return fromConst(this, null);
  }
  getExpected() {
    return "null";
  }
};
var null_ = /* @__PURE__ */ new Null;
var Undefined = class extends ASTNodeImpl {
  _tag = "Undefined";
  getParser() {
    return fromConst(this, undefined);
  }
  toCodecJson() {
    return replaceEncoding(this, [undefinedToNull]);
  }
  getExpected() {
    return "undefined";
  }
};
var undefinedToNull = /* @__PURE__ */ new Link(null_, /* @__PURE__ */ new Transformation(/* @__PURE__ */ transform(() => {
  return;
}), /* @__PURE__ */ transform(() => null)));
var undefined_2 = /* @__PURE__ */ new Undefined;
var Any = class extends ASTNodeImpl {
  _tag = "Any";
  getParser() {
    return fromRefinement(this, isUnknown);
  }
  getExpected() {
    return "any";
  }
};
var any = /* @__PURE__ */ new Any;
var Unknown = class extends ASTNodeImpl {
  _tag = "Unknown";
  getParser() {
    return fromRefinement(this, isUnknown);
  }
  getExpected() {
    return "unknown";
  }
};
var unknown = /* @__PURE__ */ new Unknown;
function formatTemplateLiteralPath(path) {
  return typeof path === "number" ? `parts[${path}]` : path;
}
function isTemplateLiteralPart(ast, path, validated) {
  if (validated.has(ast))
    return true;
  if (ast.encoding) {
    throw new Error(`TemplateLiteral parts cannot have an encoding at ${formatTemplateLiteralPath(path)}`);
  }
  let valid;
  switch (ast._tag) {
    case "String":
    case "Number":
    case "BigInt":
      valid = true;
      break;
    case "Literal":
      valid = !ast.checks;
      break;
    case "TemplateLiteral": {
      const currentPath = formatTemplateLiteralPath(path);
      valid = !ast.checks && ast.parts.every((part, index) => isTemplateLiteralPart(part, `${currentPath}.parts[${index}]`, validated));
      break;
    }
    case "Union": {
      const currentPath = formatTemplateLiteralPath(path);
      valid = !ast.checks && ast.types.every((part, index) => isTemplateLiteralPart(part, `${currentPath}.types[${index}]`, validated));
      break;
    }
    default:
      return false;
  }
  if (valid)
    validated.add(ast);
  return valid;
}
var TemplateLiteral = class extends ASTNodeImpl {
  _tag = "TemplateLiteral";
  parts;
  encodedParts;
  literals;
  suffixLengths;
  constructor(parts, annotations, checks, encoding, context) {
    super(annotations, checks, encoding, context);
    const encodedParts = [];
    const literals = [];
    const validated = new Set;
    for (let index = 0;index < parts.length; index++) {
      const part = parts[index];
      if (!isTemplateLiteralPart(part, index, validated)) {
        throw new Error(`Invalid TemplateLiteral part ${part._tag}`);
      }
      encodedParts.push(part);
      literals.push(part._tag === "Literal" ? globalThis.String(part.literal) : undefined);
    }
    const suffixLengths = new Array(encodedParts.length + 1);
    suffixLengths[encodedParts.length] = 0;
    for (let i = encodedParts.length - 1;i >= 0; i--) {
      suffixLengths[i] = suffixLengths[i + 1] + (literals[i]?.length ?? 0);
    }
    this.parts = parts;
    this.encodedParts = encodedParts;
    this.literals = literals;
    this.suffixLengths = suffixLengths;
  }
  getParser(compile) {
    const tuple = new Arrays(false, this.parts.map(partFromString), []);
    const parser = compile(decodeTo(string2, tuple, templateLiteralTransformation(this)));
    return (input, options) => {
      if (input === missing)
        return missingExit;
      const result = parser(input, options);
      if (result._tag === "Success") {
        return sameExit;
      }
      return mapBothEager2(result, {
        onSuccess: () => input,
        onFailure: (issue) => new Composite(this, [issue], input, options)
      });
    };
  }
  getExpected() {
    return "string";
  }
  matchPart(s, options) {
    return segmentTemplateLiteralParts(this, s, options) === undefined ? undefined : s;
  }
};
function templateLiteralTransformation(template) {
  return new Transformation(transformEffect((s, options) => {
    const segments = segmentTemplateLiteralParts(template, s, options);
    if (segments)
      return succeed5(segments);
    return fail5(new InvalidValue({
      expected: "a string matching template literal parts"
    }, s, options));
  }), transform((parts) => parts.join("")));
}
var Literal = class extends ASTNodeImpl {
  _tag = "Literal";
  literal;
  constructor(literal, annotations, checks, encoding, context) {
    super(annotations, checks, encoding, context);
    if (typeof literal === "number" && !globalThis.Number.isFinite(literal)) {
      throw new Error(`A numeric literal must be finite, got ${format(literal)}`);
    }
    this.literal = literal;
  }
  getParser() {
    return fromConst(this, this.literal);
  }
  matchPart(s, _options) {
    return s === globalThis.String(this.literal) ? this.literal : undefined;
  }
  toCodecJson() {
    return typeof this.literal === "bigint" ? literalToString(this) : this;
  }
  toCodecStringTree() {
    return typeof this.literal === "string" ? this : literalToString(this);
  }
  getExpected() {
    return typeof this.literal === "string" ? JSON.stringify(this.literal) : globalThis.String(this.literal);
  }
};
function literalToString(ast) {
  const literalAsString = globalThis.String(ast.literal);
  return replaceEncoding(ast, [new Link(new Literal(literalAsString), new Transformation(transform(() => ast.literal), transform(() => literalAsString)))]);
}
var String4 = class extends ASTNodeImpl {
  _tag = "String";
  getParser() {
    return fromRefinement(this, isString);
  }
  matchPart(s, options) {
    const checks = this.checks;
    return checks && !options.disableChecks && collectIssues(checks, s, undefined, this, options) ? undefined : s;
  }
  getExpected() {
    return "string";
  }
};
var string2 = /* @__PURE__ */ new String4;
var Number4 = class extends ASTNodeImpl {
  _tag = "Number";
  getParser() {
    return fromRefinement(this, isNumber);
  }
  matchKey(s, options) {
    return this._match(isStringNumberRegExp, s, options);
  }
  matchPart(s, options) {
    return this._match(isStringFiniteRegExp, s, options);
  }
  _match(regexp, s, options) {
    if (!regexp.test(s))
      return;
    const value = globalThis.Number(s);
    if (options.disableChecks || !this.checks)
      return value;
    return collectIssues(this.checks, value, undefined, this, options) ? undefined : value;
  }
  toCodecJson() {
    if (this.checks && (hasCheck(this.checks, "effect/schema/isFinite") || hasCheck(this.checks, "effect/schema/isInt"))) {
      return this;
    }
    return replaceEncoding(this, [numberToJson]);
  }
  toCodecStringTree() {
    if (this.toCodecJson() === this) {
      return replaceEncoding(this, [finiteToString]);
    }
    return replaceEncoding(this, [numberToString]);
  }
  getExpected() {
    return "number";
  }
};
function hasCheck(checks, id) {
  return checks.some((check) => check.annotations?.representation?.id === id || check._tag === "FilterGroup" && hasCheck(check.checks, id));
}
var number2 = /* @__PURE__ */ new Number4;
var Boolean2 = class extends ASTNodeImpl {
  _tag = "Boolean";
  getParser() {
    return fromRefinement(this, isBoolean);
  }
  getExpected() {
    return "boolean";
  }
};
var boolean = /* @__PURE__ */ new Boolean2;
var Arrays = class extends ASTNodeImpl {
  _tag = "Arrays";
  isMutable;
  elements;
  rest;
  encodingChecks;
  constructor(isMutable, elements, rest, annotations, checks, encoding, context, encodingChecks) {
    super(annotations, checks, encoding, context);
    this.isMutable = isMutable;
    this.elements = elements;
    this.rest = rest;
    this.encodingChecks = encodingChecks;
    let hasOptional = false;
    for (let i = 0;i < elements.length; i++) {
      if (isOptional(elements[i])) {
        hasOptional = true;
      } else if (hasOptional) {
        throw new Error("A required element cannot follow an optional element. ts(1257)");
      }
    }
    if (hasOptional && rest.length > 1) {
      throw new Error("A required element cannot follow an optional element. ts(1257)");
    }
    for (let i = 1;i < rest.length; i++) {
      if (isOptional(rest[i])) {
        throw new Error("An optional element cannot follow a rest element. ts(1266)");
      }
    }
  }
  getParser(compile, compileField = compile) {
    const ast = this;
    let elements;
    let rest;
    const elementLen = ast.elements.length;
    const tailLen = Math.max(0, ast.rest.length - 1);
    function getParser(tailThreshold, index) {
      if (index < elementLen) {
        return elements[index];
      } else if (index >= tailThreshold) {
        return rest[index - tailThreshold + 1];
      }
      return rest[0];
    }
    const finish = (state) => {
      const {
        input,
        len,
        options
      } = state;
      if (ast.rest.length === 0 && len > elementLen) {
        for (let i = elementLen;i < len; i++) {
          const unexpected = new UnexpectedKey(ast, input[i], options);
          const issue = new Pointer([i], unexpected);
          if (options.errors === "all") {
            if (state.issues)
              state.issues.push(issue);
            else
              state.issues = [issue];
          } else {
            return fail5(new Composite(ast, [issue], input, options));
          }
        }
      }
      if (state.issues) {
        return fail5(new Composite(ast, state.issues, input, options));
      }
      return succeed6(state.output);
    };
    const parse = (input, options) => {
      const len = input.length;
      const state = {
        ast,
        getParser,
        input,
        len,
        tailThreshold: Math.max(elementLen, len - tailLen),
        output: [],
        issues: undefined,
        options
      };
      const end = ast.rest.length === 0 ? elementLen : Math.max(len, elementLen + tailLen);
      const concurrency = options.concurrency === undefined ? 1 : resolveConcurrency(options.concurrency);
      const eff = concurrency === 1 ? parseArray(state, input, 0, end) : parseArrayConcurrent(state, input, {
        concurrency,
        end
      });
      if (!eff)
        return finish(state);
      if (effectIsExit(eff))
        return flatMapEager2(eff, () => finish(state));
      let first = true;
      return suspend2(() => {
        if (!first)
          return parse(input, options);
        first = false;
        return flatMap2(eff, () => finish(state));
      });
    };
    return (input, options) => {
      if (input === missing)
        return missingExit;
      try {
        if (!Array.isArray(input)) {
          return fail5(new InvalidType(ast, input, options));
        }
        if (!elements) {
          elements = ast.elements.map((ast) => ({
            ast,
            parser: compileField(ast)
          }));
          rest = ast.rest.map((ast) => ({
            ast,
            parser: compileField(ast)
          }));
        }
        return parse(input, options);
      } catch (error) {
        return die3(error);
      }
    };
  }
  _rebuild(recur, checks, encodingChecks) {
    const elements = mapOrSame(this.elements, recur);
    const rest = mapOrSame(this.rest, recur);
    return elements === this.elements && rest === this.rest && checks === this.checks && encodingChecks === this.encodingChecks ? this : new Arrays(this.isMutable, elements, rest, this.annotations, checks, undefined, this.context, encodingChecks);
  }
  recur(recur) {
    return this._rebuild(recur, this.checks, this.encodingChecks);
  }
  flip(recur) {
    return this._rebuild(recur, this.encodingChecks, this.checks);
  }
  getExpected() {
    return "array";
  }
};
function stepArray(s, item, exit, i) {
  if (exit._tag === "Failure") {
    return wrapPropertyKeyIssue(s, s.ast, i, exit);
  }
  const value = exit === sameExit ? item : exit[args];
  if (value !== missing) {
    s.output[i] = value;
  } else {
    const p = s.getParser(s.tailThreshold, i);
    if (isOptional(p.ast))
      return;
    const issue = new Pointer([i], new MissingKey(p.ast.context?.annotations));
    if (s.options.errors === "all") {
      if (s.issues)
        s.issues.push(issue);
      else
        s.issues = [issue];
    } else {
      return fail4(new Composite(s.ast, [issue], s.input, s.options));
    }
  }
}
var parseArrayOptions = {
  onItem(s, item, i) {
    const value = i < s.len ? item : missing;
    return s.getParser(s.tailThreshold, i).parser(value, s.options);
  },
  step: stepArray
};
var parseArray = /* @__PURE__ */ iterateEager()(parseArrayOptions);
var parseArrayConcurrent = /* @__PURE__ */ iterateConcurrent()(parseArrayOptions);
var wrapPropertyKeyIssue = (s, ast, key, exit) => {
  if (exit.cause.reasons.length === 0) {
    return exit;
  }
  const issue = getSchemaIssue(exit.cause);
  if (issue === undefined) {
    return failCause2(map4(exit.cause, (issue) => new Composite(ast, [new Pointer([key], issue)], s.input, s.options)));
  }
  const pointer = new Pointer([key], issue);
  if (s.options.errors === "all") {
    if (s.issues)
      s.issues.push(pointer);
    else
      s.issues = [pointer];
  } else {
    return fail4(new Composite(ast, [pointer], s.input, s.options));
  }
};
var FINITE_PATTERN = "[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)(?:[Ee][+-]?\\d+)?";
function getIndexSignatureKeys(input, parameter, options = defaultParseOptions) {
  let stringKeys;
  let symbolKeys;
  function go(parameter) {
    switch (parameter._tag) {
      case "String":
      case "TemplateLiteral":
        return (stringKeys ??= Object.keys(input)).filter((k) => parameter.matchPart(k, options) !== undefined);
      case "Number":
        return (stringKeys ??= Object.keys(input)).filter((k) => parameter.matchKey(k, options) !== undefined);
      case "Symbol":
        return (symbolKeys ??= Object.getOwnPropertySymbols(input)).filter((k) => Object.prototype.propertyIsEnumerable.call(input, k) && parameter.matchKey(k, options) !== undefined);
      case "Union":
        return [...new Set(parameter.types.flatMap(go))];
      default:
        return [];
    }
  }
  return go(parameterFromPropertyKey(toEncoded(parameter)));
}
var PropertySignature = class {
  name;
  type;
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }
};
function isIndexSignatureParameterSide(ast) {
  switch (ast._tag) {
    case "String":
    case "Number":
    case "Symbol":
    case "TemplateLiteral":
      return true;
    case "Union":
      return ast.types.every(isIndexSignatureParameterSide);
    default:
      return false;
  }
}
function isIndexSignatureParameterEncodedSide(ast) {
  const encoded = getLastEncoding(ast);
  switch (encoded._tag) {
    case "String":
    case "Number":
    case "Symbol":
    case "TemplateLiteral":
      return true;
    case "Union":
      return encoded.types.every(isIndexSignatureParameterEncodedSide);
    default:
      return false;
  }
}
function isIndexSignatureParameter(ast) {
  return isIndexSignatureParameterSide(ast) && isIndexSignatureParameterEncodedSide(ast);
}
var IndexSignature = class {
  parameter;
  type;
  constructor(parameter, type) {
    if (!isIndexSignatureParameter(parameter)) {
      throw new Error(`Invalid index signature parameter ${parameter._tag}`);
    }
    this.parameter = parameter;
    this.type = type;
    if (isOptional(type) || type.encoding !== undefined && isOptional(toEncoded(type))) {
      throw new Error("Cannot use `Schema.optionalKey` or `Schema.optional` with index signatures. Index signatures already allow keys to be absent; use `Schema.UndefinedOr` to allow `undefined` values.");
    }
  }
};
var Objects = class extends ASTNodeImpl {
  _tag = "Objects";
  propertySignatures;
  indexSignatures;
  encodingChecks;
  constructor(propertySignatures, indexSignatures, annotations, checks, encoding, context, encodingChecks) {
    super(annotations, checks, encoding, context);
    this.propertySignatures = propertySignatures;
    this.indexSignatures = indexSignatures;
    this.encodingChecks = encodingChecks;
  }
  getParser(compile, compileField = compile) {
    const ast = this;
    const hasProperties = ast.propertySignatures.length;
    const indexCount = ast.indexSignatures.length;
    if (!hasProperties && !indexCount) {
      return fromRefinement(ast, isNotNullish);
    }
    let properties;
    let indexes;
    const compileMembers = () => {
      if (!properties) {
        properties = ast.propertySignatures.map((ps) => ({
          parser: compileField(ps.type),
          name: ps.name,
          type: ps.type
        }));
        indexes = indexCount ? ast.indexSignatures.map((is) => ({
          is,
          parserKey: compile(parameterFromPropertyKey(is.parameter)),
          parserValue: compileField(is.type)
        })) : undefined;
      }
      return properties;
    };
    const makeFallback = () => {
      const expectedKeys = new Set(ast.propertySignatures.map((ps) => typeof ps.name === "number" ? globalThis.String(ps.name) : ps.name));
      const finishIndex = (s, key, k2, inputValue, exitValue) => {
        if (exitValue._tag === "Failure") {
          return wrapPropertyKeyIssue(s, ast, key, exitValue) ?? void_2;
        }
        const value = exitValue === sameExit ? inputValue : exitValue[args];
        if (k2 !== missing && value !== missing) {
          if (hasProperties && (expectedKeys.has(key) || expectedKeys.has(typeof k2 === "number" ? globalThis.String(k2) : k2)))
            return void_2;
          assignProperty(s.out, k2, value);
        }
        return void_2;
      };
      const parseIndex = (s, key, index, exitKey) => {
        if (!exitKey) {
          const eff = index.parserKey(key, s.options);
          if (!effectIsExit(eff)) {
            return flatMap2(exit2(eff), (exit) => parseIndex(s, key, index, exit));
          }
          exitKey = eff;
        }
        if (exitKey._tag === "Failure") {
          return wrapPropertyKeyIssue(s, ast, key, exitKey) ?? void_2;
        }
        const k2 = exitKey === sameExit ? key : exitKey[args];
        const inputValue = s.input[key];
        const result = index.parserValue(inputValue, s.options);
        return effectIsExit(result) ? finishIndex(s, key, k2, inputValue, result) : flatMap2(exit2(result), (exit) => finishIndex(s, key, k2, inputValue, exit));
      };
      const parseStringIndex = (s, key, index) => {
        const inputValue = s.input[key];
        const result = index.parserValue(inputValue, s.options);
        return effectIsExit(result) ? finishIndex(s, key, key, inputValue, result) : flatMap2(exit2(result), (exit) => finishIndex(s, key, key, inputValue, exit));
      };
      const parseIndexes = indexCount ? iterateConcurrent()({
        onItem: (s, [key, index]) => index.is.parameter === string2 ? parseStringIndex(s, key, index) : parseIndex(s, key, index),
        step: (_s, _item, exit) => exit._tag === "Failure" ? exit : undefined
      }) : undefined;
      return fnUntracedEager2(function* (input, options) {
        if (input === missing) {
          return missing;
        }
        if (!(typeof input === "object" && input !== null && !Array.isArray(input))) {
          return yield* fail5(new InvalidType(ast, input, options));
        }
        compileMembers();
        const record = input;
        const out = {};
        const state = {
          ast,
          input: record,
          out,
          issues: undefined,
          options
        };
        const errorsAllOption = options.errors === "all";
        const onExcessPropertyError = options.onExcessProperty === "error";
        const concurrency = options.concurrency === undefined ? 1 : resolveConcurrency(options.concurrency);
        const indexKeys = indexCount && onExcessPropertyError ? ast.indexSignatures.map((index) => getIndexSignatureKeys(record, index.parameter, options)) : undefined;
        if (onExcessPropertyError) {
          const coveredKeys = indexKeys ? new Set(expectedKeys) : expectedKeys;
          if (indexKeys) {
            for (const keys of indexKeys) {
              for (const key of keys)
                coveredKeys.add(key);
            }
          }
          const inputKeys = Reflect.ownKeys(record);
          for (let i = 0;i < inputKeys.length; i++) {
            const key = inputKeys[i];
            if (!coveredKeys.has(key) && Object.prototype.propertyIsEnumerable.call(record, key)) {
              const unexpected = new UnexpectedKey(ast, record[key], options);
              const issue = new Pointer([key], unexpected);
              if (errorsAllOption) {
                if (state.issues) {
                  state.issues.push(issue);
                } else {
                  state.issues = [issue];
                }
                continue;
              } else {
                return yield* fail5(new Composite(ast, [issue], input, options));
              }
            }
          }
        }
        if (hasProperties) {
          const eff = concurrency === 1 ? parseProperties(state, properties) : parsePropertiesConcurrent(state, properties, {
            concurrency
          });
          if (eff)
            yield* eff;
        }
        if (indexCount && concurrency === 1) {
          for (let i = 0;i < indexCount; i++) {
            const index = indexes[i];
            const parse = index.is.parameter === string2 ? parseStringIndex : parseIndex;
            const keys = indexKeys?.[i] ?? (index.is.parameter === string2 ? Object.keys(record) : getIndexSignatureKeys(record, index.is.parameter, options));
            for (let j = 0;j < keys.length; j++) {
              const eff = parse(state, keys[j], index);
              if (!effectIsExit(eff))
                yield* eff;
              else if (eff._tag === "Failure")
                return yield* eff;
            }
          }
        } else if (parseIndexes) {
          const keyPairs = empty2();
          for (let i = 0;i < indexCount; i++) {
            const index = indexes[i];
            const keys = indexKeys?.[i] ?? (index.is.parameter === string2 ? Object.keys(record) : getIndexSignatureKeys(record, index.is.parameter, options));
            for (let j = 0;j < keys.length; j++) {
              keyPairs.push([keys[j], index]);
            }
          }
          const eff = parseIndexes(state, keyPairs, {
            concurrency
          });
          if (eff)
            yield* eff;
        }
        if (state.issues) {
          return yield* fail5(new Composite(ast, state.issues, input, options));
        }
        return out;
      });
    };
    if (indexCount)
      return makeFallback();
    let fallback;
    const resume = (snapshot, index, pending) => {
      const property = properties[index];
      return flatMap2(exit2(pending), (exit) => {
        const state = {
          ...snapshot,
          out: {
            ...snapshot.out
          }
        };
        const terminal = stepProperty(state, property, exit);
        if (terminal)
          return terminal;
        const done = () => succeed6(state.out);
        const eff = parseProperties(state, properties.slice(index + 1));
        return eff ? flatMapEager2(eff, done) : done();
      });
    };
    return (input, options) => {
      if (input === missing)
        return missingExit;
      if (options.errors === "all" || options.onExcessProperty !== undefined || options.concurrency !== undefined && resolveConcurrency(options.concurrency) !== 1) {
        return (fallback ??= makeFallback())(input, options);
      }
      if (!(typeof input === "object" && input !== null && !Array.isArray(input))) {
        return fail5(new InvalidType(ast, input, options));
      }
      const props = compileMembers();
      const record = input;
      const out = {};
      const state = {
        ast,
        input: record,
        out,
        issues: undefined,
        options
      };
      try {
        for (let index = 0;index < props.length; index++) {
          const property = props[index];
          const name = property.name;
          const hasKey = hasPropertySignature(record, name);
          const value = hasKey ? record[name] : missing;
          const exit = property.parser(value, options);
          if (!effectIsExit(exit)) {
            return resume(state, index, exit);
          }
          if (exit === sameExit) {
            if (hasKey)
              assignProperty(out, name, value);
            continue;
          }
          const terminal = stepProperty(state, property, exit);
          if (terminal)
            return terminal;
        }
      } catch (error) {
        return die3(error);
      }
      return succeed6(out);
    };
  }
  _rebuild(recur, recurParameter, checks, encodingChecks) {
    const props = mapOrSame(this.propertySignatures, (ps) => {
      const t = recur(ps.type);
      return t === ps.type ? ps : new PropertySignature(ps.name, t);
    });
    const indexes = mapOrSame(this.indexSignatures, (is) => {
      const p = recurParameter(is.parameter);
      const t = recur(is.type);
      return p === is.parameter && t === is.type ? is : new IndexSignature(p, t);
    });
    return props === this.propertySignatures && indexes === this.indexSignatures && checks === this.checks && encodingChecks === this.encodingChecks ? this : new Objects(props, indexes, this.annotations, checks, undefined, this.context, encodingChecks);
  }
  flip(recur) {
    return this._rebuild(recur, recur, this.encodingChecks, this.checks);
  }
  recur(recur, recurParameter = recur) {
    return this._rebuild(recur, recurParameter, this.checks, this.encodingChecks);
  }
  getExpected() {
    if (this.propertySignatures.length === 0 && this.indexSignatures.length === 0)
      return "object | array";
    return "object";
  }
};
function stepProperty(s, p, exit) {
  if (exit._tag === "Failure") {
    return wrapPropertyKeyIssue(s, s.ast, p.name, exit);
  }
  if (exit === sameExit)
    return;
  const value = exit[args];
  if (value !== missing) {
    assignProperty(s.out, p.name, value);
    return;
  }
  delete s.out[p.name];
  if (!isOptional(p.type)) {
    const issue = new Pointer([p.name], new MissingKey(p.type.context?.annotations));
    if (s.options.errors === "all") {
      if (s.issues)
        s.issues.push(issue);
      else
        s.issues = [issue];
      return;
    } else {
      return fail4(new Composite(s.ast, [issue], s.input, s.options));
    }
  }
}
var parsePropertiesOptions = {
  onItem(s, p) {
    if (!hasPropertySignature(s.input, p.name)) {
      return p.parser(missing, s.options);
    }
    const value = s.input[p.name];
    assignProperty(s.out, p.name, value);
    return p.parser(value, s.options);
  },
  step: stepProperty
};
var parseProperties = /* @__PURE__ */ iterateEager()(parsePropertiesOptions);
var parsePropertiesConcurrent = /* @__PURE__ */ iterateConcurrent()(parsePropertiesOptions);
function combineChecks(a, b) {
  if (!a)
    return b;
  if (!b)
    return a;
  return [...a, ...b];
}
function struct(fields, checks, annotations) {
  return new Objects(Reflect.ownKeys(fields).map((key) => {
    return new PropertySignature(key, fields[key].ast);
  }), [], annotations, checks);
}
function getAST(self) {
  return self.ast;
}
function union(members, options, checks) {
  return new Union(members.map(getAST), options, undefined, checks);
}
function structWithRest(ast, records) {
  if (ast.encoding || records.some((r) => r.encoding)) {
    throw new Error("StructWithRest does not support encodings");
  }
  let propertySignatures = ast.propertySignatures;
  let indexSignatures = ast.indexSignatures;
  let checks = ast.checks;
  for (const record of records) {
    for (const propertySignature of record.propertySignatures) {
      if (propertySignatures.some((ps) => ps.name === propertySignature.name)) {
        throw new Error(`Duplicate identifier: ${JSON.stringify(propertySignature.name)}. ts(2300)`);
      }
    }
    propertySignatures = propertySignatures.concat(record.propertySignatures);
    indexSignatures = indexSignatures.concat(record.indexSignatures);
    checks = combineChecks(checks, record.checks);
  }
  return new Objects(propertySignatures, indexSignatures, undefined, checks);
}
var toCandidate = /* @__PURE__ */ memoizeIdempotent((ast) => {
  while (true) {
    if (isSuspend(ast))
      return unknown;
    const encoding = ast.encoding;
    if (!encoding) {
      return ast.recur?.(toCandidate, identity) ?? ast;
    }
    if (encoding.some((link) => link.transformation._tag === "Middleware" && link.transformation.decode !== identity))
      return unknown;
    ast = encoding[encoding.length - 1].to;
  }
});
function getCandidateTypes(ast) {
  switch (ast._tag) {
    case "Null":
      return ["null"];
    case "Undefined":
      return ["undefined"];
    case "String":
    case "TemplateLiteral":
      return ["string"];
    case "Number":
      return ["number"];
    case "Boolean":
      return ["boolean"];
    case "Symbol":
    case "UniqueSymbol":
      return ["symbol"];
    case "BigInt":
      return ["bigint"];
    case "Arrays":
      return ["array"];
    case "ObjectKeyword":
      return ["object", "array", "function"];
    case "Objects":
      return ast.propertySignatures.length || ast.indexSignatures.length ? ["object"] : ["string", "number", "boolean", "symbol", "bigint", "object", "array", "function"];
    case "Enum":
      return Array.from(new Set(ast.enums.map(([, v]) => typeof v)));
    case "Literal":
      return [typeof ast.literal];
    case "Union":
      return Array.from(new Set(ast.types.flatMap(getCandidateTypes)));
    default:
      return ["null", "undefined", "string", "number", "boolean", "symbol", "bigint", "object", "array", "function"];
  }
}
function collectSentinels(ast) {
  switch (ast._tag) {
    default:
      return [];
    case "Declaration": {
      const s = ast.annotations?.[SENTINELS_ANNOTATION_KEY];
      return Array.isArray(s) ? s : [];
    }
    case "Objects":
      return ast.propertySignatures.flatMap((ps) => {
        const type = ps.type;
        if (!isOptional(type)) {
          if (isLiteral(type)) {
            return [{
              key: ps.name,
              literal: type.literal
            }];
          }
          if (isUniqueSymbol(type)) {
            return [{
              key: ps.name,
              literal: type.symbol
            }];
          }
        }
        return [];
      });
    case "Arrays":
      return ast.elements.flatMap((e, i) => {
        if (!isOptional(e)) {
          if (isLiteral(e)) {
            return [{
              key: i,
              literal: e.literal
            }];
          }
          if (isUniqueSymbol(e)) {
            return [{
              key: i,
              literal: e.symbol
            }];
          }
        }
        return [];
      });
    case "Union": {
      if (ast.types.length === 0)
        return [];
      const members = ast.types.map((type) => collectSentinels(toCandidate(type)));
      return members[0].filter((s) => members.every((sentinels) => sentinels.some((o) => o.key === s.key && o.literal === s.literal)));
    }
    case "Suspend":
      return collectSentinels(ast.thunk());
  }
}
var candidateIndexCache = /* @__PURE__ */ new WeakMap;
var emptyCandidates = /* @__PURE__ */ Object.freeze([]);
var getRuntimeType = (input) => input === null ? "null" : Array.isArray(input) ? "array" : typeof input;
var hasPropertySignature = (input, key) => key === "__proto__" ? Object.hasOwn(input, key) : (key in input);
function getCandidateIndex(types) {
  let index = candidateIndexCache.get(types);
  if (index)
    return index;
  let bySentinel;
  let sentinelCandidateCount = 0;
  let otherwise;
  let literalCandidates;
  let onlyLiterals = true;
  const literalOf = [];
  for (let i = 0;i < types.length; i++) {
    const a = types[i];
    const encoded = toCandidate(a);
    if (isNever2(encoded))
      continue;
    if (isLiteral(encoded) || isUniqueSymbol(encoded)) {
      literalCandidates ??= new Map;
      const literal = isLiteral(encoded) ? encoded.literal : encoded.symbol;
      literalOf[i] = literal;
      let arr = literalCandidates.get(literal);
      if (!arr)
        literalCandidates.set(literal, arr = []);
      arr.push(i);
    } else {
      onlyLiterals = false;
    }
    const sentinels = collectSentinels(encoded);
    if (sentinels.length) {
      bySentinel ??= new Map;
      sentinelCandidateCount++;
      for (const {
        key,
        literal
      } of sentinels) {
        let entry = bySentinel.get(key);
        if (!entry)
          bySentinel.set(key, entry = [new Map, new Set]);
        entry[1].add(i);
        let indexes = entry[0].get(literal);
        if (!indexes)
          entry[0].set(literal, indexes = new Set);
        indexes.add(i);
      }
    } else {
      otherwise ??= {};
      const candidateTypes = getCandidateTypes(encoded);
      for (const t of candidateTypes)
        (otherwise[t] ??= []).push(i);
    }
  }
  const fallbacks = {};
  const getFallback = (type) => fallbacks[type] ??= Object.freeze(otherwise?.[type] ?? emptyCandidates);
  if (onlyLiterals && literalCandidates) {
    literalCandidates.forEach(Object.freeze);
    index = (input) => literalCandidates.get(input) ?? emptyCandidates;
  } else if (bySentinel?.size === 1 && !otherwise) {
    const [key, [byValue]] = bySentinel.entries().next().value;
    const candidates = new Map;
    for (const [literal, indexes] of byValue) {
      candidates.set(literal, Object.freeze(Array.from(indexes)));
    }
    const all = Object.freeze(types.map((_, i) => i));
    index = (input, isConstructor) => {
      if (isObjectKeyword(input)) {
        const value = hasPropertySignature(input, key) ? input[key] : undefined;
        if (value !== undefined)
          return candidates.get(value) ?? emptyCandidates;
        if (isConstructor)
          return all;
      }
      return emptyCandidates;
    };
  } else if (bySentinel) {
    let commonSentinel;
    for (const entry of bySentinel) {
      if ((!commonSentinel || entry[1][0].size > commonSentinel[1][0].size) && entry[1][1].size === sentinelCandidateCount) {
        commonSentinel = entry;
      }
    }
    index = (input, isConstructor) => {
      const runtimeType = getRuntimeType(input);
      if (!isObjectKeyword(input))
        return getFallback(runtimeType);
      const selected = new Set(otherwise?.[runtimeType]);
      let directKey;
      if (commonSentinel) {
        const [key, [byValue]] = commonSentinel;
        const hasKey = hasPropertySignature(input, key);
        const value = hasKey ? input[key] : undefined;
        if (hasKey && (!isConstructor || value !== undefined)) {
          const match = byValue.get(value);
          if (!match)
            return getFallback(runtimeType);
          for (const i of match)
            selected.add(i);
          directKey = key;
        }
      }
      if (directKey === undefined) {
        for (const [key, [byValue, all]] of bySentinel) {
          const hasKey = hasPropertySignature(input, key);
          const value = hasKey ? input[key] : undefined;
          if (hasKey && (!isConstructor || value !== undefined)) {
            const match = byValue.get(value);
            if (match) {
              for (const i of match)
                selected.add(i);
            }
          } else if (isConstructor) {
            for (const i of all)
              selected.add(i);
          }
        }
      }
      for (const [key, [byValue, all]] of bySentinel) {
        if (key === directKey)
          continue;
        const hasKey = hasPropertySignature(input, key);
        const value = hasKey ? input[key] : undefined;
        if (hasKey && (!isConstructor || value !== undefined)) {
          const match = byValue.get(value);
          for (const i of selected) {
            if (all.has(i) && !match?.has(i))
              selected.delete(i);
          }
        }
      }
      return Array.from(selected).sort((a, b) => a - b);
    };
  } else {
    index = (input) => {
      const fallback = getFallback(getRuntimeType(input));
      return literalCandidates ? fallback.filter((i) => literalOf[i] === undefined || literalOf[i] === input) : fallback;
    };
  }
  candidateIndexCache.set(types, index);
  return index;
}
var Union = class extends ASTNodeImpl {
  _tag = "Union";
  types;
  options;
  encodingChecks;
  constructor(types, options, annotations, checks, encoding, context, encodingChecks) {
    super(annotations, checks, encoding, context);
    this.types = types;
    this.options = options;
    this.encodingChecks = encodingChecks;
  }
  getParser(compile, compileField) {
    const ast = this;
    const isConstructor = compileField !== undefined;
    const parsers = [];
    const parser = (i) => parsers[i] ??= compile(ast.types[i]);
    let index;
    return (input, options) => {
      if (input === missing) {
        return missingExit;
      }
      const candidates = (index ??= getCandidateIndex(ast.types))(input, isConstructor);
      if (candidates.length === 0) {
        return fail5(new AnyOf(ast, [], input, options));
      }
      if (candidates.length === 1) {
        const result = parser(candidates[0])(input, options);
        if (result._tag === "Success")
          return result;
        return effectIsExit(result) ? failSingleUnionCandidate(ast, result.cause, input, options) : catchSingleUnionCandidate(ast, result, input, options);
      }
      return parseUnionCandidates(ast, parser, candidates, input, options);
    };
  }
  _rebuild(recur, checks, encodingChecks) {
    const types = mapOrSame(this.types, recur);
    return types === this.types && checks === this.checks && encodingChecks === this.encodingChecks ? this : new Union(types, this.options, this.annotations, checks, undefined, this.context, encodingChecks);
  }
  recur(recur) {
    return this._rebuild(recur, this.checks, this.encodingChecks);
  }
  flip(recur) {
    return this._rebuild(recur, this.encodingChecks, this.checks);
  }
  matchPart(s, options) {
    for (const type of this.types) {
      const out = type.matchPart(s, options);
      if (out !== undefined)
        return out;
    }
    return;
  }
  getExpected(getExpected) {
    const expected = this.annotations?.expected;
    if (typeof expected === "string")
      return expected;
    if (this.types.length === 0)
      return "never";
    const types = this.types.map((type) => {
      const encoded = toEncoded(type);
      switch (encoded._tag) {
        case "Arrays": {
          const literals = encoded.elements.filter(isLiteral);
          if (literals.length > 0) {
            return `${formatIsMutable(encoded.isMutable)}[ ${literals.map((e) => getExpected(e) + formatIsOptional(e.context?.isOptional)).join(", ")}, ... ]`;
          }
          break;
        }
        case "Objects": {
          const literals = encoded.propertySignatures.filter((ps) => isLiteral(ps.type));
          if (literals.length > 0) {
            return `{ ${literals.map((ps) => `${formatIsMutable(ps.type.context?.isMutable)}${formatPropertyKey(ps.name)}${formatIsOptional(ps.type.context?.isOptional)}: ${getExpected(ps.type)}`).join(", ")}, ... }`;
          }
          break;
        }
      }
      return getExpected(encoded);
    });
    return Array.from(new Set(types)).join(" | ");
  }
};
function failSingleUnionCandidate(ast, cause, input, options) {
  const issue = getSchemaIssue(cause);
  if (!issue)
    return failCause2(cause);
  return fail4(new AnyOf(ast, [issue], input, options));
}
function catchSingleUnionCandidate(ast, result, input, options) {
  return catchCause2(result, (cause) => failSingleUnionCandidate(ast, cause, input, options));
}
function parseUnionCandidates(ast, parser, candidates, input, options) {
  const state = {
    ast,
    parser,
    input,
    out: undefined,
    successes: ast.options?.mode === "oneOf" ? [] : undefined,
    issues: undefined,
    options
  };
  const eff = parseUnion(state, candidates);
  if (!eff) {
    if (state.out)
      return state.out;
    return fail5(new AnyOf(ast, state.issues ?? [], input, options));
  }
  if (effectIsExit(eff))
    return resumeUnion(eff, state);
  let first = true;
  return suspend2(() => {
    if (!first)
      return parseUnionCandidates(ast, parser, candidates, input, options);
    first = false;
    return resumeUnion(eff, state);
  });
}
function resumeUnion(eff, state) {
  return flatMapEager2(eff, (_) => {
    if (state.out === sameExit)
      return succeed5(state.input);
    if (state.out)
      return state.out;
    return fail5(new AnyOf(state.ast, state.issues ?? [], state.input, state.options));
  });
}
var parseUnion = /* @__PURE__ */ iterateEager()({
  onItem(s, i) {
    return s.parser(i)(s.input, s.options);
  },
  step(s, i, exit) {
    if (exit._tag === "Failure") {
      const issue = getSchemaIssue(exit.cause);
      if (issue === undefined) {
        return exit;
      }
      if (s.issues)
        s.issues.push(issue);
      else
        s.issues = [issue];
    } else {
      if (s.out && s.successes) {
        s.successes.push(s.ast.types[i]);
        return fail4(new OneOf(s.ast, s.successes, s.input, s.options));
      }
      s.out = exit;
      if (s.successes) {
        s.successes.push(s.ast.types[i]);
      } else {
        return void_2;
      }
    }
  }
});
var nonFiniteLiterals = /* @__PURE__ */ new Union([/* @__PURE__ */ new Literal("Infinity"), /* @__PURE__ */ new Literal("-Infinity"), /* @__PURE__ */ new Literal("NaN")]);
function formatIsMutable(isMutable) {
  return isMutable ? "" : "readonly ";
}
function formatIsOptional(isOptional) {
  return isOptional ? "?" : "";
}
var Suspend = class extends ASTNodeImpl {
  _tag = "Suspend";
  thunk;
  constructor(thunk, annotations, checks, encoding, context) {
    if (checks) {
      throw new Error("Cannot add checks to Suspend");
    }
    super(annotations, undefined, encoding, context);
    let ast;
    this.thunk = () => ast ??= thunk();
  }
  getParser(compile) {
    let parser;
    return (input, options) => (parser ??= compile(this.thunk()))(input, options);
  }
  recur(recur) {
    return new Suspend(() => recur(this.thunk()), this.annotations, undefined, undefined, this.context);
  }
  getExpected(getExpected) {
    return getExpected(this.thunk());
  }
};
var Filter2 = class extends Class {
  _tag = "Filter";
  run;
  annotations;
  aborted;
  constructor(run, annotations = undefined, aborted = false) {
    super();
    this.run = run;
    this.annotations = annotations;
    this.aborted = aborted;
  }
  annotate(annotations) {
    return new Filter2(this.run, {
      ...this.annotations,
      ...annotations
    }, this.aborted);
  }
  abort() {
    return new Filter2(this.run, this.annotations, true);
  }
  and(other, annotations) {
    return new FilterGroup([this, other], annotations);
  }
};
var FilterGroup = class extends Class {
  _tag = "FilterGroup";
  checks;
  annotations;
  constructor(checks, annotations = undefined) {
    super();
    this.checks = checks;
    this.annotations = annotations;
  }
  annotate(annotations) {
    return new FilterGroup(this.checks, {
      ...this.annotations,
      ...annotations
    });
  }
  and(other, annotations) {
    return new FilterGroup([this, other], annotations);
  }
};
function makeFilter(filter, annotations, aborted = false) {
  return new Filter2((input, ast, options) => normalizeFilterOutput(ast, filter(input, ast, options), input, options), annotations, aborted);
}
function isFinite(annotations) {
  return makeFilter((n) => globalThis.Number.isFinite(n), {
    expected: "a finite number",
    representation: {
      id: "effect/schema/isFinite",
      payload: null
    },
    toJsonSchema: () => ({
      type: "number"
    }),
    toCode: () => ({
      runtime: "Schema.isFinite()"
    }),
    arbitraryConstraint: {
      number: "finite"
    },
    ...annotations
  });
}
var finite = /* @__PURE__ */ appendChecks(number2, [/* @__PURE__ */ isFinite()]);
var numberToJson = /* @__PURE__ */ new Link(/* @__PURE__ */ new Union([finite, nonFiniteLiterals]), /* @__PURE__ */ new Transformation(/* @__PURE__ */ Number3(), /* @__PURE__ */ transform((n) => globalThis.Number.isFinite(n) ? n : globalThis.String(n))));
function isPattern(regExp, annotations) {
  const copy = new globalThis.RegExp(regExp);
  const payload = {
    source: copy.source,
    flags: copy.flags
  };
  return makeFilter((s) => {
    copy.lastIndex = 0;
    return copy.test(s);
  }, {
    expected: `a string matching the RegExp ${payload.source}`,
    representation: {
      id: "effect/schema/isPattern",
      payload
    },
    toJsonSchema: () => [{}, true],
    arbitraryConstraint: {
      patterns: [payload]
    },
    ...annotations
  });
}
var bodyOwners = /* @__PURE__ */ new WeakMap;
function copy(ast, changes) {
  const out = Object.assign(Object.create(Object.getPrototypeOf(ast)), ast, changes);
  if (Reflect.ownKeys(changes).every((key) => key === "context" || key === "encoding")) {
    bodyOwners.set(out, getContextOwner(ast));
  }
  return out;
}
function getContextOwner(ast) {
  const existing = bodyOwners.get(ast);
  if (existing !== undefined)
    return existing;
  if (ast.encoding === undefined)
    return ast;
  const owner = Object.assign(Object.create(Object.getPrototypeOf(ast)), ast, {
    encoding: undefined
  });
  bodyOwners.set(ast, owner);
  return owner;
}
function replaceEncoding(ast, encoding) {
  return ast.encoding === encoding ? ast : copy(ast, {
    encoding
  });
}
function replaceContext(ast, context) {
  if (ast.context === context) {
    return ast;
  }
  const owner = getContextOwner(ast);
  if (owner.context === context && owner.encoding === ast.encoding) {
    return owner;
  }
  return copy(ast, {
    context
  });
}
function getLastEncoding(ast) {
  return ast.encoding ? getLastEncoding(ast.encoding[ast.encoding.length - 1].to) : ast;
}
function annotate(ast, annotations) {
  if (ast.checks) {
    const last = ast.checks[ast.checks.length - 1];
    return replaceChecks(ast, append(ast.checks.slice(0, -1), last.annotate(annotations)));
  }
  return copy(ast, {
    annotations: {
      ...ast.annotations,
      ...annotations
    }
  });
}
function replaceChecks(ast, checks) {
  if (ast._tag === "Suspend" && checks) {
    throw new Error("Cannot add checks to Suspend");
  }
  if (ast.checks === checks) {
    return ast;
  }
  return copy(ast, {
    checks
  });
}
function appendChecks(ast, checks) {
  return replaceChecks(ast, combineChecks(ast.checks, checks));
}
function mapLink(link, f) {
  const to = f(link.to);
  return to === link.to ? link : new Link(to, link.transformation);
}
function updateLastLink(encoding, f) {
  const links = encoding;
  const last = links[links.length - 1];
  const out = mapLink(last, f);
  return out === last ? encoding : append(encoding.slice(0, encoding.length - 1), out);
}
function applyToLastLink(f) {
  return (ast) => ast.encoding ? replaceEncoding(ast, updateLastLink(ast.encoding, f)) : ast;
}
function applyToSelfOrLastLinkEncodingIdempotent(f, options) {
  function out(ast) {
    if (ast.encoding) {
      const last = ast.encoding[ast.encoding.length - 1];
      return options?.stopAt?.(last) ? ast : replaceEncoding(ast, updateLastLink(ast.encoding, out));
    }
    return f(ast);
  }
  return memoizeIdempotent(out);
}
function appendTransformation(from, transformation, to) {
  const link = new Link(from, transformation);
  return replaceEncoding(to, to.encoding ? [...to.encoding, link] : [link]);
}
function mapOrSame(as, f) {
  let out;
  for (let i = 0;i < as.length; i++) {
    const a = as[i];
    const fa = f(a);
    if (out) {
      out[i] = fa;
    } else if (fa !== a) {
      out = new Array(as.length);
      for (let j = 0;j < i; j++) {
        out[j] = as[j];
      }
      out[i] = fa;
    }
  }
  return out ?? as;
}
function annotateKey(ast, annotations) {
  const context = ast.context ? new Context(ast.context.isOptional, ast.context.isMutable, ast.context.constructorDefault, {
    ...ast.context.annotations,
    ...annotations
  }) : new Context(false, false, undefined, annotations);
  return replaceContext(ast, context);
}
var optionalKey = /* @__PURE__ */ memoizeIdempotent((ast) => {
  const context = ast.context ? ast.context.isOptional === false ? new Context(true, ast.context.isMutable, ast.context.constructorDefault, ast.context.annotations) : ast.context : new Context(true, false);
  return optionalKeyLastLink(replaceContext(ast, context));
});
var optionalKeyLastLink = /* @__PURE__ */ applyToLastLink(optionalKey);
var optional = /* @__PURE__ */ memoize((ast) => optionalKey(new Union([ast, undefined_2])));
function withConstructorDefault(ast, defaultValue) {
  const context = ast.context ? new Context(ast.context.isOptional, ast.context.isMutable, defaultValue, ast.context.annotations) : new Context(false, false, defaultValue);
  return replaceContext(ast, context);
}
function decodeTo(from, to, transformation) {
  return appendTransformation(from, transformation, to);
}
function parseParameter(ast) {
  const literals = [];
  const parameters = [];
  function addLiteral(literal) {
    if (!literals.includes(literal)) {
      literals.push(literal);
    }
  }
  function go(ast) {
    switch (ast._tag) {
      case "Literal":
        if (isPropertyKey(ast.literal)) {
          addLiteral(ast.literal);
        }
        return;
      case "UniqueSymbol":
        addLiteral(ast.symbol);
        return;
      case "Enum":
        for (const [, value] of ast.enums) {
          addLiteral(value);
        }
        return;
      case "Never":
        return;
      case "Union":
        for (let i = 0;i < ast.types.length; i++) {
          go(ast.types[i]);
        }
        return;
      default:
        parameters.push(ast);
    }
  }
  go(ast);
  return {
    literals,
    parameters
  };
}
function record(key, value) {
  const {
    literals,
    parameters: indexSignatures
  } = parseParameter(key);
  return new Objects(literals.map((literal) => new PropertySignature(literal, value)), indexSignatures.map((parameter) => new IndexSignature(parameter, value)));
}
function isOptional(ast) {
  return ast.context?.isOptional ?? false;
}
function isStructuralCheck(check) {
  return check.annotations?.[STRUCTURAL_ANNOTATION_KEY] === true || check._tag === "FilterGroup" && check.checks.every(isStructuralCheck);
}
function extractStructuralChecks(checks) {
  function extract(check) {
    if (isStructuralCheck(check))
      return [check];
    return check._tag === "FilterGroup" ? check.checks.flatMap(extract) : [];
  }
  const out = checks.flatMap(extract);
  return isArrayNonEmpty2(out) ? out : undefined;
}
function canPreserveEncodingChecks(ast) {
  let preserve = true;
  function visit(child) {
    preserve = preserve && !child.encoding && !isSuspend(child);
    if (preserve && "recur" in child)
      child.recur(visit);
    return child;
  }
  if ("recur" in ast)
    ast.recur(visit);
  return preserve;
}
var toType = /* @__PURE__ */ memoizeIdempotent((ast) => {
  const owner = getContextOwner(ast);
  if (owner !== ast) {
    const type = toType(owner);
    return type === owner && ast.encoding === undefined ? ast : replaceContext(type, ast.context);
  }
  const type = "recur" in ast ? ast.recur(toType) : ast;
  if ("encodingChecks" in type && type.encodingChecks) {
    const checks = canPreserveEncodingChecks(ast) ? type.encodingChecks : isArrays(type) || isObjects(type) || isDeclaration(type) && type.typeParameters.length > 0 ? extractStructuralChecks(type.encodingChecks) : undefined;
    return copy(type, {
      encodingChecks: undefined,
      checks: combineChecks(type.checks, checks)
    });
  }
  return type;
});
var toEncoded = /* @__PURE__ */ memoizeIdempotent((ast) => {
  return toType(flip2(ast));
});
function flipEncoding(ast, encoding) {
  const links = encoding;
  const len = links.length;
  const last = links[len - 1];
  const ls = [new Link(flip2(replaceEncoding(ast, undefined)), links[0].transformation.flip())];
  for (let i = 1;i < len; i++) {
    ls.unshift(new Link(flip2(links[i - 1].to), links[i].transformation.flip()));
  }
  const to = flip2(last.to);
  if (to.encoding) {
    return replaceEncoding(to, [...to.encoding, ...ls]);
  } else {
    return replaceEncoding(to, ls);
  }
}
var flip2 = /* @__PURE__ */ memoize((ast) => {
  if (ast.encoding) {
    return flipEncoding(ast, ast.encoding);
  }
  const owner = getContextOwner(ast);
  if (owner !== ast) {
    const flipped = flip2(owner);
    return flipped === owner ? ast : replaceContext(flipped, ast.context);
  }
  return "flip" in ast ? ast.flip(flip2) : ("recur" in ast) ? ast.recur(flip2) : ast;
});
function fromConst(ast, value) {
  const succeed = value === 0 ? sameExit : succeed6(value);
  return (input, options) => {
    if (input === missing)
      return missingExit;
    if (input === value)
      return succeed;
    return fail5(new InvalidType(ast, input, options));
  };
}
function fromRefinement(ast, refinement) {
  return (input, options) => {
    if (input === missing)
      return missingExit;
    if (refinement(input))
      return sameExit;
    return fail5(new InvalidType(ast, input, options));
  };
}
function segmentTemplateLiteralParts(ast, input, options) {
  const parts = ast.encodedParts;
  const literals = ast.literals;
  const inputLength = input.length;
  for (let i = 0;i < literals.length; i++) {
    const literal = literals[i];
    if (literal && !input.includes(literal))
      return;
  }
  if (ast.suffixLengths[0] > inputLength)
    return;
  const out = new Array(parts.length);
  let failures;
  function go(i, pos) {
    if (i === parts.length)
      return pos === inputLength;
    if (failures?.has(i * (inputLength + 1) + pos))
      return false;
    const part = parts[i];
    if (i === parts.length - 1) {
      const s = input.slice(pos);
      if (part.matchPart(s, options) !== undefined) {
        out[i] = s;
        return true;
      }
    } else if (part._tag === "Literal") {
      const s = literals[i];
      if (input.startsWith(s, pos) && go(i + 1, pos + s.length)) {
        out[i] = s;
        return true;
      }
    } else {
      const maximumEnd = inputLength - ast.suffixLengths[i + 1];
      const anchor = literals[i + 1];
      let end = anchor === undefined ? maximumEnd : input.lastIndexOf(anchor, maximumEnd);
      while (end >= pos) {
        const s = input.slice(pos, end);
        if (part.matchPart(s, options) !== undefined && go(i + 1, end)) {
          out[i] = s;
          return true;
        }
        if (end === 0)
          break;
        end = anchor === undefined ? end - 1 : input.lastIndexOf(anchor, end - 1);
      }
    }
    failures ??= new Set;
    failures.add(i * (inputLength + 1) + pos);
    return false;
  }
  return go(0, 0) ? out : undefined;
}
var parameterFromPropertyKey = /* @__PURE__ */ applyToSelfOrLastLinkEncodingIdempotent((ast) => {
  switch (ast._tag) {
    default:
      return ast;
    case "Number":
      return ast.toCodecStringTree();
    case "Union":
      return ast.recur(parameterFromPropertyKey);
  }
});
var partFromString = /* @__PURE__ */ applyToSelfOrLastLinkEncodingIdempotent((ast) => {
  switch (ast._tag) {
    default:
      return ast;
    case "Number":
    case "Literal":
    case "BigInt":
      return ast.toCodecStringTree();
    case "Union":
      return ast.recur(partFromString);
  }
});
var isStringFiniteRegExp = /* @__PURE__ */ new globalThis.RegExp(`^${FINITE_PATTERN}$`);
var isStringNumberRegExp = /* @__PURE__ */ new globalThis.RegExp(`^(?:${FINITE_PATTERN}|Infinity|-Infinity|NaN)$`);
function isStringFinite(annotations) {
  return isPattern(isStringFiniteRegExp, {
    expected: "a string representing a finite number",
    representation: {
      id: "effect/schema/isStringFinite",
      payload: null
    },
    toJsonSchema: () => ({
      pattern: isStringFiniteRegExp.source
    }),
    ...annotations
  });
}
var finiteString = /* @__PURE__ */ appendChecks(string2, [/* @__PURE__ */ isStringFinite()]);
var finiteToString = /* @__PURE__ */ new Link(finiteString, numberFromString);
var numberToString = /* @__PURE__ */ new Link(/* @__PURE__ */ new Union([finiteString, nonFiniteLiterals]), numberFromString);
var BIGINT_PATTERN = "-?\\d+";
var isStringBigIntRegExp = /* @__PURE__ */ new globalThis.RegExp(`^${BIGINT_PATTERN}$`);
var REGEXP_PATTERN = "Symbol\\(([\\s\\S]*)\\)";
var isStringSymbolRegExp = /* @__PURE__ */ new globalThis.RegExp(`^${REGEXP_PATTERN}$`);
function collectIssues(checks, value, issues, ast, options) {
  for (let i = 0;i < checks.length; i++) {
    const check = checks[i];
    if (check._tag === "FilterGroup") {
      issues = collectIssues(check.checks, value, issues, ast, options);
      if (issues && (options.errors !== "all" || issues[issues.length - 1].filter.aborted)) {
        return issues;
      }
    } else {
      const issue = check.run(value, ast, options);
      if (issue) {
        const filter = new Filter(check, issue, value, options);
        if (issues)
          issues.push(filter);
        else
          issues = [filter];
        if (options.errors !== "all" || check.aborted) {
          return issues;
        }
      }
    }
  }
  return issues;
}
function getConstructorDescriptor(ast) {
  if (!isDeclaration(ast))
    return;
  const getDescriptor = ast.annotations?.[CONSTRUCTOR_ANNOTATION_KEY];
  return isFunction(getDescriptor) ? getDescriptor(ast.typeParameters) : undefined;
}
function isJsonLeaf(u) {
  return u === null || typeof u === "string" || typeof u === "boolean" || typeof u === "number" && globalThis.Number.isFinite(u);
}
function isStringTreeLeaf(u) {
  return u === undefined || typeof u === "string";
}
function isTree(u, isLeaf) {
  const cache = new WeakMap;
  const stack = [];
  outer:
    while (true) {
      if (typeof u !== "object" || u === null) {
        if (!isLeaf(u)) {
          return false;
        }
      } else {
        const value = u;
        const cached = cache.get(value);
        if (cached === false) {
          return false;
        }
        if (cached === undefined) {
          const isArray = Array.isArray(value);
          if (!isArray) {
            const prototype = Object.getPrototypeOf(value);
            if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
              return false;
            }
          }
          cache.set(value, false);
          stack.push({
            value,
            keys: isArray ? value.length : Object.keys(value),
            index: 0
          });
        }
      }
      while (stack.length > 0) {
        const frame = stack[stack.length - 1];
        const keys = frame.keys;
        if (typeof keys === "number") {
          if (frame.index < keys) {
            u = frame.value[frame.index++];
            continue outer;
          }
        } else if (frame.index < keys.length) {
          u = frame.value[keys[frame.index++]];
          continue outer;
        }
        cache.set(frame.value, true);
        stack.pop();
      }
      return true;
    }
}
function isJson(u) {
  return isTree(u, isJsonLeaf);
}
var Json = /* @__PURE__ */ new Declaration([], () => (input, ast, options) => isJson(input) ? sameExit : fail5(new InvalidType(ast, input, options)), {
  representation: {
    id: "effect/schema/Json",
    payload: null
  },
  expected: "JSON value",
  toCodecJson: () => {
    return;
  },
  toCodecStringTree: () => unknownToStringTree
});
function isStringTree(u) {
  return isTree(u, isStringTreeLeaf);
}
var StringTree = /* @__PURE__ */ new Declaration([], () => (input, ast, options) => isStringTree(input) ? sameExit : fail5(new InvalidType(ast, input, options)), {
  expected: "StringTree",
  toCodecStringTree: () => {
    return;
  }
});
var unknownToStringTree = /* @__PURE__ */ new Link(StringTree, /* @__PURE__ */ passthrough2());

// node_modules/@opencode/schema/node_modules/effect/dist/internal/schema/interpreter.js
var flatMapTransformation = (result, current, f) => result === sameExit ? f(current) : flatMapEager2(result, f);
function compileTransformation(transformation) {
  const apply = compileTransformationUnsafe(transformation);
  return (result, current, options) => {
    try {
      return apply(result, current, options);
    } catch (error) {
      return die3(error);
    }
  };
}
function compileTransformationUnsafe(transformation) {
  if (transformation._tag === "Middleware") {
    return (result, current, options) => {
      const transformed = result === sameExit ? transformation.decode(succeed6(toOption(current)), options) : transformation.decode(mapEager2(result, toOption), options);
      return fromOptionalEffect(transformed);
    };
  }
  const getter = transformation.decode;
  switch (getter._tag) {
    case "Passthrough":
      return (result, current) => result === sameExit ? succeed6(current) : result;
    case "Transform": {
      const transform = (value) => value === missing ? missingExit : succeed6(getter.transform(value));
      return (result, current) => flatMapTransformation(result, current, transform);
    }
    case "TransformOptional": {
      const transform = (value) => fromOptionExit(getter.transform(toOption(value)));
      return (result, current) => flatMapTransformation(result, current, transform);
    }
    case "TransformEffect":
      return (result, current, options) => flatMapTransformation(result, current, (value) => value === missing ? missingExit : getter.transform(value, options));
    case "TransformOptionalEffect":
      return (result, current, options) => flatMapTransformation(result, current, (value) => fromOptionalEffect(getter.transform(toOption(value), options)));
  }
}
var fromOptionalEffect = (effect) => flatMapEager2(effect, fromOptionExit);
var wrapEncoding = (ast, input, options, effect) => catchCause2(effect, (cause) => failCauseSync2(() => map4(cause, (issue) => new Encoding(ast, issue, input, options))));
function makeConstructorParser(descriptor, compile) {
  const transform = compileTransformation(descriptor.link.transformation);
  let sourceParser;
  return (input, options) => {
    if (input === missing)
      return missingExit;
    if (descriptor.isConstructed(input))
      return sameExit;
    const result = (sourceParser ??= compile(descriptor.link.to))(input, options);
    return transform(result, input, options);
  };
}
function withDefault(ast, parser) {
  const defaultValue = ast.context.constructorDefault;
  return (input, options) => {
    if (input !== missing && input !== undefined)
      return parser(input, options);
    const result = defaultValue;
    if (effectIsExit(result) && result._tag === "Success") {
      const local = parser(result[args], options);
      return local === sameExit ? result : local;
    }
    return flatMapEager2(wrapEncoding(ast, input, options, result), (value) => {
      const local = parser(value, options);
      return local === sameExit ? succeed6(value) : local;
    });
  };
}
function compileField(ast, compile) {
  const parser = compile(ast);
  return ast.context?.constructorDefault === undefined ? parser : withDefault(ast, parser);
}
function compile(ast, compile, compileField, base, specialize) {
  if (ast._tag === "Declaration") {
    for (const parameter of ast.typeParameters)
      compile(parameter);
  }
  const descriptor = compileField ? getConstructorDescriptor(ast) : undefined;
  const parser = descriptor ? makeConstructorParser(descriptor, compile) : base ?? ast.getParser(compile, compileField);
  const checks = ast.checks;
  const links = ast.encoding;
  const transformations = links?.map((link) => compileTransformation(link.transformation));
  const encodingChecks = ast.encodingChecks;
  if (!links && !checks && !encodingChecks) {
    return parser;
  }
  let encodingParsers;
  const parseChecks = (input, options) => {
    let result = parser(input, options);
    try {
      if (encodingChecks && !options.disableChecks) {
        if (effectIsExit(result)) {
          if (result._tag === "Success") {
            const output = result === sameExit ? input : result[args];
            if (input !== missing && output !== missing) {
              const issues = collectIssues(encodingChecks, input, undefined, ast, options);
              if (issues) {
                result = fail5(new Composite(ast, issues, input, options));
              }
            }
          }
        } else {
          result = flatMap2(result, (value) => {
            if (input !== missing && value !== missing) {
              const issues = collectIssues(encodingChecks, input, undefined, ast, options);
              if (issues) {
                return fail5(new Composite(ast, issues, input, options));
              }
            }
            return succeed5(value);
          });
        }
      }
      if (checks && !options.disableChecks) {
        if (effectIsExit(result)) {
          if (result._tag === "Success") {
            const value = result === sameExit ? input : result[args];
            if (value === missing)
              return result;
            const issues = collectIssues(checks, value, undefined, ast, options);
            if (issues) {
              result = fail5(new Composite(ast, issues, value, options));
            }
          }
        } else {
          result = flatMap2(result, (value) => {
            if (value !== missing) {
              const issues = collectIssues(checks, value, undefined, ast, options);
              if (issues) {
                return fail5(new Composite(ast, issues, value, options));
              }
            }
            return succeed5(value);
          });
        }
      }
      return result;
    } catch (error) {
      return die3(error);
    }
  };
  const parseLocal = specialize === undefined ? parseChecks : specialize(parseChecks);
  if (!links) {
    return parseLocal;
  }
  return (input, options) => {
    const parsers = encodingParsers ??= links.map((link) => compile(link.to));
    let current = input;
    let result = parsers[parsers.length - 1](input, options);
    for (let i = links.length - 1;i >= 0; i--) {
      result = transformations[i](result, current, options);
      if (i !== 0) {
        const next = parsers[i - 1];
        if (result._tag === "Success") {
          current = result[args];
          result = next(current, options);
        } else {
          result = flatMapEager2(result, (value) => {
            const nextResult = next(value, options);
            return nextResult === sameExit ? succeed6(value) : nextResult;
          });
        }
      }
    }
    if (result._tag === "Success") {
      const value = result[args];
      const local = parseLocal(value, options);
      return local === sameExit ? result : local;
    }
    result = wrapEncoding(ast, input, options, result);
    return flatMapEager2(result, (value) => {
      const local = parseLocal(value, options);
      return local === sameExit ? succeed6(value) : local;
    });
  };
}

// node_modules/@opencode/schema/node_modules/effect/dist/internal/schema/compilerRegistry.js
var invalid = /* @__PURE__ */ Symbol();
var cache = /* @__PURE__ */ new WeakMap;
var compiler;
var compilerAdaptersEnabled = false;
var decodeChild = (ast) => compilerAdaptersEnabled ? lazyParser(resolve2, ast, "parser") : resolve2(ast).parser;
var makeChild = (ast) => compilerAdaptersEnabled ? lazyParser(resolve2, ast, "makeEffect") : resolve2(ast).makeEffect;
var makeField = (ast) => compileField(ast, makeChild);

class InterpretedEntry {
  ast;
  constructor(ast) {
    this.ast = ast;
  }
  get decodeEffect() {
    return this.cachedDecodeEffect ??= compile(this.ast, decodeChild);
  }
  get parser() {
    return this.decodeEffect;
  }
  get makeEffect() {
    return this.cachedMakeEffect ??= compile(this.ast, makeChild, makeField);
  }
}

class CompilerEntry extends InterpretedEntry {
  compiled;
  resolve;
  constructor(ast, compiled, resolve) {
    super(ast);
    this.compiled = compiled;
    this.resolve = resolve;
  }
  save(key, value) {
    Object.defineProperty(this, key, {
      value
    });
    return value;
  }
  operation(key) {
    const compiled = this.compiled;
    return typeof compiled === "function" ? compiled(this.ast, this.resolve, key) : compiled?.[key];
  }
  get is() {
    return this.save("is", this.operation("is"));
  }
  get decode() {
    return this.save("decode", this.operation("decode"));
  }
  get make() {
    return this.save("make", this.operation("make"));
  }
  get compiledMakeEffect() {
    return this.save("compiledMakeEffect", this.operation("makeEffect"));
  }
  get decodeEffect() {
    return this.save("decodeEffect", this.operation("decodeEffect") ?? compile(this.ast, (ast) => lazyParser(this.resolve, ast, "parser")));
  }
  get parser() {
    const decode = this.decode;
    return decode === undefined ? this.decodeEffect : this.save("parser", withDecode(decode, () => this.decodeEffect));
  }
  get makeEffect() {
    const makeEffect = this.compiledMakeEffect;
    if (makeEffect !== undefined)
      return this.save("makeEffect", makeEffect);
    const child = (ast) => lazyParser(this.resolve, ast, "makeEffect");
    return this.save("makeEffect", compile(this.ast, child, (ast) => compileField(ast, child)));
  }
}
function withDecode(fastDecode, decodeEffect) {
  let detailed;
  return (input, options) => {
    if (input !== missing) {
      try {
        const value = fastDecode(input, options);
        if (value !== invalid)
          return value === input ? sameExit : succeed6(value);
      } catch (error) {
        return die3(error);
      }
    }
    return (detailed ??= decodeEffect())(input, options);
  };
}
function lazyParser(resolve, ast, operation) {
  const entry = resolve(ast);
  if (entry.compiled === undefined || Object.hasOwn(entry, operation)) {
    return entry[operation];
  }
  let parser;
  return (input, options) => (parser ??= entry[operation])(input, options);
}
function resolve2(ast) {
  const cached = cache.get(ast);
  if (cached !== undefined)
    return cached;
  const entry = compiler === undefined ? new InterpretedEntry(ast) : new CompilerEntry(ast, compiler(ast, resolve2), resolve2);
  cache.set(ast, entry);
  return entry;
}

// node_modules/@opencode/schema/node_modules/effect/dist/SchemaParser.js
function makeEffect(schema) {
  const ast = schema.ast;
  let parser;
  return (input, options) => {
    return (parser ??= runWithCompiler(constructorCompiler, toType(ast)))(input, options?.disableChecks ? options?.parseOptions ? {
      ...options.parseOptions,
      disableChecks: true
    } : {
      disableChecks: true
    } : options?.parseOptions);
  };
}
function makeOption(schema) {
  const parser = makeEffect(schema);
  return (input, options) => {
    const exit = runSyncExit2(parser(input, options));
    if (isSuccess3(exit)) {
      return some2(exit.value);
    }
    getSchemaIssueOrThrow(exit.cause, "Option adapter can only return none for schema issues");
    return none2();
  };
}
function make6(schema) {
  return makeConstructorSync(toType(schema.ast));
}
function is(schema) {
  return _is(schema.ast);
}
function makeIs(ast) {
  if (!compilerAdaptersEnabled) {
    const parser = asExit(run(ast));
    return (input) => {
      const exit = parser(input, defaultParseOptions);
      if (isSuccess3(exit))
        return true;
      getSchemaIssueOrThrow(exit.cause, "Type guard adapter can only return false for schema issues");
      return false;
    };
  }
  const entry = resolve2(ast);
  const guard = entry.is;
  if (guard !== undefined) {
    return (input) => {
      try {
        return guard(input, defaultParseOptions);
      } catch (error) {
        getSchemaIssueOrThrow(die2(error), "Type guard adapter can only return false for schema issues");
        return false;
      }
    };
  }
  const parser = entry.parser;
  return (input) => {
    const exit = runSyncExit2(parserResult(parser(input, defaultParseOptions), input));
    if (isSuccess3(exit))
      return true;
    getSchemaIssueOrThrow(exit.cause, "Type guard adapter can only return false for schema issues");
    return false;
  };
}
function _is(ast) {
  const typeAST = toType(ast);
  let guard = (input) => {
    guard = makeIs(typeAST);
    return guard(input);
  };
  return (input) => {
    return guard(input);
  };
}
function decodeUnknownEffect(schema, options) {
  const parser = run(schema.ast);
  return options === undefined ? parser : (input, overrideOptions) => parser(input, mergeParseOptions(options, overrideOptions));
}
function encodeUnknownEffect(schema, options) {
  const parser = run(flip2(schema.ast));
  return options === undefined ? parser : (input, overrideOptions) => parser(input, mergeParseOptions(options, overrideOptions));
}
var mergeParseOptions = (options, overrideOptions) => overrideOptions ? {
  ...options,
  ...overrideOptions
} : options;
var getValue = (value) => {
  if (value === missing) {
    return fail5(new InvalidValue);
  }
  return succeed5(value);
};
function run(ast) {
  return runWithCompiler(normalCompiler, ast);
}
function parserResult(result, input) {
  if (result === sameExit) {
    return succeed5(input);
  }
  if (!effectIsExit(result)) {
    return flatMapEager2(result, getValue);
  }
  return result[args] === missing ? getValue(missing) : result;
}
function runWithCompiler(compiler, ast) {
  let parser;
  return (input, options) => {
    const result = (parser ??= compiler(ast))(input, options ?? defaultParseOptions);
    if (result === sameExit) {
      return succeed5(input);
    }
    if (!effectIsExit(result)) {
      return flatMapEager2(result, getValue);
    }
    return result[args] === missing ? getValue(missing) : result;
  };
}
function asExit(parser) {
  return (input, options) => runSyncExit2(parser(input, options));
}
function runSync2(effect, message) {
  const exit = runSyncExit2(effect);
  if (isSuccess3(exit)) {
    return exit.value;
  }
  const issue = getSchemaIssueOrThrow(exit.cause, message);
  throw new Error("Schema validation failed", {
    cause: issue
  });
}
var constructorDefectMessage = "Constructor adapter can only throw schema issues";
function throwConstructorDefect(error) {
  throw new Error(constructorDefectMessage, {
    cause: die2(error)
  });
}
function makeConstructorSync(ast) {
  let entry;
  return (input, options) => constructSync(entry ??= resolve2(ast), input, options);
}
function constructSync(entry, input, options) {
  const parseOptions = options?.disableChecks ? options.parseOptions ? {
    ...options.parseOptions,
    disableChecks: true
  } : {
    disableChecks: true
  } : options?.parseOptions ?? defaultParseOptions;
  const make = entry.make;
  if (make !== undefined && input !== missing) {
    let output;
    try {
      output = make(input, parseOptions);
    } catch (error) {
      throwConstructorDefect(error);
    }
    if (output !== invalid && output !== missing)
      return output;
  }
  return runSync2(parserResult(entry.makeEffect(input, parseOptions), input), constructorDefectMessage);
}
function makeClassSync(ast, input, options, construct) {
  const entry = resolve2(ast);
  const descriptor = getConstructorDescriptor(ast);
  if (descriptor === undefined || entry.make !== undefined || entry.compiledMakeEffect !== undefined) {
    return constructSync(entry, input, options);
  }
  if (descriptor.isConstructed(input))
    return input;
  const fields = constructSync((entry.resolve ?? resolve2)(descriptor.link.to), input, options);
  try {
    return construct(fields);
  } catch (error) {
    throwConstructorDefect(error);
  }
}
var normalCompiler = (ast) => resolve2(ast).parser;
var constructorCompiler = (ast) => resolve2(ast).makeEffect;

// node_modules/@opencode/schema/node_modules/effect/dist/internal/schema/make.js
var TypeId8 = "~effect/Schema/Schema";
var RebuildOptions = /* @__PURE__ */ Symbol();
var SchemaProto = {
  [TypeId8]: TypeId8,
  get make() {
    const value = make6(this);
    Object.defineProperty(this, "make", {
      value,
      enumerable: true
    });
    return value;
  },
  get makeEffect() {
    const value = makeEffect(this);
    Object.defineProperty(this, "makeEffect", {
      value,
      enumerable: true
    });
    return value;
  },
  get makeOption() {
    const value = makeOption(this);
    Object.defineProperty(this, "makeOption", {
      value,
      enumerable: true
    });
    return value;
  },
  pipe() {
    return pipeArguments(this, arguments);
  },
  annotate(annotations) {
    return this.rebuild(annotate(this.ast, annotations));
  },
  annotateKey(annotations) {
    return this.rebuild(annotateKey(this.ast, annotations));
  },
  check(...checks) {
    return this.rebuild(appendChecks(this.ast, checks));
  },
  rebuild(ast) {
    return make7(ast, this[RebuildOptions]);
  }
};
function make7(ast, options) {
  function Schema() {}
  const self = Object.setPrototypeOf(Schema, SchemaProto);
  if (options && (Object.hasOwn(options, "name") || Object.hasOwn(options, "length") || Object.hasOwn(options, "__proto__"))) {
    Object.defineProperties(self, Object.getOwnPropertyDescriptors({
      ...options
    }));
  } else {
    Object.assign(self, options);
  }
  self[RebuildOptions] = options;
  self.ast = ast;
  return self;
}

// node_modules/@opencode/schema/node_modules/effect/dist/RegExp.js
var RegExp2 = globalThis.RegExp;
var escape = (string) => string.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&");

// node_modules/@opencode/schema/node_modules/effect/dist/internal/schema/toEquivalence.js
var toEquivalence = /* @__PURE__ */ memoize((ast) => {
  return recur(ast);
});
function recur(ast) {
  const annotation = resolve(ast)?.["toEquivalence"];
  if (annotation) {
    return annotation(isDeclaration(ast) ? ast.typeParameters.map(recur) : []);
  }
  switch (ast._tag) {
    case "Never":
      return strictEqual();
    case "Declaration":
      return declarationEquivalence(ast);
    case "Null":
    case "Undefined":
    case "Void":
    case "Unknown":
    case "Any":
    case "String":
    case "Number":
    case "Boolean":
    case "BigInt":
    case "Symbol":
    case "Literal":
    case "UniqueSymbol":
    case "ObjectKeyword":
    case "Enum":
    case "TemplateLiteral":
      return equals;
    case "Arrays": {
      const elements = ast.elements.map(recur);
      const rest = ast.rest.map(recur);
      const [head, ...tail] = rest;
      const tailLength = tail.length;
      return make((a, b) => {
        if (!Array.isArray(a) || !Array.isArray(b)) {
          return false;
        }
        const len = a.length;
        if (len !== b.length) {
          return false;
        }
        let i = 0;
        for (;i < Math.min(len, ast.elements.length); i++) {
          if (!elements[i](a[i], b[i])) {
            return false;
          }
        }
        if (rest.length > 0) {
          for (;i < len - tailLength; i++) {
            if (!head(a[i], b[i])) {
              return false;
            }
          }
          for (let j = 0;j < tailLength; j++) {
            if (!tail[j](a[i + j], b[i + j])) {
              return false;
            }
          }
        }
        return true;
      });
    }
    case "Objects": {
      if (ast.propertySignatures.length === 0 && ast.indexSignatures.length === 0) {
        return equals;
      }
      const propertySignatures = ast.propertySignatures.map((ps) => recur(ps.type));
      const indexSignatures = ast.indexSignatures.map((is) => recur(is.type));
      return make((a, b) => {
        if (!isObject(a) || !isObject(b)) {
          return false;
        }
        for (let i = 0;i < propertySignatures.length; i++) {
          const ps = ast.propertySignatures[i];
          const name = ps.name;
          const aHas = Object.hasOwn(a, name);
          const bHas = Object.hasOwn(b, name);
          if (isOptional(ps.type)) {
            if (aHas !== bHas) {
              return false;
            }
          }
          if (aHas && bHas && !propertySignatures[i](a[name], b[name])) {
            return false;
          }
        }
        for (let i = 0;i < indexSignatures.length; i++) {
          const is = ast.indexSignatures[i];
          const aKeys = getIndexSignatureKeys(a, is.parameter);
          const bKeys = getIndexSignatureKeys(b, is.parameter);
          if (aKeys.length !== bKeys.length)
            return false;
          for (let j = 0;j < aKeys.length; j++) {
            const key = aKeys[j];
            if (!Object.hasOwn(b, key) || !indexSignatures[i](a[key], b[key])) {
              return false;
            }
          }
        }
        return true;
      });
    }
    case "Union": {
      const types = toType(ast).types;
      const index = getCandidateIndex(types);
      const compiled = types.map((candidate, i) => [_is(candidate), recur(ast.types[i])]);
      return make((a, b) => {
        const candidates = index(a, false);
        for (let i = 0;i < candidates.length; i++) {
          const [is, equivalence] = compiled[candidates[i]];
          if (is(a) && is(b)) {
            return equivalence(a, b);
          }
        }
        return false;
      });
    }
    case "Suspend": {
      let equivalence;
      return make((a, b) => (equivalence ??= toEquivalence(ast.thunk()))(a, b));
    }
  }
}
function declarationEquivalence(ast) {
  const representation = ast.annotations?.representation;
  if (representation === undefined)
    return equals;
  switch (representation.id) {
    case "effect/schema/Option": {
      const [value] = declarationTypeParameters(ast);
      return (a, b) => a._tag === b._tag && (a._tag === "None" || value(a.value, b.value));
    }
    case "effect/schema/Result": {
      const [success, failure] = declarationTypeParameters(ast);
      return (a, b) => a._tag === b._tag && (a._tag === "Success" ? success(a.success, b.success) : failure(a.failure, b.failure));
    }
    case "effect/schema/CauseReason": {
      const [error, defect] = declarationTypeParameters(ast);
      return causeReasonEquivalence(error, defect);
    }
    case "effect/schema/Cause": {
      const [error, defect] = declarationTypeParameters(ast);
      return causeEquivalence(error, defect);
    }
    case "effect/schema/Exit": {
      const [value, error, defect] = declarationTypeParameters(ast);
      const cause = causeEquivalence(error, defect);
      return (a, b) => a._tag === b._tag && (a._tag === "Success" ? value(a.value, b.value) : cause(a.cause, b.cause));
    }
    case "effect/schema/ReadonlyMap": {
      const [key, value] = declarationTypeParameters(ast);
      return makeCompareMap(key, value);
    }
    case "effect/schema/ReadonlySet":
      return makeCompareSet(declarationTypeParameters(ast)[0]);
    case "effect/schema/RegExp":
      return (a, b) => a.source === b.source && a.flags === b.flags;
    case "effect/schema/URL":
      return (a, b) => a.toString() === b.toString();
    default:
      return equals;
  }
}
function declarationTypeParameters(ast) {
  return ast.typeParameters.map(recur);
}
function causeReasonEquivalence(error, defect) {
  return (a, b) => {
    if (a._tag !== b._tag)
      return false;
    switch (a._tag) {
      case "Fail":
        return error(a.error, b.error);
      case "Die":
        return defect(a.defect, b.defect);
      case "Interrupt":
        return a.fiberId === b.fiberId;
    }
  };
}
function causeEquivalence(error, defect) {
  const reasons = Array_(causeReasonEquivalence(error, defect));
  return (a, b) => reasons(a.reasons, b.reasons);
}

// node_modules/@opencode/schema/node_modules/effect/dist/Struct.js
var pick = /* @__PURE__ */ dual(2, (self, keys) => {
  return buildStruct(self, (k, v) => hasPropertyKey(keys, k) ? [k, v] : undefined);
});
var omit = /* @__PURE__ */ dual(2, (self, keys) => {
  return buildStruct(self, (k, v) => !hasPropertyKey(keys, k) ? [k, v] : undefined);
});
var lambda = (f) => f;
function hasPropertyKey(keys, key) {
  return keys.some((candidate) => candidate === key || typeof candidate === "number" && String(candidate) === key);
}
function buildStruct(source, f) {
  const out = {};
  for (const k of Reflect.ownKeys(source)) {
    if (!Object.prototype.propertyIsEnumerable.call(source, k))
      continue;
    const res = f(k, source[k]);
    if (res) {
      const [nk, nv] = res;
      assignProperty(out, nk, nv);
    }
  }
  return out;
}

// node_modules/@opencode/schema/node_modules/effect/dist/internal/schemaError.js
var SchemaErrorTypeId = "~effect/Schema/SchemaError";
function isSchemaError(u) {
  return hasProperty(u, SchemaErrorTypeId) && u[SchemaErrorTypeId] === SchemaErrorTypeId;
}

// node_modules/@opencode/schema/node_modules/effect/dist/Schema.js
var TypeId9 = TypeId8;
function declareConstructor() {
  return (typeParameters, run, annotations) => {
    return make8(new Declaration(typeParameters.map(getAST), (typeParameters) => run(typeParameters.map((ast) => make8(ast))), annotations));
  };
}
function declare(is, annotations) {
  return declareConstructor()([], () => (input, ast, options) => is(input) ? succeed5(input) : fail5(new InvalidType(ast, input, options)), annotations);
}
function annotate2(annotations) {
  return (self) => self.annotate(annotations);
}
class SchemaError extends (/* @__PURE__ */ TaggedError2("SchemaError")) {
  [SchemaErrorTypeId] = SchemaErrorTypeId;
  constructor(issue) {
    const stackTraceLimit = getStackTraceLimit();
    setStackTraceLimit(0);
    try {
      super({
        issue
      });
    } finally {
      setStackTraceLimit(stackTraceLimit);
    }
  }
  get message() {
    return defaultFormatter(this.issue);
  }
  toJSON() {
    return {
      _tag: this._tag,
      message: this.message
    };
  }
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  toString() {
    return `SchemaError(${this.message})`;
  }
}
function isSchemaError2(u) {
  return isSchemaError(u);
}
function fromIssueEffect(self) {
  if (effectIsExit(self)) {
    return fromIssueExit(self);
  }
  return catchCause2(self, (cause) => failCauseSync2(() => map4(cause, (issue) => new SchemaError(issue))));
}
function fromIssueExit(exit) {
  return isSuccess3(exit) ? exit : failCause2(map4(exit.cause, (issue) => new SchemaError(issue)));
}
function getSchemaErrorOrThrow(cause, message) {
  let schemaError;
  for (const reason of cause.reasons) {
    if (!isFailReason2(reason) || !isSchemaError2(reason.error)) {
      throw new globalThis.Error(message, {
        cause
      });
    }
    schemaError ??= reason.error;
  }
  if (schemaError === undefined) {
    throw new globalThis.Error(message, {
      cause
    });
  }
  return schemaError;
}
function runSchemaErrorSync(self) {
  const exit = runSyncExit2(self);
  if (isSuccess3(exit)) {
    return exit.value;
  }
  throw getSchemaErrorOrThrow(exit.cause, "Sync adapter can only throw schema errors");
}
function decodeUnknownEffect2(schema, options) {
  const parser = decodeUnknownEffect(schema, options);
  return (input, options) => {
    return fromIssueEffect(parser(input, options));
  };
}
function encodeUnknownEffect2(schema, options) {
  const parser = encodeUnknownEffect(schema, options);
  return (input, options) => {
    return fromIssueEffect(parser(input, options));
  };
}
function encodeUnknownSync(schema, options) {
  const parser = encodeUnknownEffect2(schema, options);
  return (input, options) => {
    return runSchemaErrorSync(parser(input, options));
  };
}
var encodeSync = encodeUnknownSync;
var make8 = make7;
function isSchema(u) {
  return hasProperty(u, TypeId9) && u[TypeId9] === TypeId9;
}
var optionalKey2 = /* @__PURE__ */ lambda((schema) => make8(optionalKey(schema.ast), {
  schema
}));
var optional2 = /* @__PURE__ */ lambda((self) => {
  const schema = UndefinedOr(self);
  return make8(optional(self.ast), {
    schema
  });
});
var toType2 = /* @__PURE__ */ lambda((schema) => make8(toType(schema.ast), {
  schema
}));
var toEncoded2 = /* @__PURE__ */ lambda((schema) => make8(toEncoded(schema.ast), {
  schema
}));
function Literal2(literal) {
  const out = make8(new Literal(literal), {
    literal,
    transform(to) {
      return out.pipe(decodeTo2(Literal2(to), {
        decode: transform(() => to),
        encode: transform(() => literal)
      }));
    }
  });
  return out;
}
function templateLiteralParts(parts) {
  return parts.map((part) => isSchema(part) ? part.ast : new Literal(part));
}
function TemplateLiteral2(parts) {
  return make8(new TemplateLiteral(templateLiteralParts(parts)), {
    parts
  });
}
var Any2 = /* @__PURE__ */ make8(any);
var Unknown2 = /* @__PURE__ */ make8(unknown);
var Null2 = /* @__PURE__ */ make8(null_);
var Undefined2 = /* @__PURE__ */ make8(undefined_2);
var String5 = /* @__PURE__ */ make8(string2);
var Number5 = /* @__PURE__ */ make8(number2);
var Boolean3 = /* @__PURE__ */ make8(boolean);
function makeStruct(ast, fields) {
  return make8(ast, {
    fields,
    mapFields(f, options) {
      const fields = f(this.fields);
      return makeStruct(struct(fields, options?.unsafePreserveChecks ? this.ast.checks : undefined), fields);
    }
  });
}
function Struct(fields) {
  return makeStruct(struct(fields, undefined), fields);
}
function Record(key, value) {
  return make8(record(key.ast, value.ast), {
    key,
    value
  });
}
function StructWithRest(schema, records) {
  return make8(structWithRest(schema.ast, records.map(getAST)), {
    schema,
    records
  });
}
var ArraySchema = /* @__PURE__ */ lambda((schema) => make8(new Arrays(false, [], [schema.ast]), {
  value: schema
}));
var NonEmptyArray = /* @__PURE__ */ lambda((schema) => make8(new Arrays(false, [schema.ast], [schema.ast]), {
  value: schema
}));
function makeUnion(ast, members) {
  return make8(ast, {
    members,
    mapMembers(f, options) {
      const members = f(this.members);
      return makeUnion(union(members, this.ast.options, options?.unsafePreserveChecks ? this.ast.checks : undefined), members);
    }
  });
}
function Union2(members, options) {
  return makeUnion(union(members, options, undefined), members);
}
function Literals(literals) {
  const members = literals.map(Literal2);
  return make8(union(members, undefined, undefined), {
    literals,
    members,
    mapMembers(f) {
      return Union2(f(this.members));
    },
    pick(literals) {
      return Literals(literals);
    },
    transform(to) {
      return Union2(members.map((member, index) => member.transform(to[index])));
    }
  });
}
var NullOr = /* @__PURE__ */ lambda((self) => Union2([self, Null2]));
var UndefinedOr = /* @__PURE__ */ lambda((self) => Union2([self, Undefined2]));
function suspend3(f) {
  return make8(new Suspend(() => f().ast));
}
function check(...checks) {
  return (self) => self.check(...checks);
}
function brand(identifier) {
  return (schema) => make8(schema.ast, {
    schema,
    identifier
  });
}
function decodeTo2(to, transformation) {
  return (from) => {
    return make8(decodeTo(from.ast, to.ast, transformation ? makeTransformation(transformation) : passthrough2()), {
      from,
      to
    });
  };
}
function linkDecoding() {
  return (to, decode) => link()(to, {
    decode,
    encode: forbiddenEncoding
  });
}
function encodeTo(to, transformation) {
  return (from) => {
    return transformation ? decodeTo2(from, transformation)(to) : decodeTo2(from)(to);
  };
}
function withConstructorDefault2(defaultValue) {
  return (schema) => make8(withConstructorDefault(schema.ast, defaultValue), {
    schema
  });
}
function tag(literal) {
  return Literal2(literal).pipe(withConstructorDefault2(succeed5(literal)));
}
function TaggedStruct(value, fields) {
  return Struct({
    _tag: tag(value),
    ...fields
  });
}
function toTaggedUnion(tag) {
  return (self) => {
    const cases = {};
    const discriminants = [];
    const discriminantKeys = new Set;
    const guards = {};
    const isAnyOf = (keys) => (value) => keys.includes(value[tag]);
    walk(self);
    return Object.assign(self, {
      tag,
      cases,
      discriminants,
      isAnyOf,
      guards,
      match,
      matchOrElse
    });
    function walk(schema) {
      const ast = schema.ast;
      if (isUnion(ast) && "members" in schema && globalThis.Array.isArray(schema.members) && schema.members.every(isSchema)) {
        return schema.members.forEach(walk);
      }
      const sentinels = collectSentinels(ast);
      if (sentinels.length > 0) {
        const literal = sentinels.find((s) => s.key === tag)?.literal;
        if (isPropertyKey(literal)) {
          const key = typeof literal === "number" ? globalThis.String(literal) : literal;
          if (discriminantKeys.has(key)) {
            throw new globalThis.Error(`Duplicate discriminant: ${globalThis.String(literal)}`);
          }
          discriminantKeys.add(key);
          discriminants.push(literal);
          assignProperty(cases, literal, schema);
          assignProperty(guards, literal, is(toType2(schema)));
          return;
        }
      }
      throw new globalThis.Error("No literal or unique symbol found");
    }
    function match() {
      if (arguments.length === 1) {
        const cases = arguments[0];
        return function(value) {
          const key = value[tag];
          const handler = Object.hasOwn(cases, key) ? cases[key] : undefined;
          return handler(value);
        };
      }
      const value = arguments[0];
      const cases = arguments[1];
      const key = value[tag];
      const handler = Object.hasOwn(cases, key) ? cases[key] : undefined;
      return handler(value);
    }
    function matchOrElse() {
      if (arguments.length === 2) {
        const cases = arguments[0];
        const orElse = arguments[1];
        return function(value) {
          const key = value[tag];
          const handler = Object.hasOwn(cases, key) ? cases[key] ?? orElse : orElse;
          return handler(value);
        };
      }
      const value = arguments[0];
      const cases = arguments[1];
      const orElse = arguments[2];
      const key = value[tag];
      const handler = Object.hasOwn(cases, key) ? cases[key] ?? orElse : orElse;
      return handler(value);
    }
  };
}
function instanceOf(constructor, annotations) {
  return declare((u) => u instanceof constructor, annotations);
}
function link() {
  return (encodeTo, transformation) => {
    return new Link(encodeTo.ast, makeTransformation(transformation));
  };
}
var makeFilter2 = makeFilter;
var TRIMMED_PATTERN = "^\\S[\\s\\S]*\\S$|^\\S$|^$";
function isTrimmed(annotations) {
  const regExp = new globalThis.RegExp(TRIMMED_PATTERN);
  return makeFilter2((s) => s.trim() === s, {
    expected: "a string with no leading or trailing whitespace",
    representation: {
      id: "effect/schema/isTrimmed",
      payload: null
    },
    toJsonSchema: () => ({
      pattern: regExp.source
    }),
    toCode: () => ({
      runtime: "Schema.isTrimmed()"
    }),
    arbitraryConstraint: {
      patterns: [{
        source: TRIMMED_PATTERN,
        flags: ""
      }]
    },
    ...annotations
  });
}
function isPattern2(regExp, annotations) {
  const source = regExp.source;
  const flags = regExp.flags;
  const canExport = /^[dg]*uy?$/.test(flags);
  const runtimeRegExp = flags === "" ? `new globalThis.RegExp(${format(source)})` : `new globalThis.RegExp(${format(source)}, ${format(flags)})`;
  return isPattern(regExp, {
    toJsonSchema: () => canExport ? {
      pattern: flags.endsWith("y") ? `^(?:${source})` : source
    } : [{}, true],
    toCode: () => ({
      runtime: `Schema.isPattern(${runtimeRegExp})`
    }),
    ...annotations
  });
}
function isBase64(annotations) {
  const pattern = "^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$";
  const regExp = /^[0-9a-zA-Z+/]*={0,2}$/;
  return makeFilter2((s) => s.length % 4 === 0 && regExp.test(s), {
    expected: "a base64 encoded string",
    representation: {
      id: "effect/schema/isBase64",
      payload: null
    },
    toJsonSchema: () => ({
      pattern
    }),
    arbitraryConstraint: {
      patterns: [{
        source: pattern,
        flags: ""
      }]
    },
    toCode: () => ({
      runtime: "Schema.isBase64()"
    }),
    ...annotations
  });
}
function literalToJsonSchema(literal, original, pattern) {
  if (literal.length === 0)
    return original.length === 0 ? {} : [{}, true];
  const constraint = {
    pattern: new globalThis.RegExp(pattern).source
  };
  return literal === original ? constraint : [constraint, true];
}
function isStartingWith(startsWith, annotations) {
  const formatted = JSON.stringify(startsWith);
  const regExp = new globalThis.RegExp(`^${escape(startsWith)}`);
  const jsonSchemaLiteral = startsWith.replace(/[\uD800-\uDBFF]$/, "");
  return makeFilter2((s) => s.startsWith(startsWith), {
    expected: `a string starting with ${formatted}`,
    representation: {
      id: "effect/schema/isStartingWith",
      payload: {
        startsWith
      }
    },
    toJsonSchema: () => literalToJsonSchema(jsonSchemaLiteral, startsWith, `^${escape(jsonSchemaLiteral)}`),
    toCode: () => ({
      runtime: `Schema.isStartingWith(${format(startsWith)})`
    }),
    arbitraryConstraint: {
      patterns: [{
        source: regExp.source,
        flags: regExp.flags
      }]
    },
    ...annotations
  });
}
var Finite = /* @__PURE__ */ make8(finite);
function makeIsGreaterThan(options) {
  const gt = isGreaterThan(options.order);
  const formatter = options.formatter ?? format;
  return (exclusiveMinimum, annotations) => {
    return makeFilter2((input) => gt(input, exclusiveMinimum), {
      expected: `a value greater than ${formatter(exclusiveMinimum)}`,
      arbitraryConstraint: {
        order: options.order,
        minimum: exclusiveMinimum,
        exclusiveMinimum: true
      },
      ...options.annotate?.(exclusiveMinimum),
      ...annotations
    });
  };
}
function makeIsGreaterThanOrEqualTo(options) {
  const gte = isGreaterThanOrEqualTo(options.order);
  const formatter = options.formatter ?? format;
  return (minimum, annotations) => {
    return makeFilter2((input) => gte(input, minimum), {
      expected: `a value greater than or equal to ${formatter(minimum)}`,
      arbitraryConstraint: {
        order: options.order,
        minimum
      },
      ...options.annotate?.(minimum),
      ...annotations
    });
  };
}
function makeIsLessThanOrEqualTo(options) {
  const lte = isLessThanOrEqualTo(options.order);
  const formatter = options.formatter ?? format;
  return (maximum, annotations) => {
    return makeFilter2((input) => lte(input, maximum), {
      expected: `a value less than or equal to ${formatter(maximum)}`,
      arbitraryConstraint: {
        order: options.order,
        maximum
      },
      ...options.annotate?.(maximum),
      ...annotations
    });
  };
}
function makeIsBetween(deriveOptions) {
  const greaterThanOrEqualTo = isGreaterThanOrEqualTo(deriveOptions.order);
  const greaterThan = isGreaterThan(deriveOptions.order);
  const lessThanOrEqualTo = isLessThanOrEqualTo(deriveOptions.order);
  const lessThan = isLessThan(deriveOptions.order);
  const formatter = deriveOptions.formatter ?? format;
  return (options, annotations) => {
    const gte = options.exclusiveMinimum ? greaterThan : greaterThanOrEqualTo;
    const lte = options.exclusiveMaximum ? lessThan : lessThanOrEqualTo;
    return makeFilter2((input) => gte(input, options.minimum) && lte(input, options.maximum), {
      expected: `a value between ${formatter(options.minimum)}${options.exclusiveMinimum ? " (excluded)" : ""} and ${formatter(options.maximum)}${options.exclusiveMaximum ? " (excluded)" : ""}`,
      arbitraryConstraint: {
        order: deriveOptions.order,
        minimum: options.minimum,
        maximum: options.maximum,
        ...options.exclusiveMinimum && {
          exclusiveMinimum: true
        },
        ...options.exclusiveMaximum && {
          exclusiveMaximum: true
        }
      },
      ...deriveOptions.annotate?.(options),
      ...annotations
    });
  };
}
function encodeNumberPayload(number) {
  if (!globalThis.Number.isFinite(number)) {
    throw new globalThis.RangeError(`Expected a finite number, got ${format(number)}`);
  }
  return number;
}
var isGreaterThan3 = /* @__PURE__ */ makeIsGreaterThan({
  order: Number2,
  annotate: (exclusiveMinimum) => ({
    representation: {
      id: "effect/schema/isGreaterThan",
      payload: {
        exclusiveMinimum: encodeNumberPayload(exclusiveMinimum)
      }
    },
    toJsonSchema: () => ({
      exclusiveMinimum
    }),
    toCode: () => ({
      runtime: `Schema.isGreaterThan(${format(exclusiveMinimum)})`
    })
  })
});
var isGreaterThanOrEqualTo3 = /* @__PURE__ */ makeIsGreaterThanOrEqualTo({
  order: Number2,
  annotate: (minimum) => ({
    representation: {
      id: "effect/schema/isGreaterThanOrEqualTo",
      payload: {
        minimum: encodeNumberPayload(minimum)
      }
    },
    toJsonSchema: () => ({
      minimum
    }),
    toCode: () => ({
      runtime: `Schema.isGreaterThanOrEqualTo(${format(minimum)})`
    })
  })
});
var isLessThanOrEqualTo3 = /* @__PURE__ */ makeIsLessThanOrEqualTo({
  order: Number2,
  annotate: (maximum) => ({
    representation: {
      id: "effect/schema/isLessThanOrEqualTo",
      payload: {
        maximum: encodeNumberPayload(maximum)
      }
    },
    toJsonSchema: () => ({
      maximum
    }),
    toCode: () => ({
      runtime: `Schema.isLessThanOrEqualTo(${format(maximum)})`
    })
  })
});
var isBetween = /* @__PURE__ */ makeIsBetween({
  order: Number2,
  annotate: (options) => {
    const exclusiveMinimum = options.exclusiveMinimum ? true : undefined;
    const exclusiveMaximum = options.exclusiveMaximum ? true : undefined;
    const payload = {
      minimum: encodeNumberPayload(options.minimum),
      maximum: encodeNumberPayload(options.maximum),
      ...exclusiveMinimum && {
        exclusiveMinimum
      },
      ...exclusiveMaximum && {
        exclusiveMaximum
      }
    };
    return {
      representation: {
        id: "effect/schema/isBetween",
        payload
      },
      toJsonSchema: () => ({
        [exclusiveMinimum ? "exclusiveMinimum" : "minimum"]: options.minimum,
        [exclusiveMaximum ? "exclusiveMaximum" : "maximum"]: options.maximum
      }),
      toCode: () => ({
        runtime: `Schema.isBetween({ minimum: ${format(options.minimum)}, maximum: ${format(options.maximum)}, exclusiveMinimum: ${format(exclusiveMinimum)}, exclusiveMaximum: ${format(exclusiveMaximum)} })`
      })
    };
  }
});
function isInt(annotations) {
  return makeFilter2((n) => globalThis.Number.isSafeInteger(n), {
    expected: "an integer",
    representation: {
      id: "effect/schema/isInt",
      payload: null
    },
    toJsonSchema: () => ({
      type: "integer",
      minimum: globalThis.Number.MIN_SAFE_INTEGER,
      maximum: globalThis.Number.MAX_SAFE_INTEGER
    }),
    toCode: () => ({
      runtime: "Schema.isInt()"
    }),
    arbitraryConstraint: {
      number: "integer"
    },
    ...annotations
  });
}
var Int = /* @__PURE__ */ Number5.check(/* @__PURE__ */ isInt());
function makeIsMinLength(minLength, minCodePoints, annotations) {
  return makeFilter2((input) => input.length >= minLength, {
    expected: `a value with a length of at least ${minLength}`,
    representation: {
      id: "effect/schema/isMinLength",
      payload: {
        minLength
      }
    },
    toJsonSchema: ({
      type
    }) => type === "string" ? minLength <= 1 ? {
      minLength: minCodePoints
    } : [{
      minLength: minCodePoints
    }, true] : type === "array" ? {
      minItems: minLength
    } : type === undefined ? [{
      minLength: minCodePoints,
      minItems: minLength
    }, true] : [{}, true],
    toCode: () => ({
      runtime: `Schema.isMinLength(${minLength})`
    }),
    [STRUCTURAL_ANNOTATION_KEY]: true,
    arbitraryConstraint: {
      minLength
    },
    ...annotations
  });
}
function isNonEmpty(annotations) {
  return makeIsMinLength(1, 1, annotations);
}
var getErrorOptionsKey = (options) => (options?.includeStack === true ? 1 : 0) | (options?.excludeCause === true ? 2 : 0);
var getErrorOptions = (key) => {
  switch (key) {
    case 0:
      return;
    case 1:
      return {
        includeStack: true
      };
    case 2:
      return {
        excludeCause: true
      };
    case 3:
      return {
        includeStack: true,
        excludeCause: true
      };
  }
};
var defectSchemaCache = [];
function Defect(options) {
  const key = getErrorOptionsKey(options);
  const cached = defectSchemaCache[key];
  if (cached !== undefined) {
    return cached;
  }
  const schema = Json2.pipe(decodeTo2(Unknown2, defectFromJson(getErrorOptions(key))));
  defectSchemaCache[key] = schema;
  return schema;
}
var RegExp3 = /* @__PURE__ */ instanceOf(globalThis.RegExp, {
  representation: {
    id: "effect/schema/RegExp",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.RegExp`,
    Type: `globalThis.RegExp`
  }),
  expected: "RegExp",
  toCodecJson: () => link()(Struct({
    source: String5,
    flags: String5
  }), transformEffect2({
    decode: (e, options) => try_2({
      try: () => new globalThis.RegExp(e.source, e.flags),
      catch: () => new InvalidValue({
        expected: "valid RegExp source and flags"
      }, e, options)
    }),
    encode: (regExp) => succeed5({
      source: regExp.source,
      flags: regExp.flags
    })
  }))
});
var URLString = /* @__PURE__ */ String5.annotate({
  expected: "a string that will be decoded as a URL"
});
var URL2 = /* @__PURE__ */ instanceOf(globalThis.URL, {
  representation: {
    id: "effect/schema/URL",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.URL`,
    Type: `globalThis.URL`
  }),
  expected: "URL",
  toCodecJson: () => link()(URLString, urlFromString)
});
var JsonString = /* @__PURE__ */ String5.annotate({
  expected: "a string that will be decoded as JSON"
});
function fromJsonString2(schema, options) {
  return JsonString.pipe(decodeTo2(schema, fromJsonString(options)));
}
var File2 = /* @__PURE__ */ instanceOf(globalThis.File, {
  representation: {
    id: "effect/schema/File",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.File`,
    Type: `globalThis.File`
  }),
  expected: "File",
  toCodecJson: () => link()(Struct({
    data: String5.check(isBase64()),
    type: String5,
    name: String5,
    lastModified: Int
  }), transformEffect2({
    decode: (e, options) => match2(decode(e.data), {
      onFailure: () => fail5(new InvalidValue({
        expected: "a valid Base64 string"
      }, e.data, options)),
      onSuccess: (bytes) => {
        const buffer = new globalThis.Uint8Array(bytes);
        return succeed5(new globalThis.File([buffer], e.name, {
          type: e.type,
          lastModified: e.lastModified
        }));
      }
    }),
    encode: (file, options) => tryPromise2({
      try: async () => {
        const bytes = new globalThis.Uint8Array(await file.arrayBuffer());
        return {
          data: encode(bytes),
          type: file.type,
          name: file.name,
          lastModified: file.lastModified
        };
      },
      catch: () => new InvalidValue({
        expected: "a readable File"
      }, file, options)
    })
  }))
});
var URLSearchParams2 = /* @__PURE__ */ instanceOf(globalThis.URLSearchParams, {
  representation: {
    id: "effect/schema/URLSearchParams",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.URLSearchParams`,
    Type: `globalThis.URLSearchParams`
  }),
  expected: "URLSearchParams",
  toCodecJson: () => link()(String5.annotate({
    expected: "a query string that will be decoded as URLSearchParams"
  }), transform2({
    decode: (e) => new globalThis.URLSearchParams(e),
    encode: (params) => params.toString()
  }))
});
var Trimmed = /* @__PURE__ */ String5.check(/* @__PURE__ */ isTrimmed());
var Trim = /* @__PURE__ */ String5.annotate({
  expected: "a string that will be decoded as a trimmed string"
}).pipe(/* @__PURE__ */ decodeTo2(Trimmed, /* @__PURE__ */ trim3()));
var Base64String = /* @__PURE__ */ String5.annotate({
  expected: "a base64 encoded string that will be decoded as Uint8Array",
  format: "byte",
  contentEncoding: "base64"
});
var Uint8Array2 = /* @__PURE__ */ instanceOf(globalThis.Uint8Array, {
  representation: {
    id: "effect/schema/Uint8Array",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.Uint8Array`,
    Type: `globalThis.Uint8Array`
  }),
  expected: "Uint8Array",
  toCodecJson: () => link()(Base64String, uint8ArrayFromBase64String)
});
var dateTimeUtcFromString = /* @__PURE__ */ transformEffect2({
  decode: (s, options) => {
    return match(make5(s), {
      onNone: () => fail5(new InvalidValue({
        expected: "a valid UTC DateTime string"
      }, s, options)),
      onSome: (result) => succeed5(toUtc2(result))
    });
  },
  encode: (utc) => succeed5(formatIso2(utc))
});
var arbitraryMinimumDateTimestamp = -8640000000000000;
var arbitraryMaximumDateTimestamp = 8640000000000000;
var arbitraryMinimumZonedDateTimeTimestamp = arbitraryMinimumDateTimestamp + 14 * 60 * 60 * 1000;
var arbitraryMaximumZonedDateTimeTimestamp = arbitraryMaximumDateTimestamp - 14 * 60 * 60 * 1000;
var arbitraryMinimumTimeZoneOffset = -12 * 60 * 60 * 1000;
var arbitraryMaximumTimeZoneOffset = 14 * 60 * 60 * 1000;
function dateTimeArbitraryBounds(constraint, domainMinimum, domainMaximum) {
  const minimum = Math.max(domainMinimum, constraint?.minimum === undefined ? domainMinimum : constraint.minimum.epochMilliseconds + (constraint.exclusiveMinimum === true ? 1 : 0));
  const maximum = Math.min(domainMaximum, constraint?.maximum === undefined ? domainMaximum : constraint.maximum.epochMilliseconds - (constraint.exclusiveMaximum === true ? 1 : 0));
  return minimum <= maximum ? [minimum, maximum] : [domainMinimum, domainMaximum];
}
function dateTimeArbitraryInteger(minimum, maximum) {
  return Int.check(isBetween({
    minimum,
    maximum
  }));
}
var DateTimeUtc = /* @__PURE__ */ declare((u) => isDateTime2(u) && isUtc2(u), {
  representation: {
    id: "effect/schema/DateTimeUtc",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.DateTimeUtc`,
    Type: `DateTime.Utc`,
    importDeclarations: [`import * as DateTime from "effect/DateTime"`]
  }),
  expected: "DateTime.Utc",
  toCodecArbitrary: ({
    constraint
  }) => {
    const [minimum, maximum] = dateTimeArbitraryBounds(constraint, arbitraryMinimumDateTimestamp, arbitraryMaximumDateTimestamp);
    return linkDecoding()(dateTimeArbitraryInteger(minimum, maximum), transform(makeUnsafe3));
  },
  toCodecJson: () => link()(String5, dateTimeUtcFromString),
  toFormatter: () => (utc) => utc.toString()
});
var immerable = /* @__PURE__ */ globalThis.Symbol.for("immer-draftable");
var payloadToken = {};
function makeClass(Inherited, identifier, struct2, annotations, proto) {
  const getClassSchema = getClassSchemaFactory(struct2, identifier, annotations);
  const ClassTypeId = getClassTypeId(identifier);
  const out = class extends Inherited {
    constructor(...[input, options]) {
      const internalOptions = options;
      const payload = internalOptions?.["~payload"];
      const value = payload?.token === payloadToken ? payload.value : struct2.make(input ?? {}, options);
      super(value, {
        ...options,
        disableChecks: true,
        "~payload": {
          token: payloadToken,
          value
        }
      });
    }
    static [TypeId9] = TypeId9;
    get [ClassTypeId]() {
      return ClassTypeId;
    }
    static [immerable] = true;
    static identifier = identifier;
    static fields = struct2.fields;
    static get ast() {
      return getClassSchema(this).ast;
    }
    static pipe() {
      return pipeArguments(this, arguments);
    }
    static rebuild(ast) {
      return getClassSchema(this).rebuild(ast);
    }
    static make(input, options) {
      return makeClassSync(toType(getClassSchema(this).ast), input ?? {}, options, (fields) => makeClassTrusted(this, fields));
    }
    static makeOption(input, options) {
      return makeOption(getClassSchema(this))(input ?? {}, options);
    }
    static makeEffect(input, options) {
      return getClassSchema(this).makeEffect(input ?? {}, options);
    }
    static annotate(annotations) {
      return this.rebuild(annotate(this.ast, annotations));
    }
    static annotateKey(annotations) {
      return this.rebuild(annotateKey(this.ast, annotations));
    }
    static check(...checks) {
      return this.rebuild(appendChecks(this.ast, checks));
    }
    static extend(identifier2) {
      return (schema, annotations) => {
        const extension = isStruct(schema) ? schema : Struct(schema);
        const fields = {
          ...struct2.fields,
          ...extension.fields
        };
        const ast = struct(fields, struct2.ast.checks, {
          identifier: identifier2
        });
        return makeClass(this, identifier2, makeStruct(appendChecks(ast, extension.ast.checks), fields), annotations, proto);
      };
    }
    static mapFields(f, options) {
      return struct2.mapFields(f, options);
    }
  };
  if (proto !== undefined) {
    Object.assign(out.prototype, proto(identifier));
  }
  return out;
}
function makeClassTrusted(self, fields) {
  return new self(fields, {
    "~payload": {
      token: payloadToken,
      value: fields
    }
  });
}
function getClassTransformation(self) {
  return new Transformation(transform((input) => makeClassTrusted(self, input)), passthrough());
}
function getClassTypeId(identifier) {
  return `~effect/Schema/Class/${identifier}`;
}
function getClassSchemaFactory(from, identifier, annotations) {
  let memo;
  return (self) => {
    if (memo !== undefined) {
      return memo;
    }
    const ClassTypeId = getClassTypeId(identifier);
    const isClassValue = (input) => input instanceof self || hasProperty(input, ClassTypeId);
    const transformation = getClassTransformation(self);
    const to = make8(new Declaration([from.ast], () => (input, ast, options) => {
      return isClassValue(input) ? succeed5(input) : fail5(new InvalidType(ast, input, options));
    }, {
      identifier,
      [CONSTRUCTOR_ANNOTATION_KEY]: ([from]) => ({
        isConstructed: isClassValue,
        link: new Link(from, transformation)
      }),
      toCodec: ([from]) => new Link(from.ast, transformation),
      toEquivalence: ([from]) => from,
      toFormatter: ([from]) => (t) => `${self.identifier}(${from(t)})`,
      [SENTINELS_ANNOTATION_KEY]: collectSentinels(from.ast),
      ...annotations
    }));
    return memo = decodeTo2(to, transformation)(from);
  };
}
function isStruct(schema) {
  return isSchema(schema);
}
var Class3 = (identifier) => (schema, annotations) => {
  const struct = isStruct(schema) ? schema : Struct(schema);
  return makeClass(Class2, identifier, struct, annotations, (identifier) => ({
    toString() {
      return `${identifier}(${format({
        ...this
      })})`;
    }
  }));
};
var Error3 = (identifier) => (schema, annotations) => {
  const struct = isStruct(schema) ? schema : Struct(schema);
  const self = makeClass(Error2, identifier, struct, annotations, (identifier) => ({
    name: identifier
  }));
  return self;
};
var TaggedError3 = (identifier) => {
  return (tagValue, schema, annotations) => {
    const struct = isStruct(schema) ? schema.mapFields((fields) => ({
      _tag: tag(tagValue),
      ...fields
    }), {
      unsafePreserveChecks: true
    }) : TaggedStruct(tagValue, schema);
    return Error3(identifier ?? tagValue)(struct, annotations);
  };
};
function toEquivalence2(schema) {
  return toEquivalence(schema.ast);
}
var Json2 = /* @__PURE__ */ make8(/* @__PURE__ */ annotate(Json, {
  toCode: () => ({
    runtime: "Schema.Json",
    Type: "Schema.Json"
  })
}));
// node_modules/@opencode/schema/dist/schema.js
var PositiveInt = Int.check(isGreaterThan3(0));
var NonNegativeInt = Int.check(isGreaterThanOrEqualTo3(0));
var RelativePath = String5.pipe(brand("RelativePath"), annotate2({ identifier: "RelativePath" }));
var AbsolutePath = String5.pipe(brand("AbsolutePath"), annotate2({ identifier: "AbsolutePath" }));
var optional3 = (schema) => optionalKey2(schema).pipe(decodeTo2(optional2(toType2(schema)), {
  decode: passthrough({ strict: false }),
  encode: transformOptional(filter((value) => value !== undefined))
}));
var withStatics = (schema, methods) => Object.defineProperties(schema, Object.getOwnPropertyDescriptors(methods));
var statics = (methods) => (schema) => withStatics(schema, methods(schema));
var DateTimeUtcFromMillis = Finite.pipe(decodeTo2(DateTimeUtc, {
  decode: transform((value) => makeUnsafe3(value)),
  encode: transform((value) => toEpochMillis2(value))
}));

// node_modules/@opencode/schema/dist/identifier.js
var length = 26;
var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
var lastTimestamp = 0;
var counter = 0;
function ascending() {
  return create(false);
}
function descending() {
  return create(true);
}
function create(descending, timestamp = Date.now()) {
  if (timestamp !== lastTimestamp) {
    lastTimestamp = timestamp;
    counter = 0;
  }
  counter++;
  const current = BigInt(timestamp) * 0x1000n + BigInt(counter);
  const value = descending ? ~current : current;
  const time = Array.from({ length: 6 }, (_, index) => Number(value >> BigInt(40 - 8 * index) & 0xffn).toString(16).padStart(2, "0")).join("");
  const bytes = crypto.getRandomValues(new Uint8Array(length - 12));
  return time + Array.from(bytes, (byte) => chars[byte % 62]).join("");
}
// node_modules/@opencode/schema/dist/project-id.js
var ProjectID = String5.pipe(brand("Project.ID"), annotate2({ identifier: "Project.ID" }), statics((schema) => ({ global: schema.make("global") })));

// node_modules/@opencode/schema/dist/workspace-id.js
var WorkspaceID = String5.check(isStartingWith("wrk")).pipe(brand("Workspace.ID"), annotate2({ identifier: "Workspace.ID" }), statics((schema) => {
  const create = () => schema.make("wrk_" + ascending());
  return {
    ascending: (id) => {
      if (!id)
        return create();
      return schema.make(id);
    },
    create
  };
}));

// node_modules/@opencode/schema/dist/location.js
var Ref = Struct({
  directory: AbsolutePath,
  workspaceID: optional3(WorkspaceID)
}).annotate({ identifier: "Location.Ref" });
var PublicRef = Struct(omit(Ref.fields, ["workspaceID"])).annotate({
  identifier: "Location.PublicRef"
});

class Info extends Class3("Location.Info")({
  directory: AbsolutePath,
  workspaceID: optional3(WorkspaceID),
  project: Struct({
    id: ProjectID,
    directory: AbsolutePath,
    canonical: AbsolutePath
  })
}) {
}
var PublicInfo = Struct(omit(Info.fields, ["workspaceID"])).annotate({
  identifier: "Location.PublicInfo"
});

// node_modules/@opencode/schema/dist/event.js
var ID = String5.check(isStartingWith("evt_")).pipe(brand("Event.ID"), annotate2({ identifier: "Event.ID" }), statics((schema) => ({ create: () => schema.make("evt_" + ascending()) })));
var Seq = Int.check(isGreaterThanOrEqualTo3(0)).pipe(brand("Event.Seq"), annotate2({ identifier: "Event.Seq" }));
var Version = Int.check(isGreaterThanOrEqualTo3(1)).pipe(brand("Event.Version"), annotate2({ identifier: "Event.Version" }));
var DurableEnvelope = Struct({ aggregateID: String5, seq: Seq, version: Version });
function durable(input) {
  const data = Struct(input.schema);
  const durable = Struct({
    aggregateID: DurableEnvelope.fields.aggregateID,
    seq: DurableEnvelope.fields.seq,
    version: Literal2(input.durable.version).pipe(decodeTo2(toType2(Version), transform2({
      decode: () => Version.make(input.durable.version),
      encode: () => input.durable.version
    })))
  });
  return Struct({
    id: ID,
    created: Finite,
    metadata: optional3(Record(String5, Unknown2)),
    type: Literal2(input.type),
    durable,
    location: optional3(Ref),
    data
  }).annotate({ identifier: input.identifier ?? input.type }).pipe(statics(() => ({
    type: input.type,
    durability: "durable",
    durable: input.durable,
    data
  })));
}
function ephemeral(input) {
  const data = Struct(input.schema);
  return Struct({
    id: ID,
    created: Finite,
    metadata: optional3(Record(String5, Unknown2)),
    type: Literal2(input.type),
    location: optional3(Ref),
    data
  }).annotate({ identifier: input.identifier ?? input.type }).pipe(statics(() => ({
    type: input.type,
    durability: "ephemeral",
    durable: undefined,
    data
  })));
}
function inventory(...definitions) {
  return Object.freeze(definitions);
}
// node_modules/@opencode/schema/dist/integration-id.js
var IntegrationID = String5.pipe(brand("Integration.ID"), annotate2({ identifier: "Integration.ID" }));
var IntegrationMethodID = String5.pipe(brand("Integration.MethodID"), annotate2({ identifier: "Integration.MethodID" }));

// node_modules/@opencode/schema/dist/credential.js
var ID2 = String5.pipe(brand("Credential.ID"), annotate2({ identifier: "Credential.ID" }), statics((schema) => ({ create: () => schema.make("cred_" + ascending()) })));
var Updated = ephemeral({
  type: "credential.updated",
  schema: { integrationID: IntegrationID, credentialID: ID2 }
});
var Switched = ephemeral({
  type: "credential.switched",
  schema: { integrationID: IntegrationID, credentialID: NullOr(ID2) }
});
var Event = {
  Updated,
  Switched,
  Definitions: inventory(Updated, Switched)
};
var OAuth = Struct({
  type: Literal2("oauth"),
  methodID: IntegrationMethodID,
  refresh: String5,
  access: String5,
  expires: NonNegativeInt,
  metadata: optional3(Record(String5, Unknown2))
}).annotate({ identifier: "Credential.OAuth" });
var Key = Struct({
  type: Literal2("key"),
  key: String5,
  metadata: optional3(Record(String5, Unknown2))
}).annotate({ identifier: "Credential.Key" });
var External = Struct({
  type: Literal2("external"),
  methodID: IntegrationMethodID,
  metadata: optional3(Record(String5, Unknown2))
}).annotate({ identifier: "Credential.External" });
var Value = Union2([OAuth, Key, External]).pipe(toTaggedUnion("type")).annotate({ identifier: "Credential.Value" });
var Entry = Struct({
  id: ID2,
  integrationID: IntegrationID,
  label: String5,
  active: Boolean3,
  value: Value
}).annotate({ identifier: "Credential.Entry" });
var CreateInput = Struct({
  id: optional3(ID2),
  integrationID: IntegrationID,
  label: optional3(String5),
  value: Value,
  activate: optional3(Boolean3)
}).annotate({ identifier: "Credential.CreateInput" });

// node_modules/@opencode/schema/dist/connection.js
var Status = Struct({
  status: Literals(["needs_auth"]),
  message: String5,
  url: optional3(String5)
}).annotate({ identifier: "Connection.Status" });
var CredentialInfo = Struct({
  type: Literal2("credential"),
  id: ID2,
  label: String5,
  method: Literals(["key", "oauth", "external"]),
  status: optional3(Status)
}).annotate({ identifier: "Connection.CredentialInfo" });
var EnvInfo = Struct({
  type: Literal2("env"),
  name: String5,
  status: optional3(Status)
}).annotate({ identifier: "Connection.EnvInfo" });
var Info2 = Union2([CredentialInfo, EnvInfo]).pipe(toTaggedUnion("type")).annotate({ identifier: "Connection.Info" });
// node_modules/@opencode/schema/dist/form.js
var IDSchema = String5.check(isStartingWith("frm_")).pipe(brand("Form.ID"), annotate2({ identifier: "Form.ID" }));
var ID3 = IDSchema.pipe(statics((schema) => ({ create: (id) => schema.make(id ?? "frm_" + ascending()) })));
var Metadata = Record(String5, Unknown2).annotate({ identifier: "Form.Metadata" });
var Option = Struct({
  value: String5,
  label: String5,
  description: String5.pipe(optional3)
}).annotate({ identifier: "Form.Option" });
var When = Struct({
  key: String5,
  op: Literals(["eq", "neq"]),
  value: Union2([String5, Number5, Boolean3])
}).annotate({ identifier: "Form.When" });
var FieldBase = {
  key: String5,
  title: String5.pipe(optional3),
  description: String5.pipe(optional3),
  required: Boolean3.pipe(optional3),
  hidden: Boolean3.pipe(optional3).annotate({
    description: "Skip the interactive authentication prompt and use the default unless an answer is supplied"
  }),
  when: ArraySchema(When).pipe(optional3)
};
var StringField = Struct({
  ...FieldBase,
  type: Literal2("string"),
  format: Literals(["email", "uri", "date", "date-time"]).pipe(optional3),
  minLength: NonNegativeInt.pipe(optional3),
  maxLength: NonNegativeInt.pipe(optional3),
  pattern: String5.pipe(optional3),
  placeholder: String5.pipe(optional3),
  default: String5.pipe(optional3),
  options: ArraySchema(Option).pipe(optional3),
  custom: Boolean3.pipe(optional3)
}).annotate({ identifier: "Form.StringField" });
var NumberField = Struct({
  ...FieldBase,
  type: Literal2("number"),
  minimum: Number5.pipe(optional3),
  maximum: Number5.pipe(optional3),
  default: Number5.pipe(optional3)
}).annotate({ identifier: "Form.NumberField" });
var IntegerField = Struct({
  ...FieldBase,
  type: Literal2("integer"),
  minimum: Number5.pipe(optional3),
  maximum: Number5.pipe(optional3),
  default: Number5.pipe(optional3)
}).annotate({ identifier: "Form.IntegerField" });
var BooleanField = Struct({
  ...FieldBase,
  type: Literal2("boolean"),
  default: Boolean3.pipe(optional3)
}).annotate({ identifier: "Form.BooleanField" });
var MultiselectField = Struct({
  ...FieldBase,
  type: Literal2("multiselect"),
  options: ArraySchema(Option),
  minItems: NonNegativeInt.pipe(optional3),
  maxItems: NonNegativeInt.pipe(optional3),
  custom: Boolean3.pipe(optional3),
  default: ArraySchema(String5).pipe(optional3)
}).annotate({ identifier: "Form.MultiselectField" });
var ExternalField = Struct({
  key: String5,
  type: Literal2("external"),
  url: String5,
  title: String5.pipe(optional3),
  description: String5.pipe(optional3)
}).annotate({ identifier: "Form.ExternalField" });
var Field = Union2([
  StringField,
  NumberField,
  IntegerField,
  BooleanField,
  MultiselectField,
  ExternalField
]).pipe(toTaggedUnion("type"), annotate2({ identifier: "Form.Field" }));
var Fields = NonEmptyArray(Field).annotate({ identifier: "Form.Fields" });
var InfoBase = {
  id: ID3,
  sessionID: String5,
  title: String5,
  metadata: Metadata.pipe(optional3)
};
var Info3 = Struct({
  ...InfoBase,
  fields: Fields
}).annotate({ identifier: "Form.Info" });
var Value2 = Union2([String5, Number5, Boolean3, ArraySchema(String5)]).annotate({
  identifier: "Form.Value"
});
var Answer = Record(String5, Value2).annotate({ identifier: "Form.Answer" });
var State = Union2([
  Struct({ status: Literal2("pending") }),
  Struct({ status: Literal2("answered"), answer: Answer }),
  Struct({ status: Literal2("cancelled"), message: String5.pipe(optional3) })
]).pipe(toTaggedUnion("status")).annotate({ identifier: "Form.State" });
var Detail = Struct({
  ...Info3.fields,
  state: State
}).annotate({ identifier: "Form.Detail" });
var Reply = Struct({
  answer: Answer
}).annotate({ identifier: "Form.Reply" });
var Created = ephemeral({ type: "form.created", schema: { form: Info3 } });
var Replied = ephemeral({ type: "form.replied", schema: { id: ID3, sessionID: String5, answer: Answer } });
var Cancelled = ephemeral({ type: "form.cancelled", schema: { id: ID3, sessionID: String5 } });
var Event2 = { Created, Replied, Cancelled, Definitions: inventory(Created, Replied, Cancelled) };

// node_modules/@opencode/schema/dist/integration.js
var ID4 = IntegrationID;
var MethodID = IntegrationMethodID;
var OAuthMethod = Struct({
  id: MethodID,
  type: Literal2("oauth"),
  label: String5,
  form: optional3(Fields)
}).annotate({ identifier: "Integration.OAuthMethod" });
var CommandMethod = Struct({
  id: MethodID,
  type: Literal2("command"),
  label: String5,
  command: ArraySchema(String5)
}).annotate({ identifier: "Integration.CommandMethod" });
var KeyMethod = Struct({
  type: Literal2("key"),
  label: optional3(String5),
  form: optional3(Fields)
}).annotate({ identifier: "Integration.KeyMethod" });
var ExternalMethod = Struct({
  id: MethodID,
  type: Literal2("external"),
  label: String5,
  form: optional3(Fields)
}).annotate({ identifier: "Integration.ExternalMethod" });
var EnvMethod = Struct({
  type: Literal2("env"),
  names: ArraySchema(String5)
}).annotate({ identifier: "Integration.EnvMethod" });
var Method = Union2([OAuthMethod, CommandMethod, KeyMethod, ExternalMethod, EnvMethod]).pipe(toTaggedUnion("type")).annotate({ identifier: "Integration.Method" });
var Updated2 = ephemeral({
  type: "integration.updated",
  schema: {}
});
var Event3 = { Updated: Updated2, Definitions: inventory(Updated2) };
var Ref2 = Struct({
  id: ID4,
  name: String5,
  metadata: optional3(Record(String5, Any2))
}).annotate({ identifier: "Integration.Ref" });
var Info4 = Struct({
  id: ID4,
  name: String5,
  metadata: optional3(Record(String5, Any2)),
  methods: ArraySchema(Method),
  connections: ArraySchema(Info2)
}).annotate({ identifier: "Integration.Info" });
var AttemptID = String5.pipe(brand("Integration.AttemptID"), annotate2({ identifier: "Integration.AttemptID" }), statics((schema) => ({ create: () => schema.make("con_" + ascending()) })));
var AttemptTime = Struct({
  created: Number5,
  expires: Number5
});

class Attempt extends Class3("Integration.Attempt")({
  attemptID: AttemptID,
  url: String5,
  instructions: String5,
  mode: Literals(["auto", "code"]),
  paste: optionalKey2(Literal2(true)),
  time: AttemptTime
}) {
}
var AttemptStatus = Union2([
  Struct({ status: Literal2("pending"), time: AttemptTime }),
  Struct({ status: Literal2("complete"), time: AttemptTime }),
  Struct({ status: Literal2("failed"), message: String5, time: AttemptTime }),
  Struct({ status: Literal2("expired"), time: AttemptTime })
]).pipe(toTaggedUnion("status")).annotate({ identifier: "Integration.AttemptStatus" });
var CommandAttempt = Struct({
  attemptID: AttemptID,
  time: AttemptTime
}).annotate({ identifier: "Integration.CommandAttempt" });
var CommandAttemptStatus = Union2([
  Struct({ status: Literal2("pending"), message: optional3(String5), time: AttemptTime }),
  Struct({ status: Literal2("complete"), time: AttemptTime }),
  Struct({ status: Literal2("failed"), message: String5, time: AttemptTime }),
  Struct({ status: Literal2("expired"), time: AttemptTime })
]).pipe(toTaggedUnion("status")).annotate({ identifier: "Integration.CommandAttemptStatus" });

// node_modules/@opencode/schema/dist/model-compatibility.js
var ReasoningField = Union2([
  Literals(["reasoning", "reasoning_content", "reasoning_text"]),
  String5
]).annotate({ identifier: "Model.ReasoningField" });
var MaxTokensField = Literals(["max_completion_tokens", "max_tokens"]).annotate({
  identifier: "Model.MaxTokensField"
});
var MediaInput = Literals(["assets", "state", "root"]).annotate({
  identifier: "Model.MediaInput"
});
var CacheFormat = Literals(["anthropic", "alibaba"]).annotate({ identifier: "Model.CacheFormat" });
var Compatibility = Struct({
  reasoningField: ReasoningField.pipe(optional3),
  requireReasoning: Boolean3.pipe(optional3),
  maxTokensField: MaxTokensField.pipe(optional3),
  requireFinishReason: Boolean3.pipe(optional3),
  requireAssistantAfterTool: Boolean3.pipe(optional3),
  supportsPromptCacheKey: Boolean3.pipe(optional3),
  streamUsage: Boolean3.pipe(optional3),
  cacheFormat: CacheFormat.pipe(optional3),
  supportsThinkingBlockBinding: Boolean3.pipe(optional3),
  supportsEffortUpdates: Boolean3.pipe(optional3),
  mediaInput: MediaInput.pipe(optional3)
}).annotate({ identifier: "Model.Compatibility" });
var ProviderCompatibility = Struct(omit(Compatibility.fields, ["supportsThinkingBlockBinding", "supportsEffortUpdates"])).annotate({ identifier: "Provider.Compatibility" });

// node_modules/@opencode/schema/dist/provider.js
var ID5 = String5.pipe(brand("Provider.ID"), annotate2({ identifier: "Provider.ID" }), statics((schema) => ({
  opencode: schema.make("opencode"),
  anthropic: schema.make("anthropic"),
  openai: schema.make("openai"),
  google: schema.make("google"),
  googleVertex: schema.make("google-vertex"),
  githubCopilot: schema.make("github-copilot"),
  claudeAgent: schema.make("claude-agent"),
  amazonBedrock: schema.make("amazon-bedrock"),
  azure: schema.make("azure"),
  openrouter: schema.make("openrouter"),
  mistral: schema.make("mistral"),
  gitlab: schema.make("gitlab")
})));
var Updated3 = ephemeral({ type: "provider.updated", schema: {} });
var Event4 = { Updated: Updated3, Definitions: inventory(Updated3) };
var Package = String5;
var Activation = Literals(["auto", "enabled", "disabled"]);
var Compaction = Union2([
  Struct({ type: Literal2("summary") }),
  Struct({ type: Literal2("native") })
]).pipe(toTaggedUnion("type")).annotate({ identifier: "Provider.Compaction" });
var Transport = Literals(["http", "websocket"]).annotate({ identifier: "Provider.Transport" });
var CacheTTL = TemplateLiteral2([Number5, Literals(["ms", "s", "m", "h", "d"])]).check(isPattern2(/^\d+(ms|s|m|h|d)$/)).annotate({ identifier: "Provider.CacheTTL" });
var CacheWarming = Union2([
  Boolean3,
  Struct({
    interval: Union2([Literal2("auto"), String5]).pipe(optional3).annotate({ description: `Duration such as "4 minutes", or "auto" (default) for 90% of the model's cache.ttl` }),
    duration: String5.pipe(optional3).annotate({ description: 'Duration such as "30 minutes"' })
  })
]).annotate({ identifier: "Provider.CacheWarming" });
var Cache = Struct({
  ttl: CacheTTL.pipe(optional3),
  warming: CacheWarming.pipe(optional3)
}).annotate({ identifier: "Provider.Cache" });
var Encoding2 = Literals(["zstd", "gzip", "none"]).annotate({ identifier: "Provider.Encoding" });
var Timeout = Union2([Finite, Literal2(false)]).pipe(optional3);
var Settings = StructWithRest(Struct({
  timeout: Timeout,
  headerTimeout: Timeout,
  chunkTimeout: Timeout,
  compaction: Compaction.pipe(optional3),
  cache: Cache.pipe(optional3),
  transport: Transport.pipe(optional3),
  encoding: Encoding2.pipe(optional3)
}), [Record(String5, Any2)]).annotate({ identifier: "Provider.Settings" });
var Overlays = {
  settings: Settings.pipe(optional3),
  headers: Record(String5, String5).pipe(optional3),
  body: Record(String5, Any2).pipe(optional3)
};
var Request = Struct({
  settings: Settings.pipe(withConstructorDefault2(succeed5({}))),
  headers: Record(String5, String5),
  body: Record(String5, Any2)
}).annotate({ identifier: "Provider.Request" });
var Info5 = Struct({
  id: ID5,
  canonical: ID5.pipe(optional3),
  integrationID: ID4.pipe(optional3),
  name: String5,
  activation: Activation,
  package: Package,
  compatibility: ProviderCompatibility.pipe(optional3),
  ...Overlays
}).annotate({ identifier: "Provider.Info" }).pipe(statics(() => ({
  empty: (id) => ({ id, name: id, activation: "auto", package: "" })
})));
// node_modules/@opencode/schema/dist/money.js
var USD = Finite.pipe(brand("Money.USD"), annotate2({ identifier: "Money.USD" }), statics((schema) => ({ zero: schema.make(0) })));
var USDPerMillionTokens = Finite.pipe(brand("Money.USDPerMillionTokens"), annotate2({ identifier: "Money.USDPerMillionTokens" }), statics((schema) => ({ zero: schema.make(0) })));

// node_modules/@opencode/schema/dist/model.js
var ID6 = String5.pipe(brand("Model.ID"));
var Updated4 = ephemeral({ type: "model.updated", schema: {} });
var Event5 = { Updated: Updated4, Definitions: inventory(Updated4) };
var VariantID = String5.pipe(brand("Model.VariantID"));
var Ref3 = Struct({
  id: ID6,
  providerID: ID5,
  variant: VariantID.pipe(optional3)
}).annotate({ identifier: "Model.Ref" }).pipe(statics((schema) => ({
  parse: (input) => {
    const providerEnd = input.indexOf("/");
    if (providerEnd <= 0)
      throw new Error(`Invalid model reference: ${input}`);
    const providerID = input.slice(0, providerEnd);
    const variantStart = input.indexOf("#", providerEnd + 1);
    const id = input.slice(providerEnd + 1, variantStart === -1 ? undefined : variantStart);
    const variant = variantStart === -1 ? undefined : input.slice(variantStart + 1);
    if (!id || providerID.includes("#") || variant !== undefined && (!variant || variant.includes("#")))
      throw new Error(`Invalid model reference: ${input}`);
    return schema.make({
      providerID: ID5.make(providerID),
      id: ID6.make(id),
      ...variant ? { variant: VariantID.make(variant) } : {}
    });
  }
})));
var Family = String5.pipe(brand("Model.Family"));
var Type = Union2([
  Literals(["chat", "decision", "image"]),
  String5
]).annotate({ identifier: "Model.Type" });
var Settings2 = StructWithRest(Struct(pick(Settings.schema.fields, ["compaction", "cache", "encoding"])), [Record(String5, Any2)]).annotate({ identifier: "Model.Settings" });
var VariantSettings = StructWithRest(Struct(omit(Settings2.schema.fields, ["cache"])), Settings2.records).annotate({ identifier: "Model.VariantSettings" });
var Overlays2 = {
  settings: Settings2.pipe(optional3),
  headers: Record(String5, String5).pipe(optional3),
  body: Record(String5, Any2).pipe(optional3)
};
var Capabilities = Struct({
  tools: Boolean3,
  input: ArraySchema(String5),
  output: ArraySchema(String5),
  temperature: Boolean3.pipe(optional3)
}).annotate({ identifier: "Model.Capabilities" }).pipe(statics(() => ({
  default: () => ({ tools: true, input: ["text", "image"], output: ["text"] })
})));
var Cost = Struct({
  tier: Struct({
    type: tag("context"),
    size: Int
  }).pipe(optional3),
  input: USDPerMillionTokens,
  output: USDPerMillionTokens,
  cache: Struct({
    read: USDPerMillionTokens,
    write: USDPerMillionTokens
  })
}).annotate({ identifier: "Model.Cost" });
var Variant = Struct({
  id: VariantID,
  ...Overlays2,
  settings: VariantSettings.pipe(optional3)
}).annotate({ identifier: "Model.Variant" });
var Info6 = Struct({
  id: ID6,
  modelID: ID6,
  providerID: ID5,
  canonical: ID5.pipe(optional3),
  type: Type.pipe(optional3),
  family: Family.pipe(optional3),
  name: String5,
  compatibility: Compatibility.pipe(optional3),
  package: Package.pipe(optional3),
  ...Overlays2,
  capabilities: Capabilities,
  variants: ArraySchema(Variant),
  time: Struct({
    released: Finite
  }),
  cost: ArraySchema(Cost),
  status: Literals(["alpha", "beta", "deprecated", "active"]),
  enabled: Boolean3,
  limit: Struct({
    context: Int,
    input: Int.pipe(optional3),
    output: Int
  })
}).annotate({ identifier: "Model.Info" }).pipe(statics(() => ({
  default: (providerID, id) => ({
    id,
    modelID: id,
    providerID,
    name: id,
    capabilities: Capabilities.default(),
    variants: [],
    time: { released: 0 },
    cost: [],
    status: "active",
    enabled: true,
    limit: { context: 200000, output: 32000 }
  })
})));
// node_modules/@opencode/schema/dist/session-id.js
var SessionID = String5.check(isStartingWith("ses")).pipe(brand("SessionID"), annotate2({ identifier: "Session.ID" }), statics((schema) => ({
  create: () => schema.make("ses_" + descending())
})));

// node_modules/@opencode/schema/dist/permission.js
var ID7 = String5.check(isStartingWith("per")).pipe(brand("Permission.ID"), annotate2({ identifier: "Permission.ID" }), statics((schema) => ({ create: (id) => schema.make(id ?? "per_" + ascending()) })));
var Source = Union2([
  Struct({
    type: Literal2("tool"),
    messageID: String5,
    id: String5
  })
]).annotate({ identifier: "Permission.Source" });
var RequestFields = {
  sessionID: SessionID,
  action: String5,
  resources: ArraySchema(String5),
  save: ArraySchema(String5).pipe(optional3),
  metadata: Record(String5, Unknown2).pipe(optional3),
  source: Source.pipe(optional3),
  message: String5.pipe(optional3)
};
var Request2 = Struct({
  id: ID7,
  ...RequestFields
}).annotate({ identifier: "Permission.Request" });
var Reply2 = Literals(["once", "always", "reject"]).annotate({ identifier: "Permission.Reply" });
var Asked = ephemeral({ type: "permission.asked", schema: Request2.fields });
var Replied2 = ephemeral({
  type: "permission.replied",
  schema: {
    sessionID: SessionID,
    requestID: ID7,
    reply: Reply2
  }
});
var Event6 = { Asked, Replied: Replied2, Definitions: inventory(Asked, Replied2) };
var Effect = Literals(["allow", "deny", "ask"]).annotate({ identifier: "Permission.Effect" });
var Rule = Struct({
  action: String5,
  resource: String5,
  effect: Effect
}).annotate({ identifier: "Permission.Rule" });
var Ruleset = ArraySchema(Rule).annotate({ identifier: "Permission.Ruleset" });

// node_modules/@opencode/schema/dist/agent.js
var Updated5 = ephemeral({ type: "agent.updated", schema: {} });
var ID8 = String5.pipe(brand("Agent.ID"), annotate2({ identifier: "Agent.ID" }));
var Name = String5.pipe(brand("Agent.Name"));
var Color = String5.annotate({ identifier: "Agent.Color" });
var Info7 = Struct({
  id: ID8,
  name: Name,
  model: Ref3.pipe(optional3),
  request: Request,
  system: String5.pipe(optional3),
  description: String5.pipe(optional3),
  mode: Literals(["subagent", "primary", "all"]),
  hidden: Boolean3,
  color: Color.pipe(optional3),
  steps: PositiveInt.pipe(optional3),
  permissions: Ruleset
}).annotate({ identifier: "Agent.Info" }).pipe(statics(() => ({
  default: (id) => ({
    id,
    name: Name.make(id),
    request: { settings: {}, headers: {}, body: {} },
    mode: "primary",
    hidden: false,
    permissions: [
      { action: "*", resource: "*", effect: "allow" },
      { action: "read", resource: "*.env", effect: "ask" },
      { action: "read", resource: "*.env.*", effect: "ask" },
      { action: "read", resource: "*.env.example", effect: "allow" }
    ]
  })
})));
var Event7 = {
  Updated: Updated5,
  Definitions: inventory(Updated5)
};
// node_modules/@opencode/schema/dist/artifact.js
var ID9 = String5.check(isStartingWith("art_")).pipe(brand("Artifact.ID"), annotate2({ identifier: "Artifact.ID" }), statics((schema) => ({
  create: () => schema.make("art_" + ascending())
})));
var ProviderID = Trim.check(isNonEmpty()).pipe(brand("Artifact.ProviderID"), annotate2({ identifier: "Artifact.ProviderID" }));
var Capability = Literals(["static", "server-code", "sqlite", "durable-objects"]).annotate({
  identifier: "Artifact.Capability"
});
var Provider = Struct({
  id: ProviderID,
  name: String5,
  capabilities: ArraySchema(Capability),
  default: Boolean3
}).annotate({ identifier: "Artifact.Provider" });
var Time = Struct({
  created: Finite,
  updated: Finite
}).annotate({ identifier: "Artifact.Time" });
var Info8 = Struct({
  id: ID9,
  provider: ProviderID,
  sessionID: SessionID.pipe(optional3),
  title: String5,
  entry: String5,
  url: String5,
  time: Time
}).annotate({ identifier: "Artifact.Info" });
var Content = Struct({
  info: Info8,
  files: Record(String5, String5)
}).annotate({ identifier: "Artifact.Content" });
var CreateInput2 = Struct({
  title: String5,
  files: Record(String5, String5),
  entry: String5.pipe(optional3),
  provider: ProviderID.pipe(optional3),
  sessionID: SessionID.pipe(optional3)
}).annotate({ identifier: "Artifact.CreateInput" });
var UpdateInput = Struct({
  title: String5.pipe(optional3),
  files: Record(String5, String5),
  entry: String5.pipe(optional3),
  sessionID: SessionID.pipe(optional3)
}).annotate({ identifier: "Artifact.UpdateInput" });
var Updated6 = ephemeral({
  type: "artifact.updated",
  schema: {}
});
var Event8 = { Updated: Updated6, Definitions: inventory(Updated6) };
// node_modules/@opencode/schema/dist/command.js
var Updated7 = ephemeral({ type: "command.updated", schema: {} });
var Info9 = Struct({
  name: String5,
  description: String5.pipe(optional3)
}).annotate({ identifier: "Command.Info" });
var Event9 = {
  Updated: Updated7,
  Definitions: inventory(Updated7)
};
// node_modules/@opencode/schema/dist/mcp.js
class TimeoutConfig extends Class3("Mcp.TimeoutConfig")({
  startup: PositiveInt.pipe(optional3).annotate({
    description: "Maximum time in milliseconds to establish and initialize the MCP server."
  }),
  catalog: PositiveInt.pipe(optional3).annotate({
    description: "Maximum time in milliseconds to wait for MCP discovery requests such as tools/list and prompts/list."
  }),
  execution: PositiveInt.pipe(optional3).annotate({
    description: "Maximum time in milliseconds to wait for MCP tool and prompt execution."
  })
}) {
}
var Protocol = Literals(["legacy", "auto", "2026-07-28"]).annotate({
  identifier: "Mcp.Protocol",
  description: 'MCP protocol negotiation. "legacy" (default) opens with the initialize handshake and speaks protocol revisions up to 2025-11-25. "auto" probes for the 2026-07-28 revision and falls back to legacy when the server does not support it. "2026-07-28" requires that revision and fails otherwise.'
});

class LocalConfig extends Class3("Mcp.LocalConfig")({
  type: Literal2("local"),
  command: String5.pipe(ArraySchema),
  cwd: String5.pipe(optional3).annotate({
    description: "Working directory for the MCP server process. Relative paths resolve from the workspace directory."
  }),
  environment: Record(String5, String5).pipe(optional3),
  disabled: Boolean3.pipe(optional3),
  codemode: Boolean3.pipe(optional3).annotate({
    description: "Expose this server's tools through Code Mode. Defaults to true."
  }),
  timeout: TimeoutConfig.pipe(optional3),
  protocol: Protocol.pipe(optional3),
  pool: Boolean3.pipe(optional3).annotate({
    description: 'Share one connection to this server across every directory that configures it identically, instead of one per directory. Only connections that negotiate the 2026-07-28 revision are shared; an unset "protocol" becomes "auto", and "legacy" never shares. Defaults to false.'
  })
}) {
}

class OAuthConfig extends Class3("Mcp.OAuthConfig")({
  client_id: String5.pipe(optional3),
  client_secret: String5.pipe(optional3),
  scope: String5.pipe(optional3),
  callback_port: Int.check(isBetween({ minimum: 1, maximum: 65535 })).pipe(optional3),
  redirect_uri: String5.pipe(optional3),
  auth_server_metadata_url: String5.pipe(optional3).annotate({
    description: "URL of the OAuth or OpenID Connect authorization server metadata document. Set when the MCP server does not publish protected resource metadata that names its authorization server."
  })
}) {
}

class RemoteConfig extends Class3("Mcp.RemoteConfig")({
  type: Literal2("remote"),
  url: String5,
  headers: Record(String5, String5).pipe(optional3),
  oauth: Union2([OAuthConfig, Literal2(false)]).pipe(optional3),
  disabled: Boolean3.pipe(optional3),
  codemode: Boolean3.pipe(optional3).annotate({
    description: "Expose this server's tools through Code Mode. Defaults to true."
  }),
  timeout: TimeoutConfig.pipe(optional3),
  protocol: Protocol.pipe(optional3),
  pool: Boolean3.pipe(optional3).annotate({
    description: 'Share one connection to this server across every directory that configures it identically, instead of one per directory. Only connections that negotiate the 2026-07-28 revision are shared; an unset "protocol" becomes "auto", and "legacy" never shares. Defaults to false.'
  })
}) {
}
var ServerConfig = Union2([LocalConfig, RemoteConfig]).pipe(toTaggedUnion("type"));
var Connected = Struct({ status: Literal2("connected") }).annotate({
  identifier: "Mcp.Status.Connected"
});
var Pending = Struct({ status: Literal2("pending") }).annotate({
  identifier: "Mcp.Status.Pending"
});
var Disabled = Struct({ status: Literal2("disabled") }).annotate({
  identifier: "Mcp.Status.Disabled"
});
var Failed = Struct({ status: Literal2("failed"), error: String5 }).annotate({
  identifier: "Mcp.Status.Failed"
});
var NeedsAuth = Struct({ status: Literal2("needs_auth"), error: String5 }).annotate({
  identifier: "Mcp.Status.NeedsAuth"
});
var Status2 = Union2([Connected, Pending, Disabled, Failed, NeedsAuth]).pipe(toTaggedUnion("status"));
var Server = Struct({
  name: String5,
  status: Status2,
  title: optional3(String5),
  integrationID: optional3(IntegrationID)
}).annotate({ identifier: "Mcp.Server" });
var Resource = Struct({
  server: String5,
  name: String5,
  uri: String5,
  description: optional3(String5),
  mimeType: optional3(String5)
}).annotate({ identifier: "Mcp.Resource" });
var ResourceTemplate = Struct({
  server: String5,
  name: String5,
  uriTemplate: String5,
  description: optional3(String5),
  mimeType: optional3(String5)
}).annotate({ identifier: "Mcp.ResourceTemplate" });
var ResourceCatalog = Struct({
  resources: ArraySchema(Resource),
  templates: ArraySchema(ResourceTemplate)
}).annotate({ identifier: "Mcp.ResourceCatalog" });
var ResourceContentPart = Union2([
  Struct({
    type: Literal2("text"),
    uri: String5,
    text: String5,
    mimeType: optional3(String5)
  }),
  Struct({
    type: Literal2("blob"),
    uri: String5,
    blob: String5,
    mimeType: optional3(String5)
  })
]).pipe(toTaggedUnion("type"), annotate2({ identifier: "Mcp.ResourceContentPart" }));
var ResourceContent = Struct({
  server: String5,
  uri: String5,
  contents: ArraySchema(ResourceContentPart)
}).annotate({ identifier: "Mcp.ResourceContent" });
// node_modules/@opencode/schema/dist/pty.js
var IDSchema2 = String5.check(isStartingWith("pty")).pipe(brand("PtyID"), annotate2({ identifier: "Pty.ID" }));
var ID10 = IDSchema2.pipe(statics((schema) => {
  const create = () => schema.make("pty_" + ascending());
  return {
    create,
    ascending: (id) => id === undefined ? create() : schema.make(id)
  };
}));
var Info10 = Struct({
  id: ID10,
  title: String5,
  command: String5,
  args: ArraySchema(String5),
  cwd: String5,
  status: Literals(["running", "exited"]),
  pid: NonNegativeInt,
  exitCode: optional3(NonNegativeInt)
}).annotate({ identifier: "Pty" });
var Created2 = ephemeral({ type: "pty.created", schema: { info: Info10 } });
var Updated8 = ephemeral({ type: "pty.updated", schema: { info: Info10 } });
var Exited = ephemeral({ type: "pty.exited", schema: { id: ID10, exitCode: NonNegativeInt } });
var Deleted = ephemeral({ type: "pty.deleted", schema: { id: ID10 } });
var Event10 = { Created: Created2, Updated: Updated8, Exited, Deleted, Definitions: inventory(Created2, Updated8, Exited, Deleted) };
var CreateInput3 = Struct({
  command: optional3(String5),
  args: optional3(ArraySchema(String5)),
  cwd: optional3(String5),
  title: optional3(String5),
  env: optional3(Record(String5, String5))
});
var UpdateInput2 = Struct({
  title: optional3(String5),
  size: optional3(Struct({
    rows: PositiveInt,
    cols: PositiveInt
  }))
});
// node_modules/@opencode/schema/dist/project.js
var ID11 = ProjectID;
var Vcs = String5.check(isPattern2(/^[a-z][a-z0-9._-]*$/u)).annotate({
  identifier: "Project.Vcs"
});
var Current = Struct({
  id: ID11,
  directory: AbsolutePath,
  canonical: AbsolutePath
}).annotate({ identifier: "Project.Current" });
var Icon = Struct({
  url: optional3(String5),
  override: optional3(String5),
  color: optional3(String5)
}).annotate({ identifier: "Project.Icon" });
var Commands = Struct({
  start: optional3(String5.annotate({ description: "Startup script to run when creating a new workspace (worktree)" }))
}).annotate({ identifier: "Project.Commands" });
var Time2 = Struct({
  created: NonNegativeInt,
  updated: NonNegativeInt,
  active: NonNegativeInt,
  archived: optional3(NonNegativeInt)
}).annotate({ identifier: "Project.Time" });
var Info11 = Struct({
  id: ID11,
  canonical: AbsolutePath,
  vcs: optional3(Vcs),
  name: optional3(String5),
  icon: optional3(Icon),
  commands: optional3(Commands),
  time: Time2,
  sandboxes: ArraySchema(String5)
}).annotate({ identifier: "Project" });
var UpdateInput3 = Struct({
  projectID: ID11,
  canonical: optional3(AbsolutePath),
  name: optional3(String5),
  icon: optional3(Icon),
  commands: optional3(Commands)
}).annotate({ identifier: "Project.UpdateInput" });
var Updated9 = ephemeral({ type: "project.updated", schema: Info11.fields });
var Event11 = { Updated: Updated9, Definitions: inventory(Updated9) };
// node_modules/@opencode/schema/dist/llm.js
var FinishReason = Literals(["stop", "length", "tool-calls", "content-filter", "error", "unknown"]);
// node_modules/@opencode/schema/dist/tool.js
var CallID = String5.pipe(brand("Tool.CallID"));

class Error4 extends TaggedError3()("Tool.Error", {
  message: String5,
  error: optional2(Defect()),
  metadata: optional2(Record(String5, Unknown2))
}) {
}
var TextContent = Struct({
  type: Literal2("text"),
  text: String5
}).annotate({ identifier: "Tool.TextContent" });
var FileContent = Struct({
  type: Literal2("file"),
  uri: String5,
  mime: String5,
  name: optional2(String5)
}).annotate({ identifier: "Tool.FileContent" });
var Content2 = Union2([TextContent, FileContent]).pipe(toTaggedUnion("type")).annotate({ identifier: "Tool.Content" });

// node_modules/@opencode/schema/dist/session-metadata.js
var SessionMetadata = Record(String5, Json2).annotate({
  identifier: "Session.Metadata"
});
// node_modules/@opencode/schema/dist/skill.js
var ID12 = String5.pipe(brand("Skill.ID"), annotate2({ identifier: "Skill.ID" }));
var Name2 = String5.pipe(brand("Skill.Name"), annotate2({ identifier: "Skill.Name" }));
var DirectorySource = Struct({
  type: tag("directory"),
  path: AbsolutePath
}).annotate({ identifier: "Skill.DirectorySource" });
var UrlSource = Struct({
  type: tag("url"),
  url: String5
}).annotate({ identifier: "Skill.UrlSource" });
var Info12 = Struct({
  id: ID12,
  name: Name2,
  description: String5.pipe(optional3),
  autoinvoke: Boolean3.pipe(optional3),
  path: AbsolutePath,
  content: String5
}).annotate({ identifier: "Skill.Info" });
var Updated10 = ephemeral({ type: "skill.updated", schema: {} });
var Event12 = { Updated: Updated10, Definitions: inventory(Updated10) };
var EmbeddedSource = Struct({
  type: tag("embedded"),
  skill: suspend3(() => Info12)
}).annotate({ identifier: "Skill.EmbeddedSource" });
var Source2 = Object.assign(Union2([DirectorySource, UrlSource, EmbeddedSource]).pipe(toTaggedUnion("type"), annotate2({ identifier: "Skill.Source" })), {
  equals: (a, b) => {
    if (a.type !== b.type)
      return false;
    if (a.type === "directory" && b.type === "directory")
      return a.path === b.path;
    if (a.type === "url" && b.type === "url")
      return a.url === b.url;
    if (a.type === "embedded" && b.type === "embedded")
      return a.skill.id === b.skill.id;
    return false;
  },
  key: (source) => source.type === "directory" ? `directory:${source.path}` : source.type === "url" ? `url:${source.url}` : `embedded:${source.skill.id}`
});

// node_modules/@opencode/schema/dist/prompt.js
var PromptMention = Struct({
  start: Finite,
  end: Finite,
  text: String5
}).annotate({ identifier: "Prompt.Mention" });
var FileSource = Union2([
  Struct({ type: Literal2("inline") }),
  Struct({ type: Literal2("uri"), uri: String5 })
]).pipe(toTaggedUnion("type")).annotate({ identifier: "Prompt.FileSource" });
var Base64 = String5.check(makeFilter2((value) => value.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/u.test(value), isPattern2(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u).annotations)).annotate({ identifier: "Prompt.Base64" });
var FileAttachment = Struct({
  data: Base64,
  mime: String5,
  source: FileSource,
  name: String5.pipe(optional3),
  description: String5.pipe(optional3),
  mention: PromptMention.pipe(optional3)
}).annotate({ identifier: "Prompt.FileAttachment" }).pipe(statics((schema) => ({
  create: (input) => schema.make({
    data: input.data,
    mime: input.mime,
    source: input.source,
    name: input.name,
    description: input.description,
    mention: input.mention
  })
})));
var MediaRef = String5.check(isPattern2(/^media:[0-9a-f]{64}$/)).annotate({
  identifier: "Prompt.MediaRef"
});
var { data: _, ...fileAttachmentFields } = FileAttachment.fields;
var MediaFileAttachment = Struct({
  ...fileAttachmentFields,
  uri: MediaRef,
  bytes: Int.pipe(optional3),
  width: Int.pipe(optional3),
  height: Int.pipe(optional3)
}).annotate({ identifier: "Prompt.MediaFileAttachment" });
var Attachment = Union2([FileAttachment, MediaFileAttachment]).annotate({
  identifier: "Prompt.Attachment"
});
var AgentAttachment = Struct({
  name: String5,
  mention: PromptMention.pipe(optional3)
}).annotate({ identifier: "Prompt.AgentAttachment" });
var SkillAttachment = Struct({
  id: ID12,
  name: Name2,
  text: String5.pipe(optional3),
  mention: PromptMention.pipe(optional3)
}).annotate({ identifier: "Prompt.SkillAttachment" });
var Prompt = Struct({
  text: String5,
  files: ArraySchema(FileAttachment).pipe(optional3),
  agents: ArraySchema(AgentAttachment).pipe(optional3),
  skills: ArraySchema(SkillAttachment).pipe(optional3)
}).annotate({ identifier: "Prompt" }).pipe(statics((schema) => ({
  equivalence: toEquivalence2(schema),
  fromUserMessage: (input) => schema.make({
    text: input.text,
    ...input.files === undefined ? {} : { files: input.files },
    ...input.agents === undefined ? {} : { agents: input.agents },
    ...input.skills === undefined ? {} : { skills: input.skills }
  })
})));
// node_modules/@opencode/schema/dist/shell.js
var IDSchema3 = String5.check(isStartingWith("sh_")).pipe(brand("Shell.ID"), annotate2({ identifier: "Shell.ID" }));
var ID13 = IDSchema3.pipe(statics((schema) => {
  const create = () => schema.make("sh_" + ascending());
  return {
    create,
    ascending: (id) => id === undefined ? create() : schema.make(id)
  };
}));
var Status3 = Literals(["running", "exited", "timeout", "killed"]);
var Time3 = Struct({
  started: Finite.annotate({ description: "Start time in milliseconds since the Unix epoch" }),
  completed: optional3(Finite).annotate({
    description: "Completion time in milliseconds since the Unix epoch"
  })
});
var Metadata2 = Record(String5, Unknown2);
var Info13 = Struct({
  id: ID13,
  status: Status3,
  command: String5,
  cwd: String5,
  shell: String5,
  file: String5,
  pid: optional3(NonNegativeInt),
  exit: optional3(Finite),
  signal: optional3(String5),
  metadata: Metadata2,
  time: Time3
}).annotate({ identifier: "Shell.Info" });
var Created3 = ephemeral({ type: "shell.created", schema: { info: Info13 } });
var Exited2 = ephemeral({ type: "shell.exited", schema: { id: ID13, exit: optional3(Finite), status: Status3 } });
var Deleted2 = ephemeral({ type: "shell.deleted", schema: { id: ID13 } });
var Event13 = { Created: Created3, Exited: Exited2, Deleted: Deleted2, Definitions: inventory(Created3, Exited2, Deleted2) };
var CreateInput4 = Struct({
  command: String5,
  cwd: optional3(String5),
  timeout: optional3(NonNegativeInt),
  metadata: optional3(Metadata2)
});
var OutputInput = Struct({
  cursor: optional3(NonNegativeInt),
  limit: optional3(NonNegativeInt)
});
var Output = Struct({
  output: String5,
  cursor: NonNegativeInt,
  size: NonNegativeInt,
  truncated: Boolean3
});
// node_modules/@opencode/schema/dist/session-error.js
var Error5 = Struct({
  type: String5,
  message: String5,
  status: Int.check(isBetween({ minimum: 100, maximum: 599 })).pipe(optional3),
  response: Struct({ body: String5 }).pipe(optional3),
  retryAfterMs: NonNegativeInt.pipe(optional3)
}).annotate({ identifier: "Session.StructuredError" });
// node_modules/@opencode/schema/dist/snapshot.js
var ID14 = String5.pipe(brand("Snapshot.ID"), annotate2({ identifier: "Snapshot.ID" }));
// node_modules/@opencode/schema/dist/token-usage.js
var Info14 = Struct({
  input: Finite,
  output: Finite,
  reasoning: Finite,
  cache: Struct({
    read: Finite,
    write: Finite
  })
}).annotate({ identifier: "TokenUsage.Info" });

// node_modules/@opencode/schema/dist/session-message.js
var ID15 = String5.check(isStartingWith("msg_")).pipe(brand("Session.Message.ID"), annotate2({ identifier: "Session.Message.ID" }), statics((schema) => ({
  create: () => schema.make("msg_" + ascending()),
  fromEvent: (eventID) => schema.make(eventID.replace(/^evt_/, "msg_"))
})));
var Base = {
  id: ID15,
  metadata: Record(String5, Unknown2).pipe(optional3),
  time: Struct({ created: DateTimeUtcFromMillis })
};
var Native = Record(String5, Unknown2).annotate({
  identifier: "Session.Message.Native"
});
var AgentSelected = Struct({
  ...Base,
  type: tag("agent-switched"),
  agent: ID8,
  previous: ID8.pipe(optional3)
}).annotate({ identifier: "Session.Message.AgentSelected" });
var ModelSelected = Struct({
  ...Base,
  type: tag("model-switched"),
  model: Ref3,
  previous: Ref3.pipe(optional3)
}).annotate({ identifier: "Session.Message.ModelSelected" });
var LocationSwitched = Struct({
  ...Base,
  type: tag("location-switched"),
  location: Ref,
  projectID: ID11.pipe(optional3),
  subpath: RelativePath.pipe(optional3),
  previous: Struct({
    location: Ref,
    projectID: ID11.pipe(optional3),
    subpath: RelativePath.pipe(optional3)
  }).pipe(optional3)
}).annotate({ identifier: "Session.Message.LocationSwitched" });
var User = Struct({
  ...Base,
  text: Prompt.fields.text,
  files: Prompt.fields.files,
  agents: Prompt.fields.agents,
  skills: Prompt.fields.skills,
  type: tag("user")
}).annotate({ identifier: "Session.Message.User" });
var MediaUser = Struct({
  ...User.fields,
  files: ArraySchema(Attachment).pipe(optional3)
}).annotate({ identifier: "Session.Message.MediaUser" });
var Synthetic = Struct({
  ...Base,
  text: String5,
  description: String5.pipe(optional3),
  type: tag("synthetic")
}).annotate({ identifier: "Session.Message.Synthetic" });
var System = Struct({
  ...Base,
  type: tag("system"),
  text: String5,
  description: String5.pipe(optional3)
}).annotate({ identifier: "Session.Message.System" });
var Skill = Struct({
  ...Base,
  type: tag("skill"),
  skill: ID12,
  name: Name2,
  text: String5
}).annotate({ identifier: "Session.Message.Skill" });
var Shell = Struct({
  ...Base,
  type: tag("shell"),
  shellID: ID13,
  command: String5,
  status: Status3,
  exit: Number5.pipe(optional3),
  output: Output.pipe(optional3),
  time: Struct({
    created: DateTimeUtcFromMillis,
    completed: DateTimeUtcFromMillis.pipe(optional3)
  })
}).annotate({ identifier: "Session.Message.Shell" });
var ToolStateStreaming = Struct({
  status: tag("streaming"),
  input: String5
}).annotate({ identifier: "Session.Message.ToolState.Streaming" });
var ToolStateRunning = Struct({
  status: tag("running"),
  input: Record(String5, Unknown2),
  metadata: Record(String5, Json2)
}).annotate({ identifier: "Session.Message.ToolState.Running" });
var ToolStateCompleted = Struct({
  status: tag("completed"),
  input: Record(String5, Unknown2),
  content: NonEmptyArray(Content2),
  metadata: Record(String5, Json2).pipe(optional3)
}).annotate({ identifier: "Session.Message.ToolState.Completed" });
var ToolStateError = Struct({
  status: tag("error"),
  input: Record(String5, Unknown2),
  error: Error5,
  content: NonEmptyArray(Content2).pipe(optional3),
  metadata: Record(String5, Json2).pipe(optional3)
}).annotate({ identifier: "Session.Message.ToolState.Error" });
var ToolState = Union2([ToolStateStreaming, ToolStateRunning, ToolStateCompleted, ToolStateError]).pipe(toTaggedUnion("status"));
var AssistantTool = Struct({
  type: tag("tool"),
  id: String5,
  name: String5,
  executed: Boolean3.pipe(optional3),
  native: Native.pipe(optional3),
  state: ToolState,
  time: Struct({
    created: DateTimeUtcFromMillis,
    ran: DateTimeUtcFromMillis.pipe(optional3),
    completed: DateTimeUtcFromMillis.pipe(optional3)
  })
}).annotate({ identifier: "Session.Message.Assistant.Tool" });
var AssistantText = Struct({
  type: tag("text"),
  text: String5,
  native: Native.pipe(optional3)
}).annotate({ identifier: "Session.Message.Assistant.Text" });
var AssistantReasoning = Struct({
  type: tag("reasoning"),
  text: String5,
  native: Native.pipe(optional3),
  time: Struct({
    created: DateTimeUtcFromMillis,
    completed: DateTimeUtcFromMillis.pipe(optional3)
  }).pipe(optional3)
}).annotate({ identifier: "Session.Message.Assistant.Reasoning" });
var AssistantContent = Union2([AssistantText, AssistantReasoning, AssistantTool]).pipe(toTaggedUnion("type"));
var AssistantContentEncoded = toEncoded2(AssistantContent).annotate({
  identifier: "Session.Message.AssistantContent.Encoded"
});
var AssistantRetry = Struct({
  attempt: PositiveInt,
  at: DateTimeUtcFromMillis,
  error: Error5
}).annotate({ identifier: "Session.Message.Assistant.Retry" });
var Assistant = Struct({
  ...Base,
  type: tag("assistant"),
  agent: ID8,
  model: Ref3,
  content: AssistantContent.pipe(ArraySchema),
  snapshot: Struct({
    start: ID14.pipe(optional3),
    end: ID14.pipe(optional3),
    files: ArraySchema(RelativePath).pipe(optional3)
  }).pipe(optional3),
  finish: FinishReason.pipe(optional3),
  rawFinish: String5.pipe(optional3),
  native: Native.pipe(optional3),
  cost: USD.pipe(optional3),
  tokens: Info14.pipe(optional3),
  error: Error5.pipe(optional3),
  retry: AssistantRetry.pipe(optional3),
  time: Struct({
    created: DateTimeUtcFromMillis,
    streamed: DateTimeUtcFromMillis.pipe(optional3),
    completed: DateTimeUtcFromMillis.pipe(optional3)
  })
}).annotate({ identifier: "Session.Message.Assistant" });
var CompactionBase = { type: tag("compaction"), ...Base };
var CompactionUsage = {
  cost: USD.pipe(optional3),
  tokens: Info14.pipe(optional3)
};
var CompactionRunning = Struct({
  ...CompactionBase,
  status: tag("running"),
  reason: Literals(["auto", "manual"]),
  summary: String5
}).annotate({ identifier: "Session.Message.Compaction.Running" });
var CompactionCompleted = Struct({
  ...CompactionBase,
  status: tag("completed"),
  reason: Literals(["auto", "manual"]),
  model: Ref3.pipe(optional3),
  native: Native.pipe(optional3),
  summary: String5,
  ...CompactionUsage
}).annotate({ identifier: "Session.Message.Compaction.Completed" });
var CompactionFailed = Struct({
  ...CompactionBase,
  status: tag("failed"),
  reason: Literals(["auto", "manual"]),
  error: Error5,
  ...CompactionUsage
}).annotate({ identifier: "Session.Message.Compaction.Failed" });
var Compaction2 = Union2([CompactionRunning, CompactionCompleted, CompactionFailed]).pipe(toTaggedUnion("status"), annotate2({ identifier: "Session.Message.Compaction" }));
var Idle = Struct({
  ...Base,
  type: tag("idle"),
  outcome: Literals(["succeeded", "failed", "interrupted"]),
  error: Error5.pipe(optional3)
}).annotate({ identifier: "Session.Message.Idle" });
var Info15 = Union2([
  AgentSelected,
  ModelSelected,
  LocationSwitched,
  User,
  Synthetic,
  System,
  Skill,
  Shell,
  Assistant,
  Compaction2,
  Idle
]).annotate({ identifier: "Session.Message.Info" });
var MediaInfo = Union2([
  AgentSelected,
  ModelSelected,
  LocationSwitched,
  MediaUser,
  Synthetic,
  System,
  Skill,
  Shell,
  Assistant,
  Compaction2,
  Idle
]).annotate({ identifier: "Session.Message.MediaInfo" });
// node_modules/@opencode/schema/dist/file-diff.js
var Info16 = Struct({
  file: String5,
  patch: String5,
  additions: NonNegativeInt,
  deletions: NonNegativeInt,
  status: Literals(["added", "deleted", "modified"]),
  more: Literal2(true).pipe(optional3)
}).annotate({ identifier: "FileDiff.Info" });
var LegacyInfo = Struct({
  file: String5.pipe(optional3),
  patch: String5.pipe(optional3),
  additions: Finite,
  deletions: Finite,
  status: Literals(["added", "deleted", "modified"]).pipe(optional3)
}).annotate({ identifier: "FileDiff.LegacyInfo" });

// node_modules/@opencode/schema/dist/session-revert.js
var Revert = Struct({
  messageID: ID15,
  partID: String5.pipe(optional3),
  snapshot: ID14.pipe(optional3),
  files: ArraySchema(Info16).pipe(optional3)
}).annotate({ identifier: "Session.Revert" });
var FileDiffV1 = Struct({
  path: String5,
  status: Literals(["added", "modified", "deleted"]),
  additions: Finite,
  deletions: Finite,
  patch: String5
});
var RevertV1 = Struct({
  messageID: ID15,
  partID: String5.pipe(optional3),
  snapshot: String5.pipe(optional3),
  diff: String5.pipe(optional3),
  files: ArraySchema(FileDiffV1).pipe(optional3)
}).annotate({ identifier: "Session.RevertV1" });
var PersistedCurrent = Revert.pipe(decodeTo2(Struct({ source: tag("current"), revert: toType2(Revert) }), transform2({
  decode: (revert) => ({
    source: "current",
    revert
  }),
  encode: (value) => value.revert
})));
var PersistedLegacy = RevertV1.pipe(decodeTo2(Struct({ source: tag("legacy"), revert: toType2(RevertV1) }), transform2({
  decode: (revert) => ({
    source: "legacy",
    revert
  }),
  encode: (value) => value.revert
})));
var PersistedRevert = Union2([PersistedCurrent, PersistedLegacy]).pipe(toTaggedUnion("source"), decodeTo2(toType2(Revert), transform2({
  decode: (persisted) => {
    if (persisted.source === "current")
      return persisted.revert;
    return Revert.make({
      messageID: persisted.revert.messageID,
      partID: persisted.revert.partID,
      snapshot: persisted.revert.snapshot ? ID14.make(persisted.revert.snapshot) : undefined,
      files: persisted.revert.files?.map((file) => ({
        file: file.path,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch
      }))
    });
  },
  encode: (revert) => ({
    source: "current",
    revert
  })
})), annotate2({ identifier: "Session.Revert.Persisted" }));
// node_modules/@opencode/schema/dist/instruction.js
var Key2 = String5.check(isPattern2(/^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._/-]*$/u)).pipe(brand("Instruction.Key"), annotate2({ identifier: "Instruction.Key" }));
var Hash = String5.check(isPattern2(/^[a-f0-9]{64}$/u)).pipe(brand("Instruction.Hash"), annotate2({ identifier: "Instruction.Hash" }));
var Values = Record(Key2, Hash);
var Removed = Literal2("removed");
var removed = Removed.make("removed");
var Delta = Record(String5, Union2([Hash, Removed]));
// node_modules/@opencode/schema/dist/instruction-entry.js
var Key3 = String5.check(isPattern2(/^[a-z0-9][a-z0-9._-]*$/u)).annotate({
  identifier: "InstructionEntry.Key",
  description: "Instruction entry key (lowercase alphanumerics plus . _ -)"
});
var Info17 = Struct({
  key: Key3,
  value: Json2.annotate({ description: "JSON value attached to the session's instructions" })
}).annotate({ identifier: "InstructionEntry.Info" });
var Snapshot = ArraySchema(Struct({
  ...Info17.fields,
  removed: Boolean3
})).annotate({ identifier: "InstructionEntry.Snapshot" });
var MaxValueBytes = 256 * 1024;

class ValueTooLargeError extends TaggedError3()("InstructionEntryValueTooLargeError", {
  actualBytes: Int,
  maxBytes: Int,
  message: String5
}, { httpApiStatus: 413 }) {
}
// node_modules/@opencode/schema/dist/session-inbox.js
var Delivery = Literals(["steer", "queue"]).annotate({ identifier: "Session.Inbox.Delivery" });
var UserPayload = Struct({
  ...Prompt.fields,
  metadata: Record(String5, Unknown2).pipe(optional3)
}).annotate({ identifier: "Session.Inbox.UserPayload" });
var MediaUserPayload = Struct({
  ...UserPayload.fields,
  files: ArraySchema(Attachment).pipe(optional3)
}).annotate({ identifier: "Session.Inbox.MediaUserPayload" });
var SyntheticPayload = Struct({
  text: String5,
  description: String5.pipe(optional3),
  metadata: Record(String5, Unknown2).pipe(optional3)
}).annotate({ identifier: "Session.Inbox.SyntheticPayload" });
var CompactionPayload = Struct({}).annotate({ identifier: "Session.Inbox.CompactionPayload" });
var MovePayload = Struct({
  location: Ref,
  projectID: ID11,
  subpath: RelativePath.pipe(optional3)
}).annotate({ identifier: "Session.Inbox.MovePayload" });
var UserItem = Struct({ type: tag("user"), payload: UserPayload, delivery: Delivery });
var SyntheticItem = Struct({ type: tag("synthetic"), payload: SyntheticPayload, delivery: Delivery });
var CompactionItem = Struct({
  type: tag("compaction"),
  payload: CompactionPayload,
  delivery: Delivery
});
var MoveItem = Struct({ type: tag("move"), payload: MovePayload, delivery: Delivery });
var Item = Union2([UserItem, SyntheticItem, CompactionItem, MoveItem]).pipe(toTaggedUnion("type"), annotate2({ identifier: "Session.Inbox.Item" }));
var Enqueued = {
  id: ID15,
  sessionID: SessionID,
  time: Struct({ created: DateTimeUtcFromMillis })
};
var User2 = Struct({ ...Enqueued, ...UserItem.fields }).annotate({ identifier: "Session.Inbox.User" });
var MediaUser2 = Struct({ ...User2.fields, payload: MediaUserPayload }).annotate({
  identifier: "Session.Inbox.MediaUser"
});
var Synthetic2 = Struct({ ...Enqueued, ...SyntheticItem.fields }).annotate({
  identifier: "Session.Inbox.Synthetic"
});
var Compaction3 = Struct({ ...Enqueued, ...CompactionItem.fields }).annotate({
  identifier: "Session.Inbox.Compaction"
});
var Move = Struct({ ...Enqueued, ...MoveItem.fields }).annotate({ identifier: "Session.Inbox.Move" });
var Info18 = Union2([User2, Synthetic2, Compaction3, Move]).pipe(toTaggedUnion("type"), annotate2({ identifier: "Session.Inbox.Info" }));
var MediaInfo2 = Union2([MediaUser2, Synthetic2, Compaction3, Move]).pipe(toTaggedUnion("type"), annotate2({ identifier: "Session.Inbox.MediaInfo" }));
// node_modules/@opencode/schema/dist/session-fork.js
var Boundary = Union2([
  Struct({ type: Literal2("before"), messageID: ID15 }),
  Struct({ type: Literal2("through"), messageID: ID15 })
]).annotate({ identifier: "Session.ForkBoundary" });

// node_modules/@opencode/schema/dist/session-event.js
var Base2 = {
  sessionID: SessionID
};
var options = {
  durable: {
    aggregate: "sessionID",
    version: 1
  }
};
var Created4 = durable({
  type: "session.created",
  ...options,
  schema: {
    ...Base2,
    projectID: ID11,
    location: Ref,
    subpath: RelativePath.pipe(optional3),
    parentID: SessionID.pipe(optional3),
    slug: String5,
    title: String5.pipe(optional3),
    agent: ID8.pipe(optional3),
    model: Ref3.pipe(optional3),
    metadata: SessionMetadata.pipe(optional3),
    permissions: Ruleset.pipe(optional3),
    version: String5
  }
});
var AgentSelected2 = durable({
  type: "session.agent.selected",
  ...options,
  schema: {
    ...Base2,
    agent: ID8,
    previous: ID8.pipe(optional3)
  }
});
var ModelSelected2 = durable({
  type: "session.model.selected",
  ...options,
  schema: {
    ...Base2,
    model: Ref3,
    previous: Ref3.pipe(optional3)
  }
});
var Moved = durable({
  type: "session.moved",
  ...options,
  schema: {
    ...Base2,
    ...MovePayload.fields
  }
});
var Renamed = durable({
  type: "session.renamed",
  ...options,
  schema: {
    ...Base2,
    title: String5
  }
});
var MetadataUpdated = durable({
  type: "session.metadata.updated",
  ...options,
  schema: {
    ...Base2,
    metadata: SessionMetadata
  }
});
var Permissions = durable({
  type: "session.permissions",
  ...options,
  schema: {
    ...Base2,
    permissions: Ruleset
  }
});
var Viewed = durable({
  type: "session.viewed",
  ...options,
  schema: {
    ...Base2,
    idle: Finite
  }
});
var Archived = durable({
  type: "session.archived",
  ...options,
  schema: Base2
});
var Unarchived = durable({
  type: "session.unarchived",
  ...options,
  schema: Base2
});
var MessageContentUpdated = durable({
  type: "session.message.content.updated",
  ...options,
  schema: {
    ...Base2,
    messageID: ID15,
    content: ArraySchema(AssistantContentEncoded)
  }
});
var UsageRecorded = durable({
  type: "session.usage.recorded",
  ...options,
  schema: {
    ...Base2,
    source: Literals(["title", "compaction", "generate"]),
    cost: USD,
    tokens: Info14
  }
});
var UsageUpdated = ephemeral({
  type: "session.usage.updated",
  schema: {
    ...Base2,
    cost: USD,
    tokens: Info14
  }
});
var Deleted3 = durable({
  type: "session.deleted",
  durable: {
    aggregate: "sessionID",
    version: 2
  },
  schema: Base2
});
var Forked = durable({
  type: "session.forked",
  durable: {
    aggregate: "sessionID",
    version: 2
  },
  schema: {
    ...Base2,
    parentID: SessionID,
    boundary: Boundary,
    instructions: Values.pipe(optional3),
    instructionEntries: Snapshot.pipe(optional3)
  }
});
var InboxRef = {
  ...Base2,
  inboxID: ID15
};
var InboxDelivered = durable({
  type: "session.inbox.delivered",
  ...options,
  schema: InboxRef
});
var InboxEnqueued = durable({
  type: "session.inbox.enqueued",
  ...options,
  schema: {
    ...InboxRef,
    item: Item
  }
});
var InboxCancelled = durable({
  type: "session.inbox.cancelled",
  ...options,
  schema: InboxRef
});
var InboxDeliveryChanged = durable({
  type: "session.inbox.delivery.changed",
  ...options,
  schema: { ...InboxRef, delivery: Delivery }
});
var Execution;
(function(Execution) {
  Execution.Started = durable({ type: "session.execution.started", ...options, schema: Base2 });
  Execution.Succeeded = durable({ type: "session.execution.succeeded", ...options, schema: Base2 });
  Execution.Failed = durable({
    type: "session.execution.failed",
    ...options,
    schema: { ...Base2, error: Error5 }
  });
  Execution.Interrupted = durable({
    type: "session.execution.interrupted",
    ...options,
    schema: { ...Base2, reason: Literals(["user", "shutdown", "superseded", "inactivity"]) }
  });
})(Execution || (Execution = {}));
var InstructionsUpdated = durable({
  type: "session.instructions.updated",
  durable: {
    aggregate: "sessionID",
    version: 2
  },
  schema: {
    ...Base2,
    delta: Delta,
    text: String5.pipe(optional3)
  }
});
var Synthetic3 = durable({
  type: "session.synthetic",
  ...options,
  schema: {
    ...Base2,
    text: String5,
    description: String5.pipe(optional3),
    metadata: Record(String5, Unknown2).pipe(optional3)
  }
});
var Skill2;
(function(Skill) {
  Skill.Activated = durable({
    type: "session.skill.activated",
    ...options,
    schema: {
      ...Base2,
      id: ID12,
      name: Name2,
      text: String5
    }
  });
})(Skill2 || (Skill2 = {}));
var Shell2;
(function(Shell) {
  Shell.Started = durable({
    type: "session.shell.started",
    ...options,
    schema: {
      ...Base2,
      shell: Info13
    }
  });
  Shell.Ended = durable({
    type: "session.shell.ended",
    ...options,
    schema: {
      ...Base2,
      shell: Info13,
      output: Output
    }
  });
})(Shell2 || (Shell2 = {}));
var Step;
(function(Step) {
  Step.Started = durable({
    type: "session.step.started",
    ...options,
    schema: {
      ...Base2,
      assistantMessageID: ID15,
      agent: ID8,
      model: Ref3,
      snapshot: ID14.pipe(optional3),
      started: NonNegativeInt
    }
  });
  Step.Streamed = durable({
    type: "session.step.streamed",
    ...options,
    schema: {
      ...Base2,
      assistantMessageID: ID15
    }
  });
  Step.Ended = durable({
    type: "session.step.ended",
    ...options,
    schema: {
      ...Base2,
      assistantMessageID: ID15,
      finish: FinishReason,
      rawFinish: String5.pipe(optional3),
      native: Native.pipe(optional3),
      cost: USD,
      tokens: Info14,
      snapshot: ID14.pipe(optional3),
      files: ArraySchema(RelativePath).pipe(optional3)
    }
  });
  Step.Failed = durable({
    type: "session.step.failed",
    ...options,
    schema: {
      ...Base2,
      assistantMessageID: ID15,
      error: Error5,
      finish: Literals(["content-filter"]).pipe(optional3),
      rawFinish: String5.pipe(optional3),
      native: Native.pipe(optional3),
      cost: USD.pipe(optional3),
      tokens: Info14.pipe(optional3),
      snapshot: ID14.pipe(optional3),
      files: ArraySchema(RelativePath).pipe(optional3)
    }
  });
})(Step || (Step = {}));
var Text;
(function(Text) {
  Text.Started = durable({
    type: "session.text.started",
    ...options,
    schema: {
      ...Base2,
      assistantMessageID: ID15,
      ordinal: NonNegativeInt
    }
  });
  Text.Delta = ephemeral({
    type: "session.text.delta",
    schema: {
      ...Base2,
      assistantMessageID: ID15,
      ordinal: NonNegativeInt,
      delta: String5
    }
  });
  Text.Ended = durable({
    type: "session.text.ended",
    ...options,
    schema: {
      ...Base2,
      assistantMessageID: ID15,
      ordinal: NonNegativeInt,
      text: String5,
      native: Native.pipe(optional3)
    }
  });
})(Text || (Text = {}));
var Reasoning;
(function(Reasoning) {
  Reasoning.Started = durable({
    type: "session.reasoning.started",
    ...options,
    schema: {
      ...Base2,
      assistantMessageID: ID15,
      ordinal: NonNegativeInt,
      native: Native.pipe(optional3)
    }
  });
  Reasoning.Delta = ephemeral({
    type: "session.reasoning.delta",
    schema: {
      ...Base2,
      assistantMessageID: ID15,
      ordinal: NonNegativeInt,
      delta: String5
    }
  });
  Reasoning.Ended = durable({
    type: "session.reasoning.ended",
    ...options,
    schema: {
      ...Base2,
      assistantMessageID: ID15,
      ordinal: NonNegativeInt,
      text: String5,
      native: Native.pipe(optional3)
    }
  });
})(Reasoning || (Reasoning = {}));
var Tool;
(function(Tool) {
  const ToolBase = {
    ...Base2,
    assistantMessageID: ID15,
    id: String5
  };
  let Input;
  (function(Input) {
    Input.Started = durable({
      type: "session.tool.input.started",
      ...options,
      schema: {
        ...ToolBase,
        name: String5
      }
    });
    Input.Delta = ephemeral({
      type: "session.tool.input.delta",
      schema: {
        ...ToolBase,
        delta: String5
      }
    });
    Input.Ended = durable({
      type: "session.tool.input.ended",
      ...options,
      schema: {
        ...ToolBase,
        text: String5
      }
    });
  })(Input = Tool.Input || (Tool.Input = {}));
  Tool.Called = durable({
    type: "session.tool.called",
    ...options,
    schema: {
      ...ToolBase,
      input: Record(String5, Unknown2),
      executed: Boolean3,
      native: Native.pipe(optional3)
    }
  });
  Tool.Progress = ephemeral({
    type: "session.tool.progress",
    schema: {
      ...ToolBase,
      metadata: Record(String5, Json2)
    }
  });
  Tool.Success = durable({
    type: "session.tool.success",
    durable: {
      aggregate: "sessionID",
      version: 2
    },
    schema: {
      ...ToolBase,
      content: NonEmptyArray(Content2),
      metadata: Record(String5, Json2).pipe(optional3),
      executed: Boolean3,
      native: Native.pipe(optional3)
    }
  });
  Tool.Failed = durable({
    type: "session.tool.failed",
    durable: {
      aggregate: "sessionID",
      version: 2
    },
    schema: {
      ...ToolBase,
      error: Error5,
      content: NonEmptyArray(Content2).pipe(optional3),
      metadata: Record(String5, Json2).pipe(optional3),
      executed: Boolean3,
      native: Native.pipe(optional3)
    }
  });
})(Tool || (Tool = {}));
var RetryScheduled = durable({
  type: "session.retry.scheduled",
  ...options,
  schema: {
    ...Base2,
    assistantMessageID: ID15,
    attempt: PositiveInt,
    at: NonNegativeInt,
    error: Error5
  }
});
var Compaction4;
(function(Compaction) {
  Compaction.Started = durable({
    type: "session.compaction.started",
    ...options,
    schema: {
      ...Base2,
      reason: Literals(["auto", "manual"]),
      inputID: ID15.pipe(optional3)
    }
  });
  Compaction.Delta = ephemeral({
    type: "session.compaction.delta",
    schema: {
      ...Base2,
      text: String5
    }
  });
  Compaction.Ended = durable({
    type: "session.compaction.ended",
    ...options,
    schema: {
      ...Base2,
      reason: Compaction.Started.data.fields.reason,
      model: CompactionCompleted.fields.model,
      native: CompactionCompleted.fields.native,
      text: String5,
      cost: CompactionCompleted.fields.cost,
      tokens: CompactionCompleted.fields.tokens
    }
  });
  Compaction.Failed = durable({
    type: "session.compaction.failed",
    ...options,
    schema: {
      ...Base2,
      reason: Compaction.Started.data.fields.reason,
      error: Error5,
      inputID: ID15.pipe(optional3),
      cost: CompactionFailed.fields.cost,
      tokens: CompactionFailed.fields.tokens
    }
  });
})(Compaction4 || (Compaction4 = {}));
var RevertEvent;
(function(RevertEvent) {
  RevertEvent.Staged = durable({
    type: "session.revert.staged",
    ...options,
    schema: { ...Base2, revert: Revert }
  });
  RevertEvent.Cleared = durable({ type: "session.revert.cleared", ...options, schema: Base2 });
  RevertEvent.Committed = durable({
    type: "session.revert.committed",
    ...options,
    schema: { ...Base2, to: ID15 }
  });
})(RevertEvent || (RevertEvent = {}));
var Definitions = inventory(Created4, AgentSelected2, ModelSelected2, Moved, Renamed, MetadataUpdated, Permissions, Viewed, Archived, Unarchived, UsageUpdated, Deleted3, Forked, InboxDelivered, InboxEnqueued, InboxCancelled, InboxDeliveryChanged, Execution.Started, Execution.Succeeded, Execution.Failed, Execution.Interrupted, InstructionsUpdated, Synthetic3, Skill2.Activated, Shell2.Started, Shell2.Ended, Step.Started, Step.Streamed, Step.Ended, Step.Failed, Text.Started, Text.Delta, Text.Ended, Reasoning.Started, Reasoning.Delta, Reasoning.Ended, Tool.Input.Started, Tool.Input.Delta, Tool.Input.Ended, Tool.Called, Tool.Progress, Tool.Success, Tool.Failed, RetryScheduled, Compaction4.Started, Compaction4.Delta, Compaction4.Ended, Compaction4.Failed, RevertEvent.Staged, RevertEvent.Cleared, RevertEvent.Committed);
var DurableDefinitions = inventory(...Definitions.filter((definition) => definition.durability === "durable"), UsageRecorded, MessageContentUpdated);
var EphemeralDefinitions = inventory(...Definitions.filter((definition) => definition.durability === "ephemeral"));
var Durable = Union2(DurableDefinitions, { mode: "oneOf" }).annotate({ identifier: "Session.Event.Durable" }).pipe(toTaggedUnion("type"));
var All = Union2([Durable, ...EphemeralDefinitions], { mode: "oneOf" }).pipe(toTaggedUnion("type"));

// node_modules/@opencode/schema/dist/session.js
var ID16 = SessionID;
var Metadata3 = SessionMetadata;
var ForkBoundary = Boundary;
var Info19 = Struct({
  id: ID16,
  parentID: ID16.pipe(optional3),
  fork: Struct({
    sessionID: ID16,
    boundary: ForkBoundary
  }).pipe(optional3),
  projectID: ID11,
  agent: ID8.pipe(optional3),
  model: Ref3.pipe(optional3),
  cost: USD,
  tokens: Info14,
  outcome: Literals(["succeeded", "failed", "interrupted"]).pipe(optional3),
  time: Struct({
    created: DateTimeUtcFromMillis,
    updated: DateTimeUtcFromMillis,
    busy: DateTimeUtcFromMillis.pipe(optional3),
    idle: DateTimeUtcFromMillis.pipe(optional3),
    viewed: DateTimeUtcFromMillis.pipe(optional3),
    archived: DateTimeUtcFromMillis.pipe(optional3)
  }),
  title: String5.pipe(optional3),
  location: Ref,
  subpath: RelativePath.pipe(optional3),
  metadata: Metadata3.pipe(optional3),
  permissions: Ruleset.pipe(optional3),
  revert: Revert.pipe(optional3)
}).annotate({ identifier: "Session.Info" });
var ListAnchor = Struct({
  id: ID16,
  time: Finite,
  direction: Literals(["previous", "next"])
}).annotate({ identifier: "Session.ListAnchor" });
var ListFilterFields = {
  order: Literals(["asc", "desc"]).pipe(optional2).annotate({
    description: "Session order for the first page. Use desc for newest first or asc for oldest first."
  }),
  search: String5.pipe(optional2),
  parentID: Union2([
    ID16,
    Null2.pipe(encodeTo(Literal2("null"), {
      decode: transform(() => null),
      encode: transform(() => "null")
    }))
  ]).annotate({ description: "Filter by parent session. Use null to return only root sessions." }).pipe(optional2),
  archived: Literals(["true", "false"]).pipe(decodeTo2(Boolean3, {
    decode: transform((value) => value === "true"),
    encode: transform((value) => value ? "true" : "false")
  })).annotate({
    description: "Filter by archive state. Use true to return only archived sessions or false to exclude them. Omit to include both."
  }).pipe(optional2)
};
var ListFilter = Struct({
  ...ListFilterFields,
  directory: AbsolutePath.pipe(optional2),
  project: ID11.pipe(optional2),
  subpath: RelativePath.pipe(optional2)
}).annotate({ identifier: "Session.ListFilter" });
var ListCursorInput = Union2([
  Struct({ ...ListFilterFields, directory: AbsolutePath, anchor: ListAnchor }),
  Struct({
    ...ListFilterFields,
    project: ID11,
    subpath: RelativePath.pipe(optional2),
    anchor: ListAnchor
  }),
  Struct({ ...ListFilterFields, anchor: ListAnchor })
]);
var ListCursorJson = fromJsonString2(ListCursorInput);
var encodeListCursor = encodeSync(ListCursorJson);
var decodeListCursor = decodeUnknownEffect2(ListCursorJson);
var ListCursor = String5.pipe(brand("SessionsCursor"), annotate2({
  identifier: "SessionsCursor",
  description: "Opaque pagination cursor returned as cursor.previous or cursor.next in the previous response."
}), statics((schema) => {
  const make = make6(schema);
  return {
    make: (input) => make(encode2(encodeListCursor(input))),
    parse: (input) => suspend2(() => {
      const result = decodeString(input);
      return isFailure2(result) ? fail5("Invalid cursor") : decodeListCursor(result.success).pipe(mapError2(() => "Invalid cursor"));
    })
  };
}));

// node_modules/@opencode/schema/dist/persistent-pty.js
var Info20 = Struct({
  ...Info10.fields,
  sessionID: ID16,
  userTitle: NullOr(String5),
  foregroundProcess: NullOr(String5),
  size: Struct({ cols: PositiveInt, rows: PositiveInt }),
  output: Struct({ head: NonNegativeInt, tail: NonNegativeInt })
}).annotate({ identifier: "PersistentPty.Info" });
var Handoff = Struct({
  directory: String5,
  instanceID: String5,
  ticket: String5,
  expiresAt: Number5
}).annotate({ identifier: "PersistentPty.Handoff" });
var CreateInput5 = Struct({
  command: optional3(String5),
  args: ArraySchema(String5),
  cwd: optional3(String5),
  title: String5,
  env: Record(String5, String5),
  size: optional3(Struct({ cols: PositiveInt, rows: PositiveInt }))
}).annotate({ identifier: "PersistentPty.CreateInput" });
var UpdateInput4 = Struct({
  attachmentID: optional3(String5),
  size: optional3(Struct({ cols: PositiveInt, rows: PositiveInt })),
  title: optional3(NullOr(String5))
}).annotate({ identifier: "PersistentPty.UpdateInput" });
var Snapshot2 = Struct({
  info: Info20,
  text: String5,
  checkpoint: Uint8Array2,
  cursor: Struct({ x: NonNegativeInt, y: NonNegativeInt })
}).annotate({ identifier: "PersistentPty.Snapshot" });
var ReadLines = PositiveInt.check(isLessThanOrEqualTo3(65535)).annotate({
  identifier: "PersistentPty.ReadLines"
});
var ReadResult = Struct({
  ptyID: ID10,
  title: String5,
  cwd: String5,
  foregroundProcess: NullOr(String5),
  screen: Struct({
    text: String5,
    cols: PositiveInt,
    rows: PositiveInt,
    cursor: Snapshot2.fields.cursor
  })
}).annotate({ identifier: "PersistentPty.ReadResult" });
var Added = ephemeral({ type: "persistent-pty.added", schema: { sessionID: ID16, terminal: Info20 } });
var Removed2 = ephemeral({ type: "persistent-pty.removed", schema: { sessionID: ID16, ptyID: ID10 } });
var Updated11 = ephemeral({ type: "persistent-pty.updated", schema: { sessionID: ID16, terminal: Info20 } });
var Event14 = { Added, Removed: Removed2, Updated: Updated11, Definitions: inventory(Added, Removed2, Updated11) };
// node_modules/@opencode/schema/dist/reference.js
var Updated12 = ephemeral({ type: "reference.updated", schema: {} });
var Event15 = { Updated: Updated12, Definitions: inventory(Updated12) };
var LocalSource = Struct({
  type: Literal2("local"),
  path: AbsolutePath,
  description: String5.pipe(optional3),
  hidden: Boolean3.pipe(optional3)
}).annotate({ identifier: "Reference.LocalSource" });
var GitSource = Struct({
  type: Literal2("git"),
  repository: String5,
  branch: String5.pipe(optional3),
  description: String5.pipe(optional3),
  hidden: Boolean3.pipe(optional3)
}).annotate({ identifier: "Reference.GitSource" });
var Source3 = Union2([LocalSource, GitSource]).pipe(toTaggedUnion("type")).annotate({ identifier: "Reference.Source" });
var Info21 = Struct({
  name: String5,
  path: AbsolutePath,
  description: String5.pipe(optional3),
  hidden: Boolean3.pipe(optional3),
  source: Source3
}).annotate({ identifier: "Reference.Info" });
// node_modules/@opencode/schema/dist/vcs.js
var Branch = Struct({
  current: optional3(String5),
  default: optional3(String5)
}).annotate({ identifier: "Vcs.Branch" });
var Info22 = Struct({
  provider: optional3(String5),
  branch: Branch
}).annotate({ identifier: "Vcs.Info" });
var BranchList = ArraySchema(String5).annotate({ identifier: "Vcs.BranchList" });
var Base3 = Struct({
  name: String5,
  ref: String5,
  source: Literals(["reflog", "default"])
}).annotate({ identifier: "Vcs.Base" });
var Mode = Literals(["working", "branch", "committed"]).annotate({ identifier: "Vcs.Mode" });
var Untracked = Literals(["files", "folders"]).annotate({ identifier: "Vcs.Untracked" });
var FileStatus = Struct({
  file: String5,
  additions: NonNegativeInt,
  deletions: NonNegativeInt,
  status: Literals(["added", "deleted", "modified"])
}).annotate({ identifier: "Vcs.FileStatus" });
// node_modules/@opencode/schema/dist/websearch.js
var ID17 = String5.pipe(brand("WebSearch.ID"), annotate2({ identifier: "WebSearch.ID" }));
var Provider2 = Struct({
  id: ID17,
  name: String5
}).annotate({ identifier: "WebSearch.Provider" });
var Input = Struct({
  query: String5,
  providerID: ID17.pipe(optional3)
}).annotate({ identifier: "WebSearch.Input" });
var Result = Struct({
  url: String5,
  title: String5.pipe(optional3),
  content: String5.pipe(optional3),
  time: Struct({
    published: Finite.pipe(optional3).annotate({
      description: "Publication time in milliseconds since the Unix epoch"
    })
  })
}).annotate({ identifier: "WebSearch.Result" });

class Response extends Class3("WebSearch.Response")({
  providerID: ID17,
  results: ArraySchema(Result)
}) {
}
var Updated13 = ephemeral({
  type: "websearch.updated",
  schema: {}
});
var Event16 = { Updated: Updated13, Definitions: inventory(Updated13) };
// node_modules/@opencode/schema/dist/worktree.js
var StrategyID = Trim.pipe(check(isNonEmpty()), brand("Worktree.StrategyID"));
var CreateInput6 = Struct({
  projectID: ID11,
  from: optional3(AbsolutePath),
  branch: optional3(Trim.pipe(check(isNonEmpty()))),
  directory: optional3(AbsolutePath).annotate({
    description: "Parent directory for the new worktree. Uses the project's canonical configuration, then defaults to the server's data directory under worktree/<first six project ID characters>."
  }),
  name: optional3(String5)
}).annotate({ identifier: "Worktree.CreateInput" });
var RemoveInput = Struct({
  projectID: ID11,
  directory: AbsolutePath,
  force: Boolean3
}).annotate({ identifier: "Worktree.RemoveInput" });
var Info23 = Struct({
  directory: AbsolutePath
}).annotate({ identifier: "Worktree.Info" });
var Directory = Struct({
  directory: AbsolutePath,
  strategy: optional3(String5)
}).annotate({ identifier: "Worktree.Directory" });
var ListEntry = Struct({
  directory: AbsolutePath,
  type: Literals(["root", "worktree"])
}).annotate({ identifier: "Worktree.ListEntry" });

class OperationError extends TaggedError3()("Worktree.OperationError", {
  message: String5,
  forceRequired: optional3(Boolean3)
}) {
}
var List = ArraySchema(Directory).annotate({ identifier: "Worktree.List" });
var Updated14 = ephemeral({
  type: "worktree.updated",
  schema: { projectID: ID11 }
});
var Resolved = durable({
  type: "worktree.resolved",
  durable: { aggregate: "projectID", version: 1 },
  schema: {
    projectID: ID11,
    directory: AbsolutePath,
    previous: ID11,
    adopted: optional3(ArraySchema(ID11))
  }
});
var Event17 = { Updated: Updated14, Resolved, Definitions: inventory(Updated14, Resolved) };
// plugin.ts
import { randomUUID } from "node:crypto";
import { appendFileSync, existsSync as existsSync2, readFileSync } from "node:fs";
import { dirname, join as join2 } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir as tmpdir2 } from "node:os";

// src/driver-resolve.ts
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
var DRIVER_CMD_ENV = "OPENCODE_CUA_DRIVER_CMD";
function whichViaShell(cmd) {
  const probe = spawnSync(process.platform === "win32" ? "where" : "which", [cmd], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 5000
  });
  const out = (probe.stdout ?? "").trim();
  return probe.status === 0 && out ? out.split(/\r?\n/)[0] : undefined;
}
function canonicalCandidates(platform, home = homedir(), localAppData = process.env.LOCALAPPDATA) {
  if (platform === "win32") {
    const lad = localAppData || join(home, "AppData", "Local");
    return [
      join(lad, "Programs", "Cua", "cua-driver", "bin", "cua-driver.exe"),
      join(home, ".local", "bin", "cua-driver.exe"),
      join(home, ".local", "bin", "cua-driver")
    ];
  }
  if (platform === "darwin") {
    return [
      join(home, ".local", "bin", "cua-driver"),
      join(home, ".cargo", "bin", "cua-driver"),
      "/opt/homebrew/bin/cua-driver",
      "/usr/local/bin/cua-driver"
    ];
  }
  return [join(home, ".local", "bin", "cua-driver"), join(home, ".cargo", "bin", "cua-driver"), "/usr/local/bin/cua-driver"];
}
function resolveDriverCmd(input = {}) {
  const env = input.env ?? process.env;
  const platform = input.platform ?? process.platform;
  const which = input.which ?? whichViaShell;
  const exists = input.exists ?? existsSync;
  const override = (env[DRIVER_CMD_ENV] ?? "").trim();
  if (override) {
    if (exists(override) || which(override))
      return { cmd: override, source: "override" };
    return { cmd: null, reason: `${DRIVER_CMD_ENV} is set to "${override}" but no executable exists there; fix or unset it.`, override };
  }
  const onPath = which("cua-driver");
  if (onPath)
    return { cmd: onPath, source: "path" };
  for (const candidate of canonicalCandidates(platform)) {
    if (exists(candidate))
      return { cmd: candidate, source: "canonical" };
  }
  return { cmd: null, reason: "cua-driver is not installed (not on PATH, no canonical install location)." };
}
function userInstallHint(platform = process.platform) {
  const install = platform === "win32" ? "irm https://cua.ai/driver/install.ps1 | iex" : '/bin/bash -c "$(curl -fsSL https://cua.ai/driver/install.sh)"';
  return [
    "cua-driver is a user-installed external binary; this plugin never installs or upgrades it.",
    `Install (also the upgrade command, it always fetches the latest release): ${install}`,
    "After installing, restart opencode so the plugin re-probes. Verify any time with: cua-driver --version"
  ].join(`
`);
}

// src/contract.ts
import { spawnSync as spawnSync2 } from "node:child_process";
var CONTRACT_MIN_VERSION = "0.28.0";
var REQUIRED_SUBCOMMAND_FLAGS = {
  mcp: ["--direct"]
};
function runManifest(cmd, _args, timeoutMs = 20000) {
  try {
    const proc = spawnSync2(cmd, ["manifest"], { encoding: "utf8", windowsHide: true, timeout: timeoutMs });
    if (proc.error)
      return null;
    return { stdout: proc.stdout ?? "", stderr: proc.stderr ?? "", code: proc.status ?? -1 };
  } catch {
    return null;
  }
}
function parseSemver(raw) {
  const m = raw.trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}
function semverAtLeast(actual, floor) {
  const f = parseSemver(floor);
  if (!f)
    return false;
  for (let i = 0;i < 3; i++) {
    if (actual[i] > f[i])
      return true;
    if (actual[i] < f[i])
      return false;
  }
  return true;
}
function manifestContractReason(manifest) {
  if (manifest === null || typeof manifest !== "object")
    return "driver manifest is missing or invalid";
  const versionRaw = String(manifest.binary_version ?? "").trim();
  const version = parseSemver(versionRaw);
  if (!version)
    return "driver manifest does not report a semantic version";
  if (!semverAtLeast(version, CONTRACT_MIN_VERSION)) {
    return `cua-driver ${CONTRACT_MIN_VERSION}+ is required (installed reports ${versionRaw})`;
  }
  const inv = manifest.mcp_invocation;
  const args = inv?.args;
  const command = inv?.command;
  if (!Array.isArray(args) || !args.every((a) => typeof a === "string")) {
    return "driver manifest does not provide an MCP launch command (mcp_invocation.args)";
  }
  if (typeof command !== "string" || !command.trim()) {
    return "driver manifest does not provide an MCP launch command (mcp_invocation.command)";
  }
  const advertised = new Map;
  if (Array.isArray(manifest.subcommands)) {
    for (const sc of manifest.subcommands) {
      if (typeof sc?.name !== "string")
        continue;
      const flags = new Set;
      if (Array.isArray(sc.args)) {
        for (const fa of sc.args) {
          if (typeof fa?.name === "string")
            flags.add(fa.name);
        }
      }
      advertised.set(sc.name, flags);
    }
  }
  const missing = [];
  for (const [name, flags] of Object.entries(REQUIRED_SUBCOMMAND_FLAGS)) {
    const have = advertised.get(name);
    if (!have)
      missing.push(`subcommand ${name}`);
    else
      for (const flag of flags)
        if (!have.has(flag))
          missing.push(`${name} ${flag}`);
  }
  if (missing.length)
    return "driver manifest is missing: " + missing.join(", ");
  return "";
}
function checkContract(resolved, runner = runManifest, platform = process.platform) {
  if (resolved.cmd === null) {
    return { ready: false, resolved: null, version: null, reason: resolved.reason, mcpInvocation: null };
  }
  const out = runner(resolved.cmd, ["manifest"], platform === "win32" ? 20000 : 8000);
  if (!out) {
    return { ready: false, resolved: resolved.cmd, version: null, reason: "`cua-driver manifest` did not run (spawn failure or timeout). If this persists, reinstall with the user install command.", mcpInvocation: null };
  }
  if (out.code !== 0) {
    const tail = (out.stderr || out.stdout || "manifest command failed").trim().split(/\r?\n/).pop() ?? "";
    return { ready: false, resolved: resolved.cmd, version: null, reason: `manifest exited ${out.code}: ${tail.slice(0, 200)}`, mcpInvocation: null };
  }
  const jsonLine = out.stdout.split(/\r?\n/).filter((l) => l.trim().startsWith("{")).pop();
  let manifest = null;
  try {
    const parsed = JSON.parse(jsonLine ?? "");
    manifest = typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    manifest = null;
  }
  const reason = manifestContractReason(manifest);
  const version = manifest ? String(manifest.binary_version ?? "").trim() || null : null;
  const inv = manifest?.mcp_invocation;
  const mcpInvocation = !reason && typeof inv?.command === "string" && Array.isArray(inv.args) ? { command: inv.command, args: inv.args } : null;
  return { ready: reason === "", resolved: resolved.cmd, version, reason, mcpInvocation };
}

// src/mcp-client.ts
import { spawn } from "node:child_process";
var ENV_WHITELIST = [
  "PATH",
  "PATHEXT",
  "ComSpec",
  "SystemRoot",
  "SYSTEMROOT",
  "SystemDrive",
  "SYSTEMDRIVE",
  "windir",
  "WINDIR",
  "LOCALAPPDATA",
  "APPDATA",
  "PROGRAMDATA",
  "TEMP",
  "TMP",
  "HOME",
  "TMPDIR",
  "USERPROFILE",
  "USERNAME",
  "NUMBER_OF_PROCESSORS",
  "PROCESSOR_ARCHITECTURE",
  "OS",
  "XDG_RUNTIME_DIR",
  "XDG_SESSION_TYPE",
  "XDG_SESSION_DESKTOP",
  "XDG_CURRENT_DESKTOP",
  "WAYLAND_DISPLAY",
  "DISPLAY",
  "XAUTHORITY",
  "DBUS_SESSION_BUS_ADDRESS",
  "AT_SPI_BUS_ADDRESS",
  "SWAYSOCK",
  "I3SOCK",
  "NIRI_SOCKET",
  "HYPRLAND_INSTANCE_SIGNATURE",
  "KDE_FULL_SESSION",
  "CUA_DRIVER_RS_ENABLE_WAYLAND",
  "LANG",
  "LC_ALL",
  "LC_CTYPE"
];
function buildChildEnv(extra) {
  const out = {};
  for (const key of ENV_WHITELIST) {
    const v = process.env[key];
    if (typeof v === "string" && v !== "")
      out[key] = v;
  }
  return { ...out, ...extra };
}
function childTransport(cmd, args, env) {
  const child = spawn(cmd, args, {
    env: buildChildEnv(env),
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true
  });
  let lineCb = null;
  let exitCb = null;
  let buf = "";
  const feed = (chunk) => {
    buf += chunk;
    let idx;
    while ((idx = buf.indexOf(`
`)) >= 0) {
      const line = buf.slice(0, idx).replace(/\r$/, "");
      buf = buf.slice(idx + 1);
      if (line.trim() && lineCb)
        lineCb(line);
    }
  };
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", feed);
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (d) => feed(d));
  child.on("exit", (code) => exitCb?.(code ?? null));
  return {
    write: (line) => child.stdin.write(line + `
`),
    pid: () => child.pid,
    onLine: (cb) => {
      lineCb = cb;
    },
    onExit: (cb) => {
      exitCb = cb;
    },
    kill: () => {
      try {
        child.kill();
      } catch {}
    }
  };
}

class McpClient {
  nextId = 1;
  pending = new Map;
  disposed = false;
  transport;
  opts;
  crashed = false;
  serverTools = [];
  serverToolSchemas = {};
  serverInfo = null;
  constructor(transport, opts) {
    this.transport = transport;
    this.opts = opts;
    transport.onLine((line) => this.onLine(line));
    transport.onExit(() => this.onExit());
  }
  onLine(line) {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return;
    }
    if (typeof msg.id !== "number")
      return;
    const entry = this.pending.get(msg.id);
    if (!entry)
      return;
    this.pending.delete(msg.id);
    clearTimeout(entry.timer);
    if (msg.error)
      entry.reject(new Error(String(msg.error.message ?? "MCP error")));
    else
      entry.resolve(msg.result);
  }
  onExit() {
    this.crashed = true;
    for (const [, entry] of this.pending) {
      clearTimeout(entry.timer);
      entry.reject(new Error("cua-driver process exited before responding"));
    }
    this.pending.clear();
  }
  request(method, params, timeoutMs) {
    if (this.disposed)
      return Promise.reject(new Error("MCP client disposed"));
    if (this.crashed)
      return Promise.reject(new Error("cua-driver process has exited; a new one starts on the next call"));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out after ${timeoutMs}ms (the call failed, not the session; retry or re-capture)`));
      }, timeoutMs);
      timer.unref?.();
      this.pending.set(id, { resolve, reject, timer });
      this.transport.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
    });
  }
  notify(method) {
    if (this.disposed || this.crashed)
      return;
    this.transport.write(JSON.stringify({ jsonrpc: "2.0", method }));
  }
  async initialize(timeoutMs = 20000) {
    const result = await this.request("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: this.opts.name, version: this.opts.version }
    }, timeoutMs);
    this.serverInfo = result?.serverInfo ?? null;
    this.notify("notifications/initialized");
    const tools = await this.request("tools/list", {}, timeoutMs);
    const listed = Array.isArray(tools?.tools) ? tools.tools : [];
    this.serverTools = listed.map((t) => String(t?.name ?? "")).filter(Boolean);
    this.serverToolSchemas = Object.fromEntries(listed.filter((t) => typeof t?.name === "string").map((t) => [String(t.name), t.inputSchema ?? {}]));
  }
  missingTools(required) {
    return required.filter((t) => !this.serverTools.includes(t));
  }
  async call(tool, args, timeoutMs) {
    const result = await this.request("tools/call", { name: tool, arguments: args }, timeoutMs ?? this.opts.defaultTimeoutMs ?? 30000);
    return {
      content: Array.isArray(result?.content) ? result.content : [],
      isError: result?.isError === true,
      structured: result?.structuredContent
    };
  }
  dispose() {
    this.disposed = true;
    for (const [, entry] of this.pending) {
      clearTimeout(entry.timer);
      entry.reject(new Error("MCP client disposed"));
    }
    this.pending.clear();
    this.transport.kill();
  }
}

// src/safety.ts
var KEY_ALIASES = {
  command: "cmd",
  control: "ctrl",
  alt: "option",
  "⌘": "cmd",
  "⌥": "option",
  windows: "win",
  super: "win",
  meta: "win",
  delete: "del"
};
var BLOCKED_KEY_COMBOS = [
  ["cmd", "shift", "backspace"],
  ["cmd", "option", "backspace"],
  ["cmd", "ctrl", "q"],
  ["cmd", "shift", "q"],
  ["cmd", "option", "shift", "q"],
  ["win", "l"],
  ["ctrl", "option", "delete"],
  ["ctrl", "option", "del"],
  ["option", "f4"]
];
var BLOCKED_TYPE_PATTERNS = [
  /curl\s+[^|]*\|\s*bash/i,
  /curl\s+[^|]*\|\s*sh/i,
  /wget\s+[^|]*\|\s*bash/i,
  /wget\s+[^|]*\|\s*sh/i,
  /\bsudo\s+rm\s+-[rf]/i,
  /\brm\s+-rf\s+\/\s*$/i,
  /:\s*\(\)\s*\{\s*:\|:\s*&\s*\}/
];
function canonKeyCombo(keys) {
  return keys.split(/[\s+\-]+/).map((part) => part.trim().toLowerCase()).filter(Boolean).map((part) => KEY_ALIASES[part] ?? part);
}
function blockedKeyReason(keys) {
  const combo = canonKeyCombo(keys);
  if (!combo.length)
    return null;
  const set = new Set(combo);
  for (const blocked of BLOCKED_KEY_COMBOS) {
    if (blocked.every((k) => set.has(k))) {
      return `blocked key combo: ${[...blocked].join("+")} — destructive system shortcuts are hard-blocked.`;
    }
  }
  return null;
}
function blockedTypeReason(text) {
  for (const pat of BLOCKED_TYPE_PATTERNS) {
    if (pat.test(text)) {
      return `blocked pattern in type text: ${pat.source} — dangerous shell patterns cannot be typed via computer use.`;
    }
  }
  return null;
}
function inputTargetMismatch(sticky, requestedApp) {
  if (!sticky || !requestedApp)
    return null;
  const current = (sticky.app ?? "").trim().toLowerCase();
  const wanted = requestedApp.trim().toLowerCase();
  if (!current || !wanted)
    return null;
  if (wanted.includes(current) || current.includes(wanted))
    return null;
  return sticky.app;
}
var HINT_VERIFY = "Input was delivered but not confirmed (or proof is missing). Re-capture and check the result BEFORE any retry — do not repeat the input on a recommendation alone.";
function mapVerdict(f) {
  if (f.verified === true || f.effect === "confirmed") {
    return { decision: "done", hint: "Effect confirmed." };
  }
  if (f.effect === "unverifiable") {
    return { decision: "verify_fresh_state", hint: HINT_VERIFY };
  }
  if (f.effect === "suspected_noop" || f.ok === false) {
    return {
      decision: "escalate",
      hint: "The input likely did not land. Climb one rung if the backend recommends it; never predict the rung from the app being Electron/Chromium — react to this signal.",
      ...typeof f.escalation?.recommended === "string" ? { recommended: f.escalation.recommended } : {}
    };
  }
  return { decision: "verify_fresh_state", hint: HINT_VERIFY };
}

// src/session.ts
function driverEnv(env = process.env) {
  const out = { CUA_DRIVER_RS_TELEMETRY_ENABLED: "0" };
  if (env.WAYLAND_DISPLAY && env.CUA_DRIVER_RS_ENABLE_WAYLAND !== "0") {
    out.CUA_DRIVER_RS_ENABLE_WAYLAND = "1";
  }
  return out;
}
var TELEMETRY_ENV = driverEnv();
var REQUIRED_TOOLS = [
  "start_session",
  "end_session",
  "get_window_state",
  "get_desktop_state",
  "get_accessibility_tree",
  "click",
  "double_click",
  "right_click",
  "drag",
  "scroll",
  "type_text",
  "press_key",
  "hotkey",
  "set_value",
  "list_apps",
  "list_windows",
  "bring_to_front"
];
var SNAPSHOT_LRU = 5;
var DEDUP_STREAK_CAP = 2;

class ComputerSession {
  client = null;
  startPromise = null;
  queue = Promise.resolve();
  invocation;
  sessionId;
  deps;
  opts;
  sticky = null;
  restarted = false;
  snapshots = new Map;
  dedup = new Map;
  lastZoom = null;
  constructor(invocation, sessionId, deps = {}, opts = {}) {
    this.invocation = invocation;
    this.sessionId = sessionId;
    this.deps = deps;
    this.opts = opts;
  }
  driverPid;
  spawn() {
    const transport = (this.deps.spawnTransport ?? childTransport)(this.invocation.command, this.invocation.args, TELEMETRY_ENV);
    this.driverPid = transport.pid?.();
    const client = new McpClient(transport, { name: "opencode-computer-use", version: "0.2.0" });
    return client;
  }
  currentDriverPid() {
    return this.driverPid;
  }
  async ensureStarted() {
    if (this.client && !this.client.crashed)
      return;
    if (this.client?.crashed)
      this.startPromise = null;
    if (!this.startPromise) {
      const client = this.spawn();
      this.startPromise = (async () => {
        await client.initialize();
        const missing = client.missingTools(REQUIRED_TOOLS);
        if (missing.length) {
          client.dispose();
          throw new Error(`cua-driver is connected but lacks required MCP tools: ${missing.join(", ")}. The installed driver does not match this plugin's integration; upgrade cua-driver with the user install command and restart opencode. The plugin will not operate partially.`);
        }
        this.client = client;
        this.restarted = true;
        try {
          await client.call("start_session", { session: this.sessionId }, 1e4);
        } catch {}
        try {
          await client.call("set_agent_cursor_enabled", { enabled: this.opts.agentCursor === true }, 1e4);
        } catch {}
      })().catch((err) => {
        this.startPromise = null;
        throw err;
      });
    }
    await this.startPromise;
  }
  acceptsArg(tool, arg) {
    const properties = this.client?.serverToolSchemas[tool]?.properties;
    return properties ? properties[arg] !== undefined : undefined;
  }
  async call(tool, args, timeoutMs) {
    const run = this.queue.then(() => this.doCall(tool, args, timeoutMs), () => this.doCall(tool, args, timeoutMs));
    this.queue = run.catch(() => {});
    return run;
  }
  async doCall(tool, args, timeoutMs) {
    await this.ensureStarted();
    try {
      return await this.client.call(tool, args, timeoutMs);
    } catch (err) {
      if (this.client?.crashed) {
        this.invalidateTarget();
        this.deps.log?.(`driver crashed mid-call: ${err.message}`);
      }
      throw err;
    }
  }
  invalidateTarget() {
    this.sticky = null;
    this.snapshots.clear();
    this.dedup.clear();
    this.lastZoom = null;
  }
  recordSnapshot(windowId, snapshotId, elements) {
    if (!Number.isFinite(windowId) || typeof snapshotId !== "string" || !snapshotId)
      return;
    const tokens = new Map;
    for (const el of elements ?? []) {
      if (typeof el?.element_index === "number" && typeof el?.element_token === "string" && el.element_token) {
        tokens.set(el.element_index, el.element_token);
      }
    }
    this.snapshots.delete(windowId);
    this.snapshots.set(windowId, { snapshotId, tokens });
    while (this.snapshots.size > SNAPSHOT_LRU) {
      const oldest = this.snapshots.keys().next().value;
      if (oldest === undefined)
        break;
      this.snapshots.delete(oldest);
    }
  }
  tokenFor(windowId, elementIndex) {
    const snap = this.snapshots.get(windowId);
    if (!snap)
      return null;
    const token = snap.tokens.get(elementIndex);
    if (!token)
      return null;
    return { snapshotId: snap.snapshotId, elementToken: token };
  }
  shouldAttachScreenshot(windowId, imageData) {
    const hash = `${imageData.length}:${imageData.slice(0, 48)}:${imageData.slice(-48)}`;
    const prev = this.dedup.get(windowId);
    if (prev && prev.hash === hash && prev.omittedStreak < DEDUP_STREAK_CAP) {
      this.dedup.set(windowId, { hash, omittedStreak: prev.omittedStreak + 1 });
      return { attach: false, unchanged: true };
    }
    this.dedup.set(windowId, { hash, omittedStreak: 0 });
    return { attach: true, unchanged: false };
  }
  noteScreenshotOmitted(windowId) {
    if (windowId === undefined)
      return;
  }
  recordZoom(windowId, region) {
    this.lastZoom = { windowId, region };
  }
  zoomContextFor(windowId) {
    return this.lastZoom && this.lastZoom.windowId === windowId ? this.lastZoom.region : null;
  }
  dispose() {
    const client = this.client;
    this.startPromise = null;
    this.client = null;
    this.invalidateTarget();
    if (client && !client.crashed && !client.disposed) {
      client.call("end_session", {}, 1e4).catch(() => {}).finally(() => client.dispose());
      return;
    }
    client?.dispose();
  }
}
function targetRefusal(sticky, requestedApp) {
  const mismatch = inputTargetMismatch(sticky, requestedApp);
  if (mismatch === null)
    return null;
  return `input_target_mismatch: this action would go to the current target ${JSON.stringify(mismatch)}, not ${JSON.stringify(requestedApp)} — input always hits the sticky target from the last capture/focus_app. Call capture(app=...) or focus_app first, then retry.`;
}

// node_modules/zod/v4/core/core.js
var NEVER = Object.freeze({
  status: "aborted"
});
function $constructor(name, initializer, params) {
  function init(inst, def) {
    var _a;
    Object.defineProperty(inst, "_zod", {
      value: inst._zod ?? {},
      enumerable: false
    });
    (_a = inst._zod).traits ?? (_a.traits = new Set);
    inst._zod.traits.add(name);
    initializer(inst, def);
    for (const k in _.prototype) {
      if (!(k in inst))
        Object.defineProperty(inst, k, { value: _.prototype[k].bind(inst) });
    }
    inst._zod.constr = _;
    inst._zod.def = def;
  }
  const Parent = params?.Parent ?? Object;

  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    var _a;
    const inst = params?.Parent ? new Definition : this;
    init(inst, def);
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    for (const fn of inst._zod.deferred) {
      fn();
    }
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
var $brand = Symbol("zod_brand");

class $ZodAsyncError extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
}

class $ZodEncodeError extends Error {
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
}
var globalConfig = {};
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}
// node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
function cached2(getter) {
  const set = false;
  return {
    get value() {
      if (!set) {
        const value = getter();
        Object.defineProperty(this, "value", { value });
        return value;
      }
      throw new Error("cached value already set");
    }
  };
}
function nullish(input) {
  return input === null || input === undefined;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepString = step.toString();
  let stepDecCount = (stepString.split(".")[1] || "").length;
  if (stepDecCount === 0 && /\d?e-\d?/.test(stepString)) {
    const match = stepString.match(/\d?e-(\d?)/);
    if (match?.[1]) {
      stepDecCount = Number.parseInt(match[1]);
    }
  }
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var EVALUATING = Symbol("evaluating");
function defineLazy(object, key, getter) {
  let value = undefined;
  Object.defineProperty(object, key, {
    get() {
      if (value === EVALUATING) {
        return;
      }
      if (value === undefined) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v) {
      Object.defineProperty(object, key, {
        value: v
      });
    },
    configurable: true
  });
}
function objectClone(obj) {
  return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
  return JSON.stringify(str);
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject2(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = cached2(() => {
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject2(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === undefined)
    return true;
  const prot = ctor.prototype;
  if (isObject2(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function shallowClone(o) {
  if (isPlainObject(o))
    return { ...o };
  if (Array.isArray(o))
    return [...o];
  return o;
}
var propertyKeyTypes = new Set(["string", "number", "symbol"]);
var primitiveTypes = new Set(["string", "number", "bigint", "boolean", "symbol", "undefined"]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== undefined) {
    if (params?.error !== undefined)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
  });
}
var NUMBER_FORMAT_RANGES = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-340282346638528860000000000000000000000, 340282346638528860000000000000000000000],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
function pick2(schema, mask) {
  const currDef = schema._zod.def;
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const newShape = {};
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key}"`);
        }
        if (!mask[key])
          continue;
        newShape[key] = currDef.shape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema, def);
}
function omit3(schema, mask) {
  const currDef = schema._zod.def;
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const newShape = { ...schema._zod.def.shape };
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key}"`);
        }
        if (!mask[key])
          continue;
        delete newShape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema, def);
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const checks = schema._zod.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error("Object schemas containing refinements cannot be extended. Use `.safeExtend()` instead.");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    checks: []
  });
  return clone(schema, def);
}
function safeExtend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  const def = {
    ...schema._zod.def,
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    checks: schema._zod.def.checks
  };
  return clone(schema, def);
}
function merge2(a, b) {
  const def = mergeDefs(a._zod.def, {
    get shape() {
      const _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: []
  });
  return clone(a, def);
}
function partial(Class, schema, mask) {
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const oldShape = schema._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in oldShape)) {
            throw new Error(`Unrecognized key: "${key}"`);
          }
          if (!mask[key])
            continue;
          shape[key] = Class ? new Class({
            type: "optional",
            innerType: oldShape[key]
          }) : oldShape[key];
        }
      } else {
        for (const key in oldShape) {
          shape[key] = Class ? new Class({
            type: "optional",
            innerType: oldShape[key]
          }) : oldShape[key];
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    },
    checks: []
  });
  return clone(schema, def);
}
function required(Class, schema, mask) {
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const oldShape = schema._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in shape)) {
            throw new Error(`Unrecognized key: "${key}"`);
          }
          if (!mask[key])
            continue;
          shape[key] = new Class({
            type: "nonoptional",
            innerType: oldShape[key]
          });
        }
      } else {
        for (const key in oldShape) {
          shape[key] = new Class({
            type: "nonoptional",
            innerType: oldShape[key]
          });
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    },
    checks: []
  });
  return clone(schema, def);
}
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex;i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a;
    (_a = iss).path ?? (_a.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config) {
  const full = { ...iss, path: iss.path ?? [] };
  if (!iss.message) {
    const message = unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
    full.message = message;
  }
  delete full.inst;
  delete full.continue;
  if (!ctx?.reportInput) {
    delete full.input;
  }
  return full;
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}

// node_modules/zod/v4/core/errors.js
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  Object.defineProperty(inst, "_zod", {
    value: inst._zod,
    enumerable: false
  });
  Object.defineProperty(inst, "issues", {
    value: def,
    enumerable: false
  });
  inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
  Object.defineProperty(inst, "toString", {
    value: () => inst.message,
    enumerable: false
  });
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, { Parent: Error });
function flattenError(error, mapper = (issue) => issue.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error.issues) {
    if (sub.path.length > 0) {
      fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
      fieldErrors[sub.path[0]].push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error, _mapper) {
  const mapper = _mapper || function(issue) {
    return issue.message;
  };
  const fieldErrors = { _errors: [] };
  const processError = (error) => {
    for (const issue of error.issues) {
      if (issue.code === "invalid_union" && issue.errors.length) {
        issue.errors.map((issues) => processError({ issues }));
      } else if (issue.code === "invalid_key") {
        processError({ issues: issue.issues });
      } else if (issue.code === "invalid_element") {
        processError({ issues: issue.issues });
      } else if (issue.path.length === 0) {
        fieldErrors._errors.push(mapper(issue));
      } else {
        let curr = fieldErrors;
        let i = 0;
        while (i < issue.path.length) {
          const el = issue.path[i];
          const terminal = i === issue.path.length - 1;
          if (!terminal) {
            curr[el] = curr[el] || { _errors: [] };
          } else {
            curr[el] = curr[el] || { _errors: [] };
            curr[el]._errors.push(mapper(issue));
          }
          curr = curr[el];
          i++;
        }
      }
    }
  };
  processError(error);
  return fieldErrors;
}

// node_modules/zod/v4/core/parse.js
var _parse = (_Err) => (schema, value, _ctx, _params) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: false }) : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError;
  }
  if (result.issues.length) {
    const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, _params?.callee);
    throw e;
  }
  return result.value;
};
var _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  if (result.issues.length) {
    const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, params?.callee);
    throw e;
  }
  return result.value;
};
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError;
  }
  return result.issues.length ? {
    success: false,
    error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
var safeParse = /* @__PURE__ */ _safeParse($ZodRealError);
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? {
    success: false,
    error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
var safeParseAsync = /* @__PURE__ */ _safeParseAsync($ZodRealError);
var _encode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
  return _parse(_Err)(schema, value, ctx);
};
var _decode = (_Err) => (schema, value, _ctx) => {
  return _parse(_Err)(schema, value, _ctx);
};
var _encodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
  return _parseAsync(_Err)(schema, value, ctx);
};
var _decodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _parseAsync(_Err)(schema, value, _ctx);
};
var _safeEncode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
  return _safeParse(_Err)(schema, value, ctx);
};
var _safeDecode = (_Err) => (schema, value, _ctx) => {
  return _safeParse(_Err)(schema, value, _ctx);
};
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
  return _safeParseAsync(_Err)(schema, value, ctx);
};
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _safeParseAsync(_Err)(schema, value, _ctx);
};
// node_modules/zod/v4/core/regexes.js
var cuid = /^[cC][^\s-]{8,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
var uuid = (version) => {
  if (!version)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
var email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji() {
  return new RegExp(_emoji, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^[A-Za-z0-9_-]*$/;
var hostname = /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/;
var e164 = /^\+(?:[0-9]){6,14}[0-9]$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
var date = /* @__PURE__ */ new RegExp(`^${dateSource}$`);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
  const time = timeSource({ precision: args.precision });
  const opts = ["Z"];
  if (args.local)
    opts.push("");
  if (args.offset)
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  const timeRegex = `${time}(?:${opts.join("|")})`;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var string3 = (params) => {
  const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
  return new RegExp(`^${regex}$`);
};
var integer = /^-?\d+$/;
var number3 = /^-?\d+(?:\.\d+)?/;
var boolean2 = /^(?:true|false)$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;

// node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a = inst._zod).onattach ?? (_a.onattach = []);
});
var numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
var $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
    if (def.value < curr) {
      if (def.inclusive)
        bag.maximum = def.value;
      else
        bag.exclusiveMaximum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
    if (def.value > curr) {
      if (def.inclusive)
        bag.minimum = def.value;
      else
        bag.exclusiveMinimum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst) => {
    var _a;
    (_a = inst._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
  });
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.format = def.format;
    bag.minimum = minimum;
    bag.maximum = maximum;
    if (isInt)
      bag.pattern = integer;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          continue: false,
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inst
      });
    }
  };
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== undefined;
  });
  inst._zod.onattach.push((inst) => {
    const curr = inst._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    if (def.maximum < curr)
      inst._zod.bag.maximum = def.maximum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== undefined;
  });
  inst._zod.onattach.push((inst) => {
    const curr = inst._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    if (def.minimum > curr)
      inst._zod.bag.minimum = def.minimum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== undefined;
  });
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.minimum = def.length;
    bag.maximum = def.length;
    bag.length = def.length;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a, _b;
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.format = def.format;
    if (def.pattern) {
      bag.patterns ?? (bag.patterns = new Set);
      bag.patterns.add(def.pattern);
    }
  });
  if (def.pattern)
    (_a = inst._zod).check ?? (_a.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {});
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.patterns ?? (bag.patterns = new Set);
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.patterns ?? (bag.patterns = new Set);
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.patterns ?? (bag.patterns = new Set);
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});

// node_modules/zod/v4/core/doc.js
class Doc {
  constructor(args = []) {
    this.content = [];
    this.indent = 0;
    if (this)
      this.args = args;
  }
  indented(fn) {
    this.indent += 1;
    fn(this);
    this.indent -= 1;
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split(`
`).filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const args = this?.args;
    const content = this?.content ?? [``];
    const lines = [...content.map((x) => `  ${x}`)];
    return new F(...args, lines.join(`
`));
  }
}

// node_modules/zod/v4/core/versions.js
var version = {
  major: 4,
  minor: 1,
  patch: 8
};

// node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const checks = [...inst._zod.def.checks ?? []];
  if (inst._zod.traits.has("$ZodCheck")) {
    checks.unshift(inst);
  }
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks, ctx) => {
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks) {
        if (ch._zod.def.when) {
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError;
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError;
        return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary) => {
            return handleCanaryResult(canary, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError;
        return result.then((result) => runChecks(result, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
  inst["~standard"] = {
    validate: (value) => {
      try {
        const r = safeParse(inst, value);
        return r.success ? { value: r.data } : { issues: r.error?.issues };
      } catch (_) {
        return safeParseAsync(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
      }
    },
    vendor: "zod",
    version: 1
  };
});
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string3(inst._zod.bag);
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_) {}
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
var $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
var $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === undefined)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
var $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
var $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const trimmed = payload.value.trim();
      const url = new URL(trimmed);
      if (def.hostname) {
        def.hostname.lastIndex = 0;
        if (!def.hostname.test(url.hostname)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid hostname",
            pattern: hostname.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.protocol) {
        def.protocol.lastIndex = 0;
        if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid protocol",
            pattern: def.protocol.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.normalize) {
        payload.value = url.href;
      } else {
        payload.value = trimmed;
      }
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  def.pattern ?? (def.pattern = nanoid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
var $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
var $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  $ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration);
  $ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.format = `ipv4`;
  });
});
var $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.format = `ipv6`;
  });
  inst._zod.check = (payload) => {
    try {
      new URL(`http://[${payload.value}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
var $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    const parts = payload.value.split("/");
    try {
      if (parts.length !== 2)
        throw new Error;
      const [address, prefix] = parts;
      if (!prefix)
        throw new Error;
      const prefixNum = Number(prefix);
      if (`${prefixNum}` !== prefix)
        throw new Error;
      if (prefixNum < 0 || prefixNum > 128)
        throw new Error;
      new URL(`http://[${address}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64);
  $ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst) => {
    inst._zod.bag.contentEncoding = "base64";
  });
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function isValidBase64URL(data) {
  if (!base64url.test(data))
    return false;
  const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return isValidBase64(padded);
}
var $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64url);
  $ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst) => {
    inst._zod.bag.contentEncoding = "base64url";
  });
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = inst._zod.bag.pattern ?? number3;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {}
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : undefined : undefined;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean2;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {}
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = Array(input.length);
    const proms = [];
    for (let i = 0;i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result) => handleArrayResult(result, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handlePropertyResult(result, final, key, input) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (result.value === undefined) {
    if (key in input) {
      final.value[key] = undefined;
    }
  } else {
    final.value[key] = result.value;
  }
}
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  for (const k of keys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    keys,
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx, def, inst) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  for (const key of Object.keys(input)) {
    if (keySet.has(key))
      continue;
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r) => handlePropertyResult(r, payload, key, input)));
    } else {
      handlePropertyResult(r, payload, key, input);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const _normalized = cached2(() => normalizeDef(def));
  defineLazy(inst._zod, "propValues", () => {
    const shape = def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        propValues[key] ?? (propValues[key] = new Set);
        for (const v of field.values)
          propValues[key].add(v);
      }
    }
    return propValues;
  });
  const isObject = isObject2;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = {};
    const proms = [];
    const shape = value.shape;
    for (const key of value.keys) {
      const el = shape[key];
      const r = el._zod.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r) => handlePropertyResult(r, payload, key, input)));
      } else {
        handlePropertyResult(r, payload, key, input);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
  };
});
var $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
  $ZodObject.init(inst, def);
  const superParse = inst._zod.parse;
  const _normalized = cached2(() => normalizeDef(def));
  const generateFastpass = (shape) => {
    const doc = new Doc(["shape", "payload", "ctx"]);
    const normalized = _normalized.value;
    const parseStr = (key) => {
      const k = esc(key);
      return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    };
    doc.write(`const input = payload.value;`);
    const ids = Object.create(null);
    let counter = 0;
    for (const key of normalized.keys) {
      ids[key] = `key_${counter++}`;
    }
    doc.write(`const newResult = {};`);
    for (const key of normalized.keys) {
      const id = ids[key];
      const k = esc(key);
      doc.write(`const ${id} = ${parseStr(key)};`);
      doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    const fn = doc.compile();
    return (payload, ctx) => fn(shape, payload, ctx);
  };
  let fastpass;
  const isObject = isObject2;
  const jit = !globalConfig.jitless;
  const allowsEval2 = allowsEval;
  const fastEnabled = jit && allowsEval2.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
      if (!catchall)
        return payload;
      return handleCatchall([], input, payload, ctx, value, inst);
    }
    return superParse(payload, ctx);
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : undefined);
  defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : undefined);
  defineLazy(inst._zod, "values", () => {
    if (def.options.every((o) => o._zod.values)) {
      return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return;
  });
  defineLazy(inst._zod, "pattern", () => {
    if (def.options.every((o) => o._zod.pattern)) {
      const patterns = def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return;
  });
  const single = def.options.length === 1;
  const first = def.options[0]._zod.run;
  inst._zod.parse = (payload, ctx) => {
    if (single) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results) => {
      return handleUnionResults(results, payload, inst, ctx);
    });
  };
});
var $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left, right]) => {
        return handleIntersectionResults(payload, left, right);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0;index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  if (left.issues.length) {
    result.issues.push(...left.issues);
  }
  if (right.issues.length) {
    result.issues.push(...right.issues);
  }
  if (aborted(result))
    return result;
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    throw new Error(`Unmergable intersection. Error path: ` + `${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    if (def.keyType._zod.values) {
      const values = def.keyType._zod.values;
      payload.value = {};
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result) => {
              if (result.issues.length) {
                payload.issues.push(...prefixIssues(key, result.issues));
              }
              payload.value[key] = result.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[key] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!values.has(key)) {
          unrecognized = unrecognized ?? [];
          unrecognized.push(key);
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized
        });
      }
    } else {
      payload.value = {};
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        if (keyResult.issues.length) {
          payload.issues.push({
            code: "invalid_key",
            origin: "record",
            issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
            input: key,
            path: [key],
            inst
          });
          payload.value[keyResult.value] = keyResult.value;
          continue;
        }
        const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result) => {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[keyResult.value] = result.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[keyResult.value] = result.value;
        }
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    const _out = def.transform(payload.value, payload);
    if (ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output) => {
        payload.value = output;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError;
    }
    payload.value = _out;
    return payload;
  };
});
function handleOptionalResult(result, input) {
  if (result.issues.length && input === undefined) {
    return { issues: [], value: undefined };
  }
  return result;
}
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.optout = "optional";
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? new Set([...def.innerType._zod.values, undefined]) : undefined;
  });
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    if (def.innerType._zod.optin === "optional") {
      const result = def.innerType._zod.run(payload, ctx);
      if (result instanceof Promise)
        return result.then((r) => handleOptionalResult(r, payload.value));
      return handleOptionalResult(result, payload.value);
    }
    if (payload.value === undefined) {
      return payload;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : undefined;
  });
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? new Set([...def.innerType._zod.values, null]) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === undefined) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result) => handleDefaultResult(result, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === undefined) {
    payload.value = def.defaultValue;
  }
  return payload;
}
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === undefined) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => {
    const v = def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== undefined)) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result) => handleNonOptionalResult(result, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === undefined) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result) => {
        payload.value = result.value;
        if (result.issues.length) {
          payload.value = def.catchValue({
            ...payload,
            error: {
              issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
            },
            input: payload.value
          });
          payload.issues = [];
        }
        return payload;
      });
    }
    payload.value = result.value;
    if (result.issues.length) {
      payload.value = def.catchValue({
        ...payload,
        error: {
          issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
        },
        input: payload.value
      });
      payload.issues = [];
    }
    return payload;
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => def.in._zod.values);
  defineLazy(inst._zod, "optin", () => def.in._zod.optin);
  defineLazy(inst._zod, "optout", () => def.out._zod.optout);
  defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right) => handlePipeResult(right, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left) => handlePipeResult(left, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});
function handlePipeResult(left, next, ctx) {
  if (left.issues.length) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues }, ctx);
}
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  payload.value = Object.freeze(payload.value);
  return payload;
}
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r) => handleRefineResult(r, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      path: [...inst._zod.def.path ?? []],
      continue: !inst._zod.def.abort
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}
// node_modules/zod/v4/core/registries.js
var $output = Symbol("ZodOutput");
var $input = Symbol("ZodInput");

class $ZodRegistry {
  constructor() {
    this._map = new WeakMap;
    this._idmap = new Map;
  }
  add(schema, ..._meta) {
    const meta = _meta[0];
    this._map.set(schema, meta);
    if (meta && typeof meta === "object" && "id" in meta) {
      if (this._idmap.has(meta.id)) {
        throw new Error(`ID ${meta.id} already exists in the registry`);
      }
      this._idmap.set(meta.id, schema);
    }
    return this;
  }
  clear() {
    this._map = new WeakMap;
    this._idmap = new Map;
    return this;
  }
  remove(schema) {
    const meta = this._map.get(schema);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.delete(meta.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      const f = { ...pm, ...this._map.get(schema) };
      return Object.keys(f).length ? f : undefined;
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
}
function registry() {
  return new $ZodRegistry;
}
var globalRegistry = /* @__PURE__ */ registry();
// node_modules/zod/v4/core/api.js
function _string(Class, params) {
  return new Class({
    type: "string",
    ...normalizeParams(params)
  });
}
function _email(Class, params) {
  return new Class({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _guid(Class, params) {
  return new Class({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuid(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuidv4(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
function _uuidv6(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
function _uuidv7(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
function _url(Class, params) {
  return new Class({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _emoji2(Class, params) {
  return new Class({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _nanoid(Class, params) {
  return new Class({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid(Class, params) {
  return new Class({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid2(Class, params) {
  return new Class({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ulid(Class, params) {
  return new Class({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _xid(Class, params) {
  return new Class({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ksuid(Class, params) {
  return new Class({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv4(Class, params) {
  return new Class({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv6(Class, params) {
  return new Class({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv4(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv6(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64(Class, params) {
  return new Class({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64url(Class, params) {
  return new Class({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _e164(Class, params) {
  return new Class({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _jwt(Class, params) {
  return new Class({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _isoDateTime(Class, params) {
  return new Class({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDate(Class, params) {
  return new Class({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _isoTime(Class, params) {
  return new Class({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDuration(Class, params) {
  return new Class({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _number(Class, params) {
  return new Class({
    type: "number",
    checks: [],
    ...normalizeParams(params)
  });
}
function _int(Class, params) {
  return new Class({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
function _boolean(Class, params) {
  return new Class({
    type: "boolean",
    ...normalizeParams(params)
  });
}
function _unknown(Class) {
  return new Class({
    type: "unknown"
  });
}
function _never(Class, params) {
  return new Class({
    type: "never",
    ...normalizeParams(params)
  });
}
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
function _normalize(form) {
  return _overwrite((input) => input.normalize(form));
}
function _trim() {
  return _overwrite((input) => input.trim());
}
function _toLowerCase() {
  return _overwrite((input) => input.toLowerCase());
}
function _toUpperCase() {
  return _overwrite((input) => input.toUpperCase());
}
function _array(Class, element, params) {
  return new Class({
    type: "array",
    element,
    ...normalizeParams(params)
  });
}
function _refine(Class, fn, _params) {
  const schema = new Class({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
function _superRefine(fn) {
  const ch = _check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  });
  return ch;
}
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}
// node_modules/zod/v4/classic/iso.js
var ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function datetime2(params) {
  return _isoDateTime(ZodISODateTime, params);
}
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function date2(params) {
  return _isoDate(ZodISODate, params);
}
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function time2(params) {
  return _isoTime(ZodISOTime, params);
}
var ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function duration2(params) {
  return _isoDuration(ZodISODuration, params);
}

// node_modules/zod/v4/classic/errors.js
var initializer2 = (inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  Object.defineProperties(inst, {
    format: {
      value: (mapper) => formatError(inst, mapper)
    },
    flatten: {
      value: (mapper) => flattenError(inst, mapper)
    },
    addIssue: {
      value: (issue) => {
        inst.issues.push(issue);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }
    },
    addIssues: {
      value: (issues) => {
        inst.issues.push(...issues);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }
    },
    isEmpty: {
      get() {
        return inst.issues.length === 0;
      }
    }
  });
};
var ZodError = $constructor("ZodError", initializer2);
var ZodRealError = $constructor("ZodError", initializer2, {
  Parent: Error
});

// node_modules/zod/v4/classic/parse.js
var parse3 = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync2 = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse2 = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync2 = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode3 = /* @__PURE__ */ _encode(ZodRealError);
var decode3 = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

// node_modules/zod/v4/classic/schemas.js
var ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  $ZodType.init(inst, def);
  inst.def = def;
  inst.type = def.type;
  Object.defineProperty(inst, "_def", { value: def });
  inst.check = (...checks) => {
    return inst.clone({
      ...def,
      checks: [
        ...def.checks ?? [],
        ...checks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
      ]
    });
  };
  inst.clone = (def, params) => clone(inst, def, params);
  inst.brand = () => inst;
  inst.register = (reg, meta) => {
    reg.add(inst, meta);
    return inst;
  };
  inst.parse = (data, params) => parse3(inst, data, params, { callee: inst.parse });
  inst.safeParse = (data, params) => safeParse2(inst, data, params);
  inst.parseAsync = async (data, params) => parseAsync2(inst, data, params, { callee: inst.parseAsync });
  inst.safeParseAsync = async (data, params) => safeParseAsync2(inst, data, params);
  inst.spa = inst.safeParseAsync;
  inst.encode = (data, params) => encode3(inst, data, params);
  inst.decode = (data, params) => decode3(inst, data, params);
  inst.encodeAsync = async (data, params) => encodeAsync(inst, data, params);
  inst.decodeAsync = async (data, params) => decodeAsync(inst, data, params);
  inst.safeEncode = (data, params) => safeEncode(inst, data, params);
  inst.safeDecode = (data, params) => safeDecode(inst, data, params);
  inst.safeEncodeAsync = async (data, params) => safeEncodeAsync(inst, data, params);
  inst.safeDecodeAsync = async (data, params) => safeDecodeAsync(inst, data, params);
  inst.refine = (check, params) => inst.check(refine(check, params));
  inst.superRefine = (refinement) => inst.check(superRefine(refinement));
  inst.overwrite = (fn) => inst.check(_overwrite(fn));
  inst.optional = () => optional4(inst);
  inst.nullable = () => nullable(inst);
  inst.nullish = () => optional4(nullable(inst));
  inst.nonoptional = (params) => nonoptional(inst, params);
  inst.array = () => array2(inst);
  inst.or = (arg) => union2([inst, arg]);
  inst.and = (arg) => intersection(inst, arg);
  inst.transform = (tx) => pipe(inst, transform3(tx));
  inst.default = (def) => _default(inst, def);
  inst.prefault = (def) => prefault(inst, def);
  inst.catch = (params) => _catch(inst, params);
  inst.pipe = (target) => pipe(inst, target);
  inst.readonly = () => readonly(inst);
  inst.describe = (description) => {
    const cl = inst.clone();
    globalRegistry.add(cl, { description });
    return cl;
  };
  Object.defineProperty(inst, "description", {
    get() {
      return globalRegistry.get(inst)?.description;
    },
    configurable: true
  });
  inst.meta = (...args) => {
    if (args.length === 0) {
      return globalRegistry.get(inst);
    }
    const cl = inst.clone();
    globalRegistry.add(cl, args[0]);
    return cl;
  };
  inst.isOptional = () => inst.safeParse(undefined).success;
  inst.isNullable = () => inst.safeParse(null).success;
  return inst;
});
var _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodType.init(inst, def);
  const bag = inst._zod.bag;
  inst.format = bag.format ?? null;
  inst.minLength = bag.minimum ?? null;
  inst.maxLength = bag.maximum ?? null;
  inst.regex = (...args) => inst.check(_regex(...args));
  inst.includes = (...args) => inst.check(_includes(...args));
  inst.startsWith = (...args) => inst.check(_startsWith(...args));
  inst.endsWith = (...args) => inst.check(_endsWith(...args));
  inst.min = (...args) => inst.check(_minLength(...args));
  inst.max = (...args) => inst.check(_maxLength(...args));
  inst.length = (...args) => inst.check(_length(...args));
  inst.nonempty = (...args) => inst.check(_minLength(1, ...args));
  inst.lowercase = (params) => inst.check(_lowercase(params));
  inst.uppercase = (params) => inst.check(_uppercase(params));
  inst.trim = () => inst.check(_trim());
  inst.normalize = (...args) => inst.check(_normalize(...args));
  inst.toLowerCase = () => inst.check(_toLowerCase());
  inst.toUpperCase = () => inst.check(_toUpperCase());
});
var ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
  inst.email = (params) => inst.check(_email(ZodEmail, params));
  inst.url = (params) => inst.check(_url(ZodURL, params));
  inst.jwt = (params) => inst.check(_jwt(ZodJWT, params));
  inst.emoji = (params) => inst.check(_emoji2(ZodEmoji, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.uuid = (params) => inst.check(_uuid(ZodUUID, params));
  inst.uuidv4 = (params) => inst.check(_uuidv4(ZodUUID, params));
  inst.uuidv6 = (params) => inst.check(_uuidv6(ZodUUID, params));
  inst.uuidv7 = (params) => inst.check(_uuidv7(ZodUUID, params));
  inst.nanoid = (params) => inst.check(_nanoid(ZodNanoID, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.cuid = (params) => inst.check(_cuid(ZodCUID, params));
  inst.cuid2 = (params) => inst.check(_cuid2(ZodCUID2, params));
  inst.ulid = (params) => inst.check(_ulid(ZodULID, params));
  inst.base64 = (params) => inst.check(_base64(ZodBase64, params));
  inst.base64url = (params) => inst.check(_base64url(ZodBase64URL, params));
  inst.xid = (params) => inst.check(_xid(ZodXID, params));
  inst.ksuid = (params) => inst.check(_ksuid(ZodKSUID, params));
  inst.ipv4 = (params) => inst.check(_ipv4(ZodIPv4, params));
  inst.ipv6 = (params) => inst.check(_ipv6(ZodIPv6, params));
  inst.cidrv4 = (params) => inst.check(_cidrv4(ZodCIDRv4, params));
  inst.cidrv6 = (params) => inst.check(_cidrv6(ZodCIDRv6, params));
  inst.e164 = (params) => inst.check(_e164(ZodE164, params));
  inst.datetime = (params) => inst.check(datetime2(params));
  inst.date = (params) => inst.check(date2(params));
  inst.time = (params) => inst.check(time2(params));
  inst.duration = (params) => inst.check(duration2(params));
});
function string4(params) {
  return _string(ZodString, params);
}
var ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
var ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodType.init(inst, def);
  inst.gt = (value, params) => inst.check(_gt(value, params));
  inst.gte = (value, params) => inst.check(_gte(value, params));
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.lt = (value, params) => inst.check(_lt(value, params));
  inst.lte = (value, params) => inst.check(_lte(value, params));
  inst.max = (value, params) => inst.check(_lte(value, params));
  inst.int = (params) => inst.check(int(params));
  inst.safe = (params) => inst.check(int(params));
  inst.positive = (params) => inst.check(_gt(0, params));
  inst.nonnegative = (params) => inst.check(_gte(0, params));
  inst.negative = (params) => inst.check(_lt(0, params));
  inst.nonpositive = (params) => inst.check(_lte(0, params));
  inst.multipleOf = (value, params) => inst.check(_multipleOf(value, params));
  inst.step = (value, params) => inst.check(_multipleOf(value, params));
  inst.finite = () => inst;
  const bag = inst._zod.bag;
  inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
  inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
  inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? 0.5);
  inst.isFinite = true;
  inst.format = bag.format ?? null;
});
function number4(params) {
  return _number(ZodNumber, params);
}
var ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int(params) {
  return _int(ZodNumberFormat, params);
}
var ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
});
function boolean3(params) {
  return _boolean(ZodBoolean, params);
}
var ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
});
function unknown2() {
  return _unknown(ZodUnknown);
}
var ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
});
function never3(params) {
  return _never(ZodNever, params);
}
var ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst.element = def.element;
  inst.min = (minLength, params) => inst.check(_minLength(minLength, params));
  inst.nonempty = (params) => inst.check(_minLength(1, params));
  inst.max = (maxLength, params) => inst.check(_maxLength(maxLength, params));
  inst.length = (len, params) => inst.check(_length(len, params));
  inst.unwrap = () => inst.element;
});
function array2(element, params) {
  return _array(ZodArray, element, params);
}
var ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  $ZodObjectJIT.init(inst, def);
  ZodType.init(inst, def);
  defineLazy(inst, "shape", () => def.shape);
  inst.keyof = () => _enum(Object.keys(inst._zod.def.shape));
  inst.catchall = (catchall) => inst.clone({ ...inst._zod.def, catchall });
  inst.passthrough = () => inst.clone({ ...inst._zod.def, catchall: unknown2() });
  inst.loose = () => inst.clone({ ...inst._zod.def, catchall: unknown2() });
  inst.strict = () => inst.clone({ ...inst._zod.def, catchall: never3() });
  inst.strip = () => inst.clone({ ...inst._zod.def, catchall: undefined });
  inst.extend = (incoming) => {
    return extend(inst, incoming);
  };
  inst.safeExtend = (incoming) => {
    return safeExtend(inst, incoming);
  };
  inst.merge = (other) => merge2(inst, other);
  inst.pick = (mask) => pick2(inst, mask);
  inst.omit = (mask) => omit3(inst, mask);
  inst.partial = (...args) => partial(ZodOptional, inst, args[0]);
  inst.required = (...args) => required(ZodNonOptional, inst, args[0]);
});
function object(shape, params) {
  const def = {
    type: "object",
    get shape() {
      assignProp(this, "shape", shape ? objectClone(shape) : {});
      return this.shape;
    },
    ...normalizeParams(params)
  };
  return new ZodObject(def);
}
var ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst.options = def.options;
});
function union2(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...normalizeParams(params)
  });
}
var ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
var ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  $ZodRecord.init(inst, def);
  ZodType.init(inst, def);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record2(keyType, valueType, params) {
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
var ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst.enum = def.entries;
  inst.options = Object.values(def.entries);
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (_ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = inst);
        payload.issues.push(issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output) => {
        payload.value = output;
        return payload;
      });
    }
    payload.value = output;
    return payload;
  };
});
function transform3(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
var ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional4(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
var ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
var ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
var ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...normalizeParams(params)
  });
}
var ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
  });
}
var ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
});
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
function superRefine(fn) {
  return _superRefine(fn);
}
// src/capture.ts
var MAX_ELEMENTS = 100;
function fmtFrame(el) {
  const f = el.frame;
  if (f && [f.x, f.y, f.w, f.h].every((n) => typeof n === "number"))
    return `(${f.x},${f.y},${f.w},${f.h})`;
  const b = el.bounds;
  if (Array.isArray(b) && b.length >= 4)
    return `(${b[0]},${b[1]},${b[2]},${b[3]})`;
  if (b && typeof b === "object") {
    const { x, y, width, height } = b;
    if ([x, y, width, height].every((n) => typeof n === "number"))
      return `(${x},${y},${width},${height})`;
  }
  return "";
}
function renderElements(elements) {
  const truncated = elements.length > MAX_ELEMENTS;
  const shown = truncated ? elements.slice(0, MAX_ELEMENTS) : elements;
  const lines = shown.map((el) => {
    const rawIdx = el.element_index ?? el.index;
    const idx = typeof rawIdx === "number" ? rawIdx : "?";
    const role = String(el.role ?? el.type ?? "element");
    const label = String(el.label ?? el.name ?? "").slice(0, 60).replace(/\s+/g, " ").trim();
    const value = typeof el.value === "string" && el.value ? ` = ${JSON.stringify(el.value.slice(0, 40))}` : "";
    const frame = fmtFrame(el);
    return `  [${idx}] ${role}${label ? ` "${label}"` : ""}${frame ? ` ${frame}` : ""}${value}${el.enabled === false ? " (disabled)" : ""}`;
  });
  return {
    text: lines.join(`
`) + (truncated ? `
  … truncated after ${MAX_ELEMENTS} of ${elements.length} elements — narrow with query= or an app/pid capture` : ""),
    truncated
  };
}
function extractImages(content) {
  return content.filter((c) => c.type === "image" && typeof c.data === "string").map((c) => ({ data: c.data, mimeType: c.mimeType ?? "image/png" }));
}
function extractText(content) {
  return content.filter((c) => c.type === "text").map((c) => c.text).join(`
`);
}
function buildCaptureResult(args) {
  const text = extractText(args.call.content);
  const images = args.mode === "ax" ? [] : extractImages(args.call.content);
  const structured = args.call.structured ?? {};
  let elements;
  if (Array.isArray(structured.elements))
    elements = structured.elements;
  const title = args.windowTitle ?? structured.window_title;
  const header = `capture(${args.mode})${title ? ` — ${JSON.stringify(title)}` : ""} — ${args.call.isError ? "driver reported an error" : "ok"}`;
  const parts = [header];
  if (elements?.length) {
    const rendered = renderElements(elements);
    parts.push(`elements (address actions by [index], do not compute pixel coordinates):`, rendered.text);
  } else if (text) {
    parts.push(text.slice(0, 4000));
  }
  const attachments = images.length ? images.map((img, i) => ({
    type: "file",
    mime: img.mimeType,
    url: `data:${img.mimeType};base64,${img.data}`,
    ...i === 0 && images.length > 1 ? { filename: `capture-${i}.png` } : {}
  })) : undefined;
  if (attachments?.length) {
    const sw = structured.screenshot_width;
    const sh = structured.screenshot_height;
    const wb = structured.window_bounds;
    const scaleNote = typeof sw === "number" && typeof wb?.w === "number" && sw > 0 && wb.w > 0 && Math.abs(sw - wb.w) > 1 ? `screenshot is ${sw}x${sh} for a ${wb.w}x${wb.h} window (scale ${(wb.w / sw).toFixed(3)}) — map pixel ideas back by this factor` : `screenshot at native window resolution`;
    parts.push(`screenshot attached (${attachments.length} image${attachments.length > 1 ? "s" : ""}; ${scaleNote}).`, `The image may have been resized upstream — never derive pixel coordinates from it. Prefer element [index] addressing; for pixel fallback, capture first, then act on the coordinates the backend reports. For small targets use the zoom path (native-resolution crop) rather than zooming the full screenshot.`);
  }
  return { output: parts.join(`
`), ...attachments ? { attachments } : {}, ...elements ? { elements } : {} };
}

// src/tool.ts
var ACTIONS = [
  "capture",
  "zoom",
  "verify",
  "click",
  "double_click",
  "right_click",
  "drag",
  "scroll",
  "type",
  "key",
  "set_value",
  "invoke_menu",
  "launch_app",
  "wait",
  "list_apps",
  "list_windows",
  "focus_app"
];
var ACTION_HINTS = {
  middle_click: "use click with button=middle (the click action's button parameter covers it)",
  screenshot: "use action=capture",
  screenshot_full: "use action=capture mode=vision",
  hover: "use action=move/scroll or capture then click",
  press: "use action=key",
  focus: "use action=focus_app (selection only) with raise=true when the window must come to the front",
  menu: "use action=invoke_menu with path",
  launch: "use action=launch_app"
};
var TIMEOUTS = {
  capture: 30000,
  list: 1e4,
  input: 15000,
  menu: 20000,
  launch: 30000,
  verify: 20000
};
function timeoutFor(tool) {
  if (tool.startsWith("get_") || tool === "zoom")
    return TIMEOUTS.capture;
  if (tool.startsWith("list_"))
    return TIMEOUTS.list;
  if (tool === "invoke_menu")
    return TIMEOUTS.menu;
  if (tool === "launch_app")
    return TIMEOUTS.launch;
  if (tool === "verify_state")
    return TIMEOUTS.verify;
  return TIMEOUTS.input;
}
var allowPermission = async () => {};
function jsonErr(action, err) {
  return JSON.stringify({ ok: false, action, error: err.message ?? String(err) });
}
var FREE_ACTIONS = new Set(["capture", "zoom", "verify", "wait", "list_apps", "list_windows"]);
async function driverCall(deps, ctx, action, args) {
  const s = deps.session;
  const app = typeof args.app === "string" ? args.app : undefined;
  if (action === "key") {
    const keys = String(args.keys ?? args.key ?? "");
    const blocked = blockedKeyReason(keys);
    if (blocked)
      return JSON.stringify({ ok: false, action, error: blocked });
  }
  if (action === "type") {
    const blocked = blockedTypeReason(String(args.text ?? ""));
    if (blocked)
      return JSON.stringify({ ok: false, action, error: blocked });
  }
  if (action === "set_value") {
    const blocked = blockedTypeReason(String(args.value ?? ""));
    if (blocked)
      return JSON.stringify({ ok: false, action, error: blocked });
  }
  if (!FREE_ACTIONS.has(action) && action !== "focus_app") {
    const refusal = targetRefusal(s.sticky, app);
    if (refusal)
      return JSON.stringify({ ok: false, action, code: "input_target_mismatch", error: refusal });
  }
  const wantsForeground = args.raise === true || args.delivery_mode === "foreground" || action === "focus_app" && args.raise === true;
  const ask = deps.assertPermission ?? allowPermission;
  if (wantsForeground && action !== "capture" && action !== "wait") {
    try {
      await ask({
        action: "computer:foreground",
        title: `computer (foreground): ${action}${app ? ` on ${app}` : ""}`,
        sessionID: ctx.sessionID,
        agent: ctx.agent,
        messageID: ctx.messageID,
        callID: ctx.id
      });
    } catch (err) {
      return JSON.stringify({ ok: false, action, code: "denied", error: `user denied foreground: ${err.message ?? "permission rejected"}` });
    }
  }
  if (!FREE_ACTIONS.has(action)) {
    try {
      await ask({
        action: "computer",
        title: `computer: ${action}${app ? ` on ${app}` : ""}`,
        sessionID: ctx.sessionID,
        agent: ctx.agent,
        messageID: ctx.messageID,
        callID: ctx.id
      });
    } catch (err) {
      return JSON.stringify({ ok: false, action, code: "denied", error: `user denied: ${err.message ?? "permission rejected"}` });
    }
  }
  try {
    if (action === "wait") {
      const ms = Math.max(0, Math.min(1e4, Number(args.waitMs ?? 1000)));
      await new Promise((r) => setTimeout(r, ms));
      const waitRestarted = s.restarted;
      if (waitRestarted)
        s.restarted = false;
      return JSON.stringify({ ok: true, action, waitedMs: ms, ...waitRestarted ? restartedFields() : {}, verdict: { decision: "done", hint: "no side effects" } });
    }
    let result;
    if (action === "capture")
      result = await captureFlow(deps, args);
    else if (action === "zoom")
      result = await zoomFlow(deps, args);
    else if (action === "verify")
      result = await verifyFlow(deps, args);
    else if (action === "list_apps" || action === "list_windows") {
      const res = await s.call(action, {}, timeoutFor(action));
      result = listResult(action, res);
    } else
      result = await inputFlow(deps, action, args);
    const restartedNote = s.restarted;
    if (restartedNote)
      s.restarted = false;
    if (restartedNote && typeof result === "string") {
      try {
        const parsed = JSON.parse(result);
        return JSON.stringify({ ...restartedFields(), ...parsed });
      } catch {
        return result;
      }
    }
    if (restartedNote && typeof result === "object") {
      return { ...result, output: `driver restarted since your last call — re-capture required (element references and target were invalidated)
${result.output}` };
    }
    return result;
  } catch (err) {
    return jsonErr(action, err);
  }
}
function restartedFields() {
  return { restarted: true, restart_note: "the cua-driver restarted; prior element references and the sticky target are invalid — capture again before any input" };
}
function windowsFromList(listed) {
  const arr = listed.structured?.windows;
  if (Array.isArray(arr))
    return arr;
  const text = extractText(listed.content);
  return [...text.matchAll(/-\s+\S+ \(pid (\d+)\) "(.*?)" \[window_id: (\d+)\]/g)].map((m) => ({ pid: Number(m[1]), title: m[2], window_id: Number(m[3]) }));
}
function appsFromList(listed) {
  const arr = listed.structured?.apps;
  if (Array.isArray(arr))
    return arr;
  const text = extractText(listed.content);
  return [...text.matchAll(/-\s+([^(\s][^ (]*?)\s*\(pid (\d+)\)/g)].map((m) => ({ name: m[1], pid: Number(m[2]) }));
}
async function resolveApp(s, name) {
  const listed = await s.call("list_apps", {}, timeoutFor("list_apps"));
  const rows = appsFromList(listed).filter((r) => typeof r.pid === "number" && r.pid > 0);
  const label = (r) => String(r.name ?? r.app_name ?? r.bundle_id ?? "");
  const norm = (v) => v.trim().toLowerCase().replace(/\.exe$/, "");
  const want = norm(name);
  const exact = rows.find((r) => norm(label(r)) === want);
  if (exact)
    return { pid: exact.pid, app: label(exact) };
  const partial = rows.filter((r) => norm(label(r)).includes(want));
  if (partial.length === 1)
    return { pid: partial[0].pid, app: label(partial[0]) };
  if (partial.length > 1)
    return { candidates: partial.map((r) => `${label(r)} (pid ${r.pid})`) };
  const winListed = await s.call("list_windows", {}, timeoutFor("list_windows"));
  const wins = windowsFromList(winListed);
  const byTitle = wins.find((w) => (w.title ?? "").toLowerCase().includes(want) && typeof w.pid === "number");
  if (byTitle)
    return { pid: byTitle.pid, app: name };
  return { miss: name, running: rows.map((r) => label(r)).filter(Boolean).slice(0, 30) };
}
async function captureFlow(deps, args) {
  const mode = ["som", "vision", "ax"].includes(String(args.mode)) ? args.mode : "som";
  const s = deps.session;
  const pid = typeof args.pid === "number" ? args.pid : undefined;
  const windowId = typeof args.window_id === "number" ? args.window_id : undefined;
  let effectivePid = pid;
  if (effectivePid === undefined && windowId === undefined && typeof args.app === "string" && args.app.trim()) {
    const resolved = await resolveApp(s, args.app);
    if ("pid" in resolved)
      effectivePid = resolved.pid;
    else if ("candidates" in resolved) {
      return JSON.stringify({ ok: false, action: "capture", code: "app_ambiguous", error: `multiple running apps match "${args.app}" — pass pid= for one of: ${resolved.candidates.join("; ")}` });
    } else {
      return JSON.stringify({ ok: false, action: "capture", code: "app_not_found", error: `no running app matches "${args.app}". Running apps: ${resolved.running.slice(0, 20).join(", ") || "(none listed)"}` });
    }
  }
  if (mode === "vision" && effectivePid === undefined && windowId === undefined && !s.sticky) {
    const res = await s.call("get_desktop_state", {}, timeoutFor("get_desktop_state"));
    return { output: buildCaptureResult({ mode, call: res }).output };
  }
  let effectiveWindow = windowId ?? (s.sticky?.pid === effectivePid ? s.sticky?.windowId : undefined);
  if (effectivePid === undefined && effectiveWindow === undefined && s.sticky?.pid !== undefined) {
    effectivePid = s.sticky.pid;
    effectiveWindow = s.sticky.windowId;
  }
  if (effectiveWindow === undefined || effectivePid === undefined) {
    const listed = await s.call("list_windows", {}, timeoutFor("list_windows"));
    const rows = windowsFromList(listed);
    if (effectivePid === undefined && effectiveWindow !== undefined) {
      effectivePid = rows.find((r) => r.window_id === effectiveWindow)?.pid;
    }
    if (effectiveWindow === undefined && effectivePid !== undefined) {
      effectiveWindow = rows.find((r) => r.pid === effectivePid && r.window_id !== undefined)?.window_id;
    }
    if (effectiveWindow === undefined) {
      return JSON.stringify({
        ok: false,
        action: "capture",
        code: "window_id_required",
        error: `get_window_state needs a window_id belonging to pid ${effectivePid ?? "?"}; none was found. Windows now: ${rows.map((r) => `pid ${r.pid} [window_id: ${r.window_id}] ${JSON.stringify(r.title ?? "")}`).slice(0, 12).join("; ")}`
      });
    }
  }
  const callArgs = { pid: effectivePid ?? s.sticky?.pid, window_id: effectiveWindow };
  if (args.query)
    callArgs.query = String(args.query);
  if (mode === "vision")
    callArgs.include_accessibility_tree = false;
  callArgs.max_dimension = 1568;
  callArgs.max_elements = Math.max(50, Math.min(1000, deps.maxElements ?? 200));
  callArgs.tree_format = "elements";
  const res = await s.call("get_window_state", callArgs, timeoutFor("get_window_state"));
  if (!res.isError) {
    const structured = res.structured ?? {};
    s.recordSnapshot(effectiveWindow, structured.snapshot_id, structured.elements);
    s.sticky = { app: typeof args.app === "string" ? args.app : s.sticky?.app ?? "", pid: effectivePid ?? s.sticky?.pid, windowId: effectiveWindow };
  }
  const built = buildCaptureResult({ mode, call: res });
  return attachWithDedup(s, effectiveWindow, built);
}
async function zoomFlow(deps, args) {
  const s = deps.session;
  const pid = typeof s.sticky?.pid === "number" ? s.sticky.pid : typeof args.pid === "number" ? args.pid : undefined;
  const windowId = typeof args.window_id === "number" ? args.window_id : s.sticky?.windowId;
  if (pid === undefined || windowId === undefined) {
    return JSON.stringify({ ok: false, action: "zoom", code: "no_target", error: "zoom needs a window target — capture(app=...) first." });
  }
  const region = {
    x: Math.max(0, Number(args.x ?? 0)),
    y: Math.max(0, Number(args.y ?? 0)),
    w: Math.min(500, Math.max(8, Number(args.w ?? args.width ?? 200))),
    h: Math.min(500, Math.max(8, Number(args.h ?? args.height ?? 200)))
  };
  const res = await s.call("zoom", { pid, window_id: windowId, x1: region.x, y1: region.y, x2: region.x + region.w, y2: region.y + region.h }, timeoutFor("zoom"));
  s.recordZoom(windowId, region);
  const built = buildCaptureResult({ mode: "vision", call: res });
  const output = [
    `zoom(${region.x},${region.y},${region.w},${region.h}) — native-resolution crop of window ${windowId}.`,
    "Coordinates you read off THIS image must be passed with from_zoom=true on the next input action (the plugin remaps them to native window coordinates); element [index] addressing needs a fresh capture (zoom crops carry no element tokens).",
    built.output
  ].join(`
`);
  return { output, ...built.attachments ? { attachments: built.attachments } : {} };
}
async function verifyFlow(deps, args) {
  const s = deps.session;
  const pid = typeof s.sticky?.pid === "number" ? s.sticky.pid : typeof args.pid === "number" ? args.pid : undefined;
  const windowId = typeof args.window_id === "number" ? args.window_id : s.sticky?.windowId;
  if (pid === undefined || windowId === undefined) {
    return JSON.stringify({ ok: false, action: "verify", code: "no_target", error: "verify needs a window target — capture(app=...) first." });
  }
  const predicates = Array.isArray(args.predicates) ? args.predicates : [];
  if (!predicates.length) {
    return JSON.stringify({ ok: false, action: "verify", error: "predicates required: [{ label?, role?, exists?, enabled?, selected?, value? }] (or the driver's native {element:{selector:...}} shape) — one entry per check, ANDed together." });
  }
  const expect = predicates.map((raw) => {
    const p = raw;
    if (p.element || p.window)
      return p;
    const el = {};
    const selector = {};
    if (typeof p.label === "string" && p.label)
      selector.label_contains = p.label;
    if (typeof p.role === "string" && p.role)
      selector.role = p.role;
    if (Object.keys(selector).length)
      el.selector = selector;
    if (p.exists === true)
      el.exists = true;
    if (typeof p.enabled === "boolean")
      el.enabled = p.enabled;
    if (typeof p.selected === "boolean")
      el.selected = p.selected;
    if (typeof p.value === "string")
      el.value_equals = p.value;
    if (!Object.keys(el).length)
      return { window: { exists: true } };
    return { element: el };
  });
  const res = await s.call("verify_state", { pid, window_id: windowId, expect }, timeoutFor("verify_state"));
  const structured = res.structured ?? {};
  const textOut = extractText(res.content);
  const status = String(structured.status ?? "").toLowerCase();
  const verdict = status === "satisfied" ? { decision: "done", hint: "Verification passed against the current window state." } : status === "unsatisfied" ? { decision: "escalate", hint: "Verification FAILED — the expected state is not present. Re-capture before any retry; do not re-issue input blind." } : { decision: "verify_fresh_state", hint: "Verification was indeterminate (unknown) — the predicate could not be evaluated against a valid snapshot. Treat as NOT verified." };
  return JSON.stringify({
    ok: !res.isError,
    action: "verify",
    ...structured.predicates ? { results: structured.predicates } : {},
    ...typeof structured.samples === "number" ? { samples: structured.samples, stable: structured.stable } : {},
    ...structured.message ? { message: structured.message } : {},
    ...res.isError ? { error: textOut.slice(0, 400) || "driver reported an error" } : {},
    verdict
  });
}
function listResult(action, res) {
  const text = extractText(res.content);
  return JSON.stringify({ ok: !res.isError, action, ...text ? { items: text.slice(0, 6000) } : {}, ...res.isError ? { error: "driver reported an error" } : {} });
}
async function inputFlow(deps, action, args) {
  const s = deps.session;
  const establishesTarget = action === "focus_app" || action === "launch_app";
  const pid = typeof s.sticky?.pid === "number" ? s.sticky.pid : typeof args.pid === "number" ? args.pid : undefined;
  if (pid === undefined && !establishesTarget) {
    return JSON.stringify({ ok: false, action, code: "no_target", error: "no sticky target: call capture(app=/pid=) or focus_app first — input never goes to an unchosen window." });
  }
  const windowId = typeof args.window_id === "number" ? args.window_id : s.sticky?.windowId;
  let toolName;
  const callArgs = { pid };
  if (windowId !== undefined)
    callArgs.window_id = windowId;
  if (typeof args.delivery_mode === "string")
    callArgs.delivery_mode = args.delivery_mode;
  const elementIndex = typeof args.element_index === "number" ? args.element_index : undefined;
  if (elementIndex !== undefined) {
    if (windowId === undefined) {
      return JSON.stringify({ ok: false, action, code: "unaddressable_element", error: "element_index addressing needs the capturing window's window_id (capture first, then act)." });
    }
    const token = s.tokenFor(windowId, elementIndex);
    if (!token) {
      return JSON.stringify({
        ok: false,
        action,
        code: "unaddressable_element",
        error: `element [${elementIndex}] has no snapshot token for window ${windowId} — the reference predates the last capture or the driver restarted. capture again and use a fresh [index].`
      });
    }
    const accepts = (arg) => s.acceptsArg(action, arg) !== false;
    if (accepts("element_index"))
      callArgs.element_index = elementIndex;
    if (accepts("element_token"))
      callArgs.element_token = token.elementToken;
    if (accepts("snapshot_id"))
      callArgs.snapshot_id = token.snapshotId;
  }
  if (args.from_zoom === true)
    callArgs.from_zoom = true;
  switch (action) {
    case "click":
    case "double_click":
    case "right_click":
      toolName = action;
      if (typeof args.x === "number")
        callArgs.x = args.x;
      if (typeof args.y === "number")
        callArgs.y = args.y;
      if (action === "click" && typeof args.button === "string")
        callArgs.button = args.button;
      if (action === "double_click")
        callArgs.count = 2;
      break;
    case "drag":
      toolName = "drag";
      callArgs.from_x = args.from_x;
      callArgs.from_y = args.from_y;
      callArgs.to_x = args.to_x;
      callArgs.to_y = args.to_y;
      break;
    case "scroll":
      toolName = "scroll";
      if (typeof args.direction === "string")
        callArgs.direction = args.direction;
      if (typeof args.amount === "number")
        callArgs.amount = args.amount;
      break;
    case "type":
      toolName = "type_text";
      callArgs.text = String(args.text ?? "");
      break;
    case "key": {
      const keys = String(args.keys ?? args.key ?? "");
      const combo = keys.split(/\s*[+\-]\s*/).filter(Boolean);
      if (combo.length > 1) {
        toolName = "hotkey";
        callArgs.keys = combo;
      } else {
        toolName = "press_key";
        callArgs.key = combo[0] ?? keys;
      }
      break;
    }
    case "set_value":
      toolName = "set_value";
      callArgs.value = args.value;
      break;
    case "invoke_menu": {
      toolName = "invoke_menu";
      const rawPath = Array.isArray(args.path) ? args.path.map(String) : String(args.path ?? "").split(/\s*>\s*/).filter(Boolean);
      if (!rawPath.length) {
        return JSON.stringify({ ok: false, action, error: 'path required: the menu path level by level, e.g. ["File", "Open"] or "File > Open".' });
      }
      callArgs.path = rawPath;
      break;
    }
    case "launch_app": {
      toolName = "launch_app";
      if (typeof args.launch_path === "string" && args.launch_path)
        callArgs.launch_path = args.launch_path;
      else if (typeof args.app === "string" && args.app)
        callArgs.name = args.app;
      else
        return JSON.stringify({ ok: false, action, error: "launch_app needs app (name) or launch_path." });
      if (args.start_minimized !== false)
        callArgs.start_minimized = true;
      break;
    }
    case "focus_app":
      if (args.raise === true)
        toolName = "bring_to_front";
      else
        toolName = "__select_only__";
      break;
    default:
      return JSON.stringify({ ok: false, action, error: `unsupported action ${String(action)}` });
  }
  if (toolName === "__select_only__") {
    if (typeof args.app === "string" && args.app.trim()) {
      const resolved = await resolveApp(s, args.app);
      if ("pid" in resolved) {
        const listed = await s.call("list_windows", {}, timeoutFor("list_windows"));
        const win = windowsFromList(listed).find((r) => r.pid === resolved.pid && r.window_id !== undefined);
        s.sticky = { app: resolved.app, pid: resolved.pid, ...win ? { windowId: win.window_id } : {} };
        return JSON.stringify({ ok: true, action: "focus_app", selected: s.sticky, verdict: { decision: "done", hint: "Target selected (no foreground change). Input actions now go here." } });
      }
      if ("candidates" in resolved) {
        return JSON.stringify({ ok: false, action: "focus_app", code: "app_ambiguous", error: `multiple running apps match "${args.app}" — pass pid= for one of: ${resolved.candidates.join("; ")}` });
      }
      return JSON.stringify({ ok: false, action: "focus_app", code: "app_not_found", error: `no running app matches "${args.app}". Running apps: ${resolved.running.slice(0, 20).join(", ") || "(none listed)"}` });
    }
    if (typeof args.pid === "number") {
      const listed = await s.call("list_windows", {}, timeoutFor("list_windows"));
      const win = windowsFromList(listed).find((r) => r.pid === args.pid && r.window_id !== undefined);
      s.sticky = { app: s.sticky?.app ?? "", pid: args.pid, ...win ? { windowId: win.window_id } : {} };
      return JSON.stringify({ ok: true, action: "focus_app", selected: s.sticky, verdict: { decision: "done", hint: "Target selected (no foreground change)." } });
    }
    return JSON.stringify({ ok: false, action: "focus_app", error: "focus_app needs app= or pid=." });
  }
  const res = await s.call(toolName, callArgs, timeoutFor(toolName));
  const structured = res.structured ?? {};
  const textOut = extractText(res.content);
  let textFields = {};
  try {
    const parsed = JSON.parse(textOut);
    if (parsed && typeof parsed === "object")
      textFields = parsed;
  } catch {}
  const merged = {
    ok: structured.ok ?? textFields.ok ?? !res.isError,
    verified: structured.verified ?? textFields.verified ?? null,
    effect: structured.effect ?? textFields.effect ?? null,
    escalation: structured.escalation ?? textFields.escalation ?? null
  };
  const staleError = res.isError && /stale|snapshot/i.test(textOut);
  let raiseEvidence;
  let launchWindowNote;
  if (action === "launch_app" && !res.isError && typeof structured.pid === "number") {
    const listed = await s.call("list_windows", {}, timeoutFor("list_windows"));
    const win = windowsFromList(listed).find((r) => r.pid === structured.pid && r.window_id !== undefined);
    s.sticky = { app: String(args.app ?? args.launch_path ?? ""), pid: structured.pid, ...win ? { windowId: win.window_id } : {} };
    launchWindowNote = !win ? "no top-level window found for the new pid yet — it may still be starting, or (UWP) be suspended/cloaked: verify with capture before any input." : win.minimized === true || win.is_on_screen === false ? `bound window ${win.window_id} is ${win.minimized ? "minimized" : "off-screen"} (launch defaults to hidden); a UWP window in this state may be suspended and click-through — raise it (focus_app with raise) and confirm it took effect before input.` : undefined;
  }
  if (action === "focus_app" && args.raise === true && !res.isError) {
    s.sticky = { app: typeof args.app === "string" ? args.app : s.sticky?.app ?? "", pid, ...windowId !== undefined ? { windowId } : {} };
    const nowFg = structured.now_fg_hwnd ?? textFields.now_fg_hwnd;
    if (typeof nowFg === "number") {
      raiseEvidence = windowId !== undefined && nowFg === windowId ? { raised: true, foreground_window: nowFg } : windowId !== undefined ? {
        raised: false,
        foreground_window: nowFg,
        raise_hint: "bring_to_front completed but the foreground is NOT the target window — it may be suspended/cloaked (UWP) or Windows denied the activation (often requires recent user input). Verify with capture/list_windows before retrying; do not assume the raise worked."
      } : { foreground_window: nowFg };
    }
  }
  const verdict = staleError ? { decision: "verify_fresh_state", hint: "stale_snapshot: the driver rejected the element reference. capture again, then re-issue with the fresh [index]." } : mapVerdict(merged);
  const payload = {
    ok: !res.isError,
    action,
    ...structured.message ? { message: structured.message } : {},
    ...res.isError ? { error: textOut.slice(0, 400) || "driver reported an error", ...staleError ? { code: "stale_snapshot" } : {} } : {},
    ...launchWindowNote ? { window_note: launchWindowNote } : {},
    ...raiseEvidence ?? {},
    verdict,
    hint_followup: verdict.decision === "done" ? undefined : verdict.hint
  };
  const policy = deps.captureAfter ?? "off";
  const wantsCapture = args.capture_after === true || policy !== "off" && !res.isError;
  if (wantsCapture && !res.isError && pid !== undefined) {
    try {
      const mode = policy === "ax" && args.capture_after !== true ? "ax" : "som";
      const cArgs = { pid, max_dimension: 1568, max_elements: Math.max(50, Math.min(1000, deps.maxElements ?? 200)) };
      if (windowId !== undefined)
        cArgs.window_id = windowId;
      const follow = await s.call("get_window_state", cArgs, timeoutFor("get_window_state"));
      const fstructured = follow.structured ?? {};
      if (windowId !== undefined)
        s.recordSnapshot(windowId, fstructured.snapshot_id, fstructured.elements);
      const built = buildCaptureResult({ mode, call: follow });
      const withDedup = attachWithDedup(deps.session, windowId, built);
      return JSON.stringify(payload) + `
` + (typeof withDedup === "string" ? withDedup : withDedup.output);
    } catch {
      return JSON.stringify(payload);
    }
  }
  return JSON.stringify(payload);
}
function attachWithDedup(s, windowId, built) {
  if (!built.attachments?.length || windowId === undefined)
    return built;
  const data = built.attachments[0].url;
  const { attach, unchanged } = s.shouldAttachScreenshot(windowId, data);
  if (attach)
    return built;
  return {
    output: `${built.output}
screenshot unchanged since the previous capture — image omitted (dedup streak bounded; a third identical capture re-attaches).`
  };
}
var ACTION_DESC = `Which action to perform. capture (side-effect free) returns screen state: mode=som (screenshot + numbered element list — click by [index]), mode=vision (plain screenshot), mode=ax (element list only, cheapest). zoom returns a native-resolution crop (≤500px) for reading dense UI; coordinates read off it go into the next input with from_zoom=true. verify evaluates deterministic predicates against the current window (three-state: passed/failed/unknown — unknown is never success). Input actions (click/double_click/right_click/drag/scroll/type/key/set_value/invoke_menu/launch_app) act on the sticky target set by the last capture/focus_app and require approval. set_value selects options/sliders directly; invoke_menu drives native menus by path (no pixel fallback); launch_app starts an app (hidden by default, auto-selects its window). wait sleeps locally. list_apps/list_windows are read-only. focus_app SELECTS a target without touching the foreground; raise=true (separate approval domain) brings it to the front.`;
var ComputerArgs = object({
  action: _enum(ACTIONS).describe(ACTION_DESC),
  mode: string4().optional().describe("capture mode: som | vision | ax (default som)"),
  app: string4().optional().describe("app name or bundle id; limits capture to one app and sets the sticky target (resolution: list_apps exact, substring, then window titles)"),
  pid: number4().optional().describe("exact process target (from list_apps / capture)"),
  window_id: number4().optional().describe("exact window target (from list_windows / capture) — window actions require it; capture resolves it via list_windows when only pid is given"),
  query: string4().optional().describe("capture: case-insensitive substring filter on the element tree"),
  element_index: number4().optional().describe("element to act on, by [index] from the last capture (must come from the current snapshot — stale references are refused)"),
  x: number4().optional().describe("x in window-local screenshot pixels (pixel fallback; prefer element_index)"),
  y: number4().optional().describe("y in window-local screenshot pixels"),
  w: number4().optional().describe("zoom: crop width (≤500)"),
  h: number4().optional().describe("zoom: crop height (≤500)"),
  button: string4().optional().describe("click mouse button: left | right | middle (action=click)"),
  delivery_mode: string4().optional().describe("background (default, never steals focus) | foreground (escalation ONLY after a background_unavailable error — never preemptively; needs the foreground approval)"),
  raise: boolean3().optional().describe("foreground intents: focus_app raise=true brings the window to the front; input actions with raise=true foreground them (separate approval domain computer:foreground)"),
  from_zoom: boolean3().optional().describe("coordinates were read off a zoom crop — remap them to native window coordinates before dispatch"),
  from_x: number4().optional(),
  from_y: number4().optional(),
  to_x: number4().optional(),
  to_y: number4().optional(),
  direction: string4().optional().describe("scroll direction: up|down|left|right"),
  amount: number4().optional().describe("scroll amount"),
  text: string4().optional().describe("text to type (action=type)"),
  keys: string4().optional().describe("key or combo, e.g. 'enter' or 'ctrl+s' (action=key)"),
  value: string4().optional().describe("value to set (action=set_value)"),
  path: string4().optional().describe(`invoke_menu: menu path, 'File > Open' or ["File","Open"]`),
  launch_path: string4().optional().describe("launch_app: executable path to start"),
  start_minimized: boolean3().optional().describe("launch_app: default true (minimized, never steals the foreground — a plain driver launch can activate the window); pass false for a normal start"),
  predicates: array2(record2(string4(), unknown2())).optional().describe("verify: [{ element_index?, label?, exists?, enabled?, selected?, value? }] — deterministic checks against the current window"),
  waitMs: number4().optional().describe("wait duration ms, max 10000 (action=wait)"),
  capture_after: boolean3().optional().describe("attach a fresh som capture after a successful input action")
});
function toResult(result) {
  if (typeof result === "string")
    return { content: result };
  const content = [{ type: "text", text: result.output }];
  for (const attachment of result.attachments ?? []) {
    content.push({
      type: "file",
      uri: attachment.url,
      mime: attachment.mime,
      ...attachment.filename ? { name: attachment.filename } : {}
    });
  }
  return { content };
}
function makeComputerTool(deps) {
  return {
    name: "computer",
    description: "Desktop computer use via the locally installed cua-driver (user-installed; this plugin never installs or upgrades it). Workflow: capture -> act by element index -> capture/verify to check. Verdicts classify every input (done / verify_fresh_state / escalate); never re-issue input on an escalation recommendation alone — re-capture first. Load the `computer-use` skill for the full operating manual and when-to-use scope.",
    input: ComputerArgs,
    async execute(input, ctx) {
      const args = input;
      const action = args.action;
      if (!ACTIONS.includes(action)) {
        const hint = ACTION_HINTS[String(action)];
        return toResult(JSON.stringify({ ok: false, action, error: `unknown action${hint ? ` — ${hint}` : `; supported: ${ACTIONS.join(", ")}`}` }));
      }
      deps.probeLine?.(`computer action=${action}`);
      return toResult(await driverCall(deps, ctx, action, args));
    }
  };
}
function makeStatusTool(deps) {
  return {
    name: "computer_status",
    description: "cua-driver readiness, version, health, and remediation. When the driver is missing or below the contract floor this is the ONLY computer-use tool: it prints the exact command the USER must run in their own terminal (the plugin never installs or upgrades the driver, and never executes installers on the user's behalf).",
    input: object({}),
    async execute() {
      let health;
      if (deps.ready && deps.healthFetch) {
        try {
          health = await deps.healthFetch();
        } catch {
          health = { degraded: "health_report unavailable — manifest contract state shown instead" };
        }
      }
      const payload = {
        ready: deps.ready,
        driver: deps.resolved,
        version: deps.version,
        contract: { min: "0.28.0", testedAgainst: "0.44.0" },
        session: deps.sessionId,
        ...health ? { health } : {},
        ...deps.ready ? {} : { problem: deps.reason, remediation: deps.installHint },
        ...deps.ready ? {
          macos_tcc_note: "macOS: if automation was granted but clicks land nowhere, the TCC grant may be stale — System Settings > Privacy & Security > Accessibility/Automation, remove and re-grant the terminal running opencode."
        } : {},
        update_check: "to check for a newer driver, run `cua-driver check-update` yourself in a terminal; this plugin never polls or refreshes"
      };
      return toResult(JSON.stringify(payload, null, 2));
    }
  };
}

// plugin.ts
var probeEnabled = () => process.env.OPENCODE_CU_PROBE === "1";
var probeLine = (text) => {
  if (!probeEnabled())
    return;
  try {
    appendFileSync(join2(tmpdir2(), "opencode-cu-probe.log"), `${new Date().toISOString()} ${text}
`);
  } catch {}
};
var probeCache = null;
var probeOverride = null;
function _testInjectProbe(r) {
  probeOverride = r;
  probeCache = null;
}
function probeOnce(driverPath) {
  if (probeOverride)
    return probeOverride;
  if (probeCache)
    return probeCache;
  const env = driverPath ? { ...process.env, [DRIVER_CMD_ENV]: driverPath } : undefined;
  const resolved = resolveDriverCmd(env ? { env } : {});
  const contract = checkContract(resolved);
  probeLine(`probe resolved=${resolved.cmd ?? "null"} ready=${contract.ready} reason=${contract.reason}`);
  probeCache = contract;
  return contract;
}
var sessionId = `opencode-computer-use-${randomUUID().slice(0, 12)}`;
function bundledSkillFile() {
  let here;
  try {
    here = dirname(fileURLToPath(import.meta.url));
  } catch {
    return null;
  }
  for (const root of [here, dirname(here)]) {
    const candidate = join2(root, "skills", "computer-use", "SKILL.md");
    if (existsSync2(candidate))
      return candidate;
  }
  return null;
}
var plugin_default = define({
  id: "computer-use",
  async setup(ctx) {
    const pluginOptions = ctx.options?.computerUse ?? {};
    const contract = probeOnce(typeof pluginOptions.driverPath === "string" ? pluginOptions.driverPath : undefined);
    const installHint = userInstallHint();
    const captureAfter = pluginOptions.captureAfter === "som" || pluginOptions.captureAfter === "ax" ? pluginOptions.captureAfter : "off";
    const agentCursor = pluginOptions.agentCursor === true;
    const maxElements = typeof pluginOptions.maxElements === "number" ? Math.max(50, Math.min(1000, Math.floor(pluginOptions.maxElements))) : 200;
    const permissionMode = pluginOptions.permissionMode === "config" ? "config" : "ask";
    const approvalMode = pluginOptions.approval === "each" ? "each" : "session";
    let session = null;
    const ensureSession = () => {
      if (!session && contract.ready && contract.mcpInvocation) {
        session = new ComputerSession(contract.mcpInvocation, sessionId, { log: probeLine }, { agentCursor });
      }
      return session;
    };
    const ruled = new Set;
    const ensureRules = async (targetSession) => {
      if (permissionMode === "config" || ruled.has(targetSession))
        return;
      ruled.add(targetSession);
      try {
        const info = await ctx.session.get({ sessionID: targetSession });
        const existing = info.permissions ?? [];
        const additions = [
          ...existing.some((rule) => rule.action === "computer") ? [] : [{ action: "computer", resource: "*", effect: "ask" }],
          ...existing.some((rule) => rule.action === "computer:foreground") ? [] : [{ action: "computer:foreground", resource: "*", effect: "ask" }]
        ];
        if (additions.length) {
          await ctx.session.update({ sessionID: targetSession, permissions: [...existing, ...additions] });
        }
      } catch (error) {
        probeLine(`permission rules unavailable: ${error.message}`);
      }
    };
    const granted = new Set;
    const grantSession = async (targetSession) => {
      if (permissionMode === "config" || approvalMode === "each" || granted.has(targetSession))
        return;
      granted.add(targetSession);
      try {
        await grantSessionApproval(ctx.session, targetSession);
      } catch (error) {
        probeLine(`session approval could not be stored: ${error.message}`);
      }
    };
    const assertPermission = async (input) => {
      await ensureRules(input.sessionID);
      await ctx.permission.assert({
        sessionID: input.sessionID,
        agent: input.agent,
        action: input.action,
        resources: ["*"],
        save: ["*"],
        metadata: { title: `Allow computer use for this session: ${input.title}`, tool: "computer", scope: "session" },
        source: { type: "tool", messageID: input.messageID, id: input.callID }
      });
      await grantSession(input.sessionID);
    };
    const status = makeStatusTool({
      ready: contract.ready,
      reason: contract.reason,
      resolved: contract.resolved,
      version: contract.version,
      installHint,
      sessionId,
      ...contract.ready ? {
        healthFetch: async () => {
          const s = ensureSession();
          if (!s)
            throw new Error("no session");
          const res = await s.call("health_report", {}, 1e4);
          return { ...res.structured ?? {}, ...res.isError ? { degraded: extractTextSafe(res) } : {} };
        }
      } : {}
    });
    const tools = contract.ready ? [
      makeComputerTool({
        session: ensureSession(),
        driverVersion: () => contract.version,
        probeLine,
        captureAfter,
        maxElements,
        assertPermission
      }),
      status
    ] : [status];
    await ctx.tool.transform((editor) => {
      for (const definition of tools)
        editor.add(definition);
    });
    const skillFile = bundledSkillFile();
    if (skillFile) {
      try {
        const content = readFileSync(skillFile, "utf8");
        await ctx.skill.transform((editor) => editor.add({
          id: ID12.make("computer-use"),
          name: Name2.make("Computer Use"),
          description: "Desktop GUI automation with the `computer` tool (cua-driver). Load before the first computer call; use only for real native-app GUI work, never for files, shell, or web pages.",
          autoinvoke: true,
          path: Info12.fields.path.make(skillFile),
          content
        }));
      } catch (error) {
        probeLine(`skill registration unavailable: ${error.message}`);
      }
    }
    return async () => {
      session?.dispose();
      session = null;
    };
  }
});
async function grantSessionApproval(api, targetSession) {
  const info = await api.get({ sessionID: targetSession });
  const existing = info.permissions ?? [];
  const additions = ["computer", "computer:foreground"].filter((action) => !existing.some((rule) => rule.action === action && rule.resource === "*" && rule.effect === "allow")).map((action) => ({ action, resource: "*", effect: "allow" }));
  if (additions.length) {
    await api.update({ sessionID: targetSession, permissions: [...existing, ...additions] });
  }
}
function extractTextSafe(res) {
  return res.content.filter((c) => c.type === "text").map((c) => c.text ?? "").join(`
`).slice(0, 300);
}
export {
  _testInjectProbe,
  plugin_default as default,
  grantSessionApproval
};
