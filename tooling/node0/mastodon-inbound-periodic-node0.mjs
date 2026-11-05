/** Automatic inbound reconciliation for the fixed public @depoble account.
 * Uses the existing explicit individual-GET withdrawal proof and SQL tombstones.
 * No OAuth, publication, arbitrary URL, credential header or outgoing POST.
 * A timed-out dependency keeps its single-flight slot until actual settlement.
 */
import { sincronitzaMastodonPrivacitat } from './reconciliacio-mastodon-node0.mjs';
import { peticioMastodont } from './xarxa-node0.mjs';

export const LIMITS_MASTODON_INBOUND = Object.freeze({ intervalMs: 300000, maxBackoffMs: 1800000, runDeadlineMs: 45000, networkDeadlineMs: 10000 });
const CODES = new Set(['mastodon_inbound_unavailable', 'mastodon_inbound_timeout', 'mastodon_inbound_status_unavailable']);
const fail = code => Object.assign(new Error(code), { code });
const iso = value => {
  if (typeof value !== 'string' || value.length > 30 || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
};
export function normalitzaMastodonInbound(value) {
  return Object.freeze({ enabled: value?.enabled === true, lastSuccess: iso(value?.lastSuccess),
    errorCode: value?.errorCode == null ? null : CODES.has(value.errorCode) ? value.errorCode : 'mastodon_inbound_status_unavailable' });
}
function publicGetUrl(value) {
  if (typeof value !== 'string' || value.length > 512) return false;
  let url; try { url = new URL(value); } catch { return false; }
  if (url.origin !== 'https://mastodont.cat' || url.username || url.password || url.hash || url.port) return false;
  if (url.pathname === '/.well-known/webfinger') return url.search === '?resource=acct%3Adepoble%40mastodont.cat';
  if (url.pathname === '/api/v1/accounts/lookup') return url.search === '?acct=depoble';
  if (/^\/api\/v1\/statuses\/[1-9][0-9]{0,29}$/.test(url.pathname)) return url.search === '';
  return /^\/api\/v1\/accounts\/[1-9][0-9]{0,29}\/statuses$/.test(url.pathname) &&
    /^\?limit=40&exclude_reblogs=true(?:&max_id=[1-9][0-9]{0,29})?$/.test(url.search);
}

export function creaMastodonInboundPeriodic({ db, fetchImpl = peticioMastodont, now = Date.now,
  intervalMs = LIMITS_MASTODON_INBOUND.intervalMs, maxBackoffMs = LIMITS_MASTODON_INBOUND.maxBackoffMs,
  runDeadlineMs = LIMITS_MASTODON_INBOUND.runDeadlineMs, networkDeadlineMs = LIMITS_MASTODON_INBOUND.networkDeadlineMs,
  timers = { setTimeout, clearTimeout } } = {}) {
  if (!db || typeof db.query !== 'function' || typeof fetchImpl !== 'function' || typeof now !== 'function' ||
    typeof timers?.setTimeout !== 'function' || typeof timers?.clearTimeout !== 'function' ||
    !Number.isSafeInteger(intervalMs) || intervalMs < 60000 || intervalMs > 3600000 ||
    !Number.isSafeInteger(maxBackoffMs) || maxBackoffMs < intervalMs || maxBackoffMs > 3600000 ||
    !Number.isSafeInteger(runDeadlineMs) || runDeadlineMs < 1 || runDeadlineMs > 60000 ||
    !Number.isSafeInteger(networkDeadlineMs) || networkDeadlineMs < 1 || networkDeadlineMs > 10000)
    throw new TypeError('mastodon_inbound_configuration_invalid');
  let enabled = false, epoch = 0, timer = null, active = null, failures = 0, lastSuccess = null, errorCode = null;
  const clearScheduled = () => { if (timer !== null) { timers.clearTimeout(timer); timer = null; } };
  const retryDelay = () => Math.min(maxBackoffMs, intervalMs * 2 ** Math.min(failures, 16));
  const status = () => normalitzaMastodonInbound({ enabled, lastSuccess, errorCode });
  const schedule = delay => {
    clearScheduled();
    if (!enabled) return;
    timer = timers.setTimeout(() => { timer = null; return launch().catch(() => {}); }, delay);
    timer?.unref?.();
  };
  const launch = () => {
    if (!enabled) return Promise.reject(fail('mastodon_inbound_disabled'));
    if (active) return active.visible;
    const cycle = { epoch, controller: new AbortController(), cancelled: false, deadline: null, visible: null, transports: new Set() };
    active = cycle;
    const check = () => { if (cycle.controller.signal.aborted) throw fail('mastodon_inbound_stopped'); };
    const track = task => {
      const actual = Promise.resolve(task);
      cycle.transports.add(actual);
      void actual.then(() => { cycle.transports.delete(actual); }, () => { cycle.transports.delete(actual); });
      return actual;
    };
    const guardedDb = { async query(...args) { check(); const result = await db.query(...args); check(); return result; } };
    const get = async (url, options = {}) => {
      check();
      if (options.method !== 'GET' || options.body != null || !publicGetUrl(url)) throw fail('mastodon_inbound_unavailable');
      // Rebuild the options instead of forwarding caller-supplied credentials.
      const response = await track(Promise.resolve().then(() => { check(); return fetchImpl(url, { method: 'GET', headers: { Accept: 'application/json, application/jrd+json',
        'Cache-Control': 'no-cache', Pragma: 'no-cache' }, redirect: 'error', credentials: 'omit', cache: 'no-store',
        referrerPolicy: 'no-referrer', signal: options.signal ? AbortSignal.any([cycle.controller.signal, options.signal]) : cycle.controller.signal }); }));
      check();
      const body = response?.body;
      return { url: response?.url, ok: response?.ok, status: response?.status, headers: response?.headers,
        body: typeof body?.getReader === 'function' ? { getReader() {
          const reader = body.getReader();
          return { read: () => track(reader.read()), cancel: () => track(reader.cancel()), releaseLock: () => reader.releaseLock() };
        } } : body };
    };
    const work = Promise.resolve().then(() => { check(); return sincronitzaMastodonPrivacitat({ db: guardedDb, fetchImpl: get, now, deadlineMs: networkDeadlineMs }); });
    const settled = work.then(result => ({ ok: true, result }), () => ({ ok: false, code: 'mastodon_inbound_unavailable' }));
    const deadline = new Promise(resolve => {
      cycle.deadline = timers.setTimeout(() => {
        cycle.controller.abort(); resolve({ ok: false, code: 'mastodon_inbound_timeout' });
      }, runDeadlineMs);
      cycle.deadline?.unref?.();
    });
    const visible = Promise.race([settled, deadline]).then(outcome => {
      if (enabled && cycle.epoch === epoch && !cycle.cancelled) {
        if (outcome.ok) {
          let timestamp = null;
          try { timestamp = new Date(now()).toISOString(); } catch { /* Do not publish an invalid clock value or diagnostic. */ }
          if (timestamp === null) outcome = { ok: false, code: 'mastodon_inbound_unavailable' };
          else { lastSuccess = timestamp; errorCode = null; failures = 0; }
        }
        if (!outcome.ok) { errorCode = outcome.code; failures = Math.min(failures + 1, 16); }
      }
      return outcome;
    });
    cycle.visible = visible.then(outcome => {
      if (cycle.cancelled) throw fail('mastodon_inbound_stopped');
      if (!outcome.ok) throw fail(outcome.code);
      return outcome.result;
    });
    // Keep actual work single-flight even after the public deadline. The abort
    // guards prevent a delayed lookup/HTTP plan from starting a later SQL write.
    void settled.then(async () => {
      await visible;
      cycle.controller.abort();
      timers.clearTimeout(cycle.deadline);
      // The reconciliation plan itself has an inner deadline. It can settle
      // while a transport ignores cancellation; keep the slot for the actual
      // GET/read/cancel promises rather than only the plan's Promise.race.
      while (cycle.transports.size) await Promise.allSettled([...cycle.transports]);
      if (active === cycle) active = null;
      if (enabled) schedule(cycle.epoch === epoch ? retryDelay() : 0);
    });
    return cycle.visible;
  };
  return Object.freeze({
    status,
    start() {
      if (enabled) return false;
      enabled = true; epoch++; failures = 0; schedule(0); return true;
    },
    runNow() { clearScheduled(); return launch(); },
    async stop() {
      enabled = false; epoch++; clearScheduled();
      if (!active) return;
      active.cancelled = true; active.controller.abort();
      await active.visible.catch(() => {});
    }
  });
}
