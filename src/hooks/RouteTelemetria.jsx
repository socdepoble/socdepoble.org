import { useEffect } from 'react';
import { useLocation } from '../app/contexts/RouterContext';
import { useUIState } from '../app/contexts/UIContext';
import { declaraEncastada, registraVisita } from '../data/telemetria.js';

/*
 * Compta una visita per canvi de ruta (telemetria poca-solta, ../data/telemetria.js).
 * Germà de RouteSEO: es munta una vegada a AppDataLoader i no pinta res.
 *
 * Criteri d'incrustació, el mateix que useSEO: només compta quan Sóc de Poble
 * és l'ama del document. Encastada al WordPress (embed.jsx posa
 * manageDocumentHead: false), dins d'un iframe o amb window.__SDP_EMBEDDED__,
 * la pàgina és d'un altre: mana la seua política de privacitat i, si compta,
 * ho fa amb el seu window.umami, a qui telemetria.js ja passa els
 * esdeveniments. Posar-li un comptador propi que no ha demanat no és de poble.
 * La configuració de l'amfitrió només la veu React; per això ací es declara al
 * contracte (declaraEncastada), que així tampoc envia els esdeveniments.
 *
 * La ruta es passa crua: el contracte decidix si és repetida abans de tapar-la
 * (/notes/n1 i /notes/n2 són dues visites) i envia només /notes/*.
 */
function esAmaDelDocument(externalConfig) {
  if (typeof window === 'undefined') return false;
  if (externalConfig?.manageDocumentHead === false || window.__SDP_EMBEDDED__) return false;
  return window.self === window.top;
}

export function RouteTelemetria() {
  const { pathname } = useLocation();
  const { externalConfig } = useUIState();
  const propia = esAmaDelDocument(externalConfig);

  useEffect(() => {
    // Mai trenca la navegació: telemetria.js ja no llança, però la ruta és sagrada.
    try {
      declaraEncastada(!propia);
      if (propia) registraVisita(pathname);
    } catch { /* sense comptar, la ruta continua */ }
  }, [pathname, propia]);

  return null;
}
