/** R32.47 · Costura neutral entre el DTO local i les RPC R32.44.
 * Les dos escriptures d'una publicació (fila + historial) són etapes del
 * diari: un rebut perdut es reintenta amb el mateix UUID, mai amb un upsert.
 */
import { backendScope, normalizeBackendConfig } from '../config/backendConfig.js';
import { capturaSessio, entradaSessio, usuariDeSessio } from './identitat.js';
import { capturaCampsPagina, historialPaginaAContracteLocal, recursRevisioPagina } from './revisionsPagines.js';
import { desaEdicioPendent, drenaEdicionsPendents, edicionsPendents, nouIdEdicio } from './edicionsPendents.js';
import { projeccioPayload } from '../utils/publicacioUniversal.js';
import { historialRevisionsEditorials, registraCosturaRestauracions, registraLecturaHistorialServidor } from './historialRevisionsEditorials.js';
import { ambPanyMapaRevisions, carregaMapa, marcaConfirmacioRevisio, notifica, persisteixMapa } from './revisionsEditorialsDelNavegador.js';
import { copiaJsonRural } from './persistenciaLocalRural.js';

const predecessors = new Map(), contexts = new Map(), remoteHistories = new Map();
const err = code => Object.assign(new Error('Conserva els canvis locals i revisa la versió del servidor.'), { code, codi: code, ...(code === 'conflicte-versio' ? { status: 409 } : {}) });
const aliases = { title: ['title', 'name'], subtitle: ['post_subtitle', 'subtitle'], lead: ['entradilla', 'lead', 'summary'], content: ['content', 'html'],
  heroImage: ['image_url', 'image'], logoImage: ['logo_image'], copyright: ['copyright'], icon: ['icon'], publishDate: ['publish_date', 'publishDate', 'date'], tags: ['tags'], mostrarAlMur: ['mostrarAlMur'] };
const equal = (a, b) => a === undefined || b === undefined ? a === b : JSON.stringify(copiaJsonRural(a)) === JSON.stringify(copiaJsonRural(b));
function sourceFields(element) {
  const out = {};
  for (const [key, names] of Object.entries(aliases)) {
    const found = names.find(name => element[name] !== undefined);
    if (found) {
      try { Object.assign(out, capturaCampsPagina({ [key]: element[found] })); } catch { /* camp buit/no editorial del lector */ }
    }
  }
  // Només el subconjunt editorial; els altres camps de la fitxa no hi entren.
  try { return capturaCampsPagina(out); } catch { return {}; }
}
const keyOf = (config, seccio, id) => JSON.stringify([backendScope(config), entradaSessio(), seccio, id]);
function resource(operation, config) {
  const key = keyOf(config, operation.seccio, operation.id), prev = predecessors.get(key);
  const input = copiaJsonRural({ ...operation, resource: `${operation.seccio}:${operation.id}`, ...(prev && prev !== operation.operationId ? { predecessorId: prev } : {}) });
  predecessors.set(key, operation.operationId);
  return input;
}
const portActual = async () => import('./backendPort.js');

