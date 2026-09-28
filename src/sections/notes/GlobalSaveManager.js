import { classificaError } from '../../data/autodesament/errors.js';

const DB_NAME = 'SdpNotesQueue';
const STORE_NAME = 'drafts';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('El magatzem d’esborranys està bloquejat.'));
  });
}

// Read/compare/write share one transaction, including across browser tabs.
export async function mutateDraft(key, transform) {
  const db = await getDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      let result;
      request.onsuccess = () => {
        result = transform(request.result || {});
        if (result == null) store.delete(key);
        else store.put(result, key);
      };
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('Esborrany no desat.'));
    });
  } finally { db.close(); }
}

/* T47 (ordre del Mestre, 260928) · Una lectura que falla (IndexedDB bloquejat:
   Firefox 100–114 en privat, dins de la Baseline 2022) ja no tomba la càrrega
   del Bloc: el que hi ha al disc no es pot llegir, però el que esta pestanya
   guarda en memòria (GlobalSaveManager.escriu) sí. No rebutja mai. */
let avisLectura = false;
export async function getDraftsForScope(scopeKey, gestor = bgSaveManager) {
  let disc = {};
  try {
    disc = await llegeixDelDisc(scopeKey);
  } catch (error) {
    if (!avisLectura) console.warn('[Notes] No es poden llegir els esborranys del dispositiu:', error);
    avisLectura = true;
  }
  return { ...disc, ...gestor.esborranysEnMemoria(scopeKey) };
}

/** T47 · Esborra del disc els esborranys que compleixen `predicat(clau)`. Torna les claus. */
export async function purgaEsborranys(predicat) {
  const db = await getDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const esborrades = [];
      const request = tx.objectStore(STORE_NAME).openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        if (predicat(String(cursor.key))) {
          esborrades.push(String(cursor.key));
          cursor.delete();
        }
        cursor.continue();
      };
      tx.oncomplete = () => resolve(esborrades);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('No s’han pogut esborrar els esborranys.'));
    });
  } finally { db.close(); }
}

/** T47 (correcció de la revisió C02, 260928) · Llig del disc, sense tocar-los,
 * els esborranys que compleixen `predicat(clau)`. Torna [[clau, registre]]. */
export async function llegeixEsborranys(predicat) {
  const db = await getDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const trobats = [];
      const request = tx.objectStore(STORE_NAME).openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        if (predicat(String(cursor.key))) trobats.push([String(cursor.key), cursor.value]);
        cursor.continue();
      };
      tx.oncomplete = () => resolve(trobats);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('No es poden llegir els esborranys.'));
    });
  } finally { db.close(); }
}

/** T47 · Si la clau és d'un esborrany de Notes de la persona `usuariId`, de
 * qualsevol actor seu i backend. L'àmbit el fa NotesDataContext: `backend:[…]_`
 * + `persona::ID` (actor personal) o `ID_tipus::actor` (entitat) + `_tenant`. */
export function esEsborranyDe(clau, usuariId) {
  const id = String(usuariId ?? '');
  if (!id) return false;
  const text = String(clau);
  return text.includes(`]_persona::${id}_`) || text.includes(`]_${id}_`);
}

async function llegeixDelDisc(scopeKey) {
  const db = await getDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const result = {};
      const request = tx.objectStore(STORE_NAME).openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        if (String(cursor.key).startsWith(`${scopeKey}:`)) {
          result[String(cursor.key).slice(scopeKey.length + 1)] = cursor.value;
        }
        cursor.continue();
      };
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('No es poden llegir els esborranys.'));
    });
  } finally { db.close(); }
}

export function draftFields(draft = {}) {
  return Object.fromEntries(Object.entries(draft).filter(([key]) => !key.startsWith('_')));
}

