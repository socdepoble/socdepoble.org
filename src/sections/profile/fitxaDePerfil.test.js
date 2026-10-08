import { describe, expect, test } from 'vitest';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';
import {
  ETIQUETA_IA, etiquetesDeFitxa, pobleDeFitxa, potEditarFitxa, rutaDeFitxaPublica, slugDEntitat,
} from './fitxaDePerfil.js';

/* Ordre del Mestre (261008, «Les vistes») · Les funcions pures que l'apartat
   i la seua pàgina comparteixen amb l'editor de la fitxa. Són còpies de la
   lògica de PerfilEditor.jsx: estes proves fixen que diuen el mateix (les
   rutes, les mateixes que PerfilEditor.test.jsx). Dades sintètiques. */

const jo = { id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona', dades: { town_name: 'La Torre' } };
const org = (role, dades = {}) => ({ id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Empresa', dades: { role, ...dades } });
const agent = { id: 'A', mena: 'agent', nom: 'IAIA', rol: 'Agent IA', dades: { name: 'IAIA' } };

describe('rutaDeFitxaPublica', () => {
  test('persona per dades.id, grup a /grup, entitat a /empresa, pilot a /projecte, agent a /perfil, sense id null', () => {
    expect(rutaDeFitxaPublica({ ...jo, dades: { id: 'U' } })).toBe('/gent/U');
    expect(rutaDeFitxaPublica(jo)).toBeNull();
    expect(rutaDeFitxaPublica({ id: 'G', mena: 'grup', nom: 'Colla' })).toBe('/grup/G');
    expect(rutaDeFitxaPublica({ id: 'O', mena: 'empresa', nom: 'Forn' })).toBe('/empresa/O');
    expect(rutaDeFitxaPublica({ id: ENTITAT_PILOT_ID, mena: 'empresa', nom: 'Sóc de Poble' })).toBe('/projecte');
    expect(rutaDeFitxaPublica(agent)).toBe('/perfil/A');
    expect(rutaDeFitxaPublica(null)).toBeNull();
  });

  test('l’entitat pilot es reconeix pel slug (un UUID en remot), mai un grup, una persona ni un agent', () => {
    const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
    expect(rutaDeFitxaPublica({ id: uuid, mena: 'empresa', nom: 'X', dades: { slug: ENTITAT_PILOT_SLUG } })).toBe('/projecte');
    expect(rutaDeFitxaPublica({ id: uuid, mena: 'empresa', nom: 'X', dades: { slug: 'forn' } })).toBe(`/empresa/${uuid}`);
    expect(rutaDeFitxaPublica({ id: 'G', mena: 'grup', nom: 'Colla', dades: { slug: ENTITAT_PILOT_SLUG } })).toBe('/grup/G');
    expect(rutaDeFitxaPublica({ ...agent, dades: { slug: ENTITAT_PILOT_SLUG } })).toBe('/perfil/A');
    expect(rutaDeFitxaPublica({ ...jo, dades: { id: 'U', slug: ENTITAT_PILOT_SLUG } })).toBe('/gent/U');
    expect(rutaDeFitxaPublica({ mena: 'empresa', nom: 'X', dades: { slug: ENTITAT_PILOT_SLUG } })).toBeNull();
  });

  test('slugDEntitat: només d’una organització que no és un grup', () => {
    expect(slugDEntitat(org('owner', { slug: 'forn' }))).toBe('forn');
    expect(slugDEntitat(org('owner'))).toBe('');
    expect(slugDEntitat({ id: 'G', mena: 'grup', dades: { slug: 'colla' } })).toBe('');
    expect(slugDEntitat({ ...jo, dades: { slug: 'pep' } })).toBe('');
    expect(slugDEntitat(agent)).toBe('');
  });
});

describe('potEditarFitxa', () => {
  test('la persona, els agents i qui és propietària o administradora; mai un membre', () => {
    expect(potEditarFitxa(jo)).toBe(true);
    expect(potEditarFitxa(agent)).toBe(true);
    expect(potEditarFitxa(org('owner'))).toBe(true);
    expect(potEditarFitxa(org('admin'))).toBe(true);
    expect(potEditarFitxa(org('member'))).toBe(false);
    expect(potEditarFitxa(org(undefined))).toBe(false);
    expect(potEditarFitxa({ id: 'G', mena: 'grup', nom: 'Colla', dades: { role: 'owner' } })).toBe(true);
    expect(potEditarFitxa(null)).toBe(false);
  });

  test('amb una baixa en curs o amb la fila de reserva, la fitxa és de lectura', () => {
    expect(potEditarFitxa({ ...jo, dades: { baixa_demanada_at: '2026-09-26T10:00:00Z' } })).toBe(false);
    expect(potEditarFitxa({ ...jo, dades: { reserva: true } })).toBe(false);
    // Una organització no té ni baixa ni reserva: la decidix el rol.
    expect(potEditarFitxa(org('owner', { baixa_demanada_at: '2026-09-26T10:00:00Z', reserva: true }))).toBe(true);
  });
});

describe('pobleDeFitxa', () => {
  test('la persona, el seu poble', () => {
    expect(pobleDeFitxa(jo, [jo])).toBe('La Torre');
    expect(pobleDeFitxa({ ...jo, dades: {} }, [jo])).toBe('');
  });

  test('una organització, el seu poble o cap: mai el de la persona (decisió del Mestre, 261008)', () => {
    expect(pobleDeFitxa(org('owner', { town_name: 'Alcoi' }), [jo])).toBe('Alcoi');
    expect(pobleDeFitxa(org('owner'), [jo])).toBe('');
  });

  test('un agent IA, el seu o, si no en té, el de la persona que l’administra', () => {
    expect(pobleDeFitxa(agent, [jo, agent])).toBe('La Torre');
    expect(pobleDeFitxa({ ...agent, dades: { town_name: 'Ibi' } }, [jo])).toBe('Ibi');
    expect(pobleDeFitxa(agent)).toBe('');
  });
});

describe('etiquetesDeFitxa', () => {
  test('el rol i, si cal, la baixa, la falta de connexió o l’avís d’IA', () => {
    expect(etiquetesDeFitxa(jo)).toEqual([{ text: 'Persona' }]);
    expect(etiquetesDeFitxa(org('member'))).toEqual([{ text: 'Empresa' }]);
    expect(etiquetesDeFitxa({ ...jo, dades: { baixa_demanada_at: '2026-09-26T10:00:00Z' } })).toEqual([{ text: 'Persona' }, { text: 'Baixa en curs' }]);
    expect(etiquetesDeFitxa({ ...jo, dades: { reserva: true } })).toEqual([{ text: 'Persona' }, { text: 'Sense connexió' }]);
    expect(etiquetesDeFitxa(agent)).toEqual([{ text: 'Agent IA' }, { text: ETIQUETA_IA }]);
    expect(ETIQUETA_IA).toBe('Intel·ligència artificial');
  });
});
