/**
 * Plataforma d'Apps Enxufables · el carregador del cos d'un mòdul
 * (contracte sdp.modul.v1, ADR-2026-12).
 *
 * Un mòdul és una app que no viatja dins del paquet. L'amfitrió el registra
 * amb window.SocDePoble.registraModul(manifest) i el registre
 * (registreApps.js) en fa el component amb carregaCos, que només s'executa
 * quan algú obri /app/<id>/…:
 *   1 · demana el nucli (nucliModuls.js, un tros a banda que el paquet no
 *       paga fins ara) i el deixa llegible a SocDePoble.nucli (host.js);
 *   2 · comprova que el cos (i els estils, si n'hi ha) són del MATEIX origen
 *       que la pàgina: cap codi d'un altre domini entra mai;
 *   3 · injecta <script src integrity crossorigin>: el navegador el baixa i
 *       n'hi comprova la integritat (SRI); res de fetch ni de blob:, que la
 *       CSP del lloc (script-src 'self') no deixaria;
 *   4 · espera que ESTE script, i cap altre, cride
 *       SocDePoble.lliuraCos(id, fabrica) mentre s'executa
 *       (document.currentScript): fabrica(nucli) torna el component.
 * Si no arriba a temps (TEMPS_LIMIT_DEL_COS), si el fitxer no baixa o no
 * casa amb la integritat, o si s'executa sense lliurar res: LazyRouteError,
 * que la ruta explica (RouteErrorBoundary) sense recarregar res. Com tota
 * ruta lazy (lazyRoute.js), la fallada es queda: es torna a provar
 * recarregant la pàgina o retirant i tornant a registrar el mòdul.
 *
 * Cap global escrita: SocDePoble.nucli i lliuraCos els exposa host.js,
 * l'única que escriu window.SocDePoble (tractor-enxufe E4).
 */
import { Fragment, createElement } from 'react';
import { LazyRouteError, esErrorLazy } from './lazyRoute.js';
import { VERSIO_NUCLI } from './contracteNucli.js';

/* El temps límit cobrix un fitxer penjat: una baixada que falla ja la diuen
   `error` i `load`. Compta també mentre el fitxer baixa (un <script> no avisa
   del progrés), i per això és llarg: amb la xarxa d'un poble, un cos gran
   pot tardar, i una baixada bona no ha de caure. */
export const TEMPS_LIMIT_DEL_COS = 120000;

const esComponent = (valor) => typeof valor === 'function'
  || (valor !== null && typeof valor === 'object' && typeof valor.$$typeof === 'symbol');

const comLazy = (error) => (esErrorLazy(error) ? error : new LazyRouteError(error));

/* El cos amb el seu full d'estils dins del mateix arbre: així també arriba
   a un Shadow DOM, on un <link> al <head> del document no hi entraria. */
function ambEstils(Cos, estils) {
  if (!estils) return Cos;
  function CosAmbEstils(props) {
    return createElement(Fragment, null,
      createElement('link', { rel: 'stylesheet', href: estils.href, integrity: estils.integrity, crossOrigin: 'anonymous' }),
      createElement(Cos, props));
  }
  CosAmbEstils.displayName = `AmbEstils(${Cos.displayName || Cos.name || 'Cos'})`;
  return CosAmbEstils;
}

/**
 * Un carregador de mòduls. Les proves en munten un de propi; el de la pàgina
 * és carregadorDelDocument.
 * @param {{ finestra?: Window, importaNucli?: () => Promise<{ NUCLI: object }>, tempsLimit?: number }} opcions
 * @returns {{ carregaCos(manifest): Promise<{ default: Function }>, lliuraCos(id, fabrica): boolean,
 *             nucli(): object|null, oblida(id): void }}
 */
