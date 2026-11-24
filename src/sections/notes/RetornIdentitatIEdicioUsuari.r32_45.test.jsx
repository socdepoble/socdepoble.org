/**
 * RetornIdentitatIEdicioUsuari.r32_45.test.jsx — R32.45 · Lots 01 i 02
 *
 * Verifica:
 *   1. IDEA-324 v3: quan Javi (persona) prem «✏️ Editar» sobre una pàgina de
 *      Sistema o d'una entitat (`El Rentonar`), `useEdicioEnLloc` commuta a
 *      l'entitat, guarda `actorAnterior` i `PublicacioEditable` mostra el bàner
 *      en les 5 llengües («Per a editar este contingut, ara actues com a Sóc de
 *      Poble.», v1.2.23 · L5-07 (Gauntlet R1)) i, en publicar o prémer «Tornar», ofereix la confirmació
 *      d'1 clic «Vols tornar a ser Javi Llinares?» amb les dues opcions:
 *      [Sí, torna a Javi Llinares] i [No, queda’t com a Sóc de Poble].
 *   2. Edició d'anada i tornada per a Beta Tester normal (no superadmin):
 *      - Post al Mur (personal o d'entitat signable),
 *      - Acte als Esdeveniments / Calendari (preservant i modificant data, hora i lloc),
 *      - Producte al Mercat (preservant i modificant preu, unitat, categoria i foto),
 *      i ocultació / rebuig estricte sobre peces d'altres veïns.
 */
import React, { useContext } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const estat = vi.hoisted(() => ({
  currentUser: null,
  esSuperadmin: false,
  actor: null,
  actorType: 'persona',
  actorId: null,
  memberships: [],
  setActor: vi.fn(() => true),
  toast: vi.fn(),
  navigate: vi.fn(),
  pathname: '/page/descarregues',
  search: '',
  paramsNotes: new URLSearchParams(),
  idioma: 'ca',
  editorCtx: null,
  editorNota: null
}));

vi.mock('./NotesEditor.jsx', async () => {
  const { NotesContext: Context } = await import('./objectesDeContext.js');
  return {
    default: function DobleNotesEditor({ activeNote }) {
      const ctx = useContext(Context);
      estat.editorCtx = ctx;
      estat.editorNota = activeNote;
      return React.createElement(
        'div',
        { 'data-testid': 'doble-editor-r3245' },
        React.createElement('span', { 'data-testid': 'nota-titol' }, activeNote?.title || ''),
        React.createElement('span', { 'data-testid': 'nota-ambit' }, activeNote?.fitxa?.ambit || 'cap'),
        React.createElement('span', { 'data-testid': 'nota-preu' }, activeNote?.fitxa?.dades?.preu || ''),
        React.createElement('span', { 'data-testid': 'nota-lloc' }, activeNote?.fitxa?.dades?.lloc || ''),
        React.createElement(
          'button',
          { type: 'button', onClick: () => ctx.publishNote(activeNote) },
          'Actualitzar al Mur'
        )
      );
    }
  };
});

vi.mock('../../app/contexts/RouterContext', () => ({
  useRouter: () => ({
    memoria: true,
    currentPath: estat.pathname,
    searchParams: estat.paramsNotes,
    navigate: estat.navigate,
    basename: ''
  }),
  useNavigate: () => estat.navigate,
  useLocation: () => ({
    pathname: estat.pathname,
    search: estat.search,
    hash: '',
    state: null
  }),
  useSearchParams: () => [estat.paramsNotes, (nous) => {
    estat.paramsNotes = nous instanceof URLSearchParams ? nous : new URLSearchParams(nous);
  }],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
  Navigate: () => null
}));

vi.mock('../../app/contexts/SessionContext', () => ({
  useSessioOpcional: () => ({
    currentUser: estat.currentUser,
    estat: estat.currentUser ? 'dins' : 'fora',
    esSuperadmin: estat.esSuperadmin,
    config: { dataMode: 'remote' }
  })
}));

vi.mock('../../app/contexts/IdentitatContext', () => ({
  potSignarPer: (m) => Boolean(m && ['owner', 'admin', 'editor'].includes(m.role)),
  useIdentitatOpcional: () => ({
    actor: estat.actor,
    actorType: estat.actorType,
    actorId: estat.actorId,
    memberships: estat.memberships,
    setActor: estat.setActor
  })
}));

vi.mock('../../app/contexts/useIdentitatOReserva.js', () => ({
  useIdentitatOReserva: () => ({ actor: estat.actor })
}));

