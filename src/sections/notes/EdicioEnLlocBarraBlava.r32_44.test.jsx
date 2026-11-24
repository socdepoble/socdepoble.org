/**
 * EdicioEnLlocBarraBlava.r32_44.test.jsx — R32.44 · Lot 03 (IDEA-324b)
 *
 * Verifica:
 *   1. Llei del Píxel a BarraBlava: quan editarVisible és false, el DOM és 100 %
 *      idèntic (3 fills directes sense .bar-blue-right); quan és true, apareix el
 *      botó d'icona «Editar» al costat esquerre de CONNECTAR amb diana tàctil.
 *   2. Permís intel·ligent i canvi automàtic d'identitat (useEdicioEnLloc + TextSection / ItemDetailSection):
 *      - Visitant Foraster o usuari sense pertinença: cap botó d'edició.
 *      - Usuari loguejat (Javi) navegant com a persona sobre /page/descarregues:
 *        veu «Editar», commuta automàticament a l'entitat «Sóc de Poble» (setActor),
 *        mostra toast «Editant com a Sóc de Poble» i navega a
 *        /notes?carpeta=f-sistema&nota=publicacio%3Asistema%3Adescarregues&plegades=1&retorn=%2Fpage%2Fdescarregues.
 *      - Membre amb permís a «El Rentonar» sobre un post de Rentonar: commuta a «rentonar».
 *   3. 2 columnes plegades en rail (?plegades=1) a UniversalWorkspace / NotesSection
 *      desplegables amb 1 clic, i retorn automàtic a `retorn` en publicar/actualitzar.
 */
import React, { useContext } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { BarraBlava } from '../../components/universal/barres/BarraBlava.jsx';

const estatProva = vi.hoisted(() => ({
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
  editorCtx: null,
  editorNota: null
}));

vi.mock('./NotesEditor.jsx', async () => {
  const { NotesContext: Context } = await import('./objectesDeContext.js');
  return {
    default: function DobleNotesEditor({ activeNote }) {
      const ctx = useContext(Context);
      estatProva.editorCtx = ctx;
      estatProva.editorNota = activeNote;
      return React.createElement(
        'div',
        { 'data-testid': 'doble-editor' },
        React.createElement('span', { 'data-testid': 'titol-nota' }, activeNote?.title || ''),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => ctx.publishNote(activeNote)
          },
          'Actualitzar al Mur'
        )
      );
    }
  };
});

vi.mock('../../app/contexts/RouterContext', () => ({
  useRouter: () => ({
    memoria: true,
    currentPath: estatProva.pathname,
    searchParams: estatProva.paramsNotes,
    navigate: estatProva.navigate,
    basename: ''
  }),
  useParams: () => ({ sectionId: 'mur', itemId: 'post-rentonar' }),
  useNavigate: () => estatProva.navigate,
  useLocation: () => ({
    pathname: estatProva.pathname,
    search: estatProva.search,
    hash: '',
    state: null
  }),
  useSearchParams: () => [estatProva.paramsNotes, (nous) => {
    estatProva.paramsNotes = nous instanceof URLSearchParams ? nous : new URLSearchParams(nous);
  }],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
  Navigate: () => null
}));

vi.mock('../../app/contexts/SessionContext', () => ({
  ESTAT: Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' }),
  useSession: () => ({
    currentUser: estatProva.currentUser,
    estat: estatProva.currentUser ? 'dins' : 'fora',
    rol: null,
    esSuperadmin: estatProva.esSuperadmin,
    config: { dataMode: 'seed' }
  }),
  useSessioOpcional: () => ({
    currentUser: estatProva.currentUser,
    estat: estatProva.currentUser ? 'dins' : 'fora',
    rol: null,
    esSuperadmin: estatProva.esSuperadmin,
    config: { dataMode: 'seed' }
  })
}));

vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({
    currentUser: estatProva.currentUser,
    estat: estatProva.currentUser ? 'dins' : 'fora',
    rol: null,
    esSuperadmin: estatProva.esSuperadmin,
    config: { dataMode: 'seed' }
  }),
  useSessioOpcional: () => ({
    currentUser: estatProva.currentUser,
    estat: estatProva.currentUser ? 'dins' : 'fora',
    rol: null,
    esSuperadmin: estatProva.esSuperadmin,
    config: { dataMode: 'seed' }
  })
}));

