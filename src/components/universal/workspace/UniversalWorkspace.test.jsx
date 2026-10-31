import React from 'react';
import { act, render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { FileText, NotebookPen } from 'lucide-react';
import { DefaultItemCard, UniversalWorkspace } from './UniversalWorkspace.jsx';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext.jsx';
import { useAppGrid } from '../../layout/AppGridShell.jsx';
import AppGridColumn from '../../layout/AppGridColumn.jsx';
import { NotaFitxa } from '../../../sections/notes/NotaFitxa.jsx';
import { TEXTOS_LLAVOR } from '../textosLlavor.js';

vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

vi.mock('../../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => ({ actorId: null })
}));
vi.mock('../../../app/contexts/CoreContentContext.jsx', () => ({
  useCoreContent: () => ({ agents: [] })
}));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ currentUser: null, estat: 'fora' })
}));
/* Onada 8 (261009, revisió) · La boina de la targeta viva (NotaFitxa) és un
   Link quan se sap qui signa: la nota de benvinguda porta al perfil de Sóc de Poble. */
vi.mock('../../../app/contexts/RouterContext.jsx', () => ({
  useRouter: () => ({ navigate: vi.fn(), location: { pathname: '/' } }),
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>
}));

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  // jsdom no fa layout: sense amplada, AppGridShell cauria a «estret» i amagaria (inert) la columna esquerra.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterEach(() => cleanup());

const model = {
  status: 'ready',
  navigationGroups: [
    { id: 'folders', label: null, options: [{ id: 'f-mur', label: 'Mur' }, { id: 'f-mercat', label: 'Mercat' }] },
    { id: 'categories', label: 'CATEGORIES', options: [{ id: 'cat_Sistema', label: 'Sistema' }] },
    { id: 'tags', label: 'ETIQUETES', options: [{ id: 'tag_Tutorial', label: 'Tutorial' }] }
  ],
  items: [{
    id: 'n1',
    categoryIds: ['f-mur'],
    title: 'Bloc de notes',
    subtitle: '25/04/26',
    excerpt: "El teu estudi d'escriptura privat",
    data: { lead: "El teu estudi d'escriptura privat" },
    image: '/assets/portada.webp',
    updatedAt: '2026-04-25T09:00:00Z'
  }]
};

function renderWorkspace() {
  return render(
    <UniversalWorkspace
      model={model}
      className="sdp-bloc"
      listClassName="sdp-bloc-list--notes"
      labels={{ categories: 'CARPETES', items: 'NOTES', create: 'CREAR NOTA' }}
      icons={{ items: NotebookPen }}
      tagFilter={false}
      renderItem={(ctx) => <NotaFitxa {...ctx} />}
      renderDetail={() => null}
    />
  );
}

