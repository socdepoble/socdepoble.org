import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import PouDeLaNeuAnatomiaCard from './PouDeLaNeuAnatomiaCard.jsx';

const IDS = ['base-roca', 'pou-cilindric', 'estrats-gel', 'volta-cupula', 'portell-empouar', 'porta-extraccio', 'desaigue-fusio'];
let reduced;
let callbacks;
let frameId;
let clock;
let contexts;

function installMotion(matches = true) {
  reduced = { matches, media: '(prefers-reduced-motion: reduce)', addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() };
  vi.stubGlobal('matchMedia', vi.fn(() => reduced));
  callbacks = new Map();
  frameId = 0;
  clock = 0;
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => { callbacks.set(++frameId, callback); return frameId; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => { callbacks.delete(id); }));
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
}

function advanceFrames(count) {
  for (let index = 0; index < count; index += 1) {
    act(() => {
      clock += 1000 / 60;
      const ready = [...callbacks.values()];
      callbacks.clear();
      ready.forEach((callback) => callback(clock));
    });
  }
}

const selectAssembly = (container, id) => container.querySelector(`button[data-assembly-select="${id}"]`);
const stage = (container) => container.querySelector('.pou-neu-stage');
const metrics = (container) => [...container.querySelectorAll('[data-readout] dd')].map((node) => node.textContent);
const paths = (container) => [...container.querySelectorAll('[data-part] path')].map((node) => node.getAttribute('d')).join('|');

