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

describe('seguretat-01 · les píndoles del detall d’un acte només pinten text', () => {
  test('un date_label o un type_label que no és text (app_content) no tomba el detall: la reserva de quan falta', () => {
    const item = {
      id: 'h', title: 'Hola', date: '2026-11-14', type: 'event', author_name: 'Veí',
      date_label: JSON.parse('{"toString":0}'), type_label: JSON.parse('[{"toString":0}]')
    };
    let container = null;
    expect(() => { ({ container } = pinta(item)); }).not.toThrow();
    expect(pindoles(container)).toEqual(['2026-11-14', 'event', 'Veí']);
  });

  test('la publicació d’un veí amb date_label i type_label hostils es pinta', () => {
    const item = elementDeFilaPublicada({
      id: 'p', sectionId: 'events', titol: 'Veí', createdAt: '2026-11-04T10:00:00Z', ownerUserId: 'U',
      payload: JSON.parse('{"title":"Acte","description":"<p>x</p>","date_label":{"trampa":1},"type_label":{"toString":0}}')
    });
    let container = null;
    expect(() => { ({ container } = pinta(item)); }).not.toThrow();
    expect(pindoles(container)).toEqual(['', 'Agenda', 'Veí']);
  });

  test('un número es pinta com el seu text, i un valor buit cau a la reserva, com abans', () => {
    expect(pindoles(pinta({ id: 'n', date: '2026-11-14', type: 'event', date_label: 5, type_label: 7 }).container)).toEqual(['5', '7', 'Organització']);
    cleanup();
    expect(pindoles(pinta({ id: 'z', date: '2026-11-14', type: 'event', date_label: 0, type_label: '' }).container)).toEqual(['2026-11-14', 'event', 'Organització']);
  });

  test('Llei del Píxel · les píndoles dels Cursos de pedra en sec, les de sempre', () => {
    const { container } = pinta(CURSOS_PEDRA_EN_SEC_2026_EVENT);
    expect(pindoles(container)).toEqual([
      '23, 24, 30 i 31 d’octubre (Fageca) · 6, 7 i 14 de novembre de 2026 (Alcosser)',
      'Curs teoricopràctic',
      'El Rentonar'
    ]);
  });
});
