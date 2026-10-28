/**
 * @module supabase/perfils
 * @description Perfil públic (capacitat 'directori') i agents IA administrats
 *   (capacitat 'agents'). Quan `runtimeDataMode` és `seed` o `local` delega a
 *   `localPerfils`, que fa de servidor.
 * @contract
 *   - loadPerfilPublic(idOSlug, config) → PerfilPublic | null
 *       { tipus: 'persona'|'entitat'|'grup'|'ia', id, slug, nom, avatar, hero,
 *         lema, bio, presentacioHtml, poble, esIA, publicat, propietari, copyright,
 *         correu (T43: només el públic d'una organització; buit si no n'hi ha),
 *         creat, modificat (T51: created_at i updated_at de la fila; la
 *         pastilla de la fitxa pública en llig la més recent),
 *         emoticona (T66: la de la persona, profiles.icon passada per
 *         emojiSol; '' sense tria i per a les organitzacions) }
 *   - listMyAgents(config) → Agent[] (buit en remot mentre no hi haja taula)
 *   - updateAgent(id, updates, config) → Agent
 *   - IDEA-22, punt 2 (pla 261025_0200) · capacitats 'titularPublic' i
 *     'consentimentTitular' (contracte.js): loadTitularPublic(orgId, config)
 *     → { tipus: 'persona', id, nom, avatar } | null, la propietària que ha
 *     triat mostrar-se (RPC titular_public de 2610250300), i
 *     estatTitularPublic / marcaTitularPublic, la seua tria (RPC
 *     estat_titular_public i marca_titular_public). Mai d'ací ix cap correu
 *     ni cap rol, ni se'n deduïx la titular de cap altra dada.
 *
 * REMOT · Quin perfil es pot llegir hui i quin no, sense enganyar:
 *   · una organització pública: `organization_directory` (vista amb
 *     security_invoker, lectura per a tothom);
 *   · la fitxa pròpia: `profiles` (la política «profiles read own» només
 *     deixa llegir la fila de la sessió);
 *   · el catàleg de demostració només existix en seed/local; cap persona ni
 *     empresa del paquet suplix una identitat inexistent al servidor. Onada
 *     11 (261010; prompt 261010_1730, tasca 6, D12) · L'única excepció és la
 *     IA del paquet (AGENTS_IA_SEED), que no té taula al servidor
 *     (listMyAgents torna buit): este adaptador continua tornant null, i és
 *     la pàgina (sections/profile/PerfilPublicSection.jsx ·
 *     perfilDeLaIADelPaquet) qui la pinta del paquet, com ja fa el Xat;
 *   · la fitxa d'una ALTRA persona (ordre del Mestre, 261002): la RPC
 *     `perfil_public(p_id)` (migració 2610021520, security definer). Sencera
 *     si l'ha publicada (`is_public`); si no, només el nom, la foto i el poble,
 *     i només per a qui és del mateix poble (legalContent §13). Mai d'algú amb
 *     la baixa demanada, mai sense sessió. Sense la migració aplicada (404) o
 *     sense fila, torna null i la pàgina ho diu, com abans.
 */
import { getCurrentUser, getResolvedConfig, request, rpc } from './runtime.js';
import { CODI_BACKEND_INABASTABLE } from '../errorsBackend.js';
import { MISSATGES_TITULAR, errorDeTitular, titularDelContracte } from '../contracte.js';
/* IDEA-22, punt 2 · En seed i local, els bloquejos de qui mira (com seguiments.js). */
import { llistaBloquejos } from './moderacio.js';
import { emojiSol } from '../../utils/emoji.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MODES_LOCALS = new Set(['seed', 'local']);

async function local(config) {
  if (!MODES_LOCALS.has(getResolvedConfig(config).runtimeDataMode)) return null;
  const { localPerfils } = await import('../localPerfils.js');
  return localPerfils;
}

const text = (valor) => (typeof valor === 'string' ? valor : '');
/* T51 · Una data de la fila tal com arriba, o null: la pàgina no n'inventa cap. */
const dataCrua = (valor) => (typeof valor === 'string' && valor ? valor : null);

