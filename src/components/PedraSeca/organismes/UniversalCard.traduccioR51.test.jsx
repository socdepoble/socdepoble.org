/* R51 (P0-46; auditoria R11, defensa en profunditat) · UniversalCard torna a
   comprovar el translation_mode que rep (`modeTraduccio`): amb un mode
   protegit ('curated_5_langs', 'none' o invàlid) no oferix Traduir encara que
   qui la pinta el demane (showTranslate), i el motor no rep cap crida. Sense
   la prop o amb 'on_the_fly', el Traduir de sempre, que passa el mode a
   tradueixTot. El transport lliure, com a UniversalCard.test.jsx (FEDI-11). */
import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), tradueixTot: null }));
vi.mock('../../../data/backendPort.js', async (importOriginal) => ({ ...(await importOriginal()), teCapacitat: () => false }));
/* tradueixTot de veres, espiat: es mira quin mode li arriba de la targeta. */
vi.mock('../../../data/traductor.js', async (importOriginal) => {
  const original = await importOriginal();
  mocks.tradueixTot = vi.fn((...args) => original.tradueixTot(...args));
  return { ...original, tradueixTot: mocks.tradueixTot };
});
vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...resta }) => React.createElement('a', { href: to, ...resta }, children)
}));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
import { UniversalCard } from './UniversalCard.jsx';
import { fixaCarregadorLliure, fixaTraductorLliure } from '../../../data/traductorDelLloc.js';

let motor;
beforeEach(() => {
  vi.clearAllMocks();
  motor = {
    disponible: true,
    comprovaPagina: vi.fn(),
    tradueix: vi.fn(async (textos, desti) => ({ traduccions: textos.map((text) => `[${desti}] ${text}`), desti, cache: false }))
  };
  fixaTraductorLliure('apertium');
  fixaCarregadorLliure(async () => ({ creaTraductorApertium: () => motor }));
});
afterEach(() => {
  cleanup();
  fixaTraductorLliure(null);
  fixaCarregadorLliure(null);
});

const pinta = (extra) => render(
  <UniversalCard title="Fira de l’Oli" subtitle="Tast popular" body="Diumenge al matí." hasFooter showTranslate {...extra} />
).container;
const botoTraduir = (arrel) => arrel.querySelector('[aria-label="Traduir Fira de l’Oli"]');

test.each([
  ['none', 'none'],
  ['la revisada', 'curated_5_langs'],
  ['un mode que no existix', 'auto']
])('amb %s, cap Traduir a la targeta encara que es demane showTranslate, i cap crida al motor', (_, modeTraduccio) => {
  const arrel = pinta({ modeTraduccio });
  expect(botoTraduir(arrel)).toBeNull();
  expect(arrel.querySelector('[role="menu"]')).toBeNull();
  // La resta del peu, igual.
  expect(arrel.querySelector('[aria-label="Compartir Fira de l’Oli"]')).toBeTruthy();
  expect(motor.tradueix).toHaveBeenCalledTimes(0);
  expect(motor.comprovaPagina).toHaveBeenCalledTimes(0);
});

test.each([
  ['sense la prop (el de sempre)', {}, undefined],
  ['amb l’automàtica', { modeTraduccio: 'on_the_fly' }, 'on_the_fly']
])('%s: Traduir obri el menú, traduïx la targeta i passa el mode al motor', async (_, extra, mode) => {
  const arrel = pinta(extra);
  act(() => { botoTraduir(arrel).click(); });
  const castella = [...arrel.querySelectorAll('[role="menuitemradio"]')].find((opcio) => opcio.textContent.includes('Castellà'));
  expect(castella).toBeTruthy();
  await act(async () => { castella.click(); });
  await waitFor(() => expect(arrel.querySelector('.sp-card-title').textContent).toBe('[ES] Fira de l’Oli'));
  expect(motor.tradueix).toHaveBeenCalled();
  const opcions = mocks.tradueixTot.mock.calls.at(-1)[3];
  expect(Object.hasOwn(opcions, 'translation_mode')).toBe(true);
  expect(opcions.translation_mode).toBe(mode);
});
