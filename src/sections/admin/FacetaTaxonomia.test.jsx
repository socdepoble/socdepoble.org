/* Onada 11 (261010; prompt 261010_1730, tasca 2; front D2) · La faceta
   «Etiquetes i categories» del Tauler de superadmin, amb el port i el
   contingut core substituïts. Dades sintètiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ desa: vi.fn(), historial: vi.fn(), refresh: vi.fn(), capacitats: new Set(['personalitzacio']), core: null }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => m.capacitats.has(cap),
  adminDesaPersonalitzacio: (...args) => m.desa(...args),
  adminHistorialPersonalitzacio: (...args) => m.historial(...args)
}));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => m.core }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, lead, children }) => (
    <main><header className="page-title"><h1>{title}</h1></header><p>{lead}</p>{children}</main>
  )
}));
import { FACETA_TAXONOMIA, FacetaTaxonomia, nomFitxerExportacio, payloadDe } from './FacetaTaxonomia.jsx';
import { SYSTEM_PAGES } from '../../config/systemPages.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { CODI_PERSONALITZACIO, MISSATGE_PERSONALITZACIO, errorDePersonalitzacio } from '../../data/errorsBackend.js';

const ETIQUETES_CONSOLA = [{ text: 'Sistema', className: 'sdp-badge-category' }, { text: 'Manteniment', className: 'sdp-badge-tag' }];
const pageCopyDeSerie = () => Object.fromEntries(SYSTEM_PAGES.map(({ key }) => [key, { ...PAGE_COPY[key], id: key }]));
const core = (extra = {}) => ({ status: 'ready', pageCopy: pageCopyDeSerie(), personalitzacio: null, refresh: m.refresh, ...extra });

const seccio = (titol) => screen.getByRole('heading', { level: 2, name: titol }).closest('section');
const consola = () => seccio(`Pàgina «${PAGE_COPY.consola.title}»`);
const desar = () => act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Desar' })); });

beforeEach(() => {
  m.desa.mockReset(); m.historial.mockReset(); m.refresh.mockReset();
  m.capacitats = new Set(['personalitzacio']);
  m.core = core();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('FACETA_TAXONOMIA: id, títol i icona, congelada', () => {
  expect(FACETA_TAXONOMIA).toMatchObject({ id: 'taxonomia', titol: 'Etiquetes i categories' });
  expect(typeof FACETA_TAXONOMIA.icona).toBe('object');
  expect(Object.isFrozen(FACETA_TAXONOMIA)).toBe(true);
});

test('sense la capacitat personalitzacio: l’estat buit «Este node no admet personalització», la tornada, i cap crida al port', () => {
  m.capacitats = new Set(['admin']);
  const onBack = vi.fn();
  render(<FacetaTaxonomia onBack={onBack} />);
  expect(screen.getByRole('heading', { level: 1, name: 'Etiquetes i categories' })).toBeTruthy();
  expect(screen.getByText('Este node no admet personalització')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Tornar al Tauler' }));
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: 'Desar' })).toBeNull();
  expect(m.desa).not.toHaveBeenCalled();
  expect(m.historial).not.toHaveBeenCalled();
});

test('pinta un bloc per pàgina de SYSTEM_PAGES amb les etiquetes actuals (text i classe) i els blocs de sèrie', () => {
  render(<FacetaTaxonomia />);
  const titols = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(titols.slice(0, 2)).toEqual(['Categories de sèrie del Bloc', 'Etiquetes de sèrie del Bloc']);
  expect(titols.slice(2)).toEqual(SYSTEM_PAGES.map(({ key }) => `Pàgina «${PAGE_COPY[key]?.title || key}»`));
  const bloc = consola();
  expect(within(bloc).getByLabelText(`Text de l’etiqueta 1 de ${PAGE_COPY.consola.title}`).value).toBe('Sistema');
  expect(within(bloc).getByLabelText(`Classe de l’etiqueta 1 de ${PAGE_COPY.consola.title}`).value).toBe('sdp-badge-category');
  expect(within(bloc).getByLabelText(`Text de l’etiqueta 2 de ${PAGE_COPY.consola.title}`).value).toBe('Manteniment');
  expect(within(bloc).getByLabelText(`Classe de l’etiqueta 2 de ${PAGE_COPY.consola.title}`).value).toBe('sdp-badge-tag');
  /* La previsualització usa el mateix marcatge que la targeta. */
  const previsualitzacio = within(bloc).getByRole('list', { name: `Previsualització de les etiquetes de ${PAGE_COPY.consola.title}` });
  expect([...previsualitzacio.querySelectorAll('li')].map((li) => li.className)).toEqual(['sp-card-label sdp-badge-category', 'sp-card-label sdp-badge-tag']);
  /* El selector oferix el conjunt tancat, amb noms llegibles. */
  const opcions = [...within(bloc).getByLabelText(`Classe de l’etiqueta 1 de ${PAGE_COPY.consola.title}`).options];
  expect(opcions.map((o) => o.value)).toEqual(['sdp-badge-buit', 'sdp-badge-system', 'sdp-badge-accent', 'sdp-badge-category', 'sdp-badge-tag', 'sdp-badge-neutral']);
  expect(opcions.map((o) => o.textContent)).toContain('Sistema (blau fosc)');
  expect(within(seccio('Categories de sèrie del Bloc')).getByText('De sèrie, sempre: Sistema.')).toBeTruthy();
  expect(within(seccio('Etiquetes de sèrie del Bloc')).getByText('De sèrie, sempre: Productivitat, Tutorial.')).toBeTruthy();
  expect(screen.getByText('Encara no hi ha cap versió desada: tot és de sèrie.')).toBeTruthy();
});

