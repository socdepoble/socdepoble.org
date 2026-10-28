/**
 * Ordre del Mestre (261026_2126; prompt i pla 261026_2130, tasca 1; P1-38) ·
 * «Descàrregues i Aplicacions» a /page/descarregues, de punta a punta, amb la
 * UniversalPage i el PageFrame de veres (PageDetailSection):
 *  · l'H1 és el títol del Mestre i la capçalera, la il·lustració de la pàgina
 *    (1024×1024, amb prioritat alta, com El Xat);
 *  · el cos porta un apartat per a cada camí (Android, iPhone i iPad,
 *    l'ordinador) i un per a la visió, amb els subapartats en H4 i H5.
 * Revisió (261026_2126, segona volta) · L'adreça curta /descarregues ja no es
 * redeclara ací (passava encara que App.jsx no la tinguera): la prova amb
 * l'app de veres és src/app/App.descarregues.test.jsx.
 * P1-69 (ordre del Mestre, 261028 20:13; deroga per a esta pàgina el «cap
 * botó gran, ni dalt ni baix» de P1-38) · «📲 Instal·lar l'App (PWA)» DALT I
 * AL FINAL, com la Consola (InstalaLaPwa.jsx), sense tocar cap byte del cos:
 *  · Chromium amb l'oferta: el clic crida prompt() una volta, dins del clic,
 *    i la pàgina en reflectix el resultat;
 *  · Safari (iPhone, iPad i Mac) i Chromium sense oferta: la guia;
 *  · ja instal·lada: l'avís d'èxit i cap botó;
 *  · Firefox d'escriptori, fora de l'entrada pròpia (paquet autònom) o en un
 *    iframe: res, ni cap div buit;
 *  · les ranures de botiga, tancades: cap enllaç.
 * L'entrada pròpia (src/main.jsx) crida la captura amb la finestra de veres;
 * ací, amb una de mostra (jsdom no té l'esdeveniment, com Safari i Firefox).
 * Revisió adversarial (261028) · senseBotigues() a cada escenari (amb la
 * guia oberta), la instal·lació feta en una altra pàgina, Safari dins d'un
 * iframe, el navegador integrat d'Android, la guia que no es plega sola, un
 * sol avís viu, el focus després d'«accepted» i un sol enllaç per botiga
 * oberta a la pàgina. Les botigues són les de veres (canalsDeBotiga.js),
 * copiades en una llista que només la prova de la botiga oberta canvia.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from '../../app/contexts/RouterContext';

const botigues = vi.hoisted(() => ({ llista: null }));
vi.mock('../../config/canalsDeBotiga.js', async (importOriginal) => {
  const real = await importOriginal();
  botigues.llista = [...real.CANALS_DE_BOTIGA];
  return { ...real, CANALS_DE_BOTIGA: botigues.llista };
});
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: (_, reserva) => reserva })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', pages: [], pageCopy: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));

import PageDetailSection from './PageDetailSection.jsx';
import { TITOL_INSTRUCCIONS } from './InstalaLaPwa.jsx';
import { PAGE_COPY } from '../text/pageContent.js';
import { INSTALACIO } from '../../pwa/instalacio.js';

const visita = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <Routes>
      <Route path="/page/:slug" element={<PageDetailSection />} />
      <Route path="/" element={<p data-testid="inici">Inici</p>} />
    </Routes>
  </MemoryRouter>
);
const capcalera = () => document.querySelector('header.page-title');
const article = () => document.querySelector('article.content-wrapper');
const cos = () => document.querySelector('.cms-preview');
const dalt = () => capcalera().querySelector(':scope > .page-title-accio');
const baix = () => article().querySelector(':scope > .sdp-pagina-accio');
const INSTALAR = "Instal·lar l'App (PWA)";
const INSTALADA = 'Aplicació ja instal·lada en aquest dispositiu';
const CLASSE = 'sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple';
const PLAY = 'https://play.google.com/store/apps/details?id=org.socdepoble.app';

/* Decisió d'honestedat: a les zones d'acció, cap enllaç ni res que anuncie
   una botiga tancada (ni «pròximament»), en cap escenari. */