/* ═══════════════════════════════════════════════════════════════════
   T47b (ordre del Mestre, 260928) · «Totes les dades s'han de desar
   automàticament sense pèrdues de dades.»

   Notes ja escrivia cada tecla a IndexedDB abans de la xarxa. El que
   fallava era després:
   · `update`, `clear` i `toast` es quedaven els del PRIMER enqueue: renovat
     el JWT, `update` era la d'una operació morta (AbortError i toast).
     Ara es renoven a cada tecla.
   · Un desat fallit només feia un toast: l'esborrany es quedava a
     IndexedDB i ningú el tornava a enviar. Ara el lot torna a la cua
     (reprograma) i es reintenta amb retrocés, en tornar la xarxa
     ('online') i en renovar-se la sessió ('sdp:auth-change').
   · AbortError és la sessió, no la persona: queda pendent, sense toast.
   · Una columna que el servidor no té (l'emoticona sense migració) ja no
     bloqueja tota la nota: eixe camp queda en quarantena a l'esborrany i
     la resta ix.
   · `estat` i `subscriu` publiquen l'estat per a la ploma (EstatDesament).
   · `repren` torna a enviar, en carregar el Bloc, un esborrany sense
     conflicte que el servidor encara no té.

   Per què no delega en CuaDesament (src/data/autodesament/cua.js): la cua
   del nucli desa registres d'una altra forma en una altra base
   ('SdpAutodesament'), i ací hi ha esborranys vius a 'SdpNotesQueue' amb
   `_operationVersion`, `_fieldVersions` i `_baseRevision` (D01), que
   lligen getDraftsForScope, useLocalSandbox i les proves. Migrar-los sense
   perdre'n cap és una tasca pròpia. Es comparteixen les peces pures:
   classificaError (errors.js) i la ploma (EstatDesament).
   ═══════════════════════════════════════════════════════════════════ */

/* El mateix retrocés que la cua del nucli: 1 s, 2 s, 4 s… fins a 60 s. */
const RETROCES_MS = Object.freeze([1000, 2000, 4000, 8000, 16000, 32000, 60000]);
const cap = () => {};
const MISSATGE_LOCAL = 'No s’ha pogut guardar el canvi en este dispositiu i encara no s’ha enviat: de moment només és en esta pestanya.';
const MISSATGE_CONFLICTE = 'Conflicte: hi ha una versió més recent. El teu esborrany es conserva.';
const MISSATGE_PENDENT = 'No s’ha pogut confirmar el desat. El canvi continua pendent.';
/* T47 · On es conserva el canvi: al disc o, sense IndexedDB, només a la pestanya (escriu). */
const conserva = (pestanya) => (pestanya ? 'només es conserva en esta pestanya' : 'es conserva en este dispositiu');
const MOTIU_COLUMNA = 'el servidor no té on guardar un dels camps d’esta nota';
const ESTAT_NET = Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]), pestanya: false });

const sense = (objecte, camps) => Object.fromEntries(Object.entries(objecte).filter(([camp]) => !camps.has(camp)));
const quarantenaDe = (registre) => new Set(Array.isArray(registre?._quarantena) ? registre._quarantena : []);

/** T47 (ordre del Mestre, 260928) · La marca `_quarantena` de l'esborrany: els
 * camps que el servidor encara no admet. Es persistix perquè, en recarregar, un
 * camp que no pot arribar mai (l'emoticona sense migració) no compte com a
 * esborrany pendent: ni obri el conflicte D01 ni reté la base del CAS. */
function marcaQuarantena(registre, nous, desats) {
  const marca = quarantenaDe(registre);
  nous.forEach(camp => marca.add(camp));
  Object.keys(desats).forEach(camp => marca.delete(camp));
  for (const camp of [...marca]) if (!Object.hasOwn(registre, camp)) marca.delete(camp);
  if (!marca.size && !Object.hasOwn(registre, '_quarantena')) return registre;
  const next = { ...registre };
  if (marca.size) next._quarantena = [...marca];
  else delete next._quarantena;
  return next;
}

/** Classifica una fallada de desat de Notes amb la peça pura del nucli. Un 404
 * és una nota que ja no hi és (o sense accés): reintentar-la no servix de res.
 * T47 · Una columna absent que arriba ací no és cap de les opcionals: eixes les
 * aïlla l'adaptador (columnesOpcionals.js) i en diu els camps. És un error del
 * servidor, amb avís; mai una quarantena en silenci. */
export function classificaFallada(error) {
  if (error?.status === 404) return { tipus: 'servidor', missatge: 'esta nota ja no és al servidor o no hi tens accés' };
  const classificat = classificaError(error);
  if (classificat.tipus === 'columna') return { tipus: 'servidor', missatge: MOTIU_COLUMNA };
  return classificat;
}

function missatgeFallada({ tipus, missatge }, pestanya = false) {
  if (tipus === 'conflicte') return MISSATGE_CONFLICTE;
  if (tipus === 'validacio') return `${missatge} El canvi ${conserva(pestanya)}.`;
  if (tipus === 'servidor') return `No s’ha pogut desar: ${missatge}. El canvi ${conserva(pestanya)}.`;
  return MISSATGE_PENDENT;
}

