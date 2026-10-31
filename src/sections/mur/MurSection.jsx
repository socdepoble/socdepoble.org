import { Component, Suspense, useMemo, useState } from 'react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { ContentProvider } from '../../components/universal/ContentProvider';
import { useSEO } from '../../hooks/useSEO';
import { getSectionListPath, objecteDePagina } from '../../config/navigation';
import { buildMapEmbedUrl } from './mapConfig';
import { useMur } from './MurContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { PillToggle, Carregant, Boto, Alerta } from '../../components/PedraSeca/index.js';
import { dataDElement } from '../../components/universal/editorial.js';
/* Ordre del Mestre, 261001 · la targeta, les pàgines del sistema i l'ordre
   viuen fora (TargetaDelMur, targetesMur.js) perquè la pàgina /calendari pinte
   les MATEIXES targetes amb la MATEIXA data.
   Onada 6 (prompt 261009_0230, punt 1) · i la pestanya Calendari munta el
   MATEIX calendari que /calendari (CalendariDelMur → CalendariDelPoble);
   CalendariMur queda sense importador. */
import { CalendariDelMur } from './CalendariDelMur.jsx';
import { TargetaDelMur } from './TargetaDelMur.jsx';
import { momentDeLaTargeta, perMomentDescendent, targetesDeSistema } from './targetesMur.js';
import { acteAEsdeveniment, acteOcorreElDia } from './agendaMur.js';
// T2 · L'estat d'error de les dades, compartit amb el Mercat.
import { EstatErrorDades } from './EstatErrorDades.jsx';
import { lazyRoute } from '../../apps/plataforma/lazyRoute.js';
import { esAppNativa } from '../../config/origenPublic.js';
import { totsPublics } from '../../components/universal/traduccio/visibilitatTraduible.js';

/* P1-64 (pla 261028_1526 §3.7.1; decisions 1 i 9 del Mestre, 261028) · El
   Mapa Fotogràfic es carrega en diferit, només quan s'obri la pestanya
   «Mapa»: ni el seu codi ni Leaflet viatgen amb el Mur. */
const MapaFotografic = lazyRoute(() => import('./MapaFotografic.jsx'));

/* P1-64 · Si el mapa nou falla (el tros diferit que no arriba, Leaflet que no
   arrenca o un error en pintar), la pestanya torna al mapa de sempre: el
   d'OpenStreetMap incrustat. Tampoc ací no es demana res a OSM sense prémer
   «Vore mapa» (decisió 9), i a l'app nativa no hi ha botó. La barrera només
   viu mentre la pestanya és oberta: tornar-hi la torna a provar. */
class BarreraDelMapa extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (import.meta.env?.DEV) console.warn('[Mur] El mapa fotogràfic ha fallat: es mostra el mapa de sempre.', error);
  }

  render() {
    return this.state.error ? this.props.recurs : this.props.children;
  }
}