function senseBotigues() {
  const zones = [dalt(), baix()].filter(Boolean);
  for (const zona of zones) {
    expect(zona.querySelectorAll('a')).toHaveLength(0);
    expect(zona.textContent).not.toMatch(/Google Play|App Store|WordPress|TestFlight|APK|prompte|aviat|pròximament|https?:/i);
  }
  return zones.length;
}
/* Obri la guia (si el botó en té) i comprova les zones. */
function ambLaGuiaOberta() {
  const boto = screen.queryAllByRole('button', { name: INSTALAR })[0];
  if (boto?.getAttribute('aria-expanded') === 'false') fireEvent.click(boto);
  return senseBotigues();
}

const AGENTS = {
  chromeMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ipadEscriptori: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  safariMac17: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  safariMac16: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
  firefoxWindows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  instagramAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.86 Mobile Safari/537.36 Instagram 352.0.0.36.95 Android'
};

/* L'agent d'usuari del navigator de jsdom, com el d'un navegador de veres. */
function ambAgent(agent, { tactil = 0 } = {}) {
  Object.defineProperty(window.navigator, 'userAgent', { value: agent, configurable: true });
  Object.defineProperty(window.navigator, 'maxTouchPoints', { value: tactil, configurable: true });
}

/* La captura de l'entrada pròpia amb una finestra de mostra: Chromium (amb
   l'esdeveniment, a escriptori o al mòbil), Safari o Firefox (sense) o un
   iframe. Torna la funció que dispara l'oferta. */
let entrada = null;
function entradaPropia({ suport = true, mobil = false, incrustat = false } = {}) {
  const escoltes = new Map();
  const finestra = {
    isSecureContext: true,
    matchMedia: () => ({ matches: false }),
    addEventListener: (tipus, funcio) => escoltes.set(tipus, funcio),
    removeEventListener: (tipus) => escoltes.delete(tipus)
  };
  if (suport) finestra.onbeforeinstallprompt = null;
  finestra.self = finestra;
  finestra.top = incrustat ? {} : finestra;
  const captura = INSTALACIO.captura({ finestra, navegador: { userAgentData: { mobile: mobil } } });
  entrada = { escoltes, captura };
  return {
    ofereix: (e) => act(() => { escoltes.get('beforeinstallprompt')(e); }),
    // El navegador avisa que s'ha instal·lat: pel botó, pel seu menú o per la seua oferta pròpia.
    instalada: () => act(() => { escoltes.get('appinstalled')({}); })
  };
}
const oferta = (outcome = 'accepted') => ({ preventDefault: vi.fn(), prompt: vi.fn(() => Promise.resolve({ outcome, platform: 'web' })) });

afterEach(() => {
  cleanup();
  // Cap oferta ni cap escolta per a la prova següent, i el magatzem, com fora de l'entrada pròpia.
  entrada?.escoltes.get('appinstalled')?.({});
  entrada?.captura.deixa?.();
  entrada = null;
  INSTALACIO.captura({ finestra: null, navegador: null });
  delete window.navigator.userAgent;
  delete window.navigator.maxTouchPoints;
  vi.unstubAllGlobals();
});

test('/page/descarregues: l’H1 del Mestre, la il·lustració i «📲 Instal·lar l’App (PWA)» dalt i al final', async () => {
  ambAgent(AGENTS.chromeMac);
  const pagina = entradaPropia();
  visita('/page/descarregues');
  await pagina.ofereix(oferta());
  expect(capcalera().querySelector('h1').textContent).toBe('Descàrregues i Aplicacions');
  const hero = document.querySelector('.hero-image img');
  expect([hero.getAttribute('src'), hero.getAttribute('alt')]).toEqual([PAGE_COPY.descarregues.image, PAGE_COPY.descarregues.imageAlt]);
  expect([hero.getAttribute('width'), hero.getAttribute('height'), hero.getAttribute('fetchpriority')]).toEqual(['1024', '1024', 'high']);
  // Dalt: davall de l'H1 i abans del copyright, com el de la Consola.
  const fills = [...capcalera().children].map((fill) => fill.tagName + (fill.className ? `.${fill.className.split(' ')[0]}` : ''));
  const [h1, accio, copyright] = ['H1', 'DIV.page-title-accio', 'P.sp-card-copyright'].map((fill) => fills.indexOf(fill));
  expect([h1 >= 0, accio > h1, copyright > accio]).toEqual([true, true, true]);
  // Baix: l'últim fill de l'article, just darrere del cos.
  expect(article().lastElementChild).toBe(baix());
  expect(baix().previousElementSibling.className).toBe('cms-preview');
  // El mateix botó als dos llocs: blau, gran i ple; amb l'oferta no desplega res.
  const botons = screen.getAllByRole('button', { name: INSTALAR });
  expect(botons).toHaveLength(2);
  expect([dalt().contains(botons[0]), baix().contains(botons[1])]).toEqual([true, true]);
  for (const boto of botons) {
    expect([boto.className, boto.hasAttribute('aria-expanded'), boto.textContent]).toEqual([CLASSE, false, `📲 ${INSTALAR}`]);
  }
  // Les ranures de botiga, tancades: cap enllaç ni dalt ni baix.
  expect(senseBotigues()).toBe(2);
});

