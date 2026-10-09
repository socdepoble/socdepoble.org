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
  pinta(enError({ codiError: 'SDP-XAT-003', error: 'Encara no consta que sigues d’este poble.' }), 'en');
  expect(screen.getByRole('alert').textContent).toContain('You are not registered as part of this town yet');
});

test('sense codi traduït, el missatge de l’error; sense missatge, «No s’ha enviat»', () => {
  pinta(enError({ codiError: 'SDP-XAT-007', error: 'El missatge és massa llarg.' }), 'en');
  expect(screen.getByRole('alert').textContent).toContain('El missatge és massa llarg.');
  cleanup();
  pinta(enError({ codiError: null, error: null }), 'ca');
  expect(screen.getByRole('alert').textContent).toContain("No s'ha enviat");
});
