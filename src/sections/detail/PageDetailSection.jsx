import { lazy, Suspense, useState } from 'react';
import { Navigate, useParams } from '../../app/contexts/RouterContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { useUIActions, useUIActionsOpcional } from '../../app/contexts/UIContext';
import { Boto } from '../../components/PedraSeca/index.js';
import { resolvePageSlugPath } from '../../config/navigation';
import { esAppNativa } from '../../config/origenPublic.js';
import { accioAlFinal, accioDeLaPagina, esPaginaVisible } from '../../config/systemPages.js';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { PAGE_COPY } from '../text/pageContent.js';
import TextSection from '../text/TextSection';
import ProveidorProjeccionsCataleg from '../../app/contexts/ProveidorProjeccionsCataleg.jsx';
import NotFoundPage from '../../pages/NotFoundPage';
import { CLAU_PAGINES_IMPORTADES } from '../../data/importacio/destinacionsWorkspaceWp.js';
import { PublicarDeLaPagina } from '../control/PublicarDeLaPagina.jsx';
import { destiDePagina } from '../control/destinsControl.js';
import { InstalaLaPwa, useInstalacioDeLaPagina } from './InstalaLaPwa.jsx';
import { PAGINA_DE_LA_PASTILLA, pastillaDeVersio } from './pastillaDeVersio.js';
import { lazyRoute } from '../../apps/plataforma/lazyRoute.js';
import { usePublicadorsBarraRecurs } from '../../hooks/usePublicadorsBarraRecurs.js';
import { CopublicacioDePaginaContext } from './CopublicacioDePaginaContext.js';

const PAGINA_PUBLICAR_MAPA = 'publicar_mapa';
const PublicarMapaMapaShowcase = lazyRoute(() => import('./PublicarMapaShowcase.jsx').then((m) => ({ default: m.PublicarMapaMapaShowcase })));
const PublicarMapaExempleShowcase = lazyRoute(() => import('./PublicarMapaShowcase.jsx').then((m) => ({ default: m.PublicarMapaExempleShowcase })));
/* T1b (ordre directa del Mestre, 12-11-2026 21:26) · Només els catàlegs de patrimoni obrin un Workspace.
   /page/fediversity ja no n'és cap: és una UniversalPage normal (TextSection), ampla i seguida, amb
   l'aparador al final per la branca comuna de més avall (Llei de Sistematització, sense excepcions per slug).
   Els cinc rols i la portabilitat ja els pinta AparadorFediversity; /page/fediversity/<fitxa> dona 404. */
const WORKSPACES_PATRIMONI = {
  herbari: lazy(() => import('../patrimoni/HerbariWorkspaceSection.jsx')),
  'banc-de-llavors': lazy(() => import('../patrimoni/BancLlavorsWorkspaceSection.jsx')),
  'arbres-monumentals': lazy(() => import('../patrimoni/NaturaPatrimoniWorkspaceSection.jsx')),
  receptes: lazy(() => import('../patrimoni/ReceptesWorkspaceSection.jsx'))
};
const NodrirLaIaiaSection = lazy(() => import('../patrimoni/NodrirLaIaiaSection.jsx'));
const PaginesImportadesSection = lazy(() => import('../text/PaginesImportadesSection.jsx'));
const AparadorFediversity=lazy(()=>import('../text/AparadorFediversity.jsx'));
const PanellTraspasPublicacioInline = lazy(() => import('../admin/PanellTraspasPublicacioInline.jsx'));

function ControlCopublicacioDeCataleg({ recursId, enActualitzar }) {
  const sessio = useSessioOpcional();
  const [obert, setObert] = useState(false);
  if (!sessio?.esSuperadmin || sessio.nivell !== 'aal2') return null;
  return (
    <>
      <div className="sdp-traspas-inline__accions" lang="ca">
        <Boto
          varietat="secundari"
          aria-expanded={obert}
          onClick={() => setObert((actual) => !actual)}
        >
          {obert ? 'Tancar traspàs i co-publicació' : 'Configurar traspàs i co-publicació'}
        </Boto>
      </div>
      {obert ? (
        <Suspense fallback={null}>
          <PanellTraspasPublicacioInline
            recursTipusInicial="pagina"
            recursIdInicial={recursId}
            onRespostaAutoritativa={enActualitzar}
          />
        </Suspense>
      ) : null}
    </>
  );
}
function PaginaPatrimoniCopublicable({ Workspace, slug, itemSlug, page, accioPrincipal, children }) {
  const publicacio = usePublicadorsBarraRecurs(itemSlug ? undefined : { recursTipus: 'pagina', recursId: slug });
  function actualitzaBarra(resposta) {
    if (resposta.recursTipus === 'pagina' && resposta.recursId === slug) publicacio.recarrega();
  }
  const context = itemSlug ? null : { pageKey: slug, publicadorsRegistrats: publicacio.publicadorsRegistrats };
  return (
    <CopublicacioDePaginaContext.Provider value={context}>
      <Workspace page={page} itemSlug={itemSlug || null} accioPrincipal={accioPrincipal} sincronitzaRuta>
        {!itemSlug ? <ControlCopublicacioDeCataleg recursId={slug} enActualitzar={actualitzaBarra} /> : null}
        {children}
      </Workspace>
    </CopublicacioDePaginaContext.Provider>
  );
}

