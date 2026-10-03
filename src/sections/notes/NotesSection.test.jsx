import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ model: null, props: null, obri: () => {}, creaNota: null, memberships: undefined, params: new URLSearchParams('nota=n1'), note: { id: 'n1', folderId: 'f-mur', categories: ['Sistema'], tags: ['Tutorial'], formattedDate: '02/01/26', formattedTime: '09:37', updatedAt: '2026-01-02T08:37:00Z' },
  noteFolders: [{ id: 'f-mur', name: 'Mur' }],
  actor: { tipus: 'entitat', id: 'socdepoble', slug: 'soc-de-poble', rol: 'owner' },
  /* P4 · la sessió i el mode de dades de la regla d'entrada; el canal de la nota preparada. */
  config: { dataMode: 'seed' }, teSessio: undefined, canCreate: true, preparada: null,
  mercat: [
    { id: 'samarreta', title: 'Samarreta', author_entity_id: 'socdepoble', seller: 'Sóc de Poble', created_at: '2026-08-15T12:33:00.000Z' },
    { id: 'mac-mini', title: 'Mac Mini', author_id: 'javillinares', seller: 'Javi', created_at: '2026-02-15T12:00:00.000Z' }
  ] }));
vi.mock('./NotesContext', async importOriginal => ({ ...await importOriginal(), useNotes: () => ({
  notes: [mocks.note], noteFolders: mocks.noteFolders, status: 'ready', canCreate: mocks.canCreate, teSessio: mocks.teSessio,
  obriConfiguracioNotes: mocks.obri,
  /* T39 · la nota nova: la prova mira què rep creaNota. */
  creaNota: (...args) => mocks.creaNota(...args)
}) }));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: mocks.config }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useSearchParams: () => [mocks.params, vi.fn()] }));
/* T1 · el MAS creua el Mur amb l'actor: ací un actor de proves i un Mercat amb un article seu i un d'altri. */
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: mocks.actor, memberships: mocks.memberships }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sortedFeedPosts: [], sortedEvents: [], sortedMarketItems: mocks.mercat }) }));
/* El Workspace fals pinta el detall buit del Bloc (el snippet té les seues
   proves): el NotesDetail fals hi llig el canal de la nota preparada (P4),
   el que rep l'editor de veres. */
vi.mock('../../components/universal/workspace/UniversalWorkspace', () => ({ UniversalWorkspace: (props) => {
  mocks.model = props.model;
  mocks.props = props;
  return props.compacte ? null : (props.renderDetail?.({ item: null }) ?? null);
} }));
vi.mock('./NotesDetail.jsx', async () => {
  const { useNotaPreparadaDelBloc } = await import('./notaPreparada.js');
  function DetallFals() {
    mocks.preparada = useNotaPreparadaDelBloc();
    return null;
  }
  return { default: DetallFals };
});
vi.mock('./NotaFitxa.jsx', () => ({ NotaFitxa: () => null }));
/* T71 · la fitxa de lectura de les connexions té les seues proves (ConnexioFitxa.test.jsx). */
vi.mock('./ConnexioFitxa.jsx', () => ({ ConnexioFitxa: () => null }));
import NotesSection, { LLAVOR_NOTA } from './NotesSection.jsx';
import { NotaFitxa } from './NotaFitxa.jsx';
import { ConnexioFitxa } from './ConnexioFitxa.jsx';
import { PublicacioFitxa } from './PublicacioDetall.jsx';
import { etiquetesDeNota } from './NotesContext';
import { desaLlicenciaPerDefecte } from '../../components/universal/drets/herencia.js';
import { LLICENCIA_PER_DEFECTE } from '../../components/universal/drets/llicencies.js';
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

/* ── T71 · una connexió és un accés directe de lectura; el contingut de fora, una nota teua ── */
const ambNota = (extra, cos) => {
  const original = mocks.note;
  mocks.note = { ...original, ...extra };
  try {
    render(<NotesSection />);
    return cos(mocks.model.items.find((i) => i.id === String(mocks.note.id)));
  } finally {
    cleanup();
    mocks.note = original;
  }
};

