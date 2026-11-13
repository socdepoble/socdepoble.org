import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const magatzem = new Map();
vi.mock('../../config/storage.js', () => ({
  getVal: (clau, reserva) => (magatzem.has(clau) ? magatzem.get(clau) : reserva),
  setVal: (clau, valor) => { magatzem.set(clau, valor); }
}));
/* R21 · El traductor es pot canviar per prova: per defecte, la reserva valenciana. */
const reserva = (_clau, text) => text;
let traductor = reserva;
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (clau, text) => traductor(clau, text) }) }));

import SelectorRealitat from './SelectorRealitat.jsx';
import { EVENT_NIVELL_IAIA, esIaiaActiva } from './nivellIaia.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';

beforeEach(() => { magatzem.clear(); traductor = reserva; });
afterEach(cleanup);

const QUATRE_NIVELLS = [
  'Nivell 0 Apagada',
  'Nivell 1 Passiva',
  'Nivell 2 Interactiva',
  'Nivell 3 Activa'
];

test('T31 + R21.5 · els 4 nivells de la IAIA MarIA són un grup d’opcions de Pedra Seca i el triat es veu marcat', () => {
  render(<SelectorRealitat />);
  const radios = screen.getAllByRole('radio');
  expect(radios).toHaveLength(4);
  expect(screen.getByRole('radio', { name: 'Nivell 1 Passiva' }).checked).toBe(true);
  expect(document.querySelector('.realitat-btn')).toBeNull();
  expect(document.querySelector('.sdp-realitat fieldset.sdp-grup')).toBeTruthy();
});

test('R21.5 · s’han extirpat per complet els desplegables d’acompanyants, les caselles, GrupAvatars i qualsevol menció a agents o acompanyants', () => {
  const { container } = render(<SelectorRealitat />);
  for (const nivell of QUATRE_NIVELLS) {
    fireEvent.click(screen.getByRole('radio', { name: nivell }));
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(container.querySelector('.sdp-grup__desplegable')).toBeNull();
    expect(container.querySelector('.sdp-avatar-grup')).toBeNull();
    expect(container.querySelector('.sdp-realitat__connexio')).toBeNull();
    expect(container.textContent).not.toMatch(/acompanyant|assistent|\bagents?\b|tots els agents del Mas|de el Mas/i);
  }
  expect(magatzem.has('socdepoble-iaia-companions')).toBe(false);
});

test('T30.2 · canviar de nivell desa el valor, anuncia l’esdeveniment i «activa» comença al nivell 2', () => {
  const rebuts = [];
  const escolta = (e) => rebuts.push(e.detail);
  window.addEventListener(EVENT_NIVELL_IAIA, escolta);
  render(<SelectorRealitat />);
  fireEvent.click(screen.getByRole('radio', { name: 'Nivell 3 Activa' }));
  expect(magatzem.get('socdepoble-iaia-level')).toBe('3');
  fireEvent.click(screen.getByRole('radio', { name: 'Nivell 0 Apagada' }));
  expect(magatzem.get('socdepoble-iaia-level')).toBe('0');
  window.removeEventListener(EVENT_NIVELL_IAIA, escolta);
  expect(rebuts).toEqual([1, 3, 0]);
  expect([0, 1, 2, 3].map(esIaiaActiva)).toEqual([false, false, true, true]);
});

test('T44 + R21.5 · els 4 nivells són targetes dedicades exclusivament a la IAIA MarIA amb descripció i detall propis', () => {
  render(<SelectorRealitat />);
  expect(document.querySelector('.sdp-realitat fieldset.sdp-grup--targetes')).toBeTruthy();
  expect(document.querySelectorAll('.sdp-realitat .sdp-targeta-opcio')).toHaveLength(4);
  expect(screen.getByRole('radio', { name: 'Nivell 0 Apagada', description: /Apagada · Fora del xat/ })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Nivell 1 Passiva', description: /Al xat · Només respon si li escrius/ })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Nivell 2 Interactiva', description: /Al xat · La icona s’il·lumina/ })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Nivell 3 Activa', description: /Com el nivell 2 · Sense funció pròpia encara/ })).toBeTruthy();
});

