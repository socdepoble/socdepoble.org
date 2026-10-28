/**
 * DiagnosiConsola.jsx — el «Diagnòstic del Mas», al peu del tauler (/consola).
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front F) · «Al final de la
 * pàgina, davall de les targetes, incorporar un índex de navegació ràpida a
 * cada card [...] i un bloc de text continu (estil terminal / <pre> amb
 * tipografia monoespaiada i format net) que mostre el diagnòstic complet del
 * Mas d'un sol colp d'ull.»
 *
 * Darrere de l'Índex de la Consola (IndexConsola.jsx), que ja enllaça cada
 * pàgina i cada targeta en text pur: ací, una secció amb el seu H2, l'accés
 * ràpid (una fila compacta amb les nou pàgines, en l'ordre del tauler,
 * centrada davall del títol) i el <pre> amb el diagnòstic. Les dues dades
 * viuen a diagnosiConsola.js, sense React. Cap classe fora de sdp-consola__*:
 * la llista i els enllaços són els de base.css, i la fila i el bloc
 * monoespaiat, de modules.css (§ CONSOLA).
 * El <pre> porta UN SOL node de text: cap span per línia, cap capçalera a
 * dins (l'Índex de secció de la barra blava només en recull l'H2), i cap
 * consulta exacta de text del tauler hi col·lidix. Sense botó de copiar: el
 * text se selecciona com qualsevol altre. El mode privacitat del marc
 * (PrivacitatConsola) arriba al text: les rutes i les evidències hi diuen
 * MASCARA.
 *
 * Només al tauler de /consola (ConsolaSection.jsx): la Consola incrustada de
 * la Wiki (ConsolaIncrustada) no el pinta.
 * Pla 261027_0845 (Guarda Nocturna), §3 · Derogat: «conserva els seus
 * píxels». La Consola incrustada ja pinta el Govern (TaulerAmbGovern); el
 * Diagnòstic, l'Índex i les il·lustracions continuen només a /consola.
 */
import { useContext, useId } from 'react';
import { Link } from '../../app/contexts/RouterContext';
import { PrivacitatConsola } from './peces.jsx';
import { ETIQUETA_ACCES, TITOL_DIAGNOSI, accesRapid, diagnosiTextual } from './diagnosiConsola.js';

/**
 * `fonts` té la forma de fontsDe (ConsolaSection.jsx); `ara`, el rellotge del
 * tauler, perquè el text diga el mateix que les targetes.
 */
export function DiagnosiConsola({ fonts = {}, locale = 'ca-ES', ara }) {
  const id = useId();
  const privat = useContext(PrivacitatConsola);
  const text = diagnosiTextual(fonts, { ara, locale, privat });
  return (
    <section className="sdp-consola__diagnosi" aria-labelledby={id}>
      <h2 id={id}>{TITOL_DIAGNOSI}</h2>
      <nav className="sdp-consola__acces" aria-label={ETIQUETA_ACCES}>
        <ul>
          {accesRapid().map((p) => <li key={p.id}><Link to={p.ruta}>{p.titol}</Link></li>)}
        </ul>
      </nav>
      <pre className="sdp-consola__diagnosi-text">{text}</pre>
    </section>
  );
}
