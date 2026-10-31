import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), ui: { externalConfig: {} } }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => mocks.ui }));
import { UniversalPage } from './UniversalPage.jsx';
import {
  AVIS_SENSE_TRADUCTOR, buidaCauTraduccions
} from '../PedraSeca/hooks/useTraduccioPagina.js';
import { AVIS_TRADUIT, VEURE_ORIGINAL } from './traduccio/TraduccioPagina.jsx';
import { NOM_MENU_TRADUIR } from './traduccio/MenuTraduir.jsx';

/* Traductor Sobirà (ordre del Mestre, 260930 · via B) · La pàgina: Traduir
   obri el menú, la llengua triada crida el servei de l'amfitrió i el títol i
   el cos canvien EN LOCAL (sense navegar ni recarregar), amb l'avís i «Veure
   l'original». Es traduïx text i es pinta com a text: un <script> de la
   resposta no s'executa mai. Sense servei, l'avís honest. */

const URL_SERVEI = '/wp-json/socdepoble/v1/traduir';
const TEXTOS = ['La festa del poble', 'Programa', 'Tres dies de festa.', 'Divendres', 'Sopar a la plaça.', 'Música', 'Ball'];

const Pagina = (props) => (
  <UniversalPage chrome="context" title="La festa del poble" subtitle="Programa" lead="Tres dies de festa." {...props}>
    <section>
      <h3>Divendres</h3>
      <p>Sopar a la plaça.</p>
      <ul><li>Música</li><li>Ball</li></ul>
      <button type="button">Apunta’t</button>
      <span className="sr-only">Només per al lector</span>
    </section>
  </UniversalPage>
);

const respostaJson = (status, cos) => ({ ok: status >= 200 && status < 300, status, json: async () => cos });
const traduccioAmb = (prefix) => vi.fn(async (_, { body }) => {
  const { textos, desti } = JSON.parse(body);
  return respostaJson(200, { traduccions: textos.map((text) => `${prefix} ${text}`), origen: 'CA', desti, cache: false });
});

const traduir = (container) => container.querySelector('header.bar-blue button[aria-label="Traduir"]');
const original = (container) => container.querySelector('article.content-wrapper:not(.sdp-traduccio-cos)');
const traduit = (container) => container.querySelector('article.sdp-traduccio-cos');
const avis = (container) => container.querySelector('.sdp-avis-traduccio');
const tria = async (container, nom) => {
  fireEvent.click(traduir(container));
  await act(async () => {
    fireEvent.click(within(screen.getByRole('menu', { name: NOM_MENU_TRADUIR })).getByRole('menuitemradio', { name: nom }));
  });
};

beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.toast.mockReset();
  mocks.ui = { externalConfig: { traductorUrl: URL_SERVEI } };
  buidaCauTraduccions();
  window.history.replaceState(null, '', '/festes');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('Llei del Píxel · abans de prémer Traduir, cap avís, un sol article i el títol de sempre', () => {
  vi.stubGlobal('fetch', vi.fn());
  const { container } = render(<Pagina />);
  expect(avis(container)).toBeNull();
  expect(container.querySelectorAll('article.content-wrapper')).toHaveLength(1);
  expect(original(container).hasAttribute('hidden')).toBe(false);
  expect(container.querySelector('h1').hasAttribute('lang')).toBe(false);
  expect(traduir(container).getAttribute('aria-expanded')).toBe('false');
  expect(fetch).not.toHaveBeenCalled();
});

