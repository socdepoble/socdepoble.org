import React from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { UniversalCard } from '../../components/universal/../PedraSeca';
import { getSectionItemPath } from '../../config/navigation';
import { useSEO } from '../../hooks/useSEO';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useUIActions } from '../../app/contexts/UIContext';

export default function PoblesSection() {
  const { sortedTowns, status, error } = useCoreContent();
  const { t } = useUIActions();
  
  const sortedAndActiveTowns = React.useMemo(() => {
    return [...sortedTowns].sort((a, b) => {
      const dateA = a.dynamic_time || a.time || a.created_at || '';
      const dateB = b.dynamic_time || b.time || b.created_at || '';
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [sortedTowns]);
  
  useSEO({
    title: t('section.pobles.kicker', 'Pobles'),
    description: t('section.pobles.subtitle', 'Explora els pobles i el seu context territorial.')
  });

  /*
   * =========================================================================
   * REGLA DE DISSENY (Pobles)
   * =========================================================================
   * Aquesta pàgina és diferent de la resta (no s'edita manualment).
   * Funciona exclusivament mostrant de forma automàtica la targeta
   * de l'últim publicador al Mur. Quan un poble publica una notícia,
   * automàticament puja a dalt de tot en aquesta llista.
   * La resta de pobles apareixen aleatòriament per ara.
   * =========================================================================
   */

  return (
    <UniversalPage
      title={t('section.pobles.kicker', 'Pobles')}
      subtitle={t('section.pobles.title', 'Nodes i territori')}
      lead={t('section.pobles.subtitle', 'Explora els pobles i el seu context territorial.')}
      chrome="system"
      showLogos={true}
    >
      <div className="sdp-card-grid ">
        {status === 'loading' && (
          <div className="sdp-loading-state">
            <div className="sdp-spinner"></div>
            <p>{t('section.pobles.loading', 'Carregant els pobles...')}</p>
          </div>
        )}
        {status === 'error' && (
          <div className="sdp-error-state util-text-error">
            <p>{t('section.pobles.error', 'Hi ha hagut un problema carregant els pobles.')}</p>
            <pre className="util-text-s util-opacity-70">{error?.message || String(error)}</pre>
          </div>
        )}
        {status === 'ready' && sortedAndActiveTowns.length === 0 && (
          <div className="sdp-empty-state">
            {t('section.pobles.noResults', 'Cap poble trobat.')}
          </div>
        )}
        {status === 'ready' && sortedAndActiveTowns.map((town) => {

          return (
            <UniversalCard
              key={town.id}
              author={(() => {
                if (town.title === 'La Torre de les Maçanes') return 'Gent de La Torre';
                if (/^[aeiouhàèéíòóú]/i.test(town.title)) return `Gent d'${town.title}`;
                return `Gent de ${town.title}`;
              })()}
              authorHref={getSectionItemPath('pobles', town.id)}
              avatarUrl={town.avatar_url || town.image_url}
              location={town.comarca}
              time={town.dynamic_time || town.time}
              date={town.dynamic_date}
              imageUrl={town.imageSrc || town.image_url}
              imageAlt={town.title}
              title={town.title}
              subtitle={town.comarca}
              body={
                <div>
                  <p className="sp-card-text">{town.content}</p>
                </div>
              }
              labels={[
                { text: t('section.pobles.kicker', 'Pobles'), className: 'sdp-badge-system', href: '/pobles' },
                ...(town.population ? [{ text: town.population, className: 'sdp-badge-accent', href: '/poblacio' }] : []),
                { 
                  text: t('section.pobles.wikipedia_link', "Publicat a la Viquipèdia"), 
                  className: 'sdp-badge-neutral', 
                  href: `https://ca.wikipedia.org/wiki/${town.id === 'sella' ? 'Sella_(Marina_Baixa)' : town.id === 'relleu' ? 'Relleu_(municipi)' : encodeURIComponent(town.title.replace(/ /g, '_'))}` 
                }
              ]}
              copyright="© Viquipèdia / Wikimedia Commons (CC BY-SA)"
              mainHref={getSectionItemPath('pobles', town.id)}
              hasFooter={true}
              showTranslate={true}
              showComment={true}
              showShare={true}
              showConnect={true}
            />
          );
        })}
      </div>
    </UniversalPage>
  );
}
