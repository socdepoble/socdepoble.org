/** P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · Les fonts VEÏNALS de la projecció
 * pública del build: el que ha escrit la gent i un visitant sense sessió ja pot llegir.
 * Les crida projeccioPublica (projeccio-publica.mjs); totes les lectures són GET anònims
 * fitats (lectura-anonima.mjs). Mai una persona: cap fitxa de persona és llegible sense
 * sessió (perfil_public no és executable per anon), i no s'usa cap RPC que torne gent.
 *
 * A · EL DIRECTORI PÚBLIC (organization_directory, vista amb security_invoker i lectura
 *     per a tothom): les entitats i els grups públics de la població del build.
 *     · Columnes EXPLÍCITES, les huit de COLUMNES_DIRECTORI. Mai select=*, mai
 *       correu_public, presentacio_html, parent_organization_id, town_name, tenant_id,
 *       hero_video_url ni dates: el que no es demana no pot viatjar ni per la memòria.
 *     · Ordre per antiguitat (created_at, id) i pàgines de 100, fins a MAX_ENTITATS: en
 *       passar-lo es TALLA (tallat: true i un avís), mai un error: una allau de fitxes
 *       noves no en deixa fora cap de vella ni atura cap release.
 *     · Cada fila passa per projectaEntitat, i cada descart es compta amb el seu motiu:
 *       'forma' (la fila no és el que diu el contracte), 'secrets', 'contacteAlNom',
 *       'suplantacio' i 'buida' (sense lema ni descripció útils i sense imatge servible:
 *       una fitxa que només té nom no es prerenderitza).
 *     · La imatge, només del bucket públic «mitjans» (sdp-media://mitjans/… o la seua URL
 *       pública): un camí /assets/…, un https de tercers, mitjans_privats o una URL
 *       signada són com si no n'hi haguera cap, mai una porta roja.
 *     · Element de DEU camps: {sectionId:'perfil', id, slug, tipus, visibility, status,
 *       title, description, image, imageAlt}; slug és null si no pot ser clau.
 *
 * B · EL MUR PÚBLIC R21 (la RPC llig_mur_public, cridada per GET), APAGAT per defecte:
 *     només amb SDP_SOCIAL_MUR_VEINAL=1 exacte. El prerender cou el títol i el text
 *     d'una publicació, i una revocació o una moderació no arriba a l'estàtic fins a la
 *     release següent (D-SEO-16). Paginat per clau (p_before_created_at i p_before_id,
 *     tots dos o cap), cinc pàgines de 200 com a molt (les 1.000 més recents; tallat).
 */
import {CAP_SOCIAL_BASE} from '../../src/config/imatgeSocial.js';
import {LIMIT_DESCRIPCIO, LIMIT_TITOL} from '../../src/config/metadadesSocials.js';
import {esClauReservadaPerAUnAltre, FORMA_UUID, metadadesDePerfil, slugPotSerClau} from '../../src/config/metadadesDePerfil.js';
import {AGENTS_IA_SEED, ENTITATS_SEED, PERSONA_PILOT} from '../../src/data/identitatsSeed.js';
import {perfilDOrganitzacio} from '../../src/data/supabase/perfils.js';
import {getJsonFitat} from './lectura-anonima.mjs';
import {esSuplantacio, teContacte, textVeinal} from './text-veinal.mjs';

