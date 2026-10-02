/**
 * T1 (prompt comú 261002_0125) · «Els meus calendaris» amb fonts simulades:
 * un grup per compte, una casella per font amb el color del seu token, i el
 * botó que toca segons la fase (Connecta · Cancel·la · Desconnecta). El
 * panell no sap de Google: només avisa.
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { PanellFontsCalendari } from './PanellFontsCalendari.jsx';

const font = (id, nom, extra = {}) => ({ id, nom, colorToken: 'accio', activa: true, fase: 'inactiu', error: null, ...extra });
const compte = (clau, fase, fonts, extra = {}) => ({
  clau, etiqueta: clau || 'El teu compte de Google', proveidor: 'Google', fase, error: null, fonts, ...extra
});

function pinta(comptes) {
  const avisos = { onCommuta: vi.fn(), onConnecta: vi.fn(), onCancella: vi.fn(), onDesconnecta: vi.fn(), onReintenta: vi.fn() };
  render(<PanellFontsCalendari comptes={comptes} {...avisos} />);
  return avisos;
}
const grup = (etiqueta) => screen.getByRole('heading', { level: 4, name: etiqueta }).closest('section');

afterEach(cleanup);

test('el panell lateral es diu «Els meus calendaris», amb un grup per compte i cap h1', () => {
  pinta([
    compte('', 'desconnectat', [font('privat', 'El meu calendari')]),
    compte('calendari@example.org', 'connectat', [font('organitzacio', 'Organització', { colorToken: 'accent' })])
  ]);
  const panell = screen.getByRole('complementary', { name: 'Els meus calendaris' });
  expect(within(panell).getByRole('heading', { level: 3, name: 'Els meus calendaris' })).toBeTruthy();
  expect(within(panell).getAllByRole('heading', { level: 4 }).map((h) => h.textContent)).toEqual(['El teu compte de Google', 'calendari@example.org']);
  expect(document.querySelector('h1')).toBeNull();
});

test('una casella per font, amb el seu nom i la classe del seu token de color; clicar-la avisa', () => {
  const { onCommuta } = pinta([compte('', 'connectat', [
    font('privat', 'El meu calendari'),
    font('festes', 'Festes', { colorToken: 'exit', activa: false })
  ])]);
  const privat = screen.getByRole('checkbox', { name: 'El meu calendari' });
  const festes = screen.getByRole('checkbox', { name: 'Festes' });
  expect(privat.checked).toBe(true);
  expect(festes.checked).toBe(false);
  expect(privat.closest('label').className).toBe('sdp-calendari-fonts-panell__casella sdp-calendari-fonts-panell__casella--accio');
  expect(festes.closest('label').className).toBe('sdp-calendari-fonts-panell__casella sdp-calendari-fonts-panell__casella--exit');
  fireEvent.click(festes);
  expect(onCommuta).toHaveBeenCalledWith('festes');
});

test('un token de color desconegut cau al d’acció: mai una classe construïda', () => {
  pinta([compte('', 'connectat', [font('privat', 'El meu calendari', { colorToken: 'fucsia' })])]);
  expect(screen.getByRole('checkbox', { name: 'El meu calendari' }).closest('label').className).toMatch(/--accio$/);
});

test('desconnectat: «Sense connectar.» i «Connecta amb Google», que avisa amb la clau del compte', () => {
  const { onConnecta } = pinta([compte('calendari@example.org', 'desconnectat', [font('organitzacio', 'Organització')])]);
  const seu = grup('calendari@example.org');
  expect(within(seu).getByRole('status').textContent).toBe('Sense connectar.');
  fireEvent.click(within(seu).getByRole('button', { name: 'Connecta amb Google' }));
  expect(onConnecta).toHaveBeenCalledWith('calendari@example.org');
  expect(within(seu).queryByRole('button', { name: 'Desconnecta' })).toBeNull();
});

test('desconnectat amb error: el diu en lloc de «Sense connectar.»', () => {
  pinta([compte('', 'desconnectat', [font('privat', 'El meu calendari')], {
    error: { tipus: 'TOKEN_CADUCAT', missatge: 'La connexió ha caducat: torna a connectar el compte.' }
  })]);
  const estat = screen.getByText('La connexió ha caducat: torna a connectar el compte.');
  expect(estat.getAttribute('role')).toBe('status');
  expect(estat.className).toMatch(/__estat--error/);
  expect(screen.getByRole('button', { name: 'Connecta amb Google' })).toBeTruthy();
});

test('connectant: es pot cancel·lar', () => {
  const { onCancella } = pinta([compte('', 'connectant', [font('privat', 'El meu calendari')])]);
  expect(screen.getByText('Esperant la finestra d’autorització…')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
  expect(onCancella).toHaveBeenCalledWith('');
  expect(screen.queryByRole('button', { name: 'Connecta amb Google' })).toBeNull();
});

test('connectat: «Desconnecta», i l’estat de cada font (carregant, sense accés, o un error que es pot tornar a provar)', () => {
  const { onDesconnecta, onReintenta } = pinta([compte('', 'connectat', [
    font('privat', 'El meu calendari', { fase: 'carregant' }),
    font('organitzacio', 'Organització', { fase: 'error', error: { tipus: 'SENSE_ACCES', missatge: 'Este compte no pot llegir este calendari.' } }),
    font('festes', 'Festes', { fase: 'error', error: { tipus: 'XARXA', missatge: 'Ara mateix no podem consultar este calendari.' } })
  ])]);
  expect(screen.getByText('Connectat. Només es llig: no s’hi escriu res.')).toBeTruthy();
  expect(screen.getByText('Carregant…')).toBeTruthy();
  const senseAcces = screen.getByText('Este compte no pot llegir este calendari.');
  expect(within(senseAcces).queryByRole('button')).toBeNull();
  const xarxa = screen.getByText(/Ara mateix no podem consultar este calendari\./);
  fireEvent.click(within(xarxa).getByRole('button', { name: 'Torna a provar' }));
  expect(onReintenta).toHaveBeenCalledWith('festes');
  fireEvent.click(screen.getByRole('button', { name: 'Desconnecta' }));
  expect(onDesconnecta).toHaveBeenCalledWith('');
});

test('els botons de compte es descriuen amb el nom del compte (dos «Connecta» no es confonen)', () => {
  pinta([
    compte('', 'desconnectat', [font('privat', 'El meu calendari')]),
    compte('calendari@example.org', 'desconnectat', [font('organitzacio', 'Organització')])
  ]);
  const botons = screen.getAllByRole('button', { name: 'Connecta amb Google' });
  expect(botons.map((boto) => document.getElementById(boto.getAttribute('aria-describedby')).textContent))
    .toEqual(['El teu compte de Google', 'calendari@example.org']);
});
