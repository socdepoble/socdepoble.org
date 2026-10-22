import { APP_SEED, NOTE_FOLDERS_SEED, getDefaultUserId } from './appSeed.js';
import { backendScope, normalizeBackendConfig } from '../config/backendConfig.js';
import { sanitizeHtml, netejaText, esFontImatgeSegura } from '../utils/sanitize.js';
import { normalitzaOrigen } from './origenNota.js';
import { emojiSol } from '../utils/emoji.js';
import { dataIsoONull } from '../utils/calendari.js';
import { registraIncident } from '../utils/autocuracio.js';

const STORE = 'notes';
function openDB() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('El navegador no permet desar notes locals.')); return; }
    const request = indexedDB.open('SdpLocalNotes', 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Tanca les altres pestanyes per actualitzar el bloc local.'));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
  });
}

// One transaction for read/compare/write; browser tabs share the same revision lock.
const persistence = {
  async mutate(key, transform) {
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const request = store.get(key);
        let value, failure;
        request.onsuccess = () => {
          try { value = transform(request.result); store.put(value, key); }
          catch (error) { failure = error; tx.abort(); }
        };
        tx.oncomplete = () => resolve(value);
        tx.onabort = tx.onerror = () => reject(failure || tx.error || new Error('Nota local no desada.'));
      });
    } finally { db.close(); }
  },
  async read(key) {
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const request = tx.objectStore(STORE).get(key);
        tx.oncomplete = () => resolve(request.result || {});
        tx.onabort = tx.onerror = () => reject(tx.error || new Error('No es poden llegir les notes locals.'));
      });
    } finally { db.close(); }
  }
};

function clean(input) {
  const result = {};
  for (const field of ['title', 'subtitle', 'lead', 'content']) if (input[field] !== undefined) result[field] = sanitizeHtml(input[field]);
  for (const field of ['heroImage', 'logoImage']) if (input[field] !== undefined) result[field] = esFontImatgeSegura(input[field]) ? input[field] : '';
  for (const field of ['categories', 'tags']) if (input[field] !== undefined) {
    if (!Array.isArray(input[field])) throw new Error('Classificació de nota invàlida.');
    result[field] = input[field].map(value => netejaText(value)).filter(Boolean);
  }
  if (input.folderId !== undefined) result.folderId = netejaText(input.folderId);
  if (input.copyright !== undefined) result.copyright = netejaText(input.copyright).slice(0, 256);
  /* T23 · emoticona de la nota: un sol emoji, o buit per a llevar-la. */
  if (input.icon !== undefined) result.icon = emojiSol(input.icon) || '';
  /* T40 (ordre del Mestre, 260928) · data de publicació: ISO vàlida o null. */
  if (input.publishDate !== undefined) result.publishDate = dataIsoONull(input.publishDate);
  /* T5 · d'on ve una nota connectada; null si no és cap origen conegut. */
  if (input.origen !== undefined) result.origen = normalitzaOrigen(input.origen);
  return result;
}

/* Cicle de vida d'una nota. Sense `estat`, una nota és activa. */
export const ESTATS_NOTA = Object.freeze(['activa', 'paperera', 'arxivada']);
export const DIES_PAPERERA = 30;
const DIA_MS = 24 * 60 * 60 * 1000;

const revisioValida = revision => Number.isSafeInteger(revision) && revision >= 0;
/* Una nota de llavor esborrada deixa una marca: sense ella, initial() la
   tornaria a barrejar en la càrrega següent i ressuscitaria. */
const viva = (notes, id) => (Object.hasOwn(notes, id) && !notes[id]?._esborrada ? notes[id] : null);
/* Onada 12 (261011; ordres 261011_0130, punt 7) · Una entrada del magatzem que
   no és un objecte (null, un text, un número) no és cap nota. Abans passava
   el filtre de load(): un null rebutjava tota càrrega de les notes
   (loadNotesPage llig note.estat) i un primitiu eixia com una nota sense id.
   Només es deixa de llistar: l'entrada es queda al magatzem, intacta. */
const esNota = (note) => note !== null && typeof note === 'object' && !note._esborrada;
const noTrobada = () => Object.assign(new Error('Nota local no trobada.'), { status: 404 });
const conflicte = () => Object.assign(new Error('Conflicte de concurrència de revisió.'), { status: 409 });

/** Storage is injectable for another offline host; the DTO matches the backend port.
 * El rellotge també: la purga de la paperera es prova sense esperar 30 dies. */
