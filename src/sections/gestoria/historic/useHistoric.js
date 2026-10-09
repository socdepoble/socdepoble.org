/**
 * useHistoric.js — l'estat de la vista «Històric i IA» de la Gestoria: la
 * porta del tractor 'gestoria.historic', la lectura dels extractes, les
 * regles i les reclassificacions de la persona, els paràmetres de la
 * simulació i tot el que se'n deriva (sèrie, indicadors, simulació,
 * escenari).
 *
 * Onada 6, ordre del Mestre (261009). La porta és la de sempre (useTractors)
 * i l'aprovació es llig just abans de cada lectura (contextAprovacio), mai
 * de memòria; executaTractorHistoric la torna a exigir abans de tocar cap
 * fitxer (fail-closed). Com al Tauler (useTauler.js): `generacio` canvia a
 * cada lectura bona i a cada oblit; una lectura nova, una crida programàtica
 * a `llig`, `oblida` i el desmuntatge cancel·len l'anterior.
 *
 * LA LECTURA viu NOMÉS en la memòria d'este hook. Els fitxers triats es
 * guarden en memòria (no els bytes: la referència del selector) per a poder
 * «tornar a llegir» amb regles noves; «Oblida» els deixa anar.
 *
 * LA PERSISTÈNCIA és injectable: `persistencia` = { llig(): Promise<object|null>,
 * desa(dades): Promise<void>, subscriu?(fn) }. Sense, tot viu en memòria. Només
 * s'hi desa la configuració de la persona (regles, reclassificacions per id
 * opac, paràmetres, suposicions i escenari), mai la lectura del banc. Un canvi
 * fet abans que arribe la configuració desada no es perd: s'hi torna a aplicar
 * damunt.
 * EL COFRE (integració de l'Onada 6, 261009): la vista hi passa
 * persistenciaDelCofre(cofre, 'historic'), que porta `subscriu`. Amb el cofre
 * bloquejat, llegir dona COFRE_BLOQUEJAT: no és cap error, la configuració
 * espera (`persistenciaBloquejada`). Cada obertura ({ estat: 'obert' }) la
 * torna a llegir. Cada bloqueig ({ estat: 'bloquejat' }, també l'automàtic)
 * BUIDA tot el que és desxifrat o se'n deriva: la configuració, la lectura
 * del banc (i els fitxers triats), els errors i qualsevol lectura o desament
 * en curs; res de buit es desa mai damunt de la configuració desada.
 * LA SIMULACIÓ rep la cobertura de cada trimestre de la sèrie: un trimestre
 * sense extractes no té ni 303 ni 130.
 * Proves: el magatzem, subtle, el catàleg, l'entorn, el rellotge, avui i la
 * persistència s'injecten.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { contextAprovacio, useTractors } from '../../tractors/useTractors.js';
import { IDS_CATEGORIES, proveidorDe, validaRegla } from '../despeses/nucli/categories.js';
import { indicadors, rangPerDefecte, serieHistorica } from '../despeses/nucli/serieHistorica.js';
import {
  CAMPS_PARAMETRES, aplicaEscenari, comparaEscenari, parametresDe, provisioDe, simula, validaParametres
} from '../impostos/nucli/simulacio.js';
import { TRACTOR_HISTORIC } from '../tractors.js';
import { operacionsDelBanc, supositsDe } from './nucli/operacions.js';
import { executaTractorHistoric } from './nucli/tractorHistoric.js';

/** La versió de les dades que es passen a la persistència. */
export const VERSIO_CONFIGURACIO = 1;
const ESTAT_BUIT = Object.freeze({ llegint: false, error: null, lectura: null, llegit: null, generacio: 0 });
export const CONFIGURACIO_BUIDA = Object.freeze({
  regles: Object.freeze([]), reclassificacions: Object.freeze({}), parametres: Object.freeze({}), suposits: Object.freeze({}),
  escenari: Object.freeze({ facturacio: 0, despesaIa: 0 })
});
const CLAUS_PARAMETRES = Object.freeze(CAMPS_PARAMETRES.map((c) => c.clau));
const missatgeDe = (error) => error?.message ?? String(error);
const esObjecte = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const percentValid = (x) => typeof x === 'number' && Number.isFinite(x) && x >= -100 && x <= 1000;