test('/page/descarregues: un apartat per a cada camí i un per a la visió, amb H4 i H5 dins', () => {
  visita('/page/descarregues');
  const text = (selector) => [...cos().querySelectorAll(selector)].map((titol) => titol.textContent);
  expect(text('h3')).toEqual([
    'La mateixa aplicació, a cada aparell',
    'Android',
    'iPhone i iPad',
    "A l'ordinador i des de qualsevol navegador",
    'Com funciona per dins: hui i demà'
  ]);
  expect(text('h4')).toEqual(expect.arrayContaining(['Google Play', 'APK directe', 'Apple TestFlight', 'App Store', TITOL_INSTRUCCIONS]));
  expect(text('h5')).toEqual(["A l'ordinador", 'Al mòbil i a la tauleta']);
  // Cap enllaç: ni botigues ni APK encara no són públics per a tothom.
  expect(cos().querySelectorAll('a')).toHaveLength(0);
  // La guia troba les instruccions pel text de l'H4: si el copy el canvia, esta prova ho diu.
  expect(PAGE_COPY.descarregues.html).toContain(`<h4>${TITOL_INSTRUCCIONS}</h4>`);
});

describe('P1-69 · Chromium amb l’oferta', () => {
  test('el clic crida prompt() una volta, dins del clic, i «accepted» deixa l’avís d’instal·lada als dos llocs, un sol viu, amb el focus', async () => {
    ambAgent(AGENTS.chromeMac);
    const pagina = entradaPropia();
    visita('/page/descarregues');
    const e = oferta('accepted');
    await pagina.ofereix(e);
    // El de baix: el focus ha de tornar a SA caixa, no a la primera de la pàgina.
    const ultim = screen.getAllByRole('button', { name: INSTALAR })[1];
    ultim.focus();
    await act(async () => {
      fireEvent.click(ultim);
      // Encara dins del clic: cap await abans de prompt().
      expect(e.prompt).toHaveBeenCalledTimes(1);
    });
    expect(e.preventDefault).toHaveBeenCalledTimes(1);
    expect(screen.queryAllByRole('button', { name: INSTALAR })).toHaveLength(0);
    const avisos = [...document.querySelectorAll('.sdp-alerta--exit')];
    expect(avisos.map((avis) => avis.textContent)).toEqual([INSTALADA, INSTALADA]);
    expect([dalt().contains(avisos[0]), baix().contains(avisos[1])]).toEqual([true, true]);
    expect(avisos[0].className).toBe('sdp-alerta sdp-alerta--exit');
    // Una sola regió viva (la de dalt): el lector no ho anuncia dues voltes.
    expect(avisos.map((avis) => avis.getAttribute('role'))).toEqual(['status', null]);
    // El botó premut ja no hi és: el focus va a l'avís que el substituïx, no al <body>.
    expect(document.activeElement).toBe(avisos[1]);
    expect(avisos[1].getAttribute('tabindex')).toBe('-1');
    expect(senseBotigues()).toBe(2);
  });

  test('instal·lada en una altra pàgina (l’oferta pròpia de Chrome al mòbil), i després Descàrregues: l’avís, cap botó', async () => {
    ambAgent(AGENTS.chromeAndroid, { tactil: 5 });
    const pagina = entradaPropia({ mobil: true });
    await pagina.ofereix(oferta());
    // L'usuari accepta la mini-barra de Chrome estant al Mur: Descàrregues no hi era muntada.
    await pagina.instalada();
    visita('/page/descarregues');
    expect(screen.queryAllByRole('button', { name: INSTALAR })).toHaveLength(0);
    expect([dalt().textContent, baix().textContent]).toEqual([INSTALADA, INSTALADA]);
    expect(senseBotigues()).toBe(2);
  });

  test('instal·lada pel menú del navegador, sense cap oferta guardada, també compta', async () => {
    ambAgent(AGENTS.chromeMac);
    const pagina = entradaPropia();
    await pagina.instalada();
    visita('/page/descarregues');
    expect([dalt().textContent, baix().textContent]).toEqual([INSTALADA, INSTALADA]);
  });

  test('instal·lada amb la pàgina oberta (appinstalled): el botó deixa pas a l’avís', async () => {
    ambAgent(AGENTS.chromeMac);
    const pagina = entradaPropia();
    visita('/page/descarregues');
    await pagina.ofereix(oferta());
    expect(screen.getAllByRole('button', { name: INSTALAR })).toHaveLength(2);
    await pagina.instalada();
    expect(screen.queryAllByRole('button', { name: INSTALAR })).toHaveLength(0);
    expect([dalt().textContent, baix().textContent]).toEqual([INSTALADA, INSTALADA]);
  });

  /* Chrome envia l'oferta quan passa la seua prova d'interés (un clic i uns
     segons): si l'usuari ja havia obert la guia del menú, no es plega sola. */
  test('la guia oberta abans que arribe l’oferta continua oberta; el botó, ara, obri el diàleg', async () => {
    ambAgent(AGENTS.chromeMac);
    const pagina = entradaPropia();
    visita('/page/descarregues');
    const boto = screen.getAllByRole('button', { name: INSTALAR })[0];
    fireEvent.click(boto);
    const guia = document.getElementById(boto.getAttribute('aria-controls'));
    expect(guia.textContent).toMatch(/menú del navegador/);
    expect(senseBotigues()).toBe(2);
    const e = oferta('dismissed');
    await pagina.ofereix(e);
    expect([boto.getAttribute('aria-expanded'), document.getElementById(guia.id)]).toEqual(['true', guia]);
    await act(async () => { fireEvent.click(boto); });
    expect(e.prompt).toHaveBeenCalledTimes(1);
    expect(boto.getAttribute('aria-expanded')).toBe('true');
  });

  test('al mòbil també: l’oferta es guarda sense preventDefault; «dismissed» ho diu i el clic següent obri la guia del menú', async () => {
    ambAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
    const pagina = entradaPropia({ mobil: true });
    visita('/page/descarregues');
    const e = oferta('dismissed');
    await pagina.ofereix(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: INSTALAR })[0]); });
    expect(e.prompt).toHaveBeenCalledTimes(1);
    // Un sol avís, al costat del botó premut (dalt): ni dos anuncis ni un salt al final del cos.
    const cancelades = screen.getAllByRole('status').filter((avis) => /^Instal·lació cancel·lada\./.test(avis.textContent));
    expect(cancelades).toHaveLength(1);
    expect([dalt().contains(cancelades[0]), baix().textContent]).toEqual([true, `📲 ${INSTALAR}`]);
    // L'esdeveniment ja s'ha gastat: el mateix botó desplega ara la guia, sense tornar a cridar prompt().
    const boto = screen.getAllByRole('button', { name: INSTALAR })[0];
    expect(boto.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(boto);
    expect(boto.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(boto.getAttribute('aria-controls')).textContent).toMatch(/menú del navegador/);
    expect(e.prompt).toHaveBeenCalledTimes(1);
    expect(senseBotigues()).toBe(2);
  });
});

