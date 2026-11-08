import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { construeixBrainTaxonomia, idCategoriaBrain, idEtiquetaBrain, PROPOSTES_MESTRE_BRAIN } from '../../data/taxonomia/brainTaxonomia.js';
import { BrainTaxonomiaVista } from './BrainTaxonomia.jsx';
import { PrevisualitzacioCardTaxonomia } from './PrevisualitzacioCardTaxonomia.jsx';
vi.mock('../../components/universal/graph/BrainGraph.jsx', () => ({ default: ({ graf, vinclesPonderats }) => <div data-testid="graf-taxonomia" data-nodes={graf.nodes.length} data-ponderat={String(vinclesPonderats)}/> }));
afterEach(cleanup);
const model = () => construeixBrainTaxonomia({ publicacions: [{ id: 'a', title: 'Article del poble', labels: ['Herbari', 'Llavors', 'Projectes', 'Projecte Sóc de Poble'] }], coberturaViva: { parcial: true, estat: 'ready' } });
const munta = (props) => render(<MemoryRouter><BrainTaxonomiaVista {...props}/></MemoryRouter>);

test('fusió local, dissonàncies i col·lisions de nom són visibles sense alterar identitats', () => {
  const dades = model(); const abans = JSON.stringify(dades);
  munta({ model: dades });
  fireEvent.click(screen.getByRole('button', { name: 'Laboratori de decisions' }));
  expect(screen.getByText('Dissonàncies entre identificador i nom visible')).toBeTruthy();
  fireEvent.click(screen.getByText('Simula una fusió d’etiquetes'));
  fireEvent.click(screen.getByRole('button', { name: 'Simula la fusió' }));
  const lectura = screen.getByRole('region', { name: 'Noms: Després' });
  expect(within(lectura).getByText('Etiqueta: Projectes')).toBeTruthy();
  expect(within(lectura).queryByText('Etiqueta: Projecte Sóc de Poble')).toBeNull();
  fireEvent.change(screen.getByLabelText('Concepte per a escurçar'), { target: { value: idEtiquetaBrain('Herbari') } });
  fireEvent.change(screen.getByLabelText('Nom de prova'), { target: { value: 'Llavors' } });
  expect(within(screen.getByRole('region', { name: 'Col·lisions de noms de prova' })).getByText('tag:Herbari')).toBeTruthy();
  expect(JSON.stringify(dades)).toBe(abans);
});

