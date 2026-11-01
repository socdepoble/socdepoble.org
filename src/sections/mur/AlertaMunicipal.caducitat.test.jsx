/* T7 · S2 (assalt 261101) · RegioAlertesVigents diu fins quan és vigent
   cada avís: « · vigent fins a …» dins d'un <time dateTime> amb la data i
   l'hora absolutes, en la llengua i el locale de la interfície. Sense
   `caducaAl`, el <li> de sempre (Llei del Píxel per a qui no la passa). Cap
   regió viva nova dins de la regió, i cap compte enrere. */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../config/i18n.js';

const mocks = vi.hoisted(() => ({ t: null, locale: null }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ externalConfig: {} }),
  useUIStateOpcional: () => (mocks.locale ? { locale: mocks.locale } : null),
  useUIActions: () => ({ t: mocks.t ?? ((_, reserva) => reserva) }),
  useUIActionsOpcional: () => (mocks.t ? { t: mocks.t } : null)
}));
import { RegioAlertesVigents } from './AlertaMunicipal.jsx';
import { OPCIONS_CADUCITAT } from './alertesMunicipals.js';

beforeEach(() => { mocks.t = null; mocks.locale = null; });
afterEach(() => cleanup());

const AIGUA = Object.freeze({ id: 'aigua', type: 'feed', title: 'Tall d’aigua dimecres' });
const PLUGES = Object.freeze({ id: 'pluges', type: 'feed', title: 'Pluges fortes' });
const QUAN = Date.parse('2026-11-03T13:05:00.000Z');
const format = (locale) => new Intl.DateTimeFormat(locale, OPCIONS_CADUCITAT).format(new Date(QUAN));
const regio = (alertes) => render(<RegioAlertesVigents activa alertes={alertes} />).container.querySelector('[role="status"]');

describe('amb caducaAl', () => {
  test('en valencià (sense traductor): « · vigent fins a …» amb la data absoluta en ca-ES i el <time dateTime> ISO', () => {
    const viva = regio([{ item: AIGUA, tipus: 'bandol_urgent', caducaAl: QUAN }]);
    const [li] = viva.querySelectorAll('li');
    expect(li.textContent).toBe(`Bàndol urgent: Tall d’aigua dimecres · vigent fins a ${format('ca-ES')}`);
    const temps = li.querySelector('time');
    expect(temps.getAttribute('dateTime')).toBe('2026-11-03T13:05:00.000Z');
    // El <time> és només la data; la frase l'envolta.
    expect(temps.textContent).toBe(format('ca-ES'));
    expect(temps.previousSibling.textContent).toBe('vigent fins a ');
    // L'enllaç continua sent el nom de l'avís, sense la data.
    expect(li.querySelector('a').textContent).toBe('Tall d’aigua dimecres');
  });

  test('en anglés, amb el locale de la interfície (en-GB)', () => {
    mocks.t = createTranslator('en');
    mocks.locale = 'en-GB';
    const viva = regio([{ item: AIGUA, tipus: 'bandol_urgent', caducaAl: QUAN }]);
    expect(viva.querySelector('li').textContent).toBe(`Urgent public notice: Tall d’aigua dimecres · valid until ${format('en-GB')}`);
    expect(viva.querySelector('time').textContent).toBe(format('en-GB'));
    expect(format('en-GB')).not.toBe(format('ca-ES'));
  });

  test('en basc, el buit {data} pot anar a qualsevol lloc de la frase (eu-ES)', () => {
    mocks.t = createTranslator('eu');
    mocks.locale = 'eu-ES';
    const li = regio([{ item: AIGUA, tipus: 'bandol_urgent', caducaAl: QUAN }]).querySelector('li');
    const frase = createTranslator('eu')('section.mur.alertes.vigentFins');
    expect(frase).toContain('{data}');
    expect(li.textContent.endsWith(` · ${frase.replace('{data}', format('eu-ES'))}`)).toBe(true);
    expect(li.querySelector('time').textContent).toBe(format('eu-ES'));
  });

  test('cada avís porta la seua data; dins de la regió no hi ha cap altra regió viva', () => {
    const viva = regio([
      { item: PLUGES, tipus: 'alerta', caducaAl: QUAN },
      { item: AIGUA, tipus: 'bandol_urgent', caducaAl: QUAN + 3_600_000 }
    ]);
    const temps = [...viva.querySelectorAll('li time')].map((t) => t.getAttribute('dateTime'));
    expect(temps).toEqual(['2026-11-03T13:05:00.000Z', '2026-11-03T14:05:00.000Z']);
    expect(viva.querySelector('[role], [aria-live]')).toBeNull();
  });

  test('cap compte enrere: el text no diu «queden», «falten» ni minuts relatius', () => {
    const viva = regio([{ item: AIGUA, tipus: 'bandol_urgent', caducaAl: QUAN }]);
    expect(viva.textContent).not.toMatch(/queden|falten|d’ací a|en \d+ min/i);
  });
});

describe('sense caducaAl, el DOM de sempre', () => {
  test('cap <time> ni separador: el <li> és el d’abans', () => {
    const viva = regio([{ item: AIGUA, tipus: 'bandol_urgent' }, { item: PLUGES, tipus: 'alerta', caducaAl: null }]);
    expect([...viva.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'Bàndol urgent: Tall d’aigua dimecres', 'Alerta municipal: Pluges fortes'
    ]);
    expect(viva.querySelector('time')).toBeNull();
    expect([...viva.querySelectorAll('li')].map((li) => li.childNodes.length)).toEqual([3, 3]);
  });

  test('una caducitat fora del rang de Date (data triada absurda) no tomba la regió: el <li> de sempre', () => {
    const viva = regio([{ item: AIGUA, tipus: 'bandol_urgent', caducaAl: 8.64e15 + 72 * 3_600_000 }]);
    expect(viva.querySelector('li').textContent).toBe('Bàndol urgent: Tall d’aigua dimecres');
    expect(viva.querySelector('time')).toBeNull();
  });
});
