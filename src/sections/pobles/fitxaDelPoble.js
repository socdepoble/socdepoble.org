/**
 * fitxaDelPoble.js · Fase 3a de l'eina de pobles nous (ordre nocturna
 * 261030_0252, Fase 3; disseny nit/viquipedia_disseny.md §4.2 i §4.4) · Quan
 * a la fitxa d'un poble que ja tenim li falta alguna dada, la seua pàgina
 * pot completar-la amb fonts Wikimedia en diferit (AH-27),
 * conservant les dades i fotografies reals ja aportades. Ací només hi ha la part pura que va al tros principal:
 *   · fitxaCompleta: si la fitxa porta tot el que pinta la pàgina;
 *   · clauDeViquipedia: la clau de la memòria cau local d'un poble;
 *   · fusionaAmbViquipedia: ompli els buits amb una entrada de la cau;
 *   · pobleHidratable: si la pàgina del poble porta el panell.
 *
 * Res d'ací importa l'algoritme (pobleDeViquipedia.js) ni el client de
 * Wikimedia: el tros principal no creix (qualitat.test.js ho vigila).
 *
 * La fitxa mana: mai no se sobreescriu una dada aportada ni una foto real.
 * AH-27 incorpora fotos reals de Commons revisades en la llavor local,
 * amb els seus crèdits (sense escuts heràldics municipals, IDEA-90). Una foto remota de la cau només
 * es previsualitza al panell després del gest: no es posa a la capçalera.
 */
import { esAppNativa } from '../../config/origenPublic.js';
import { slugDelPoble } from './nomsDelPoble.js';
import { DADES_POBLES_APLEC_VIQUIPEDIA } from './poblesAplecViquipedia.js';

/** Les dades que fan completa la fitxa d'un poble (les que pinta la seua pàgina). */
export const CAMPS_DE_FITXA = Object.freeze(['content', 'image_url', 'provincia', 'comarca', 'population', 'population_year', 'lat', 'lng', 'elevation', 'area', 'gentilici', 'wikipedia_title', 'wikidata_id']);

/** Els que pot omplir la Viquipèdia, en l'ordre del DTO de pobleDeViquipedia.js. */
export const CAMPS_QUE_OMPLI = Object.freeze([
  'content', 'provincia', 'comarca', 'population', 'lat', 'lng', 'wikipedia_title', 'wikidata_id',
  'population_year', 'elevation', 'area', 'gentilici'
]);

/** Pujar-la invalida la cau de tots els pobles (la clau la porta). */
export const VERSIO_ALGORITME = 2;

const ESTATS_AMB_DADES = Object.freeze(['complet', 'parcial']);

const buit = (valor) => valor === undefined || valor === null
  || (typeof valor === 'string' && valor.trim() === '')
  || (typeof valor === 'number' && !Number.isFinite(valor));

/** Una foto aportada es conserva; la il·lustració genèrica no és una foto. */
export const teImatgeReal = (valor) => typeof valor === 'string' && Boolean(valor.trim()) && !/hero_nanobanana(?:[._-]|$)/i.test(valor);

/** Una font recent que declara absències evita repetir consultes sense fi.
 * «Revisada» no afirma que totes les dades existisquen. */
export function hidratacioRevisada(town, entrada = null, ara = Date.now()) {
  if (entrada?.dto?.hydration_version === VERSIO_ALGORITME && Number.isFinite(entrada.llegitEl)
    && entrada.llegitEl <= ara + 300000 && ara - entrada.llegitEl < 30 * 86400000) return true;
  const revisio = town?.wikipedia_hydration;
  if (revisio?.version !== VERSIO_ALGORITME || !['verified', 'partial'].includes(revisio.status) || !Array.isArray(revisio.missing)) return false;
  const quan = Date.parse(revisio.checked_at); let font;
  try { font = new URL(revisio.source_url); } catch { return false; }
  return font.protocol === 'https:' && !font.username && !font.password && ['ca.wikipedia.org', 'es.wikipedia.org', 'www.wikidata.org', 'wikidata.org'].includes(font.hostname)
    && Number.isFinite(quan) && quan <= ara + 300000 && ara - quan < 30 * 86400000
    && revisio.missing.every(camp => CAMPS_DE_FITXA.includes(camp));
}

