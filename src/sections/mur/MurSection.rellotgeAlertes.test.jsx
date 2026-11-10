/**
 * T7 · S2 (assalt 261101) · El rellotge de les alertes al Mur (MurSection +
 * useRellotgeAlertes + RegioAlertesVigents), amb el mateix arnés de
 * MurSection.alertes.test.jsx i el temps fals:
 *  · una alerta de l'ajuntament de fa 71 h 59 min és dalt i a la regió viva,
 *    amb «vigent fins a …» (data absoluta);
 *  · quan passa el minut que li queda, sense cap canvi de dades, ix de la
 *    regió (que continua sent el mateix node) i la seua targeta torna al seu
 *    lloc cronològic, amb el distintiu;
 *  · en tornar a la pestanya després d'hores amagada, el Mur es posa al dia;
 *  · un toc amb el rellotge avançat no amaga per sempre una alerta vigent:
 *    quan l'hora es corregix, les dades noves la tornen a pintar;
 *  · sense cap alerta, cap temporitzador del rellotge.
 */
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), t: (_, alternativa) => alternativa, core: {}, mur: {},
  capacitats: new Set(['directoriEntitats']), directori: vi.fn()
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', async original => ({ ...await original(),
  useUIActions: () => ({ t: mocks.t }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('./MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat),
  listPublicOrganizations: (...args) => mocks.directori(...args)
}));
import MurSection from './MurSection.jsx';
import { MIN_ESPERA_MS, VIGENCIA_ALERTA_MS, dataDeCaducitat } from './alertesMunicipals.js';

const AJUNTAMENT = '7d2c1a40-0000-4000-8000-00000000a1a1';
const DIRECTORI = [{ id: AJUNTAMENT, slug: 'ajuntament', name: 'Ajuntament', kind: 'city_hall' }];
const ARA = Date.parse('2026-11-01T12:00:00.000Z');
const MINUT = 60 * 1000;
const HORA = 60 * MINUT;
const fa = (ms) => new Date(ARA - ms).toISOString();
const publicacio = (camps) => ({ type: 'feed', ...camps });

const titols = () => [...document.querySelectorAll('.sdp-card-grid .sp-card-title')].map((titol) => titol.textContent);
const targeta = (titol) => [...document.querySelectorAll('.sdp-card-grid article')].find((a) => a.querySelector('.sp-card-title')?.textContent === titol);
const regio = (container) => container.querySelector('.content-wrapper > [role="status"]');
const avisos = (viva) => [...viva.querySelectorAll('li')].map((li) => li.textContent);
/* El directori respon amb una promesa: es buiden les microtasques dins d'act. */
const buida = async () => { for (let i = 0; i < 5; i += 1) await act(async () => {}); };
const fixaMur = (feed) => { mocks.mur = { status: 'ready', error: null, sortedEvents: [], sortedMarketItems: [], sortedFeedPosts: feed }; };

/* Fa 71 h 59 min: li queda un minut. */
const AIGUA = publicacio({ id: 'aigua', title: 'Tall d’aigua', created_at: fa(VIGENCIA_ALERTA_MS - MINUT), labels: ['Bàndol urgent'], author_org_id: AJUNTAMENT });
const PLUJA = publicacio({ id: 'pluja', title: 'Pluges', created_at: fa(2 * HORA), labels: ['Emergència'], author_org_id: AJUNTAMENT });
const NOVA = publicacio({ id: 'nova', title: 'Crònica de hui', created_at: fa(HORA), labels: ['Publicació'] });

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  vi.setSystemTime(ARA);
  mocks.capacitats = new Set(['directoriEntitats']);
  mocks.directori.mockImplementation(async () => DIRECTORI);
  mocks.core = { status: 'ready', error: null, pageCopy: {} };
  fixaMur([]);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
});

