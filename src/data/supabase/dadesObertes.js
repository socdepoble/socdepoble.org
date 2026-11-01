/**
 * dadesObertes.js — La lectura PÚBLICA de les dades obertes d'un poble a
 * l'adaptador de Supabase (capacitat 'dadesObertes'; T2 · D04/D10, assalt
 * 261101, pla 261101_1246, D-3). Forma: contracte.js.
 *
 * Només el contingut de l'administració que el servidor ja servix a
 * qualsevol visitant: les claus 'feedPosts' (notícies i avisos) i 'events'
 * (agenda) d'app_content del tenant. Anon les pot llegir des de
 * 2609160600 (grant select) i 2610101900 (claus permeses); cap migració.
 * Mai section_submissions (les publicacions del veïnat, que només llegixen
 * els membres), ni notes, xat, Mercat o perfils.
 *
 * Sempre anònima: request() amb `anonim: true` envia la clau pública encara
 * que hi haja una sessió (el paquet d'una administradora ha de ser el mateix
 * que el d'un visitant) i un 401 no renova cap sessió.
 *
 * memoria i memoriaOral són null: el Mas no té cap mòdul de memòria cultural
 * i este servidor encara no desa cap fitxa de memòria oral revisada (decisió
 * D-3 del pla: el paquet ho diu a «Fonts pendents»).
 */
import { LIMIT_DADES_OBERTES } from '../contracte.js';
import { buildSeedAppData, getResolvedConfig, request } from './runtime.js';

const CLAUS = Object.freeze({ feedPosts: 'noticies', events: 'agenda' });

/* El poble del filtre: { slug, nom } de text no buit, o TypeError. */
function pobleDelFiltre(filtre) {
  const poble = filtre?.poble;
  if (!poble || typeof poble.slug !== 'string' || !poble.slug.trim() || typeof poble.nom !== 'string' || !poble.nom.trim()) {
    throw new TypeError('llegixDadesObertes: cal el poble { slug, nom }.');
  }
  return poble;
}

/* Una llista del servidor, mai tallada: més de LIMIT_DADES_OBERTES atura.
   Sense la clau (undefined o null), buida. Gauntlet D-03 · Qualsevol altra
   cosa (un objecte, un text) és una font malmesa: el paquet falla tancat, no
   ix amb 0 elements com si el poble no en tinguera cap. */
function llistaFitada(valor, clau) {
  if (valor === undefined || valor === null) return [];
  if (!Array.isArray(valor)) throw new TypeError(`app_content «${clau}» no és cap llista: el paquet no es fa amb una font malmesa.`);
  if (valor.length > LIMIT_DADES_OBERTES) throw new RangeError(`«${clau}» passa de ${LIMIT_DADES_OBERTES} elements: no es talla en silenci.`);
  return valor;
}

export async function llegixDadesObertes(filtre = {}, config = {}) {
  pobleDelFiltre(filtre);
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (runtimeDataMode === 'local') return { noticies: null, agenda: null, memoria: null, memoriaOral: null };
  if (runtimeDataMode === 'seed') {
    /* La llavor tal qual, sense les dates de prova del Mur: el paquet no llig cap rellotge. */
    const llavor = await buildSeedAppData();
    return { noticies: llistaFitada(llavor.feedPosts, 'feedPosts'), agenda: llistaFitada(llavor.events, 'events'), memoria: null, memoriaOral: null };
  }
  if (!hasSupabaseConfig || !tenantId) throw new Error('Falta configuració de dades del poble.');
  const files = await request(`/rest/v1/app_content?select=key,payload&key=in.(feedPosts,events)&tenant_id=eq.${encodeURIComponent(tenantId)}`,
    config, { signal: filtre.signal ?? config.signal, anonim: true });
  if (!Array.isArray(files)) throw new TypeError('app_content no ha tornat cap llista.');
  const perClau = new Map();
  for (const fila of files) {
    if (!fila || typeof fila !== 'object' || !Object.hasOwn(CLAUS, fila.key)) continue;
    if (perClau.has(fila.key)) throw new TypeError(`app_content porta dues files de «${fila.key}» per al mateix poble.`);
    perClau.set(fila.key, fila.payload);
  }
  return {
    noticies: llistaFitada(perClau.get('feedPosts'), 'feedPosts'),
    agenda: llistaFitada(perClau.get('events'), 'events'),
    memoria: null,
    memoriaOral: null
  };
}
