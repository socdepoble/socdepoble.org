/**
 * Higiene d'amfitrió (ordre del Mestre, 261004, front «amfitrio-admin») · La
 * preferència «Mostrar al Panell de Control» d'una utilitat (DetallAplicacio)
 * passa per storage.js: s'escriu amb el prefix de l'app, es llig també la
 * clau de llegat ('sdp_utilitats_actives') perquè ningú no perda la
 * configuració, i cap esdeveniment ix cap a window (dins de WordPress, el
 * 'storage' fals arribava a la pàgina de l'amfitrió amb key null).
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
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
import { CLAU_UTILITATS_ACTIVES, CLAU_UTILITATS_LLEGAT, desaUtilitatActiva } from './utilitatsActives.js';
import fontDetall from './DetallEspai.jsx?raw';

const CLAU_PROPIA = STORAGE_PREFIX + CLAU_UTILITATS_ACTIVES;
const [APLICACIO] = aplicacionsValides(APLICACIONS);
const MOSTRAR = 'Mostrar al Panell de Control';
const OCULTAR = 'Ocultar del Panell de Control';
/* El títol del bloc de la preferència (un h2 de BlocPerfil). */
const AJUSTOS = 'Ajustos de l\'Usuari';

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
  /* Ordre del Mestre (261007, prompt 261007_1628, peça C) · El Perfil llig el
     valor per defecte com el Panell: sense preferència, la utilitat ja hi és i
     el botó diu «Ocultar». Abans esta prova partia de «Mostrar» i el primer
     clic escrivia un true que el Panell ja donava per fet (no canviava res). */
  test('ocultar-la escriu la clau amb prefix, conserva el llegat i no llança res a window', () => {
    localStorage.setItem(CLAU_UTILITATS_LLEGAT, JSON.stringify({ altra: false }));
    const aWindow = vi.spyOn(window, 'dispatchEvent');
    const oient = vi.fn();
    window.addEventListener('storage', oient);
    try {
      render(<DetallAplicacio aplicacio={APLICACIO} />);
      fireEvent.click(screen.getByRole('button', { name: OCULTAR }));
      expect(screen.getByRole('button', { name: MOSTRAR })).toBeTruthy();
      expect(JSON.parse(localStorage.getItem(CLAU_PROPIA))).toEqual({ altra: false, [APLICACIO.id]: false });
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

  /* Peça C (261007) · Malmesa és com sense preferència: la regla del Panell la
     dona per visible, i el Perfil ara diu el mateix («Ocultar»). Abans:
     «Mostrar», contra el que pintava el Panell. */
  test('una preferència de llegat malmesa no trenca res: la utilitat es veu al Panell', () => {
    localStorage.setItem(CLAU_UTILITATS_LLEGAT, 'no és JSON');
    render(<DetallAplicacio aplicacio={APLICACIO} />);
    expect(screen.getByRole('button', { name: OCULTAR })).toBeTruthy();
  });

  test('la font no toca localStorage ni llança esdeveniments a window', () => {
    // L'accés, no la paraula: el comentari de derogació la nomena.
    expect(fontDetall).not.toMatch(/localStorage\s*\.\s*(getItem|setItem|removeItem)/);
    expect(fontDetall).not.toMatch(/dispatchEvent\s*\(/);
  });
});

/* Ordre del Mestre (261007, prompt 261007_1628, peça C) · Els ids que no
   casaven: el Perfil escrivia 'metriques' i 'lector-rss', i el Panell amaga
   per l'id del registre. Ara el Perfil escriu i llig amb l'id del Panell, i
   una preferència vella es continua respectant.
   Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · Les
   targetes de la Consola i del Cervell ixen del Panell de Control. DEROGAT
   «ocultar metriques escriu la preferència de consola»: la Consola de
   Mètriques i el Cervell porten `panell: null` i la seua fitxa no pinta cap
   botó del Panell (un botó que no fa res està vetat). Del parell d'ids que no
   casaven en queda un, el del Lector RSS. */
describe('DetallAplicacio · l’id del Panell (aplicacions.js, camp `panell`)', () => {
  const VALIDES = aplicacionsValides(APLICACIONS);
  const perId = (id) => VALIDES.find((aplicacio) => aplicacio.id === id);

  test.each([['lector-rss', 'rss']])('ocultar %s escriu la preferència de «%s», la que llig el Panell', (id, delPanell) => {
    render(<DetallAplicacio aplicacio={perId(id)} />);
    fireEvent.click(screen.getByRole('button', { name: OCULTAR }));
    expect(JSON.parse(localStorage.getItem(CLAU_PROPIA))).toEqual({ [delPanell]: false });
    expect(screen.getByRole('button', { name: MOSTRAR })).toBeTruthy();
  });

  test.each([['lector-rss', 'rss']])('una preferència vella de %s es respecta: el Perfil diu «Mostrar»', (id, delPanell) => {
    localStorage.setItem(CLAU_UTILITATS_LLEGAT, JSON.stringify({ [id]: false }));
    render(<DetallAplicacio aplicacio={perId(id)} />);
    fireEvent.click(screen.getByRole('button', { name: MOSTRAR }));
    // Tornar-la a mostrar escriu l'id del Panell, que mana des d'ara; la vella no s'esborra.
    expect(JSON.parse(localStorage.getItem(CLAU_PROPIA))).toEqual({ [id]: false, [delPanell]: true });
    expect(screen.getByRole('button', { name: OCULTAR })).toBeTruthy();
  });

  /* Onada 10 · Les utilitats amb targeta al Panell conserven el bloc sencer. */
  test.each([['gestoria'], ['lector-rss'], ['snippet']])('Onada 10 · %s té targeta al Panell: la fitxa pinta «Ajustos de l’Usuari» amb el seu botó', (id) => {
    expect(perId(id).panell).not.toBeNull();
    render(<DetallAplicacio aplicacio={perId(id)} />);
    expect(screen.getByRole('heading', { level: 2, name: AJUSTOS })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Panell de Control/ }).map((boto) => boto.textContent)).toEqual([OCULTAR]);
  });

  /* Onada 10 · Sense targeta al Panell, cap preferència: ni el bloc, ni el
     botó, ni cap escriptura. Una preferència vella (amb l'id de l'aplicació o
     amb la clau de la targeta que ja no hi és) no fa aparéixer res i es queda
     on és. */
  test.each([['metriques'], ['cervell']])('Onada 10 · %s no té targeta al Panell: la fitxa no pinta cap botó del Panell i no escriu res', (id) => {
    const aplicacio = perId(id);
    expect(aplicacio.panell).toBeNull();
    for (const vella of [null, { [id]: false, consola: false, cervell: false }, { [id]: true, consola: true, cervell: true }]) {
      const desada = vella === null ? null : JSON.stringify(vella);
      if (desada === null) localStorage.removeItem(CLAU_UTILITATS_LLEGAT);
      else localStorage.setItem(CLAU_UTILITATS_LLEGAT, desada);
      const vista = render(<DetallAplicacio aplicacio={aplicacio} />);
      /* La pàgina hi és, amb el seu estat honest. */
      expect(screen.getByRole('heading', { level: 1, name: aplicacio.nom }), String(desada)).toBeTruthy();
      expect(screen.getByText('Pendent de connectar en este node'), String(desada)).toBeTruthy();
      expect(screen.queryByRole('heading', { level: 2, name: AJUSTOS }), String(desada)).toBeNull();
      expect(screen.queryByRole('button', { name: /Panell de Control/ }), String(desada)).toBeNull();
      expect(screen.queryByText(/Panell de Control/), String(desada)).toBeNull();
      /* Pintar la fitxa no ha escrit res, i el llegat és on era. */
      expect(localStorage.getItem(CLAU_PROPIA), String(desada)).toBeNull();
      expect(localStorage.getItem(CLAU_UTILITATS_LLEGAT), String(desada)).toBe(desada);
      /* Un canvi de la preferència des d'una altra banda tampoc fa aparéixer el botó. */
      act(() => { desaUtilitatActiva('rss', false); });
      expect(screen.queryByRole('button', { name: /Panell de Control/ }), String(desada)).toBeNull();
      vista.unmount();
      localStorage.removeItem(CLAU_PROPIA);
    }
  });

  test('un canvi des d’una altra banda de l’app arriba al botó (subscriuUtilitatsActives)', () => {
    render(<DetallAplicacio aplicacio={perId('lector-rss')} />);
    expect(screen.getByRole('button', { name: OCULTAR })).toBeTruthy();
    act(() => { desaUtilitatActiva('rss', false); });
    expect(screen.getByRole('button', { name: MOSTRAR })).toBeTruthy();
  });
});
