/* CP-11 (Onada R11, bucle 3) · Els tres modes del visor únic del Pou de Neu en
   JSDOM, amb el motor WebGL2 fals (creaMotorInterior és del carril A). Cobrix:
   aria-pressed dels modes, l'avís només després d'un intent fallat (CP-01), el
   HUD en eixir de pantalla completa (CP-02), l'interior muntat una sola vegada
   (CP-13), l'estació pròpia del desmuntatge (CP-09, ARQ-02), la tria del tall,
   «Hui» amb la 2a coberta (ARQ-06) i la paritat i l'honestedat dels textos. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { POU_NEU_ETIQUETES_VISOR } from './iso/pouNeuEtiquetesVisor.js';
import { POU_NEU_INTERIOR_TEXT } from './iso/pouNeuTextosInterior.js';
import { POU_NEU_TEXT } from './iso/pouNeuTextos.js';
import { ESTRUCTURES } from '../../data/patrimoni/anatomiaRural.js';

const motors = vi.hoisted(() => ({ creats: [], nul: false }));
vi.mock('./iso/pouNeuInterior.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    // Mínim local mentre el carril A no exporta orbita.
    orbita: real.orbita ?? (() => ({ pos: [18.4, 17, 18.4], guinyada: -45, cabotatge: -19, fov: 0.9 })),
    creaMotorInterior: vi.fn((canvas, opcions) => {
      if (motors.nul) return null;
      const motor = { canvas, opcions, pinta: vi.fn(() => true), dispose: vi.fn(), perdut: false, error: null };
      motors.creats.push(motor);
      return motor;
    }),
  };
});

import PouDeLaNeuAnatomiaCard from './PouDeLaNeuAnatomiaCard.jsx';
import { creaMotorInterior } from './iso/pouNeuInterior.js';

const ti = POU_NEU_ETIQUETES_VISOR.ca;
const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
let callbacks, frameId;

function frames(n = 1) {
  for (let i = 0; i < n; i += 1) {
    act(() => {
      const ready = [...callbacks.values()];
      callbacks.clear();
      ready.forEach((callback) => callback(performance.now()));
    });
  }
}
const finsAlRepos = (max = 200) => { for (let i = 0; i < max && callbacks.size; i += 1) frames(1); };
const modeBtn = (container, nom) => container.querySelector(`[data-mode-select="${nom}"]`);
const pintades = () => motors.creats.flatMap((m) => m.pinta.mock.calls.map(([p]) => p));
const canvia = (select, value) => fireEvent.change(select, { target: { value } });
async function ambInterior(props = {}) {
  const r = render(<PouDeLaNeuAnatomiaCard language="ca" {...props} />);
  await waitFor(() => expect(r.container.querySelector('.pou-neu-interior')).toBeTruthy(), { timeout: 10000 });
  finsAlRepos();
  return r;
}

beforeEach(() => {
  motors.creats.length = 0;
  motors.nul = false;
  creaMotorInterior.mockClear();
  callbacks = new Map(); frameId = 0;
  vi.stubGlobal('WebGL2RenderingContext', function WebGL2RenderingContext() {});
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => { callbacks.set(++frameId, callback); return frameId; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => { callbacks.delete(id); }));
  // Moviment reduït: les molles i les càmeres salten sense animació.
  vi.stubGlobal('matchMedia', vi.fn((query) => ({ media: query, matches: query.includes('reduced-motion'), addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function caixa() {
    const [w, h] = this.tagName === 'CANVAS' ? [800, 500] : [0, 0];
    return { x: 0, y: 0, left: 0, top: 0, width: w, height: h, right: w, bottom: h, toJSON() {} };
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('visor únic · modes', () => {
  test('amb WebGL2 comença dins del pou; els modes porten aria-pressed i l’interior es munta una sola vegada', async () => {
    const { container } = await ambInterior();
    const card = container.querySelector('.pou-neu-card');
    expect(card.dataset.mode).toBe('interior');
    const premuts = () => ['interior', 'tall', 'desmuntatge'].filter((nom) => modeBtn(container, nom).getAttribute('aria-pressed') === 'true');
    expect(premuts()).toEqual(['interior']);
    for (const nom of ['tall', 'desmuntatge', 'interior', 'desmuntatge', 'tall']) {
      fireEvent.click(modeBtn(container, nom));
      finsAlRepos();
      expect(premuts()).toEqual([nom]);
      expect(card.dataset.mode).toBe(nom);
      expect(container.querySelector('.pou-neu-interior').hidden).toBe(nom === 'desmuntatge');
      expect(container.querySelector('.pou-neu-stage').hidden).toBe(nom !== 'desmuntatge');
    }
    // CP-13 · Un sol context: l'interior no es desmunta entre modes.
    expect(creaMotorInterior).toHaveBeenCalledTimes(1);
    expect(motors.creats[0].dispose).not.toHaveBeenCalled();
    expect(container.querySelector('.pou-neu-avis-webgl')).toBeNull();
  });

  test('CP-01: si el WebGL2 falla de veres, passa al desmuntatge amb un avís propi', async () => {
    motors.nul = true;
    const { container } = render(<PouDeLaNeuAnatomiaCard language="ca" />);
    await waitFor(() => expect(container.querySelector('.pou-neu-avis-webgl')).toBeTruthy(), { timeout: 10000 });
    const avis = container.querySelector('.pou-neu-avis-webgl');
    expect(avis.getAttribute('role')).toBe('status');
    expect(avis.textContent).toBe(ti.senseWebgl);
    expect(avis.classList.contains('pou-neu-note')).toBe(false);
    expect(container.querySelector('.pou-neu-card').dataset.mode).toBe('desmuntatge');
    expect(modeBtn(container, 'interior').disabled).toBe(true);
    expect(modeBtn(container, 'tall').disabled).toBe(true);
    expect(container.querySelector('.pou-neu-note').textContent).toContain('no mesures del monument');
  });

  test('CP-01: sense WebGL2, amb noWebgl o amb ?no-webgl no hi ha cap avís (no s’ha intentat)', () => {
    vi.stubGlobal('WebGL2RenderingContext', undefined);
    const { container, unmount } = render(<PouDeLaNeuAnatomiaCard language="ca" />);
    expect(container.querySelector('.pou-neu-avis-webgl')).toBeNull();
    expect(container.querySelector('.pou-neu-note').textContent).toContain('no mesures del monument');
    unmount();
    vi.stubGlobal('WebGL2RenderingContext', function WebGL2RenderingContext() {});
    const { container: c2 } = render(<PouDeLaNeuAnatomiaCard language="ca" noWebgl />);
    expect(c2.querySelector('.pou-neu-avis-webgl')).toBeNull();
    expect(c2.querySelector('.pou-neu-card').dataset.mode).toBe('desmuntatge');
    expect(creaMotorInterior).not.toHaveBeenCalled();
  });

  test('CP-02: el HUD amagat a pantalla completa torna en eixir-ne', async () => {
    const { container } = await ambInterior();
    const hud = () => container.querySelector('.pou-neu-hud');
    expect(container.querySelector('[data-hud-toggle]')).toBeNull();
    fireEvent.click(container.querySelector('[data-fullscreen-toggle]'));
    expect(container.querySelector('.pou-neu-card.is-fullscreen')).toBeTruthy();
    // La capçalera és només per a lectors de pantalla.
    expect(container.querySelector('.pou-neu-heading').classList.contains('sdp-sr-only')).toBe(true);
    const toggle = container.querySelector('[data-hud-toggle]');
    expect(toggle.hasAttribute('aria-pressed')).toBe(false);
    expect(toggle.getAttribute('aria-label')).toBe(ti.amagaHud);
    fireEvent.click(toggle);
    expect(hud().hidden).toBe(true);
    expect(container.querySelector('[data-hud-toggle]').getAttribute('aria-label')).toBe(ti.mostraHud);
    fireEvent.click(container.querySelector('[data-fullscreen-toggle]'));
    expect(container.querySelector('.is-fullscreen')).toBeNull();
    expect(hud().hidden).toBe(false);
    expect(container.querySelector('.pou-neu-card').dataset.hud).toBe('true');
    expect(within(hud()).getAllByRole('combobox')).toHaveLength(2);
    expect(within(hud()).getAllByRole('button').length).toBeGreaterThanOrEqual(10);
  });

  test('la tria del tall passa «ab», «cd» i «quart» al motor; dins del pou, cap tall', async () => {
    const { container } = await ambInterior();
    expect(container.querySelector('[data-tall-select]')).toBeNull();
    fireEvent.click(modeBtn(container, 'tall'));
    finsAlRepos();
    expect(pintades().at(-1).tall).toBe('ab');
    const grup = screen.getByRole('group', { name: ti.seccio });
    for (const [nom, etiqueta] of [['cd', ti.talls.cd], ['quart', ti.talls.quart], ['ab', ti.talls.ab]]) {
      const boto = within(grup).getByRole('button', { name: etiqueta });
      fireEvent.click(boto);
      finsAlRepos();
      expect(boto.getAttribute('aria-pressed')).toBe('true');
      expect(pintades().at(-1).tall).toBe(nom);
    }
    fireEvent.click(modeBtn(container, 'interior'));
    finsAlRepos();
    expect(pintades().at(-1).tall).toBe(false);
  });

  test('ARQ-06: «Hui» força la 2a coberta i explica per què la 1a no s’hi pot triar', async () => {
    const { container } = await ambInterior();
    const estat = container.querySelector('select[data-estat]');
    const coberta = () => container.querySelector('select[data-coberta]');
    expect(within(container.querySelector('label[for$="-estat"]')).getByText(ti.estat, { exact: false })).toBeTruthy();
    expect(estat.value).toBe('hui');
    expect(coberta().value).toBe('fase2');
    expect(within(coberta()).getByRole('option', { name: ti.cobertes.fase1 }).disabled).toBe(true);
    expect(document.getElementById(coberta().getAttribute('aria-describedby')).textContent).toBe(ti.cobertaHui);
    canvia(estat, 'hivern');
    canvia(coberta(), 'fase1');
    finsAlRepos();
    expect(pintades().at(-1)).toMatchObject({ estat: 'hivern', coberta: 'fase1' });
    canvia(estat, 'hui');
    finsAlRepos();
    expect(coberta().value).toBe('fase2');
    expect(pintades().at(-1)).toMatchObject({ estat: 'hui', coberta: 'fase2' });
  });

  test('CP-09 · ARQ-02: el desmuntatge té la seua capçalera i la seua estació; l’estat del WebGL no el toca', async () => {
    const { container } = await ambInterior();
    const t = POU_NEU_TEXT.ca;
    const stage = container.querySelector('.pou-neu-stage');
    expect(container.querySelector('.pou-neu-heading p:last-child').textContent).toBe(ti.dimensions);
    expect(container.querySelector('.pou-neu-note').textContent).toBe(ti.font);
    canvia(container.querySelector('select[data-estat]'), 'estiu');
    canvia(container.querySelector('select[data-estat]'), 'hui');
    expect(stage.dataset.season).toBe('winter');
    fireEvent.click(modeBtn(container, 'desmuntatge'));
    expect(container.querySelector('.pou-neu-heading p:last-child').textContent).toBe(t.dimensions);
    expect(container.querySelector('.pou-neu-note').textContent).toBe(t.estimate);
    const season = container.querySelector('select[data-season]');
    expect(season.value).toBe('winter');
    const opcions = within(season).getAllByRole('option').map((o) => o.textContent);
    expect(opcions).toEqual([t.winter, t.summer]);
    expect(opcions.join(' ')).not.toMatch(/Hui/);
  });

  test('E1: l’estil del dibuix només es tria al desmuntatge i es conserva entre modes', async () => {
    const { container } = await ambInterior();
    const grup = () => screen.queryByRole('group', { name: ti.estil });
    expect(grup()).toBeNull();
    fireEvent.click(modeBtn(container, 'desmuntatge'));
    fireEvent.click(within(grup()).getByRole('button', { name: ti.estils.lamina }));
    expect(container.querySelector('.pou-neu-stage').dataset.estil).toBe('lamina');
    fireEvent.click(modeBtn(container, 'tall'));
    finsAlRepos();
    expect(grup()).toBeNull();
    fireEvent.click(modeBtn(container, 'desmuntatge'));
    expect(within(grup()).getByRole('button', { name: ti.estils.lamina }).getAttribute('aria-pressed')).toBe('true');
  });

  test('A11Y-03: cap commutador canvia el rètol i porta aria-pressed alhora (WAI-ARIA: un patró per botó)', async () => {
    const { container } = await ambInterior();
    const t = POU_NEU_TEXT.ca;
    const nom = (b) => b.getAttribute('aria-label') ?? b.textContent.trim();
    const estat = (selector) => { const b = container.querySelector(selector); return { nom: nom(b), premut: b.getAttribute('aria-pressed') }; };
    /** Prem el commutador i comprova el patró: rètol fix amb aria-pressed que canvia, o rètol que canvia sense aria-pressed. */
    const comprova = (selector, patro) => {
      const abans = estat(selector);
      fireEvent.click(container.querySelector(selector));
      finsAlRepos();
      const despres = estat(selector);
      if (patro === 'premut') {
        expect(despres.nom, selector).toBe(abans.nom);
        expect([abans.premut, despres.premut].sort(), selector).toEqual(['false', 'true']);
      } else {
        expect(despres.nom, selector).not.toBe(abans.nom);
        expect([abans.premut, despres.premut], selector).toEqual([null, null]);
      }
      return despres;
    };
    // Estat de la vista: rètol fix i aria-pressed (Vol, 3a persona, Cotes, l'explosió i les tries).
    const accions = screen.getByRole('group', { name: ti.accions });
    for (const nomAccio of [ti.vol, ti.terceraPersona, ti.cotes]) {
      const boto = within(accions).getByRole('button', { name: nomAccio });
      boto.setAttribute('data-prova', nomAccio);
      comprova(`[data-prova="${nomAccio}"]`, 'premut');
    }
    // Accions (entra o ix, mostra o amaga): el rètol diu l'acció, sense aria-pressed.
    comprova('[data-fullscreen-toggle]', 'accio');
    comprova('[data-hud-toggle]', 'accio');
    comprova('[data-hud-toggle]', 'accio');
    comprova('[data-fullscreen-toggle]', 'accio');
    fireEvent.click(modeBtn(container, 'desmuntatge'));
    expect(estat('[data-explode-toggle]')).toEqual({ nom: t.explode, premut: 'false' });
    expect(comprova('[data-explode-toggle]', 'premut')).toEqual({ nom: t.explode, premut: 'true' });
    expect(t).not.toHaveProperty('compact');
  });

  test('A11Y-06: el valor de l’àzimut no es diu dues vegades i la lectura atòmica no es reescriu a cada pas', async () => {
    const { container } = render(<PouDeLaNeuAnatomiaCard language="ca" noWebgl />);
    const t = POU_NEU_TEXT.ca;
    const lliscant = screen.getByRole('slider', { name: t.camera });
    expect(lliscant.getAttribute('aria-valuetext')).toBe('45°');
    const etiqueta = lliscant.closest('label');
    expect(etiqueta.querySelector('output, [role="status"], [aria-live]')).toBeNull();
    expect(etiqueta.querySelector('.pou-neu-field__valor').getAttribute('aria-hidden')).toBe('true');
    const lectura = container.querySelector('[data-readout]');
    expect(lectura.getAttribute('aria-live')).toBe('polite');
    const observa = new MutationObserver(() => {});
    observa.observe(lectura, { subtree: true, childList: true, characterData: true, attributes: true });
    for (const valor of [46, 47, 48]) { fireEvent.change(lliscant, { target: { value: String(valor) } }); finsAlRepos(); }
    const canvis = observa.takeRecords();
    observa.disconnect();
    expect(lliscant.getAttribute('aria-valuetext')).toBe('48°');
    expect(canvis.map((m) => `${m.type}:${m.attributeName ?? m.target.nodeName}`)).toEqual([]);
  });

  test('A11Y-07: si el context WebGL es perd i no torna, el visor passa al desmuntatge amb un avís visible', async () => {
    const { container } = await ambInterior();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      motors.creats[0].perdut = true;
      fireEvent(container.querySelector('.pou-neu-interior__canvas'), new Event('webglcontextlost'));
      expect(container.querySelector('.pou-neu-avis-webgl')).toBeNull();
      act(() => { vi.advanceTimersByTime(3100); });
    } finally { vi.useRealTimers(); }
    const avis = container.querySelector('.pou-neu-avis-webgl');
    expect(avis.getAttribute('role')).toBe('status');
    expect(avis.textContent).toBe(ti.webglPerdut);
    expect(container.querySelector('.pou-neu-card').dataset.mode).toBe('desmuntatge');
    for (const lang of LLENGUES) expect(POU_NEU_ETIQUETES_VISOR[lang].webglPerdut, lang).toMatch(/\S{4}/);
  });
});

