/**
 * useGenealogia.jsx — Arbre Genealògic · l'estat de l'app: llig el magatzem,
 * calcula les alertes i la numeració Sosa, i oferix les operacions. Les
 * vistes no toquen mai el magatzem directament.
 *
 * El mateix patró que ProveidorSalut: una sola pestanya escriu (Web Locks);
 * la resta queda en lectura i ho diu; si una altra pestanya canvia alguna
 * cosa, esta ho torna a llegir. Res d'açò ix del dispositiu. Els errors van
 * a la interfície com a codis (el `codi` del magatzem o 'invalid').
 *
 * Base xifrada (P1-81): si el disc porta la meta 'xifrat', `bloquejat` és
 * true fins que `desbloqueja(frase)` obri el cofre en un magatzem de memòria.
 * Llavors totes les operacions treballen sobre eixe magatzem i cada escriptura
 * es torna a xifrar al disc (desaCofre), d'una en una i en ordre. La clau
 * només viu en memòria i es descarta en `bloqueja()`, en desmuntar i en
 * `pagehide`; en tancar, l'estat desxifrat es buida abans de tornar a llegir
 * el disc (encara que la lectura falle, la vista queda tancada).
 *
 *   <ProveidorGenealogia magatzem? rellotge? nouId? versioAvis?> … </ProveidorGenealogia>
 *   const genealogia = useGenealogia();
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { detectaDuplicats, fusionaDuplicats } from './duplicats.js';
import { detectaContradiccions } from './cronologia.js';
import { aplicaEntrevista, enrere as enrereEntrevista, estatInicialEntrevista, pasActual, respon as responEntrevista, salta as saltaEntrevista, treuResposta as treuRespostaEntrevista } from './entrevista.js';
import {
  activaArbre, activaXifrat as activaXifratDelMagatzem, actualitzaArbre, arbreDesactualitzat, carregaEstatGenealogia,
  creaMagatzemGenealogia, desaArbre, desaCofre, desaMeta, desactivaXifrat as desactivaXifratDelMagatzem,
  esborraArbre as esborraArbreDelMagatzem, igualRegistre, obreCofre, obreCofreAmbClau
} from '../magatzem.js';
import { arbreBuit, creaArbre as creaArbreModel, netejaArbre, netejaPersona, netejaRelacio } from './model.js';
import { estatDeVincle } from './parentiu.js';
import { errorCamp } from './segur.js';
import { numeraSosa } from './sosa.js';
import { idsVius } from './vius.js';

const GenealogiaContext = createContext(null);
const RELLOTGE = () => new Date();
const NOU_ID = () => globalThis.crypto.randomUUID();
/* La versió de l'avís de privacitat; AppGenealogia hi passa la de textos.js (VERSIO_AVIS). */
export const VERSIO_AVIS_PER_DEFECTE = 1;

const nomesLectura = () => Object.assign(new Error('Una altra pestanya està escrivint: esta només pot llegir.'), { codi: 'NOMES_LECTURA' });
/* Codis del cofre que volen dir «esta clau ja no obri el disc»: es bloqueja. */
const CODIS_COFRE_PERDUT = new Set(['frase-incorrecta', 'no-xifrat', 'sobre-invalid']);
/* L'estat d'una base xifrada tancada: cap dada desxifrada (el disc només té la meta 'xifrat'). */
const ESTAT_TANCAT = Object.freeze({ meta: Object.freeze({ avis: null, arbreActiu: null, ultimaCopia: null }), arbres: [], complet: null, xifrat: true, bloquejat: true });

/* Un error de validació (TypeError del model) o del magatzem, en codis. */
function aErrors(error) {
  if (error?.codi) return [{ camp: null, clau: error.codi }];
  if (error instanceof TypeError) return [{ camp: error.camp ?? null, clau: error.clau ?? 'invalid' }];
  throw error;
}

