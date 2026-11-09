import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';

const route = vi.hoisted(() => ({ value: '' }));
const sources = vi.hoisted(() => ({ map: null, console: null, packages: null, government: null }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ '*': route.value }), useNavigate: () => vi.fn(),
  Navigate: ({ to }) => <p>{to}</p>, Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));
// This captures the actual consumer-to-shell contract; real layout is checked in Chrome.
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, topBarData, time, date, dateTime, children }) => <main><header className="page-title"><h1>{title}</h1></header><output data-testid="date-contract">{JSON.stringify(topBarData ?? { time, date, dateTime })}</output>{children}</main>
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ locale: 'ca-ES' }), useUIActions: () => ({ t: (_key, fallback) => fallback }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('./mapa/useMapa.js', () => ({ useMapa: () => ({ estat: sources.map ? 'ready' : 'absent', mapa: sources.map, error: null, carrega: vi.fn() }) }));
vi.mock('./consolaContent.js', async original => ({ ...(await original()), carregaConsola: () => Promise.resolve(sources.console) }));
vi.mock('./empaquetats.js', async original => ({ ...(await original()), carregaEmpaquetats: () => Promise.resolve(sources.packages) }));
vi.mock('./govern/useGovern.js', () => ({ useGovern: () => sources.government }));

import ConsolaSection from './ConsolaSection.jsx';
import { copyConsola } from './consolaPagines.js';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { normalitzaEmpaquetats } from './empaquetats.js';
import { normalitzaMcr } from './govern/matriuGovern.js';

const fixedRoutes = ['', 'pols', 'explorador', 'fluxos', 'calendari', 'inventari', 'entrades', 'agents', 'actors', 'salut', 'empaquetats', 'govern/requeriments', 'govern/balanc', 'govern/certificacio', 'govern/comunicacio'];
function emptyGovernment() {
  return { servidor: { estat: 'absent', error: null, carrega: vi.fn(), generat: null }, matriu: null, head: null,
    trasllat: null, origen: null, origenTrasllat: null, nomFitxer: null, nomTrasllat: null, errorFitxer: null,
    llegintFitxer: false, empremtes: null, errorEmpremtes: null, rebutjos: { matriu: 0, trasllat: 0 },
    certificacions: { registres: [], persistent: false, error: null }, obriMatriu: vi.fn(), obriTrasllat: vi.fn(), tancaFitxers: vi.fn() };
}
function mapAt(generat) { return { schema: 'sdp.mapa.v1', generat, nodes: [], arestes: [], tasques: [], avisos: [], salut: [] }; }
function consoleAt(generat) { return { generat, skills: [], rebuts: [], consums: [], credits: null, segell: null, immunitari: { operacions: 0 } }; }
function packagesAt(generat) {
  return normalitzaEmpaquetats({ schema: 'sdp.empaquetats.v1', generat, canonica: '1.1.0', carpeta: false,
    plataformes: Object.fromEntries(['android', 'ios', 'pwa', 'wordpress'].map(id => [id, { versions: [], builds: [], font: 'fixture/' + id, artefactes: [] }])) });
}
async function open(value) {
  route.value = value;
  const view = render(<ConsolaSection />);
  await act(async () => {});
  return view;
}
const metadata = () => JSON.parse(screen.getByTestId('date-contract').textContent);
const expected = generat => dataHoraDeBarra({ creat: copyConsola().date, modificat: generat });
beforeEach(() => { sources.government = emptyGovernment(); });
afterEach(() => {
  cleanup(); localStorage.clear(); vi.restoreAllMocks();
  route.value = ''; sources.map = null; sources.console = null; sources.packages = null; sources.government = null;
});

for (const value of fixedRoutes) {
  test('real copy date without snapshots at /consola/' + value, async () => {
    await open(value);
    expect(metadata()).toEqual(expected(null));
  });
}

test('source attribution: map pages, pulse, packages and government use their own source only', async () => {
  sources.map = mapAt('2031-02-03T12:34:00Z');
  sources.console = consoleAt('2030-01-02T04:56:00Z');
  sources.packages = packagesAt('2032-04-05T06:07:00Z');
  sources.government.matriu = normalitzaMcr({ at: '2033-06-07T08:09:00Z', baseline_head: 'a'.repeat(40), requirements: [], statuses: {} });
  for (const value of fixedRoutes.slice(1)) {
    const stamp = value === 'pols' ? sources.console.generat : value === 'empaquetats' ? sources.packages.generat
      : value === 'govern/certificacio' ? null : value.startsWith('govern/') ? sources.government.matriu.at : sources.map.generat;
    await open(value);
    expect(metadata(), value).toEqual(expected(stamp));
    cleanup();
  }
});

test('dashboard selects the latest real loaded source, preserving day-only precision', async () => {
  sources.map = mapAt('2031-02-03');
  sources.console = consoleAt('2030-01-02T04:56:00Z');
  sources.packages = packagesAt('2034-07-08');
  sources.government.servidor.generat = 'not-a-date';
  await open('');
  expect(metadata()).toEqual({ time: '', date: '08/07/34', dateTime: '2034-07-08' });
});

test('invalid snapshot cannot replace real copy date; clock changes do not publish a new version', async () => {
  sources.map = mapAt('2026-02-30');
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2040-01-01T00:00:00Z'));
  const view = await open('explorador');
  expect(metadata()).toEqual(expected(null));
  Date.now.mockReturnValue(Date.parse('2050-09-09T00:00:00Z'));
  view.rerender(<ConsolaSection />);
  expect(metadata()).toEqual(expected(null));
});

test('a stale snapshot never replaces a newer copy version', async () => {
  sources.map = mapAt('2020-01-01T12:00:00Z');
  await open('explorador');
  expect(metadata()).toEqual(expected(null));
});

test('map card and its page carry the same real publication instant', async () => {
  sources.map = mapAt('2031-02-03T12:34:00Z');
  await open('');
  const link = document.querySelector('a[href="/consola/explorador"].sp-card-link-overlay');
  expect(link).not.toBeNull();
  const cardDate = link.closest('article').querySelector('time').getAttribute('datetime');
  cleanup();
  await open('explorador');
  expect(metadata().dateTime).toBe(cardDate);
});
