/**
 * pobleAmfitrio.js — el grup del poble de l'amfitrió al Xat (torn 260930, T1:
 * «el grup "Gent de la Torre" ha de ser la primera vista si entrem
 * directament a /xat»).
 *
 * Quan un amfitrió declara `poble` (i, opcionalment, `nomPoble`) a la seua
 * configuració (window.SocDePobleConfig, l'atribut de l'element o el plugin de
 * WordPress), el Xat posa el xat comú d'eixe poble al capdamunt de la llista:
 *   · si la comunitat del poble ja existix a les dades, la seua fila va
 *     primera, per damunt de les fixades;
 *   · si encara no existix, una fila virtual amb el `nomPoble` ocupa eixe lloc
 *     i, en prémer-la, fa el recorregut ?sobre=poble:<id> que ja fa el
 *     «Comentar» de la pàgina del poble (XatSection, obriFilDePagina).
 * Sense poble declarat (socdepoble.org, el standalone a #root) no canvia res.
 * Gauntlet 261016 (Bloc 3.6) · Derogat per a la LLISTA: sense poble declarat,
 * la fila és la de POBLE_PER_DEFECTE («Gent de la Torre»), que el Mestre vol
 * sempre visible. L'entrada automàtica continua sense fer res.
 *
 * Model B: ací no hi ha cap crida al backend. El poble és presentació i
 * navegació (configAmfitrio.js): mai `tenantId`.
 */
import { sanejaEtiqueta, sanejaIdentificador } from '../../config/configAmfitrio.js';
import { nomDeLaGentDelPoble } from '../pobles/nomsDelPoble.js';

const enc = (valor) => encodeURIComponent(String(valor));

/* La fitxa de /pobles del poble de l'amfitrió (towns del contingut del node,
   useCoreContent), per id o per slug. null si no hi és o no se'n passen. */
function fitxaDelPoble(poble, towns) {
  if (!poble || !Array.isArray(towns)) return null;
  return towns.find((town) => town && (String(town.id) === poble.id || (town.slug != null && String(town.slug) === poble.id))) || null;
}

/** { id, nom } del poble de l'amfitrió, o null si no n'ha declarat cap vàlid. */
export function pobleDeConfig(externalConfig) {
  const id = sanejaIdentificador(externalConfig?.poble);
  if (!id) return null;
  return { id, nom: sanejaEtiqueta(externalConfig?.nomPoble) || '' };
}

/**
 * Gauntlet 261016 (prompt, Bloc 3.6; pla, Onada 1.2) · Ordre del Mestre:
 * «Gent de la Torre» és una de les quatre converses que el Xat porta SEMPRE,
 * també sense amfitrió (socdepoble.org, el standalone, localhost). És el poble
 * pilot de la llavor (sections/pobles/townsSeed.js), amb el nom de l'ordre.
 * Un poble declarat per l'amfitrió mana i el substituïx.
 */
export const POBLE_PER_DEFECTE = Object.freeze({ id: 'la-torre-de-les-macanes', nom: 'Gent de la Torre' });

/**
 * El poble de la fila del xat: el de l'amfitrió o, sense, POBLE_PER_DEFECTE.
 * Només per a la llista (la fila i la seua cara). L'entrada automàtica a la
 * fitxa del poble (EntradaDelPoble) continua sent només la del poble declarat:
 * sense amfitrió, /xat no s'obri sol en cap fitxa.
 */
export const pobleDelXat = (poble) => poble || POBLE_PER_DEFECTE;

/** La ruta de la pàgina del poble dins de l'app. */
export const rutaDelPobleXat = (poble) => `/pobles/${enc(poble.id)}`;

/**
 * Onada 3 (P2) · La cara del poble de l'amfitrió al Xat: la de la seua fitxa
 * de Pobles (`towns` del contingut del node, useCoreContent), per id o per
 * slug, amb la mateixa precedència que la targeta de /pobles (PoblesSection:
 * avatar_url, si no image_url o imageSrc). null si el poble no hi és: cap
 * imatge inventada ni cap llavor en remot. Pura: qui la crida passa les fitxes.
 */
export function avatarDelPoble(poble, towns) {
  const fitxa = fitxaDelPoble(poble, towns);
  return fitxa?.avatar_url || fitxa?.image_url || fitxa?.imageSrc || null;
}

/**
 * El nom que es pinta: el que declara l'amfitrió o, sense, l'id.
 * Onada 6 (pla 261009_0245, ítem 4: el xat del poble es diu «Gent de …») ·
 * Amb les fitxes (`towns`, opcional) i sense nomPoble declarat, el nom de la
 * gent de la fitxa (pobles/nomsDelPoble.js · nomDeLaGentDelPoble: l'`author`
 * o nomDeLaGent del seu nom), el mateix de la pàgina del poble. Sense
 * fitxes, com sempre.
 */
export const nomDelPoble = (poble, towns) => poble?.nom
  || nomDeLaGentDelPoble(fitxaDelPoble(poble, towns))
  || poble?.id || '';

/**
 * El subjecte connectable del poble, com el que construïx la seua targeta
 * (objecteConnectable.js). En seed/local el títol del grup és este `titol`; en
 * remot el posa el servidor (towns.name), vegeu el pla 2135, P1.
 * Onada 6 · `towns` (opcional), com nomDelPoble.
 */
