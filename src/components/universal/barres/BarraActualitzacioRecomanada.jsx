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
 *   · En web, PWA o quan l'app ja està al dia, retorna `null` (zero node al DOM).
 */
import { ArrowUpRight, RefreshCw, X } from 'lucide-react';
import { useUIActionsOpcional } from '../../../app/contexts/UIContext';
import {
  descartaActualitzacioRecomanada,
  obriBotigaActualitzacio,
  useActualitzacioRecomanada
} from '../../../config/actualitzacioRecomanada.js';

function traductorSegur(tProp, tContext) {
  if (typeof tProp === 'function') return tProp;
  if (typeof tContext === 'function') return tContext;
  return (_clau, reserva) => reserva;
}

export default function BarraActualitzacioRecomanada({
  mostra = undefined,
  onActualitza = null,
  onDescarta = null,
  t: tProp = null
}) {
  const ui = useUIActionsOpcional();
  const delRegistre = useActualitzacioRecomanada();
  const avis = mostra === undefined ? delRegistre : mostra;
  const t = traductorSegur(tProp, ui?.t);

  if (!avis) return null;

  const esIos = avis.plataforma === 'ios';
  const etiquetaRegio = t('natiu.actualitzacioRecomanada.regio', 'Actualització disponible de l’aplicació');
  const titol = t('natiu.actualitzacioRecomanada.titol', 'Hi ha una nova versió disponible de Sóc de Poble.');
  const detall = esIos
    ? t(
      'natiu.actualitzacioRecomanada.detallIos',
      'Pots continuar usant l’aplicació ara i actualitzar-la des de l’App Store quan et vinga bé.'
    )
    : t(
      'natiu.actualitzacioRecomanada.detallAndroid',
      'Pots continuar usant l’aplicació ara i actualitzar-la des de Google Play quan et vinga bé.'
    );
  const etiquetaBoto = esIos
    ? t('natiu.actualitzacioRecomanada.accioIos', 'Actualitza a l’App Store')
    : t('natiu.actualitzacioRecomanada.accioAndroid', 'Actualitza a Google Play');
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
    >
      <div className="sdp-barra-actualitzacio__missatge">
        <span className="sdp-barra-actualitzacio__icona" aria-hidden="true">
          <RefreshCw size={18} focusable="false" />
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
        >
          <span>{etiquetaBoto}</span>
          <ArrowUpRight size={16} aria-hidden="true" focusable="false" />
        </button>
        <button
          type="button"
          className="sdp-boto sdp-boto--secundari sdp-barra-actualitzacio__tanca"
          onClick={clicaDescarta}
          aria-label={`${etiquetaMesTard} · ${etiquetaTanca}`}
        >
          <X size={16} aria-hidden="true" focusable="false" />
          <span>{etiquetaMesTard}</span>
        </button>
      </div>
    </section>
  );
}
