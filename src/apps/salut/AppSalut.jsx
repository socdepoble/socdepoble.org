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
import { useRef, useState } from 'react';
import { Link, useLocation } from '../../app/contexts/RouterContext';
import { Accions, Alerta, Boto, Carregant, EstatBuit } from '../../components/PedraSeca/index.js';
import { ClosaAplicacio, useApp } from '../plataforma/index.js';
import { textErrorSalut, textosSalut } from './i18nSalut.js';
import { RUTES_SALUT } from './rutesSalut.js';
import { ProveidorSalut, useSalut } from './useSalut.jsx';

const TEXTOS_BANDA_AVIS_SALUT = Object.freeze({
  ca: Object.freeze({ titol: 'Quadern privat en este dispositiu', resum: 'No és un producte sanitari ni substituïx l’atenció mèdica. Les dades no ixen del teu dispositiu.', lligMes: 'Llig l’avís complet' }),
  es: Object.freeze({ titol: 'Cuaderno privado en este dispositivo', resum: 'No es un producto sanitario ni sustituye la atención médica. Los datos no salen de tu dispositivo.', lligMes: 'Leer el aviso completo' }),
  en: Object.freeze({ titol: 'Private log on this device', resum: 'Not a medical device and does not replace medical care. Your records never leave this device.', lligMes: 'Read full notice' }),
  eu: Object.freeze({ titol: 'Gailu honetako koaderno pribatua', resum: 'Ez da osasun-produktu bat eta ez du mediku-arreta ordezkatzen. Datuak ez dira gailutik ateratzen.', lligMes: 'Irakurri ohar osoa' }),
  gl: Object.freeze({ titol: 'Caderno privado neste dispositivo', resum: 'Non é un produto sanitario nin substitúe a atención médica. Os datos non saen do teu dispositivo.', lligMes: 'Ler o aviso completo' })
});

function useIdiomaSalutSegur() {
  try {
    return useApp()?.idioma || 'ca';
  } catch {
    return 'ca';
  }
}

function PortaAvis({ children }) {
  const salut = useSalut();
  const { ruta, idioma = 'ca' } = useApp();
  const tx = textosSalut(idioma);
  const { pathname } = useLocation();
  const acceptantRef = useRef(false);
  const [acceptant, setAcceptant] = useState(false);
  const [errorAvis, setErrorAvis] = useState(null);
  if (!salut.carregat) {
    return salut.error
      ? <EstatBuit titol={tx.errorLlegirDades}>{textErrorSalut(salut.error, idioma)}</EstatBuit>
      : <Carregant etiqueta={tx.obrintQuadern} />;
  }
  const codi = String(idioma || 'ca').toLowerCase().slice(0, 2);
  const tb = Object.hasOwn(TEXTOS_BANDA_AVIS_SALUT, codi) ? TEXTOS_BANDA_AVIS_SALUT[codi] : TEXTOS_BANDA_AVIS_SALUT.ca;
  const accepta = () => {
    if (acceptantRef.current) return;
    acceptantRef.current = true;
    setAcceptant(true);
    setErrorAvis(null);
    Promise.resolve()
      .then(() => salut.acceptaAvis())
      .catch((err) => setErrorAvis(textErrorSalut(err, idioma)))
      .finally(() => {
        acceptantRef.current = false;
        setAcceptant(false);
      });
  };
  /* v1.2.25 (IDEA-348 + FN0-003 · Lot G2/G9) · Sense redirecció bloquejant: la persona entra i opera a l'acte
     i accepta l'avís de privacitat d'1 sol clic a la banda superior integrada (conservant /avis complet). */
  if (!salut.avisAcceptat && pathname !== ruta('avis')) {
    return (
      <>
        <Alerta
          to={errorAvis ? 'error' : 'info'}
          viva={Boolean(errorAvis)}
          titol={tb.titol}
          accions={(
            <Accions>
              <Boto varietat="primari" disabled={acceptant} carregant={acceptant} onClick={accepta}>{tx.hoHeEntes || 'Ho he entés'}</Boto>
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

export default function AppSalut({ magatzem, rellotge, nouId, ofsetDe }) {
  const tx = textosSalut(useIdiomaSalutSegur());
  return (
    <ProveidorSalut magatzem={magatzem} rellotge={rellotge} nouId={nouId} ofsetDe={ofsetDe}>
      <PortaAvis>
        <ClosaAplicacio rutes={RUTES_SALUT} titols={tx.titolsClosca} />
      </PortaAvis>
    </ProveidorSalut>
  );
}
