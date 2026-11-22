/* P0-ANDROID-PUSH (v1.2.16) · B11c (costura C-1 del carril A) · L'etiqueta curta del xip del Mode Sènior,
   «Lletra gran», per a l'accés del Xat (XatSection.jsx, AccesAlXat), en les 5 llengües. Sense la prop,
   l'etiqueta de sempre (/el-meu-perfil, /control i L'Avisador no canvien). */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import ControlModeSenior from './ControlModeSenior.jsx';
import { TEXTOS_MODE_SENIOR } from '../../config/textosModeSenior.js';
import { delVal, getVal, setVal } from '../../config/storage.js';
import { CONTRAST_KEY, SENIOR_KEY, reiniciaMemoriaSenior } from '../../config/theme.js';

/* IDEA-323.4 · DOL-31 (v1.2.22, ordre del Mestre del 261122) · Un sol «Mode Bancal»: els literals de l'ordre,
   el curt i el complet, en les cinc llengües. S'actualitza a posta (abans «Lletra gran» i «Mode Sènior · Lectura Gran»). */
const CURTES = { ca: 'Mode Bancal', es: 'Modo Bancal', en: 'Bancal Mode', eu: 'Bankal Modua', gl: 'Modo Bancal' };
const COMPLETES = {
  ca: 'Mode Bancal · Sol i Lletra Gran', es: 'Modo Bancal · Sol y Letra Grande', en: 'Bancal Mode · Sun & Large Text',
  eu: 'Bankal Modua · Eguzkia eta Letra Handia', gl: 'Modo Bancal · Sol e Letra Grande'
};
const ANTIGUES_CURTES = { ca: 'Lletra gran', es: 'Letra grande', en: 'Large text', eu: 'Letra handia', gl: 'Letra grande' };

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delVal(SENIOR_KEY);
  delVal(CONTRAST_KEY);
  reiniciaMemoriaSenior();
  document.documentElement.removeAttribute('data-sdp-senior');
  document.documentElement.removeAttribute('data-contrast');
});

/* v1.2.22 · Gauntlet R1 (L2-06) · L'encàrrec demana que el xip curt siga més curt o igual que l'antic en basc i en
   castellà; l'anglés en passa un caràcter («Bancal Mode», 11, contra «Large text», 10) i ho diu. La prova compta caràcters,
   no píxels: l'encaix a 320, 360, 390 i 414 px el mesura la sonda CDP (eines/cdp_v1222.mjs, escenaris «acces»). */
const TOLERANCIA_XIP_CURT = Object.freeze({ ca: 0, es: 0, en: 1, eu: 0, gl: 0 });
test.each(Object.entries(COMPLETES))('IDEA-323.4 · %s: el rètol complet és «%s», la descripció diu els 56 px i el ≥ 10:1, i el curt no passa l’antic més que la tolerància dita', (codi, complet) => {
  expect(TEXTOS_MODE_SENIOR[codi].xip).toBe(complet);
  expect(TEXTOS_MODE_SENIOR[codi].descripcio).toContain('56 px');
  expect(TEXTOS_MODE_SENIOR[codi].descripcio).toContain('≥ 10:1');
  expect(TEXTOS_MODE_SENIOR[codi].xipCurt.length).toBeLessThanOrEqual(ANTIGUES_CURTES[codi].length + TOLERANCIA_XIP_CURT[codi]);
});

test('IDEA-323.4 · el literal valencià de la descripció és el de l’ordre', () => {
  expect(TEXTOS_MODE_SENIOR.ca.descripcio).toBe('Lletra més gran, botons amples de 56 px i màxim contrast (≥ 10:1) per a llegir al sol o amb vista cansada.');
});

test('IDEA-323.4 · DOL-31 · fora d’UIProvider, un toc posa alhora la lletra gran i el contrast Bancal a l’arrel, i un altre els lleva', () => {
  vi.stubGlobal('matchMedia', vi.fn((consulta) => ({ matches: false, media: consulta, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() })));
  render(<ControlModeSenior etiquetaCurta testId="sol" />);
  const xip = screen.getByTestId('sol');
  const arrel = document.documentElement;
  fireEvent.click(xip);
  expect(arrel.getAttribute('data-sdp-senior')).toBe('true');
  expect(arrel.getAttribute('data-contrast')).toBe('bancal');
  expect(xip.getAttribute('aria-checked')).toBe('true');
  fireEvent.click(xip);
  expect(arrel.hasAttribute('data-sdp-senior')).toBe(false);
  expect(arrel.hasAttribute('data-contrast')).toBe(false);
  expect(xip.getAttribute('aria-checked')).toBe('false');
});

