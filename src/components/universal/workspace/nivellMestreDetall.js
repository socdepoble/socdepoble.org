/* MD (ordre del Mestre, 261003; revisió) · On comença el mestre-detall en
   «estret», i la memòria del nivell de cada mòdul.

   Per què una memòria: l'enllaç profund no es pot deduir de la URL crua,
   perquè les seccions hi escriuen soles l'element (Notes, l'efecte que obri
   n1; la Wiki i Disseny, la reconciliació i la primera fitxa d'una carpeta).
   Tornar al mòdul amb l'Arrere o recarregar-lo dona eixa mateixa URL, i no és
   cap enllaç: la persona no havia obert eixe element.

   La regla:
     · sense element a la URL, la navegació (el mòdul s'obri pel principi,
       com demana l'ordre del Mestre);
     · amb un element, si és el mateix que tenia la URL quan la persona va
       deixar el mòdul, el nivell on era (carpetes, llista o detall);
     · amb un altre element (un enllaç de la Cerca, del Xat, d'una pestanya
       nova), el detall.

   Es desa a la capa efímera (config/storage.js, sessionStorage): mor amb la
   pestanya, sobreviu a la recàrrega i no creix (una entrada per mòdul). Sense
   la capa, la regla de sempre (element → detall). */
import { getEfimer, setEfimer } from '../../../config/storage.js';

const PREFIX = 'mestre-detall:';
const CLAU_VALIDA = /^[a-z][a-z0-9-]{0,39}$/;
/* Els nivells d'«estret»: la navegació, la llista o (null) el detall. */
const NIVELLS = Object.freeze(['left', 'middle', null]);

const elementDe = (valor) => (valor == null || valor === '' ? null : String(valor));
const clauValida = (clau) => typeof clau === 'string' && CLAU_VALIDA.test(clau);

/** El nivell recordat per al mòdul `clau` si la URL porta el mateix element
 *  que quan es va deixar; si no, undefined. */
export function nivellRecordat(clau, element) {
  if (!clauValida(clau)) return undefined;
  const desat = getEfimer(PREFIX + clau, null);
  if (!desat || typeof desat !== 'object' || !NIVELLS.includes(desat.nivell)) return undefined;
  return elementDe(desat.element) === elementDe(element) ? desat.nivell : undefined;
}

/** Recorda l'element de la URL i el nivell on és la persona. */
export function recordaNivell(clau, element, nivell) {
  if (!clauValida(clau) || !NIVELLS.includes(nivell)) return false;
  return setEfimer(PREFIX + clau, { element: elementDe(element), nivell });
}

/** La primera vista en estret: 'left', 'middle' o null (el detall).
 *  `mestreDetall` és la prop d'UniversalWorkspace: { clau, element } (la
 *  secció diu qui és i l'element de la URL crua), o la forma curta
 *  'navegacio' | 'detall' | true, sense memòria. */
export function entradaMestreDetall(mestreDetall) {
  if (mestreDetall && typeof mestreDetall === 'object') {
    const element = elementDe(mestreDetall.element);
    if (element === null) return 'left';
    const recordat = nivellRecordat(mestreDetall.clau, element);
    return recordat === undefined ? null : recordat;
  }
  return mestreDetall === 'detall' ? null : 'left';
}
