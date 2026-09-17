import React from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { ContentProvider } from '../../components/universal/ContentProvider';
import { UniversalCard } from '../../components/universal/../PedraSeca';
import { getSectionItemPath } from '../../config/navigation';

import { useSEO } from '../../hooks/useSEO';
import { useMur } from '../mur/MurContext';
import { useUIActions } from '../../app/contexts/UIContext';


export default function MercatSection() {
  const { sortedMarketItems } = useMur();
  const { t } = useUIActions();
  
  useSEO({
    title: t('section.mercat.kicker', 'Mercat'),
    description: t('section.mercat.subtitle', 'Explora els productes i les ofertes disponibles.')
  });

  const config = {
    title: t('section.mercat.kicker', 'Mercat'),
    subtitle: t('section.mercat.title', 'Productes i intercanvis'),
    lead: t('section.mercat.subtitle', 'Explora els productes i les ofertes disponibles.'),
    chrome: "system",
    showLogos: true
  };

  return (
    <ContentProvider initialConfig={config}>
      <UniversalPage>
        <div className="sdp-card-grid">
          {sortedMarketItems.map((item) => {
            let itemDate = '';
            let itemTime = '';
            if (item?.created_at) {
              const d = new Date(item.created_at);
              itemDate = d.toLocaleDateString('ca-ES');
              itemTime = d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
            }

            return (
              <UniversalCard
                key={item.id}
                author={item.author_name || item.seller || 'Sóc de Poble'}
                avatarUrl={item.avatar_url || '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg'}
                body={item.description || ''}
                copyright="© Sóc de Poble / Fet per la IAIA i Nano Banana"
                date={itemDate}
                time={itemTime}
                imageAlt={item.title}
                imageUrl={item.images?.[0] || item.imageSrc || ''}
                labels={[
                  { text: 'Mercat', className: 'sdp-badge-system' },
                  item.variations?.length ? { text: `${item.variations.length} ${t('section.mercat.variations', 'variants')}`, className: 'sdp-badge-accent' } : null,
                  item.category_slug ? { text: item.category_slug, className: 'sdp-badge-category' } : null,
                  item.tag ? { text: item.tag, className: 'sdp-badge-tag' } : null
                ].filter(Boolean)}
                location={item.author_location || item.population || 'La Torre de les Maçanes'}
                mainHref={getSectionItemPath('mercat', item.id)}
                subtitle={item.subtitle || ''}
                title={item.title}
                price={item.price}
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
    </ContentProvider>
  );
}
