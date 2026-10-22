/* Gauntlet 261022_0225 (crítica Claude, F9 i F10) · Les Notes sense servidor
   (llavor i local): el cursor i l'ordre fan servir el mateix comparador, i les
   càrregues que coincidixen en el temps compartixen una sola lectura del
   magatzem sense servir mai una llista vella després d'una escriptura. El
   magatzem és de memòria: s'instal·la al singleton real, com a l'arnés
   d'estrès (amb vi.mock, els imports dinàmics concurrents en perdien el mock). */
import { beforeEach, describe, expect, test } from 'vitest';
import { getDefaultUserId } from '../appSeed.js';
import { backendScope } from '../../config/backendConfig.js';
import { createLocalNotesAdapter, localNotes } from '../localNotes.js';
import { loadNotesPage } from './notes.js';

const SEED = Object.freeze({ dataMode: 'seed' });
const MEM = new Map();
const comptes = { read: 0, mutate: 0 };
const MEMORIA = {
  async read(clau) { comptes.read++; return structuredClone(MEM.get(clau) || {}); },
  async mutate(clau, transforma) { comptes.mutate++; const valor = transforma(structuredClone(MEM.get(clau) || {})); MEM.set(clau, valor); return valor; }
};
const nota = (id) => ({ id, folderId: 'f-notes', title: id, content: '', revision: 0, estat: 'activa', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' });
const uuid = (i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;

function prepara(ids, owner = getDefaultUserId()) {
  MEM.clear();
  MEM.set(JSON.stringify([backendScope(SEED), owner]), Object.fromEntries(ids.map((id) => [id, nota(id)])));
  Object.assign(localNotes, createLocalNotesAdapter(MEMORIA));
  comptes.read = 0;
  comptes.mutate = 0;
}

async function recorre(owner, limit) {
  const vistos = [];
  let cursor = null;
  for (let pagines = 0; pagines < 50; pagines++) {
    const pagina = await loadNotesPage({ ownerUserId: owner, cursor, limit }, SEED);
    vistos.push(...pagina.notes.map((n) => n.id));
    cursor = pagina.nextCursor;
    if (!cursor) break;
  }
  return vistos;
}

beforeEach(() => { MEM.clear(); });

describe('F10 · el cursor i l’ordre, amb el mateix comparador', () => {
  test('amb ids de caixa mixta, cada nota ix una sola vegada i en ordre per unitat de codi', async () => {
    const ids = ['a1', 'B1', 'c1', 'D1', 'e1', 'F1'];
    prepara(ids);
    const vistos = (await recorre(getDefaultUserId(), 2)).filter((id) => ids.includes(id));
    expect(vistos).toEqual(['e1', 'c1', 'a1', 'F1', 'D1', 'B1']);
  });

  test('amb UUID, l’ordre de sempre (descendent) i el final confirmat', async () => {
    const ids = Array.from({ length: 7 }, (_, i) => uuid(i));
    prepara(ids);
    const vistos = (await recorre(getDefaultUserId(), 3)).filter((id) => ids.includes(id));
    expect(vistos).toEqual([...ids].reverse());
  });
});

describe('F9 · càrregues concurrents', () => {
  test('200 primeres pàgines alhora compartixen la lectura i totes reben la mateixa pàgina', async () => {
    prepara(Array.from({ length: 300 }, (_, i) => uuid(i)));
    const pagines = await Promise.all(Array.from({ length: 200 }, () => loadNotesPage({ ownerUserId: getDefaultUserId(), limit: 50 }, SEED)));
    /* Una lectura per a la purga de la paperera i una per a la càrrega. */
    expect(comptes.read).toBeLessThanOrEqual(2);
    const primera = pagines[0].notes.map((n) => n.id);
    expect(primera).toHaveLength(50);
    expect(pagines.every((p) => JSON.stringify(p.notes.map((n) => n.id)) === JSON.stringify(primera))).toBe(true);
    /* Cada pàgina és seua: tocar-ne una no toca les altres. */
    pagines[0].notes[0].title = 'tocada';
    expect(pagines[1].notes[0].title).not.toBe('tocada');
  });

  test('una escriptura talla la compartició: la càrrega següent ja veu la nota nova', async () => {
    prepara([uuid(1), uuid(2)]);
    /* REV-ESTRES-4 · La primera lectura fa la foto del magatzem i espera a la
       porta: la càrrega queda en vol mentre l'escriptura comença i acaba. Sense
       el tall, la càrrega de després rebria eixa foto, sense la nota nova. */
    const llegix = MEMORIA.read;
    let obri;
    const porta = new Promise((resol) => { obri = resol; });
    let primera = true;
    MEMORIA.read = async (clau) => {
      const foto = await llegix(clau);
      if (primera) { primera = false; await porta; }
      return foto;
    };
    try {
      const enVol = localNotes.load(getDefaultUserId(), SEED);
      await localNotes.create({ id: uuid(9), title: 'Nova' }, SEED);
      const despres = localNotes.load(getDefaultUserId(), SEED);
      obri();
      expect((await despres).notes.map((n) => n.id)).toContain(uuid(9));
      // La càrrega en vol és d'abans de l'escriptura: la finestra s'ha obert de veres.
      expect((await enVol).notes.map((n) => n.id)).not.toContain(uuid(9));
    } finally {
      MEMORIA.read = llegix;
    }
    const pagina = await loadNotesPage({ ownerUserId: getDefaultUserId(), limit: 50 }, SEED);
    // Les llavors (n1, n2) van davant; la nova és la primera de les seues.
    expect(pagina.notes.map((n) => n.id).filter((id) => id.startsWith('0000'))).toEqual([uuid(9), uuid(2), uuid(1)]);
  });

  test('una càrrega que comença a mitja escriptura no es compartix amb la de després', async () => {
    prepara([uuid(1)]);
    /* L'escriptura espera a la seua porta; mentrestant, una càrrega fa la foto
       d'abans i espera a la d'ella. El tall en acabar l'escriptura és el que
       impedix que la càrrega de després reba eixa foto. */
    const { read: llegix, mutate: muta } = MEMORIA;
    let obriEscriptura;
    let obriLectura;
    const portaEscriptura = new Promise((resol) => { obriEscriptura = resol; });
    const portaLectura = new Promise((resol) => { obriLectura = resol; });
    let primera = true;
    MEMORIA.mutate = async (clau, transforma) => { await portaEscriptura; return muta(clau, transforma); };
    MEMORIA.read = async (clau) => {
      const foto = await llegix(clau);
      if (primera) { primera = false; await portaLectura; }
      return foto;
    };
    try {
      const escriptura = localNotes.create({ id: uuid(9), title: 'Nova' }, SEED);
      const enMig = localNotes.load(getDefaultUserId(), SEED);
      obriEscriptura();
      await escriptura;
      const despres = localNotes.load(getDefaultUserId(), SEED);
      obriLectura();
      expect((await despres).notes.map((n) => n.id)).toContain(uuid(9));
      expect((await enMig).notes.map((n) => n.id)).not.toContain(uuid(9));
    } finally {
      Object.assign(MEMORIA, { read: llegix, mutate: muta });
    }
  });

  test('una lectura que falla no es queda en vol: la següent torna a llegir', async () => {
    prepara([uuid(1)]);
    const llegix = MEMORIA.read;
    MEMORIA.read = async () => { throw new Error('IndexedDB tancada'); };
    try {
      await expect(localNotes.load(getDefaultUserId(), SEED)).rejects.toThrow('IndexedDB tancada');
    } finally {
      MEMORIA.read = llegix;
    }
    const carrega = await localNotes.load(getDefaultUserId(), SEED);
    expect(carrega.notes.map((n) => n.id)).toContain(uuid(1));
  });
});
