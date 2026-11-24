/**
 * BarraActualitzacioRecomanada.jsx — Bàner superior compacte, suau i no
 * bloquejant per a apps natives instal·lades (`org.socdepoble.app` a Android i
 * `id6826441844` a iOS) quan el servidor anuncia `versioRecomanada >
 * VERSIO_CLIENT_NATIU` mentre `VERSIO_CLIENT_NATIU >= versioMinima` (Onada R22 · T2).
 *
 *   · Viu en `components/universal/barres/` perquè `src/natiu/` és un pou estricte
 *     d'importació: ací no s'importa res de `src/natiu/`.
 *   · Pedra Seca WCAG AAA (≥ 7:1 en clar i fosc), zero ombres, vores netes i
 *     totes les àrees tàctils ≥ 48 px (`var(--sdp-touch)`), amb botons centrats.
 *   · Presentacional amb `mostra` (per al catàleg `/disseny` i proves aïllades)
 *     o connectat al registre reactiu `useActualitzacioRecomanada` dins d'`App.jsx`.
 *   · Sense avís (l'app o la web ja estan al dia), retorna `null` (zero node al DOM).
 *   · Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026) · Els canals de proves i la web:
 *     `canal` 'testflight' (iOS) obri TestFlight; 'web' (la PWA) carrega la versió nova. Els textos
 *     d'estos canals, a textosActualitzacio.js (cinc llengües, fora de l'arrencada).
 *   · v1.2.17 · T-04 · ZERO APK fora de botiga (ordre del Mestre 261121) · Retirada la branca del canal
 *     'apk' (el text de l'APK signat i la seua SHA-256 sencera): des de la v1.2.16 cap avís APK no entra
 *     al registre (normalitzaAvis), i el botó d'un avís amb el canal 'apk' no obri res
 *     (obriBotigaActualitzacio).
 */
import { ArrowUpRight, RefreshCw, X } from 'lucide-react';
import { useUIActionsOpcional } from '../../../app/contexts/UIContext';
import {
  CANALS_ACTUALITZACIO,
  descartaActualitzacioRecomanada,
  obriBotigaActualitzacio,
  useActualitzacioRecomanada
} from '../../../config/actualitzacioRecomanada.js';
import { textosActualitzacio } from './textosActualitzacio.js';

function traductorSegur(tProp, tContext) {
  if (typeof tProp === 'function') return tProp;
  if (typeof tContext === 'function') return tContext;
  return (_clau, reserva) => reserva;
}

export default function BarraActualitzacioRecomanada({
  mostra = undefined,
  onActualitza = null,
  onDescarta = null,
  t: tProp = null,
  llengua = null
}) {
  const ui = useUIActionsOpcional();
  const delRegistre = useActualitzacioRecomanada();
  const avis = mostra === undefined ? delRegistre : mostra;
  const t = traductorSegur(tProp, ui?.t);

  if (!avis) return null;

  const esIos = avis.plataforma === 'ios';
  const canal = avis.canal ?? null;
  const textos = textosActualitzacio(llengua ?? ui?.language);
  const etiquetaRegio = t('natiu.actualitzacioRecomanada.regio', 'Actualització disponible de l’aplicació');
  const titol = t('natiu.actualitzacioRecomanada.titol', 'Hi ha una nova versió disponible de Sóc de Poble.');
  let detall;
  let etiquetaBoto;
  if (canal === CANALS_ACTUALITZACIO.TESTFLIGHT) {
    detall = textos.detallTestflight;
    etiquetaBoto = textos.accioTestflight;
  } else if (canal === CANALS_ACTUALITZACIO.WEB) {
    detall = textos.detallWeb.replace('{versio}', String(avis.versio ?? ''));
    etiquetaBoto = textos.accioWeb;
  } else if (esIos) {
    detall = t(
      'natiu.actualitzacioRecomanada.detallIos',
      'Pots continuar usant l’aplicació ara i actualitzar-la des de l’App Store quan et vinga bé.'
    );
    etiquetaBoto = t('natiu.actualitzacioRecomanada.accioIos', 'Actualitza a l’App Store');
  } else {
    detall = t(
      'natiu.actualitzacioRecomanada.detallAndroid',
      'Pots continuar usant l’aplicació ara i actualitzar-la des de Google Play quan et vinga bé.'
    );
    etiquetaBoto = t('natiu.actualitzacioRecomanada.accioAndroid', 'Actualitza a Google Play');
  }
  const etiquetaMesTard = t('natiu.actualitzacioRecomanada.mesTard', 'Més tard');
  /* Auditoria del kit de Gemini R22 · WCAG 2.5.3: el nom accessible comença
     pel text visible («Més tard») i després diu què amaga. */
  const etiquetaTanca = t('natiu.actualitzacioRecomanada.tanca', 'Amaga l’avís d’actualització per a esta versió');

  const clicaActualitza = () => {
    if (typeof onActualitza === 'function') {
      onActualitza(avis);
      return;
    }
    obriBotigaActualitzacio(avis);
  };

  const clicaDescarta = () => {
    if (typeof onDescarta === 'function') {
      onDescarta(avis.versioRecomanada);
      return;
    }
    descartaActualitzacioRecomanada(avis.versioRecomanada);
  };

  return (
    <section
      className="sdp-barra-actualitzacio"
      role="region"
      aria-label={etiquetaRegio}
      data-plataforma={avis.plataforma}
      {...(canal ? { 'data-canal': canal } : null)}
    >
      <div className="sdp-barra-actualitzacio__missatge">
        <span className="sdp-barra-actualitzacio__icona" aria-hidden="true">
          <RefreshCw size={18} aria-hidden="true" focusable="false" />
        </span>
        <p className="sdp-barra-actualitzacio__text">
          <strong className="sdp-barra-actualitzacio__titol">{titol}</strong>
          {' '}
          <span className="sdp-barra-actualitzacio__detall">{detall}</span>
        </p>
      </div>
      <div className="sdp-barra-actualitzacio__accions">
        <button
          type="button"
          className="sdp-boto sdp-boto--primari sdp-barra-actualitzacio__cta"
          onClick={clicaActualitza}
          title={etiquetaBoto}
        >
          <span>{etiquetaBoto}</span>
          <ArrowUpRight size={16} aria-hidden="true" focusable="false" />
        </button>
        <button
          type="button"
          className="sdp-boto sdp-boto--secundari sdp-barra-actualitzacio__tanca"
          onClick={clicaDescarta}
          aria-label={`${etiquetaMesTard} · ${etiquetaTanca}`}
          title={`${etiquetaMesTard} · ${etiquetaTanca}`}
        >
          <X size={16} aria-hidden="true" focusable="false" />
          <span>{etiquetaMesTard}</span>
        </button>
      </div>
    </section>
  );
}
