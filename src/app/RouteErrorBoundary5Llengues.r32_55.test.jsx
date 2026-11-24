import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UIContext } from './contexts/objectesDeContext.js';
import { RouteErrorBoundary, precarregaRecuperacioRuta } from './RouteErrorBoundary.jsx';
import {
  CLAU_CONTEXT_RECUPERACIO_RUTA,
  TEXTOS_RECUPERACIO_RUTA,
  consumeixContextRecuperatRuta,
  rutaContextSegura,
} from './i18nRecuperacioRuta.jsx';
import { lazyRoute } from '../apps/plataforma/lazyRoute.js';

beforeEach(async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  sessionStorage.clear();
  await precarregaRecuperacioRuta();
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

const chunkDeployError = () => {
  const err = new Error('Loading chunk 42 failed (https://socdepoble.org/assets/Mercat-a1b2c3d4.js)');
  err.name = 'ChunkLoadError';
  throw err;
};

describe('R32.55 · R-RES-02 · Auto-recuperació amable post-desplegament en les 5 llengües', () => {
  it.each(['ca', 'es', 'en', 'eu', 'gl'])('mostra la UI amable de desplegament en %s i preserva la ruta sense secrets', async (codi) => {
    const Child = lazyRoute(chunkDeployError);
    const tx = TEXTOS_RECUPERACIO_RUTA[codi];

    render(
      <UIContext.Provider value={{ language: codi, llenguaDelText: codi }}>
        <RouteErrorBoundary resetKey="/mercat?token=secret-privat#ancora" externalConfig={{ manageDocumentHead: true }} mostraDetall={false}>
          <Suspense fallback={<p>…</p>}>
            <Child />
          </Suspense>
        </RouteErrorBoundary>
      </UIContext.Provider>
    );

    const alerta = await screen.findByRole('alert');
    expect(alerta.getAttribute('lang')).toBe(codi);
    expect(screen.getByRole('heading', { level: 2, name: tx.titol })).toBeTruthy();
    expect(screen.getByText(tx.insigniaDeploy)).toBeTruthy();
    expect(screen.getByText(tx.explicacioDeploy)).toBeTruthy();
    expect(screen.getByText(tx.avisMemoria)).toBeTruthy();
    expect(alerta.textContent).toContain('/mercat');
    expect(alerta.textContent).not.toContain('secret-privat');
    expect(screen.getByRole('button', { name: tx.botoRecarrega })).toBeTruthy();
  });

  it('desa el context de ruta i scrollY abans de recarregar i el consumeix una sola vegada dins la finestra', async () => {
    const Child = lazyRoute(chunkDeployError);
    render(
      <UIContext.Provider value={{ language: 'es', llenguaDelText: 'es' }}>
        <RouteErrorBoundary resetKey="/pobles/la-torre-de-les-macanes?filtre=actiu" externalConfig={{ manageDocumentHead: true }} mostraDetall={false}>
          <Suspense fallback={<p>…</p>}>
            <Child />
          </Suspense>
        </RouteErrorBoundary>
      </UIContext.Provider>
    );

    await screen.findByRole('alert');
    const reload = vi.fn();
    const domWin = window;
    vi.stubGlobal('window', new Proxy(domWin, {
      get(target, key) {
        if (key === 'location') return { reload, pathname: '/pobles/la-torre-de-les-macanes' };
        if (key === 'scrollY') return 428;
        if (key === 'self' || key === 'top') return domWin;
        const val = Reflect.get(target, key, target);
        return ['addEventListener', 'removeEventListener', 'dispatchEvent'].includes(key) ? val.bind(target) : val;
      },
    }));

    fireEvent.click(screen.getByRole('button', { name: TEXTOS_RECUPERACIO_RUTA.es.botoRecarrega }));
    expect(reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(CLAU_CONTEXT_RECUPERACIO_RUTA)).toContain('/pobles/la-torre-de-les-macanes');
    expect(sessionStorage.getItem(CLAU_CONTEXT_RECUPERACIO_RUTA)).not.toContain('filtre=actiu');

    const recuperat = consumeixContextRecuperatRuta();
    expect(recuperat).toEqual({ ruta: '/pobles/la-torre-de-les-macanes', scrollY: 428 });
    expect(consumeixContextRecuperatRuta()).toBeNull();
  });

  it('reactiva el botó de recàrrega automàticament quan el dispositiu emet l’esdeveniment online', async () => {
    let connectat = false;
    vi.stubGlobal('navigator', {
      get onLine() {
        return connectat;
      },
    });
    const Child = lazyRoute(chunkDeployError);
    render(
      <UIContext.Provider value={{ language: 'en', llenguaDelText: 'en' }}>
        <RouteErrorBoundary resetKey="/herbari" externalConfig={{ manageDocumentHead: true }} mostraDetall={false}>
          <Suspense fallback={<p>…</p>}>
            <Child />
          </Suspense>
        </RouteErrorBoundary>
      </UIContext.Provider>
    );

    await screen.findByRole('alert');
    const boto = screen.getByRole('button', { name: TEXTOS_RECUPERACIO_RUTA.en.botoRecarrega });
    expect(boto.disabled).toBe(true);
    expect(screen.getByText(TEXTOS_RECUPERACIO_RUTA.en.avisSenseConnexio)).toBeTruthy();

    connectat = true;
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(boto.disabled).toBe(false);
  });

  it('rutaContextSegura neteja consultes, fragments i dobles barres', () => {
    expect(rutaContextSegura('//pobles//benifallim?secret=1#top')).toBe('/pobles/benifallim');
    expect(rutaContextSegura('')).toBe('/');
  });
});