export class GlobalSaveManager {
  constructor({
    persist = mutateDraft, delay = 600, maxInactiveRevisions = 256, retroces = RETROCES_MS,
    finestra = typeof window !== 'undefined' ? window : null, purga = purgaEsborranys,
    llegeix = llegeixEsborranys
  } = {}) {
    this.persist = persist;
    this.purga = purga;
    this.llegeix = llegeix;
    /* T47 · Claus que el disc no ha pogut guardar: viuen ací, en esta pestanya (escriu). */
    this.memoria = new Map();
    this.delay = delay;
    this.maxInactiveRevisions = Math.max(0, Math.floor(maxInactiveRevisions) || 0);
    this.retroces = retroces;
    this.queues = new Map();
    this.locks = new Map();
    this.writes = new Map();
    this.knownRevisions = new Map();
    /* T47b · Estat de cada nota per a la ploma. */
    this.problemes = new Map();
    this.enviant = new Set();
    this.quarantenes = new Map();
    this.oients = new Set();
    this.versionsEstat = new Map();
    this.instantanies = new Map();
    if (finestra?.addEventListener) {
      finestra.addEventListener('online', () => this.reprenFallades(['temporal']));
      /* La sessió s'ha renovat (o ha canviat): el que esperava sessió o xarxa ix
         ja. Una sessió d'una altra persona no l'envia: `update` és la de
         l'operació que el va encuar i llança AbortError (NotesDataContext). */
      finestra.addEventListener('sdp:auth-change', () => this.reprenFallades(['temporal', 'sessio']));
    }
  }

  getExpectedRevision(scope, id, base = 0) {
    return Math.max(base || 0, this.knownRevisions.get(`${scope}:${id}`) || 0);
  }

  setRevision(scope, id, revision) {
    const key = `${scope}:${id}`;
    const expected = this.getExpectedRevision(scope, id, revision);
    this.knownRevisions.delete(key);
    this.knownRevisions.set(key, expected);
    this.pruneRevisions();
  }

  /** Conserva com a màxim 256 revisions inactives; mai expulsa un desat viu.
   * Una expulsió només perd cache: updateNote continua exigint revisió remota.
   */
  pruneRevisions() {
    const inactive = [...this.knownRevisions.keys()].filter(key =>
      !this.queues.has(key) && !this.locks.has(key) && !this.writes.has(key));
    for (const key of inactive.slice(0, Math.max(0, inactive.length - this.maxInactiveRevisions))) {
      this.knownRevisions.delete(key);
    }
  }

  /** T47 (ordre del Mestre, 260928) · Una clau que el disc no pot escriure
   * (IndexedDB bloquejat: Firefox 100–114 en privat, quota) passa a un registre
   * en memòria amb la mateixa forma (_operationVersion, _fieldVersions,
   * _baseRevision): el CAS i l'enviament continuen, i la ploma diu que el text
   * només es guarda en esta pestanya. La clau ja no torna al disc fins a
   * recarregar: mai dos registres vius de la mateixa nota. */
  async escriu(key, transform) {
    if (!this.memoria.has(key)) {
      try {
        return await this.persist(key, transform);
      } catch (error) {
        console.warn('[Notes] El dispositiu no guarda l’esborrany; es guarda en esta pestanya:', error);
        this.memoria.set(key, {});
        this.avisa(key);
      }
    }
    const result = transform(this.memoria.get(key) || {});
    this.memoria.set(key, result ?? {});
    return result;
  }

  /** Els esborranys amb camps que només són en esta pestanya, per id de nota. */
  esborranysEnMemoria(scope) {
    const prefix = `${scope}:`;
    const result = {};
    for (const [key, registre] of this.memoria) {
      if (key.startsWith(prefix) && Object.keys(draftFields(registre)).length) {
        result[key.slice(prefix.length)] = registre;
      }
    }
    return result;
  }

  write(key, transform) {
    const next = (this.writes.get(key) || Promise.resolve()).catch(() => {}).then(() => this.escriu(key, transform));
    this.writes.set(key, next);
    next.finally(() => {
      if (this.writes.get(key) === next) this.writes.delete(key);
      this.pruneRevisions();
    }).catch(() => {});
    return next;
  }

  serial(key, action) {
    const next = (this.locks.get(key) || Promise.resolve()).catch(() => {}).then(action);
    this.locks.set(key, next);
    next.finally(() => {
      if (this.locks.get(key) === next) this.locks.delete(key);
      this.pruneRevisions();
    }).catch(() => {});
    return next;
  }

