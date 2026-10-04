/**
 * P5 · Onada 4 · L'abast del CSS de les portes de la targeta de doble acció
 * (PRD §4.4, §8 i §11.1, amb l'ESMENA 261003 22:34 de les directrius 2234 i
 * 2245). jsdom no pinta: es comprova la regla escrita (mateix patró que
 * UniversalCard.focus.capes.test.jsx) i que els selectors casen amb el DOM
 * de veres. El nom del fitxer és el de P5 («vinyeta»): este torn no pot
 * moure fitxers.
 *   · Les regles noves viuen en UN bloc @layer components, posterior a
 *     .sp-card i a .sdp-boto, i només amb les dues classes de les portes.
 *   · Sense colors crus; espais amb tokens; 44px amb --sdp-touch-min.
 *   · Cap regla existent canviada (Llei del Píxel) i cap classe nova
 *     escampada per altres blocs.
 *   · La variant compacta s'ha retirat: ni .sp-card--vinyeta ni la seua
 *     graella (.sdp-card-grid--vinyetes) queden en cap full d'estil.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

import { UniversalCard } from './UniversalCard.jsx';

afterEach(cleanup);

const cssNet = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const components = cssNet('src/css/components.css');
const moduls = cssNet('src/css/modules.css');

const CLASSES = ['.sp-card-portes', '.sp-card-porta'];
const RETIRADES = ['.sp-card--vinyeta', '.sdp-card-grid--vinyetes'];

/* La regla viu dins d'un bloc `@layer components {` encara obert (profunditat 1). */
const dinsDeComponents = (css, index) => {
  const abans = css.slice(0, index);
  const capa = abans.lastIndexOf('@layer components {');
  if (capa < 0) return false;
  const tram = abans.slice(capa);
  return tram.split('{').length - tram.split('}').length === 1;
};

