/**
 * Plataforma d'Apps Enxufables · l'avís que substituïx un 404 mut.
 *
 * Un EstatBuit amb un enllaç d'eixida. El fan servir RutaApps (ruta no
 * segura, app desconeguda, apagada o entrada inexistent) i ClosaAplicacio
 * (cap ruta de la taula casa amb la URL): la persona sempre llig el mateix.
 */
import { useRef } from 'react';
import { Link } from '../../app/contexts/RouterContext';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssAppsPlataforma from '../../css/diferit-apps-plataforma.css?inline';
import { useUIState } from '../../app/contexts/UIContext';
import { EstatBuit } from '../../components/PedraSeca/atoms/estats.jsx';
import { textosPortalApps } from './textosPortalApps.js';

function useIdiomaAvis() {
  try {
    const ui = useUIState();
    return ui?.llenguaDelText || ui?.language || 'ca';
  } catch {
    return 'ca';
  }
}

export function AvisApp({ titol, children, desti = '/app', etiqueta }) {
  const arrelAppsRef = useRef(null);
  useFullDiferit(arrelAppsRef, 'apps-plataforma', cssAppsPlataforma);
  const tx = textosPortalApps(useIdiomaAvis());
  const etiquetaResolta = etiqueta ?? tx.tornaApps;
  return (
    <section ref={arrelAppsRef} className="sdp-app-avis">
      <EstatBuit
        titol={titol}
        accio={<Link to={desti} className="sdp-boto sdp-boto--secundari">{etiquetaResolta}</Link>}
      >
        {children}
      </EstatBuit>
    </section>
  );
}

/** El títol i el text de l'avís d'una pàgina de l'app que no existix. */
export const PAGINA_INEXISTENT = Object.freeze({
  titol: 'Esta pàgina de l’app no existix',
  text: 'Pot ser que l’enllaç siga antic o estiga mal copiat.'
});