test('el viewport copia tema/Bancal i fulls adoptats, amb actualització de la presentació', async () => {
  const full = { cssRules: [{ cssText: '.sdp-root { color: inherit; }' }] };
  const original = Object.getOwnPropertyDescriptor(document, 'adoptedStyleSheets');
  Object.defineProperty(document, 'adoptedStyleSheets', { configurable: true, value: [full] });
  const mostra = { title: 'Mostra', labels: [] };
  const component = (tema, contrast) => <MemoryRouter><div className="sdp-root" data-theme={tema} data-contrast={contrast}><PrevisualitzacioCardTaxonomia amplaria={1440} article={mostra}/></div></MemoryRouter>;
  try {
    const { rerender } = render(component('dark', 'bancal'));
    const frame = screen.getByTitle('UniversalCard a 1440 px');
    expect(frame.contentDocument.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(frame.contentDocument.documentElement.getAttribute('data-contrast')).toBe('bancal');
    expect(frame.contentDocument.querySelector('[data-sdp-preview-style="adoptat"]').textContent).toContain('.sdp-root { color: inherit; }');
    rerender(component('light', undefined));
    await waitFor(() => expect(frame.contentDocument.documentElement.getAttribute('data-theme')).toBe('light'));
    expect(frame.contentDocument.documentElement.hasAttribute('data-contrast')).toBe(false);
  } finally {
    if (original) Object.defineProperty(document, 'adoptedStyleSheets', original);
    else delete document.adoptedStyleSheets;
  }
});

test('dimensions reals i inspector amb proves documentals, sense categories IA inventades', async () => {
  munta({ model: model() });
  expect((await screen.findByTestId('graf-taxonomia')).getAttribute('data-nodes')).toBe('55');
  fireEvent.change(screen.getByLabelText('Inspecciona un node'), { target: { value: idEtiquetaBrain('Herbari') } });
  const fitxa = screen.getByRole('region', { name: 'Fitxa MIT del node' });
  expect(within(fitxa).getByRole('link', { name: 'Article del poble' }).getAttribute('href')).toBe('/mur/a');
  expect(within(fitxa).getByText(/1 documents observats/)).toBeTruthy();
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Dimensions del Brain' })).getByRole('button', { name: 'Formats' }));
  expect(screen.getByTestId('graf-taxonomia').getAttribute('data-nodes')).toBe('14');
  fireEvent.click(screen.getByRole('button', { name: 'Redundàncies' }));
  expect(screen.getByTestId('graf-taxonomia').getAttribute('data-nodes')).toBe('13');
  expect(screen.getByText(/La lectura viva és parcial/)).toBeTruthy();
});

test('pàgina freda exposa i usa el port existent de paginació', async () => {
  const carrega = vi.fn(async () => true);
  munta({ model: model(), paginacio: [{ id: 'mur', nom: 'Mur carregat', mes: true, carrega }] });
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Carrega més: Mur carregat' })));
  expect(carrega).toHaveBeenCalledOnce();
});

test('renom simulat usa UniversalCard real en 375/1440 i deixa immutables les fonts i l’emmagatzematge', async () => {
  const dades = model(); const abans = JSON.stringify(dades); const desa = vi.spyOn(Storage.prototype, 'setItem');
  munta({ model: dades });
  fireEvent.click(screen.getByRole('button', { name: 'Laboratori de decisions' }));
  fireEvent.change(screen.getByLabelText('Concepte per a escurçar'), { target: { value: idCategoriaBrain('tecnologia-lliure') } });
  fireEvent.click(screen.getByRole('button', { name: 'Prova: 💻 Tecnologia Lliure' }));
  expect(screen.getByLabelText('Nom de prova').value).toBe('💻 Tecnologia Lliure');
  expect(within(screen.getByRole('region', { name: 'Noms: Després' })).getByText('Categoria: 💻 Tecnologia Lliure')).toBeTruthy();
  for (const amplaria of [375, 1440]) {
    for (const etapa of ['Abans', 'Després']) {
      const frame = screen.getByTitle(`UniversalCard a ${amplaria} px · ${etapa}`);
      expect(frame.getAttribute('width')).toBe(String(amplaria));
      expect(frame.contentDocument.querySelectorAll('.sp-card')).toHaveLength(1);
      expect(frame.contentDocument.querySelector('.sp-card-author-link').getAttribute('href')).toBe('/empresa/socdepoble');
      expect(within(frame.contentDocument.body).getByText(etapa === 'Després' ? '💻 Tecnologia Lliure' : dades.nodes.find((node) => node.id === idCategoriaBrain('tecnologia-lliure')).label)).toBeTruthy();
      expect(frame.contentDocument.querySelector('[inert]')).toBeTruthy();
    }
  }
  expect(JSON.stringify(dades)).toBe(abans); expect(desa).not.toHaveBeenCalled(); desa.mockRestore();
});

test('les sis propostes del Mestre canvien només la identitat seleccionada en memòria', () => {
  const dades = model(); const abans = JSON.stringify(dades);
  munta({ model: dades });
  fireEvent.click(screen.getByRole('button', { name: 'Laboratori de decisions' }));
  const pool = screen.getByRole('region', { name: 'Sis noms proposats pel Mestre' });
  expect(within(pool).getAllByRole('button')).toHaveLength(6);
  for (const nom of PROPOSTES_MESTRE_BRAIN) expect(within(pool).getByRole('button', { name: `Prova el nom: ${nom}` }).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Concepte per a escurçar'), { target: { value: idCategoriaBrain('tecnologia-lliure') } });
  fireEvent.click(within(pool).getByRole('button', { name: 'Prova el nom: 🏛️ Govern i Poble' }));
  expect(screen.getByLabelText('Nom de prova').value).toBe('🏛️ Govern i Poble');
  expect(within(screen.getByRole('region', { name: 'Noms: Després' })).getByText('Categoria: 🏛️ Govern i Poble')).toBeTruthy();
  expect(within(screen.getByRole('region', { name: 'Noms: Abans' })).getByText(/Categoria:.*Tecnologia/)).toBeTruthy();
  expect(within(pool).getByText(/no és una de les sis categories/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Nom de prova'), { target: { value: '   ' } });
  expect(within(screen.getByRole('region', { name: 'Noms: Després' })).getByText(/Categoria:.*Tecnologia/)).toBeTruthy();
  expect(JSON.stringify(dades)).toBe(abans);
});

test('cobertura i procedència mostren errors, registres omesos i versió efectiva', () => {
  const dades = construeixBrainTaxonomia({ publicacions: [{ title: 'Sense id', labels: ['Fotos'] }, { id: 'a', title: 'Article', version: 2, updated_at: '2026-11-08', labels: ['Herbari'] }], coberturaViva: { estat: 'error' } });
  munta({ model: dades });
  expect(screen.getByText(/1 registres sense identitat/)).toBeTruthy();
  expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut llegir la font viva');
  fireEvent.change(screen.getByLabelText('Inspecciona un node'), { target: { value: idEtiquetaBrain('Herbari') } });
  expect(screen.getByText(/Prova efectiva:.*versió 2/)).toBeTruthy();
});