describe('una alerta que caduca amb el Mur obert', () => {
  test('ix de dalt i de la regió viva quan passa el seu minut, sense recarregar res', async () => {
    fixaMur([NOVA, PLUJA, AIGUA]);
    const { container } = render(<MurSection />);
    await buida();

    const viva = regio(container);
    expect(titols()).toEqual(['Pluges', 'Tall d’aigua', 'Crònica de hui']);
    expect(avisos(viva)).toEqual([
      `Alerta municipal: Pluges · vigent fins a ${dataDeCaducitat(ARA - 2 * HORA + VIGENCIA_ALERTA_MS, 'ca-ES')}`,
      `Bàndol urgent: Tall d’aigua · vigent fins a ${dataDeCaducitat(ARA + MINUT, 'ca-ES')}`
    ]);
    expect(viva.querySelectorAll('time')[1].getAttribute('dateTime')).toBe(new Date(ARA + MINUT).toISOString());

    // Encara és vigent just a l'hora de caducar.
    act(() => { vi.advanceTimersByTime(MINUT - MIN_ESPERA_MS); });
    expect(avisos(viva)).toHaveLength(2);

    act(() => { vi.advanceTimersByTime(MIN_ESPERA_MS + 1); });
    expect(regio(container)).toBe(viva);
    expect(viva.querySelector('.sdp-alerta__titol').textContent).toBe('Hi ha 1 avís municipal urgent');
    expect(avisos(viva)).toEqual([`Alerta municipal: Pluges · vigent fins a ${dataDeCaducitat(ARA - 2 * HORA + VIGENCIA_ALERTA_MS, 'ca-ES')}`]);
    // La targeta torna al seu lloc cronològic, amb el distintiu de sempre.
    expect(titols()).toEqual(['Pluges', 'Crònica de hui', 'Tall d’aigua']);
    expect(targeta('Tall d’aigua').querySelector('.sdp-mur-alerta').textContent).toBe('Bàndol urgent');
    // Ningú no ha tornat a demanar res al directori.
    expect(mocks.directori).toHaveBeenCalledTimes(1);

    // I la segona, quan li toca: la regió es queda muntada i buida.
    act(() => { vi.advanceTimersByTime(70 * HORA); });
    expect(regio(container)).toBe(viva);
    expect(viva.textContent).toBe('');
    expect(titols()).toEqual(['Crònica de hui', 'Pluges', 'Tall d’aigua']);
    // Sense cap alerta vigent, el rellotge es desarma del tot.
    expect(vi.getTimerCount()).toBe(0);
  });

  test('un rellotge avançat que es corregix no amaga per sempre una alerta vigent (dades noves la tornen a pintar)', async () => {
    // Fa 48 h: li queden 24 h de vigència real.
    const BANDOL = publicacio({ id: 'bandol', title: 'Bàndol de fires', created_at: fa(48 * HORA), labels: ['Bàndol urgent'], author_org_id: AJUNTAMENT });
    fixaMur([NOVA, BANDOL]);
    const { container, rerender } = render(<MurSection />);
    await buida();
    expect(avisos(regio(container))).toEqual([`Bàndol urgent: Bàndol de fires · vigent fins a ${dataDeCaducitat(ARA + 24 * HORA, 'ca-ES')}`]);

    // El dispositiu torna a la pestanya amb el rellotge dos dies avançat: per
    // a ell, el bàndol ja ha caducat.
    vi.setSystemTime(ARA + 48 * HORA);
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(regio(container).textContent).toBe('');

    // L'hora es corregix i arriben dades noves: el bàndol torna dalt i a la regió.
    vi.setSystemTime(ARA + MINUT);
    fixaMur([publicacio({ id: 'mes-nova', title: 'Una altra crònica', created_at: new Date(ARA + MINUT / 2).toISOString(), labels: ['Publicació'] }), NOVA, BANDOL]);
    rerender(<MurSection />);
    await buida();
    expect(avisos(regio(container))).toEqual([`Bàndol urgent: Bàndol de fires · vigent fins a ${dataDeCaducitat(ARA + 24 * HORA, 'ca-ES')}`]);
    expect(titols()[0]).toBe('Bàndol de fires');
  });

  test('en tornar a la pestanya després d’hores amagada, el Mur es posa al dia', async () => {
    fixaMur([NOVA, PLUJA, AIGUA]);
    const { container } = render(<MurSection />);
    await buida();
    expect(avisos(regio(container))).toHaveLength(2);

    // El temporitzador s'ha endarrerit en segon pla: el rellotge de paret ha
    // avançat tres hores i el temporitzador encara no ha tocat.
    vi.setSystemTime(ARA + 3 * HORA);
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(avisos(regio(container))).toEqual([`Alerta municipal: Pluges · vigent fins a ${dataDeCaducitat(ARA - 2 * HORA + VIGENCIA_ALERTA_MS, 'ca-ES')}`]);
    expect(titols()).toEqual(['Pluges', 'Crònica de hui', 'Tall d’aigua']);
  });
});

describe('sense alertes, el Mur de sempre', () => {
  test('cap temporitzador del rellotge ni escolta de la pestanya', async () => {
    const escolta = vi.spyOn(document, 'addEventListener');
    fixaMur([NOVA, publicacio({ id: 'gat', title: 'Gat perdut', created_at: fa(2 * HORA), labels: ['Alerta'], ownerUserId: 'u-vei' })]);
    const { container } = render(<MurSection />);
    await buida();
    expect(regio(container)).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    expect(escolta.mock.calls.filter(([tipus]) => tipus === 'visibilitychange')).toEqual([]);
    escolta.mockRestore();
  });
});
