/**
 * Ordre del Mestre, 261004 (integració final, auditoria d'amfitrió) · L'Índex
 * de la Pàgina Universal dins de <soc-de-poble>.
 *
 * Abans, dins de WordPress, l'Índex es pintava amb un portal al body del tema
 * (sense estils, al peu de la pàgina) i el salt a una secció feia
 * scrollIntoView, que també desplaçava la pàgina de l'amfitrió. Ara l'Índex
 * es pinta dins de l'arrel ombra (a .sdp-root, com els diàlegs), Esc s'escolta
 * a l'arrel de la instància i el salt només mou el desplaçador de l'app.
 *
 * Es munta l'element de veritat (customElements, shadow root tancat, arrel de
 * React pròpia) i el PedraSecaEmbed de veritat. L'App és una pàgina amb barra
 * blava dins d'un desplaçador, com .app-main__content; useAccions i el
 * traductor, que parlarien amb el backend, se substituïxen. El shadow root és
 * tancat: la prova el llig per la referència privada `_closedRoot`, com a
 * PedraSecaEmbed.router.test.jsx. jsdom no té disposició: les mides es fixen a mà.
 */
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup } from '@testing-library/react';
import { activeElements, defineCustomElement } from './PedraSecaEmbed.jsx';

vi.hoisted(() => {
  for (const variable of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_DATA_MODE', 'VITE_TENANT_ID']) vi.stubEnv(variable, '');
});
vi.mock('./host.js', () => ({ arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('./app/contexts/SessionContext.jsx', () => ({ SessionProvider: ({ children }) => children }));
vi.mock('./app/contexts/IdentitatContext.jsx', () => ({ IdentitatProvider: ({ children }) => children }));
vi.mock('./components/PedraSeca/hooks/useAccions.js', () => ({ useAccions: () => ({}) }));
vi.mock('./components/PedraSeca/hooks/useTraduccioPagina.js', () => ({
  useTraduccioPagina: () => ({ llengua: null, lang: null, carregant: null, titol: null, blocs: null, original: () => {} })
}));
vi.mock('./app/App.jsx', async () => {
  const { PageFrame } = await import('./components/universal/PageFrame.jsx');
  // Com l'App de veres: el seu div.sdp-root i, dins, el desplaçador del contingut.
  function AppDeProva() {
    return (
      <div className="sdp-root">
        <div className="app-main__content" data-sonda="desplacador">
          <PageFrame chrome="system" title="Pàgina encastada">
            <h2>Primera secció</h2>
            <p>Text.</p>
            <h3>Segona secció</h3>
          </PageFrame>
        </div>
      </div>
    );
  }
  return { default: AppDeProva };
});

const saltatsPerElement = [];
const scrollAbans = Element.prototype.scrollIntoView;

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

/* La pàgina de WordPress: un desplaçador del tema que conté <soc-de-poble>. */
async function muntaDinsDelTema() {
  const tema = fesDesplacador(document.createElement('div'));
  document.body.append(tema);
  const element = document.createElement('soc-de-poble');
  await act(async () => { tema.appendChild(element); });
  const arrel = element._closedRoot;
  const boto = arrel.querySelector('button[aria-label="Índex de secció"]');
  return { tema, element, arrel, boto };
}

const indexDe = (arrel) => arrel.querySelector('.toc-overlay > [role="dialog"]');
const tecla = (node, key) => act(() => {
  node.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }));
});

beforeAll(() => {
  defineCustomElement();
});

beforeEach(() => {
  saltatsPerElement.length = 0;
  Element.prototype.scrollIntoView = function scrollIntoView(opcions) { saltatsPerElement.push([this, opcions]); };
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
});

afterEach(async () => {
  cleanup();
  await act(async () => {
    for (const element of [...activeElements]) {
      element.remove();
      element._desmuntaAra();
    }
  });
  document.body.replaceChildren();
  Element.prototype.scrollIntoView = scrollAbans;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

test('l’Índex es pinta dins de l’arrel ombra (a .sdp-root), no al body de WordPress, i Esc el tanca', async () => {
  const { arrel, boto } = await muntaDinsDelTema();
  expect(boto).not.toBeNull();
  act(() => { boto.click(); });

  const dialeg = indexDe(arrel);
  expect(dialeg).not.toBeNull();
  expect(dialeg.getAttribute('aria-modal')).toBe('true');
  expect(dialeg.getRootNode()).toBe(arrel);
  // A l'arrel de l'App (el div.sdp-root de React), com els diàlegs encastats.
  expect(dialeg.parentElement.parentElement.className).toBe('sdp-root');
  expect(dialeg.parentElement.parentElement.parentElement.className).toBe('sdp-root');
  // El body del tema no rep res.
  expect(document.body.querySelector('.toc-overlay')).toBeNull();
  // El botó «Índex» hi apunta, i l'id es troba dins de la mateixa arrel.
  expect(boto.getAttribute('aria-controls')).toBe(dialeg.id);
  expect(arrel.getElementById(boto.getAttribute('aria-controls'))).toBe(dialeg);
  // L'Índex llig les seccions de la pàgina encastada. Ordre del Mestre
  // (261026_2126, §5) · I primer, l'H1 de la capçalera.
  expect([...dialeg.querySelectorAll('.toc-nav button')].map((b) => b.textContent)).toEqual(['Pàgina encastada', 'Primera secció', 'Segona secció']);

  // Una tecla de la pàgina de WordPress no tanca l'Índex de dins.
  tecla(document.body, 'Escape');
  expect(indexDe(arrel)).not.toBeNull();
  // Esc des de dins de l'app, sí.
  tecla(boto, 'Escape');
  expect(indexDe(arrel)).toBeNull();
});

/* Verificació «index-amfitrio», D1 (ordre del Mestre, 261004) · Safari i
   Firefox de macOS no enfoquen un botó en clicar-lo, i un clic a un text no
   enfocable del calaix portava el focus al body del tema: la tecla anava al
   document de WordPress i l'oient de l'arrel ombra no la sentia mai. Ara,
   encastat, el calaix rep el focus en obrir-se (i el clic a un text de dins el
   deixa en ell), i en tancar torna al botó «Índex». boto.click() no enfoca res:
   és el clic de Safari. Una tecla real va a l'element enfocat: dins de l'ombra
   si n'hi ha, si no, el de la pàgina. */
const enfocat = (arrel) => arrel.activeElement ?? document.activeElement;

test('obert amb un clic que no enfoca el botó (Safari), Esc des del teclat tanca l’Índex i el focus torna al botó «Índex»', async () => {
  const { arrel, boto } = await muntaDinsDelTema();
  expect(arrel.activeElement).toBeNull();
  act(() => { boto.click(); });
  const dialeg = indexDe(arrel);
  expect(dialeg).not.toBeNull();

  tecla(enfocat(arrel), 'Escape');
  expect(indexDe(arrel)).toBeNull();
  // El focus no es queda perdut al body del tema: torna a qui ha obert l'Índex.
  expect(arrel.activeElement).toBe(boto);
});

test('encastat, el calaix de l’Índex rep el focus en obrir-se (tabIndex -1: un clic a un text de dins no el porta al body)', async () => {
  const { arrel, boto } = await muntaDinsDelTema();
  act(() => { boto.click(); });
  const dialeg = indexDe(arrel);
  expect(dialeg.getAttribute('tabindex')).toBe('-1');
  expect(arrel.activeElement).toBe(dialeg);
  // Tancat amb una entrada, el focus també torna al botó «Índex».
  const entrada = [...dialeg.querySelectorAll('.toc-nav button')].find((b) => b.textContent === 'Primera secció');
  act(() => { entrada.focus(); entrada.click(); });
  expect(indexDe(arrel)).toBeNull();
  expect(arrel.activeElement).toBe(boto);
});

test('en tancar l’Índex, el focus no es roba a un camp de la pàgina de WordPress', async () => {
  const { tema, arrel, boto } = await muntaDinsDelTema();
  const camp = document.createElement('input');
  tema.append(camp);
  act(() => { boto.click(); });
  // El vel només cobrix la caixa de l'app: la persona pot clicar un camp del tema.
  act(() => { camp.focus(); });
  act(() => { indexDe(arrel).querySelector('.toc-close-btn').click(); });
  expect(indexDe(arrel)).toBeNull();
  expect(document.activeElement).toBe(camp);
});

test('el salt de l’Índex mou el desplaçador de l’app i no la pàgina de WordPress', async () => {
  const { tema, arrel, boto } = await muntaDinsDelTema();
  const app = fesDesplacador(arrel.querySelector('[data-sonda="desplacador"]'), { top: 40, scrollTop: 100 });
  act(() => { boto.click(); });
  const segona = arrel.querySelector('article.content-wrapper h3');
  segona.getBoundingClientRect = () => ({ top: 700 });
  const entrada = [...indexDe(arrel).querySelectorAll('.toc-nav button')].find((b) => b.textContent === 'Segona secció');
  act(() => { entrada.click(); });

  expect(app.moviments).toEqual([{ top: 100 + 700 - 40, behavior: 'smooth' }]);
  expect(tema.moviments).toEqual([]);
  expect(saltatsPerElement).toEqual([]);
  expect(indexDe(arrel)).toBeNull();
});

test('encastat i sense cap desplaçador de l’app, el salt no fa cap scrollIntoView (no mou l’amfitrió)', async () => {
  const { tema, arrel, boto } = await muntaDinsDelTema();
  act(() => { boto.click(); });
  const entrada = [...indexDe(arrel).querySelectorAll('.toc-nav button')].find((b) => b.textContent === 'Primera secció');
  act(() => { entrada.click(); });
  expect(saltatsPerElement).toEqual([]);
  expect(tema.moviments).toEqual([]);
});