export const COLUMNES_DIRECTORI = Object.freeze(['id', 'slug', 'name', 'kind', 'lema', 'description', 'logo_url', 'hero_url']);
export const MAX_ENTITATS = 500;
export const PAGINA_DIRECTORI = 100;
export const INTERRUPTOR_MUR = 'SDP_SOCIAL_MUR_VEINAL';
export const ESCAPADA_DIRECTORI_BUIT = 'SDP_SOCIAL_DIRECTORI_BUIT';
export const PAGINA_MUR = 200;
export const MAX_PAGINES_MUR = 5;
export const SECCIONS_DEL_MUR = Object.freeze(['mur', 'mercat', 'events']);
export const MOTIUS_D_EXCLUSIO = Object.freeze(['forma', 'secrets', 'contacteAlNom', 'suplantacio', 'buida']);
const KINDS = new Set(['company', 'group', 'entity', 'city_hall']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DEL_BUCKET = /^sdp-media:\/\/mitjans\/(?:[a-z0-9_-][a-z0-9._-]*\/)*[a-z0-9_-][a-z0-9._-]*$/i;
const CAMI_DEL_BUCKET = /^\/storage\/v1\/object\/public\/mitjans\/(?:[a-zA-Z0-9_-][a-zA-Z0-9._-]*\/)*[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/;
const esObjecte = valor => Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
const textONul = valor => valor === null || valor === undefined || typeof valor === 'string';

/* Les identitats del paquet amb el nom i una clau seua, per a la regla de suplantació. */
const IDENTITATS = Object.freeze([
  {nom: PERSONA_PILOT.nom, clau: PERSONA_PILOT.slug},
  ...ENTITATS_SEED.map(entitat => ({nom: entitat.name, clau: entitat.slug})),
  ...AGENTS_IA_SEED.map(agent => ({nom: agent.name, clau: agent.slug}))
]);

/* Una referència d'imatge d'una fila remota només val si és del bucket públic «mitjans»
   del Supabase del build; qualsevol altra, com si no n'hi haguera cap. */
function delBucket(ref, supabaseUrl) {
  if (typeof ref !== 'string') return '';
  const net = ref.trim();
  /* Un enquadrament desat (#sdp-crop=…) no canvia de bucket: el selector el lleva. */
  const senseMarc = net.includes('#sdp-crop=') ? net.slice(0, net.indexOf('#')) : net;
  if (DEL_BUCKET.test(senseMarc)) return net;
  try {
    const url = new URL(senseMarc);
    if (supabaseUrl && url.origin === new URL(supabaseUrl).origin && !url.search && !url.hash && !url.username && !url.password
      && CAMI_DEL_BUCKET.test(url.pathname)) return net;
  } catch { /* no és cap URL */ }
  return '';
}

/**
 * Una fila del directori, projectada: { element } o { motiu }. Mai copia la fila: només
 * els deu camps. `opcions` són les del selector d'imatge (origen, supabaseUrl, permesos).
 * `avisos` (opcional) rep els comptadors de les degradacions que no exclouen la fitxa.
 */
export function projectaEntitat(fila, opcions = {}, avisos = {}) {
  const suma = clau => { avisos[clau] = (avisos[clau] || 0) + 1; };
  if (!esObjecte(fila) || typeof fila.id !== 'string' || !FORMA_UUID.test(fila.id) || typeof fila.name !== 'string'
    || !KINDS.has(fila.kind) || !(fila.slug === null || (typeof fila.slug === 'string' && fila.slug.length <= 160 && SLUG.test(fila.slug)))
    || ![fila.lema, fila.description, fila.logo_url, fila.hero_url].every(textONul)) return {motiu: 'forma'};
  const id = fila.id.toLowerCase();
  let nom, lema, descripcio;
  try {
    nom = textVeinal(fila.name, LIMIT_TITOL);
    lema = textVeinal(fila.lema ?? '', LIMIT_DESCRIPCIO);
    descripcio = textVeinal(fila.description ?? '', LIMIT_DESCRIPCIO);
  } catch {
    // textVeinal refusa un possible secret o una entrada desmesurada: no es publica.
    return {motiu: 'secrets'};
  }
  if (!nom) return {motiu: 'forma'};
  if (teContacte(nom)) return {motiu: 'contacteAlNom'};
  if (esSuplantacio({name: nom, id, kind: fila.kind}, {identitats: IDENTITATS, reservadaPerAUnAltre: esClauReservadaPerAUnAltre})) return {motiu: 'suplantacio'};
  // Un lema o una descripció amb un contacte no s'usen (no es muten): es passa a l'altre camp.
  if (lema && teContacte(lema)) { lema = ''; suma('lemaAmbContacte'); }
  if (descripcio && teContacte(descripcio)) { descripcio = ''; suma('descripcioAmbContacte'); }
  const logo = delBucket(fila.logo_url, opcions.supabaseUrl), portada = delBucket(fila.hero_url, opcions.supabaseUrl);
  if ((fila.logo_url && !logo) || (fila.hero_url && !portada)) suma('imatgeForaDelBucket');
  /* La mateixa fitxa que pinta el client (perfilDOrganitzacio), només amb les huit columnes, i el
     mateix head (metadadesDePerfil). */
  const perfil = perfilDOrganitzacio({id, slug: fila.slug, name: nom, kind: fila.kind, lema, description: descripcio, logo_url: logo, hero_url: portada});
  const meta = metadadesDePerfil(perfil, opcions);
  const image = meta.imatge.estat === 'triada' ? meta.imatge.url : null;
  if (meta.imatge.estat === 'bloquejada') suma('imatgeNoServible');
  if (!lema && !descripcio && !image) return {motiu: 'buida'};
  const slug = fila.slug && slugPotSerClau(fila.slug, id) ? fila.slug : null;
  if (fila.slug && !slug) suma('slugNoClau');
  return {
    element: {sectionId: 'perfil', id, slug, tipus: perfil.tipus, visibility: 'public', status: 'published',
      title: meta.title, description: meta.description || CAP_SOCIAL_BASE.description, image, imageAlt: image ? meta.title : ''}
  };
}

/**
 * Les files del directori públic de la població: { files, tallat, peticions }.
 * `lectura` són les opcions de getJsonFitat (fetchImpl, termini, maxResposta, pausa).
 */
export async function llegixDirectori({supabaseUrl, anonKey, tenantId}, lectura, {maxim = MAX_ENTITATS, pagina = PAGINA_DIRECTORI} = {}) {
  const files = [];
  let peticions = 0;
  const demana = async (limit, offset) => {
    const url = new URL('/rest/v1/organization_directory', supabaseUrl);
    url.search = new URLSearchParams({select: COLUMNES_DIRECTORI.join(','), tenant_id: `eq.${tenantId}`, order: 'created_at.asc,id.asc',
      limit: String(limit), offset: String(offset)}).toString();
    peticions += 1;
    const resposta = await getJsonFitat(url.href, {anonKey}, lectura, 'el directori públic');
    if (!Array.isArray(resposta) || resposta.length > limit || !resposta.every(esObjecte)) throw new Error('Resposta del directori públic amb un format inesperat.');
    return resposta;
  };
  while (files.length < maxim) {
    const limit = Math.min(pagina, maxim - files.length);
    const tros = await demana(limit, files.length);
    files.push(...tros);
    if (tros.length < limit) return {files, tallat: false, peticions};
  }
  /* El sostre ple: una sola fila més diu si se n'ha quedat alguna fora. */
  const mes = await demana(1, files.length);
  return {files, tallat: mes.length > 0, peticions};
}

/**
 * Les files del Mur públic R21 de la població, de les més recents a les més velles:
 * { files, tallat, peticions }. Només es crida amb l'interruptor encés.
 */
export async function llegixMurPublic({supabaseUrl, anonKey, tenantId}, lectura, {pagina = PAGINA_MUR, maxPagines = MAX_PAGINES_MUR} = {}) {
  const files = [];
  let peticions = 0, abans = null;
  for (let n = 0; n < maxPagines; n += 1) {
    const url = new URL('/rest/v1/rpc/llig_mur_public', supabaseUrl);
    const consulta = new URLSearchParams({p_tenant_id: tenantId, p_limit: String(pagina)});
    // El cursor porta sempre els dos camps junts (la RPC no admet un sense l'altre).
    if (abans) { consulta.set('p_before_created_at', abans.createdAt); consulta.set('p_before_id', abans.id); }
    url.search = consulta.toString();
    peticions += 1;
    const tros = await getJsonFitat(url.href, {anonKey}, lectura, 'el Mur públic');
    if (!Array.isArray(tros) || tros.length > pagina || !tros.every(fila => esObjecte(fila) && typeof fila.id === 'string' && FORMA_UUID.test(fila.id)
      && typeof fila.section_id === 'string' && typeof fila.created_at === 'string' && fila.created_at !== ''
      && [fila.title, fila.description, fila.public_content].every(textONul))) throw new Error('Resposta del Mur públic amb un format inesperat.');
    files.push(...tros);
    if (tros.length < pagina) return {files, tallat: false, peticions};
    const darrera = tros.at(-1);
    abans = {createdAt: darrera.created_at, id: darrera.id};
  }
  return {files, tallat: true, peticions};
}
