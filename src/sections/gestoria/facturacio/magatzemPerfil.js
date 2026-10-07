/**
 * magatzemPerfil.js — el perfil fiscal local de l'empresa: la configuració, el
 * llegat i la marca de l'última còpia del llibre, a IndexedDB i de només afegir.
 *
 * Ordre del Mestre, 261007 («tindre la facturació operativa inclús sense
 * xarxa»; pas 1 del mapa de la Gestoria, buits G3 i G4). creaEmissio exigix
 * la configuració de l'empresa amb la data de pas i el llegat declarat, i fins
 * ara no es guardaven enlloc. Ací es guarden, separats del llibre legal:
 *   · base pròpia, 'sdp-gestoria-perfil', i no la del llibre
 *     ('sdp-facturacio'): el port del llibre és una llista blanca de quatre
 *     mètodes (validaPort) que no n'admet de nous, i el perfil no és cap
 *     registre fiscal ni entra a la cadena;
 *   · VERSIONS DE NOMÉS AFEGIR: cada desament és una versió nova amb add(),
 *     mai put() ni delete(), i la vigent és la més alta de cada tipus. Una
 *     configuració canviada no reescriu l'anterior: l'historial es conserva;
 *   · cada versió es valida abans d'entrar: la configuració amb
 *     llegixConfigEmpresa i la data de pas (SENSE_DATA_PAS), el llegat amb
 *     l'esquema de sembraLlegat i seriesDelLlegat, i la marca de còpia amb el
 *     NIF, l'ordre i l'empremta de l'últim registre de cada cadena exportada
 *     (verificaCadena la rep com a ultimsConeguts i hi detecta truncaments);
 *   · sense IndexedDB, SENSE_INDEXEDDB: mai no passa a memòria, perquè una
 *     configuració que es perd en tancar la pestanya faria emetre amb una
 *     altra (registre/portIndexedDB.js fa el mateix amb el llibre).
 *
 * EL PERFIL ES FIXA QUAN S'EMET (ordre del Mestre, 261007; troballes F2 i F4
 * de la revisió de la Facturació). Una versió nova es compara amb la vigent
 * dins de la mateixa transacció que l'afig (dues pestanyes no s'hi colen):
 *   · amb factures del NIF vigent al llibre (afegixConfig i afegixLlegat
 *     reben els registres del llibre, sempre: sense, no es desa res), el NIF i
 *     la data de pas ja no canvien, i el llegat no perd cap sèrie declarada ni
 *     cap número: PERFIL_FIXAT, amb la llista a `detalls`. Un NIF nou
 *     amagaria les factures emeses, i una data de pas avançada deixaria emetre
 *     dies que facturava l'eina d'abans («dos programes no emeten alhora»);
 *   · la marca de còpia no recula: cada cadena de la marca vigent ha de ser a
 *     la nova, amb el mateix registre o un de posterior. Si no, MARCA_ENRERE:
 *     una còpia d'un llibre truncat esborraria la detecció del truncament.
 * Res d'això ix de l'ordinador: cap crida de xarxa. Sense DOM ni React.
 */
import { copiaCongelada, errorAmbCodi, textNet } from './comu.js';
import { llegixConfigEmpresa } from './configEmpresa.js';
import { ESQUEMA_LLEGAT } from './llegat.js';
import { creaFila } from './registre/port.js';
import { esEmpremta } from './registre/empremta.js';
import { esNifEmissor } from './registre/validacio.js';
import { seriesDelLlegat } from './serie.js';

export const NOM_BD_PERFIL = 'sdp-gestoria-perfil';
export const VERSIO_BD_PERFIL = 1;
/* Els tres tipus de versió: la configuració de l'empresa, el llegat de l'eina externa i la marca de la còpia. */
export const TIPUS_PERFIL = Object.freeze(['config', 'llegat', 'copia']);
const STORE = 'versions';
const AMPLADA_VERSIO = 12;
const MAX_NOM_FITXER = 255;
const MAX_CADENES = 100;

