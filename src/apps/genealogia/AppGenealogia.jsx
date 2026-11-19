/**
 * Arbre Genealògic (P0-114, ordre del Mestre 261111): l'app.
 *
 * RutaApps la carrega amb lazy() i la munta dins de <Route path="genealogia/*">
 * només si la plataforma diu que es pot obrir: entre altres coses, que l'App
 * siga l'ama del document (dadesPersonals 'salut' al manifest). Dins:
 *   1. ProveidorGenealogia  llig el magatzem local d'este dispositiu (IndexedDB «sdp-genealogia»);
 *   2. PortaAvis            amb la base xifrada i tancada, només la frase de pas (P1-81);
 *                           fins que no s'accepta l'avís, només es pot llegir l'avís;
 *   3. ClosaAplicacio       l'esquelet comú de tres columnes, amb rutesGenealogia.js.
 * Cap backend, cap xarxa, cap telemetria pròpia: l'arbre no ix d'este
 * dispositiu, i l'app no cerca als arxius ni envia res a cap IA.
 *
 * Les props només són per a proves (el magatzem, el rellotge i els ids); en
 * producció no se'n passa cap.
 */
import { Navigate, useLocation } from '../../app/contexts/RouterContext';
import { Carregant, EstatBuit } from '../../components/PedraSeca/index.js';
import { ClosaAplicacio, useApp } from '../plataforma/index.js';
import { ProveidorGenealogia, useGenealogia } from './nucli/index.js';
import { RUTES_GENEALOGIA } from './rutesGenealogia.js';
import { VERSIO_AVIS, t, textError } from './textos.js';
import { PortaFrase } from './vistes/comunes.jsx';

/* Onada R32.11 · Els separadors de la closca i la porta d'avís seguixen l'idioma actiu (ca, es, en, eu, gl). */
function titolsGenealogia(idioma = 'ca') {
  return Object.freeze({ esquerra: t(idioma, 'col.esquerra'), mig: t(idioma, 'app.titol') });
}

function PortaAvis({ children }) {
  const genealogia = useGenealogia();
  const { ruta, idioma = 'ca' } = useApp();
  const { pathname } = useLocation();
  if (!genealogia.carregat) {
    return genealogia.error
      ? <EstatBuit titol={t(idioma, 'error.lectura')}>{textError(genealogia.error, idioma)}</EstatBuit>
      : <Carregant etiqueta={t(idioma, 'carregant')} />;
  }
  if (genealogia.bloquejat) return <PortaFrase idioma={idioma} />;
  if (!genealogia.avisAcceptat && pathname !== ruta('avis')) return <Navigate to={ruta('avis')} replace />;
  return children;
}

export default function AppGenealogia({ magatzem, rellotge, nouId }) {
  const { idioma = 'ca' } = useApp();
  return (
    <ProveidorGenealogia magatzem={magatzem} rellotge={rellotge} nouId={nouId} versioAvis={VERSIO_AVIS}>
      <PortaAvis>
        <ClosaAplicacio rutes={RUTES_GENEALOGIA} titols={titolsGenealogia(idioma)} />
      </PortaAvis>
    </ProveidorGenealogia>
  );
}
