/* IDEA-164 (R93/R104) · R11 Loop 3 (arbitratge de Claude) · El cablejat de la revisora editorial a
   NotesEditor:
     · L2-01 · el panell rep els camps CRUS: «Aplicar» amb el dictamen APROVAT no escriu res, i amb
       una regla al cos només escriu el cos (cap títol, subtítol o entradeta en text pla);
       «Restaurar» torna l'HTML d'abans;
     · L2-02 · cap categoria s'escriu ni se substituïx (la categoria mare suggerida és informativa);
       les etiquetes SKOS s'afigen i «Restaurar» torna les d'abans;
     · L2-03 · la revisora va a la ranura `revisioEdicioAvancada` (dins de l'«Edició avançada»):
       ni peu de pàgina (contracte del Bloc 3.9) ni germà del DocumentEditor;
     · L1 · la llengua del panell és la de la interfície. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ adapter: null, escrit: [], ui: null }));
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: [], t: (_clau, text) => text, config: { tenantId: '00000000-0000-4000-8000-0000000000a1' },
    workspaceKey: 'a', notes: [], notesComplete: true,
    setLocalNoteField: (id, camp, valor) => { mocks.escrit.push([id, camp, valor]); }
  }),
  etiquetesDeNota: () => []
}));
vi.mock('./useEstatDesamentNota.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useEstatDesamentNota: () => ({ estat: 'net', problema: null, quarantena: [] })
}));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { mocks.adapter = adapter; return null; } }));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), teCapacitat: () => true }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'persona', id: 'U', nom: 'Pepa' }, actorId: 'U', memberships: [] }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [], towns: [], pages: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'U' } }), ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../../app/contexts/UIContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIStateOpcional: () => mocks.ui
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: 'ready', feedPosts: [], events: [], marketItems: [] }) }));
import NotesEditor from './NotesEditor.jsx';
import { TEXTOS_REVISOR_EDITORIAL, VEREDICTES_EDITORIALS } from './revisorEditorialNode0.js';

const CA = TEXTOS_REVISOR_EDITORIAL.ca;
const HTML = Object.freeze({
  title: 'Pa &amp; vi',
  subtitle: 'Sub amb <strong>negreta</strong>',
  lead: '<p>Entradeta amb <em>cursiva</em> i <a href="https://exemple.org">enllaç</a></p>'
});

beforeEach(() => { mocks.adapter = null; mocks.escrit = []; mocks.ui = null; });
afterEach(cleanup);

/* Munta NotesEditor (el DocumentEditor és un doble que guarda l'adaptador) i pinta a part la
   ranura de la revisora, com fan les proves de la botonera amb `adapter.classificacio`. */
function munta(nota) {
  const editor = render(<NotesEditor activeNote={nota} />);
  const panell = render(mocks.adapter.revisioEdicioAvancada);
  return { editor, panell };
}
/* Aplica a la nota el que s'ha escrit (com faria la capa local del Bloc) i repinta les dues peces. */
function aplicaEscrits(nota, { editor, panell }) {
  const nova = { ...nota };
  for (const [, camp, valor] of mocks.escrit) nova[camp] = valor;
  editor.rerender(<NotesEditor activeNote={nova} />);
  panell.rerender(mocks.adapter.revisioEdicioAvancada);
  return nova;
}

describe('IDEA-164 · R11 Loop 3 · revisora editorial a /notes', () => {
  test('L2-03 · la revisora va dins de l’«Edició avançada» (revisioEdicioAvancada): cap peu ni germà del DocumentEditor', () => {
    const { container } = render(<NotesEditor activeNote={{ id: 'n0', title: 'T', content: '<p>Cos</p>', folderId: 'f-mur' }} />);
    expect('peuDePagina' in mocks.adapter).toBe(false);
    expect('etiquetaPeuDePagina' in mocks.adapter).toBe(false);
    expect(container.querySelector('[data-sdp-revisor-editorial-node0]')).toBeNull();
    const ranura = render(mocks.adapter.revisioEdicioAvancada).container;
    expect(ranura.querySelector('[data-sdp-revisor-editorial-node0="true"]')).not.toBeNull();
  });

  test('L2-01 · HTML al títol, subtítol i entradeta amb dictamen APROVAT: «Aplicar» no escriu res', () => {
    const nota = { id: 'n1', ...HTML, content: '<p>Les eines de poble.</p>', folderId: 'f-mur', categories: ['Cultura'], tags: ['a'] };
    munta(nota);
    fireEvent.click(screen.getByRole('button', { name: CA.btnReview }));
    expect(screen.getByTestId('veredicte-editorial-pill').textContent).toContain(VEREDICTES_EDITORIALS.APROVAT);
    fireEvent.click(screen.getByRole('button', { name: CA.btnApplyProposal }));
    expect(mocks.escrit).toEqual([]);
  });

  test('L2-01 · una regla al cos: només s’escriu el cos, i «Restaurar» el torna; l’HTML dels altres camps no es toca', () => {
    const nota = { id: 'n2', ...HTML, content: '<p>Les <strong>eines del poble</strong>.</p>', folderId: 'f-mur', categories: ['Cultura'], tags: ['a'] };
    const peces = munta(nota);
    fireEvent.click(screen.getByRole('button', { name: CA.btnReview }));
    fireEvent.click(screen.getByRole('button', { name: CA.btnApplyProposal }));
    expect(mocks.escrit).toEqual([['n2', 'content', '<p>Les <strong>eines de poble</strong>.</p>']]);

    aplicaEscrits(nota, peces);
    mocks.escrit = [];
    fireEvent.click(screen.getByRole('button', { name: CA.btnRestoreOriginal }));
    expect(mocks.escrit).toEqual([['n2', 'content', '<p>Les <strong>eines del poble</strong>.</p>']]);
  });

  test('L2-02 · cap categoria s’escriu ni se substituïx; les etiquetes SKOS s’afigen i «Restaurar» torna les d’abans', () => {
    const nota = {
      id: 'n3', title: 'Crònica', subtitle: 'Sub', lead: '<p>Entradeta</p>',
      content: '<p>El pou de neu de la serra.</p>', folderId: 'f-mur', categories: ['Cultura', 'Festes'], tags: ['a']
    };
    const peces = munta(nota);
    fireEvent.click(screen.getByRole('button', { name: CA.btnReview }));
    // La categoria mare del tesaurus es mostra com a suggeriment…
    expect(screen.getByTestId('categoria-suggerida-node0').textContent).not.toBe(CA.noTaxonomy);
    fireEvent.click(screen.getByRole('button', { name: CA.btnApplyProposal }));
    // …però no viatja: només les etiquetes, afegides a les de la nota.
    expect(mocks.escrit).toEqual([['n3', 'tags', ['a', 'Pou de neu']]]);
    expect(mocks.escrit.some(([, camp]) => camp === 'categories')).toBe(false);

    aplicaEscrits(nota, peces);
    mocks.escrit = [];
    fireEvent.click(screen.getByRole('button', { name: CA.btnRestoreOriginal }));
    expect(mocks.escrit).toEqual([['n3', 'tags', ['a']]]);
  });

  test('L1 · la llengua del panell és la de la interfície (abans, sempre en valencià)', () => {
    mocks.ui = { language: 'es', llenguaDelText: 'es' };
    act(() => { render(<NotesEditor activeNote={{ id: 'n4', title: 'T', content: '<p>Cos</p>', folderId: 'f-mur' }} />); });
    render(mocks.adapter.revisioEdicioAvancada);
    expect(screen.getByRole('button', { name: TEXTOS_REVISOR_EDITORIAL.es.btnReview })).toBeTruthy();
  });
});
