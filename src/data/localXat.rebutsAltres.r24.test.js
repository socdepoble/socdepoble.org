/* R24 · xat_entrega (IDEA-260 b, P0-1) · Paritat del port local amb
   xat_fils_meus (20261114061000): la Conversa porta el rebut d'entrega de
   l'altre costat (rebutPelsAltresFinsSeq), del mateix costat que el llegit, i
   la interfície en deriva ✓✓ gris (lliurat) sense confondre'l amb el llegit. */
import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('./identitat.js', () => ({ usuariDeSessio: () => ({ id: 'jo-r24' }), getDefaultUserId: () => 'jo-r24' }));
vi.mock('./xatSeed.js', async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    construeixLlavorXat(jo) {
      const llavor = original.construeixLlavorXat(jo);
      const fil = llavor.fils.find(f => f.id === original.XAT_SEED_IDS.filGeneral);
      /* L'altre costat (l'entitat virtual) ha rebut fins a l'últim i n'ha llegit un menys. */
      for (const p of llavor.participants.filter(x => x.filId === fil.id && x.usuariId !== jo)) {
        p.rebutFinsSeq = fil.ultimSeq;
        p.llegitFinsSeq = fil.ultimSeq - 1;
      }
      return llavor;
    }
  };
});
import { localXat, reiniciaLocalXat } from './localXat.js';
import { XAT_SEED_IDS } from './xatSeed.js';
import { estatDeLUltim, mapejaFil } from '../sections/xat/missatges.js';

const config = { dataMode: 'seed', tenantId: '00000000-0000-4000-8000-000000000000' };
beforeEach(() => reiniciaLocalXat());
const general = async () => (await localXat.loadFils(config)).find(f => f.id === XAT_SEED_IDS.filGeneral);

test('la Conversa local porta el rebut dels altres, independent del llegit', async () => {
  const fil = await general();
  expect(fil.rebutPelsAltresFinsSeq).toBe(fil.ultimSeq);
  expect(fil.llegitPelsAltresFinsSeq).toBe(fil.ultimSeq - 1);
});

test('un missatge propi nou queda ✓ fins que l’altre costat el rep; el que ja va rebre és ✓✓ gris', async () => {
  const abans = await general();
  const enviat = await localXat.enviaMissatge(abans.id, { id: '24000000-0000-4000-8000-0000000000a1', text: 'Missatge sintètic R24' }, config);
  const despres = mapejaFil(await general());
  expect(despres.rebutsConeguts).toBe(true);
  expect(despres.rebutPelsAltresFinsSeq).toBe(abans.ultimSeq);
  expect(estatDeLUltim(despres, 'jo-r24')).toBe('enviat');
  expect(estatDeLUltim({ ...despres, ultimSeq: abans.ultimSeq }, 'jo-r24')).toBe('lliurat');
  expect(enviat.seq).toBe(abans.ultimSeq + 1);
});
