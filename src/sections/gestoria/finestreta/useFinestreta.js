/**
 * useFinestreta.js — l'estat de la vista «Identitat i Finestreta» de la
 * Gestoria: la porta del tractor 'gestoria.identitat', la carpeta triada, la
 * taula «Què llegiré i què no», la lectura, la Fitxa d'identitat (amb les
 * propostes per revisar) i el cofre on es desen els valors confirmats.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H). Com useHistoric:
 * la porta és la de sempre (useTractors) i l'aprovació es llig just abans de
 * cada pas (contextAprovacio), mai de memòria; el tractor la torna a exigir
 * abans de tocar la Font. Una carpeta nova, una lectura nova, `oblida`, el
 * bloqueig del cofre i el desmuntatge cancel·len el que hi haja en curs i
 * desenxufen la carpeta anterior (oblidaFont).
 *
 * LA CARPETA: triaCarpeta crida demanaCarpeta DINS del clic, abans de cap
 * espera (el navegador només obri el selector just després d'un gest de la
 * persona); sense selector de carpetes, usaFitxers amb els fitxers d'un
 * <input webkitdirectory>. Després, la taula (planificaTractorIdentitat), que
 * no obri cap fitxer. La persona marca els 'demanar' que vol, d'un en un
 * (commutaMarcat) o tots de colp (marcaTotsDemanar / desmarcaTotsDemanar), i
 * llig (executaTractorIdentitat). Marcar no és llegir: només llig obri cap
 * paper, i els 'llegir' i els 'ometre' no es poden marcar mai.
 *
 * LA FITXA (nucli/fitxaIdentitat.js): les propostes es fusionen a la fitxa en
 * memòria, 'proposat' o 'en-conflicte', mai triades soles. Si encara no hi
 * ha cap titular de l'àmbit que toca, se'n crea un amb un id opac (nouIdFitxa
 * amb crypto.getRandomValues) i un àlies genèric, sense cap dada. Confirmar,
 * rebutjar i entrar a mà són decisions de la persona.
 *
 * EL COFRE: la vista hi passa persistenciaDelCofre(cofre, 'identitat'). Es
 * desa NOMÉS perAlCofre(fitxa), els valors confirmats amb les seues fonts, i
 * només després d'una decisió de la persona que els canvia: una lectura no
 * desa res. Es llig amb llegixDelCofre; un registre que no és una fitxa vàlida
 * no es trepitja mai (el desament queda blocat i es diu). Cada bloqueig del
 * cofre ({ estat: 'bloquejat' }, també l'automàtic) BUIDA tot el que és
 * desxifrat o se'n deriva: la fitxa, les propostes, les confiances, la
 * taula, la lectura i la carpeta. Cada obertura torna a llegir la fitxa.
 *
 * ELS PAPERS DE «D’ON IX» (Front 6, ordre del Mestre del 14-10-2026, pla
 * 261013_1930: «Fitxa + obrir el PDF»): preparaPaper(font) torna a llegir el
 * paper d'una font amb la carpeta viva (obriPaperIdentitat: la porta, cap
 * vetat, l'empremta i el MIME fix) i en fa una URL blob: amb entorn.URL. La
 * pestanya l'obri la vista, dins del clic. Cada URL es revoca als 120 s
 * (VIDA_PAPER_MS), i totes amb deixaTot (el bloqueig del cofre i «Oblida»),
 * amb una carpeta nova i en desmuntar. Una comprovació que falla revoca la URL
 * d'abans del mateix paper: «Obri’l» mai obri els bytes d'una carpeta
 * desenxufada. papersComprovats (clauPaper → URL) i potObrirPaper són estat:
 * la vista es torna a pintar quan canvien.
 * Proves: el magatzem, subtle, el catàleg, l'entorn (també URL, setTimeout i
 * clearTimeout), el rellotge, inflate i la persistència s'injecten.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { contextAprovacio, useTractors } from '../../tractors/useTractors.js';
import { demanaCarpeta, fontDesDeFitxers, fontDesDeHandle, oblidaFont, potTriarCarpeta } from '../font/fontNavegador.js';
import { parseImport } from '../nucli/diners.js';
import { TRACTOR_IDENTITAT } from '../tractors.js';
import {
  afegixTitular, confirma as confirmaValor, entraAMa as entraValorAMa, fitxaBuida, fusionaPropostes, llegixDelCofre,
  nouIdFitxa, perAlCofre, rebutja as rebutjaValor
} from './nucli/fitxaIdentitat.js';
import { executaTractorIdentitat, obriPaperIdentitat, planificaTractorIdentitat } from './nucli/tractorIdentitat.js';
import { CAMPS_IDENTITAT } from './nucli/validadorsIdentitat.js';

const ESTAT_BUIT = Object.freeze({
  ocupat: null, progres: null, error: null, teCarpeta: false, nomCarpeta: '', pla: null, marcats: Object.freeze([]), lectura: null, generacio: 0
});
/** Els àlies dels titulars que es creen sols: genèrics, cap dada de la persona. */
export const ALIES_TITULARS = Object.freeze({ LLAR: 'Persona titular', ACTIVITAT: 'La seua activitat', ENTITAT: 'Entitat representada' });
/* L'àmbit del titular on viu cada rol de camp (els tributs i les representacions, d'una persona). */
const AMBIT_DEL_ROL = Object.freeze({ persona: 'LLAR', activitat: 'ACTIVITAT', entitat: 'ENTITAT' });
const PES_CONFIANCA = Object.freeze({ alta: 3, mitjana: 2, baixa: 1 });