test('T44 · la triada es llig sense color: una sola insígnia «Nivell actual», dins de la targeta marcada', () => {
  render(<SelectorRealitat />);
  const insignies = screen.getAllByText('Nivell actual');
  expect(insignies).toHaveLength(1);
  const targeta = insignies[0].closest('.sdp-targeta-opcio');
  expect(targeta.querySelector('input[type="radio"]').checked).toBe(true);
  expect(targeta.querySelector('input[type="radio"]').value).toBe('1');

  fireEvent.click(screen.getByRole('radio', { name: 'Nivell 3 Activa' }));
  const despres = screen.getAllByText('Nivell actual');
  expect(despres).toHaveLength(1);
  expect(despres[0].closest('.sdp-targeta-opcio').querySelector('input').value).toBe('3');
});

test('T44 · el tauler d’estat seguix la presència de la IAIA MarIA', () => {
  render(<SelectorRealitat />);
  const iaia = document.querySelector('.sdp-realitat__iaia');
  expect(iaia.getAttribute('aria-hidden')).toBe('true');
  expect(iaia.classList.contains('sdp-realitat__iaia--activa')).toBe(false);
  expect(screen.getByText('Ara: nivell 1 · Passiva')).toBeTruthy();
  expect(screen.getByText(/és al xat i espera: només respon quan li escrius/)).toBeTruthy();

  fireEvent.click(screen.getByRole('radio', { name: 'Nivell 2 Interactiva' }));
  expect(document.querySelector('.sdp-realitat__iaia').classList.contains('sdp-realitat__iaia--activa')).toBe(true);
  expect(screen.getByText('Ara: nivell 2 · Interactiva')).toBeTruthy();
  expect(screen.getByText(/fa el mateix que al nivell 1: només respon quan li escrius/)).toBeTruthy();
});

