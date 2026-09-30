import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { ContentProvider } from '../../components/universal/ContentProvider';
import { UniversalCard } from '../../components/universal/../PedraSeca';
import { EventCard } from '../../components/universal/EventCard';
import { useSEO } from '../../hooks/useSEO';
import { resolveAsset } from '../../config/assetResolver';
import {
  getSectionItemPath, getSectionListPath, objecteDe, objecteDePagina, rutaConnectarObjecte, rutaDePerfilDAutor
} from '../../config/navigation';
import { SYSTEM_PAGES } from '../../config/systemPages';
import { buildMapEmbedUrl } from './mapConfig';
import { useMur } from './MurContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { PillToggle, Alerta, Carregant } from '../../components/PedraSeca/index.js';
import { COPYRIGHT_SDP, dataDElement, momentDElement } from '../../components/universal/editorial.js';
import { AgendaMur } from './AgendaMur.jsx';

export default function MurSection() {
  const { status: estatMur, error: errorMur, sortedEvents, sortedFeedPosts, sortedMarketItems } = useMur();
  const { pageCopy, status: estatContingut } = useCoreContent();
  const { t } = useUIActions();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateFilter = searchParams.get('date');
  const categoryFilter = searchParams.get('category');

  const [filterType, setFilterType] = useState('all');
  const [isMapOpen, setIsMapOpen] = useState(false);

  useSEO({
    title: t('section.mur.kicker', 'Mur'),
    description: t('section.mur.subtitle', 'Llig el mur públic amb les darreres publicacions del poble.')
  });

  const systemPages = useMemo(() => SYSTEM_PAGES.map(item => {
    const data = pageCopy[item.key];
    if (!data) {
      // Una pàgina declarada i absent es deixa de pintar; en desenvolupament
      // ho diu en veu alta (incident del 24-09: `wikidepoble` → `skills`).
      // Només amb el contingut carregat: mentre carrega, `pageCopy` és buit.
      if (import.meta.env?.DEV && estatContingut === 'ready') console.warn(`[Mur] Falta la pàgina de sistema «${item.key}» a PAGE_COPY; la targeta no es pinta.`);
      return null;
    }
    return {
      ...data,
      /* T51 · La data del copy és la de CREACIÓ de la pàgina (com a
         TextSection): un dia serialitzat, que la regla pinta com el dia sol.
         No és el dia d'un acte (`date`), que dataDElement llegiria com a data
         triada i hi posaria les «02:00» de la mitjanit UTC. */
      date: undefined,
      created_at: data.date,
      id: item.key,
      isSystem: true,
      isAvis: item.isAvis,
      mainHref: item.href,
      type: 'sistema'
    };
  }).filter(Boolean), [pageCopy, estatContingut]);

  const allItems = useMemo(() => {
    const combined = [
      ...(sortedEvents || []),
      ...(sortedFeedPosts || []),
      ...(sortedMarketItems || []),
      ...systemPages
    ].filter(Boolean);

    /* T51 · De més nova a més vella per la MATEIXA data que pinta la targeta
       (editorial.js · momentDElement). Cap data inventada: un element sense
       cap data real va al final, en l'ordre en què ha arribat. */
    return combined
      .map((item) => ({ item, moment: momentDElement(item) }))
      .sort((a, b) => {
        if (a.moment === b.moment) return 0;
        if (a.moment === null) return 1;
        if (b.moment === null) return -1;
        return b.moment - a.moment;
      })
      .map(({ item }) => item);
  }, [sortedEvents, sortedFeedPosts, sortedMarketItems, systemPages]);

  const displayedItems = useMemo(() => {
    let items = allItems;
    if (filterType === 'events') items = items.filter(i => i.type === 'event');
    if (filterType === 'sistema') items = items.filter(i => i.type === 'sistema');
    if (filterType === 'mercat') items = items.filter(i => i.type === 'market' || i.type === 'product');

    if (dateFilter) {
      /* T51 · El filtre llig el MATEIX dia que pinta la pastilla (dateTime local
         de dataDElement): una publicació editada de veres es troba pel dia de
         l'edició, el que obri la seua pròpia pastilla. Els actes conserven el
         seu dia (EventCard). */
      items = items.filter(i => {
        const dia = i.type === 'event'
          ? String(i.date || '').slice(0, 10)
          : String(dataDElement(i)?.dateTime || '').slice(0, 10);
        return dia === dateFilter;
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

  const config = {
    title: t('section.mur.kicker', 'Mur'),
    subtitle: t('section.mur.title', 'Publicacions recents'),
    lead: t('section.mur.subtitle', 'Llig el mur públic amb les darreres publicacions del poble.'),
    chrome: "system",
    showLogos: true
  };
  /* T63.2 (doctrina del Mestre, 260928) · el xat comú del Mur és el de la seua
     ruta canònica: els filtres (?date=, ?category=) no en fan un altre. */
  const paginaMur = objecteDePagina({ titol: config.title, ruta: getSectionListPath('mur') });

  /* L'error del Mur es queda dins del Mur: el portal no cau amb ell. */
  if (estatMur === 'loading' || estatMur === 'error') {
    return (
      <ContentProvider initialConfig={config}>
        <UniversalPage objecte={paginaMur}>
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
      <UniversalPage layout="contained" objecte={paginaMur}>
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
              { valor: 'events', text: 'Agenda' },
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

          {/* T6 (ordre del Mestre, 260930) · l'Agenda porta el seu mes damunt de
              les targetes. Clicar un dia és el filtre ?date= de sempre (les
              targetes de davall ja s'hi filtren); un null el lleva. Només els
              actes del Mur: mai les tasques del Mapa de la Consola. */}
          {filterType === 'events' && (
            <AgendaMur actes={sortedEvents} diaTriat={dateFilter} onTriaDia={(dia) => setSearchParams({ date: dia })} />
          )}

          <div className="sdp-card-grid">
            {displayedItems.map((item) => {
              if (item.type === 'event') {
                /* T43 (ordre del Mestre, 260928) · l'agenda també es connecta amb el seu
                   descriptor; T63.2 · i Comentar obri el xat comú de l'acte. */
                const acte = objecteDe(item, 'events');
                return <EventCard key={`${item.type}-${item.id}`} item={item} objecte={acte} onConnect={() => navigate(rutaConnectarObjecte(acte))} />;
              }
              /* T51 · La pastilla de LECTURA amb el format i el lector únics
                 (editorial.js · dataDElement), els mateixos del detall: el dia de
                 l'acte, la data triada o la de creació, i una edició de veres si
                 és posterior. Cap data inventada: sense cap font real, la targeta
                 no porta pastilla (un deute de dades, no de pantalla). */
              const data = dataDElement(item);
              /* Lògica d'Usuari (T4, T5): l'autoria enllaça al perfil públic de qui
                 signa, i Connectar s'emporta l'origen sencer cap al MAS. */
              const seccio = (item.type === 'market' || item.type === 'product') ? 'mercat' : 'mur';
              /* T43 (D9) · els avisos del sistema també es connecten: són pàgines
                 del sistema, amb la seua ruta, i no porten cap autor inventat.
                 T63.2 · el mateix descriptor diu on porta Comentar: el xat comú
                 de la publicació, del producte o de la pàgina del sistema. */
              const objecte = item.isSystem
                ? objecteDePagina({ titol: item.title || item.name, ruta: item.mainHref, id: item.id })
                : objecteDe(item, seccio);

              return (
                <UniversalCard
                  key={`${item.type}-${item.id}`}
                  title={item.title || item.name}
                  /* T51 · l'emoticona que la nota porta al payload (icon); la
                     targeta només la pinta si és un sol emoji. */
                  emoticona={item.icon}
                  subtitle={item.subtitle}
                  body={item.lead || <p className="sp-card-text">{item.description}</p>}
                  imageUrl={resolveAsset(item.image_url || item.image || item.images?.[0] || item.imageSrc || '')}
                  imageAlt={item.imageAlt || item.title || ''}
                  author={item.author_name || item.seller || "Sóc de Poble"}
                  authorHref={item.isSystem ? "/pobles" : rutaDePerfilDAutor(item) || undefined}
                  objecte={objecte}
                  onConnect={() => navigate(rutaConnectarObjecte(objecte))}
                  avatarUrl={resolveAsset(item.author_avatar || item.avatar_url || '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg')}
                  location={item.author_location || item.population || "La Torre de les Maçanes"}
                  date={data.date}
                  time={data.time}
                  dateTime={data.dateTime}
                  /* T39 · els drets triats a la publicació (payload.copyright); el
                     text de sèrie, només per a la llavor i les d'abans de T39. */
                  copyright={item.copyright || COPYRIGHT_SDP}
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
