import { ETIQUETES_COMUNES, ETIQUETES_COMUNES_PENDENTS_5L, ETIQUETES_LOCALS_SEED, TRIATGE_ETIQUETES_1_49, esEntitatReservadaTaxonomia, esSlugProtegitSistema, resolCategoriaSistema, resolEtiquetaComuna, slugTaxonomia } from './taxonomiaPublicacio.js';

const text = valor => typeof valor === 'string' ? valor.trim() : '';
const PUBLICS = ['public','published','publicat','publicada'];
/* R32.5 i 2611121430 (private.mur_public_eligible) · Una peça retirada, moderada o esborrada no revela metadades,
   tampoc dins d'attributes o payload. La passada té un límit de capes, com la del servidor. */
function retiradaOEsborrada(publicacio) {
  const pendents = [publicacio];
  for (let capes = 0; pendents.length; capes++) {
    const capa = pendents.pop();
    if (capes >= 16 || !capa || typeof capa !== 'object' || Array.isArray(capa)) return true;
    if ((Object.hasOwn(capa, 'moderation_state') && capa.moderation_state !== 'visible')
      || (Object.hasOwn(capa, 'deleted_at') && capa.deleted_at !== null) || (Object.hasOwn(capa, 'deletedAt') && capa.deletedAt !== null)
      || (Object.hasOwn(capa, 'deleted') && capa.deleted !== false)) return true;
    for (const clau of ['attributes','payload']) if (Object.hasOwn(capa, clau) && capa[clau] !== null) pendents.push(capa[clau]);
  }
  return false;
}
/* L'estat d'una fitxa d'àmbit (vehicle, treball, habitatge, mercat…) és de disponibilitat, no de publicació:
   el mateix enum que ESTATS de utils/publicacioUniversal.js (la paritat la prova folksonomiaCurada.v1226.test.js). */
export const ESTATS_DE_FITXA = Object.freeze(['disponible','reservat','complet','tancat']);
/* true: declarada pública; false: qualsevol marca privada o malformada; null: no en declara cap. */
function publicitatDeclarada(publicacio) {
  if (!publicacio || typeof publicacio !== 'object' || Array.isArray(publicacio)) return false;
  const estatDeFitxa = typeof publicacio.ambit === 'string' && publicacio.ambit !== 'mur' && ESTATS_DE_FITXA.includes(publicacio.estat);
  // Si conviuen els dos contractes, cap estat privat pot quedar tapat per l'altre.
  for (const camp of ['status','estat']) if (publicacio[camp] !== undefined && typeof publicacio[camp] !== 'string') return false;
  const estats = [text(publicacio.status).toLowerCase(), estatDeFitxa ? '' : text(publicacio.estat).toLowerCase()].filter(Boolean);
  if (publicacio.private === true || publicacio.esborrany === true || publicacio.draft === true || publicacio.isDraft === true || publicacio.published === false || publicacio.is_published === false || estats.some(e => !PUBLICS.includes(e))) return false;
  if (retiradaOEsborrada(publicacio)) return false;
  if (Object.hasOwn(publicacio, 'visibility')) return typeof publicacio.visibility === 'string' && text(publicacio.visibility).toLowerCase() === 'public';
  return estats.length > 0 ? true : null;
}
/** No s'inferix publicitat d'una categoria ni d'un autor. Els esborranys no revelen metadades. */
export function taxonomiaEsPublica(publicacio) { return publicitatDeclarada(publicacio) === true; }
const textosPlans = valors => Array.isArray(valors) ? valors.filter(v => typeof v === 'string' && v.length <= 160 && !/[<>\u0000-\u001f]/.test(v)).map(v => v.trim()).filter(Boolean) : [];
export function metadadesTaxonomiaPubliques(publicacio) {
  if (!taxonomiaEsPublica(publicacio)) return { categoriesSistema: [], etiquetes: [] };
  return { categoriesSistema: textosPlans(publicacio.categoriesSistema), etiquetes: textosPlans(publicacio.etiquetes) };
}

/* C26-1 #4 · Les seccions on una fila de section_submissions ja és una publicació (les que llig llig_mur_membres i
   escriu categoriesSistemaPerPublicar); les notes són privades. */
const SECCIONS_PUBLIQUES = new Set(['mur','mercat','events','multimedia']);
/* Una etiqueta de publicació és text pla o { text, className }: la targeta pinta sdp-badge-tag quan no porta
   cap classe admesa (mapejadorSeccions.js · etiquetaDePublicacio). Les categories temàtiques (sdp-badge-category)
   i les de sistema no són etiquetes. */
