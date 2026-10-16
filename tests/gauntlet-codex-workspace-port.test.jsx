// @vitest-environment node
/* El SSR de modulDeBuild només exercita la targeta de modulAmbEspai. Ací
   el mateix cos compilat munta la branca UniversalWorkspace amb el NUCLI
   real, els contexts de la pàgina i les interaccions del navegador simulat.
   Mesurem recursos vius; açò no és una mesura de heap ni una càrrega de xarxa. */
import path from 'node:path';
import vm from 'node:vm';
import React, { StrictMode } from 'react';
import { build } from 'vite';
import { JSDOM } from 'jsdom';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { configDelModul } from '../vite.modul.config.js';
import { MemoryRouter } from '../src/app/contexts/RouterContext.jsx';
import { useWorkspace } from '../src/components/universal/workspace/WorkspaceContext.jsx';
import * as folderStore from '../src/components/universal/workspace/carpetesVisibles.js';

const ARREL = process.cwd();
const CARPETA = path.join(ARREL, 'src/apps/plataforma/__fixtures__/modulAmbEspai');
let code, Module, NUCLI, dom, testing, widthDescriptor;
let width, observers, subscribers, frames, nextFrameId;

beforeAll(async () => {
  /* Mateix procediment que compilaEnMemoria de modulDeBuild.test.jsx.
     El helper és privat d'aquella suite: reutilitzem el config públic,
     sense importar el fitxer de proves ni arrancar-ne els altres builds.
     esbuild necessita l'entorn Node; el DOM es crea DESPRÉS del build. */
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const config = configDelModul({
      id: 'modul-amb-espai', arrel: ARREL, carpeta: CARPETA,
      versio: '0.0.0-prova', generat: '2026-10-16T00:00:00.000Z'
    });
    const output = await build({
      ...config, mode: 'production', logLevel: 'silent', envDir: CARPETA,
      esbuild: { jsx: 'automatic', jsxDev: false },
      build: { ...config.build, write: false, emptyOutDir: false }
    });
    const chunks = [].concat(output).flatMap(result => result.output);
    const body = chunks.find(chunk => chunk.type === 'chunk' && chunk.isEntry);
    expect(body.importedBindings['src/components/universal/workspace/index.js'].slice().sort())
      .toEqual(['DefaultItemCard', 'UniversalWorkspace']);
    code = body.code;
  } finally {
    if (previousEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnv;
  }
}, 120000);

beforeEach(async () => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://poble.invalid/' });
  for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'localStorage', 'sessionStorage']) {
    vi.stubGlobal(name, name === 'window' ? dom.window : dom.window[name]);
  }
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  width = 1400;
  observers = new Set(); subscribers = new Set(); frames = new Map(); nextFrameId = 0;
  widthDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => width });
  vi.stubGlobal('ResizeObserver', class {
    observe() { observers.add(this); }
    disconnect() { observers.delete(this); }
  });
  vi.stubGlobal('requestAnimationFrame', callback => {
    const id = ++nextFrameId; frames.set(id, callback); return id;
  });
  vi.stubGlobal('cancelAnimationFrame', id => frames.delete(id));
  const subscribe = folderStore.subscriuCarpetesVisibles;
  vi.spyOn(folderStore, 'subscriuCarpetesVisibles').mockImplementation(listener => {
    subscribers.add(listener);
    const unsubscribe = subscribe(listener);
    return () => { subscribers.delete(listener); unsubscribe(); };
  });
  folderStore._reiniciaCarpetesVisibles();
  /* /pure no registra hooks de Vitest durant este import dinàmic. */
  testing = await import('@testing-library/react/pure');
  ({ NUCLI } = await import('../src/apps/plataforma/nucliModuls.js'));
  const delivered = [];
  vm.runInNewContext(code, {
    SocDePoble: { nucli: NUCLI, lliuraCos: (id, factory) => delivered.push([id, factory(NUCLI)]) }
  });
  expect(delivered.map(([id]) => id)).toEqual(['modul-amb-espai']);
  [[, Module]] = delivered;
});

