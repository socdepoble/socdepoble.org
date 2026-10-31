/* P1-59 (a) (Llibre Mestre, Fita 23, «Didàctica Activa: placeholder
   intel·ligent anti-error»; guàrdia nocturna 261030, Fase 3) · La fitxa d'una
   PERSONA que la pot editar porta el text fantasma del cos buit
   (placeholderCos), que l'adreça a NOVA ORG; la d'una organització o d'un
   agent, i la persona en lectura (fila de reserva), cap clau. El text no és
   cap llavor: seedContent continua null. */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ adapter: null }));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { m.adapter = adapter; return null; } }));
vi.mock('./PerfilContext.jsx', () => ({ usePerfil: () => ({ guardarCampPerfil: vi.fn(), pujaMitja: vi.fn(), recarrega: vi.fn(),
  identitats: [], autodesament: null }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({ ...(await importOriginal()), getCurrentUser: () => ({ id: 'U' }) }));
import { PLACEHOLDER_COS_PERSONA, PerfilEditor } from './PerfilEditor.jsx';

const jo = (dades = {}) => ({ id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona', avatar: '', dades: { full_name: 'Pep', is_public: false, town_name: 'La Torre', ...dades } });
const org = (role) => ({ id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Membre', dades: { name: 'Forn', description: 'Pa', lema: 'Matí', presentacio_html: '', visibility: 'public', role } });

beforeEach(() => { m.adapter = null; });
afterEach(cleanup);

test('la persona que edita la seua fitxa: el text fantasma del Mestre, en valencià, cap a NOVA ORG; cap llavor', () => {
  render(<PerfilEditor identitat={jo()} />);
  expect(m.adapter.placeholderCos).toBe(PLACEHOLDER_COS_PERSONA);
  expect(m.adapter).toHaveProperty('seedContent', null);
  expect(PLACEHOLDER_COS_PERSONA).toMatch(/^Este és el teu perfil personal\. /);
  expect(PLACEHOLDER_COS_PERSONA).toContain('NOVA ORG');
  expect(PLACEHOLDER_COS_PERSONA).toMatch(/empresa.*comerç.*taller.*associació/);
  // Valencià normatiu (este, mai «aquest»), i cap paraula vetada.
  expect(PLACEHOLDER_COS_PERSONA).not.toMatch(/\baquest\b|masia/i);
});

test.each([
  ['una organització que s’administra', () => org('owner')],
  ['una organització on només s’és membre', () => org('member')],
  ['la persona amb la fila de reserva (en lectura)', () => jo({ reserva: true })]
])('%s: cap clau placeholderCos (les extensions de sempre)', (_cas, identitat) => {
  render(<PerfilEditor identitat={identitat()} />);
  expect(m.adapter).not.toHaveProperty('placeholderCos');
});
