/**
 * useEscaner.js — l'estat de l'Escàner Local de la Gestoria: la carpeta
 * triada, l'anàlisi del tractor 'gestoria.escaner' i els extractes que es
 * proposen per al Tauler.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front D; mapa D, §3). Es
 * munta una sola vegada a la closca, al costat de useTauler, perquè la
 * radiografia sobrevisca als canvis de mòdul (Riscos §3 del pla). La porta és
 * la del Tauler (`porta`, el de useTractors que ja passa per tauler.porta):
 * cap segona passada d'empremtes. L'aprovació es llig just abans de cada
 * anàlisi (contextAprovacio), mai de memòria, i executaTractorEscaner la torna
 * a exigir abans de tocar la Font (fail-closed).
 *
 * EL GEST. El navegador només obri el selector de carpetes dins del clic de
 * la persona: triaCarpeta crida demanaCarpeta ABANS de cap espera (com
 * useGestoria.triaCarpeta). Sense selector de carpetes (Safari, Firefox),
 * usaFitxers rep els fitxers d'un <input type="file" webkitdirectory> i en fa
 * la Font a l'instant, abans que el selector es buide. Una carpeta nova
 * cancel·la l'anàlisi anterior (torn i AbortController) i n'oblida la Font.
 *
 * Tot viu NOMÉS en la memòria d'este hook: res es desa al navegador ni ix
 * d'este ordinador. La Font es guarda en una referència (mai a l'estat) i
 * fitxersPerAlTauler en dona embolcalls { name, size, arrayBuffer } que
 * lligen els bytes per la Font quan els demana executaTractorTauler, després
 * de l'aprovació de 'gestoria.tauler'. `oblida` i el desmuntatge cancel·len
 * l'anàlisi i desenxufen la Font (oblidaFont): després, cap embolcall llig res.
 * Proves: el magatzem, subtle, el catàleg, l'entorn, el rellotge i avui s'injecten.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { contextAprovacio } from '../../tractors/useTractors.js';
import { demanaCarpeta, fontDesDeFitxers, fontDesDeHandle, oblidaFont, potTriarCarpeta } from '../font/fontNavegador.js';
import { TRACTOR_ESCANER } from '../tractors.js';
import { LIMITS_TAULER } from '../tauler/nucli/tractorTauler.js';
import { executaTractorEscaner } from './nucli/tractorEscaner.js';

const ESTAT_BUIT = Object.freeze({
  nomCarpeta: '', triant: false, escanejant: false, progres: null, error: null, resultat: null, seleccio: Object.freeze([])
});
const missatgeDe = (error) => error?.message ?? String(error);
const compara = (x, y) => (x < y ? -1 : x > y ? 1 : 0);

/* El dia d'avui, { a, m, d }: el que diu `avui` (una funció que torna un Date o un dia, o el dia mateix) o el rellotge. */
function diaDe(avui, rellotge) {
  const valor = typeof avui === 'function' ? avui() : avui;
  if (valor && typeof valor === 'object' && !(valor instanceof Date)) {
    return Number.isInteger(valor.a) && Number.isInteger(valor.m) && Number.isInteger(valor.d) ? { a: valor.a, m: valor.m, d: valor.d } : null;
  }
  const data = valor instanceof Date ? valor : new Date(typeof rellotge === 'function' ? rellotge() : Date.now());
  return Number.isNaN(data.getTime()) ? null : { a: data.getFullYear(), m: data.getMonth() + 1, d: data.getDate() };
}

/* Els extractes preseleccionats pel nucli (mai més dels que llig el Tauler d'un colp). */
const preseleccioDe = (resultat) => Object.freeze((resultat?.extractes ?? [])
  .filter((f) => f.preseleccionat && f.seleccionable).map((f) => f.ruta).sort(compara).slice(0, LIMITS_TAULER.fitxers));

/**
 * @param {{ porta?: object, magatzem?: object, subtle?: SubtleCrypto, tractors?: object[], entorn?: object,
 *   rellotge?: () => number, avui?: (() => Date|{a,m,d})|{a,m,d} }} [opcions] `porta`: la de useTractors (tauler.porta)
 * @returns {{ porta: object|null, fila: object|null, aprovat: boolean, potTriarCarpeta: boolean, teCarpeta: boolean,
 *   nomCarpeta: string, ocupat: 'carpeta'|'escaneig'|null, progres: object|null, error: string|null, resultat: object|null,
 *   seleccio: string[], triaCarpeta: () => Promise<boolean>, usaFitxers: (fitxers: FileList|File[]) => boolean,
 *   commutaExtracte: (ruta: string) => void, fitxersPerAlTauler: () => object[], oblida: () => void }}
 */
