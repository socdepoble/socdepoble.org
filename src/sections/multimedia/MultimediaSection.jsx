import { useMemo, useState } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { useLocation, useNavigate, useSearchParams } from '../../app/contexts/RouterContext';
import { useMultimedia } from './MultimediaContext';
import { useUIActions, useUIStateOpcional } from '../../app/contexts/UIContext';
import { PillToggle } from '../../components/PedraSeca/index.js';
import { useSEO } from '../../hooks/useSEO';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { fusionaMitjans } from './mediaContent.js';
import { SENSE_DATA, agrupaPerMes, etiquetaDelMes } from './cronologia.js';
import { origenDe } from './origenImatges.js';
import { useCensImatges } from './useCensImatges.js';
import { VisorDeLArxiu } from './VisorDeLArxiu.jsx';

/* Onada 0.3 (Gauntlet 261016, M04) · La marca de l'entrada de l'historial que
   ha obert el visor des de la graella: tancar-lo és tornar arrere (el botó
   Arrere del navegador fa el mateix). Sense marca (un enllaç directe a
   ?foto=, la redirecció de /multimedia/<id>), tancar lleva la consulta. */
const MARCA_VISOR = 'sdpVisor';

const indexDe = (llista, id) => (id == null ? -1 : llista.findIndex((item) => String(item?.id) === id));

/* La cel·la de la graella: un botó que obri el visor (abans, un enllaç a
   /multimedia/<id>, una pàgina pròpia). Llei del Píxel (revisió adversarial
   del 261016): el botó és un embolcall transparent i la cel·la de sempre
   (.photo-grid__item, la caixa quadrada que creix fins a contindre la foto,
   com l'<a> d'abans) va a dins. Un <button> amb la classe de la cel·la no
   creixia (Chrome no aplica el mínim automàtic d'aspect-ratio a un botó) i
   la foto, amb el marge de la prosa, sobreeixia damunt de la fila de davall
   (modules.css, LES CEL·LES DE L'ARXIU VISUAL). */
function Cella({ item, onObri }) {
  return (
    <button type="button" className="photo-grid__boto" aria-haspopup="dialog" onClick={() => onObri(item)}>
      <span className="photo-grid__item">
        {/* T5 · El src es resol en pintar-lo: incrustat, un '/assets/…' penja del paquet. Sense base, el de sempre. */}
        {item.src ? (
          <img src={resolRecursPropi(item.src)} alt={item.title || item.tag} loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <div className="media-frame__buit">
            <span className="sdp-sr-only">{item.title || 'Sense imatge'}</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          </div>
        )}
      </span>
    </button>
  );
}

