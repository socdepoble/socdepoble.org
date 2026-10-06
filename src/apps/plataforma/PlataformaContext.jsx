/**
 * Plataforma d'Apps Enxufables · context i hooks de l'AMFITRIÓ.
 *
 * Sense <ProveidorPlataforma> tot funciona amb el registre del document i amb
 * l'entorn real (import.meta.env, la configuració de l'amfitrió i les
 * preferències de la persona). Les proves munten el proveïdor amb un registre
 * propi i, si cal, amb un entorn fixat. Cap `key` volàtil damunt de les rutes
 * lazy() (el crash de Preact documentat al projecte).
 *
 *   useApps()          · [{ manifest, estat, motiu, personaPotApagar }] en l'ordre del registre
 *   useAppActual()     · el manifest de l'app de la ruta actual si està 'available', o null
 *   useContextApps()   · el context complet dels interruptors, amb les capacitats del backend
 *
 * Este mòdul importa el registre (registreApps.js) i el port del backend:
 * és ascendent de totes les apps, i cap app ni l'API pública (index.js)
 * l'importa (fronteres.test.js). Els contexts que l'app sí que veu (useApp,
 * useInterruptorsApp, el pont de sessió) són a ContextApp.jsx, i ací es
 * reexporten per a la closca i les proves.
 */
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import { useLocation } from '../../app/contexts/RouterContext';
import { useUIState } from '../../app/contexts/UIContext';
import { teCapacitat } from '../../data/backendPort.js';
import { registre as registreDelDocument, analitzaRuta } from './registreApps.js';
import { avaluaApp, esAmaDelDocument, personaPotApagar, sanejaAppsDeclarades } from './interruptors.js';
import { desaAppApagada } from './preferenciesApps.js';
import { EntornContext, produccioDe, teDretDe, usePreferenciesApps } from './ContextApp.jsx';

export {
  ProveidorApp, useApp, useInterruptorsApp, usePreferenciesApps, useSessioDeLEntorn, useSessioDeLaRuta
} from './ContextApp.jsx';

const RegistreContext = createContext(null);

/**
 * `registre`: un registre de creaRegistre (per defecte, el del document).
 * `entorn`: substitucions per a proves ({ produccio, teDret, teCapacitat, amaDelDocument, sessio }).
 *   `sessio`: { estat, esSuperadmin?, marca?, enLinia?, modeProves?, recuperable? }.
 *   Si hi és (un objecte), useSessioApp (sessioApp.js) la pren en lloc de la
 *   instantània de la ruta (fontSessio.js, que llig SessionContext i
 *   IdentitatContext), igual que teDret substituïx el dret real. enLinia,
 *   modeProves i recuperable, si són booleans, fixen també el navegador, el
 *   mode de dades i la sessió desada en el dispositiu.
 */
export function ProveidorPlataforma({ registre, entorn, children }) {
  return (
    <RegistreContext.Provider value={registre || null}>
      <EntornContext.Provider value={entorn || null}>
        {children}
      </EntornContext.Provider>
    </RegistreContext.Provider>
  );
}

export function useRegistre() {
  return useContext(RegistreContext) || registreDelDocument;
}

/**
 * El context dels interruptors (interruptors.js). En desenvolupament
 * (import.meta.env.DEV) tot dret premium es presenta concedit, per a poder
 * provar-ho; en producció cap, fins que la capa de poble (servidor) el servisca
 * (produccioDe i teDretDe, el criteri que comparteix amb useInterruptorsApp).
 */
export function useContextApps() {
  const { externalConfig } = useUIState();
  const entorn = useContext(EntornContext);
  const preferencies = usePreferenciesApps();
  const appsAmfitrio = externalConfig?.apps;
  const manageDocumentHead = externalConfig?.manageDocumentHead;
  return useMemo(() => {
    const produccio = produccioDe(entorn);
    return Object.freeze({
      produccio,
      declaradesPerAmfitrio: sanejaAppsDeclarades(appsAmfitrio),
      preferencies,
      teCapacitat: entorn?.teCapacitat || teCapacitat,
      teDret: teDretDe(entorn, produccio),
      amaDelDocument: typeof entorn?.amaDelDocument === 'boolean'
        ? entorn.amaDelDocument
        : esAmaDelDocument({ manageDocumentHead })
    });
  }, [entorn, preferencies, appsAmfitrio, manageDocumentHead]);
}

export function useApps() {
  const registre = useRegistre();
  const llista = useSyncExternalStore(registre.subscriu, registre.llista, registre.llista);
  const ctx = useContextApps();
  return useMemo(() => llista.map((manifest) => {
    const { estat, motiu } = avaluaApp(manifest, ctx);
    return Object.freeze({ manifest, estat, motiu, personaPotApagar: personaPotApagar(manifest, ctx) });
  }), [llista, ctx]);
}

/** L'app avaluada d'un id, o null si el registre no la coneix. */
export function useAppAvaluada(id) {
  const apps = useApps();
  return useMemo(() => apps.find((app) => app.manifest.id === id) || null, [apps, id]);
}

/** El manifest de l'app de la ruta actual, només si es pot obrir i la ruta és segura. */
export function useAppActual() {
  const { pathname } = useLocation();
  const { id, trams } = analitzaRuta(pathname);
  const app = useAppAvaluada(id);
  if (!app || trams === null || app.estat !== 'available') return null;
  return app.manifest;
}

/** La persona apaga (o torna a deixar) una app. */
export function useApagaApp() {
  return useCallback((id, apagada) => { desaAppApagada(id, apagada); }, []);
}
