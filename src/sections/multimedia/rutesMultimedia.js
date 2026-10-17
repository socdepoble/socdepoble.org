/**
 * rutesMultimedia.js — on porta una ruta vella de l'Arxiu visual.
 *
 * Onada 0.3 (Gauntlet 261016; pla 261016_1530: «Eliminar la duplicitat de
 * pàgines com /multimedia/town-benifallim: és un vestigi trencat. Qualsevol
 * referència o enllaç a un poble ha de redirigir a la seua pàgina canònica
 * /pobles/[slug]» i «prohibit saltar a cap pàgina externa ni a rutes
 * estranyes») · /multimedia/:id ja no és cap pàgina pròpia (la UniversalPage
 * de detall de sempre): la ruta continua viva (la nomenen els fils de xat de
 * pàgina, el servidor i els enllaços copiats) i porta, amb `replace`,
 *   · /multimedia/town-<slug>  → /pobles/<slug>, la pàgina canònica del poble;
 *   · /multimedia/<id>         → /multimedia?foto=<id>, l'Arxiu amb el visor
 *     obert en eixa foto (MultimediaSection).
 * La consulta es conserva, com RedireccioXat (App.jsx). useParams ja
 * descodifica l'id: el slug es torna a codificar. Pura i sense imports.
 *
 * Gauntlet 261017 (M07, C07) · També el fragment: '#galeria' es perdia en
 * redirigir. Només n'hi ha al router del navegador (useLocation().hash); en
 * memòria val ''. I el prefix, en qualsevol caixa: 'Town-Benifallim' (un
 * enllaç reescrit a mà o per un teclat) ja no obri el visor d'una foto que no
 * existix. L'id d'un poble és un slug en minúscules (SLUG_DE_POBLE de
 * nomsDelPoble.js): amb un prefix en una altra caixa s'hi torna; amb el
 * canònic 'town-' (el que escriu l'app, mediaContent.js), l'id tal qual, el
 * mateix que resolveItemPath (config/navigation.js).
 */

const PREFIX_POBLE = 'town-';
const RE_PREFIX_POBLE = /^town-/i;

/** El fragment que es conserva: '#' i almenys un caràcter; si no, ''. */
const fragmentDe = (hash) => (typeof hash === 'string' && hash.length > 1 && hash.startsWith('#') ? hash : '');

/** La ruta on porta /multimedia/:itemId (amb la consulta `search` i el fragment `hash`), o null. */
export function destiDeMultimedia(itemId, search = '', hash = '') {
  const id = itemId == null ? '' : String(itemId);
  if (id === '') return null;
  const consulta = new URLSearchParams(typeof search === 'string' ? search : '');
  const fragment = fragmentDe(hash);
  if (RE_PREFIX_POBLE.test(id) && id.length > PREFIX_POBLE.length) {
    const resta = id.slice(PREFIX_POBLE.length);
    const slug = id.startsWith(PREFIX_POBLE) ? resta : resta.toLowerCase();
    const cerca = consulta.toString();
    const desti = `/pobles/${encodeURIComponent(slug)}`;
    return `${cerca ? `${desti}?${cerca}` : desti}${fragment}`;
  }
  consulta.set('foto', id);
  return `/multimedia?${consulta.toString()}${fragment}`;
}
