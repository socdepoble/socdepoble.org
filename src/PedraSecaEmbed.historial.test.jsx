/**
 * Onada 12 (261011; ordres 261011_0130, punt 4) · «Arrere» del navegador
 * navega dins de <soc-de-poble>.
 *
 * Amb `ruta-a-url` declarat (WordPress el declara sempre), cada navegació
 * nova de l'app obri una entrada a l'historial del navegador, i el popstate
 * torna l'app a la pantalla d'abans sense recarregar el document ni desmuntar
 * l'arrel. Es munta l'element de veritat (customElements, shadow root tancat,
 * arrel pròpia) amb el MemoryRouter i el ReflexDeRuta de veritat; l'App és un
 * doble que deixa a mà el navigate, la ruta i l'estat de cada instància.
 *
 * L'historial és el de jsdom: history.back() i history.go() hi són asíncrons
 * i disparen popstate (i hashchange quan canvia el fragment), com al
 * navegador. El que jsdom no pot dir (què fa Chrome amb el router de
 * l'amfitrió, la memòria cau d'anada i tornada de veritat) queda per a la
 * prova de fum.
 */
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { act, cleanup } from '@testing-library/react';
import { activeElements, defineCustomElement, estatPropi } from './PedraSecaEmbed.jsx';

vi.hoisted(() => {
  for (const variable of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_DATA_MODE', 'VITE_TENANT_ID']) vi.stubEnv(variable, '');
});
vi.mock('./css/index.css?inline', () => ({ default: '.sdp-root { display: flex; }' }));
const sondes = vi.hoisted(() => ({ navega: new Map(), ruta: new Map(), estat: new Map(), muntatges: new Map() }));
const alies = vi.hoisted(() => new Map());
vi.mock('./app/App.jsx', async () => {
  const { createElement, useEffect } = await import('react');
  const { Navigate, useLocation, useNavigate } = await import('./app/contexts/RouterContext.jsx');
  return {
    default: function AppDeProva({ targetNode }) {
      const amfitrio = targetNode?.host;
      const { pathname, search, state } = useLocation();
      sondes.navega.set(amfitrio, useNavigate());
      sondes.ruta.set(amfitrio, search ? `${pathname}?${search}` : pathname);
      sondes.estat.set(amfitrio, state);
      // Quantes vegades s'ha muntat l'arrel: «Arrere» no l'ha de desmuntar mai.
      useEffect(() => { sondes.muntatges.set(amfitrio, (sondes.muntatges.get(amfitrio) || 0) + 1); }, [amfitrio]);
      const desti = alies.get(pathname);
      return desti ? createElement(Navigate, { to: desti, replace: true }) : null;
    }
  };
});
vi.mock('./app/contexts/UIContext.jsx', () => ({ UIProvider: ({ children }) => children }));
vi.mock('./app/contexts/SessionContext.jsx', () => ({ SessionProvider: ({ children }) => children }));
vi.mock('./app/contexts/IdentitatContext.jsx', () => ({ IdentitatProvider: ({ children }) => children }));

const onEs = () => window.location.pathname + window.location.search + window.location.hash;
const on = (element) => sondes.ruta.get(element);
const pausa = (ms = 0) => new Promise((resol) => { setTimeout(resol, ms); });

async function munta(atributs = {}) {
  const element = document.createElement('soc-de-poble');
  for (const [nom, valor] of Object.entries(atributs)) element.setAttribute(nom, valor);
  await act(async () => { document.body.appendChild(element); });
  return element;
}

async function navega(element, ...args) {
  await act(async () => { sondes.navega.get(element)(...args); });
}

/** Un salt de l'historial del navegador (el botó «Arrere» és -1) i l'espera del seu popstate. */
async function salta(n) {
  await act(async () => {
    const arribat = new Promise((resol) => { window.addEventListener('popstate', resol, { once: true }); });
    window.history.go(n);
    await Promise.race([arribat, pausa(200)]);
    await pausa();
  });
}
const enrere = () => salta(-1);
const avant = () => salta(1);

/** L'amfitrió és en una pàgina seua (`abans`) i obri la que porta l'element (`pagina`). */
function arriba(pagina, estat = null, abans = '/portada-de-l-amfitrio') {
  window.history.pushState(null, '', abans);
  window.history.pushState(estat, '', pagina);
}

function espies() {
  return { push: vi.spyOn(window.history, 'pushState'), replace: vi.spyOn(window.history, 'replaceState') };
}

beforeAll(() => {
  defineCustomElement();
});

afterEach(async () => {
  cleanup();
  await act(async () => {
    for (const element of [...activeElements]) {
      element.remove();
      element._desmuntaAra();
    }
  });
  for (const sonda of Object.values(sondes)) sonda.clear();
  alies.clear();
  document.body.replaceChildren();
  vi.restoreAllMocks();
  // Una entrada nova i neta: talla el que quedava avant de la prova anterior.
  window.history.pushState(null, '', '/');
});

describe('«Arrere» del navegador dins de l’element (ruta-a-url)', () => {
  test('A → B → C: «Arrere» dues vegades torna a B i a A sense eixir, «Avant» torna, i la tercera ix del portal', async () => {
    arriba('/pagina');
    const { push } = espies();
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    expect(onEs()).toBe('/pagina#sdp=/xat');
    expect(push).not.toHaveBeenCalled(); // la primera pantalla adopta l'entrada: cap de nova

    await navega(element, '/mur');
    await navega(element, '/pobles/sella');
    expect(onEs()).toBe('/pagina#sdp=/pobles/sella');
    expect(push).toHaveBeenCalledTimes(2);
    expect(estatPropi()).toEqual({ ruta: '/pobles/sella', i: 2 });

    await enrere();
    expect(on(element)).toBe('/mur');
    expect(onEs()).toBe('/pagina#sdp=/mur');
    await enrere();
    expect(on(element)).toBe('/xat');
    expect(onEs()).toBe('/pagina#sdp=/xat');
    await avant();
    expect(on(element)).toBe('/mur');
    await avant();
    expect(on(element)).toBe('/pobles/sella');
    expect(onEs()).toBe('/pagina#sdp=/pobles/sella');

    // Anar i tornar no escriu res: ni entrades noves ni bucle.
    expect(push).toHaveBeenCalledTimes(2);
    // La sessió no es toca: l'arrel és la mateixa, muntada una sola vegada.
    expect(sondes.muntatges.get(element)).toBe(1);
    expect(element.isConnected).toBe(true);

    // Des de la primera pantalla, «Arrere» ix cap a l'amfitrió: cap trampa ni entrada fantasma.
    await salta(-2);
    expect(on(element)).toBe('/xat');
    await enrere();
    expect(onEs()).toBe('/portada-de-l-amfitrio');
    expect(on(element)).toBe('/xat');
    expect(push).toHaveBeenCalledTimes(2);
  });

  test('mode paràmetre: les entrades viuen a ?sdp= i els paràmetres de l’amfitrió no es mouen', async () => {
    arriba('/pagina?a=1&b=2#seccio');
    const element = await munta({ 'ruta-a-url': 'parametre', 'ruta-inicial': '/xat' });
    await navega(element, '/mur?filtre=tot');
    expect(onEs()).toBe('/pagina?a=1&b=2&sdp=/mur%3Ffiltre%3Dtot#seccio');
    await enrere();
    expect(on(element)).toBe('/xat');
    expect(onEs()).toBe('/pagina?a=1&b=2&sdp=/xat#seccio');
    await avant();
    expect(on(element)).toBe('/mur?filtre=tot');
  });

  test('enllaç profund: s’adopta l’entrada (replaceState), cap de nova, i «Arrere» ix del portal', async () => {
    arriba('/pagina#sdp=/pobles/sella');
    const { push, replace } = espies();
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    expect(on(element)).toBe('/pobles/sella');
    expect(push).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(onEs()).toBe('/pagina#sdp=/pobles/sella');
    expect(estatPropi()).toEqual({ ruta: '/pobles/sella', i: 0 });
    await enrere();
    expect(onEs()).toBe('/portada-de-l-amfitrio');
  });

  test('cap doble entrada: un àlies (Navigate replace), el cercador (replace) i tornar a la mateixa ruta no n’obrin', async () => {
    arriba('/pagina');
    alies.set('/chat', '/xat');
    const { push } = espies();
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/mur' });
    await navega(element, '/chat'); // una navegació, encara que l'àlies la redirigisca
    expect(on(element)).toBe('/xat');
    expect(onEs()).toBe('/pagina#sdp=/xat');
    expect(push).toHaveBeenCalledTimes(1);
    await navega(element, '/xat'); // la mateixa pantalla
    expect(push).toHaveBeenCalledTimes(1);
    await navega(element, '/cerca?q=a'); // obrir el cercador sí que és una pantalla nova
    await navega(element, '/cerca?q=ab', { replace: true });
    await navega(element, '/cerca?q=abc', { replace: true });
    expect(push).toHaveBeenCalledTimes(2);
    expect(estatPropi()).toEqual({ ruta: '/cerca?q=abc', i: 2 });
    await enrere();
    expect(on(element)).toBe('/xat');
    await enrere();
    expect(on(element)).toBe('/mur');
  });

  test('l’estat de l’amfitrió es conserva i s’amplia a cada entrada (Next, Turbo…), i torna intacte amb «Arrere»', async () => {
    const delAmfitrio = { __NA: true, arbre: ['', { fills: ['pagina'] }], turbo: { id: 'r-1' } };
    arriba('/pagina', delAmfitrio);
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    expect(window.history.state).toEqual({ ...delAmfitrio, sdp: { ruta: '/xat', i: 0 } });
    await navega(element, '/mur');
    expect(window.history.state).toEqual({ ...delAmfitrio, sdp: { ruta: '/mur', i: 1 } });
    await navega(element, '/mur?seccio=dos', { replace: true });
    expect(window.history.state).toEqual({ ...delAmfitrio, sdp: { ruta: '/mur?seccio=dos', i: 1 } });
    await enrere();
    expect(window.history.state).toEqual({ ...delAmfitrio, sdp: { ruta: '/xat', i: 0 } });
    expect(on(element)).toBe('/xat');
  });

  test.each([['un text', 'estat-de-l-amfitrio'], ['un nombre', 7], ['una llista', [1, 2]], ['una data', new Date(0)]])(
    'history.state que no és un objecte pla (%s): no es toca, i «Arrere» funciona per la URL', async (_, delAmfitrio) => {
      arriba('/pagina', delAmfitrio);
      const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
      expect(window.history.state).toEqual(delAmfitrio);
      await navega(element, '/mur');
      expect(window.history.state).toEqual(delAmfitrio);
      expect(onEs()).toBe('/pagina#sdp=/mur');
      await enrere();
      expect(window.history.state).toEqual(delAmfitrio);
      expect(on(element)).toBe('/xat');
      expect(onEs()).toBe('/pagina#sdp=/xat');
    });

  test('history.state nul: l’entrada porta només la clau pròpia', async () => {
    arriba('/pagina', null);
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    expect(window.history.state).toEqual({ sdp: { ruta: '/xat', i: 0 } });
    await navega(element, '/mur');
    expect(window.history.state).toEqual({ sdp: { ruta: '/mur', i: 1 } });
  });

  test('l’amfitrió també fa pushState: l’app no reacciona a les seues entrades ni les reescriu', async () => {
    arriba('/pagina');
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    await navega(element, '/mur');
    const { push, replace } = espies();
    // L'amfitrió obri una entrada seua (un filtre, una pestanya) sense la nostra clau.
    await act(async () => { window.history.pushState({ amfitrio: 'filtre' }, '', '/pagina?filtre=1'); });
    expect(on(element)).toBe('/mur');
    expect(push).toHaveBeenCalledTimes(1); // només la de l'amfitrió
    expect(replace).not.toHaveBeenCalled();
    expect(window.history.state).toEqual({ amfitrio: 'filtre' });
    // «Arrere» torna a la nostra entrada, on l'app ja era: res a fer.
    await enrere();
    expect(onEs()).toBe('/pagina#sdp=/mur');
    expect(on(element)).toBe('/mur');
    // I «Avant» torna a la de l'amfitrió: no és nostra i no es toca.
    await avant();
    expect(onEs()).toBe('/pagina?filtre=1');
    expect(window.history.state).toEqual({ amfitrio: 'filtre' });
    expect(on(element)).toBe('/mur');
    expect(replace).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('un oient de popstate de l’amfitrió rep els seus esdeveniments sencers (no es cancel·la ni s’atura res)', async () => {
    arriba('/pagina', { amfitrio: 1 });
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    const rebuts = [];
    const oient = (event) => rebuts.push({ estat: event.state, cancellat: event.defaultPrevented });
    window.addEventListener('popstate', oient);
    try {
      await navega(element, '/mur');
      await enrere();
      expect(rebuts).toEqual([{ estat: { amfitrio: 1, sdp: { ruta: '/xat', i: 0 } }, cancellat: false }]);
    } finally {
      window.removeEventListener('popstate', oient);
    }
  });

  test('dues instàncies: només la primera viu a l’historial; la segona navega en memòria i no segueix el popstate', async () => {
    arriba('/pagina');
    const primera = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    const segona = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/pobles' });
    const { push, replace } = espies();
    await navega(segona, '/mercat');
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(onEs()).toBe('/pagina#sdp=/xat');
    await navega(primera, '/mur');
    expect(push).toHaveBeenCalledTimes(1);
    await enrere();
    expect(on(primera)).toBe('/xat');
    expect(on(segona)).toBe('/mercat');
    // El salt numèric de la segona és el seu, en memòria: l'historial del navegador no es mou.
    await navega(segona, -1);
    expect(on(segona)).toBe('/pobles');
    expect(onEs()).toBe('/pagina#sdp=/xat');
  });

  test('el botó «Arrere» de l’app (navigate(-1)) va per l’historial del navegador i no passa de la primera entrada pròpia', async () => {
    arriba('/pagina');
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    await navega(element, '/mur');
    await navega(element, '/pobles/sella');
    const va = vi.spyOn(window.history, 'go');
    await act(async () => { sondes.navega.get(element)(-1); await pausa(20); });
    expect(va).toHaveBeenLastCalledWith(-1);
    expect(on(element)).toBe('/mur');
    expect(onEs()).toBe('/pagina#sdp=/mur');
    // Un salt més llarg que el que hi ha darrere es queda a la primera pantalla.
    await act(async () => { sondes.navega.get(element)(-5); await pausa(20); });
    expect(va).toHaveBeenLastCalledWith(-1);
    expect(on(element)).toBe('/xat');
    // I des de la primera, el botó de l'app no trau ningú del portal.
    va.mockClear();
    await act(async () => { sondes.navega.get(element)(-1); await pausa(20); });
    expect(va).not.toHaveBeenCalled();
    expect(onEs()).toBe('/pagina#sdp=/xat');
  });

  test('l’estat de cada entrada (navigate(to, { state })) torna amb «Arrere», sense passar per history.state', async () => {
    arriba('/pagina');
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/salut' });
    await navega(element, '/salut?apunt=nou', { state: { salutFormulari: 1 } });
    await navega(element, '/salut?apunt=nou&pas=2', { state: { salutFormulari: 2 } });
    expect(sondes.estat.get(element)).toEqual({ salutFormulari: 2 });
    expect(JSON.stringify(window.history.state)).not.toContain('salutFormulari');
    await enrere();
    expect(on(element)).toBe('/salut?apunt=nou');
    expect(sondes.estat.get(element)).toEqual({ salutFormulari: 1 });
    await enrere();
    expect(sondes.estat.get(element)).toBeNull();
    await salta(2);
    expect(sondes.estat.get(element)).toEqual({ salutFormulari: 2 });
    // El formulari es tanca tornant arrere les entrades que ha empès (Diari.jsx).
    await act(async () => { sondes.navega.get(element)(-2); await pausa(20); });
    expect(on(element)).toBe('/salut');
    expect(estatPropi()).toEqual({ ruta: '/salut', i: 0 });
  });

  test('recàrrega a mitjan camí: l’element nou reprén l’entrada on era i «Arrere» continua dins de l’app', async () => {
    arriba('/pagina');
    const primer = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    await navega(primer, '/mur');
    await navega(primer, '/pobles/sella');
    await act(async () => { primer.remove(); primer._desmuntaAra(); });
    const { push } = espies();
    const nou = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    expect(on(nou)).toBe('/pobles/sella');
    expect(push).not.toHaveBeenCalled();
    expect(estatPropi()).toEqual({ ruta: '/pobles/sella', i: 2 });
    await enrere();
    expect(on(nou)).toBe('/mur');
    await act(async () => { sondes.navega.get(nou)(-1); await pausa(20); });
    expect(on(nou)).toBe('/xat');
  });

  test('bfcache: en tornar la pàgina de la memòria cau (pageshow persisted), l’app es posa on diu la URL', async () => {
    arriba('/pagina');
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    const { push } = espies();
    await act(async () => {
      window.history.replaceState(null, '', '/pagina#sdp=/mur');
      window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
    });
    expect(on(element)).toBe('/mur');
    expect(push).not.toHaveBeenCalled();
    // Una càrrega normal (persisted: false) no mou res.
    await act(async () => {
      window.history.replaceState(null, '', '/pagina#sdp=/pobles');
      window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: false }));
    });
    expect(on(element)).toBe('/mur');
  });

  test('un enllaç de l’amfitrió a «#sdp=/mur» (o el fragment escrit a mà) és una entrada més: l’app hi va i «Arrere» en torna', async () => {
    arriba('/pagina');
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    const { push } = espies();
    await act(async () => {
      window.location.hash = '#sdp=/mur';
      await pausa(20);
    });
    expect(on(element)).toBe('/mur');
    expect(push).not.toHaveBeenCalled(); // l'entrada l'ha oberta el navegador; l'app només l'adopta
    await enrere();
    expect(on(element)).toBe('/xat');
    expect(onEs()).toBe('/pagina#sdp=/xat');
  });

  test('fragment de l’amfitrió que no és clau=valor: no s’escriu res a l’historial i el salt numèric és en memòria', async () => {
    arriba('/pagina#seccio');
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { push, replace } = espies();
    const va = vi.spyOn(window.history, 'go');
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    await navega(element, '/mur');
    await navega(element, -1);
    expect(on(element)).toBe('/xat');
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(va).not.toHaveBeenCalled();
    expect(onEs()).toBe('/pagina#seccio');
    expect(avis).toHaveBeenCalledTimes(1);
  });

  /* ── Correccions de la refutació (261011) ─────────────────────────────── */

  /* D1 · Safari talla a 100 escriptures per 30 s i un document d'origen opac
     les rebutja totes (SecurityError). Una excepció dins de l'efecte del
     reflex pujava a l'ErrorBoundary de l'arrel i desmuntava l'app sencera,
     sessió inclosa. */
  test('D1 · si el navegador rebutja pushState, l’app continua muntada i navega en memòria, també arrere', async () => {
    arriba('/pagina');
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(window.history, 'pushState').mockImplementation(() => { throw new DOMException('x', 'SecurityError'); });
    const va = vi.spyOn(window.history, 'go');
    await navega(element, '/mur');
    expect(on(element)).toBe('/mur');
    expect(sondes.muntatges.get(element)).toBe(1);
    expect(errors).not.toHaveBeenCalled();
    expect(onEs()).toBe('/pagina#sdp=/xat'); // l'entrada del navegador és la d'abans
    await navega(element, '/pobles');
    expect(on(element)).toBe('/pobles');
    // El botó «Arrere» de l'app no pot anar per un historial que no s'ha escrit: va per la llista pròpia.
    await navega(element, -1);
    expect(on(element)).toBe('/mur');
    await navega(element, -1);
    expect(on(element)).toBe('/xat');
    expect(va).not.toHaveBeenCalled();
    expect(avis).toHaveBeenCalledTimes(1);
    // Cap pantalla d'error de l'ErrorBoundary: l'arrel només porta el full d'estils.
    expect(element._closedRoot.querySelector('.sdp-root').textContent).toBe('');
  });

  test('D1 · si el navegador rebutja replaceState ja en muntar, l’element munta igual', async () => {
    arriba('/pagina');
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => { throw new DOMException('x', 'SecurityError'); });
    vi.spyOn(window.history, 'pushState').mockImplementation(() => { throw new DOMException('x', 'SecurityError'); });
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    await navega(element, '/mur');
    await navega(element, -1);
    expect(on(element)).toBe('/xat');
    expect(sondes.muntatges.get(element)).toBe(1);
    expect(errors).not.toHaveBeenCalled();
    expect(avis).toHaveBeenCalledTimes(1);
  });

  /* D2 · L'entrada actual pot no portar l'estat propi (l'amfitrió n'ha obert
     una de seua). La navegació següent l'adopta, i el botó «Arrere» de l'app
     ha de continuar tornant a la pantalla d'abans. */
  test('D2 · després d’una entrada de l’amfitrió, el botó «Arrere» de l’app continua tornant a la pantalla d’abans', async () => {
    arriba('/pagina');
    const element = await munta({ 'ruta-a-url': 'parametre', 'ruta-inicial': '/xat' });
    await navega(element, '/mur');
    await act(async () => { window.history.pushState({ x: 1 }, '', '/pagina?f=1'); });
    await navega(element, '/pobles');
    expect(onEs()).toBe('/pagina?f=1&sdp=/pobles');
    expect(window.history.state).toEqual({ x: 1, sdp: { ruta: '/pobles', i: 1 } });
    await act(async () => { sondes.navega.get(element)(-1); await pausa(20); });
    expect(on(element)).toBe('/mur');
    expect(onEs()).toBe('/pagina?sdp=/mur');
    await act(async () => { sondes.navega.get(element)(-1); await pausa(20); });
    expect(on(element)).toBe('/xat');
  });

  test('D2 · un enllaç de l’amfitrió a un ancoratge (#tab=2) en mode paràmetre no posa el compte a zero', async () => {
    arriba('/pagina');
    const element = await munta({ 'ruta-a-url': 'parametre', 'ruta-inicial': '/xat' });
    await navega(element, '/mur');
    await act(async () => { window.location.hash = '#tab=2'; await pausa(20); });
    expect(window.history.state ?? null).toBeNull(); // l'entrada de l'ancoratge és del navegador
    await navega(element, '/pobles');
    expect(estatPropi()).toEqual({ ruta: '/pobles', i: 3 });
    await act(async () => { sondes.navega.get(element)(-3); await pausa(20); });
    expect(on(element)).toBe('/xat');
    expect(estatPropi()).toEqual({ ruta: '/xat', i: 0 });
  });

  test('D2 · després d’anar i tornar amb el navegador, el botó «Arrere» de l’app a la primera pantalla no salta avant', async () => {
    arriba('/pagina');
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    await navega(element, '/mur');
    await navega(element, '/pobles');
    await enrere();
    await enrere();
    expect(on(element)).toBe('/xat');
    await act(async () => { sondes.navega.get(element)(-1); await pausa(20); });
    expect(on(element)).toBe('/xat');
    expect(onEs()).toBe('/pagina#sdp=/xat');
  });

  /* D3 · LÍMIT CONEGUT. Amb un history.state que no es pot ampliar no hi ha
     on apuntar la posició: el botó «Arrere» de l'app va per la llista pròpia
     i reescriu l'entrada de dalt. La pantalla i la URL són les bones; a
     l'historial del navegador queden dues entrades seguides amb la mateixa
     ruta (una pulsació d'«Arrere» del navegador que no canvia res). */
  test('D3 · estat de l’amfitrió no ampliable: el botó «Arrere» de l’app torna en memòria i deixa una entrada repetida (límit conegut)', async () => {
    arriba('/pagina', 'estat-de-l-amfitrio');
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    await navega(element, '/mur');
    const va = vi.spyOn(window.history, 'go');
    await navega(element, -1);
    expect(va).not.toHaveBeenCalled();
    expect(on(element)).toBe('/xat');
    expect(onEs()).toBe('/pagina#sdp=/xat');
    expect(window.history.state).toBe('estat-de-l-amfitrio');
    va.mockRestore();
    await enrere(); // l'entrada repetida: la mateixa ruta
    expect(on(element)).toBe('/xat');
    expect(onEs()).toBe('/pagina#sdp=/xat');
    await enrere();
    expect(onEs()).toBe('/portada-de-l-amfitrio');
  });

  /* D4 · Una ruta que no s'ha pogut escriure deixa l'app en una pantalla i el
     navegador en l'entrada d'abans: un history.go(-1) des d'ahí saltaria una
     pantalla. */
  test('D4 · una ruta massa llarga no s’escriu, i el botó «Arrere» de l’app torna només una pantalla', async () => {
    arriba('/pagina');
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
    await navega(element, '/mur');
    await navega(element, `/${'a'.repeat(2100)}`);
    expect(onEs()).toBe('/pagina#sdp=/mur');
    expect(avis).toHaveBeenCalledTimes(1);
    const va = vi.spyOn(window.history, 'go');
    await act(async () => { sondes.navega.get(element)(-1); await pausa(20); });
    expect(va).not.toHaveBeenCalled();
    expect(on(element)).toBe('/mur');
    expect(onEs()).toBe('/pagina#sdp=/mur');
  });

  test('sense ruta-a-url, l’element continua en memòria i l’historial de l’amfitrió no es toca', async () => {
    arriba('/pagina');
    const { push, replace } = espies();
    const element = await munta({ 'ruta-inicial': '/xat' });
    await navega(element, '/mur');
    await navega(element, -1);
    expect(on(element)).toBe('/xat');
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(window.history.state).toBeNull();
  });
});
