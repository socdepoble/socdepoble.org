import React, { useMemo, useState } from 'react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { UniversalCard, ContentProvider } from '../../components/universal/UniversalElements';
import { EventCard } from '../../components/universal/EventCard';
import { useSEO } from '../../hooks/useSEO';
import { resolveAsset } from '../../config/assetResolver';
import { getSectionItemPath } from '../../config/navigation';
import { buildMapEmbedUrl } from './mapConfig';
import { useMur } from './MurContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { PillToggle } from '../../components/PedraSeca/PillToggle.jsx';
import { Alerta } from '../../components/PedraSeca/Alerta.jsx';
import { Carregant } from '../../components/PedraSeca/estats.jsx';

export default function MurSection() {
  const { status: estatMur, error: errorMur, sortedEvents, sortedFeedPosts, sortedMarketItems } = useMur();
  const { sortedTowns, pageCopy } = useCoreContent();
  const { t } = useUIActions();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateFilter = searchParams.get('date');
  const categoryFilter = searchParams.get('category');

  const [filterType, setFilterType] = useState('all');
  const [isMapOpen, setIsMapOpen] = useState(false);

  useSEO({
    title: t('section.mur.kicker', 'Mur'),
    description: t('section.mur.subtitle', 'Llig el mur públic amb les darreres publicacions del poble.')
  });

  const systemPages = useMemo(() => [
    { key: 'projecte', isAvis: false, href: '/projecte' },
    { key: 'constitucio', isAvis: false, href: '/constitucio' },
    { key: 'roadmap', isAvis: false, href: '/roadmap' },
    { key: 'notes', isAvis: false, href: '/jo/notes' },
    { key: 'versions', isAvis: false, href: '/versions' },
    { key: 'legal', isAvis: false, href: '/legal' }
  ].map(item => {
    const data = pageCopy[item.key];
    if (!data) return null;
    return {
      ...data,
      id: item.key,
      isSystem: true,
      isAvis: item.isAvis,
      mainHref: item.href,
      type: 'sistema'
    };
  }).filter(Boolean), [pageCopy]);

  const allItems = useMemo(() => {
    const combined = [
      ...(sortedEvents || []),
      ...(sortedFeedPosts || []),
      ...(sortedMarketItems || []),
      ...systemPages
    ].filter(Boolean);

    return combined.sort((a, b) => {
      const dateA = new Date(a.date || a.publish_date || a.created_at || "2026-08-21T00:00:00.000Z");
      const dateB = new Date(b.date || b.publish_date || b.created_at || "2026-08-21T00:00:00.000Z");
      return dateB - dateA;
    });
  }, [sortedEvents, sortedFeedPosts, sortedMarketItems, systemPages]);

  const displayedItems = useMemo(() => {
    let items = allItems;
    if (filterType === 'events') items = items.filter(i => i.type === 'event');
    if (filterType === 'sistema') items = items.filter(i => i.type === 'sistema');
    if (filterType === 'mercat') items = items.filter(i => i.type === 'market' || i.type === 'product');

    if (dateFilter) {
      items = items.filter(i => {
        const rawDate = i.date || i.publish_date || i.created_at;
        if (!rawDate) return false;
        return rawDate.startsWith ? rawDate.startsWith(dateFilter) : String(rawDate).startsWith(dateFilter);
      });
    }
    
    if (categoryFilter) {
      items = items.filter(i => {
        const labels = i.labels || [{ text: i.isSystem ? 'Sistema' : (i.type || 'Publicació') }];
        return labels.some(l => l.text.toLowerCase() === categoryFilter.toLowerCase());
      });
    }

    return items;
  }, [allItems, filterType, dateFilter, categoryFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const formatTime = (timeStr, dateStr) => {
    if (timeStr) return timeStr;
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const config = {
    title: t('section.mur.kicker', 'Mur'),
    subtitle: t('section.mur.title', 'Publicacions recents'),
    lead: t('section.mur.subtitle', 'Llig el mur públic amb les darreres publicacions del poble.'),
    chrome: "system",
    showLogos: true
  };

  /* L'error del Mur es queda dins del Mur: el portal no cau amb ell. */
  if (estatMur === 'loading' || estatMur === 'error') {
    return (
      <ContentProvider initialConfig={config}>
        <UniversalPage>
          <div className="content-wrapper">
            {estatMur === 'loading'
              ? <Carregant etiqueta={t('loading.content', 'Carregant contingut del poble...')} />
              : (
                <Alerta to="error" titol={t('section.mur.error', "No s'ha pogut carregar el Mur")}>
                  {errorMur?.message || t('error.xarxa', 'Revisa la connexió i torna-ho a provar.')}
                </Alerta>
              )}
          </div>
        </UniversalPage>
      </ContentProvider>
    );
  }

  return (
    <ContentProvider initialConfig={config}>
      <UniversalPage layout="contained">
        <div className="content-wrapper">
          <PillToggle
            etiqueta="Filtres del mur"
            valor={isMapOpen ? 'mapa' : filterType}
            onCanvi={(v) => {
              if (v === 'mapa') { 
                setIsMapOpen((obert) => !obert); 
                setFilterType('all');
                return; 
              }
              setFilterType(v);
              setIsMapOpen(false);
            }}
            opcions={[
              { valor: 'all', text: 'Mostrar tot' },
              { valor: 'mercat', text: 'Mercat' },
              { valor: 'events', text: 'Esdeveniments' },
              { valor: 'mapa', text: 'Mapa' },
            ]}
          />

          {isMapOpen && (
            <div className="sdp-camp">
              <iframe
                title="Mapa del territori"
                src={buildMapEmbedUrl()}
                className="sdp-mapa-embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}

          <div className="sdp-card-grid">
            {displayedItems.map((item) => {
              const rawDate = item.date || item.publish_date || item.created_at || "2026-08-21T00:00:00.000Z";
              
              if (item.type === 'event') {
                return <EventCard key={`${item.type}-${item.id}`} item={item} />;
              }
              
              return (
                <UniversalCard
                  key={`${item.type}-${item.id}`}
                  title={item.title || item.name}
                  subtitle={item.subtitle}
                  body={item.lead || <p className="sp-card-text">{item.description}</p>}
                  imageUrl={resolveAsset(item.image_url || item.image || item.images?.[0] || item.imageSrc || '')}
                  imageAlt={item.imageAlt || item.title || ''}
                  author={item.author_name || item.seller || "Sóc de Poble"}
                  authorHref={item.isSystem ? "/pobles" : undefined}
                  avatarUrl={resolveAsset(item.author_avatar || item.avatar_url || '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg')}
                  location={item.author_location || item.population || "La Torre de les Maçanes"}
                  date={formatDate(rawDate)}
                  time={formatTime(item.time, rawDate)}
                  copyright="© Sóc de Poble / Fet per la IAIA i Nano Banana"
                  calendarBadge={null}
                  price={item.price}
                  labels={item.labels || [
                    { 
                      text: item.isSystem ? 'Sistema' : ((item.type === 'market' || item.type === 'product') ? 'Mercat' : (item.type || 'Publicació')), 
                      className: (item.isSystem || item.type === 'market' || item.type === 'product') ? 'sdp-badge-system' : 'sdp-badge-category' 
                    },
                    (item.type === 'market' || item.type === 'product') && item.variations?.length ? { text: `${item.variations.length} ${t('section.mercat.variations', 'variants')}`, className: 'sdp-badge-accent' } : null,
                    (item.type === 'market' || item.type === 'product') && item.category_slug ? { text: item.category_slug, className: 'sdp-badge-category' } : null,
                    (item.type === 'market' || item.type === 'product') && item.tag ? { text: item.tag, className: 'sdp-badge-tag' } : null
                  ].filter(Boolean)}
                  mainHref={item.mainHref || getSectionItemPath(item.type === 'event' ? 'events' : ((item.type === 'market' || item.type === 'product') ? 'mercat' : (item.type === 'poble' ? 'pobles' : 'mur')), item.id)}
                  showPin={item.isAvis}
                  hasFooter={true}
                  showTranslate={true}
                  showComment={true}
                  showShare={true}
                  showConnect={true}
                />
              );
            })}
          </div>
        </div>
      </UniversalPage>
    </ContentProvider>
  );
}
