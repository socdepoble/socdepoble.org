/* Ordre del Mestre, 261004 (integració final, auditoria d'amfitrió) · L'Índex
   de la Pàgina Universal i els salts a una secció, pensats per a viure dins
   d'un amfitrió (WordPress, Sollutia):
     · a socdepoble.org l'Índex continua al body (Llei del Píxel), amb un id
       estable al diàleg i aria-controls al botó «Índex»;
     · el salt mou NOMÉS el desplaçador de l'app més pròxim (mai un de fora
       de .sdp-root), conserva el behavior i deixa el destí per davall de les
       barres enganxades amb el marge acordat, o al seu scroll-margin-top.
   L'encastat de veres (<soc-de-poble>, arrel ombra tancada) es prova a
   src/PedraSecaEmbed.index.test.jsx. jsdom no té disposició: les mides i les
   posicions es fixen a mà en cada prova. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../PedraSeca/hooks/useAccions.js', () => ({ useAccions: () => ({}) }));
vi.mock('../PedraSeca/hooks/useTraduccioPagina.js', () => ({
  useTraduccioPagina: () => ({ llengua: null, lang: null, carregant: null, titol: null, blocs: null, original: () => {} })
}));

import { PageFrame } from './PageFrame.jsx';
import { BarraBlava } from './barres/BarraBlava.jsx';

const saltatsPerElement = [];
const scrollAbans = Element.prototype.scrollIntoView;
beforeEach(() => {
  saltatsPerElement.length = 0;
  Element.prototype.scrollIntoView = function scrollIntoView(opcions) { saltatsPerElement.push([this, opcions]); };
});
afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  Element.prototype.scrollIntoView = scrollAbans;
});

const COS = (
  <>
    <h2>Primera secció</h2>
    <p>Text.</p>
    <h3>Segona secció</h3>
  </>
);
const pagina = (props = {}) => <PageFrame chrome="system" title="Document" {...props}>{COS}</PageFrame>;
const botoIndex = () => screen.getByRole('button', { name: 'Índex de secció' });
const entrada = (nom) => within(screen.getByRole('dialog', { name: 'Taula de continguts' })).getByRole('button', { name: nom });

/* Un desplaçador de mentida: overflow-y auto, més contingut que vista i un scrollTo que registra. */
function fesDesplacador(node, { top = 0, scrollTop = 0 } = {}) {
  node.style.overflowY = 'auto';
  Object.defineProperty(node, 'scrollHeight', { configurable: true, value: 5000 });
  Object.defineProperty(node, 'clientHeight', { configurable: true, value: 600 });
  node.scrollTop = scrollTop;
  node.getBoundingClientRect = () => ({ top });
  node.moviments = [];
  node.scrollTo = function scrollTo(opcions) { this.moviments.push(opcions); };
  return node;
}

/* L'app de socdepoble.org: fora, un desplaçador que no és de l'app; dins de
   .sdp-root, el de l'app (com .app-main__content), i la pàgina. */
function muntaAmbDesplacadors(element) {
  const fora = fesDesplacador(document.createElement('div'));
  const arrel = document.createElement('div');
  arrel.className = 'sdp-root';
  const dins = fesDesplacador(document.createElement('div'), { top: 50, scrollTop: 200 });
  arrel.append(dins);
  fora.append(arrel);
  document.body.append(fora);
  const resultat = render(element, { container: dins });
  return { fora, dins, ...resultat };
}

