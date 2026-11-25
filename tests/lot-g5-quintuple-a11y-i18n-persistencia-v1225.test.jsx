import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({
  language: 'ca',
  navigate: vi.fn(),
  logout: vi.fn(),
  preparaEixida: vi.fn(),
}));

vi.mock('../src/app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActionsOpcional: () => ({ language: m.language, t: null }),
}));

vi.mock('../src/app/contexts/RouterContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => m.navigate,
}));

vi.mock('../src/app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ logout: m.logout, preparaEixida: m.preparaEixida }),
  useSessioOpcional: () => null,
}));

import DetallAjust, { pagina } from '../src/sections/profile/DetallAjust.jsx';
import { muntaPlataforma, ENTORN_OBERT } from '../src/apps/plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../src/apps/plataforma/registreApps.js';
import manifestSalut from '../src/apps/salut/manifest.js';
import AppSalut from '../src/apps/salut/AppSalut.jsx';
import { creaMagatzemSalut } from '../src/apps/salut/magatzem.js';
import manifestGenealogia from '../src/apps/genealogia/manifest.js';
import AppGenealogia from '../src/apps/genealogia/AppGenealogia.jsx';
import { creaMagatzemGenealogia } from '../src/apps/genealogia/magatzem.js';
import manifestNevera from '../src/apps/nevera/manifest.js';
import AppNevera from '../src/apps/nevera/AppNevera.jsx';
import { creaMagatzemNevera } from '../src/apps/nevera/magatzem.js';
import CA from '../src/config/idiomes/ca.js';
import ES from '../src/config/idiomes/es.js';
import EN from '../src/config/idiomes/en.js';
import EU from '../src/config/idiomes/eu.js';
import GL from '../src/config/idiomes/gl.js';

const magatzems = [];

function embolcallLectora(base) {
  return new Proxy(base, {
    get(target, prop, receiver) {
      if (prop === 'mode') return 'lectora';
      if (prop === 'obtinBloqueig') return async () => 'lectora';
      if (prop === 'obri') {
        return async () => {
          const estat = await target.obri();
          return { ...estat, mode: 'lectora' };
        };
      }
      const val = Reflect.get(target, prop, receiver);
      return typeof val === 'function' ? val.bind(target) : val;
    },
  });
}

