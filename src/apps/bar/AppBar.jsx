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
 *
 * Onada R32.5 · Els separadors de la closca seguixen l'idioma actiu (ca, es, en, eu, gl).
 */
import { ClosaAplicacio, useApp } from '../plataforma/index.js';
import { ProveidorBar } from './estat/ProveidorBar.jsx';
import { RUTES_BAR, titolsBar } from './rutesBar.js';

export default function AppBar({ magatzem, rellotge, atzar }) {
  const { idioma = 'ca' } = useApp();
  return (
    <ProveidorBar magatzem={magatzem} rellotge={rellotge} atzar={atzar} idioma={idioma}>
      <ClosaAplicacio rutes={RUTES_BAR} titols={titolsBar(idioma)} />
    </ProveidorBar>
  );
}
