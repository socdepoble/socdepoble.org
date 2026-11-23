import { esTokenPublicacio, ordreTokenPublicacio } from '../publicacionsCas.js';
import { desaPublicacioPropia as desaPublicacioBetaCas } from './publicacionsPropies.js';
import { capturaSessio } from '../identitat.js';
import { marcaFilesEditorials } from '../editorialPublicada.js';
import { aplicaRevisionsSeed, marcaFontRevisioSeed } from '../seedRevisions.js';
import { loadSeedRevisions } from './seedRevisions.js';
import { getDefaultUserId } from '../appSeed.js';
import { elementDeFilaPublicada, mapSectionSubmissionToItem, mergeById } from '../mapejadorSeccions.js';
import { buildSeedAppData, generateUUID, getCurrentUser, getResolvedConfig, mapContentRowsToData, request } from './runtime.js';
import { enviaMissatge } from './xat.js';
import { ambCodi, CODI_ENTRADA, CODI_ESQUEMA_ABSENT } from '../errorsBackend.js';
import { SECCIONS_PAGINABLES } from '../contracte.js';
/* Tasca 5 (ordre del Mestre, 261001) · Les dates de prova del Mur: només el
   mode seed les porta (les pàgines de sistema es servixen igual en remot,
   amb la seua data de creació). */
import { llavorAmbDatesDeProva } from '../../sections/mur/datesDeProvaMur.js';
import { CURSOS_PEDRA_EN_SEC_2026_EVENT } from '../../sections/mur/eventsSeed.js';
/* IDEA-116 (Onada R9, R9V-C2-01) · La instantània de la primera publicació del Mur: un tros
   diferit (la llavor, appSeed.js, ja la porta), mai l'entrada. */
import { NOVES_TECNOLOGIES_CULTURA_RURAL_POST } from '../../sections/mur/articles/novesTecnologiesCulturaRuralContent.js';
import { LA_VEU_DE_SOC_DE_POBLE_POST } from '../../sections/mur/articles/laVeuDeSocDePobleContent.js';
import { COPIES_SEGURETAT_SOC_DE_POBLE_POST } from '../../sections/mur/articles/copiesSeguretatSocDePobleContent.js';
/* Onada 11 (261010; prompt 261010_1730, tasca 2) · La personalització del
   poble (taxonomia i estil) viatja dins de loadCoreContent com a camp
   ADDITIU i opcional: en remot, de les files d'app_content; en seed o local,
   del magatzem en memòria de personalitzacio.js. */
import { CLAUS_PERSONALITZACIO, personalitzacioDeFiles, personalitzacioLocal } from './personalitzacio.js';
import { llistaDe } from '../../utils/autocuracio.js';
import { hidrataCatalegAgents } from '../catalegAgents.js';
import { normalitzaFilesEditorials } from '../contingutEditorialPublic.js';
import { comprovaPublicacioNoRetirada, drenaRevocacionsMur } from './copublicacioMur.js';
import { elementDeMurPublic, elementDeMurMembre } from '../murPublic.js';

const SECCIONS = new Set(['mur', 'mercat', 'events', 'multimedia', 'notes']);
/* T2 (ordre del Mestre, 260930) · Com auth.js: la comprovació de mode local
   és explícita (no `!== 'remote'`), perquè una configuració sense mode és remota. */
const MODES_LOCALS = new Set(['seed', 'local']);

/* ── Decisió 4 del Mestre (261007) · «Tall de 50 publicacions: CARREGA
   PROGRESSIVA (LOAD MORE).» Capacitat 'paginacioSeccions' (contracte.js,
   ADR-2026-11-PAGINACIO-SECCIONS), calcada de loadNotesPage (notes.js).
   · Cursor de conjunt de claus (created_at, id), el mateix ordre de la
     primera pàgina (order=created_at.desc,id.desc): estable amb empats, sense
     salts per offset quan arriben publicacions noves.
   · El final: amb les RPC de R21, una pàgina amb menys files de les demanades
     (el servidor en garantix com a mínim 50); amb la lectura d'abans, com
     loadNotesPage, només un rang amb total o una pàgina buida (esCompletaRpc
     i esCompletaPerRang, baix).
   · El cursor és opac per a la interfície i porta el poble i la secció: no
     val per a un altre àmbit. ── */
const LIMIT_SECCIO = 50;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/* Un timestamptz tal com el servix PostgREST (ISO 8601, fins als microsegons). */
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.(\d{1,6}))?(?:Z|[+-]\d{2}:\d{2})$/;

/* La sessió tria l'entrada autenticada; només el servidor resol pertinença.
   Un Foraster autenticat rep el mateix DTO mínim que un visitant.
   Gauntlet R22 (dades-01) · Un servidor que encara no té les migracions del
   Mur de R21 respon 404 PGRST202 (cap funció amb eixa signatura). El Mur no
   cau per això, i la lectura no diu més del que el servidor fa:
     · sense llig_mur_membres (només 2611121430): la lectura mínima de
       llig_mur_public, com un visitant (el servidor ja no deixa llegir la
       taula als membres);
     · sense cap de les dues (cap migració de R21): la lectura d'abans, de
       section_submissions amb les columnes d'autoria (elementDeFilaPublicada),
       que és el que eixe servidor servix a tothom.
   Cap altre error (un 404 genèric, PGRST205, un 401) no hi entra: només
   PGRST202 demostra que falta la funció (runtime.esRpcAbsent). `complet`
   diu si la pàgina és la darrera, amb la regla de cada camí. */
