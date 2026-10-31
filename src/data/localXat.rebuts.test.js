import { beforeEach, expect, test, vi } from 'vitest';

const estat = vi.hoisted(() => ({ llegit: false }));
vi.mock('./identitat.js', () => ({ usuariDeSessio: () => ({ id: 'jo-prova' }), getDefaultUserId: () => 'jo-prova' }));
vi.mock('./xatSeed.js', async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    construeixLlavorXat(jo) {
      const llavor = original.construeixLlavorXat(jo);
      const fil = llavor.fils.find(f => f.id === original.XAT_SEED_IDS.filGeneral);
      const participant = llavor.participants.find(p => p.filId === fil.id && p.usuariId === jo);
      participant.llegitFinsSeq = estat.llegit ? fil.ultimSeq : 0;
      participant.rebutFinsSeq = participant.llegitFinsSeq;
      participant.noLlegitManual = true;
      return llavor;
    }
  };
});
import { localXat, reiniciaLocalXat } from './localXat.js';
import { XAT_SEED_IDS } from './xatSeed.js';

const config = { dataMode: 'seed', tenantId: '00000000-0000-4000-8000-000000000000' };
beforeEach(() => reiniciaLocalXat());

test.each([false, true])('XC-05: l’entrega local conserva lectura i marca manual (ja llegit: %s)', async llegit => {
  estat.llegit = llegit;
  const abans = (await localXat.loadFils(config)).find(f => f.id === XAT_SEED_IDS.filGeneral);
  expect(abans.noLlegitManual).toBe(true);
  const rebut = await localXat.marcaLlegit(abans.id, { ...config, rebutFinsSeq: abans.ultimSeq, llegitFinsSeq: 0 });
  expect(rebut).toEqual({ llegitFinsSeq: abans.llegitFinsSeq, rebutFinsSeq: abans.ultimSeq });
  const despres = (await localXat.loadFils(config)).find(f => f.id === abans.id);
  expect(despres.noLlegitManual).toBe(true);
  expect(despres.noLlegits).toBe(abans.noLlegits);
  await localXat.marcaLlegit(abans.id, { ...config, llegitFinsSeq: abans.ultimSeq });
  expect((await localXat.loadFils(config)).find(f => f.id === abans.id).noLlegitManual).toBe(false);
});