  /** Només les funcions que arriben: un repren no porta clear ni toast. */
  renova(item, funcions) {
    for (const [nom, funcio] of Object.entries(funcions)) {
      if (typeof funcio === 'function') item[nom] = funcio;
    }
  }

  enqueue(scope, id, field, value, getBase, update, clear, toast) {
    const key = `${scope}:${id}`;
    let item = this.queues.get(key);
    if (!item) {
      item = { resolves: [], scope, id, clear: cap, toast: cap };
      this.queues.set(key, item);
    }
    /* T47b · A CADA tecla: la funció d'escriptura viva és la de l'última
       operació, no la de la primera (abans, renovat el JWT, era una de morta). */
    this.renova(item, { getBase, update, clear, toast });
    item.persisted = this.write(key, previous => {
      const version = (previous._operationVersion || 0) + 1;
      // D01 · Un esborrany naix quan no queda cap camp pendent: la seua base és
      // la revisió que la persona té davant en eixe moment (o la del darrer desat
      // propi, si la vista encara no l'ha rebuda). Mentre queden camps pendents,
      // la base no es mou: només l'avança un desat propi confirmat.
      // T47 · Un camp en quarantena no és pendent: no arribarà mai amb esta base.
      const enQuarantena = quarantenaDe(previous);
      const pendent = Object.keys(draftFields(previous)).some(camp => !enQuarantena.has(camp));
      const base = pendent && previous._baseRevision != null
        ? previous._baseRevision
        : Math.max(getBase(id)?.revision ?? 0, previous._baseRevision ?? 0);
      return { ...previous, [field]: value, _operationVersion: version,
        _fieldVersions: { ...previous._fieldVersions, [field]: version },
        _baseRevision: base };
    });
    clearTimeout(item.timer);
    item.timer = setTimeout(() => { void this.flush(scope, id); }, this.delay);
    this.avisa(key);
    return new Promise(resolve => item.resolves.push(resolve));
  }

  flush(scope, id) {
    const key = `${scope}:${id}`;
    const item = this.queues.get(key);
    if (!item) return this.locks.get(key) || Promise.resolve(true);
    clearTimeout(item.timer);
    // El lot ix de la cua (les tecles de mentrestant en fan un altre), però el
    // text no s'esborra de l'esborrany fins que el servidor el confirma; si
    // falla, el lot hi torna (reprograma).
    this.queues.delete(key);
    return this.serial(key, () => this.envia(scope, id, item));
  }

