/**
 * fitxaEditorialDelPoble.js · Onada R24 · wp_trinquet (SEO-R22-08, trinquet
 * de l'arrencada estàtica) · La instantània editorial local d'un poble
 * (fusionaAmbFitxaEditorial, fitxaDelPoble.js), en un mòdul propi:
 * townsSeed.js, que és de l'arrencada, només en vol esta funció i,
 * important-la de fitxaDelPoble.js, arrossegava al tros d'entrada la cau de
 * la Viquipèdia (clauDeViquipedia, fusionaAmbViquipedia, pobleHidratable, les
 * miniatures de Commons), que només fan servir la pàgina del poble i el seu
 * panell, diferits. Trasllat literal: fitxaDelPoble.js en reexporta
 * CAMPS_QUE_OMPLI, teImatgeReal i fusionaAmbFitxaEditorial amb els mateixos
 * noms i fa servir buit, nomDelPoble i normalitza. Les dades són les de
 * sempre (poblesAplecViquipedia.js), que ja eren de l'arrencada.
 */
import { slugDelPoble } from './nomsDelPoble.js';
import { DADES_POBLES_APLEC_VIQUIPEDIA } from './poblesAplecViquipedia.js';

/** Els que pot omplir la Viquipèdia, en l'ordre del DTO de pobleDeViquipedia.js. */
export const CAMPS_QUE_OMPLI = Object.freeze([
  'content', 'provincia', 'comarca', 'population', 'lat', 'lng', 'wikipedia_title', 'wikidata_id',
  'population_year', 'elevation', 'area', 'gentilici'
]);

export const buit = (valor) => valor === undefined || valor === null
  || (typeof valor === 'string' && valor.trim() === '')
  || (typeof valor === 'number' && !Number.isFinite(valor));

/** Una foto aportada es conserva; la il·lustració genèrica no és una foto. */
export const teImatgeReal = (valor) => typeof valor === 'string' && Boolean(valor.trim()) && !/hero_nanobanana(?:[._-]|$)/i.test(valor);

export const nomDelPoble = (town) => (typeof town?.title === 'string' && town.title.trim() ? town.title
  : typeof town?.name === 'string' ? town.name : '');

export const normalitza = (text) => String(text ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLocaleLowerCase('ca').replace(/\s+/g, ' ').trim();

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