test('T71 · una connexió és kind «connexio», sense ploma ni glif propi, i la llista la pinta amb ConnexioFitxa', () => {
  ambNota({ id: 'c1', title: 'L’Ànima de la IAIA', folderId: 'f-connectats', origen: { tipus: 'connexio', itemId: '/ia', ruta: '/ia' } }, (item) => {
    expect(item.kind).toBe('connexio');
    expect(item.icon).toBeUndefined();
    expect(item.categoryIds[0]).toBe('f-connectats');
    const activa = mocks.props.renderItem({ item, active: true, onSelect: () => {} });
    expect(activa.type).toBe(ConnexioFitxa);
    expect(activa.props).toMatchObject({ item, active: true });
  });
  /* Revisió de D4 (260930) · Abans una emoticona desada s'anul·lava («una
     connexió no s'edita»); ara la connexió és una còpia editable i
     l'emoticona triada mana a la llista i al rail. Sense emoticona, cap ploma
     per defecte (dalt). */
  ambNota({ id: 'c2', icon: '🍅', origen: { tipus: 'connexio', itemId: 'x' } }, (item) => {
    expect(item.kind).toBe('connexio');
    expect(item.icon).toBe('🍅');
  });
});

test('T71 · les notes pròpies continuen amb NotaFitxa i les publicacions amb PublicacioFitxa', () => {
  ambNota({}, (item) => {
    expect(item.kind).toBe('note');
    expect(mocks.props.renderItem({ item, active: true, onSelect: () => {} }).type).toBe(NotaFitxa);
  });
  render(<NotesSection />);
  const publicacio = mocks.model.items.find((i) => i.kind === 'publicacio');
  expect(mocks.props.renderItem({ item: publicacio, active: false, onSelect: () => {} }).type).toBe(PublicacioFitxa);
});

