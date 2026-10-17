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
 */

const PREFIX_POBLE = 'town-';

/** La ruta on porta /multimedia/:itemId (amb la consulta `search`), o null. */
export function destiDeMultimedia(itemId, search = '') {
  const id = itemId == null ? '' : String(itemId);
  if (id === '') return null;
  const consulta = new URLSearchParams(typeof search === 'string' ? search : '');
  if (id.startsWith(PREFIX_POBLE) && id.length > PREFIX_POBLE.length) {
    const resta = consulta.toString();
    const desti = `/pobles/${encodeURIComponent(id.slice(PREFIX_POBLE.length))}`;
    return resta ? `${desti}?${resta}` : desti;
  }
  consulta.set('foto', id);
  return `/multimedia?${consulta.toString()}`;
}
