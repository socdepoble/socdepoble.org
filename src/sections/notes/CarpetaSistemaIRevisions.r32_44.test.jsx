import React, { useContext } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  toast: vi.fn(),
  params: new URLSearchParams('carpeta=f-sistema&nota=publicacio:sistema:descarregues'),
  setParams: vi.fn(),
  vist: { ctx: null, nota: null }
}));

vi.mock('../../app/contexts/RouterContext', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    useNavigate: () => mocks.navigate,
    useSearchParams: () => [mocks.params, mocks.setParams],
    Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
  };
});
vi.mock('@/components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: mocks.toast })
}));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: (_clau, reserva) => reserva, language: 'ca' }),
  useUIStateOpcional: () => ({ language: 'ca' })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../hooks/usePublicadorsBarraRecurs.js', () => ({
  usePublicadorsBarraRecurs: () => ({ publicadorsRegistrats: null, recarrega: () => {} })
}));
vi.mock('../../hooks/useSuperadminEstable.js', () => ({
  useSuperadminEstable: () => ({ esSuperadmin: true, rolPendent: false })
}));
vi.mock('../../app/contexts/useIdentitatOReserva.js', () => ({
  useIdentitatOReserva: () => ({
    actor: { tipus: 'entitat', id: 'socdepoble', slug: 'socdepoble', nom: 'Sóc de Poble', rol: 'owner' }
  })
}));
vi.mock('./NotesEditor.jsx', async () => {
  const { NotesContext } = await import('./objectesDeContext.js');
  return {
    default: function DobleNotesEditor({ activeNote }) {
      mocks.vist.ctx = useContext(NotesContext);
      mocks.vist.nota = activeNote;
      return (
        <div data-testid="editor-sistema">
          <span data-testid="editor-titol">{activeNote?.title}</span>
          <span data-testid="editor-cos">{activeNote?.content}</span>
        </div>
      );
    }
  };
});

import { NotesContext } from './objectesDeContext.js';
import { PAGE_COPY } from '../text/pageContent.js';
import TextSection from '../text/TextSection.jsx';
import { targetesDeSistema } from '../mur/targetesMur.js';
import { itemsDePaginesSistema } from './paginesSistemaBloc.js';
import { esPublicacioEditable, esRevisioEditorial } from './publicacioEditable.js';
import { PublicacioEditable } from './PublicacioEditable.jsx';
import {
  MAX_HISTORIAL_REVISIONS,
  desaRevisioEditorialAmbHistorial,
  desferUltimaRevisioEditorial,
  exportaRevisionsHumanes,
  historialRevisionsEditorials
} from '../../data/historialRevisionsEditorials.js';
import {
  _reiniciaRevisionsEditorialsPerAProves,
  revisioEditorial
} from '../../data/revisionsEditorials.js';

beforeEach(() => {
  _reiniciaRevisionsEditorialsPerAProves();
  mocks.navigate.mockReset();
  mocks.toast.mockReset();
  mocks.setParams.mockReset();
  mocks.params = new URLSearchParams('carpeta=f-sistema&nota=publicacio:sistema:descarregues');
  mocks.vist = { ctx: null, nota: null };
});

afterEach(() => {
  cleanup();
  _reiniciaRevisionsEditorialsPerAProves();
});

const baseContext = () => ({
  config: { dataMode: 'seed' },
  scopeKey: 'ambit-sistema',
  t: (_clau, reserva) => reserva,
  notes: [],
  setLocalNoteField: vi.fn(),
  saveNoteField: vi.fn(),
  compartirNota: vi.fn(),
  mouNota: vi.fn(),
  esborraNota: vi.fn(),
  potEsborrar: false,
  creaNota: vi.fn(),
  updateNote: vi.fn(),
  publishNote: vi.fn(async () => true),
  rebuigDePublicacio: vi.fn(() => null)
});

