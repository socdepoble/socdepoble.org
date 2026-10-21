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
/* Gauntlet 261016 (Bloc 3) · El catàleg ve de la capa de dades: es falseja
   només AGENTS, i tipusDAgent és el de veres (la font única del vocabulari).
   Un de cada tipus: la IA i el personatge ANIMAL són acompanyants; la
   persona, l'entitat, un tipus fora del catàleg i l'antic MASTER, no. */
vi.mock('../../data/agentsSeed.js', async (importOriginal) => ({
  ...(await importOriginal()),
  AGENTS: [
    { id: 'iaia', name: 'IAIA MarIA', role: 'Matriarca', type: 'AI', avatar_url: '/a.png' },
    { id: 'gall', name: 'El Gall', role: 'Meteo', type: 'ANIMAL', avatar_url: '/b.png' },
    { id: 'javi', name: 'Javi Llinares', role: 'Coordinador', type: 'PERSON', avatar_url: '/c.png' },
    { id: 'socdepoble', name: 'Sóc de Poble', role: 'Empresa', type: 'COMPANY', avatar_url: '/d.png' },
    { id: 'pep', name: 'Pep', role: 'Veí', type: 'HUMAN', avatar_url: '/e.png' },
    { id: 'antic', name: 'Tipus antic', role: '—', type: 'MASTER', avatar_url: '/f.png' }
  ]
}));

import SelectorRealitat from './SelectorRealitat.jsx';
import { EVENT_NIVELL_IAIA, esIaiaActiva } from './nivellIaia.js';

beforeEach(() => magatzem.clear());
afterEach(cleanup);

/* T44 · el nom accessible ara el compon aria-labelledby (antetítol + títol):
   la comparació exacta garantix que ni la descripció ni la insígnia s'hi escolen. */
test('T31 · els nivells són un grup d’opcions de Pedra Seca i el triat es veu marcat', () => {
  render(<SelectorRealitat />);
  const radios = screen.getAllByRole('radio');
  expect(radios).toHaveLength(4);
  expect(screen.getByRole('radio', { name: 'Nivell 1 Passiva' }).checked).toBe(true);
  expect(document.querySelector('.realitat-btn')).toBeNull();
  expect(document.querySelector('.sdp-realitat fieldset.sdp-grup')).toBeTruthy();
});

test('T31 · el nivell 2 ensenya els acompanyants d’IA com a caselles, i el nivell es desa', () => {
  render(<SelectorRealitat />);
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
  render(<SelectorRealitat />);
  fireEvent.click(screen.getByRole('radio', { name: /Nivell 3/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Nivell 0/ }));
  window.removeEventListener(EVENT_NIVELL_IAIA, escolta);
  expect(rebuts).toEqual([1, 3, 0]);
  expect([0, 1, 2, 3].map(esIaiaActiva)).toEqual([false, false, true, true]);
});