const COLUMNES_PUBLICACIO = 'id,payload,title,created_at,updated_at,owner_user_id,author_org_id';
const RANG = /^(?:0-(\d+)|\*)\/(\d+)$/;
/* El mateix criteri que runtime.esRpcAbsent (moltes proves substituïxen runtime.js sencer). */
const esRpcAbsent = error => error?.status === 404 && error?.postgrestCode === 'PGRST202';
const elementDeFila = (row, sectionId) => elementDeFilaPublicada({ id: row.id, payload: row.payload, titol: row.title,
  createdAt: row.created_at, updatedAt: row.updated_at, ownerUserId: row.owner_user_id, authorOrgId: row.author_org_id,
  ...(typeof sectionId === 'string' ? { sectionId } : {}) });

/* Les RPC de R21 limiten amb least(p_limit, 51) (membres) i least(p_limit, 200)
   (públic), i el client no en demana mai més de 50 (LIMIT_SECCIO): tots els
   filtres són al WHERE, abans del LIMIT. Una pàgina amb menys files de les
   demanades és, per tant, la darrera (Gauntlet R22, dades-07). */
const esCompletaRpc = (rows, limit) => rows.length < limit;
/* La lectura d'abans (COMMIT 4): només un rang amb total o una pàgina buida
   confirmen el final, perquè max-rows podria tallar abans. */
function esCompletaPerRang(rows, contentRange) {
  const rang = RANG.exec(contentRange || '');
  return rows.length === 0 || (rang !== null && Number(rang[2]) === rows.length);
}

async function lligPublicacionsAnteriors(tenant, section, limit, config, { before, signal }) {
  const filtre = before === null ? '' : `&or=${encodeURIComponent(
    `(created_at.lt."${before.createdAt}",and(created_at.eq."${before.createdAt}",id.lt."${before.id}"))`)}`;
  let contentRange = null;
  const rows = await request(
    `/rest/v1/section_submissions?select=${COLUMNES_PUBLICACIO}&tenant_id=eq.${encodeURIComponent(tenant)}`
    + `&section_id=eq.${section}${filtre}&order=created_at.desc,id.desc&limit=${limit}`, config,
    { signal, headers: { Prefer: 'count=exact' }, onResponseMetadata: (metadades) => { contentRange = metadades.contentRange; } });
  if (!Array.isArray(rows) || rows.length > limit) throw new Error('Resposta de la secció amb un format inesperat.');
  return { rows, elements: rows.map(row => elementDeFila(row, section)), complet: esCompletaPerRang(rows, contentRange) };
}

/* v1.2.22 · Integració (costura de Codex R32.42 lot 03; Gauntlet R1, L4-05; CDP r1) · La RPC7 del Mur públic
   (llig_mur_public_v7 des de la v1.2.23, L4-10; p_inclou_visibilitat) només la té un servidor amb la migració
   20261122160300_r32_42_mur_visibilitat_publica.sql, que la v1.2.22 no aplicava a producció. Negociar-la contra aquell
   servidor costava quatre 404 per càrrega de pàgina (una per secció del Mur) a tots els visitants (CDP r1: 332 respostes
   404 en 83 escenaris), i tres peticions per secció al foraster autenticat. Per això el build només la negocia amb
   VITE_SDP_MUR_VISIBILITAT exactament '1'. Sense la bandera, la RPC6 de sempre: cap petició nova i cap flag
   mostrar_al_mur inventat (murPublic.js només el copia si el servidor el dona). */
/* v1.2.23 · costura bandera del Mur · L'integrador aplica a Producció les migracions 127-131 (T2), esta inclosa (fila
   129 de supabase/README.md), i la bandera entra a BANDERES_DE_CAPACITAT (tooling/vite/banderes-de-capacitat.mjs): els
   builds web, natiu i WP la pleguen com a literal '1' o '', igual que VITE_SDP_IAIA_SERVIDOR (supabase/index.js), també
   en l'accés opcional d'ací baix. Aplicar la migració no encén la bandera: la RPC7 continua sent opt-in del build. */
const negociaVisibilitatMur = () => import.meta.env?.VITE_SDP_MUR_VISIBILITAT === '1';