/* R94 · IDEA-171 (decisió D-R11-4 del Mestre, 261107) · El WhatsApp de la IAIA: la targeta del pont
   Hermes + Node 0 i del mapa honest del saber. Va en un chunk lazy i només a /page/node-zero, la pàgina
   del Node 0, davant de l'aparador de Fediversity. El text de PAGE_COPY no canvia. */
const PAGINA_DEL_WHATSAPP_DE_LA_IAIA = 'node-zero';
const IaiaWhatsappCard = lazy(() => import('../../components/patrimoni/IaiaWhatsappCard.jsx'));
/* Onada R9 (carril C5; IDEA-112, IDEA-113 i IDEA-115) · Les consultes de patrimoni, cadascuna en un chunk lazy:
   només es baixen a la seua pàgina, davall del text breu de PAGE_COPY (com l'herbari).
   Onada R14 · /page/receptes, el receptari «Què dinem?»: la llista de les receptes del llibre (les dades,
   src/data/patrimoni/queDinem.js, van dins del seu tros i no arriben a l'entrada). */
const SECCIONS_DE_PATRIMONI = {
  'banc-de-llavors': lazy(() => import('../patrimoni/BancLlavorsSection.jsx')),
  'rutes-de-poble': lazy(() => import('../patrimoni/RutesDePobleSection.jsx')),
  receptes: lazy(() => import('../patrimoni/ReceptesQueDinemSection.jsx'))
};

/* IDEA-109 + IDEA-143 · El visor d'Anatomia Rural és un chunk lazy: només es
   baixa a /page/anatomia-rural.
   P0-45 / IDEA-176 (decisió del Mestre i MarIA, 261107) · Hui la pàgina només
   mostra el visor 3D del Pou de la Neu del Rentonar, l'únic artefacte amb la
   documentació completa (Segura Martí, 1987). El visor general
   (VisorAnatomiaRural3D: almàssera, molí, forn de calç…) ja no es munta ací;
   el component i les seues dades es conserven per a quan tinguen la seua
   documentació.
   P0-51 / IDEA-182 (R53) · Mentre l'àlies de navigation.js porte
   /page/anatomia-rural a l'article complet del Mur, esta branca no s'executa
   (la redirecció va abans); es conserva perquè tornar enrere siga llevar
   només aquella línia de PAGE_ROUTE_MAP. */
const PAGINA_DEL_VISOR = 'anatomia-rural';
const PouDeLaNeuAnatomiaCard = lazy(() => import('../../components/patrimoni/PouDeLaNeuAnatomiaCard.jsx'));

/* El text de càrrega del visor, en la llengua de la interfície (i18n); fora de
   l'app, la reserva en valencià. */
function CarregantElVisor() {
  const t = useUIActionsOpcional()?.t;
  const text = typeof t === 'function' ? t('patrimoni.anatomia.carregant', 'S’està carregant el visor…') : 'S’està carregant el visor…';
  return <span className="sr-only">{text}</span>;
}

/* Ordre del Mestre (261007) · L'acció gran d'una pàgina del sistema
   (accioDeLaPagina de systemPages.js): «Anar al xat» a /page/xat, «Obrir la
   Consola» a /page/consola i «Obrir el Cervell» a /page/cervell. És la porta
   gran i blava de Pedra Seca (PortaDePagina: sdp-boto--primari
   sdp-boto--gran), un Link del router cap al seu destí; a El Xat, la MATEIXA
   de la seua targeta del Mur i del Calendari. Traduïx el verb ací dins:
   només es munta quan la pàgina en té.
   Onada 10 (261010; pla 261010_1121; decisió M2 del Mestre del 261010) ·
   `lloc`, calcat de PublicarDeLaPagina:
    · 'dalt' (per defecte) · la porta sola: PageFrame la posa dins de
      div.page-title-accio (la ranura accioPrincipal). Sense la prop, el DOM
      de sempre;
    · 'baix' · la mateixa porta dins de div.sdp-pagina-accio, després del cos.
   Són dos controls amb el mateix nom que porten al mateix lloc (WCAG 2.4.4).
   El de dalt és dins del bloc del títol i es veu també amb la pàgina
   traduïda; el de baix és dins del cos original, que s'amaga quan es traduïx. */