const missatgeDe = (error) => error?.message ?? String(error);
const momentDe = (rellotge) => new Date(typeof rellotge === 'function' ? rellotge() : Date.now()).toISOString();
const aleatoriDe = (entorn) => (n) => (entorn?.crypto ?? globalThis.crypto).getRandomValues(new Uint8Array(n));
/* El registre del cofre sense el moment d'actualització: per a saber si una decisió ha canviat res que s'haja de desar. */
const empremtaDesable = (f) => JSON.stringify({ ...perAlCofre(f), actualitzat: null });

/** La clau d'una proposta al mapa de confiances: el camp i el valor. */
export const clauConfianca = (camp, valor) => `${camp}|${String(valor)}`;

/** El temps màxim que viu la URL d'un paper comprovat: després, es revoca. */
export const VIDA_PAPER_MS = 120000;
/** La clau d'un paper comprovat (papersComprovats): l'empremta i la ruta de la font. */
export const clauPaper = (font) => `${font?.sha256 ?? ''}|${font?.ruta ?? ''}`;
/** El que diu la vista quan no hi ha cap carpeta viva on tornar a llegir el paper. */
export const SENSE_CARPETA_PAPER = 'Tria la carpeta on és el paper per a obrir-lo.';
/* L'URL i els temporitzadors de l'entorn (injectables), o els del navegador; es criden com a mètodes del seu objecte. */
const urlDe = (entorn) => (typeof entorn?.URL?.createObjectURL === 'function' ? entorn.URL : globalThis.URL);
const temporitzadorsDe = (entorn) => (typeof entorn?.setTimeout === 'function' && typeof entorn?.clearTimeout === 'function' ? entorn : globalThis);
/* Revoca la URL d'un paper comprovat amb l'entorn que la va crear, i n'atura el temporitzador. */
function revocaPaper({ url, temps, entorn }) {
  temporitzadorsDe(entorn).clearTimeout(temps);
  try {
    urlDe(entorn).revokeObjectURL(url);
  } catch {
    /* ja no hi era: res a alliberar */
  }
}

/* La confiança més alta de cada camp i valor proposats (només en memòria, com la fitxa). */
function confiancesDe(propostes, previes = new Map()) {
  const mapa = new Map(previes);
  for (const p of propostes) {
    const clau = clauConfianca(p.camp, p.valor);
    const abans = mapa.get(clau);
    if (!abans || (PES_CONFIANCA[p.confianca] ?? 0) > (PES_CONFIANCA[abans] ?? 0)) mapa.set(clau, p.confianca);
  }
  return mapa;
}

