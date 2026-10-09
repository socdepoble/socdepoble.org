/**
 * magatzemCofre.js — on dorm el cofre xifrat de la Gestoria: IndexedDB,
 * base 'sdp-gestoria-cofre'.
 *
 * Onada 6, ordre del Mestre (261009): cofre xifrat. Patró de
 * facturacio/magatzemPerfil.js i de registre/portIndexedDB.js (connexió
 * perezosa, una transacció per operació que resol quan es completa, errors
 * amb codi, SENSE_INDEXEDDB si no n'hi ha i mai memòria). Ací només
 * arriben bytes xifrats: este fitxer no sap xifrar ni desxifrar res.
 *   · 'meta': una sola fila, 'cofre', amb els paràmetres versionats i la DEK
 *     embolcallada dues vegades (frase i codi de recuperació). Es crea amb
 *     add() (dues pestanyes no creen dos cofres) i se substituïx amb una
 *     comparació dins de la mateixa transacció (COFRE_CANVIAT si una altra
 *     pestanya hi ha escrit entremig).
 *   · 'registres': { clau, colleccio, id, iv, xifrat }; la clau és
 *     «col·lecció|id» i l'id és opac (un UUID). Desar reescriu el registre
 *     sencer amb un IV nou; esborrar l'esborra de veres: d'un cofre de dades
 *     personals, el que es lleva no s'ha de quedar.
 * Les escriptures de xifrats (desar, afegir i rotar) porten la meta amb què
 * es va obrir la sessió i la comparen dins de la mateixa transacció: si una
 * altra pestanya ha canviat la frase, el codi o la clau, COFRE_CANVIAT i res
 * escrit (mai un registre xifrat amb una clau que ja no és la del cofre).
 * La col·lecció va en clar per a poder llistar-la sense desxifrar-ho tot: és
 * una etiqueta del codi (públic), mai una dada. Res d'això ix de l'ordinador.
 */
import { errorAmbCodi } from './nucli/cripto.js';

export const NOM_BD_COFRE = 'sdp-gestoria-cofre';
export const VERSIO_BD_COFRE = 1;
const META = 'meta';
const REGISTRES = 'registres';
const PER_COLLECCIO = 'perColleccio';
const CLAU_META = 'cofre';

/** La clau d'un registre: «col·lecció|id». */
export const clauRegistre = (colleccio, id) => `${colleccio}|${id}`;

const senseClau = (fila) => {
  if (!fila) return null;
  const resta = { ...fila };
  delete resta.clau;
  return resta;
};

/** Mateixa meta: les dues sals i els dos embolcalls (dues metes absents mai no són «la mateixa»). */
export const mateixaMeta = (a, b) => Boolean(a && b) && ['contrasenya', 'recuperacio']
  .every((camp) => typeof a[camp]?.sal === 'string' && a[camp].sal === b[camp]?.sal && a[camp].dek === b[camp]?.dek);

const canviat = () => errorAmbCodi('COFRE_CANVIAT', 'El cofre ha canviat en una altra pestanya: torna-ho a provar.');
const filaDe = ({ colleccio, id, iv, xifrat }) => ({ clau: clauRegistre(colleccio, id), colleccio, id, iv, xifrat });

/**
 * @param {object} [opcions]
 * @param {string} [opcions.nom] el nom de la base
 * @param {IDBFactory} [opcions.idb] per defecte globalThis.indexedDB
 */
