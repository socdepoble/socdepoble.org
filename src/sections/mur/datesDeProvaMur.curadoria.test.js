/* PRODUCCIO-02 (revisió R15b) · Build amb VITE_SDP_CURADORIA_CULTURAL=1 (després d'aplicar la migració 2611091500):
   La IAIA Sabuda torna a ser targeta del Mur i, en la demostració local, una de les tècniques, darrere de les
   Versions, amb la seua data de prova del 2 de setembre (P0-64). En remot conserva la creació real del 9-11.
   La bandera es fixa abans d'importar: TECNIQUES_DEL_MUR la llig en carregar el mòdul, com el literal del build. */
import { vi } from 'vitest';
vi.hoisted(() => { vi.stubEnv('VITE_SDP_CURADORIA_CULTURAL', '1'); });
import { expect, test } from 'vitest';
import { APP_SEED } from '../../data/appSeed.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { TECNIQUES_DEL_MUR, llavorAmbDatesDeProva } from './datesDeProvaMur.js';
import { esTargetaDelMur, momentDeLaTargeta, perMomentDescendent, targetesDeSistema } from './targetesMur.js';

test('amb la bandera, Nodrir és una tècnica del Mur amb la data de demostració, darrere de les Versions', () => {
  expect(import.meta.env.VITE_SDP_CURADORIA_CULTURAL).toBe('1');
  expect(esTargetaDelMur('la-iaia-sabuda')).toBe(true);
  expect(TECNIQUES_DEL_MUR.map(([coleccio, id, data]) => [coleccio, id, data])).toEqual([
    ['pages', 'versions', '2026-09-03T11:50:00+02:00'],
    ['pages', 'la-iaia-sabuda', '2026-09-02T10:00:00+02:00']
  ]);
  const demo = llavorAmbDatesDeProva(APP_SEED, new Date(2026, 10, 9, 14, 0));
  const targetes = targetesDeSistema(Object.fromEntries(demo.pages.map((pagina) => [pagina.id, pagina])), { nativa: false })
    .map((item) => ({ id: item.id, clau: `${item.type}-${item.id}`, moment: momentDeLaTargeta(item) }))
    .sort(perMomentDescendent)
    .map(({ id }) => id);
  expect(targetes).toContain('la-iaia-sabuda');
  expect(targetes.indexOf('la-iaia-sabuda')).toBe(targetes.indexOf('versions') + 1);
});

test('amb la bandera, en remot la targeta conserva la creació real del 9 de novembre', () => {
  const targeta = targetesDeSistema(PAGE_COPY, { nativa: false }).find((item) => item.id === 'la-iaia-sabuda');
  expect(targeta).toMatchObject({ created_at: '2026-11-09T14:40:43.030Z', mainHref: '/page/la-iaia-sabuda' });
  expect(APP_SEED.pages.find(({ id }) => id === 'la-iaia-sabuda').date).toBe('2026-11-09T14:40:43.030Z');
});
