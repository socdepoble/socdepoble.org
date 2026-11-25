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
import { useRef, useState } from 'react';
import { Link, useLocation } from '../../app/contexts/RouterContext';
import { Accions, Alerta, Boto, Carregant, EstatBuit } from '../../components/PedraSeca/index.js';
import { ClosaAplicacio, useApp } from '../plataforma/index.js';
import { ProveidorGenealogia, useGenealogia } from './nucli/index.js';
import { RUTES_GENEALOGIA } from './rutesGenealogia.js';
import { VERSIO_AVIS, t, textError } from './i18nGenealogia.js';
import { PortaFrase } from './vistes/comunes.jsx';

const TEXTOS_BANDA_AVIS_GEN = Object.freeze({
  ca: Object.freeze({ titol: 'Arbre familiar privat en este dispositiu', resum: 'Les dades familiars no ixen del teu dispositiu ni es publiquen soles. Accepta l’avís en 1 clic per activar la càrrega privada.', lligMes: 'Llig l’avís complet' }),
  es: Object.freeze({ titol: 'Árbol familiar privado en este dispositivo', resum: 'Los datos familiares no salen de tu dispositivo ni se publican solos. Acepta el aviso en 1 clic para activar la carga privada.', lligMes: 'Leer el aviso completo' }),
  en: Object.freeze({ titol: 'Private family tree on this device', resum: 'Family records never leave your device and are never published automatically. Accept in 1 click to enable private loading.', lligMes: 'Read full notice' }),
  eu: Object.freeze({ titol: 'Gailu honetako zuhaitz genealogiko pribatua', resum: 'Familiako datuak ez dira gailutik ateratzen eta ez dira bakarrik argitaratzen. Onartu klik batean.', lligMes: 'Irakurri ohar osoa' }),
  gl: Object.freeze({ titol: 'Árbore familiar privada neste dispositivo', resum: 'Os datos familiares non saen do teu dispositivo nin se publican sós. Acepta o aviso nun clic.', lligMes: 'Ler o aviso completo' })
});

/* Onada R32.11 · Els separadors de la closca i la porta d'avís seguixen l'idioma actiu (ca, es, en, eu, gl). */
function titolsGenealogia(idioma = 'ca') {
  return Object.freeze({ esquerra: t(idioma, 'col.esquerra'), mig: t(idioma, 'app.titol') });
}

function PortaAvis({ children }) {
  const genealogia = useGenealogia();
  const { ruta, idioma = 'ca' } = useApp();
  const { pathname } = useLocation();
  const acceptantRef = useRef(false);
  const [acceptant, setAcceptant] = useState(false);
  const [errorAvis, setErrorAvis] = useState(null);
  if (!genealogia.carregat) {
    return genealogia.error
      ? <EstatBuit titol={t(idioma, 'error.lectura')}>{textError(genealogia.error, idioma)}</EstatBuit>
      : <Carregant etiqueta={t(idioma, 'carregant')} />;
  }
  if (genealogia.bloquejat) return <PortaFrase idioma={idioma} />;
  const codi = String(idioma || 'ca').toLowerCase().slice(0, 2);
  const tb = Object.hasOwn(TEXTOS_BANDA_AVIS_GEN, codi) ? TEXTOS_BANDA_AVIS_GEN[codi] : TEXTOS_BANDA_AVIS_GEN.ca;
  const accepta = () => {
    if (acceptantRef.current) return;
    acceptantRef.current = true;
    setAcceptant(true);
    setErrorAvis(null);
    Promise.resolve()
      .then(() => genealogia.acceptaAvis())
      .catch((err) => setErrorAvis(textError(err, idioma)))
      .finally(() => {
        acceptantRef.current = false;
        setAcceptant(false);
      });
  };
  /* v1.2.25 (IDEA-348 + FN0-003 · Lot G2/G9) · Banda d'avís d'1 clic integrada sense expulsar la persona de la vista. */
  if (!genealogia.avisAcceptat && pathname !== ruta('avis')) {
    return (
      <>
        <Alerta
          to={errorAvis ? 'error' : 'info'}
          viva={Boolean(errorAvis)}
          titol={tb.titol}
          accions={(
            <Accions>
              <Boto varietat="primari" disabled={acceptant} carregant={acceptant} onClick={accepta}>{t(idioma, 'boto.entesos')}</Boto>
              <Link className="sdp-boto sdp-boto--secundari" to={ruta('avis')}>{tb.lligMes}</Link>
            </Accions>
          )}
        >
          {errorAvis || tb.resum}
        </Alerta>
        {children}
      </>
    );
  }
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
