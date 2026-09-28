import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ model: null, props: null, obri: () => {}, creaNota: null, memberships: undefined, params: new URLSearchParams('nota=n1'), note: { id: 'n1', folderId: 'f-mur', categories: ['Sistema'], tags: ['Tutorial'], formattedDate: '02/01/26', formattedTime: '09:37', updatedAt: '2026-01-02T08:37:00Z' },
  actor: { tipus: 'entitat', id: 'socdepoble', slug: 'soc-de-poble', rol: 'owner' },
  mercat: [
    { id: 'samarreta', title: 'Samarreta', author_entity_id: 'socdepoble', seller: 'Sóc de Poble', created_at: '2026-08-15T12:33:00.000Z' },
    { id: 'mac-mini', title: 'Mac Mini', author_id: 'javillinares', seller: 'Mestre Poble', created_at: '2026-02-15T12:00:00.000Z' }
  ] }));
vi.mock('./NotesContext', async importOriginal => ({ ...await importOriginal(), useNotes: () => ({
  notes: [mocks.note], noteFolders: [{ id: 'f-mur', name: 'Mur' }], status: 'ready', canCreate: true,
  obriConfiguracioNotes: mocks.obri,
  /* T39 · CREAR NOTA: la prova mira què rep creaNota. */
  creaNota: (...args) => mocks.creaNota(...args)
}) }));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: { dataMode: 'seed' } }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useSearchParams: () => [mocks.params, vi.fn()] }));
/* T1 · el MAS creua el Mur amb l'actor: ací un actor de proves i un Mercat amb un article seu i un d'altri. */
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: mocks.actor, memberships: mocks.memberships }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sortedFeedPosts: [], sortedEvents: [], sortedMarketItems: mocks.mercat }) }));
vi.mock('../../components/universal/workspace/UniversalWorkspace', () => ({ UniversalWorkspace: (props) => { mocks.model = props.model; mocks.props = props; return null; } }));
vi.mock('./NotesDetail.jsx', () => ({ default: () => null }));
vi.mock('./NotaFitxa.jsx', () => ({ NotaFitxa: () => null }));
import NotesSection, { LLAVOR_NOTA } from './NotesSection.jsx';
import { etiquetesDeNota } from './NotesContext';
import { desaLlicenciaPerDefecte } from '../../components/universal/drets/herencia.js';
afterEach(cleanup);
test('el model de la llista comparteix labels editorials i data amb la nota de l’editor', () => {
  render(<NotesSection />);
  const item = mocks.model.items[0];
  expect(item.labels).toEqual(etiquetesDeNota(mocks.note, [{ id: 'f-mur', name: 'Mur' }]));
  expect(item.labels.map(label => label.text)).toEqual(['Sistema', 'Tutorial']);
  expect(item.subtitle).toBe(mocks.note.formattedDate);
  expect(item.data.formattedTime).toBe('09:37');
  expect(item.updatedAt).toBe(mocks.note.updatedAt);
});

test('la roda de CARPETES torna: el Bloc passa la seua configuració a l’espai de treball', () => {
  render(<NotesSection />);
  expect(mocks.props.onManageCategories).toBe(mocks.obri);
});

test('en entrar, la primera carpeta (Mur) és la categoria activa inicial', () => {
  render(<NotesSection />);
  expect(mocks.props.initialSelection).toEqual({ categoryId: 'f-mur' });
  expect(mocks.model.navigationGroups[0].options[0].id).toBe('f-mur');
});

test('T1 · el MAS ensenya a «Mercat» només el que ha publicat l’actor, en lectura', () => {
  render(<NotesSection />);
  const publicacions = mocks.model.items.filter((item) => item.kind === 'publicacio');
  expect(publicacions.map((item) => item.title)).toEqual(['Samarreta']);
  expect(publicacions[0].categoryIds).toEqual(['f-mercat']);
  expect(publicacions[0].data.ruta).toBe('/mercat/samarreta');
  /* La carpeta de les connexions (T5) és al catàleg, abans d'«Altres notes». */
  expect(mocks.model.navigationGroups[0].options.map((o) => o.id)).toContain('f-connectats');
});

test('T1 · com a persona, l’article de l’entitat no és seu i el de la persona pilot sí (mode seed)', () => {
  mocks.actor = { tipus: 'persona', id: 'uuid-javi', rol: 'persona' };
  try {
    render(<NotesSection />);
    expect(mocks.model.items.filter((item) => item.kind === 'publicacio').map((item) => item.title)).toEqual(['Mac Mini']);
  } finally {
    mocks.actor = { tipus: 'entitat', id: 'socdepoble', slug: 'soc-de-poble', rol: 'owner' };
  }
});

