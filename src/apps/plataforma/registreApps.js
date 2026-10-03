/**
 * Plataforma d'Apps Enxufables · el registre.
 *
 *   APPS_INTERNES       · els manifests de src/apps/<id>/manifest.js, validats.
 *   registraAppExterna  · un amfitrió (WordPress, Sollutia) registra una app
 *                         declarativa (`element`) sense tocar el nucli.
 *   subscriu / llista   · per a useSyncExternalStore: la llista és una
 *                         instantània congelada que només canvia quan canvia el registre.
 *   appDeRuta           · el manifest de /app/<id>/…, o null.
 *   entradaActiva       · l'entrada de la barra lateral que mana a eixa ruta, o null.
 *
 * creaRegistre({ internes }) fa un registre nou (les proves en munten un de
 * propi amb ProveidorPlataforma); `registre` és el del document.
 * Una app interna invàlida no tomba l'App: queda fora i ho diu la consola
 * (registreApps.test.js la posa en roig abans que arribe a ningú).
 */
import { lazy } from 'react';
import manifestBar from '../bar/manifest.js';
import manifestSalut from '../salut/manifest.js';
import manifestNevera from '../nevera/manifest.js';
import manifestLector from '../lector/manifest.js';
import { esIdApp, validaManifestApp } from './manifestApp.js';
import { tramsSegurs } from './rutesAplicacio.js';

/** Les apps internes, en l'ordre del portal. */
export const MANIFESTS_INTERNS = Object.freeze([manifestBar, manifestSalut, manifestNevera, manifestLector]);

function validaInternes(manifests) {
  const valides = [];
  for (const cru of manifests) {
    const { ok, errors, manifest } = validaManifestApp(cru, { origen: 'interna' });
    if (ok && !valides.some((app) => app.id === manifest.id)) valides.push(manifest);
    else console.error('[apps] Manifest intern invàlid, queda fora del registre:', cru?.id, errors.length ? errors : ['id repetit']);
  }
  return Object.freeze(valides);
}

export const APPS_INTERNES = validaInternes(MANIFESTS_INTERNS);

/**
 * Analitza una ruta de l'app (sense base, com la dóna useLocation).
 * @returns {{ dins: boolean, id: string|null, trams: string[]|null }}
 *   dins: és /app o hi penja; id: el primer tram (si n'hi ha);
 *   trams: els trams després de l'id, o null si la ruta no és segura.
 */
export function analitzaRuta(pathname) {
  const cami = typeof pathname === 'string' ? pathname : '';
  if (cami !== '/app' && !cami.startsWith('/app/')) return Object.freeze({ dins: false, id: null, trams: null });
  const trams = tramsSegurs(cami.slice('/app'.length));
  if (trams === null) {
    const primer = cami.split('/')[2] || null;
    return Object.freeze({ dins: true, id: primer, trams: null });
  }
  return Object.freeze({ dins: true, id: trams[0] || null, trams: Object.freeze(trams.slice(1)) });
}

/** L'entrada de la barra lateral que mana a eixa ruta: el primer tram després de l'id. */
export function entradaActiva(app, pathname) {
  if (!app) return null;
  const { id, trams } = analitzaRuta(pathname);
  if (id !== app.id || !trams || !trams.length) return null;
  return app.entrades.find((entrada) => entrada.slug === trams[0]) || null;
}

/** `internes`: manifests crus (com els de src/apps/<id>/manifest.js); sense, els del paquet. */
export function creaRegistre({ internes } = {}) {
  const propies = internes === undefined ? APPS_INTERNES : validaInternes(internes);
  const externes = new Map();
  const components = new Map();
  const oients = new Set();
  let instantania = propies;

  const avisa = () => {
    instantania = Object.freeze([...propies, ...externes.values()]);
    for (const oient of [...oients]) oient();
  };

  const appPerId = (id) => instantania.find((app) => app.id === id) || null;

  return Object.freeze({
    llista: () => instantania,
    subscriu(oient) {
      oients.add(oient);
      return () => { oients.delete(oient); };
    },
    appPerId,
    appDeRuta(pathname) {
      const { id } = analitzaRuta(pathname);
      return id ? appPerId(id) : null;
    },
    /** @returns {{ ok: boolean, errors: string[], manifest: object|null }} */
    registraAppExterna(cru) {
      const resultat = validaManifestApp(cru, { origen: 'externa' });
      if (!resultat.ok) return resultat;
      if (appPerId(resultat.manifest.id)) {
        return { ok: false, errors: [`id: ja hi ha una app «${resultat.manifest.id}»`], manifest: null };
      }
      externes.set(resultat.manifest.id, resultat.manifest);
      avisa();
      return resultat;
    },
    /** Només les externes es poden retirar: les internes són del paquet. */
    retiraAppExterna(id) {
      if (!externes.delete(id)) return false;
      avisa();
      return true;
    },
    /** El component lazy d'una app interna, un per id (no es recrea mai). */
    componentDe(id) {
      const app = appPerId(id);
      if (!app || app.origen !== 'interna' || typeof app.carrega !== 'function') return null;
      if (!components.has(id)) components.set(id, lazy(app.carrega));
      return components.get(id);
    }
  });
}

/** El registre del document. */
export const registre = creaRegistre();

export const registraAppExterna = (manifest) => registre.registraAppExterna(manifest);
export const retiraAppExterna = (id) => registre.retiraAppExterna(id);
export const subscriu = (oient) => registre.subscriu(oient);
export const llistaApps = () => registre.llista();
export const appDeRuta = (pathname) => registre.appDeRuta(pathname);
export { esIdApp };
