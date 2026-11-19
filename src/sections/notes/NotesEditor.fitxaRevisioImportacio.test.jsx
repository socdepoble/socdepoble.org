/* IDEA-125 · La «🔍 Fitxa de Revisió d’Importació» a l'«Edició avançada» del Bloc de notes (ranura
   `revisioEdicioAvancada`) per a la nota en revisió d'una pàgina de WordPress (`importacioWp`), i la
   sincronia en els dos sentits amb el Banc d'Importació (revisioImportacioWpStore.js). */
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ adapter: null, desa: vi.fn() }));
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: [], t: (_clau, text) => text, config: { tenantId: '00000000-0000-4000-8000-0000000000a1' },
    workspaceKey: 'a', notes: [], notesComplete: true, setLocalNoteField: () => {}
  }),
  etiquetesDeNota: () => []
}));
vi.mock('./useEstatDesamentNota.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useEstatDesamentNota: () => ({ estat: 'net', problema: null, quarantena: [] })
}));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { mocks.adapter = adapter; return null; } }));
vi.mock('../../data/backendPort.js', () => ({
  uploadToStorage: vi.fn(), teCapacitat: () => true,
  desaRevisioEditorialWp: (...a) => mocks.desa(...a),
  llistaRevisionsEditorialsWp: async () => []
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'persona', id: 'U', nom: 'Pepa' }, actorId: 'U', memberships: [] }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [], towns: [], pages: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'U' } }), useSessioOpcional: () => null, ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...p }) => <a href={to} {...p}>{children}</a>
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: 'ready', feedPosts: [], events: [], marketItems: [] }) }));
vi.mock('../../hooks/useProjeccionsCataleg.js', () => ({ useProjeccionsCataleg: () => ({ autoritzat: false }) }));

import NotesEditor from './NotesEditor.jsx';
import BancImportacioEditorial from '../profile/admin/BancImportacioEditorial.jsx';
import { llegeixEstatRevisioEditorial } from '../../utils/revisioEditorialWp.js';

const NOTA_WP = Object.freeze({
  id: 'wp-revisio-cataleg-d-arbres-emblematics-i-monumentals-de-la-torre-de-les-macanes',
  title: 'Catàleg d’Arbres', content: '<p>Cos</p>', folderId: 'f-mur',
  importacioWp: { wp_id: 619, slug: 'cataleg-d-arbres-emblematics-i-monumentals-de-la-torre-de-les-macanes' }
});

beforeEach(() => {
  localStorage.clear();
  mocks.adapter = null;
  mocks.desa.mockReset().mockResolvedValue({ wpId: 619, actualitzatA: '2026-11-18T22:00:00.000001Z' });
});
afterEach(cleanup);

function fitxaDe(ranura) {
  return ranura.querySelector('[data-sdp-fitxa-revisio-importacio="true"]');
}

/* El Banc sincronitza en muntar-se (importació dinàmica del port). S'espera que acabe abans de
   desar: en Vitest, dues importacions dinàmiques simultànies del port simulat (la sincronització
   i el desat) en tornaven una del mòdul real, sense la capacitat. */
async function obriBanc619() {
  const banc = render(<BancImportacioEditorial />).container;
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  fireEvent.change(within(banc).getByRole('textbox', { name: /Cerca per títol/ }), { target: { value: '619' } });
  fireEvent.click(within(banc).getByRole('button', { name: /^Catàleg d’Arbres/ }));
  return banc;
}