/* La fila desada: la clau ordena les versions de cada tipus i és única (add() refusa repetir-la). */
const clauDe = (tipus, versio) => `${tipus}|${String(versio).padStart(AMPLADA_VERSIO, '0')}`;
const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);

/**
 * Els errors d'una marca de còpia (llista buida si és bona). No llança.
 * La marca diu fins on arribava cada cadena del llibre quan se'n va fer còpia:
 * { cadenes: [{ idEmisor, ordre, empremta }], nomFitxer? }.
 * @param {object} marca
 * @returns {string[]}
 */
export function validaMarcaCopia(marca) {
  if (!esObjecte(marca)) return ['La marca de la còpia és { cadenes, nomFitxer? }.'];
  const errors = [];
  for (const camp of Object.keys(marca)) if (!['cadenes', 'nomFitxer'].includes(camp)) errors.push(`Camp desconegut: «${camp}».`);
  if (!Array.isArray(marca.cadenes) || marca.cadenes.length > MAX_CADENES) {
    errors.push(`cadenes és una llista (com a molt ${MAX_CADENES}) de { idEmisor, ordre, empremta }.`);
  } else {
    const vistos = new Set();
    marca.cadenes.forEach((c, i) => {
      const bona = esObjecte(c) && Object.keys(c).every((camp) => ['idEmisor', 'ordre', 'empremta'].includes(camp))
        && esNifEmissor(c.idEmisor) && Number.isSafeInteger(c.ordre) && c.ordre >= 1 && esEmpremta(c.empremta);
      if (!bona) errors.push(`Cadena ${i + 1}: cal { idEmisor, ordre, empremta } d'un registre del llibre.`);
      else if (vistos.has(c.idEmisor)) errors.push(`Cadena ${i + 1}: l'emissor està repetit.`);
      if (bona) vistos.add(c.idEmisor);
    });
  }
  if (marca.nomFitxer !== undefined) {
    const nom = textNet(marca.nomFitxer);
    if (nom === '' || nom.length > MAX_NOM_FITXER || nom !== marca.nomFitxer) errors.push('nomFitxer, si hi és, és el nom net del fitxer de la còpia.');
  }
  return errors;
}

/* La configuració neta, si es pot emetre amb ella: vàlida i amb la data de pas decidida. */
function configPerDesar(config) {
  const neta = llegixConfigEmpresa(config);
  if (!neta.facturacio?.dataPas) {
    throw errorAmbCodi('SENSE_DATA_PAS', 'Cal decidir la data de pas a Veri*Factu: sense, el programa no pot emetre cap factura.');
  }
  return neta;
}

/* El llegat tal com el torna sembraLlegat (també el d'una empresa sense llegat: sembraLlegat([])). */
function llegatPerDesar(llegat) {
  if (!esObjecte(llegat) || llegat.esquema !== ESQUEMA_LLEGAT) {
    throw errorAmbCodi('LLEGAT_INVALID', `El llegat és el resultat de sembraLlegat (${ESQUEMA_LLEGAT}).`);
  }
  try {
    seriesDelLlegat(llegat);
  } catch (error) {
    throw errorAmbCodi('LLEGAT_INVALID', `El llegat no és vàlid: ${error.message}`);
  }
  if (!Array.isArray(llegat.noReconeguts) || !llegat.noReconeguts.every((n) => typeof n === 'string')) {
    throw errorAmbCodi('LLEGAT_INVALID', 'El llegat porta la llista dels números no reconeguts (textos).');
  }
  return copiaCongelada(llegat);
}

function marcaPerDesar(marca) {
  const errors = validaMarcaCopia(marca);
  if (errors.length) throw errorAmbCodi('MARCA_INVALIDA', `La marca de la còpia no és vàlida: ${errors.join(' ')}`, errors);
  return copiaCongelada(marca);
}

/* Els registres del llibre, obligatoris per a desar la configuració o el llegat: sense, no se sap si ja s'ha emés. */
function registresDe(opcions, que) {
  if (!Array.isArray(opcions?.registres)) {
    throw new TypeError(`${que} necessita { registres }: els del llibre, per a saber si ja s'han emés factures amb el perfil.`);
  }
  return opcions.registres;
}

