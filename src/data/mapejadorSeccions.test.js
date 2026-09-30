/**
 * T5 (ordre del Mestre, 260930) · El mapejador de publicacions no s'inventa el
 * dia d'un acte: el dia només ve del payload. created_at és quan s'ha
 * publicat (i en UTC), mai el dia en què passa l'acte. El payload que torna és
 * el que appendSectionSubmissionNetworkOnly escriu a section_submissions.
 */
import { describe, expect, test } from 'vitest';
import { mapSectionSubmissionToItem } from './mapejadorSeccions.js';
import { acteAEsdeveniment } from '../sections/mur/agendaMur.js';

/* Les 00:30 de l'1-10-2026 a València: en UTC encara és el 30-09. */
const PUBLICAT = '2026-09-30T22:30:00.000Z';
const acte = (payload, createdAt = PUBLICAT) => mapSectionSubmissionToItem({
  id: 'e1', sectionId: 'events', createdAt, payload: { title: 'Ball de plaça', ...payload }
});

describe('mapSectionSubmissionToItem · els actes (events)', () => {
  test('sense dia al payload no hi ha date: la publicació no en fa de dia de l’acte', () => {
    const item = acte({});
    expect(item).not.toHaveProperty('date');
    expect(item.created_at).toBe(PUBLICAT);
    // Sense dia no hi ha acte al model: l'Agenda no el pinta cap dia.
    expect(acteAEsdeveniment(item)).toBeNull();
  });

  test.each(['', '   ', null])('un dia buit (%j) tampoc no viatja', (date) => {
    expect(acte({ date })).not.toHaveProperty('date');
  });

  test('el dia triat es conserva, també a la vora de la mitjanit UTC', () => {
    const item = acte({ date: '2026-10-01', time: '00:30' });
    expect(item).toMatchObject({ date: '2026-10-01', time: '00:30', created_at: PUBLICAT });
    expect(acteAEsdeveniment(item).inici).toEqual({ dataHora: '2026-10-01T00:30', zona: 'Europe/Madrid' });
  });

  test('la resta de l’acte es munta com sempre', () => {
    const item = acte({ date: ' 2026-10-12 ', author: 'El Rentonar', image_url: 'javascript:alert(1)' });
    expect(item).toMatchObject({
      id: 'e1', sectionId: 'events', type: 'event', title: 'Ball de plaça', date: '2026-10-12',
      author_name: 'El Rentonar', image_url: null, summary: '', description: ''
    });
    // El text de cerca, com sempre, dels camps crus del payload i sense accents.
    expect(item.searchText).toBe('ball de placa');
  });
});
