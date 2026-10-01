import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const magatzem = new Map();
vi.mock('../../config/storage.js', () => ({
  getVal: (clau, reserva) => (magatzem.has(clau) ? magatzem.get(clau) : reserva),
  setVal: (clau, valor) => { magatzem.set(clau, valor); }
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, reserva) => reserva }) }));
/* Avatar resol els recursos propis amb resolRecursPropi (T5, 261001): el mock
   també l'ha de portar, identitat com resolveAsset. */
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri, resolRecursPropi: (valor) => valor }));
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

/* T44 · el nom accessible ara el compon aria-labelledby (antetítol + títol):
   la comparació exacta garantix que ni la descripció ni la insígnia s'hi escolen. */
test('T31 · els nivells són un grup d’opcions de Pedra Seca i el triat es veu marcat', () => {
  render(<RealitatSection />);
  const radios = screen.getAllByRole('radio');
  expect(radios).toHaveLength(4);
  expect(screen.getByRole('radio', { name: 'Nivell 1 Passiva' }).checked).toBe(true);
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

test('T44 · els nivells són targetes amb descripció i efecte real sobre la IAIA', () => {
  render(<RealitatSection />);
  expect(document.querySelector('.sdp-realitat fieldset.sdp-grup--targetes')).toBeTruthy();
  expect(document.querySelectorAll('.sdp-realitat .sdp-targeta-opcio')).toHaveLength(4);
  expect(screen.getByRole('radio', { name: 'Nivell 2 Interactiva', description: /acompanyants.*s'activa/ })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Nivell 0 Apagada', description: /reposa/ })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Nivell 1 Passiva', description: /reposa/ })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Nivell 3 Connexió total', description: /s'activa/ })).toBeTruthy();
  expect(document.querySelector('.sdp-realitat')?.textContent).not.toContain('de el Mas');
});

test('T44 · la triada es llig sense color: una sola insígnia «Nivell actual», dins de la targeta marcada', () => {
  render(<RealitatSection />);
  const insignies = screen.getAllByText('Nivell actual');
  expect(insignies).toHaveLength(1);
  const targeta = insignies[0].closest('.sdp-targeta-opcio');
  expect(targeta.querySelector('input[type="radio"]').checked).toBe(true);
  expect(targeta.querySelector('input[type="radio"]').value).toBe('1');

  fireEvent.click(screen.getByRole('radio', { name: 'Nivell 3 Connexió total' }));
  const despres = screen.getAllByText('Nivell actual');
  expect(despres).toHaveLength(1);
  expect(despres[0].closest('.sdp-targeta-opcio').querySelector('input').value).toBe('3');
});

test('T44 · el tauler d’estat seguix la IAIA de la barra negra (T30)', () => {
  render(<RealitatSection />);
  const iaia = document.querySelector('.sdp-realitat__iaia');
  expect(iaia.getAttribute('aria-hidden')).toBe('true');
  expect(iaia.classList.contains('sdp-realitat__iaia--activa')).toBe(false);
  expect(screen.getByText('Ara: nivell 1 · Passiva')).toBeTruthy();
  expect(screen.getByText(/en repòs/)).toBeTruthy();

  fireEvent.click(screen.getByRole('radio', { name: 'Nivell 2 Interactiva' }));
  expect(document.querySelector('.sdp-realitat__iaia').classList.contains('sdp-realitat__iaia--activa')).toBe(true);
  expect(screen.getByText('Ara: nivell 2 · Interactiva')).toBeTruthy();
  expect(screen.getByText(/està activa/)).toBeTruthy();
});

/* Amb prefers-reduced-motion la IAIA de la barra negra no canvia d'aspecte
   (layout.css només anima el fons): cap text no pot prometre moviment. */
test('T44 · els textos sobre la barra negra són certs també amb moviment reduït', () => {
  render(<RealitatSection />);
  for (const nivell of ['Nivell 0 Apagada', 'Nivell 1 Passiva', 'Nivell 2 Interactiva', 'Nivell 3 Connexió total']) {
    fireEvent.click(screen.getByRole('radio', { name: nivell }));
    const text = document.querySelector('.sdp-realitat').textContent;
    expect(text).not.toMatch(/respira|es mou|batega|s'anima/);
  }
  expect(screen.getByText("La IA està activa: la IAIA de la barra negra s'activa amb ella.")).toBeTruthy();
  fireEvent.click(screen.getByRole('radio', { name: 'Nivell 0 Apagada' }));
  expect(screen.getByText('La IA està en repòs: la IAIA de la barra negra reposa.')).toBeTruthy();
});

test('T44 · la targeta d’acompanyant marca la triada amb una classe (sense :has())', () => {
  render(<RealitatSection />);
  fireEvent.click(screen.getByRole('radio', { name: 'Nivell 2 Interactiva' }));
  const casella = screen.getByRole('checkbox', { name: /IAIA MarIA/ });
  const targeta = casella.closest('.sdp-casella');
  expect(targeta.classList.contains('sdp-realitat__company')).toBe(true);
  expect(targeta.classList.contains('sdp-realitat__company--triat')).toBe(false);
  fireEvent.click(casella);
  expect(screen.getByRole('checkbox', { name: /IAIA MarIA/ }).closest('.sdp-casella').classList.contains('sdp-realitat__company--triat')).toBe(true);
  /* L'avatar va amb alt="" i sense title: el nom no es duplica. */
  expect(targeta.querySelector('.sdp-avatar').getAttribute('title')).toBeNull();
  const grup = screen.getByRole('group', { name: 'Tria els teus acompanyants' });
  const idAjuda = grup.getAttribute('aria-describedby');
  expect(document.getElementById(idAjuda).textContent).toBe('Marca amb quins acompanyants vols conversar.');
});

test('T44 · el nivell 3 no demana triar: avatars de tots i el text de la connexió', () => {
  render(<RealitatSection />);
  fireEvent.click(screen.getByRole('radio', { name: 'Nivell 3 Connexió total' }));
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(screen.getByText(/t'acompanyen tots alhora: IAIA MarIA i Mestre\./)).toBeTruthy();
  expect(document.querySelectorAll('.sdp-realitat__connexio .sdp-avatar-grup .sdp-avatar')).toHaveLength(2);
});

test('T44 · un nivell desat fora de rang torna a Passiva', () => {
  magatzem.set('socdepoble-iaia-level', '7');
  render(<RealitatSection />);
  expect(screen.getByRole('radio', { name: 'Nivell 1 Passiva' }).checked).toBe(true);
  expect(magatzem.get('socdepoble-iaia-level')).toBe('1');
});
