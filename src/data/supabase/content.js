import { getDefaultUserId } from '../appSeed.js';
import { elementDeFilaPublicada, mapSectionSubmissionToItem, mergeById } from '../mapejadorSeccions.js';
import { buildSeedAppData, generateUUID, getCurrentUser, getResolvedConfig, mapContentRowsToData, request } from './runtime.js';
import { enviaMissatge } from './xat.js';
import { ambCodi, CODI_ENTRADA } from '../errorsBackend.js';
import { SECCIONS_PAGINABLES } from '../contracte.js';
/* Tasca 5 (ordre del Mestre, 261001) · Les dates de prova del Mur: només el
   mode seed les porta (les pàgines de sistema es servixen igual en remot,
   amb la seua data de creació). */
import { llavorAmbDatesDeProva } from '../../sections/mur/datesDeProvaMur.js';

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
   · Com loadNotesPage, només un rang amb total (Prefer: count=exact) o una
     pàgina buida confirmen el final: mai una pàgina de menys de 50, perquè el
     servidor pot imposar un límit inferior (max-rows).
   · El cursor és opac per a la interfície i porta el poble i la secció: no
     val per a un altre àmbit. ── */
const LIMIT_SECCIO = 50;
const COLUMNES_PUBLICACIO = 'id,payload,title,created_at,updated_at,owner_user_id,author_org_id';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/* Un timestamptz tal com el servix PostgREST (ISO 8601, fins als microsegons). */
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.(\d{1,6}))?(?:Z|[+-]\d{2}:\d{2})$/;
const RANG = /^(?:0-(\d+)|\*)\/(\d+)$/;

/* Auditoria 261007 (B) · Les files de section_submissions (publicacions dels
   veïns) passen per elementDeFilaPublicada (mapejadorSeccions.js): autoria
   de les columnes i cap clau d'autoritat del payload. La primera pàgina de
   loadMur i les següents (loadSeccioPage) fan servir este mateix camí. */
const elementDeFila = (row) => elementDeFilaPublicada({ id: row.id, payload: row.payload, titol: row.title,
  createdAt: row.created_at, updatedAt: row.updated_at, ownerUserId: row.owner_user_id, authorOrgId: row.author_org_id });

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

/* El final del recorregut, com loadNotesPage: només un rang amb total o una
   pàgina buida el confirmen. */
function esCompleta(rows, contentRange) {
  const rang = RANG.exec(contentRange || '');
  return rows.length === 0 || (rang !== null && Number(rang[2]) === rows.length);
}

/* Auditoria 261007 (B) · Retirada loadAppData: no era al contracte
   (contracte.js), backendPort no l'exposava i ningú no la cridava. Era un
   segon mapeig de notes que divergia del de notes.js (sense copyright, estat
   ni icon) i escampava el payload de section_submissions sense les columnes
   d'autoria. El Mur es carrega amb loadMur; les notes, amb el port de notes. */
