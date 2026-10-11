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
       tria, '' i PerfilPublicSection hi posa el «© nom» de sempre. */
    copyright: text(org.copyright),
    /* T43 (ordre del Mestre, 260928) · Només el correu que l'organització ha
       fet públic (columna `public_email` de la vista, opt-in). El privat
       (`contact_email`) no té cap grant i mai arriba ací. Mentre la migració
       no s'aplica, la vista no el porta i queda buit. */
    correu: text(org.public_email),
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

export async function loadPerfilPublic(idOSlug, config = {}) {
  const clau = String(idOSlug ?? '').trim();
  if (!clau) return null;
  const seed = await local(config);
  if (seed) return seed.loadPerfilPublic(clau, getCurrentUser());

  const { hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (!hasSupabaseConfig) return null;

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
    if (error?.name === 'AbortError') throw error;
  }
  const usuari = getCurrentUser();
  if (esUuid && usuari?.id === clau) {
    try {
      const files = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(clau)}&limit=1`, config, { signal: config.signal });
      if (files?.[0]) return perfilDePersona(files[0], usuari);
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
    }
  } else if (esUuid && usuari?.id) {
    /* Ordre del Mestre (261002) · Una altra persona: la RPC decidix què se'n
       veu. Sense sessió no es pregunta (anon no hi té permís). */
    try {
      const files = await rpc('perfil_public', { p_id: clau }, config, { signal: config.signal });
      const fila = Array.isArray(files) ? files[0] : files;
      if (fila?.id) return perfilDePersona(fila, usuari);
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
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