async function execute(row, { config, check, checkpoint }) {
  const port = await portActual(); check();
  const backend = port.getBackendImplementation();
  const guard = () => { check(); if (port.getBackendImplementation() !== backend) throw new DOMException('El backend ha canviat.', 'AbortError'); };
  const q = row.input;
  if (!port.teCapacitat('revisionsPagines')) throw err('sense-rpc');
  if (q.kind === 'publicacio' && !port.teCapacitat('edicioPublicacionsPropies')) throw err('sense-rpc');
  if (!row.revisionInput) {
    let latest = null, prior = null;
    if (q.predecessorId) {
      prior = (await edicionsPendents(config)).entries.find(x => x.operationId === q.predecessorId);
      guard();
      if (!prior || prior.status !== 'confirmada') throw err('predecessora-pendent');
      latest = prior.revision;
    } else if (q.kind !== 'publicacio' || q.submission.expectedUpdatedAt !== null) {
      const rows = await port.llistaRevisionsPagina({ seccio: q.seccio, id: q.id, limit: 1 }, config);
      guard(); latest = rows[0] || null;
    }
    // El mateix editor pot conservar el DTO llegit abans de la seua primera
    // desada. Només una predecessora pròpia confirmada, del mateix text i
    // token de lectura, pot avançar-lo. Cap token de publicació es reescriu.
    const sameEditor = q.continuaEditor === true && prior?.input.continuaEditor === true && q.kind === 'pagina' && q.nota !== true && prior?.input.kind === 'pagina' && prior.input.nota !== true
      && q.readerVersion === prior.input.readerVersion && equal(q.source, prior.input.source);
    const version = sameEditor ? latest.versio : q.versio ?? latest?.versio ?? 0;
    // Amb una pàgina oberta sense token, només es pot adoptar el token si el
    // text que l'editor ha llegit coincidix amb l'última revisió confirmada.
    if (q.kind === 'pagina' && q.nota !== true && q.versio == null && !q.predecessorId && latest
      && !Object.entries(latest.camps).every(([k, v]) => equal(q.source[k], v))) throw err('conflicte-versio');
    const revisionInput = { seccio: q.seccio, id: q.id, versio: version, operationId: q.revisionOperationId,
      actorEntityId: q.actorEntityId, ...(q.restauraVersio ? { restauraVersio: q.restauraVersio } : { camps: { ...(latest?.camps || {}), ...q.camps } }) };
    row = await checkpoint({ revisionInput }); guard();
  }
  if (q.kind === 'publicacio' && !row.receipt) {
    const submission = { ...q.submission };
    // Checkpoint abans del transport: un retry no refà la precondició.
    if (!row.submissionInput) row = await checkpoint({ submissionInput: submission });
    const receipt = await port.desaPublicacioPropia(row.submissionInput, config); guard();
    row = await checkpoint({ receipt }); guard();
  }
  // actor omés significa «preserva la signatura» en l'RPC pròpia. L'ACK de
  // la fila és l'autoritat per a la signatura de l'historial següent.
  if (q.kind === 'publicacio' && row.receipt && row.revisionInput.actorEntityId !== row.receipt.authorOrgId) {
    row = await checkpoint({ revisionInput: { ...row.revisionInput, actorEntityId: row.receipt.authorOrgId } }); guard();
  }
  if (!row.revision) {
    const revision = await (q.restauraVersio ? port.restauraRevisioPagina : port.desaRevisioPagina)(row.revisionInput, config);
    guard(); await checkpoint({ revision });
    contexts.get(keyOf(config, q.seccio, q.id))?.versions.set(revision.versio, revision.camps);
    const history = remoteHistories.get(keyOf(config, q.seccio, q.id));
    if (history) {
      history.raw = [revision, ...history.raw.filter(row => row.versio !== revision.versio)].slice(0, 20);
      history.rows = historialPaginaAContracteLocal(history.raw);
      notifica();
    }
  }
}

/** Servei per a callers d'edició pròpia: el port cru conserva el seu DTO.
 * El payload complet conserva ambit/estat/dades (fitxa) i la signatura.
 */
export function desaPublicacioPropiaAmbFallback(input, config = {}) {
  input = copiaJsonRural(input);
  config = normalizeBackendConfig({ ...config });
  const operationId = input.operationId || nouIdEdicio();
  const payload = input.payload?.fitxa ? projeccioPayload({ ...input.payload, ...input.payload.fitxa }) : input.payload;
  const submission = { ...input, payload, operationId };
  const r = recursRevisioPagina(submission.sectionId, submission.id);
  if (!r.itemId || !Object.hasOwn(submission, 'expectedUpdatedAt')) throw new TypeError('Falta la precondició de la publicació pròpia.');
  const camps = capturaCampsPagina(sourceFields(payload));
  const actorEntityId = submission.actor?.tipus === 'entitat' ? submission.actor.id : input.authorOrgId ?? null;
  return desaEdicioPendent(resource({ kind: 'publicacio', seccio: r.seccio, id: r.id, camps, source: camps,
    actorEntityId, operationId, revisionOperationId: operationId, submission }, config), config, execute);
}