describe('P1-69 · Safari: la guia, sense cap prompt()', () => {
  test('iPhone: el botó desplega els dos passos i porta a les instruccions de cada navegador', () => {
    ambAgent(AGENTS.iphone, { tactil: 5 });
    entradaPropia({ suport: false });
    visita('/page/descarregues');
    const boto = screen.getAllByRole('button', { name: INSTALAR })[0];
    expect([boto.getAttribute('aria-expanded'), boto.hasAttribute('aria-controls')]).toEqual(['false', false]);
    fireEvent.click(boto);
    expect(boto.getAttribute('aria-expanded')).toBe('true');
    const guia = document.getElementById(boto.getAttribute('aria-controls'));
    expect(dalt().contains(guia)).toBe(true);
    expect([...guia.querySelectorAll('ol > li')].map((pas) => pas.textContent)).toEqual([
      'Prem Compartir ⬆️ (el quadre amb la fletxa cap amunt).',
      "Toca «Afegeix a la pantalla d'inici»."
    ]);
    // Cap regió viva: és una explicació, i el botó ja diu que s'ha desplegat.
    expect(guia.querySelector('.sdp-alerta').hasAttribute('role')).toBe(false);
    const titol = [...cos().querySelectorAll('h4')].find((h4) => h4.textContent === TITOL_INSTRUCCIONS);
    titol.scrollIntoView = vi.fn();
    expect(senseBotigues()).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: 'Vore les instruccions de cada navegador' }));
    expect(titol.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    expect(document.activeElement).toBe(titol);
    // Un segon clic la plega.
    fireEvent.click(boto);
    expect([boto.getAttribute('aria-expanded'), document.getElementById(guia.id)]).toEqual(['false', null]);
  });

  test('l’iPad que es presenta com a Mac, però tàctil, té la guia de l’iPhone', () => {
    ambAgent(AGENTS.ipadEscriptori, { tactil: 5 });
    entradaPropia({ suport: false });
    visita('/page/descarregues');
    const boto = screen.getAllByRole('button', { name: INSTALAR })[0];
    fireEvent.click(boto);
    expect(document.getElementById(boto.getAttribute('aria-controls')).querySelectorAll('ol > li')).toHaveLength(2);
    expect(senseBotigues()).toBe(2);
  });

  test('el Safari del Mac (17 o posterior): el menú Arxiu i «Afegeix al Dock»; un Safari antic, res', () => {
    ambAgent(AGENTS.safariMac17);
    entradaPropia({ suport: false });
    visita('/page/descarregues');
    const boto = screen.getAllByRole('button', { name: INSTALAR })[0];
    fireEvent.click(boto);
    expect(document.getElementById(boto.getAttribute('aria-controls')).textContent).toContain('menú Arxiu → «Afegeix al Dock»');
    expect(senseBotigues()).toBe(2);
    cleanup();
    ambAgent(AGENTS.safariMac16);
    visita('/page/descarregues');
    expect([dalt(), baix()]).toEqual([null, null]);
  });
});