test('a socdepoble.org l’Índex continua al body; obert, el diàleg porta un id estable i el botó «Índex» hi apunta', () => {
  const { rerender } = render(pagina());
  const boto = botoIndex();
  // Tancat, el marcatge de sempre: cap id penjat a un diàleg que no hi és.
  expect(boto.hasAttribute('aria-controls')).toBe(false);
  fireEvent.click(boto);
  const dialeg = screen.getByRole('dialog', { name: 'Taula de continguts' });
  const controla = boto.getAttribute('aria-controls');
  expect(controla).toMatch(/--index$/);
  expect(dialeg.id).toBe(controla);
  expect(document.getElementById(controla)).toBe(dialeg);
  // Estable: un altre pintat de la pàgina oberta no el canvia.
  rerender(pagina());
  expect(screen.getByRole('dialog', { name: 'Taula de continguts' }).id).toBe(controla);
  // Llei del Píxel: el vel és fill directe del body, com abans.
  expect(dialeg.parentElement.className).toBe('toc-overlay');
  expect(dialeg.parentElement.parentElement).toBe(document.body);
  // Esc continua escoltant-se al document.
  fireEvent.keyDown(document.body, { key: 'Escape' });
  expect(screen.queryByRole('dialog', { name: 'Taula de continguts' })).toBeNull();
  expect(boto.hasAttribute('aria-controls')).toBe(false);
});

/* Verificació «index-amfitrio», D1 (ordre del Mestre, 261004) · El focus
   dins del calaix era cosa de l'encastat (PedraSecaEmbed.index.test.jsx): a
   socdepoble.org el calaix no portava tabindex ni rebia el focus en obrir-se.
   Derogat (ordre del Mestre, 261004): la prova «a socdepoble.org el calaix de
   l'Índex no porta tabindex ni pren el focus en obrir-se» fixava un diàleg
   aria-modal que el teclat no trobava (82 tabuladors a la Wiki, 126 a la
   Consola). Ara la SPA fa el mateix que l'encastat. */
test('a socdepoble.org el calaix de l’Índex pren el focus en obrir-se i, en tancar-se amb Esc, el torna al botó «Índex»', () => {
  render(pagina());
  const boto = botoIndex();
  fireEvent.click(boto);
  const dialeg = screen.getByRole('dialog', { name: 'Taula de continguts' });
  expect(dialeg.getAttribute('tabindex')).toBe('-1');
  expect(document.activeElement).toBe(dialeg);
  // Esc des del calaix (el focus hi és): l'oient continua al document.
  fireEvent.keyDown(dialeg, { key: 'Escape' });
  expect(screen.queryByRole('dialog', { name: 'Taula de continguts' })).toBeNull();
  expect(document.activeElement).toBe(boto);
});

test('a socdepoble.org, en saltar a una entrada o tancar amb l’aspa, el focus torna al botó «Índex»', () => {
  render(pagina());
  const boto = botoIndex();
  fireEvent.click(boto);
  fireEvent.click(entrada('Segona secció'));
  expect(screen.queryByRole('dialog', { name: 'Taula de continguts' })).toBeNull();
  expect(document.activeElement).toBe(boto);
  boto.blur();
  fireEvent.click(boto);
  fireEvent.click(screen.getByRole('button', { name: 'Tancar taula' }));
  expect(document.activeElement).toBe(boto);
});

test('a socdepoble.org, en tancar-se, l’Índex no roba el focus a un camp que la persona ha triat', () => {
  render(<>{pagina()}<input aria-label="Camp de fora" /></>);
  fireEvent.click(botoIndex());
  const camp = screen.getByRole('textbox', { name: 'Camp de fora' });
  camp.focus();
  fireEvent.keyDown(camp, { key: 'Escape' });
  expect(screen.queryByRole('dialog', { name: 'Taula de continguts' })).toBeNull();
  expect(document.activeElement).toBe(camp);
});

/* Correcció final (ordre del Mestre, 261004) · El calaix enfocat per programa
   és un contenidor i no pinta cap anell. Regla dins de @layer components de
   modules.css (la resta del calaix viu a legacy, i components hi guanya per
   l'ordre de capes, també a l'anell general de :focus-visible de base.css).
   Derogat (ordre del Mestre, 261004): la regla era
   `.toc-drawer:focus:not(:focus-visible)` i aquesta prova prohibia
   `.toc-drawer:focus {`. Chrome hereta el :focus-visible de l'element enfocat
   abans: després d'un Esc o d'un Tab, obrir l'Índex amb el ratolí pintava un
   anell de 3px a la vora del calaix (mesurat a /projecte, 1280). Les entrades
   i l'aspa, que són controls, conserven el seu anell: cap regla del calaix
   el lleva. */
