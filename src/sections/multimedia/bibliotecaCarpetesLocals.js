/**
 * bibliotecaCarpetesLocals.js — La biblioteca de carpetes locals recordades
 * del Gestor d'arxius locals (IDEA-54/55 · Onada 261029_1605).
 *
 * Desa per clonació estructurada, a la base del navegador
 * `socdepoble_arxius_locals_v1` (store `carpetes`, keyPath `id`), els
 * FileSystemDirectoryHandle que la persona ha triat: `{ id, nom, ultimAcces,
 * handle }`. Cap ruta del sistema, cap fitxer i cap byte: només l'objecte opac
 * que el navegador sap clonar i que conserva el permís entre visites.
 *
 * Patró: el magatzem d'un sol handle de la Gestoria, ara per a moltes
 * carpetes, però sense importar res d'enlloc (cap cicle, cap frontera
 * creuada). Regles:
 *   · Dins d'una transacció tot és síncron: el navegador (i el fals de les
 *     proves) la inactiva després d'un await. La comparació `isSameEntry`,
 *     que és asíncrona, es fa FORA de la transacció.
 *   · Sense índexs ni cursors: l'ordre (darrer accés primer) es fa en JS.
 *   · No llança mai: sense base, amb la quota plena o amb un handle que no es
 *     pot clonar, torna `{ ok:false, codi }`, `[]`, `null` o `false`.
 *   · Després de desar, es torna a llegir el registre: un navegador que clona
 *     el handle però en perd els mètodes no deixa un registre inservible.
 *
 * Permisos (`verificaPermisCarpetaLocal`): com el de la Gestoria, però si
 * `requestPermission` llança (fora d'un gest de la persona) torna 'prompt' i
 * no 'denied', perquè el bàner continue oferint «Reconnectar».
 *
 * L'oblit de l'eixida (Codex, Ronda 2):
 *   · QA-R2-03 · Cada oblit de totes incrementa l'època d'oblit de la base en
 *     començar. Un desat que va començar abans no escriu: ho comprova dins de
 *     la seua transacció (l'IndexedDB ordena les transaccions d'escriptura:
 *     si el clear() es crea després, l'esborra igualment).
 *   · QA-R2-04 · Si el clear() falla (o la base no s'obri), l'oblit torna
 *     { ok:false, codi: CODI_OBLIT_CARPETES_PENDENT } i la base queda
 *     PENDENT: llista, recupera, desa i marcaAcces tornen a provar el clear()
 *     abans de res i, mentre falle, no tornen ni deixen res de l'anterior (cap
 *     muntatge obri sol una carpeta de qui ha eixit). Quan va bé, la marca se
 *     n'va. La marca viu en este mòdul i, per a sobreviure a una recàrrega,
 *     en una marca persistent que s'injecta des de fora
 *     (configuraMarcaOblitCarpetesLocals; la registra SessionContext): este
 *     mòdul continua sense importar res.
 */

export const NOM_BD_ARXIUS_LOCALS = 'socdepoble_arxius_locals_v1';
export const VERSIO_BD_ARXIUS_LOCALS = 1;
export const STORE_CARPETES_LOCALS = 'carpetes';
export const MAX_CARPETES_RECORDADES = 12;

/** Els codis que pot tornar la biblioteca a `{ ok:false, codi }`. */
export const CODIS_BIBLIOTECA_LOCAL = Object.freeze([
  'HANDLE_INVALID',
  'SENSE_INDEXEDDB',
  'TRANSACCIO_FALLIDA',
  'SENSE_ESPAI',
  'NO_CLONABLE'
]);

/** QA-R2-04 · El codi de l'oblit de totes les carpetes quan la base no s'ha pogut buidar (queda pendent). */
export const CODI_OBLIT_CARPETES_PENDENT = 'OBLIT_CARPETES_PENDENT';

const MODES_PERMIS = Object.freeze(['read', 'readwrite']);

const enterPositiu = (valor, perDefecte) => (Number.isSafeInteger(valor) && valor > 0 ? valor : perDefecte);

