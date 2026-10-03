/**
 * Salut · Cuidant dels Nostres (lot SALUT, T5): l'app.
 *
 * RutaApps la carrega amb lazy() i la munta dins de <Route path="salut/*">
 * només si la plataforma diu que es pot obrir: entre altres coses, que l'App
 * siga l'ama del document (dadesPersonals 'salut' al manifest). Dins:
 *   1. ProveidorSalut  llig el magatzem local d'este dispositiu;
 *   2. PortaAvis       fins que no s'accepta l'avís, només es pot llegir l'avís;
 *   3. ClosaAplicacio  l'esquelet comú de tres columnes, amb rutesSalut.js.
 * Cap backend, cap xarxa, cap telemetria pròpia, cap traducció de pàgina,
 * cap Pàgina Universal: les dades de salut no ixen d'este dispositiu.
 *
 * Les props només són per a proves (el magatzem, el rellotge, els ids i
 * l'ofset de les hores estimades); en producció no se'n passa cap.
 */
import { Navigate, useLocation } from '../../app/contexts/RouterContext';
import { Carregant, EstatBuit } from '../../components/PedraSeca/index.js';
import { ClosaAplicacio, useApp } from '../plataforma/index.js';
import { RUTES_SALUT } from './rutesSalut.js';
import { textError } from './textos.js';
import { ProveidorSalut, useSalut } from './useSalut.jsx';

const TITOLS = Object.freeze({ esquerra: 'Este dispositiu', mig: 'Salut' });

function PortaAvis({ children }) {
  const salut = useSalut();
  const { ruta } = useApp();
  const { pathname } = useLocation();
  if (!salut.carregat) {
    return salut.error
      ? <EstatBuit titol="No s’han pogut llegir les dades">{textError(salut.error)}</EstatBuit>
      : <Carregant etiqueta="Obrint el quadern…" />;
  }
  if (!salut.avisAcceptat && pathname !== ruta('avis')) return <Navigate to={ruta('avis')} replace />;
  return children;
}

export default function AppSalut({ magatzem, rellotge, nouId, ofsetDe }) {
  return (
    <ProveidorSalut magatzem={magatzem} rellotge={rellotge} nouId={nouId} ofsetDe={ofsetDe}>
      <PortaAvis>
        <ClosaAplicacio rutes={RUTES_SALUT} titols={TITOLS} />
      </PortaAvis>
    </ProveidorSalut>
  );
}
