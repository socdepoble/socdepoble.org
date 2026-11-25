/**
 * Volum privat del navegador: OPFS quan està disponible; IndexedDB en la resta.
 * Reutilitza el motor local (rutes, llista blanca, conflictes i moviments verificats).
 * Importar copia els fitxers triats: mai modifica els originals del dispositiu.
 * La UI ha de conservar `tipus` i mostrar que és una còpia privada del navegador.
 */
import {
  ErrorArxiuLocal, esRutaEscrivibleLocal, fontDesDeHandle, nomFitxerDe,
  mimeDeVisorLocal, MIME_DESCARREGA_LOCAL, oblidaFont as oblidaFontDelMotor,
  escriuTextLocal, llegixTextLocal, creaFitxerMarkdownLocal,
  desaWebpALaCarpetaLocal, desaWebpIMouOriginalLocal
} from './motorMultimediaLocal.js';

export const NOM_BD_OPFS = 'socdepoble_multimedia_privada_v1';
export const CARPETA_OPFS = 'sdp-multimedia-v1';
export const MAX_BYTES_IMPORTACIO = 250 * 1024 * 1024;
export const MAX_BYTES_FITXER_OPFS = 50 * 1024 * 1024;
export const PREFIX_BLOQUEIG_VOLUM = 'sdp:multimedia-privada:v1:';
const STORE = 'entrades';
const error = (codi, missatge, cause) => new ErrorArxiuLocal(codi, missatge, { cause });
const dom = (name) => new DOMException(name, name);
const clau = (ruta) => ruta.normalize('NFC').toLowerCase();
const bytes = (valor) => valor instanceof Uint8Array ? valor : new Uint8Array(valor);
const NETEGES_IDB = new WeakMap();

function copiaAmbit(ambit) {
  if (ambit === undefined) return null;
  if (!ambit || typeof ambit !== 'object' || Array.isArray(ambit)
    || Object.keys(ambit).sort().join(',') !== 'tenantId,usuariId') throw error('PARAMETRES_INVALIDS', 'Cal un compte i un poble explícits.');
  const net = {};
  for (const camp of ['usuariId', 'tenantId']) {
    const id = ambit[camp];
    if (typeof id !== 'string' || !id || id.trim() !== id || id.normalize('NFC') !== id
      || new TextEncoder().encode(id).length > 256 || /[\p{Cc}\p{Cf}]/u.test(id)) throw error('PARAMETRES_INVALIDS', 'L’àmbit del volum no és vàlid.');
    net[camp] = id;
  }
  return Object.freeze(net);
}

function creaVidaVolum(comprovaAmbit, senyal) {
  const control = new AbortController();
  let oblidada = false, motor = null, causa;
  const deslliga = () => senyal?.removeEventListener('abort', enAbort);
  const oblida = (motiu) => {
    if (oblidada) return false;
    oblidada = true; causa = motiu; deslliga();
    if (motor) oblidaFontDelMotor(motor);
    control.abort(motiu); return true;
  };
  const enAbort = () => oblida(senyal.reason);
  const guarda = () => {
    if (!oblidada) {
      try {
        if (senyal?.aborted) { oblida(senyal.reason); }
        else if (comprovaAmbit) {
          const resultat = comprovaAmbit();
          if (resultat && typeof resultat.then === 'function') {
            Promise.resolve(resultat).catch(() => {});
            throw new TypeError('La guarda del volum ha de ser síncrona.');
          }
          if (resultat === false) throw new Error('Àmbit revocat.');
        }
      } catch (cause) { oblida(cause); }
    }
    if (oblidada) throw error('FONT_OBLIDADA', 'Esta font ja s’ha desenxufat.', causa);
  };
  senyal?.addEventListener('abort', enAbort, { once: true });
  return Object.freeze({ guarda, oblida: () => oblida(), senyal: control.signal,
    get oblidada() { return oblidada; },
    vinculaMotor(font) { motor = font; guarda(); }
  });
}

async function hashNamespace(cripto, components, guarda) {
  guarda();
  if (typeof cripto?.subtle?.digest !== 'function') throw error('FONT_ILLEGIBLE', 'Este navegador no pot separar els volums per compte.');
  let digest;
  try { digest = await cripto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(components))); }
  catch (cause) { guarda(); throw error('FONT_ILLEGIBLE', 'No s’ha pogut preparar el volum del compte.', cause); }
  guarda();
  const resultat = new Uint8Array(digest);
  if (resultat.length !== 32) throw error('FONT_ILLEGIBLE', 'No s’ha pogut preparar el volum del compte.');
  return [...resultat].map(n => n.toString(16).padStart(2, '0')).join('');
}

