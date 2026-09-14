 
import React, { useMemo } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { useSEO } from '../../hooks/useSEO';
import { Link } from '../../app/contexts/RouterContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useUIActions } from '../../app/contexts/UIContext';

export default function PoblacioSection() {
  const { sortedTowns } = useCoreContent();
  const { t } = useUIActions();

  useSEO({
    title: t('section.poblacio.title', 'Cens de Població'),
    description: t('section.poblacio.subtitle', 'Demografia i nombre d\'habitants dels pobles connectats.')
  });

  const sortedByPopulation = useMemo(() => {
    return [...sortedTowns].sort((a, b) => {
      // Parse population string (e.g. "700 hab") to number
      const popA = parseInt((a.population || '0').replace(/\D/g, ''), 10);
      const popB = parseInt((b.population || '0').replace(/\D/g, ''), 10);
      return popB - popA; // Descending order
    });
  }, [sortedTowns]);

  return (
    <UniversalPage
      title={t('section.poblacio.title', 'Cens de Població')}
      subtitle={t('section.poblacio.subtitle', 'Demografia')}
      lead={t('section.poblacio.lead', 'Llistat de tots els pobles registrats al sistema, ordenats pel seu nombre d\'habitants.')}
      chrome="system"
      showLogos={true}
    >
      <div >
        <div className="sdp-taula">
          <table className="sdp-taula">
            <thead>
              <tr>
                <th>Poble</th>
                <th>Comarca</th>
                <th className="sdp-num">Habitants</th>
              </tr>
            </thead>
            <tbody>
              {sortedByPopulation.map((town) => (
                <tr key={town.id}>
                  <td>
                    <Link to={`/pobles/${town.id}`} className="sdp-molla__enllac">
                      {town.title}
                    </Link>
                  </td>
                  <td>
                    {town.comarca}
                  </td>
                  <td className="sdp-num">
                    <strong>
                      {town.population}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </UniversalPage>
  );
}