test('amb una taxonomia desada, les etiquetes són les del pageCopy (ja fusionat) i les llistes de sèrie afegides es veuen', () => {
  const pageCopy = pageCopyDeSerie();
  pageCopy.consola = { ...pageCopy.consola, labels: [{ text: 'Maquinària', className: 'sdp-badge-system' }] };
  m.core = core({ pageCopy, personalitzacio: { taxonomia: { payload: { v: 1, pagines: { consola: { labels: [{ text: 'Maquinària', className: 'sdp-badge-system' }] } }, categories: ['Festes'], etiquetes: [] }, versio: 3 }, estil: null } });
  render(<FacetaTaxonomia />);
  const bloc = consola();
  expect(within(bloc).getByLabelText(`Text de l’etiqueta 1 de ${PAGE_COPY.consola.title}`).value).toBe('Maquinària');
  expect(within(bloc).queryByLabelText(`Text de l’etiqueta 2 de ${PAGE_COPY.consola.title}`)).toBeNull();
  expect(within(seccio('Categories de sèrie del Bloc')).getByRole('list', { name: 'Categories afegides' }).textContent).toContain('Festes');
  expect(screen.getByText('Versió vigent: 3.')).toBeTruthy();
});

test('Desar sense canvis envia la forma buida amb versio 0 i diu l’èxit amb la versió nova; el contingut core es torna a llegir', async () => {
  m.desa.mockResolvedValueOnce({ clau: 'taxonomia', payload: {}, versio: 1 });
  render(<FacetaTaxonomia />);
  await desar();
  expect(m.desa).toHaveBeenCalledWith({ clau: 'taxonomia', payload: { v: 1, pagines: {}, categories: [], etiquetes: [] }, versio: 0 });
  expect(screen.getByRole('status').textContent).toContain('Desat com a versió 1.');
  expect(screen.getByText('Versió vigent: 1.')).toBeTruthy();
  expect(m.refresh).toHaveBeenCalledTimes(1);
});

