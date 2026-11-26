import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import CatalegWorkspace from '../../components/universal/CatalegWorkspace.jsx';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';
import { usePublicadorsRegistrats } from '../../hooks/usePublicadorsRegistrats.js';
import { useSEO } from '../../hooks/useSEO';
import { FONTS_BANC_LLAVORS, entradesDelCataleg, llibresDelBancDeLlavors, textDeCercaDeLEntrada } from '../../data/patrimoni/bancLlavors.js';
import { presentacioDeLaFont } from '../../data/patrimoni/catalegsMultipoble.js';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { useLaminesBotaniquesNode0 } from './useLaminesBotaniquesNode0.js';
import { useRouter } from '../../app/contexts/RouterContext';
import { useUIActions, useUIStateOpcional } from '../../app/contexts/UIContext';
import TextSection from '../text/TextSection';
import { Fitxa, FitxaDeLaFont } from './BancLlavorsSection.jsx';
import { textosBibliotecaAgricola } from './i18nBibliotecaAgricola.js';
import { textosPatrimoniA11y } from './i18nPatrimoniA11y.js';
import { traductorPatrimoni } from './textosPatrimoni.js';

const CalendariAgricolaLlavorsView = lazy(() => import('./CalendariAgricolaLlavorsView.jsx'));
const PouDeLaNeuAnatomiaCard = lazy(() => import('../../components/patrimoni/PouDeLaNeuAnatomiaCard.jsx'));

const LLIBRES_IDS = Object.freeze([
  { id: 'llavors', emoji: '🌱', clauText: 'llibreLlavors' },
  { id: 'calendari', emoji: '🍅', clauText: 'llibreCalendari' },
  { id: 'anatomia', emoji: '🧊', clauText: 'llibreAnatomia' }
]);

/* C3 (UniversalPage) · El llibre inicial es llig de la consulta del router, no de la barra d'adreces, que dins
   d'un amfitrió (WordPress) és la de la pàgina amfitriona. Sense router (una prova que munta la secció sola),
   no hi ha consulta, com fa useUbicacioApp (PedraSeca/hooks/useAccions.js). */
function useConsultaDelRouterObjeto() {
  try {
    return useRouter() ?? null;
  } catch {
    return null;
  }
}

function useConsultaDelRouter() {
  return useConsultaDelRouterObjeto()?.searchParams?.toString() ?? '';
}

/* v1.2.22 · Gauntlet R2 (M5-02) · El total de fitxes del Banc ix de les dades (avui 45 + 65 + 15 + 3 = 128): el rètol de
   la pestanya (`llibreLlavors`, una funció del total) no porta cap xifra escrita a mà. */
export const TOTAL_FITXES_BANC_LLAVORS = FONTS_BANC_LLAVORS.reduce((suma, font) => suma + entradesDelCataleg(font.id).length, 0);

/* El rètol d'un llibre: una cadena, o una funció del total de fitxes. */
export function rotolDelLlibre(txBib, clauText) {
  const rotol = txBib?.[clauText];
  return typeof rotol === 'function' ? rotol(TOTAL_FITXES_BANC_LLAVORS) : rotol;
}

/* v1.2.22 · Gauntlet R2 (M4-04) · Els elements del Workspace, purs (la prova els passa per filterWorkspaceItems). La cerca
   llig els mateixos camps que filtraEntrades (textDeCercaDeLEntrada: nom, nom científic, nom de l'índex, origen, `llista`
   i `altres`) i l'autoria de la font: «Alfafara», el nom de la font a la pàgina 78, troba l'Alfafarenca. */
export function elementsDelBancDeLlavors(cataleg = null, etiquetaLamina = '') {
  return FONTS_BANC_LLAVORS.flatMap((font) => entradesDelCataleg(font.id).map((entrada) => {
    const lamina = cataleg?.obteLaminaBotanicaNode0(entrada.id);
    return {
      id: entrada.id,
      title: entrada.nom,
      subtitle: entrada.nomCientific,
      categoryIds: [font.id],
      glyph: '🌱',
      ...(lamina?.imatgePrincipal ? {
        imageUrl: lamina.imatgePrincipal,
        imageAlt: `${entrada.nom} (${entrada.nomCientific}) · ${etiquetaLamina}`
      } : null),
      lead: font.autoria,
      entrada,
      font,
      searchText: [textDeCercaDeLEntrada(entrada), font.autoria].join(' ')
    };
  }));
}

