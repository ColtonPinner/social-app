var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// backend/src/worker.js
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
var ALLOWED_IMAGE_TYPES = /* @__PURE__ */ new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp"
]);
var MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
__name(json, "json");
function base64UrlEncode(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(base64UrlEncode, "base64UrlEncode");
function base64UrlDecodeToBytes(input) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
__name(base64UrlDecodeToBytes, "base64UrlDecodeToBytes");
async function hmacSha256(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
}
__name(hmacSha256, "hmacSha256");
async function signJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const signature = await hmacSha256(secret, data);
  const signatureB64 = base64UrlEncode(signature);
  return `${data}.${signatureB64}`;
}
__name(signJwt, "signJwt");
async function verifyJwt(token, secret) {
  const [headerB64, payloadB64, signatureB64] = String(token || "").split(".");
  if (!headerB64 || !payloadB64 || !signatureB64) return null;
  const data = `${headerB64}.${payloadB64}`;
  const expectedSignature = await hmacSha256(secret, data);
  const expectedB64 = base64UrlEncode(expectedSignature);
  if (expectedB64 !== signatureB64) return null;
  const payloadBytes = base64UrlDecodeToBytes(payloadB64);
  const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  if (payload.exp && Date.now() / 1e3 > payload.exp) return null;
  return payload;
}
__name(verifyJwt, "verifyJwt");
async function hashPassword(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 12e4,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}
__name(hashPassword, "hashPassword");
async function createPasswordHash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashPassword(password, salt);
  return `${base64UrlEncode(salt)}:${base64UrlEncode(hash)}`;
}
__name(createPasswordHash, "createPasswordHash");
async function verifyPassword(password, stored) {
  const [saltEncoded, hashEncoded] = String(stored || "").split(":");
  if (!saltEncoded || !hashEncoded) return false;
  const salt = base64UrlDecodeToBytes(saltEncoded);
  const expectedHash = base64UrlDecodeToBytes(hashEncoded);
  const computedHash = await hashPassword(password, salt);
  if (expectedHash.length !== computedHash.length) return false;
  for (let index = 0; index < expectedHash.length; index += 1) {
    if (expectedHash[index] !== computedHash[index]) return false;
  }
  return true;
}
__name(verifyPassword, "verifyPassword");
async function getAuthedUser(request, env2) {
  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  return verifyJwt(token, env2.JWT_SECRET);
}
__name(getAuthedUser, "getAuthedUser");
async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
__name(readJson, "readJson");
async function handleRegister(request, env2) {
  const body = await readJson(request);
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");
  const username = String(body.username || "").trim();
  const fullName = body.fullName ? String(body.fullName).trim() : null;
  if (!email || !password || !username) {
    return json({ error: "email, password, and username are required" }, 400);
  }
  try {
    const userId = crypto.randomUUID();
    const passwordHash = await createPasswordHash(password);
    await env2.DB.prepare(
      `INSERT INTO users (id, email, password_hash, username, full_name)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(userId, email, passwordHash, username, fullName).run();
    const userResult = await env2.DB.prepare(
      `SELECT id, email, username, full_name, avatar_url, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`
    ).bind(userId).first();
    const token = await signJwt(
      {
        userId,
        email,
        exp: Math.floor(Date.now() / 1e3) + 60 * 60 * 24 * 7
      },
      env2.JWT_SECRET
    );
    return json({ user: userResult, token }, 201);
  } catch (error) {
    if (String(error.message || "").includes("UNIQUE")) {
      return json({ error: "Email or username already exists" }, 409);
    }
    return json({ error: "Failed to register user" }, 500);
  }
}
__name(handleRegister, "handleRegister");
async function handleLogin(request, env2) {
  const body = await readJson(request);
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");
  if (!email || !password) {
    return json({ error: "email and password are required" }, 400);
  }
  try {
    const user = await env2.DB.prepare(
      `SELECT id, email, username, full_name, avatar_url, created_at, password_hash
       FROM users
       WHERE email = ?
       LIMIT 1`
    ).bind(email).first();
    if (!user) {
      return json({ error: "Invalid credentials" }, 401);
    }
    const matches = await verifyPassword(password, user.password_hash);
    if (!matches) {
      return json({ error: "Invalid credentials" }, 401);
    }
    const token = await signJwt(
      {
        userId: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1e3) + 60 * 60 * 24 * 7
      },
      env2.JWT_SECRET
    );
    const { password_hash: _passwordHash, ...safeUser } = user;
    return json({ user: safeUser, token });
  } catch {
    return json({ error: "Failed to login" }, 500);
  }
}
__name(handleLogin, "handleLogin");
async function handleMe(request, env2) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  const user = await env2.DB.prepare(
    `SELECT u.id, u.email, u.username, u.full_name, u.avatar_url, u.created_at,
            cp.picture_url AS cover_image_url
     FROM users u
     LEFT JOIN cover_pictures cp ON cp.user_id = u.id
     WHERE u.id = ?
     LIMIT 1`
  ).bind(authed.userId).first();
  if (!user) return json({ error: "User not found" }, 404);
  return json({ user });
}
__name(handleMe, "handleMe");
async function handleUsersList(request, env2) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  const url = new URL(request.url);
  const query = String(url.searchParams.get("query") || "").trim();
  const limitRaw = Number(url.searchParams.get("limit") || 20);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 20, 1), 100);
  let statement;
  if (query) {
    const pattern = `%${query}%`;
    statement = env2.DB.prepare(
      `SELECT id, email, username, full_name, avatar_url, created_at
       FROM users
       WHERE id <> ?
         AND (username LIKE ? OR IFNULL(full_name, '') LIKE ?)
       ORDER BY created_at DESC
       LIMIT ?`
    ).bind(authed.userId, pattern, pattern, limit);
  } else {
    statement = env2.DB.prepare(
      `SELECT id, email, username, full_name, avatar_url, created_at
       FROM users
       WHERE id <> ?
       ORDER BY created_at DESC
       LIMIT ?`
    ).bind(authed.userId, limit);
  }
  const result = await statement.all();
  return json({ items: result.results || [] });
}
__name(handleUsersList, "handleUsersList");
async function handleUserById(request, env2, userId) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  const user = await env2.DB.prepare(
    `SELECT u.id, u.email, u.username, u.full_name, u.avatar_url, u.created_at,
            cp.picture_url AS cover_image_url
     FROM users u
     LEFT JOIN cover_pictures cp ON cp.user_id = u.id
     WHERE u.id = ?
     LIMIT 1`
  ).bind(userId).first();
  if (!user) return json({ error: "User not found" }, 404);
  return json({ user });
}
__name(handleUserById, "handleUserById");
function parseImages(imagesText) {
  try {
    const parsed = JSON.parse(imagesText || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
__name(parseImages, "parseImages");
async function handleFeed(request, env2) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  const result = await env2.DB.prepare(
    `SELECT p.id, p.user_id, p.text, p.images, p.created_at,
            u.id AS author_id, u.username, u.full_name, u.avatar_url
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = ?
        OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
     ORDER BY p.created_at DESC
     LIMIT 100`
  ).bind(authed.userId, authed.userId).all();
  const items = (result.results || []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    text: row.text,
    images: parseImages(row.images),
    created_at: row.created_at,
    user: {
      id: row.author_id,
      username: row.username,
      full_name: row.full_name,
      avatar_url: row.avatar_url
    }
  }));
  return json({ items });
}
__name(handleFeed, "handleFeed");
async function handleCreatePost(request, env2) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  const body = await readJson(request);
  const text = String(body.text || "").trim();
  const images = Array.isArray(body.images) ? body.images.filter(Boolean).map((item) => String(item)) : [];
  if (!text) {
    return json({ error: "text is required" }, 400);
  }
  const insertResult = await env2.DB.prepare(
    `INSERT INTO posts (user_id, text, images)
     VALUES (?, ?, ?)`
  ).bind(authed.userId, text, JSON.stringify(images)).run();
  const postId = insertResult.meta?.last_row_id;
  const post = await env2.DB.prepare(
    `SELECT p.id, p.user_id, p.text, p.images, p.created_at,
            u.id AS author_id, u.username, u.full_name, u.avatar_url
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.id = ?
     LIMIT 1`
  ).bind(postId).first();
  return json(
    {
      item: {
        id: post.id,
        user_id: post.user_id,
        text: post.text,
        images: parseImages(post.images),
        created_at: post.created_at,
        user: {
          id: post.author_id,
          username: post.username,
          full_name: post.full_name,
          avatar_url: post.avatar_url
        }
      }
    },
    201
  );
}
__name(handleCreatePost, "handleCreatePost");
async function handleDeletePost(request, env2, postId) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  if (!Number.isInteger(postId)) {
    return json({ error: "Invalid post id" }, 400);
  }
  const result = await env2.DB.prepare(
    `DELETE FROM posts
     WHERE id = ? AND user_id = ?`
  ).bind(postId, authed.userId).run();
  if (!result.meta?.changes) {
    return json({ error: "Post not found" }, 404);
  }
  return json({ ok: true });
}
__name(handleDeletePost, "handleDeletePost");
async function handleGetComments(request, env2, postId) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  if (!Number.isInteger(postId)) {
    return json({ error: "Invalid post id" }, 400);
  }
  const result = await env2.DB.prepare(
    `SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
            u.id AS commenter_id, u.username, u.full_name, u.avatar_url
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.post_id = ?
     ORDER BY c.created_at DESC`
  ).bind(postId).all();
  const items = (result.results || []).map((row) => ({
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    user: {
      id: row.commenter_id,
      username: row.username,
      full_name: row.full_name,
      avatar_url: row.avatar_url
    }
  }));
  return json({ items, count: items.length });
}
__name(handleGetComments, "handleGetComments");
async function handleCreateComment(request, env2, postId) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  if (!Number.isInteger(postId)) {
    return json({ error: "Invalid post id" }, 400);
  }
  const body = await readJson(request);
  const content = String(body.content || "").trim();
  if (!content) {
    return json({ error: "content is required" }, 400);
  }
  const post = await env2.DB.prepare("SELECT id FROM posts WHERE id = ? LIMIT 1").bind(postId).first();
  if (!post) {
    return json({ error: "Post not found" }, 404);
  }
  const insertResult = await env2.DB.prepare(
    `INSERT INTO comments (post_id, user_id, content)
     VALUES (?, ?, ?)`
  ).bind(postId, authed.userId, content).run();
  const commentId = insertResult.meta?.last_row_id;
  const comment = await env2.DB.prepare(
    `SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
            u.id AS commenter_id, u.username, u.full_name, u.avatar_url
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.id = ?
     LIMIT 1`
  ).bind(commentId).first();
  return json(
    {
      item: {
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        user: {
          id: comment.commenter_id,
          username: comment.username,
          full_name: comment.full_name,
          avatar_url: comment.avatar_url
        }
      }
    },
    201
  );
}
__name(handleCreateComment, "handleCreateComment");
async function handleGetLikes(request, env2, postId) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  if (!Number.isInteger(postId)) {
    return json({ error: "Invalid post id" }, 400);
  }
  const countResult = await env2.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM post_likes
     WHERE post_id = ?`
  ).bind(postId).first();
  const likedResult = await env2.DB.prepare(
    `SELECT id
     FROM post_likes
     WHERE post_id = ? AND user_id = ?
     LIMIT 1`
  ).bind(postId, authed.userId).first();
  return json({
    count: Number(countResult?.count || 0),
    liked: Boolean(likedResult)
  });
}
__name(handleGetLikes, "handleGetLikes");
async function handleLikePost(request, env2, postId) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  if (!Number.isInteger(postId)) {
    return json({ error: "Invalid post id" }, 400);
  }
  await env2.DB.prepare(
    `INSERT OR IGNORE INTO post_likes (post_id, user_id)
     VALUES (?, ?)`
  ).bind(postId, authed.userId).run();
  return json({ ok: true });
}
__name(handleLikePost, "handleLikePost");
async function handleUnlikePost(request, env2, postId) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  if (!Number.isInteger(postId)) {
    return json({ error: "Invalid post id" }, 400);
  }
  await env2.DB.prepare(
    `DELETE FROM post_likes
     WHERE post_id = ? AND user_id = ?`
  ).bind(postId, authed.userId).run();
  return json({ ok: true });
}
__name(handleUnlikePost, "handleUnlikePost");
async function handleUserPosts(request, env2, userId) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  const result = await env2.DB.prepare(
    `SELECT p.id, p.user_id, p.text, p.images, p.created_at,
            u.id AS author_id, u.username, u.full_name, u.avatar_url
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC`
  ).bind(userId).all();
  const items = (result.results || []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    text: row.text,
    images: parseImages(row.images),
    created_at: row.created_at,
    user: {
      id: row.author_id,
      username: row.username,
      full_name: row.full_name,
      avatar_url: row.avatar_url
    }
  }));
  return json({ items });
}
__name(handleUserPosts, "handleUserPosts");
async function handleUserFollowers(request, env2, userId) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  const result = await env2.DB.prepare(
    `SELECT u.id, u.username, u.full_name, u.avatar_url, u.created_at
     FROM follows f
     JOIN users u ON u.id = f.follower_id
     WHERE f.following_id = ?
     ORDER BY f.created_at DESC`
  ).bind(userId).all();
  const items = result.results || [];
  return json({ items, count: items.length });
}
__name(handleUserFollowers, "handleUserFollowers");
async function handleUserFollowing(request, env2, userId) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  const result = await env2.DB.prepare(
    `SELECT u.id, u.username, u.full_name, u.avatar_url, u.created_at
     FROM follows f
     JOIN users u ON u.id = f.following_id
     WHERE f.follower_id = ?
     ORDER BY f.created_at DESC`
  ).bind(userId).all();
  const items = result.results || [];
  return json({ items, count: items.length });
}
__name(handleUserFollowing, "handleUserFollowing");
async function handleFollowStatus(request, env2, userId) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  if (authed.userId === userId) {
    return json({ following: false });
  }
  const result = await env2.DB.prepare(
    `SELECT id
     FROM follows
     WHERE follower_id = ? AND following_id = ?
     LIMIT 1`
  ).bind(authed.userId, userId).first();
  return json({ following: Boolean(result) });
}
__name(handleFollowStatus, "handleFollowStatus");
async function handleFollow(request, env2, userId) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  if (authed.userId === userId) {
    return json({ error: "Cannot follow yourself" }, 400);
  }
  await env2.DB.prepare(
    `INSERT OR IGNORE INTO follows (follower_id, following_id)
     VALUES (?, ?)`
  ).bind(authed.userId, userId).run();
  return json({ ok: true });
}
__name(handleFollow, "handleFollow");
async function handleUnfollow(request, env2, userId) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  await env2.DB.prepare(
    `DELETE FROM follows
     WHERE follower_id = ? AND following_id = ?`
  ).bind(authed.userId, userId).run();
  return json({ ok: true });
}
__name(handleUnfollow, "handleUnfollow");
async function handleUploadImage(request, env2) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  const body = await readJson(request);
  const contentType = String(body.contentType || "").trim().toLowerCase();
  const dataBase64 = String(body.dataBase64 || "").trim();
  const fileName = String(body.fileName || "").trim();
  if (!contentType || !dataBase64) {
    return json({ error: "contentType and dataBase64 are required" }, 400);
  }
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    return json({ error: "Unsupported image content type" }, 400);
  }
  if (!env2.CF_IMAGES_ACCOUNT_ID || !env2.CF_IMAGES_API_TOKEN) {
    return json({ error: "Cloudflare Images is not configured" }, 503);
  }
  let bytes;
  try {
    const binary = atob(dataBase64);
    bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
  } catch {
    return json({ error: "Invalid base64 image payload" }, 400);
  }
  if (!bytes.length || bytes.length > MAX_IMAGE_SIZE_BYTES) {
    return json({ error: "Image must be between 1 byte and 5MB" }, 400);
  }
  const ext = contentType.split("/")[1] || "jpg";
  const safeName = (fileName || `upload-${Date.now()}.${ext}`).replace(/[^a-zA-Z0-9._-]/g, "_");
  const formData = new FormData();
  formData.append("file", new Blob([bytes], { type: contentType }), safeName);
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env2.CF_IMAGES_ACCOUNT_ID}/images/v1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env2.CF_IMAGES_API_TOKEN}`
      },
      body: formData
    }
  );
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok || !payload?.success) {
    return json(
      {
        error: payload?.errors?.[0]?.message || "Failed to upload image to Cloudflare Images"
      },
      502
    );
  }
  const image = payload.result;
  const imageUrl = Array.isArray(image?.variants) ? image.variants[0] : null;
  if (!imageUrl) {
    return json({ error: "Cloudflare Images did not return a usable URL" }, 502);
  }
  return json(
    {
      id: image.id,
      url: imageUrl,
      filename: image.filename
    },
    201
  );
}
__name(handleUploadImage, "handleUploadImage");
async function handlePatchMe(request, env2) {
  const authed = await getAuthedUser(request, env2);
  if (!authed?.userId) return json({ error: "Missing or invalid bearer token" }, 401);
  const body = await readJson(request);
  const hasUsername = body.username !== void 0;
  const hasFullName = body.fullName !== void 0;
  const hasAvatarUrl = body.avatarUrl !== void 0;
  const hasCoverImageUrl = body.coverImageUrl !== void 0;
  const username = hasUsername ? String(body.username || "").trim() : null;
  const fullName = hasFullName ? body.fullName ? String(body.fullName).trim() : null : null;
  const avatarUrl = hasAvatarUrl ? body.avatarUrl ? String(body.avatarUrl).trim() : null : null;
  const coverImageUrl = hasCoverImageUrl ? body.coverImageUrl ? String(body.coverImageUrl).trim() : null : null;
  if (hasUsername && !username) {
    return json({ error: "username cannot be empty" }, 400);
  }
  try {
    await env2.DB.prepare(
      `UPDATE users
       SET username = CASE WHEN ? THEN ? ELSE username END,
           full_name = CASE WHEN ? THEN ? ELSE full_name END,
           avatar_url = CASE WHEN ? THEN ? ELSE avatar_url END
       WHERE id = ?`
    ).bind(hasUsername ? 1 : 0, username, hasFullName ? 1 : 0, fullName, hasAvatarUrl ? 1 : 0, avatarUrl, authed.userId).run();
    if (hasCoverImageUrl) {
      if (coverImageUrl) {
        await env2.DB.prepare(
          `INSERT INTO cover_pictures (user_id, picture_url, updated_at)
           VALUES (?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(user_id) DO UPDATE SET
             picture_url = excluded.picture_url,
             updated_at = CURRENT_TIMESTAMP`
        ).bind(authed.userId, coverImageUrl).run();
      } else {
        await env2.DB.prepare("DELETE FROM cover_pictures WHERE user_id = ?").bind(authed.userId).run();
      }
    }
    const user = await env2.DB.prepare(
      `SELECT u.id, u.email, u.username, u.full_name, u.avatar_url, u.created_at,
              cp.picture_url AS cover_image_url
       FROM users u
       LEFT JOIN cover_pictures cp ON cp.user_id = u.id
       WHERE u.id = ?
       LIMIT 1`
    ).bind(authed.userId).first();
    return json({ user });
  } catch (error) {
    if (String(error.message || "").includes("UNIQUE")) {
      return json({ error: "Username already exists" }, 409);
    }
    return json({ error: "Failed to update user" }, 500);
  }
}
__name(handlePatchMe, "handlePatchMe");
var worker_default = {
  async fetch(request, env2) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    const url = new URL(request.url);
    const { pathname } = url;
    if (pathname === "/health" && request.method === "GET") {
      return json({ ok: true, runtime: "cloudflare-worker-d1" });
    }
    if (pathname === "/api/auth/register" && request.method === "POST") {
      return handleRegister(request, env2);
    }
    if (pathname === "/api/auth/login" && request.method === "POST") {
      return handleLogin(request, env2);
    }
    if (pathname === "/api/auth/me" && request.method === "GET") {
      return handleMe(request, env2);
    }
    if (pathname === "/api/users" && request.method === "GET") {
      return handleUsersList(request, env2);
    }
    if (pathname === "/api/users/me" && request.method === "PATCH") {
      return handlePatchMe(request, env2);
    }
    if (pathname === "/api/feed" && request.method === "GET") {
      return handleFeed(request, env2);
    }
    if (pathname === "/api/posts" && request.method === "POST") {
      return handleCreatePost(request, env2);
    }
    if (pathname === "/api/uploads/image" && request.method === "POST") {
      return handleUploadImage(request, env2);
    }
    const postMatch = pathname.match(/^\/api\/posts\/(\d+)$/);
    if (postMatch && request.method === "DELETE") {
      return handleDeletePost(request, env2, Number(postMatch[1]));
    }
    const commentsMatch = pathname.match(/^\/api\/posts\/(\d+)\/comments$/);
    if (commentsMatch && request.method === "GET") {
      return handleGetComments(request, env2, Number(commentsMatch[1]));
    }
    if (commentsMatch && request.method === "POST") {
      return handleCreateComment(request, env2, Number(commentsMatch[1]));
    }
    const likesMatch = pathname.match(/^\/api\/posts\/(\d+)\/likes$/);
    if (likesMatch && request.method === "GET") {
      return handleGetLikes(request, env2, Number(likesMatch[1]));
    }
    if (likesMatch && request.method === "POST") {
      return handleLikePost(request, env2, Number(likesMatch[1]));
    }
    if (likesMatch && request.method === "DELETE") {
      return handleUnlikePost(request, env2, Number(likesMatch[1]));
    }
    const userPostsMatch = pathname.match(/^\/api\/users\/([^/]+)\/posts$/);
    if (userPostsMatch && request.method === "GET") {
      return handleUserPosts(request, env2, userPostsMatch[1]);
    }
    const userFollowersMatch = pathname.match(/^\/api\/users\/([^/]+)\/followers$/);
    if (userFollowersMatch && request.method === "GET") {
      return handleUserFollowers(request, env2, userFollowersMatch[1]);
    }
    const userFollowingMatch = pathname.match(/^\/api\/users\/([^/]+)\/following$/);
    if (userFollowingMatch && request.method === "GET") {
      return handleUserFollowing(request, env2, userFollowingMatch[1]);
    }
    const followStatusMatch = pathname.match(/^\/api\/users\/([^/]+)\/follow-status$/);
    if (followStatusMatch && request.method === "GET") {
      return handleFollowStatus(request, env2, followStatusMatch[1]);
    }
    const followMatch = pathname.match(/^\/api\/users\/([^/]+)\/follow$/);
    if (followMatch && request.method === "POST") {
      return handleFollow(request, env2, followMatch[1]);
    }
    if (followMatch && request.method === "DELETE") {
      return handleUnfollow(request, env2, followMatch[1]);
    }
    const userMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
    if (userMatch && request.method === "GET") {
      return handleUserById(request, env2, userMatch[1]);
    }
    return json({ error: "Not found" }, 404);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-AMiSfR/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-AMiSfR/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