vi.mock('../../app/contexts/IdentitatContext', () => ({
  potSignarPer: (m) => Boolean(m && ['owner', 'admin', 'editor'].includes(m.role)),
  useIdentitat: () => ({
    actor: estatProva.actor,
    actorType: estatProva.actorType,
    actorId: estatProva.actorId,
    memberships: estatProva.memberships,
    setActor: estatProva.setActor
  }),
  useIdentitatOpcional: () => ({
    actor: estatProva.actor,
    actorType: estatProva.actorType,
    actorId: estatProva.actorId,
    memberships: estatProva.memberships,
    setActor: estatProva.setActor
  })
}));

vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({
  potSignarPer: (m) => Boolean(m && ['owner', 'admin', 'editor'].includes(m.role)),
  useIdentitat: () => ({
    actor: estatProva.actor,
    actorType: estatProva.actorType,
    actorId: estatProva.actorId,
    memberships: estatProva.memberships,
    setActor: estatProva.setActor
  }),
  useIdentitatOpcional: () => ({
    actor: estatProva.actor,
    actorType: estatProva.actorType,
    actorId: estatProva.actorId,
    memberships: estatProva.memberships,
    setActor: estatProva.setActor
  })
}));

vi.mock('../../app/contexts/UIContext', () => ({
  useUIStateOpcional: () => null,
  useUIActions: () => ({ t: (_k, fb) => fb, language: 'ca' }),
  useUIActionsOpcional: () => ({ t: (_k, fb) => fb, language: 'ca' })
}));

vi.mock('@/components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: estatProva.toast })
}));

vi.mock('../../components/universal/NotificationContext', () => ({
  useToast: () => ({ showToast: estatProva.toast })
}));

vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));

import TextSection from '../text/TextSection.jsx';
import { PAGE_COPY } from '../text/pageContent.js';
import { useEdicioEnLloc } from '../../hooks/useEdicioEnLloc.js';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace.jsx';
import { PublicacioEditable } from './PublicacioEditable.jsx';
import { ValorDeNotes } from './NotesContext.jsx';
import { _reiniciaRevisionsEditorialsPerAProves } from '../../data/revisionsEditorials.js';
import { installaIdbMemoriaTest } from './__fixtures__/idbMemoriaTest.js';

globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('R32.44 · Lot 03 · Botó Editar a BarraBlava, canvi d’identitat i 2 columnes plegades (IDEA-324b)', () => {
  let restauraIdb = null;

  beforeEach(() => {
    restauraIdb = installaIdbMemoriaTest();
    _reiniciaRevisionsEditorialsPerAProves();
    estatProva.currentUser = null;
    estatProva.esSuperadmin = false;
    estatProva.actor = null;
    estatProva.actorType = 'persona';
    estatProva.actorId = null;
    estatProva.memberships = [];
    estatProva.setActor.mockClear();
    estatProva.toast.mockClear();
    estatProva.navigate.mockClear();
    estatProva.pathname = '/page/descarregues';
    estatProva.search = '';
    estatProva.paramsNotes = new URLSearchParams();
  });

  afterEach(() => {
    cleanup();
    _reiniciaRevisionsEditorialsPerAProves();
    restauraIdb?.();
    restauraIdb = null;
  });

  test('BarraBlava: Llei del Píxel quan editarVisible=false i botó Editar a la dreta quan editarVisible=true', () => {
    const onConnect = vi.fn();
    const onEdit = vi.fn();
    const { container, rerender } = render(
      <BarraBlava
        onBack={() => {}}
        onForward={() => {}}
        onIndex={() => {}}
        traduirVisible={true}
        comentarVisible={true}
        compartirVisible={true}
        connectarVisible={true}
        onComment={() => {}}
        onShare={() => {}}
        onTranslate={() => {}}
        onConnect={onConnect}
      />
    );

    const headerSense = container.querySelector('header.bar-blue');
    expect(headerSense.classList.contains('bar-blue--amb-editar')).toBe(false);
    expect(headerSense.querySelector('.bar-blue-right')).toBeNull();
    expect(headerSense.children.length).toBe(3);

    rerender(
      <BarraBlava
        onBack={() => {}}
        onForward={() => {}}
        onIndex={() => {}}
        traduirVisible={true}
        comentarVisible={true}
        compartirVisible={true}
        connectarVisible={true}
        onComment={() => {}}
        onShare={() => {}}
        onTranslate={() => {}}
        onConnect={onConnect}
        editarVisible={true}
        onEdit={onEdit}
        editLabel="Editar"
      />
    );

    const headerAmb = container.querySelector('header.bar-blue');
    expect(headerAmb.classList.contains('bar-blue--amb-editar')).toBe(true);
    const dreta = headerAmb.querySelector('.bar-blue-right');
    expect(dreta).not.toBeNull();
    const botoEditar = screen.getByRole('button', { name: 'Editar' });
    fireEvent.click(botoEditar);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  test('Permís i commutació d’identitat: Foraster no veu Editar; Javi (persona) a /page/descarregues commuta a Sóc de Poble i obri ?plegades=1&retorn=...', () => {
    // 1. Foraster: sense sessió -> cap botó Editar
    const { unmount } = render(<TextSection page={PAGE_COPY.descarregues} pageKey="descarregues" />);
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
    unmount();

    // 2. Usuari sense pertinença a Sóc de Poble (en mode remote) -> cap botó Editar
    function SondaExterna() {
      const res = useEdicioEnLloc({
        tipus: 'publicacio',
        sectionId: 'mur',
        item: { id: 'post-rentonar', author_org_id: 'rentonar', title: 'Festa Rentonar' }
      });
      return res.editarVisible ? <button type="button" onClick={res.onEdit}>Editar</button> : null;
    }
    estatProva.currentUser = { id: 'usuari-extern-99' };
    estatProva.actor = { tipus: 'persona', id: 'usuari-extern-99', nom: 'Veïna', rol: 'persona' };
    estatProva.actorType = 'persona';
    estatProva.actorId = 'usuari-extern-99';
    estatProva.memberships = [];
    const { unmount: u2 } = render(<SondaExterna />);
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
    u2();

    // 3. Javi loguejat com a persona amb membresia a Sóc de Poble i Rentonar
    estatProva.currentUser = { id: '0001', full_name: 'Javi Llinares' };
    estatProva.actor = { tipus: 'persona', id: '0001', nom: 'Javi Llinares', rol: 'persona' };
    estatProva.actorType = 'persona';
    estatProva.actorId = '0001';
    estatProva.memberships = [
      { id: 'socdepoble', slug: 'socdepoble', name: 'Sóc de Poble', role: 'owner' },
      { id: 'rentonar', slug: 'rentonar', name: 'El Rentonar', role: 'admin' }
    ];

    const { unmount: u3 } = render(<TextSection page={PAGE_COPY.descarregues} pageKey="descarregues" />);
    const botoEditarPagina = screen.getByRole('button', { name: 'Editar' });
    fireEvent.click(botoEditarPagina);

    expect(estatProva.setActor).toHaveBeenCalledWith('entitat', 'socdepoble');
    expect(estatProva.toast).toHaveBeenCalledWith('Editant com a Sóc de Poble', 'info');
    expect(estatProva.navigate).toHaveBeenCalledWith(
      '/notes?carpeta=f-sistema&nota=publicacio%3Asistema%3Adescarregues&plegades=1&retorn=%2Fpage%2Fdescarregues'
    );
    u3();

    // 4. Javi loguejat com a persona editant una peça d'El Rentonar -> commuta a El Rentonar
    estatProva.setActor.mockClear();
    estatProva.toast.mockClear();
    estatProva.navigate.mockClear();
    estatProva.pathname = '/mur/post-rentonar';
    render(<SondaExterna />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(estatProva.setActor).toHaveBeenCalledWith('entitat', 'rentonar');
    expect(estatProva.toast).toHaveBeenCalledWith('Editant com a El Rentonar', 'info');
    expect(estatProva.navigate).toHaveBeenCalledWith(
      '/notes?carpeta=f-mur&nota=publicacio%3Amur%3Apost-rentonar&plegades=1&retorn=%2Fmur%2Fpost-rentonar'
    );
  });

  test('UniversalWorkspace amb columnesInicials={left:true,middle:true} + forcaColumnesInicials arrenca amb 2 rails desplegables en 1 clic, i PublicacioEditable retorna a retorn', async () => {
    const originalWidth = window.innerWidth;
    const prevClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1440 });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1440 });

    const { container, unmount } = render(
      <UniversalWorkspace
        model={{
          status: 'ready',
          categories: [{ id: 'f-sistema', label: 'Sistema' }],
          items: [{ id: 'publicacio:sistema:descarregues', title: 'Descàrregues', categoryIds: ['f-sistema'] }]
        }}
        labels={{ categories: 'CARPETES', items: 'NOTES' }}
        initialSelection={{ categoryId: 'f-sistema', itemId: 'publicacio:sistema:descarregues' }}
        columnesInicials={{ left: true, middle: true }}
        forcaColumnesInicials={true}
        renderDetail={() => <div data-testid="editor-obert">Editor actiu</div>}
      />
    );

    const gridContent = container.querySelector('.app-grid-content');
    expect(gridContent.classList.contains('has-left-collapsed')).toBe(true);
    expect(gridContent.classList.contains('has-middle-collapsed')).toBe(true);
    expect(screen.getByTestId('editor-obert')).not.toBeNull();

    // L'usuari pot desplegar qualsevol de les dues columnes amb 1 sol clic al rail
    const botoDesplegaLlista = screen.getByRole('button', { name: 'Expandir NOTES' });
    fireEvent.click(botoDesplegaLlista);
    expect(gridContent.classList.contains('has-middle-collapsed')).toBe(false);
    expect(gridContent.classList.contains('has-left-collapsed')).toBe(true);
    unmount();

    // Retorn automàtic a /page/descarregues en publicar/actualitzar quan hi ha ?retorn=
    estatProva.currentUser = { id: '0001', full_name: 'Javi Llinares' };
    estatProva.esSuperadmin = true;
    estatProva.actor = { tipus: 'entitat', id: 'socdepoble', slug: 'socdepoble', nom: 'Sóc de Poble', rol: 'owner' };
    estatProva.actorType = 'entitat';
    estatProva.actorId = 'socdepoble';
    estatProva.paramsNotes = new URLSearchParams('carpeta=f-sistema&nota=publicacio:sistema:descarregues&plegades=1&retorn=%2Fpage%2Fdescarregues');

    const itemDescarregues = {
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

    const valorContextNotes = {
      notes: [],
      noteFolders: [],
      status: 'ready',
      config: { dataMode: 'seed' },
      nomesLectura: false,
      teSessio: true,
      canCreate: true,
      scopeKey: 'entitat::socdepoble',
      workspaceKey: 'entitat::socdepoble',
      t: (_k, fb) => fb,
      rebuigDePublicacio: () => null,
      publishNote: vi.fn(async () => true),
      saveNoteField: vi.fn(),
      setLocalNoteField: vi.fn(),
      updateNote: vi.fn(),
      creaNota: vi.fn(),
      potRetirarDelMur: () => false,
      retiradaPendentDeNota: () => false
    };

    render(
      <ValorDeNotes value={valorContextNotes}>
        <PublicacioEditable item={itemDescarregues} />
      </ValorDeNotes>
    );

    expect(estatProva.editorCtx.edicioDirecta).toBe(true);
    act(() => {
      estatProva.editorCtx.setLocalNoteField(estatProva.editorNota.id, 'title', 'Descàrregues actualitzades i retornades');
    });
    const botoActualitza = screen.getByRole('button', { name: 'Actualitzar al Mur' });
    await act(async () => {
      fireEvent.click(botoActualitza);
    });

    await waitFor(() => {
      expect(estatProva.navigate).toHaveBeenCalledWith('/page/descarregues');
    });
    if (prevClientWidth) Object.defineProperty(HTMLElement.prototype, 'clientWidth', prevClientWidth);
    else delete HTMLElement.prototype.clientWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: originalWidth });
  });
});
