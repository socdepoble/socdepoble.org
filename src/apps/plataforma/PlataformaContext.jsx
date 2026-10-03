/**
 * Plataforma d'Apps Enxufables · context i hooks.
 *
 * Sense <ProveidorPlataforma> tot funciona amb el registre del document i amb
 * l'entorn real (import.meta.env, la configuració de l'amfitrió i les
 * preferències de la persona). Les proves munten el proveïdor amb un registre
 * propi i, si cal, amb un entorn fixat. Cap `key` volàtil damunt de les rutes
 * lazy() (el crash de Preact documentat al projecte).
 *
 *   useApps()          · [{ manifest, estat, motiu, personaPotApagar }] en l'ordre del registre
 *   useAppActual()     · el manifest de l'app de la ruta actual si està 'available', o null
 *   useApp()           · DINS d'una app: { manifest, base, ruta(...trams) }
 *   useInterruptorsApp() · DINS d'una app: { avalua(id), actiu(id), apaga(id, apagat) }
 */
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import { useLocation } from '../../app/contexts/RouterContext';
import { useUIState } from '../../app/contexts/UIContext';
import { teCapacitat } from '../../data/backendPort.js';
import { registre as registreDelDocument, analitzaRuta } from './registreApps.js';
import { avaluaApp, avaluaInterruptor, esAmaDelDocument, personaPotApagar, sanejaAppsDeclarades } from './interruptors.js';
import { desaAppApagada, desaInterruptorApagat, llegeixPreferencies, subscriuPreferencies } from './preferenciesApps.js';
import { rutaDeApp } from './manifestApp.js';

const RegistreContext = createContext(null);
const EntornContext = createContext(null);
const AppContext = createContext(null);

const SEMPRE = () => true;
const MAI = () => false;

/**
 * `registre`: un registre de creaRegistre (per defecte, el del document).
 * `entorn`: substitucions per a proves ({ produccio, teDret, teCapacitat, amaDelDocument }).
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

export function usePreferenciesApps() {
  return useSyncExternalStore(subscriuPreferencies, llegeixPreferencies, llegeixPreferencies);
}

/**
 * El context dels interruptors (interruptors.js). En desenvolupament
 * (import.meta.env.DEV) tot dret premium es presenta concedit, per a poder
 * provar-ho; en producció cap, fins que la capa de poble (servidor) el servisca.
 */
export function useContextApps() {
  const { externalConfig } = useUIState();
  const entorn = useContext(EntornContext);
  const preferencies = usePreferenciesApps();
  const appsAmfitrio = externalConfig?.apps;
  const manageDocumentHead = externalConfig?.manageDocumentHead;
  return useMemo(() => {
    const produccio = typeof entorn?.produccio === 'boolean' ? entorn.produccio : !import.meta.env.DEV;
    return Object.freeze({
      produccio,
      declaradesPerAmfitrio: sanejaAppsDeclarades(appsAmfitrio),
      preferencies,
      teCapacitat: entorn?.teCapacitat || teCapacitat,
      teDret: entorn?.teDret || (produccio ? MAI : SEMPRE),
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

/** Proveïdor intern: RutaApps el posa al voltant de cada app. */
export function ProveidorApp({ manifest, children }) {
  const valor = useMemo(() => Object.freeze({
    manifest,
    base: rutaDeApp(manifest.id),
    ruta: (...trams) => rutaDeApp(manifest.id, ...trams)
  }), [manifest]);
  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}

/** Dins d'una app: el seu manifest i el constructor de rutes absolutes. */
export function useApp() {
  const valor = useContext(AppContext);
  if (!valor) throw new Error("useApp s'ha de cridar dins d'una app de la plataforma (/app/<id>)");
  return valor;
}

/** Dins d'una app: els seus interruptors interns (manifest.interruptors). */
export function useInterruptorsApp() {
  const { manifest } = useApp();
  const ctx = useContextApps();
  const avalua = useCallback((id) => avaluaInterruptor(manifest, id, ctx), [manifest, ctx]);
  const actiu = useCallback((id) => avaluaInterruptor(manifest, id, ctx).actiu, [manifest, ctx]);
  const apaga = useCallback((id, apagat) => { desaInterruptorApagat(manifest.id, id, apagat); }, [manifest]);
  return useMemo(() => ({ avalua, actiu, apaga }), [avalua, actiu, apaga]);
}

/** La persona apaga (o torna a deixar) una app. */
export function useApagaApp() {
  return useCallback((id, apagada) => { desaAppApagada(id, apagada); }, []);
}