/* El titular d'un àmbit: l'únic que hi ha, o un de nou si no n'hi ha cap. Si n'hi ha més d'un, cap (id null). */
function asseguraTitular(f, ambit, { ara, aleatori, persona = null }) {
  const existents = f.titulars.filter((t) => t.ambit === ambit && (ambit !== 'ACTIVITAT' || t.persona === persona));
  if (existents.length) return { fitxa: f, id: existents.length === 1 ? existents[0].id : null };
  const id = nouIdFitxa('tit', aleatori(8));
  const titular = { id, tipus: ambit === 'ENTITAT' ? 'entitat' : 'persona', ambit, alies: ALIES_TITULARS[ambit], ...(ambit === 'ACTIVITAT' ? { persona } : {}) };
  return { fitxa: afegixTitular(f, titular, { ara }), id };
}

/* Els titulars que necessiten els rols de les propostes, creats si encara no n'hi ha cap. */
function ambTitularsPer(f, rols, opcions) {
  let fitxa = f;
  let persona = null;
  if (['persona', 'activitat', 'representacio', 'tribut'].some((rol) => rols.has(rol))) {
    ({ fitxa, id: persona } = asseguraTitular(fitxa, 'LLAR', opcions));
  }
  if (rols.has('activitat') && persona) ({ fitxa } = asseguraTitular(fitxa, 'ACTIVITAT', { ...opcions, persona }));
  if (rols.has('entitat') || rols.has('representacio')) ({ fitxa } = asseguraTitular(fitxa, 'ENTITAT', opcions));
  return fitxa;
}

/**
 * @param {{ magatzem?: object, subtle?: SubtleCrypto, tractors?: object[], entorn?: object, rellotge?: () => number,
 *   inflate?: null|((b: Uint8Array) => Promise<Uint8Array>), persistencia?: { llig: () => Promise<object|null>,
 *   desa: (d: object) => Promise<void>, subscriu?: (fn: (canvi: { estat: string }) => void) => () => void } }} [opcions]
 */
