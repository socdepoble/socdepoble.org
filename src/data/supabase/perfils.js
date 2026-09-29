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
 *   · el catàleg de demostració només existix en seed/local; cap persona,
 *     empresa o IA del paquet suplix una identitat inexistent al servidor;
 *   · la fitxa pública d'una ALTRA persona: encara no. Cal una RPC
 *     `perfil_public(id)` (security definer, només si `is_public` i sense
 *     baixa) que este adaptador cridarà quan existisca. Mentrestant torna
 *     null i la pàgina ho diu.
 */
import { getCurrentUser, getResolvedConfig, request } from './runtime.js';
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
    presentacioHtml: text(org.presentacio_html), poble: '', esIA: false, publicat: true, propietari: false, copyright: '',
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

  const { hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) return null;

  const esUuid = UUID.test(clau);
  const filtre = esUuid
    ? `or=(id.eq.${encodeURIComponent(clau)},slug.eq.${encodeURIComponent(clau)})`
    : `slug=eq.${encodeURIComponent(clau)}`;
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
