/* CP-11 (Onada R11, bucle 3) · PouNeuInterior.jsx en JSDOM amb un motor fals.
   El motor WebGL2 (iso/pouNeuInterior.js) és del carril A: ací se'n substituïx
   només creaMotorInterior (i orbita, si encara no l'exporta) i es comprova el
   contracte que hi consumix el component: escalaPx, el tall ('ab' | 'cd' |
   'quart'), onRestaurat, les transicions que no s'anul·len a llocs impossibles,
   les tecles que es buiden, el tema que repinta i l'accessibilitat del HUD. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { POU_NEU_INTERIOR_TEXT } from './iso/pouNeuTextosInterior.js';

const motors = vi.hoisted(() => ({ creats: [], nul: false }));
vi.mock('./iso/pouNeuInterior.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    // Mínim local mentre el carril A no exporta orbita: la mateixa forma de càmera.
    orbita: real.orbita ?? ((angle) => {
      const a = (angle - 45) * Math.PI / 180 * 3 + Math.PI * 0.25;
      const pos = [Math.sin(a) * 26, 17, Math.cos(a) * 26];
      const d = [-pos[0], 8 - pos[1], -pos[2]];
      return { pos, guinyada: Math.atan2(d[0], -d[2]) * 180 / Math.PI, cabotatge: Math.atan2(d[1], Math.hypot(d[0], d[2])) * 180 / Math.PI, fov: 0.9 };
    }),
    creaMotorInterior: vi.fn((canvas, opcions) => {
      if (motors.nul) return null;
      const motor = { canvas, opcions, pinta: vi.fn(() => true), dispose: vi.fn(), perdut: false, error: null };
      motors.creats.push(motor);
      return motor;
    }),
  };
});

import PouNeuInterior from './PouNeuInterior.jsx';
import { creaMotorInterior, orbita } from './iso/pouNeuInterior.js';

const t = POU_NEU_INTERIOR_TEXT.ca;
let callbacks, frameId, clock, mitjans;

function frames(n = 1) {
  for (let i = 0; i < n; i += 1) {
    act(() => {
      clock += 1000 / 60;
      const ready = [...callbacks.values()];
      callbacks.clear();
      ready.forEach((callback) => callback(clock));
    });
  }
}
/** Fotogrames fins que el bucle s'atura (o un màxim). */
function finsAlRepos(max = 400) {
  for (let i = 0; i < max && callbacks.size; i += 1) frames(1);
}
const motor = () => motors.creats.at(-1);
const darreraPintada = () => motor().pinta.mock.calls.at(-1)[0];
const vista = (container) => container.querySelector('.pou-neu-interior__vista');
const camera = (container) => container.querySelector('.pou-neu-interior').dataset.camera.split(' ').map(Number);

beforeEach(() => {
  motors.creats.length = 0;
  motors.nul = false;
  creaMotorInterior.mockClear();
  callbacks = new Map(); frameId = 0; clock = 0;
  mitjans = { reduida: false, tactil: false, fosc: [] };
  vi.stubGlobal('WebGL2RenderingContext', function WebGL2RenderingContext() {});
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => { callbacks.set(++frameId, callback); return frameId; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => { callbacks.delete(id); }));
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    media: query,
    matches: (query.includes('reduced-motion') && mitjans.reduida) || (query.includes('pointer: coarse') && mitjans.tactil),
    addEventListener: (_, fn) => { if (query.includes('color-scheme')) mitjans.fosc.push(fn); },
    removeEventListener: vi.fn(),
  })));
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function caixa() {
    const gran = this.tagName === 'CANVAS' || this.classList?.contains('pou-neu-interior__vista');
    const [w, h] = gran ? [800, 500] : [0, 0];
    return { x: 0, y: 0, left: 0, top: 0, width: w, height: h, right: w, bottom: h, toJSON() {} };
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.documentElement.removeAttribute('data-theme'); });

