import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import HerbariWorkspaceSection from './HerbariWorkspaceSection.jsx';
import { modelHerbariWorkspace } from './modelHerbariWorkspace.js';
import { ESPECIES_HERBARI_LA_TORRE_117, USOS_HERBARI_CANONICS } from '../../data/patrimoni/herbariLaTorre117.js';
import { TEXTOS_HERBARI } from './textosHerbari.js';
const m = vi.hoisted(() => ({ language: 'ca' }));
vi.mock('../../app/contexts/UIContext', async orig => ({ ...await orig(), useUIActions: () => ({ language: m.language, t: (_k, fallback) => fallback }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast() {} }) }));
beforeEach(() => { vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} }); vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); m.language = 'ca'; });
const munta = locutor => render(<MemoryRouter rutaInicial="/herbari-proposta"><HerbariWorkspaceSection locutor={locutor} /></MemoryRouter>);
const llista = () => document.getElementById('app-grid-list');
const detall = () => document.getElementById('app-grid-main');

test('117canonical source records keep identities, documentary provenance and use membership without a second model', () => {
  const before = JSON.stringify(ESPECIES_HERBARI_LA_TORRE_117);
  const model = modelHerbariWorkspace(TEXTOS_HERBARI.ca);
  expect(model.items).toHaveLength(117); expect(new Set(model.items.map(x => x.id)).size).toBe(117);
  model.items.forEach((item, i) => {
    const source = ESPECIES_HERBARI_LA_TORRE_117[i];
    expect(item.dades.usos).toBe(source.usos); expect(item.tipus).toBe('planta'); expect(item.font).toEqual(source.font);
    expect(item.dades).toEqual(source); expect(item.title).toBe(source.nomValencia);
    expect(item.categoryIds).toEqual(source.usos.map(us => `us-${USOS_HERBARI_CANONICS.indexOf(us)}`));
    expect(item).not.toHaveProperty('preu'); expect(item).not.toHaveProperty('comestible');
  });
  expect(JSON.stringify(ESPECIES_HERBARI_LA_TORRE_117)).toBe(before);
});

test('three actual Workspace columns, UniversalCards/square buttons and inline detail without a dialog', () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); munta();
  expect(document.getElementById('app-grid-sidebar')).toBeTruthy(); expect(llista()).toBeTruthy(); expect(detall()).toBeTruthy();
  expect(llista().querySelectorAll('article.sp-card')).toHaveLength(117);
  const square = within(llista()).getByRole('button', { name: 'Obri fitxa: Acacia robínia' });
  expect(square.className).toContain('sp-card-calendar-badge'); fireEvent.click(square);
  expect(within(detall()).getByRole('heading', { name: 'Acacia robínia' })).toBeTruthy();
  expect(within(detall()).getByText('Falsa acacia').getAttribute('lang')).toBe('es');
  expect(within(detall()).getByText('Black locust').getAttribute('lang')).toBe('en');
  expect(detall().textContent).toContain(ESPECIES_HERBARI_LA_TORRE_117[0].font.sha256);
  expect(detall().textContent).toContain('no acredita innocuïtat'); expect(screen.queryByRole('dialog')).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

test('the left use filter and accent-insensitive central search use the shared Workspace', () => {
  munta();
  fireEvent.click(screen.getByRole('button', { name: /^Tòxic/ }));
  expect(llista().querySelectorAll('article.sp-card')).toHaveLength(ESPECIES_HERBARI_LA_TORRE_117.filter(e => e.usos.includes('Tòxic')).length);
  fireEvent.click(screen.getByRole('button', { name: 'Tots' }));
  fireEvent.click(within(llista()).getByRole('button', { name: 'Cerca pel nom o pel paratge' }));
  fireEvent.change(within(llista()).getByRole('searchbox'), { target: { value: 'alber blanc' } });
  expect(llista().querySelectorAll('article.sp-card')).toHaveLength(1);
  expect(within(llista()).getByRole('heading', { name: 'Àlber blanc' })).toBeTruthy();
});

test('local private speech and five UI languages remain sourced from the existing Herbari', async () => {
  const locutor = { local: true, disponible: () => true, parla: vi.fn(async () => {}), atura: vi.fn() };
  const { rerender } = munta(locutor);
  fireEvent.click(within(llista()).getByRole('button', { name: 'Obri fitxa: Acacia robínia' }));
  await act(async () => fireEvent.click(within(detall()).getByRole('button', { name: TEXTOS_HERBARI.ca.veu })));
  expect(locutor.parla).toHaveBeenCalledWith(expect.stringContaining('Acacia robínia'), { privat: true, llengua: 'ca' });
  for (const language of Object.keys(TEXTOS_HERBARI)) {
    m.language = language; rerender(<MemoryRouter rutaInicial="/herbari-proposta"><HerbariWorkspaceSection locutor={{ ...locutor, local: false }} /></MemoryRouter>);
    expect(within(detall()).getByRole('button', { name: TEXTOS_HERBARI[language].veu }).disabled).toBe(true);
    expect(detall().textContent).toContain(TEXTOS_HERBARI[language].toxicitatDesconeguda);
    expect(within(detall()).getByText('Black locust').getAttribute('lang')).toBe('en');
  }
});


test('a documentary toxicity warning is preserved inline and never converted to safety', () => {
  munta();
  const species = ESPECIES_HERBARI_LA_TORRE_117.find(e => e.esToxica === true);
  fireEvent.click(within(llista()).getByRole('button', { name: `Obri fitxa: ${species.nomValencia}` }));
  expect(within(detall()).getByText(TEXTOS_HERBARI.ca.toxicitatAdvertida)).toBeTruthy();
  expect(within(detall()).queryByText(TEXTOS_HERBARI.ca.toxicitatDesconeguda)).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
});
