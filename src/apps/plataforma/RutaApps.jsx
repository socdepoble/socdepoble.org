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
 *   entrada que no existix · un EstatBuit que ho explica (mai un 404 mut).
 * El títol de la pestanya és el de l'app i mai s'indexa (useSEO, index: false).
 */
import { Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from '../../app/contexts/RouterContext';
import { useUIState } from '../../app/contexts/UIContext';
import { RequireAuth } from '../../app/guards/RequireAuth';
import { Carregant } from '../../components/PedraSeca/atoms/estats.jsx';
import { useSEO } from '../../hooks/useSEO';
import { AvisApp, PAGINA_INEXISTENT } from './AvisApp.jsx';
import { ElementExtern } from './ElementExtern.jsx';
import { rutaDeApp, titolDe } from './manifestApp.js';
import { ProveidorApp, useAppAvaluada, useRegistre } from './PlataformaContext.jsx';
import { PortalApps, textDelMotiu } from './PortalApps.jsx';
import { analitzaRuta } from './registreApps.js';

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
  const { language } = useUIState();
  useSEO({ title: titolDe(manifest.titol, language), index: false });
  const Component = manifest.origen === 'interna' ? registre.componentDe(manifest.id) : null;
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
  return (
    <ProveidorApp manifest={manifest}>
      <div className="sdp-app-contenidor" data-sdp-app={manifest.id}>
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
  const { language } = useUIState();

  if (!dins) return null;
  if (pathname === '/app/') return <Navigate to="/app" replace />;
  if (trams === null) {
    return <AvisApp titol="Esta adreça no és vàlida">Les adreces de les apps només porten minúscules, xifres i guions.</AvisApp>;
  }
  if (!id) return <PortalApps />;
  if (!app) return <AvisApp titol="No coneixem esta app">Este node no té cap app amb este nom.</AvisApp>;

  const { manifest, estat, motiu } = app;
  if (estat !== 'available') {
    return <AvisApp titol={TITOL_ESTAT[estat]}>{textDelMotiu(motiu)}</AvisApp>;
  }
  if (!trams.length) return <Navigate to={rutaDeApp(manifest.id, manifest.entradaPerDefecte)} replace />;

  const entrada = manifest.entrades.find((candidata) => candidata.slug === trams[0]);
  if (!entrada) {
    return (
      <AvisApp
        titol={PAGINA_INEXISTENT.titol}
        desti={rutaDeApp(manifest.id, manifest.entradaPerDefecte)}
        etiqueta={`Ves a ${titolDe(manifest.titol, language)}`}
      >
        {PAGINA_INEXISTENT.text}
      </AvisApp>
    );
  }
  return <ContenidorApp manifest={manifest} entrada={entrada} />;
}