test('el calaix de l’Índex no pinta cap anell en rebre el focus, tant si l’element anterior era de teclat com si no', () => {
  const modules = pla(llig('src/css/modules.css'));
  const regla = '.toc-drawer:focus { outline: none; }';
  expect(modules).toContain(`@layer components { ${regla} }`);
  // Cap condició de :focus-visible: el calaix no en pinta mai.
  expect(modules).not.toMatch(/\.toc-drawer:focus:not\(/);
  expect(modules).not.toMatch(/\.toc-drawer:focus-visible/);
  // Només el calaix: els controls de dins (entrades, aspa) no perden l'anell.
  expect(modules).not.toMatch(/\.toc-drawer [^{}]*:focus[^{}]*\{[^{}]*outline:\s*none/);
  expect(modules.indexOf(regla)).toBeGreaterThan(modules.indexOf('.toc-drawer {'));
  // La capa de la regla guanya a la de l'anell general (base.css, legacy).
  expect(pla(llig('src/css/index.css'))).toContain('@layer reset, sdp, legacy, components, utilities;');
  const base = pla(llig('src/css/base.css'));
  const anell = base.indexOf(':focus-visible { outline: var(--sdp-focus-gruix) solid var(--sdp-focus);');
  expect(anell).toBeGreaterThan(base.indexOf('@layer legacy {'));
  expect(anell).toBeLessThan(base.indexOf('@layer components {'));
});

/* Correcció final (ordre del Mestre, 261004) · L'entrada de l'Índex porta el
   text de l'encapçalament tal com està escrit: innerText copiava el
   text-transform (un h6 eixia en majúscules a l'Índex i al lector de
   pantalla). jsdom no té innerText: es dona a mà, com el donaria el
   navegador amb el text-transform de l'h6. */
test('les entrades de l’Índex no copien el text-transform de l’encapçalament i pleguen els espais', () => {
  render(<PageFrame chrome="system" title="Document"><h2>Primera secció</h2><h6>{'Aplicació  estricta\n  i sense concessions'}</h6></PageFrame>);
  const h6 = document.querySelector('article.content-wrapper h6');
  Object.defineProperty(h6, 'innerText', { configurable: true, get: () => 'APLICACIÓ ESTRICTA I SENSE CONCESSIONS' });
  fireEvent.click(botoIndex());
  expect(entrada('Aplicació estricta i sense concessions')).toBeTruthy();
  expect(within(screen.getByRole('dialog', { name: 'Taula de continguts' })).queryByRole('button', { name: /APLICACIÓ/ })).toBeNull();
});

test('el botó «Índex» només porta aria-controls si obri l’Índex propi', () => {
  render(pagina({ onIndex: () => {} }));
  fireEvent.click(botoIndex());
  expect(botoIndex().hasAttribute('aria-controls')).toBe(false);
  cleanup();
  // La barra sola (el catàleg): el marcatge de sempre.
  render(<BarraBlava onIndex={() => {}} />);
  expect(botoIndex().hasAttribute('aria-controls')).toBe(false);
});

test('el salt de l’Índex mou només el desplaçador de l’app: un ancestre desplaçable de fora de l’arrel no es mou', () => {
  const { fora, dins } = muntaAmbDesplacadors(pagina());
  fireEvent.click(botoIndex());
  const segona = dins.querySelectorAll('article.content-wrapper h3')[0];
  segona.getBoundingClientRect = () => ({ top: 900 });
  fireEvent.click(entrada('Segona secció'));
  // 200 de scroll + (900 - 50) de distància; sense barres enganxades ni scroll-margin, cap marge.
  expect(dins.moviments).toEqual([{ top: 1050, behavior: 'smooth' }]);
  expect(fora.moviments).toEqual([]);
  expect(saltatsPerElement).toEqual([]);
});

test('el destí queda per davall de les barres enganxades amb el marge acordat, o al seu scroll-margin-top si en demana més', () => {
  const { dins } = muntaAmbDesplacadors(pagina());
  const blava = dins.querySelector('header.bar-blue');
  const taronja = dins.querySelector('section.bar-orange');
  Object.assign(blava.style, { position: 'sticky', top: '0px' });
  Object.assign(taronja.style, { position: 'sticky', top: '58px' });
  Object.defineProperty(blava, 'offsetHeight', { configurable: true, value: 58 });
  Object.defineProperty(taronja, 'offsetHeight', { configurable: true, value: 58 });
  const [primera] = dins.querySelectorAll('article.content-wrapper h2');
  const segona = dins.querySelector('article.content-wrapper h3');
  for (const titol of [primera, segona]) {
    titol.style.setProperty('--sdp-space-4', '16px');
    titol.getBoundingClientRect = () => ({ top: 900 });
  }
  // La segona ja reserva més del que tapen les barres (com els desplegables de la Consola).
  segona.style.setProperty('scroll-margin-top', '174px');

  fireEvent.click(botoIndex());
  fireEvent.click(entrada('Primera secció'));
  // Les barres tapen fins a 58 + 58 = 116; amb el marge acordat (16), el destí queda a 132.
  fireEvent.click(botoIndex());
  fireEvent.click(entrada('Segona secció'));
  expect(dins.moviments).toEqual([
    { top: 1050 - 132, behavior: 'smooth' },
    { top: 1050 - 174, behavior: 'smooth' }
  ]);
});

test('sense barres enganxades, el marge és només el scroll-margin-top de l’element (com scrollIntoView)', () => {
  const { dins } = muntaAmbDesplacadors(pagina());
  const segona = dins.querySelector('article.content-wrapper h3');
  segona.style.setProperty('--sdp-space-4', '16px');
  segona.style.setProperty('scroll-margin-top', '40px');
  segona.getBoundingClientRect = () => ({ top: 900 });
  fireEvent.click(botoIndex());
  fireEvent.click(entrada('Segona secció'));
  expect(dins.moviments).toEqual([{ top: 1050 - 40, behavior: 'smooth' }]);
});

/* La pell de l'encastat (jsdom no resol la cascada: es llig el full, com
   src/css/pantallaCompleta.capes.test.js). Dins de .sdp-root, el vel de
   l'Índex ocupa la caixa de l'App i no 100vw x 100vh de la pàgina de
   WordPress; a socdepoble.org (sense :host) el .toc-overlay és el de sempre. */
const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const pla = (css) => css.replace(/\s+/g, ' ');

test('encastat, el vel de l’Índex ocupa la caixa de l’App: :host .toc-overlay dins de @layer components de layout.css', () => {
  const layout = pla(llig('src/css/layout.css'));
  expect(layout.match(/:host \.toc-overlay \{[^}]*\}/g)).toEqual([':host .toc-overlay { inset: 0; width: auto; height: auto; }']);
  // Dins del primer bloc @layer components, el de la Frontera C2 (abans del primer @layer legacy).
  const posicio = layout.indexOf(':host .toc-overlay');
  expect(posicio).toBeGreaterThan(layout.indexOf('@layer components {'));
  expect(posicio).toBeLessThan(layout.indexOf('@layer legacy {'));
  // La regla de sempre viu a la capa legacy de modules.css, i components hi guanya per l'ordre de capes.
  const modules = pla(llig('src/css/modules.css'));
  expect(modules).toContain('.toc-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;');
  const posLegacy = modules.indexOf('@layer legacy {');
  const posBase = modules.indexOf('.toc-overlay { position: fixed;');
  expect(posBase).toBeGreaterThan(posLegacy);
  expect(modules.indexOf('@layer components {', posLegacy)).toBeGreaterThan(posBase);
  expect(pla(llig('src/css/index.css'))).toContain('@layer reset, sdp, legacy, components, utilities;');
});

test('sense cap desplaçador de l’app, a socdepoble.org el salt continua sent el scrollIntoView d’abans', () => {
  render(pagina());
  fireEvent.click(botoIndex());
  fireEvent.click(entrada('Segona secció'));
  const segona = document.querySelector('article.content-wrapper h3');
  expect(saltatsPerElement).toEqual([[segona, { behavior: 'smooth', block: 'start' }]]);
});
