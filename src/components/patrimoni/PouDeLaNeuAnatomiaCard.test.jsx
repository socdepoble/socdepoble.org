import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import PouDeLaNeuAnatomiaCard from './PouDeLaNeuAnatomiaCard.jsx';
import { POU_NEU_ETIQUETES_VISOR } from './iso/pouNeuEtiquetesVisor.js';
import { SEGURA_1987 } from './iso/pouNeuRentonar.js';

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
    // A11Y-03 · El rètol diu l'acció (entra o ix): sense aria-pressed, com el commutador del HUD.
    expect(screen.getByRole('button', { name: /Eixir de pantalla completa/i }).hasAttribute('aria-pressed')).toBe(false);
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
    // A11Y-03 · Rètol fix amb aria-pressed: el mateix botó, premut, torna a la vista compacta.
    const explosio = screen.getByRole('button', { name: 'Vista explosionada 3D' });
    expect(explosio.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(explosio);
    expect(explosio.getAttribute('aria-pressed')).toBe('false');
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

  test('E1 · «Pedra Seca / Làmina de Leonardo» canvia l’estil de l’escenari i deixa la selecció on era', () => {
    const { container } = render(<PouDeLaNeuAnatomiaCard noWebgl language="ca" />);
    const grup = screen.getByRole('group', { name: 'Estil del dibuix' });
    const [pedra, lamina] = within(grup).getAllByRole('button');
    expect([pedra, lamina].map((boto) => boto.getAttribute('aria-label'))).toEqual(['Pedra Seca', 'Làmina de Leonardo']);
    expect(stage(container).dataset.estil).toBe('pedra-seca');
    fireEvent.click(selectAssembly(container, 'porta-extraccio'));
    fireEvent.click(lamina);
    expect(stage(container).dataset.estil).toBe('lamina');
    expect([pedra, lamina].map((boto) => boto.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
    const seleccionades = new Set([...container.querySelectorAll('g[data-part][data-selected="true"]')].map((g) => g.dataset.assembly));
    expect([...seleccionades]).toEqual(['porta-extraccio']);
    expect(container.querySelector('[style]')).toBeNull();
    fireEvent.click(pedra);
    expect(stage(container).dataset.estil).toBe('pedra-seca');
  });

  test('E1 · la làmina només reassigna àlies locals amb els tokens de material: cap fill ni stroke propi', () => {
    const css = readFileSync(path.join(process.cwd(), 'src/css/components.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const regles = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, cos]) => ({ sel: sel.trim(), cos }));
    const lamina = regles.filter(({ sel }) => sel.includes('[data-estil="lamina"]'));
    expect(lamina.length).toBeGreaterThanOrEqual(8);
    // Una regla de la làmina amb fill o stroke taparia la selecció (--sdp-accio-text) i la llum;
    // un --sdp-* declarat ací seria un segon sistema de disseny (Porta Tokens, T3).
    for (const { sel, cos } of lamina) {
      for (const propietat of cos.split(';').map((d) => d.split(':')[0].trim()).filter(Boolean)) {
        expect(`${sel} → ${propietat}`).toMatch(/→ (--pou-neu-[\w-]+|background|border-radius|stroke-width)$/);
      }
    }
    const materials = lamina.map(({ cos }) => cos).join('\n');
    for (const token of ['calcaria', 'carrasca', 'gel', 'palla', 'argila', 'vegetacio', 'tinta', 'pergami']) expect(materials).toContain(`var(--sdp-pou-${token})`);
    expect(materials).not.toMatch(/--sdp-pou-(davinci|ibanez)/);
    const de = (selector) => regles.filter(({ sel }) => sel === selector).map(({ cos }) => cos).join(';');
    expect(de('.pou-neu-part[data-selected="true"] .pou-neu-line')).toMatch(/stroke:\s*var\(--sdp-accio-text\)/);
    expect(de('.pou-neu-part[data-lit="true"] .pou-neu-top')).toMatch(/fill:\s*color-mix\(in srgb, var\(--sdp-accio-subtil\)/);
    // La resta del dibuix llig els àlies, que és el que la làmina reassigna.
    const dibuix = ['.pou-neu-fill', '.pou-neu-top', '.pou-neu-line', '.pou-neu-dot', '.pou-neu-halo', '.pou-neu-engraving',
      ...[0, 1, 2, 3].map((n) => `.pou-neu-shade[data-shade="${n}"]`), '.pou-neu-part[data-tone="lo"] .pou-neu-line', '.pou-neu-part[data-tone="hi"] .pou-neu-line'];
    for (const selector of dibuix) expect(de(selector), selector).toMatch(/(fill|stroke):\s*var\(--pou-neu-/);
  });

  test('VIS-01 · VIS-02 · pantalla completa: la columna del telèfon apaïsat es desplaça i l’escenari hi cap amb la seua proporció', () => {
    const css = readFileSync(path.join(process.cwd(), 'src/css/components.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const regles = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, cos]) => ({ sel: sel.trim(), cos }));
    const FS = ':is(.pou-neu-card.is-fullscreen, .pou-neu-card:fullscreen)';
    const de = (sufix) => regles.filter(({ sel }) => sel === `${FS} ${sufix}`).map(({ cos }) => cos);
    // La targeta té overflow: hidden: la columna dels controls ha de ser el seu propi contenidor desplaçable.
    expect(de('.pou-neu-controls').some((cos) => /overflow-y:\s*auto/.test(cos) && /min-height:\s*0/.test(cos) && /align-self:\s*stretch/.test(cos) && /padding:\s*var\(--sdp-space-2\)/.test(cos))).toBe(true);
    expect(de('.pou-neu-interior__accions').some((cos) => /grid-template-columns:\s*repeat\(2, auto\)/.test(cos))).toBe(true);
    // La figura fixa la columna i és contenidor de mida; l'escenari pren min(ample, alt × 760/720).
    expect(de('.pou-neu-figure').join(';')).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\)[\s\S]*container-type:\s*size/);
    expect(de('.pou-neu-stage').join(';')).toMatch(/width:\s*min\(100cqw, 100cqh \* 760 \/ 720\);\s*height:\s*auto/);
  });

  test('E2 · la fitxa de Segura (1987) ix de SEGURA_1987 amb la línia del corpus i no ix a pantalla completa', () => {
    const { container } = render(<PouDeLaNeuAnatomiaCard noWebgl language="ca" />);
    const fitxa = container.querySelector('details[data-fitxa-segura]');
    expect(fitxa.querySelector('summary').textContent).toBe('Fitxa de Segura (1987)');
    const files = [...fitxa.querySelectorAll('dl > div')].map((fila) => [fila.querySelector('dt').textContent, fila.querySelector('dd').textContent]);
    expect(files).toHaveLength(Object.keys(SEGURA_1987).length);
    for (const [, valor] of files) expect(valor).toMatch(/^\S+ m³? \(l\. (990|992|1031)\)$/);
    const valorDe = (nom) => files.find(([dt]) => dt === nom)?.[1];
    expect(valorDe('Diàmetre interior')).toBe('9,80 m (l. 990)');
    expect(valorDe('Gruix del mur (finestra oest)')).toBe('1,50 m (l. 992)');
    expect(valorDe('Finestra oest: amplària')).toBe('1,55 m (l. 992)');
    expect(valorDe('Ingrés sud: amplària')).toBe('1,35 m (l. 990)');
    expect(valorDe('Boca del túnel: altura')).toBe('2,10 m (l. 990)');
    expect(valorDe('Galeria d’escorredor: longitud')).toBe('29 m (l. 1031)');
    // Cap dada de la proposta G sense font al corpus (dossier de co-creació R11, §4).
    expect(fitxa.textContent).not.toMatch(/Picó|1919|1724|Cava Gran|250\.000/);
    expect(fitxa.textContent).toMatch(/12,10 m d’altura/);
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) expect(Object.keys(POU_NEU_ETIQUETES_VISOR[lang].fitxaClaus)).toEqual(Object.keys(SEGURA_1987));
    fireEvent.click(screen.getByRole('button', { name: /Pantalla completa/i }));
    expect(fitxa.hidden).toBe(true);
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
    ['ca', 'Pou de neu del Rentonar · Anatomia 3D'], ['es', 'Pozo de nieve del Rentonar · Anatomía 3D'],
    ['en', 'Rentonar snow well · 3D anatomy'], ['eu', 'Rentonarreko elur-putzua · 3D anatomia'], ['gl', 'Pozo de neve do Rentonar · Anatomía 3D'],
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
