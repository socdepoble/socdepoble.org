/**
 * Plataforma d'Apps Enxufables · l'avís que substituïx un 404 mut.
 *
 * Un EstatBuit amb un enllaç d'eixida. El fan servir RutaApps (ruta no
 * segura, app desconeguda, apagada o entrada inexistent) i ClosaAplicacio
 * (cap ruta de la taula casa amb la URL): la persona sempre llig el mateix.
 */
import { Link } from '../../app/contexts/RouterContext';
import { EstatBuit } from '../../components/PedraSeca/atoms/estats.jsx';

export function AvisApp({ titol, children, desti = '/app', etiqueta = 'Torna a les apps' }) {
  return (
    <section className="sdp-app-avis">
      <EstatBuit
        titol={titol}
        accio={<Link to={desti} className="sdp-boto sdp-boto--secundari">{etiqueta}</Link>}
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