describe('P1-69 · res que no es puga complir, i cap div buit', () => {
  test('ja instal·lada (display-mode standalone): l’avís d’èxit i cap botó', () => {
    ambAgent(AGENTS.chromeMac);
    vi.stubGlobal('matchMedia', vi.fn((consulta) => ({ matches: consulta === '(display-mode: standalone)' })));
    entradaPropia();
    visita('/page/descarregues');
    expect(screen.queryAllByRole('button', { name: INSTALAR })).toHaveLength(0);
    expect([dalt().textContent, baix().textContent]).toEqual([INSTALADA, INSTALADA]);
    expect(ambLaGuiaOberta()).toBe(2);
  });

  test('Firefox d’escriptori (sense manera d’instal·lar-la): ni el botó ni la ranura', () => {
    ambAgent(AGENTS.firefoxWindows);
    entradaPropia({ suport: false });
    visita('/page/descarregues');
    expect([dalt(), baix()]).toEqual([null, null]);
  });

  test('el navegador integrat d’una app d’Android (Instagram, «; wv)»): el seu menú no instal·la, i no es diu res', () => {
    ambAgent(AGENTS.instagramAndroid, { tactil: 5 });
    entradaPropia({ suport: false });
    visita('/page/descarregues');
    expect([dalt(), baix()]).toEqual([null, null]);
  });

  test('fora de l’entrada pròpia (el paquet autònom no captura) o dins d’un iframe, també amb Safari: res', () => {
    ambAgent(AGENTS.iphone, { tactil: 5 });
    visita('/page/descarregues');
    expect([dalt(), baix()]).toEqual([null, null]);
    cleanup();
    entradaPropia({ incrustat: true });
    visita('/page/descarregues');
    expect([dalt(), baix()]).toEqual([null, null]);
    // Safari no té l'esdeveniment: dins d'un iframe, «Afegeix a la pantalla d'inici» afegiria la pàgina de l'amfitrió.
    for (const [agent, tactil] of [[AGENTS.iphone, 5], [AGENTS.safariMac17, 0]]) {
      cleanup();
      ambAgent(agent, { tactil });
      entradaPropia({ suport: false, incrustat: true });
      visita('/page/descarregues');
      expect([dalt(), baix()]).toEqual([null, null]);
    }
  });

  /* Quan el Mestre òbriga una botiga (una línia de canalsDeBotiga.js): un
     enllaç normal, UNA sola volta a la pàgina (dalt, visible també amb la
     pàgina traduïda), i al final només l'acció. */
  test('una botiga oberta: exactament un enllaç a la pàgina, dalt; amb l’acció o sense', async () => {
    const tancada = botigues.llista[0];
    expect(tancada).toEqual({ id: 'google-play', nom: 'Google Play', url: null });
    botigues.llista[0] = { id: 'google-play', nom: 'Google Play', url: PLAY };
    try {
      ambAgent(AGENTS.chromeMac);
      const pagina = entradaPropia();
      visita('/page/descarregues');
      await pagina.ofereix(oferta());
      const enllacos = document.querySelectorAll(`a[href="${PLAY}"]`);
      expect(enllacos).toHaveLength(1);
      expect([dalt().contains(enllacos[0]), baix().querySelectorAll('a').length]).toEqual([true, 0]);
      expect(screen.getAllByRole('button', { name: INSTALAR })).toHaveLength(2);
      // L'oferta, gastada (una captura nova no la buida: en una càrrega de veres només n'hi ha una).
      await pagina.instalada();
      cleanup();
      // Firefox d'escriptori: cap acció, només la botiga dalt, i cap div buit al final.
      ambAgent(AGENTS.firefoxWindows);
      entradaPropia({ suport: false });
      visita('/page/descarregues');
      expect([document.querySelectorAll(`a[href="${PLAY}"]`).length, dalt().contains(document.querySelector(`a[href="${PLAY}"]`)), baix()]).toEqual([1, true, null]);
    } finally {
      botigues.llista[0] = tancada;
    }
  });

  test('les altres pàgines del sistema no canvien: Drets d’autor continua sense cap acció', () => {
    ambAgent(AGENTS.chromeMac);
    entradaPropia();
    visita('/page/drets-autor');
    expect(capcalera().querySelector('.page-title-accio')).toBeNull();
    expect(document.querySelector('.sdp-pagina-accio')).toBeNull();
  });
});

/* Ordre del Mestre (261027; auditoria Gauntlet R5, G1-01 i G5-01) · Dins de
   l'app nativa (el pont de Capacitor que llig esAppNativa) la pàgina no s'obri:
   nomena Android, Google Play i l'APK (regla 2.3.10 de l'App Store). L'adreça
   curta /descarregues hi porta (App.jsx), i d'ací, a l'inici. Les altres
   pàgines del sistema s'obrin igual. P1-69 · Tampoc no hi ha cap botó
   d'instal·lar. */
test('dins de l’app nativa, /page/descarregues porta a l’inici; Drets d’autor s’obri igual', () => {
  window.Capacitor = { isNativePlatform: () => true };
  try {
    visita('/page/descarregues');
    expect(document.querySelector('[data-testid="inici"]')).not.toBeNull();
    expect(capcalera()).toBeNull();
    expect(document.body.textContent).not.toMatch(/Android|Google Play|APK/);
    expect(screen.queryAllByRole('button', { name: INSTALAR })).toHaveLength(0);
    cleanup();
    visita('/page/drets-autor');
    expect(capcalera().querySelector('h1')).not.toBeNull();
  } finally {
    delete window.Capacitor;
  }
});