async function lligPublicacions(tenant, section, limit, config, { before = null, signal } = {}) {
  const sessionGuard = capturaSessio();
  const autenticat = Boolean(getCurrentUser()?.id);
  const senyal = signal || config.signal;
  const params = new URLSearchParams({ p_tenant_id: tenant, p_section_id: section, p_limit: String(limit) });
  if (before) { params.set('p_before_created_at', before.createdAt); params.set('p_before_id', before.id); }
  const llig = async (membres, ambSessio = false) => {
    const opts = { signal: senyal, ...(membres || ambSessio ? {} : { anonim: true }) };
    if (membres) return request(`/rest/v1/rpc/llig_mur_membres?${params}`, config, opts);
    if (!negociaVisibilitatMur()) return request(`/rest/v1/rpc/llig_mur_public?${params}`, config, opts);
    // v1.2.23 · L4-10 (ordre del Mestre 261123) · La RPC7 té nom propi, llig_mur_public_v7: cap sobrecàrrega de la RPC6.
    // Discriminador obligatori, sis opcions amb defaults; un servidor sense la migració respon PGRST202 i es torna a la RPC6.
    const publics = new URLSearchParams(params); publics.set('p_inclou_visibilitat', 'true');
    try { return await request(`/rest/v1/rpc/llig_mur_public_v7?${publics}`, config, opts); }
    catch (error) { if (!esRpcAbsent(error)) throw error; sessionGuard(); }
    return request(`/rest/v1/rpc/llig_mur_public?${params}`, config, opts);
  };
  let data, ambSobre = autenticat;
  try {
    data = await llig(autenticat);
  } catch (error) {
    if (!esRpcAbsent(error)) throw error;
    sessionGuard();
    try {
      if (!autenticat) throw error;
      data = await llig(false);
      ambSobre = false;
    } catch (absent) {
      if (!esRpcAbsent(absent)) throw absent;
      sessionGuard();
      const anteriors = await lligPublicacionsAnteriors(tenant, section, limit, config, { before, signal: senyal });
      sessionGuard();
      return anteriors;
    }
  }
  sessionGuard();
  // Un compte autenticat que és foraster rep un DTO públic dins de l'envelope.
  // Eixa branca antiga tampoc porta el flag: renegociem la mateixa RPC7 mínima
  // que el visitant, sense inferir pertinença ni ampliar el DTO de membres.
  if (negociaVisibilitatMur() && ambSobre && data?.lectura === 'public') {
    data = await llig(false, true); ambSobre = false; sessionGuard();
  }
  const membre = ambSobre && data?.lectura === 'membre';
  const rows = ambSobre ? data?.files : data;
  if (!Array.isArray(rows) || rows.length > limit || (ambSobre && !['membre', 'public'].includes(data?.lectura))) {
    throw new Error('Resposta de la secció amb un format inesperat.');
  }
  return { rows, complet: esCompletaRpc(rows, limit),
    elements: rows.map(row => membre ? elementDeMurMembre(row, section) : elementDeMurPublic(row, section)) };
}

/* Decisió 4 · La clau (created_at, id) d'una fila, o null si no és prou
   fiable per a fer de cursor. `ordre` és l'instant en microsegons (Date
   perdria els sis decimals de Postgres i dos files del mateix
   mil·lisegon semblarien iguals). */
function clauDeFila(createdAt, id) {
  const instant = typeof createdAt === 'string' ? INSTANT.exec(createdAt) : null;
  if (!instant || !UUID.test(String(id ?? ''))) return null;
  const milisegons = Date.parse(createdAt.replace(/\.\d+/, ''));
  if (Number.isNaN(milisegons)) return null;
  return { createdAt, id: String(id).toLowerCase(), ordre: milisegons * 1000 + Number((instant[1] || '').padEnd(6, '0')) };
}
/* Estrictament més vella que `anterior` en l'ordre created_at.desc,id.desc. */
const esMesVella = (clau, anterior) => clau.ordre < anterior.ordre || (clau.ordre === anterior.ordre && clau.id < anterior.id);
const cursorDe = (tenantId, seccio, clau) => JSON.stringify([tenantId, seccio, clau.createdAt, clau.id]);

/* Relleu 261008 (revisió adversarial) · La clau de l'última fila que en té
   una de fiable. created_at el posa el client a l'INSERT i ni la política ni
   el trigger el fiten (auditoria 261007; el remei de fons és la migració que
   el fite a now(), pendent): un veí pot deixar '-infinity', una data aC o un
   any de cinc xifres. Eixes files s'ordenen als extrems (les de l'infinit
   negatiu i les aC, al final), es pinten igual però no fan de cursor: una
   sola no pot deixar en error la pàgina sencera, ni el «Mostra més» per a
   tot el poble. */
function ultimaClau(rows) {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const clau = clauDeFila(rows[i]?.created_at, rows[i]?.id);
    if (clau) return clau;
  }
  return null;
}

/* Auditoria 261007 (B) · Retirada loadAppData: no era al contracte
   (contracte.js), backendPort no l'exposava i ningú no la cridava. Era un
   segon mapeig de notes que divergia del de notes.js (sense copyright, estat
   ni icon) i escampava el payload de section_submissions sense les columnes
   d'autoria. El Mur es carrega amb loadMur; les notes, amb el port de notes. */
