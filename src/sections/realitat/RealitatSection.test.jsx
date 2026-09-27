import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const magatzem = new Map();
vi.mock('../../config/storage.js', () => ({
  getVal: (clau, reserva) => (magatzem.has(clau) ? magatzem.get(clau) : reserva),
  setVal: (clau, valor) => { magatzem.set(clau, valor); }
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, reserva) => reserva }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ title, children }) => <section><p>{title}</p>{children}</section> }));
vi.mock('../profile/agentsSeed', () => ({
  AGENTS: [
    { id: 'iaia', name: 'IAIA MarIA', role: 'Matriarca', type: 'AI', avatar_url: '/a.png' },
    { id: 'javi', name: 'Mestre', role: 'Humà', type: 'MASTER', avatar_url: '/b.png' },
    { id: 'pep', name: 'Pep', role: 'Veí', type: 'HUMAN', avatar_url: '/c.png' }
  ]
}));

import RealitatSection from './RealitatSection.jsx';
import { EVENT_NIVELL_IAIA, esIaiaActiva } from './nivellIaia.js';

beforeEach(() => magatzem.clear());
afterEach(cleanup);

test('T31 · els nivells són un grup d’opcions de Pedra Seca i el triat es veu marcat', () => {
  render(<RealitatSection />);
  const radios = screen.getAllByRole('radio');
  expect(radios).toHaveLength(4);
  expect(screen.getByRole('radio', { name: /Nivell 1: Passiva/ }).checked).toBe(true);
  expect(document.querySelector('.realitat-btn')).toBeNull();
  expect(document.querySelector('.sdp-realitat fieldset.sdp-grup')).toBeTruthy();
});

test('T31 · el nivell 2 ensenya els acompanyants d’IA com a caselles, i el nivell es desa', () => {
  render(<RealitatSection />);
  expect(screen.queryByRole('checkbox')).toBeNull();
  fireEvent.click(screen.getByRole('radio', { name: /Nivell 2/ }));
  const caselles = screen.getAllByRole('checkbox');
  expect(caselles).toHaveLength(2);
  fireEvent.click(screen.getByRole('checkbox', { name: /IAIA MarIA/ }));
  expect(magatzem.get('socdepoble-iaia-level')).toBe('2');
  expect(magatzem.get('socdepoble-iaia-companions')).toEqual(['iaia']);
});

/* T30.2 · la barra negra sap el nivell per esdeveniment: activa a partir del 2. */
test('T30.2 · canviar de nivell anuncia l’esdeveniment i «activa» comença al nivell 2', () => {
  const rebuts = [];
  const escolta = (e) => rebuts.push(e.detail);
  window.addEventListener(EVENT_NIVELL_IAIA, escolta);
  render(<RealitatSection />);
  fireEvent.click(screen.getByRole('radio', { name: /Nivell 3/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Nivell 0/ }));
  window.removeEventListener(EVENT_NIVELL_IAIA, escolta);
  expect(rebuts).toEqual([1, 3, 0]);
  expect([0, 1, 2, 3].map(esIaiaActiva)).toEqual([false, false, true, true]);
});