export default function MultimediaSection() {
  const { status, mediaItems, mediaTimelineGroups } = useMultimedia();
  const { t } = useUIActions();
  /* Revisió adversarial del 261016 · Els mesos de la Cronologia, en la
     llengua activa (abans, sempre en ca-ES). Sense UIProvider, el de sèrie. */
  const locale = useUIStateOpcional()?.locale || 'ca-ES';
  const [viewMode, setViewMode] = useState('grid');
  const [searchParams, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  /* Onada 0.3 (Gauntlet 261016, M03) · El cens de public/assets
     (censImatges.js), carregat només ací: darrere dels mitjans del port i de
     les fotos vives, les imatges que encara no hi són. Mentre el port
     carrega, encara no: la graella no salta quan arriben. Amb els àlies del
     cens (revisió adversarial del 261016): una còpia que porta el port compta
     com el seu original, i el cens no hi torna a afegir la mateixa foto. */
  const { mitjans: delCens, cens, alies } = useCensImatges();
  const totes = useMemo(
    () => (delCens.length && status !== 'loading' ? fusionaMitjans(mediaItems, delCens, { alies }) : mediaItems),
    [mediaItems, delCens, alies, status]
  );
  const featured = totes[0] || null;
  /* Onada 0.3 (I35) · La Cronologia del proveïdor (cronologia.js) i, amb el
     cens, la mateixa regla sobre tot el que es pinta: les imatges sense data
     van al grup «Sense data», l'últim. */
  const timelineGroups = useMemo(
    () => (totes === mediaItems ? (mediaTimelineGroups || []) : agrupaPerMes(totes, { locale })),
    [totes, mediaItems, mediaTimelineGroups, locale]
  );
  /* Requisit del Mestre (261007) · L'apartat «IAIA»: les imatges d'IA
     (origenImatges.js · origenDe). */
  const deLaIaia = useMemo(() => totes.filter((item) => origenDe(item, cens) === 'ia'), [totes, cens]);

  /* El visor passa les fotos de la vista que es veu; una ?foto= que no hi és
     (un enllaç directe, una altra vista) es busca a l'Arxiu sencer. */
  const fotoId = searchParams.get('foto');
  const llistaDeLaVista = viewMode === 'timeline' ? timelineGroups.flatMap((grup) => grup.items) : viewMode === 'iaia' ? deLaIaia : totes;
  const enLaVista = indexDe(llistaDeLaVista, fotoId);
  const llistaVisor = enLaVista >= 0 ? llistaDeLaVista : totes;
  const indexVisor = enLaVista >= 0 ? enLaVista : indexDe(totes, fotoId);

  /* ?foto=<id> amb una entrada nova a l'historial (setParams fa replace per
     defecte): el botó Arrere tanca el visor. */
  const obri = (item) => setParams({ foto: String(item.id) }, { replace: false, state: { [MARCA_VISOR]: true } });
  const tanca = () => {
    if (location.state?.[MARCA_VISOR]) navigate(-1);
    else setParams({ foto: null }, { replace: true });
  };
  /* Anterior i següent substituïxen l'entrada: Arrere continua tancant. */
  const canvia = (nou) => {
    const item = llistaVisor[nou];
    if (item) setParams({ foto: String(item.id) }, { replace: true, state: location.state ?? null });
  };

  /* Onada 8 (261009) · Sense `image`: useSEO no passa cap SVG a les xarxes i
     ja hi posava la imatge base. El <head> és el mateix. */
  useSEO({
    title: t('section.multimedia.title', 'Arxiu visual'),
    description: t('section.multimedia.subtitle', 'Galeria d’imatges i cronologia visual del projecte.')
  });

  const graella = viewMode === 'iaia' ? deLaIaia : totes;

  return (
    <UniversalPage
      title={t('section.multimedia.title', 'Arxiu visual')}
      subtitle={t('section.multimedia.subtitle', 'Galeria d’imatges i cronologia visual del projecte.')}
      chrome="system"
      showLogos={true}
    >
      <header className="notes-list-header">
        <strong className="univ-manager-facet-header">{t('section.multimedia.all', 'TOTS')} ({totes.length}) - {featured?.created_at ? new Date(featured.created_at).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' }) : ''}</strong>
        <div className="univ-manager-toolbar">
          {/* T64 · Centrada amb el modificador canònic (el de l'Onboarding): com a
              fill flex de la toolbar, margin-inline:auto la porta al mig. La
              regla base .univ-manager-toolbar no es toca (l'Admin la compartix). */}
          <PillToggle
            className="sdp-pindola--centrada"
            etiqueta={t('section.multimedia.viewMode', 'Mode de vista')}
            valor={viewMode}
            onCanvi={setViewMode}
            opcions={[
              { valor: 'grid', text: t('section.multimedia.gallery', 'Galeria') },
              { valor: 'timeline', text: t('section.multimedia.timeline', 'Cronologia') },
              { valor: 'iaia', text: t('section.multimedia.iaia', 'IAIA') },
            ]}
          />
        </div>
      </header>



      {viewMode !== 'timeline' ? (
        <div className="photo-grid">
          {/* Ordre del Mestre (18-10-2026, relleu del Pla 2000; Gemini 2030, A3.2) ·
              La clau és l'id de la foto (únic: fusionaMitjans no en repetix cap),
              mai la posició: filtrar no torna a crear les cel·les que es queden. */}
          {graella.map((item) => (
            <Cella key={item.id} item={item} onObri={obri} />
          ))}
        </div>
      ) : (
        <div className="stack-grid">
          {timelineGroups.map((group) => (
            <section key={group.key} className="card card--soft">
              <div className="card__body">
                <div className="notes-list-header">
                  <h2 className="section-title">{group.key === SENSE_DATA ? t('section.multimedia.senseData', 'Sense data') : (etiquetaDelMes(group.key, locale) || group.label)}</h2>
                  <span className="pill">{group.items.length} {t('section.multimedia.elements', 'elements')}</span>
                </div>
                <div className="photo-grid">
                  {group.items.map((item) => (
                    <Cella key={item.id} item={item} onObri={obri} />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      <VisorDeLArxiu llista={llistaVisor} index={indexVisor} cens={cens} onTanca={tanca} onCanvi={canvia} />
    </UniversalPage>
  );
}
