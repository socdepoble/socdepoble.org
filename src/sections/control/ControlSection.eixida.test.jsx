/* Ordre del Mestre 260930 (P2) + Reforma IDEA-341 (R32.63) · Al Panell de
   Control (/control) es retira l'antic botó públic «Eixir de poble» (l'eixida
   viu dins d'«El meu perfil › Eixir de poble» i d'«Ajustos del Xat») i la
   fila de filet pur «El meu perfil, contrasenya i dades a l'aparell» navega
   pel router intern a RUTA_COMPTE (/el-meu-perfil?vista=compte) sense fer cap
   window.location.reload() sobre la pàgina amfitriona de WordPress. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { TEXTOS_PEU_CONTROL } from './textosPeuControl.js';

vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, reserva) => reserva, resolveAsset: (valor) => valor, language: 'ca' }),
  useUIState: () => ({ externalConfig: { dataMode: 'seed' }, language: 'ca' }),
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children }) => <section>{children}</section>,
}));

import ControlSection from './ControlSection.jsx';

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}

let navegacions = [];
const escoltaJsdom = (error) => {
  if (/Not implemented: navigation/.test(String(error?.message))) navegacions.push(error.message);
};

beforeEach(() => {
  navegacions = [];
  window._virtualConsole?.on('jsdomError', escoltaJsdom);
});
afterEach(() => {
  cleanup();
  window._virtualConsole?.off('jsdomError', escoltaJsdom);
});

test('IDEA-341 · el Panell retira el botó públic «Eixir de poble» i les 3 files de Filet Pur naveguen pel router intern sense recarregar l’amfitrió', () => {
  expect(typeof window._virtualConsole?.on).toBe('function');
  render(
    <MemoryRouter rutaInicial="/control">
      <ControlSection />
      <Ubicacio />
    </MemoryRouter>,
  );

  expect(screen.queryByRole('button', { name: /Eixir de poble/ })).toBeNull();
  fireEvent.click(screen.getByRole('link', { name: TEXTOS_PEU_CONTROL.ca.perfilNom }));
  expect(screen.getByTestId('ubicacio').textContent).toBe('/el-meu-perfil?vista=compte');
  expect(navegacions).toEqual([]);
});
