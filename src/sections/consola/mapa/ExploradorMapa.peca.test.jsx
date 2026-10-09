import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

/* Onada 6 (requisit 11) · L'Explorador accepta ?peca=: «Veure al graf» d'una
   fila de l'Inventari hi porta amb la peça triada, i triar-ne una altra
   escriu la URL (el que es comparteix és el que es veu). */
const url = vi.hoisted(() => ({ consulta: '', escrites: [] }));
vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useSearchParams: () => [
    new URLSearchParams(url.consulta),
    (canvis, opcions) => { url.escrites.push([canvis, opcions]); }
  ]
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
import { ExploradorMapa } from './ExploradorMapa.jsx';
import { CLAU_PECA, rutaPecaAlGraf } from '../consolaPagines.js';

afterEach(() => {
  cleanup();
  url.consulta = '';
  url.escrites = [];
});

const n = (id, tipus, atributs = {}) => ({ id, tipus, font: null, atributs });
const MAPA = Object.freeze({
  schema: 'sdp.mapa.v1', generat: '2026-10-09T01:41:50.088Z', tall: null,
  nodes: [n('skill:sdp-workflow', 'skill'), n('skill:sdp-pedra-seca', 'skill')],
  arestes: [], tasques: [],
  avisos: [{ node: 'skill:sdp-pedra-seca', codi: 'fora-cataleg-claude', severitat: 'mitjana', evidencia: '.claude/skills/' }],
  salut: []
});

test('?peca= tria la peça en obrir l’Explorador i porta el focus al seu nom', () => {
  url.consulta = `${CLAU_PECA}=${encodeURIComponent('skill:sdp-pedra-seca')}`;
  render(<ExploradorMapa mapa={MAPA} />);
  const detall = screen.getByRole('complementary', { name: 'Detall de la peça' });
  const nom = within(detall).getByRole('heading', { level: 3 });
  expect(nom.textContent).toBe('sdp-pedra-seca');
  expect(document.activeElement).toBe(nom);
  // La skill amb un avís reparable porta el botó que copia l'ordre (només la copia), i diu quin avís tracta.
  expect(within(detall).getByRole('button', { name: 'Copiar l’ordre de reparació per a fora-cataleg-claude' })).toBeTruthy();
});

test('triar una altra peça escriu ?peca= a la URL, i «Cap peça triada» la lleva', () => {
  render(<ExploradorMapa mapa={MAPA} />);
  const selector = screen.getByRole('combobox', { name: 'Tria una peça' });
  fireEvent.change(selector, { target: { value: 'skill:sdp-workflow' } });
  expect(url.escrites.at(-1)).toEqual([{ [CLAU_PECA]: 'skill:sdp-workflow' }, { replace: true }]);
  fireEvent.change(selector, { target: { value: '' } });
  expect(url.escrites.at(-1)).toEqual([{ [CLAU_PECA]: null }, { replace: true }]);
});

test('sense ?peca=, cap peça triada i el focus no es mou', () => {
  render(<ExploradorMapa mapa={MAPA} />);
  expect(screen.getByText(/Fes clic en un punt del graf/)).toBeTruthy();
  expect(document.activeElement).toBe(document.body);
});

test('l’adreça de «Veure al graf» és la que l’Explorador llig', () => {
  expect(rutaPecaAlGraf('skill:sdp-pedra-seca')).toBe(`/consola/explorador?${CLAU_PECA}=skill%3Asdp-pedra-seca`);
  expect(new URLSearchParams(rutaPecaAlGraf('skill:sdp-pedra-seca').split('?')[1]).get(CLAU_PECA)).toBe('skill:sdp-pedra-seca');
});