vi.mock('../../hooks/useSuperadminEstable.js', () => ({
  useSuperadminEstable: () => ({ esSuperadmin: estat.esSuperadmin, rolPendent: false })
}));

vi.mock('../../app/contexts/UIContext', () => ({
  useUIStateOpcional: () => ({ language: estat.idioma, llenguaDelText: estat.idioma }),
  useUIActions: () => ({ t: (_k, fb) => fb, language: estat.idioma }),
  useUIActionsOpcional: () => ({ t: (_k, fb) => fb, language: estat.idioma })
}));

vi.mock('@/components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: estat.toast })
}));

vi.mock('../../components/universal/NotificationContext', () => ({
  useToast: () => ({ showToast: estat.toast })
}));

import { useEdicioEnLloc } from '../../hooks/useEdicioEnLloc.js';
import { PublicacioEditable } from './PublicacioEditable.jsx';
import { ValorDeNotes } from './NotesContext.jsx';
import { publicacioComANota } from './masDeLUsuari.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { _reiniciaRevisionsEditorialsPerAProves } from '../../data/revisionsEditorials.js';
import { _reiniciaRetornIdentitatPerAProves, llegixCanviIdentitatEdicio } from '../../data/retornIdentitatEdicio.js';
import { TEXTOS_EDICIO_SISTEMA } from './i18nEdicioSistema.js';
import { installaIdbMemoriaTest } from './__fixtures__/idbMemoriaTest.js';

const UUID_MERCAT = '4a1b2c3d-5e6f-4a70-8b9c-0d1e2f3a4b5c';
const UUID_CALENDARI = '7b2c3d4e-6f70-4b81-9c0d-1e2f3a4b5c6d';

function SondaEdicio({ opcions }) {
  const ed = useEdicioEnLloc(opcions);
  return ed.editarVisible
    ? <button type="button" onClick={ed.onEdit}>{ed.editLabel}</button>
    : null;
}

const creaContextNotes = (overrides = {}) => ({
  notes: [],
  noteFolders: [],
  status: 'ready',
  config: { dataMode: 'remote' },
  nomesLectura: false,
  scopeKey: 'ambit-prova',
  workspaceKey: 'ambit-prova',
  t: (_k, fb) => fb,
  rebuigDePublicacio: vi.fn(() => null),
  creaNota: vi.fn(async (input) => ({ ...input, revision: 0 })),
  updateNote: vi.fn(async (id, canvis, rev) => ({ id, ...canvis, revision: rev + 1 })),
  publishNote: vi.fn(async () => true),
  saveNoteField: vi.fn(),
  setLocalNoteField: vi.fn(),
  ...overrides
});