export function objecteDelPoble(poble, towns) {
  return { tipus: 'poble', id: poble.id, titol: nomDelPoble(poble, towns), ruta: rutaDelPobleXat(poble) };
}

/** /xat?sobre=poble:<id>&titol=…&ruta=…: el mateix camí que el «Comentar» del poble. */
export function rutaSobreDelPoble(poble, towns) {
  const objecte = objecteDelPoble(poble, towns);
  return `/xat?sobre=${enc(`poble:${objecte.id}`)}&titol=${enc(objecte.titol)}&ruta=${enc(objecte.ruta)}`;
}

/**
 * La comunitat és la del poble? En seed el subjecte porta l'id (el slug); en
 * remot el servidor pot guardar l'UUID de `towns` i derivar la ruta canònica
 * (/pobles/<slug>): val qualsevol de les dos.
 */
export function esComunitatDelPoble(comunitat, poble) {
  const subjecte = comunitat?.fil?.subjecte;
  if (!poble || !subjecte || subjecte.tipus !== 'poble') return false;
  return String(subjecte.id) === poble.id || subjecte.ruta === rutaDelPobleXat(poble);
}

/*
 * Onada 3 (P2, revisió) · La comunitat del poble de l'amfitrió porta la cara
 * del poble quan el servidor no n'hi dona cap. Amb sessió, xat_fils_meus torna
 * coalesce(f.imatge_url, …) i una comunitat de poble no en té (public.towns no
 * té columna d'imatge): la fila virtual (FilaPoble) ja portava la cara i, en
 * nàixer la comunitat, la mateixa fila queia a les inicials. És presentació,
 * no dada: la imatge del fil, si n'hi ha, mana; sense cara del poble no canvia
 * res. Només la comunitat, mai el General ni els Avisos (porten la seua
 * icona). Tornen la mateixa llista si no hi ha res a vestir.
 */
const esLaComunitatDelPoble = (fil, poble) => Boolean(fil)
  && (fil.tipus === 'comunitat' || fil.esComunitat === true)
  && esComunitatDelPoble({ fil }, poble);

const vestixDelPoble = (fil, poble, cara) => (esLaComunitatDelPoble(fil, poble) && !fil.avatar_url
  ? { ...fil, avatar_url: cara }
  : fil);

/** Els fils del Xat, amb la cara del poble a la comunitat del poble (vegeu dalt). */
export function filsAmbCaraDelPoble(fils, poble, cara) {
  if (!poble || !cara || !Array.isArray(fils)) return fils;
  const vestits = fils.map((fil) => vestixDelPoble(fil, poble, cara));
  return vestits.some((fil, i) => fil !== fils[i]) ? vestits : fils;
}

/** Les comunitats ({ fil, fills }), amb la mateixa regla sobre el `fil` de cadascuna. */
export function comunitatsAmbCaraDelPoble(comunitats, poble, cara) {
  if (!poble || !cara || !Array.isArray(comunitats)) return comunitats;
  const vestides = comunitats.map((comunitat) => {
    const fil = vestixDelPoble(comunitat?.fil, poble, cara);
    return fil === comunitat?.fil ? comunitat : { ...comunitat, fil };
  });
  return vestides.some((comunitat, i) => comunitat !== comunitats[i]) ? vestides : comunitats;
}

/** El grup General d'una comunitat (el primer fill que no és el canal d'Avisos). */
export function generalDeComunitat(comunitat) {
  const fills = Array.isArray(comunitat?.fills) ? comunitat.fills : [];
  return fills.find((f) => f?.tipus === 'grup') || fills.find((f) => f?.tipus !== 'canal') || null;
}

/**
 * Les files de la llista amb el poble al capdamunt. `files` ja ve ordenada
 * (fixades primer, després per activitat). Torna una llista nova:
 *   · la fila de la comunitat del poble, moguda a dalt i marcada `delPoble`;
 *   · o, si no hi és i `virtual` és cert, una fila { tipus: 'poble' }.
 * La fila virtual no es pot triar ni passa els filtres «No llegits» i
 * «Preferits» (no té dades); sí «Grups», perquè és un grup.
 * Gauntlet 261016_1530 (Bloc 3.6, ordre vigent) · XatSection hi aplica
 * després anteposaActors (actorsDelXat.js): la fila del poble és el TERCER
 * actor, darrere de la comunitat de Sóc de Poble i de Javi Llinares.
 */
export function anteposaPoble(files, { poble, comunitats = [], virtual = true } = {}) {
  if (!poble) return files;
  const comunitat = comunitats.find((c) => esComunitatDelPoble(c, poble)) || null;
  if (comunitat) {
    const clau = `comunitat:${comunitat.fil.id}`;
    const fila = files.find((f) => f.clau === clau);
    if (!fila) return files;
    return [{ ...fila, delPoble: true }, ...files.filter((f) => f !== fila)];
  }
  if (!virtual) return files;
  return [{ clau: `poble:${poble.id}`, tipus: 'poble', poble, delPoble: true }, ...files];
}