  async envia(scope, id, item) {
    const key = `${scope}:${id}`;
    const acaba = (ok) => {
      item.resolves.forEach(resolve => resolve(ok));
      this.avisa(key);
      return ok;
    };
    let snapshot, current;
    try {
      snapshot = await item.persisted;
      current = await this.write(key, value => value);
    } catch {
      // Sense còpia al dispositiu no ix res: una versió que no s'ha pogut
      // anotar tampoc es podria confirmar.
      this.problemes.set(key, { tipus: 'local', missatge: MISSATGE_LOCAL });
      item.toast(MISSATGE_LOCAL, 'error');
      return acaba(false);
    }
    // A preceding save may already have confirmed some accumulated fields.
    // Never resend those old values over a later server revision.
    const payload = Object.fromEntries(Object.entries(draftFields(snapshot)).filter(([field]) =>
      current._fieldVersions?.[field] === snapshot._fieldVersions?.[field]
    ));
    if (!Object.keys(payload).length) {
      this.problemes.delete(key);
      return acaba(true);
    }
    // D01 · La revisió esperada és la BASE de l'esborrany: la que tenia la nota
    // quan es va començar a editar, avançada només pels desats propis
    // confirmats. Mai la darrera lectura remota: si el servidor ha avançat per
    // un altre camí, ha de respondre 409, que és justament el que protegix el CAS.
    let base = current._baseRevision ?? snapshot._baseRevision ?? item.getBase?.(id)?.revision;
    /* T47 (ordre del Mestre, 260928) · Un lot fet només de camps en quarantena no
       ha arribat mai al servidor: la seua base no protegix res del servidor, i la
       revisió que la persona veu és la bona (sense un 409 fals en recarregar). */
    const enQuarantena = quarantenaDe(current);
    if (Object.keys(payload).every(camp => enQuarantena.has(camp))) {
      base = Math.max(base ?? 0, item.getBase?.(id)?.revision ?? 0);
    }
    /* T47b · Els camps opcionals que l'adaptador diu que el servidor no té
       (ErrorColumnaAbsent.camps) ixen del lot i la resta es torna a enviar en
       l'acte (una volta per camp). Cap altra columna s'aïlla ací (T47). */
    const excloses = new Set();
    let saved = null;
    this.enviant.add(key);
    this.avisa(key);
    try {
      for (;;) {
        const cos = sense(payload, excloses);
        if (!Object.keys(cos).length) break;
        try {
          saved = await item.update(id, cos, this.getExpectedRevision(scope, id, base));
          break;
        } catch (error) {
          const absents = this.campsAbsents(error, cos);
          if (!absents.length) throw error;
          absents.forEach(camp => excloses.add(camp));
        }
      }
    } catch (error) {
      this.enviant.delete(key);
      // Never rewrite an old failed snapshot over a newer draft.
      return acaba(this.tractaFallada(scope, id, item, error));
    }
    this.enviant.delete(key);
    /* Els camps que el servidor no ha desat (columna absent) es queden a
       l'esborrany, en quarantena: no es donen per confirmats ni es perden. */
    const noDesats = new Set([...excloses, ...(saved?.campsNoDesats || [])]
      .filter(camp => Object.hasOwn(payload, camp)));
    this.posaEnQuarantena(key, noDesats);
    const desat = sense(payload, noDesats);
    if (saved) {
      try {
        this.setRevision(scope, id, saved.revision);
        await this.write(key, current => {
          const next = { ...current, _fieldVersions: { ...current._fieldVersions } };
          for (const field of Object.keys(desat)) {
            if (next._fieldVersions[field] === snapshot._fieldVersions?.[field]) {
              delete next[field];
              delete next._fieldVersions[field];
            }
          }
          // Keep the counter even when clean; revisions never go backwards.
          next._baseRevision = saved.revision;
          return marcaQuarantena(next, noDesats, desat);
        });
      } catch {
        // El servidor ja ho té; l'esborrany encara no ho sap i ho tornarà a enviar.
        item.toast(MISSATGE_PENDENT, 'error');
        return acaba(false);
      }
      item.clear(id, desat, saved.revision);
    } else if (noDesats.size) {
      // Cap camp desat: l'esborrany només aprén quins són en quarantena.
      await this.write(key, current => marcaQuarantena(current, noDesats, desat)).catch(() => {});
    }
    for (const camp of Object.keys(desat)) this.quarantenes.get(key)?.delete(camp);
    this.problemes.delete(key);
    return acaba(true);
  }

  /** Quins camps del lot declara l'adaptador com a opcionals absents (buit si cap).
   * T47 (ordre del Mestre, 260928) · Només els d'ErrorColumnaAbsent.camps: un
   * PGRST204/42703 cru és d'una columna que l'adaptador no té per opcional, i
   * aïllar-la en silenci amagaria un camp obligatori (classificaFallada). */
  campsAbsents(error, cos) {
    if (error?.name !== 'ErrorColumnaAbsent' || !Array.isArray(error.camps)) return [];
    return error.camps.filter(camp => Object.hasOwn(cos, camp));
  }

  posaEnQuarantena(key, camps) {
    if (!camps.size) return;
    const actual = this.quarantenes.get(key) || new Set();
    camps.forEach(camp => actual.add(camp));
    this.quarantenes.set(key, actual);
  }

  tractaFallada(scope, id, item, error) {
    const key = `${scope}:${id}`;
    const classificat = classificaFallada(error);
    if (classificat.tipus === 'sessio') {
      // Sense avís: no és cap error de la persona. Ix quan la sessió es renova,
      // en tornar a carregar el Bloc (repren) o amb la tecla següent.
      this.problemes.set(key, { tipus: 'sessio', missatge: classificat.missatge });
      this.reprograma(scope, id, item, null);
      return false;
    }
    if (classificat.tipus === 'temporal') {
      const anterior = this.problemes.get(key);
      const intents = (anterior?.tipus === 'temporal' ? anterior.intents : 0) + 1;
      this.problemes.set(key, { tipus: 'temporal', missatge: classificat.missatge, intents });
      this.reprograma(scope, id, item, this.retroces[Math.min(intents, this.retroces.length) - 1]);
      // Un sol avís per ratxa: els reintents no fan ploure toasts (la ploma ho diu).
      if (intents === 1) {
        item.toast(`No s’ha pogut confirmar el desat. Es tornarà a provar sol; el canvi ${conserva(this.memoria.has(key))}.`, 'error');
      }
      return false;
    }
    // Conflicte (D01), validació, permís o una columna que no es pot aïllar: no
    // es reintenta sol. L'esborrany es conserva i torna a eixir amb la tecla
    // següent o en tornar a carregar.
    this.problemes.set(key, { tipus: classificat.tipus, missatge: classificat.missatge });
    item.toast(missatgeFallada(classificat, this.memoria.has(key)), 'error');
    return false;
  }

