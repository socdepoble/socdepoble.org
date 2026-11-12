import { lazy, Suspense, useEffect, useId, useMemo, useState } from 'react';
import CatalegWorkspace from '../../components/universal/CatalegWorkspace.jsx';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';
import { usePublicadorsRegistrats } from '../../hooks/usePublicadorsRegistrats.js';
import { useSEO } from '../../hooks/useSEO';
import { FONTS_BANC_LLAVORS, entradesDelCataleg } from '../../data/patrimoni/bancLlavors.js';
import { useLaminesBotaniquesNode0 } from './useLaminesBotaniquesNode0.js';
import { useRouter } from '../../app/contexts/RouterContext';
import { useUIActions, useUIStateOpcional } from '../../app/contexts/UIContext';
import TextSection from '../text/TextSection';
import { Fitxa, FitxaDeLaFont } from './BancLlavorsSection.jsx';
import { traductorPatrimoni } from './textosPatrimoni.js';

const CalendariAgricolaLlavorsView = lazy(() => import('./CalendariAgricolaLlavorsView.jsx'));
const PouDeLaNeuAnatomiaCard = lazy(() => import('../../components/patrimoni/PouDeLaNeuAnatomiaCard.jsx'));

const LLIBRES_BIBLIOTECA_AGRICOLA = Object.freeze([
  { id: 'llavors', emoji: '🌱', etiqueta: 'Catàleg del Banc de Llavors (125 varietats)' },
  { id: 'calendari', emoji: '🍅', etiqueta: 'Calendari Agrícola i Tomaques' },
  { id: 'anatomia', emoji: '🧊', etiqueta: 'Anatomia Rural · Pou de la Neu 3D' }
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

function llibreDeConsulta(search, defecte = 'llavors') {
  const valor = new URLSearchParams(search || '').get('llibre');
  return LLIBRES_BIBLIOTECA_AGRICOLA.some((l) => l.id === valor) ? valor : defecte;
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
      copyright={font.llicencia || COPYRIGHT_SDP}
    >
      {children}
    </UniversalPage>
  );
}

export default function BancLlavorsWorkspaceSection({ page, accioPrincipal, children, llibreInicial, itemSlug = null, sincronitzaRuta = false }) {
  const baseId = useId();
  const search = useConsultaDelRouter();
  const { t } = useUIActions();
  const tr = useMemo(() => traductorPatrimoni(t), [t]);
  const [llibreActiu, setLlibreActiu] = useState(() => (
    llibreInicial && LLIBRES_BIBLIOTECA_AGRICOLA.some((l) => l.id === llibreInicial)
      ? llibreInicial
      : llibreDeConsulta(search, 'llavors')
  ));
  const [varietatPendent, setVarietatPendent] = useState(null);

  const cataleg = useLaminesBotaniquesNode0(llibreActiu === 'llavors');
  const model = useMemo(() => ({
    status: 'ready',
    canAutoSelect: () => false,
    categories: FONTS_BANC_LLAVORS.map((font) => ({
      id: font.id,
      label: font.autoria,
      count: entradesDelCataleg(font.id).length
    })),
    items: FONTS_BANC_LLAVORS.flatMap((font) => entradesDelCataleg(font.id).map((entrada) => {
      const lamina = cataleg?.obteLaminaBotanicaNode0(entrada.id);
      return {
        id: entrada.id,
        title: entrada.nom,
        subtitle: entrada.nomCientific,
        categoryIds: [font.id],
        glyph: '🌱',
        ...(lamina?.imatgePrincipal ? {
          imageUrl: lamina.imatgePrincipal,
          imageAlt: `${entrada.nom} (${entrada.nomCientific}) · làmina botànica Node 0`
        } : null),
        lead: font.autoria,
        entrada,
        font,
        searchText: [entrada.nom, entrada.nomCientific, font.autoria].join(' ')
      };
    }))
  }), [cataleg]);

  return (
    <div className="sdp-workspace-llibres">
      <div
        className="sdp-workspace-llibres__barra"
        role="tablist"
        aria-label="Llibres de la Biblioteca Agrícola i Banc de Llavors"
      >
        {LLIBRES_BIBLIOTECA_AGRICOLA.map((llibre) => {
          const actiu = llibreActiu === llibre.id;
          return (
            <button
              key={llibre.id}
              id={`${baseId}-tab-${llibre.id}`}
              type="button"
              role="tab"
              aria-selected={actiu}
              aria-controls={`${baseId}-panel-${llibre.id}`}
              className="sdp-workspace-llibres__tab"
              onClick={() => setLlibreActiu(llibre.id)}
            >
              <span className="sdp-fitxa-emoji-xl" aria-hidden="true">{llibre.emoji}</span>
              <span>{llibre.etiqueta}</span>
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
            model={model}
            labels={{ categories: 'Catàlegs', items: 'Varietats', all: 'Tots els catàlegs' }}
            renderDetail={({ item, onClose, onTriaItem }) => {
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
                      />
                    </div>
                    <section className="sdp-cataleg-workspace__font" key={item.font.id}>
                      <h3>{item.font.autoria}</h3>
                      <FitxaDeLaFont font={item.font} tr={tr} />
                    </section>
                    {children}
                  </PaginaVarietatLlavors>
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
                      <FitxaDeLaFont font={font} tr={tr} />
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
            <Suspense fallback={<p role="status">Carregant el calendari agrícola…</p>}>
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
            <Suspense fallback={<p role="status">Carregant el visor 3D del Pou de la Neu…</p>}>
              <PouDeLaNeuAnatomiaCard />
            </Suspense>
            {children}
          </TextSection>
        ) : null}
      </div>
    </div>
  );
}