afterEach(() => {
  try {
    testing?.cleanup();
  } finally {
    if (dom) {
      const prototype = dom.window.HTMLElement.prototype;
      if (widthDescriptor) Object.defineProperty(prototype, 'clientWidth', widthDescriptor);
      else delete prototype.clientWidth;
    }
    folderStore._reiniciaCarpetesVisibles();
    vi.restoreAllMocks();
    try {
      dom?.window.close();
    } finally {
      vi.unstubAllGlobals();
    }
  }
});

function ContextGlyph() {
  const { state } = useWorkspace();
  const { pathname } = NUCLI.router.useLocation();
  return <span data-testid="host-context" data-path={pathname} data-category={state.activeCategoryId} data-item={state.activeItemId} />;
}

const model = {
  status: 'ready', itemsComplete: true, canCreate: false,
  categories: [{ id: 'noticies', label: 'Notícies' }, { id: 'rutes', label: 'Rutes' }],
  items: [
    { id: 'a', title: 'Nota A', categoryIds: ['noticies'], icon: ContextGlyph },
    { id: 'b', title: 'Nota B', categoryIds: ['noticies'], icon: ContextGlyph },
    { id: 'pou', title: 'Pou del Raval', categoryIds: ['rutes'], icon: ContextGlyph }
  ]
};

function mountModule() {
  return testing.render(<StrictMode><MemoryRouter rutaInicial="/app/modul-amb-espai/inici">
    <Module model={model} />
  </MemoryRouter></StrictMode>);
}

function flushFrame() {
  testing.act(() => {
    const batch = [...frames.values()]; frames.clear(); batch.forEach(callback => callback(0));
  });
}

test('el cos compilat munta el Workspace de la pàgina i compartix els contexts durant la selecció', () => {
  const mounted = mountModule();
  testing.fireEvent.click(mounted.getByRole('button', { name: 'Notícies' }));
  testing.fireEvent.click(mounted.getByRole('button', { name: 'Nota B' }));
  expect(mounted.getByRole('button', { name: 'Nota B' }).getAttribute('aria-current')).toBe('true');
  expect(mounted.queryByRole('button', { name: 'Pou del Raval' })).toBeNull();
  for (const probe of mounted.getAllByTestId('host-context')) {
    expect(probe.dataset).toMatchObject({ path: '/app/modul-amb-espai/inici', category: 'noticies', item: 'b' });
  }
  testing.fireEvent.click(mounted.getByRole('button', { name: 'Rutes' }));
  expect(mounted.getByRole('button', { name: 'Pou del Raval' }).getAttribute('aria-current')).toBe('true');
  expect(mounted.getByTestId('host-context').dataset).toMatchObject({ category: 'rutes', item: 'pou' });
  expect(observers.size).toBe(1);
  expect(subscribers.size).toBe(1);
  mounted.unmount();
  expect(observers.size).toBe(0);
  expect(subscribers.size).toBe(0);
  expect(frames.size).toBe(0);
});

test('100 cicles de selecció i plegat del mòdul en StrictMode alliberen observadors, subscripcions i focus pendent', () => {
  for (let cycle = 0; cycle < 100; cycle++) {
    const mounted = mountModule();
    expect(observers.size).toBe(1);
    expect(subscribers.size).toBe(1);
    testing.fireEvent.click(mounted.getByRole('button', { name: 'Nota B' }));
    expect(mounted.getByRole('button', { name: 'Nota B' }).getAttribute('aria-current')).toBe('true');
    testing.fireEvent.click(mounted.getByRole('button', { name: 'Replegar ELEMENTS' }));
    expect(mounted.getByRole('button', { name: 'Expandir ELEMENTS' })).toBeTruthy();
    /* Cobrix cancel·lació tant del primer frame com del segon. */
    if (cycle % 2) flushFrame();
    expect(frames.size).toBeGreaterThan(0);
    mounted.unmount();
    expect(observers.size).toBe(0);
    expect(subscribers.size).toBe(0);
    expect(frames.size).toBe(0);
  }
});
