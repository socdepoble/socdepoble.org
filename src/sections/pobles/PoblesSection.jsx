import React from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { UniversalCard } from '../../components/universal/../PedraSeca';
import { getSectionItemPath, objecteDe, rutaConnectarObjecte } from '../../config/navigation';
import { useNavigate } from '../../app/contexts/RouterContext';
import { useSEO } from '../../hooks/useSEO';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { dataDElement, momentDElement } from '../../components/universal/editorial.js';

export default function PoblesSection() {
  const { sortedTowns, status, error } = useCoreContent();
  const { t } = useUIActions();
  const navigate = useNavigate();

  /* T2 (prompt 1140, 261001) · La pastilla i l'ordre ixen de la mateixa data
     (editorial.js · dataDElement / momentDElement, la regla de Pedra Seca
     §10): la de creació del poble, o la de l'última versió si és posterior.
     Abans es llegien `dynamic_time` i `dynamic_date`, que no escriu cap codi:
     la targeta quedava sense pastilla i l'ordre, a mercé d'un text. Quan el
     model porte l'última publicació del poble al Mur, entrarà per ací.
     DEUTE CONEGUT (revisió de T2, 261001) · La pastilla porta al Calendari
     d'eixe mes, però el Calendari encara no rep els pobles
     (CalendariSection · entradesDelCalendari; type 'town', no 'poble'): el
     poble no hi ix. Pendent de decisió del Mestre. */
  const sortedAndActiveTowns = React.useMemo(() => {
    return [...sortedTowns].sort((a, b) => {
      const dateA = momentDElement(a);
      const dateB = momentDElement(b);
      if (dateA === null && dateB === null) return 0;
      if (dateA === null) return 1;
      if (dateB === null) return -1;
      return dateB - dateA;
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
      <div className="sdp-card-grid">
        {status === 'loading' && (
          <div>
            <div></div>
            <p>{t('section.pobles.loading', 'Carregant els pobles...')}</p>
          </div>
        )}
        {status === 'error' && (
          <div>
            <p>{t('section.pobles.error', 'Hi ha hagut un problema carregant els pobles.')}</p>
            <pre>{error?.message || String(error)}</pre>
          </div>
        )}
        {status === 'ready' && sortedAndActiveTowns.length === 0 && (
          <div>
            {t('section.pobles.noResults', 'Cap poble trobat.')}
          </div>
        )}
        {status === 'ready' && sortedAndActiveTowns.map((town) => {
          /* T63.2 · el descriptor del poble ('poble', id i ruta): Connectar se
             l'emporta i Comentar obri el xat del poble (la seua Comunitat). */
          const poble = objecteDe(town, 'pobles');
          const data = dataDElement(town);

          return (
            <UniversalCard
              key={town.id}
              author={(() => {
                if (town.title === 'La Torre de les Maçanes') return 'Gent de La Torre';
                if (/^[aeiouhàèéíòóú]/i.test(town.title)) return `Gent d'${town.title}`;
                return `Gent de ${town.title}`;
              })()}
              authorHref={getSectionItemPath('pobles', town.id)}
              avatarUrl={town.avatar_url || town.image_url || town.imageSrc}
              location={town.comarca}
              time={data.time}
              date={data.date}
              dateTime={data.dateTime}
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
              /* T43 (ordre del Mestre, 260928) · es connecta el poble (objecte
                 'poble', id i ruta), no un títol solt. */
              objecte={poble}
              onConnect={() => navigate(rutaConnectarObjecte(poble))}
            />
          );
        })}
      </div>
    </UniversalPage>
  );
}
