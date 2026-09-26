import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ valor: null, setActor: vi.fn(() => true) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => m.valor }));
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SelectorIdentitat } from './SelectorIdentitat.jsx';

const cssPerfil = readFileSync(resolve(process.cwd(), 'src/sections/profile/PerfilShell.css'), 'utf8');

const persona = { tipus: 'persona', id: 'U', nom: 'Pep', avatar: null, rol: 'persona', activa: true };
const forn = { tipus: 'entitat', id: 'O', nom: 'Forn', avatar: null, rol: 'owner', activa: false };

beforeEach(() => {
  m.setActor.mockClear();
  m.valor = { identitats: [persona, forn], actor: { tipus: 'persona', id: 'U', nom: 'Pep' }, setActor: m.setActor };
});
afterEach(cleanup);

test('amb una sola identitat no pinta res', () => {
  m.valor = { ...m.valor, identitats: [persona] };
  const { container } = render(<SelectorIdentitat />);
  expect(container.innerHTML).toBe('');
});

test('el disparador no és un botó niat i té nom accessible complet', () => {
  const { container } = render(<SelectorIdentitat />);
  const disparador = screen.getByRole('button', { name: 'Canviar identitat. Ara actues com a Pep' });
  expect(disparador.tagName).toBe('DIV');
  expect(container.querySelector('[role="button"] button')).toBeNull();
});

test('triar «Forn» crida setActor amb la identitat d’entitat', () => {
  render(<SelectorIdentitat />);
  fireEvent.click(screen.getByRole('button', { name: /Canviar identitat/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Forn · Propietari' }));
  expect(m.setActor).toHaveBeenCalledWith('entitat', 'O');
});

test('el menú fa l’ample demanat (280px): una regla del Perfil llig --sdp-desplegable-ample', () => {
  const { container } = render(<SelectorIdentitat />);
  fireEvent.click(screen.getByRole('button', { name: /Canviar identitat/ }));
  const menu = container.querySelector('.xat-header-dropdown');
  expect(menu.style.getPropertyValue('--sdp-desplegable-ample')).toBe('280px');
  expect(menu.closest('.perfil-selector')).toBeTruthy();
  // Sense cap regla que llegisca la variable, el menú es queda en els 200px generals.
  expect(cssPerfil.replace(/\s+/g, ' ')).toContain('.perfil-selector .xat-header-dropdown { min-width: var(--sdp-desplegable-ample); }');
});

test('l’opció activa ho diu també al lector de pantalla', () => {
  render(<SelectorIdentitat />);
  fireEvent.click(screen.getByRole('button', { name: /Canviar identitat/ }));
  const activa = screen.getByRole('button', { name: 'Pep, identitat activa' });
  expect(activa.className).toContain('perfil-selector__opcio--activa');
  fireEvent.click(activa);
  expect(m.setActor).toHaveBeenCalledWith('persona', 'U');
});