describe('IDEA-125 · fitxa de revisió d’importació a l’«Edició avançada» de /notes', () => {
  test('una nota amb importacioWp porta la fitxa a la ranura de revisió, davant de la revisora; una nota normal, no', () => {
    render(<NotesEditor activeNote={NOTA_WP} />);
    const ranura = render(mocks.adapter.revisioEdicioAvancada).container;
    const fitxa = fitxaDe(ranura);
    expect(fitxa).not.toBeNull();
    /* El número va per plantilla: el Design Guard llig «#» + tres xifres com un color cru. */
    expect(fitxa.textContent).toContain(`🔍 Fitxa de Revisió d’Importació · #${NOTA_WP.importacioWp.wp_id}`);
    expect(within(fitxa).getByText('✅ Revisió aprovada')).toBeTruthy();
    expect(within(fitxa).getByRole('link', { name: /Tornar a Importació i Revisió Editorial/ }).getAttribute('href'))
      .toBe('/el-meu-perfil?organitzacio=administracio-sistema&apartat=admin-importacio');
    const revisora = ranura.querySelector('[data-sdp-revisor-editorial-node0="true"]');
    expect(revisora).not.toBeNull();
    expect(fitxa.compareDocumentPosition(revisora) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    cleanup();
    render(<NotesEditor activeNote={{ id: 'n0', title: 'T', content: '<p>Cos</p>', folderId: 'f-mur' }} />);
    expect(fitxaDe(render(mocks.adapter.revisioEdicioAvancada).container)).toBeNull();
  });

  test('Bloc → Banc: «Marcar amb observacions» a la fitxa desa el registre i el Banc obert ho mostra', async () => {
    const banc = await obriBanc619();
    render(<NotesEditor activeNote={NOTA_WP} />);
    const fitxa = fitxaDe(render(mocks.adapter.revisioEdicioAvancada).container);
    fireEvent.change(within(fitxa).getByLabelText('Anotacions per a la transformació Pedra Seca'), { target: { value: 'Falta la galeria' } });
    fireEvent.click(within(fitxa).getByRole('button', { name: '📝 Marcar amb observacions' }));
    await waitFor(() => expect(llegeixEstatRevisioEditorial().estats['619']).toBe('amb_observacions'));
    expect(llegeixEstatRevisioEditorial().anotacions['619']).toBe('Falta la galeria');
    await waitFor(() => expect(within(fitxa).getByRole('status').textContent).toBe('Revisió confirmada pel servidor.'));
    /* La fitxa envia la mateixa autoria i el mateix destí que el Banc: sense ells, l'adaptador posaria
       'Sóc de Poble' i 'mur' i la RPC amb CAS els sobreescriuria a la fila del servidor. */
    expect(mocks.desa).toHaveBeenCalledWith(expect.objectContaining({
      wpId: 619, estat: 'amb_observacions', autoria: 'Associació El Rentonar', desti: 'arbres-monumentals'
    }), expect.anything());
    const llista = within(banc).getByRole('list', { name: 'Articles importats' });
    expect(within(llista).getByText('📝 Amb observacions')).toBeTruthy();
    expect(within(fitxa).getByText('📝 Amb observacions')).toBeTruthy();
  });

  test('Banc → Bloc: tornar a pendent amb nota des de la fitxa del Banc canvia la insígnia i la nota de la fitxa del Bloc', async () => {
    render(<NotesEditor activeNote={NOTA_WP} />);
    const fitxa = fitxaDe(render(mocks.adapter.revisioEdicioAvancada).container);
    expect(within(fitxa).getByText('✅ Revisió aprovada')).toBeTruthy();
    const banc = await obriBanc619();
    fireEvent.change(within(banc).getByLabelText(/Anotacions del Mestre/), { target: { value: 'Separar en dos articles' } });
    await act(async () => { fireEvent.click(within(banc).getByRole('button', { name: '⏳ Tornar a pendent' })); });
    await waitFor(() => expect(within(fitxa).getByText('⏳ Pendent de revisió')).toBeTruthy());
    expect(within(fitxa).getByLabelText('Anotacions per a la transformació Pedra Seca').value).toBe('Separar en dos articles');
  });

  test('un conflicte de versió ho diu i conserva l’esborrany de la fitxa', async () => {
    mocks.desa.mockReset().mockRejectedValue(Object.assign(new Error('conflicte'), { code: 'conflicte-versio' }));
    render(<NotesEditor activeNote={NOTA_WP} />);
    const fitxa = fitxaDe(render(mocks.adapter.revisioEdicioAvancada).container);
    const nota = within(fitxa).getByLabelText('Anotacions per a la transformació Pedra Seca');
    fireEvent.change(nota, { target: { value: 'La meua nota' } });
    fireEvent.click(within(fitxa).getByRole('button', { name: '✅ Aprovar i desar nota' }));
    await waitFor(() => expect(within(fitxa).getByRole('status').textContent).toContain('Una altra revisió ha canviat al servidor'));
    expect(nota.value).toBe('La meua nota');
  });
});
