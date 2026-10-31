/* IDEA-53 (pla 261029_1605, Bloc B) · La negreta a la bombolla: *text* i
   **text** (estil WhatsApp) es pinten amb <strong> de React, mai amb HTML
   cru, i poden portar enllaços dins (EnllacSegur continua igual). Tot el que
   no és una negreta (aritmètica, llistes, emoticones, asteriscs dins d'una
   adreça) es pinta exactament com abans (Llei del Píxel). «Copia el text»
   copia el text cru, amb els asteriscs. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { IAIA_ID } from '../../../data/identitatsSeed.js';
import Bombolla from './Bombolla.jsx';

vi.mock('../../../data/backendPort.js', async (original) => ({
  ...(await original()),
  teCapacitat: () => true,
  urlAdjuntXat: vi.fn(async (id) => `https://adjunts.invalid/${id}`)
}));

/* El navegador avisa que la caixa és a la vista tan bon punt s'observa. */
class SempreALaVista {
  constructor(callback) { this.callback = callback; }

  observe(node) { queueMicrotask(() => this.callback([{ isIntersecting: true, target: node }], this)); }

  unobserve() {}

  disconnect() {}
}

beforeEach(() => { vi.stubGlobal('IntersectionObserver', SempreALaVista); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const t = (_, alternativa) => alternativa;
const missatge = (extra) => ({ id: 'm-1', sender: 'other', author: 'Pep', usuariId: 'pep', creatAl: '2026-10-29T16:00:00Z', ...extra });
const pinta = (dades, opcions = {}) => render(
  <MemoryRouter>
    <ul><Bombolla missatge={missatge(dades)} locale="ca-ES" t={t} {...opcions} /></ul>
  </MemoryRouter>
);
const paragraf = (container) => container.querySelector('p.sdp-xat-bombolla__text');

test('*hola* món: un <strong> pur i la resta com sempre', () => {
  const { container } = pinta({ text: '*hola* món' });
  expect(paragraf(container).innerHTML).toBe('<strong><span>hola</span></strong><span> món</span>');
  expect(paragraf(container).textContent).toBe('hola món');
});

test('**hola**: un sol <strong>', () => {
  const { container } = pinta({ text: '**hola**' });
  const fortes = paragraf(container).querySelectorAll('strong');
  expect(fortes).toHaveLength(1);
  expect(fortes[0].textContent).toBe('hola');
});

test.each([
  '2 * 3 = 6', '2*3*4', 'a*b', '* element\n* element2', 'petons :*', 'hola ;*) i adéu ;*)', '*línia\nsegona*', '*hola *'
])('Llei del Píxel: %j es pinta com sempre', (text) => {
  const { container } = pinta({ text });
  expect(paragraf(container).innerHTML).toBe(`<span>${text}</span>`);
});

test('un enllaç dins d’una negreta: dins del <strong>, segur i sense els asteriscs', () => {
  const { container } = pinta({ text: '*Inscripcions: https://socdepoble.org*' });
  const enllac = paragraf(container).querySelector('strong a');
  expect(enllac).toBeTruthy();
  expect([enllac.getAttribute('href'), enllac.getAttribute('target'), enllac.getAttribute('rel')])
    .toEqual(['https://socdepoble.org/', '_blank', 'noopener noreferrer']);
  expect(paragraf(container).textContent).toBe('Inscripcions: https://socdepoble.org');
});

test('mai es busquen asteriscs dins d’una adreça', () => {
  const { container } = pinta({ text: 'Mira https://a.b/c?q=*x* ok' });
  expect(paragraf(container).querySelector('strong')).toBeNull();
  expect(paragraf(container).querySelector('a').getAttribute('href')).toBe('https://a.b/c?q=*x*');
});

/* Gauntlet del Bloc B (QA-B01) · Sense cap negreta oberta abans, l'asterisc
   del final és de l'adreça: l'href el conserva i no hi ha cap <strong>. */
test('QA-B01 · «?q=foo*» sense negreta oberta: l’href conserva l’asterisc', () => {
  const { container } = pinta({ text: 'Busca https://example.test/search?q=foo*' });
  expect(paragraf(container).querySelector('strong')).toBeNull();
  const enllac = paragraf(container).querySelector('a');
  expect([enllac.getAttribute('href'), enllac.textContent]).toEqual(['https://example.test/search?q=foo*', 'https://example.test/search?q=foo*']);
});

/* Gauntlet del Bloc B (QA-B02) · Les marques que emboliquen una adreça fan
   la negreta: l'enllaç va dins del <strong>, amb l'href net. */
test.each([
  ['**https://example.test/**', 'https://example.test/'],
  ['*https://example.test/*', 'https://example.test/'],
  ['**text https://example.test/ text**', 'text https://example.test/ text']
])('QA-B02 · %j: <strong> amb l’enllaç net dins', (text, visible) => {
  const { container } = pinta({ text });
  const fortes = paragraf(container).querySelectorAll('strong');
  expect(fortes).toHaveLength(1);
  const enllac = fortes[0].querySelector('a');
  expect([enllac.getAttribute('href'), enllac.getAttribute('rel')]).toEqual(['https://example.test/', 'noopener noreferrer']);
  expect(paragraf(container).textContent).toBe(visible);
});

test('XSS: l’HTML d’un altre dins d’una negreta és text', () => {
  const { container } = pinta({ text: '*<img src=x onerror=alert(1)>*' });
  expect(container.querySelector('img')).toBeNull();
  expect(paragraf(container).querySelector('strong').textContent).toBe('<img src=x onerror=alert(1)>');
});

test('àrab: <strong> i el paràgraf amb dir=auto', () => {
  const { container } = pinta({ text: '*مرحبا*' });
  expect(paragraf(container).getAttribute('dir')).toBe('auto');
  expect(paragraf(container).querySelector('strong').textContent).toBe('مرحبا');
  expect(paragraf(container).querySelector('strong').hasAttribute('dir')).toBe(false);
});

test('la IAIA: una negreta i una ruta de la Wiki, enllaç intern', () => {
  const { container } = pinta({ text: '*Mira* /wikidepoble?item=genoma', author: 'IAIA MarIA', usuariId: IAIA_ID, is_ai: true });
  expect(paragraf(container).querySelector('strong').textContent).toBe('Mira');
  expect(paragraf(container).querySelector('a').getAttribute('href')).toBe('/wikidepoble?item=genoma');
});

test('«Copia el text» copia el text cru, amb els asteriscs', () => {
  const onCopia = vi.fn();
  pinta({ text: '*hola* món' }, { onCopia });
  fireEvent.click(screen.getByRole('button', { name: 'Opcions del missatge' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Copia el text' }));
  expect(onCopia).toHaveBeenCalledWith('*hola* món');
});

test('el peu d’una foto també porta la negreta', async () => {
  const { container } = pinta({
    text: '*Foto* de la festa', tipus: 'imatge', estatEnviament: 'enviat', metadades: { adjunt: { id: '00000000-0000-4000-8000-000000000001' } }
  }, { configAdjunts: { dataMode: 'remote' }, usuariAdjunts: 'u-1' });
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  expect(paragraf(container).innerHTML).toBe('<strong><span>Foto</span></strong><span> de la festa</span>');
});
