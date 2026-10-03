/**
 * El Bar · el TPV d'hostaleria com a app enxufable (/app/bar, lot BAR · T4).
 *
 * Export per defecte: RutaApps el carrega amb lazy() dins de
 * <Route path="bar/*">. La closca és ClosaAplicacio (l'esquelet comú de la
 * plataforma) amb la taula de rutesBar.js; les columnes de catàleg i de
 * comanda són les de l'ESQUELET COMÚ (src/apps/comu/esquelet), les mateixes
 * que La Compra (ordre del Mestre, 261002: sinergies T4/T8).
 *
 * Les dades viuen en este dispositiu (IndexedDB) i no se sincronitzen. No és
 * cap sistema de facturació: la nota diu «Nota de consum · no és factura».
 * `magatzem`, `rellotge` i `atzar` només els passen les proves.
 */
import { ClosaAplicacio } from '../plataforma/index.js';
import { ProveidorBar } from './estat/ProveidorBar.jsx';
import { RUTES_BAR, TITOLS_BAR } from './rutesBar.js';

export default function AppBar({ magatzem, rellotge, atzar }) {
  return (
    <ProveidorBar magatzem={magatzem} rellotge={rellotge} atzar={atzar}>
      <ClosaAplicacio rutes={RUTES_BAR} titols={TITOLS_BAR} />
    </ProveidorBar>
  );
}
