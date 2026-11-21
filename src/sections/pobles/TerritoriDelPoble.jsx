import { Link } from '../../app/contexts/RouterContext';
import { arbreTerritorial, rutaTerritorial } from './territoriDelPoble.js';
import {
  RUTA_XARXA_POBLES,
  dadesCamiTerritorial,
  fillsDirectesDePoble,
  poblesArrelDeComarca,
  rutaFitxaPoble,
  titolVisiblePoble,
} from './territoriDelPobleModel.js';

/* Reutilitza la llista niada sdp-arbre de l'espècimen ArbreUniversal. */
export function ArbreTerritorial({ pobles, t }) {
  return (
    <nav className="sdp-xarxa-pobles" aria-label={t('section.pobles.territori', 'Territori')}>
      <details className="sdp-xarxa-pobles__desplegable">
        <summary className="sdp-boto sdp-boto--secundari sdp-xarxa-pobles__boto">{t('section.pobles.xarxa', 'Xarxa de Pobles')}</summary>
        <ul className="sdp-arbre sdp-xarxa-pobles__arbre">
          <li><Link to={RUTA_XARXA_POBLES}>{t('section.pobles.xarxa', 'Xarxa de Pobles')}</Link>
            <ul>{arbreTerritorial(pobles).map((provincia) => (
              <li key={provincia.id}><details>
                <summary>{t(`section.pobles.demarcacio.${provincia.id}`, provincia.etiqueta)}</summary>
                <Link to={rutaTerritorial(provincia.id)}>{t('section.pobles.territori.veure', 'Veure els pobles')}</Link>
                <ul>{provincia.comarques.map((comarca) => (
                  <li key={comarca.id}><Link to={rutaTerritorial(provincia.id, comarca.id)}>{comarca.nom}</Link>
                    <ul>{poblesArrelDeComarca(comarca.pobles).map((poble) => {
                      const fills = fillsDirectesDePoble(comarca.pobles, poble.id);
                      return (
                        <li key={poble.id}><Link to={rutaFitxaPoble(poble.id)}>{titolVisiblePoble(poble)}</Link>
                          {fills.length > 0 ? <ul>
                            {fills.map((fill) => (
                              <li key={fill.id}><Link to={rutaFitxaPoble(fill.id)}>{titolVisiblePoble(fill)}</Link></li>
                            ))}
                          </ul> : null}
                        </li>
                      );
                    })}</ul>
                  </li>
                ))}</ul>
              </details></li>
            ))}</ul>
          </li>
        </ul>
      </details>
    </nav>
  );
}

export function CamiTerritorial({ poble, t }) {
  const { provincia, rutaProvincia, rutaComarca, rutaPare, titolActual } = dadesCamiTerritorial(poble);
  return (
    <nav aria-label={t('section.pobles.territori', 'Territori')}>
      <ol className="sdp-arbre">
        <li><Link to={RUTA_XARXA_POBLES}>{t('section.pobles.xarxa', 'Xarxa de Pobles')}</Link></li>
        {provincia ? <li><Link to={rutaProvincia}>{t(`section.pobles.demarcacio.${provincia.id}`, provincia.etiqueta)}</Link></li> : null}
        {poble.comarca ? <li><Link to={rutaComarca}>{poble.comarca}</Link></li> : null}
        {poble.parent_poble_id ? <li><Link to={rutaPare}>{poble.parent_poble_nom}</Link></li> : null}
        <li aria-current="page">{titolActual}</li>
      </ol>
    </nav>
  );
}