export async function appendChatMessages(messages, config = {}) {
  const result = [];
  for (const message of Array.isArray(messages) ? messages : []) {
    /* Onada R29 · PF-02: l'id de qui crida viatja com a p_id (xat_envia és idempotent per
       p_id), igual que a l'adaptador local i al decorador E2EE: reenviar la mateixa llista no
       duplica. Sense id, normalitzaCos en genera un de nou, com abans.
       Segona passada (DADES-R29-02): només viatja un id amb forma d'UUID (la columna p_id és uuid); un altre id
       no arriba al servidor com a 22P02 opac i el missatge s'envia amb un UUID nou, com abans de R29. */
    const id = UUID.test(String(message.id ?? '')) ? message.id : undefined;
    result.push(await enviaMissatge(message.threadId ?? message.filId, { id, text: message.text }, config));
  }
  return result;
}
/* R32.11 · Contracte general nou, preparat localment. Només l'opció explícita
   expectedUpdatedAt l'activa; una RPC absent no es degrada a l'upsert legacy. */
function capturaJsonCas(value, depth = 0) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (!value || typeof value !== 'object' || depth > 24
      || ![Object.prototype, Array.prototype, null].includes(Object.getPrototypeOf(value))) throw new TypeError('Payload CAS invàlid.');
  const out = Array.isArray(value) ? [] : {};
  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === 'length') continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || !descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.value === undefined
        || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new TypeError('Payload CAS invàlid.');
    out[key] = capturaJsonCas(descriptor.value, depth + 1);
  }
  return out;
}
const instantCas = esTokenPublicacio;
async function publicaCasGeneral(input, config) {
  // Snapshot complet abans del primer await; ni el DTO ni config poden canviar
  // l'operació que hem lligat a la sessió i al backend originals.
  const sub = capturaJsonCas(input), cfg = { ...config }, resolved = getResolvedConfig(cfg);
  const { tenantId, hasSupabaseConfig, runtimeDataMode, supabaseUrl } = resolved;
  if (MODES_LOCALS.has(runtimeDataMode)) throw ambCodi(new Error('En mode de proves no es publica al servidor.'), CODI_ENTRADA.MODE_LOCAL);
  if (!hasSupabaseConfig || !UUID.test(tenantId ?? '')) throw new Error('Falta configuració del servidor.');
  const checkSession = capturaSessio(), ownerUserId = getCurrentUser()?.id;
  const check = () => {
    checkSession(); const current = getResolvedConfig(config);
    if (cfg.signal?.aborted || config.signal !== cfg.signal || current.tenantId !== tenantId
      || current.supabaseUrl !== supabaseUrl || current.runtimeDataMode !== runtimeDataMode || !current.hasSupabaseConfig
      || getCurrentUser()?.id !== ownerUserId) throw new DOMException('El context de publicació ha canviat.', 'AbortError');
  };
  if (Array.isArray(sub) || !UUID.test(ownerUserId ?? '') || !UUID.test(sub.id ?? '') || !UUID.test(sub.operationId ?? '')
    || !SECCIONS.has(sub.sectionId) || sub.noteId !== undefined || sub.consulta === true
    || sub.expectedUpdatedAt !== null && !instantCas(sub.expectedUpdatedAt)
    || !sub.payload || Array.isArray(sub.payload) || typeof sub.payload !== 'object') throw new TypeError('Intent CAS de publicació invàlid.');
  const teDrets = value => value !== undefined && value !== null && (typeof value !== 'string' || value.trim() !== '');
  if (teDrets(sub.payload.copyright) || teDrets(sub.copyright)) throw Object.assign(new Error('El CAS general encara no té contracte per a conservar estos drets: conserva l’esborrany.'), { codi: 'drets-cas-no-disponibles' });
  const actor = sub.actor;
  if (actor !== undefined && (!actor || !['persona', 'entitat'].includes(actor.tipus)
    || actor.tipus === 'entitat' && !UUID.test(actor.id ?? ''))) throw new TypeError('Autoria CAS invàlida.');
  const authorOrgId = actor?.tipus === 'entitat' ? actor.id : null;
  const payload = mapSectionSubmissionToItem({ ...sub, ownerUserId, createdAt: '',
    payload: { ...sub.payload, id: sub.id, ownerUserId, sectionId: sub.sectionId } });
  // La data de creació la fixa el servidor: cap data generada en un reintent
  // pot canviar el hash d'una operació que ja s'ha confirmat.
  for (const key of ['created_at', 'updated_at', 'updatedAt', 'origen', 'copyright', 'seller', 'autor', 'source', 'srcDelPort']) delete payload[key];
  const title = typeof sub.title === 'string' ? sub.title : payload.title || '';
  const description = typeof sub.description === 'string' ? sub.description : payload.description || payload.summary || '';
  const body = { p_id: sub.id, p_tenant_id: tenantId, p_section_id: sub.sectionId, p_payload: payload,
    p_title: title, p_description: description, p_author_org_id: authorOrgId, p_preserve_author: actor === undefined,
    p_expected_updated_at: sub.expectedUpdatedAt, p_operation_id: sub.operationId };
  check(); let receipt;
  try { receipt = await request('/rest/v1/rpc/publica_section_submission_cas', cfg, { method: 'POST', body, signal: cfg.signal }); }
  catch (error) {
    check();
    if (esRpcAbsent(error)) throw Object.assign(new Error('El servidor encara no té el CAS general: conserva l’esborrany i l’operació.', { cause: error }), { codi: CODI_ESQUEMA_ABSENT, status: 404 });
    if (/SDP-PUB-CAS-006/.test(error?.message ?? '')) throw Object.assign(new Error('El CAS general encara no té contracte per a conservar estos drets: conserva l’esborrany.', { cause: error }), { codi: 'drets-cas-no-disponibles' });
    /* v1.2.23 · L4-02 (Gauntlet R1) · runtime.js desa el SQLSTATE a `sqlstate`; `postgrestCode` només porta PGRST###. */
    if (error?.sqlstate === '40001' || error?.postgrestCode === '40001' || /SDP-PUB-CAS-003/.test(error?.message ?? '')) throw Object.assign(new Error('La publicació ha canviat: conserva l’esborrany i recarrega.', { cause: error }), { codi: 'conflicte-versio' });
    throw error;
  }
  check();
  const ack = capturaJsonCas(receipt), keys = ['id','tenant_id','owner_user_id','section_id','operation_id','updated_at','created_at','author_org_id','replay'];
  if (!ack || Array.isArray(ack) || Object.keys(ack).length !== keys.length || !keys.every(key => Object.hasOwn(ack, key))
    || ack.id !== sub.id || ack.tenant_id !== tenantId || ack.owner_user_id !== ownerUserId || ack.section_id !== sub.sectionId
    || ack.operation_id !== sub.operationId || !instantCas(ack.updated_at) || !instantCas(ack.created_at)
    || typeof ack.replay !== 'boolean' || ack.author_org_id !== null && !UUID.test(ack.author_org_id)
    || actor !== undefined && ack.author_org_id !== authorOrgId
    || ordreTokenPublicacio(ack.created_at) > ordreTokenPublicacio(ack.updated_at)
    || sub.expectedUpdatedAt !== null && ordreTokenPublicacio(ack.updated_at) <= ordreTokenPublicacio(sub.expectedUpdatedAt)) throw new TypeError('Rebut CAS de publicació invàlid.');
  check();
  return { id: sub.id, ownerUserId, authorOrgId: ack.author_org_id, sectionId: sub.sectionId, title, description,
    payload, createdAt: ack.created_at, updatedAt: ack.updated_at, operationId: sub.operationId, replay: ack.replay };
}
export async function appendSectionSubmissionNetworkOnly(submission, config = {}) {
  // Entrada explícita per al contracte R32.44; el caller conserva token i operationId.
  if (submission?.casBeta === true) {
    /* v1.2.23 · L4-05 i L6-06 (Gauntlet R1) · La mateixa bandera que la capacitat edicioPublicacionsPropies (index.js):
       sense VITE_SDP_EDICIO_PROPIA_CAS=1 cap petició a la RPC de la 130 i cap caiguda al CAS general, que canviaria la
       semàntica del titular. L'esborrany i l'operació queden en mans del caller. */
    if (import.meta.env.VITE_SDP_EDICIO_PROPIA_CAS !== '1') throw Object.assign(new Error('L’edició pròpia encara no està disponible: conserva l’esborrany i l’operació.'), { codi: 'no-disponible' });
    return desaPublicacioBetaCas(submission, config);
  }
  if (submission && Object.hasOwn(submission, 'expectedUpdatedAt')) return publicaCasGeneral(submission, config);
  const { hasSupabaseConfig, tenantId, runtimeDataMode } = getResolvedConfig(config);
  /* T2 · En mode de proves la publicació no viatja: ho diu sense cap petició,
     en lloc de publicar al servidor des d'una demostració. */
  if (MODES_LOCALS.has(runtimeDataMode)) {
    throw ambCodi(new Error('En mode de proves no es publica al servidor.'), CODI_ENTRADA.MODE_LOCAL);
  }
  if (!hasSupabaseConfig) throw new Error('No es pot escriure publicació sense connexió al servidor.');
  if (!tenantId) throw new Error('Poble no configurat.');
  const sessionGuard = capturaSessio();
  const ownerUserId = getCurrentUser()?.id;
  if (!ownerUserId) throw new Error('Cal iniciar sessió per publicar.');
  const sectionId = String(submission?.sectionId || '').trim(); if (!SECCIONS.has(sectionId)) throw new Error('Secció no suportada per a connectar.');
  const id = String(submission?.id || generateUUID()); const createdAt = submission?.createdAt || new Date().toISOString();
  if (submission.consulta !== true) await comprovaPublicacioNoRetirada(id, config);
  sessionGuard();
  const basePayload = submission?.payload && typeof submission.payload === 'object' ? submission.payload : {};
  const payload = mapSectionSubmissionToItem({ ...submission, id, ownerUserId, sectionId, createdAt,
    payload: { ...basePayload, id, ownerUserId, sectionId, created_at: basePayload.created_at || createdAt } });
  /* I2 · Qui signa. Una entitat sense id no es degrada a persona: signar amb un
     altre nom del que s'ha triat és pitjor que no publicar. El servidor (M18 i
     la política d'INSERT) decidix si la persona pot signar per eixa entitat.
     Sense actor (una crida d'abans d'I2) la columna no s'envia: l'upsert no
     esborra la signatura d'una publicació que ja en tenia. */
  const actor = submission?.actor;
  if (actor?.tipus === 'entitat' && !actor.id) throw new Error('Falta l’entitat que signa la publicació.');
  const authorOrgId = actor?.tipus === 'entitat' ? String(actor.id) : null;
  const stored = { id, ownerUserId, authorOrgId, sectionId, title: submission?.title || payload.title || '',
    description: submission?.description || payload.description || payload.summary || '', createdAt, payload };
  const fila = { id, tenant_id: tenantId, owner_user_id: ownerUserId, section_id: sectionId, title: stored.title,
    description: stored.description, payload, created_at: createdAt };
  if (actor) fila.author_org_id = authorOrgId;
  if (submission?.noteId !== undefined) {
    if (!UUID.test(String(submission.noteId)) || !UUID.test(id) || !UUID.test(String(submission.operationId))
        || !Number.isSafeInteger(submission.expectedNoteRevision) || submission.expectedNoteRevision < 1) throw new TypeError('Intent atòmic de publicació invàlid.');
    let receipt;
    try {
      receipt = await request('/rest/v1/rpc/publica_nota_al_mur', config, { method: 'POST', body: {
        p_note_id: submission.noteId, p_act_id: id, p_section_id: sectionId,
        p_payload: submission.consulta === true ? null : { payload, title: stored.title, description: stored.description, author_org_id: authorOrgId },
        p_expected_revision: submission.expectedNoteRevision, p_operation_id: submission.operationId
      } });
    } catch (error) {
      /* Gauntlet R22 (dades-01) · Sense la migració 2611122200 no hi ha publicació atòmica:
         no s'ha publicat res i reintentar no ho canviarà. Es diu amb el codi (CODI_ESQUEMA_ABSENT),
         mai com una xarxa caiguda ni amb un upsert que trencaria el vincle nota-acte. */
      if (esRpcAbsent(error)) {
        throw Object.assign(new Error('El servidor encara no té la publicació de notes al Mur d’esta versió: no s’ha publicat res.', { cause: error }),
          { codi: CODI_ESQUEMA_ABSENT, status: 404 });
      }
      throw error;
    }
    sessionGuard();
    if (submission.consulta === true && (receipt === null || receipt?.retirada === true)) return receipt;
    if (!receipt || receipt.publicacio?.id !== id || !Number.isSafeInteger(receipt.nota_revision)
        || receipt.nota_revision < 1 || !Number.isSafeInteger(receipt.publicada_revision)
        || receipt.publicada_revision < 1 || receipt.publicada_revision > receipt.nota_revision || typeof receipt.replay !== 'boolean') throw new TypeError('Rebut atòmic de publicació invàlid.');
    return receipt;
  }
  const desades = await request('/rest/v1/section_submissions?on_conflict=id', config, { method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' }, body: [fila] });
  sessionGuard();
  /* Onada R32 (Codex R31 lot_01, part que val amb l'esquema viu) · La versió
     del servidor torna amb la fila que ja demanava `return=representation`:
     updated_at, el text exacte de PostgREST (fins als microsegons, sense passar
     per Date). Només l'acredita una fila única amb el mateix id i un instant
     estricte; si no, el retorn és el d'abans, sense versió, mai una inventada.
     El camí legacy continua sense CAS; el camí opt-in usa la RPC explícita de dalt. */
  const desada = Array.isArray(desades) && desades.length === 1 ? desades[0] : null;
  return desada?.id === id && typeof desada.updated_at === 'string' && INSTANT.test(desada.updated_at)
    && Number.isFinite(Date.parse(desada.updated_at)) ? { ...stored, updatedAt: desada.updated_at } : stored;
}
/* Onada 11 (261010) · Les claus d'app_content que demana loadCoreContent. */
const CLAUS_CORE = ['towns', 'agents', ...CLAUS_PERSONALITZACIO].join(',');
export async function loadCoreContent(ownerUserId = getDefaultUserId(), config = {}) {
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config); const seed = await buildSeedAppData(ownerUserId);
  if (runtimeDataMode === 'seed') return { towns: normalitzaFilesEditorials(seed.towns), pages: llavorAmbDatesDeProva(seed).pages, pageCopy: {}, agents: hidrataCatalegAgents(seed.agents), ownerUserId, personalitzacio: personalitzacioLocal() };
  if (runtimeDataMode === 'local') return { towns: [], pages: seed.pages, pageCopy: {}, agents: hidrataCatalegAgents([]), ownerUserId, personalitzacio: personalitzacioLocal() };
  if (!hasSupabaseConfig) throw new Error('Falten credencials de Supabase per carregar el contingut Core.');
  if (!tenantId) throw new Error('Poble no configurat: falta tenantId (VITE_TENANT_ID).');
  const rows = await request(`/rest/v1/app_content?select=key,payload,version&key=in.(${CLAUS_CORE})&tenant_id=eq.${encodeURIComponent(tenantId)}`, config, { signal: config.signal });
  const base = mapContentRowsToData(rows || []);
  return { towns: normalitzaFilesEditorials(base.towns), pages: seed.pages, pageCopy: {}, agents: hidrataCatalegAgents(base.agents), ownerUserId, personalitzacio: personalitzacioDeFiles(rows || []) };
}
/** Carrega exclusivament les fonts d’una secció; Notes té el seu port propi.
 * Decisió 4 del Mestre (261007) · Amb `ambPaginacio` (només loadMur), demana
 * el total de cada secció i afig a la resposta el camp ADDITIU `paginacio`
 * ({ [seccio]: cursor }) per a les seccions que tenen més files. La forma del
 * nucli no canvia: sense cap secció pendent, el camp ni hi és. */
async function loadSections(ownerUserId, config, sections, { ambPaginacio = false } = {}) {
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (runtimeDataMode === 'local') return Object.fromEntries(sections.map(([key]) => [key, []]));
  if (runtimeDataMode === 'seed') {
    const seed = llavorAmbDatesDeProva(await buildSeedAppData(ownerUserId));
    return Object.fromEntries(sections.map(([key]) => [key, normalitzaFilesEditorials(seed[key])]));
  }
  if (!hasSupabaseConfig || !tenantId) throw new Error('Falta configuració de dades del poble.');
  const sessionGuard = capturaSessio();
  const tenant = encodeURIComponent(tenantId);
  // La lectura recupera també una cua pendent després de recarregar. Una
  // retirada encara sense ACK no impedix llegir: el drenatge va a banda, sense
  // esperar-lo (Gauntlet R22, dades-03; com NotesContext · reprenRetirades).
  // Cada fila pot tardar fins a 12 s i el port talla la lectura als 15 s.
  // Ronda 3 · Si la lectura arriba abans que l'ACK, encara porta la publicació:
  // l'ACK l'anota al registre d'esborrades (copublicacioMur.js · amagaLaRetirada)
  // i el Mur la deixa de mostrar sense esperar cap recàrrega.
  void drenaRevocacionsMur(config).catch(() => {});
  const keys = sections.map(([key]) => key).join(',');
  const [rows, ...submissions] = await Promise.all([
    request(`/rest/v1/app_content?select=key,payload,version&key=in.(${keys})&tenant_id=eq.${tenant}`, config, { signal: config.signal }),
    ...sections.map(([, section]) => lligPublicacions(tenantId, section, LIMIT_SECCIO, config))
  ]);
  /* Auditoria 261007 (B) · Les d'app_content no passen per elementDeFila: són
     de l'administració i signen legítimament dins del payload.
     Onada 12 (261011; ordres 261011_0130, punt 7) · llistaDe: una fila amb un
     objecte on toca una llista es pren buida, en lloc de rebutjar la càrrega
     sencera del Mur ([...primary] de mergeById); les publicacions dels veïns
     es pinten igual. */
  /* IDEA-116 (Onada R9, carril C2) · El poble de la llavor editorial: app_content
     porta el Manifest al Mur o l'Aplec a l'agenda (producció, 06-11-2026: l'Aplec
     i els cursos de pedra en sec es veuen al Mur). */
  const llavorEditorial = rows.some((row) => Array.isArray(row?.payload)
    && row.payload.some((item) => item?.id === 'manifest-de-poble' || item?.id === 'aplec-2023'));
  const llistes = Object.fromEntries(await Promise.all(sections.map(async ([key, section], index) => {
    /* R12 (B4-S1) · Cada element porta la versió de la fila (_editorialVersio):
       la revisió editorial la necessita per a la RPC amb CAS de versió. */
    const filaEditorial = rows.find(row => row.key === key);
    let baseAppContent = marcaFilesEditorials(normalitzaFilesEditorials(llistaDe(filaEditorial?.payload, key)), key, filaEditorial?.version);
    if (section === 'mur' || section === 'events') {
      const ids = [...new Set(baseAppContent.map(item => item.id).filter(id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id)))];
      const revisions = [];
      try {
        for (let offset = 0; offset < ids.length; offset += 200) revisions.push(...await loadSeedRevisions({ seccio: section, ids: ids.slice(offset, offset + 200) }, config));
        /* Àrbitre R11 (R33-L2-01) · Només amb la lectura reeixida: sense taula o
           sense resposta, la peça no oferix el camí d'escriptura de llavor. */
        baseAppContent = marcaFontRevisioSeed(aplicaRevisionsSeed(baseAppContent, revisions, filaEditorial?.version), filaEditorial?.version);
      } catch (error) {
        /* Àrbitre R11 (R33-L2-03) · L'overlay és opcional: un esquema antic, una
           fila il·legible, un 500 o un temps esgotat servixen la font canònica.
           Un avortament (també per canvi de sessió) talla la càrrega.
           R12a (R47 · P1-75, Loop 3) · checkSession() i sessioCanviada()
           llancen AbortError sense el senyal del cridador: continuar seria
           carregar el Mur amb la sessió vella. Un temps esgotat és TimeoutError
           (runtime.js) i, per tant, continua servint la font canònica. */
        if (error?.name === 'AbortError') throw error;
        if (error?.code !== 'no-disponible') console.warn('[supabase] Revisions de llavor no llegides; es mostra la font canònica:', error?.code ?? error?.name ?? 'error');
      }
    }
    /* IDEA-116 (Onada R9, carril C2) · Com l'acte de pedra en sec amb l'Aplec:
       al poble de la llavor editorial hi entra la primera publicació del Mur,
       que encara no és a app_content. Si un dia hi és amb la mateixa data o
       una de més nova, mana la d'app_content (mergeById). */
    const ambLlavorDestacada = key === 'events' && baseAppContent.some((item) => item?.id === 'aplec-2023')
      ? mergeById([CURSOS_PEDRA_EN_SEC_2026_EVENT], baseAppContent)
      : key === 'feedPosts' && llavorEditorial
        ? mergeById([COPIES_SEGURETAT_SOC_DE_POBLE_POST, LA_VEU_DE_SOC_DE_POBLE_POST, NOVES_TECNOLOGIES_CULTURA_RURAL_POST], baseAppContent)
        : baseAppContent;
    return [key, mergeById(
      ambLlavorDestacada,
      submissions[index].elements
    )];
  })));
  sessionGuard();
  if (!ambPaginacio) return llistes;
  /* Decisió 4 · El cursor de cada secció ix de l'última fila de
     section_submissions de la primera pàgina (mai d'app_content).
     Relleu 261008 · De l'última amb clau fiable (ultimaClau): una cua de
     files sense clau es tornarà a servir a la pàgina següent i la interfície
     la fusiona per id. Sense cap fila amb clau, cap pàgina més: la primera
     es pinta igual i el botó no ix. */
  const paginacio = {};
  sections.forEach(([, section], index) => {
    const clau = submissions[index].complet ? null : ultimaClau(submissions[index].rows);
    if (clau) paginacio[section] = cursorDe(tenantId, section, clau);
  });
  return Object.keys(paginacio).length ? { ...llistes, paginacio } : llistes;
}
export function loadMur(ownerUserId = getDefaultUserId(), config = {}) {
  return loadSections(ownerUserId, config, Object.entries(SECCIONS_PAGINABLES).map(([seccio, clau]) => [clau, seccio]),
    { ambPaginacio: true });
}

