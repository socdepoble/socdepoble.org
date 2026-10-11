/* Onada 6 · Revisió 261009 · Una bombolla en error que porta un codi SDP
   traduït (codiError, el deixa XatContext) diu el text de la seua clau en la
   llengua de la interfície (errorsXat.js), mai el codi cru; sense codi
   traduït, el missatge de l'error; sense res, «No s'ha enviat». */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import Bombolla from './Bombolla.jsx';
import { createTranslator } from '../../../config/i18n.js';

afterEach(cleanup);

const enError = (extra = {}) => ({
  id: 'm-1', sender: 'me', text: 'Hola', creatAl: '2026-10-09T01:00:00Z', estatEnviament: 'error',
  error: 'Has enviat molts missatges en poc de temps. Espera uns segons i torna-ho a provar.', ...extra
});
const pinta = (missatge, llengua) => render(
  <ul><Bombolla missatge={missatge} locale="ca-ES" t={createTranslator(llengua)} onReintenta={() => {}} onDescarta={() => {}} /></ul>
);

test('amb codiError SDP-XAT-429, el text de la clau en la llengua de la interfície', () => {
  pinta(enError({ codiError: 'SDP-XAT-429' }), 'en');
  const avis = screen.getByRole('alert');
  expect(avis.textContent).toContain('You have sent many messages in a short time. Wait a few seconds and try again.');
  expect(avis.textContent).not.toMatch(/SDP-XAT|Has enviat/);
  expect(screen.getByRole('button', { name: 'Try again' })).not.toBeNull();
});

test('el mateix codi en castellà; i SDP-XAT-003 també', () => {
  pinta(enError({ codiError: 'SDP-XAT-429' }), 'es');
  expect(screen.getByRole('alert').textContent).toContain('Has enviado muchos mensajes en poco tiempo.');
  cleanup();
  /* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) ·
     SDP-XAT-003 diu «Mode Foraster», mai el text valencià que porta l'error.
     Onada 11 (261010; prompt 261010_1730, tasca 6, D11) · En anglés, «Outsider
     Mode» amb majúscules i «logging out», com el botó «Log out». */
  pinta(enError({ codiError: 'SDP-XAT-003', error: 'Estàs en Mode Foraster: el xat és per a la gent d’este poble.' }), 'en');
  const avis = screen.getByRole('alert');
  expect(avis.textContent).toContain('You are in Outsider Mode: the chat is for the people of this town. Try logging out and back in.');
  expect(avis.textContent).not.toMatch(/SDP-XAT|Mode Foraster/);
});

test('sense codi traduït, el missatge de l’error; sense missatge, «No s’ha enviat»', () => {
  pinta(enError({ codiError: 'SDP-XAT-007', error: 'El missatge és massa llarg.' }), 'en');
  expect(screen.getByRole('alert').textContent).toContain('El missatge és massa llarg.');
  cleanup();
  pinta(enError({ codiError: null, error: null }), 'ca');
  expect(screen.getByRole('alert').textContent).toContain("No s'ha enviat");
});