test('T44 · els nivells són targetes amb descripció i efecte real sobre la IAIA', () => {
  render(<SelectorRealitat />);
  expect(document.querySelector('.sdp-realitat fieldset.sdp-grup--targetes')).toBeTruthy();
  expect(document.querySelectorAll('.sdp-realitat .sdp-targeta-opcio')).toHaveLength(4);
  expect(screen.getByRole('radio', { name: 'Nivell 2 Interactiva', description: /acompanyants.*s'activa/ })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Nivell 0 Apagada', description: /reposa/ })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Nivell 1 Passiva', description: /reposa/ })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Nivell 3 Connexió total', description: /s'activa/ })).toBeTruthy();
  expect(document.querySelector('.sdp-realitat')?.textContent).not.toContain('de el Mas');
});

test('T44 · la triada es llig sense color: una sola insígnia «Nivell actual», dins de la targeta marcada', () => {
  render(<SelectorRealitat />);
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
  render(<SelectorRealitat />);
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
  render(<SelectorRealitat />);
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
  render(<SelectorRealitat />);
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

/* Gauntlet 261016 (Bloc 3) · Actualitzada a posta: abans hi entrava l'agent de
   tipus MASTER («Mestre»), que no existix al catàleg, i en quedava fora el
   personatge ANIMAL. Ara són la IA i El Gall. */
test('T44 · el nivell 3 no demana triar: avatars de tots i el text de la connexió', () => {
  render(<SelectorRealitat />);
  fireEvent.click(screen.getByRole('radio', { name: 'Nivell 3 Connexió total' }));
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(screen.getByText(/t'acompanyen tots alhora: IAIA MarIA i El Gall\./)).toBeTruthy();
  expect(document.querySelectorAll('.sdp-realitat__connexio .sdp-avatar-grup .sdp-avatar')).toHaveLength(2);
});

/* Gauntlet 261016 (Bloc 3; ordre del Mestre: els personatges ANIMAL del
   catàleg són IA) · Els acompanyants els tria tipusDAgent: la IA i el
   personatge ANIMAL hi són; la persona, l'entitat, un tipus fora del catàleg
   i l'antic MASTER, no. */
test('Gauntlet 261016 · acompanyants: la IA i el personatge ANIMAL, mai una persona, una entitat ni un tipus desconegut', () => {
  render(<SelectorRealitat />);
  fireEvent.click(screen.getByRole('radio', { name: 'Nivell 2 Interactiva' }));
  const noms = screen.getAllByRole('checkbox').map((casella) => casella.closest('.sdp-casella').querySelector('.sdp-realitat__company-nom').textContent);
  expect(noms).toEqual(['IAIA MarIA', 'El Gall']);
  fireEvent.click(screen.getByRole('checkbox', { name: /El Gall/ }));
  expect(magatzem.get('socdepoble-iaia-companions')).toEqual(['gall']);
});

/* El cas MASTER s'ha tret perquè el catàleg de veres no en porta cap: el seu
   vocabulari és el de tipusDAgent (PERSON, AI, ANIMAL i COMPANY), i hi
   entren com a acompanyants totes les IA i els quatre personatges ANIMAL. */
test('Gauntlet 261016 · el catàleg de veres no porta cap tipus MASTER, i els seus ANIMAL són acompanyants', async () => {
  const cataleg = await vi.importActual('../../data/agentsSeed.js');
  expect(cataleg.AGENTS.filter((agent) => agent.type === 'MASTER')).toEqual([]);
  expect(new Set(cataleg.AGENTS.map((agent) => agent.type))).toEqual(new Set(['COMPANY', 'PERSON', 'AI', 'ANIMAL']));
  const acompanyants = cataleg.AGENTS.filter((agent) => cataleg.tipusDAgent(agent) === 'ia');
  expect(acompanyants.filter((agent) => agent.type === 'ANIMAL').map((agent) => agent.name))
    .toEqual(['Marc (El Gall)', 'Súper Ratolí', 'La Mixa', 'Sultan']);
  expect(acompanyants.every((agent) => agent.type === 'AI' || agent.type === 'ANIMAL')).toBe(true);
});

/* Ordre del Mestre (261021, prompt 261021_0015, tasca 7) · El selector ja no
   és una pàgina: és un bloc de /iaia que obri amb el seu H3 i la seua
   entradeta, sense cap UniversalPage pròpia (cap H1 ni H2) i sense regió viva
   (la fitxa ja porta el seu role="status" únic). */
test('261021 · és un bloc: H3 i entradeta, sense pàgina pròpia ni regió viva', () => {
  const { container } = render(<SelectorRealitat />);
  expect(screen.getByRole('heading', { level: 3, name: "Tu decidixes quanta intel·ligència artificial t'acompanya" })).toBeTruthy();
  expect(container.querySelectorAll('h1, h2')).toHaveLength(0);
  expect(screen.getByText(/La tria es guarda només en este navegador/)).toBeTruthy();
  expect(container.querySelector('[role="status"], [aria-live]')).toBeNull();
  expect(container.firstElementChild.tagName).toBe('H3');
});

test('T44 · un nivell desat fora de rang torna a Passiva', () => {
  magatzem.set('socdepoble-iaia-level', '7');
  render(<SelectorRealitat />);
  expect(screen.getByRole('radio', { name: 'Nivell 1 Passiva' }).checked).toBe(true);
  expect(magatzem.get('socdepoble-iaia-level')).toBe('1');
});