/** Decisió 4 del Mestre (261007) · La pàgina següent de les publicacions dels
 * veïns d'una secció de loadMur (capacitat 'paginacioSeccions', contracte.js).
 * Només section_submissions: el contingut de l'administració (app_content) ja
 * ha vingut sencer amb la primera pàgina.
 */
export async function loadSeccioPage({ seccio, cursor = null, limit = LIMIT_SECCIO, signal } = {}, config = {}) {
  if (!Object.hasOwn(SECCIONS_PAGINABLES, seccio)) throw new Error('Esta secció no es pagina.');
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > LIMIT_SECCIO) throw new Error('Límit de la secció invàlid.');
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  let despres = null;
  if (cursor !== null) {
    try {
      const decoded = JSON.parse(cursor);
      if (!Array.isArray(decoded) || decoded.length !== 4 || decoded[0] !== tenantId || decoded[1] !== seccio) throw new Error();
      despres = clauDeFila(decoded[2], decoded[3]);
      if (!despres) throw new Error();
    } catch { throw new Error('Cursor de la secció invàlid per a este àmbit.'); }
  }
  /* T2 · En mode de proves, loadMur ja porta la llavor sencera: cap pàgina
     més i cap petició. */
  if (MODES_LOCALS.has(runtimeDataMode)) return { elements: [], complete: true, nextCursor: null };
  if (!hasSupabaseConfig || !tenantId) throw new Error('Falta configuració de dades del poble.');
  const { rows, elements, complet } = await lligPublicacions(tenantId, seccio, limit, config, { before: despres, signal });
  /* Com loadNotesPage: una pàgina que no avança (un servidor que ignora el
     filtre o l'ordre) és un error, mai una pàgina repetida.
     Relleu 261008 · Les files sense clau fiable (ultimaClau) es pinten però
     no entren en la comprovació d'ordre ni fan de cursor. */
  let anterior = despres;
  for (const row of rows) {
    const clau = clauDeFila(row?.created_at, row?.id);
    if (!clau) continue;
    if (anterior !== null && !esMesVella(clau, anterior)) throw new Error('La pàgina de la secció no avança.');
    anterior = clau;
  }
  /* Una pàgina sense cap clau fiable és la cua de files sense clau, que
     l'ordre posa al final: d'ací ja no es pot avançar, i és la darrera. */
  const seguent = ultimaClau(rows);
  const complete = complet || seguent === null;
  return { elements, complete, nextCursor: complete ? null : cursorDe(tenantId, seccio, seguent) };
}
export function loadMultimedia(ownerUserId = getDefaultUserId(), config = {}) {
  return loadSections(ownerUserId, config, [['mediaItems', 'multimedia']]);
}