export function useEscaner({ porta = null, magatzem, subtle, tractors, entorn = globalThis, rellotge, avui } = {}) {
  const fila = porta?.tractors?.find((t) => t.id === TRACTOR_ESCANER.id) ?? null;
  const [estat, setEstat] = useState(ESTAT_BUIT);
  const deps = useRef(null);
  deps.current = { magatzem, subtle, tractors, entorn, rellotge, avui };
  const torn = useRef(0);
  const analisi = useRef(null);
  const font = useRef(null);

  /* Cancel·la l'anàlisi activa i desenxufa la Font: el que acabe d'un torn vell no s'aplica. */
  const desenxufa = useCallback(() => {
    torn.current += 1;
    analisi.current?.abort();
    analisi.current = null;
    if (font.current) oblidaFont(font.current);
    font.current = null;
  }, []);

  useEffect(() => desenxufa, [desenxufa]);

  const escaneja = useCallback(async (nova) => {
    desenxufa();
    const meu = torn.current;
    const controlador = new AbortController();
    analisi.current = controlador;
    font.current = nova;
    setEstat({ ...ESTAT_BUIT, nomCarpeta: typeof nova?.nom === 'string' ? nova.nom : '', escanejant: true });
    const d = deps.current;
    try {
      const aprovacio = await contextAprovacio(TRACTOR_ESCANER.id, {
        magatzem: d.magatzem, subtle: d.subtle, tractors: d.tractors, entorn: d.entorn, rellotge: d.rellotge
      });
      const resultat = await executaTractorEscaner({
        font: nova, aprovacio, subtle: d.subtle, avui: diaDe(d.avui, d.rellotge), signal: controlador.signal,
        onProgres: (progres) => {
          if (meu === torn.current) setEstat((previ) => ({ ...previ, progres }));
        }
      });
      if (meu !== torn.current) return false;
      setEstat((previ) => ({ ...previ, escanejant: false, progres: null, error: null, resultat, seleccio: preseleccioDe(resultat) }));
      return true;
    } catch (error) {
      if (meu !== torn.current) return false;
      /* Una anàlisi fallida no guarda la carpeta: sense resultat, la Font no servix i es desenxufa. */
      oblidaFont(nova);
      if (font.current === nova) font.current = null;
      setEstat((previ) => ({ ...previ, nomCarpeta: '', escanejant: false, progres: null, error: missatgeDe(error) }));
      return false;
    } finally {
      // Una anàlisi antiga no pot retirar el controlador de la següent.
      if (analisi.current === controlador) analisi.current = null;
    }
  }, [desenxufa]);

  /* Dins del gest de la persona: el selector s'obri abans de cap espera. */
  const triaCarpeta = useCallback(async () => {
    const promesa = demanaCarpeta({ entorn: deps.current.entorn });
    const abans = torn.current;
    setEstat((previ) => ({ ...previ, triant: true, error: null }));
    let nova;
    try {
      nova = fontDesDeHandle(await promesa);
    } catch (error) {
      /* Cancel·lar el selector no oblida la carpeta d'abans ni el seu resultat. */
      if (abans === torn.current) {
        setEstat((previ) => ({ ...previ, triant: false, error: error?.codi === 'SELECCIO_CANCELLADA' ? null : missatgeDe(error) }));
      }
      return false;
    }
    if (abans !== torn.current) {
      // Mentrestant s'ha triat (o oblidat) una altra carpeta: esta ja no és la de la persona.
      oblidaFont(nova);
      return false;
    }
    return escaneja(nova);
  }, [escaneja]);

  /* Alternativa sense selector de carpetes: els fitxers d'un <input type="file" webkitdirectory multiple>. */
  const usaFitxers = useCallback((fitxers) => {
    if (!fitxers || fitxers.length === 0) return false;
    let nova;
    try {
      nova = fontDesDeFitxers(fitxers);
    } catch (error) {
      setEstat((previ) => ({ ...previ, error: missatgeDe(error) }));
      return false;
    }
    escaneja(nova);
    return true;
  }, [escaneja]);

  /* Marca o desmarca un extracte per a abocar-lo; només els seleccionables, i mai més dels que llig el Tauler. */
  const commutaExtracte = useCallback((ruta) => {
    setEstat((previ) => {
      const extracte = previ.resultat?.extractes?.find((f) => f.ruta === ruta);
      if (!extracte?.seleccionable) return previ;
      const triats = previ.seleccio.includes(ruta) ? previ.seleccio.filter((r) => r !== ruta) : [...previ.seleccio, ruta].sort(compara);
      if (triats.length > LIMITS_TAULER.fitxers) return previ;
      return { ...previ, seleccio: Object.freeze(triats) };
    });
  }, []);

  /* Els extractes triats com a fitxers per a tauler.llig: els bytes es demanen a la Font quan el Tauler els llig. */
  const fitxersPerAlTauler = useCallback(() => {
    const propia = font.current;
    if (!propia || !estat.resultat) return [];
    const perRuta = new Map(estat.resultat.extractes.map((f) => [f.ruta, f]));
    return estat.seleccio.filter((ruta) => perRuta.get(ruta)?.seleccionable).map((ruta) => ({
      name: ruta,
      size: Number.isFinite(perRuta.get(ruta).mida) ? perRuta.get(ruta).mida : undefined,
      arrayBuffer: async () => {
        const bytes = await propia.llig(ruta);
        return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      }
    }));
  }, [estat.resultat, estat.seleccio]);

  const oblida = useCallback(() => {
    desenxufa();
    setEstat(ESTAT_BUIT);
  }, [desenxufa]);

  const { triant, escanejant, ...resta } = estat;
  return {
    porta,
    fila,
    aprovat: fila?.estat === 'aprovat',
    potTriarCarpeta: potTriarCarpeta(entorn),
    teCarpeta: Boolean(estat.resultat) || escanejant,
    ...resta,
    ocupat: triant ? 'carpeta' : escanejant ? 'escaneig' : null,
    triaCarpeta,
    usaFitxers,
    commutaExtracte,
    fitxersPerAlTauler,
    oblida
  };
}
