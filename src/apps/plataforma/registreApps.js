/**
 * Plataforma d'Apps Enxufables · el registre.
 *
 *   APPS_INTERNES       · els manifests de src/apps/<id>/manifest.js, validats.
 *   registraAppExterna  · un amfitrió (WordPress, Sollutia) registra una app
 *                         declarativa (`element`) sense tocar el nucli.
 *   registraModul       · un amfitrió registra un mòdul (sdp.modul.v1,
 *                         ADR-2026-12): una app compilada a banda, el cos de
 *                         la qual carregaModul.js porta quan s'obri.
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
import { lazyRoute } from './lazyRoute.js';
import manifestBar from '../bar/manifest.js';
import manifestSalut from '../salut/manifest.js';
import manifestNevera from '../nevera/manifest.js';
import manifestLector from '../lector/manifest.js';
/* Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
   Gestoria i Wiki»): la Gestoria ix de la Wiki i és una app més, només en
   desenvolupament (el seu manifest). */
import manifestGestoria from '../gestoria/manifest.js';
import { carregadorDelDocument } from './carregaModul.js';
import { VERSIO_NUCLI, nucliSatisfa } from './contracteNucli.js';
import { esIdApp, validaManifestApp } from './manifestApp.js';
import { tramsSegurs } from './rutesAplicacio.js';

/** Les apps internes, en l'ordre del portal. */
export const MANIFESTS_INTERNS = Object.freeze([manifestBar, manifestSalut, manifestNevera, manifestLector, manifestGestoria]);

/* Els ids de les apps amb dades sensibles, i les dades que hi van lligades.
   La guarda de document propi (interruptors.js) depén del dadesPersonals
   del manifest, i el d'un mòdul o d'una app externa el posa l'amfitrió que
   el registra: amb un d'estos ids l'ha de declarar igual, mai més fluix. La
   reserva es conserva encara que l'app isca de les internes (fase 2 de
   l'ADR-2026-12). */
export const DADES_RESERVADES = Object.freeze({ gestoria: 'financeres', salut: 'salut' });

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

/**
 * `internes`: manifests crus (com els de src/apps/<id>/manifest.js); sense, els del paquet.
 * `carregador`: el dels mòduls (carregaModul.js); sense, el de la pàgina.
 */
export function creaRegistre({ internes, carregador = carregadorDelDocument } = {}) {
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

  /* Una app de l'amfitrió (externa o mòdul), ja validada: mai sobre un id
     ocupat, ni amb unes dades més fluixes que les reservades a eixe id. */
  const afigForana = (resultat) => {
    const { id, dadesPersonals } = resultat.manifest;
    if (appPerId(id)) {
      return { ok: false, errors: [`id: ja hi ha una app «${id}»`], manifest: null };
    }
    if (Object.hasOwn(DADES_RESERVADES, id) && dadesPersonals !== DADES_RESERVADES[id]) {
      return { ok: false, errors: [`dadesPersonals: «${id}» guarda dades ${DADES_RESERVADES[id]} i ho ha de declarar`], manifest: null };
    }
    externes.set(resultat.manifest.id, resultat.manifest);
    avisa();
    return resultat;
  };

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
      return resultat.ok ? afigForana(resultat) : resultat;
    },
    /**
     * Un mòdul (sdp.modul.v1): el manifest, amb el cos i el rang del nucli
     * que necessita. Un rang que este nucli no satisfà no entra.
     * @returns {{ ok: boolean, errors: string[], manifest: object|null }}
     */
    registraModul(cru) {
      const resultat = validaManifestApp(cru, { origen: 'modul' });
      if (!resultat.ok) return resultat;
      if (!nucliSatisfa(resultat.manifest.nucli, VERSIO_NUCLI)) {
        return { ok: false, errors: [`nucli: este nucli és el ${VERSIO_NUCLI} i el mòdul demana ${resultat.manifest.nucli}`], manifest: null };
      }
      return afigForana(resultat);
    },
    /** Només les de l'amfitrió (externes i mòduls) es poden retirar: les internes són del paquet. */
    retiraAppExterna(id) {
      if (!externes.delete(id)) return false;
      components.delete(id);
      carregador.oblida(id);
      avisa();
      return true;
    },
    /** El component lazy d'una app interna o d'un mòdul, un per id (no es recrea mai). */
    componentDe(id) {
      const app = appPerId(id);
      if (!app) return null;
      if (!components.has(id)) {
        if (app.origen === 'interna' && typeof app.carrega === 'function') components.set(id, lazyRoute(app.carrega));
        else if (app.origen === 'modul') components.set(id, lazyRoute(() => carregador.carregaCos(app)));
        else return null;
      }
      return components.get(id);
    }
  });
}

/** El registre del document. */
export const registre = creaRegistre();

export const registraAppExterna = (manifest) => registre.registraAppExterna(manifest);
export const registraModul = (manifest) => registre.registraModul(manifest);
export const retiraAppExterna = (id) => registre.retiraAppExterna(id);
export const subscriu = (oient) => registre.subscriu(oient);
export const llistaApps = () => registre.llista();
export const appDeRuta = (pathname) => registre.appDeRuta(pathname);
export { esIdApp };