/** La fitxa pública d'una fila d'`organization_directory` (exportada per a les proves de contracte). */
export function perfilDOrganitzacio(org) {
  return {
    tipus: org.kind === 'group' ? 'grup' : 'entitat', id: org.id, slug: org.slug || null, nom: text(org.name),
    avatar: text(org.logo_url), hero: text(org.hero_url), lema: text(org.lema), bio: text(org.description),
    /* Ordre del Mestre (261008, grup C) · El poble de l'organització (columna
       `town_name` de la vista, 2610081401). Sense la columna o sense tria,
       '' com abans. */
    presentacioHtml: text(org.presentacio_html), poble: text(org.town_name), esIA: false, publicat: true, propietari: false,
    /* Auditoria 261007 (B) · Els drets que l'entitat ha triat (columna
       `copyright` de la vista, 2609262232), com ja fa perfilDePersona.
       Abans es fixava '' i, en remot, la fitxa pública signava «© nom» encara
       que l'entitat haguera triat una llicència CC. Sense la columna o sense
       tria, '' i PerfilPublicSection hi posa el «© nom» de sempre (entitat i
       grup). Gauntlet 261016 (Bloc 3, «Dignitat de persona») · Per a la
       persona ja no: perfilDePersona copia igualment la columna, però la
       seua fitxa pública no pinta cap drets, ni els desats ni el «© nom». */
    copyright: text(org.copyright),
    /* T43 (ordre del Mestre, 260928) · Només el correu que l'organització ha
       fet públic. P1-13 · C11-05 (261028) · La vista el porta a la columna
       generada `correu_public` (2610281730): el correu només si l'opt-in
       és true, si no null. Abans es llegia `public_email`, que és el booleà
       de l'opt-in i no el correu, i quedava sempre buit. El privat
       (`contact_email`) no té cap grant i mai arriba ací. Mentre la migració
       no s'aplica, la vista no porta la columna i queda buit, com abans. */
    correu: text(org.correu_public),
    /* T51 · La vista porta created_at i updated_at (2609262232). */
    creat: dataCrua(org.created_at), modificat: dataCrua(org.updated_at),
    /* T66 · Les organitzacions no tenen columna d'emoticona (deute declarat). */
    emoticona: ''
  };
}

/** La fitxa pública d'una fila de `profiles` (exportada per a les proves de contracte). */
export function perfilDePersona(fila, usuari) {
  return {
    tipus: 'persona', id: fila.id, slug: null, nom: text(fila.full_name), avatar: text(fila.avatar_url),
    hero: text(fila.hero_url), lema: text(fila.lema), bio: text(fila.bio), presentacioHtml: text(fila.presentacio_html),
    poble: text(fila.town_name), esIA: false, publicat: Boolean(fila.is_public),
    propietari: Boolean(usuari?.id) && fila.id === usuari.id, copyright: text(fila.copyright),
    creat: dataCrua(fila.created_at), modificat: dataCrua(fila.updated_at),
    /* T66 · profiles.icon (2609282035): Postgres no valida la forma; ací sí. */
    emoticona: emojiSol(fila.icon) || ''
  };
}

/* Gauntlet 261022_0225 (Tasca 1: «Introduir un timeout de seguretat estricte
   (fail-safe) a loadPerfilPublic: si en 3 segons la xarxa no respon…») · El
   pressupost de TOTA la lectura remota: el directori i la RPC de persona
   comparteixen els mateixos 3 s, que no es reinicien entre una consulta i
   l'altra. Passat el termini, la lectura s'avorta i es rebutja amb un
   TimeoutError (no és cap «no trobat»: qui crida decidix què es veu), també si
   el transport ignora l'avortament. El senyal de qui crida (config.signal)
   l'avorta abans, amb un AbortError. Revisió del Gauntlet 261022_0225
   (REV-PERF-2) · Qui crida pot demanar un altre pressupost (config.terminiMs):
   el «Torna-ho a provar» de la fitxa pública, que si no fallaria sempre igual
   en una línia lenta. Sense, els 3 s. */
export const TERMINI_DE_LA_FITXA_MS = 3000;

function ambTermini(senyalExtern, ms, feina) {
  const controlador = new AbortController();
  let talla;
  const tallada = new Promise((_resolve, reject) => { talla = reject; });
  const perTermini = setTimeout(() => {
    talla(new DOMException('La fitxa no ha arribat a temps.', 'TimeoutError'));
    controlador.abort();
  }, ms);
  const perFora = () => {
    talla(new DOMException('Operació cancel·lada.', 'AbortError'));
    controlador.abort();
  };
  if (senyalExtern?.aborted) perFora();
  else senyalExtern?.addEventListener('abort', perFora, { once: true });
  return Promise.race([feina(controlador.signal), tallada]).finally(() => {
    clearTimeout(perTermini);
    senyalExtern?.removeEventListener('abort', perFora);
  });
}

