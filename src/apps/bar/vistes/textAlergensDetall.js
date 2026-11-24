/**
 * El Bar · vistes/textAlergensDetall.js — el text d'al·lèrgens de la fitxa
 * del producte a la Caixa (P07-01, que absorbix P06-01).
 *
 * Fa servir la mateixa regla que la rajola del TPV (articlesDelTpv, a
 * vestits.js), que no es toca:
 *   · sense font (fontAlergens buida o en blanc) no hi ha cap declaració:
 *     ni ingredients ni traces, encara que la carta en porte una llista;
 *   · amb font, el que conté («Al·lèrgens: …») i el que pot contindre com a
 *     traça («Pot contindre (traça): …»), en l'ordre del Reglament;
 *   · si no estan informats els 14, «sense revisar»; si ho estan tots i cap
 *     no hi és, «cap dels 14».
 * Un buit mai diu «Sense al·lèrgens»: es llegiria com «no en porta» (T4).
 * La fitxa és més prudent que la rajola: diu «sense revisar» també per a un
 * producte sense cap anotació, on la rajola no diu res. És volgut.
 */
import { ALERGENS, ordenaAlergens } from '../../../utils/productes/producteUniversal.js';
import { nomAlergen } from '../i18nMercaderies.js';

/**
 * @param {object|null|undefined} producte  el producte de la carta (pot faltar)
 * @param {object} tx                       els textos de la UI del Bar (textosUiBar)
 * @param {string} [idioma]                 ca, es, en, eu o gl
 * @returns {string}
 */
export function textAlergensDetall(producte, tx, idioma = 'ca') {
  const ambFont = typeof producte?.fontAlergens === 'string' && Boolean(producte.fontAlergens.trim());
  const conte = ambFont ? ordenaAlergens(producte?.alergens) : [];
  const traces = ambFont ? ordenaAlergens(producte?.tracesAlergens) : [];
  const absents = ambFont ? ordenaAlergens(producte?.alergensAbsents) : [];
  const informats = new Set([...conte, ...traces, ...absents]);
  const noms = (ids) => ids.map((id) => nomAlergen(id, idioma)).join(', ');
  const complet = informats.size >= ALERGENS.length;
  return [
    conte.length ? tx.alergensManteBar(noms(conte)) : null,
    traces.length ? tx.tracesManteBar(noms(traces)) : null,
    complet ? (conte.length || traces.length ? null : tx.capAlergenManteBar) : tx.alergensSenseRevisarFitxa
  ].filter(Boolean).join(' ');
}