describe('visor únic · textos', () => {
  const claus = (objecte) => Object.entries(objecte).map(([k, v]) => (v && typeof v === 'object' ? `${k}{${claus(v)}}` : k)).sort().join(',');
  const tot = (objecte) => Object.values(objecte).flatMap((v) => (v && typeof v === 'object' ? tot(v) : [String(v)]));

  test('les cinc llengües tenen les mateixes claus (rètols i relats)', () => {
    for (const lang of LLENGUES) {
      expect(claus(POU_NEU_ETIQUETES_VISOR[lang])).toBe(claus(POU_NEU_ETIQUETES_VISOR.ca));
      expect(claus(POU_NEU_INTERIOR_TEXT[lang])).toBe(claus(POU_NEU_INTERIOR_TEXT.ca));
      expect(Object.keys(POU_NEU_INTERIOR_TEXT[lang].relats)).toEqual(Object.keys(POU_NEU_INTERIOR_TEXT[lang].nomsCameres));
    }
  });

  test('CP-15d: la targeta no importa els relats (viatgen amb el tros diferit de l’interior)', () => {
    const targeta = readFileSync(resolve(process.cwd(), 'src/components/patrimoni/PouDeLaNeuAnatomiaCard.jsx'), 'utf8');
    const interior = readFileSync(resolve(process.cwd(), 'src/components/patrimoni/PouNeuInterior.jsx'), 'utf8');
    expect(targeta).not.toMatch(/pouNeuTextosInterior/);
    expect(targeta).toMatch(/lazy\(\(\) => import\('\.\/PouNeuInterior\.jsx'\)\)/);
    expect(interior).toMatch(/from '\.\/iso\/pouNeuTextosInterior\.js'/);
    expect(interior).not.toMatch(/forwardRef|useImperativeHandle|^export (function|const)/m);
  });

  test('cada rètol curt és un tros del nom accessible (WCAG 2.5.3)', () => {
    for (const lang of LLENGUES) {
      const x = POU_NEU_ETIQUETES_VISOR[lang];
      const parelles = [
        ...Object.keys(x.modes).map((k) => [x.modesCurts[k], x.modes[k]]),
        ...Object.keys(x.talls).map((k) => [x.tallsCurts[k], x.talls[k]]),
        ...Object.keys(x.estils).map((k) => [x.estilsCurts[k], x.estils[k]]),
        [x.amagaHudCurt, x.amagaHud], [x.mostraHudCurt, x.mostraHud], [x.eixirCurt, POU_NEU_TEXT[lang].exitFullscreen],
      ];
      for (const [curt, llarg] of parelles) expect(llarg.toLowerCase(), `${lang}: ${curt}`).toContain(curt.toLowerCase());
    }
  });

  const PROHIBIT = /\b18 m\b|15 ?\+ ?3|9[,.]75|43 cm|1[.,]360|1[.,]500|Monesma|empou|\bmasia\b/i;

  test('honestedat: cap xifra de l’esbós 76150, cap font sense dir, i el que és general ho diu', () => {
    for (const lang of LLENGUES) {
      for (const text of tot(POU_NEU_INTERIOR_TEXT[lang])) expect(text).not.toMatch(PROHIBIT);
      const r = POU_NEU_INTERIOR_TEXT[lang].relats;
      expect(r.fora).toMatch(/1[.,]160 m/);
      // L4-ARQ-01 · D-4: els 1.200 m són de la Biblioteca del Node 0; cap fitxa BRL del disc no dona l'altitud.
      expect(r.fora).toMatch(/1[.,]200 m/);
      expect(r.fora).toMatch(/Node 0/);
      expect(r.fora, lang).not.toMatch(/fitxa BRL|ficha BRL|BRL record|BRL fitxan|\b2021\b/);
      // L4-ARQ-05 · La «finestra sud-est» del 2023 és l'accés del túnel, no una quarta obertura alta.
      expect(r['finestra-oest']).toMatch(/1987/);
      expect(r['finestra-oest']).toMatch(/2020-2023/);
      expect(r['finestra-oest']).toMatch(/túnel|tunnel|tunel/);
      expect(r['finestra-oest'], lang).not.toMatch(/parla d’una finestra|habla de una ventana|mentions a window|leiho bat aipatzen|fala dunha fiestra/);
      expect(POU_NEU_INTERIOR_TEXT[lang].estacions.hui).toMatch(/1987/);
      expect(POU_NEU_INTERIOR_TEXT[lang].estacions.hui).toMatch(/2020/);
    }
    const ca = POU_NEU_INTERIOR_TEXT.ca.relats;
    expect(ca.fora).toContain('1.200 m segons la Biblioteca del Node 0, sense document BRL consultat');
    expect(ca['finestra-oest']).toContain('l’Associació anomena «finestra sud» o «sud-est» l’accés del túnel (2020-2023)');
    expect(readFileSync(resolve(process.cwd(), 'src/components/patrimoni/iso/pouNeuTextosInterior.js'), 'utf8')).not.toMatch(/fitxa BRL de 2021/);
    // L4-ARQ-10 · «la major part» de Segura (l. 1031), no «quasi tota».
    expect(ca.galeria).toMatch(/^La galeria[^.]+\. La major part és excavada en el tap/);
    expect(ca.arcs).toMatch(/devien sostindre el trespol de teula/);
    expect(ca['boca-tunel']).toMatch(/Segura no ho detalla per a este pou/);
    expect(ca['finestra-oest']).toMatch(/Segura no ho detalla per a este pou/);
    expect(ca.galeria).toMatch(/sostre de grans lloses planes, com un alcavó/);
    expect(ca.fora).toMatch(/als estreps orientals dels Plans, al Rentonar/i);
    expect(ca.fora).not.toMatch(/a Els Plans/);
    expect(POU_NEU_INTERIOR_TEXT.en.relats.arcs).toMatch(/tiled roof/);
    expect(POU_NEU_INTERIOR_TEXT.en.relats.galeria).toMatch(/roofed with large flat slabs/);
    expect(POU_NEU_INTERIOR_TEXT.ca.font).toMatch(/finestres obertes als segles d’ús/);
    expect(POU_NEU_INTERIOR_TEXT.ca.font).toMatch(/il·lustratius/);
    expect(POU_NEU_INTERIOR_TEXT.ca.font).toMatch(/esquemàtica/);
  });

  test('honestedat del desmuntatge (L4-ARQ-02, -06, -07): el forat es veu des del 2020, la galeria té el sostre de lloses i la càrrega és pràctica general', () => {
    const GENERAL = { ca: 'Segura no ho detalla per a este pou', es: 'Segura no lo detalla para este pozo', en: 'Segura does not detail it for this well', eu: 'Segurak ez du hori zehazten putzu honetarako', gl: 'Segura non o detalla para este pozo' };
    for (const lang of LLENGUES) {
      const t = POU_NEU_TEXT[lang];
      for (const text of [...t.names, ...t.descriptions]) expect(text, lang).not.toMatch(PROHIBIT);
      // L4-ARQ-02 · La pedra central no es va perdre el 2023: el forat ja es va veure el 28-10-2020 (corpus l. 919).
      expect(t.descriptions.join(' '), lang).not.toMatch(/perdu\w* (el |en )?2023|lost in 2023|2023an galdu/);
      expect(t.descriptions[3], lang).toMatch(/2020/);
      expect(t.descriptions[3], lang).toMatch(/2023/);
      // L4-ARQ-07 · Segura no diu per on s'hi tirava la neu: ni el nom ni la descripció ho donen com a fet.
      expect(t.names[4], lang).not.toMatch(/oest|oeste|west|mendebald/i);
      expect(t.descriptions[4], lang).toContain(GENERAL[lang]);
      expect(t.descriptions[4], lang).toMatch(/reconstruc|berreraikuntza/);
    }
    // L4-ARQ-06 · «enllosat al sostre» (Segura, l. 1031): la galeria té el sostre de lloses, no un paviment.
    expect(POU_NEU_TEXT.ca.descriptions[6]).toMatch(/amb el sostre de grans lloses planes/);
    expect(POU_NEU_TEXT.ca.descriptions[6]).not.toMatch(/enllosada/);
    expect(POU_NEU_TEXT.es.descriptions[6]).toMatch(/cubierta con grandes losas planas/);
    expect(POU_NEU_TEXT.gl.descriptions[6]).toMatch(/cuberta con grandes lousas planas/);
    for (const lang of ['es', 'gl']) expect(POU_NEU_TEXT[lang].descriptions[6]).not.toMatch(/enlosada|enlousada/);
    const galeria = ESTRUCTURES.find((e) => e.id === 'pou-de-neu').peces.find((p) => p.id === 'galeria');
    expect(galeria.definicio).toMatch(/la major part excavat en terra \(tap\) i, al principi i al final, amb el sostre enllosat de grans pedres planes/);
  });

  test('a la targeta, cap emoji fora d’un span aria-hidden', async () => {
    const { container } = await ambInterior();
    for (const nom of ['interior', 'tall', 'desmuntatge']) {
      fireEvent.click(modeBtn(container, nom));
      for (const boto of container.querySelectorAll('button')) {
        const visible = boto.cloneNode(true);
        visible.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
        expect(visible.textContent, boto.outerHTML.slice(0, 120)).not.toMatch(/\p{Extended_Pictographic}/u);
      }
    }
  });
});
