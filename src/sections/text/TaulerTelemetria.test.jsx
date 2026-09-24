import { afterEach, beforeEach, expect, test } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import TaulerTelemetria from './TaulerTelemetria';
import {
  CLAU_APAGADA, configTelemetria, registraEsdeveniment, _reiniciaTelemetria
} from '../../data/telemetria.js';

const SENSE_COMPTADOR = configTelemetria({});
const AMB_TAULER = configTelemetria({ VITE_UMAMI_SHARE_URL: 'https://compta.socdepoble.org/share/Ab12/socdepoble' });
const INTERRUPTOR = { name: "Comptar les meues visites des d'este navegador" };
const posaDNT = (valor) => Object.defineProperty(window.navigator, 'doNotTrack', { value: valor, configurable: true });

beforeEach(() => { _reiniciaTelemetria(); window.localStorage.removeItem(CLAU_APAGADA); delete window.umami; posaDNT(null); });
afterEach(() => { cleanup(); window.localStorage.removeItem(CLAU_APAGADA); posaDNT(null); });

test('sense enllaç públic: estat buit honest i cap iframe ni xifra', () => {
  const { container } = render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  expect(screen.getByText('El tauler públic encara no està endollat')).toBeTruthy();
  expect(container.querySelector('iframe')).toBeNull();
  expect(screen.getByText(/no té cap comptador propi configurat/)).toBeTruthy();
});

test('amb enllaç públic: iframe aïllat, mandrós i sense referent', () => {
  render(<TaulerTelemetria config={AMB_TAULER} />);
  const marc = screen.getByTitle('Tauler públic de visites de Sóc de Poble, servit per Umami');
  expect(marc.tagName).toBe('IFRAME');
  expect(marc.getAttribute('src')).toBe('https://compta.socdepoble.org/share/Ab12/socdepoble');
  expect(marc.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin');
  expect(marc.getAttribute('loading')).toBe('lazy');
  expect(marc.getAttribute('referrerpolicy')).toBe('no-referrer');
  expect(screen.queryByText('El tauler públic encara no està endollat')).toBeNull();
});

test('l’interruptor escriu la tria local i la torna a llegir', () => {
  render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  const interruptor = screen.getByRole('switch', INTERRUPTOR);
  expect(interruptor.getAttribute('aria-checked')).toBe('true');
  fireEvent.click(interruptor);
  expect(window.localStorage.getItem(CLAU_APAGADA)).toBe('1');
  expect(interruptor.getAttribute('aria-checked')).toBe('false');
  expect(screen.getByText(/Apagada per tu/)).toBeTruthy();
  fireEvent.click(interruptor);
  expect(window.localStorage.getItem(CLAU_APAGADA)).toBeNull();
  expect(interruptor.getAttribute('aria-checked')).toBe('true');
});

test('la tria guardada abans es llig en obrir la pàgina', () => {
  window.localStorage.setItem(CLAU_APAGADA, '1');
  render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  expect(screen.getByRole('switch', INTERRUPTOR).getAttribute('aria-checked')).toBe('false');
});

test('Do Not Track: ho diu, i l’interruptor queda apagat i sense poder-se tocar', () => {
  posaDNT('1');
  render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  const interruptor = screen.getByRole('switch', INTERRUPTOR);
  expect(interruptor.getAttribute('aria-checked')).toBe('false');
  expect(interruptor.disabled).toBe(true);
  expect(screen.getByText(/envia el senyal Do Not Track/)).toBeTruthy();
  expect(window.localStorage.getItem(CLAU_APAGADA)).toBeNull();
});

test('la llista reacciona a l’esdeveniment sdp:telemetria i ho diu en paraules', () => {
  render(<TaulerTelemetria config={SENSE_COMPTADOR} />);
  expect(screen.getByText("Encara no s'ha intentat comptar res en esta pestanya.")).toBeTruthy();
  act(() => { registraEsdeveniment('connectar', { seccio: 'mur', origen: 'targeta' }, { cfg: SENSE_COMPTADOR, ruta: '/mur?item_id=Titol' }); });
  expect(screen.getByText('connectar')).toBeTruthy();
  expect(screen.getByText('/mur')).toBeTruthy();
  expect(screen.getByText('seccio: mur · origen: targeta')).toBeTruthy();
  expect(screen.getByText("No s'ha enviat: el comptador no està configurat.")).toBeTruthy();
  expect(screen.queryByText(/Titol/)).toBeNull();
});
