/* R24 · xat_entrega (IDEA-260 b, P1-4) · El comptador global de no llegits
   fora del Xat: el nom accessible i la pastilla de l'entrada «Xat», el prefix
   «(n) » del títol de la pestanya pel propietari únic del <head> (seoHead real)
   i la insígnia de l'app instal·lada, detectada i sense soroll a la consola. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { registerSeo } from '../../hooks/seoHead.js';
import { sumaNoLlegits } from './missatges.js';

const mock = vi.hoisted(() => ({ total: 0, pathname: '/mur' }));
vi.mock('./XatContext.jsx', () => ({ useXat: () => ({ totalNoLlegits: mock.total }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: mock.pathname }) }));
const { AmbNoLlegitsDelXat, ComptadorGlobalXat } = await import('./ComptadorGlobalXat.jsx');
const { actualitzaInsigniaApp, textNoLlegits } = await import('./comptadorGlobalXatModel.js');
const { ProveidorNoLlegitsGlobalsXat } = await import('./noLlegitsGlobalsXat.js');

const t = (_, reserva) => reserva;
const Entrada = () => (
  <AmbNoLlegitsDelXat etiqueta="Xat" t={t}>
    {(nom, insignia) => <a href="/xat" aria-label={nom}><span>Xat</span>{insignia}</a>}
  </AmbNoLlegitsDelXat>
);
/* Com App.jsx: la closca (l'entrada) és germana de XatProvider, no filla; el total hi arriba pel pont. */
const Enllac = () => (
  <ProveidorNoLlegitsGlobalsXat>
    <Entrada />
    <div><ComptadorGlobalXat /></div>
  </ProveidorNoLlegitsGlobalsXat>
);
const ogTitle = () => document.head.querySelector('meta[property="og:title"]')?.content;

let desregistra = null;
beforeEach(() => { mock.total = 0; mock.pathname = '/mur'; document.title = 'Sóc de Poble'; });
afterEach(() => { cleanup(); desregistra?.(); desregistra = null; vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('l’entrada «Xat» de la navegació', () => {
  it('sense no llegits, el nom de sempre i cap pastilla', () => {
    render(<Enllac />);
    expect(screen.getByRole('link', { name: 'Xat' })).toBeTruthy();
    expect(document.querySelector('.nav-item__insignia')).toBeNull();
  });

  it('amb no llegits, el nom accessible ho diu i la pastilla visible no es llig dues vegades', () => {
    mock.total = 3;
    render(<Enllac />);
    const enllac = screen.getByRole('link', { name: 'Xat, 3 missatges no llegits' });
    const insignia = enllac.querySelector('.nav-item__insignia');
    expect(insignia.getAttribute('aria-hidden')).toBe('true');
    expect(insignia.querySelector('.sdp-xat-pastilla').textContent).toContain('3');
    cleanup();
    mock.total = 1;
    render(<Enllac />);
    expect(screen.getByRole('link', { name: 'Xat, Un missatge no llegit' })).toBeTruthy();
    expect(textNoLlegits(120, t)).toBe('120 missatges no llegits');
  });

  it('sense el pont (fora de l’App), cap comptador', () => {
    mock.total = 3;
    render(<Entrada />);
    expect(screen.getByRole('link', { name: 'Xat' })).toBeTruthy();
  });

  it('el total no compta les converses silenciades ni les arxivades', () => {
    expect(sumaNoLlegits([{ noLlegits: 2 }, { noLlegits: 5, silenciat: true }, { noLlegits: 7, arxivat: true }, { noLlegits: 1 }])).toBe(3);
  });
});

describe('el títol de la pestanya', () => {
  const vista = (path, title) => {
    desregistra?.();
    desregistra = registerSeo(Symbol(path), { path, title, index: false }, { manageDocumentHead: true });
  };

  it('fora del Xat porta «(n) » davant; og:title no; dins del Xat el posa XatSection', () => {
    vista('/mur', 'Mur');
    expect(document.title).toBe('Mur | Sóc de Poble');
    mock.total = 4;
    const { rerender, unmount } = render(<ComptadorGlobalXat />);
    expect(document.title).toBe('(4) Mur | Sóc de Poble');
    expect(ogTitle()).toBe('Mur | Sóc de Poble');
    mock.pathname = '/xat';
    rerender(<ComptadorGlobalXat />);
    expect(document.title).toBe('Mur | Sóc de Poble');
    mock.pathname = '/mur';
    mock.total = 0;
    rerender(<ComptadorGlobalXat />);
    expect(document.title).toBe('Mur | Sóc de Poble');
    mock.total = 2;
    rerender(<ComptadorGlobalXat />);
    expect(document.title).toBe('(2) Mur | Sóc de Poble');
    unmount();
    expect(document.title).toBe('Mur | Sóc de Poble');
  });

  it('sense propietari del <head> (incrustat), no escriu cap títol', () => {
    document.title = 'Pàgina amfitriona';
    mock.total = 5;
    render(<ComptadorGlobalXat />);
    expect(document.title).toBe('Pàgina amfitriona');
  });
});

describe('la insígnia de l’app instal·lada', () => {
  it('posa el número i el lleva a zero, si el navegador en té', () => {
    const navegador = { setAppBadge: vi.fn(async () => {}), clearAppBadge: vi.fn(async () => {}) };
    actualitzaInsigniaApp(3, navegador);
    actualitzaInsigniaApp(0, navegador);
    expect(navegador.setAppBadge).toHaveBeenCalledWith(3);
    expect(navegador.clearAppBadge).toHaveBeenCalledTimes(1);
  });

  it('sense API, amb un rebuig o amb una excepció: res a la consola', async () => {
    const avisos = [vi.spyOn(console, 'error'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'log')];
    const rebutjades = [];
    const escolta = (motiu) => rebutjades.push(motiu);
    process.on('unhandledRejection', escolta);
    try {
      expect(() => actualitzaInsigniaApp(2, {})).not.toThrow();
      actualitzaInsigniaApp(2, { setAppBadge: () => Promise.reject(new DOMException('No instal·lada', 'NotAllowedError')) });
      actualitzaInsigniaApp(2, { setAppBadge: () => { throw new TypeError('Il·legal'); } });
      actualitzaInsigniaApp(0, null);
      await new Promise((resol) => setTimeout(resol, 0));
    } finally {
      process.off('unhandledRejection', escolta);
    }
    expect(rebutjades).toEqual([]);
    for (const espia of avisos) expect(espia).not.toHaveBeenCalled();
  });

  it('el component la sincronitza amb el total', () => {
    const setAppBadge = vi.fn(async () => {});
    const clearAppBadge = vi.fn(async () => {});
    vi.stubGlobal('navigator', { ...globalThis.navigator, setAppBadge, clearAppBadge });
    mock.total = 6;
    const { rerender } = render(<ComptadorGlobalXat />);
    expect(setAppBadge).toHaveBeenLastCalledWith(6);
    mock.total = 0;
    rerender(<ComptadorGlobalXat />);
    expect(clearAppBadge).toHaveBeenCalled();
  });
});
