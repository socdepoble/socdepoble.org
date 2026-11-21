/* P0-ANDROID-PUSH (v1.2.16) · B11c (costura C-1 del carril A) · L'etiqueta curta del xip del Mode Sènior,
   «Lletra gran», per a l'accés del Xat (XatSection.jsx, AccesAlXat), en les 5 llengües. Sense la prop,
   l'etiqueta de sempre (/el-meu-perfil, /control i L'Avisador no canvien). */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import ControlModeSenior from './ControlModeSenior.jsx';
import { TEXTOS_MODE_SENIOR } from '../../config/textosModeSenior.js';
import { delVal } from '../../config/storage.js';
import { SENIOR_KEY, reiniciaMemoriaSenior } from '../../config/theme.js';

const CURTES = { ca: 'Lletra gran', es: 'Letra grande', en: 'Large text', eu: 'Letra handia', gl: 'Letra grande' };

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delVal(SENIOR_KEY);
  reiniciaMemoriaSenior();
});

test.each(Object.entries(CURTES))('%s: amb etiquetaCurta, el xip diu «%s» i conserva la pastilla d’estat', (codi, curta) => {
  vi.stubGlobal('matchMedia', vi.fn((consulta) => ({ matches: false, media: consulta, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() })));
  expect(TEXTOS_MODE_SENIOR[codi].xipCurt).toBe(curta);
  render(<UIProvider externalConfig={{ language: codi }}><ControlModeSenior etiquetaCurta testId="curt" /></UIProvider>);
  const xip = screen.getByTestId('curt');
  expect(xip.querySelector('.sdp-mode-senior-xip__etiqueta').textContent).toBe(curta);
  expect(screen.getByRole('switch', { name: curta })).toBe(xip);
  expect(xip.querySelector('.sdp-mode-senior-xip__estat').textContent).toBe(TEXTOS_MODE_SENIOR[codi].inactiu);
});

test('sense etiquetaCurta, l’etiqueta llarga de sempre', () => {
  vi.stubGlobal('matchMedia', vi.fn((consulta) => ({ matches: false, media: consulta, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() })));
  render(<UIProvider externalConfig={{ language: 'ca' }}><ControlModeSenior /></UIProvider>);
  expect(screen.getByTestId('control-mode-senior').querySelector('.sdp-mode-senior-xip__etiqueta').textContent).toBe(TEXTOS_MODE_SENIOR.ca.xip);
});

test('cada llengua té una etiqueta curta no buida, més curta que la llarga', () => {
  for (const [codi, tx] of Object.entries(TEXTOS_MODE_SENIOR)) {
    expect(typeof tx.xipCurt, codi).toBe('string');
    expect(tx.xipCurt.trim().length, codi).toBeGreaterThan(0);
    expect(tx.xipCurt.length, codi).toBeLessThan(tx.xip.length);
  }
});
