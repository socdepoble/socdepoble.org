/** R32.47 · Diari d'edicions CAS. IDB confirma abans del transport; si no
 * està disponible, la còpia en memòria ho diu explícitament. Un conflicte
 * bloqueja el recurs, conserva l'intent i mai canvia la seua precondició.
 * Cap credencial al diari, cap timer, ni publicació de revisions antigues.
 */
import { backendScope, normalizeBackendConfig } from '../config/backendConfig.js';
import { capturaSessio, entradaSessio, usuariDeSessio } from './identitat.js';
import { creaMagatzemAtomicRural, copiaJsonRural } from './persistenciaLocalRural.js';
import { esUuidRevisio, recursRevisioPagina } from './revisionsPagines.js';

const KEY = 'edicions-r3247';
const stores = new Map(), volatile = new Map(), mirrors = new Map(), flights = new Map();
const copy = value => copiaJsonRural(value, 4 * 1024 * 1024);
const empty = () => ({ revision: 0, entries: [] });
const failure = (code, extra = {}) => Object.assign(new Error('L’edició queda pendent; conserva l’esborrany.'), { code, codi: code, ...extra });
const same = (a, b) => JSON.stringify(copy(a)) === JSON.stringify(copy(b));
function validate(rows) {
  const seen = new Set();
  for (const row of rows) {
    const q = row?.input;
    if (!row || !q || !esUuidRevisio(row.operationId) || seen.has(row.operationId) || row.operationId !== q.operationId
      || !['pagina', 'publicacio'].includes(q.kind) || row.resource !== `${q.seccio}:${q.id}` || q.resource !== row.resource
      || !['pendent', 'confirmada', 'conflicte'].includes(row.status) || row.error !== null && typeof row.error !== 'string') throw failure('diari-invalid');
    recursRevisioPagina(q.seccio, q.id); seen.add(row.operationId);
  }
}
export const nouIdEdicio = () => {
  if (!globalThis.crypto?.randomUUID) throw failure('sense-generador-uuid');
  return globalThis.crypto.randomUUID();
};

function context(config = {}) {
  const cfg = normalizeBackendConfig({ ...config }), actor = usuariDeSessio()?.id?.toLowerCase() ?? null;
  const scope = backendScope(cfg), entry = entradaSessio(), session = capturaSessio();
  const key = JSON.stringify([scope, actor]);
  const check = () => {
    session();
    if (cfg.signal?.aborted || actor !== (usuariDeSessio()?.id?.toLowerCase() ?? null) || entry !== entradaSessio()) throw new DOMException('La sessió de l’edició ha canviat.', 'AbortError');
  };
  let store = stores.get(key);
  if (!store) {
    store = creaMagatzemAtomicRural({ abast: { persona: actor || 'anonim', tenant: cfg.tenantId || 'local', endpoint: cfg.supabaseUrl || 'local', mode: cfg.dataMode }, limitBytes: 4 * 1024 * 1024 });
    stores.set(key, store);
  }
  return { cfg, actor, key, check, store };
}

// Una transacció IDB evita que dos pestanyes esborren intents l'una de l'altra.
// La memòria no es fa passar per una confirmació durable.
async function mutate(ctx, transform) {
  const pending = volatile.get(ctx.key) || [];
  try {
    const value = await ctx.store.actualitzaLot([KEY], current => {
      const state = current[KEY] || empty();
      if (!Array.isArray(state.entries) || !Number.isSafeInteger(state.revision)) throw failure('diari-invalid');
      validate(state.entries);
      for (const row of pending) {
        const index = state.entries.findIndex(x => x.operationId === row.operationId);
        if (index < 0) state.entries.push(copy(row));
        else if (state.entries[index].status !== 'confirmada') state.entries[index] = copy(row);
      }
      const result = transform(state.entries);
      validate(state.entries);
      const needed = new Set(state.entries.filter(x => x.status !== 'confirmada').map(x => x.input.predecessorId));
      const confirmed = state.entries.filter(x => x.status === 'confirmada').length;
      let kept = 0;
      state.entries = state.entries.filter(row => row.status !== 'confirmada' || needed.has(row.operationId) || ++kept > confirmed - 20);
      if (state.entries.length > 100) throw failure('diari-ple');
      return { next: { [KEY]: { revision: state.revision + 1, entries: state.entries } }, value: { result, entries: state.entries } };
    });
    mirrors.set(ctx.key, copy(value.entries));
    volatile.delete(ctx.key);
    return { value: value.result, persistent: true };
  } catch (cause) {
    // Quota/IDB només afecta durabilitat. Un diari corrupte no s'envia.
    if (cause?.code === 'SDP-RURAL-INVALID') throw failure('diari-invalid', { cause });
    if (typeof cause?.cause?.code === 'string' && !cause.cause.code.startsWith('SDP-RURAL-')) throw cause.cause;
    if (!cause?.code?.startsWith('SDP-RURAL-')) throw cause;
    const rows = volatile.get(ctx.key) || copy(mirrors.get(ctx.key) || []);
    validate(rows);
    const value = transform(rows); volatile.set(ctx.key, rows);
    return { value, persistent: false };
  }
}
const result = (row, persistent) => ({ desada: persistent || row.status === 'confirmada', desti: row.status === 'confirmada' ? 'servidor' : 'navegador',
  motiu: !persistent && row.status !== 'confirmada' ? 'sense-persistencia' : row.error || (row.status === 'confirmada' ? null : 'pendent'), operationId: row.operationId, persistent,
  pendent: row.status !== 'confirmada', status: row.status === 'conflicte' ? 409 : undefined,
  ...(row.receipt ? { publicacio: row.receipt } : {}), ...(row.revision ? { versio: row.revision.versio } : {}) });

