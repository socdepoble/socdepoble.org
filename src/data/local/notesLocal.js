/**
 * notesLocal.js — Les Notes de l'adaptador local (T1 · D01): la llista
 * lleugera per pàgines, el detall per id i el cicle de vida (capacitats
 * 'paginacioNotes' i 'cicleNotes').
 *
 * Porta la branca sense servidor de supabase/notes.js (loadNotesPage,
 * loadNotes, mouNota i esborraNota) sobre el servidor local de notes
 * (localNotes.js · createLocalNotesAdapter), que posa les revisions, el 409 i
 * el 404. El magatzem és el d'esta instància (memòria, injectat o IndexedDB).
 * Totes les eixides són còpies: cap àlies de la llavor ni del magatzem.
 */
import { getDefaultUserId } from '../identitat.js';

const LIMIT_NOTES = 50;
const ESTATS_NOTA = Object.freeze(['activa', 'paperera', 'arxivada']);
const activa = (nota) => (nota.estat ?? 'activa') === 'activa';
/* L'ordre i el cursor per unitat de codi, com `order=id.desc` i `id=lt.` de PostgREST. */
const perIdDesc = (a, b) => {
  const x = String(a.id);
  const y = String(b.id);
  return x < y ? 1 : x > y ? -1 : 0;
};
const revisioValida = (revisio) => Number.isSafeInteger(revisio) && revisio >= 0;
/* Com la RLS del servidor: només es lligen les notes de qui mira (la sessió o
   el convidat). Les d'un altre propietari no hi són, sense dir per què. */
const sonMeues = (ownerUserId) => String(ownerUserId) === String(getDefaultUserId());
const BUIDA = Object.freeze({ notes: [], noteFolders: [] });
const exigixObjecte = (valor, que) => {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) throw new TypeError(`[adaptadorLocal] ${que} ha de ser un objecte.`);
  return valor;
};

export function creaNotesLocal(e) {
  async function loadNotesPage({ ownerUserId = getDefaultUserId(), cursor = null, limit = LIMIT_NOTES } = {}, config = {}) {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > LIMIT_NOTES) throw new Error('Límit de Notes invàlid.');
    let despres = null;
    if (cursor !== null) {
      try {
        const decodificat = JSON.parse(cursor);
        if (!Array.isArray(decodificat) || decodificat.length !== 3 || decodificat[0] !== e.configuracio.tenantId
          || decodificat[1] !== ownerUserId || typeof decodificat[2] !== 'string') throw new Error();
        despres = decodificat[2];
      } catch { throw new Error('Cursor de Notes invàlid per a este àmbit.'); }
    }
    const abast = e.ci(config);
    /* Sense servidor no hi ha pg_cron: la paperera es purga en començar el
       recorregut, de millor esforç (una fallada no impedix la lectura). */
    if (cursor === null && sonMeues(ownerUserId)) await e.notes.purgaPaperera(abast, ownerUserId).catch(() => 0);
    const lectura = sonMeues(ownerUserId) ? await e.notes.load(ownerUserId, abast) : BUIDA;
    const actives = (lectura.notes || []).filter(activa).sort(perIdDesc);
    const desDe = despres === null ? 0 : actives.findIndex((nota) => String(nota.id) < despres);
    const queden = desDe < 0 ? 0 : actives.length - desDe;
    const notes = (queden ? actives.slice(desDe, desDe + limit) : []).map((nota) => {
      const resum = { ...nota, contentLoaded: false };
      delete resum.content;
      return resum;
    });
    const complete = queden <= limit;
    return e.copia({ notes, noteFolders: lectura.noteFolders || [], complete,
      nextCursor: complete ? null : JSON.stringify([e.configuracio.tenantId, ownerUserId, String(notes.at(-1).id)]) });
  }

  return {
    loadNotesPage,

    /* La llista inicial lleugera o, amb config.noteId, el detall sencer d'una nota activa. */
    async loadNotes(ownerUserId = getDefaultUserId(), config = {}) {
      if (config?.noteId === null || config?.noteId === undefined) {
        const pagina = await loadNotesPage({ ownerUserId, cursor: config?.cursor ?? null }, config);
        return { ...pagina, notesComplete: pagina.complete };
      }
      const id = String(config.noteId);
      if (!id) throw new Error('Cal un ID de nota no buit.');
      const lectura = sonMeues(ownerUserId) ? await e.notes.load(ownerUserId, e.ci(config)) : BUIDA;
      const notes = (lectura.notes || []).filter((nota) => String(nota.id) === id && activa(nota));
      return e.copia({ notes: notes.map((nota) => ({ ...nota, contentLoaded: true })), noteFolders: lectura.noteFolders || [],
        notesComplete: false, noteResolution: { id, status: notes.length ? 'found' : 'not-found' } });
    },

    async creaCarpetaNotes(input, config = {}) {
      return e.notes.createFolder(input, e.ci(config));
    },
    async createNote(input, config = {}) {
      return e.copia(await e.notes.create(exigixObjecte(input, 'La nota'), e.ci(config)));
    },

    async updateNote(id, updates, expectedRevision, config = {}) {
      return e.copia(await e.notes.update(id, exigixObjecte(updates, 'El canvi de la nota'), expectedRevision, e.ci(config)));
    },

    async mouNota(id, estat, expectedRevision, config = {}) {
      if (!ESTATS_NOTA.includes(estat)) throw new Error('Estat de nota invàlid.');
      if (!revisioValida(expectedRevision)) throw new Error('ATURADOR CRÍTIC: expectedRevision és obligatori.');
      return e.copia(await e.notes.move(id, estat, expectedRevision, e.ci(config)));
    },

    async esborraNota(id, expectedRevision, config = {}) {
      if (!revisioValida(expectedRevision)) throw new Error('ATURADOR CRÍTIC: expectedRevision és obligatori.');
      return e.copia(await e.notes.remove(id, expectedRevision, e.ci(config)));
    }
  };
}