export async function appendChatMessages(messages, config = {}) {
  const result = [];
  for (const message of Array.isArray(messages) ? messages : []) {
    result.push(await enviaMissatge(message.threadId ?? message.filId, message.text, config));
  }
  return result;
}
export async function appendSectionSubmissionNetworkOnly(submission, config = {}) {
  const { hasSupabaseConfig, tenantId, runtimeDataMode } = getResolvedConfig(config);
  /* T2 · En mode de proves la publicació no viatja: ho diu sense cap petició,
     en lloc de publicar al servidor des d'una demostració. */
  if (MODES_LOCALS.has(runtimeDataMode)) {
    throw ambCodi(new Error('En mode de proves no es publica al servidor.'), CODI_ENTRADA.MODE_LOCAL);
  }
  if (!hasSupabaseConfig) throw new Error('No es pot escriure publicació sense connexió al servidor.');
  if (!tenantId) throw new Error('Poble no configurat.');
  const ownerUserId = getCurrentUser()?.id;
  if (!ownerUserId) throw new Error('Cal iniciar sessió per publicar.');
  const sectionId = String(submission?.sectionId || '').trim(); if (!SECCIONS.has(sectionId)) throw new Error('Secció no suportada per a connectar.');
  const id = String(submission?.id || generateUUID()); const createdAt = submission?.createdAt || new Date().toISOString();
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
  await request('/rest/v1/section_submissions?on_conflict=id', config, { method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' }, body: [fila] });
  return stored;
}
export async function loadCoreContent(ownerUserId = getDefaultUserId(), config = {}) {
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config); const seed = await buildSeedAppData(ownerUserId);
  if (runtimeDataMode === 'seed') return { towns: seed.towns, pages: llavorAmbDatesDeProva(seed).pages, pageCopy: {}, agents: seed.agents, ownerUserId };
  if (runtimeDataMode === 'local') return { towns: [], pages: seed.pages, pageCopy: {}, agents: [], ownerUserId };
  if (!hasSupabaseConfig) throw new Error('Falten credencials de Supabase per carregar el contingut Core.');
  if (!tenantId) throw new Error('Poble no configurat: falta tenantId (VITE_TENANT_ID).');
  const rows = await request(`/rest/v1/app_content?select=key,payload,version&key=in.(towns,agents)&tenant_id=eq.${encodeURIComponent(tenantId)}`, config, { signal: config.signal });
  const base = mapContentRowsToData(rows || []); return { towns: base.towns, pages: seed.pages, pageCopy: {}, agents: base.agents, ownerUserId };
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
    return Object.fromEntries(sections.map(([key]) => [key, seed[key] || []]));
  }
  if (!hasSupabaseConfig || !tenantId) throw new Error('Falta configuració de dades del poble.');
  const tenant = encodeURIComponent(tenantId);
  const keys = sections.map(([key]) => key).join(',');
  /* Lògica d'Usuari (T1): l'autoria viatja com a columnes, no com a payload que
     el client mateix ha escrit. Amb elles el MAS sap quines publicacions són de
     la persona (owner_user_id) o de l'entitat que ha signat (author_org_id).
     T51 · updated_at és la data d'edició (el trigger de 2609261200 l'escriu en
     cada UPDATE): una publicació editada mostra la de modificació, si és
     posterior a la de publicació (editorial.js · dataDElement). */
  /* Decisió 4 · Amb paginació, cada secció porta el seu total (Content-Range). */
  const rangs = sections.map(() => null);
  const [rows, ...submissions] = await Promise.all([
    request(`/rest/v1/app_content?select=key,payload,version&key=in.(${keys})&tenant_id=eq.${tenant}`, config, { signal: config.signal }),
    ...sections.map(([, section], index) => request(
      `/rest/v1/section_submissions?select=${COLUMNES_PUBLICACIO}&tenant_id=eq.${tenant}&section_id=eq.${section}&order=created_at.desc,id.desc&limit=${LIMIT_SECCIO}`,
      config, ambPaginacio
        ? { signal: config.signal, headers: { Prefer: 'count=exact' }, onResponseMetadata: (metadades) => { rangs[index] = metadades.contentRange; } }
        : { signal: config.signal }))
  ]);
  /* Auditoria 261007 (B) · Les d'app_content no passen per elementDeFila: són
     de l'administració i signen legítimament dins del payload. */
  const llistes = Object.fromEntries(sections.map(([key], index) => [key, mergeById(
    rows.find(row => row.key === key)?.payload || [],
    submissions[index].map(elementDeFila)
  )]));
  if (!ambPaginacio) return llistes;
  /* Decisió 4 · El cursor de cada secció ix de l'última fila de
     section_submissions de la primera pàgina (mai d'app_content).
     Relleu 261008 · De l'última amb clau fiable (ultimaClau): una cua de
     files sense clau es tornarà a servir a la pàgina següent i la interfície
     la fusiona per id. Sense cap fila amb clau, cap pàgina més: la primera
     es pinta igual i el botó no ix. */
  const paginacio = {};
  sections.forEach(([, section], index) => {
    const clau = esCompleta(submissions[index], rangs[index]) ? null : ultimaClau(submissions[index]);
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
  /* El filtre de conjunt de claus. Els valors van entre cometes dobles (els
     instants porten «:» i «.», reservats a la sintaxi de PostgREST) i el filtre
     sencer passa per encodeURIComponent: el «+» del fus horari, sense
     codificar, arribaria com un espai. clauDeFila ja ha comprovat que cap
     valor no porta cometes. */
  const filtre = despres === null ? '' : `&or=${encodeURIComponent(
    `(created_at.lt."${despres.createdAt}",and(created_at.eq."${despres.createdAt}",id.lt."${despres.id}"))`)}`;
  let contentRange = null;
  const rows = await request(
    `/rest/v1/section_submissions?select=${COLUMNES_PUBLICACIO}&tenant_id=eq.${encodeURIComponent(tenantId)}`
    + `&section_id=eq.${seccio}${filtre}&order=created_at.desc,id.desc&limit=${limit}`, config,
    { signal: signal || config.signal, headers: { Prefer: 'count=exact' }, onResponseMetadata: (metadades) => { contentRange = metadades.contentRange; } }
  );
  if (!Array.isArray(rows) || rows.length > limit) throw new Error('Resposta de la secció amb un format inesperat.');
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
  const rang = RANG.exec(contentRange || '');
  if (rang && rows.length && Number(rang[1]) + 1 !== rows.length) throw new Error('Rang de la secció inconsistent.');
  if (rang && Number(rang[2]) < rows.length) throw new Error('Total de la secció inconsistent.');
  /* Una pàgina sense cap clau fiable és la cua de files sense clau, que
     l'ordre posa al final: d'ací ja no es pot avançar, i és la darrera. */
  const seguent = ultimaClau(rows);
  const complete = esCompleta(rows, contentRange) || seguent === null;
  return { elements: rows.map(elementDeFila), complete, nextCursor: complete ? null : cursorDe(tenantId, seccio, seguent) };
}
export function loadMultimedia(ownerUserId = getDefaultUserId(), config = {}) {
  return loadSections(ownerUserId, config, [['mediaItems', 'multimedia']]);
}