/* Sobre les dades CRUES de la fitxa: `imageSrc` ja porta la imatge genèrica
   de resolveTownImageUrl i faria que tot semblara complet. */
/** Els camps de CAMPS_DE_FITXA que la fitxa no porta. */
export function campsQueFalten(town) {
  if (!town || typeof town !== 'object') return [...CAMPS_DE_FITXA];
  return CAMPS_DE_FITXA.filter((camp) => camp === 'image_url' ? !teImatgeReal(town[camp]) : buit(town[camp]));
}

/** Cert si la fitxa porta totes les dades que pinta la pàgina del poble. */
export function fitxaCompleta(town) {
  return campsQueFalten(town).length === 0;
}

const nomDelPoble = (town) => (typeof town?.title === 'string' && town.title.trim() ? town.title
  : typeof town?.name === 'string' ? town.name : '');

const normalitza = (text) => String(text ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLocaleLowerCase('ca').replace(/\s+/g, ' ').trim();

/**
 * La clau de la cau d'un poble: el seu nom com a slug, la província de la
 * fitxa (per a no barrejar homònims) i la versió de l'algoritme. null si el
 * poble no té cap nom que es puga buscar.
 */
export function clauDeViquipedia(town) {
  const slug = slugDelPoble(nomDelPoble(town));
  if (!slug) return null;
  return `${slug}|${normalitza(town.provincia)}|a${VERSIO_ALGORITME}`;
}

/**
 * La guarda final (disseny §3.10): fora del País Valencià, la província no
 * desfà homònims. Una proposta només val per a un poble si porta el mateix
 * nom (el mateix slug) que la fitxa.
 */
export function esDelMateixPoble(town, dto) {
  const slug = slugDelPoble(nomDelPoble(town));
  return Boolean(slug) && typeof dto?.title === 'string' && slugDelPoble(dto.title) === slug;
}

/** Cert si una entrada de la cau porta dades que es poden posar a la fitxa. */
export function entradaAmbDades(entrada) {
  return Boolean(entrada?.dto) && ESTATS_AMB_DADES.includes(entrada.dto.estat);
}

/**
 * La fitxa amb els buits omplits per una entrada de la cau ({ dto, llegitEl }).
 * Només es tria entre CAMPS_QUE_OMPLI i només els que la fitxa no porta.
 * Torna EL MATEIX objecte si la fitxa ja és completa o si no s'hi ha omplit
 * res (Llei del Píxel); si no, una còpia amb `fontsDeViquipedia`:
 * { original, omplits, llegitEl }.
 */
export function fusionaAmbViquipedia(town, entrada) {
  if (!town || typeof town !== 'object'
    || !entradaAmbDades(entrada) || !esDelMateixPoble(town, entrada.dto)) return town;
  const omplits = CAMPS_QUE_OMPLI.filter(camp => camp !== 'population_year' || buit(town.population) || String(town.population).trim() === String(entrada.dto.population).trim()).filter((camp) => (['image_url', 'avatar_url'].includes(camp) ? !teImatgeReal(town[camp]) : buit(town[camp])) && !buit(entrada.dto[camp]));
  if (!omplits.length) return town;
  return {
    ...town,
    ...Object.fromEntries(omplits.map((camp) => [camp, entrada.dto[camp]])),
    fontsDeViquipedia: Object.freeze({ original: town, dto: entrada.dto, omplits: Object.freeze(omplits), llegitEl: entrada.llegitEl ?? null })
  };
}

/** La fitxa crua d'una fitxa potser hidratada. */
export const fitxaOriginal = (town) => town?.fontsDeViquipedia?.original || town;

/**
 * Cert si la pàgina del poble porta el panell de la Viquipèdia: la fitxa
 * està incompleta (o ja s'ha completat amb la Viquipèdia, i el panell en
 * porta els crèdits). A l'app nativa només es mostren els crèdits de
 * les fonts locals ja incloses: no es munta el panell manual ni s'activa l'API.
 */
export function pobleHidratable(town) {
  if (!town || typeof town !== 'object') return false;
  // Els crèdits de fotos locals no necessiten la connexió Wikimedia.
  if (town.wikipedia_provenance) return true;
  if (esAppNativa()) return false;
  const original = fitxaOriginal(town);
  return clauDeViquipedia(original) !== null && (Boolean(town.fontsDeViquipedia || town.wikipedia_provenance) || !fitxaCompleta(original));
}

/* Les mides estàndard de miniatura de Wikimedia (Common thumbnail sizes,
   consultat el 30-10-2026): una mida no estàndard es rebutja (T414805). */
const AMPLADA_DE_MINIATURA = 960;
const MINIATURA = /^(https:\/\/(?:upload|thumb)\.wikimedia\.org\/[^?#]*\/thumb\/[^?#]+\/)(\d+)px-([^/?#]+)$/;

/**
 * La miniatura de Commons a 960 px (mida estàndard) en lloc de la de 1920
 * que torna l'API (iiurlwidth=1600 s'arrodonix a 1920): la de la Torre Gran
 * passa de 700.626 a 188.601 bytes (GET del 30-10-2026). Una URL que no és
 * una miniatura de Commons, o que ja és més estreta, torna tal qual.
 */
export function miniaturaDeCommons(src) {
  const trossos = typeof src === 'string' ? MINIATURA.exec(src) : null;
  if (!trossos || Number(trossos[2]) <= AMPLADA_DE_MINIATURA) return src;
  return `${trossos[1]}${AMPLADA_DE_MINIATURA}px-${trossos[3]}`;
}


/** Instantània editorial local: només els identificadors, nom, província i
 * element propis contrastats. No busca homònims pel nom ni fa cap petició.
 * Els assets són locals; els URL remots del DTO només en documenten la font. */
export function fusionaAmbFitxaEditorial(town) {
  if (!town || typeof town !== 'object' || typeof town.id !== 'string'
    || !Object.hasOwn(DADES_POBLES_APLEC_VIQUIPEDIA, town.id)) return town;
  const font = DADES_POBLES_APLEC_VIQUIPEDIA[town.id];
  if ((town.type && town.type !== 'town') || slugDelPoble(nomDelPoble(town)) !== slugDelPoble(font.title)
    || (!buit(town.provincia) && normalitza(town.provincia) !== normalitza(font.provincia))
    || (!buit(town.comarca) && normalitza(town.comarca) !== normalitza(font.comarca))
    || (!buit(town.wikipedia_title) && normalitza(town.wikipedia_title) !== normalitza(font.wikipedia_title))
    || (!buit(town.wikidata_id) && town.wikidata_id !== font.wikidata_id)
    || (!buit(town.parent_poble_id) && town.parent_poble_id !== font.parent_poble_id)) return town;
  const camps = [...CAMPS_QUE_OMPLI, 'wikipedia_url', 'image_url', 'avatar_url', 'parent_poble_id', 'parent_poble_nom'];
  const omplits = [...new Set(camps)].filter(camp => (['image_url', 'avatar_url'].includes(camp) ? !teImatgeReal(town[camp]) : buit(town[camp]))
    && !buit(font[camp]) && (camp !== 'population_year' || buit(town.population) || town.population === font.population));
  const marcaFalta = town.wikipedia_hydration?.version !== font.wikipedia_hydration.version
    || !town.wikipedia_provenance;
  if (!omplits.length && !marcaFalta) return town;
  const resultat = { ...town, ...Object.fromEntries(omplits.map(camp => [camp, font[camp]])),
    hydration_version: font.hydration_version, wikipedia_hydration: font.wikipedia_hydration,
    wikipedia_provenance: font.wikipedia_provenance };
  if (!teImatgeReal(town.imageSrc) && teImatgeReal(resultat.image_url)) resultat.imageSrc = resultat.image_url;
  const fotoEditorial = resultat.image_url === font.image_url;
  resultat.imatges = { hero: fotoEditorial ? font.imatges.hero : town.imatges?.hero ?? null,
    avatar: resultat.avatar_url === font.avatar_url ? font.imatges.avatar : town.imatges?.avatar ?? null,
    reserva: town.imatges?.reserva ?? null };
  resultat.wikipedia_provenance = { ...font.wikipedia_provenance,
    photo: fotoEditorial ? font.wikipedia_provenance.photo : town.wikipedia_provenance?.photo ?? null };
  delete resultat.shield_url;
  delete resultat.shield;
  if (fotoEditorial && buit(town.copyright)) resultat.copyright = font.copyright;
  return resultat;
}