test('IDEA-323.4 · DOL-31 · fora d’UIProvider, un «Bancal» desat abans es mostra encés i en apagar torna a «Normal»', () => {
  vi.stubGlobal('matchMedia', vi.fn((consulta) => ({ matches: false, media: consulta, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() })));
  setVal(CONTRAST_KEY, 'bancal');
  render(<ControlModeSenior testId="vell" />);
  const xip = screen.getByTestId('vell');
  expect(xip.getAttribute('aria-checked')).toBe('true');
  fireEvent.click(xip);
  expect(getVal(CONTRAST_KEY)).toBe('normal');
  expect(document.documentElement.hasAttribute('data-contrast')).toBe(false);
  expect(xip.getAttribute('aria-checked')).toBe('false');
});

test.each(Object.entries(CURTES))('%s: amb etiquetaCurta (C-2), el xip diu «%s», usa glif compacte no-cromàtic i commuta ○ → ✓', (codi, curta) => {
  vi.stubGlobal('matchMedia', vi.fn((consulta) => ({ matches: false, media: consulta, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() })));
  expect(TEXTOS_MODE_SENIOR[codi].xipCurt).toBe(curta);
  render(<UIProvider externalConfig={{ language: codi }}><ControlModeSenior etiquetaCurta testId="curt" /></UIProvider>);
  const xip = screen.getByTestId('curt');
  expect(xip.classList.contains('sdp-mode-senior-xip--curt')).toBe(true);
  expect(xip.querySelector('.sdp-mode-senior-xip__etiqueta').textContent).toBe(curta);
  expect(screen.getByRole('switch', { name: curta })).toBe(xip);
  expect(xip.querySelector('.sdp-mode-senior-xip__estat--curt').textContent).toBe('○');
  fireEvent.click(xip);
  expect(xip.getAttribute('aria-checked')).toBe('true');
  expect(xip.querySelector('.sdp-mode-senior-xip__estat--curt').textContent).toBe('✓');
});

test('sense etiquetaCurta, conserva l’etiqueta llarga i la pastilla textual de sempre', () => {
  vi.stubGlobal('matchMedia', vi.fn((consulta) => ({ matches: false, media: consulta, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() })));
  render(<UIProvider externalConfig={{ language: 'ca' }}><ControlModeSenior /></UIProvider>);
  const xip = screen.getByTestId('control-mode-senior');
  expect(xip.classList.contains('sdp-mode-senior-xip--curt')).toBe(false);
  expect(xip.querySelector('.sdp-mode-senior-xip__etiqueta').textContent).toBe(TEXTOS_MODE_SENIOR.ca.xip);
  expect(xip.querySelector('.sdp-mode-senior-xip__estat').textContent).toBe(TEXTOS_MODE_SENIOR.ca.inactiu);
});

test('cada llengua té una etiqueta curta no buida, més curta que la llarga', () => {
  for (const [codi, tx] of Object.entries(TEXTOS_MODE_SENIOR)) {
    expect(typeof tx.xipCurt, codi).toBe('string');
    expect(tx.xipCurt.trim().length, codi).toBeGreaterThan(0);
    expect(tx.xipCurt.length, codi).toBeLessThan(tx.xip.length);
  }
});

/* v1.2.22 · Gauntlet R1 (L2-08) · Fora d'UIProvider, el contrast es reclama (reclamaAtribut): en apagar, l'element
   recupera el data-contrast que hi havia posat la pàgina amfitriona, no el lleva. */
test('IDEA-323.4 · fora d’UIProvider, apagar el Mode Bancal torna el data-contrast de l’amfitrió', () => {
  vi.stubGlobal('matchMedia', vi.fn((consulta) => ({ matches: false, media: consulta, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() })));
  const arrel = document.documentElement;
  arrel.setAttribute('data-contrast', 'alt-amfitrio');
  render(<ControlModeSenior etiquetaCurta testId="amfitrio" />);
  const xip = screen.getByTestId('amfitrio');
  fireEvent.click(xip);
  expect(arrel.getAttribute('data-contrast')).toBe('bancal');
  fireEvent.click(xip);
  expect(arrel.getAttribute('data-contrast')).toBe('alt-amfitrio');
});