test('triar Castellà: un lot de text al servei, estat de càrrega i el títol i el cos canvien sense navegar', async () => {
  let resol;
  const fetch = vi.fn(() => new Promise((r) => { resol = r; }));
  vi.stubGlobal('fetch', fetch);
  const adreca = window.location.href;
  const { container } = render(<Pagina />);
  await tria(container, 'Castellà');

  expect(fetch).toHaveBeenCalledTimes(1);
  const [url, opcions] = fetch.mock.calls[0];
  expect(url).toBe(`${window.location.origin}${URL_SERVEI}`);
  expect(opcions.credentials).toBe('omit');
  expect(JSON.parse(opcions.body)).toEqual({ textos: TEXTOS, desti: 'ES', origen: 'CA', format: 'text' });
  // Càrrega discreta: l'avís ho diu i l'original continua a la vista.
  expect(avis(container).textContent).toBe('Traduint al castellà…');
  expect(original(container).hasAttribute('hidden')).toBe(false);

  await act(async () => {
    resol(respostaJson(200, { traduccions: TEXTOS.map((t) => `[ES] ${t}`), origen: 'CA', desti: 'ES', cache: false }));
  });

  const h1 = container.querySelector('h1');
  expect(h1.textContent).toBe('[ES] La festa del poble');
  expect(h1.getAttribute('lang')).toBe('es');
  const cos = traduit(container);
  expect(cos.getAttribute('lang')).toBe('es');
  /* Actualitzada a posta (Gauntlet 261030, Fase 3, TC3.3; vista-traduida-perd-entradilla):
     motiu, el subtítol i l'entradilla tornen dins de div.page-intro, com a l'original. */
  expect([...cos.children].map((e) => [e.tagName.toLowerCase(), e.textContent])).toEqual([
    ['div', '[ES] Programa[ES] Tres dies de festa.'], ['h3', '[ES] Divendres'],
    ['p', '[ES] Sopar a la plaça.'], ['ul', '[ES] Música[ES] Ball'],
  ]);
  expect([...cos.querySelector('.page-intro').children].map((e) => [e.tagName.toLowerCase(), e.className, e.textContent])).toEqual([
    ['h2', '', '[ES] Programa'], ['p', 'lead', '[ES] Tres dies de festa.'],
  ]);
  // L'original no es desmunta: s'amaga i conserva els seus controls.
  expect(original(container).hasAttribute('hidden')).toBe(true);
  expect(within(original(container)).getByRole('button', { name: 'Apunta’t', hidden: true })).toBeTruthy();
  expect(avis(container).getAttribute('role')).toBe('status');
  expect(avis(container).textContent).toContain(AVIS_TRADUIT);
  expect(within(avis(container)).getByRole('button', { name: VEURE_ORIGINAL })).toBeTruthy();
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(window.location.href).toBe(adreca);
});

