import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { validaBackendImplementation } from '../backendPort.js';
import { CASOS, contextDeConformitat, executaCas } from '../conformitat/kit.js';
import { reiniciaLocalXat } from '../localXat.js';
import * as supabase from './index.js';

/* Kit de conformitat del port (261006) passat a l'adaptador Supabase en mode
   'seed', sense xarxa. Viu ací i no a src/data/conformitat/: E1 de
   tractor-enxufe només deixa importar l'adaptador des de src/data/supabase/.
   El Bloc local desa a IndexedDB, que jsdom no té: el mateix adaptador local
   (createLocalNotesAdapter) amb un magatzem en memòria. La resta (localXat,
   localPerfils, la llavor) és la de producció. */
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

/* Cap petició de xarxa: el mode 'seed' no en fa cap, i ho comprovem. */
const xarxa = vi.fn(() => { throw new Error('XARXA_PROHIBIDA_A_LA_CONFORMITAT'); });
beforeAll(() => {
  vi.stubGlobal('fetch', xarxa);
  reiniciaLocalXat();
});
afterAll(() => {
  vi.unstubAllGlobals();
  reiniciaLocalXat();
});

/* L'spread fa falta: vitest pot exposar els exports del mòdul amb getters, i el
   port rebutja els accessors (index.test.js). */
const adaptador = { ...supabase };
/* En llavor, salut i xatDePagina només en validen la forma: el config va sense URL a posta (cap sonda). */
const ctx = contextDeConformitat({ config: { dataMode: 'seed' }, escriptures: true });
const resultats = new Map();

describe('conformitat del port · Supabase en mode seed', () => {
  test('el port l’accepta: nucli sencer i cap capacitat a mitges', () => {
    expect(() => validaBackendImplementation(adaptador)).not.toThrow();
  });

  /* En ordre: cada cas pot deixar al context el que necessita el següent. */
  for (const [index, c] of CASOS.entries()) {
    test(`${index + 1}. ${c.titol}`, async () => {
      const resultat = await executaCas(c, adaptador, ctx);
      resultats.set(index, resultat);
      expect(resultat.falles, resultat.falles.join(' · ')).toEqual([]);
      expect(resultat.estat).not.toBe('falla');
    });
  }

  test('només s’ometen les capacitats que Supabase no té', () => {
    const omesos = CASOS.map((c, index) => [c, resultats.get(index)])
      .filter(([, resultat]) => resultat?.estat === 'omés')
      .map(([c, resultat]) => `${c.metode}: ${resultat.motiu}`);
    expect(omesos).toEqual([]);
    expect(resultats.size).toBe(CASOS.length);
  });

  test('cap petició de xarxa en tota la passada', () => {
    expect(xarxa).not.toHaveBeenCalled();
  });
});
