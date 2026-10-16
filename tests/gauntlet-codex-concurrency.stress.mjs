/**
 * Local client-contract load assay; never a capacity claim about infrastructure.
 * Run: node --expose-gc node_modules/vitest/vitest.mjs run --config tests/gauntlet-codex.config.mjs
 * Optional: SDP_GAUNTLET_LEVELS=1000 or SDP_GAUNTLET_REPORT=/tmp/result.json.
 *
 * Real xat/notes/content adapters, DTO mapping and Workspace search; transport and
 * one authenticated fixture session are simulated. Each virtual workflow has its
 * own message ID/thread. It is NOT an independent browser, DB connection or user
 * session. All workflows start together and complete asynchronously in one event
 * loop. Latency includes this process's queue/CPU, not real network latency.
 * Transport idempotence is an injected oracle, not a test of Postgres/RLS.
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { RealtimeClient } from '@supabase/realtime-js';

const mock = vi.hoisted(() => ({
  user: { id: '11111111-1111-4111-8111-111111111111' },
  request: null, client: null, networkAttempts: 0,
}));
vi.mock('../src/data/supabase/config.js', () => ({ getClient: async () => mock.client }));
vi.mock('../src/data/identitat.js', () => ({
  usuariDeSessio: () => mock.user,
  getDefaultUserId: () => mock.user.id,
  idConvidat: () => 'convidat-seed',
}));
vi.mock('../src/data/appSeed.js', () => ({
  getDefaultUserId: () => mock.user.id, NOTE_FOLDERS_SEED: [], APP_SEED: { notes: [] },
}));
vi.mock('../src/data/supabase/runtime.js', () => ({
  getCurrentUser: () => mock.user,
  getResolvedConfig: config => ({ ...config, runtimeDataMode: 'remote', hasSupabaseConfig: true }),
  generateUUID: () => crypto.randomUUID(),
  request: (...args) => mock.request(...args),
  rpc: () => { throw new Error('Unconfigured RPC'); },
  buildSeedAppData: async () => ({}),
  mapContentRowsToData: () => ({}),
  ErrorSupabase: class extends Error { constructor(message, status) { super(message); this.status = status; } },
}));

import { enviaMissatge, loadMissatges, subscribeToXat, unsubscribeFromXat } from '../src/data/supabase/xat.js';
import { loadNotesPage } from '../src/data/supabase/notes.js';
import { loadMur, loadSeccioPage } from '../src/data/supabase/content.js';
import { filterWorkspaceItems, createWorkspaceState } from '../src/components/universal/workspace/workspaceState.js';

const config = { tenantId: '22222222-2222-4222-8222-222222222222' };
const uid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const noteRows = [6, 5, 4, 3, 2, 1].map(n => ({ id: uid(n), title: `Nota ${n} ${n % 2 ? 'muntanya' : 'aigua'}`,
  revision: 0, status: 'activa', folder_id: 'f-notes', tags: ['rural'] }));
const wallRows = [3, 2, 1].map(n => ({ id: uid(n), title: `Publicació ${n}`,
  created_at: `2026-10-15T00:00:0${n}.000000Z`, owner_user_id: mock.user.id,
  payload: { title: `Publicació ${n}`, type: 'sistema', ownerUserId: 'forged', authorOrgId: 'forged' } }));
const levels = (process.env.SDP_GAUNTLET_LEVELS || '1000,5000,10000,40000').split(',').map(Number);
if (levels.some(n => ![1000, 5000, 10000, 40000].includes(n))) throw new Error('Use only 1000/5000/10000/40000 virtual workflows.');
const reportPath = process.env.SDP_GAUNTLET_REPORT || '/tmp/sdp-gauntlet-codex-stress.json';
const report = {
  kind: 'local-client-contract-simulation', node: process.version, createdAt: new Date().toISOString(),
  scope: 'One event loop and fixture session; real adapters and search, simulated transport. No browser/DB/RLS/infra capacity claim.',
  scenarios: [], probes: [], networkAttempts: 0,
  sourceSha256: Object.fromEntries([
    'src/data/supabase/xat.js', 'src/data/supabase/notes.js', 'src/data/supabase/content.js',
    'src/data/mapejadorSeccions.js', 'src/components/universal/workspace/workspaceState.js',
    'node_modules/@supabase/realtime-js/src/RealtimeClient.ts',
  ].map(path => [path, createHash('sha256').update(readFileSync(path)).digest('hex')])),
};
let activeTransport;
const mib = n => Number((n / 1048576).toFixed(2));
const heap = () => process.memoryUsage().heapUsed;
const percentile = (xs, p) => Number(xs[Math.min(xs.length - 1, Math.ceil(xs.length * p) - 1)].toFixed(2));

function transport({ injectErrors = false } = {}) {
  const messages = new Map(), channels = new Set(), attempts = new Map();
  const state = { active: 0, maxActive: 0, requests: 0, injectedErrors: 0, retries: 0, peakHeap: heap() };
  async function dispatch(fn, signal) {
    state.requests++;
    state.active++;
    state.maxActive = Math.max(state.maxActive, state.active);
    if (state.requests % 1024 === 0) state.peakHeap = Math.max(state.peakHeap, heap());
    try {
      await nextTurn();
      if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
      return fn();
    } finally {
      state.active--;
      if (state.requests % 1024 === 0 || state.active === 0) state.peakHeap = Math.max(state.peakHeap, heap());
    }
  }
  const client = {
    rpc(name, args) {
      let signal;
      return {
        abortSignal(value) { signal = value; return this; },
        then(resolve, reject) {
          return dispatch(() => {
            if (name === 'xat_envia') {
              const count = (attempts.get(args.p_id) || 0) + 1; attempts.set(args.p_id, count);
              if (injectErrors && Number(args.p_fil_id.slice(3)) % 100 === 0 && count === 1) {
                state.injectedErrors++;
                return { data: null, status: 503, error: { message: 'Injected unavailable' } };
              }
              if (count > 1) state.retries++;
              if (!messages.has(args.p_id)) messages.set(args.p_id, {
                id: args.p_id, fil_id: args.p_fil_id, seq: 1, cos: args.p_text, usuari_id: mock.user.id,
                creat_al: '2026-10-15T00:00:00Z',
              });
              return { data: [messages.get(args.p_id)], error: null, status: 200 };
            }
            if (name === 'xat_historial') {
              return { data: [messages.get(`message-${args.p_fil_id.slice(3)}`)].filter(Boolean), error: null, status: 200 };
            }
            throw new Error(`Unexpected RPC ${name}`);
          }, signal).then(resolve, reject);
        },
      };
    },
    channel(name) {
      const channel = { name, on() { return this; }, subscribe() { channels.add(this); return this; } };
      return channel;
    },
    async removeChannel(channel) { channels.delete(channel); return 'ok'; },
  };
  const request = (path, cfg, options = {}) => dispatch(() => {
    assert.equal(cfg.tenantId, config.tenantId);
    const parsed = new URL(path, 'http://simulation.invalid');
    const params = parsed.searchParams;
    assert.equal(params.get('tenant_id'), `eq.${config.tenantId}`);
    if (parsed.pathname.endsWith('/notes')) {
      assert.equal(params.get('owner_user_id'), `eq.${mock.user.id}`);
      const after = params.get('id')?.slice(3);
      const remaining = noteRows.filter(row => !after || row.id < after);
      const rows = remaining.slice(0, 2); // server max-rows below the requested page size
      options.onResponseMetadata?.({ contentRange: rows.length ? `0-${rows.length - 1}/${remaining.length}` : '*/0' });
      return rows;
    }
    if (parsed.pathname.endsWith('/app_content')) return [];
    if (parsed.pathname.endsWith('/section_submissions')) {
      const section = params.get('section_id');
      const remaining = section !== 'eq.mur' ? [] : params.has('or') ? wallRows.slice(2) : wallRows;
      const rows = remaining.slice(0, 2);
      options.onResponseMetadata?.({ contentRange: rows.length ? `0-${rows.length - 1}/${remaining.length}` : '*/0' });
      return rows;
    }
    throw new Error(`Unexpected route ${parsed.pathname}`);
  }, options.signal);
  return { state, messages, channels, attempts, client, request, clear() { messages.clear(); channels.clear(); attempts.clear(); } };
}