function llibreDeConsulta(search, defecte = 'llavors') {
  const valor = new URLSearchParams(search || '').get('llibre');
  return LLIBRES_IDS.some((l) => l.id === valor) ? valor : defecte;
}

function PontSeleccioVarietat({ varietatId, itemActualId, onTriaItem, onConsumit }) {
  useEffect(() => {
    if (!varietatId || typeof onTriaItem !== 'function') return undefined;
    if (itemActualId === varietatId) {
      onConsumit();
      return undefined;
    }
    let actiu = true;
    queueMicrotask(() => {
      if (actiu) onTriaItem(varietatId);
    });
    return () => {
      actiu = false;
    };
  }, [varietatId, itemActualId, onTriaItem, onConsumit]);
  return null;
}

function PaginaVarietatLlavors({ item, onClose, children }) {
  const routerOpcional = useConsultaDelRouterObjeto();
  const uiStateOpcional = useUIStateOpcional();
  if (!routerOpcional || !uiStateOpcional) return <article>{children}</article>;
  return <PaginaVarietatLlavorsAmbRouter item={item} onClose={onClose}>{children}</PaginaVarietatLlavorsAmbRouter>;
}

function PaginaVarietatLlavorsAmbRouter({ item, onClose, children }) {
  const { dadesBarra } = usePublicadorsRegistrats({ recursTipus: 'llavor', recursId: item.id });
  const { entrada, font } = item;
  const imatgeHero = entrada.imatgesDoctorals?.[0]?.src || item.imageUrl || undefined;
  useSEO({
    title: `${entrada.nom} (${entrada.nomCientific}) · Banc de llavors`,
    description: `${entrada.nom} (${entrada.nomCientific}) · ${font.autoria}.`,
    image: imatgeHero,
    index: true
  });
  return (
    <UniversalPage
      chrome="full"
      title={entrada.nom}
      subtitle={entrada.nomCientific}
      heroImage={imatgeHero}
      heroAlt={imatgeHero ? `${entrada.nom} (${entrada.nomCientific})` : undefined}
      llenguaDelContingut="ca"
      showLogos={true}
      topBarData={{ showPin: false, ...dadesBarra }}
      onBack={onClose}
      /* C26-2 #14 · Una fitxa d'una font de tercers porta la llicència de la presentació de la seua font
         (catalegsMultipoble.js · presentacioDeLaFont), mai la de Sóc de Poble. */
      copyright={presentacioDeLaFont(font).llicencia}
    >
      {children}
    </UniversalPage>
  );
}

function PaginaPresentacioLlibreLlavors({ item, tr, language, onClose, children }) {
  const { presentacio, font } = item;
  return (
    <UniversalPage
      chrome="full"
      title={presentacio.title}
      subtitle={presentacio.subtitle}
      lead={presentacio.lead}
      llenguaDelContingut="ca"
      showLogos={true}
      topBarData={{ showPin: false }}
      onBack={onClose}
      copyright={font?.llicencia || presentacio.llicencia || COPYRIGHT_SDP}
      labels={[
        { text: 'Catàlegs', className: 'sdp-badge-system', href: '/categoria/catalegs' },
        { text: font?.ambit || presentacio.procedencia || 'Banc de llavors', className: 'sdp-badge-category' }
      ]}
    >
      <div className="sdp-cataleg-workspace__fitxa">
        {font ? <FitxaDeLaFont font={font} tr={tr} llengua={language} /> : null}
      </div>
      {children}
    </UniversalPage>
  );
}