function nomValid(nom) {
  if (typeof nom !== 'string' || nom.includes('/') || !esRutaEscrivibleLocal(nom)) throw dom('TypeError');
  return nom;
}

function obriBd(idb, nom, { guarda = () => {}, senyal } = {}) {
  guarda();
  if (!idb?.open) throw error('FONT_ILLEGIBLE', 'Este navegador no permet guardar arxius privats.');
  return new Promise((resolve, reject) => {
    const p = idb.open(nom, 1);
    let acabat = false;
    const deslliga = () => senyal?.removeEventListener('abort', enAbort);
    const falla = cause => { acabat = true; deslliga(); reject(cause); };
    const enAbort = () => {
      let cause;
      try { guarda(); } catch (e) { cause = e; }
      try { p.transaction?.abort(); } catch { /* open ja ha acabat */ }
      falla(cause || error('FONT_OBLIDADA', 'Esta font ja s’ha desenxufat.'));
    };
    p.onupgradeneeded = () => {
      try { if (acabat) { p.transaction.abort(); return; } guarda(); p.result.createObjectStore(STORE, { keyPath: 'ruta' }); }
      catch (cause) { try { p.transaction?.abort(); } catch { /* upgrade ja acabat */ } falla(cause); }
    };
    p.onerror = () => falla(p.error);
    p.onblocked = () => falla(dom('InvalidStateError'));
    p.onsuccess = () => {
      if (acabat) { p.result.close(); return; }
      try { guarda(); } catch (cause) { p.result.close(); falla(cause); return; }
      deslliga(); acabat = true;
      p.result.onversionchange = () => p.result.close();
      resolve(p.result);
    };
    senyal?.addEventListener('abort', enAbort, { once: true });
    if (senyal?.aborted) enAbort();
  });
}

/* Una operació síncrona sobre les peticions; cap await dins d'una transacció. */
async function transaccio(config, mode, operacio, neteja = false) {
  const guarda = neteja ? () => {} : config.guarda;
  const senyal = neteja ? null : config.senyal;
  guarda();
  const bd = await obriBd(config.idb, config.nom, { guarda, senyal });
  try {
    guarda();
    return await new Promise((resolve, reject) => {
      const tx = bd.transaction(STORE, mode);
      let resultat;
      let causa;
      const deslliga = () => senyal?.removeEventListener('abort', enAbort);
      const falla = e => { causa ||= e; try { tx.abort(); } catch { /* Si confirma, el wrapper registra el commit real. */ } };
      const enAbort = () => { try { guarda(); } catch (cause) { falla(cause); return; } falla(error('FONT_OBLIDADA', 'Esta font ja s’ha desenxufat.')); };
      // Un complete real és commit: la guarda exterior el converteix en rebut parcial,
      // mai en una afirmació falsa de rollback després de close/remove ja enviats.
      tx.oncomplete = () => { deslliga(); resolve(resultat); };
      tx.onabort = () => { deslliga(); reject(causa || tx.error || dom('UnknownError')); };
      tx.onerror = () => { causa ||= tx.error; };
      senyal?.addEventListener('abort', enAbort, { once: true });
      if (senyal?.aborted) { enAbort(); return; }
      const store = tx.objectStore(STORE);
      const guardat = new Proxy({}, {
        get(_target, propietat) {
          const valor = store[propietat];
          if (typeof valor !== 'function') return valor;
          return (...args) => {
            guarda();
            const peticio = valor.apply(store, args);
            if (!peticio || typeof peticio !== 'object' || !('onsuccess' in peticio)) return peticio;
            const executa = callback => event => { try { guarda(); callback?.(event); guarda(); } catch (cause) { falla(cause); } };
            peticio.onsuccess = executa(null);
            peticio.onerror = () => falla(peticio.error);
            return new Proxy(peticio, { set(target, p, v) { target[p] = p === 'onsuccess' ? executa(v) : v; return true; } });
          };
        }
      });
      try {
        guarda(); operacio(guardat, (v) => { resultat = v; }, falla);
      } catch (e) { falla(e); }
    });
  } finally { bd.close(); }
}

