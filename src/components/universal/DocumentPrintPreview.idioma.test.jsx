/**
 * Gauntlet 261025_0545 (TE-08) · El paper diu en quina llengua és.
 *
 * buildPrintDocument escrivia sempre <html lang="ca">: una nota impresa amb
 * la interfície en anglés es partia i es llegia en veu alta com a català. Ara
 * el document porta la llengua de la interfície (el document no en té cap de
 * pròpia), i els dos textos fixos del paper (la reserva del títol i el rètol de
 * la portada) parlen eixa mateixa llengua. Sense llengua, el paper de sempre,
 * byte a byte.
 */
import '../../../tests/helpers/diccionaris.js';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import DocumentPrintPreview, { buildPrintDocument } from './DocumentPrintPreview.jsx';
import { UIProvider } from '../../app/contexts/UIContext';
import { LANGUAGE_STORAGE_KEY } from '../../config/i18n.js';
import { delVal } from '../../config/storage.js';
import EN from '../../config/idiomes/en.js';
import GL from '../../config/idiomes/gl.js';

/* El UIProvider de veres mira el tema del sistema (jsdom no porta matchMedia),
   i cap tria desada no ha de manar sobre la llengua de l'amfitrió. */
beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  delVal(LANGUAGE_STORAGE_KEY);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const DOC = { title: 'Carta al poble', subtitle: 'Esborrany', content: '<p>Cos</p>', copyright: 'CC BY-SA' };
const parseja = (html) => new DOMParser().parseFromString(html, 'text/html');

test('TE-08 · sense llengua, el paper de sempre: lang="ca", «Sense títol» i el rètol valencià', () => {
  const html = buildPrintDocument({ subtitle: 'Esborrany' }, true, 'Autora');
  expect(html.startsWith('<!doctype html><html lang="ca"><head>')).toBe(true);
  expect(html).toContain('<section class="cover"><p>Sóc de Poble · Edició personal</p><p class="cover-titol">Sense títol</p>');
  const paper = parseja(html);
  expect(paper.querySelector('h1').textContent).toBe('Sense títol');
  expect(paper.querySelector('.cover p').textContent).toBe('Sóc de Poble · Edició personal');
  /* Les crides de sempre (tres o quatre arguments) no canvien ni un byte. */
  expect(buildPrintDocument(DOC, true, 'Autora', 'Nota sense títol')).toBe(buildPrintDocument(DOC, true, 'Autora', 'Nota sense títol', {}));
});

test('TE-08 · la llengua demanada va al lang, i el rètol de la portada, el que se li passa', () => {
  const html = buildPrintDocument(DOC, true, 'Autora', undefined, { llengua: 'en', rotolPortada: 'Sóc de Poble · Personal edition' });
  expect(html.startsWith('<!doctype html><html lang="en"><head>')).toBe(true);
  expect(parseja(html).querySelector('.cover p').textContent).toBe('Sóc de Poble · Personal edition');
});

test('TE-08 · una llengua que no és un codi no escapa de l’atribut: es queda el valencià', () => {
  const html = buildPrintDocument(DOC, false, '', undefined, { llengua: 'en"><script>alert(1)</script>' });
  expect(html.startsWith('<!doctype html><html lang="ca"><head>')).toBe(true);
  expect(parseja(html).querySelector('script')).toBeNull();
});

const obri = (boto = 'Vista A4 / PDF') => {
  fireEvent.click(screen.getByRole('button', { name: boto }));
  return parseja(document.querySelector('iframe.sdp-print-preview').getAttribute('srcdoc'));
};

test('TE-08 · dins de l’app, el paper pren la llengua de la interfície', () => {
  render(<UIProvider externalConfig={{ language: 'en' }}><DocumentPrintPreview document={{ ...DOC, title: '' }} author="Autora" /></UIProvider>);
  const paper = obri('Crear portada');
  expect(paper.documentElement.getAttribute('lang')).toBe('en');
  expect(paper.querySelector('h1').textContent).toBe(EN['editor.impressio.senseTitol']);
  expect(paper.querySelector('.cover p').textContent).toBe(EN['editor.impressio.portada']);
});

test('TE-08 · la reserva del títol que passa qui crida (el Bloc de Notes) mana sobre la traduïda', () => {
  render(<UIProvider externalConfig={{ language: 'gl' }}><DocumentPrintPreview document={{ title: '' }} titolReserva="Nota sen título" /></UIProvider>);
  const paper = obri();
  expect(paper.documentElement.getAttribute('lang')).toBe('gl');
  expect(paper.querySelector('h1').textContent).toBe('Nota sen título');
  expect(GL['editor.impressio.senseTitol']).not.toBe('Nota sen título');
});

test('TE-08 · fora de l’app (sense UIProvider), el valencià de sempre', () => {
  render(<DocumentPrintPreview document={{ title: '' }} author="Autora" />);
  const paper = obri('Crear portada');
  expect(paper.documentElement.getAttribute('lang')).toBe('ca');
  expect(paper.querySelector('h1').textContent).toBe('Sense títol');
  expect(paper.querySelector('.cover p').textContent).toBe('Sóc de Poble · Edició personal');
});