export default function BancLlavorsWorkspaceSection({ page, accioPrincipal, children, llibreInicial, itemSlug = null, sincronitzaRuta = false }) {
  const baseId = useId();
  const search = useConsultaDelRouter();
  const esSuperadmin = useSessioOpcional()?.esSuperadmin === true;
  const uiActions = useUIActions();
  const t = uiActions?.t;
  const language = useUIStateOpcional()?.language || uiActions?.language || 'ca';
  const txPat = textosPatrimoniA11y(language);
  const txBib = textosBibliotecaAgricola(language);
  const tr = useMemo(() => traductorPatrimoni(t), [t]);
  const llibresLlavors = useMemo(() => llibresDelBancDeLlavors(), []);
  const [llibreActiu, setLlibreActiu] = useState(() => (
    llibreInicial && LLIBRES_IDS.some((l) => l.id === llibreInicial)
      ? llibreInicial
      : llibreDeConsulta(search, 'llavors')
  ));
  const [tabFocusId, setTabFocusId] = useState(llibreActiu);
  const [varietatPendent, setVarietatPendent] = useState(null);
  const tablistRef = useRef(null);

  useEffect(() => {
    setTabFocusId(llibreActiu);
  }, [llibreActiu]);

  /* WAI-ARIA Tabs (selecció per activació, modern-web-guidance `tabs` + `accessibility`):
     els llibres 2 i 3 carreguen trossos diferits amb lazy() (incloent WebGL 3D),
     així que les fletxes mouen el focus amb roving tabindex sense disparar la descàrrega
     fins que la persona activa el botó amb Enter/Espai o clic. */
  const gestionaTeclesTablist = (event) => {
    const idxActual = LLIBRES_IDS.findIndex((l) => l.id === tabFocusId);
    if (idxActual < 0) return;
    let nouIdx = -1;
    if (event.key === 'ArrowRight') nouIdx = (idxActual + 1) % LLIBRES_IDS.length;
    else if (event.key === 'ArrowLeft') nouIdx = (idxActual - 1 + LLIBRES_IDS.length) % LLIBRES_IDS.length;
    else if (event.key === 'Home') nouIdx = 0;
    else if (event.key === 'End') nouIdx = LLIBRES_IDS.length - 1;
    if (nouIdx < 0) return;
    event.preventDefault();
    const destiId = LLIBRES_IDS[nouIdx].id;
    setTabFocusId(destiId);
    const botons = tablistRef.current?.querySelectorAll('[role="tab"]');
    botons?.[nouIdx]?.focus();
  };

  const cataleg = useLaminesBotaniquesNode0(llibreActiu === 'llavors');
  const model = useMemo(() => {
    const fitxes = elementsDelBancDeLlavors(cataleg, txBib.laminaBotanicaNode0);
    return {
      status: 'ready',
      /* Onada R29 · R29-02-1b · Les entrades són estàtiques (la làmina del Node 0 només hi afig la imatge):
         una ?fitxa= que no hi és mostra l'estat net de «no accessible», no un error amb Reintentar. */
      itemsComplete: true,
      canAutoSelect: () => false,
      llibres: llibresLlavors,
      categories: llibresLlavors.map((llibre) => ({
        id: llibre.id,
        slugRuta: llibre.id,
        /* IDEA-366 (22:23) · El nom curt del llibre a la columna (TITOLS_CURTS_DE_LLIBRE): el llarg es tallava. */
        label: llibre.titolCurt,
        count: entradesDelCataleg(llibre.id).length
      })),
      items: fitxes
    };
  }, [cataleg, txBib.laminaBotanicaNode0, llibresLlavors]);

  return (
    <div className="sdp-workspace-llibres">
      <div
        ref={tablistRef}
        className="sdp-workspace-llibres__barra"
        role="tablist"
        aria-label={txPat.llibresBibliotecaAgricolaAria}
        onKeyDown={gestionaTeclesTablist}
      >
        {LLIBRES_IDS.map((llibre) => {
          const actiu = llibreActiu === llibre.id;
          const ambStop = tabFocusId === llibre.id;
          return (
            <button
              key={llibre.id}
              id={`${baseId}-tab-${llibre.id}`}
              type="button"
              role="tab"
              aria-selected={actiu}
              tabIndex={ambStop ? 0 : -1}
              className="sdp-workspace-llibres__tab"
              onFocus={() => setTabFocusId(llibre.id)}
              onClick={() => setLlibreActiu(llibre.id)}
            >
              <span className="sdp-fitxa-emoji-xl" aria-hidden="true">{llibre.emoji}</span>
              <span>{rotolDelLlibre(txBib, llibre.clauText)}</span>
            </button>
          );
        })}
      </div>

      <div
        id={`${baseId}-panel-${llibreActiu}`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${llibreActiu}`}
        className="sdp-workspace-llibres__cos"
      >
        {llibreActiu === 'llavors' ? (
          <CatalegWorkspace
            id="banc-llavors-p069"
            font="llavors"
            destiPublicacio="llavors"
            ruta="/page/banc-de-llavors"
            itemSlug={itemSlug}
            sincronitzaRuta={sincronitzaRuta}
            afegirCataleg={esSuperadmin}
            permetreAfigCataleg
            model={model}
            labels={{ categories: txPat.catalegs, items: txPat.varietats, all: txPat.totsElsCatalegs }}
            renderDetail={({ item, selection, onClose, onTriaItem }) => {
              const entrada = item?.entrada;
              const pont = varietatPendent ? (
                <PontSeleccioVarietat
                  varietatId={varietatPendent}
                  itemActualId={item?.id ?? null}
                  onTriaItem={onTriaItem}
                  onConsumit={() => setVarietatPendent(null)}
                />
              ) : null;
              if (item) {
                return (
                  <PaginaVarietatLlavors key={entrada.id} item={item} onClose={onClose}>
                    {pont}
                    <div className="sdp-cataleg-workspace__fitxa">
                      <Fitxa
                        key={entrada.id}
                        entrada={entrada}
                        autoFocus={false}
                        totes={entradesDelCataleg(item.font.id)}
                        font={item.font}
                        tr={tr}
                        onTriaEntrada={(nou) => onTriaItem(nou.id)}
                        onTanca={onClose}
                        llengua={language}
                      />
                    </div>
                    <section className="sdp-cataleg-workspace__font" key={item.font.id}>
                      <h3>{item.font.autoria}</h3>
                      <FitxaDeLaFont font={item.font} tr={tr} llengua={language} />
                    </section>
                    {children}
                  </PaginaVarietatLlavors>
                );
              }
              const llibreSeleccionat = selection?.categoryId && selection.categoryId !== '__all__'
                ? llibresLlavors.find((l) => l.id === selection.categoryId)
                : null;
              if (llibreSeleccionat?.presentacio) {
                const fontDelLlibre = FONTS_BANC_LLAVORS.find((f) => f.id === llibreSeleccionat.id) || null;
                return (
                  <PaginaPresentacioLlibreLlavors
                    key={llibreSeleccionat.presentacio.id}
                    item={{ presentacio: llibreSeleccionat.presentacio, font: fontDelLlibre }}
                    tr={tr}
                    language={language}
                    onClose={onClose}
                  >
                    {pont}
                    {children}
                  </PaginaPresentacioLlibreLlavors>
                );
              }
              return (
                <TextSection
                  page={page}
                  pageKey="banc-de-llavors"
                  accioPrincipal={accioPrincipal}
                >
                  {pont}
                  {FONTS_BANC_LLAVORS.map((font) => (
                    <section className="sdp-cataleg-workspace__fitxa" key={font.id}>
                      <h3>{font.autoria}</h3>
                      <FitxaDeLaFont font={font} tr={tr} llengua={language} />
                    </section>
                  ))}
                  {children}
                </TextSection>
              );
            }}
          />
        ) : null}

        {llibreActiu === 'calendari' ? (
          <TextSection
            page={page}
            pageKey="banc-de-llavors"
            accioPrincipal={accioPrincipal}
            amagaCos={true}
          >
            <Suspense fallback={<p role="status">{txBib.carregantCalendari}</p>}>
              <CalendariAgricolaLlavorsView
                onObrirVarietat={(idVarietat) => {
                  setVarietatPendent(idVarietat);
                  setLlibreActiu('llavors');
                }}
              />
            </Suspense>
            {children}
          </TextSection>
        ) : null}

        {llibreActiu === 'anatomia' ? (
          <TextSection
            page={page}
            pageKey="banc-de-llavors"
            accioPrincipal={accioPrincipal}
            amagaCos={true}
          >
            <Suspense fallback={<p role="status">{txBib.carregantPouNeu}</p>}>
              <PouDeLaNeuAnatomiaCard />
            </Suspense>
            {children}
          </TextSection>
        ) : null}
      </div>
    </div>
  );
}