export function createLocalNotesAdapter(storage = persistence, { rellotge = () => new Date() } = {}) {
  const scope = (owner, config) => JSON.stringify([backendScope(config), owner]);
  const seeds = config => normalizeBackendConfig(config).dataMode === 'seed' ? APP_SEED.notes || [] : [];
  const initial = config => Object.fromEntries(seeds(config).map(n => [n.id, { ...n, revision: n.revision || 0, isPublished: false }]));
  /* Gauntlet 261022_0225 (crítica Claude, F9) · Les lectures que coincidixen
     en el temps es compartixen: 10.000 loadNotesPage alhora feien 20.002
     lectures del magatzem (a IndexedDB, cada una amb una connexió nova) i
     10.000 còpies de 7.000 notes. Ara cada abast té com a molt una lectura i
     una càrrega en vol, i qui arriba mentrestant rep el mateix resultat. No hi
     ha memòria cau més enllà de la lectura: una escriptura d'este adaptador
     talla la compartició en començar i en acabar, i la càrrega següent ja la
     veu. Ningú no modifica el resultat compartit (notes.js en fa còpies).
     La purga de la paperera també es compartix: és idempotent, i qui la
     demana (la primera pàgina de loadNotesPage) no en mira el resultat. */
  const lecturesEnVol = new Map();
  const carreguesEnVol = new Map();
  const purguesEnVol = new Map();
  const comparteix = (enVol, clau, fes) => {
    if (!enVol.has(clau)) {
      const promesa = fes().finally(() => { if (enVol.get(clau) === promesa) enVol.delete(clau); });
      enVol.set(clau, promesa);
    }
    return enVol.get(clau);
  };
  const llig = clau => comparteix(lecturesEnVol, clau, async () => storage.read(clau));
  const escriu = async (clau, transform) => {
    lecturesEnVol.delete(clau);
    carreguesEnVol.delete(clau);
    try { return await storage.mutate(clau, transform); }
    finally { lecturesEnVol.delete(clau); carreguesEnVol.delete(clau); }
  };
  return {
    async load(owner = getDefaultUserId(), config = {}) {
      const clau = scope(owner, config);
      return comparteix(carreguesEnVol, clau, async () => {
        const notes = { ...initial(config), ...await llig(clau) };
        const totes = Object.values(notes);
        const bones = totes.filter(esNota);
        const malmeses = totes.length - bones.length - totes.filter(note => note?._esborrada).length;
        if (malmeses && registraIncident('dades', 'notes-locals', 'entrada-apartada') === 1) {
          console.warn(`[localNotes] ${malmeses} entrada/es del magatzem local no són notes: es deixen de banda, sense tocar-les.`);
        }
        return { notes: bones, noteFolders: NOTE_FOLDERS_SEED };
      });
    },
    async create(input, config = {}) {
      const id = input.id || crypto.randomUUID();
      const time = new Date().toISOString();
      const note = { id, folderId: 'f-notes', title: '', content: '', ...clean(input), revision: 0,
        isPublished: false, createdAt: time, updatedAt: time };
      await escriu(scope(getDefaultUserId(), config), stored => {
        const all = { ...initial(config), ...stored };
        if (Object.hasOwn(all, id)) throw Object.assign(new Error('La nota ja existix.'), { status: 409 });
        return { ...all, [id]: note };
      });
      return note;
    },
    async update(id, changes, expectedRevision, config = {}) {
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error('Cal la revisió de la nota.');
      const all = await escriu(scope(getDefaultUserId(), config), stored => {
        const notes = { ...initial(config), ...stored };
        const previous = viva(notes, id);
        if (!previous) throw noTrobada();
        if (previous.revision !== expectedRevision) throw conflicte();
        return { ...notes, [id]: { ...previous, ...clean(changes), revision: expectedRevision + 1,
          isPublished: false, updatedAt: new Date().toISOString() } };
      });
      return all[id];
    },
    /** Paperera, arxiu o tornada a activa. La data d'entrada a la paperera
     * només canvia quan hi entra; si ja hi era, es conserva. */
    async move(id, estat, expectedRevision, config = {}) {
      if (!ESTATS_NOTA.includes(estat)) throw new Error('Estat de nota invàlid.');
      if (!revisioValida(expectedRevision)) throw new Error('Cal la revisió de la nota.');
      const ara = rellotge().toISOString();
      const all = await escriu(scope(getDefaultUserId(), config), stored => {
        const notes = { ...initial(config), ...stored };
        const previous = viva(notes, id);
        if (!previous) throw noTrobada();
        if (previous.revision !== expectedRevision) throw conflicte();
        const jaHiEra = (previous.estat ?? 'activa') === 'paperera' && previous.enPapereraAl;
        return { ...notes, [id]: { ...previous, estat,
          enPapereraAl: estat !== 'paperera' ? null : jaHiEra ? previous.enPapereraAl : ara,
          revision: expectedRevision + 1, updatedAt: ara } };
      });
      return all[id];
    },
    async remove(id, expectedRevision, config = {}) {
      if (!revisioValida(expectedRevision)) throw new Error('Cal la revisió de la nota.');
      await escriu(scope(getDefaultUserId(), config), stored => {
        const notes = { ...initial(config), ...stored };
        const previous = viva(notes, id);
        if (!previous) throw noTrobada();
        if (previous.revision !== expectedRevision) throw conflicte();
        const resta = { ...notes };
        if (Object.hasOwn(initial(config), id)) resta[id] = { id, _esborrada: true };
        else delete resta[id];
        return resta;
      });
      return { id };
    },
    /** Sense servidor no hi ha pg_cron: la paperera es purga en carregar la
     * llista. Només caduca la paperera; l'arxiu no té data de caducitat. */
    async purgaPaperera(config = {}, owner = getDefaultUserId()) {
      const limit = rellotge().getTime() - DIES_PAPERERA * DIA_MS;
      const vencuda = note => Boolean(note) && !note._esborrada && note.estat === 'paperera'
        && Date.parse(note.enPapereraAl) <= limit;
      const key = scope(owner, config);
      return comparteix(purguesEnVol, key, async () => {
        // Lectura primer: una llista sense res vençut no escriu a IndexedDB.
        if (!Object.values(await llig(key)).some(vencuda)) return 0;
        let purgades = 0;
        await escriu(key, stored => {
          const resta = { ...stored };
          purgades = 0;
          for (const [id, note] of Object.entries(resta)) {
            if (!vencuda(note)) continue;
            if (Object.hasOwn(initial(config), id)) resta[id] = { id, _esborrada: true };
            else delete resta[id];
            purgades++;
          }
          return resta;
        });
        return purgades;
      });
    }
  };
}
export const localNotes = createLocalNotesAdapter();