const llistaBd = (config) => transaccio(config, 'readonly', (s, torna) => { s.getAll().onsuccess = (e) => torna(e.target.result); });
const lligBd = (config, ruta) => transaccio(config, 'readonly', (s, torna) => { s.get(ruta).onsuccess = (e) => torna(e.target.result); });

async function quota(storage, n) {
  if (!storage?.estimate) return;
  let q;
  try { q = await storage.estimate(); } catch { return; } // estimació opcional; el commit encara pot refusar quota
  if (Number.isFinite(q.quota) && Number.isFinite(q.usage) && n > q.quota - q.usage) {
    throw error('SENSE_ESPAI', 'No queda prou espai al navegador.');
  }
}

/** FileSystemDirectoryHandle mínim sobre transaccions IndexedDB; blobs, mai emmagatzematge síncron. */
function directoriIdb(config, ruta = '') {
  const prefix = ruta ? `${ruta}/` : '';
  const nom = ruta ? nomFitxerDe(ruta) : CARPETA_OPFS;
  async function entrada(n, kind, create) {
    nomValid(n);
    const r = clau(prefix + n);
    await transaccio(config, create ? 'readwrite' : 'readonly', (s, torna, falla) => {
      s.get(r).onsuccess = (e) => {
        const actual = e.target.result;
        if (actual && actual.kind !== kind) { falla(dom('TypeMismatchError')); return; }
        if (!actual && !create) { falla(dom('NotFoundError')); return; }
        if (!actual) s.put({ ruta: r, nom: n, kind, blob: kind === 'file' ? new Blob([]) : null, modificat: 0, versio: 0 });
        torna(true);
      };
    });
    return kind === 'directory' ? directoriIdb(config, r) : fitxerIdb(config, r, n);
  }
  async function eliminaEntrada(n, neteja = false) {
    nomValid(n);
    const r = clau(prefix + n);
    await transaccio(config, 'readwrite', (s, torna, falla) => {
      s.getAll().onsuccess = (e) => {
        const tots = e.target.result;
        if (!tots.some((el) => el.ruta === r)) { falla(dom('NotFoundError')); return; }
        if (tots.some((el) => el.ruta.startsWith(`${r}/`))) { falla(dom('InvalidModificationError')); return; }
        s.delete(r); torna(true);
      };
    }, neteja);
  }
  const handle = Object.freeze({
    kind: 'directory', name: nom,
    queryPermission: async () => 'granted', requestPermission: async () => 'granted',
    async *entries() {
      const tots = await llistaBd(config);
      for (const el of tots.filter((e) => e.ruta.startsWith(prefix) && !e.ruta.slice(prefix.length).includes('/'))) {
        yield [el.nom, el.kind === 'directory' ? directoriIdb(config, el.ruta) : fitxerIdb(config, el.ruta, el.nom)];
      }
    },
    getDirectoryHandle: (n, o) => entrada(n, 'directory', o?.create === true),
    getFileHandle: (n, o) => entrada(n, 'file', o?.create === true),
    removeEntry: n => eliminaEntrada(n)
  });
  // Capacitat interna de rollback d'un fitxer nou de la importació encara sota
  // el pany. No s'exposa en cap font ni permet esborrar dades prèvies en revocar.
  NETEGES_IDB.set(handle, n => eliminaEntrada(n, true));
  return handle;
}

function fitxerIdb(config, ruta, name) {
  return Object.freeze({
    kind: 'file', name,
    async getFile() {
      const el = await lligBd(config, ruta);
      if (!el || el.kind !== 'file') throw dom('NotFoundError');
      const f = el.blob.slice(0, el.blob.size, mimeDeVisorLocal(name) || MIME_DESCARREGA_LOCAL);
      Object.defineProperties(f, { name: { value: name }, lastModified: { value: el.modificat } });
      return f;
    },
    async createWritable() {
      const anterior = await lligBd(config, ruta);
      if (!anterior) throw dom('NotFoundError');
      let trossos = [];
      let mida = 0;
      let acabat = false;
      return {
        async write(part) {
          if (acabat) throw dom('InvalidStateError');
          const tros = part instanceof Blob ? part : new Blob([part]);
          mida += tros.size;
          if (mida > config.maxBytesFitxer) throw dom('QuotaExceededError');
          trossos.push(tros);
        },
        async close() {
          if (acabat) throw dom('InvalidStateError');
          acabat = true;
          await quota(config.storage, mida);
          config.guarda();
          const blob = new Blob(trossos);
          trossos = [];
          await transaccio(config, 'readwrite', (s, torna, falla) => {
            s.get(ruta).onsuccess = (e) => {
              const actual = e.target.result;
              if (!actual || actual.versio !== anterior.versio) { falla(dom('InvalidModificationError')); return; }
              s.put({ ...actual, blob, versio: actual.versio + 1, modificat: Math.max(Date.now(), actual.modificat + 1) });
              torna(true);
            };
          });
        },
        async abort() { acabat = true; trossos = []; }
      };
    }
  });
}