test('editar text i classe, afegir i llevar etiquetes i afegir una categoria: el payload només nomena la pàgina canviada, amb la versió vigent', async () => {
  m.core = core({ personalitzacio: { taxonomia: { payload: { v: 1, pagines: {}, categories: [], etiquetes: [] }, versio: 3 }, estil: null } });
  m.desa.mockResolvedValueOnce({ clau: 'taxonomia', payload: {}, versio: 4 });
  render(<FacetaTaxonomia />);
  const bloc = consola();
  const titol = PAGE_COPY.consola.title;
  fireEvent.change(within(bloc).getByLabelText(`Text de l’etiqueta 1 de ${titol}`), { target: { value: ' Maquinària ' } });
  fireEvent.change(within(bloc).getByLabelText(`Classe de l’etiqueta 1 de ${titol}`), { target: { value: 'sdp-badge-system' } });
  fireEvent.click(within(bloc).getByRole('button', { name: `Llevar l’etiqueta 2 de ${titol}` }));
  fireEvent.click(within(bloc).getByRole('button', { name: `Afegir una etiqueta a ${titol}` }));
  fireEvent.change(within(bloc).getByLabelText(`Text de l’etiqueta 2 de ${titol}`), { target: { value: 'IAIA' } });
  fireEvent.change(within(bloc).getByLabelText(`Classe de l’etiqueta 2 de ${titol}`), { target: { value: 'sdp-badge-accent' } });
  const categories = seccio('Categories de sèrie del Bloc');
  fireEvent.change(within(categories).getByLabelText('Nova categoria'), { target: { value: 'Festes' } });
  fireEvent.click(within(categories).getByRole('button', { name: 'Afegir' }));
  expect(within(categories).getByRole('list', { name: 'Categories afegides' }).textContent).toContain('Festes');
  await desar();
  expect(m.desa).toHaveBeenCalledWith({
    clau: 'taxonomia',
    payload: {
      v: 1,
      pagines: { consola: { labels: [{ text: 'Maquinària', className: 'sdp-badge-system' }, { text: 'IAIA', className: 'sdp-badge-accent' }] } },
      categories: ['Festes'],
      etiquetes: []
    },
    versio: 3
  });
  expect(screen.getByText('Versió vigent: 4.')).toBeTruthy();
  /* Llevar la categoria afegida la trau de l'esborrany. */
  fireEvent.click(within(categories).getByRole('button', { name: 'Llevar la categoria Festes' }));
  expect(within(categories).queryByRole('list', { name: 'Categories afegides' })).toBeNull();
});

test('una etiqueta sense text no es desa: l’error diu la pàgina i el port no es crida', async () => {
  render(<FacetaTaxonomia />);
  const bloc = consola();
  fireEvent.click(within(bloc).getByRole('button', { name: `Afegir una etiqueta a ${PAGE_COPY.consola.title}` }));
  await desar();
  expect(m.desa).not.toHaveBeenCalled();
  const alerta = screen.getByRole('alert');
  expect(alerta.textContent).toContain('Hi ha errors a la taxonomia i no s’ha desat');
  expect(alerta.textContent).toContain('L’etiqueta 3 de «consola» necessita un text d’1 a 40 caràcters.');
});

