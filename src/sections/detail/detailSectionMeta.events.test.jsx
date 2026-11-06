/**
 * seguretat-01 (261104) · El cos del detall d'un acte
 * (buildEventsDetailSectionMeta · renderBody) pinta `date_label` i
 * `type_label` com a fills de React. Un veí escriu el payload directament per
 * l'API (section_submissions), i un objecte en una d'eixes claus tombava la
 * pàgina de l'acte («Objects are not valid as a React child»). El traductor
 * d'entrada (mapejadorSeccions.js) ja no els deixa viatjar si no són text, i
 * la vista només pinta text també per a les files que no hi passen (la llavor,
 * app_content). Les píndoles dels Cursos de pedra en sec, les de sempre (Llei
 * del Píxel).
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';

import { buildEventsDetailSectionMeta } from './detailSectionMeta.jsx';
import { elementDeFilaPublicada } from '../../data/mapejadorSeccions.js';
import { CURSOS_PEDRA_EN_SEC_2026_EVENT } from '../mur/eventsSeed.js';

const t = (_, alternativa) => alternativa;
const pinta = (item) => render(buildEventsDetailSectionMeta({ t }).renderBody(item));
const pindoles = (container) => [...container.querySelectorAll('.badge-row .pill')].map((pill) => pill.textContent.trim());

afterEach(cleanup);

describe('P0-27 / IDEA-102 · el cos del detall d’un acte ja no pinta la fila de píndoles', () => {
  test('cap .badge-row ni .pill: el dia el diu el SquareBadge davall de l’entradilla (PageFrame)', () => {
    const { container } = pinta({ id: 'a', title: 'Hola', date: '2026-11-14', type: 'event', author_name: 'Veí', description: '<p>Cos</p>' });
    expect(container.querySelector('.badge-row')).toBeNull();
    expect(container.querySelector('.pill')).toBeNull();
    expect(pindoles(container)).toEqual([]);
    expect(container.textContent).toContain('Cos');
  });

  test('seguretat-01 · un date_label o type_label que no és text (app_content) continua sense tombar el detall', () => {
    const item = {
      id: 'h', title: 'Hola', date: '2026-11-14', type: 'event', author_name: 'Veí',
      date_label: JSON.parse('{"toString":0}'), type_label: JSON.parse('[{"toString":0}]')
    };
    expect(() => pinta(item)).not.toThrow();
    cleanup();
    const fila = elementDeFilaPublicada({
      id: 'p', sectionId: 'events', titol: 'Veí', createdAt: '2026-11-04T10:00:00Z', ownerUserId: 'U',
      payload: JSON.parse('{"title":"Acte","description":"<p>x</p>","date_label":{"trampa":1},"type_label":{"toString":0}}')
    });
    expect(() => pinta(fila)).not.toThrow();
  });

  test('Cursos de pedra en sec · sense píndoles (el quadrat «23–14 OCT–NOV» ve de calendar_badge)', () => {
    const { container } = pinta(CURSOS_PEDRA_EN_SEC_2026_EVENT);
    expect(pindoles(container)).toEqual([]);
  });
});