describe('PouNeuInterior · contracte amb el motor', () => {
  test('crea el motor amb onRestaurat i pinta amb escalaPx, sense tall dins del pou', () => {
    const onSuport = vi.fn();
    render(<PouNeuInterior t={t} onSuport={onSuport} />);
    expect(creaMotorInterior).toHaveBeenCalledTimes(1);
    expect(typeof creaMotorInterior.mock.calls[0][1].onRestaurat).toBe('function');
    expect(onSuport).toHaveBeenCalledWith(true, true);
    finsAlRepos();
    const p = darreraPintada();
    expect(p.tall).toBe(false);
    expect(p.escalaPx).toBeGreaterThan(0);
    expect(p.ample / 800).toBeCloseTo(p.escalaPx, 5);
    expect(p.colors).toBeTypeOf('object');
    // onRestaurat repinta.
    const abans = motor().pinta.mock.calls.length;
    act(() => creaMotorInterior.mock.calls[0][1].onRestaurat());
    finsAlRepos();
    expect(motor().pinta.mock.calls.length).toBeGreaterThan(abans);
  });

  test('el tall passa «ab», «cd» o «quart» al motor', () => {
    const { rerender } = render(<PouNeuInterior t={t} mode="tall" tall="ab" />);
    finsAlRepos();
    expect(darreraPintada().tall).toBe('ab');
    for (const tall of ['cd', 'quart', 'ab']) {
      rerender(<PouNeuInterior t={t} mode="tall" tall={tall} />);
      finsAlRepos();
      expect(darreraPintada().tall).toBe(tall);
    }
    rerender(<PouNeuInterior t={t} mode="interior" tall="quart" />);
    finsAlRepos();
    expect(darreraPintada().tall).toBe(false);
  });

  test('sense WebGL2 avisa sense intent; si el motor no es crea, avisa amb intent', () => {
    vi.stubGlobal('WebGL2RenderingContext', undefined);
    const senseWebgl = vi.fn();
    const { unmount } = render(<PouNeuInterior t={t} onSuport={senseWebgl} />);
    expect(senseWebgl).toHaveBeenCalledWith(false, false);
    expect(creaMotorInterior).not.toHaveBeenCalled();
    unmount();
    vi.stubGlobal('WebGL2RenderingContext', function WebGL2RenderingContext() {});
    motors.nul = true;
    const fallat = vi.fn();
    render(<PouNeuInterior t={t} onSuport={fallat} />);
    expect(fallat).toHaveBeenCalledWith(false, true);
  });

  test('CP-08: el motor no es crea fins que la vista s’acosta a la pantalla', () => {
    let avisa = null;
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback, opcions) { avisa = callback; this.opcions = opcions; expect(opcions.rootMargin).toBe('200px'); }
      observe() {}
      disconnect() {}
    });
    render(<PouNeuInterior t={t} />);
    expect(creaMotorInterior).not.toHaveBeenCalled();
    act(() => avisa([{ isIntersecting: true }]));
    expect(creaMotorInterior).toHaveBeenCalledTimes(1);
  });
});

