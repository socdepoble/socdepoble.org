/**
 * connexions.js — El cos d'una connexió del MAS (T5, T43, T54). Pur: sense
 * React ni backend (Model B).
 *
 *   · contingutDeLaConnexio: el cos que es desa a la nota en connectar
 *     (ConnectarSection). Una presentació curta que enllaça l'element de veres.
 *   · senseParagrafHeretat: el lector del MAS (ConnexioDetall) no pinta el
 *     paràgraf fix de les connexions d'abans de T54.
 *   · cosDeConnexioPerAlMur: el cos que ix al Mur quan es compartix. El cos
 *     desat és privat (el llig qui té la nota, al seu MAS) i no s'hi publica
 *     mai: el Mur rep una presentació nova feta amb l'origen (títol, qui l'ha
 *     escrit si l'origen ho porta, i l'enllaç de l'original o l'avís que no
 *     en porta).
 *   · rutaSegura: la ruta de l'original, tornada a validar (també al lector).
 *   · signaturaDeCaiguda (T71): qui signa una connexió quan l'original no es
 *     resol (la caiguda del lector i la fitxa del Bloc). Cap autor inventat.
 *   · objecteDeConnexio (T63.2): el descriptor de l'ORIGINAL d'una connexió,
 *     el que el lector passa a Comentar. Mai el de la nota, que és privada.
 */
import { desDe } from '../connectar/abastConnexio.js';
import { esRutaInterna, TIPUS_OBJECTE, tipusDeSeccio } from '../../config/objecteConnectable.js';

/* Text pla → HTML que la closca pinta tal qual (el sanejador ho torna a passar).
   T71 · també el fa servir el contingut de fora (connectar/contingutExtern.js). */
export const aHtml = (text) => String(text ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

/** L'origen ve de dades desades: la ruta es torna a mirar abans d'enllaçar-la
 * (ací i al lector, ConnexioDetall). La ruta interna i segura, o ''. */
export const rutaSegura = (origen) => (esRutaInterna(origen?.ruta) ? origen.ruta : '');

/* Els objectes que són un perfil: qui el signa és el mateix perfil. */
const OBJECTES_PERFIL = new Set(['persona', 'entitat', 'grup', 'ia']);

/** T71 · Qui signa una connexió quan l'original no es resol: { nom, ruta } o
 * null. Un perfil (persona, entitat, grup, IA) el signa ell mateix, amb la
 * ruta de l'origen; si no, el nom que l'origen recorda. Sense cap dels dos,
 * ningú: mai «Sóc de Poble» ni el Foraster per defecte. `ruta` és la del
 * perfil quan se sap ací; si no, ''. */
export function signaturaDeCaiguda(origen) {
  const titol = String(origen?.titol ?? '').trim();
  if (OBJECTES_PERFIL.has(origen?.objecte) && titol) return { nom: titol, ruta: rutaSegura(origen) };
  const autor = String(origen?.autorNom ?? '').trim();
  return autor ? { nom: autor, ruta: '' } : null;
}

/**
 * T63.2 (doctrina del Mestre, 260928) · El descriptor de l'ORIGINAL d'una
 * connexió ({ tipus, id, titol, seccio, ruta, autor: null }), o null. És el
 * que el lector del MAS passa a Comentar: el xat comú de l'original, o el
 * directe si és una persona o una IA; mai res de la nota, que és privada. El
 * tipus és el que l'origen recorda (T43); en una connexió d'abans de T43, el
 * de la secció, amb la mateixa regla que ConnectarSection (origenDeLaConnexio).
 * Un contingut de fora (T71) no té Pàgina Universal: null.
 */
export function objecteDeConnexio(origen) {
  if (origen?.tipus !== 'connexio') return null;
  const seccio = String(origen.sectionId ?? '');
  const tipus = TIPUS_OBJECTE.includes(origen.objecte) ? origen.objecte
    : tipusDeSeccio(seccio) || (seccio === 'perfil' && OBJECTES_PERFIL.has(origen.autorTipus) ? origen.autorTipus : 'pagina');
  return {
    tipus,
    id: String(origen.itemId ?? ''),
    titol: String(origen.titol ?? ''),
    seccio,
    ruta: rutaSegura(origen),
    autor: null
  };
}

/* «des del Mercat de Sóc de Poble: <a>Samarreta</a>»: d'on ve, de qui és i
   l'element (enllaçat només si té ruta interna i segura). */
function presentacio(dades) {
  const origen = dades || {};
  const qui = origen.autorNom ? ` de ${aHtml(origen.autorNom)}` : '';
  const titol = aHtml(origen.titol || origen.itemId || 'un element');
  const ruta = rutaSegura(origen);
  const enllac = ruta ? `<a href="${aHtml(ruta)}">${titol}</a>` : `<strong>${titol}</strong>`;
  return `${desDe(origen.sectionId)}${qui}: ${enllac}`;
}

/** El cos de la nota: una presentació curta que enllaça l'element de veres.
 * T54 · al MAS la connexió es llig (ConnexioDetall): el cos no promet cap
 * acció que el lector no tinga, ni parla a «el teu MAS» (si mai arribara a
 * altres ulls, seria fals). */
export function contingutDeLaConnexio(origen) {
  return `<p>Element connectat ${presentacio(origen)}.</p><p>Guardat per a llegir-lo més tard.</p>`;
}

/* Les connexions d'abans de T54 porten al cos un segon paràgraf fix que
   prometia etiquetar-les i compartir-les des de l'editor. És una dada heretada
   (ConnectarSection el va escriure així) i no diu el que es pot fer al lector.
   La resta del cos (qui l'ha escrit, l'enllaç) es queda. */
const PARAGRAF_HERETAT = /<p>\s*Ordena(?:['’]|&#39;|&#x27;|&apos;)l a les teues carpetes[^<]*<\/p>/gi;
export const senseParagrafHeretat = (html) => String(html ?? '').replace(PARAGRAF_HERETAT, '');

/** T54 · El cos de la publicació quan una connexió es compartix al Mur: mai
 * el cos desat de la nota, sinó l'origen. Sense ruta de l'original, ho diu. */
export function cosDeConnexioPerAlMur(origen) {
  const avis = rutaSegura(origen) ? '' : '<p>Esta publicació no porta l’enllaç de l’original.</p>';
  return `<p>Compartit ${presentacio(origen)}.</p>${avis}`;
}