test('conflicte de versió: «Algú ha desat una versió nova: recarrega» i el botó torna a llegir el contingut core i reinicia l’esborrany', async () => {
  m.desa.mockRejectedValueOnce(errorDePersonalitzacio(CODI_PERSONALITZACIO.CONFLICTE_VERSIO));
  const { rerender } = render(<FacetaTaxonomia />);
  const bloc = consola();
  fireEvent.change(within(bloc).getByLabelText(`Text de l’etiqueta 1 de ${PAGE_COPY.consola.title}`), { target: { value: 'Canvi meu' } });
  await desar();
  const alerta = screen.getByRole('alert');
  expect(alerta.textContent).toContain('Algú ha desat una versió nova: recarrega');
  fireEvent.click(within(alerta).getByRole('button', { name: 'Recarregar' }));
  expect(m.refresh).toHaveBeenCalledTimes(1);
  /* Arriba el contingut nou: l'esborrany i la versió són els del servidor. */
  const pageCopy = pageCopyDeSerie();
  pageCopy.consola = { ...pageCopy.consola, labels: [{ text: 'De l’altra', className: 'sdp-badge-neutral' }] };
  m.core = core({ pageCopy, personalitzacio: { taxonomia: { payload: { v: 1, pagines: { consola: { labels: [{ text: 'De l’altra', className: 'sdp-badge-neutral' }] } } }, versio: 7 }, estil: null } });
  rerender(<FacetaTaxonomia />);
  expect(within(consola()).getByLabelText(`Text de l’etiqueta 1 de ${PAGE_COPY.consola.title}`).value).toBe('De l’altra');
  expect(screen.getByText('Versió vigent: 7.')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});

test('muntada abans que el contingut core siga ready: pren l’esborrany i la versió quan arriben, i després no es resincronitza sola', () => {
  /* Mentre carrega, el context dóna pageCopy buit i cap personalització (CoreContentContext). */
  m.core = { status: 'loading', pageCopy: {}, personalitzacio: null, refresh: m.refresh };
  const { rerender } = render(<FacetaTaxonomia />);
  expect(within(consola()).getByLabelText(`Text de l’etiqueta 1 de ${PAGE_COPY.consola.title}`).value).toBe('Sistema');
  expect(screen.getByText('Encara no hi ha cap versió desada: tot és de sèrie.')).toBeTruthy();
  /* Arriba el contingut: l'esborrany i la versió són els del servidor, sense cap «Recarregar». */
  const pageCopy = pageCopyDeSerie();
  pageCopy.consola = { ...pageCopy.consola, labels: [{ text: 'Maquinària', className: 'sdp-badge-system' }] };
  m.core = core({ pageCopy, personalitzacio: { taxonomia: { payload: { v: 1, pagines: { consola: { labels: [{ text: 'Maquinària', className: 'sdp-badge-system' }] } }, categories: ['Festes'], etiquetes: [] }, versio: 3 }, estil: null } });
  rerender(<FacetaTaxonomia />);
  expect(within(consola()).getByLabelText(`Text de l’etiqueta 1 de ${PAGE_COPY.consola.title}`).value).toBe('Maquinària');
  expect(within(seccio('Categories de sèrie del Bloc')).getByRole('list', { name: 'Categories afegides' }).textContent).toContain('Festes');
  expect(screen.getByText('Versió vigent: 3.')).toBeTruthy();
  expect(m.refresh).not.toHaveBeenCalled();
  /* Una versió més nova que arriba després no substituïx l'edició en curs: el conflicte s'ha de veure en desar. */
  m.core = core({ pageCopy, personalitzacio: { taxonomia: { payload: { v: 1, pagines: {}, categories: [], etiquetes: [] }, versio: 8 }, estil: null } });
  rerender(<FacetaTaxonomia />);
  expect(within(consola()).getByLabelText(`Text de l’etiqueta 1 de ${PAGE_COPY.consola.title}`).value).toBe('Maquinària');
  expect(screen.getByText('Versió vigent: 3.')).toBeTruthy();
});

test('sense el segon factor: l’avís amb la frase del codi, i la versió no canvia', async () => {
  m.desa.mockRejectedValueOnce(errorDePersonalitzacio(CODI_PERSONALITZACIO.CAL_SEGON_FACTOR));
  render(<FacetaTaxonomia />);
  await desar();
  expect(screen.getByRole('status').textContent).toContain(MISSATGE_PERSONALITZACIO[CODI_PERSONALITZACIO.CAL_SEGON_FACTOR]);
  expect(screen.getByText('Encara no hi ha cap versió desada: tot és de sèrie.')).toBeTruthy();
  expect(m.refresh).not.toHaveBeenCalled();
});

test('un altre error del port ix amb el seu missatge', async () => {
  m.desa.mockRejectedValueOnce(errorDePersonalitzacio(CODI_PERSONALITZACIO.NO_DISPONIBLE));
  render(<FacetaTaxonomia />);
  await desar();
  expect(screen.getByRole('alert').textContent).toContain(MISSATGE_PERSONALITZACIO[CODI_PERSONALITZACIO.NO_DISPONIBLE]);
});

test('Historial: la taula de versions i «Restaurar» desa el payload vell com a versió nova sobre la vigent', async () => {
  m.core = core({ personalitzacio: { taxonomia: { payload: { v: 1, pagines: {}, categories: ['Festes'], etiquetes: [] }, versio: 2 }, estil: null } });
  const vell = { v: 1, pagines: { cervell: { labels: [{ text: 'Graf antic', className: 'sdp-badge-tag' }] } }, categories: [], etiquetes: ['Reg'] };
  m.historial.mockResolvedValueOnce([
    { versio: 2, payload: { v: 1, pagines: {}, categories: ['Festes'], etiquetes: [] }, creat: '2026-10-10T10:00:00+00:00', autor: 'A' },
    { versio: 1, payload: vell, creat: '2026-10-09T10:00:00+00:00', autor: 'A' }
  ]);
  m.desa.mockResolvedValueOnce({ clau: 'taxonomia', payload: vell, versio: 3 });
  render(<FacetaTaxonomia />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Historial' })); });
  expect(m.historial).toHaveBeenCalledWith('taxonomia');
  const taula = screen.getByRole('region', { name: 'Versions desades de la taxonomia' });
  expect([...taula.querySelectorAll('tbody th')].map((th) => th.textContent)).toEqual(['2', '1']);
  await act(async () => { fireEvent.click(within(taula).getByRole('button', { name: 'Restaurar la versió 1' })); });
  expect(m.desa).toHaveBeenCalledWith({ clau: 'taxonomia', payload: vell, versio: 2 });
  /* L'esborrany passa a ser el restaurat i l'historial es tanca. */
  expect(screen.queryByRole('region', { name: 'Versions desades de la taxonomia' })).toBeNull();
  expect(within(seccio(`Pàgina «${PAGE_COPY.cervell.title}»`)).getByLabelText(`Text de l’etiqueta 1 de ${PAGE_COPY.cervell.title}`).value).toBe('Graf antic');
  expect(within(seccio('Etiquetes de sèrie del Bloc')).getByRole('list', { name: 'Etiquetes afegides' }).textContent).toContain('Reg');
  expect(within(seccio('Categories de sèrie del Bloc')).queryByRole('list', { name: 'Categories afegides' })).toBeNull();
  expect(screen.getByText('Versió vigent: 3.')).toBeTruthy();
});

test('Historial buit o amb error ho diu', async () => {
  m.historial.mockResolvedValueOnce([]);
  const { unmount } = render(<FacetaTaxonomia />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Historial' })); });
  expect(screen.getByText('Encara no s’ha desat cap versió.')).toBeTruthy();
  unmount();
  m.historial.mockRejectedValueOnce(errorDePersonalitzacio(CODI_PERSONALITZACIO.SENSE_SESSIO));
  render(<FacetaTaxonomia />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Historial' })); });
  expect(screen.getByRole('alert').textContent).toContain(MISSATGE_PERSONALITZACIO[CODI_PERSONALITZACIO.SENSE_SESSIO]);
});

test('Exporta JSON: un Blob amb el payload de l’esborrany i un enllaç amb download', () => {
  const creat = vi.fn(() => 'blob:taxonomia');
  const revocat = vi.fn();
  vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL: creat, revokeObjectURL: revocat }));
  const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  const crea = document.createElement.bind(document);
  let enllac = null;
  vi.spyOn(document, 'createElement').mockImplementation((tag) => { const el = crea(tag); if (tag === 'a') enllac = el; return el; });
  render(<FacetaTaxonomia />);
  fireEvent.click(screen.getByRole('button', { name: 'Exporta JSON' }));
  expect(creat).toHaveBeenCalledTimes(1);
  expect(creat.mock.calls[0][0]).toBeInstanceOf(Blob);
  expect(creat.mock.calls[0][0].type).toBe('application/json');
  expect(clic).toHaveBeenCalledTimes(1);
  expect(enllac.getAttribute('download')).toBe(nomFitxerExportacio());
  expect(enllac.getAttribute('href')).toBe('blob:taxonomia');
  vi.unstubAllGlobals();
});

test('payloadDe: només les pàgines que no són com les de sèrie, i les llistes netes', () => {
  const esborrany = {
    pagines: {
      consola: { titol: 'Consola', labels: ETIQUETES_CONSOLA.map((l) => ({ ...l })) },
      cervell: { titol: 'Cervell', labels: [{ text: ' Graf ', className: 'sdp-badge-tag' }] }
    },
    categories: [' Festes ', 'Festes', ''],
    etiquetes: []
  };
  expect(payloadDe(esborrany)).toEqual({ v: 1, pagines: { cervell: { labels: [{ text: 'Graf', className: 'sdp-badge-tag' }] } }, categories: ['Festes'], etiquetes: [] });
});