  /** El lot fallit torna a la cua amb el mateix esborrany. Si ja hi ha tecles
   * noves a la cua, el seu temporitzador ho enviarà tot junt. */
  reprograma(scope, id, fallit, ms) {
    const key = `${scope}:${id}`;
    if (this.queues.has(key)) return;
    const item = {
      resolves: [], scope, id, getBase: fallit.getBase, update: fallit.update,
      clear: fallit.clear, toast: fallit.toast, persisted: fallit.persisted
    };
    this.queues.set(key, item);
    if (ms != null) item.timer = setTimeout(() => { void this.flush(scope, id); }, ms);
  }

  /** Els lots que esperaven xarxa o sessió ixen ja, sense esperar el retrocés. */
  reprenFallades(tipus) {
    for (const [key, problema] of this.problemes) {
      if (!tipus.includes(problema.tipus)) continue;
      const item = this.queues.get(key);
      if (!item) continue;
      clearTimeout(item.timer);
      void this.flush(item.scope, item.id);
    }
  }

  /**
   * T47b · En carregar el Bloc: un esborrany sense conflicte (draftConflict)
   * que el servidor encara no té torna a eixir sense esperar cap tecla.
   * `update` és la de l'operació viva; sense ella no es fa res.
   */
  repren(scope, id, { getBase, update } = {}) {
    if (typeof update !== 'function') return;
    const key = `${scope}:${id}`;
    const actual = this.queues.get(key);
    if (actual) {
      this.renova(actual, { getBase, update });
      /* T47 (ordre del Mestre, 260928) · Una tecla recent i el retrocés d'una
         fallada 'temporal' ja tenen temporitzador, i mana ell: una càrrega (que
         un TimeoutError provoca ell mateix amb refresh) no l'avança. Només ix ja
         el lot que no en té: el que esperava sessió. */
      if (actual.timer != null) return;
      actual.timer = setTimeout(() => { void this.flush(scope, id); }, 0);
      return;
    }
    // Un desat en curs ja porta l'esborrany; si falla, el tornarà a la cua.
    if (this.locks.has(key)) return;
    const item = { resolves: [], scope, id, getBase, update, clear: cap, toast: cap, persisted: this.write(key, value => value) };
    this.queues.set(key, item);
    item.timer = setTimeout(() => { void this.flush(scope, id); }, 0);
    this.avisa(key);
  }

  /* ── T47b · Estat per a la ploma (useSyncExternalStore) ─────────────── */

  subscriu(oient) {
    this.oients.add(oient);
    return () => { this.oients.delete(oient); };
  }

  avisa(key) {
    this.versionsEstat.set(key, (this.versionsEstat.get(key) || 0) + 1);
    for (const oient of [...this.oients]) {
      try { oient(); } catch (error) { console.warn('[Notes] Oient del desament:', error); }
    }
  }

  /**
   * { estat, problema, quarantena } d'una nota, estable entre avisos.
   *   estat       'net' | 'pendent' | 'enviant' | 'sessio' | 'error'
   *   problema    { tipus, missatge } de l'última fallada, o null
   *   quarantena  camps que el servidor no admet i es guarden al dispositiu
   *   pestanya    T47 · el dispositiu no guarda l'esborrany: només és en esta pestanya
   */
  estat(scope, id) {
    const key = `${scope}:${id}`;
    const versio = this.versionsEstat.get(key) || 0;
    if (!versio) return ESTAT_NET;
    const desada = this.instantanies.get(key);
    if (desada && desada.versio === versio) return desada.valor;
    const problema = this.problemes.get(key) || null;
    const quarantena = [...(this.quarantenes.get(key) || [])];
    let estat = 'net';
    if (problema && problema.tipus !== 'sessio') estat = 'error';
    else if (this.enviant.has(key)) estat = 'enviant';
    else if (problema) estat = 'sessio';
    else if (this.queues.has(key)) estat = 'pendent';
    else if (quarantena.length) estat = 'error';
    const valor = Object.freeze({
      estat,
      problema: problema ? Object.freeze({ ...problema }) : null,
      quarantena: Object.freeze(quarantena),
      pestanya: this.memoria.has(key)
    });
    this.instantanies.set(key, { versio, valor });
    return valor;
  }

