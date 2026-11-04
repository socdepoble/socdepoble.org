/* xat-ux-a11y-04 (T7a, 261104) · El menú «⋯» de la conversa declara
   role="menu": en obrir-lo, el focus entra a la primera opció (com al de la
   bombolla i al del +), les fletxes, Inici i Fi el mouen en cercle i queden
   consumides, i Tab tanca el menú i seguix des del «⋯». */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import CapcaleraConversa from './CapcaleraConversa.jsx';
import { _reiniciaPilaEnrere, capesEnrereObertes } from '../../../config/pilaEnrere.js';

const t = (_, alternativa) => alternativa;
afterEach(() => {
  cleanup();
  _reiniciaPilaEnrere();
});

const FIL_DIRECTE = { id: 'd-pepa', tipus: 'directe', name: 'Pepa', altres: [{ id: 'P', tipus: 'persona', nom: 'Pepa' }], altresNoms: ['Pepa'] };

function pinta() {
  const handlers = { onSeleccionar: vi.fn(), onDenunciaPersona: vi.fn(), onBloqueja: vi.fn() };
  render(
    <MemoryRouter>
      <CapcaleraConversa fil={FIL_DIRECTE} onTorna={vi.fn()} nomContrapart="Pepa" t={t} {...handlers} />
    </MemoryRouter>
  );
  return handlers;
}

const opcions = () => screen.getByRole('button', { name: 'Opcions de la conversa' });
const menu = () => screen.queryByRole('menu');
const fila = (nom) => screen.getByRole('menuitem', { name: nom });
const tecla = (key) => fireEvent.keyDown(document.activeElement, { key });

test('en obrir el menú, el focus entra a la primera opció', () => {
  pinta();
  opcions().focus();
  fireEvent.click(opcions());
  expect(document.activeElement).toBe(fila('Seleccionar missatges'));
});

test('les fletxes, Inici i Fi recorren les opcions en cercle i queden consumides', () => {
  pinta();
  fireEvent.click(opcions());
  expect(tecla('ArrowDown')).toBe(false);
  expect(document.activeElement).toBe(fila('Denuncia Pepa'));
  expect(tecla('End')).toBe(false);
  expect(document.activeElement).toBe(fila('Bloqueja Pepa'));
  expect(tecla('ArrowDown')).toBe(false);
  expect(document.activeElement).toBe(fila('Seleccionar missatges'));
  expect(tecla('ArrowUp')).toBe(false);
  expect(document.activeElement).toBe(fila('Bloqueja Pepa'));
  expect(tecla('Home')).toBe(false);
  expect(document.activeElement).toBe(fila('Seleccionar missatges'));
});

test('Tab tanca el menú, no es consumix i el focus seguix des del «⋯»', () => {
  pinta();
  fireEvent.click(opcions());
  tecla('End');
  expect(capesEnrereObertes()).toBe(1);
  expect(tecla('Tab')).toBe(true);
  expect(menu()).toBeNull();
  expect(document.activeElement).toBe(opcions());
  expect(capesEnrereObertes()).toBe(0);
});

test('tocar una altra opció amb el focus a la primera la tria (no es tanca abans del clic)', () => {
  const { onBloqueja } = pinta();
  fireEvent.click(opcions());
  expect(document.activeElement).toBe(fila('Seleccionar missatges'));
  fireEvent.pointerDown(fila('Bloqueja Pepa'));
  fireEvent.click(fila('Bloqueja Pepa'));
  expect(onBloqueja).toHaveBeenCalledWith(opcions());
  expect(menu()).toBeNull();
});