function AccioDeLaPagina({ clau, lloc = 'dalt' }) {
  const { t } = useUIActions();
  const porta = accioDeLaPagina(clau, t);
  if (!porta) return null;
  if (lloc !== 'baix') return <PortaDePagina porta={porta} />;
  return (
    <div className="sdp-pagina-accio">
      <PortaDePagina porta={porta} />
    </div>
  );
}

/**
 * /page/:slug — pàgines de text sense ruta pròpia.
 *
 * W01 (auditoria Codex 0717): abans llegia un `pageDetailLookup` que
 * CoreContentContext no ha exportat mai; el Map sempre era buit i tota
 * visita acabava redirigida al Mur. Ara, per ordre:
 *   1. slug amb ruta canònica (projecte, legal…) → redirecció a eixa ruta;
 *   2. pàgina del contingut core (o de PAGE_COPY) → TextSection canònica,
 *      amb la mateixa precedència que TextRoute (App.jsx);
 *   3. contingut encara carregant → estat de càrrega, mai una redirecció;
 *   4. res → 404 amb noindex (NotFoundPage), no un salt silenciós al Mur.
 *
 * P6 (directriu 261003_2325, confirmació 4) · Les pàgines de la doble acció
 * del Panell (hui, les de DESTINS_CONTROL) acaben amb el gran botó
 * «Publicar» (PublicarDeLaPagina, pel punt d'extensió `children` de
 * TextSection). La resta, sense res més, fora de les de l'Onada 10 (més
 * avall).
 *
 * T8 (ordre del Mestre, 261004, prompt 261004_0515 §6) · Les pàgines amb
 * destí porten el mateix botó també dalt, davall de l'H1 (accioPrincipal de
 * PageFrame, per TextSection). Es decidix amb destiDePagina(slug), pura, i
 * mai amb l'element: un <PublicarDeLaPagina/> que pinta null és un element
 * vertader, i PageFrame pintaria un div.page-title-accio buit a TOTES les
 * /page/*. El de baix es conserva.
 *
 * Higiene d'amfitrió (ordre del Mestre, 261004, front «amfitrio-admin») ·
 * Derogat per l'ordre del Mestre del 261004: l'efecte que, en canviar de
 * slug, buscava '.app-main' pel document (o pel shadowRoot de
 * <soc-de-poble>) i el pujava a dalt. Era codi mort: .app-main no es
 * desplaça, i App.jsx ja torna a dalt el desplaçador en una navegació de
 * router (preparaRecolocacio). Dins de WordPress, a més, consultava el
 * document de l'amfitrió i obria el shadow root des de fora.
 *
 * Ordre del Mestre (261007) · «El Xat» (/page/xat) porta davall de l'H1 el
 * gran botó «Anar al xat» cap a /xat (accioPrincipal), el mateix de la seua
 * targeta. Com el de Publicar, es decidix amb una funció pura
 * (accioDeLaPagina), mai amb l'element. Tota pàgina del sistema amb acció el
 * porta ací: també la Consola i el Cervell (Onada 8, 261009).
 *
 * Onada 10 (261010; pla 261010_1121; decisió M2 del Mestre del 261010) · A
 * /page/consola i /page/cervell el botó «Obrir…» va DALT I AL FINAL, com les
 * pàgines de Publicar: dins del bloc blanc de l'H1 (header.page-title >
 * div.page-title-accio, la «Decoració de l'H1» de la skill
 * sdp-universal-page) i repetit després dels sis paràgrafs
 * (div.sdp-pagina-accio, l'últim fill de l'article). El del final es decidix
 * amb accioAlFinal(slug), pura. El fill de TextSection continua sent UN sol
 * element: o el botó del final o PublicarDeLaPagina, que en una pàgina sense
 * destí no pinta res. /page/xat no canvia: un sol botó, dalt.
 *
 * P1-69 (ordre del Mestre, 261028 20:13; deroga per a esta pàgina el «sense
 * acció gran» de P1-38, 261026_2126) · /page/descarregues porta «📲
 * Instal·lar l'App (PWA)» DALT I AL FINAL, com la Consola (InstalaLaPwa.jsx).
 * No és cap porta del router (PortaDePagina no pot cridar prompt()): la dada
 * ix d'useInstalacioDeLaPagina, que es crida abans de cap retorn (l'ordre dels
 * hooks) i torna null fora de Descàrregues, a l'app nativa, fora de l'entrada
 * pròpia o quan no hi ha res honest que oferir. Amb null, el DOM de sempre.
 */
