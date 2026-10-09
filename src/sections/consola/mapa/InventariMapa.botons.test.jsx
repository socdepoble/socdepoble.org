import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

/* Correcció de l'Onada 6 (revisió adversarial: les proves no comprovaven les
   propietats clau dels botons de l'Inventari) · «Copiar l'ordre de reparació»
   només escriu al porta-retalls, sense cap petició ni execució; «Veure al
   graf» porta a l'Explorador amb la peça triada; i ?filtre=sense-disparador,
   on porta la xifra «skills sense disparador útil», filtra des de la URL. */
const estat = vi.hoisted(() => ({ consulta: '', navegades: [], toasts: [] }));
vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => (ruta) => { estat.navegades.push(ruta); },
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useSearchParams: () => [new URLSearchParams(estat.consulta), () => {}]
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: (missatge, tipus) => { estat.toasts.push([missatge, tipus]); } })
}));
import { InventariMapa } from './InventariMapa.jsx';
import { ordreReparacio, skillsDelInventari } from './inventariMapa.js';
import { rutaPecaAlGraf } from '../consolaPagines.js';
import { xifraDelMas } from '../xifresMas.js';

const n = (id, tipus, atributs = {}) => ({ id, tipus, font: null, atributs });
const MAPA = Object.freeze({
  schema: 'sdp.mapa.v1', generat: '2026-10-09T01:41:50.088Z', tall: null,
  nodes: [n('skill:sdp-workflow', 'skill', { core: true }), n('skill:sdp-clon-loiverse', 'skill'), n('skill:core-higiene-escriptori', 'skill')],
  arestes: [], tasques: [],
  avisos: [
    { node: 'skill:sdp-clon-loiverse', codi: 'disparador-decoratiu', severitat: 'mitjana', evidencia: '.agents/skills_index.json' },
    { node: 'skill:core-higiene-escriptori', codi: 'frontmatter-invalid', severitat: 'alta', evidencia: 'x' },
    { node: 'skill:core-higiene-escriptori', codi: 'fora-cataleg-claude', severitat: 'mitjana', evidencia: '.claude/skills/' }
  ],
  salut: []
});

let escriu;
let peticio;
beforeEach(() => {
  escriu = vi.fn(() => Promise.resolve());
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: escriu }, configurable: true });
  peticio = vi.fn(() => Promise.resolve({ ok: true }));
  vi.stubGlobal('fetch', peticio);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  estat.consulta = '';
  estat.navegades = [];
  estat.toasts = [];
});

const fila = (nom) => within(screen.getByRole('region', { name: 'Inventari de skills' })).getByRole('rowheader', { name: nom }).closest('tr');
/* El botó pel seu text sencer (el que es veu i el que llig el lector de pantalla). */
const boto = (tr, text) => {
  const trobat = [...tr.querySelectorAll('button')].find((b) => b.textContent === text);
  if (!trobat) throw new Error(`Cap botó «${text}»: ${[...tr.querySelectorAll('button')].map((b) => b.textContent).join(' | ')}`);
  return trobat;
};

test('«Copiar l’ordre de reparació» copia exactament l’ordre, sense cap petició ni execució, i diu quin avís tracta', async () => {
  render(<InventariMapa mapa={MAPA} locale="ca-ES" />);
  fireEvent.click(boto(fila('core-higiene-escriptori'), 'Copiar l’ordre de reparació de core-higiene-escriptori per a fora-cataleg-claude'));
  await waitFor(() => expect(estat.toasts).toHaveLength(1));
  const skill = skillsDelInventari(MAPA).find((s) => s.nom === 'core-higiene-escriptori');
  expect(escriu).toHaveBeenCalledTimes(1);
  expect(escriu).toHaveBeenCalledWith(ordreReparacio(skill));
  expect(escriu.mock.calls[0][0]).toBe(
    'ln -s ../../.agents/skills/core-higiene-escriptori .claude/skills/core-higiene-escriptori  # repara fora-cataleg-claude'
  );
  expect(peticio).not.toHaveBeenCalled();
  expect(estat.navegades).toEqual([]);
  expect(estat.toasts).toEqual([[
    'Ordre de reparació per a fora-cataleg-claude copiada al porta-retalls: no s’ha executat res.', 'success'
  ]]);
});

test('sense accés al porta-retalls, ho diu i no fa res més', async () => {
  escriu.mockImplementation(() => Promise.reject(new Error('denegat')));
  render(<InventariMapa mapa={MAPA} locale="ca-ES" />);
  fireEvent.click(boto(fila('core-higiene-escriptori'), 'Copiar l’ordre de reparació de core-higiene-escriptori per a fora-cataleg-claude'));
  await waitFor(() => expect(estat.toasts).toHaveLength(1));
  expect(estat.toasts[0]).toEqual(['No s’ha pogut copiar l’ordre: el navegador no ha donat accés al porta-retalls.', 'error']);
  expect(peticio).not.toHaveBeenCalled();
});

test('«Veure al graf» porta a l’Explorador amb la peça a la URL', () => {
  render(<InventariMapa mapa={MAPA} locale="ca-ES" />);
  fireEvent.click(boto(fila('sdp-clon-loiverse'), 'Veure al graf de sdp-clon-loiverse'));
  expect(estat.navegades).toEqual([rutaPecaAlGraf('skill:sdp-clon-loiverse')]);
  expect(estat.navegades[0]).toBe('/consola/explorador?peca=skill%3Asdp-clon-loiverse');
  expect(peticio).not.toHaveBeenCalled();
});

test('?filtre=sense-disparador, des de la URL, deixa només les skills sense disparador útil; la xifra hi porta', () => {
  estat.consulta = 'filtre=sense-disparador';
  render(<InventariMapa mapa={MAPA} locale="ca-ES" />);
  const taula = screen.getByRole('region', { name: 'Inventari de skills' });
  expect([...taula.querySelectorAll('tbody th[scope="row"]')].map((th) => th.textContent)).toEqual(['sdp-clon-loiverse']);
  expect(within(screen.getByRole('group', { name: 'Quines skills es mostren' })).getByRole('button', { name: 'Sense disparador útil' })
    .getAttribute('aria-pressed')).toBe('true');
  // La targeta de la xifra porta a la mateixa adreça (On es tracta).
  expect(xifraDelMas('skills-sense-disparador', MAPA).tracta.ruta).toBe('/consola/inventari?filtre=sense-disparador');
});
