/* T7 · P1-22 (261101) · Les alertes municipals del Mur (carril B3), en la
   llengua de la interfície: el distintiu de la targeta («Alerta municipal»,
   «Bàndol urgent»), el títol de l'avís de les vigents («Hi ha 1 avís
   municipal urgent», «Hi ha {n} avisos municipals urgents») i el nom de cada
   avís de la llista. Fora de l'app (sense traductor), el valencià de sempre:
   cap text canvia (Llei del Píxel).
   Gauntlet 2 · 261101 (G2-B3-01) · I la descripció accessible de l'enllaç de
   la targeta (aria-describedby), que diu el mateix que el distintiu visible. */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../config/i18n.js';

const mocks = vi.hoisted(() => ({ t: null }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
/* Dins de l'app, useUIActions sempre porta el traductor; sense `mocks.t`, el
   que torna la reserva (el valencià), com el de les proves d'AlertaMunicipal.test.jsx. */
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ externalConfig: {} }),
  useUIStateOpcional: () => ({ externalConfig: {} }),
  useUIActions: () => ({ t: mocks.t ?? ((_, reserva) => reserva) }),
  useUIActionsOpcional: () => (mocks.t ? { t: mocks.t } : null)
}));
import { DistintiuAlertaMunicipal, RegioAlertesVigents } from './AlertaMunicipal.jsx';
import { TargetaDelMur } from './TargetaDelMur.jsx';
import { TEXTOS_ALERTES, TIPUS_ALERTA } from './alertesMunicipals.js';

beforeEach(() => { mocks.t = null; });
afterEach(() => cleanup());

const AIGUA = Object.freeze({ id: 'aigua', type: 'feed', title: 'Tall d’aigua dimecres' });
const PLUGES = Object.freeze({ id: 'pluges', type: 'feed', title: 'Pluges fortes' });
const distintiu = (tipus) => render(<DistintiuAlertaMunicipal tipus={tipus} />).container.querySelector('.sdp-mur-alerta').textContent;
/* [el distintiu visible, la descripció accessible de l'enllaç de la targeta]. */
const PUBLICACIO = Object.freeze({
  id: 'aigua', type: 'feed', title: 'Tall d’aigua dimecres', description: 'Obres a la xarxa.',
  created_at: '2026-11-01T08:00:00.000Z', labels: ['Bàndol urgent'], author_org_id: 'aj-1', author_name: 'Ajuntament'
});
const targeta = (tipus) => {
  const { container } = render(<TargetaDelMur item={PUBLICACIO} alertaMunicipal={tipus} />);
  const enllac = container.querySelector('a.sp-card-link-overlay');
  return [container.querySelector('.sdp-mur-alerta').textContent, document.getElementById(enllac.getAttribute('aria-describedby')).textContent];
};
const regio = (alertes) => {
  const { container } = render(<RegioAlertesVigents activa alertes={alertes} />);
  return [
    container.querySelector('.sdp-alerta__titol').textContent,
    [...container.querySelectorAll('li')].map((li) => li.textContent)
  ];
};

describe('les reserves són el valencià del diccionari', () => {
  test('TIPUS_ALERTA (text i parell) i TEXTOS_ALERTES', () => {
    const ca = createTranslator('ca');
    for (const { etiqueta, text } of Object.values(TIPUS_ALERTA)) {
      expect([etiqueta[0], ca(etiqueta[0])]).toEqual([etiqueta[0], text]);
      expect(etiqueta[1]).toBe(text);
    }
    for (const [clau, reserva] of Object.values(TEXTOS_ALERTES)) expect([clau, ca(clau)]).toEqual([clau, reserva]);
  });
});

describe('en la llengua de la interfície', () => {
  test('anglés: el distintiu, el títol (un i diversos) i el nom de cada avís', () => {
    mocks.t = createTranslator('en');
    expect(distintiu('alerta')).toBe('Municipal alert');
    cleanup();
    expect(distintiu('bandol_urgent')).toBe('Urgent public notice');
    cleanup();
    expect(regio([{ item: AIGUA, tipus: 'bandol_urgent' }])).toEqual([
      'There is 1 urgent municipal notice', ['Urgent public notice: Tall d’aigua dimecres']
    ]);
    cleanup();
    expect(regio([{ item: AIGUA, tipus: 'bandol_urgent' }, { item: PLUGES, tipus: 'alerta' }])).toEqual([
      'There are 2 urgent municipal notices', ['Urgent public notice: Tall d’aigua dimecres', 'Municipal alert: Pluges fortes']
    ]);
  });

  test('G2-B3-01 · la targeta: la descripció accessible de l’enllaç diu el que diu el distintiu', () => {
    mocks.t = createTranslator('en');
    expect(targeta('alerta')).toEqual(['Municipal alert', 'Municipal alert']);
    cleanup();
    expect(targeta('bandol_urgent')).toEqual(['Urgent public notice', 'Urgent public notice']);
    for (const llengua of ['es', 'eu', 'gl']) {
      cleanup();
      mocks.t = createTranslator(llengua);
      const [visible, descrit] = targeta('bandol_urgent');
      expect(descrit, llengua).toBe(visible);
      expect(descrit, llengua).not.toBe('Bàndol urgent');
    }
  });

  test('castellà i gallec: el nombre es posa al seu lloc', () => {
    mocks.t = createTranslator('es');
    expect(regio([{ item: AIGUA, tipus: 'alerta' }, { item: PLUGES, tipus: 'alerta' }])[0]).toBe('Hay 2 avisos municipales urgentes');
    cleanup();
    mocks.t = createTranslator('gl');
    expect(distintiu('bandol_urgent')).toBe('Bando urxente');
  });
});

describe('sense traductor (fora de l’app): el valencià de sempre', () => {
  test('el distintiu, el títol i la llista', () => {
    expect(distintiu('alerta')).toBe('Alerta municipal');
    cleanup();
    expect(distintiu('bandol_urgent')).toBe('Bàndol urgent');
    cleanup();
    expect(regio([{ item: AIGUA, tipus: 'bandol_urgent' }])).toEqual([
      'Hi ha 1 avís municipal urgent', ['Bàndol urgent: Tall d’aigua dimecres']
    ]);
    cleanup();
    expect(regio([{ item: AIGUA, tipus: 'bandol_urgent' }, { item: PLUGES, tipus: 'alerta' }, { item: { ...PLUGES, id: 'p2' }, tipus: 'alerta' }])[0])
      .toBe('Hi ha 3 avisos municipals urgents');
    cleanup();
    expect(targeta('bandol_urgent')).toEqual(['Bàndol urgent', 'Bàndol urgent']);
    cleanup();
    expect(targeta('alerta')).toEqual(['Alerta municipal', 'Alerta municipal']);
  });
});
