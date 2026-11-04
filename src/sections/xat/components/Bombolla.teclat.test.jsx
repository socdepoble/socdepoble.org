/* xat-ux-a11y-04 (T7a, 261104) · El menú «⋯» del missatge declara
   role="menu": el teclat és el del patró de menú de l'APG, com el menú del +
   del Compositor (P1-66, alTeclatDelMenu). Les fletxes, Inici i Fi mouen el
   focus entre les opcions en cercle i queden consumides; Tab tanca el menú i
   seguix des del «⋯» (mai amb un focusout: a Safari i al WKWebView d'iOS el
   botó no pren el focus en tocar-lo i el menú es tancaria abans del clic). */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import Bombolla from './Bombolla.jsx';
import { _reiniciaPilaEnrere, capesEnrereObertes } from '../../../config/pilaEnrere.js';

const t = (_, alternativa) => alternativa;
afterEach(() => {
  cleanup();
  _reiniciaPilaEnrere();
});

const MISSATGE = { id: 'm-1', sender: 'other', author: 'Pep', usuariId: 'pep', text: 'Bon dia', creatAl: '2026-11-02T08:00:00Z', estatEnviament: 'enviat' };

function pinta(props = {}) {
  const handlers = { onRespon: vi.fn(), onCopia: vi.fn(), onDenuncia: vi.fn(), onBloqueja: vi.fn() };
  render(
    <MemoryRouter>
      <ul><Bombolla missatge={MISSATGE} locale="ca-ES" t={t} nomAutor="Pep" {...handlers} {...props} /></ul>
    </MemoryRouter>
  );
  return handlers;
}

const opcions = () => within(document.body).getByRole('button', { name: 'Opcions del missatge' });
const menu = () => screen.queryByRole('menu');
const fila = (nom) => screen.getByRole('menuitem', { name: nom });
const tecla = (key) => fireEvent.keyDown(document.activeElement, { key });

test('les fletxes, Inici i Fi recorren les opcions en cercle i queden consumides', () => {
  pinta();
  fireEvent.click(opcions());
  expect(document.activeElement).toBe(fila('Respon'));
  expect(tecla('ArrowDown')).toBe(false);
  expect(document.activeElement).toBe(fila('Copia el text'));
  expect(tecla('End')).toBe(false);
  expect(document.activeElement).toBe(fila('Bloqueja Pep'));
  expect(tecla('ArrowDown')).toBe(false);
  expect(document.activeElement).toBe(fila('Respon'));
  expect(tecla('ArrowUp')).toBe(false);
  expect(document.activeElement).toBe(fila('Bloqueja Pep'));
  expect(tecla('Home')).toBe(false);
  expect(document.activeElement).toBe(fila('Respon'));
  /* Una altra tecla no és del menú. */
  expect(tecla('a')).toBe(true);
  expect(document.activeElement).toBe(fila('Respon'));
});

test('Tab tanca el menú, no es consumix i el focus seguix des del «⋯»', () => {
  pinta();
  fireEvent.click(opcions());
  tecla('ArrowDown');
  expect(capesEnrereObertes()).toBe(1);
  expect(tecla('Tab')).toBe(true);
  expect(menu()).toBeNull();
  expect(document.activeElement).toBe(opcions());
  expect(capesEnrereObertes()).toBe(0);
});

test('tocar una altra opció amb el focus a la primera la tria (no es tanca abans del clic)', () => {
  const { onCopia } = pinta();
  fireEvent.click(opcions());
  expect(document.activeElement).toBe(fila('Respon'));
  fireEvent.pointerDown(fila('Copia el text'));
  fireEvent.click(fila('Copia el text'));
  expect(onCopia).toHaveBeenCalledWith('Bon dia');
  expect(menu()).toBeNull();
});