function etiquetesDeLabels(labels) {
  if (!Array.isArray(labels)) return [];
  const textos = [];
  for (const label of labels) {
    if (typeof label === 'string') { textos.push(label); continue; }
    if (!label || typeof label !== 'object' || typeof label.text !== 'string') continue;
    const classes = typeof label.className === 'string' ? label.className.split(/\s+/).filter(Boolean) : [];
    if (!classes.length || classes.includes('sdp-badge-tag')) textos.push(label.text);
  }
  return textosPlans(textos);
}
/** C26-1 #4 · L'entrada de la safata a partir de la forma REAL del port: l'element que tornen elementDeFilaPublicada
 * (lectura de membres: ownerUserId de la columna, labels, poble_id, sectionId) i mapSectionSubmissionToItem
 * (escriptura), o la forma canònica (author_id, town_id, etiquetes, status/visibility). Una marca privada guanya
 * sempre; sense cap marca, la publicitat és la de la secció o la d'una peça que es mostra al Mur.
 * Sense autor (la projecció anònima del Mur) no compta: la safata compta persones. El poble és opcional. */
export function entradaDeSafata(publicacio) {
  const declarada = publicitatDeclarada(publicacio);
  if (declarada === false) return null;
  // Una nota del Bloc no és mai una publicació: la del Mur és una altra fila.
  const seccio = text(publicacio.sectionId);
  if (seccio === 'notes' || (declarada === null && !SECCIONS_PUBLIQUES.has(seccio) && publicacio.mostrarAlMur !== true)) return null;
  const id = text(publicacio.id), autor = text(publicacio.ownerUserId ?? publicacio.author_id ?? publicacio.autorId);
  if (!id || !autor) return null;
  return { id, autor, poble: text(publicacio.poble_id ?? publicacio.pobleId ?? publicacio.town_id), etiquetes: [...textosPlans(publicacio.etiquetes), ...etiquetesDeLabels(publicacio.labels)] };
}

/* C26-1 #10 · El triatge 1..49 del Mestre: els decidits (comuna, àlies, entitat, geografia, retirada, pilar, sistema)
   no són emergents; els pendents (#1, #13, #29) s'observen amb estat 'pendent' i les locals (triatge i llavor),
   amb local:true i sense promoció: no contaminen el catàleg comú. */
const decidits = new Set(), observats = new Map();
for (const e of TRIATGE_ETIQUETES_1_49) {
  if (e.tipus === 'pendent') observats.set(slugTaxonomia(e.original), { nom: e.original, estat: 'pendent' });
  else if (e.tipus === 'local') for (const nom of [e.original, e.desti]) observats.set(slugTaxonomia(nom), { nom: e.desti, estat: 'local' });
  else for (const nom of [e.original, e.desti]) if (nom) decidits.add(slugTaxonomia(nom));
}
for (const e of ETIQUETES_LOCALS_SEED) observats.set(e.slug, { nom: e.nom, estat: 'local' });
for (const e of ETIQUETES_COMUNES_PENDENTS_5L) decidits.add(e.slug);
const comunes = new Set(ETIQUETES_COMUNES.map(e => e.slug));
/** Una safata és una observació, mai una promoció automàtica al vocabulari comú.
 * O(n + k log k): un recorregut de publicacions/etiquetes, ordenació de k emergents. */
export function agregaEtiquetesEmergents(publicacions) {
  if (!Array.isArray(publicacions)) return [];
  const safata = new Map(), publicacionsVistes = new Set();
  for (const p of publicacions) {
    const entrada = entradaDeSafata(p);
    if (!entrada || publicacionsVistes.has(entrada.id)) continue;
    publicacionsVistes.add(entrada.id);
    const vistes = new Set();
    for (const nom of entrada.etiquetes) {
      if (nom.startsWith('@') || nom.startsWith('📍')) continue;
      const etiqueta = nom.startsWith('#') ? nom.slice(1).trim() : nom;
      const slug = slugTaxonomia(etiqueta);
      if (!slug || vistes.has(slug) || comunes.has(slug) || decidits.has(slug) || resolEtiquetaComuna(etiqueta) || resolCategoriaSistema(etiqueta)
        || esSlugProtegitSistema(slug) || esEntitatReservadaTaxonomia(etiqueta)) continue;
      // El nom llarg del triatge (El Carreró Centre Cultural i Tecnològic) s'agrupa amb el curt (El Carreró).
      const observat = observats.get(slug), clau = observat ? slugTaxonomia(observat.nom) : slug;
      if (vistes.has(clau)) continue;
      vistes.add(clau);
      if (!safata.has(clau)) safata.set(clau, { slug: clau, nom: observat?.nom ?? etiqueta, estat: observat?.estat ?? 'emergent', autors: new Set(), pobles: new Set(), publicacions: 0 });
      const fila = safata.get(clau);
      fila.autors.add(entrada.autor); if (entrada.poble) fila.pobles.add(entrada.poble); fila.publicacions += 1;
    }
  }
  return [...safata.values()].map(e => ({ slug: e.slug, nom: e.nom, estat: e.estat, local: e.estat === 'local', promocionable: e.estat === 'emergent',
    nombreAutors: e.autors.size, nombrePobles: e.pobles.size, nombrePublicacions: e.publicacions }))
    .sort((a,b) => b.nombreAutors - a.nombreAutors || b.nombrePobles - a.nombrePobles || b.nombrePublicacions - a.nombrePublicacions || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
}