/**
 * La configuració que torna la persistència, comprovada: el que no és vàlid
 * es descarta, i una configuració d'una altra versió no s'aplica.
 * @param {unknown} dades
 * @returns {object} la configuració neta
 */
export function configuracioNeta(dades) {
  if (!esObjecte(dades) || dades.versio !== VERSIO_CONFIGURACIO) return CONFIGURACIO_BUIDA;
  const regles = Array.isArray(dades.regles) ? dades.regles.filter((r) => validaRegla(r).length === 0)
    .map((r) => ({ patro: String(r.patro), categoria: r.categoria, proveidor: r.proveidor ?? null })) : [];
  const reclassificacions = {};
  if (esObjecte(dades.reclassificacions)) {
    for (const [id, canvi] of Object.entries(dades.reclassificacions)) {
      if (/^m[0-9a-f]{8}(?:-\d+)?$/.test(id) && esObjecte(canvi) && IDS_CATEGORIES.includes(canvi.categoria)
        && (canvi.proveidor == null || proveidorDe(canvi.proveidor))) {
        reclassificacions[id] = { categoria: canvi.categoria, proveidor: canvi.proveidor ?? null };
      }
    }
  }
  const parametres = {};
  if (esObjecte(dades.parametres)) {
    for (const [any, propis] of Object.entries(dades.parametres)) {
      if (!/^\d{4}$/.test(any) || !esObjecte(propis)) continue;
      const bons = Object.fromEntries(Object.entries(propis).filter(([clau, valor]) => CLAUS_PARAMETRES.includes(clau)
        && validaParametres({ [clau]: valor }).length === 0));
      if (Object.keys(bons).length) parametres[any] = bons;
    }
  }
  const escenari = esObjecte(dades.escenari) ? {
    facturacio: percentValid(dades.escenari.facturacio) ? dades.escenari.facturacio : 0,
    despesaIa: percentValid(dades.escenari.despesaIa) ? dades.escenari.despesaIa : 0
  } : CONFIGURACIO_BUIDA.escenari;
  return { regles, reclassificacions, parametres, suposits: esObjecte(dades.suposits) ? { ...supositsDe(dades.suposits) } : {}, escenari };
}

/* El dia d'avui { a, m, d }. */
function diaDe(ms) {
  const data = new Date(ms);
  return Number.isNaN(data.getTime()) ? null : { a: data.getFullYear(), m: data.getMonth() + 1, d: data.getDate() };
}

/**
 * @param {{ magatzem?: object, subtle?: SubtleCrypto, tractors?: object[], entorn?: object, rellotge?: () => number,
 *   avui?: { a: number, m: number, d: number }, persistencia?: { llig: () => Promise<object|null>, desa: (d: object) => Promise<void>,
 *   subscriu?: (fn: (canvi: { estat: string }) => void) => () => void } }} [opcions]
 */