beforeEach(() => {
  installMotion();
  contexts = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Pou de la Neu · anatomia sòlida i controls accessibles', () => {
  test('la barra obri pantalla completa amb reserva CSS i Escape la tanca', async () => {
    const { container } = render(<PouDeLaNeuAnatomiaCard noWebgl language="ca" />);
    fireEvent.click(screen.getByRole('button', { name: /Pantalla completa/i }));
    expect(container.querySelector('.pou-neu-card.is-fullscreen')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Eixir de pantalla completa/i }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(container.querySelector('.is-fullscreen')).toBeNull();
  });

  test('set assemblatges complets, volum real i lectura física; cap context gràfic en mode de reserva', () => {
    const { container } = render(<PouDeLaNeuAnatomiaCard noWebgl language="ca" />);
    const choices = IDS.map((id) => selectAssembly(container, id));
    expect(choices.every((choice) => choice?.tagName === 'BUTTON')).toBe(true);
    expect(choices.filter((choice) => choice.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
    const groups = [...container.querySelectorAll('g[data-part]')];
    expect(groups.length).toBeGreaterThanOrEqual(85);
    const physicalIds = new Set(groups.map((group) => group.dataset.physicalId));
    expect(physicalIds.size).toBeGreaterThanOrEqual(85);
    expect(physicalIds.size).toBeLessThanOrEqual(110);
    expect(physicalIds.size).toBe(Number(stage(container).dataset.physicalSolids));
    expect(physicalIds.has(undefined)).toBe(false);
    expect(new Set(groups.map((group) => group.dataset.part)).size).toBe(groups.length);
    expect(new Set(groups.map((group) => group.dataset.assembly))).toEqual(new Set(IDS));
    expect(container.querySelectorAll('[data-readout]')).toHaveLength(1);
    expect(container.querySelector('[data-readout]').getAttribute('aria-live')).toBe('polite');
    expect(metrics(container)).toHaveLength(5);
    expect(metrics(container).join(' ')).toMatch(/°C/);
    expect(metrics(container).join(' ')).toMatch(/kg\/m³/);
    expect(metrics(container).join(' ')).toMatch(/L\/h/);
    expect(paths(container)).not.toMatch(/NaN|Infinity|undefined/);
    expect(container.querySelector('[style]')).toBeNull();
    expect(contexts).not.toHaveBeenCalled();
    expect(screen.getAllByRole('img').length).toBeGreaterThanOrEqual(1);
  });

  test('cada botó selecciona el seu assemblatge i alimenta el panell viu', () => {
    const { container } = render(<PouDeLaNeuAnatomiaCard noWebgl language="ca" />);
    const readings = new Set();
    for (const id of IDS) {
      const choice = selectAssembly(container, id);
      fireEvent.click(choice);
      expect(choice.getAttribute('aria-pressed')).toBe('true');
      expect(IDS.filter((candidate) => selectAssembly(container, candidate).getAttribute('aria-pressed') === 'true')).toEqual([id]);
      const values = metrics(container);
      expect(values.every((value) => /[\d−-]/.test(value))).toBe(true);
      expect(values.join(' ')).not.toMatch(/NaN|Infinity/);
      readings.add(values.join('|'));
    }
    expect(readings.size).toBeGreaterThan(4);
  });

  test('l’àzimut reprojeta les peces als dos extrems i manté les set seleccions', () => {
    const { container } = render(<PouDeLaNeuAnatomiaCard noWebgl language="ca" />);
    const camera = screen.getByRole('slider', { name: /Àzimut de càmera/i });
    expect(camera.min).toBe('25');
    expect(camera.max).toBe('65');
    fireEvent.change(camera, { target: { value: '25' } });
    const left = paths(container);
    fireEvent.change(camera, { target: { value: '65' } });
    expect(paths(container)).not.toBe(left);
    expect(stage(container).dataset.azimuth).toBe('65');
    expect(IDS.every((id) => selectAssembly(container, id))).toBe(true);
  });

  test('l’estació modifica el model físic dels estrats i del drenatge', () => {
    const { container } = render(<PouDeLaNeuAnatomiaCard noWebgl language="ca" />);
    fireEvent.click(selectAssembly(container, 'estrats-gel'));
    const winterIce = metrics(container);
    fireEvent.click(selectAssembly(container, 'desaigue-fusio'));
    const winterDrain = metrics(container);
    const season = container.querySelector('select[data-season]');
    expect(stage(container).dataset.season).toBe('winter');
    const summer = within(season).getByRole('option', { name: 'Estiu: Tall i arrieratge nocturn' });
    fireEvent.change(season, { target: { value: summer.value } });
    expect(stage(container).dataset.season).toBe('summer');
    expect(metrics(container)).not.toEqual(winterDrain);
    fireEvent.click(selectAssembly(container, 'estrats-gel'));
    expect(metrics(container)).not.toEqual(winterIce);
    expect(within(season).getByRole('option', { name: 'Hivern: Empouada' })).toBeTruthy();
  });

  test('moviment reduït: l’explosió respon immediatament i torna a la geometria compacta', () => {
    const { container } = render(<PouDeLaNeuAnatomiaCard noWebgl language="ca" />);
    const compact = paths(container);
    const elevation = () => Number.parseFloat(container.querySelector('[data-metric="z"]').textContent.replace(',', '.').replace('−', '-'));
    const originalElevation = elevation();
    fireEvent.click(screen.getByRole('button', { name: 'Vista explosionada 3D' }));
    expect(stage(container).dataset.exploded).toBe('true');
    expect(elevation()).toBeGreaterThan(originalElevation);
    const apart = paths(container);
    const translations = [...container.querySelectorAll('g[data-part]')].map((node) => node.getAttribute('transform'));
    expect(apart !== compact || translations.some((value) => value && value !== 'translate(0 0)')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Vista compacta' }));
    expect(stage(container).dataset.exploded).toBe('false');
    expect(elevation()).toBe(originalElevation);
    expect(paths(container)).toBe(compact);
    expect(callbacks.size).toBe(0);
  });

  test('sense WebGL disponible el component conserva tots els sòlids sense errors de consola', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<PouDeLaNeuAnatomiaCard language="ca" />);
    expect(container.querySelectorAll('g[data-part]').length).toBeGreaterThanOrEqual(85);
    expect(container.querySelector('[data-gl]')).toBeNull();
    expect(errors).not.toHaveBeenCalled();
  });

  test('les molles tenen un estat intermedi i es cancel·len en desmuntar', () => {
    installMotion(false);
    const { container, unmount } = render(<PouDeLaNeuAnatomiaCard noWebgl language="ca" />);
    fireEvent.click(screen.getByRole('button', { name: 'Vista explosionada 3D' }));
    expect(callbacks.size).toBeGreaterThan(0);
    const initial = stage(container).innerHTML;
    const initialElevation = container.querySelector('[data-metric="z"]').textContent;
    advanceFrames(12);
    expect(stage(container).innerHTML).not.toBe(initial);
    expect(container.querySelector('[data-metric="z"]').textContent).not.toBe(initialElevation);
    expect(callbacks.size).toBeGreaterThan(0);
    unmount();
    expect(callbacks.size).toBe(0);
  });
});

describe('cinc llengües · tots els controls tenen noms', () => {
  test.each([
    ['ca', 'Pou de la Neu · Anatomia 3D'], ['es', 'Pozo de nieve · Anatomía 3D'],
    ['en', 'Snow well · 3D anatomy'], ['eu', 'Elur-putzua · 3D anatomia'], ['gl', 'Pozo de neve · Anatomía 3D'],
  ])('%s: llegenda, cambra, estació i unitats llegibles', (language, heading) => {
    const { container } = render(<PouDeLaNeuAnatomiaCard noWebgl language={language} />);
    expect(container.querySelector('.pou-neu-card').getAttribute('lang')).toBe(language);
    expect(screen.getByRole('heading', { name: heading })).toBeTruthy();
    expect(screen.getByRole('slider').getAttribute('aria-label') || screen.getByRole('slider').labels?.[0]?.textContent).toBeTruthy();
    for (const select of screen.getAllByRole('combobox')) expect(select.getAttribute('aria-label') || select.labels?.[0]?.textContent).toBeTruthy();
    expect(within(container.querySelector('select[data-season]')).getAllByRole('option')).toHaveLength(2);
    for (const id of IDS) expect(selectAssembly(container, id).textContent.trim().length).toBeGreaterThan(5);
    expect(container.textContent).not.toMatch(/patrimoni\.pou|\{\w+\}|undefined|NaN/);
    expect(metrics(container).join(' ')).toContain('°C');
  });
});