export function useFinestreta({ magatzem, subtle, tractors, entorn = globalThis, rellotge, inflate, persistencia } = {}) {
  const porta = useTractors({ magatzem, subtle, tractors, entorn, rellotge });
  const fila = porta.tractors.find((t) => t.id === TRACTOR_IDENTITAT.id) ?? null;
  const aprovat = fila?.estat === 'aprovat';
  const [estat, setEstat] = useState(ESTAT_BUIT);
  const [fitxa, setFitxa] = useState(() => fitxaBuida());
  const [confiances, setConfiances] = useState(() => new Map());
  /* La persistència és un cofre bloquejat: res no s'hi llig ni s'hi desa fins que s'obri. */
  const [persistenciaBloquejada, setPersistenciaBloquejada] = useState(() => typeof persistencia?.subscriu === 'function');
  /* Fins que no arriba la fitxa desada, cap lectura ni decisió: no es fusiona res damunt d'una fitxa buida. */
  const [fitxaLlegida, setFitxaLlegida] = useState(() => !persistencia);
  const [errorPersistencia, setErrorPersistencia] = useState(null);
  /* El registre desat no és una fitxa vàlida: no es trepitja. */
  const [desaBlocat, setDesaBlocat] = useState(false);
  /* Els papers comprovats que es poden obrir: clauPaper(font) → URL blob: (les vives són a la ref `papers`). */
  const [papersComprovats, setPapersComprovats] = useState(() => new Map());

  const fitxaActual = useRef(fitxa);
  const font = useRef(null);
  const torn = useRef(0);
  const tornPersistencia = useRef(0);
  const lecturaActiva = useRef(null);
  const ocupat = useRef(false);
  const pendentDeDesar = useRef(false);
  const desat = useRef(null);
  /* clauPaper(font) → { url, temps, entorn }: les URL vives, per a revocar-les. */
  const papers = useRef(new Map());
  const deps = useRef(null);
  deps.current = { magatzem, subtle, tractors, entorn, rellotge, inflate };
  const viu = useRef(null);
  viu.current = { aprovat, persistenciaBloquejada, fitxaLlegida, estat };

  const posaFitxa = useCallback((nova) => {
    fitxaActual.current = nova;
    setFitxa(nova);
  }, []);

  /* Revoca la URL viva d'un paper comprovat (si n'hi ha) i el trau de papersComprovats. */
  const oblidaPaper = useCallback((clau) => {
    const viva = papers.current.get(clau);
    if (!viva) return;
    revocaPaper(viva);
    papers.current.delete(clau);
    setPapersComprovats((abans) => {
      const nou = new Map(abans);
      nou.delete(clau);
      return nou;
    });
  }, []);
  /* Revoca totes les URL dels papers comprovats: la carpeta d'on venien ja no hi és. */
  const oblidaPapers = useCallback(() => {
    papers.current.forEach(revocaPaper);
    papers.current = new Map();
    setPapersComprovats((abans) => (abans.size ? new Map() : abans));
  }, []);

  /* Cancel·la el que hi haja en curs, desenxufa la carpeta i revoca les URL dels papers comprovats. */
  const deixaTot = useCallback(() => {
    torn.current += 1;
    lecturaActiva.current?.abort();
    lecturaActiva.current = null;
    ocupat.current = false;
    if (font.current) oblidaFont(font.current);
    font.current = null;
    oblidaPapers();
  }, [oblidaPapers]);

  /* El bloqueig del cofre: tot el que és desxifrat o se'n deriva fora de la memòria, i cap desament pendent. */
  const buida = useCallback(() => {
    deixaTot();
    tornPersistencia.current += 1;
    pendentDeDesar.current = false;
    desat.current = null;
    posaFitxa(fitxaBuida());
    setConfiances(new Map());
    setEstat({ ...ESTAT_BUIT, generacio: torn.current });
    setPersistenciaBloquejada(true);
    setFitxaLlegida(false);
    setErrorPersistencia(null);
    setDesaBlocat(false);
  }, [deixaTot, posaFitxa]);

  /* La fitxa desada: una lectura en muntar i, amb el cofre, una altra a cada obertura. */
  useEffect(() => {
    if (!persistencia || typeof persistencia.llig !== 'function') return undefined;
    let actiu = true;
    const llegix = () => {
      const meu = ++tornPersistencia.current;
      Promise.resolve().then(() => persistencia.llig()).then((dades) => {
        if (!actiu || meu !== tornPersistencia.current) return;
        let desada = fitxaBuida();
        let illegible = false;
        if (dades != null) {
          try {
            desada = llegixDelCofre(dades);
          } catch {
            illegible = true;
          }
        }
        desat.current = illegible ? null : empremtaDesable(desada);
        posaFitxa(desada);
        setDesaBlocat(illegible);
        setErrorPersistencia(illegible
          ? 'La fitxa desada al cofre no és una fitxa d’identitat vàlida: no es mostra ni se’n desa cap altra damunt. Pots fer-ne una còpia xifrada abans de tocar res.'
          : null);
        setPersistenciaBloquejada(false);
        setFitxaLlegida(true);
      }, (error) => {
        if (!actiu || meu !== tornPersistencia.current) return;
        /* El cofre bloquejat no és cap error: la fitxa espera la pròxima obertura. */
        if (error?.codi === 'COFRE_BLOQUEJAT') {
          setPersistenciaBloquejada(true);
          return;
        }
        setDesaBlocat(true);
        setFitxaLlegida(true);
        setErrorPersistencia(`No s’ha pogut llegir la fitxa desada: ${missatgeDe(error)} No se’n desa cap altra damunt.`);
      });
    };
    const deixa = typeof persistencia.subscriu === 'function' ? persistencia.subscriu((canvi) => {
      if (!actiu) return;
      if (canvi?.estat === 'bloquejat') buida();
      else if (canvi?.estat === 'obert') {
        setPersistenciaBloquejada(false);
        llegix();
      }
    }) : null;
    llegix();
    return () => {
      actiu = false;
      if (typeof deixa === 'function') deixa();
    };
  }, [persistencia, buida, posaFitxa]);

  /* Desmuntatge: res en curs, la carpeta desenxufada i cap URL de paper viva. */
  useEffect(() => () => {
    torn.current += 1;
    lecturaActiva.current?.abort();
    lecturaActiva.current = null;
    if (font.current) oblidaFont(font.current);
    font.current = null;
    papers.current.forEach(revocaPaper);
    papers.current = new Map();
  }, []);

  /* Cada decisió de la persona que canvia els confirmats es desa: només perAlCofre(fitxa). */
  useEffect(() => {
    if (!pendentDeDesar.current) return undefined;
    pendentDeDesar.current = false;
    if (!persistencia || typeof persistencia.desa !== 'function' || desaBlocat) return undefined;
    let registre;
    try {
      registre = perAlCofre(fitxa);
    } catch (error) {
      setErrorPersistencia(`No s’ha pogut preparar la fitxa per a desar-la: ${missatgeDe(error)}`);
      return undefined;
    }
    let actiu = true;
    Promise.resolve().then(() => persistencia.desa(registre)).then(
      () => { if (actiu) setErrorPersistencia(null); },
      (error) => {
        /* No s'ha desat: la pròxima decisió ho tornarà a provar. */
        desat.current = null;
        if (actiu) setErrorPersistencia(`No s’ha pogut desar la fitxa: ${missatgeDe(error)}`);
      }
    );
    return () => { actiu = false; };
  }, [fitxa, persistencia, desaBlocat]);

  /* La taula «Què llegiré i què no» d'una carpeta nova: cap byte, només els noms. Les URL dels papers
     comprovats de la carpeta d'abans es revoquen amb ella. */
  const planifica = useCallback(async (nova, meu) => {
    if (font.current && font.current !== nova) {
      oblidaFont(font.current);
      oblidaPapers();
    }
    font.current = nova;
    const controlador = new AbortController();
    lecturaActiva.current = controlador;
    ocupat.current = true;
    setEstat((e) => ({ ...ESTAT_BUIT, generacio: e.generacio, ocupat: 'planificant', teCarpeta: true, nomCarpeta: typeof nova?.nom === 'string' ? nova.nom : '' }));
    try {
      const { magatzem: m, subtle: s, tractors: t, entorn: en, rellotge: r } = deps.current;
      const aprovacio = await contextAprovacio(TRACTOR_IDENTITAT.id, { magatzem: m, subtle: s, tractors: t, entorn: en, rellotge: r });
      const pla = await planificaTractorIdentitat({ font: nova, aprovacio, subtle: s, signal: controlador.signal });
      if (meu !== torn.current) return false;
      setEstat((e) => ({ ...e, ocupat: null, pla }));
      return true;
    } catch (error) {
      if (meu === torn.current) setEstat((e) => ({ ...e, ocupat: null, error: missatgeDe(error) }));
      return false;
    } finally {
      if (lecturaActiva.current === controlador) lecturaActiva.current = null;
      if (meu === torn.current) ocupat.current = false;
    }
  }, [oblidaPapers]);

  /* Es pot triar o llegir: tractor aprovat, cofre obert, fitxa llegida i res en curs. */
  const pot = useCallback(() => viu.current.aprovat && !viu.current.persistenciaBloquejada && viu.current.fitxaLlegida && !ocupat.current, []);

  /* Dins del gest de la persona: el selector s'obri abans de cap espera. */
  const triaCarpeta = useCallback(async () => {
    if (!pot()) return false;
    const promesa = demanaCarpeta({ entorn: deps.current.entorn });
    const meu = ++torn.current;
    lecturaActiva.current?.abort();
    ocupat.current = true;
    setEstat((e) => ({ ...e, ocupat: 'carpeta', error: null }));
    let nova;
    try {
      nova = fontDesDeHandle(await promesa);
    } catch (error) {
      if (meu === torn.current) {
        ocupat.current = false;
        setEstat((e) => ({ ...e, ocupat: null, error: error?.codi === 'SELECCIO_CANCELLADA' ? null : missatgeDe(error) }));
      }
      return false;
    }
    if (meu !== torn.current) {
      oblidaFont(nova);
      return false;
    }
    return planifica(nova, meu);
  }, [planifica, pot]);

  /* Alternativa sense selector de carpetes: els fitxers d'un <input type="file" webkitdirectory>. */
  const usaFitxers = useCallback(async (fitxers) => {
    if (!pot() || !fitxers || typeof fitxers.length !== 'number' || fitxers.length === 0) return false;
    let nova;
    try {
      nova = fontDesDeFitxers(fitxers);
    } catch (error) {
      setEstat((e) => ({ ...e, error: missatgeDe(error) }));
      return false;
    }
    const meu = ++torn.current;
    lecturaActiva.current?.abort();
    return planifica(nova, meu);
  }, [planifica, pot]);

  /* Marca o desmarca un fitxer opac ('demanar'): els altres no es poden marcar. */
  const commutaMarcat = useCallback((ruta) => {
    setEstat((e) => {
      if (e.ocupat || !e.pla?.decisions.some((d) => d.ruta === ruta && d.decisio === 'demanar')) return e;
      return { ...e, marcats: e.marcats.includes(ruta) ? e.marcats.filter((r) => r !== ruta) : [...e.marcats, ruta] };
    });
  }, []);

  /* Marca de colp tots els opacs ('demanar') de la taula, darrere dels que ja ho eren i sense repetir-ne cap: els
     'llegir' i els 'ometre' no hi entren mai. Marcar no és llegir. Si no canvia res, el mateix estat (cap pintada). */
  const marcaTotsDemanar = useCallback(() => {
    setEstat((e) => {
      if (e.ocupat || !e.pla) return e;
      const ja = new Set(e.marcats);
      const nous = [];
      for (const d of e.pla.decisions) {
        if (d.decisio !== 'demanar' || ja.has(d.ruta)) continue;
        ja.add(d.ruta);
        nous.push(d.ruta);
      }
      return nous.length ? { ...e, marcats: [...e.marcats, ...nous] } : e;
    });
  }, []);

  /* Desmarca tots els opacs (els marcats només poden ser 'demanar'). */
  const desmarcaTotsDemanar = useCallback(() => {
    setEstat((e) => (e.ocupat || e.marcats.length === 0 ? e : { ...e, marcats: [] }));
  }, []);

  /* Llig els permesos i els marcats, i en fusiona les propostes a la fitxa (en memòria: no es desa res). */
  const llig = useCallback(async () => {
    const { estat: actual } = viu.current;
    if (!pot() || !font.current || !actual.pla) return false;
    const meu = ++torn.current;
    lecturaActiva.current?.abort();
    const controlador = new AbortController();
    lecturaActiva.current = controlador;
    ocupat.current = true;
    const carpeta = font.current;
    const marcats = [...actual.marcats];
    setEstat((e) => ({ ...e, ocupat: 'llegint', error: null, progres: null }));
    try {
      const { magatzem: m, subtle: s, tractors: t, entorn: en, rellotge: r, inflate: inf } = deps.current;
      const aprovacio = await contextAprovacio(TRACTOR_IDENTITAT.id, { magatzem: m, subtle: s, tractors: t, entorn: en, rellotge: r });
      const resultat = await executaTractorIdentitat({
        font: carpeta, marcats, aprovacio, subtle: s, inflate: inf, signal: controlador.signal,
        onProgres: (progres) => { if (meu === torn.current) setEstat((e) => ({ ...e, progres })); }
      });
      if (meu !== torn.current) return false;
      const ara = momentDe(r);
      const rols = new Set(resultat.propostes.map((p) => p.titularRol));
      const nova = fusionaPropostes(ambTitularsPer(fitxaActual.current, rols, { ara, aleatori: aleatoriDe(en) }), resultat.propostes, { ara });
      posaFitxa(nova);
      setConfiances((previes) => confiancesDe(resultat.propostes, previes));
      setEstat((e) => ({
        ...e, ocupat: null, progres: null, generacio: meu,
        lectura: { decisions: resultat.decisions, avisos: resultat.avisos, llegits: resultat.llegits, propostes: resultat.propostes.length }
      }));
      return true;
    } catch (error) {
      if (meu === torn.current) setEstat((e) => ({ ...e, ocupat: null, progres: null, error: missatgeDe(error) }));
      return false;
    } finally {
      if (lecturaActiva.current === controlador) lecturaActiva.current = null;
      if (meu === torn.current) ocupat.current = false;
    }
  }, [posaFitxa, pot]);

  /* Front 6: torna a llegir el paper d'una font de «D’on ix» amb la carpeta viva, en comprova l'empremta i en fa una
     URL blob: (entorn.URL) amb el MIME fix. Torna { url } o { motiu, codi }: el motiu, en valencià i sense cap ruta.
     L'aprovació es llig ara, com abans de cada pas. Si mentre es comprovava la carpeta s'ha oblidat o canviat (també
     pel bloqueig del cofre), no es fa cap URL. Una segona comprovació del mateix paper revoca la URL d'abans, i una
     que falla també: el paper ja no és el que es va comprovar. */
  const preparaPaper = useCallback(async (fontDoc) => {
    if (!font.current) return { motiu: SENSE_CARPETA_PAPER, codi: 'SENSE_CARPETA' };
    if (!pot()) return { motiu: 'Ara no es pot comprovar el paper: espera que acabe la lectura.', codi: 'OCUPAT' };
    if (fontDoc?.tipus !== 'document') return { motiu: 'Este valor no ve de cap paper.', codi: 'PARAMETRES_INVALIDS' };
    const carpeta = font.current;
    const { magatzem: m, subtle: s, tractors: t, entorn: en, rellotge: r } = deps.current;
    let paper;
    try {
      const aprovacio = await contextAprovacio(TRACTOR_IDENTITAT.id, { magatzem: m, subtle: s, tractors: t, entorn: en, rellotge: r });
      paper = await obriPaperIdentitat({ font: carpeta, ruta: fontDoc.ruta, sha256: fontDoc.sha256, aprovacio, subtle: s });
    } catch (error) {
      oblidaPaper(clauPaper(fontDoc));
      return { motiu: missatgeDe(error), codi: error?.codi ?? null };
    }
    if (font.current !== carpeta) return { motiu: 'La carpeta ha canviat mentre es comprovava el paper: torna-ho a provar.', codi: 'FONT_OBLIDADA' };
    let url;
    try {
      url = urlDe(en).createObjectURL(new Blob([paper.bytes], { type: paper.tipus }));
    } catch {
      return { motiu: 'Este navegador no ha pogut preparar el paper per a obrir-lo.', codi: null };
    }
    const clau = clauPaper(fontDoc);
    const anterior = papers.current.get(clau);
    if (anterior) revocaPaper(anterior);
    const temps = temporitzadorsDe(en).setTimeout(() => {
      const viva = papers.current.get(clau);
      if (viva?.url !== url) return;
      revocaPaper(viva);
      papers.current.delete(clau);
      setPapersComprovats((abans) => {
        const nou = new Map(abans);
        nou.delete(clau);
        return nou;
      });
    }, VIDA_PAPER_MS);
    papers.current.set(clau, { url, temps, entorn: en });
    setPapersComprovats((abans) => new Map(abans).set(clau, url));
    return { url };
  }, [pot, oblidaPaper]);

  /* Una decisió de la persona sobre la fitxa. Torna null si s'ha fet, o el motiu si no (sense cap valor dins). */
  const decidix = useCallback((canvi) => {
    if (!viu.current.fitxaLlegida || viu.current.persistenciaBloquejada) return 'La fitxa encara no és a punt: obri el cofre.';
    let nova;
    try {
      nova = canvi(fitxaActual.current, momentDe(deps.current.rellotge));
    } catch (error) {
      return missatgeDe(error);
    }
    posaFitxa(nova);
    const empremta = empremtaDesable(nova);
    if (empremta !== desat.current) {
      desat.current = empremta;
      pendentDeDesar.current = true;
    }
    return null;
  }, [posaFitxa]);

  const confirma = useCallback(({ titular, camp, valor } = {}) => decidix((f, ara) => confirmaValor(f, { titular, camp, valor }, { ara })), [decidix]);
  const rebutja = useCallback(({ titular, camp, valor } = {}) => decidix((f, ara) => rebutjaValor(f, { titular, camp, valor }, { ara })), [decidix]);

  /* Un valor entrat a mà (un import es llig en euros: «1.234,56»). Sense titular, el de l'àmbit del camp (creat si no n'hi ha cap). */
  const entraAMa = useCallback(({ titular, camp, text } = {}) => decidix((f, ara) => {
    const definicio = Object.prototype.hasOwnProperty.call(CAMPS_IDENTITAT, camp) ? CAMPS_IDENTITAT[camp] : null;
    if (!definicio) throw new Error('Este camp no és de la fitxa.');
    let valor = typeof text === 'string' ? text.trim() : text;
    if (definicio.tipus === 'import') {
      valor = parseImport(String(text ?? ''));
      if (valor === null) throw new Error('L’import no té una forma vàlida (per exemple, 1.234,56).');
    }
    let base = f;
    let id = titular;
    if (!id) {
      const ambit = AMBIT_DEL_ROL[definicio.rol];
      if (!ambit) throw new Error('Este camp va a un tribut o a una representació: entra’l des de la seua fila.');
      const aleatori = aleatoriDe(deps.current.entorn);
      let persona = null;
      if (ambit === 'ACTIVITAT') {
        ({ fitxa: base, id: persona } = asseguraTitular(base, 'LLAR', { ara, aleatori }));
        if (!persona) throw new Error('Hi ha més d’una persona titular: entra el valor des de la fila de la seua activitat.');
      }
      ({ fitxa: base, id } = asseguraTitular(base, ambit, { ara, aleatori, persona }));
      if (!id) throw new Error('Hi ha més d’un titular d’este àmbit: entra el valor des de la seua fila.');
    }
    return entraValorAMa(base, { titular: id, camp, valor }, { ara });
  }), [decidix]);

  /* Oblida la carpeta, la taula, la lectura i les propostes; els valors confirmats es queden. */
  const oblida = useCallback(() => {
    deixaTot();
    let neta;
    try {
      neta = perAlCofre(fitxaActual.current);
    } catch {
      neta = fitxaBuida();
    }
    posaFitxa(neta);
    setConfiances(new Map());
    setEstat({ ...ESTAT_BUIT, generacio: torn.current });
  }, [deixaTot, posaFitxa]);

  return {
    porta, fila, aprovat, ...estat, fitxa, confiances, persistenciaBloquejada, fitxaLlegida, errorPersistencia, desaBlocat,
    potTriarCarpeta: potTriarCarpeta(entorn),
    /* Front 6: hi ha una carpeta viva on tornar a llegir un paper, i res en curs (com pot(), però des de l'estat). */
    potObrirPaper: aprovat && !persistenciaBloquejada && fitxaLlegida && estat.teCarpeta && !estat.ocupat,
    papersComprovats,
    triaCarpeta, usaFitxers, commutaMarcat, marcaTotsDemanar, desmarcaTotsDemanar, llig, preparaPaper, confirma, rebutja, entraAMa, oblida
  };
}
