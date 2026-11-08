/* R51 (P0-46; defensa en profunditat, troballa DQ-02) · La targeta del Mercat
   passa el translation_mode del producte a UniversalCard (`modeTraduccio`),
   com TargetaDelMur: la targeta el torna a comprovar i el motor
   (tradueixTot) el rep. Abans TargetaDelMercat només apagava el Traduir amb
   el pla (showTranslate i translate="no"): si eixa guarda de la vista fallava,
   UniversalCard oferia Traduir i tradueixTot rebia el text sense cap mode.
   Ací la regressió de la vista se simula (ofereixTraduir diu sempre que sí) i
   el Traduir d'un producte protegit continua sense eixir; amb l'automàtica,
   el motor rep el mode. El transport lliure, com a
   UniversalCard.traduccioR51.test.jsx. */
import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), tradueixTot: null, regressioDeLaVista: false }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({ ...(await importOriginal()), teCapacitat: () => false }));
/* tradueixTot de veres, espiat: es mira quin mode li arriba de la targeta. */
vi.mock('../../data/traductor.js', async (importOriginal) => {
  const original = await importOriginal();
  mocks.tradueixTot = vi.fn((...args) => original.tradueixTot(...args));
  return { ...original, tradueixTot: mocks.tradueixTot };
});
/* La regressió simulada de la guarda de la vista: el pla diu «traduïble» per a tot. */
vi.mock('../../components/universal/traduccio/planTraduccioPublicacio.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, ofereixTraduir: (pla) => mocks.regressioDeLaVista || original.ofereixTraduir(pla) };
});
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...resta }) => React.createElement('a', { href: to, ...resta }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, language: 'ca' }),
  useUIState: () => ({ externalConfig: {} })
}));
import { TargetaDelMercat } from './TargetaDelMercat.jsx';
import { fixaCarregadorLliure, fixaTraductorLliure } from '../../data/traductorDelLloc.js';

const CREAT = '2026-10-20T10:00:00.000Z';
const producte = (extra) => ({ id: 'm-mel', type: 'market', title: 'Mel de romer', subtitle: 'Pot de mig quilo', created_at: CREAT, ...extra });

let motor;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.regressioDeLaVista = false;
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

const pinta = (item) => render(<TargetaDelMercat item={item} />).container;
const botoTraduir = (arrel) => arrel.querySelector('[aria-label="Traduir Mel de romer"]');

test.each([
  ['none', { translation_mode: 'none', source_language: 'ca' }],
  ['la revisada', { translation_mode: 'curated_5_langs', source_language: 'ca' }],
  ['un mode que no existix', { translation_mode: 'auto', source_language: 'ca' }]
])('amb %s i la guarda de la vista caiguda, UniversalCard no oferix Traduir i el motor no rep cap crida', (_, extra) => {
  mocks.regressioDeLaVista = true;
  const arrel = pinta(producte(extra));
  expect(botoTraduir(arrel)).toBeNull();
  expect(arrel.querySelector('[aria-label="Compartir Mel de romer"]')).toBeTruthy();
  expect(motor.tradueix).toHaveBeenCalledTimes(0);
  expect(mocks.tradueixTot).toHaveBeenCalledTimes(0);
});

test('amb l’automàtica, Traduir traduïx el producte i passa el mode al motor (tradueixTot)', async () => {
  const arrel = pinta(producte({ translation_mode: 'on_the_fly', source_language: 'ca' }));
  act(() => { botoTraduir(arrel).click(); });
  const castella = [...arrel.querySelectorAll('[role="menuitemradio"]')].find((opcio) => opcio.textContent.includes('Castellà'));
  expect(castella).toBeTruthy();
  await act(async () => { castella.click(); });
  await waitFor(() => expect(arrel.querySelector('.sp-card-title').textContent).toBe('[ES] Mel de romer'));
  const opcions = mocks.tradueixTot.mock.calls.at(-1)[3];
  expect(opcions.translation_mode).toBe('on_the_fly');
});

test('sense mode, el Traduir de sempre i el motor no rep cap mode', async () => {
  const arrel = pinta(producte());
  act(() => { botoTraduir(arrel).click(); });
  const castella = [...arrel.querySelectorAll('[role="menuitemradio"]')].find((opcio) => opcio.textContent.includes('Castellà'));
  await act(async () => { castella.click(); });
  await waitFor(() => expect(arrel.querySelector('.sp-card-title').textContent).toBe('[ES] Mel de romer'));
  expect(mocks.tradueixTot.mock.calls.at(-1)[3].translation_mode).toBeUndefined();
});
