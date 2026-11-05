import { Link } from '../../app/contexts/RouterContext';
import { arbreTerritorial, DEMARCACIONS, provinciaDelPoble, comarcaDelPoble, rutaTerritorial } from './territoriDelPoble.js';

/* Reutilitza la llista niada sdp-arbre de l'espècimen ArbreUniversal. */
export function ArbreTerritorial({ pobles, t }) {
  return (
    <nav aria-label={t('section.pobles.territori', 'Territori')}>
      <details>
        <summary>{t('section.pobles.xarxa', 'Xarxa de Pobles')}</summary>
        <ul className="sdp-arbre">
          <li><Link to="/pobles">{t('section.pobles.xarxa', 'Xarxa de Pobles')}</Link>
            <ul>{arbreTerritorial(pobles).map((provincia) => (
              <li key={provincia.id}><details>
                <summary>{t(`section.pobles.demarcacio.${provincia.id}`, provincia.etiqueta)}</summary>
                <Link to={rutaTerritorial(provincia.id)}>{t('section.pobles.territori.veure', 'Veure els pobles')}</Link>
                <ul>{provincia.comarques.map((comarca) => (
                  <li key={comarca.id}><Link to={rutaTerritorial(provincia.id, comarca.id)}>{comarca.nom}</Link>
                    <ul>{comarca.pobles.filter((poble) => !poble.parent_poble_id).map((poble) => (
                      <li key={poble.id}><Link to={`/pobles/${encodeURIComponent(poble.id)}`}>{poble.title || poble.name}</Link>
                        {comarca.pobles.some((fill) => fill.parent_poble_id === poble.id) ? <ul>
                          {comarca.pobles.filter((fill) => fill.parent_poble_id === poble.id).map((fill) => (
                            <li key={fill.id}><Link to={`/pobles/${encodeURIComponent(fill.id)}`}>{fill.title || fill.name}</Link></li>
                          ))}
                        </ul> : null}
                      </li>
                    ))}</ul>
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
  const provincia = DEMARCACIONS.find((item) => item.id === provinciaDelPoble(poble));
  return (
    <nav aria-label={t('section.pobles.territori', 'Territori')}>
      <ol className="sdp-arbre">
        <li><Link to="/pobles">{t('section.pobles.xarxa', 'Xarxa de Pobles')}</Link></li>
        {provincia ? <li><Link to={rutaTerritorial(provincia.id)}>{t(`section.pobles.demarcacio.${provincia.id}`, provincia.etiqueta)}</Link></li> : null}
        {poble.comarca ? <li><Link to={rutaTerritorial(provincia?.id, comarcaDelPoble(poble))}>{poble.comarca}</Link></li> : null}
        {poble.parent_poble_id ? <li><Link to={`/pobles/${encodeURIComponent(poble.parent_poble_id)}`}>{poble.parent_poble_nom}</Link></li> : null}
        <li aria-current="page">{poble.title || poble.name}</li>
      </ol>
    </nav>
  );
}