beforeAll(() => {
  vi.stubGlobal('fetch', () => { mock.networkAttempts++; throw new Error('Network forbidden in this harness'); });
});
afterAll(async () => {
  activeTransport?.clear();
  report.networkAttempts = mock.networkAttempts;
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  vi.unstubAllGlobals();
  console.log(`GAUNTLET_REPORT ${reportPath}`);
});

describe('Gauntlet: simultaneous virtual client workflows, no external traffic', () => {
  for (const size of levels) it(`${size} virtual workflows: chat, notes search and wall`, async () => {
    activeTransport?.clear(); global.gc?.();
    const beforeHeap = heap();
    const t = transport({ injectErrors: true }); activeTransport = t;
    mock.client = t.client; mock.request = t.request;
    const latencies = [], failures = [];
    const start = performance.now();
    await Promise.all(Array.from({ length: size }, async (_, i) => {
      const began = performance.now();
      try {
        const filId = `vu-${i}`, input = { id: `message-${i}`, text: `Missatge ${i}` };
        let message;
        try { message = await enviaMissatge(filId, input, config); }
        catch (error) { assert.equal(error.retriable, true); message = await enviaMissatge(filId, input, config); }
        assert.equal(message.id, input.id); assert.equal(message.seq, 1);
        const history = await loadMissatges(filId, config);
        assert.equal(history.length, 1); assert.equal(history[0].id, input.id);
        if (i % 100 === 0) assert.equal((await enviaMissatge(filId, input, config)).seq, 1);
        const notes = []; let cursor = null;
        for (let page = 0; page < 4; page++) {
          const result = await loadNotesPage({ ownerUserId: mock.user.id, cursor }, config);
          notes.push(...result.notes);
          if (result.complete) break;
          assert.notEqual(result.nextCursor, cursor); cursor = result.nextCursor;
        }
        assert.equal(notes.length, 6); assert.equal(new Set(notes.map(n => n.id)).size, 6);
        const matches = filterWorkspaceItems(notes, createWorkspaceState({ query: 'muntanya' }));
        assert.deepEqual(matches.map(n => n.id), [uid(5), uid(3), uid(1)]);
        const first = await loadMur(mock.user.id, config);
        assert.equal(first.feedPosts.length, 2);
        assert.equal(first.feedPosts[0].ownerUserId, mock.user.id);
        assert.equal(first.feedPosts[0].authorOrgId, null);
        assert.notEqual(first.feedPosts[0].type, 'sistema');
        const next = await loadSeccioPage({ seccio: 'mur', cursor: first.paginacio.mur }, config);
        assert.equal(next.complete, true);
        assert.deepEqual([...first.feedPosts, ...next.elements].map(row => row.id), [uid(3), uid(2), uid(1)]);
      } catch (error) {
        failures.push({ virtualWorkflow: i, message: error.message });
      } finally { latencies.push(performance.now() - began); }
    }));
    latencies.sort((a, b) => a - b);
    const elapsedMs = performance.now() - start;
    const result = { virtualWorkflows: size, finished: latencies.length, errors: failures.length,
      failureExamples: failures.slice(0, 5), durationMs: Number(elapsedMs.toFixed(2)),
      p50Ms: percentile(latencies, .5), p95Ms: percentile(latencies, .95), p99Ms: percentile(latencies, .99),
      requestsToSimulator: t.state.requests, peakInFlightRequests: t.state.maxActive,
      injected503: t.state.injectedErrors, retriedOrDuplicateAttempts: t.state.retries,
      storedMessages: t.messages.size, pendingRequestsAfter: t.state.active,
      heapBeforeMiB: mib(beforeHeap), sampledPeakHeapMiB: mib(t.state.peakHeap), rssMiB: mib(process.memoryUsage().rss),
      gcAvailable: typeof global.gc === 'function',
    };
    t.clear(); latencies.length = 0; failures.length = 0;
    await nextTurn(); global.gc?.();
    result.heapAfterClearMiB = mib(heap());
    report.scenarios.push(result); console.log('GAUNTLET_SCENARIO', JSON.stringify(result));
    expect(result.errors).toBe(0);
    expect(result.storedMessages).toBe(size);
    expect(result.injected503).toBe(size / 100);
    expect(result.peakInFlightRequests).toBeGreaterThanOrEqual(size);
    expect(result.pendingRequestsAfter).toBe(0);
    expect(mock.networkAttempts).toBe(0);
  });

  it('40000 remote subscriptions are released; cancellation does not dispatch RPC', async () => {
    const t = transport(); activeTransport = t; mock.client = t.client;
    const opened = await Promise.all(Array.from({ length: 40000 }, (_, i) => subscribeToXat(`vu-${i}`, () => {}, config)));
    expect(t.channels.size).toBe(40000);
    await Promise.all(opened.map(({ subscription }) => unsubscribeFromXat(subscription, config)));
    const controller = new AbortController(); controller.abort();
    await expect(enviaMissatge('vu-cancelled', 'Cancel·lat', { ...config, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(t.channels.size).toBe(0); expect(t.state.requests).toBe(0);
    report.probes.push({ name: 'subscription-cleanup-and-pre-abort', subscriptions: 40000, remaining: t.channels.size, pass: true });
  });

  it('rejects a repeated Notes/Mur page rather than looping forever', async () => {
    mock.request = async (path, _cfg, options) => {
      options.onResponseMetadata?.({ contentRange: '0-0/2' });
      return path.includes('/notes?') ? [noteRows[0]] : [wallRows[0]];
    };
    await expect(loadNotesPage({ ownerUserId: mock.user.id, cursor: JSON.stringify([config.tenantId, mock.user.id, noteRows[0].id]) }, config)).rejects.toThrow('no avança');
    await expect(loadSeccioPage({ seccio: 'mur', cursor: JSON.stringify([config.tenantId, 'mur', wallRows[0].created_at, wallRows[0].id]) }, config)).rejects.toThrow('no avança');
    report.probes.push({ name: 'nonadvancing-cursors', pass: true });
  });

  it('rejects invalid chat confirmations instead of accepting NaN sequence numbers', async () => {
    mock.client = { rpc: () => ({ data: [{ id: 'm-bad', seq: 'invalid' }], error: null }) };
    let output, failure;
    try { output = await enviaMissatge('vu-bad', { id: 'm-bad', text: 'Prova' }, config); }
    catch (error) { failure = error; }
    const pass = failure?.code === 'SENSE_CONFIRMACIO' && failure?.retriable === true;
    report.probes.push({ name: 'invalid-chat-ack-sequence', pass, acceptedSequence: output ? String(output.seq) : null });
    expect(failure, 'A malformed acknowledgement must produce the retriable confirmation error')
      .toMatchObject({ code: 'SENSE_CONFIRMACIO', retriable: true });
  });

  it('does not lose the owner when the installed Realtime client fails to remove a channel', async () => {
    // Real installed SDK channel ownership/removal; only the leave response is
    // injected. Subscribe is inert, so the client never opens a WebSocket.
    const client = new RealtimeClient('ws://127.0.0.1:1/realtime/v1', { params: { apikey: 'simulation-only' } });
    const createChannel = client.channel.bind(client);
    let attempts = 0;
    client.channel = (...args) => {
      const channel = createChannel(...args);
      channel.subscribe = () => channel;
      const unsubscribe = channel.unsubscribe.bind(channel);
      channel.unsubscribe = async () => {
        attempts++;
        return attempts === 1 ? 'error' : unsubscribe();
      };
      return channel;
    };
    mock.client = client;
    try {
      const { subscription } = await subscribeToXat('vu-removal-error', () => {}, config);
      let failure;
      try { await unsubscribeFromXat(subscription, config); } catch (error) { failure = error; }
      if (client.getChannels().length) await unsubscribeFromXat(subscription, config);
      const remaining = client.getChannels().length;
      report.probes.push({ name: 'unsubscribe-error-recoverability-real-sdk', pass: remaining === 0,
        removeAttempts: attempts, remaining, surfacedError: Boolean(failure) });
      expect(failure).toMatchObject({ code: 'CANAL_NO_TANCAT', retriable: true });
      expect(attempts).toBe(2);
      expect(remaining, 'Failed removal must retain retry ownership or tear down the channel').toBe(0);
    } finally { await client.removeAllChannels(); }
  });
});