describe('R32.45 · Lot 01 · Retorn d’identitat «Vols tornar a ser Javi?» (IDEA-324 v3) en 5 llengües', () => {
  let restauraIdb = null;

  beforeEach(() => {
    restauraIdb = installaIdbMemoriaTest();
    _reiniciaRevisionsEditorialsPerAProves();
    _reiniciaRetornIdentitatPerAProves();
    estat.currentUser = { id: '0001', full_name: 'Javi Llinares' };
    estat.esSuperadmin = true;
    estat.actor = { tipus: 'persona', id: '0001', nom: 'Javi Llinares', rol: 'persona' };
    estat.actorType = 'persona';
    estat.actorId = '0001';
    estat.memberships = [{ id: 'socdepoble', slug: 'socdepoble', name: 'Sóc de Poble', role: 'owner' }];
    estat.setActor.mockClear();
    estat.toast.mockClear();
    estat.navigate.mockClear();
    estat.pathname = '/page/descarregues';
    estat.search = '';
    estat.paramsNotes = new URLSearchParams();
    estat.idioma = 'ca';
  });

  afterEach(() => {
    cleanup();
    _reiniciaRevisionsEditorialsPerAProves();
    _reiniciaRetornIdentitatPerAProves();
    restauraIdb?.();
    restauraIdb = null;
  });

  test('paritat estructural en les 5 llengües a i18nEdicioSistema', () => {
    const clausCa = Object.keys(TEXTOS_EDICIO_SISTEMA.ca).sort();
    for (const lang of ['es', 'en', 'eu', 'gl']) {
      expect(Object.keys(TEXTOS_EDICIO_SISTEMA[lang]).sort()).toEqual(clausCa);
    }
  });

  /* v1.2.23 · L5-07 (Gauntlet R1) · L'avís diu el mateix en les 5 llengües, en valencià
     normatiu: el Mas ha canviat la identitat per a editar, i el que s'edita és «contingut». */
  test.each([
    ['ca', 'Per a editar este contingut, ara actues com a {actual}.'],
    ['es', 'Para editar este contenido, ahora actúas como {actual}.'],
    ['en', 'To edit this content, you are now acting as {actual}.'],
    ['eu', 'Eduki hau editatzeko, orain {actual} gisa ari zara.'],
    ['gl', 'Para editar este contido, agora actúas como {actual}.']
  ])('v1.2.23 · L5-07 · avisCanviPerfil en «%s»', (llengua, text) => {
    expect(TEXTOS_EDICIO_SISTEMA[llengua].avisCanviPerfil).toBe(text);
  });

  test('Javi -> Sóc de Poble: mostra l’avís de canvi de perfil i en publicar pregunta «Vols tornar a ser Javi Llinares?» amb Sí (restaura persona) i No (manté Sóc de Poble)', async () => {
    // 1. Javi prem Editar a /page/descarregues
    const { unmount } = render(<SondaEdicio opcions={{ tipus: 'pagina', pageKey: 'descarregues' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(estat.setActor).toHaveBeenCalledWith('entitat', 'socdepoble');
    unmount();

    // 2. Ara l'actor actiu és Sóc de Poble a /notes?...&retorn=%2Fpage%2Fdescarregues
    estat.actor = { tipus: 'entitat', id: 'socdepoble', slug: 'socdepoble', nom: 'Sóc de Poble', rol: 'owner' };
    estat.actorType = 'entitat';
    estat.actorId = 'socdepoble';
    estat.setActor.mockClear();
    estat.navigate.mockClear();
    estat.paramsNotes = new URLSearchParams('carpeta=f-sistema&nota=publicacio:sistema:descarregues&plegades=1&retorn=%2Fpage%2Fdescarregues');

    const itemSistema = {
      id: 'publicacio:sistema:descarregues',
      kind: 'publicacio',
      title: PAGE_COPY.descarregues.title,
      categoryIds: ['f-sistema'],
      data: {
        seccio: 'sistema',
        ruta: '/page/descarregues',
        baseCanonica: { ...PAGE_COPY.descarregues, id: 'descarregues', isSystemPage: true },
        item: { ...PAGE_COPY.descarregues, id: 'descarregues', isSystemPage: true, author_org_id: 'socdepoble', author_name: 'Sóc de Poble' }
      }
    };

    const ctx = creaContextNotes({ config: { dataMode: 'seed' } });
    render(
      <ValorDeNotes value={ctx}>
        <PublicacioEditable item={itemSistema} />
      </ValorDeNotes>
    );

    // Bàner visible informant del canvi de perfil
    expect(screen.getByText('Per a editar este contingut, ara actues com a Sóc de Poble.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tornar' })).toBeTruthy();

    // Edita i prem Actualitzar -> NO navega a cegues, obri la pregunta d'1 clic!
    act(() => {
      estat.editorCtx.setLocalNoteField(estat.editorNota.id, 'title', 'Descàrregues v1.2.22');
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Actualitzar al Mur' }));
    });
    expect(estat.navigate).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('Vols tornar a ser Javi Llinares?')).toBeTruthy();
    });

    // Tria «Sí, torna a Javi Llinares» -> restaura persona i navega a /page/descarregues
    fireEvent.click(screen.getByRole('button', { name: 'Sí, torna a Javi Llinares' }));
    expect(estat.setActor).toHaveBeenCalledWith('persona');
    expect(estat.navigate).toHaveBeenCalledWith('/page/descarregues');
  });

  test('prémer «Tornar» sense publicar també pregunta i triar «No, queda’t com a...» conserva l’entitat (provat en castellà)', () => {
    estat.idioma = 'es';
    const { unmount } = render(<SondaEdicio opcions={{ tipus: 'pagina', pageKey: 'versions' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    unmount();

    estat.actor = { tipus: 'entitat', id: 'socdepoble', slug: 'socdepoble', nom: 'Sóc de Poble', rol: 'owner' };
    estat.actorType = 'entitat';
    estat.actorId = 'socdepoble';
    estat.setActor.mockClear();
    estat.navigate.mockClear();
    estat.paramsNotes = new URLSearchParams('carpeta=f-sistema&nota=publicacio:sistema:versions&plegades=1&retorn=%2Fpage%2Fdescarregues');

    const itemVersions = {
      id: 'publicacio:sistema:versions',
      kind: 'publicacio',
      title: PAGE_COPY.versions.title,
      categoryIds: ['f-sistema'],
      data: {
        seccio: 'sistema',
        ruta: '/versions',
        item: { ...PAGE_COPY.versions, id: 'versions', isSystemPage: true, author_org_id: 'socdepoble', author_name: 'Sóc de Poble' }
      }
    };

    render(
      <ValorDeNotes value={creaContextNotes({ config: { dataMode: 'seed' } })}>
        <PublicacioEditable item={itemVersions} />
      </ValorDeNotes>
    );

    expect(screen.getByText('Para editar este contenido, ahora actúas como Sóc de Poble.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByText('¿Quieres volver a ser Javi Llinares?')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'No, seguir como Sóc de Poble' }));
    expect(estat.setActor).not.toHaveBeenCalled();
    expect(estat.navigate).toHaveBeenCalledWith('/page/descarregues');
  });

  /* v1.2.23 · L5-03 (Gauntlet R1) · La segona edició amb la identitat que el Mas ja havia
     commutat esborrava el retorn: «Vols tornar a ser Javi Llinares?» no tornava a eixir. */
  const SOC_DE_POBLE = Object.freeze({ tipus: 'entitat', id: 'socdepoble', slug: 'socdepoble', nom: 'Sóc de Poble', rol: 'owner' });
  const editaComASocDePoble = (opcions) => {
    estat.actor = SOC_DE_POBLE;
    estat.actorType = 'entitat';
    estat.actorId = 'socdepoble';
    estat.setActor.mockClear();
    estat.navigate.mockClear();
    const { unmount } = render(<SondaEdicio opcions={opcions} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    unmount();
  };
  const primeraEdicio = () => {
    const { unmount } = render(<SondaEdicio opcions={{ tipus: 'pagina', pageKey: 'descarregues' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(estat.setActor).toHaveBeenCalledWith('entitat', 'socdepoble');
    unmount();
    expect(llegixCanviIdentitatEdicio({ retorn: '/page/descarregues' })?.anterior.nom).toBe('Javi Llinares');
  };

  test('v1.2.23 · L5-03 · una segona edició amb Sóc de Poble ja actiu conserva el retorn a Javi Llinares i el porta a la pàgina nova', () => {
    primeraEdicio();
    estat.pathname = '/versions';
    editaComASocDePoble({ tipus: 'pagina', pageKey: 'versions' });
    expect(estat.setActor).not.toHaveBeenCalled();
    expect(estat.navigate.mock.calls[0][0]).toContain('retorn=%2Fversions');
    expect(llegixCanviIdentitatEdicio({ retorn: '/versions' })).toMatchObject({
      anterior: { tipus: 'persona', id: '0001', nom: 'Javi Llinares' },
      desti: { tipus: 'entitat', id: 'socdepoble' },
      retorn: '/versions'
    });

    estat.paramsNotes = new URLSearchParams('carpeta=f-sistema&nota=publicacio:sistema:versions&plegades=1&retorn=%2Fversions');
    render(
      <ValorDeNotes value={creaContextNotes({ config: { dataMode: 'seed' } })}>
        <PublicacioEditable item={{
          id: 'publicacio:sistema:versions',
          kind: 'publicacio',
          title: PAGE_COPY.versions.title,
          categoryIds: ['f-sistema'],
          data: {
            seccio: 'sistema',
            ruta: '/versions',
            item: { ...PAGE_COPY.versions, id: 'versions', isSystemPage: true, author_org_id: 'socdepoble', author_name: 'Sóc de Poble' }
          }
        }} />
      </ValorDeNotes>
    );
    expect(screen.getByText('Per a editar este contingut, ara actues com a Sóc de Poble.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tornar' }));
    expect(screen.getByText('Vols tornar a ser Javi Llinares?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sí, torna a Javi Llinares' }));
    expect(estat.setActor).toHaveBeenCalledWith('persona');
    expect(estat.navigate).toHaveBeenLastCalledWith('/versions');
  });

  test('v1.2.23 · L5-03 · contracas: si l’actor ja no és el destí, o la sessió és d’una altra persona, el retorn s’oblida', () => {
    /* v1.2.23 · L5-03 (Gauntlet R1) · Javi ha tornat a ser ell mateix (la barra negra) i edita, com a superadmin, un acte d'un veí: cap canvi d'actor. */
    primeraEdicio();
    estat.actor = { tipus: 'persona', id: '0001', nom: 'Javi Llinares', rol: 'persona' };
    estat.actorType = 'persona';
    estat.actorId = '0001';
    estat.setActor.mockClear();
    estat.pathname = '/events/acte-vei-1';
    const { unmount } = render(<SondaEdicio opcions={{
      tipus: 'publicacio', sectionId: 'events', item: { id: 'acte-vei-1', title: 'Festa', author_user_id: 'vei-99', author_name: 'Veí' }
    }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    unmount();
    expect(estat.setActor).not.toHaveBeenCalled();
    expect(llegixCanviIdentitatEdicio()).toBeNull();

    /* v1.2.23 · L5-03 (Gauntlet R1) · Una altra persona entra en la mateixa pestanya i, com a Sóc de Poble, edita: no hereta el retorn a Javi. */
    estat.pathname = '/page/descarregues';
    estat.actor = { tipus: 'persona', id: '0001', nom: 'Javi Llinares', rol: 'persona' };
    estat.actorType = 'persona';
    estat.actorId = '0001';
    primeraEdicio();
    estat.currentUser = { id: '0002', full_name: 'Maria Veïna' };
    estat.pathname = '/versions';
    editaComASocDePoble({ tipus: 'pagina', pageKey: 'versions' });
    expect(estat.setActor).not.toHaveBeenCalled();
    expect(llegixCanviIdentitatEdicio()).toBeNull();
  });
});

describe('R32.45 · Lot 02 · Edició d’anada i tornada per a Beta Tester (Mur, Mercat i Esdeveniments/Calendari)', () => {
  let restauraIdbLot2 = null;

  beforeEach(() => {
    restauraIdbLot2 = installaIdbMemoriaTest();
    _reiniciaRevisionsEditorialsPerAProves();
    _reiniciaRetornIdentitatPerAProves();
    // Beta Tester normal: NO superadmin, NO membre de Sóc de Poble
    estat.currentUser = { id: 'beta-laia-42', full_name: 'Laia Beta' };
    estat.esSuperadmin = false;
    estat.actor = { tipus: 'persona', id: 'beta-laia-42', nom: 'Laia Beta', rol: 'persona' };
    estat.actorType = 'persona';
    estat.actorId = 'beta-laia-42';
    estat.memberships = [
      { id: 'forn-laia', slug: 'forn-laia', name: 'Forn de Laia', role: 'owner' }
    ];
    estat.setActor.mockClear();
    estat.toast.mockClear();
    estat.navigate.mockClear();
    estat.idioma = 'ca';
  });

  afterEach(() => {
    cleanup();
    restauraIdbLot2?.();
    restauraIdbLot2 = null;
  });

  test('Beta Tester edita el seu producte del Mercat (preu, unitat, categoria i foto) i es bloqueja sobre el d’un altre veí', async () => {
    const productePropi = {
      id: UUID_MERCAT,
      title: 'Coca de mollitas',
      subtitle: 'Feta al forn de llenya',
      content: '<p>Farina ecològica i oli d’oliva.</p>',
      image_url: '/assets/uploads/coca.webp',
      ambit: 'mercat',
      estat: 'disponible',
      dades: { preu: '4,50 €', unitat: ' Safata ', categoria: 'Forn', estoc: '12 unitats' },
      price: '4,50 €',
      ownerUserId: 'beta-laia-42',
      author_org_id: 'forn-laia',
      author_name: 'Forn de Laia'
    };

    // 1. A /mercat/:id veu Editar i commuta de Laia (persona) a Forn de Laia (entitat)
    estat.pathname = `/mercat/${UUID_MERCAT}`;
    const { unmount } = render(
      <SondaEdicio opcions={{ tipus: 'publicacio', sectionId: 'mercat', item: productePropi }} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(estat.setActor).toHaveBeenCalledWith('entitat', 'forn-laia');
    expect(estat.navigate).toHaveBeenCalledWith(
      `/notes?carpeta=f-mercat&nota=publicacio%3Amercat%3A${UUID_MERCAT}&plegades=1&retorn=%2Fmercat%2F${UUID_MERCAT}`
    );
    unmount();

    // 2. Producte d'un altre veí -> Editar és INVISIBLE per al Beta Tester
    const producteAlie = {
      ...productePropi,
      id: '9f8e7d6c-5b4a-4321-8765-1234567890ab',
      ownerUserId: 'altre-vei-99',
      author_org_id: 'cooperativa-aliena',
      author_name: 'Cooperativa Aliena'
    };
    const { unmount: u2 } = render(
      <SondaEdicio opcions={{ tipus: 'publicacio', sectionId: 'mercat', item: producteAlie }} />
    );
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
    u2();

    // 3. Dins de PublicacioEditable, s'hidrata fitxa de Mercat i l'actualització preserva la fitxa i el mateix UUID!
    estat.actor = { tipus: 'entitat', id: 'forn-laia', slug: 'forn-laia', nom: 'Forn de Laia', rol: 'owner' };
    estat.actorType = 'entitat';
    estat.actorId = 'forn-laia';
    estat.paramsNotes = new URLSearchParams(`carpeta=f-mercat&nota=publicacio:mercat:${UUID_MERCAT}`);

    const ctx = creaContextNotes();
    render(
      <ValorDeNotes value={ctx}>
        <PublicacioEditable item={publicacioComANota(productePropi, 'mercat')} />
      </ValorDeNotes>
    );

    expect(screen.getByTestId('nota-ambit').textContent).toBe('mercat');
    expect(screen.getByTestId('nota-preu').textContent).toBe('4,50 €');

    act(() => {
      estat.editorCtx.setLocalNoteField(estat.editorNota.id, 'title', 'Coca de mollitas acabada de coure');
      estat.editorCtx.setLocalNoteField(estat.editorNota.id, 'fitxa', {
        ambit: 'mercat',
        estat: 'disponible',
        dades: { preu: '5,00 €', unitat: 'Safata gran', categoria: 'Forn', estoc: '8 unitats' }
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Actualitzar al Mur' }));
    });

    expect(ctx.creaNota).toHaveBeenCalledTimes(1);
    expect(ctx.publishNote).toHaveBeenCalledWith(expect.objectContaining({
      publishedSubmissionId: UUID_MERCAT,
      isPublished: true,
      title: 'Coca de mollitas acabada de coure',
      fitxa: {
        ambit: 'mercat',
        estat: 'disponible',
        dades: { preu: '5,00 €', unitat: 'Safata gran', categoria: 'Forn', estoc: '8 unitats' }
      }
    }));
  });

  test('Beta Tester edita el seu acte del Calendari (/calendari/:id) conservant data, hora i lloc a la fitxa d’àmbit', async () => {
    const actePropi = {
      id: UUID_CALENDARI,
      title: 'Taller de pa de massa mare',
      content: '<p>Porteu davantal i bol.</p>',
      ambit: 'calendari',
      estat: 'disponible',
      dades: {
        data_inici: '2026-12-05',
        hora_inici: '18:00',
        lloc: 'Forn Vell',
        municipi: 'Sella'
      },
      ownerUserId: 'beta-laia-42',
      author_user_id: 'beta-laia-42',
      author_org_id: null,
      author_name: 'Laia Beta'
    };

    estat.pathname = `/calendari/${UUID_CALENDARI}`;
    const { unmount } = render(
      <SondaEdicio opcions={{ tipus: 'publicacio', sectionId: 'calendari', item: actePropi }} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(estat.navigate).toHaveBeenCalledWith(
      `/notes?carpeta=f-mur&nota=publicacio%3Amur%3A${UUID_CALENDARI}&plegades=1&retorn=%2Fcalendari%2F${UUID_CALENDARI}`
    );
    unmount();

    estat.paramsNotes = new URLSearchParams(`carpeta=f-mur&nota=publicacio:mur:${UUID_CALENDARI}`);
    const ctx = creaContextNotes();
    render(
      <ValorDeNotes value={ctx}>
        <PublicacioEditable item={publicacioComANota(actePropi, 'mur')} />
      </ValorDeNotes>
    );

    expect(screen.getByTestId('nota-ambit').textContent).toBe('calendari');
    expect(screen.getByTestId('nota-lloc').textContent).toBe('Forn Vell');

    act(() => {
      estat.editorCtx.setLocalNoteField(estat.editorNota.id, 'fitxa', {
        ambit: 'calendari',
        estat: 'disponible',
        dades: { data_inici: '2026-12-06', hora_inici: '19:00', lloc: 'Casa de Cultura', municipi: 'Sella' }
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Actualitzar al Mur' }));
    });

    expect(ctx.publishNote).toHaveBeenCalledWith(expect.objectContaining({
      publishedSubmissionId: UUID_CALENDARI,
      fitxa: {
        ambit: 'calendari',
        estat: 'disponible',
        dades: { data_inici: '2026-12-06', hora_inici: '19:00', lloc: 'Casa de Cultura', municipi: 'Sella' }
      }
    }));
  });
});
