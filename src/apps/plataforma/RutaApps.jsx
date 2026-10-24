/**
 * Plataforma d'Apps Enxufables · la ruta /app/*.
 *
 * App.jsx la munta amb <Route path="/app/*" element={<RutaApps />} />, abans
 * de la ruta "/*". Tot es decidix a partir de la URL (Clàusula dels Slugs):
 *   /app                       · el portal (PortalApps);
 *   /app/<id>                  · canonització amb replace a /app/<id>/<entradaPerDefecte>;
 *   /app/<id>/<entrada>/…      · l'app, dins de <Route path="<id>/*">: les seues
 *                                <Routes> són relatives a /app/<id>;
 *   una ruta no segura, una app desconeguda, apagada o sense dret, o una
 *   entrada que no existix · un EstatBuit que ho explica (mai un 404 mut);
 *   l'entrada que una app interna ha retirat (ENTRADES_RETIRADES) · replace
 *                                a la que la substituïx (261024: /app/lector/fonts).
 * El títol de la pestanya és el de l'app i mai s'indexa (useSEO, index: false).
 * La sessió de l'arrel entra a l'app per ContenidorApp: passa la font
 * (useFontSessio, fontSessio.js) a ProveidorApp, i el pont (sessioApp.js) la
 * crida si l'app el demana. L'API pública de les apps (index.js) no importa
 * mai SessionContext ni IdentitatContext (el perquè, a fontSessio.js).
 * T5 (P1-07, 261024) · Els serveis neutrals de l'app (el de notícies, per al
 * Lector) entren pel mateix camí: ContenidorApp els pren de fontServeis.js,
 * que només s'importa ací, i els passa a ProveidorApp.
 */
import { Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from '../../app/contexts/RouterContext';
import { useUIState } from '../../app/contexts/UIContext';
import { RequireAuth } from '../../app/guards/RequireAuth';
import { Carregant } from '../../components/PedraSeca/atoms/estats.jsx';
import { useSEO } from '../../hooks/useSEO';
import { AvisApp, PAGINA_INEXISTENT } from './AvisApp.jsx';
import { ElementExtern } from './ElementExtern.jsx';
import { useEscalfamentMemoriaCau } from './escalfamentMemoriaCau.js';
import { useFontServeis } from './fontServeis.js';
import { useFontSessio } from './fontSessio.js';
import { rutaDeApp, titolDe } from './manifestApp.js';
import { ProveidorApp, useAppAvaluada, useRegistre } from './PlataformaContext.jsx';
import { PortalApps, textDelMotiu } from './PortalApps.jsx';
import { analitzaRuta } from './registreApps.js';

/* Ordre del Mestre (261024, 15:05) · Les entrades que una app interna ha retirat, i on porta ara
   el seu enllaç vell (replace: l'historial no guanya cap pas). El Lector ja no té la pàgina de
   fonts: les fonts viuen a l'arbre de les notícies. Una entrada que no és ací i no existix, l'avís
   de pàgina inexistent de sempre. */
const ENTRADES_RETIRADES = Object.freeze({ lector: Object.freeze({ fonts: 'noticies' }) });

/* La nova entrada d'una retirada, o null. Només d'una app interna i amb claus pròpies. */
function entradaQueLaSubstituix(manifest, slug) {
  if (manifest.origen !== 'interna' || !Object.hasOwn(ENTRADES_RETIRADES, manifest.id)) return null;
  const retirades = ENTRADES_RETIRADES[manifest.id];
  const nova = Object.hasOwn(retirades, slug) ? retirades[slug] : null;
  return nova && manifest.entrades.some((entrada) => entrada.slug === nova) ? nova : null;
}

const TITOL_ESTAT = Object.freeze({
  disabled: 'Esta app no està activada',
  unavailable: 'Esta app no es pot obrir ací',
  unsubscribed: 'Esta app és premium'
});

function GuardaPermis({ permis, children }) {
  if (!permis || permis === 'public') return children;
  return <RequireAuth rol={permis === 'superadmin' ? 'superadmin' : null}>{children}</RequireAuth>;
}

function ContenidorApp({ manifest, entrada }) {
  const registre = useRegistre();
  /* Fase D (261020, tasca 4.1) · L1 · Els títols seguixen la llengua del text, no la demanada. */
  const { language, llenguaDelText = language } = useUIState();
  useSEO({ title: titolDe(manifest.titol, llenguaDelText), index: false });
  const serveis = useFontServeis(manifest);
  /* Una interna o un mòdul (sdp.modul.v1): el component lazy del registre. */
  const Component = manifest.origen === 'externa' ? null : registre.componentDe(manifest.id);
  let contingut = null;
  if (manifest.origen === 'externa') {
    contingut = <ElementExtern manifest={manifest} />;
  } else if (Component) {
    contingut = (
      <Suspense fallback={<Carregant etiqueta="Carregant l’app…" />}>
        <Routes>
          <Route path={`${manifest.id}/*`} element={<Component />} />
        </Routes>
      </Suspense>
    );
  }
  /* La sessió de l'arrel entra a l'app per ací i només per ací: la font
     (fontSessio.js), que el pont crida només si l'app la demana. Els serveis
     (fontServeis.js), també: l'app només els veu per useServeiNoticies.
     Una app amb dades personals (salut, financeres) no es deixa traduir pel
     navegador: la traducció de pàgina envia el text visible a un servei de
     fora (Onada 6, revisió de seguretat de la Gestoria). */
  return (
    <ProveidorApp manifest={manifest} fontSessio={useFontSessio} serveis={serveis}>
      <div className="sdp-app-contenidor" data-sdp-app={manifest.id} translate={manifest.dadesPersonals ? 'no' : undefined}>
        <GuardaPermis permis={manifest.permisos.veure}>
          <GuardaPermis permis={entrada.permis}>{contingut}</GuardaPermis>
        </GuardaPermis>
      </div>
    </ProveidorApp>
  );
}

export default function RutaApps() {
  const { pathname } = useLocation();
  const { dins, id, trams } = analitzaRuta(pathname);
  const app = useAppAvaluada(trams === null ? null : id);
  const { language, llenguaDelText = language, t } = useUIState();
  useEscalfamentMemoriaCau(); // closca de /app/* sense xarxa (ordre del Mestre, 261007)

  if (!dins) return null;
  if (pathname === '/app/') return <Navigate to="/app" replace />;
  if (trams === null) {
    return <AvisApp titol="Esta adreça no és vàlida">Les adreces de les apps només porten minúscules, xifres i guions.</AvisApp>;
  }
  if (!id) return <PortalApps />;
  if (!app) return <AvisApp titol="No coneixem esta app">Este node no té cap app amb este nom.</AvisApp>;

  const { manifest, estat, motiu } = app;
  if (estat !== 'available') {
    return <AvisApp titol={TITOL_ESTAT[estat]}>{textDelMotiu(motiu, t)}</AvisApp>;
  }
  if (!trams.length) return <Navigate to={rutaDeApp(manifest.id, manifest.entradaPerDefecte)} replace />;

  const entrada = manifest.entrades.find((candidata) => candidata.slug === trams[0]);
  const substituta = entrada ? null : entradaQueLaSubstituix(manifest, trams[0]);
  if (substituta) return <Navigate to={rutaDeApp(manifest.id, substituta)} replace />;
  if (!entrada) {
    return (
      <AvisApp
        titol={PAGINA_INEXISTENT.titol}
        desti={rutaDeApp(manifest.id, manifest.entradaPerDefecte)}
        etiqueta={`Ves a ${titolDe(manifest.titol, llenguaDelText)}`}
      >
        {PAGINA_INEXISTENT.text}
      </AvisApp>
    );
  }
  return <ContenidorApp manifest={manifest} entrada={entrada} />;
}
