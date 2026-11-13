 
import { useMemo } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { useSEO } from '../../hooks/useSEO';
import { Link } from '../../app/contexts/RouterContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useUIActions } from '../../app/contexts/UIContext';
import SubnavigacioPoblesIGent from '../pobles/SubnavigacioPoblesIGent.jsx';
import { Carregant } from '../../components/PedraSeca/atoms/estats.jsx';
import { EstatErrorDades } from '../mur/EstatErrorDades.jsx';

/* Public catalogue values may be numeric or formatted text. Complex values
   are not population counts and must not crash the complete directory. */
export function habitantsDe(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) && valor >= 0 ? Math.trunc(valor) : 0;
  if (typeof valor !== 'string') return 0;
  const digits = valor.slice(0, 256).replace(/\D/g, '');
  const count = Number(digits);
  return Number.isSafeInteger(count) ? count : 0;
}

export default function PoblacioSection() {
  const { sortedTowns = [], status = 'ready', error, refresh } = useCoreContent();
  const { t, language } = useUIActions();

  useSEO({
    title: t('section.poblacio.title'),
    description: t('section.poblacio.subtitle')
  });

  const sortedByPopulation = useMemo(() => {
    return (Array.isArray(sortedTowns) ? sortedTowns : [])
      .filter((town) => town && typeof town === 'object' && !Array.isArray(town))
      .sort((a, b) => habitantsDe(b.population) - habitantsDe(a.population));
  }, [sortedTowns]);

  return (
    <UniversalPage
      title={t('section.poblacio.title')}
      subtitle={t('section.poblacio.subtitle')}
      lead={t('section.poblacio.lead')}
      chrome="system"
      showLogos={true}
    >
      <SubnavigacioPoblesIGent actiu="poblacio" idioma={language} />
      {status === 'loading' ? <Carregant etiqueta={t('section.pobles.loading', 'Carregant pobles...')} /> : null}
      {status === 'error' ? <EstatErrorDades titol={t('section.pobles.error', 'Error carregant els pobles.')} error={error} onReintenta={refresh} /> : null}
      {status !== 'loading' && status !== 'error' ? <div>
        {/* Gauntlet 261029 (cicle 1, a11y; IDEA-57 L3, P1-16) · La caixa
            desplaça la taula en horitzontal (.sdp-taula, overflow-x: auto): una
            regió amb nom que rep el focus, perquè el teclat la puga desplaçar
            (WCAG 2.1.1). Les dues classes es conserven: la doble vora és un
            píxel i no es toca. Les capçaleres, traduïdes i amb scope. */}
        <div className="sdp-taula" role="region" aria-label={t('section.poblacio.taula', 'Pobles per habitants')} tabIndex={0}>
          <table className="sdp-taula">
            <thead>
              <tr>
                <th scope="col">{t('section.poblacio.col.poble', 'Poble')}</th>
                <th scope="col">{t('section.poblacio.col.comarca', 'Comarca')}</th>
                <th scope="col" className="sdp-num">{t('section.poblacio.col.habitants', 'Habitants')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedByPopulation.map((town) => (
                <tr key={town.id}>
                  <td>
                    <Link to={`/pobles/${town.id}`} className="sdp-molla__enllac">
                      {typeof town.title === 'string' ? town.title : ''}
                    </Link>
                  </td>
                  <td>
                    {typeof town.comarca === 'string' ? town.comarca : ''}
                  </td>
                  <td className="sdp-num">
                    <strong>
                      {typeof town.population === 'string' || typeof town.population === 'number' ? town.population : ''}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div> : null}
    </UniversalPage>
  );
}