export default function PageDetailSection() {
  const { slug = '', itemSlug = '' } = useParams();
  const { pages = [], pageCopy = {}, status } = useCoreContent();
  const instalacio = useInstalacioDeLaPagina(slug);

  const canonica = resolvePageSlugPath(slug);
  if (canonica) return itemSlug ? <NotFoundPage /> : <Navigate to={canonica} replace />;
  // Ordre del Mestre (261027) · Una pàgina només web no s'obri dins de l'app nativa.
  if (!esPaginaVisible(slug, { nativa: esAppNativa() })) return <Navigate to="/" replace />;
  if (itemSlug && !Object.hasOwn(WORKSPACES_PATRIMONI, slug)) return <NotFoundPage />;
  if (slug === CLAU_PAGINES_IMPORTADES) return <Suspense fallback={null}><PaginesImportadesSection /></Suspense>;

  // El slug ve de la URL: només claus pròpies («constructor» no és cap pàgina).
  const propia = (taula) => (Object.hasOwn(taula, slug) ? taula[slug] : null);
  const page = propia(pageCopy)
    || pages.find((p) => p && (String(p.slug) === slug || String(p.id) === slug))
    || propia(PAGE_COPY);
  if (page) {
    let accioPrincipal = null;
    if (destiDePagina(slug)) accioPrincipal = <PublicarDeLaPagina clau={slug} lloc="dalt" />;
    else if (accioDeLaPagina(slug)) accioPrincipal = <AccioDeLaPagina clau={slug} />;
    else if (instalacio) accioPrincipal = <InstalaLaPwa instalacio={instalacio} />;
    let alFinal = <PublicarDeLaPagina clau={slug} />;
    if (accioAlFinal(slug)) alFinal = <AccioDeLaPagina clau={slug} lloc="baix" />;
    else if (instalacio) alFinal = <InstalaLaPwa instalacio={instalacio} lloc="baix" />;
    if (slug === PAGINA_DEL_VISOR) alFinal = <><Suspense fallback={<div role="status" aria-live="polite"><CarregantElVisor /></div>}><PouDeLaNeuAnatomiaCard /></Suspense>{alFinal}</>;
    else if (Object.hasOwn(WORKSPACES_PATRIMONI, slug)) {
      const Workspace = WORKSPACES_PATRIMONI[slug];
      return (
        <Suspense fallback={null}>
          <ProveidorProjeccionsCataleg>
            <PaginaPatrimoniCopublicable key={slug} Workspace={Workspace} slug={slug} itemSlug={itemSlug} page={page} accioPrincipal={accioPrincipal}>
              {alFinal}
            </PaginaPatrimoniCopublicable>
          </ProveidorProjeccionsCataleg>
        </Suspense>
      );
    }
    else if (slug === 'la-iaia-sabuda') alFinal = <><Suspense fallback={null}><NodrirLaIaiaSection /></Suspense>{alFinal}</>;
    else if (Object.hasOwn(SECCIONS_DE_PATRIMONI, slug)) { const Consulta = SECCIONS_DE_PATRIMONI[slug]; alFinal = <><Suspense fallback={null}><Consulta /></Suspense>{alFinal}</>; }
    else if (slug === PAGINA_PUBLICAR_MAPA) {
      alFinal = (
        <>
          <Suspense fallback={null}><PublicarMapaExempleShowcase /></Suspense>
          {alFinal}
        </>
      );
    }
    else if(['fediversity','node-zero'].includes(slug))alFinal=<>{slug === PAGINA_DEL_WHATSAPP_DE_LA_IAIA ? <Suspense fallback={null}><IaiaWhatsappCard /></Suspense> : null}<Suspense fallback={null}><AparadorFediversity/></Suspense>{alFinal}</>;
    const abansIntro = slug === PAGINA_PUBLICAR_MAPA
      ? <Suspense fallback={null}><PublicarMapaMapaShowcase /></Suspense>
      : null;
    /* P1-46 (Fita 10; guàrdia nocturna 261030) · La pastilla de versió de
       Descàrregues, l'última de la fila d'etiquetes, cap a /versions. Es
       passa com a funció del traductor: TextSection és qui té el `t`. A
       qualsevol altra pàgina, cap prop: les etiquetes de sempre. */
    const pastilla = slug === PAGINA_DE_LA_PASTILLA ? (t) => pastillaDeVersio(slug, t) : null;
    return (
      <TextSection
        page={page}
        pageKey={slug}
        accioPrincipal={accioPrincipal}
        {...(abansIntro ? { abansIntro } : null)}
        {...(pastilla ? { etiquetaFinal: pastilla } : null)}
      >
        {alFinal}
      </TextSection>
    );
  }

  if (status !== 'ready' && status !== 'error') {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">S'està carregant el contingut...</span>
      </div>
    );
  }
  return <NotFoundPage />;
}
