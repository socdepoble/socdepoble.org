/**
 * Higiene d'amfitrió (ordre del Mestre, 261004, front «amfitrio-admin») · La
 * preferència «Mostrar al Panell de Control» d'una utilitat (DetallAplicacio)
 * passa per storage.js: s'escriu amb el prefix de l'app, es llig també la
 * clau de llegat ('sdp_utilitats_actives') perquè ningú no perda la
 * configuració, i cap esdeveniment ix cap a window (dins de WordPress, el
 * 'storage' fals arribava a la pàgina de l'amfitrió amb key null).
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => () => {},
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, alternativa) => alternativa }) }));

import { DetallAplicacio } from './DetallEspai.jsx';
import { APLICACIONS, aplicacionsValides } from './aplicacions.js';
import { STORAGE_PREFIX } from '../../config/storage.js';
import { CLAU_UTILITATS_ACTIVES, CLAU_UTILITATS_LLEGAT } from './utilitatsActives.js';
import fontDetall from './DetallEspai.jsx?raw';

const CLAU_PROPIA = STORAGE_PREFIX + CLAU_UTILITATS_ACTIVES;
const [APLICACIO] = aplicacionsValides(APLICACIONS);
const MOSTRAR = 'Mostrar al Panell de Control';
const OCULTAR = 'Ocultar del Panell de Control';

const neteja = () => {
  localStorage.removeItem(CLAU_PROPIA);
  localStorage.removeItem(CLAU_UTILITATS_LLEGAT);
};
beforeEach(neteja);
afterEach(() => {
  cleanup();
  neteja();
  vi.restoreAllMocks();
});

describe('DetallAplicacio · la preferència del Panell, per storage.js', () => {
  test('mostrar-la escriu la clau amb prefix, conserva el llegat i no llança res a window', () => {
    localStorage.setItem(CLAU_UTILITATS_LLEGAT, JSON.stringify({ altra: false }));
    const aWindow = vi.spyOn(window, 'dispatchEvent');
    const oient = vi.fn();
    window.addEventListener('storage', oient);
    try {
      render(<DetallAplicacio aplicacio={APLICACIO} />);
      fireEvent.click(screen.getByRole('button', { name: MOSTRAR }));
      expect(screen.getByRole('button', { name: OCULTAR })).toBeTruthy();
      expect(JSON.parse(localStorage.getItem(CLAU_PROPIA))).toEqual({ altra: false, [APLICACIO.id]: true });
      // La clau de llegat no es toca: només es llig.
      expect(JSON.parse(localStorage.getItem(CLAU_UTILITATS_LLEGAT))).toEqual({ altra: false });
      expect(aWindow).not.toHaveBeenCalled();
      expect(oient).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('storage', oient);
    }
  });

  test('una utilitat activa a la clau de llegat es veu activa, i ocultar-la la desa amb prefix', () => {
    localStorage.setItem(CLAU_UTILITATS_LLEGAT, JSON.stringify({ [APLICACIO.id]: true }));
    render(<DetallAplicacio aplicacio={APLICACIO} />);
    fireEvent.click(screen.getByRole('button', { name: OCULTAR }));
    expect(screen.getByRole('button', { name: MOSTRAR })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(CLAU_PROPIA))).toEqual({ [APLICACIO.id]: false });
  });

  test('una preferència de llegat malmesa no trenca res: la utilitat es veu sense mostrar', () => {
    localStorage.setItem(CLAU_UTILITATS_LLEGAT, 'no és JSON');
    render(<DetallAplicacio aplicacio={APLICACIO} />);
    expect(screen.getByRole('button', { name: MOSTRAR })).toBeTruthy();
  });

  test('la font no toca localStorage ni llança esdeveniments a window', () => {
    // L'accés, no la paraula: el comentari de derogació la nomena.
    expect(fontDetall).not.toMatch(/localStorage\s*\.\s*(getItem|setItem|removeItem)/);
    expect(fontDetall).not.toMatch(/dispatchEvent\s*\(/);
  });
});