export function ProveidorGenealogia({ magatzem: propi, rellotge = RELLOTGE, nouId = NOU_ID, versioAvis = VERSIO_AVIS_PER_DEFECTE, children }) {
  const anyActual = rellotge().getFullYear();
  const [magatzem] = useState(() => propi || creaMagatzemGenealogia({ anyActual }));
  const [estat, setEstat] = useState({ carregat: false, error: null, meta: null, arbres: [], complet: null, xifrat: false, bloquejat: false });
  const [mode, setMode] = useState(magatzem.mode);
  const [persistent, setPersistent] = useState(magatzem.persistent);
  const viu = useRef(true);
  /* L'arbre triat en esta pestanya (també en una pestanya que només llig). */
  const triat = useRef(null);
  /* La base xifrada oberta: { memoria, clau, sal }, o null. Només en memòria. */
  const [sessio, setSessio] = useState(null);
  const sessioRef = useRef(null);
  const posaSessio = useCallback((nova) => {
    const vella = sessioRef.current;
    if (vella && vella !== nova) vella.memoria.tanca();
    sessioRef.current = nova;
    setSessio(nova);
  }, []);
  /* Tanca la base xifrada: descarta la sessió i buida ARA l'estat desxifrat,
     sense esperar la lectura del disc (que pot fallar o tardar). */
  const tancaSessio = useCallback(() => {
    posaSessio(null);
    setEstat((abans) => (abans.xifrat ? { ...abans, ...ESTAT_TANCAT } : abans));
  }, [posaSessio]);

  const tokenLectura = useRef(0);
  /* `rellegix`: torna a desxifrar el disc (una altra pestanya l'ha canviat). */
  const recarrega = useCallback(async ({ rellegix = false } = {}) => {
    const token = ++tokenLectura.current;
    try {
      let llegit = await carregaEstatGenealogia(magatzem, triat.current);
      let oberta = sessioRef.current;
      if (oberta && !llegit.xifrat) {
        oberta = null;
        posaSessio(null);
      } else if (oberta && rellegix) {
        try {
          oberta = await obreCofreAmbClau(magatzem, oberta.clau, { anyActual });
        } catch (error) {
          if (!CODIS_COFRE_PERDUT.has(error?.codi)) throw error;
          oberta = null;
        }
        if (token !== tokenLectura.current) {
          if (oberta && oberta !== sessioRef.current) oberta.memoria.tanca();
          return;
        }
        posaSessio(oberta);
      }
      if (oberta) llegit = { ...await carregaEstatGenealogia(oberta.memoria, triat.current), xifrat: true };
      const bloquejat = llegit.xifrat && !oberta;
      if (viu.current && token === tokenLectura.current) setEstat((abans) => ({
        carregat: true, error: null, ...llegit, bloquejat,
        complet: igualRegistre(abans.complet, llegit.complet) ? abans.complet : llegit.complet
      }));
    } catch (error) {
      /* Sense sessió oberta, una base xifrada continua tancada encara que la lectura falle. */
      const tancada = !sessioRef.current;
      if (viu.current && token === tokenLectura.current) setEstat((abans) => (abans.xifrat && tancada
        ? { ...abans, ...ESTAT_TANCAT, error }
        : { ...abans, carregat: Boolean(abans.meta), error }));
    }
  }, [magatzem, anyActual, posaSessio]);

  useEffect(() => {
    viu.current = true;
    let pendent = false;
    let rellegixPendent = false;
    /* Amb la base xifrada, `rellegix` torna a desxifrar el disc: ho ha canviat
       una altra pestanya. La que escriu no ho fa en tornar a la pestanya, perquè
       la seua memòria ja és la més nova. */
    const refresca = (rellegix = false) => {
      rellegixPendent ||= rellegix;
      if (pendent) return;
      pendent = true;
      queueMicrotask(() => {
        pendent = false;
        const ara = rellegixPendent;
        rellegixPendent = false;
        if (viu.current) recarrega({ rellegix: ara });
      });
    };
    const desfes = magatzem.subscriu((avis) => {
      if (avis.tipus === 'canvi' && avis.local === false) refresca(true);
      else if (avis.tipus === 'mode') {
        setMode(avis.mode);
        refresca(true);
      } else if (avis.tipus === 'persistent') setPersistent(avis.persistent);
    });
    // També hi ha navegadors sense BroadcastChannel: revisa l'estat en tornar a la pestanya.
    const finestra = globalThis.window;
    const enFocus = () => refresca(magatzem.mode !== 'escriptora');
    /* En amagar la pàgina, la base xifrada es tanca: la clau no queda en memòria. */
    const enAmagar = () => {
      if (!sessioRef.current) return;
      tancaSessio();
      if (viu.current) recarrega();
    };
    finestra?.addEventListener('focus', enFocus);
    finestra?.addEventListener('pagehide', enAmagar);
    magatzem.obtinBloqueig().then((nou) => { if (viu.current) setMode(nou); });
    recarrega();
    return () => {
      viu.current = false;
      tokenLectura.current += 1;
      finestra?.removeEventListener('focus', enFocus);
      finestra?.removeEventListener('pagehide', enAmagar);
      desfes();
      sessioRef.current?.memoria.tanca();
      sessioRef.current = null;
      magatzem.tanca();
    };
  }, [magatzem, recarrega, posaSessio, tancaSessio]);

  const { complet, meta, arbres } = estat;
  const ara = useCallback(() => rellotge().toISOString(), [rellotge]);

  /* Amb la base xifrada oberta, el que s'ha escrit en memòria es torna a
     xifrar al disc; si no es pot, la memòria es refà des del disc. Si la
     sessió ha canviat mentre s'escrivia, no es desa res: 'desactualitzat'.
     Els desats van en cua (foto, xifrat i escriptura, un darrere de l'altre):
     un xifrat que acaba tard no pot trepitjar una foto més nova. Cada desat
     comprova que el cofre del disc és el que esta sessió va llegir o escriure
     (l'IV); si una altra pestanya l'ha canviat, 'desactualitzat'. */
  const cuaCofre = useRef(Promise.resolve());
  const persistix = useCallback((oberta = sessioRef.current) => {
    if (!oberta) return Promise.resolve();
    const torn = cuaCofre.current.then(async () => {
      if (oberta !== sessioRef.current) {
        await recarrega();
        throw arbreDesactualitzat();
      }
      try {
        oberta.iv = await desaCofre(magatzem, oberta.memoria, oberta.clau, { sal: oberta.sal, iv: oberta.iv });
      } catch (error) {
        await recarrega({ rellegix: true });
        throw error;
      }
    });
    cuaCofre.current = torn.catch(() => {});
    return torn;
  }, [magatzem, recarrega]);

  /* Cada escriptura torna a llegir-ho tot: la font de veritat és el magatzem. */
  const escriu = useCallback(async (fn) => {
    const oberta = sessioRef.current;
    if (oberta && magatzem.mode === 'lectora') throw nomesLectura();
    const resultat = await fn();
    await persistix(oberta);
    await recarrega();
    return resultat;
  }, [magatzem, persistix, recarrega]);

  const alertes = useMemo(() => (complet ? detectaContradiccions(complet, { anyActual }) : []), [complet, anyActual]);
  const duplicats = useMemo(() => detectaDuplicats(complet), [complet]);
  const sosa = useMemo(() => (complet?.arbre.arrelId ? numeraSosa(complet, complet.arbre.arrelId) : null), [complet]);
  const vius = useMemo(() => (complet ? idsVius(complet, { anyActual }) : new Set()), [complet, anyActual]);

  const operacions = useMemo(() => {
    /* On es llig i s'escriu: la memòria de la base xifrada oberta o el disc. */
    const dades = sessio?.memoria ?? magatzem;
    const ambArbre = (fn) => (complet ? fn(complet) : Promise.resolve({ ok: false, errors: [{ camp: 'arbre', clau: 'sense-arbre' }] }));
    const tocaArbre = (actual) => ({ ...actual.arbre, modificat: ara() });
    const mutaArbre = (arbreId, calcula) => escriu(() => actualitzaArbre(dades, arbreId, calcula));
    const comprovaRegistre = (esperat, vigent) => {
      if (!igualRegistre(esperat, vigent)) throw arbreDesactualitzat();
    };

    async function nouArbre(titol) {
      const arbre = creaArbreModel({ id: nouId(), titol, ara: ara() });
      await desaArbre(dades, arbreBuit(arbre), { activa: true, nou: true });
      triat.current = arbre.id;
      return arbre;
    }

    /*
     * Una passa de l'entrevista: calcula el nou estat, l'aplica a l'arbre si
     * cal (`aplica`: l'id del pas respost, perquè només es reescriga la
     * persona d'eixe pas) i ho desa tot. Sense arbre actiu, en crea un.
     */
    async function passaEntrevista(calcula) {
      let resultat;
      const marca = ara();
      const construeix = (actual) => {
        comprovaRegistre(complet?.entrevista ?? null, actual.entrevista);
        const abans = actual.entrevista ?? estatInicialEntrevista(actual.arbre.id, { ara: marca });
        resultat = calcula(abans, marca);
        if (!resultat.ok) return undefined;
        const nou = { ...actual, arbre: tocaArbre(actual), entrevista: resultat.estat };
        return resultat.aplica
          ? aplicaEntrevista(resultat.estat, nou, { nouId, ara: marca, anyActual, nomesPasId: resultat.aplica })
          : nou;
      };
      try {
        if (complet) await mutaArbre(complet.arbre.id, construeix);
        else {
          const arbre = creaArbreModel({ id: nouId(), titol: '', ara: marca });
          const nou = construeix(arbreBuit(arbre));
          if (nou) await escriu(async () => {
            await desaArbre(dades, nou, { activa: true, nou: true, nomesPrimer: true });
            triat.current = arbre.id;
          });
        }
      } catch (error) {
        return { ok: false, errors: aErrors(error) };
      }
      return { ok: resultat.ok, errors: resultat.ok ? [] : resultat.errors };
    }

    return {
      acceptaAvis: () => escriu(() => desaMeta(dades, 'avis', { acceptatA: ara(), versio: versioAvis })),

      /** Crea un arbre buit, el fa actiu i en torna l'id. */
      creaArbre: ({ titol = '' } = {}) => escriu(async () => (await nouArbre(titol)).id),

      /** Canvia l'arbre actiu (en una pestanya que només llig, només en esta pestanya). */
      triaArbre: async (arbreId) => {
        const anterior = triat.current;
        triat.current = arbreId;
        try {
          await activaArbre(dades, arbreId);
          await persistix();
        } catch (error) {
          if (error?.codi !== 'NOMES_LECTURA') {
            if (triat.current === arbreId) triat.current = anterior;
            await recarrega();
            throw error;
          }
        }
        await recarrega();
      },

      esborraArbre: (arbreId, { esperat = complet?.arbre.id === arbreId ? complet : undefined } = {}) => escriu(async () => {
        if (esperat && complet?.arbre.id !== arbreId) throw arbreDesactualitzat();
        await esborraArbreDelMagatzem(dades, arbreId, esperat);
        if (triat.current === arbreId) triat.current = null;
      }),

      /** Desa les dades de l'arbre actiu (títol, malnom de la casa, poble, mas). */
      desaArbre: (camps) => ambArbre(async (actual) => {
        try {
          const nou = await mutaArbre(actual.arbre.id, (vigent) => {
            comprovaRegistre(actual.arbre, vigent.arbre);
            const arbre = netejaArbre({ ...vigent.arbre, ...camps, id: vigent.arbre.id, creat: vigent.arbre.creat, modificat: ara() });
            return { ...vigent, arbre };
          });
          return { ok: true, errors: [], arbre: nou.arbre };
        } catch (error) {
          return { ok: false, errors: aErrors(error) };
        }
      }),

      /** Valida i desa una persona (nova o editada). Torna { ok, errors, persona }. */
      desaPersona: (cru, { esperat } = {}) => ambArbre(async (actual) => {
        const existent = cru?.id ? actual.persones.find((p) => p.id === cru.id) : null;
        const marca = ara();
        try {
          const persona = netejaPersona({
            ...cru,
            id: existent?.id ?? nouId(),
            arbreId: actual.arbre.id,
            origen: cru?.origen ?? existent?.origen ?? 'ma',
            creada: existent?.creada ?? marca,
            modificada: marca
          }, { anyActual });
          await mutaArbre(actual.arbre.id, (vigent) => {
            const anterior = vigent.persones.find((p) => p.id === persona.id);
            if (cru?.id && !existent) throw arbreDesactualitzat();
            comprovaRegistre(esperat ?? existent ?? undefined, anterior);
            const persones = [...vigent.persones.filter((p) => p.id !== persona.id), persona];
            return { ...vigent, persones, arbre: tocaArbre(vigent) };
          });
          return { ok: true, errors: [], persona };
        } catch (error) {
          return { ok: false, errors: aErrors(error), persona: null };
        }
      }),

      /** Esborra una persona i les relacions que la toquen (i l'arrel, si ho era). */
      esborraPersona: (personaId, { esperat } = {}) => ambArbre((actual) => mutaArbre(actual.arbre.id, (vigent) => {
        comprovaRegistre(esperat ?? actual, vigent);
        const persones = vigent.persones.filter((p) => p.id !== personaId);
        const fonts = new Set(persones.flatMap((p) => p.fonts.map((f) => f.id)));
        const relacions = vigent.relacions.filter((r) => r.de !== personaId && r.a !== personaId)
          .map((r) => ({ ...r, fontIds: r.fontIds.filter((id) => fonts.has(id)) }));
        return {
          ...vigent,
          arbre: { ...tocaArbre(vigent), arrelId: vigent.arbre.arrelId === personaId ? null : vigent.arbre.arrelId },
          persones, relacions
        };
      })),

      fusionaDuplicats: (parell, { confirmada = false, esperat } = {}) => ambArbre((actual) => (
        mutaArbre(actual.arbre.id, (vigent) => {
          if (!esperat) throw arbreDesactualitzat();
          comprovaRegistre(esperat, vigent);
          return fusionaDuplicats(vigent, { ...parell, confirmada, ara: ara(), anyActual });
        })
      )),

      /**
       * Valida i desa una relació. L'estat el dona l'evidència (estatDeVincle),
       * llevat d'una contradicció marcada a mà. Mai a partir d'un cognom.
       */
      desaRelacio: (cru) => ambArbre(async (actual) => {
        const ids = new Set(actual.persones.map((p) => p.id));
        if (!ids.has(cru?.de)) return { ok: false, errors: [{ camp: 'de', clau: 'invalid' }], relacio: null };
        if (!ids.has(cru?.a)) return { ok: false, errors: [{ camp: 'a', clau: 'invalid' }], relacio: null };
        const existent = cru.id ? actual.relacions.find((r) => r.id === cru.id) : null;
        const marca = ara();
        try {
          const base = netejaRelacio({ ...cru, id: existent?.id ?? nouId(), arbreId: actual.arbre.id, creada: existent?.creada ?? marca, modificada: marca, estat: undefined });
          const relacio = { ...base, estat: cru.estat === 'contradiccio' ? 'contradiccio' : estatDeVincle(base.evidencia) };
          await mutaArbre(actual.arbre.id, (vigent) => {
            const anterior = vigent.relacions.find((r) => r.id === relacio.id);
            if (cru.id && !existent) throw arbreDesactualitzat();
            comprovaRegistre(existent ?? undefined, anterior);
            const relacions = [...vigent.relacions.filter((r) => r.id !== relacio.id), relacio];
            return { ...vigent, relacions, arbre: tocaArbre(vigent) };
          });
          return { ok: true, errors: [], relacio };
        } catch (error) {
          return { ok: false, errors: aErrors(error), relacio: null };
        }
      }),

      esborraRelacio: (relacioId) => ambArbre((actual) => mutaArbre(actual.arbre.id, (vigent) => {
        comprovaRegistre(actual.relacions.find((r) => r.id === relacioId), vigent.relacions.find((r) => r.id === relacioId));
        return { ...vigent, relacions: vigent.relacions.filter((r) => r.id !== relacioId), arbre: tocaArbre(vigent) };
      })),

      /** La persona que fa de Sosa 1. */
      posaArrel: (personaId) => ambArbre((actual) => {
        if (!actual.persones.some((p) => p.id === personaId)) return Promise.resolve({ ok: false, errors: [{ camp: 'arrelId', clau: 'invalid' }] });
        return mutaArbre(actual.arbre.id, (vigent) => {
          if (actual.arbre.arrelId !== vigent.arbre.arrelId || !vigent.persones.some((p) => p.id === personaId)) throw arbreDesactualitzat();
          return { ...vigent, arbre: { ...tocaArbre(vigent), arrelId: personaId } };
        });
      }),

      /** Respon la pregunta actual i aplica la resposta a l'arbre (sense arbre, en crea un). */
      respon: (valor) => passaEntrevista((abans, marca) => ({
        ...responEntrevista(abans, valor, { anyActual, ara: marca }),
        aplica: pasActual(abans)?.id ?? null
      })),
      salta: () => passaEntrevista((abans, marca) => ({ ok: true, errors: [], estat: saltaEntrevista(abans, { ara: marca }) })),
      enrere: () => passaEntrevista((abans, marca) => ({ ok: true, errors: [], estat: enrereEntrevista(abans, { ara: marca }) })),
      /** Lleva un germà o un besavi afegit per error (la persona creada es queda a l'arbre). */
      treuResposta: (pasId, index) => passaEntrevista((abans, marca) => ({ ok: true, errors: [], estat: treuRespostaEntrevista(abans, pasId, index, { ara: marca }) })),
      /** Torna a començar l'entrevista; les persones ja creades es conserven. */
      reiniciaEntrevista: () => passaEntrevista((abans, marca) => ({ ok: true, errors: [], estat: estatInicialEntrevista(abans.arbreId, { ara: marca }) })),

      /**
       * Importa un arbre ja llegit (gedcom/ o la còpia JSON, amb ids nous).
       *   'nou'        el desa com a arbre nou i el fa actiu;
       *   'substituix' substituïx el contingut de l'arbre actiu (la vista ho
       *                confirma abans amb un DialegConfirmacio).
       * Torna l'id de l'arbre.
       */
      importa: async (entrant, { mode: modeImportacio = 'nou', esperat = complet } = {}) => {
        if (modeImportacio === 'substituix') {
          if (!esperat || complet?.arbre.id !== esperat.arbre.id) throw arbreDesactualitzat();
          const arbreId = esperat.arbre.id;
          const remapat = {
            arbre: netejaArbre({ ...entrant.arbre, id: arbreId, creat: esperat.arbre.creat, modificat: ara() }),
            persones: entrant.persones.map((p) => ({ ...p, arbreId })),
            relacions: entrant.relacions.map((r) => ({ ...r, arbreId })),
            entrevista: entrant.entrevista ? { ...entrant.entrevista, arbreId } : null
          };
          await escriu(() => desaArbre(dades, remapat, { activa: true, esperat }));
          return arbreId;
        }
        if (modeImportacio !== 'nou') throw errorCamp('mode');
        await escriu(async () => {
          await desaArbre(dades, entrant, { activa: true, nou: true });
          triat.current = entrant.arbre.id;
        });
        return entrant.arbre.id;
      },

      /** Anota que s'ha fet una còpia (per al recordatori). */
      marcaCopia: () => escriu(() => desaMeta(dades, 'ultimaCopia', ara())),

      demanaPersistencia: () => magatzem.demanaPersistencia(),
      estatPersistencia: () => magatzem.estatPersistencia(),

      /** Obri la base xifrada amb la frase. Torna { ok, errors } ('frase-incorrecta'…). */
      desbloqueja: async (frase) => {
        try {
          posaSessio(await obreCofre(magatzem, frase, { anyActual }));
          await recarrega();
          return { ok: true, errors: [] };
        } catch (error) {
          return { ok: false, errors: aErrors(error) };
        }
      },

      /** Tanca la base xifrada: la clau i les dades desxifrades es descarten. */
      bloqueja: async () => {
        tancaSessio();
        await recarrega();
      },

      /** Xifra la base d'este dispositiu amb una frase de pas (la regla del cofre: exigixFrase) i la deixa oberta. */
      activaXifrat: async (frase) => {
        try {
          if (magatzem.mode === 'lectora') throw nomesLectura();
          const clau = await activaXifratDelMagatzem(magatzem, frase);
          posaSessio(await obreCofreAmbClau(magatzem, clau, { anyActual }));
          await recarrega();
          return { ok: true, errors: [] };
        } catch (error) {
          return { ok: false, errors: aErrors(error) };
        }
      },

      /** Torna a deixar la base en clar (cal la frase). */
      desactivaXifrat: async (frase) => {
        try {
          await desactivaXifratDelMagatzem(magatzem, frase);
          posaSessio(null);
          await recarrega();
          return { ok: true, errors: [] };
        } catch (error) {
          return { ok: false, errors: aErrors(error) };
        }
      }
    };
  }, [complet, magatzem, sessio, nouId, ara, anyActual, versioAvis, escriu, persistix, recarrega, posaSessio, tancaSessio]);

  const valor = useMemo(() => ({
    carregat: estat.carregat,
    error: estat.error,
    persistent,
    mode,
    xifrat: estat.xifrat,
    bloquejat: estat.bloquejat,
    nomesLectura: mode === 'lectora',
    anyActual,
    avisAcceptat: Boolean(meta?.avis && meta.avis.versio >= versioAvis),
    ultimaCopia: meta?.ultimaCopia ?? null,
    arbres,
    arbreActiu: complet?.arbre.id ?? null,
    complet,
    alertes,
    duplicats,
    sosa,
    esViva: (personaId) => vius.has(personaId) || !complet?.persones.some((p) => p.id === personaId),
    ...operacions
  }), [estat, persistent, mode, anyActual, meta, versioAvis, arbres, complet, alertes, duplicats, sosa, vius, operacions]);

  return <GenealogiaContext.Provider value={valor}>{children}</GenealogiaContext.Provider>;
}

export function useGenealogia() {
  const valor = useContext(GenealogiaContext);
  if (!valor) throw new Error('useGenealogia s’ha de cridar dins de ProveidorGenealogia');
  return valor;
}
