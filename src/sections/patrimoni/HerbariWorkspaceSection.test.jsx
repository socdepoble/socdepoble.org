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
/* R16b (tercera ronda) · Amb `page`, el detall passa per la TextSection de veres; només se substituïxen
   la UniversalPage (la seua maquinària no entra en joc) i el <head> (useSEO), com a TextSection.test.jsx. */
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <div data-pagina="herbari">{children}</div> }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
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
  expect(llista().querySelectorAll('.sdp-gestor-fitxa')).toHaveLength(117);
  const square = within(llista()).getByRole('button', { name: 'Acacia robínia', exact: true });
  expect(square.className).toContain('sdp-gestor-fitxa'); fireEvent.click(square);
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
  expect(llista().querySelectorAll('.sdp-gestor-fitxa')).toHaveLength(ESPECIES_HERBARI_LA_TORRE_117.filter(e => e.usos.includes('Tòxic')).length);
  fireEvent.click(screen.getByRole('button', { name: 'Tots' }));
  fireEvent.click(within(llista()).getByRole('button', { name: 'Cerca pel nom o pel paratge' }));
  fireEvent.change(within(llista()).getByRole('searchbox'), { target: { value: 'alber blanc' } });
  expect(llista().querySelectorAll('.sdp-gestor-fitxa')).toHaveLength(1);
  expect(within(llista()).getByRole('button', { name: 'Àlber blanc', exact: true })).toBeTruthy();
});

test('local private speech and five UI languages remain sourced from the existing Herbari', async () => {
  const locutor = { local: true, disponible: () => true, parla: vi.fn(async () => {}), atura: vi.fn() };
  const { rerender } = munta(locutor);
  fireEvent.click(within(llista()).getByRole('button', { name: 'Acacia robínia', exact: true }));
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
  fireEvent.click(within(llista()).getByRole('button', { name: species.nomValencia, exact: true }));
  expect(within(detall()).getByText(TEXTOS_HERBARI.ca.toxicitatAdvertida)).toBeTruthy();
  expect(within(detall()).queryByText(TEXTOS_HERBARI.ca.toxicitatDesconeguda)).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
});

/* R16b · La capçalera de la fitxa porta el botó de tornar (onClose del Workspace): tanca la fitxa i torna al text
   documental, en cada llengua de la interfície. La fitxa és la de sempre (FitxaHerbari): cap fitxa científica. */
test('the back button in the species header closes the inline record and returns to the documentary text', () => {
  for (const language of Object.keys(TEXTOS_HERBARI)) {
    m.language = language;
    const vista = munta();
    fireEvent.click(within(llista()).getByRole('button', { name: 'Acacia robínia' }));
    expect(within(detall()).getByRole('heading', { name: 'Acacia robínia' })).toBeTruthy();
    fireEvent.click(within(detall()).getByRole('button', { name: `← ${TEXTOS_HERBARI[language].titol}` }));
    expect(within(detall()).queryByRole('heading', { name: 'Acacia robínia' })).toBeNull();
    expect(detall().textContent).toContain(TEXTOS_HERBARI[language].documental);
    expect(screen.queryByRole('dialog')).toBeNull();
    vista.unmount();
  }
});

/* R16b (tercera ronda) · amagaCos: amb la pàgina, el cos (page.html) es pinta sense fitxa i desapareix
   amb una fitxa oberta, i torna en tancar-la. L'avís de toxicitat que la fitxa ja pinta (advertida o
   desconeguda) continua visible amb el cos amagat. */
test('with the page, its body shows without a record, hides while a record is open and the toxicity notice stays', () => {
  render(<MemoryRouter rutaInicial="/page/herbari"><HerbariWorkspaceSection page={{ html: '<p>COS</p>' }} /></MemoryRouter>);
  const cos = () => within(detall()).queryByText('COS');
  expect(cos()).toBeTruthy();
  expect(cos().closest('article.cms-preview')).toBeTruthy();
  expect(detall().textContent).toContain(TEXTOS_HERBARI.ca.documental);

  const toxica = ESPECIES_HERBARI_LA_TORRE_117.find(e => e.esToxica === true);
  fireEvent.click(within(llista()).getByRole('button', { name: toxica.nomValencia, exact: true }));
  expect(within(detall()).getByRole('heading', { name: toxica.nomValencia })).toBeTruthy();
  expect(cos()).toBeNull();
  expect(detall().querySelector('article.cms-preview')).toBeNull();
  expect(within(detall()).getByText(TEXTOS_HERBARI.ca.toxicitatAdvertida)).toBeTruthy();

  fireEvent.click(within(llista()).getByRole('button', { name: 'Acacia robínia', exact: true }));
  expect(within(detall()).getByRole('heading', { name: 'Acacia robínia' })).toBeTruthy();
  expect(cos()).toBeNull();
  expect(within(detall()).getByText(TEXTOS_HERBARI.ca.toxicitatDesconeguda)).toBeTruthy();

  fireEvent.click(within(detall()).getByRole('button', { name: `← ${TEXTOS_HERBARI.ca.titol}` }));
  expect(within(detall()).queryByRole('heading', { name: 'Acacia robínia' })).toBeNull();
  expect(cos()).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
});