describe('PouNeuInterior · transicions i entrades', () => {
  test('CP-04: un pointerdown durant l’entrada al tall no congela la càmera', () => {
    const { container, rerender } = render(<PouNeuInterior t={t} mode="interior" />);
    finsAlRepos();
    rerender(<PouNeuInterior t={t} mode="tall" angle={45} />);
    frames(10); // a mig camí
    fireEvent.pointerDown(vista(container), { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 100, clientY: 100 });
    fireEvent.keyDown(vista(container), { code: 'KeyW' });
    finsAlRepos();
    const desti = orbita(45).pos;
    camera(container).forEach((v, i) => expect(v).toBeCloseTo(desti[i], 1));
    expect(callbacks.size).toBe(0);
  });

  test('CP-06: eixint del tall, una tecla salta al destí (no deixa la càmera fora del pou)', () => {
    const { container, rerender } = render(<PouNeuInterior t={t} mode="tall" angle={45} />);
    finsAlRepos();
    rerender(<PouNeuInterior t={t} mode="interior" angle={45} />);
    frames(8);
    fireEvent.keyDown(vista(container), { code: 'KeyW' });
    fireEvent.keyUp(vista(container), { code: 'KeyW' });
    finsAlRepos();
    const [x, y, z] = camera(container);
    // L'estació «fons» (Segura: Ø 9,80 m): dins del cilindre, a l'altura de l'ull.
    expect(Math.hypot(x, z)).toBeLessThan(4.9);
    expect(y).toBeGreaterThan(0.3);
    expect(y).toBeLessThan(3);
  });

  test('CP-14e: el blur de la finestra i la pestanya amagada buiden les tecles', () => {
    const { container } = render(<PouNeuInterior t={t} />);
    finsAlRepos();
    const inici = camera(container);
    fireEvent.keyDown(vista(container), { code: 'KeyD' });
    frames(5);
    expect(camera(container)).not.toEqual(inici);
    act(() => { window.dispatchEvent(new Event('blur')); });
    finsAlRepos();
    const aturada = camera(container);
    frames(3);
    expect(camera(container)).toEqual(aturada);
    expect(callbacks.size).toBe(0);
    fireEvent.keyDown(vista(container), { code: 'KeyD' });
    frames(2);
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    try {
      act(() => { document.dispatchEvent(new Event('visibilitychange')); });
      frames(2);
      expect(callbacks.size).toBe(0);
    } finally {
      delete document.hidden;
    }
  });

  test('LLEI_06 · incrustat, escolta el data-theme de l’avantpassat que el porta (no el document)', async () => {
    const amfitrio = document.createElement('div');
    amfitrio.setAttribute('data-theme', 'light');
    document.body.appendChild(amfitrio);
    try {
      render(<PouNeuInterior t={t} />, { container: amfitrio });
      finsAlRepos();
      const abans = motor().pinta.mock.calls.length;
      await act(async () => { amfitrio.setAttribute('data-theme', 'dark'); await Promise.resolve(); });
      finsAlRepos();
      expect(motor().pinta.mock.calls.length).toBeGreaterThan(abans);
    } finally { cleanup(); amfitrio.remove(); }
  });

  test('VH-03a · CP-12: el canvi de data-theme o del tema del sistema repinta i torna a llegir els colors', async () => {
    // Com a l'App (reclamaAtribut posa sempre el data-theme a l'<html> abans que el visor diferit es munte).
    document.documentElement.setAttribute('data-theme', 'light');
    render(<PouNeuInterior t={t} />);
    finsAlRepos();
    const abans = motor().pinta.mock.calls.length;
    const colorsAbans = darreraPintada().colors;
    await act(async () => { document.documentElement.setAttribute('data-theme', 'dark'); await Promise.resolve(); });
    finsAlRepos();
    expect(motor().pinta.mock.calls.length).toBeGreaterThan(abans);
    expect(darreraPintada().colors).not.toBe(colorsAbans);
    const despres = motor().pinta.mock.calls.length;
    act(() => mitjans.fosc.forEach((fn) => fn()));
    finsAlRepos();
    expect(motor().pinta.mock.calls.length).toBeGreaterThan(despres);
  });
});

describe('PouNeuInterior · mirada vertical sense ratolí (E3, co-creació R11)', () => {
  const cabotatge = () => darreraPintada().camera.cabotatge;

  test('R i F alcen i abaixen la mirada fins a ±85°; a peu, Q i E no la toquen ni mouen la càmera', () => {
    const { container } = render(<PouNeuInterior t={t} />);
    finsAlRepos();
    const prem = (code, n) => { fireEvent.keyDown(vista(container), { code }); frames(n); fireEvent.keyUp(vista(container), { code }); finsAlRepos(); };
    const inici = cabotatge();
    prem('KeyF', 30);
    expect(cabotatge()).toBeLessThan(inici - 20);
    const avall = cabotatge();
    prem('KeyR', 30);
    expect(cabotatge()).toBeGreaterThan(avall + 20);
    prem('KeyR', 120);
    expect(cabotatge()).toBe(85);
    const pos = camera(container);
    prem('KeyQ', 20);
    prem('KeyE', 20);
    expect(cabotatge()).toBe(85);
    expect(camera(container)).toEqual(pos);
    expect(callbacks.size).toBe(0);
  });

  test.each(Object.keys(POU_NEU_INTERIOR_TEXT))('%s: a peu el coixinet mira amunt i avall; en vol, puja i baixa; l’ajuda diu R i F', (lang) => {
    const tl = POU_NEU_INTERIOR_TEXT[lang];
    render(<PouNeuInterior t={tl} lang={lang} />);
    finsAlRepos();
    const coixinet = screen.getByRole('group', { name: tl.moviment });
    const noms = () => within(coixinet).getAllByRole('button').map((boto) => boto.getAttribute('aria-label'));
    expect(noms()).toEqual([tl.giraEsq, tl.davant, tl.giraDreta, tl.mirarAmunt, tl.esquerra, tl.darrere, tl.dreta, tl.mirarAvall]);
    const inici = cabotatge();
    const avall = within(coixinet).getByRole('button', { name: tl.mirarAvall });
    fireEvent.pointerDown(avall, { pointerId: 2 });
    frames(20);
    fireEvent.pointerUp(avall, { pointerId: 2 });
    finsAlRepos();
    expect(cabotatge()).toBeLessThan(inici - 10);
    fireEvent.click(screen.getByRole('button', { name: tl.vol }));
    expect(noms()).toEqual([tl.giraEsq, tl.davant, tl.giraDreta, tl.puja, tl.esquerra, tl.darrere, tl.dreta, tl.baixa]);
    expect(tl.ajuda).toMatch(/\bR\b.+\bF\b/);
    expect(tl.ajuda).toMatch(/\bQ\b.+\bE\b/);
  });
});

