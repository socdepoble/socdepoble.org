/**
 * connexions.js — El cos d'una connexió del MAS (T5, T43, T54). Pur: sense
 * React ni backend (Model B).
 *
 *   · contingutDeLaConnexio: el cos que es desa a la nota en connectar
 *     (ConnectarSection). Una presentació curta que enllaça l'element de veres.
 *   · senseParagrafHeretat: el lector del MAS (ConnexioDetall) no pinta el
 *     paràgraf fix de les connexions d'abans de T54.
 *   · cosDeConnexioPerAlMur: la presentació feta amb l'origen (títol, qui
 *     l'ha escrit si l'origen ho porta, i l'enllaç de l'original o l'avís que
 *     no en porta).
 *   · cosDeConnexioEditadaPerAlMur (D4, excepció del Mestre, 260930): el cos
 *     que ix al Mur quan es compartix una connexió. La connexió és una còpia
 *     editable: ix el cos de la nota tal com l'ha deixat la persona (sense
 *     els paràgrafs fixos que el sistema li va escriure a ella) i, si ja no
 *     enllaça l'original o ja no nomena qui el signa (revisió, 260930), la
 *     presentació amb l'enllaç i l'autoria al final. Germana de
 *     cosDeLExternPerAlMur (connectar/contingutExtern.js).
 *   · hrefsDe: les adreces dels enllaços d'un HTML, desentitzades (les usen
 *     les dues funcions del Mur per a saber si el cos ja cita l'original).
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
 * El cos no parla a «el teu MAS» (si mai arribara a altres ulls, seria fals).
 * D1 (ordre del Mestre, 260930) · el verb és connectar, no guardar. */
export function contingutDeLaConnexio(origen) {
  return `<p>Element connectat ${presentacio(origen)}.</p><p>Connectat per a llegir-lo més tard.</p>`;
}

/* Les connexions d'abans de T54 porten al cos un segon paràgraf fix que
   prometia etiquetar-les i compartir-les des de l'editor. És una dada heretada
   (ConnectarSection el va escriure així) i no diu el que es pot fer al lector.
   La resta del cos (qui l'ha escrit, l'enllaç) es queda. */
const PARAGRAF_HERETAT = /<p>\s*Ordena(?:['’]|&#39;|&#x27;|&apos;)l a les teues carpetes[^<]*<\/p>/gi;
export const senseParagrafHeretat = (html) => String(html ?? '').replace(PARAGRAF_HERETAT, '');

/* D4 · Els paràgrafs fixos que el sistema escriu (o va escriure) al cos d'una
   connexió i que parlen a qui la té: al Mur no diuen res de veres. La resta
   del cos, siga del sistema o de la persona, es queda. */
const PARAGRAFS_PRIVATS = Object.freeze([
  PARAGRAF_HERETAT,
  /<p>\s*(?:Guardat|Connectat) per a llegir-lo més tard\.?\s*<\/p>/gi,
  /<p>\s*Guardat al teu MAS per a llegir-lo quan vulgues\.?\s*<\/p>/gi
]);
const senseParagrafsPrivats = (html) => PARAGRAFS_PRIVATS
  .reduce((cos, patro) => cos.replace(patro, ''), String(html ?? ''));

/* Els href d'un HTML: entre cometes dobles, simples o sense. L'editor pot
   reordenar atributs i afegir-ne (rel, target): es mira l'adreça, no el text. */
const HREF = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
/* Les entitats que un serialitzador posa dins d'un atribut. Una sola passada:
   «&amp;quot;» torna «&quot;», no «"». */
const ENTITATS = Object.freeze({
  amp: '&', quot: '"', apos: "'", lt: '<', gt: '>',
  '#38': '&', '#x26': '&', '#34': '"', '#x22': '"', '#39': "'", '#x27': "'"
});
const desentitza = (valor) => valor.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (sencera, nom) => ENTITATS[nom.toLowerCase()] ?? sencera);

/** Les adreces dels enllaços d'un HTML, amb les entitats desfetes una vegada. */
export function hrefsDe(html) {
  return [...String(html ?? '').matchAll(HREF)].map(([, doble, simple, nua]) => desentitza(doble ?? simple ?? nua ?? ''));
}

/** La presentació de l'original per al Mur: d'on ve, de qui és i l'enllaç.
 * Sense ruta de l'original, ho diu. */
export function cosDeConnexioPerAlMur(origen) {
  const avis = rutaSegura(origen) ? '' : '<p>Esta publicació no porta l’enllaç de l’original.</p>';
  return `<p>Compartit ${presentacio(origen)}.</p>${avis}`;
}

/* Revisió de D4 (260930) · El text que es llig d'un HTML: sense etiquetes ni
   atributs (un nom dins d'un href no el cita), amb els espais durs i les
   entitats desfets, els espais plegats i en minúscules per a comparar. */
const plega = (text) => String(text ?? '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('ca');
const textVisible = (html) => plega(desentitza(String(html ?? '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&(?:nbsp|#0*160|#x0*a0);/gi, ' ')));

/* El cos ja nomena qui signa l'original? Sense autor a l'origen, no hi ha
   ningú a citar. */
const nomenaLAutor = (cos, origen) => {
  const autor = plega(origen?.autorNom);
  return !autor || textVisible(cos).includes(autor);
};

/**
 * D4 (excepció del Mestre, 260930) · El cos d'una connexió quan es compartix
 * al Mur: el de la nota, que la persona ha pogut editar, sense els paràgrafs
 * fixos privats, i la presentació de l'original (enllaç i autoria) al final.
 * Revisió (260930) · El cos ix sense afegits NOMÉS si ja enllaça la ruta de
 * l'original I també nomena qui el signa (origen.autorNom; sense autor, amb
 * l'enllaç n'hi ha prou): conservar l'enllaç i esborrar el nom no deixa la
 * publicació sense autoria, que és el que prometen l'avís de l'editor i el de
 * drets reservats. Sense ruta segura, la presentació sempre, amb l'avís.
 * `html` ha de ser el cos ja sanejat: es mira el que arribarà al Mur.
 */
export function cosDeConnexioEditadaPerAlMur(html, origen) {
  const cos = senseParagrafsPrivats(html);
  const ruta = rutaSegura(origen);
  if (ruta && hrefsDe(cos).includes(ruta) && nomenaLAutor(cos, origen)) return cos;
  return `${cos}${cosDeConnexioPerAlMur(origen)}`;
}