export function creaMagatzemCofre({ nom = NOM_BD_COFRE, idb = globalThis.indexedDB } = {}) {
  if (!idb || typeof idb.open !== 'function') {
    throw errorAmbCodi('SENSE_INDEXEDDB', 'Este navegador no deixa desar el cofre (IndexedDB): ací no es pot obrir.');
  }
  let connexio = null;

  const obri = () => {
    if (!connexio) {
      connexio = new Promise((resol, rebutja) => {
        const peticio = idb.open(nom, VERSIO_BD_COFRE);
        peticio.onupgradeneeded = () => {
          const bd = peticio.result;
          if (!bd.objectStoreNames.contains(META)) bd.createObjectStore(META, { keyPath: 'clau' });
          if (!bd.objectStoreNames.contains(REGISTRES)) {
            bd.createObjectStore(REGISTRES, { keyPath: 'clau' }).createIndex(PER_COLLECCIO, 'colleccio', { unique: false });
          }
        };
        peticio.onsuccess = () => {
          const bd = peticio.result;
          bd.onversionchange = () => {
            bd.close();
            connexio = null;
          };
          resol(bd);
        };
        peticio.onerror = () => rebutja(peticio.error ?? new Error('No s’ha pogut obrir el cofre.'));
        peticio.onblocked = () => rebutja(errorAmbCodi('BLOQUEJAT', 'Una altra pestanya té oberta una versió anterior del cofre: tanca-la.'));
      });
      connexio.catch(() => {
        connexio = null;
      });
    }
    return connexio;
  };

  /* Una transacció; resol quan es completa, no quan acaba una petició. */
  const opera = async (stores, mode, accio) => {
    const bd = await obri();
    return new Promise((resol, rebutja) => {
      let tx;
      try {
        tx = bd.transaction(stores, mode);
      } catch (error) {
        rebutja(error);
        return;
      }
      let resultat;
      let errorPropi = null;
      const torna = (valor) => {
        resultat = valor;
      };
      const avorta = (error) => {
        errorPropi = error;
        try { tx.abort(); } catch { /* ja acabada */ }
      };
      const falla = (event) => rebutja(errorPropi ?? event?.target?.error ?? tx.error ?? new Error('El cofre no ha respost.'));
      tx.oncomplete = () => resol(resultat);
      tx.onerror = falla;
      tx.onabort = falla;
      try {
        accio((nomStore) => tx.objectStore(nomStore), torna, avorta);
      } catch (error) {
        avorta(error);
      }
    });
  };

  const llegix = (store, clau) => opera([store], 'readonly', (s, torna) => {
    const peticio = s(store).get(clau);
    peticio.onsuccess = () => torna(peticio.result ?? null);
  });

  /* Dins d'una transacció: si la meta vigent no és `esperada`, COFRE_CANVIAT; si ho és, seguix. */
  const ambLaMeta = (s, esperada, avorta, seguix) => {
    const peticio = s(META).get(CLAU_META);
    peticio.onsuccess = () => {
      if (!mateixaMeta(senseClau(peticio.result), esperada)) {
        avorta(canviat());
        return;
      }
      seguix();
    };
  };

  return Object.freeze({
    tipus: 'indexeddb',

    /** La meta del cofre (sense la clau de la fila), o null si encara no n'hi ha. */
    async llegixMeta() {
      return senseClau(await llegix(META, CLAU_META));
    },

    /** Crea la meta; COFRE_EXISTENT si ja n'hi ha (add, mai put). */
    creaMeta(meta) {
      return opera([META], 'readwrite', (s) => {
        s(META).add({ ...meta, clau: CLAU_META });
      }).catch((error) => {
        if (error?.name === 'ConstraintError') throw errorAmbCodi('COFRE_EXISTENT', 'Ja hi ha un cofre en este navegador.');
        throw error;
      });
    },

    /** Substituïx la meta si la vigent és encara `anterior`; si no, COFRE_CANVIAT. */
    substituixMeta(nova, anterior) {
      return opera([META], 'readwrite', (s, torna, avorta) => {
        ambLaMeta(s, anterior, avorta, () => {
          s(META).put({ ...nova, clau: CLAU_META });
        });
      });
    },

    /** Un registre ({ clau, colleccio, id, iv, xifrat }), o null. */
    llegixRegistre(colleccio, id) {
      return llegix(REGISTRES, clauRegistre(colleccio, id));
    },

    /** Desa (o reescriu) un registre xifrat, si la meta és encara `meta` (la de la sessió); si no, COFRE_CANVIAT. */
    desaRegistre(registre, meta) {
      return opera([META, REGISTRES], 'readwrite', (s, torna, avorta) => {
        ambLaMeta(s, meta, avorta, () => {
          s(REGISTRES).put(filaDe(registre));
        });
      });
    },

    /** Esborra un registre; cert si hi era. */
    esborraRegistre(colleccio, id) {
      const clau = clauRegistre(colleccio, id);
      return opera([REGISTRES], 'readwrite', (s, torna) => {
        const peticio = s(REGISTRES).get(clau);
        peticio.onsuccess = () => {
          torna(Boolean(peticio.result));
          if (peticio.result) s(REGISTRES).delete(clau);
        };
      });
    },

    /** Els registres d'una col·lecció, en l'ordre de la clau. */
    registresDe(colleccio) {
      return opera([REGISTRES], 'readonly', (s, torna) => {
        const peticio = s(REGISTRES).index(PER_COLLECCIO).getAll(colleccio);
        peticio.onsuccess = () => torna(peticio.result ?? []);
      });
    },

    /** Tots els registres, en l'ordre de la clau (per a la còpia). */
    totsElsRegistres() {
      return opera([REGISTRES], 'readonly', (s, torna) => {
        const peticio = s(REGISTRES).getAll();
        peticio.onsuccess = () => torna(peticio.result ?? []);
      });
    },

    /**
     * Restaura un cofre sencer d'una còpia ja verificada, en UNA transacció:
     * només si no hi ha cap cofre (COFRE_EXISTENT); els registres orfes d'abans
     * (xifrats amb una clau que ja no existix) es buiden.
     */
    restaura(meta, registres) {
      return opera([META, REGISTRES], 'readwrite', (s, torna, avorta) => {
        const peticio = s(META).get(CLAU_META);
        peticio.onsuccess = () => {
          if (peticio.result) {
            avorta(errorAmbCodi('COFRE_EXISTENT', 'Ja hi ha un cofre en este navegador: obri’l abans d’importar-hi una còpia.'));
            return;
          }
          s(REGISTRES).clear();
          s(META).add({ ...meta, clau: CLAU_META });
          for (const r of registres) s(REGISTRES).put(filaDe(r));
          torna(registres.length);
        };
      });
    },

    /**
     * Afig els registres que falten, en UNA transacció i si la meta és encara
     * `meta` (COFRE_CANVIAT si no); mai reescriu els que hi són.
     */
    afegixSiFalten(registres, meta) {
      return opera([META, REGISTRES], 'readwrite', (s, torna, avorta) => {
        ambLaMeta(s, meta, avorta, () => {
          let afegits = 0;
          let conservats = 0;
          let pendents = registres.length;
          if (pendents === 0) torna({ afegits, conservats });
          for (const r of registres) {
            const fila = filaDe(r);
            const peticio = s(REGISTRES).get(fila.clau);
            peticio.onsuccess = () => {
              if (peticio.result) conservats += 1;
              else {
                s(REGISTRES).add(fila);
                afegits += 1;
              }
              pendents -= 1;
              if (pendents === 0) torna({ afegits, conservats });
            };
          }
        });
      });
    },

    /**
     * La rotació de la clau, en UNA transacció: si la meta és encara
     * `anterior` i els registres són els `llegits` (mateixes claus i mateix
     * IV, que és aleatori a cada escriptura), buida els registres, hi posa els
     * `nous` (tornats a xifrar amb la DEK nova) i substituïx la meta. Si
     * alguna cosa ha canviat entremig, COFRE_CANVIAT i res escrit.
     */
    rota(nova, anterior, llegits, nous) {
      return opera([META, REGISTRES], 'readwrite', (s, torna, avorta) => {
        ambLaMeta(s, anterior, avorta, () => {
          const peticio = s(REGISTRES).getAll();
          peticio.onsuccess = () => {
            const ara = peticio.result ?? [];
            const ivs = new Map(llegits.map((r) => [clauRegistre(r.colleccio, r.id), r.iv]));
            if (ara.length !== ivs.size || ara.some((fila) => ivs.get(fila.clau) !== fila.iv)) {
              avorta(canviat());
              return;
            }
            s(REGISTRES).clear();
            for (const r of nous) s(REGISTRES).put(filaDe(r));
            s(META).put({ ...nova, clau: CLAU_META });
            torna(nous.length);
          };
        });
      });
    },

    tanca() {
      if (connexio) connexio.then((bd) => bd.close(), () => {});
      connexio = null;
    }
  });
}
