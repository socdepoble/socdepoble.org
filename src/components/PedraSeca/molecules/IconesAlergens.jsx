/**
 * IconesAlergens.jsx — les xicotetes icones dels al·lèrgens d'un producte
 * (ordre del Mestre, 261006: «deixa previst en el component de la targeta de
 * producte l'espai i el codi per a renderitzar aquestes xicotetes icones
 * d'al·lèrgens de forma visual. Això és vital per a la Carta Digital i el
 * TPV»). Els dibuixos són els del Mestre: recursos/alergens.js en diu la
 * procedència i com viatgen sense xarxa. Estils a src/css/modules.css, bloc
 * alergens.
 *
 * CONTRACTE
 *   alergens  string[] · ids de la llista canònica (ALERGENS de
 *             utils/productes/producteUniversal.js). Els desconeguts i els
 *             repetits no es pinten, i l'ordre és el de l'annex II. Sense cap
 *             id conegut, la peça no pinta res (cap node).
 *   mida      'xicoteta' (1.25rem, per defecte) | 'mitjana' (2rem).
 *   maxim     enter ≥ 1, opcional · com a molt tantes peces, «+N» inclòs: si
 *             els al·lèrgens hi caben, totes les icones; si no, maxim − 1
 *             icones i una pastilla «+N» amb la resta (amb maxim 4: fins a 4
 *             icones, o 3 i «+N»). Així la peça no passa mai de maxim
 *             elements, i qui la posa sap quant d'espai ocupa.
 *   etiqueta  string, opcional · el començament del nom accessible
 *             («Al·lèrgens» per defecte → «Al·lèrgens: gluten, llet»). El nom
 *             diu SEMPRE tots els al·lèrgens, també els de dins del «+N».
 *
 * ACCESSIBILITAT. Un sol element amb role="img" i el nom; les icones són
 * decoratives (alt="") i els fills d'un role="img" no es lligen. No són
 * controls: cap botó i cap mida tàctil. Qui ja diu els al·lèrgens en un altre
 * nom (la rajola del TPV: «…, conté llet») la pot amagar amb aria-hidden en
 * un contenidor seu.
 *
 * SENSE XARXA. Cada icona és una URI data: que viatja dins del paquet: cap
 * petició. Un id sense icona, o una icona que no es pot pintar (onError),
 * mostra la seua abreviatura en una pastilla: mai una imatge trencada.
 *
 * ON VA
 *   · Al TPV, a la rajola (UniversalTPV, `alergens` de l'article): xicoteta,
 *     a dalt a l'esquerra i amb maxim 4 (cap a la cantonada de la rajola més
 *     estreta sense arribar a la banda del nom).
 *   · A la targeta (UniversalCard), sense cap prop nova: `body` admet un node
 *     i la Carta Digital hi posa el text i, darrere, la peça:
 *       body={<><p>Feta cada matí.</p><IconesAlergens alergens={['gluten', 'ous']} mida="mitjana" /></>}
 *     El cos la centra com el text. L'espècimen (fonaments/icones-alergens)
 *     ho mostra.
 *
 * Importa per camí directe (mai per index.js): la porta de dependències
 * circulars de Pedra Seca ho exigix.
 */
import { useState } from 'react';
import { ABREVIATURES, ICONES_ALERGENS, alergensConeguts, textAlergens } from '../recursos/alergens.js';

const ETIQUETA = 'Al·lèrgens';

/* Una icona; sense la seua URI, o si no es pot pintar, l'abreviatura. */
function Icona({ id }) {
  const uri = ICONES_ALERGENS[id] || null;
  const [fallida, setFallida] = useState(null);
  if (uri && uri !== fallida) {
    return <img className="sdp-alergens__icona" src={uri} alt="" decoding="async" draggable="false" data-alergen={id} onError={() => setFallida(uri)} />;
  }
  return <span className="sdp-alergens__abreviatura" data-alergen={id}>{ABREVIATURES[id]}</span>;
}

export function IconesAlergens({ alergens, mida = 'xicoteta', maxim, etiqueta }) {
  const ids = alergensConeguts(alergens);
  if (!ids.length) return null;
  /* Les peces: totes les icones si hi caben; si no, una menys i el «+N». */
  const peces = Number.isInteger(maxim) && maxim >= 1 ? maxim : ids.length;
  const icones = ids.length > peces ? peces - 1 : ids.length;
  const resta = ids.length - icones;
  const inici = typeof etiqueta === 'string' && etiqueta.trim() !== '' ? etiqueta.trim() : ETIQUETA;
  return (
    <span className={mida === 'mitjana' ? 'sdp-alergens sdp-alergens--mitjana' : 'sdp-alergens'} role="img"
      aria-label={`${inici}: ${textAlergens(ids)}`}>
      {ids.slice(0, icones).map((id) => <Icona key={id} id={id} />)}
      {resta ? <span className="sdp-alergens__resta">{`+${resta}`}</span> : null}
    </span>
  );
}