/**
 * Cert si el llibre ja té registres del NIF de la configuració: des d'aleshores, el perfil és fix.
 * @param {object|null} config la configuració vigent
 * @param {ReadonlyArray<object>} registres els del llibre
 * @returns {boolean}
 */
export const esPerfilFixat = (config, registres) => Boolean(config?.nif) && Array.isArray(registres)
  && registres.some((r) => r?.idEmisor === config.nif);

/* «el 07/10/2026» d'una data ISO, per als textos dels errors. */
const dataLlegible = (iso) => (typeof iso === 'string' ? iso.split('-').reverse().join('/') : String(iso));

/**
 * Els canvis que no es poden fer en una configuració fixa (la vigent, quan el
 * llibre ja té factures del seu NIF): el NIF i la data de pas. Llista buida si
 * no en canvia cap. No llança. La pantalla la fa servir abans de desar.
 * @param {object|null} vigent la configuració vigent (neta)
 * @param {object} nova la configuració que es vol desar (neta)
 * @returns {string[]}
 */
export function canvisFixosDeConfig(vigent, nova) {
  if (!vigent?.nif) return [];
  const errors = [];
  if (nova?.nif !== vigent.nif) {
    errors.push(`Ja hi ha factures emeses amb el NIF ${vigent.nif}: el NIF no es pot canviar.`);
  }
  const dataPas = vigent.facturacio?.dataPas;
  if (nova?.facturacio?.dataPas !== dataPas) {
    errors.push(`Ja hi ha factures emeses des del pas del ${dataLlegible(dataPas)}: la data de pas no es pot canviar.`);
  }
  return errors;
}

/**
 * Les sèries del llegat vigent que el llegat nou perdria (absents, o amb un
 * últim número més baix). Llista buida si no en perd cap. No llança.
 * @param {{ series?: object[] }|null} vigent
 * @param {{ series?: object[] }|null} nou
 * @returns {string[]}
 */
export function seriesQueEsPerden(vigent, nou) {
  const noves = Array.isArray(nou?.series) ? nou.series : [];
  return (Array.isArray(vigent?.series) ? vigent.series : []).flatMap((s) => {
    const ultim = Number.isSafeInteger(s?.ultim) ? s.ultim : 0;
    const igual = noves.find((n) => n?.prefix === s?.prefix && n?.any === s?.any);
    if (!igual) return [`La sèrie ${s?.prefix} de ${s?.any} (fins al número ${ultim}) ja estava declarada i no es pot llevar.`];
    const ultimNou = Number.isSafeInteger(igual.ultim) ? igual.ultim : 0;
    return ultimNou < ultim ? [`La sèrie ${s.prefix} de ${s.any} arribava fins al número ${ultim}: no es pot deixar en el ${ultimNou}.`] : [];
  });
}

/**
 * Les cadenes de la marca vigent que la marca nova faria recular: absents, amb
 * un ordre més baix o amb el mateix ordre i una altra empremta. No llança.
 * @param {{ cadenes?: object[] }|null} vigent
 * @param {{ cadenes?: object[] }} nova
 * @returns {string[]}
 */
export function cadenesQueRecularien(vigent, nova) {
  const noves = Array.isArray(nova?.cadenes) ? nova.cadenes : [];
  return (Array.isArray(vigent?.cadenes) ? vigent.cadenes : []).flatMap((c) => {
    const igual = noves.find((n) => n.idEmisor === c.idEmisor);
    if (!igual) return [`La còpia anterior portava la cadena de ${c.idEmisor} fins al registre ${c.ordre}, i esta no la porta.`];
    if (igual.ordre < c.ordre) return [`La còpia anterior arribava al registre ${c.ordre} de ${c.idEmisor}, i esta només al ${igual.ordre}.`];
    if (igual.ordre === c.ordre && igual.empremta !== c.empremta) return [`El registre ${c.ordre} de ${c.idEmisor} no és el de la còpia anterior.`];
    return [];
  });
}

/* Un error de la comprovació dins de la transacció: llança si la llista no és buida. */
function siNoBuit(codi, introduccio, errors) {
  if (errors.length) throw errorAmbCodi(codi, `${introduccio} ${errors.join(' ')}`, errors);
}