test('T71 · el contingut de fora és una nota (s’edita), sense la ploma per defecte; l’emoticona triada mana', async () => {
  const { EMOTICONA_PER_DEFECTE } = await import('../../utils/emoji.js');
  const origen = { tipus: 'extern', url: 'https://exemple.org/', lloc: 'exemple.org' };
  ambNota({ id: 'e1', title: 'Coca de llanda', origen }, (item) => {
    expect(item.kind).toBe('note');
    expect(item.icon).toBeUndefined();
    expect(item.icon).not.toBe(EMOTICONA_PER_DEFECTE);
    expect(mocks.props.renderItem({ item, active: false, onSelect: () => {} }).type).toBe(NotaFitxa);
  });
  ambNota({ id: 'e2', title: 'Coca', icon: '🍰', origen }, (item) => expect(item.icon).toBe('🍰'));
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
  try {
    await cos();
  } finally {
    cleanup();
    mocks.actor = ACTOR_ENTITAT;
    mocks.memberships = undefined;
    for (const id of ['uuid-sense', 'uuid-pep', 'socdepoble']) desaLlicenciaPerDefecte(id, '');
  }
};

/* P4 (ordre del Mestre, 261003) · CREAR NOTA ja no crida creaNota: obri la
   nota preparada a on és la persona, i la primera cosa que s'hi escriu la
   crea, una sola vegada i amb el mateix id. Torna el que rep creaNota, sense
   l'id ni el títol escrit (la resta és l'entrada de T39/D15). */
const TITOL_ESCRIT = '<p>Hort de maig</p>';
const entradaDeCrearDes = async (activeCategoryId) => {
  mocks.creaNota = vi.fn(async (input) => ({ id: input.id, ...input }));
  render(<NotesSection />);
  try {
    await act(async () => { await mocks.props.onCreate({ activeCategoryId }); });
    const preparada = mocks.model.items.find((item) => item.data?.preparada);
    expect(preparada.title).toBe('Nota sense títol');
    // Obrir-la no crea res al servidor.
    expect(mocks.creaNota).not.toHaveBeenCalled();
    await act(async () => { mocks.preparada.escriu(preparada.id, 'title', TITOL_ESCRIT); });
    expect(mocks.creaNota).toHaveBeenCalledTimes(1);
    const { id, title, ...entrada } = mocks.creaNota.mock.lastCall[0];
    expect(id).toBe(preparada.id);
    expect(title).toBe(TITOL_ESCRIT);
    return entrada;
  } finally {
    cleanup();
  }
};

/* D15 (ordre del Mestre, 260930) · Abans (T39), sense herència CREAR NOTA no
   enviava la clau `copyright` i la nota es pintava «© Sóc de Poble». Ara la
   nota nova naix amb la Creative Commons de sèrie (LLICENCIA_PER_DEFECTE).
   P4 · La nota naix en escriure-hi, no en prémer CREAR NOTA: l'entrada és la mateixa. */
test('D15 · sense cap llicència de sèrie, la nota nova naix amb la Creative Commons per defecte', async () => {
  expect(LLICENCIA_PER_DEFECTE).toBe('CC BY-NC-SA 4.0');
  await ambActor({ tipus: 'persona', id: 'uuid-sense', rol: 'persona' }, [], async () => {
    expect(await entradaDeCrearDes('__all__')).toEqual({ content: LLAVOR_NOTA, copyright: LLICENCIA_PER_DEFECTE });
    expect(await entradaDeCrearDes('f-mur')).toEqual({ folderId: 'f-mur', copyright: LLICENCIA_PER_DEFECTE });
    // També des d'una categoria (la que porta l'espai de treball: cat_…).
    expect(await entradaDeCrearDes('cat_Sistema')).toEqual({ categories: ['Sistema'], copyright: LLICENCIA_PER_DEFECTE });
  });
  // Una entitat sense copyright a la pertinença ni preferència: també la de sèrie.
  await ambActor(ACTOR_ENTITAT, [{ id: 'socdepoble', role: 'owner', copyright: '' }], async () => {
    expect(await entradaDeCrearDes('__all__')).toEqual({ content: LLAVOR_NOTA, copyright: LLICENCIA_PER_DEFECTE });
  });
});

test('D15 · amb herència, la nota nova porta la heretada i no la de sèrie', async () => {
  desaLlicenciaPerDefecte('uuid-pep', 'CC BY 4.0');
  await ambActor({ tipus: 'persona', id: 'uuid-pep', rol: 'persona' }, [], async () => {
    const entrada = await entradaDeCrearDes('__all__');
    expect(entrada).toEqual({ content: LLAVOR_NOTA, copyright: 'CC BY 4.0' });
    expect(entrada.copyright).not.toBe(LLICENCIA_PER_DEFECTE);
  });
});

test('D15 · no és retroactiu: una nota vella sense drets no en rep cap en pintar-la', () => {
  ambNota({ id: 'vella', copyright: undefined }, (item) => {
    expect(item.data.copyright).toBeUndefined();
  });
  // Pintar la llista no crea cap nota.
  mocks.creaNota = vi.fn();
  render(<NotesSection />);
  expect(mocks.creaNota).not.toHaveBeenCalled();
});

test('T39 · amb els drets triats al Perfil en este dispositiu, la nota nova els porta (també des d’una etiqueta)', async () => {
  desaLlicenciaPerDefecte('uuid-pep', 'CC BY-SA 4.0');
  await ambActor({ tipus: 'persona', id: 'uuid-pep', rol: 'persona' }, [], async () => {
    expect(await entradaDeCrearDes('__all__')).toEqual({ content: LLAVOR_NOTA, copyright: 'CC BY-SA 4.0' });
    // Es compon DESPRÉS de l'entrada per carpeta, categoria o etiqueta.
    expect(await entradaDeCrearDes('tag_Tutorial')).toEqual({ tags: ['Tutorial'], copyright: 'CC BY-SA 4.0' });
  });
});

test('T39 · com a entitat, el copyright de la seua fitxa (pertinença) guanya a la preferència del dispositiu', async () => {
  desaLlicenciaPerDefecte('socdepoble', 'CC BY 4.0');
  await ambActor(ACTOR_ENTITAT, [{ id: 'socdepoble', role: 'owner', copyright: 'CC BY-NC 4.0' }], async () => {
    expect(await entradaDeCrearDes('__all__')).toEqual({ content: LLAVOR_NOTA, copyright: 'CC BY-NC 4.0' });
  });
  desaLlicenciaPerDefecte('socdepoble', 'CC BY 4.0');
  await ambActor(ACTOR_ENTITAT, [{ id: 'socdepoble', role: 'owner', copyright: '' }], async () => {
    expect(await entradaDeCrearDes('__all__')).toEqual({ content: LLAVOR_NOTA, copyright: 'CC BY 4.0' });
  });
});

/* ── P4 (ordre del Mestre, 261003) · Regressió UX del Bloc de Notes ── */
const preparadaDelModel = () => mocks.model.items.find((item) => item.data?.preparada) || null;
const ambRegla = (config, teSessio, canCreate, cos) => {
  Object.assign(mocks, { config, teSessio, canCreate });
  try {
    render(<NotesSection />);
    cos();
  } finally {
    cleanup();
    Object.assign(mocks, { config: { dataMode: 'seed' }, teSessio: undefined, canCreate: true });
  }
};

test('P4 · «Connecta per veure les teues notes» només sense sessió i amb dades remotes', () => {
  ambRegla({ dataMode: 'remote' }, false, false, () => {
    expect(mocks.props.labels.empty).toBe('Connecta per veure les teues notes.');
    // Sense sessió no es pot crear: cap botó, cap nota preparada.
    expect(mocks.model.canCreate).toBe(false);
    expect(preparadaDelModel()).toBeNull();
  });
  /* Amb sessió, mai: tampoc mentre es carrega o es revalida (canCreate de
     les dades és fals). El botó es queda (l'espai de treball el desactiva). */
  ambRegla({ dataMode: 'remote' }, true, false, () => {
    expect(mocks.props.labels.empty).toBe('No hi ha notes.');
    expect(mocks.model.canCreate).toBe(true);
    expect(preparadaDelModel()).not.toBeNull();
  });
  // En seed o local les notes són del dispositiu: cap «Connecta…», també sense sessió.
  for (const dataMode of ['seed', 'local']) {
    ambRegla({ dataMode }, false, true, () => {
      expect(mocks.props.labels.empty, dataMode).toBe('No hi ha notes.');
      expect(mocks.model.canCreate, dataMode).toBe(true);
    });
  }
});

test('P4 · la nota preparada: «Nota sense títol», a totes les entrades de la navegació, al final i sense crear-se', () => {
  mocks.creaNota = vi.fn();
  render(<NotesSection />);
  const preparada = preparadaDelModel();
  expect(preparada.title).toBe('Nota sense títol');
  expect(preparada.kind).toBe('note');
  expect(preparada.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  // Després de les notes i les publicacions: en entrar s'obri la primera nota de sempre.
  expect(mocks.model.items.at(-1)).toBe(preparada);
  const ids = mocks.model.navigationGroups.flatMap((grup) => grup.options.map((opcio) => String(opcio.id)));
  expect(ids.filter((id) => !preparada.categoryIds.includes(id))).toEqual([]);
  // CREAR NOTA la torna a ella: l'espai de treball la tria.
  expect(mocks.props.onCreate).toBeTypeOf('function');
  expect(mocks.creaNota).not.toHaveBeenCalled();
});

test('P4 · CREAR NOTA torna la nota preparada, i obrir-la o triar-ne la carpeta no crea res', async () => {
  mocks.creaNota = vi.fn(async (input) => ({ id: input.id, ...input }));
  render(<NotesSection />);
  let triada;
  await act(async () => { triada = await mocks.props.onCreate({ activeCategoryId: 'f-mur' }); });
  expect(triada.id).toBe(preparadaDelModel().id);
  // La carpeta, l'emoticona o un cos que només és la llavor no són «escriure».
  await act(async () => {
    mocks.preparada.escriu(triada.id, 'folderId', 'f-notes');
    mocks.preparada.escriu(triada.id, 'icon', '🍅');
    mocks.preparada.escriu(triada.id, 'content', LLAVOR_NOTA);
    mocks.preparada.escriu(triada.id, 'content', '<p></p>');
  });
  expect(mocks.creaNota).not.toHaveBeenCalled();
  // Es veu a la llista i a l'editor, encara sense servidor.
  expect(preparadaDelModel().data).toMatchObject({ folderId: 'f-notes', icon: '🍅', content: '<p></p>' });
  await act(async () => { mocks.preparada.escriu(triada.id, 'content', '<p>Comprar planter</p>'); });
  expect(mocks.creaNota).toHaveBeenCalledTimes(1);
  expect(mocks.creaNota.mock.lastCall[0]).toEqual({
    id: triada.id, folderId: 'f-notes', icon: '🍅', content: '<p>Comprar planter</p>', copyright: LLICENCIA_PER_DEFECTE
  });
});

test('P4 · al Snippet Curador no hi ha nota preparada', () => {
  const original = mocks.params;
  mocks.params = new URLSearchParams('mode=desa&url=https%3A%2F%2Fexemple.org%2F');
  try {
    render(<NotesSection />);
    expect(preparadaDelModel()).toBeNull();
    expect(mocks.props.onCreate).toBeUndefined();
  } finally {
    mocks.params = original;
  }
});

/* ── T7 · Closca i navegació (el recorregut sencer per la URL, a NotesSection.url.test.jsx) ── */
test('T7 (P3) · el Bloc arrenca amb la columna de carpetes plegada en rail; (P5) el filtre inclou les subcarpetes', () => {
  render(<NotesSection />);
  expect(mocks.props.columnesInicials).toEqual({ left: true });
  expect(mocks.props.inclouDescendents).toBe(true);
});

test('T7 (P5) · les carpetes conserven el parentId: plana, totes a l’arrel; niada, el pare', () => {
  render(<NotesSection />);
  expect(mocks.model.navigationGroups[0].options.map((o) => [o.id, o.parentId])).toEqual([['f-mur', null], ['f-connectats', null]]);
  cleanup();
  const original = mocks.noteFolders;
  mocks.noteFolders = [{ id: 'tic', name: 'TIC', parentId: null }, { id: 'foto', name: 'Foto', parentId: 'tic' }, { id: 7, name: 'Antigravity', parentId: 'foto' }];
  try {
    render(<NotesSection />);
    const opcions = mocks.model.navigationGroups[0].options;
    expect(opcions.map((o) => [o.id, o.label, o.parentId])).toEqual([
      ['tic', 'TIC', null], ['foto', 'Foto', 'tic'], ['7', 'Antigravity', 'foto'], ['f-connectats', 'Safata d’Entrada', null]
    ]);
    expect(opcions.map((o) => o.order)).toEqual([0, 1, 2, 3]);
  } finally {
    mocks.noteFolders = original;
  }
});

test('T7 (P9) · la carpeta i la nota de la URL són la selecció; la carpeta també és la inicial', () => {
  const original = mocks.params;
  mocks.params = new URLSearchParams('carpeta=f-mercat&nota=n1&seccio=intro');
  try {
    render(<NotesSection />);
    expect(mocks.props.selection).toEqual({ categoryId: 'f-mercat', itemId: 'n1' });
    expect(mocks.props.initialSelection).toEqual({ categoryId: 'f-mercat' });
  } finally {
    mocks.params = original;
  }
  render(<NotesSection />);
  expect(mocks.props.selection).toEqual({ categoryId: undefined, itemId: 'n1' });
});