test('«Veure l’original» torna el títol i el cos; tornar a Castellà no torna a demanar res (memòria cau)', async () => {
  const fetch = traduccioAmb('[ES]');
  vi.stubGlobal('fetch', fetch);
  const { container } = render(<Pagina />);
  await tria(container, 'Castellà');
  expect(traduit(container)).not.toBeNull();

  fireEvent.click(within(avis(container)).getByRole('button', { name: VEURE_ORIGINAL }));
  expect(container.querySelector('h1').textContent).toBe('La festa del poble');
  expect(container.querySelector('h1').hasAttribute('lang')).toBe(false);
  expect(traduit(container)).toBeNull();
  expect(original(container).hasAttribute('hidden')).toBe(false);
  expect(avis(container)).toBeNull();

  await tria(container, 'Castellà');
  expect(container.querySelector('h1').textContent).toBe('[ES] La festa del poble');
  expect(fetch).toHaveBeenCalledTimes(1);

  // Amb la pàgina traduïda, el menú oferix l'original.
  await tria(container, 'Original (valencià)');
  expect(traduit(container)).toBeNull();
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test('sanejament: un <script> o un <img onerror> de la resposta es pinten com a text, mai com a HTML', async () => {
  vi.stubGlobal('fetch', vi.fn(async (_, { body }) => {
    const { textos } = JSON.parse(body);
    const traduccions = textos.map(() => '<script>window.__sdpXss = 1</script><img src="x" onerror="window.__sdpXss = 2"><b>negreta</b>');
    return respostaJson(200, { traduccions, origen: 'CA', desti: 'FR', cache: false });
  }));
  const { container } = render(<Pagina />);
  await tria(container, 'Francés');
  const cos = traduit(container);
  expect(cos).not.toBeNull();
  // (L'única imatge de la pàgina és l'avatar de la barra taronja.)
  expect(container.querySelector('script')).toBeNull();
  expect(cos.querySelector('script, img, b')).toBeNull();
  expect(container.querySelector('h1').querySelector('script, img, b')).toBeNull();
  expect(cos.textContent).toContain('<script>window.__sdpXss = 1</script>');
  expect(container.querySelector('h1').textContent).toContain('<img src="x"');
  expect(window.__sdpXss).toBeUndefined();
});

test('sense servei (cap traductorUrl): avís honest, cap menú, cap petició ni navegació', () => {
  mocks.ui = { externalConfig: {} };
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const { container } = render(<Pagina />);
  expect(traduir(container).hasAttribute('aria-haspopup')).toBe(false);
  fireEvent.click(traduir(container));
  expect(mocks.toast).toHaveBeenCalledWith(AVIS_SENSE_TRADUCTOR);
  expect(AVIS_SENSE_TRADUCTOR).toBe('La traducció automàtica no està disponible en este servidor.');
  expect(screen.queryByRole('menu')).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test('error del servidor: el missatge pel codi, mai el text del servidor; l’original (i una traducció ja feta) no es perd', async () => {
  const fetch = vi.fn(async () => respostaJson(429, {
    code: 'sdp_traduccio_limit', message: 'Translation request could not be completed.', data: { status: 429 }
  }));
  vi.stubGlobal('fetch', fetch);
  const { container } = render(<Pagina />);
  await tria(container, 'Alemany');
  expect(mocks.toast).toHaveBeenCalledTimes(1);
  const [missatge] = mocks.toast.mock.calls[0];
  expect(missatge).toBe('S’ha arribat al límit de traduccions automàtiques. Torna-ho a provar més tard.');
  expect(missatge).not.toMatch(/Translation|DeepL/);
  expect(traduit(container)).toBeNull();
  expect(original(container).hasAttribute('hidden')).toBe(false);
  expect(avis(container)).toBeNull();

  // Ja en castellà, una segona llengua que falla deixa el castellà a la vista.
  vi.stubGlobal('fetch', traduccioAmb('[ES]'));
  await tria(container, 'Castellà');
  vi.stubGlobal('fetch', vi.fn(async () => respostaJson(502, { code: 'sdp_traduccio_proveidor' })));
  await tria(container, 'Anglés');
  expect(mocks.toast).toHaveBeenLastCalledWith('No s’ha pogut traduir la pàgina. Torna-ho a provar més tard.');
  expect(container.querySelector('h1').textContent).toBe('[ES] La festa del poble');
  expect(avis(container).textContent).toContain(AVIS_TRADUIT);
});

test('un onTranslate propi mana com sempre: cap menú, cap petició', () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const onTranslate = vi.fn();
  const { container } = render(<Pagina onTranslate={onTranslate} />);
  expect(traduir(container).hasAttribute('aria-haspopup')).toBe(false);
  fireEvent.click(traduir(container));
  expect(onTranslate).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('menu')).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

test('a l’editor (accionsInoperatives, T36) Traduir continua portant a /traduccions: no es traduïx el que s’escriu', () => {
  const { container } = render(<Pagina accionsInoperatives onClickInoperatiu={vi.fn()} />);
  expect(traduir(container).hasAttribute('aria-haspopup')).toBe(false);
  fireEvent.click(traduir(container));
  /* Auditoria 261007 (B) · Sense ?item_id=: TranslationsSection no el llig, i
     el títol de l'editor de veres és un element, no un text. */
  expect(mocks.navigate).toHaveBeenCalledWith('/traduccions');
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('menu')).toBeNull();
});

test('un canvi de pàgina torna a l’original; l’Índex llig el cos que es veu', async () => {
  vi.stubGlobal('fetch', traduccioAmb('[ES]'));
  const { container, rerender } = render(<Pagina />);
  await tria(container, 'Castellà');
  fireEvent.click(container.querySelector('button[aria-label="Índex de secció"]'));
  const index = screen.getByRole('dialog', { name: 'Taula de continguts' });
  expect(within(index).getAllByRole('button').map((b) => b.textContent)).toContain('[ES] Divendres');
  expect(within(index).queryByRole('button', { name: 'Divendres' })).toBeNull();
  fireEvent.click(within(index).getByRole('button', { name: 'Tancar taula' }));

  rerender(<Pagina title="Una altra pàgina" />);
  expect(container.querySelector('h1').textContent).toBe('Una altra pàgina');
  expect(traduit(container)).toBeNull();
  expect(original(container).hasAttribute('hidden')).toBe(false);
  expect(avis(container)).toBeNull();
});
