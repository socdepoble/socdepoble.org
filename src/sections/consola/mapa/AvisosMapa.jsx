/* Ordre del Mestre, 261004 (prompt 261004_0515, §6: cap anomalia del cervell
   sense mostrar) · Un avís del Mapa dit per a persones, a Avisos i salut i a
   l'Inventari: la frase de TEXTOS_AVIS (la mateixa que l'Explorador i
   l'alerta del tauler) i TOTES les evidències que el compilador ha acumulat
   (construeixMapa.js), en tipografia de màquina: <Mono> les amaga amb el mode
   privacitat. Un codi sense frase es diu pel seu nom, mai s'amaga. */
import { Insignia } from '../../../components/PedraSeca';
import { Mono } from '../peces.jsx';
import { TEXTOS_AVIS, TO_SEVERITAT } from './grafMapa.js';
import { evidenciesDe } from './mapaContent.js';

/* Neteja 261007 (prompt 261007_1628, peça D) · El to de la severitat és el de
   grafMapa.js (TO_SEVERITAT), la seua única font: este mòdul en tenia una
   còpia idèntica i l'exportava a MapaConsola.jsx i XifresMas.jsx, que ara el
   prenen d'allà. */

/** La frase d'un codi d'avís, o «Avís <codi>.» si encara no en té. */
export const fraseAvis = (codi) => TEXTOS_AVIS[codi] ?? `Avís ${codi}.`;

/** «codi: frase» per a les taules; sense frase, el codi sol. */
export const codiIFrase = (codi) => (TEXTOS_AVIS[codi] ? `${codi}: ${TEXTOS_AVIS[codi]}` : codi);

/** Les evidències d'un avís: cap («—»), una sola o la llista sencera. */
export function EvidenciesAvis({ avis }) {
  const llista = evidenciesDe(avis);
  if (!llista.length) return '—';
  if (llista.length === 1) return <Mono>{llista[0]}</Mono>;
  return (
    <ul className="sdp-consola__evidencies" aria-label={`${llista.length} evidències`}>
      {llista.map((e, i) => <li key={`${i}-${e}`}><Mono>{e}</Mono></li>)}
    </ul>
  );
}

/** Un avís d'una skill a l'Inventari: el codi amb el color de la severitat, la frase i les evidències. */
export function AvisDeSkill({ avis }) {
  return (
    <div className="sdp-consola__avis">
      <Insignia to={TO_SEVERITAT[avis.severitat]}>{avis.codi}</Insignia>
      <p>{fraseAvis(avis.codi)}</p>
      <EvidenciesAvis avis={avis} />
    </div>
  );
}
