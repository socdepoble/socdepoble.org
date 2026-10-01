import React, { useMemo, useState } from 'react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { ContentProvider } from '../../components/universal/ContentProvider';
import { useSEO } from '../../hooks/useSEO';
import { getSectionListPath, objecteDePagina } from '../../config/navigation';
import { buildMapEmbedUrl } from './mapConfig';
import { useMur } from './MurContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { PillToggle, Carregant } from '../../components/PedraSeca/index.js';
import { dataDElement } from '../../components/universal/editorial.js';
/* Ordre del Mestre, 261001 · el calendari del Mur es diu CalendariMur (abans
   AgendaMur); la targeta, les pàgines del sistema i l'ordre viuen fora
   (TargetaDelMur, targetesMur.js) perquè la pàgina /calendari pinte les
   MATEIXES targetes amb la MATEIXA data. */
import { CalendariMur } from './CalendariMur.jsx';
import { TargetaDelMur } from './TargetaDelMur.jsx';
import { momentDeLaTargeta, perMomentDescendent, targetesDeSistema } from './targetesMur.js';
import { acteAEsdeveniment, acteOcorreElDia } from './agendaMur.js';
// T2 · L'estat d'error de les dades, compartit amb el Mercat.
import { EstatErrorDades } from './EstatErrorDades.jsx';

/* T5 · El model de l'acte d'un element: el de la llista o, si no hi és, fet ara. */
const modelDe = (models, item) => (models.has(item) ? models.get(item) : acteAEsdeveniment(item));

export default function MurSection() {
  const { status: estatMur, error: errorMur, refresh: recarregaMur, sortedEvents, sortedFeedPosts, sortedMarketItems } = useMur();
  const { pageCopy, status: estatContingut } = useCoreContent();
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

  const systemPages = useMemo(() => targetesDeSistema(pageCopy, {
    // Una pàgina declarada i absent es deixa de pintar; en desenvolupament
    // ho diu en veu alta (incident del 24-09: `wikidepoble` → `skills`).
    // Només amb el contingut carregat: mentre carrega, `pageCopy` és buit.
    quanFalta: (clau) => {
      if (import.meta.env?.DEV && estatContingut === 'ready') console.warn(`[Mur] Falta la pàgina de sistema «${clau}» a PAGE_COPY; la targeta no es pinta.`);
    }
  }), [pageCopy, estatContingut]);

  /* T5 · El model de cada acte (acteAEsdeveniment), una sola vegada per
     llista: el lligen l'ordre, el filtre ?date= i la targeta. */
  const models = useMemo(() => new Map(
    [...(sortedEvents || []), ...(sortedFeedPosts || []), ...(sortedMarketItems || [])]
      .filter((item) => item?.type === 'event')
      .map((item) => [item, acteAEsdeveniment(item)])
  ), [sortedEvents, sortedFeedPosts, sortedMarketItems]);

  const allItems = useMemo(() => {
    const combined = [
      ...(sortedEvents || []),
      ...(sortedFeedPosts || []),
      ...(sortedMarketItems || []),
      ...systemPages
    ].filter(Boolean);

    /* T51 · De més nova a més vella per la MATEIXA data que pinta la targeta
       (momentDeLaTargeta). Cap data inventada: un element sense cap data real
       va al final, en l'ordre en què ha arribat (perMomentDescendent, el
       mateix ordre de la pàgina /calendari). */
    return combined
      .map((item) => ({ item, moment: momentDeLaTargeta(item, item.type === 'event' ? modelDe(models, item) : null) }))
      .sort(perMomentDescendent)
      .map(({ item }) => item);
  }, [sortedEvents, sortedFeedPosts, sortedMarketItems, systemPages, models]);

  const displayedItems = useMemo(() => {
    let items = allItems;
    if (filterType === 'events') items = items.filter(i => i.type === 'event');
    if (filterType === 'sistema') items = items.filter(i => i.type === 'sistema');
    if (filterType === 'mercat') items = items.filter(i => i.type === 'market' || i.type === 'product');

    if (dateFilter) {
      /* T51 · El filtre llig el MATEIX dia que pinta la pastilla (dateTime local
         de dataDElement): una publicació editada de veres es troba pel dia de
         l'edició, el que obri la seua pròpia pastilla.
         T5 (ordre del Mestre, 260930) · Un acte es troba els dies que el pinta
         el Calendari (acteOcorreElDia, amb el model: tot el dia, amb hora, amb fi o
         repetit) i sempre el dia de la seua pastilla, i una clau que no
         existix no en troba cap (D5). Sense acte vàlid, com la resta: pel dia
         de la seua pastilla. */
      items = items.filter(i => {
        const acte = i.type === 'event' ? acteOcorreElDia(i, dateFilter, modelDe(models, i)) : null;
        if (acte !== null) return acte;
        return String(dataDElement(i)?.dateTime || '').slice(0, 10) === dateFilter;
      });
    }
    
    if (categoryFilter) {
      items = items.filter(i => {
        const labels = i.labels || [{ text: i.isSystem ? 'Sistema' : (i.type || 'Publicació') }];
        return labels.some(l => l.text.toLowerCase() === categoryFilter.toLowerCase());
      });
    }

    return items;
  }, [allItems, filterType, dateFilter, categoryFilter, models]);

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
              : <EstatErrorDades titol={t('section.mur.error', "No s'ha pogut carregar el Mur")} error={errorMur} onReintenta={recarregaMur} />}
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
            /* Ordre del Mestre, 261001 · la pestanya es diu «Calendari», com la
               pàgina /calendari. El valor intern continua sent 'events': no
               viatja a cap URL i els actes són el que filtra. */
            opcions={[
              { valor: 'all', text: 'Mostrar tot' },
              { valor: 'mercat', text: 'Mercat' },
              { valor: 'events', text: 'Calendari' },
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

          {/* T6 (ordre del Mestre, 260930) · el Calendari porta el seu mes damunt
              de les targetes. Clicar un dia és el filtre ?date= de sempre (les
              targetes de davall ja s'hi filtren); un null el lleva. Només els
              actes del Mur: mai les tasques del Mapa de la Consola. */}
          {filterType === 'events' && (
            <CalendariMur actes={sortedEvents} diaTriat={dateFilter} onTriaDia={(dia) => setSearchParams({ date: dia })} />
          )}

          <div className="sdp-card-grid">
            {/* Ordre del Mestre, 261001 · la targeta de cada element és
                TargetaDelMur, la mateixa de la pàgina /calendari. T5 · un acte
                porta el seu model (el mateix del Calendari i del filtre ?date=). */}
            {displayedItems.map((item) => (
              <TargetaDelMur key={`${item.type}-${item.id}`} item={item}
                esdeveniment={item.type === 'event' ? modelDe(models, item) : null} />
            ))}
          </div>
        </div>
      </UniversalPage>
    </ContentProvider>
  );
}