/**
 * Obri el volum privat persistent. No crida cap selector ni demana persist().
 * `tipus === indexeddb` també quan OPFS existeix però no sap createWritable.
 * `font` és una façana protegida del motor, apta per a useMiniaturesLocals.
 * No exposa el handle cru. Per a desenxufar, usa volum.oblida()/font.oblida(),
 * no oblidaFont(font) del motor (la façana no és la seua identitat WeakMap).
 * Per a helpers compostos d'edició, usa volum.escriuText()/desaWebpIMouOriginal(),
 * etc.: així comprovació i escriptura romanen dins d'un únic pany del motor.
 * Sense Web Locks només es permet llegir: cap mutex de RAM substituïx
 * l'exclusió real entre pestanyes. Les mutacions fallen explícitament.
 * `ambit` absent conserva el volum global privat del navegador. Per compte,
 * calen IDs explícits, guarda síncrona i senyal de la generació de sessió.
 * No copia ni migra el global. La UI ha de renovar la font i tancar previews
 * en canviar de sessió: un Blob ja lliurat no es pot retirar retroactivament.
 */
export async function creaFontArxiusOpfs({
  storage = globalThis.navigator?.storage, idb = globalThis.indexedDB,
  locks = globalThis.navigator?.locks,
  ambit, comprovaAmbit, senyal, cripto = globalThis.crypto,
  nomBd = NOM_BD_OPFS, maxBytesFitxer = MAX_BYTES_FITXER_OPFS, maxBytesImportacio = MAX_BYTES_IMPORTACIO
} = {}) {
  if (!Number.isSafeInteger(maxBytesFitxer) || maxBytesFitxer < 1 || !Number.isSafeInteger(maxBytesImportacio) || maxBytesImportacio < 1
    || typeof nomBd !== 'string' || !nomBd || nomBd.length > 256) {
    throw error('PARAMETRES_INVALIDS', 'Calen límits de mida vàlids.');
  }
  const ambitNet = copiaAmbit(ambit);
  const teSenyal = senyal != null;
  if (ambitNet && (typeof comprovaAmbit !== 'function' || !teSenyal)
    || comprovaAmbit !== undefined && typeof comprovaAmbit !== 'function'
    || teSenyal && (typeof senyal.aborted !== 'boolean' || typeof senyal.addEventListener !== 'function' || typeof senyal.removeEventListener !== 'function')) {
    throw error('PARAMETRES_INVALIDS', 'El volum per compte requerix guarda síncrona i senyal de sessió.');
  }
  const vida = creaVidaVolum(comprovaAmbit, senyal);
  let arrel;
  let tipus = 'indexeddb';
  let webLocks = typeof locks?.request === 'function';
  let mutacioActiva = null;
  const comprovaVigencia = vida.guarda;
  const registraCommit = (operacio, ruta) => { mutacioActiva?.commits.push(Object.freeze({ operacio, ruta })); };
  const originals = new WeakMap(), embolcalls = new WeakMap();
  // El motor canònic no té una guarda entre write i close. El handle privat
  // evita confirmar un writer pendent després de revocar aquesta font.
  function protegeixHandle(handle, ruta = '') {
    if (embolcalls.has(handle)) return embolcalls.get(handle);
    const rutaDe = nom => ruta ? `${ruta}/${nom}` : nom;
    const protegit = new Proxy({}, {
      get(_target, propietat) {
        const target = handle;
        if (propietat === 'getDirectoryHandle' || propietat === 'getFileHandle') return async (nom, opcions) => {
          comprovaVigencia();
          const h = await target[propietat](nom, opcions);
          if (opcions?.create) registraCommit('obri-o-crea-entrada', rutaDe(nom));
          comprovaVigencia(); return protegeixHandle(h, rutaDe(nom));
        };
        if (propietat === 'createWritable' && typeof target.createWritable === 'function') return async (...args) => {
          comprovaVigencia();
          const writer = await target.createWritable(...args);
          try { comprovaVigencia(); } catch (cause) { try { await writer.abort(); } catch { /* writer ja tancat */ } throw cause; }
          return {
            write: (...valors) => { comprovaVigencia(); return writer.write(...valors); },
            close: async () => {
              comprovaVigencia(); await writer.close();
              // close ja enviat no es pot desfer: enPany informa el commit real.
              registraCommit('tanca-escriptura', ruta);
            },
            abort: (...valors) => writer.abort(...valors)
          };
        };
        if (propietat === 'removeEntry') return async (nom, opcions) => {
          comprovaVigencia(); await target.removeEntry(nom, opcions); registraCommit('elimina-entrada', rutaDe(nom));
        };
        if (propietat === 'entries') return async function* () {
          for await (const [nom, h] of target.entries()) { comprovaVigencia(); yield [nom, protegeixHandle(h, rutaDe(nom))]; }
        };
        if (propietat === 'getFile' && typeof target.getFile === 'function') return async (...args) => {
          comprovaVigencia(); const resultat = await target.getFile(...args); comprovaVigencia(); return resultat;
        };
        if (['queryPermission', 'requestPermission'].includes(propietat) && typeof target[propietat] === 'function') return async (...args) => {
          comprovaVigencia(); const resultat = await target[propietat](...args); comprovaVigencia(); return resultat;
        };
        if (propietat === 'isSameEntry' && typeof target.isSameEntry === 'function') return async altre => {
          comprovaVigencia(); const resultat = await target.isSameEntry(originals.get(altre) || altre); comprovaVigencia(); return resultat;
        };
        const valor = Reflect.get(target, propietat, target);
        return typeof valor === 'function' ? (...args) => { comprovaVigencia(); return valor.apply(target, args); } : valor;
      }
    });
    embolcalls.set(handle, protegit); originals.set(protegit, handle); return protegit;
  }
  try {
  comprovaVigencia();
  let carpetaOpfs = CARPETA_OPFS, nomBdFisic = nomBd;
  if (ambitNet) {
    const h = await hashNamespace(cripto, ['sdp.multimedia.ambit', 1, ambitNet.usuariId, ambitNet.tenantId], comprovaVigencia);
    carpetaOpfs = `${CARPETA_OPFS}-a1-${h}`;
    const hBd = await hashNamespace(cripto, ['sdp.multimedia.indexeddb', 1, h, nomBd], comprovaVigencia);
    nomBdFisic = `${NOM_BD_OPFS}-a1-${hBd}`;
  }
  const clauOpfs = `${PREFIX_BLOQUEIG_VOLUM}opfs:${carpetaOpfs}`;
  const nomSonda = `.sdp-sonda-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
  const obriOpfs = async crea => {
    comprovaVigencia();
    const root = await storage.getDirectory(); comprovaVigencia();
    const dir = await root.getDirectoryHandle(carpetaOpfs, crea ? { create: true } : undefined);
    comprovaVigencia(); return dir;
  };
  if (storage?.getDirectory) {
    let panyInicialConcedit = false;
    try {
      if (webLocks) {
        await locks.request(clauOpfs, { mode: 'exclusive', signal: vida.senyal }, async (lock) => {
          comprovaVigencia(); if (!lock) throw dom('NotSupportedError');
          panyInicialConcedit = true;
          arrel = await obriOpfs(true);
          try {
            const sonda = await protegeixHandle(arrel).getFileHandle(nomSonda, { create: true });
            if (typeof sonda.createWritable !== 'function') throw dom('NotSupportedError');
            const w = await sonda.createWritable(); await w.close(); comprovaVigencia();
          } finally { try { await arrel?.removeEntry(nomSonda); } catch { /* només sonda pròpia */ } }
        });
      } else arrel = await obriOpfs(false);
      comprovaVigencia(); tipus = 'opfs';
    } catch (cause) {
      comprovaVigencia(); // Revocació terminal: mai obrir un altre backend després.
      arrel = null;
      if (cause?.name === 'QuotaExceededError') throw error('SENSE_ESPAI', 'No queda espai al navegador.', cause);
      if (webLocks && !panyInicialConcedit) {
        webLocks = false;
        try { arrel = await obriOpfs(false); tipus = 'opfs'; }
        catch { comprovaVigencia(); /* OPFS tampoc és llegible: IndexedDB pròpia. */ }
      }
    }
  }
  if (!arrel) {
    const config = { idb, nom: nomBdFisic, storage, maxBytesFitxer, guarda: comprovaVigencia, senyal: vida.senyal };
    try { const bd = await obriBd(idb, nomBdFisic, config); bd.close(); comprovaVigencia(); }
    catch (cause) { comprovaVigencia(); throw error('FONT_ILLEGIBLE', 'Este navegador no permet guardar arxius privats.', cause); }
    arrel = directoriIdb(config);
  }
  comprovaVigencia();
  const motor = fontDesDeHandle(protegeixHandle(arrel), { maxBytesFitxer });
  vida.vinculaMotor(motor);
  const clauBloqueig = tipus === 'opfs' ? clauOpfs : `${PREFIX_BLOQUEIG_VOLUM}indexeddb:${nomBdFisic}`;
  if (webLocks) {
    try { await locks.request(clauBloqueig, { mode: 'shared', signal: vida.senyal }, lock => { comprovaVigencia(); if (!lock) throw dom('NotSupportedError'); }); }
    catch { comprovaVigencia(); webLocks = false; }
  }
  comprovaVigencia();
  const comprovaFont = () => {
    comprovaVigencia();
    if (motor.handle === null) throw error('FONT_OBLIDADA', 'Esta font ja s’ha desenxufat.');
  };
  const revalidaError = cause => {
    try { comprovaFont(); return cause; }
    catch {
      // La guarda també s'observa quan un await rebutja. Conservar el rebut de
      // l'importador i la causa inicial és diferent d'afirmar un rollback.
      if (cause instanceof ErrorArxiuLocal && ['FONT_OBLIDADA', 'OPERACIO_PARCIAL_CONFIRMADA'].includes(cause.codi)) return cause;
      const e = error('FONT_OBLIDADA', 'Esta font ja s’ha desenxufat.', cause);
      e.detall = cause?.detall ?? null; return e;
    }
  };
  const sensePany = cause => error('ESCRIPTURA_DENEGADA', 'Este navegador no permet coordinar les escriptures entre pestanyes: el volum és de només lectura.', cause);
  async function enPany(mode, operacio) {
    comprovaFont();
    if (!webLocks) {
      if (mode === 'exclusive') { const e = sensePany(); e.detall = { motiu: 'SENSE_WEB_LOCKS' }; throw e; }
      try { const resultat = await operacio(); comprovaFont(); return resultat; }
      catch (cause) { throw revalidaError(cause); }
    }
    let concedit = false;
    try {
      return await locks.request(clauBloqueig, { mode, signal: vida.senyal }, async (lock) => {
        if (!lock) throw sensePany();
        if (!webLocks && mode === 'exclusive') throw sensePany();
        concedit = true; comprovaFont();
        const estat = mode === 'exclusive' ? { commits: [] } : null;
        if (estat) mutacioActiva = estat;
        try {
          const resultat = await operacio(); comprovaFont(); return resultat;
        } catch (fallit) {
          const cause = revalidaError(fallit);
          if (vida.oblidada && estat?.commits.length) {
            const e = error('OPERACIO_PARCIAL_CONFIRMADA', 'La font s’ha desenxufat amb canvis ja confirmats: torna a llegir el volum abans de repetir l’operació.', cause);
            e.detall = { ...cause?.detall, motiu: 'FONT_OBLIDADA_DESPRES_COMMIT', commits: Object.freeze([...(cause?.detall?.commits || []), ...estat.commits]) }; throw e;
          }
          throw cause;
        } finally { if (estat) mutacioActiva = null; }
      });
    } catch (fallit) {
      const cause = revalidaError(fallit);
      if (vida.oblidada || motor.handle === null) {
        // Preserva el rebut de còpia parcial que l'importador ja haja preparat.
        if (cause instanceof ErrorArxiuLocal && ['FONT_OBLIDADA', 'OPERACIO_PARCIAL_CONFIRMADA'].includes(cause.codi)) throw cause;
        comprovaFont();
      }
      if (concedit) throw cause;
      webLocks = false;
      const e = sensePany(cause); e.detall = { motiu: 'WEB_LOCK_REFUSAT' }; throw e;
    }
  }
  const muta = operacio => enPany('exclusive', operacio);
  const llig = operacio => enPany('shared', operacio);
  const oblida = vida.oblida;
  async function importa(llista) {
    comprovaFont();
    const seleccionats = Array.from(llista || []);
    if (seleccionats.length > 10000) throw error('PARAMETRES_INVALIDS', 'Massa fitxers en una sola importació.');
    const rutes = new Set();
    const entrades = seleccionats.map((f) => {
      const ruta = f?.webkitRelativePath || f?.name;
      if (!esRutaEscrivibleLocal(ruta) || rutes.has(clau(ruta))) throw error('RUTA_INVALIDA', 'La selecció conté rutes invàlides o repetides.');
      if (!Number.isSafeInteger(f.size) || f.size > maxBytesFitxer || f.size < 0 || typeof f.arrayBuffer !== 'function') throw error('FITXER_MASSA_GRAN', 'Un fitxer no es pot importar amb estos límits.');
      rutes.add(clau(ruta)); return { f, ruta };
    });
    const total = entrades.reduce((n, { f }) => n + f.size, 0);
    if (total > maxBytesImportacio) throw error('FITXER_MASSA_GRAN', 'La selecció supera el límit d’importació.');
    await quota(storage, total);
    comprovaFont();
    const importats = [];
    // OPFS pot distingir majúscules: el mateix contracte NFC del motor també
    // val contra els noms ja copiats en lots anteriors, incloent carpetes.
    const nomsPerDirectori = new Map();
    async function nomsDe(directori, ruta) {
      if (nomsPerDirectori.has(ruta)) return nomsPerDirectori.get(ruta);
      const noms = new Map();
      for await (const [nom] of directori.entries()) {
        comprovaFont();
        if (noms.has(clau(nom))) throw error('RUTA_INVALIDA', 'La carpeta conté noms equivalents.');
        noms.set(clau(nom), nom);
      }
      comprovaFont(); nomsPerDirectori.set(ruta, noms);
      return noms;
    }
    // El lot no és atòmic: una fallada informa les còpies ja completades i preserva originals.
    for (const { f, ruta } of entrades) {
      let directori = arrel;
      let rutaDirectori = '';
      let escriptor;
      let nou = false;
      let closeEnviat = false;
      let closeConfirmat = false;
      try {
        comprovaFont();
        const segs = ruta.split('/');
        const nom = segs.pop();
        for (const segment of segs) {
          const noms = await nomsDe(directori, rutaDirectori); comprovaFont();
          const existent = noms.get(clau(segment));
          if (existent !== undefined && existent !== segment) throw error('RUTA_INVALIDA', 'Ja existeix una carpeta amb un nom equivalent.');
          directori = await directori.getDirectoryHandle(segment, { create: true }); comprovaFont();
          noms.set(clau(segment), segment);
          rutaDirectori = rutaDirectori ? `${rutaDirectori}/${segment}` : segment;
        }
        const noms = await nomsDe(directori, rutaDirectori); comprovaFont();
        if (noms.has(clau(nom))) throw error('FITXER_JA_EXISTEIX', 'Ja existeix una còpia amb este nom o un nom equivalent.');
        try { await directori.getFileHandle(nom); comprovaFont(); throw error('FITXER_JA_EXISTEIX', 'Ja existeix una còpia amb este nom.'); }
        catch (e) { if (e?.name !== 'NotFoundError') throw e; }
        comprovaFont();
        const h = await directori.getFileHandle(nom, { create: true }); nou = true; comprovaFont();
        escriptor = await h.createWritable(); comprovaFont();
        const contingut = bytes(await f.arrayBuffer()); comprovaFont();
        await escriptor.write(contingut); comprovaFont();
        closeEnviat = true; await escriptor.close(); closeConfirmat = true; escriptor = null; comprovaFont();
        const copiat = await h.getFile(); comprovaFont();
        if (copiat.size !== f.size) throw error('ESCRIPTURA_FALLIDA', 'La còpia no té la mida esperada.');
        noms.set(clau(nom), nom);
        importats.push(ruta);
      } catch (cause) {
        try { await escriptor?.abort(); } catch { /* escriptor ja acabat */ }
        let netejaFallida = null;
        if (nou) try {
          const neteja = NETEGES_IDB.get(directori);
          if (neteja) await neteja(nomFitxerDe(ruta)); else await directori.removeEntry(nomFitxerDe(ruta));
        } catch (e) { netejaFallida = Object.freeze({ ruta, codi: e?.codi || e?.name || 'UnknownError', presencia: 'desconeguda' }); }
        if (closeConfirmat && netejaFallida) {
          const e = error('OPERACIO_PARCIAL_CONFIRMADA', 'La còpia s’ha confirmat, però la neteja ha fallat: torna a llegir el volum abans de repetir.', cause);
          e.detall = { importats, fallit: ruta, motiu: vida.oblidada ? 'FONT_OBLIDADA_DESPRES_COMMIT' : 'IMPORTACIO_CONFIRMADA_AMB_NETEJA_FALLIDA',
            commitConfirmat: true, estatCommit: 'confirmat', commits: Object.freeze([Object.freeze({ operacio: 'tanca-escriptura', ruta })]), netejaFallida };
          throw e;
        }
        const e = cause instanceof ErrorArxiuLocal ? cause : error(cause?.name === 'QuotaExceededError' ? 'SENSE_ESPAI' : 'ESCRIPTURA_FALLIDA', 'No s’ha completat la importació.', cause);
        e.detall = { ...e.detall, importats, fallit: ruta, ...(netejaFallida ? { netejaFallida, commitConfirmat: false, estatCommit: closeEnviat ? 'no_acreditat' : 'no_iniciat' } : {}) }; throw e;
      }
    }
    return Object.freeze({ importats: Object.freeze(importats), tipus });
  }
  // El handle i el motor queden dins de la clausura: cap ruta pública d'escriptura salta el pany.
  const senseMetadades = Object.freeze([]);
  const metadadesVives = camp => {
    try { comprovaFont(); return motor[camp]; }
    catch { return senseMetadades; }
  };
  const font = Object.freeze({
    // Nom estable del volum (pseudònim en OPFS per compte), sense IDs en clar.
    get nom() { return motor.nom; },
    get limitacions() { return metadadesVives('limitacions'); }, get carpetes() { return metadadesVives('carpetes'); },
    get handle() { return null; }, get potEscriure() { try { comprovaVigencia(); return webLocks; } catch { return false; } },
    llista: (...args) => llig(() => motor.llista(...args)),
    llig: (...args) => llig(() => motor.llig(...args)),
    info: (...args) => llig(() => motor.info(...args)),
    fitxer: (...args) => llig(() => motor.fitxer(...args)),
    escriu: (...args) => muta(() => motor.escriu(...args)),
    mou: (...args) => muta(() => motor.mou(...args)),
    reanomena: (...args) => muta(() => motor.reanomena(...args)),
    creaCarpeta: (...args) => muta(() => motor.creaCarpeta(...args)),
    elimina: (...args) => muta(() => motor.elimina(...args)),
    oblida
  });
  return Object.freeze({ font, tipus, privatDelNavegador: true, modeAmbit: ambitNet ? 'compte' : 'global', oblida,
    bloqueig: Object.freeze({ get mode() { return webLocks ? 'web-locks' : 'nomes-lectura'; }, clau: clauBloqueig }),
    importaFitxers: llista => muta(() => importa(llista)),
    // Les operacions compostes passen el motor real als helpers canònics, sota un sol pany.
    llegixText: (...args) => llig(() => llegixTextLocal(motor, ...args)),
    escriuText: (...args) => muta(() => escriuTextLocal(motor, ...args)),
    creaFitxerMarkdown: (...args) => muta(() => creaFitxerMarkdownLocal(motor, ...args)),
    desaWebp: (...args) => muta(() => desaWebpALaCarpetaLocal(motor, ...args)),
    desaWebpIMouOriginal: (...args) => muta(() => desaWebpIMouOriginalLocal(motor, ...args))
  });
  } catch (cause) { vida.oblida(); throw cause; }
}

/** La UI munta este input i fa click des del gest de la persona; mai invoca showDirectoryPicker. */
export function creaSelectorFitxersOpfs({ documentImpl = globalThis.document, enSeleccionar, enError = () => {} } = {}) {
  if (!documentImpl?.createElement || typeof enSeleccionar !== 'function') throw error('PARAMETRES_INVALIDS', 'Cal un selector i un consumidor.');
  const input = documentImpl.createElement('input'); input.type = 'file'; input.multiple = true;
  input.addEventListener('change', () => {
    const files = Array.from(input.files || []); input.value = '';
    Promise.resolve().then(() => enSeleccionar(files)).catch(enError);
  });
  return input;
}