/** La crida de PublicacioEditable continua desant localment abans d'esperar. */
export function desaRevisioPaginaAmbFallback(seccio, element, camps, config = {}, { continuaEditor = false } = {}) {
  config = normalizeBackendConfig({ ...config });
  const r = recursRevisioPagina(seccio, String(element.id)), nets = capturaCampsPagina(camps);
  const actorEntityId = element.author_org_id ?? element.authorOrgId ?? null;
  if (r.itemId) {
    const payload = { ...element };
    for (const [key, value] of Object.entries(nets)) payload[aliases[key]?.find(k => Object.hasOwn(payload, k)) || aliases[key]?.[0] || key] = value;
    return desaPublicacioPropiaAmbFallback({ id: r.id, sectionId: seccio, payload,
      expectedUpdatedAt: element.updated_at ?? element.updatedAt ?? null,
      ...(actorEntityId ? { actor: { tipus: 'entitat', id: actorEntityId } } : { actor: { tipus: 'persona' } }) }, config);
  }
  const knownVersion = element._paginaVersio ?? element._pageRevisionVersion;
  const operationId = nouIdEdicio();
  const input = resource({ kind: 'pagina', seccio, id: r.id, camps: nets, source: sourceFields(element),
    actorEntityId, operationId, revisionOperationId: operationId, ...(continuaEditor === true ? { continuaEditor: true } : {}), ...(Number.isInteger(knownVersion) ? { versio: knownVersion, readerVersion: knownVersion } : {}) }, config);
  const key = keyOf(config, seccio, r.id), previous = contexts.get(key);
  contexts.set(key, { config, element: { ...element }, source: previous?.source ?? sourceFields(element), versions: previous?.versions ?? new Map() });
  return desaEdicioPendent(input, config, execute);
}

/** Notes conserva publica_nota_al_mur i la seua revisió CAS. Només el
 * payload públic del rebut alimenta l'historial: també en consulta/replay,
 * per a recuperar el tall entre commit de la nota i escriptura al diari.
 */
export function registraHistorialPublicacioNota(submission, receipt, config = {}) {
  config = normalizeBackendConfig({ ...config });
  const row = receipt.publicacio, camps = capturaCampsPagina(sourceFields(row.payload));
  if (row.id !== submission.id || row.section_id !== submission.sectionId || row.tenant_id !== config.tenantId) throw new TypeError('Rebut de publicació fora d’àmbit.');
  return desaEdicioPendent(resource({ kind: 'pagina', nota: true, seccio: row.section_id, id: row.id, camps, source: camps,
    actorEntityId: row.author_org_id ?? null, operationId: submission.operationId, revisionOperationId: submission.operationId,
    noteRevision: receipt.publicada_revision }, config), config, execute);
}

/** Pont per als botons síncrons de Gemini: retorna una promesa addicional,
 * sense canviar el resultat local immediat ni esborrar l'historial servidor.
 */
export function sincronitzaRestauracioEditorial(seccio, id, camps, versio = null) {
  for (const [key, ctx] of contexts) {
    if (key !== keyOf(ctx.config, seccio, id)) continue;
    if (versio === 0) camps = ctx.source;
    if (!camps || !Object.keys(camps).length) return Promise.resolve({ desada: false, desti: null, motiu: 'sense-original' });
    const local = carregaMapa().get(`${seccio}:${id}`);
    const confirm = operation => operation.then(async result => {
      if (result.desti === 'servidor' && local) await ambPanyMapaRevisions(() => {
        const mapa = carregaMapa(true);
        if (mapa.get(`${seccio}:${id}`) !== local) return;
        mapa.set(`${seccio}:${id}`, marcaConfirmacioRevisio(local, { versio: result.versio }, camps));
        persisteixMapa(mapa); notifica();
      });
      return result;
    });
    if (versio > 0 && ctx.versions.has(versio) && equal(ctx.versions.get(versio), camps)) {
      const operationId = nouIdEdicio();
      return confirm(desaEdicioPendent(resource({ kind: 'pagina', seccio, id, camps, source: ctx.source, actorEntityId: ctx.element.author_org_id ?? null,
        operationId, revisionOperationId: operationId, versio: Math.max(...ctx.versions.keys()), restauraVersio: versio }, ctx.config), ctx.config, execute));
    }
    return confirm(desaRevisioPaginaAmbFallback(seccio, { ...ctx.element, ...(ctx.versions.size ? { _paginaVersio: Math.max(...ctx.versions.keys()) } : {}) }, camps, ctx.config));
  }
  return null;
}
registraCosturaRestauracions(sincronitzaRestauracioEditorial);
registraLecturaHistorialServidor((seccio, id) => {
  for (const [key, view] of remoteHistories) {
    try { view.check(); } catch { remoteHistories.delete(key); continue; }
    if (key === keyOf(view.config, seccio, id)) {
      const local = carregaMapa().get(`${seccio}:${id}`);
      if (!local || local.servidor) return view.rows;
    }
  }
  return null;
});
export async function carregaHistorialEditorialServidor(seccio, id, config = {}) {
  config = normalizeBackendConfig({ ...config }); const session = capturaSessio();
  if (!usuariDeSessio() || config.dataMode !== 'remote') return [];
  const port = await portActual(); session();
  if (!port.teCapacitat('revisionsPagines')) return [];
  const backend = port.getBackendImplementation();
  const rows = await port.llistaRevisionsPagina({ seccio, id, limit: 20 }, config); session();
  if (port.getBackendImplementation() !== backend) throw new DOMException('El backend ha canviat.', 'AbortError');
  return historialPaginaAContracteLocal(rows);
}

