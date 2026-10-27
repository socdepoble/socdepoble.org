/**
 * targetesMur.js — les targetes del Mur, pur: les pàgines del sistema que s'hi
 * barregen i l'instant pel qual s'ordenen.
 *
 * Ordre del Mestre, 261001 · La pàgina /calendari pinta TOTES les targetes del
 * Mur, amb la mateixa data i el mateix ordre que el Mur. Esta lògica vivia
 * dins de MurSection; ara la compartixen totes dues pàgines, i ni la llista ni
 * la pastilla no poden dir dues dates diferents en cap de les dues.
 */
import { fontsDeLActe } from '../../components/universal/EventCard.jsx';
import { dataDeDocument, momentDElement } from '../../components/universal/editorial.js';
import { esAppNativa } from '../../config/origenPublic.js';
import { esPaginaVisible, SYSTEM_PAGES } from '../../config/systemPages.js';

/**
 * Les pàgines del sistema (SYSTEM_PAGES) que el Mur barreja amb les
 * publicacions, fetes targeta amb el seu copy (PAGE_COPY). Una pàgina declarada
 * i absent no es pinta: `quanFalta(clau)` deixa que qui la demana ho diga en
 * veu alta (incident del 24-09: `wikidepoble` → `skills`).
 * Ordre del Mestre (261027) · Dins de l'app nativa (`nativa`, per defecte
 * esAppNativa), les pàgines `nomesWeb` no hi són (esPaginaVisible): no falten,
 * i no avisen. El Mur, el Calendari i usePaginesDelSistema passen tots per ací.
 */
export function targetesDeSistema(pageCopy, { quanFalta, nativa = esAppNativa() } = {}) {
  return SYSTEM_PAGES.filter((item) => esPaginaVisible(item.key, { nativa })).map((item) => {
    const data = pageCopy?.[item.key];
    if (!data) {
      quanFalta?.(item.key);
      return null;
    }
    return {
      ...data,
      /* T51 · La data del copy és la de CREACIÓ de la pàgina (com a
         TextSection): un dia serialitzat, que la regla pinta com el dia sol.
         No és el dia d'un acte (`date`), que dataDElement llegiria com a data
         triada i hi posaria les «02:00» de la mitjanit UTC. */
      date: undefined,
      created_at: data.date,
      id: item.key,
      isSystem: true,
      isAvis: item.isAvis,
      mainHref: item.href,
      type: 'sistema'
    };
  }).filter(Boolean);
}

/**
 * T51 i T5 · L'instant (ms) pel qual s'ordena una targeta: el MATEIX que pinta
 * la seua pastilla. Un acte del model, el del seu inici (EventCard ·
 * fontsDeLActe), encara que el payload porte un altre `date` o una edició
 * posterior; la resta, el de dataDElement (momentDElement). null sense cap
 * data real: no se n'inventa cap per a ordenar.
 */
export function momentDeLaTargeta(item, esdeveniment) {
  if (!esdeveniment) return momentDElement(item);
  return dataDeDocument(fontsDeLActe(esdeveniment))?.instant.getTime() ?? null;
}

/**
 * T51 · De més nova a més vella per `moment`. Cap data inventada: un element
 * sense cap data real va al final, en l'ordre en què ha arribat (sort és
 * estable des d'ES2019).
 */
export function perMomentDescendent(a, b) {
  if (a.moment === b.moment) return 0;
  if (a.moment === null) return 1;
  if (b.moment === null) return -1;
  return b.moment - a.moment;
}