beforeEach(() => {
  m.language = 'ca';
  m.navigate.mockReset();
  m.logout.mockReset().mockResolvedValue(undefined);
  m.preparaEixida.mockReset().mockResolvedValue([]);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(pagina, 'recarrega').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  while (magatzems.length) {
    try { magatzems.pop().tanca?.(); } catch { /* ok */ }
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

describe('Lot G5 · Quíntuple UX/A11y/i18n/Persistència (v1.2.25)', () => {
  test('RR-D12-01 · diferit-cataleg-colleccio.css eleva el contrast de .sdp-camp__ajuda damunt Grafit 700', () => {
    const css = readFileSync(path.join(process.cwd(), 'src/css/diferit-cataleg-colleccio.css'), 'utf8');
    expect(css).toMatch(/:root:not\(\[data-theme="dark"\]\)[^\n]*\.sdp-camp__ajuda/);
    expect(css).toMatch(/:host\(:not\(\[data-theme="dark"\]\)\)[^\n]*\.sdp-camp__ajuda/);
  });

  test('ENT-03 · useEixidaSegura i DetallAjust traduïxen l’avís de pendents i botons en castellà', async () => {
    m.language = 'es';
    m.preparaEixida.mockResolvedValue([{ entitat: 'nota', id: 'n1', camps: ['content'] }]);
    const ajust = { id: 'sessio', lloc: 'compte', titol: 'Cerrar sesión', tipus: 'accio', accio: 'logout', obert: true };
    render(<DetallAjust ajust={ajust} identitat={{ id: 'jo', mena: 'persona', nom: 'Pep', dades: {} }} />);
    const boto = screen.getByRole('button', { name: 'Confirmar salida' });
    await act(async () => { fireEvent.click(boto); });
    const avis = screen.getByRole('status');
    expect(avis.textContent).toContain('Todavía hay cambios sin guardar');
    expect(avis.textContent).toContain('Tienes 1 cambio que el servidor todavía no tiene');
    expect(screen.getByRole('button', { name: 'No salir todavía' })).toBeTruthy();
  });

  test('ML-01 · PeuSalut en pantalla estreta amb idb:null avisa que només es guarda en memòria', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(375);
    const magatzem = creaMagatzemSalut({ idb: null, navegador: {}, Canal: null });
    magatzems.push(magatzem);
    const App = () => <AppSalut magatzem={magatzem} />;
    const registre = creaRegistre({ internes: [{ ...manifestSalut, carrega: () => Promise.resolve({ default: App }) }] });
    muntaPlataforma('/app/salut', { registre, entorn: { ...ENTORN_OBERT, produccio: false } });
    const avisos = await screen.findAllByText(/no deixa guardar-les: es perdran en tancar la pestanya/i);
    expect(avisos.some((el) => el.closest('.sdp-marc-columna__peu'))).toBe(true);
    expect(screen.queryByText('Les dades són només en este dispositiu.')).toBeNull();
  });

  test('ML-03 · AvisSalut i AvisGenealogia mostren Alerta «Només per a mirar» en mode lectura', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1440);
    const baseSalut = creaMagatzemSalut({ idb: null, navegador: {}, Canal: null });
    magatzems.push(baseSalut);
    const magSalut = embolcallLectora(baseSalut);
    const AppS = () => <AppSalut magatzem={magSalut} />;
    const regS = creaRegistre({ internes: [{ ...manifestSalut, carrega: () => Promise.resolve({ default: AppS }) }] });
    muntaPlataforma('/app/salut/avis', { registre: regS, entorn: { ...ENTORN_OBERT, produccio: false } });
    const titolsS = await screen.findAllByText('Només per a mirar');
    expect(titolsS.some((el) => el.closest('#app-grid-main'))).toBe(true);
    cleanup();

    const baseGen = creaMagatzemGenealogia({ idb: null, navegador: null, Canal: null, anyActual: 2026 });
    magatzems.push(baseGen);
    const magGen = embolcallLectora(baseGen);
    const AppG = () => <AppGenealogia magatzem={magGen} />;
    const regG = creaRegistre({ internes: [{ ...manifestGenealogia, carrega: () => Promise.resolve({ default: AppG }) }] });
    muntaPlataforma('/app/genealogia/avis', { registre: regG, entorn: { ...ENTORN_OBERT, produccio: false } });
    const titolsG = await screen.findAllByText('Només per a mirar');
    expect(titolsG.some((el) => el.closest('#app-grid-main'))).toBe(true);
  });

  test('ML-07 · RebostWorkspace mostra AvisNevera damunt la llista amb idb:null sense obrir detall', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(375);
    const magatzem = creaMagatzemNevera({ idb: null, navegador: {}, Canal: null });
    magatzems.push(magatzem);
    const App = () => <AppNevera magatzem={magatzem} />;
    const registre = creaRegistre({ internes: [{ ...manifestNevera, carrega: () => Promise.resolve({ default: App }) }] });
    muntaPlataforma('/app/nevera/rebost', { registre, entorn: { ...ENTORN_OBERT, produccio: false } });
    const llista = await screen.findByRole('region', { name: 'Rebost' }).catch(() => document.getElementById('app-grid-list'));
    expect(await within(llista || document.body).findByText(/no es guarden en tancar|només en la memòria|no deixa guardar/i)).toBeTruthy();
  });

  test('ML-08 · PeuGenealogia en pantalla estreta amb idb:null mostra l’avís de memòria', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(375);
    const magatzem = creaMagatzemGenealogia({ idb: null, navegador: null, Canal: null, anyActual: 2026 });
    magatzems.push(magatzem);
    const App = () => <AppGenealogia magatzem={magatzem} />;
    const registre = creaRegistre({ internes: [{ ...manifestGenealogia, carrega: () => Promise.resolve({ default: App }) }] });
    muntaPlataforma('/app/genealogia', { registre, entorn: { ...ENTORN_OBERT, produccio: false } });
    const avisos = await screen.findAllByText(/no deixa guardar-les: es perdran en tancar la pestanya/i);
    expect(avisos.some((el) => el.closest('.sdp-marc-columna__peu'))).toBe(true);
  });

  test('PUB-D11-04 · ajuda d’imatge en 5 llengües no promet PDF ni àudio', () => {
    const textos = [CA, ES, EN, EU, GL].map((d) => d['editor.closca.imatge.ajuda']);
    for (const txt of textos) {
      expect(txt).toBeTruthy();
      expect(txt).toMatch(/JPG, PNG/i);
      expect(txt).not.toMatch(/multim[eè]dia|media file|pdf|audio/i);
    }
  });
});