test('T34 · sense emoticona ni emoji al títol, la llista i el rail reben la ploma; l’emoticona pròpia i l’emoji del títol manen', async () => {
  const { EMOTICONA_PER_DEFECTE } = await import('../../utils/emoji.js');
  const original = mocks.note;
  const glif = (extra) => {
    mocks.note = { ...original, ...extra };
    render(<NotesSection />);
    const item = mocks.model.items.find((i) => i.kind === 'note');
    cleanup();
    return item.icon;
  };
  try {
    expect(glif({ title: '' })).toBe(EMOTICONA_PER_DEFECTE);
    expect(glif({ title: 'Hort' })).toBe(EMOTICONA_PER_DEFECTE);
    /* La dada no es toca: el valor per defecte només viu al model de vista
       (es mira just després d'un cas que rep la ploma). */
    expect(mocks.model.items.find((i) => i.kind === 'note').data.icon).toBeUndefined();
    expect(glif({ title: '', icon: '🍅' })).toBe('🍅');
    expect(glif({ title: '🌱 Hort' })).toBeUndefined();
  } finally {
    mocks.note = original;
  }
});

test('la llavor del cos porta Heading 3 per a esborrar tot', async () => {
  const { LLAVOR_NOTA } = await import('./NotesSection.jsx');
  expect(LLAVOR_NOTA).toMatch(/<h3/i);
  expect(LLAVOR_NOTA).toMatch(/esborrar/i);
});

/* ── T39 (ordre del Mestre, 260928) · la nota nova hereta els drets de sèrie ── */
const ACTOR_ENTITAT = mocks.actor;
const ambActor = async (actor, memberships, cos) => {
  mocks.actor = actor;
  mocks.memberships = memberships;
  mocks.creaNota = vi.fn(async (input) => ({ id: 'nova', ...input }));
  try {
    render(<NotesSection />);
    await cos();
  } finally {
    cleanup();
    mocks.actor = ACTOR_ENTITAT;
    mocks.memberships = undefined;
    for (const id of ['uuid-sense', 'uuid-pep', 'socdepoble']) desaLlicenciaPerDefecte(id, '');
  }
};

test('T39 · sense cap llicència de sèrie, CREAR NOTA fa la petició de sempre (cap clau copyright)', async () => {
  await ambActor({ tipus: 'persona', id: 'uuid-sense', rol: 'persona' }, [], async () => {
    await mocks.props.onCreate({ activeCategoryId: '__all__' });
    expect(mocks.creaNota).toHaveBeenLastCalledWith({ content: LLAVOR_NOTA });
    await mocks.props.onCreate({ activeCategoryId: 'f-mur' });
    expect(mocks.creaNota).toHaveBeenLastCalledWith({ folderId: 'f-mur' });
  });
});

test('T39 · amb els drets triats al Perfil en este dispositiu, la nota nova els porta (també des d’una etiqueta)', async () => {
  desaLlicenciaPerDefecte('uuid-pep', 'CC BY-SA 4.0');
  await ambActor({ tipus: 'persona', id: 'uuid-pep', rol: 'persona' }, [], async () => {
    await mocks.props.onCreate({ activeCategoryId: '__all__' });
    expect(mocks.creaNota).toHaveBeenLastCalledWith({ content: LLAVOR_NOTA, copyright: 'CC BY-SA 4.0' });
    // Es compon DESPRÉS de les branques que reassignen l'entrada sencera.
    await mocks.props.onCreate({ activeCategoryId: '__all__', category: { groupId: 'tags', label: 'Hort' } });
    expect(mocks.creaNota).toHaveBeenLastCalledWith({ tags: ['Hort'], copyright: 'CC BY-SA 4.0' });
  });
});

test('T39 · com a entitat, el copyright de la seua fitxa (pertinença) guanya a la preferència del dispositiu', async () => {
  desaLlicenciaPerDefecte('socdepoble', 'CC BY 4.0');
  await ambActor(ACTOR_ENTITAT, [{ id: 'socdepoble', role: 'owner', copyright: 'CC BY-NC 4.0' }], async () => {
    await mocks.props.onCreate({ activeCategoryId: '__all__' });
    expect(mocks.creaNota).toHaveBeenLastCalledWith({ content: LLAVOR_NOTA, copyright: 'CC BY-NC 4.0' });
  });
  desaLlicenciaPerDefecte('socdepoble', 'CC BY 4.0');
  await ambActor(ACTOR_ENTITAT, [{ id: 'socdepoble', role: 'owner', copyright: '' }], async () => {
    await mocks.props.onCreate({ activeCategoryId: '__all__' });
    expect(mocks.creaNota).toHaveBeenLastCalledWith({ content: LLAVOR_NOTA, copyright: 'CC BY 4.0' });
  });
});
