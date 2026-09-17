import { useDeferredValue, useMemo, useState } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { UniversalCard } from '../../components/universal/../PedraSeca';
import { UniversalSearch } from '../../components/PedraSeca/index.js';
import { resolveItemPath } from '../../config/navigation';
import { useUIActions } from '../../app/contexts/UIContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useMur } from '../mur/MurContext';
import { useXat } from '../xat/XatContext';

export default function SearchSection() {
  const { normalizeSearchText, t } = useUIActions();
  const core = useCoreContent();
  const mur = useMur();
  const xat = useXat();
  const [query, setQuery] = useState('');

  const deferredQuery = useDeferredValue(query);

  const globalSearchItems = useMemo(
    () => [
      ...(core.agents || []),
      ...(xat.chatThreads || []),
      ...(mur.feedPosts || []),
      ...(mur.marketItems || []),
      ...(mur.events || []),
      ...(core.towns || []),
    ],
    [
      core.agents,
      core.towns,
      mur.events,
      mur.feedPosts,
      mur.marketItems,
      xat.chatThreads,
    ]
  );

  const results = useMemo(() => {
    const term = normalizeSearchText(deferredQuery);

    if (!term) {
      return [];
    }

    return globalSearchItems
      .filter((item) => item.searchText.includes(term))
      .slice(0, 24);
  }, [deferredQuery, globalSearchItems, normalizeSearchText]);

  return (
    <UniversalPage
      title={t('section.search.title', 'Cercador Universal')}
      subtitle={t(
        'section.search.subtitle',
        'Busca persones, pobles, publicacions i pàgines en un sol lloc'
      )}
      chrome="system"
      showLogos
    >
      <div className="content-wrapper">
        <div className="sdp-camp">
          <UniversalSearch
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(
              'section.search.searchPlaceholder',
              'Cerca persones, pobles, posts...'
            )}
            ariaLabel={t(
              'section.search.searchPlaceholder',
              'Cerca persones, pobles, posts...'
            )}
          />
        </div>

        <div className="content-wrapper">
          {results.map((item) => {
            const path = resolveItemPath(item);
            const content =
              item.role || item.post_subtitle || item.content || item.message;
            const sectionId =
              item.sectionId || t('section.search.resultLabel', 'Resultat');

            return (
              <UniversalCard
                key={`${sectionId}-${item.id}`}
                title={item.name || item.title}
                subtitle={
                  content?.substring(0, 100) +
                  (content?.length > 100 ? '...' : '')
                }
                labels={[{ text: sectionId.toUpperCase() }]}
                mainHref={path}
                connectLabel={t('common.readMore', 'Veure Més')}
              />
            );
          })}

          {query && results.length === 0 && (
            <div className="sdp-buit">
              {t('section.search.noResults', 'Cap resultat.')}
            </div>
          )}
        </div>
      </div>
    </UniversalPage>
  );
}