export async function loadPerfilPublic(idOSlug, config = {}) {
  const clau = String(idOSlug ?? '').trim();
  if (!clau) return null;
  const seed = await local(config);
  if (seed) return seed.loadPerfilPublic(clau, getCurrentUser());

  const { hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (!hasSupabaseConfig) return null;

  const { terminiMs, ...resta } = config;
  const ms = Number.isFinite(terminiMs) && terminiMs > 0 ? terminiMs : TERMINI_DE_LA_FITXA_MS;
  return ambTermini(config.signal, ms, (signal) => llegixPerfilRemot(clau, tenantId, { ...resta, signal }));
}

/* Revisió del Gauntlet 261022_0225 (REV-PERF-1) · Una consulta que no ha
   arribat al servidor (avortada, temps esgotat o sense xarxa: l'estat 0 i
   CODI_BACKEND_INABASTABLE de runtime.js) no és cap «no trobat»: es propaga,
   i la fitxa pública pinta l'avís amb «Torna-ho a provar». Una resposta del
   servidor amb error (404, 403, 503…) continua sent null, com abans. */
const senseResposta = (error) => error?.name === 'AbortError' || error?.name === 'TimeoutError'
  || error?.status === 0 || error?.codi === CODI_BACKEND_INABASTABLE;

async function llegixPerfilRemot(clau, tenantId, config) {
  const esUuid = UUID.test(clau);
  /* Ordre del Mestre (261007, prompt 261007_1628, peça C) · Un slug només és
     únic dins d'un poble (organizations: unique (tenant_id, slug)): sense el
     poble, `limit=1` podia tornar l'entitat homònima d'un altre poble. Amb el
     poble actiu a la configuració resolta, la cerca per slug s'hi limita; sense,
     la forma d'abans. L'id no es limita: és únic a tot el servidor. Esmena de
     la revisió adversarial de la peça C · Una clau amb forma d'UUID també pot
     ser un slug (el check de organizations accepta «a-z0-9» i guions), i la
     meitat `slug.eq.` de la cerca doble també s'ha de limitar al poble:
     `or=(id.eq.X,and(slug.eq.X,tenant_id.eq.T))`.
     Adaptador del proveïdor: el port (backendPort.js) no canvia. */
  const poble = tenantId ? encodeURIComponent(tenantId) : '';
  const slug = `slug.eq.${encodeURIComponent(clau)}`;
  const slugDelPoble = poble ? `and(${slug},tenant_id.eq.${poble})` : slug;
  const filtre = esUuid
    ? `or=(id.eq.${encodeURIComponent(clau)},${slugDelPoble})`
    : `slug=eq.${encodeURIComponent(clau)}${poble ? `&tenant_id=eq.${poble}` : ''}`;
  try {
    const orgs = await request(`/rest/v1/organization_directory?select=*&${filtre}&limit=1`, config, { signal: config.signal });
    if (orgs?.[0]) return perfilDOrganitzacio(orgs[0]);
  } catch (error) {
    if (senseResposta(error)) throw error;
  }
  const usuari = getCurrentUser();
  if (esUuid && usuari?.id === clau) {
    try {
      const files = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(clau)}&limit=1`, config, { signal: config.signal });
      if (files?.[0]) return perfilDePersona(files[0], usuari);
    } catch (error) {
      if (senseResposta(error)) throw error;
    }
  } else if (esUuid && usuari?.id) {
    /* Ordre del Mestre (261002) · Una altra persona: la RPC decidix què se'n
       veu. Sense sessió no es pregunta (anon no hi té permís). */
    try {
      const files = await rpc('perfil_public', { p_id: clau }, config, { signal: config.signal });
      const fila = Array.isArray(files) ? files[0] : files;
      if (fila?.id) return perfilDePersona(fila, usuari);
    } catch (error) {
      if (senseResposta(error)) throw error;
    }
  }
  return null;
}

export async function listMyAgents(config = {}) {
  const seed = await local(config);
  if (seed) return seed.listMyAgents(getCurrentUser());
  /* En remot encara no hi ha taula d'agents: la capacitat existix i torna buit. */
  return [];
}

export async function updateAgent(id, updates = {}, config = {}) {
  const seed = await local(config);
  if (seed) return seed.updateAgent(id, updates);
  throw new Error('Els agents IA encara no tenen contracte de dades al servidor.');
}

/* ═══════════════════════════════════════════════════════════════════
   IDEA-22, punt 2 (Directiva del Mestre, àudios 01:14-01:16; pla
   261025_0200) · LA TITULAR QUE HA TRIAT MOSTRAR-SE

   La persona propietària d'una entitat, a /connectar, NOMÉS per una tria
   seua: el servidor no diu mai qui administra una entitat (2610250100), i un
   perfil públic no és cap permís per a lligar-lo a un negoci. Les RPC de
   supabase/migrations/2610250300_titular_public.sql:
   · titular_public(p_org_id) → 0 o 1 fila { id, full_name, avatar_url }, i
     les condicions les mira el servidor (owner, tria, perfil públic, sense
     baixa, organització pública, cap bloqueig). Ací es torna null en tot el
     que no és una fila; només un tall o una cancel·lació es propaga
     (senseResposta), amb el pressupost de la fitxa (ambTermini).
   · estat_titular_public(p_org_id) i marca_titular_public(p_org_id,
     p_public), només per a la propietària: els errors porten el `code` de
     MISSATGES_TITULAR (prefix SDP-TIT del missatge, mai l'estat HTTP), i un
     servidor sense la migració (404) és NO-DISPONIBLE.
   · Sense sessió: null o SDP-TIT-000, i cap petició. En remot l'id ha de ser
     un UUID (un altre no arriba mai a Postgres). Seed i local: localPerfils.
   ═══════════════════════════════════════════════════════════════════ */
const RE_CODI_TIT = /SDP-TIT-\d{3}/;

function errorTitular(error) {
  if (!error || typeof error !== 'object' || error.name === 'AbortError' || error.name === 'TimeoutError') return error;
  if (Object.hasOwn(MISSATGES_TITULAR, error.code)) return error;
  const missatge = String(error.message ?? '');
  const prefix = RE_CODI_TIT.exec(missatge)?.[0];
  let code = 'DESCONEGUT';
  if (prefix && Object.hasOwn(MISSATGES_TITULAR, prefix)) code = prefix;
  else if (error.status === 401) code = 'SDP-TIT-000';
  else if (error.status === 404 || /PGRST20[25]/.test(missatge)) code = 'NO-DISPONIBLE';
  const traduit = errorDeTitular(code, error);
  if (error.status !== undefined) traduit.status = error.status;
  /* CODI_BACKEND_INABASTABLE (sense xarxa) es conserva: la vista el llig. */
  if (error.codi) traduit.codi = error.codi;
  return traduit;
}

const unValor = (resposta) => (Array.isArray(resposta) ? resposta[0] : resposta);

export async function loadTitularPublic(orgId, config = {}) {
  const clau = String(orgId ?? '').trim();
  const usuari = getCurrentUser();
  if (!clau || !usuari?.id) return null;
  const seed = await local(config);
  if (seed) {
    const bloquejos = await llistaBloquejos(config).catch(() => []);
    return titularDelContracte(seed.loadTitularPublic(clau, usuari, { bloquejos: Array.isArray(bloquejos) ? bloquejos : [] }));
  }
  if (!getResolvedConfig(config).hasSupabaseConfig || !UUID.test(clau)) return null;
  const { terminiMs, ...resta } = config;
  const ms = Number.isFinite(terminiMs) && terminiMs > 0 ? terminiMs : TERMINI_DE_LA_FITXA_MS;
  return ambTermini(config.signal, ms, async (signal) => {
    try {
      const fila = unValor(await rpc('titular_public', { p_org_id: clau }, { ...resta, signal }, { signal }));
      if (!fila?.id) return null;
      return titularDelContracte({ tipus: 'persona', id: fila.id, nom: text(fila.full_name), avatar: text(fila.avatar_url) });
    } catch (error) {
      if (senseResposta(error)) throw error;
      return null;
    }
  });
}

/* La sessió i l'id de l'organització, en el mateix ordre a les dues crides de la tria. */
async function contextDeLaTria(orgId, config) {
  const usuari = getCurrentUser();
  if (!usuari?.id) throw errorDeTitular('SDP-TIT-000');
  const clau = String(orgId ?? '').trim();
  const seed = await local(config);
  if (seed) return { usuari, clau, seed };
  if (!getResolvedConfig(config).hasSupabaseConfig) throw errorDeTitular('NO-DISPONIBLE');
  if (!UUID.test(clau)) throw errorDeTitular('SDP-TIT-001');
  return { usuari, clau, seed: null };
}

export async function estatTitularPublic(orgId, config = {}) {
  const { usuari, clau, seed } = await contextDeLaTria(orgId, config);
  if (seed) return seed.estatTitularPublic(clau, usuari);
  try {
    const valor = unValor(await rpc('estat_titular_public', { p_org_id: clau }, config, { signal: config.signal }));
    return { titularPublic: valor === true };
  } catch (error) {
    throw errorTitular(error);
  }
}

export async function marcaTitularPublic(orgId, titularPublic, config = {}) {
  if (typeof titularPublic !== 'boolean') throw errorDeTitular('SDP-TIT-002');
  const { usuari, clau, seed } = await contextDeLaTria(orgId, config);
  if (seed) return seed.marcaTitularPublic(clau, titularPublic, usuari);
  try {
    const valor = unValor(await rpc('marca_titular_public', { p_org_id: clau, p_public: titularPublic }, config, { signal: config.signal }));
    return { titularPublic: valor === true };
  } catch (error) {
    throw errorTitular(error);
  }
}
