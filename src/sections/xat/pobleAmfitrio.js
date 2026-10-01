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
 *
 * Model B: ací no hi ha cap crida al backend. El poble és presentació i
 * navegació (configAmfitrio.js): mai `tenantId`.
 */
import { sanejaEtiqueta, sanejaIdentificador } from '../../config/configAmfitrio.js';

const enc = (valor) => encodeURIComponent(String(valor));

/** { id, nom } del poble de l'amfitrió, o null si no n'ha declarat cap vàlid. */
export function pobleDeConfig(externalConfig) {
  const id = sanejaIdentificador(externalConfig?.poble);
  if (!id) return null;
  return { id, nom: sanejaEtiqueta(externalConfig?.nomPoble) || '' };
}

/** La ruta de la pàgina del poble dins de l'app. */
export const rutaDelPobleXat = (poble) => `/pobles/${enc(poble.id)}`;

/** El nom que es pinta: el que declara l'amfitrió o, sense, l'id. */
export const nomDelPoble = (poble) => poble?.nom || poble?.id || '';

/**
 * El subjecte connectable del poble, com el que construïx la seua targeta
 * (objecteConnectable.js). En seed/local el títol del grup és este `titol`; en
 * remot el posa el servidor (towns.name), vegeu el pla 2135, P1.
 */
export function objecteDelPoble(poble) {
  return { tipus: 'poble', id: poble.id, titol: nomDelPoble(poble), ruta: rutaDelPobleXat(poble) };
}

/** /xat?sobre=poble:<id>&titol=…&ruta=…: el mateix camí que el «Comentar» del poble. */
export function rutaSobreDelPoble(poble) {
  const objecte = objecteDelPoble(poble);
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