/** Captura abans d'esperar. Reutilitzar operationId exigix el mateix intent. */
export async function desaEdicioPendent(input, config, execute) {
  const operation = copy(input), ctx = context(config);
  if (typeof execute !== 'function' || typeof operation.operationId !== 'string' || typeof operation.resource !== 'string') throw new TypeError('Intent d’edició invàlid.');
  const saved = await mutate(ctx, rows => {
    const old = rows.find(row => row.operationId === operation.operationId);
    if (old && !same(old.input, operation)) throw failure('operacio-reutilitzada');
    if (old) return copy(old);
    const row = { operationId: operation.operationId, resource: operation.resource, input: operation, status: 'pendent', error: null };
    rows.push(row); return copy(row);
  });
  try { ctx.check(); } catch { return { ...result(saved.value, saved.persistent), motiu: 'avortada' }; }
  // Els intents del mateix recurs van en l'ordre durable. Els ja confirmats
  // no s'envien; un conflicte anterior deixa els successors bloquejats.
  const prior = await mutate(ctx, rows => rows.filter(x => x.resource === operation.resource && x.operationId !== operation.operationId && x.status === 'pendent').map(x => x.operationId));
  for (const id of prior.value) { try { ctx.check(); } catch { return { ...result(saved.value, saved.persistent), motiu: 'avortada' }; } await run(ctx, id, execute); }
  return run(ctx, operation.operationId, execute);
}

async function run(ctx, operationId, execute) {
  const flightKey = `${ctx.key}:${operationId}`;
  if (flights.has(flightKey)) return flights.get(flightKey);
  const task = (async () => {
    let read = await mutate(ctx, rows => copy(rows.find(row => row.operationId === operationId) || null));
    if (!read.value) throw failure('operacio-absent');
    let row = read.value;
    if (row.status === 'confirmada' || row.status === 'conflicte') return result(row, read.persistent);
    const blocked = await mutate(ctx, rows => rows.some(other => other.operationId !== operationId && other.resource === row.resource && other.status !== 'confirmada' && rows.indexOf(other) < rows.findIndex(x => x.operationId === operationId)));
    if (blocked.value) return { ...result(row, read.persistent), motiu: 'predecessora-pendent' };
    const checkpoint = async changes => {
      ctx.check();
      const saved = await mutate(ctx, rows => {
        const actual = rows.find(x => x.operationId === operationId);
        if (!actual) throw failure('operacio-absent');
        // Una altra pestanya pot haver confirmat el mateix UUID mentre esta
        // esperava un transport fallit. L'ACK terminal mai no es degrada.
        if (actual.status === 'confirmada') return copy(actual);
        Object.assign(actual, copy(changes)); return copy(actual);
      });
      row = saved.value; read = saved; return row;
    };
    try {
      ctx.check();
      if (ctx.cfg.dataMode !== 'remote') throw failure('mode-navegador');
      if (!ctx.actor) throw failure('sense-sessio');
      if (globalThis.navigator?.onLine === false) throw failure('sense-cobertura');
      await execute(row, { config: ctx.cfg, check: ctx.check, checkpoint });
      ctx.check(); await checkpoint({ status: 'confirmada', error: null });
    } catch (cause) {
      // Un ACK tardà no modifica el diari d'una sessió nova; el mateix opId
      // permet confirmar l'operació aplicada amb resposta perduda.
      if (cause?.name === 'AbortError') return { ...result(row, read.persistent), motiu: 'avortada' };
      const code = cause?.code || cause?.codi || 'no-disponible';
      const conflict = cause?.status === 409 || code === 'conflicte-versio';
      await checkpoint({ status: conflict ? 'conflicte' : 'pendent', error: conflict ? 'conflicte-versio' : code });
    }
    return result(row, read.persistent);
  })();
  flights.set(flightKey, task);
  try { return await task; } finally { if (flights.get(flightKey) === task) flights.delete(flightKey); }
}

/** Només l'àmbit i compte actuals. Cap esborrany anònim s'adopta en entrar. */
export async function edicionsPendents(config = {}) {
  const ctx = context(config), r = await mutate(ctx, rows => copy(rows)); ctx.check();
  return { entries: r.value, persistent: r.persistent };
}
export async function drenaEdicionsPendents(config, execute) {
  const ctx = context(config), r = await mutate(ctx, rows => rows.filter(x => x.status === 'pendent').map(x => x.operationId));
  const results = [];
  for (const id of r.value) { ctx.check(); results.push(await run(ctx, id, execute)); }
  return results;
}
export function _reiniciaEdicionsPendentsPerAProves() {
  for (const store of stores.values()) store.close();
  stores.clear(); volatile.clear(); mirrors.clear(); flights.clear();
}
