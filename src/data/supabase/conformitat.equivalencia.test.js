/* T1 · D01 (assalt 261101) · Dos backends independents, les mateixes dades:
   l'adaptador Supabase en mode 'seed' i el segon adaptador
   (src/data/local/adaptadorLocal.js), també en 'seed', han de servir les
   mateixes lectures del poble pilot, sense sessió i sense xarxa. Viu ací i
   no a src/data/local/: E1 de tractor-enxufe només deixa importar
   l'adaptador Supabase des de src/data/supabase/.
   Es lleven les dates que cada magatzem posa en nàixer (created_at,
   updated_at, creat i modificat): són de rellotge, no del poble. La resta
   ha de ser idèntica. Les regles d'escriptura no es comparen ací: el local
   és més estricte a posta (administrar una organització o un agent per a
   desar-los) i té les seues proves (src/data/local/adaptadorLocal.test.js). */
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { esborraSessio } from '../identitat.js';
import { esperaLaIAIA, reiniciaLocalXat } from '../localXat.js';
import { ENTITATS_SEED, PERSONA_PILOT, IAIA_ID } from '../identitatsSeed.js';
import { creaAdaptadorLocal } from '../local/adaptadorLocal.js';
import * as supabase from './index.js';

/* El mateix magatzem de notes en memòria que conformitat.test.js: jsdom no té IndexedDB. */
vi.mock('../localNotes.js', async (original) => {
  const real = await original();
  const files = new Map();
  const memoria = {
    async read(clau) { return structuredClone(files.get(clau) || {}); },
    async mutate(clau, transforma) {
      const valor = transforma(structuredClone(files.get(clau)));
      files.set(clau, structuredClone(valor));
      return valor;
    }
  };
  return { ...real, localNotes: real.createLocalNotesAdapter(memoria) };
});

const xarxa = vi.fn(() => { throw new Error('XARXA_PROHIBIDA_A_L_EQUIVALENCIA'); });
const S = { ...supabase };
const CONFIG = Object.freeze({ dataMode: 'seed' });
let L;
beforeAll(() => {
  vi.stubGlobal('fetch', xarxa);
  esborraSessio({ abast: 'tot' });
  reiniciaLocalXat();
  L = creaAdaptadorLocal({ mode: 'seed' });
});
afterAll(async () => {
  await L.destroy();
  await esperaLaIAIA();
  reiniciaLocalXat();
  vi.unstubAllGlobals();
});

const DATES_DE_MAGATZEM = new Set(['created_at', 'updated_at', 'creat', 'modificat']);
/* Una còpia sense les dates de rellotge, a qualsevol fondària. */
const senseDates = (valor) => {
  if (Array.isArray(valor)) return valor.map(senseDates);
  if (valor === null || typeof valor !== 'object') return valor;
  return Object.fromEntries(Object.entries(valor).filter(([clau]) => !DATES_DE_MAGATZEM.has(clau)).map(([clau, v]) => [clau, senseDates(v)]));
};
const iguals = async (llegix) => {
  const [deSupabase, delLocal] = await Promise.all([llegix(S, CONFIG), llegix(L, {})]);
  expect(senseDates(delLocal)).toEqual(senseDates(deSupabase));
  return delLocal;
};

describe('equivalència de dades · Supabase en seed i l’adaptador local en seed', () => {
  test('el contingut base, el Mur i la Multimèdia', async () => {
    const owner = S.getDefaultUserId();
    expect(L.getDefaultUserId()).toBe(owner);
    const core = await iguals((a, c) => a.loadCoreContent(owner, c));
    expect(core.pages.length).toBeGreaterThan(0);
    await iguals((a, c) => a.loadMur(owner, c));
    await iguals((a, c) => a.loadMultimedia(owner, c));
  });

  test('el directori d’organitzacions i el perfil públic de cada entitat, de la persona pilot i de la IAIA', async () => {
    const directori = await iguals((a, c) => a.listPublicOrganizations({ limit: 500 }, c));
    expect(directori.length).toBeGreaterThan(0);
    const claus = [...ENTITATS_SEED.flatMap((entitat) => [entitat.id, entitat.slug]), PERSONA_PILOT.slug, ...PERSONA_PILOT.alies, IAIA_ID, 'cap-perfil'];
    for (const clau of claus) await iguals((a, c) => a.loadPerfilPublic(clau, c));
  });

  test('el Xat: el padró i les converses (id, tipus i títol: els missatges porten l’hora de la llavor)', async () => {
    await iguals((a, c) => a.carregaMembres('', c));
    const fils = await iguals(async (a, c) => (await a.loadFils(c)).map(({ id, tipus, titol, perDefecte }) => ({ id, tipus, titol, perDefecte: perDefecte ?? null })));
    expect(fils.length).toBeGreaterThan(0);
  });

  test('les notes de la llavor i les lectures buides sense sessió', async () => {
    const owner = S.getDefaultUserId();
    const notes = await iguals(async (a, c) => (await a.loadNotes(owner, c)).notes.map((nota) => nota.id));
    expect(notes.length).toBeGreaterThan(0);
    await iguals((a, c) => a.estatNormes(c));
    expect(await iguals((a, c) => a.listMyOrganizations(c))).toEqual([]);
    expect(await iguals((a, c) => a.elsMeusSeguiments(c))).toEqual([]);
    expect(await iguals((a, c) => a.llistaBloquejos(c))).toEqual([]);
    expect(await iguals((a, c) => a.listMyAgents(c))).toEqual([]);
  });

  test('cap petició de xarxa', () => {
    expect(xarxa).not.toHaveBeenCalled();
  });
});