test('261021 + R21.5 · cap text parla de la barra negra ni promet moviment, i cada nivell té el seu text propi al tauler', () => {
  render(<SelectorRealitat />);
  const textos = [];
  for (const nivell of QUATRE_NIVELLS) {
    fireEvent.click(screen.getByRole('radio', { name: nivell }));
    const text = document.querySelector('.sdp-realitat').textContent;
    expect(text).not.toMatch(/barra negra|respira|es mou|batega|s'anima/);
    textos.push(document.querySelector('.sdp-realitat__estat-desc').textContent);
  }
  expect(new Set(textos).size).toBe(4);
  expect(textos[0]).toMatch(/^La IAIA MarIA està apagada: no apareix al xat/);
  expect(textos[3]).toMatch(/^De moment, el nivell 3 fa el mateix que el 2/);
});

/* R21 (honestedat_textos-05) · El codi: el nivell 0 trau la IAIA del xat (XatContext · iaiaApagada);
   de l'1 al 3 el xat és el mateix, i només la icona de dalt canvia a partir del 2 (esIaiaActiva).
   Cap text no pot prometre iniciativa, redacció per al Mur, dreceres ni ajuda contextual. */
test('R21 · els nivells no prometen res que el codi no fa: de l’1 al 3, el mateix xat; el 3, sense funció pròpia', () => {
  render(<SelectorRealitat />);
  const estats = [];
  for (const nivell of QUATRE_NIVELLS) {
    fireEvent.click(screen.getByRole('radio', { name: nivell }));
    const text = document.querySelector('.sdp-realitat').textContent;
    expect(text).not.toMatch(/redact|esborrany|\bMur\b|drecer|contextual|iniciativa|plenament|al teu servei|Zero IA|privadesa manual|sense eixir del teu dispositiu/i);
    estats.push(document.querySelector('.sdp-realitat__estat-desc').textContent);
  }
  expect(estats[0]).toMatch(/no apareix al xat, no respon/);
  for (const estat of estats.slice(1)) expect(estat).toMatch(/només respon quan li escrius/);
  expect(estats[2]).toMatch(/L’única diferència és que la seua icona/);
  expect(estats[3]).toMatch(/Encara no hi ha cap funció pròpia d’este nivell/);
  expect([0, 1, 2, 3].map(esIaiaActiva)).toEqual([false, false, true, true]);
});

test('R21 · cada text del selector té clau als 5 diccionaris, amb el valencià igual que la reserva i 4 estats distints per llengua', () => {
  const demanades = new Map();
  traductor = (clau, text) => { demanades.set(clau, text); return text; };
  render(<SelectorRealitat />);
  for (const nivell of QUATRE_NIVELLS) fireEvent.click(screen.getByRole('radio', { name: nivell }));
  const propies = [...demanades.keys()].filter((clau) => /^section\.realitat\.(nivell\d|ara$|antetitol$|nivellActual$)/.test(clau));
  expect(propies).toHaveLength(4 * 4 + 3);
  for (const clau of propies) expect(CA[clau], clau).toBe(demanades.get(clau));
  for (const [llengua, diccionari] of Object.entries({ ca: CA, es: ES, en: EN, eu: EU, gl: GL })) {
    for (const clau of propies) expect(typeof diccionari[clau] === 'string' && diccionari[clau].trim().length > 0, `${llengua}: ${clau}`).toBe(true);
    expect(new Set([0, 1, 2, 3].map((n) => diccionari[`section.realitat.nivell${n}.estat`])).size, llengua).toBe(4);
    for (const plantilla of ['section.realitat.ara', 'section.realitat.antetitol']) expect(diccionari[plantilla], `${llengua}: ${plantilla}`).toContain('{nivell}');
    expect(diccionari['section.realitat.ara'], llengua).toContain('{etiqueta}');
  }
});

test('R21 · en anglés, el selector es llig sencer en anglés', () => {
  traductor = (clau, text) => EN[clau] ?? text;
  render(<SelectorRealitat />);
  expect(screen.getByRole('radio', { name: 'Level 1 Passive' }).checked).toBe(true);
  expect(screen.getByText('Now: level 1 · Passive')).toBeTruthy();
  expect(screen.getAllByText('Current level')).toHaveLength(1);
  fireEvent.click(screen.getByRole('radio', { name: 'Level 3 Active' }));
  expect(screen.getByText(/^For now, level 3 does the same as level 2/)).toBeTruthy();
  expect(document.querySelector('.sdp-realitat').textContent).not.toMatch(/Nivell|Apagada|Passiva|Ara:/);
});

test('P0-72 + R21.5 · el catàleg de dades no porta cap tipus MASTER i l’única IA del sistema és la IAIA MarIA', async () => {
  const cataleg = await import('../../data/agentsSeed.js');
  expect(cataleg.AGENTS.filter((agent) => agent.type === 'MASTER')).toEqual([]);
  expect(new Set(cataleg.AGENTS.map((agent) => agent.type))).toEqual(new Set(['COMPANY', 'PERSON', 'AI']));
  const ia = cataleg.AGENTS.filter((agent) => cataleg.tipusDAgent(agent) === 'ia');
  expect(ia.map((agent) => [agent.name, agent.type])).toEqual([['IAIA MarIA', 'AI']]);
});

test('T44 · un nivell desat fora de rang torna a Passiva', () => {
  magatzem.set('socdepoble-iaia-level', '7');
  render(<SelectorRealitat />);
  expect(screen.getByRole('radio', { name: 'Nivell 1 Passiva' }).checked).toBe(true);
  expect(magatzem.get('socdepoble-iaia-level')).toBe('1');
});
