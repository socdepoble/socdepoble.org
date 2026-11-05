/** Startup only: retry unavailable local PostgreSQL, never an authority failure. */
export const LIMITS_ESPERA_POSTGRES = Object.freeze({ timeoutMs: 120000, initialDelayMs: 250, maxDelayMs: 5000 });
const failure = code => new Error(code);

export function errorPostgresTransitori(error) {
  if (error?.message === 'node0_database_transport_unavailable') return true;
  return error?.message === 'node0_database_query_failed'
    && typeof error.sqlState === 'string'
    && /^(?:08[0-9A-Z]{3}|57P0[123])$/.test(error.sqlState);
}

export function comprovaArrencadaActiva(signal) {
  if (signal?.aborted) throw failure('node0_startup_aborted');
}

export function cancelacioArrencadaNodeZero(processLike = process) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  processLike.once('SIGTERM', abort);
  processLike.once('SIGINT', abort);
  return { signal: controller.signal, close() {
    processLike.removeListener('SIGTERM', abort);
    processLike.removeListener('SIGINT', abort);
  } };
}

export async function esperaPostgresNodeZero({ probe, signal, timeoutMs = LIMITS_ESPERA_POSTGRES.timeoutMs,
  initialDelayMs = LIMITS_ESPERA_POSTGRES.initialDelayMs, maxDelayMs = LIMITS_ESPERA_POSTGRES.maxDelayMs,
  now = () => performance.now(), setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  if (typeof probe !== 'function' || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 300000
    || !Number.isInteger(initialDelayMs) || initialDelayMs < 1 || !Number.isInteger(maxDelayMs)
    || maxDelayMs < initialDelayMs || maxDelayMs > 10000) throw failure('node0_startup_options_invalid');
  comprovaArrencadaActiva(signal);
  const controller = new AbortController();
  let stopped = null;
  const stop = code => { if (!stopped) { stopped = code; controller.abort(); } };
  const upstreamAbort = () => stop('node0_startup_aborted');
  signal?.addEventListener('abort', upstreamAbort, { once: true });
  const started = now(), deadline = started + timeoutMs;
  const deadlineTimer = setTimer(() => stop('node0_startup_deadline'), timeoutMs);
  const check = () => {
    if (!stopped && now() >= deadline) stop('node0_startup_deadline');
    if (stopped) throw failure(stopped);
  };
  const bounded = operation => new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, value) => {
      if (settled) return; settled = true;
      controller.signal.removeEventListener('abort', abort);
      error ? reject(error) : resolve(value);
    };
    const abort = () => finish(failure(stopped || 'node0_startup_aborted'));
    controller.signal.addEventListener('abort', abort, { once: true });
    Promise.resolve().then(() => { check(); return operation(); }).then(value => finish(null, value), finish);
  });
  const pause = ms => new Promise((resolve, reject) => {
    let timer;
    const finish = (error) => { clearTimer(timer); controller.signal.removeEventListener('abort', abort); error ? reject(error) : resolve(); };
    const abort = () => finish(failure(stopped || 'node0_startup_aborted'));
    controller.signal.addEventListener('abort', abort, { once: true });
    timer = setTimer(() => finish(), ms);
    if (controller.signal.aborted) abort();
  });
  let attempts = 0, delay = initialDelayMs;
  try {
    for (;;) {
      check(); attempts++;
      try {
        const ready = await bounded(() => probe({ signal: controller.signal }));
        check();
        if (ready !== true) throw failure('node0_startup_probe_invalid');
        return { attempts, elapsedMs: Math.max(0, now() - started) };
      } catch (error) {
        check();
        if (!errorPostgresTransitori(error)) throw error;
      }
      await pause(Math.min(delay, Math.max(1, deadline - now())));
      delay = Math.min(maxDelayMs, delay * 2);
    }
  } finally {
    clearTimer(deadlineTimer);
    signal?.removeEventListener('abort', upstreamAbort);
  }
}