export function creaCarregadorDeModuls({
  finestra = typeof window === 'undefined' ? undefined : window,
  importaNucli = () => import('./nucliModuls.js'),
  tempsLimit = TEMPS_LIMIT_DEL_COS
} = {}) {
  let nucli = null;
  let promesaNucli = null;
  const enCurs = new Map(); // id → la promesa del cos
  const pendents = new Map(); // id → { script, resol, rebutja }

  const asseguraNucli = () => {
    if (!promesaNucli) {
      promesaNucli = Promise.resolve().then(importaNucli).then((modul) => {
        const rebut = modul && modul.NUCLI;
        if (!rebut || !Object.isFrozen(rebut) || rebut.versio !== VERSIO_NUCLI) {
          throw new Error(`El nucli dels mòduls no és el ${VERSIO_NUCLI} congelat.`);
        }
        nucli = rebut;
        return rebut;
      });
    }
    return promesaNucli;
  };

  /* L'URL absoluta d'un recurs, només si és del mateix origen que la pàgina. */
  const delMateixOrigen = (cami) => {
    const location = finestra && finestra.location;
    if (!location || !location.origin || location.origin === 'null') throw new Error('Sense pàgina d’origen, cap mòdul es carrega.');
    const url = new URL(cami, location.href);
    if (url.origin !== location.origin) {
      throw new Error(`El recurs ${url.href} no és del mateix origen que la pàgina (${location.origin}).`);
    }
    return url.href;
  };

  /* Injecta el script del cos i espera que el lliure. */
  const injecta = (id, href, integrity) => new Promise((resol, rebutja) => {
    const doc = finestra.document;
    const script = doc.createElement('script');
    let temporitzador = null;
    let acabat = false;
    const acaba = (accio, valor) => {
      if (acabat) return;
      acabat = true;
      clearTimeout(temporitzador);
      if (pendents.get(id)?.script === script) pendents.delete(id);
      accio(valor);
    };
    pendents.set(id, { script, resol: (component) => acaba(resol, component), rebutja: (error) => acaba(rebutja, error) });
    temporitzador = setTimeout(() => acaba(rebutja, new Error(`El cos de «${id}» no s’ha lliurat en ${tempsLimit} ms.`)), tempsLimit);
    script.addEventListener('error', () => acaba(rebutja, new Error(`El cos de «${id}» no s’ha pogut baixar o no casa amb la seua integritat.`)));
    /* `load` arriba després d'executar-se: si encara espera, el fitxer no ha lliurat res. */
    script.addEventListener('load', () => acaba(rebutja, new Error(`El cos de «${id}» s’ha executat sense cridar lliuraCos.`)));
    script.setAttribute('data-sdp-modul', id);
    script.async = true;
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('integrity', integrity);
    script.setAttribute('src', href);
    (doc.head || doc.documentElement).append(script);
  });

  return Object.freeze({
    /** El component del cos d'un mòdul (per a lazy): { default }, o LazyRouteError. */
    carregaCos(manifest) {
      const id = manifest && manifest.id;
      if (enCurs.has(id)) return enCurs.get(id);
      const promesa = Promise.resolve().then(() => {
        if (!manifest || manifest.origen !== 'modul') throw new Error('Només es carrega el cos d’un mòdul (origen «modul»).');
        const cos = delMateixOrigen(manifest.cos.cami);
        const estils = manifest.estils
          ? Object.freeze({ href: delMateixOrigen(manifest.estils.cami), integrity: manifest.estils.integrity })
          : null;
        return asseguraNucli()
          .then(() => injecta(manifest.id, cos, manifest.cos.integrity))
          .then((Cos) => ({ default: ambEstils(Cos, estils) }));
      }).catch((error) => { throw comLazy(error); });
      enCurs.set(id, promesa);
      return promesa;
    },

    /**
     * El cos d'un mòdul es lliura mentre el seu script s'executa. Només val
     * per a un id que s'està carregant i des del script que s'hi ha injectat;
     * la resta s'ignora (torna false).
     */
    lliuraCos(id, fabrica) {
      const pendent = pendents.get(id);
      const doc = finestra && finestra.document;
      if (!pendent || !doc || doc.currentScript !== pendent.script) return false;
      if (typeof fabrica !== 'function') {
        pendent.rebutja(new Error(`lliuraCos(«${id}»): la fàbrica ha de ser una funció.`));
        return false;
      }
      let component;
      try {
        component = fabrica(nucli);
      } catch (error) {
        pendent.rebutja(error);
        return false;
      }
      if (!esComponent(component)) {
        pendent.rebutja(new Error(`lliuraCos(«${id}»): la fàbrica no ha tornat cap component.`));
        return false;
      }
      pendent.resol(component);
      return true;
    },

    /** El nucli congelat, o null si cap mòdul no l'ha demanat encara. */
    nucli: () => nucli,

    /** Oblida el cos d'un mòdul retirat: si es torna a registrar, es torna a carregar. */
    oblida(id) {
      enCurs.delete(id);
    }
  });
}

/** El carregador de la pàgina. */
export const carregadorDelDocument = creaCarregadorDeModuls();