describe('IDEA-324a · Carpeta Sistema, edició de pàgines de PAGE_COPY i historial amb Desfer', () => {
  test('itemsDePaginesSistema exposa totes les pàgines de PAGE_COPY com a editables a f-sistema sense alterar /mur (D-IDEA-317)', () => {
    const items = itemsDePaginesSistema(PAGE_COPY, { nativa: false });
    const claus = items.map((item) => item.data.item.id);
    expect(items.length).toBe(Object.keys(PAGE_COPY).length);
    for (const clauEsperada of ['descarregues', 'anima', 'node-zero', 'fedivers', 'tot-el-que-pots-fer', 'dispositius', 'projecte', 'versions', 'constitucio']) {
      expect(claus).toContain(clauEsperada);
    }
    for (const item of items) {
      expect(item.categoryIds).toEqual(['f-sistema']);
      expect(item.id).toBe(`publicacio:sistema:${item.data.item.id}`);
      expect(esPublicacioEditable(item)).toBe(true);
      expect(esRevisioEditorial(item)).toBe(true);
    }
    // El Mur públic conserva intactes les 19 targetes canòniques (cap pàgina nova al Mur).
    expect(targetesDeSistema(PAGE_COPY, { nativa: false })).toHaveLength(19);
  });

  test('editar una pàgina de Sistema a PublicacioEditable actualitza en viu TextSection, preserva widgets i permet Desfer amb 1 clic', async () => {
    const items = itemsDePaginesSistema(PAGE_COPY, { nativa: false });
    const versionsItem = items.find((i) => i.data.item.id === 'versions');
    const ctx = baseContext();

    const { container } = render(
      <>
        <NotesContext.Provider value={ctx}>
          <PublicacioEditable item={versionsItem} />
        </NotesContext.Provider>
        <TextSection page={PAGE_COPY.versions} pageKey="versions" />
      </>
    );

    // Abans d'editar: cap barra d'historial (Llei del Píxel) i LiniaVersioInstallada + H1 original presents.
    expect(container.querySelector('.sdp-historial-revisions')).toBeNull();
    expect(container.querySelector('header.page-title h1')?.textContent).toContain(PAGE_COPY.versions.title);

    // Primera edició (v1)
    act(() => {
      mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'title', 'Versions del Sistema · Edició 1');
      mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'content', '<h3>Novetats v1</h3><p>Text humà desat.</p>');
    });
    await act(async () => {
      await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).resolves.toBe(true);
    });

    expect(revisioEditorial('sistema', 'versions')).toEqual({
      title: 'Versions del Sistema · Edició 1',
      content: '<h3>Novetats v1</h3><p>Text humà desat.</p>'
    });
    expect(container.querySelector('header.page-title h1')?.textContent).toContain('Versions del Sistema · Edició 1');
    expect(container.querySelector('article.cms-preview')?.textContent).toContain('Text humà desat.');

    // Segona edició (v2)
    act(() => {
      mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'title', 'Versions del Sistema · Edició 2');
    });
    await act(async () => {
      await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).resolves.toBe(true);
    });
    expect(historialRevisionsEditorials('sistema', 'versions')).toHaveLength(2);
    expect(container.querySelector('header.page-title h1')?.textContent).toContain('Versions del Sistema · Edició 2');

    // Desfer amb 1 sol clic des de la barra d'historial -> torna a v1 tant a TextSection com a l'editor!
    const regHistorial = screen.getByRole('region', { name: 'Historial de versions' });
    fireEvent.click(within(regHistorial).getByRole('button', { name: 'Desfer última edició' }));

    expect(container.querySelector('header.page-title h1')?.textContent).toContain('Versions del Sistema · Edició 1');
    expect(screen.getByTestId('editor-titol').textContent).toBe('Versions del Sistema · Edició 1');

    // Segon clic a Desfer -> torna a l'original canònic (v0) i la barra desapareix!
    fireEvent.click(within(screen.getByRole('region', { name: 'Historial de versions' })).getByRole('button', { name: 'Desfer última edició' }));
    expect(revisioEditorial('sistema', 'versions')).toBeNull();
    expect(container.querySelector('header.page-title h1')?.textContent).toContain(PAGE_COPY.versions.title);
    expect(container.querySelector('.sdp-historial-revisions')).toBeNull();
  });

  test('l’historial append-only acota a 20 versions per peça i exporta el registre d’edicions humanes', () => {
    for (let i = 1; i <= 25; i += 1) {
      desaRevisioEditorialAmbHistorial('sistema', 'descarregues', { title: `Títol v${i}` }, { autorNom: 'Javi' });
    }
    const hist = historialRevisionsEditorials('sistema', 'descarregues');
    expect(hist).toHaveLength(MAX_HISTORIAL_REVISIONS);
    expect(hist[0].versio).toBe(6);
    expect(hist.at(-1)?.versio).toBe(25);

    const exportat = exportaRevisionsHumanes();
    expect(exportat.schema).toBe('sdp.edicions-humanes.v1');
    expect(exportat.revisions['sistema:descarregues'].camps.title).toBe('Títol v25');
    expect(exportat.historial['sistema:descarregues']).toHaveLength(20);

    const desfet = desferUltimaRevisioEditorial('sistema', 'descarregues');
    expect(desfet).toMatchObject({ restaurada: true, versio: 24, camps: { title: 'Títol v24' } });
  });
});
