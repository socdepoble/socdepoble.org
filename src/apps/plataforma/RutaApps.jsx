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
 * La sessió de l'arrel entra a l'app per ContenidorApp: passa la font
 * (useFontSessio, fontSessio.js) a ProveidorApp, i el pont (sessioApp.js) la
 * crida si l'app el demana. L'API pública de les apps (index.js) no importa
 * mai SessionContext ni IdentitatContext (el perquè, a fontSessio.js).
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
import { useFontSessio } from './fontSessio.js';
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
     (fontSessio.js), que el pont crida només si l'app la demana.
     Una app amb dades personals (salut, financeres) no es deixa traduir pel
     navegador: la traducció de pàgina envia el text visible a un servei de
     fora (Onada 6, revisió de seguretat de la Gestoria). */
  return (
    <ProveidorApp manifest={manifest} fontSessio={useFontSessio}>
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
  const { language } = useUIState();
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