  /** Paperera, esborrat o «conservar el remot»: la nota ja no té res pendent. */
  oblidaEstat(key) {
    this.problemes.delete(key);
    this.quarantenes.delete(key);
    this.avisa(key);
  }

  // Publication enters the same lock synchronously, before any later autosave.
  runExclusive(scope, id, action) {
    const flushed = this.flush(scope, id);
    return this.serial(`${scope}:${id}`, async () => {
      if (!await flushed) throw new Error('Cal confirmar el desat abans de publicar.');
      return action();
    });
  }

  async clearDraft(scope, id) {
    const key = `${scope}:${id}`;
    const item = this.queues.get(key);
    if (item) {
      clearTimeout(item.timer);
      this.queues.delete(key);
      item.resolves.forEach(resolve => resolve(false));
    }
    // A later enqueue is ordered after this clear, never removed by it.
    await this.write(key, current => ({ _operationVersion: (current._operationVersion || 0) + 1 }));
    this.oblidaEstat(key);
  }

  /** Esborrat definitiu: la nota ja no es desa més. Cancel·la la cua pendent
   * (les seues promeses es resolen a false), esborra el registre d'IndexedDB
   * (escriure null és l'única manera: clearDraft el conserva) i oblida la
   * revisió coneguda. Un enqueue posterior el tornaria a crear: qui crida ha de
   * tallar abans els desats d'eixa nota. Paperera i arxiu van per `retira`. */
  async oblida(scope, id) {
    const key = `${scope}:${id}`;
    this.cancelaCua(key);
    await this.write(key, () => null);
    this.knownRevisions.delete(key);
    this.oblidaEstat(key);
  }

  /** T47b (ordre del Mestre, 260928) · Paperera o arxiu: la nota ix del Bloc i
   * ja no es desa més, però el que el servidor encara no té NO es perd. Quan
   * s'arriba ací, runExclusive ja ha desat tot el que podia: el que queda a
   * l'esborrany és el que el servidor no ha confirmat (un camp en quarantena,
   * com l'emoticona sense migració, o un esborrany D01 que espera decisió). Es
   * conserva al dispositiu tal com és, sense cua; sense res pendent, el registre
   * s'esborra com abans. Torna els camps conservats. */
  async retira(scope, id) {
    const key = `${scope}:${id}`;
    this.cancelaCua(key);
    const conservat = await this.write(key, current =>
      Object.keys(draftFields(current)).length ? current : null);
    this.knownRevisions.delete(key);
    this.oblidaEstat(key);
    return Object.keys(draftFields(conservat || {}));
  }

  /* T47 (ordre del Mestre, 260928) · EIXIDA EXPLÍCITA. La mateixa política que
     el nucli (eixDeLaSessio, src/data/autodesament/sessio.js) per a
     'SdpNotesQueue', en dos passos perquè qui fa l'eixida hi pose la
     revocació enmig: 1) enviaPendentsDe, amb la sessió encara vàlida (la cua
     envia amb l'escriptura de la sessió viva); 2) tancar la sessió; 3) només si
     ha anat bé, oblidaUsuari. */

  /** Pas 1: darrer intent d'enviar el que esta persona té a la cua de Notes, com
   * a màxim `espera` ms (eixir no es queda penjat d'una xarxa morta). Torna
   * true si tots els enviaments han acabat dins del límit. Mai rebutja. */
  async enviaPendentsDe(usuariId, { espera = 3000 } = {}) {
    const esDeLUsuari = (clau) => esEsborranyDe(clau, usuariId);
    const envios = [];
    for (const [key, item] of [...this.queues]) {
      if (esDeLUsuari(key)) envios.push(this.flush(item.scope, item.id));
    }
    for (const [key, lock] of this.locks) if (esDeLUsuari(key)) envios.push(lock);
    if (!envios.length) return true;
    let temps;
    const acabat = await Promise.race([
      Promise.allSettled(envios).then(() => true),
      new Promise(resolve => { temps = setTimeout(() => resolve(false), espera); })
    ]);
    clearTimeout(temps);
    return acabat;
  }

