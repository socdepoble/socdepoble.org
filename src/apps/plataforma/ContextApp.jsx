/**
 * Plataforma d'Apps Enxufables · el CONTEXT DE L'APP: la meitat dels
 * contexts de la plataforma que l'app veu per l'API pública (index.js).
 *
 * Per què a part de PlataformaContext.jsx (correcció del 261006: desar una
 * vista del Bar tombava l'app en desenvolupament). PlataformaContext importa
 * el registre (registreApps.js, que carrega cada app amb import()) i el port
 * del backend (backendPort.js, que importa host.js amb import(), i host.js
 * el registre): per a Vite, és ASCENDENT de totes les apps i el desa com a
 * invalidat cada vegada que es desa una vista. Quan l'API pública el
 * portava, la vista desada (i qualsevol mòdul de l'app que importara
 * index.js) en carregava una instància nova, amb contexts nous
 * (createContext): React Refresh posava la implementació nova als
 * proveïdors muntats (ProveidorApp, ProveidorBar) i les vistes que no
 * s'havien tornat a executar continuaven llegint els contexts vells
 * («useApp s'ha de cridar dins d'una app», «useBar s'ha de cridar dins de
 * ProveidorBar»). Este mòdul no importa res que arribe a una app: ni el
 * registre, ni el port, ni SessionContext ni IdentitatContext. La porta és
 * fronteres.test.js, sobre tota la clausura de index.js. La meitat de
 * l'amfitrió (el registre, l'avaluació de les apps i les capacitats del
 * backend) es queda a PlataformaContext.jsx, que importa d'ací EntornContext
 * i reexporta estos ganxos.
 *
 *   ProveidorApp          · RutaApps el posa al voltant de cada app: { manifest, fontSessio }
 *   useApp()              · DINS d'una app: { manifest, base, ruta(...trams) }
 *   useInterruptorsApp()  · DINS d'una app: { avalua(id), actiu(id), apaga(id, apagat) }
 *   useSessioDeLEntorn()  · la sessió fixada a l'entorn de proves (entorn.sessio), o null
 *   useSessioDeLaRuta()   · DINS d'una app, només per al pont de sessió: la
 *                           instantània de la font que porta ProveidorApp, o null
 *   usePreferenciesApps() · les preferències de la persona (preferenciesApps.js)
 *   EntornContext, produccioDe(entorn), teDretDe(entorn, produccio)
 *                         · el criteri únic de l'entorn, també per a useContextApps
 */
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import { avaluaInterruptor } from './interruptors.js';
import { desaInterruptorApagat, llegeixPreferencies, subscriuPreferencies } from './preferenciesApps.js';
import { rutaDeApp } from './manifestApp.js';

/** L'entorn de proves de ProveidorPlataforma (PlataformaContext.jsx), o null. */
export const EntornContext = createContext(null);
const AppContext = createContext(null);
const FontSessioContext = createContext(null);

const SEMPRE = () => true;
const MAI = () => false;
/* Sense font de la sessió (una prova que munta ProveidorApp sola): cap sessió. */
const capFont = () => null;

/** Producció: la de l'entorn si és un booleà; si no, la del build (!import.meta.env.DEV). */
export function produccioDe(entorn) {
  return typeof entorn?.produccio === 'boolean' ? entorn.produccio : !import.meta.env.DEV;
}

/**
 * El dret premium: el de l'entorn si en porta; si no, en desenvolupament tot
 * es presenta concedit, per a poder provar-ho, i en producció cap, fins que
 * la capa de poble (servidor) el servisca.
 */
export function teDretDe(entorn, produccio) {
  return entorn?.teDret || (produccio ? MAI : SEMPRE);
}

export function usePreferenciesApps() {
  return useSyncExternalStore(subscriuPreferencies, llegeixPreferencies, llegeixPreferencies);
}

/** La sessió fixada a l'entorn de proves (`entorn.sessio`), o null si no n'hi ha. */
export function useSessioDeLEntorn() {
  const sessio = useContext(EntornContext)?.sessio;
  return sessio !== null && typeof sessio === 'object' ? sessio : null;
}

/**
 * Proveïdor intern: RutaApps el posa al voltant de cada app. `fontSessio`: el
 * ganxo que llig la sessió de l'arrel i en torna la instantània mínima
 * (useFontSessio, fontSessio.js), o null. Es passa el ganxo i no el valor
 * perquè la sessió només la llija qui la demana: una app que no crida mai
 * useSessioApp no toca SessionContext ni IdentitatContext. Va en un context
 * propi, no al de useApp: l'app no el veu mai; només el crida el pont
 * (useSessioDeLaRuta → sessioApp.js). No canvia mai mentre l'app viu.
 */
export function ProveidorApp({ manifest, fontSessio = null, children }) {
  const valor = useMemo(() => Object.freeze({
    manifest,
    base: rutaDeApp(manifest.id),
    ruta: (...trams) => rutaDeApp(manifest.id, ...trams)
  }), [manifest]);
  const font = typeof fontSessio === 'function' ? fontSessio : null;
  return (
    <AppContext.Provider value={valor}>
      <FontSessioContext.Provider value={font}>{children}</FontSessioContext.Provider>
    </AppContext.Provider>
  );
}

/** Dins d'una app: el seu manifest i el constructor de rutes absolutes. */
export function useApp() {
  const valor = useContext(AppContext);
  if (!valor) throw new Error("useApp s'ha de cridar dins d'una app de la plataforma (/app/<id>)");
  return valor;
}

/**
 * La instantània de la sessió de l'arrel, de la font que RutaApps ha passat a
 * ProveidorApp, o null sense font. Només per al pont (sessioApp.js): no és de
 * l'API pública (index.js). La font sempre és la mateixa (o cap), i per això
 * l'ordre dels ganxos no canvia d'un pintat a l'altre.
 */
export function useSessioDeLaRuta() {
  const useFont = useContext(FontSessioContext) || capFont;
  const sessio = useFont();
  return sessio !== null && typeof sessio === 'object' ? sessio : null;
}

/**
 * Dins d'una app: els seus interruptors interns (manifest.interruptors).
 * avaluaInterruptor només mira la producció, les preferències i el dret: el
 * mateix criteri que useContextApps (produccioDe, teDretDe), sense el port.
 */
export function useInterruptorsApp() {
  const { manifest } = useApp();
  const entorn = useContext(EntornContext);
  const preferencies = usePreferenciesApps();
  const ctx = useMemo(() => {
    const produccio = produccioDe(entorn);
    return Object.freeze({ produccio, preferencies, teDret: teDretDe(entorn, produccio) });
  }, [entorn, preferencies]);
  const avalua = useCallback((id) => avaluaInterruptor(manifest, id, ctx), [manifest, ctx]);
  const actiu = useCallback((id) => avaluaInterruptor(manifest, id, ctx).actiu, [manifest, ctx]);
  const apaga = useCallback((id, apagat) => { desaInterruptorApagat(manifest.id, id, apagat); }, [manifest]);
  return useMemo(() => ({ avalua, actiu, apaga }), [avalua, actiu, apaga]);
}