/* De totes les files, la versió vigent (la més alta) de cada tipus; null si no n'hi ha cap. */
function vigents(files) {
  const perTipus = Object.fromEntries(TIPUS_PERFIL.map((tipus) => [tipus, null]));
  for (const fila of files) {
    if (!TIPUS_PERFIL.includes(fila?.tipus)) continue;
    const actual = perTipus[fila.tipus];
    if (!actual || fila.versio > actual.versio) perTipus[fila.tipus] = fila;
  }
  return perTipus;
}

const versioDe = (fila) => (fila ? copiaCongelada({ versio: fila.versio, instant: fila.instant, dades: fila.dades }) : null);

/**
 * El magatzem del perfil fiscal.
 * @param {object} [opcions]
 * @param {string} [opcions.nom] el nom de la base
 * @param {IDBFactory} [opcions.idb] per defecte globalThis.indexedDB
 * @param {() => number} [opcions.rellotge] per defecte Date.now: l'instant de cada versió
 * @returns {Readonly<{ tipus: string, persistent: boolean,
 *   llig: () => Promise<{ config: object|null, llegat: object|null, copia: object|null }>,
 *   historial: (tipus: string) => Promise<ReadonlyArray<object>>,
 *   afegixConfig: (config: object, opcions: { registres: object[] }) => Promise<object>,
 *   afegixLlegat: (llegat: object, opcions: { registres: object[] }) => Promise<object>,
 *   afegixCopia: (marca: object) => Promise<object>, tanca: () => void }>}
 */
