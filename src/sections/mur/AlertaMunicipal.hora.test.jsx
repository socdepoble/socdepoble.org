/* Gauntlet transversal 261101 (VC-01) · A 1280 px, la línia «vigent fins a …»
   de l'avís del Mur tallava «a les» a final de línia i deixava l'hora sola a
   la següent. L'hora, amb les paraules que la presenten en cada locale, va
   ara en un sol tros que no es parteix (.sdp-mur-alertes__hora, nowrap); la
   data sí que pot baixar de línia, perquè a 375 px no hi cap sencera. El text
   del <time> és el de sempre, caràcter a caràcter. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
import { OPCIONS_CADUCITAT, dataDeCaducitat, trossosDeCaducitat } from './alertesMunicipals.js';

beforeEach(() => { mocks.t = null; mocks.locale = null; });
afterEach(() => cleanup());

const AIGUA = Object.freeze({ id: 'aigua', type: 'feed', title: 'Tall d’aigua al nucli antic' });
const QUAN = Date.parse('2026-11-03T13:05:00.000Z');
const HORA = '\\d{2}:\\d{2}';

describe('trossosDeCaducitat (pura)', () => {
  test('les cinc llengües de la interfície: la data i l\'hora amb les seues paraules, i junts fan dataDeCaducitat', () => {
    const casos = [
      ['ca-ES', new RegExp(`^a les ${HORA}$`), /, $/],
      ['es-ES', new RegExp(`^${HORA}$`), /, $/],
      ['en-GB', new RegExp(`^at ${HORA}$`), / $/],
      ['eu-ES', new RegExp(`^\\(${HORA}\\)$`), / $/],
      ['gl-ES', new RegExp(`^${HORA}$`), /, $/]
    ];
    for (const [locale, hora, finalDeLaData] of casos) {
      const trossos = trossosDeCaducitat(QUAN, locale);
      expect([locale, trossos.data + trossos.hora]).toEqual([locale, dataDeCaducitat(QUAN, locale)]);
      expect(trossos.hora, locale).toMatch(hora);
      expect(trossos.data, locale).toMatch(finalDeLaData);
    }
  });

  test('els caràcters són els de format(), també quan formatToParts hi posa un altre espai (en-US, «PM»)', () => {
    const trossos = trossosDeCaducitat(QUAN, 'en-US');
    expect(trossos.data + trossos.hora).toBe(new Intl.DateTimeFormat('en-US', OPCIONS_CADUCITAT).format(new Date(QUAN)));
    expect(trossos.hora).toMatch(new RegExp(`^at ${HORA}\\s[AP]M$`));
  });

  test('sense locale o amb un de no vàlid, el valencià; sense data representable, dos buits', () => {
    expect(trossosDeCaducitat(QUAN)).toEqual(trossosDeCaducitat(QUAN, 'ca-ES'));
    expect(trossosDeCaducitat(QUAN, 'no-és-cap-locale!')).toEqual(trossosDeCaducitat(QUAN, 'ca-ES'));
    for (const absurda of [NaN, Infinity, 8.64e15 + 1, null, undefined, '2026-11-03']) {
      expect(trossosDeCaducitat(absurda, 'ca-ES')).toEqual({ data: '', hora: '' });
    }
  });
});

describe('l\'avís del Mur', () => {
  const temps = () => render(<RegioAlertesVigents activa alertes={[{ item: AIGUA, tipus: 'alerta', caducaAl: QUAN }]} />)
    .container.querySelector('[role="status"] li time');

  test('en valencià: la data, text del <time>; l\'hora amb «a les», dins de .sdp-mur-alertes__hora', () => {
    const t = temps();
    const { data, hora } = trossosDeCaducitat(QUAN, 'ca-ES');
    expect(t.textContent).toBe(dataDeCaducitat(QUAN, 'ca-ES'));
    expect(t.childNodes).toHaveLength(2);
    expect(t.firstChild.nodeType).toBe(Node.TEXT_NODE);
    expect(t.firstChild.textContent).toBe(data);
    const tros = t.lastChild;
    expect(tros.tagName).toBe('SPAN');
    expect(tros.className).toBe('sdp-mur-alertes__hora');
    expect(tros.textContent).toBe(hora);
    expect(hora).toMatch(new RegExp(`^a les ${HORA}$`));
    // Cap regió viva nova ni cap atribut que canvie el que llig un lector.
    expect(tros.attributes).toHaveLength(1);
  });

  test('en basc, el parèntesi va amb l\'hora (eu-ES)', () => {
    mocks.t = createTranslator('eu');
    mocks.locale = 'eu-ES';
    const tros = temps().querySelector('.sdp-mur-alertes__hora');
    expect(tros.textContent).toMatch(new RegExp(`^\\(${HORA}\\)$`));
  });
});

describe('la regla de modules.css', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const net = (text) => text.replace(/\s+/g, ' ').trim();

  test('.sdp-mur-alertes__hora només impedix el salt de línia, dins de la capa components de les alertes del Mur', () => {
    const regles = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => net(m[1]) === '.sdp-mur-alertes__hora');
    expect(regles).toHaveLength(1);
    expect(net(regles[0][2])).toBe('white-space: nowrap;');
    // A la mateixa capa que l'enllaç de l'avís (.sdp-mur-alertes__enllac), no a legacy.
    const capa = css.lastIndexOf('@layer components {', regles[0].index);
    expect(capa).toBeGreaterThan(-1);
    expect(css.slice(capa, regles[0].index)).toContain('.sdp-mur-alertes__enllac');
    expect(css.slice(capa, regles[0].index)).not.toMatch(/@layer\s+legacy/);
  });

  test('el <time> sencer no porta cap nowrap: la data es pot partir a 375 px', () => {
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/sdp-mur-alertes|sdp-alerta/.test(m[1]) && /\btime\b/.test(m[1])) expect(net(m[2])).not.toContain('nowrap');
    }
  });
});