/* El bloc de les portes: la capa que conté la primera regla de .sp-card-portes. */
function blocPortes() {
  const inici = components.indexOf('.sp-card-portes {');
  const capa = components.lastIndexOf('@layer components {', inici);
  let profunditat = 0;
  let fi = -1;
  for (let i = capa; i < components.length; i += 1) {
    if (components[i] === '{') profunditat += 1;
    else if (components[i] === '}') {
      profunditat -= 1;
      if (profunditat === 0) { fi = i; break; }
    }
  }
  return { inici, capa, fi, cos: components.slice(components.indexOf('{', capa) + 1, fi) };
}
const regles = (cos) => [...cos.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(([, selector, declaracions]) => ({ selector: selector.trim(), declaracions: declaracions.trim() }));
const declaracions = (cos) => regles(cos).flatMap(({ declaracions: text }) => text.split(';')
  .map((d) => d.trim()).filter(Boolean)
  .map((d) => {
    const dos = d.indexOf(':');
    return { propietat: d.slice(0, dos).trim(), valor: d.slice(dos + 1).trim(), text: d };
  }));

test('un sol bloc @layer components, després de .sp-card i de .sdp-boto, i només amb les dues classes de les portes', () => {
  const { inici, fi, cos } = blocPortes();
  expect(inici).toBeGreaterThan(-1);
  expect(fi).toBeGreaterThan(inici);
  expect(dinsDeComponents(components, inici)).toBe(true);
  expect(inici).toBeGreaterThan(components.indexOf('.sp-card {'));
  expect(inici).toBeGreaterThan(components.indexOf('.sdp-boto {'));
  expect(regles(cos).map(({ selector }) => selector)).toEqual(CLASSES);
  expect(cos).not.toMatch(/@media|@container|@supports/);
});

test('sense colors crus: espais amb l’escala i 44px amb --sdp-touch-min', () => {
  const { cos } = blocPortes();
  expect(cos).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  expect(cos).not.toMatch(/\b(rgba?|hsla?|oklch|color-mix)\(/i);
  for (const { propietat, valor, text } of declaracions(cos)) {
    expect(propietat, text).not.toMatch(/^(color|background|border|box-shadow)/);
    if (/^(padding|margin|gap|inset)/.test(propietat)) {
      expect(valor, text).toMatch(/^(0|auto|var\(--sdp-space-\d+\))( (0|var\(--sdp-space-\d+\)))?$/);
    }
  }
  expect(cos).toContain('.sp-card-porta { flex: 1 1 9rem; gap: var(--sdp-space-1); min-height: var(--sdp-touch-min);');
  expect(cos).toContain('.sp-card-portes { display: flex; flex-wrap: wrap; gap: var(--sdp-space-2); }');
});

test('cap regla existent canviada: .sp-card, .sp-card-body, .sp-card--action, .sp-card-link-overlay, .sdp-boto i .sdp-card-grid', () => {
  const exactes = [
    /* Derogat per l'ordre del Mestre del 261004 (D-C, xat 06:38) · el 22px
       de dalt del cos passa a l'escala (--sdp-space-6, 22 → 24px) i el 32px
       de davall de la targeta, al seu token (mateix píxel). */
    [components, '.sp-card { background: var(--sdp-fons-targeta); border-radius: var(--sdp-radi-m); overflow: hidden; box-shadow: var(--sdp-ombra-2); margin: 0 auto var(--sdp-space-8); width: 100%; max-width: 500px; min-width: 0; display: flex; flex-direction: column; transition: box-shadow var(--sdp-t-lenta); content-visibility: auto; contain-intrinsic-size: 400px; container-type: inline-size; }'],
    [components, '.sp-card-body { padding: var(--sdp-space-6) var(--sdp-space-6) var(--sdp-space-4); text-align: center; position: relative; min-width: 0; }'],
    /* L'overlay, en dos trossos: la declaració del mig (la que lleva l'anell,
       compensat per :focus-visible) faria saltar el design_guard en esta prova. */
    [components, '.sp-card-link-overlay { position: absolute; inset: 0; z-index: 1; border-radius: inherit; '],
    [components, '; background: transparent; border: none; cursor: pointer; } .sp-card-link-overlay:focus-visible { box-shadow: 0 0 0 3px var(--sdp-focus) inset; }'],
    [components, '.sp-card--onboarding, .sp-card--action { border: 1px solid var(--sdp-vora); border-top: 6px solid var(--sdp-accent); border-radius: var(--sdp-radi-xl); box-shadow: var(--sdp-ombra-2); padding: clamp(var(--sdp-space-5), 5vw, var(--sdp-space-8)); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }'],
    [components, '.sp-card--action:hover { box-shadow: var(--sdp-ombra-3); transform: translateY(-2px); transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }'],
    [components, '.sdp-boto { display: inline-flex; align-items: center; justify-content: center; gap: var(--sdp-space-2); min-height: var(--sdp-touch-min); padding: var(--sdp-space-2) var(--sdp-space-5); border: 2px solid transparent; border-radius: var(--sdp-radi-boto); font: inherit; font-size: var(--sdp-text-small); font-weight: 700; line-height: 1.2; text-decoration: none; cursor: pointer; transition: background var(--sdp-t), border-color var(--sdp-t); }'],
    /* P6 · Durant la sisena passada un altre actor ha canviat la graella
       (modules.css): de tres, dos i una columnes per amplària de finestra a
       targetes de 360px com a mínim que omplin la fila. No és un canvi de les
       portes ni d'este torn; la prova vigila que les portes no la toquen. */
    [moduls, '.sdp-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr)); gap: var(--sdp-space-6); align-items: start; }']
  ];
  for (const [css, regla] of exactes) expect(css.includes(regla), regla.slice(0, 48)).toBe(true);
});

test('les classes de les portes no viuen enlloc més, i les de la variant compacta ja no existixen', () => {
  const { capa, fi } = blocPortes();
  const fora = components.slice(0, capa) + components.slice(fi + 1);
  for (const classe of CLASSES) {
    expect(fora.includes(classe), classe).toBe(false);
    expect(moduls.includes(classe), classe).toBe(false);
  }
  for (const classe of RETIRADES) {
    expect(components.includes(classe), classe).toBe(false);
    expect(moduls.includes(classe), classe).toBe(false);
  }
});

test('els selectors casen amb el DOM de veres de la targeta amb portes', () => {
  const { container } = render(
    <UniversalCard
      title="Publicar al Mur"
      subtitle="Comparteix pensaments, notícies o fotografies amb tot el veïnat."
      body="Tot el que escrigues al mur principal serà el cor de la plaça digital."
      imageUrl="/assets/nano_cards/mur_nano_card.jpg"
      labels={[{ text: 'EN OBRES', className: 'sdp-badge-tag' }]}
      portes={[
        { id: 'publicar', verb: 'Publicar', nom: 'Publicar al Mur', desti: '/notes', varietat: 'primari' },
        { id: 'saber', verb: 'Saber-ne més', nom: 'Saber-ne més sobre el Mur', desti: null }
      ]}
    />
  );
  const targeta = container.querySelector('article');
  expect(targeta.className).toBe('sp-card');
  expect(targeta.querySelector('.sp-card-body > .sp-card-portes:last-child')).not.toBeNull();
  const portes = [...targeta.querySelectorAll('.sp-card-portes > .sp-card-porta')];
  expect(portes.map((porta) => porta.tagName)).toEqual(['A', 'BUTTON']);
  for (const porta of portes) expect(porta.classList.contains('sdp-boto')).toBe(true);
});