function MapaDeSempre({ t }) {
  const [obert, setObert] = useState(false);
  const nativa = esAppNativa();
  if (obert) {
    return (
      <iframe
        title="Mapa del territori"
        src={buildMapEmbedUrl()}
        className="sdp-mapa-embed"
        loading="lazy"
        /* Només l'origen: la ruta sencera (a WordPress, ?sdp= porta la de l'app) no ix cap a OSM (legal §21). */
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }
  return (
    <Alerta to="avis" accions={nativa ? null : <Boto onClick={() => setObert(true)}>{t('section.mur.mapa.voreMapa', 'Vore mapa')}</Boto>}>
      {nativa
        ? t('section.mur.mapa.falladaNativa', "El mapa fotogràfic no s'ha pogut carregar.")
        : t('section.mur.mapa.fallada', "El mapa fotogràfic no s'ha pogut carregar. Pots vore el mapa de sempre del territori.")}
    </Alerta>
  );
}

/* T5 · El model de l'acte d'un element: el de la llista o, si no hi és, fet ara. */
const modelDe = (models, item) => (models.has(item) ? models.get(item) : acteAEsdeveniment(item));

/* Decisió 4 del Mestre (261007) · «Carregar-ne més». Les seccions que pinta
   cada filtre del Mur: «Mostra més» només carrega les que es veuen (amb
   «Mostrar tot», les tres). Sense cap secció pendent no es pinta res: el DOM
   és el de sempre. Un useMur sense paginació (un doble d'abans de la
   Decisió 4) no en porta, i tampoc pinta cap botó. */
const SECCIONS_DEL_FILTRE = Object.freeze({ all: ['mur', 'events', 'mercat'], events: ['events'], mercat: ['mercat'], sistema: [] });
const SENSE_MES = () => false;
const SENSE_ERROR = () => null;
const SENSE_CARREGA = async () => false;
/* Onada 6 · Els paràmetres de la URL que escriu el calendari de la pestanya
   (useEstatCalendari), menys el ?date=, que és el filtre comú del Mur. */
const PARAMS_DEL_CALENDARI = Object.freeze(['vista', 'setmana', 'mes', 'any']);

/* El filtre ?category= (les etiquetes de cada element), el mateix per a la
   graella i per al calendari de la pestanya. */
function perCategoria(items, categoria) {
  if (!categoria) return items;
  return items.filter(i => {
    const labels = i.labels || [{ text: i.isSystem ? 'Sistema' : (i.type || 'Publicació') }];
    /* Auditoria de seguretat 261019 (F3) · Una etiqueta de text pla (la
       targeta també les pinta, UniversalCard · Etiqueta) o una sense text de
       cadena no tomba el filtre: abans, l.text.toLowerCase() llançava i
       /mur?category= deixava la pestanya en error per a tot el poble. */
    return labels.some((l) => {
      const text = typeof l === 'string' ? l : l?.text;
      return typeof text === 'string' && text.toLowerCase() === categoria.toLowerCase();
    });
  });
}

export default function MurSection() {
  const {
    status: estatMur, error: errorMur, refresh: recarregaMur, sortedEvents, sortedFeedPosts, sortedMarketItems,
    carregaMes = SENSE_CARREGA, hiHaMes = SENSE_MES, carregantMes = SENSE_MES, errorMes = SENSE_ERROR
  } = useMur();
  const { pageCopy, status: estatContingut, towns } = useCoreContent();
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
    if (filterType === 'sdp') items = items.filter(i => i.author?.nom === 'Sóc de Poble' || i.author?.name === 'Sóc de Poble' || i.organization?.nom === 'Sóc de Poble' || i.organization?.name === 'Sóc de Poble' || i.autoria?.nom === 'Sóc de Poble' || i.isSystem);

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
    
    return perCategoria(items, categoryFilter);
  }, [allItems, filterType, dateFilter, categoryFilter, models]);

  /* Onada 6 · Els actes del calendari de la pestanya: tots els del Mur (amb
     el ?category=, com la graella), sense el filtre ?date=: el dia triat el
     filtra el mateix calendari, amb la mateixa regla (acteOcorreElDia). */
  const actesDelCalendari = useMemo(
    () => perCategoria(allItems.filter((i) => i.type === 'event'), categoryFilter),
    [allItems, categoryFilter]
  );

  /* Onada 6 · En eixir de la pestanya Calendari es lleven la vista i el
     període que hi ha escrit el calendari; el ?date= es queda (el filtre de
     sempre de la graella). */
  const deixaElCalendari = () => {
    if (filterType !== 'events' || !PARAMS_DEL_CALENDARI.some((clau) => searchParams.has(clau))) return;
    setSearchParams(Object.fromEntries(PARAMS_DEL_CALENDARI.map((clau) => [clau, null])));
  };

  const config = {
    title: t('section.mur.kicker', 'Mur'),
    subtitle: t('section.mur.title', 'Publicacions recents'),
    lead: t('section.mur.subtitle', 'Explora el mur públic a través de les diferents vistes: llista, calendari i mapa.'),
    chrome: "system",
    showLogos: true
  };
  /* T63.2 (doctrina del Mestre, 260928) · el xat comú del Mur és el de la seua
     ruta canònica: els filtres (?date=, ?category=) no en fan un altre. */
  const paginaMur = objecteDePagina({ titol: config.title, ruta: getSectionListPath('mur') });

  /* Decisió 4 · hiHaMes ja inclou teCapacitat('paginacioSeccions'): un
     backend sense la capacitat no en té cap i el botó no ix. Si la càrrega
     falla, l'avís és el de sempre (EstatErrorDades) i «Torna-ho a provar»
     torna a demanar la mateixa pàgina.
     Relleu 261008 (revisió adversarial) · Només la de les seccions que han
     fallat: amb «Mostrar tot», les que sí que han carregat no avancen una
     pàgina més sense que la persona ho haja demanat. */
  const seccionsVisibles = SECCIONS_DEL_FILTRE[filterType] || [];
  const seccionsAmbMes = seccionsVisibles.filter((seccio) => hiHaMes(seccio));
  const carregantMesSeccions = seccionsVisibles.some((seccio) => carregantMes(seccio));
  const errorDeMes = seccionsVisibles.map((seccio) => errorMes(seccio)).find(Boolean) || null;
  const mostraMes = () => Promise.all(seccionsAmbMes.map((seccio) => carregaMes(seccio)));
  const reintentaMes = () => Promise.all(seccionsVisibles.filter((seccio) => errorMes(seccio)).map((seccio) => carregaMes(seccio)));

  /* L'error del Mur es queda dins del Mur: el portal no cau amb ell. */
  if (estatMur === 'loading' || estatMur === 'error') {
    return (
      <ContentProvider initialConfig={config}>
        <UniversalPage objecte={paginaMur}>
          <div className="content-wrapper">
            {estatMur === 'loading'
              ? <Carregant etiqueta={t('loading.content', 'Carregant contingut...')} />
              : <EstatErrorDades titol={t('section.mur.error', "No s'ha pogut carregar el Mur")} error={errorMur} onReintenta={recarregaMur} />}
          </div>
        </UniversalPage>
      </ContentProvider>
    );
  }

  return (
    <ContentProvider initialConfig={config}>
      {/* Gauntlet 261030 (Fase 3, TC3.2) · Traduir només si TOTES les
          publicacions del mur són públiques: una del veïnat (només per als
          membres) l'apaga (traduccio/visibilitatTraduible.js). */}
      <UniversalPage layout="contained" objecte={paginaMur} traduccio={totsPublics(allItems)}>
        <div className="content-wrapper">
          <PillToggle
            etiqueta="Filtres del mur"
            valor={isMapOpen ? 'mapa' : filterType}
            onCanvi={(v) => {
              if (v !== 'events') deixaElCalendari();
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
              { valor: 'sdp', text: 'Sóc de Poble' },
              { valor: 'mercat', text: 'Mercat' },
              { valor: 'events', text: 'Calendari' },
              { valor: 'mapa', text: 'Mapa' },
            ]}
          />

          {/* P1-64 · El Mapa Fotogràfic de les publicacions que es veuen (els
              filtres ?date= i ?category= de la graella), amb les fitxes dels
              pobles per a posar al seu poble les fotos sense GPS. */}
          {isMapOpen && (
            <div className="sdp-camp">
              <BarreraDelMapa recurs={<MapaDeSempre t={t} />}>
                <Suspense fallback={<Carregant etiqueta={t('section.mur.mapa.carregant', 'Carregant el mapa fotogràfic…')} />}>
                  <MapaFotografic items={displayedItems} pobles={towns} />
                </Suspense>
              </BarreraDelMapa>
            </div>
          )}

          {/* T6 (ordre del Mestre, 260930) · el Calendari porta el seu mes damunt
              de les targetes. Clicar un dia és el filtre ?date= de sempre; un
              null el lleva. Només els actes del Mur: mai les tasques del Mapa
              de la Consola.
              Onada 6 (prompt 261009_0230, punt 1) · El MATEIX calendari que
              /calendari (CalendariDelMur), amb les seues targetes de davall
              (el dia triat o el període que es veu, amb TargetaDelMur i
              .sdp-card-grid): en esta pestanya, la graella general no es pinta. */}
          {filterType === 'events' ? <CalendariDelMur actes={actesDelCalendari} /> : (
            <div className="sdp-card-grid">
              {/* Ordre del Mestre, 261001 · la targeta de cada element és
                  TargetaDelMur, la mateixa de la pàgina /calendari. T5 · un acte
                  porta el seu model (el mateix del Calendari i del filtre ?date=).
                  Ordre del Mestre (261007) · Comentar, el menú de dues vies de
                  totes les targetes: cap gestor de llista. */}
              {displayedItems.map((item) => (
                <TargetaDelMur key={`${item.type}-${item.id}`} item={item}
                  esdeveniment={item.type === 'event' ? modelDe(models, item) : null} />
              ))}
            </div>
          )}

          {/* Decisió 4 del Mestre (261007) · «Carregar-ne més», al final de la
              llista i només amb més pàgines. Boto desactiva i anuncia la
              càrrega (aria-busy) mentre treballa. */}
          {errorDeMes
            ? <EstatErrorDades titol={t('section.mur.error', "No s'ha pogut carregar el Mur")} error={errorDeMes} onReintenta={reintentaMes} />
            : seccionsAmbMes.length
              ? (
                <div className="sdp-camp sdp-camp--centrat">
                  <Boto carregant={carregantMesSeccions} onClick={mostraMes}>{t('section.mur.loadMore', 'Mostra més')}</Boto>
                </div>
              )
              : null}
        </div>
      </UniversalPage>
    </ContentProvider>
  );
}