/**
 * Cert si el valor té la forma d'un FileSystemDirectoryHandle que es pot recórrer.
 * @param {unknown} handle
 * @returns {boolean}
 */
export function esHandleCarpetaLocal(handle) {
  return Boolean(handle)
    && typeof handle === 'object'
    && handle.kind === 'directory'
    && (typeof handle.entries === 'function' || typeof handle.values === 'function');
}

const hex2 = (n) => n.toString(16).padStart(2, '0');

/**
 * Un identificador nou per a una carpeta recordada: `randomUUID` o, si no hi
 * és, un UUID v4 fet amb `getRandomValues`.
 * @param {Crypto} [cripto]
 * @returns {string}
 */
export function nouIdCarpetaLocal(cripto = globalThis.crypto) {
  if (typeof cripto?.randomUUID === 'function') return cripto.randomUUID();
  if (typeof cripto?.getRandomValues === 'function') {
    const b = cripto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, hex2).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  return `carpeta-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const normalitzaPermis = (estat) => (estat === 'granted' || estat === 'prompt' ? estat : 'denied');

/**
 * Comprova (i, amb `demana`, sol·licita) el permís sobre una carpeta.
 * Un handle invàlid o un mode desconegut donen 'denied'; sense l'API de
 * permisos, 'granted'; si la consulta llança, 'denied'; si la petició llança
 * (cal un gest de la persona), 'prompt'.
 * @param {FileSystemDirectoryHandle} handle
 * @param {{ mode?: 'read'|'readwrite', demana?: boolean }} [opcions]
 * @returns {Promise<'granted'|'prompt'|'denied'>}
 */
export async function verificaPermisCarpetaLocal(handle, { mode = 'read', demana = false } = {}) {
  if (!esHandleCarpetaLocal(handle) || !MODES_PERMIS.includes(mode)) return 'denied';
  if (typeof handle.queryPermission !== 'function') return 'granted';
  let estat;
  try {
    estat = normalitzaPermis(await handle.queryPermission({ mode }));
  } catch {
    return 'denied';
  }
  if (estat !== 'prompt' || demana !== true || typeof handle.requestPermission !== 'function') return estat;
  try {
    return normalitzaPermis(await handle.requestPermission({ mode }));
  } catch {
    return 'prompt';
  }
}

/** Àlies de compatibilitat amb el nom del magatzem d'un sol handle. */
export const verificaPermisHandleLocal = verificaPermisCarpetaLocal;

function esRegistreValid(registre) {
  return Boolean(registre)
    && typeof registre === 'object'
    && typeof registre.id === 'string'
    && registre.id !== ''
    && typeof registre.nom === 'string'
    && Number.isFinite(registre.ultimAcces)
    && esHandleCarpetaLocal(registre.handle);
}

const esClauValida = (clau) => (typeof clau === 'string' && clau !== '') || Number.isFinite(clau);

const registrePublic = (r) => Object.freeze({ id: r.id, nom: r.nom, ultimAcces: r.ultimAcces, handle: r.handle });

const perAccesDescendent = (a, b) => b.ultimAcces - a.ultimAcces;

async function mateixaCarpeta(a, b) {
  if (a === b) return true;
  if (typeof a?.isSameEntry !== 'function') return false;
  try {
    return (await a.isSameEntry(b)) === true;
  } catch {
    return false;
  }
}

function obriBase(fabrica, nom) {
  return new Promise((resol, rebutja) => {
    let peticio;
    try {
      peticio = fabrica.open(nom, VERSIO_BD_ARXIUS_LOCALS);
    } catch (error) {
      rebutja(error);
      return;
    }
    let abandonada = false;
    peticio.onupgradeneeded = () => {
      const bd = peticio.result;
      if (bd && !bd.objectStoreNames.contains(STORE_CARPETES_LOCALS)) {
        bd.createObjectStore(STORE_CARPETES_LOCALS, { keyPath: 'id' });
      }
    };
    peticio.onsuccess = () => {
      const bd = peticio.result;
      if (abandonada) {
        /* Ja s'havia donat per bloquejada: es tanca en arribar, no es fa servir. */
        try { bd?.close(); } catch { /* ja tancada */ }
        return;
      }
      if (!bd) {
        rebutja(new Error('La base de carpetes locals ha arribat buida.'));
        return;
      }
      bd.onversionchange = () => {
        try { bd.close(); } catch { /* ja tancada */ }
      };
      resol(bd);
    };
    peticio.onerror = () => rebutja(peticio.error ?? new Error('No s’ha pogut obrir la base de carpetes locals.'));
    peticio.onblocked = () => {
      abandonada = true;
      rebutja(new Error('Una altra pestanya bloqueja la base de carpetes locals.'));
    };
  });
}

/* Gauntlet 261029 c1 (logout-crea-bd-arxius-locals) · Obrir la base la crea
   si no hi és: l'eixida de sessió (oblidaTotes) i cada visita a /multimedia
   (llista) deixaven una base buida a tots els navegadors, encara que ningú no
   haguera vinculat cap carpeta. Es mira abans amb indexedDB.databases(): cert,
   fals, o null si no se sap (sense databases() o si falla; llavors, com
   sempre). */
async function baseExistix({ idb, nom }) {
  if (typeof idb?.databases !== 'function') return null;
  try {
    const bases = await idb.databases();
    return Array.isArray(bases) ? bases.some((base) => base?.name === nom) : null;
  } catch {
    return null;
  }
}

/* Una transacció completa. `accio(store, torna)` és síncrona: tot el que fa
   ho ha de fer en el mateix torn (o dins dels callbacks de les peticions).
   Només amb `crea` (desar una carpeta) s'obri una base que no hi és; si no,
   una base absent no té res a llegir, marcar ni oblidar: { ok: true, valor: null }. */
async function executa(config, mode, accio, { crea = false } = {}) {
  const { idb, nom } = config;
  if (!idb || typeof idb.open !== 'function') return { ok: false, codi: 'SENSE_INDEXEDDB', valor: null };
  if (!crea && (await baseExistix(config)) === false) return { ok: true, codi: null, valor: null };
  let bd;
  try {
    bd = await obriBase(idb, nom);
  } catch {
    return { ok: false, codi: 'SENSE_INDEXEDDB', valor: null };
  }
  try {
    return await new Promise((resol) => {
      let acabat = false;
      const fi = (resultat) => {
        if (acabat) return;
        acabat = true;
        resol(resultat);
      };
      let tx;
      try {
        tx = bd.transaction(STORE_CARPETES_LOCALS, mode);
      } catch {
        fi({ ok: false, codi: 'TRANSACCIO_FALLIDA', valor: null });
        return;
      }
      let valor = null;
      const torna = (v) => {
        valor = v;
      };
      const errada = (event) => {
        const nomError = tx.error?.name ?? event?.target?.error?.name;
        fi({ ok: false, codi: nomError === 'QuotaExceededError' ? 'SENSE_ESPAI' : 'TRANSACCIO_FALLIDA', valor: null });
      };
      tx.oncomplete = () => fi({ ok: true, codi: null, valor });
      tx.onabort = errada;
      tx.onerror = errada;
      try {
        accio(tx.objectStore(STORE_CARPETES_LOCALS), torna);
      } catch (error) {
        try { tx.abort(); } catch { /* ja acabada */ }
        fi({ ok: false, codi: error?.name === 'DataCloneError' ? 'NO_CLONABLE' : 'TRANSACCIO_FALLIDA', valor: null });
      }
    });
  } finally {
    try { bd.close(); } catch { /* ja tancada */ }
  }
}

const llegeixTot = (config) => executa(config, 'readonly', (store, torna) => {
  const p = store.getAll();
  p.onsuccess = () => torna(Array.isArray(p.result) ? p.result : []);
});

const llegeixUn = (config, id) => executa(config, 'readonly', (store, torna) => {
  const p = store.get(id);
  p.onsuccess = () => torna(p.result ?? null);
});

const configDe = (opcions) => {
  const { idb = globalThis.indexedDB, nom = NOM_BD_ARXIUS_LOCALS } = opcions ?? {};
  return Object.freeze({ idb: idb ?? null, nom: typeof nom === 'string' && nom ? nom : NOM_BD_ARXIUS_LOCALS });
};

/* ── L'oblit de l'eixida: època i marca de pendent, per base (pel nom) ─── */

/* QA-R2-03 · Cada oblit de totes (no els reintents) n'incrementa l'època en començar. */
const epoquesOblit = new Map();
const epocaOblit = (nom) => epoquesOblit.get(nom) ?? 0;
/* QA-R2-04 · Les bases que no s'han pogut buidar, i el reintent en curs de cada una. */
const oblitsPendents = new Set();
const reintentsOblit = new Map();
/* La marca que sobreviu a una recàrrega: { llig, desa, esborra }, síncrones i
   injectades des de fora. Només per a la base de l'app (el nom per defecte). */
let marcaPersistent = null;

const ambMarca = (nom, accio) => {
  if (nom !== NOM_BD_ARXIUS_LOCALS || !marcaPersistent) return undefined;
  try {
    return accio(marcaPersistent);
  } catch {
    return undefined;
  }
};
const esPendent = (nom) => oblitsPendents.has(nom) || ambMarca(nom, (marca) => marca.llig?.()) === true;
function marcaPendent(nom, pendent) {
  if (pendent) {
    oblitsPendents.add(nom);
    ambMarca(nom, (marca) => marca.desa?.());
  } else {
    oblitsPendents.delete(nom);
    ambMarca(nom, (marca) => marca.esborra?.());
  }
}

/**
 * QA-R2-04 · Registra la marca persistent de l'oblit pendent (o la lleva amb
 * null): { llig: () => boolean, desa: () => void, esborra: () => void }.
 * SessionContext hi posa la capa de preferències de src/config/storage.js.
 */
export function configuraMarcaOblitCarpetesLocals(marca) {
  marcaPersistent = marca && typeof marca === 'object' ? marca : null;
}

/** QA-R2-04 · Cert si l'oblit de les carpetes d'esta base (opcions com les de la biblioteca) encara no s'ha confirmat. */
export function oblitCarpetesLocalsPendent(opcions) {
  return esPendent(configDe(opcions).nom);
}

/* Buida la base. `senseBase`: el navegador no té IndexedDB (no hi ha res a
   oblidar). Amb `epoca` (un oblit, no un reintent), invalida abans els
   desats en vol. No llança mai. */
async function buida(config, { epoca = true } = {}) {
  if (epoca) epoquesOblit.set(config.nom, epocaOblit(config.nom) + 1);
  if (!config.idb || typeof config.idb.open !== 'function') return { ok: false, senseBase: true };
  try {
    const resultat = await executa(config, 'readwrite', (store) => {
      store.clear();
    });
    return { ok: resultat.ok === true, senseBase: false };
  } catch {
    return { ok: false, senseBase: false };
  }
}

/* QA-R2-04 · Abans de llegir o escriure una base amb l'oblit pendent, es
   torna a provar el clear(): cert si ja és neta. Un sol reintent alhora. */
function netaConfirmada(config) {
  if (!esPendent(config.nom)) return Promise.resolve(true);
  let reintent = reintentsOblit.get(config.nom);
  if (!reintent) {
    reintent = buida(config, { epoca: false })
      .then(({ ok }) => {
        if (ok) marcaPendent(config.nom, false);
        return ok;
      })
      .finally(() => {
        reintentsOblit.delete(config.nom);
      });
    reintentsOblit.set(config.nom, reintent);
  }
  return reintent;
}

/**
 * La biblioteca de carpetes locals recordades. No llança mai.
 * @param {{ idb?: IDBFactory|null, nom?: string, ara?: () => number, generaId?: () => string, maxCarpetes?: number }} [opcions]
 */
export function creaBibliotecaCarpetesLocals({
  idb = globalThis.indexedDB,
  nom = NOM_BD_ARXIUS_LOCALS,
  ara = Date.now,
  generaId = nouIdCarpetaLocal,
  maxCarpetes = MAX_CARPETES_RECORDADES
} = {}) {
  const config = Object.freeze({ idb: idb ?? null, nom: typeof nom === 'string' && nom ? nom : NOM_BD_ARXIUS_LOCALS });
  const maxim = enterPositiu(maxCarpetes, MAX_CARPETES_RECORDADES);
  const rellotge = () => {
    try {
      const t = typeof ara === 'function' ? ara() : Date.now();
      return Number.isFinite(t) ? t : Date.now();
    } catch {
      return Date.now();
    }
  };
  /* Sempre per damunt de l'últim accés: l'ordre no depén de la resolució del rellotge. */
  const instantPosterior = (registres) => registres.reduce((m, r) => Math.max(m, r.ultimAcces + 1), rellotge());

  const idNou = (ocupats) => {
    for (let i = 0; i < 5; i += 1) {
      let candidat;
      try {
        candidat = typeof generaId === 'function' ? generaId() : nouIdCarpetaLocal();
      } catch {
        candidat = null;
      }
      if (typeof candidat === 'string' && candidat !== '' && !ocupats.has(candidat)) return candidat;
    }
    let candidat = nouIdCarpetaLocal();
    while (ocupats.has(candidat)) candidat = nouIdCarpetaLocal();
    return candidat;
  };

  async function desa(handle) {
    /* QA-R2-03 · L'època d'oblit d'ara, abans de cap espera: un oblit que
       comence mentre es desa guanya. */
    const epoca = epocaOblit(config.nom);
    try {
      if (!esHandleCarpetaLocal(handle)) return { ok: false, codi: 'HANDLE_INVALID' };
      /* QA-R2-04 · Amb l'oblit pendent i la base encara plena, res nou s'hi barreja. */
      if (!(await netaConfirmada(config))) return { ok: false, codi: 'TRANSACCIO_FALLIDA' };
      const lectura = await llegeixTot(config);
      if (!lectura.ok) return { ok: false, codi: lectura.codi };
      const files = lectura.valor ?? [];
      const valids = files.filter(esRegistreValid).sort(perAccesDescendent);
      const corruptes = files.filter((r) => !esRegistreValid(r)).map((r) => r?.id).filter(esClauValida);
      const mateixes = [];
      for (const r of valids) {
        if (await mateixaCarpeta(r.handle, handle)) mateixes.push(r);
      }
      const existent = mateixes[0] ?? null;
      const altres = valids.filter((r) => !mateixes.includes(r));
      const id = existent ? existent.id : idNou(new Set(files.map((r) => r?.id)));
      const nou = {
        id,
        nom: typeof handle.name === 'string' ? handle.name : '',
        ultimAcces: instantPosterior(valids),
        handle
      };
      const ordenats = [nou, ...altres];
      const desplacades = ordenats.slice(maxim);
      const esborrar = [...new Set([
        ...desplacades.map((r) => r.id),
        ...mateixes.slice(1).map((r) => r.id),
        ...corruptes
      ])].filter((clau) => clau !== id);
      const escriptura = await executa(config, 'readwrite', (store) => {
        /* QA-R2-03 · Un oblit començat després d'este desat: no s'escriu res
           (la transacció s'avorta). Si el clear() arriba després d'esta
           transacció, l'IndexedDB l'ordena darrere i l'esborra igualment. */
        if (epocaOblit(config.nom) !== epoca) throw new Error('Oblit de les carpetes en curs.');
        store.put(nou);
        for (const clau of esborrar) store.delete(clau);
      }, { crea: true });
      if (!escriptura.ok) return { ok: false, codi: escriptura.codi };
      if (epocaOblit(config.nom) !== epoca) return { ok: false, codi: 'TRANSACCIO_FALLIDA' };
      /* Verificació de tornada: el registre desat ha de tornar com a handle útil. */
      const tornada = await llegeixUn(config, id);
      if (!tornada.ok) return { ok: false, codi: tornada.codi };
      if (!esRegistreValid(tornada.valor)) {
        await executa(config, 'readwrite', (store) => {
          store.delete(id);
        });
        return { ok: false, codi: 'NO_CLONABLE' };
      }
      return {
        ok: true,
        nova: !existent,
        carpeta: Object.freeze({ id, nom: nou.nom, ultimAcces: nou.ultimAcces }),
        desplacades: desplacades.map((r) => Object.freeze({ id: r.id, nom: r.nom }))
      };
    } catch {
      return { ok: false, codi: 'TRANSACCIO_FALLIDA' };
    }
  }

  async function llista() {
    try {
      if (!(await netaConfirmada(config))) return [];
      const lectura = await llegeixTot(config);
      if (!lectura.ok) return [];
      return (lectura.valor ?? []).filter(esRegistreValid).sort(perAccesDescendent).map(registrePublic);
    } catch {
      return [];
    }
  }

  async function recupera(id) {
    if (typeof id !== 'string' || id === '') return null;
    try {
      if (!(await netaConfirmada(config))) return null;
      const lectura = await llegeixUn(config, id);
      return lectura.ok && esRegistreValid(lectura.valor) ? registrePublic(lectura.valor) : null;
    } catch {
      return null;
    }
  }

  async function marcaAcces(id) {
    if (typeof id !== 'string' || id === '') return false;
    try {
      if (!(await netaConfirmada(config))) return false;
      const resultat = await executa(config, 'readwrite', (store, torna) => {
        const p = store.getAll();
        p.onsuccess = () => {
          const files = Array.isArray(p.result) ? p.result.filter(esRegistreValid) : [];
          const registre = files.find((r) => r.id === id);
          if (!registre) {
            torna(false);
            return;
          }
          store.put({ ...registre, ultimAcces: instantPosterior(files) });
          torna(true);
        };
      });
      return resultat.ok && resultat.valor === true;
    } catch {
      return false;
    }
  }

  async function oblida(id) {
    if (typeof id !== 'string' || id === '') return false;
    try {
      const resultat = await executa(config, 'readwrite', (store) => {
        store.delete(id);
      });
      return resultat.ok;
    } catch {
      return false;
    }
  }

  /* QA-R2-04 · Cert si la base és buida (o no n'hi havia); si el clear()
     falla, la base queda pendent. Sense IndexedDB, false i cap marca. */
  async function oblidaTotes() {
    const { ok, senseBase } = await buida(config);
    if (!senseBase) marcaPendent(config.nom, !ok);
    return ok;
  }

  return Object.freeze({ desa, llista, recupera, marcaAcces, oblida, oblidaTotes });
}

/* ── Funcions soltes (les del pla) ─────────────────────────────────────── */

/** @returns {Promise<{ ok: true, nova: boolean, carpeta: { id, nom, ultimAcces }, desplacades: Array<{ id, nom }> }|{ ok: false, codi: string }>} */
export const desaCarpetaLocal = (handle, opcions) => creaBibliotecaCarpetesLocals(opcions).desa(handle);
export const llistaCarpetesLocalsRecordades = (opcions) => creaBibliotecaCarpetesLocals(opcions).llista();
export const recuperaCarpetaLocal = (id, opcions) => creaBibliotecaCarpetesLocals(opcions).recupera(id);
export const marcaAccesCarpetaLocal = (id, opcions) => creaBibliotecaCarpetesLocals(opcions).marcaAcces(id);
export const oblidaCarpetaLocal = (id, opcions) => creaBibliotecaCarpetesLocals(opcions).oblida(id);
/* QA-A01b (Gauntlet 261029, cicle 1) · L'avís que l'eixida de veres JA ha
   oblidat les carpetes. DESPRES_DE_TANCAR (SessionContext) crida
   oblidaTotesLesCarpetesLocals després de tancar la sessió: currentUser passa
   a null abans (dins de tanca(), que encara espera la revocació fins a 3 s), i
   una renovació fallida (abast 'pestanya') també el posa a null sense eixir.
   Un Gestor muntat (useGestorArxiusLocals) s'invalida amb este avís i no amb
   el null: una lectura feta abans trobaria la biblioteca plena. Arriba als
   escoltadors d'esta pestanya i, per BroadcastChannel, als de les altres
   pestanyes del mateix origen (el missatge porta l'origen: la mateixa
   pestanya no el compta dues vegades). */
const CANAL_OBLIT = 'sdp-arxius-locals-oblit';
const ORIGEN_OBLIT = nouIdCarpetaLocal();
const escoltadorsOblit = new Set();

function avisaOblit() {
  for (const escoltador of [...escoltadorsOblit]) {
    try {
      escoltador();
    } catch {
      /* un escoltador que falla no para els altres */
    }
  }
  try {
    const canal = new BroadcastChannel(CANAL_OBLIT);
    canal.postMessage({ origen: ORIGEN_OBLIT });
    canal.close();
  } catch {
    /* sense BroadcastChannel: només esta pestanya */
  }
}

/** Escolta l'oblit de l'eixida de veres (en esta pestanya i en les altres). Torna la funció que deixa d'escoltar. */
export function escoltaOblitCarpetesLocals(escoltador) {
  if (typeof escoltador !== 'function') return () => {};
  escoltadorsOblit.add(escoltador);
  let canal = null;
  try {
    canal = new BroadcastChannel(CANAL_OBLIT);
    canal.onmessage = (event) => {
      if (event?.data?.origen !== ORIGEN_OBLIT) escoltador();
    };
    canal.unref?.();
  } catch {
    canal = null;
  }
  return () => {
    escoltadorsOblit.delete(escoltador);
    try {
      canal?.close();
    } catch {
      /* ja tancat */
    }
  };
}

/**
 * Per a l'eixida de sessió en un ordinador compartit: oblida totes les
 * carpetes recordades (sense crear la base si no hi és) i ho avisa. No llança.
 * QA-R2-04 (Codex, Ronda 2) · Torna { ok: true } (també sense IndexedDB: no
 * hi ha res a oblidar) o { ok: false, codi: CODI_OBLIT_CARPETES_PENDENT } si
 * la base no s'ha pogut buidar: queda pendent (vegeu dalt) i l'avís ix
 * igualment, perquè la RAM dels gestors muntats s'invalide.
 */
export async function oblidaTotesLesCarpetesLocals(opcions) {
  try {
    const config = configDe(opcions);
    const { ok, senseBase } = await buida(config);
    if (senseBase) return { ok: true };
    marcaPendent(config.nom, !ok);
    return ok ? { ok: true } : { ok: false, codi: CODI_OBLIT_CARPETES_PENDENT };
  } catch {
    return { ok: false, codi: CODI_OBLIT_CARPETES_PENDENT };
  } finally {
    avisaOblit();
  }
}

export async function recuperaUltimaCarpetaLocal(opcions) {
  const totes = await llistaCarpetesLocalsRecordades(opcions);
  return totes[0] ?? null;
}

/* ── Àlies de compatibilitat (forma d'un sol handle) ───────────────────── */

/** @returns {Promise<boolean>} */
export async function desaHandleCarpetaLocal(handle, opcions) {
  return (await desaCarpetaLocal(handle, opcions)).ok === true;
}

/** El handle de la carpeta usada més recentment, o null. */
export async function recuperaHandleCarpetaLocal(opcions) {
  return (await recuperaUltimaCarpetaLocal(opcions))?.handle ?? null;
}

/** Oblida la carpeta usada més recentment. Cert si no en quedava cap o si s'ha oblidat. */
export async function oblidaHandleCarpetaLocal(opcions) {
  const ultima = await recuperaUltimaCarpetaLocal(opcions);
  if (!ultima) return true;
  return oblidaCarpetaLocal(ultima.id, opcions);
}