export function creaMagatzemPerfil({ nom = NOM_BD_PERFIL, idb = globalThis.indexedDB, rellotge = Date.now } = {}) {
  if (!idb || typeof idb.open !== 'function') {
    throw errorAmbCodi('SENSE_INDEXEDDB', 'Este navegador no deixa desar el perfil fiscal de l\'empresa (IndexedDB): ací no es pot emetre cap factura.');
  }
  const enFila = creaFila();
  let connexio = null;

  const obri = () => {
    if (!connexio) {
      connexio = new Promise((resol, rebutja) => {
        const peticio = idb.open(nom, VERSIO_BD_PERFIL);
        peticio.onupgradeneeded = () => {
          const bd = peticio.result;
          if (!bd.objectStoreNames.contains(STORE)) bd.createObjectStore(STORE, { keyPath: 'clau' });
        };
        peticio.onsuccess = () => {
          const bd = peticio.result;
          bd.onversionchange = () => {
            bd.close();
            connexio = null;
          };
          resol(bd);
        };
        peticio.onerror = () => rebutja(peticio.error ?? new Error('No s\'ha pogut obrir el perfil fiscal.'));
        peticio.onblocked = () => rebutja(errorAmbCodi('BLOQUEJAT', 'Una altra pestanya té oberta una versió anterior del perfil fiscal: tanca-la.'));
      });
      connexio.catch(() => {
        connexio = null;
      });
    }
    return connexio;
  };

  /* Una transacció sobre el store; resol quan es completa, no quan acaba una petició. */
  const opera = async (mode, accio) => {
    const bd = await obri();
    return new Promise((resol, rebutja) => {
      let tx;
      try {
        tx = bd.transaction([STORE], mode);
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
      const falla = (event) => rebutja(errorPropi ?? event?.target?.error ?? tx.error ?? new Error('El perfil fiscal no ha respost.'));
      tx.oncomplete = () => resol(resultat);
      tx.onerror = falla;
      tx.onabort = falla;
      try {
        accio(tx.objectStore(STORE), torna, avorta);
      } catch (error) {
        avorta(error);
      }
    });
  };

  const totes = () => opera('readonly', (store, torna) => {
    const peticio = store.getAll();
    peticio.onsuccess = () => torna(peticio.result ?? []);
  });

  /* Llegir l'última versió i afegir la següent és UNA transacció readwrite:
     dues pestanyes no poden donar el mateix número de versió. `comprova` rep
     les dades vigents de cada tipus i llança si la versió nova no hi cap: la
     transacció s'avorta i no s'escriu res. */
  const afegix = (tipus, dades, comprova = null) => enFila(async () => {
    const instant = rellotge();
    const fila = await opera('readwrite', (store, torna, avorta) => {
      const peticio = store.getAll();
      peticio.onsuccess = () => {
        const perTipus = vigents(peticio.result ?? []);
        try {
          comprova?.(Object.fromEntries(TIPUS_PERFIL.map((t) => [t, perTipus[t]?.dades ?? null])));
        } catch (error) {
          avorta(error);
          return;
        }
        const anterior = perTipus[tipus];
        const versio = anterior ? anterior.versio + 1 : 1;
        const nova = { clau: clauDe(tipus, versio), tipus, versio, instant, dades };
        store.add(nova);
        torna(nova);
      };
    });
    return versioDe(fila);
  });

  return Object.freeze({
    tipus: 'indexeddb',
    persistent: true,

    /** La versió vigent de cada tipus ({ versio, instant, dades }), o null. */
    llig() {
      return enFila(async () => {
        const perTipus = vigents(await totes());
        return Object.freeze(Object.fromEntries(TIPUS_PERFIL.map((tipus) => [tipus, versioDe(perTipus[tipus])])));
      });
    },

    /** Totes les versions d'un tipus, de la primera a la vigent. */
    historial(tipus) {
      if (!TIPUS_PERFIL.includes(tipus)) return Promise.reject(new TypeError(`El tipus és ${TIPUS_PERFIL.join(', ')}.`));
      return enFila(async () => Object.freeze((await totes())
        .filter((fila) => fila?.tipus === tipus).sort((a, b) => a.versio - b.versio).map(versioDe)));
    },

    /**
     * Una versió nova de la configuració de l'empresa, neta i amb la data de
     * pas. Amb factures del NIF vigent al llibre, el NIF i la data de pas no
     * canvien (PERFIL_FIXAT).
     * @param {object} config
     * @param {{ registres: ReadonlyArray<object> }} opcions els registres del llibre (obligatoris)
     */
    afegixConfig(config, opcions) {
      try {
        const registres = registresDe(opcions, 'afegixConfig');
        const neta = configPerDesar(config);
        return afegix('config', neta, ({ config: vigent }) => {
          if (esPerfilFixat(vigent, registres)) {
            siNoBuit('PERFIL_FIXAT', 'Les dades de l\'empresa no es poden desar així:', canvisFixosDeConfig(vigent, neta));
          }
        });
      } catch (error) {
        return Promise.reject(error);
      }
    },

    /**
     * Una versió nova del llegat (el resultat de sembraLlegat). Amb factures
     * del NIF vigent al llibre, no perd cap sèrie declarada (PERFIL_FIXAT).
     * @param {object} llegat
     * @param {{ registres: ReadonlyArray<object> }} opcions els registres del llibre (obligatoris)
     */
    afegixLlegat(llegat, opcions) {
      try {
        const registres = registresDe(opcions, 'afegixLlegat');
        const nou = llegatPerDesar(llegat);
        return afegix('llegat', nou, ({ config: vigent, llegat: anterior }) => {
          if (esPerfilFixat(vigent, registres)) {
            siNoBuit('PERFIL_FIXAT', 'Ja hi ha factures emeses: les factures d\'abans només es poden ampliar.', seriesQueEsPerden(anterior, nou));
          }
        });
      } catch (error) {
        return Promise.reject(error);
      }
    },

    /** La marca de la còpia que s'acaba d'exportar; no pot recular respecte de la vigent (MARCA_ENRERE). */
    afegixCopia(marca) {
      try {
        const nova = marcaPerDesar(marca);
        return afegix('copia', nova, ({ copia: vigent }) => siNoBuit('MARCA_ENRERE',
          'Esta còpia no arriba on arribava l\'anterior:', cadenesQueRecularien(vigent, nova)));
      } catch (error) {
        return Promise.reject(error);
      }
    },

    tanca() {
      if (connexio) connexio.then((bd) => bd.close(), () => {});
      connexio = null;
    }
  });
}