describe('PouNeuInterior · HUD accessible', () => {
  test('dins del pou la vista és una aplicació enfocable; al tall, una imatge sense tabulació', () => {
    const { container, rerender } = render(<PouNeuInterior t={t} mode="interior" />);
    expect(vista(container).getAttribute('role')).toBe('application');
    expect(vista(container).getAttribute('tabindex')).toBe('0');
    rerender(<PouNeuInterior t={t} mode="tall" />);
    expect(vista(container).getAttribute('role')).toBe('img');
    expect(vista(container).hasAttribute('tabindex')).toBe(false);
    expect(vista(container).getAttribute('aria-label')).toBe(t.etiquetaTall);
  });

  test('etiquetes fixes amb aria-pressed, emojis amagats i el HUD dins de la ranura', () => {
    const ranura = document.createElement('div');
    document.body.append(ranura);
    render(<PouNeuInterior t={t} ranura={ranura} />);
    const accions = within(ranura).getByRole('group', { name: t.accions });
    const vol = within(accions).getByRole('button', { name: t.vol });
    expect(vol.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(vol);
    expect(within(accions).getByRole('button', { name: t.vol }).getAttribute('aria-pressed')).toBe('true');
    for (const boto of ranura.querySelectorAll('button')) {
      const visible = boto.cloneNode(true);
      visible.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
      expect(visible.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
    }
    const estacions = within(ranura).getByRole('group', { name: t.cameres });
    expect(within(estacions).getAllByRole('button')).toHaveLength(6);
    expect(within(estacions).getByRole('button', { name: /^01 / })).toBeTruthy();
    ranura.remove();
  });

  test('CP-14f: amb moviment reduït, la visita desactivada diu per què', () => {
    mitjans.reduida = true;
    render(<PouNeuInterior t={t} />);
    const visita = screen.getByRole('button', { name: t.visita });
    expect(visita.disabled).toBe(true);
    expect(document.getElementById(visita.getAttribute('aria-describedby')).textContent).toBe(t.visitaReduida);
  });

  test('CP-14: l’ajuda depén del punter (la part esquerra al tàctil)', () => {
    mitjans.tactil = true;
    const { container, unmount } = render(<PouNeuInterior t={t} />);
    expect(container.querySelector('.pou-neu-interior__ajuda').textContent).toBe(t.ajudaTactil);
    expect(t.ajudaTactil).toMatch(/part esquerra/);
    unmount();
    mitjans.tactil = false;
    const { container: c2 } = render(<PouNeuInterior t={t} />);
    expect(c2.querySelector('.pou-neu-interior__ajuda').textContent).toBe(t.ajuda);
  });

  test('VH-11: les cotes són línies contínues amb trets i el tall n’amaga les de la meitat llevada', () => {
    const { container } = render(<PouNeuInterior t={t} mode="tall" tall="ab" />);
    finsAlRepos();
    const linia = container.querySelector('.pou-neu-interior__cota-linia');
    expect(linia.getAttribute('marker-start')).toMatch(/^url\(#.+-tret\)$/);
    expect(linia.getAttribute('marker-end')).toBe(linia.getAttribute('marker-start'));
    const visibles = [...container.querySelectorAll('[data-cota]')].filter((g) => g.dataset.visible === 'true').map((g) => g.dataset.cota);
    expect(visibles.length).toBeGreaterThan(0);
    // El tall A-B lleva la meitat sud (z > 0): ni el túnel ni l'ingrés hi són.
    expect(visibles).not.toContain('tunel');
    expect(visibles).not.toContain('ingres');
  });

  test('VIS-05: al quart es veuen les cotes clau de Segura i cap xifra no en tapa una altra', () => {
    const { container } = render(<PouNeuInterior t={t} mode="tall" tall="quart" />);
    finsAlRepos();
    const visibles = [...container.querySelectorAll('[data-cota]')].filter((g) => g.dataset.visible === 'true');
    const ids = visibles.map((g) => g.dataset.cota);
    for (const id of ['diametre', 'profunditat', 'ingres', 'galeria']) expect(ids).toContain(id);
    // La caixa de situaCota: 9 px per caràcter (jsdom no mesura el text) i 20 px d'alt, girada amb la xifra.
    const caixes = visibles.map((g) => {
      const text = g.querySelector('text');
      const x = Number(text.getAttribute('x')), y = Number(text.getAttribute('y'));
      const angle = Number(/rotate\(([-\d.]+)/.exec(text.getAttribute('transform'))[1]) * Math.PI / 180;
      const w = text.textContent.length * 9, c = Math.abs(Math.cos(angle)), s = Math.abs(Math.sin(angle));
      const hx = (w * c + 20 * s) / 2, hy = (w * s + 20 * c) / 2;
      return [x - hx, y - hy, x + hx, y + hy];
    });
    // Cada xifra va arran del tros visible de la seua línia (12 px), no despenjada en una cantonada.
    for (const g of visibles) {
      const [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map((k) => Number(g.querySelector('line').getAttribute(k)));
      const text = g.querySelector('text'), x = Number(text.getAttribute('x')), y = Number(text.getAttribute('y'));
      const dx = x2 - x1, dy = y2 - y1, u = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
      expect(Math.hypot(x - (x1 + dx * u), y - (y1 + dy * u)), g.dataset.cota).toBeLessThanOrEqual(12.5);
    }
    for (let i = 0; i < caixes.length; i++) {
      for (let j = i + 1; j < caixes.length; j++) {
        const [a, b] = [caixes[i], caixes[j]];
        expect(a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3], `${ids[i]} × ${ids[j]}`).toBe(false);
      }
    }
  });
});

describe('PouNeuInterior · teclat i context (bucle 5)', () => {
  test('A11Y-02: dins del pou, Espai, Maj+Espai, Inici i Fi no fan desplaçar la pàgina (Tab sí que passa)', () => {
    const { container, rerender } = render(<PouNeuInterior t={t} mode="interior" />);
    finsAlRepos();
    const v = vista(container);
    // fireEvent torna fals quan el gestor ha cridat preventDefault.
    for (const [code, key, shiftKey] of [['Space', ' ', false], ['Space', ' ', true], ['Home', 'Home', false], ['End', 'End', false], ['PageDown', 'PageDown', false]]) {
      expect(fireEvent.keyDown(v, { code, key, shiftKey }), `${code}${shiftKey ? '+Maj' : ''}`).toBe(false);
      fireEvent.keyUp(v, { code, key, shiftKey });
    }
    expect(fireEvent.keyDown(v, { code: 'Tab', key: 'Tab' })).toBe(true);
    expect(fireEvent.keyDown(v, { code: 'Space', key: ' ', ctrlKey: true })).toBe(true);
    finsAlRepos();
    // Al tall la vista és una imatge: no s'hi queda cap tecla.
    rerender(<PouNeuInterior t={t} mode="tall" />);
    expect(fireEvent.keyDown(vista(container), { code: 'Space', key: ' ' })).toBe(true);
  });

  test('A11Y-07: si el context perdut no torna en 3 s, avisa que el navegador l’ha aturat; si torna, no', () => {
    const onSuport = vi.fn();
    const { container } = render(<PouNeuInterior t={t} onSuport={onSuport} />);
    finsAlRepos();
    const llenc = container.querySelector('canvas');
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      // Torna a temps: cap avís.
      motor().perdut = true;
      fireEvent(llenc, new Event('webglcontextlost'));
      expect(container.querySelector('.pou-neu-interior').dataset.perdut).toBe('true');
      act(() => { vi.advanceTimersByTime(1000); });
      motor().perdut = false;
      act(() => { creaMotorInterior.mock.calls[0][1].onRestaurat(); });
      act(() => { vi.advanceTimersByTime(5000); });
      expect(onSuport).not.toHaveBeenCalledWith(false, true, 'perdut');
      // Amb la pestanya amagada s'espera; quan es veu i continua perdut, passa al desmuntatge.
      motor().perdut = true;
      fireEvent(llenc, new Event('webglcontextlost'));
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      try {
        act(() => { vi.advanceTimersByTime(6100); });
        expect(onSuport).not.toHaveBeenCalledWith(false, true, 'perdut');
      } finally { delete document.hidden; }
      act(() => { vi.advanceTimersByTime(3000); });
      expect(onSuport).toHaveBeenLastCalledWith(false, true, 'perdut');
      expect(container.querySelector('.pou-neu-interior').dataset.suport).toBe('false');
    } finally { vi.useRealTimers(); }
  });
});
