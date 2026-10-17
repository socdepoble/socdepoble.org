/* Gauntlet 261016_1530 (Bloc 3.6.3; relleu F65; ordre del Mestre: la ruta
   /iaia queda reservada per a la fitxa de la IAIA MarIA, «que és on s'ha
   d'accedir des del xat i des del cercador») · El nom de qui signa una
   bombolla enllaça al seu perfil. Quan és la IAIA MarIA (per id i amb el
   tipus d'IA, mai pel nom), a la seua fitxa neta, /iaia, com la capçalera de
   la conversa. Una altra IA, una persona (també una homònima) i una entitat,
   com sempre. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import Bombolla from './Bombolla.jsx';
import { createTranslator } from '../../../config/i18n.js';
import { RUTA_FITXA_IAIA, rutaDePerfil } from '../../../config/navigation.js';
import { IAIA_ID } from '../../../data/identitatsSeed.js';

afterEach(cleanup);

const t = createTranslator('ca');
const missatge = (extra) => ({ id: 'm-1', sender: 'other', text: 'Bon dia', creatAl: '2026-10-16T08:00:00Z', ...extra });
const pinta = (dades, opcions = {}) => render(
  <MemoryRouter>
    <ul><Bombolla missatge={missatge(dades)} locale="ca-ES" t={t} {...opcions} /></ul>
  </MemoryRouter>
);
const enllacDe = (nom) => screen.getByRole('link', { name: `Obri el perfil de ${nom}` });

test('la IAIA MarIA, pel seu id, signa com a IA i el seu nom porta a la seua fitxa, /iaia', () => {
  pinta({ author: 'IAIA MarIA', usuariId: IAIA_ID, is_ai: true });
  const enllac = enllacDe('IAIA MarIA');
  expect([enllac.textContent, enllac.getAttribute('href')]).toEqual(['IAIA MarIA · IA', RUTA_FITXA_IAIA]);
  expect(RUTA_FITXA_IAIA).toBe('/iaia');
  /* /perfil/<id> continua obrint la mateixa fitxa: rutaDePerfil no canvia. */
  expect(rutaDePerfil('ia', IAIA_ID)).toBe(`/perfil/${IAIA_ID}`);
});

test('una altra IA, o una IA amb el nom de la IAIA i un altre id, continua anant a /perfil/<id>', () => {
  pinta({ author: 'El Gall', usuariId: 'gall', is_ai: true });
  expect(enllacDe('El Gall').getAttribute('href')).toBe('/perfil/gall');
  cleanup();
  pinta({ author: 'IAIA MarIA', usuariId: 'iaia-1', is_ai: true });
  expect(enllacDe('IAIA MarIA').getAttribute('href')).toBe('/perfil/iaia-1');
});

test('als grups, una persona amb el nom o l’id de la IAIA no guanya la seua fitxa', () => {
  pinta({ author: 'IAIA MarIA', usuariId: 'u-maria' }, { esGrup: true });
  expect(enllacDe('IAIA MarIA').getAttribute('href')).toBe('/gent/u-maria');
  cleanup();
  pinta({ author: 'Maria', usuariId: IAIA_ID }, { esGrup: true });
  expect(enllacDe('Maria').getAttribute('href')).toBe(`/gent/${IAIA_ID}`);
});

test('una entitat signa sense enllaç i, en mode de selecció, la IAIA tampoc no enllaça', () => {
  pinta({ author: 'Sóc de Poble', usuariId: 'socdepoble', comEntitat: true });
  expect(screen.queryByRole('link')).toBeNull();
  expect(screen.getByText('Sóc de Poble').className).toBe('sdp-xat-bombolla__autor');
  cleanup();
  pinta({ author: 'IAIA MarIA', usuariId: IAIA_ID, is_ai: true }, { seleccio: { actiu: true, triat: false, onAlterna: () => {} } });
  expect(screen.queryByRole('link', { name: 'Obri el perfil de IAIA MarIA' })).toBeNull();
});
