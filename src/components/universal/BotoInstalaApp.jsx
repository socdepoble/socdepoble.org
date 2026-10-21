/**
 * BotoInstalaApp.jsx · Ordre del Mestre (261021, prompt 261021_0015, tasca 3)
 * · «Instal·la al teu ordinador»: la pastilla de la barra negra que instal·la
 * Sóc de Poble com una aplicació en finestra pròpia (Mac, Windows i Linux).
 *
 * Autònom, com BotoCrom (PanellCrom.jsx): és fill de la TopBar (App.jsx), dins
 * de .right-icons, i no pinta res si no hi ha oferta. L'oferta la captura
 * src/main.jsx (src/pwa/instalacio.js) i només arriba a Chromium d'escriptori,
 * fora d'iframe, fora de l'app nativa i quan l'app encara no és instal·lada.
 * La guarda d'esAmaDelDocument és defensa en profunditat: dins d'un amfitrió
 * (WordPress, Sollutia) la instal·lació és de la seua pàgina, no nostra.
 *
 * El nom accessible és el text visible (WCAG 2.5.3); l'explicació llarga va
 * només al title. En compacte el rètol s'amaga i queda la icona
 * (utilities.css). Sense la classe `icon`: forçaria una cel·la de 48×48.
 */
import { MonitorDown } from 'lucide-react';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import { esAmaDelDocument } from '../../apps/plataforma/interruptors.js';
import { useInstalacioApp } from '../../hooks/useInstalacioApp.js';

export function BotoInstalaApp() {
  const { t } = useUIActions();
  const { externalConfig } = useUIState();
  const { pot, instala } = useInstalacioApp();

  if (!pot || !esAmaDelDocument(externalConfig)) return null;

  const rotul = t('nav.instalaApp', 'Instal·la al teu ordinador');
  return (
    <button
      type="button"
      className="sdp-top-bar-btn sdp-top-bar-btn--instal"
      onClick={instala}
      aria-label={rotul}
      title={t('nav.instalaAppTitol', 'Instal·la Sóc de Poble al teu ordinador com a aplicació, en una finestra pròpia')}
    >
      <MonitorDown aria-hidden="true" focusable="false" />
      <span className="sdp-top-bar-btn__rotul">{rotul}</span>
    </button>
  );
}