  /** Pas 3: s'obliden d'este dispositiu (disc i memòria) tots els esborranys de
   * Notes d'esta persona, de qualsevol actor seu i backend, també els que el
   * servidor no ha pogut guardar (quarantena, D01): en un ordinador compartit
   * del poble, el text d'una persona no es queda per a la següent. Torna les
   * claus oblidades. */
  async oblidaUsuari(usuariId) {
    const esDeLUsuari = (clau) => esEsborranyDe(clau, usuariId);
    if (!String(usuariId ?? '')) return [];
    const claus = new Set([
      ...this.queues.keys(), ...this.knownRevisions.keys(), ...this.problemes.keys(),
      ...this.quarantenes.keys(), ...this.memoria.keys(), ...this.versionsEstat.keys()
    ].filter(esDeLUsuari));
    for (const key of claus) {
      this.cancelaCua(key);
      this.knownRevisions.delete(key);
      this.memoria.delete(key);
      this.oblidaEstat(key);
    }
    let delDisc = [];
    try {
      delDisc = await this.purga(esDeLUsuari);
    } catch (error) {
      console.warn('[Notes] No s’han pogut oblidar els esborranys del dispositiu:', error);
    }
    return [...new Set([...claus, ...(delDisc || [])])];
  }

  /** T47 (correcció de la revisió C01/C02, 260928) · Per a l'avís d'eixida:
   * les notes d'esta persona amb camps que el servidor encara no té (també en
   * quarantena o en conflicte D01), del disc i de la memòria d'esta pestanya
   * (que mana per a la seua clau). Torna [{ entitat: 'nota', id, camps }].
   * No esborra res i mai rebutja. */
  async pendentsDe(usuariId) {
    if (!String(usuariId ?? '')) return [];
    const esDeLUsuari = (clau) => esEsborranyDe(clau, usuariId);
    const registres = new Map();
    try {
      for (const [clau, registre] of await this.llegeix(esDeLUsuari) || []) registres.set(clau, registre);
    } catch (error) {
      console.warn('[Notes] No es poden llegir els esborranys del dispositiu:', error?.message || error);
    }
    for (const [clau, registre] of this.memoria) if (esDeLUsuari(clau)) registres.set(clau, registre);
    const pendents = [];
    for (const [clau, registre] of registres) {
      const camps = Object.keys(draftFields(registre || {}));
      if (camps.length) pendents.push({ entitat: 'nota', id: clau.slice(clau.lastIndexOf(':') + 1), camps });
    }
    return pendents;
  }

  /** La cua pendent es cancel·la: les seues promeses es resolen a false. */
  cancelaCua(key) {
    const item = this.queues.get(key);
    if (!item) return;
    clearTimeout(item.timer);
    this.queues.delete(key);
    item.resolves.forEach(resolve => resolve(false));
  }

  /** D01 · Decisió explícita de la persona: conservar el seu esborrany damunt
   * d'una revisió remota més nova. Només mou la base; els camps no es toquen. */
  async rebaseDraft(scope, id, revision) {
    const key = `${scope}:${id}`;
    const current = await this.write(key, previous => ({ ...previous, _baseRevision: revision }));
    // T47b · La persona ja ha decidit: el conflicte deixa de pintar-se.
    if (this.problemes.get(key)?.tipus === 'conflicte') {
      this.problemes.delete(key);
      this.avisa(key);
    }
    return draftFields(current);
  }

  /** D01 · Una revisió confirmada per una escriptura pròpia fora de la cua
   * (la publicació) també avança la base de l'esborrany: un canvi propi mai no
   * és un conflicte, tampoc després de recarregar. Sense registre, no en crea cap. */
  async confirmRevision(scope, id, revision) {
    this.setRevision(scope, id, revision);
    await this.write(`${scope}:${id}`, previous => {
      if (!Object.keys(previous).length) return null;
      return (previous._baseRevision ?? 0) < revision ? { ...previous, _baseRevision: revision } : previous;
    });
  }
}

export const bgSaveManager = new GlobalSaveManager();

/** T47 (ordre del Mestre, 260928) · Eixida explícita, pas 1 (abans de revocar
 * la sessió). Vegeu GlobalSaveManager.enviaPendentsDe. */
export function enviaNotesDeLUsuari(usuariId, opcions) {
  return bgSaveManager.enviaPendentsDe(usuariId, opcions);
}

/** T47 (ordre del Mestre, 260928) · Eixida explícita, pas 3 (només si la
 * sessió s'ha tancat bé). Vegeu GlobalSaveManager.oblidaUsuari. */
export function oblidaNotesDeLUsuari(usuariId) {
  return bgSaveManager.oblidaUsuari(usuariId);
}

/** T47 (correcció de la revisió C01/C02, 260928) · Per a l'avís d'eixida: el
 * que Notes encara no ha pogut enviar. Vegeu GlobalSaveManager.pendentsDe. */
export function pendentsNotesDe(usuariId) {
  return bgSaveManager.pendentsDe(usuariId);
}