const pageKeys = { title: 'title', subtitle: 'subtitle', lead: 'lead', content: 'html', heroImage: 'image', logoImage: 'logo_image', copyright: 'copyright', icon: 'icon', publishDate: 'date', tags: 'tags', mostrarAlMur: 'mostrarAlMur' };
/** Lectura per a CoreContent: el resultat canònic porta la versió CAS. Mai
 * reemplaça l'overlay local pendent ni adopta una revisió d'un altre compte.
 * El primer recurs comprova accés abans de desplegar quatre lectures alhora.
 */
export async function hidrataPaginesSistema(pages, config = {}) {
  config = normalizeBackendConfig({ ...config });
  if (!usuariDeSessio() || config.dataMode !== 'remote') return pages;
  const session = capturaSessio(), port = await portActual(); session();
  if (!port.teCapacitat('revisionsPagines') || !Array.isArray(pages) || !pages.length) return pages;
  const backend = port.getBackendImplementation(), result = [...pages];
  const check = () => { session(); if (config.signal?.aborted || port.getBackendImplementation() !== backend) throw new DOMException('La lectura editorial ha canviat.', 'AbortError'); };
  async function read(index) {
    const page = pages[index];
    if (typeof page?.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(page.id)) return;
    const local = carregaMapa().get(`sistema:${page.id}`), history = historialRevisionsEditorials('sistema', page.id);
    const rows = await port.llistaRevisionsPagina({ seccio: 'sistema', id: page.id, limit: 20 }, config); check();
    const latest = rows[0]; if (!latest) return;
    const hydrated = { ...page, _paginaVersio: latest.versio, author_org_id: latest.actorEntityId };
    for (const [key, value] of Object.entries(latest.camps)) if (pageKeys[key]) hydrated[pageKeys[key]] = value;
    if (Object.hasOwn(page, 'content') && Object.hasOwn(latest.camps, 'content')) hydrated.content = latest.camps.content;
    result[index] = hydrated;
    // Les dades locals poden haver canviat mentres arribava la resposta.
    if (carregaMapa().get(`sistema:${page.id}`) === local && (!local || local.servidor)) {
      if (historialRevisionsEditorials('sistema', page.id) === history) remoteHistories.set(keyOf(config, 'sistema', page.id), { config, raw: rows, rows: historialPaginaAContracteLocal(rows), check });
    }
    const key = keyOf(config, 'sistema', page.id), previous = contexts.get(key);
    contexts.set(key, { config, element: hydrated, source: previous?.source ?? sourceFields(page), versions: new Map(rows.map(row => [row.versio, row.camps])) });
  }
  try { await read(0); } catch (error) { check(); if (error?.name === 'AbortError') throw error; return pages; }
  let next = 1;
  await Promise.all(Array.from({ length: Math.min(4, pages.length - 1) }, async () => {
    while (next < pages.length) {
      const index = next++;
      try { await read(index); } catch (error) { check(); if (error?.name === 'AbortError') throw error; }
    }
  }));
  check(); return result;
}
export const sincronitzaEdicionsPendents = (config = {}) => drenaEdicionsPendents(config, execute);
export { edicionsPendents };
export function _reiniciaCosturaEdicionsPerAProves() { predecessors.clear(); contexts.clear(); remoteHistories.clear(); }