export function useHistoric({ magatzem, subtle, tractors, entorn, rellotge, avui, persistencia } = {}) {
  const porta = useTractors({ magatzem, subtle, tractors, entorn, rellotge });
  const fila = porta.tractors.find((t) => t.id === TRACTOR_HISTORIC.id) ?? null;
  const [estat, setEstat] = useState(ESTAT_BUIT);
  const [configuracio, setConfiguracio] = useState(CONFIGURACIO_BUIDA);
  const [errorPersistencia, setErrorPersistencia] = useState(null);
  /* La persistència és un cofre bloquejat: res no s'hi llig ni s'hi desa fins que s'obri. */
  const [persistenciaBloquejada, setPersistenciaBloquejada] = useState(() => typeof persistencia?.subscriu === 'function');
  /* Canvia quan arriba la configuració desada: els camps no controlats s'hi tornen a pintar. */
  const [carregada, setCarregada] = useState(0);
  const [hui] = useState(() => avui ?? diaDe(typeof rellotge === 'function' ? rellotge() : Date.now()));
  const torn = useRef(0);
  const lecturaActiva = useRef(null);
  const darrersFitxers = useRef(null);
  const configuracioLlegida = useRef(!persistencia);
  /* Els canvis de la persona d'abans que arribe la configuració desada: s'hi tornen a aplicar damunt, no es perden. */
  const canvisAbansDeLlegir = useRef([]);
  const pendentDeDesar = useRef(false);
  /* El torn de la lectura de la configuració: un bloqueig o una lectura nova descarten la d'abans. */
  const tornConfiguracio = useRef(0);

  /* El bloqueig del cofre: tot el que és desxifrat o se'n deriva fora de la memòria, i cap desament pendent. */
  const buida = useCallback(() => {
    tornConfiguracio.current += 1;
    torn.current += 1;
    lecturaActiva.current?.abort();
    lecturaActiva.current = null;
    darrersFitxers.current = null;
    configuracioLlegida.current = false;
    canvisAbansDeLlegir.current = [];
    pendentDeDesar.current = false;
    setConfiguracio(CONFIGURACIO_BUIDA);
    setErrorPersistencia(null);
    setEstat({ ...ESTAT_BUIT, generacio: torn.current });
    setPersistenciaBloquejada(true);
    setCarregada((n) => n + 1);
  }, []);

  /* La configuració desada, si n'hi ha persistència: una lectura en muntar i, amb el cofre, una altra a cada obertura. */
  useEffect(() => {
    if (!persistencia || typeof persistencia.llig !== 'function') return undefined;
    let viu = true;
    const llegix = () => {
      const meu = ++tornConfiguracio.current;
      Promise.resolve().then(() => persistencia.llig()).then((dades) => {
        if (!viu || meu !== tornConfiguracio.current) return;
        const pendents = canvisAbansDeLlegir.current;
        canvisAbansDeLlegir.current = [];
        configuracioLlegida.current = true;
        if (pendents.length) pendentDeDesar.current = true;
        setPersistenciaBloquejada(false);
        setConfiguracio(pendents.reduce((conf, canvi) => ({ ...conf, ...canvi(conf) }), configuracioNeta(dades)));
        setCarregada((n) => n + 1);
      }, (error) => {
        if (!viu || meu !== tornConfiguracio.current) return;
        /* El cofre bloquejat no és cap error: la configuració espera la pròxima obertura. */
        if (error?.codi === 'COFRE_BLOQUEJAT') {
          setPersistenciaBloquejada(true);
          return;
        }
        configuracioLlegida.current = true;
        setErrorPersistencia(`No s’ha pogut llegir la configuració desada: ${missatgeDe(error)}`);
      });
    };
    const deixa = typeof persistencia.subscriu === 'function' ? persistencia.subscriu((canvi) => {
      if (!viu) return;
      if (canvi?.estat === 'bloquejat') buida();
      else if (canvi?.estat === 'obert') {
        setPersistenciaBloquejada(false);
        llegix();
      }
    }) : null;
    llegix();
    return () => {
      viu = false;
      if (typeof deixa === 'function') deixa();
    };
  }, [persistencia, buida]);

  useEffect(() => () => {
    torn.current += 1;
    lecturaActiva.current?.abort();
    lecturaActiva.current = null;
  }, []);

  /* Cada canvi de la persona es desa (si hi ha persistència), mai abans d'haver llegit la desada
     ni en llegir-la: només els canvis fets amb canviaConfiguracio. */
  const canviaConfiguracio = useCallback((canvi) => {
    pendentDeDesar.current = true;
    if (!configuracioLlegida.current) canvisAbansDeLlegir.current.push(canvi);
    setConfiguracio((previ) => ({ ...previ, ...canvi(previ) }));
  }, []);
  useEffect(() => {
    if (!pendentDeDesar.current || !configuracioLlegida.current) return;
    pendentDeDesar.current = false;
    if (!persistencia || typeof persistencia.desa !== 'function') return;
    let viu = true;
    Promise.resolve().then(() => persistencia.desa({ versio: VERSIO_CONFIGURACIO, ...configuracio })).then(
      () => { if (viu) setErrorPersistencia(null); },
      (error) => { if (viu) setErrorPersistencia(`No s’ha pogut desar la configuració: ${missatgeDe(error)}`); }
    );
    return () => { viu = false; };
  }, [configuracio, persistencia]);

  const regles = configuracio.regles;
  const llig = useCallback(async (fitxers) => {
    /* Amb el cofre bloquejat no es llig cap extracte. La porta ja amaga el selector; ací es
       fa cert també per si mai es tornara a pintar fora (Onada 6, revisió de seguretat). */
    if (persistenciaBloquejada) return;
    const meu = ++torn.current;
    lecturaActiva.current?.abort();
    const controlador = new AbortController();
    lecturaActiva.current = controlador;
    darrersFitxers.current = fitxers && typeof fitxers.length === 'number' && fitxers.length ? Array.from(fitxers) : null;
    setEstat((previ) => ({ ...previ, llegint: true, error: null }));
    try {
      const aprovacio = await contextAprovacio(TRACTOR_HISTORIC.id, { magatzem, subtle, tractors, entorn, rellotge });
      const lectura = await executaTractorHistoric({ fitxers, aprovacio, subtle, regles, signal: controlador.signal });
      const ara = typeof rellotge === 'function' ? rellotge() : Date.now();
      if (meu === torn.current) setEstat({ llegint: false, error: null, lectura, llegit: ara, generacio: meu });
    } catch (error) {
      if (meu === torn.current) setEstat((previ) => ({ ...previ, llegint: false, error: missatgeDe(error) }));
    } finally {
      if (lecturaActiva.current === controlador) lecturaActiva.current = null;
    }
  }, [magatzem, subtle, tractors, entorn, rellotge, regles, persistenciaBloquejada]);

  const tornaALlegir = useCallback(() => (darrersFitxers.current ? llig(darrersFitxers.current) : Promise.resolve()), [llig]);

  const oblida = useCallback(() => {
    torn.current += 1;
    lecturaActiva.current?.abort();
    lecturaActiva.current = null;
    darrersFitxers.current = null;
    setEstat({ ...ESTAT_BUIT, generacio: torn.current });
  }, []);

  const afegixRegla = useCallback((regla) => {
    const errors = validaRegla(regla);
    if (errors.length) return errors;
    canviaConfiguracio((previ) => ({ regles: [...previ.regles, { patro: String(regla.patro).trim(), categoria: regla.categoria, proveidor: regla.proveidor ?? null }] }));
    return [];
  }, [canviaConfiguracio]);
  const llevaRegla = useCallback((index) => {
    canviaConfiguracio((previ) => ({ regles: previ.regles.filter((_, i) => i !== index) }));
  }, [canviaConfiguracio]);
  /* Diverses reclassificacions de colp: [{ id, canvi }] (canvi null desfà la del moviment). */
  const reclassificaMoviments = useCallback((llista) => {
    const valides = (Array.isArray(llista) ? llista : []).filter((r) => typeof r?.id === 'string');
    if (!valides.length) return;
    canviaConfiguracio((previ) => {
      const nou = { ...previ.reclassificacions };
      for (const { id, canvi } of valides) {
        if (canvi && IDS_CATEGORIES.includes(canvi.categoria)
          && (canvi.proveidor == null || proveidorDe(canvi.proveidor))) nou[id] = { categoria: canvi.categoria, proveidor: canvi.proveidor ?? null };
        else delete nou[id];
      }
      return { reclassificacions: nou };
    });
  }, [canviaConfiguracio]);
  const reclassificaMoviment = useCallback((id, canvi) => reclassificaMoviments([{ id, canvi }]), [reclassificaMoviments]);
  const canviaParametre = useCallback((any, clau, valor) => {
    if (validaParametres({ [clau]: valor }).length) return false;
    canviaConfiguracio((previ) => ({ parametres: { ...previ.parametres, [any]: { ...(previ.parametres[any] ?? {}), [clau]: valor } } }));
    return true;
  }, [canviaConfiguracio]);
  const restauraParametres = useCallback((any) => {
    canviaConfiguracio((previ) => {
      const nous = { ...previ.parametres };
      delete nous[any];
      return { parametres: nous };
    });
  }, [canviaConfiguracio]);
  const canviaSuposit = useCallback((clau, valor) => {
    canviaConfiguracio((previ) => ({ suposits: { ...supositsDe({ ...previ.suposits, [clau]: valor }) } }));
  }, [canviaConfiguracio]);
  const canviaEscenari = useCallback((clau, valor) => {
    if (!['facturacio', 'despesaIa'].includes(clau) || !percentValid(valor)) return false;
    canviaConfiguracio((previ) => ({ escenari: { ...previ.escenari, [clau]: valor } }));
    return true;
  }, [canviaConfiguracio]);

  /* Tot el que se'n deriva, recalculat només quan canvia la lectura o la configuració. */
  const rang = useMemo(() => rangPerDefecte(hui), [hui]);
  const serie = useMemo(() => (estat.lectura
    ? serieHistorica({ lectura: estat.lectura, rang, reclassificacions: configuracio.reclassificacions }) : null),
  [estat.lectura, rang, configuracio.reclassificacions]);
  const suposits = useMemo(() => supositsDe(configuracio.suposits), [configuracio.suposits]);
  const derivats = useMemo(() => {
    if (!serie) return { banc: null, simulacio: null, escenari: null, comparacio: null, indicadors: indicadors({ serie: null }), provisio: null };
    const banc = operacionsDelBanc({ moviments: serie.moviments, suposits, parametresPropis: configuracio.parametres });
    const anys = serie.anys.map((a) => a.any);
    /* La cobertura de cada trimestre: un trimestre sense extractes no té ni 303 ni 130 (mai 0,00 €). */
    const cobertura = Object.fromEntries(serie.trimestres.map((t) => [t.clau, t.cobertura]));
    const simulacio = simula({ operacions: banc.operacions, anys, parametresPropis: configuracio.parametres, cobertura });
    const { facturacio, despesaIa } = configuracio.escenari;
    const ambEscenari = facturacio !== 0 || despesaIa !== 0;
    const escenari = ambEscenari
      ? simula({ operacions: aplicaEscenari(banc.operacions, configuracio.escenari), anys, parametresPropis: configuracio.parametres, cobertura })
      : null;
    const darrer = serie.trimestres[serie.trimestres.length - 1] ?? null;
    const provisio = darrer ? provisioDe(simulacio, { any: darrer.any, t: darrer.t }) : null;
    return {
      banc, simulacio, escenari, comparacio: escenari ? comparaEscenari(simulacio, escenari) : null,
      indicadors: indicadors({ serie, provisio }), provisio
    };
  }, [serie, suposits, configuracio.parametres, configuracio.escenari]);

  return {
    porta, fila, aprovat: fila?.estat === 'aprovat', ...estat, rang, hui, configuracio, carregada, suposits, errorPersistencia, persistenciaBloquejada,
    serie, ...derivats, potTornarALlegir: Boolean(darrersFitxers.current) && !estat.llegint,
    llig, tornaALlegir, oblida, afegixRegla, llevaRegla, reclassificaMoviment, reclassificaMoviments, canviaParametre, restauraParametres, canviaSuposit,
    canviaEscenari, parametresDeLAny: (any) => parametresDe(any, configuracio.parametres[any] ?? null)
  };
}