test('el nucli és genèric: sense renderItem pinta la targeta per defecte i el filtre d’etiquetes', () => {
  const { container } = render(
    <UniversalWorkspace
      model={{ status: 'ready', categories: [{ id: 'fonaments', label: 'Fonaments' }], items: model.items.map(i => ({ ...i, categoryIds: ['fonaments'], tags: ['organisme'] })) }}
      labels={{ categories: 'ÀREES', items: 'COMPONENTS' }}
      renderDetail={({ item }) => <p>{item ? `Detall de ${item.title}` : 'res'}</p>}
    />
  );
  expect(container.querySelector('.sdp-nota-fitxa__capcalera')).toBeNull();
  expect(container.querySelector('.sdp-gestor-fitxa .sdp-gestor-fitxa__titol')?.textContent).toBe('Bloc de notes');
  // Les píndoles d'etiquetes estan amagades fins que s'obri la cerca amb la lupa.
  expect(screen.queryByRole('button', { name: 'organisme' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Cercar elements' }));
  expect(screen.getByRole('button', { name: 'organisme' })).toBeTruthy();
  // Tancar la cerca amaga les píndoles i neteja qualsevol etiqueta activa.
  fireEvent.click(screen.getByRole('button', { name: 'organisme' }));
  fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
  expect(screen.queryByRole('button', { name: 'organisme' })).toBeNull();
  expect(container.querySelector('.sdp-gestor-fitxa .sdp-gestor-fitxa__titol')?.textContent).toBe('Bloc de notes');
  // Sense selecció inicial d’element, el primer de la categoria s’obri sol.
  expect(screen.getByText('Detall de Bloc de notes')).toBeTruthy();
});

/* Correcció D4 (revisió de T50) · La targeta per defecte s'exporta: un
   renderItem que només canvia algunes fitxes hi cau per a la resta. */
test('DefaultItemCard exportada: el marcatge de la fitxa per defecte, i sense `untitled` el títol de llavor', () => {
  const onSelect = vi.fn();
  const { container } = render(<DefaultItemCard item={{ id: 'x', title: '', subtitle: 'Apartat' }} active onSelect={onSelect} />);
  const fitxa = container.querySelector('button.sdp-gestor-fitxa');
  expect(fitxa.getAttribute('aria-current')).toBe('true');
  expect(fitxa.querySelector('.sdp-gestor-fitxa__titol').textContent).toBe(TEXTOS_LLAVOR.titol);
  expect(fitxa.querySelector('.sdp-gestor-fitxa__subtitol').textContent).toBe('Apartat');
  expect([...fitxa.children].at(-1).className).toBe('sdp-gestor-fitxa__text');
  fireEvent.click(fitxa);
  expect(onSelect).toHaveBeenCalledTimes(1);
  cleanup();
  const inactiva = render(<DefaultItemCard item={model.items[0]} active={false} onSelect={() => {}} untitled="Sense títol" />);
  expect(inactiva.container.querySelector('button.sdp-gestor-fitxa').hasAttribute('aria-current')).toBe(false);
  expect(inactiva.container.querySelector('.sdp-gestor-fitxa__titol').textContent).toBe('Bloc de notes');
});

test('la selecció controlada sense itemId no deixa el detall buit', () => {
  render(
    <UniversalWorkspace
      model={{ status: 'ready', categories: [{ id: 'fonaments', label: 'Fonaments' }], items: model.items.map(i => ({ ...i, categoryIds: ['fonaments'] })) }}
      initialSelection={{ categoryId: 'fonaments', itemId: undefined }}
      selection={{ categoryId: 'fonaments', itemId: undefined }}
      renderDetail={({ item }) => <p>{item ? `Detall de ${item.title}` : 'res'}</p>}
    />
  );
  expect(screen.getByText('Detall de Bloc de notes')).toBeTruthy();
});

test('les pestanyes NOTES i CARPETES duen icona i el títol NOTES també', () => {
  const { container } = renderWorkspace();
  const notes = container.querySelector('.app-grid-column--middle .app-grid-col-header__plec--fix');
  expect(notes?.querySelector('svg')).toBeTruthy();
  expect(notes?.textContent).toBe('NOTES');
});

test('la capçalera CARPETES plega el grup sense etiqueta i els altres grups són acordions', () => {
  renderWorkspace();
  const nav = screen.getByRole('navigation', { name: 'CARPETES' });

  const carpetes = screen.getByRole('button', { name: 'CARPETES' });
  expect(carpetes.getAttribute('aria-expanded')).toBe('true');
  expect(within(nav).getByRole('button', { name: 'Mur' })).toBeTruthy();

  fireEvent.click(carpetes);
  expect(carpetes.getAttribute('aria-expanded')).toBe('false');
  expect(within(nav).queryByRole('button', { name: 'Mur' })).toBeNull();
  // Els altres grups no es veuen afectats
  expect(within(nav).getByRole('button', { name: 'Sistema' })).toBeTruthy();

  const etiquetes = screen.getByRole('button', { name: 'ETIQUETES' });
  expect(etiquetes.getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(etiquetes);
  expect(etiquetes.getAttribute('aria-expanded')).toBe('false');
  expect(within(nav).queryByRole('button', { name: 'Tutorial' })).toBeNull();
  expect(within(nav).getByRole('button', { name: 'Sistema' })).toBeTruthy();
});

test('la targeta de nota mostra miniatura, títol, data i entradeta', () => {
  const { container } = renderWorkspace();
  const card = container.querySelector('.sdp-bloc-list--notes .sdp-gestor-fitxa') || container.querySelector('.sdp-bloc-list--notes .sdp-nota-fitxa-viva');
  expect(card).toBeTruthy();
  
  const isViva = card.classList.contains('sdp-nota-fitxa-viva');
  if (isViva) {
    expect(card.querySelector('img.sp-card-media')?.getAttribute('src')).toBe('/assets/portada.webp');
    expect(card.querySelector('.sp-card-title')?.textContent).toBe('Bloc de notes');
    expect(card.querySelector('.sp-card-text')?.textContent).toBe("El teu estudi d'escriptura privat");
  } else {
    expect(card.querySelector('img.sdp-gestor-fitxa__imatge')?.getAttribute('src')).toBe('/assets/portada.webp');
    expect(card.querySelector('.sdp-gestor-fitxa__titol')?.textContent).toBe('Bloc de notes');
    expect(card.querySelector('time.sdp-nota-fitxa__data')?.textContent).toBe('25/04/26');
    expect(card.querySelector('.sdp-gestor-fitxa__subtitol')?.textContent).toBe("El teu estudi d'escriptura privat");
  }
  expect(container.querySelector('.app-grid-page')?.classList.contains('sdp-bloc')).toBe(true);
});

test('carpetes niuades: desplegar no selecciona, seleccionar filtra i una URL revela avantpassats', () => {
  const nested = {
    status: 'ready', itemsComplete: true,
    navigationGroups: [{ id: 'folders', options: [
      { id: 1, label: 'Wiki' },
      { id: 2, parentId: 1, label: 'Saber' },
      { id: 3, parentId: 2, label: 'Protocols' }
    ] }],
    items: [{ id: 'doc', title: 'Protocol viu', categoryIds: [3] }]
  };
  const onSelectionChange = vi.fn();
  const { rerender } = render(<UniversalWorkspace model={nested} initialSelection={{ categoryId: '__all__', itemId: null }} onSelectionChange={onSelectionChange} />);
  expect(screen.queryByRole('button', { name: 'Saber' })).toBeNull();
  onSelectionChange.mockClear();
  fireEvent.click(screen.getByRole('button', { name: 'Desplegar Wiki' }));
  expect(onSelectionChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Desplegar Saber' }));
  fireEvent.click(screen.getByRole('button', { name: 'Protocols' }));
  expect(screen.getByRole('button', { name: 'Protocols' }).getAttribute('aria-current')).toBe('page');
  expect(screen.getByRole('button', { name: 'Protocol viu' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Plegar Wiki' }));
  expect(screen.queryByRole('button', { name: 'Protocols' })).toBeNull();
  rerender(<UniversalWorkspace model={nested} selection={{ categoryId: '1', itemId: null }} />);
  rerender(<UniversalWorkspace model={nested} selection={{ categoryId: '3', itemId: 'doc' }} />);
  expect(screen.getByRole('button', { name: 'Protocols' })).toBeTruthy();
});


test('navegació fixa sense controls d’edició i ordenació per nom', () => {
  const { container } = render(<UniversalWorkspace collapsibleNavigation={false} sortable
    labels={{ categories: 'WIKI DE POBLE' }}
    model={{ status: 'ready', items: [{ id: 'b', title: 'B', updatedAt: '2026-09-23' }, { id: 'a', title: 'A', updatedAt: '2026-09-22' }] }} />);
  expect(screen.queryByTitle('Plegar o desplegar WIKI DE POBLE')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Configurar categories' })).toBeNull();
  // Sense onCreate no hi ha botó de crear: ni actiu ni desactivat.
  expect(screen.queryByRole('button', { name: 'CREAR' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Ordenar per data o nom' }));
  /* Corrector del Gauntlet f4 (30-10-2026) · L'opció triada la diu
     aria-pressed, no només la classe .active: el lector sap quina hi ha. */
  expect(screen.getByRole('button', { name: 'Data d\'actualització' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button', { name: 'Nom (A-Z)' }).getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(screen.getByRole('button', { name: 'Nom (A-Z)' }));
  expect([...container.querySelectorAll('.sdp-gestor-fitxa__titol')].map(el => el.textContent)).toEqual(['A', 'B']);
  fireEvent.click(screen.getByRole('button', { name: 'Ordenar per data o nom' }));
  expect(screen.getByRole('button', { name: 'Nom (A-Z)', pressed: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Data d\'actualització', pressed: false })).toBeTruthy();
});

test('la roda dentada és sempre present: sense configuració pròpia obri la de l’espai de treball', () => {
  const { container } = render(<UniversalWorkspace collapsibleNavigation={false}
    labels={{ categories: 'WIKI DE POBLE' }}
    model={{ status: 'ready', items: [{ id: 'a', title: 'A' }] }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Configuració de l’espai de treball' }));
  expect(screen.getByRole('heading', { name: 'Configuració de l’espai de treball' })).toBeTruthy();
  /* Llei de la Roda Dentada (261007) · L'amplada té el seu títol; sense cap
     carpeta a la navegació, «Carpetes a la vista» no es pinta. */
  expect(screen.getByRole('heading', { level: 3, name: 'Amplada de les columnes' })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Carpetes a la vista' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Compacta' }));
  // PRESETS.compacta d'AppGridShell (210/250) des de 797ae271, «columnes més estretes».
  expect(container.querySelector('.app-grid-page').style.getPropertyValue('--app-grid-col-sidebar')).toBe('210px');
  expect(container.querySelector('.app-grid-page').style.getPropertyValue('--app-grid-col-list')).toBe('250px');
  fireEvent.click(screen.getByRole('button', { name: 'Fet' }));
  expect(container.querySelector('dialog').open).toBe(false);
});

test('revalidació buida no es presenta com absència i crear queda desactivat', () => {
  render(<UniversalWorkspace model={{ status: 'revalidating', items: [] }} onCreate={() => {}} />);
  expect(screen.queryByText('No hi ha elements.')).toBeNull();
  expect(screen.getByRole('button', { name: 'CREAR' }).disabled).toBe(true);
});

test('la roda de CARPETES apareix amb onManageCategories i continua visible amb la columna replegada', () => {
  const onManage = vi.fn();
  render(
    <UniversalWorkspace
      model={model}
      className="sdp-bloc"
      labels={{ categories: 'CARPETES', items: 'NOTES' }}
      onManageCategories={onManage}
      renderDetail={() => null}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Configurar categories' }));
  expect(onManage).toHaveBeenCalledTimes(1);
  // Sense opt-in, Carpetes i Notes mantenen el títol separat del replegar.
  expect(document.querySelector('.app-grid-col-header--replegable')).toBeNull();
  // sdp-app-grid-shell §3: replegada la columna, la roda continua al costat de l'icona d'obrir.
  fireEvent.click(screen.getByRole('button', { name: 'Replegar CARPETES' }));
  const expandir = screen.getByRole('button', { name: 'Expandir CARPETES' });
  const roda = screen.getByRole('button', { name: 'Configurar categories' });
  // Totes dues a dalt, en este ordre, abans del rail de carpetes.
  const capcalera = expandir.parentElement;
  expect(roda.parentElement).toBe(capcalera);
  expect([...capcalera.children].indexOf(roda)).toBe(1);
  expect(capcalera.lastElementChild.matches('nav.sdp-workspace-rail')).toBe(true);
});

/* Ordre d'usabilitat del Mestre (30-10-2026) · A Disseny, la Wiki i
   Multimèdia (collapsibleNavigation false; abans, també replegaTotaCapcalera,
   que l'espai ja no llig i que el corrector del Gauntlet f4 els ha llevat) la
   fila ja no és un sol botó: el títol és text
   fix i pleguen la icona de l'esquerra i el [|<], dos botons germans, cadascun
   amb el seu nom, que declaren la columna (aria-expanded, aria-controls). El
   rail plegat porta la mateixa icona dalt. Les altres accions (la roda)
   continuen fora dels dos botons. */
test.each([
  ['DISSENY', 'COMPONENTS'],
  ['WIKI DE POBLE', 'DOCUMENTS']
])('%s i %s: la icona i el [|<] repleguen el panell, el títol és fix i les altres accions no hi entren', (categories, items) => {
  render(
    <UniversalWorkspace
      model={model}
      collapsibleNavigation={false}
      labels={{ categories, items }}
      icons={{ categories: NotebookPen, items: FileText }}
    />
  );
  expect(document.querySelector('.app-grid-col-header--replegable')).toBeNull();
  for (const [nom, id, glif] of [[categories, 'app-grid-sidebar', 'lucide-notebook-pen'], [items, 'app-grid-list', 'lucide-file-text']]) {
    const titol = screen.getByText(nom, { selector: '.app-grid-col-header__titol' });
    expect(titol.closest('button')).toBeNull();
    const icona = screen.getByRole('button', { name: `Plegar la columna ${nom}` });
    const replega = screen.getByRole('button', { name: `Replegar ${nom}` });
    expect(icona).not.toBe(replega);
    for (const boto of [icona, replega]) {
      expect([boto.getAttribute('aria-expanded'), boto.getAttribute('aria-controls')]).toEqual(['true', id]);
      expect(boto.querySelector('button')).toBeNull();
    }
    expect(icona.querySelector(`svg.${glif}`)).not.toBeNull();
    /* El títol no plega res. */
    fireEvent.click(titol);
    expect(screen.queryByRole('button', { name: `Expandir ${nom}` })).toBeNull();
    for (const boto of [`Plegar la columna ${nom}`, `Replegar ${nom}`]) {
      fireEvent.click(screen.getByRole('button', { name: boto }));
      const expandir = screen.getByRole('button', { name: `Expandir ${nom}` });
      expect(expandir.getAttribute('aria-expanded')).toBe('false');
      expect(expandir.querySelector(`svg.${glif}`)).not.toBeNull();
      fireEvent.click(expandir);
      expect(screen.getByRole('button', { name: `Replegar ${nom}` })).toBeTruthy();
    }
  }
  fireEvent.click(screen.getByRole('button', { name: 'Configuració de l’espai de treball' }));
  expect(screen.getByRole('heading', { name: 'Configuració de l’espai de treball' })).toBeTruthy();
});

test('columna de carpetes plegada: rail amb un botó per carpeta de primer nivell que selecciona com l’arbre', () => {
  const onSelectionChange = vi.fn();
  const { container } = render(
    <UniversalWorkspace
      model={{
        ...model,
        navigationGroups: [
          { id: 'folders', label: null, options: [
            { id: 'f-mur', label: 'Mur', icon: '📰' },
            { id: 'f-mercat', label: 'Mercat' },
            { id: 'f-sub', label: 'Submur', parentId: 'f-mur' }
          ] },
          { id: 'tags', label: 'ETIQUETES', options: [{ id: 'tag_Tutorial', label: 'Tutorial' }] }
        ]
      }}
      initialSelection={{ categoryId: 'f-mercat' }}
      onSelectionChange={onSelectionChange}
      labels={{ categories: 'CARPETES', items: 'NOTES' }}
      renderDetail={() => null}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Replegar CARPETES' }));
  const rail = screen.getByRole('navigation', { name: 'CARPETES' });
  expect(rail.classList.contains('sdp-workspace-rail')).toBe(true);
  // Només les arrels (Submur viu dins de Mur), grup a grup.
  const botons = within(rail).getAllByRole('button');
  expect(botons.map(b => b.getAttribute('aria-label'))).toEqual(['Mur', 'Mercat', 'Tutorial']);
  expect(botons.map(b => b.getAttribute('title'))).toEqual(['Mur', 'Mercat', 'Tutorial']);
  // Glif propi (emoji), carpeta per defecte i icona del tipus de grup: mai una lletra.
  expect(botons[0].querySelector('.sdp-nav-glyph')?.textContent).toBe('📰');
  expect(botons[1].querySelector('svg.lucide-folder')).toBeTruthy();
  expect(botons[2].querySelector('svg.lucide-hash')).toBeTruthy();
  expect(botons[1].getAttribute('aria-current')).toBe('page');

  onSelectionChange.mockClear();
  fireEvent.click(botons[2]);
  expect(onSelectionChange).toHaveBeenCalledWith({ categoryId: 'tag_Tutorial', itemId: null }, { reason: 'user' });
  expect(within(rail).getByRole('button', { name: 'Tutorial' }).getAttribute('aria-current')).toBe('page');

  // Una carpeta amb fills s'obri i se selecciona; en desplegar la columna, els fills ja es veuen.
  fireEvent.click(within(rail).getByRole('button', { name: 'Mur' }));
  expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: 'f-mur', itemId: 'n1' }, { reason: 'user' });
  fireEvent.click(screen.getByRole('button', { name: 'Expandir CARPETES' }));
  expect(screen.getByRole('button', { name: 'Submur' })).toBeTruthy();
  expect(container.querySelector('.sdp-workspace-rail')).toBeNull();
});

test('el rail marca l’arrel que conté una subcarpeta activa', () => {
  render(
    <UniversalWorkspace
      model={{ status: 'ready', categories: [{ id: 'wiki', label: 'Wiki' }, { id: 'saber', label: 'Saber', parentId: 'wiki' }], items: [] }}
      initialSelection={{ categoryId: 'saber' }}
      labels={{ categories: 'WIKI' }}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Replegar WIKI' }));
  const rail = screen.getByRole('navigation', { name: 'WIKI' });
  expect(within(rail).getByRole('button', { name: 'Wiki' }).getAttribute('aria-current')).toBe('true');
});

test('l’arbre desplegat accepta un emoji com a glif de categoria', () => {
  const { container } = render(
    <UniversalWorkspace
      model={{ status: 'ready', categories: [{ id: 'fonaments', label: 'Fonaments', icon: '🧱' }, { id: 'altres', label: 'Altres' }], items: [] }}
      labels={{ categories: 'DISSENY' }}
    />
  );
  const fonaments = screen.getByRole('button', { name: 'Fonaments' });
  expect(fonaments.querySelector('.sdp-workspace-nav-item__icon .sdp-nav-glyph')?.textContent).toBe('🧱');
  expect(screen.getByRole('button', { name: 'Altres' }).querySelector('svg.lucide-folder')).toBeTruthy();
  expect(container.querySelectorAll('.sdp-workspace-nav-item__icon:empty')).toHaveLength(0);
});

test('columna de documents plegada: rail compacte amb el glif de cada document que l’obri', () => {
  const onSelectionChange = vi.fn();
  render(
    <UniversalWorkspace
      model={{
        status: 'ready',
        categories: [{ id: 'fonaments', label: 'Fonaments', icon: '🧱' }],
        items: [
          { id: 'a', title: 'Color', categoryIds: ['fonaments'] },
          { id: 'b', title: '🍅 Tomaques', categoryIds: ['fonaments'] },
          { id: 'c', title: 'Propi', icon: '📦', categoryIds: ['fonaments'] },
          { id: 'd', title: 'Orfe', categoryIds: [] }
        ]
      }}
      initialSelection={{ categoryId: '__all__', itemId: 'a' }}
      onSelectionChange={onSelectionChange}
      labels={{ categories: 'DISSENY', items: 'COMPONENTS' }}
      renderDetail={() => null}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Replegar COMPONENTS' }));
  // L'expandir i la lupa continuen a dalt; el botó de crear no hi és (§3).
  expect(screen.getByRole('button', { name: 'Expandir COMPONENTS' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Cercar elements' })).toBeTruthy();
  const rail = screen.getByRole('navigation', { name: 'COMPONENTS' });
  const glif = (nom) => within(rail).getByRole('button', { name: nom });
  expect(glif('Color').querySelector('.sdp-nav-glyph')?.textContent).toBe('🧱');
  expect(glif('🍅 Tomaques').querySelector('.sdp-nav-glyph')?.textContent).toBe('🍅');
  expect(glif('Propi').querySelector('.sdp-nav-glyph')?.textContent).toBe('📦');
  expect(glif('Orfe').querySelector('svg.lucide-file-text')).toBeTruthy();
  expect(glif('Color').getAttribute('aria-current')).toBe('true');

  onSelectionChange.mockClear();
  fireEvent.click(glif('Propi'));
  expect(onSelectionChange).toHaveBeenCalledWith({ categoryId: '__all__', itemId: 'c' }, { reason: 'user' });
  expect(glif('Propi').getAttribute('aria-current')).toBe('true');
});

test('fitxa sense imatge: glif propi, després el de la categoria i la lletra només si no hi ha res', () => {
  const { container } = render(
    <UniversalWorkspace
      model={{
        status: 'ready',
        categories: [{ id: 'amb', label: 'Amb glif', icon: '🧭' }, { id: 'sense', label: 'Sense glif' }],
        items: [
          { id: 'a', title: 'Pestanyes', categoryIds: ['amb'] },
          { id: 'b', title: 'Molla', icon: '🍞', categoryIds: ['amb'] },
          { id: 'c', title: 'divisor', categoryIds: ['sense'] }
        ]
      }}
      initialSelection={{ categoryId: '__all__', itemId: 'a' }}
      renderDetail={() => null}
    />
  );
  const media = (titol) => [...container.querySelectorAll('.sdp-gestor-fitxa')]
    .find(fitxa => fitxa.querySelector('.sdp-gestor-fitxa__titol')?.textContent === titol)
    .querySelector('.sdp-gestor-fitxa__media');
  expect(media('Pestanyes').textContent).toBe('🧭');
  expect(media('Molla').textContent).toBe('🍞');
  expect(media('divisor').textContent).toBe('D');
});

/* Ordre del Mestre (261007) · «Allà on ara hi ha emojis menuts a la columna
   central s'han de mostrar a mida XL». Un emoji (propi, del títol o de la
   categoria) porta la classe de l'emoji XL; la icona de Lucide, un text que
   no és cap emoji i la inicial, no (Llei del Píxel). */
test('fitxa sense imatge: l’emoji, d’on vinga, va en XL; la icona de Lucide, el text i la inicial, no', () => {
  const { container } = render(
    <UniversalWorkspace
      model={{
        status: 'ready',
        categories: [
          { id: 'emoji', label: 'Amb emoji', icon: '🧭' },
          { id: 'lucide', label: 'Amb Lucide', icon: FileText },
          { id: 'sense', label: 'Sense glif' }
        ],
        items: [
          { id: 'a', title: 'Pestanyes', categoryIds: ['emoji'] },
          { id: 'b', title: 'Molla', icon: '🍞', categoryIds: ['sense'] },
          { id: 'c', title: '🍅 Tomaques', categoryIds: ['sense'] },
          { id: 'd', title: 'Document', categoryIds: ['lucide'] },
          { id: 'e', title: 'Sigles', icon: 'AB', categoryIds: ['sense'] },
          { id: 'f', title: 'divisor', categoryIds: ['sense'] }
        ]
      }}
      initialSelection={{ categoryId: '__all__', itemId: 'a' }}
      renderDetail={() => null}
    />
  );
  const media = (titol) => [...container.querySelectorAll('.sdp-gestor-fitxa')]
    .find(fitxa => fitxa.querySelector('.sdp-gestor-fitxa__titol')?.textContent === titol)
    .querySelector('.sdp-gestor-fitxa__media');
  const classe = (titol) => media(titol).querySelector('.sdp-gestor-fitxa__inicial')?.className ?? null;
  for (const [titol, emoji] of [['Pestanyes', '🧭'], ['Molla', '🍞'], ['🍅 Tomaques', '🍅']]) {
    expect(media(titol).textContent, titol).toBe(emoji);
    expect(classe(titol), titol).toBe('sdp-gestor-fitxa__inicial sdp-fitxa-emoji-xl');
  }
  // La icona de Lucide de la categoria no és cap emoji: es queda com era.
  expect(media('Document').querySelector('svg.lucide-file-text')).toBeTruthy();
  expect(media('Document').querySelector('.sdp-fitxa-emoji-xl')).toBeNull();
  // Un text que no és cap emoji i la inicial, la classe de sempre.
  expect([media('Sigles').textContent, classe('Sigles')]).toEqual(['AB', 'sdp-gestor-fitxa__inicial']);
  expect([media('divisor').textContent, classe('divisor')]).toEqual(['D', 'sdp-gestor-fitxa__inicial']);
});

test('A11Y: el títol plegable de la columna no es declara pàgina actual', () => {
  renderWorkspace();
  const carpetes = screen.getByRole('button', { name: 'CARPETES' });
  expect(carpetes.hasAttribute('aria-current')).toBe(false);
  expect(carpetes.getAttribute('aria-expanded')).toBe('true');
});

/* ═══ T6 · El focus en tancar una columna (mitjà i estret) ═════════════════
   chooseCategory i chooseItem tanquen la columna i mouen el focus dos
   fotogrames després (focusAfterLayout). Entremig, el focus no pot quedar
   dins de la columna que passa a aria-hidden i inert: la guarda d'AppGridShell
   l'allibera en el mateix commit, perquè cap botó amb aria-controls la torna
   a obrir. Els fotogrames es buiden a mà. */

/* Un botó del detall que obri la navegació, sense aria-controls. */
function ObriNavegacio() {
  const { setPanellObert } = useAppGrid();
  return <button type="button" onClick={() => setPanellObert('left')}>Obri la navegació</button>;
}

function ambAmpladaIFotogrames(amplada, prova) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const rafAbans = globalThis.requestAnimationFrame;
  const cua = [];
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => amplada });
  globalThis.requestAnimationFrame = (cb) => { cua.push(cb); return cua.length; };
  const buidaFotogrames = () => act(() => { while (cua.length) cua.shift()(0); });
  try {
    prova(buidaFotogrames);
  } finally {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
    globalThis.requestAnimationFrame = rafAbans;
  }
}

function renderWorkspaceAmbDetall() {
  return render(
    <UniversalWorkspace
      model={model}
      labels={{ categories: 'CARPETES', items: 'NOTES' }}
      tagFilter={false}
      renderDetail={() => <ObriNavegacio />}
    />
  );
}

/* Columnes fixes (ordre del Mestre, 30-10-2026) · Abans, a 820 («mitja») la
   navegació era un panell que es tancava en triar una carpeta, i la guarda
   T6 en traia el focus. Ara és la columna de la graella: no es tanca mai i
   el focus es queda a la carpeta triada, com a 1400. La guarda T6 continua
   a «estret» (davall) i a la closca (AppGridShell.test.jsx). */
test('T6 · a 820 (columnes fixes), triar una carpeta deixa el focus a la carpeta: la navegació no es tanca ni es tapa', () => {
  ambAmpladaIFotogrames(820, (buidaFotogrames) => {
    const { container } = renderWorkspaceAmbDetall();
    const shell = container.querySelector('.app-grid-shell');
    expect([shell.dataset.layout, shell.dataset.panell]).toEqual(['ample', '']);
    const sidebar = container.querySelector('#app-grid-sidebar');
    const mercat = within(sidebar).getByRole('button', { name: 'Mercat' });
    mercat.focus();
    fireEvent.click(mercat);
    expect(shell.dataset.panell).toBe('');
    expect([sidebar.hasAttribute('inert'), sidebar.getAttribute('aria-hidden')]).toEqual([false, null]);
    buidaFotogrames();
    expect(document.activeElement).toBe(within(sidebar).getByRole('button', { name: 'Mercat' }));
    expect(document.activeElement.getAttribute('aria-current')).toBe('page');
  });
});

test('T6 · en estret, triar una carpeta i després una nota no deixa mai el focus a la columna que s’amaga', () => {
  ambAmpladaIFotogrames(375, (buidaFotogrames) => {
    const { container } = renderWorkspaceAmbDetall();
    const shell = container.querySelector('.app-grid-shell');
    expect([shell.dataset.layout, shell.dataset.panell]).toEqual(['estret', '']);
    fireEvent.click(within(container.querySelector('#app-grid-main')).getByRole('button', { name: 'Obri la navegació' }));
    expect(shell.dataset.panell).toBe('left');
    const sidebar = container.querySelector('#app-grid-sidebar');
    const mur = within(sidebar).getByRole('button', { name: 'Mur' });
    mur.focus();
    fireEvent.click(mur);
    expect(shell.dataset.panell).toBe('middle');
    expect(sidebar.getAttribute('aria-hidden')).toBe('true');
    expect(sidebar.contains(document.activeElement)).toBe(false);
    buidaFotogrames();
    const llista = container.querySelector('#app-grid-list');
    expect(document.activeElement).toBe(llista.querySelector('aside.sdp-workspace-column'));

    const fitxa = llista.querySelector('button.sdp-gestor-fitxa');
    fitxa.focus();
    fireEvent.click(fitxa);
    expect(shell.dataset.panell).toBe('');
    expect(llista.getAttribute('aria-hidden')).toBe('true');
    expect(llista.contains(document.activeElement)).toBe(false);
    buidaFotogrames();
    expect(document.activeElement).toBe(container.querySelector('#app-grid-main .sdp-workspace-detail'));
  });
});

/* Revisió del T6 · El catàleg de Disseny pinta el RailXat de mostra al detall
   (EspecimenXatRail): les seues capçaleres són les de producció
   (AppGridColumn) i porten aria-controls="app-grid-sidebar". En mitjà, la
   columna dreta és oberta; la guarda no les ha de prendre per l'obridor del
   panell esquerre, ni tan sols els dos fotogrames d'abans de focusAfterLayout. */
function DetallAmbRailDeMostra() {
  return (
    <>
      <ObriNavegacio />
      <AppGridColumn esDark titol="Menú" replegaTotaCapcalera controls="app-grid-sidebar" onReplega={() => {}} />
      <AppGridColumn variant="collapsed" esDark titol="Menú" controls="app-grid-sidebar" onReplega={() => {}} />
    </>
  );
}

test('T6 · a 820 (columnes fixes), triar una carpeta no porta el focus a les capçaleres del rail de mostra del detall', () => {
  ambAmpladaIFotogrames(820, (buidaFotogrames) => {
    const { container } = render(
      <UniversalWorkspace
        model={model}
        labels={{ categories: 'CARPETES', items: 'NOTES' }}
        tagFilter={false}
        renderDetail={() => <DetallAmbRailDeMostra />}
      />
    );
    const shell = container.querySelector('.app-grid-shell');
    expect(shell.dataset.layout).toBe('ample');
    const detall = container.querySelector('#app-grid-main');
    const mostres = [
      within(detall).getByRole('button', { name: 'Replegar Menú' }),
      within(detall).getByRole('button', { name: 'Expandir Menú' })
    ];
    mostres.forEach((b) => expect(b.getAttribute('aria-controls')).toBe('app-grid-sidebar'));
    const sidebar = container.querySelector('#app-grid-sidebar');
    const mercat = within(sidebar).getByRole('button', { name: 'Mercat' });
    mercat.focus();
    fireEvent.click(mercat);
    expect(shell.dataset.panell).toBe('');
    expect(sidebar.getAttribute('aria-hidden')).toBeNull();
    /* Immediatament i després dels fotogrames: el focus, a la carpeta. */
    expect(mostres).not.toContain(document.activeElement);
    buidaFotogrames();
    expect(mostres).not.toContain(document.activeElement);
    expect(document.activeElement).toBe(within(sidebar).getByRole('button', { name: 'Mercat' }));
  });
});

/* La política d'autotria és opcional: les accions manuals i els altres
   consumidors conserven el seu contracte sense conéixer fonts del Bloc. */
function SelectionPolicyProbe() {
 const workspace=useWorkspace();
 return <><output data-testid="policy-selection">{`${workspace.state.activeCategoryId}:${workspace.state.activeItemId??'cap'}:${workspace.state.needsInitialSelection}`}</output>
  <button onClick={()=>workspace.selectCategory('a')}>Categoria A</button>
  <button onClick={()=>workspace.selectCategory('b')}>Categoria B</button>
  <button onClick={()=>workspace.selectItem('fallback')}>Tria manual</button>
  <button onClick={()=>workspace.requestItem('nova-manual')}>Creació manual</button></>;
}
const policyCategories=[{id:'a'},{id:'b'}];
const policyItems=[{id:'a1',categoryIds:['a']},{id:'fallback',categoryIds:['b']}];
const policySelection=()=>screen.getByTestId('policy-selection').textContent;
function policyTree(props) {return <WorkspaceProvider categories={policyCategories} items={policyItems} itemsComplete initialSelection={{categoryId:'a',itemId:'a1'}} {...props}><SelectionPolicyProbe/></WorkspaceProvider>;}

test('sense política, triar una carpeta continua obrint el primer candidat habitual',()=>{
 render(policyTree({}));fireEvent.click(screen.getByRole('button',{name:'Categoria B'}));
 expect(policySelection()).toBe('b:fallback:false');
});
test('una autotria ajornada conserva la carpeta i obri el candidat real quan arriba',()=>{
 const change=vi.fn(),canAutoSelect=({categoryId,item})=>categoryId!=='b'||Boolean(item&&item.id!=='fallback');
 const vista=render(policyTree({canAutoSelect,onSelectionChange:change}));
 fireEvent.click(screen.getByRole('button',{name:'Categoria B'}));
 expect(policySelection()).toBe('b:cap:true');
 expect(change).toHaveBeenLastCalledWith({categoryId:'b',itemId:null},{reason:'user'});
 vista.rerender(policyTree({canAutoSelect,onSelectionChange:change,items:[...policyItems,{id:'real',categoryIds:['b']}]}));
 expect(policySelection()).toBe('b:real:false');
});
test('la política no impedix selectItem ni requestItem manuals',()=>{
 render(policyTree({canAutoSelect:()=>false}));
 fireEvent.click(screen.getByRole('button',{name:'Tria manual'}));
 expect(policySelection()).toBe('b:fallback:false');
 fireEvent.click(screen.getByRole('button',{name:'Creació manual'}));
 expect(policySelection()).toBe('b:nova-manual:false');
});
test('una preparada recordada ajornada no amaga un altre candidat disponible',()=>{
 const canAutoSelect=({categoryId,item})=>categoryId!=='b'||Boolean(item&&item.id!=='fallback');
 render(policyTree({canAutoSelect,initialSelection:{categoryId:'b',itemId:'fallback'},items:[...policyItems,{id:'real',categoryIds:['b']}]}));
 fireEvent.click(screen.getByRole('button',{name:'Categoria A'}));
 fireEvent.click(screen.getByRole('button',{name:'Categoria B'}));
 expect(policySelection()).toBe('b:real:false');
});
test('la reconciliació no substituïx un ID absent per un fallback ajornat',()=>{
 const canAutoSelect=({item})=>Boolean(item&&item.id!=='fallback');
 const vista=render(policyTree({canAutoSelect,initialSelection:{categoryId:'b',itemId:'fantasma'}}));
 expect(policySelection()).toBe('b:fantasma:false');
 vista.rerender(policyTree({canAutoSelect,initialSelection:{categoryId:'b',itemId:'fantasma'},items:[...policyItems,{id:'real',categoryIds:['b']}]}));
 expect(policySelection()).toBe('b:real:false');
});

/* ═══ F2 del Gauntlet (261016, defecte L1-2 del Lector) · El que es veu a la llista ═══
   renderDetail rep, a més de { item, selection }, dos camps opcionals: `visibleItemIds`, els ids
   (en text) que hi deixen la carpeta, les etiquetes i la cerca, en un array congelat que
   conserva la referència mentre no canvien; i `filtered`, si hi ha una cerca o una etiqueta
   activa. Qui només llig item i selection (Notes, Wiki, Disseny, Admin, Perfil) pinta el mateix
   DOM, i una tecla de la cerca que no canvia el resultat no torna a cridar renderDetail
   (DetailColumn és memo). Cap nom nou a la porta 'workspace' del nucli. */
const MODEL_VISIBLES = {
  status: 'ready',
  categories: [{ id: 'hort', label: 'Hort' }, { id: 'corral', label: 'Corral' }],
  items: [
    { id: 1, title: 'Tomaques', categoryIds: ['hort'], tags: ['estiu'] },
    { id: 'b', title: 'Bajoques', categoryIds: ['hort'], tags: ['estiu'] },
    { id: 'c', title: 'Carxofes', categoryIds: ['hort'], tags: ['hivern'] },
    { id: 'g', title: 'Gallines', categoryIds: ['corral'] }
  ]
};
const cercaElements = (text) => fireEvent.change(screen.getByRole('searchbox', { name: 'Cercar elements' }), { target: { value: text } });

test('F2 · renderDetail rep els ids que es veuen a la llista i si hi ha filtre: carpeta, cerca i etiquetes', () => {
  const rebuts = [];
  render(
    <UniversalWorkspace
      model={MODEL_VISIBLES}
      initialSelection={{ categoryId: 'hort', itemId: '1' }}
      renderDetail={(arg) => { rebuts.push(arg); return <p>Detall</p>; }}
    />
  );
  const darrer = () => rebuts[rebuts.length - 1];
  /* La forma de l'argument: els dos camps de sempre i els dos nous, opcionals. */
  expect(Object.keys(darrer())).toEqual(['item', 'selection', 'visibleItemIds', 'filtered']);
  expect(darrer().selection).toEqual({ categoryId: 'hort', itemId: '1' });
  expect(darrer().visibleItemIds).toEqual(['1', 'b', 'c']);
  expect(Object.isFrozen(darrer().visibleItemIds)).toBe(true);
  expect(darrer().filtered).toBe(false);

  /* Una cerca: només el resultat, i filtrat. Obrir la lupa no és cap filtre. */
  fireEvent.click(screen.getByRole('button', { name: 'Cercar elements' }));
  expect(darrer().filtered).toBe(false);
  cercaElements('ba');
  expect(darrer().visibleItemIds).toEqual(['b']);
  expect(darrer().filtered).toBe(true);
  /* Una tecla que no canvia el resultat: cap crida nova i la mateixa referència. */
  const crides = rebuts.length;
  const ids = darrer().visibleItemIds;
  cercaElements('baj');
  expect(rebuts).toHaveLength(crides);
  expect(darrer().visibleItemIds).toBe(ids);

  /* Una etiqueta, sense cerca: també és un filtre. */
  cercaElements('');
  expect([darrer().visibleItemIds, darrer().filtered]).toEqual([['1', 'b', 'c'], false]);
  fireEvent.click(screen.getByRole('button', { name: 'hivern' }));
  expect([darrer().visibleItemIds, darrer().filtered]).toEqual([['c'], true]);

  /* Tancar la cerca la neteja: la carpeta sencera, sense filtre. */
  fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
  expect([darrer().visibleItemIds, darrer().filtered]).toEqual([['1', 'b', 'c'], false]);

  /* Una altra tria a la mateixa carpeta: crida nova, la mateixa llista (la mateixa referència). */
  const abans = darrer().visibleItemIds;
  fireEvent.click(screen.getByRole('button', { name: 'Bajoques' }));
  expect(darrer().item.id).toBe('b');
  expect(darrer().visibleItemIds).toBe(abans);

  /* Una altra carpeta: els seus ids. */
  fireEvent.click(screen.getByRole('button', { name: 'Corral' }));
  expect([darrer().visibleItemIds, darrer().filtered]).toEqual([['g'], false]);
});

test('F2 · qui només llig item i selection pinta el DOM de sempre, amb cerca i sense', () => {
  const { container } = render(
    <UniversalWorkspace
      model={MODEL_VISIBLES}
      initialSelection={{ categoryId: 'hort', itemId: '1' }}
      renderDetail={({ item, selection }) => <p>{item ? `Detall de ${item.title} (${selection.categoryId})` : 'res'}</p>}
    />
  );
  const detall = () => container.querySelector('#app-grid-main .sdp-workspace-detail');
  const sempre = '<div tabindex="-1" class="sdp-workspace-detail" data-error="false"><p>Detall de Tomaques (hort)</p></div>';
  expect(detall().outerHTML).toBe(sempre);
  fireEvent.click(screen.getByRole('button', { name: 'Cercar elements' }));
  cercaElements('carx');
  fireEvent.click(screen.getByRole('button', { name: 'hivern' }));
  expect(detall().outerHTML).toBe(sempre);
  fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
  expect(detall().outerHTML).toBe(sempre);
});
