/**
 * Plataforma d'Apps Enxufables · l'avís que escalfa la memòria cau de les apps.
 *
 * Ordre del Mestre (261007): una app de /app/* ja visitada ha d'arrencar sense
 * xarxa al lloc propi (_wiki_de_poble/02_saber/architecture/
 * ADR-2026-10-APPS-DEL-DISPOSITIU.md). El worker és de la pàgina i no del
 * component: esta peça no el nomena ni el toca mai. Quan RutaApps es munta,
 * avisa la pàgina amb un esdeveniment sense cap dada (ni quina app ni on, el
 * criteri de la telemetria) i només si l'app és l'ama del document
 * (esAmaDelDocument: el lloc propi, no un amfitrió ni un iframe).
 * Qui escolta és src/pwa/registre.js, que només existix a l'entrada pròpia
 * (src/main.jsx) i en producció: ell demana al worker que escalfe els
 * recursos ja carregats i la closca. Dins de WordPress o de Sollutia l'avís
 * ni tan sols es fa. La Gestoria no hi entra: la seua guarda veta el worker,
 * i esta crida és de la closca de les apps (RutaApps), no de cap app.
 * Revisió F1 (261007): el worker guarda una closca per app. RutaApps no es
 * torna a muntar quan es passa d'una app a una altra (o al portal) dins de
 * /app/*, i per això l'avís es repetix a cada canvi de ruta: la pàgina
 * llig ella mateixa on és; l'avís continua sense portar cap dada.
 */
import { useEffect } from 'react';
import { useLocation } from '../../app/contexts/RouterContext';
import { useUIState } from '../../app/contexts/UIContext';
import { esAmaDelDocument } from './interruptors.js';

/* El nom que escolta src/pwa/registre.js (src/pwa/registre.test.js comprova que és el mateix). */
export const ESDEVENIMENT_APP_VISITADA = 'sdp:app-visitada';

/**
 * Avisa la pàgina que s'ha obert una app. Torna si ho ha fet; no llança mai.
 * `finestra`: per a les proves (per defecte, la del document).
 */
export function anunciaAppVisitada(externalConfig, finestra = typeof window === 'undefined' ? undefined : window) {
  if (!esAmaDelDocument(externalConfig, finestra)) return false;
  try {
    finestra.dispatchEvent(new finestra.Event(ESDEVENIMENT_APP_VISITADA));
    return true;
  } catch {
    return false;
  }
}

/** Dins de RutaApps: un avís en muntar-se, un altre a cada canvi de ruta i
 *  un altre si canvia l'ama del document. */
export function useEscalfamentMemoriaCau() {
  const { externalConfig } = useUIState();
  const { pathname } = useLocation();
  const manageDocumentHead = externalConfig?.manageDocumentHead;
  useEffect(() => {
    anunciaAppVisitada({ manageDocumentHead });
  }, [manageDocumentHead, pathname]);
}
