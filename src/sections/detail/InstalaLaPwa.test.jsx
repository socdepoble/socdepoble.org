/**
 * P1-69 (ordre del Mestre, 261028 20:13; decisions de l'onada 2 del Bloc H) ·
 * Les peces d'InstalaLaPwa.jsx soltes: la guia per agent d'usuari, el mode de
 * l'acció i les ranures de botiga pel ganxo, amb un magatzem nou a cada prova
 * (creaInstalacio). La pàgina sencera es prova a
 * PageDetailSection.descarregues.test.jsx.
 */
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

/* El t() de la interfície: la reserva, llevat de la prova que el canvia per un diccionari (i el torna). */
const ui = vi.hoisted(() => ({ t: (_, reserva) => reserva }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: (...args) => ui.t(...args) })
}));

import { InstalaLaPwa, PAGINA_D_INSTALACIO, esEntradaPropia, etiquetaDeBotiga, guiaDInstalacio, modeDInstalacio, useInstalacioDeLaPagina } from './InstalaLaPwa.jsx';
import { creaInstalacio } from '../../pwa/instalacio.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';

const PLAY = 'https://play.google.com/store/apps/details?id=org.socdepoble.app';
const APP_STORE = 'https://apps.apple.com/app/id1234567890';
const WORDPRESS = 'https://wordpress.org/plugins/socdepoble/';
/* IDEA-60 (T1, prompt 261102_1532) · L'APK signat al domini propi i un enllaç públic de TestFlight. */
const APK = 'https://socdepoble.org/descarregues/socdepoble-android-latest.apk';
const TESTFLIGHT = 'https://testflight.apple.com/join/AbCd1234';
const CLASSE_BOTIGA = 'sdp-boto sdp-boto--secundari sdp-boto--gran';
/* P0-62 bis (08-11-2026; ordre del Mestre al xat de Claude) · L'App Store oberta, amb el botó de marca d'Apple. */
const CLASSE_APP_STORE = 'sdp-boto sdp-boto--marca sdp-boto--apple sdp-boto--gran';
const nav = (userAgent, maxTouchPoints = 0) => ({ userAgent, maxTouchPoints });
/* Res que anuncie una botiga encara tancada, ni cap adreça (decisió del Mestre: cap «pròximament»). */
const BOTIGUES = /Google Play|App Store|WordPress|TestFlight|APK|prompte|aviat|pròximament|https?:/i;
/* Les botigues que no eren obertes l'01-11-2026 (totes menys WordPress.org; des del 08-11-2026, P0-62,
   l'App Store també ho és: les proves amb les ranures de veres en lleven els enllaços abans de mirar-ho). */
const TANCADES = /Google Play|App Store|TestFlight|APK|prompte|aviat|pròximament|https?:/i;

afterEach(cleanup);

describe('guiaDInstalacio (pura)', () => {
  test('per agent d’usuari', () => {
    const casos = [
      ['iPhone Safari', nav('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', 5), 'ios'],
      ['iPhone Chrome', nav('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1', 5), 'ios'],
      ['iPhone Firefox', nav('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/131.0 Mobile/15E148 Safari/605.1.15', 5), 'ios'],
      ['iPad com a Mac, tàctil', nav('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15', 5), 'ios'],
      ['Safari 17 al Mac', nav('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'), 'safari-mac'],
      ['Safari 18 al Mac', nav('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'), 'safari-mac'],
      ['Safari 16 al Mac', nav('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15'), null],
      ['Chrome al Mac', nav('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'), null],
      ['Firefox al Mac', nav('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0'), null],
      ['Edge a Windows', nav('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0'), null],
      ['Firefox a Windows', nav('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0'), null],
      ['Firefox a Android', nav('Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0', 5), 'menu'],
      ['Chrome a Android', nav('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36', 5), 'menu'],
      // El navegador integrat d'una app (WebView, «; wv)»): el seu menú no instal·la res.
      ['Instagram a Android', nav('Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.86 Mobile Safari/537.36 Instagram 352.0.0.36.95 Android', 5), null],
      ['Facebook a Android', nav('Mozilla/5.0 (Linux; Android 13; SM-A536B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.86 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/485.0.0.70.77;]', 5), null]
    ];
    for (const [nom, navegador, esperat] of casos) expect([nom, guiaDInstalacio({ navegador })]).toEqual([nom, esperat]);
  });

  test('sense navigator, o un que llança, no és cap senyal', () => {
    expect(guiaDInstalacio({ navegador: undefined })).toBeNull();
    expect(guiaDInstalacio({ navegador: null })).toBeNull();
    expect(guiaDInstalacio({ navegador: { get userAgent() { throw new Error('res'); } } })).toBeNull();
  });
});

describe('modeDInstalacio (pura)', () => {
  const iphone = nav('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', 5);
  const finestra = (instalada = false) => ({ matchMedia: (consulta) => ({ matches: instalada && consulta === '(display-mode: standalone)' }) });

  test('fora de l’entrada pròpia, res, encara que hi haja oferta o estiga instal·lada', () => {
    for (const motiu of ['sense-captura', 'sense-finestra', 'incrustat', 'nativa', 'context-insegur', undefined]) {
      expect([String(motiu), esEntradaPropia(motiu)]).toEqual([String(motiu), false]);
      expect([String(motiu), modeDInstalacio({ motiu, ofereix: true, instalada: true, finestra: finestra(true), navegador: iphone })]).toEqual([String(motiu), null]);
    }
    for (const motiu of [null, 'mobil', 'sense-suport', 'instalada']) expect([String(motiu), esEntradaPropia(motiu)]).toEqual([String(motiu), true]);
  });

  test('instal·lada primer, després l’oferta, després la guia', () => {
    expect(modeDInstalacio({ motiu: 'instalada', ofereix: false, finestra: finestra() })).toBe('instalada');
    // Instal·lada en esta càrrega (estaInstalada del magatzem), també des d'una altra pàgina.
    expect(modeDInstalacio({ motiu: null, ofereix: true, instalada: true, finestra: finestra() })).toBe('instalada');
    expect(modeDInstalacio({ motiu: 'mobil', instalada: true, finestra: finestra() })).toBe('instalada');
    expect(modeDInstalacio({ motiu: 'sense-suport', finestra: finestra(), navegador: { ...iphone, standalone: true } })).toBe('instalada');
    expect(modeDInstalacio({ motiu: null, ofereix: true, finestra: finestra(true) })).toBe('instalada');
    expect(modeDInstalacio({ motiu: null, ofereix: true, finestra: finestra() })).toBe('directa');
    expect(modeDInstalacio({ motiu: 'mobil', ofereix: true, finestra: finestra() })).toBe('directa');
    expect(modeDInstalacio({ motiu: null, ofereix: false, finestra: finestra() })).toBe('menu');
    expect(modeDInstalacio({ motiu: 'mobil', finestra: finestra() })).toBe('menu');
    // Un navegador integrat d'Android que sí escolta l'esdeveniment: cap guia del menú.
    const instagram = nav('Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.86 Mobile Safari/537.36 Instagram 352.0.0.36.95 Android', 5);
    for (const motiu of [null, 'mobil']) expect(modeDInstalacio({ motiu, finestra: finestra(), navegador: instagram })).toBeNull();
    expect(modeDInstalacio({ motiu: 'sense-suport', finestra: finestra(), navegador: iphone })).toBe('ios');
    expect(modeDInstalacio({ motiu: 'sense-suport', finestra: finestra(), navegador: nav('Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0') })).toBeNull();
    expect(modeDInstalacio()).toBeNull();
  });
});

/* Les ranures de botiga, pel ganxo de la pàgina amb un magatzem nou. Un
   «Firefox d'escriptori» de l'entrada pròpia: cap mode d'instal·lar, de
   manera que només es veuen les botigues. */
function Ranures({ canals, capturat = true }) {
  const magatzem = creaInstalacio();
  if (capturat) magatzem.captura({ finestra: { addEventListener() {} }, navegador: {} });
  const instalacio = useInstalacioDeLaPagina(PAGINA_D_INSTALACIO, { magatzem, ...(canals ? { canals } : null) });
  return <div data-testid="ranura">{instalacio ? <InstalaLaPwa instalacio={instalacio} /> : null}</div>;
}
const ranura = () => document.querySelector('[data-testid="ranura"]');

describe('les ranures de botiga', () => {
  /* 01-11-2026 (ordre del Mestre 261101_0311, T1) · Amb les ranures de veres
     (CANALS_DE_BOTIGA), només WordPress.org és obert: un sol enllaç, a la
     fitxa del connector, i res de les botigues mòbils, que continuen tancades.
     P0-62 (08-11-2026) · L'App Store també és oberta: «Disponible a l'App
     Store» a la fitxa de veres, davant de WordPress.org; Google Play, l'APK i
     TestFlight, res. */
  test('hui, l’App Store i WordPress.org: un enllaç a cada fitxa i cap botiga tancada ni «pròximament»', () => {
    render(<Ranures />);
    const enllacos = [...ranura().querySelectorAll('a')];
    expect(enllacos.map((a) => [a.getAttribute('href'), a.className, a.textContent])).toEqual([
      ['https://apps.apple.com/es/app/s%C3%B3c-de-poble/id6826441844', CLASSE_APP_STORE, "Disponible a l'App Store"],
      [WORDPRESS, CLASSE_BOTIGA, 'WordPress.org']
    ]);
    expect(enllacos.map((a) => a.parentElement.className)).toEqual(['sdp-accions', 'sdp-accions']);
    // P0-62 bis · El logotip d'Apple (LogotipsDeMarca.jsx), decoratiu: el nom és el text visible.
    const logotip = enllacos[0].querySelector('svg.sdp-boto__logotip--apple');
    expect([logotip?.getAttribute('aria-hidden'), enllacos[0].firstElementChild === logotip, enllacos[1].querySelector('svg')]).toEqual(['true', true, null]);
    // Sense manera d'instal·lar-la (Firefox d'escriptori): cap botó, només les botigues obertes.
    expect(ranura().querySelectorAll('button')).toHaveLength(0);
    expect(ranura().textContent).toBe("Disponible a l'App StoreWordPress.org");
    // Fora dels enllaços de les botigues obertes, cap botiga tancada ni cap «pròximament».
    const senseEnllacos = ranura().cloneNode(true);
    senseEnllacos.querySelectorAll('a').forEach((a) => a.remove());
    expect(TANCADES.test(senseEnllacos.textContent)).toBe(false);
    expect(ranura().textContent).not.toMatch(/Google Play|TestFlight|APK|prompte|aviat|pròximament/i);
  });

  test('amb totes les ranures tancades, no pinta res, ni un enllaç ni cap «pròximament»', () => {
    render(<Ranures canals={[
      { id: 'google-play', nom: 'Google Play', url: null },
      { id: 'app-store', nom: 'App Store', url: null },
      { id: 'apk-directe', nom: 'APK directe', url: null },
      { id: 'testflight', nom: 'TestFlight', url: null },
      { id: 'wordpress-org', nom: 'WordPress.org', url: null }
    ]} />);
    expect(ranura().childNodes).toHaveLength(0);
  });

  test('un canal amb l’adreça pública pinta exactament un enllaç, un botó normal', () => {
    render(<Ranures canals={[{ id: 'google-play', nom: 'Google Play', url: PLAY }, { id: 'app-store', nom: 'App Store', url: null }]} />);
    const enllacos = ranura().querySelectorAll('a');
    expect(enllacos).toHaveLength(1);
    // B9 · Una botiga d'apps diu on és l'app («Disponible a Google Play»), no només el nom.
    expect([enllacos[0].getAttribute('href'), enllacos[0].className, enllacos[0].textContent])
      .toEqual([PLAY, 'sdp-boto sdp-boto--secundari sdp-boto--gran', 'Disponible a Google Play']);
    expect(enllacos[0].parentElement.className).toBe('sdp-accions');
    expect(ranura().querySelectorAll('button')).toHaveLength(0);
  });

  /* B9 (marató 261101_2143) · L'App Store oberta: el mateix botó normal, amb
     «Disponible a l'App Store». El nom accessible és el text visible (cap
     aria-label, WCAG 2.5.3) i l'enllaç s'obri en la mateixa pestanya.
     P0-62 bis (08-11-2026; ordre del Mestre al xat de Claude) · El botó de
     marca d'Apple (classeDeBotiga), no el secundari; la resta, igual. */
  test('l’App Store oberta pinta «Disponible a l’App Store», sense aria-label ni pestanya nova', () => {
    render(<Ranures canals={[
      { id: 'google-play', nom: 'Google Play', url: null },
      { id: 'app-store', nom: 'App Store', url: APP_STORE },
      { id: 'wordpress-org', nom: 'WordPress.org', url: WORDPRESS }
    ]} />);
    const enllacos = [...ranura().querySelectorAll('.sdp-accions > a')];
    expect(enllacos.map((a) => [a.getAttribute('href'), a.className, a.textContent])).toEqual([
      [APP_STORE, CLASSE_APP_STORE, "Disponible a l'App Store"],
      [WORDPRESS, CLASSE_BOTIGA, 'WordPress.org']
    ]);
    for (const a of enllacos) expect([a.hasAttribute('aria-label'), a.hasAttribute('target')]).toEqual([false, false]);
    expect(ranura().textContent).not.toMatch(/beta|TestFlight|prompte|aviat|pròximament/i);
  });

  /* B9 · El botó passa el t() de la interfície a etiquetaDeBotiga: amb la
     interfície en anglés, el text del diccionari de veres, no la reserva valenciana. */
  test('el text de cada botiga ve del t() de la interfície (anglés)', () => {
    const reserva = ui.t;
    ui.t = (clau, text) => EN[clau] || text;
    try {
      render(<Ranures canals={[
        { id: 'google-play', nom: 'Google Play', url: PLAY },
        { id: 'app-store', nom: 'App Store', url: APP_STORE },
        { id: 'wordpress-org', nom: 'WordPress.org', url: WORDPRESS }
      ]} />);
      expect([...ranura().querySelectorAll('.sdp-accions > a')].map((a) => [a.getAttribute('href'), a.textContent])).toEqual([
        [PLAY, 'Get it on Google Play'],
        [APP_STORE, 'Download on the App Store'],
        [WORDPRESS, 'WordPress.org']
      ]);
    } finally {
      ui.t = reserva;
    }
  });

  test('una adreça de proves internes o d’un altre host no obri el canal', () => {
    render(<Ranures canals={[
      { id: 'google-play', nom: 'Google Play', url: 'https://play.google.com/apps/internaltest/4701234567890' },
      { id: 'app-store', nom: 'App Store', url: 'https://testflight.apple.com/join/ABCDEF12' }
    ]} />);
    expect(ranura().childNodes).toHaveLength(0);
  });

  test('fora de l’entrada pròpia (cap captura), ni les botigues obertes', () => {
    render(<Ranures capturat={false} canals={[{ id: 'google-play', nom: 'Google Play', url: PLAY }]} />);
    expect(ranura().childNodes).toHaveLength(0);
    cleanup();
    // Tampoc la de WordPress.org, la de veres: el paquet autònom (WordPress, Sollutia) no captura.
    render(<Ranures capturat={false} />);
    expect(ranura().childNodes).toHaveLength(0);
  });

  test('una altra pàgina no en té mai', () => {
    function AltraPagina() {
      return <div data-testid="ranura">{useInstalacioDeLaPagina('drets-autor') ? 'sí' : null}</div>;
    }
    render(<AltraPagina />);
    expect(ranura().childNodes).toHaveLength(0);
  });

  /* Revisió adversarial (261028) · Les botigues van només dalt: un sol enllaç
     per botiga a la pàgina. Al final, només l'acció; sense acció, cap div. */
  test('a baix, dins de div.sdp-pagina-accio i sense botigues; sense acció o sense dades, res', () => {
    const canals = [{ id: 'google-play', nom: 'Google Play', url: PLAY }];
    const { container, rerender } = render(<InstalaLaPwa instalacio={{ mode: 'menu', canals }} lloc="baix" />);
    expect(container.firstElementChild.className).toBe('sdp-pagina-accio');
    expect([container.querySelectorAll('button').length, container.querySelectorAll('a').length]).toEqual([1, 0]);
    rerender(<InstalaLaPwa instalacio={{ mode: null, canals }} lloc="baix" />);
    expect(container.childNodes).toHaveLength(0);
    rerender(<InstalaLaPwa instalacio={{ mode: null, canals }} />);
    expect(container.querySelectorAll('.sdp-accions > a')).toHaveLength(1);
    rerender(<InstalaLaPwa instalacio={null} lloc="baix" />);
    expect(container.childNodes).toHaveLength(0);
  });
});

/* IDEA-60 (T1, prompt 261102_1532) · Les dues ranures d'instal·lació
   immediata, obertes en una llista de prova: l'APK és un enllaç amb download
   i, davall, l'enllaç a la suma SHA-256 (un <a> de prosa dins d'un <p>);
   TestFlight, un enllaç i, davall, la guia de dos passos (Alerta sense regió
   viva). Tancades (hui, amb les ranures de veres): res. */
describe('IDEA-60 · instal·lació immediata (APK directe i TestFlight)', () => {
  const RANURES = (obertes = {}) => [
    { id: 'google-play', nom: 'Google Play', url: null },
    { id: 'app-store', nom: 'App Store', url: null },
    { id: 'apk-directe', nom: 'APK directe', url: obertes.apk ?? null },
    { id: 'testflight', nom: 'TestFlight', url: obertes.testflight ?? null },
    { id: 'wordpress-org', nom: 'WordPress.org', url: WORDPRESS }
  ];
  const botons = () => [...ranura().querySelectorAll('.sdp-accions > a')]
    .map((a) => [a.getAttribute('href'), a.className, a.textContent, a.getAttribute('download')]);

  test('l’APK obert: l’enllaç amb download i, davall, el de la suma SHA-256; cap guia', () => {
    render(<Ranures canals={RANURES({ apk: APK })} />);
    expect(botons()).toEqual([
      [APK, CLASSE_BOTIGA, "Descarregar l'APK d'Android", 'socdepoble-android-latest.apk'],
      [WORDPRESS, CLASSE_BOTIGA, 'WordPress.org', null]
    ]);
    const suma = ranura().querySelectorAll(`a[href="${APK}.sha256"]`);
    expect(suma).toHaveLength(1);
    expect([suma[0].parentElement.tagName, suma[0].closest('.sdp-accions'), suma[0].textContent, suma[0].hasAttribute('download'), suma[0].hasAttribute('target')])
      .toEqual(['P', null, 'Comprovar la suma SHA-256 del fitxer', false, false]);
    // La suma va just davall dels botons; cap guia de TestFlight i cap altre enllaç.
    expect(ranura().querySelector('.sdp-accions').nextElementSibling).toBe(suma[0].parentElement);
    expect([ranura().querySelectorAll('ol').length, ranura().querySelectorAll('.sdp-alerta').length, ranura().querySelectorAll('a').length]).toEqual([0, 0, 3]);
    expect(ranura().textContent).not.toMatch(/TestFlight|Google Play|App Store|prompte|aviat|pròximament/i);
  });

  test('TestFlight obert: l’enllaç i, davall, la guia de dos passos sense regió viva; cap suma ni download', () => {
    render(<Ranures canals={RANURES({ testflight: TESTFLIGHT })} />);
    expect(botons()).toEqual([
      [TESTFLIGHT, CLASSE_BOTIGA, "Provar-la a l'iPhone i a l'iPad amb TestFlight", null],
      [WORDPRESS, CLASSE_BOTIGA, 'WordPress.org', null]
    ]);
    const guia = ranura().querySelector('.sdp-alerta');
    expect([guia.className, guia.hasAttribute('role'), ranura().querySelector('.sdp-accions').nextElementSibling]).toEqual(['sdp-alerta sdp-alerta--info', false, guia]);
    expect([...guia.querySelectorAll('ol > li')].map((pas) => pas.textContent)).toEqual([
      "Instal·la l'app TestFlight d'Apple des de l'App Store.",
      "Obri l'enllaç de TestFlight i prem «Accepta» per a instal·lar Sóc de Poble."
    ]);
    expect([ranura().querySelectorAll('a[download]').length, ranura().querySelectorAll('a[href$=".sha256"]').length, ranura().querySelectorAll('a').length]).toEqual([0, 0, 2]);
    expect(ranura().textContent).not.toMatch(/\bbeta\b|APK|Google Play|prompte|aviat|pròximament/i);
  });

  test('les dues obertes: l’ordre de la llista, i la suma i la guia darrere dels botons', () => {
    render(<Ranures canals={RANURES({ apk: APK, testflight: TESTFLIGHT })} />);
    expect(botons().map((boto) => boto[0])).toEqual([APK, TESTFLIGHT, WORDPRESS]);
    const fills = [...ranura().children].map((fill) => fill.tagName + (fill.className ? `.${fill.className.split(' ')[0]}` : ''));
    expect(fills).toEqual(['DIV.sdp-accions', 'P', 'DIV.sdp-alerta']);
  });

  test('la mateixa adreça de TestFlight obri la seua ranura i no la de l’App Store; l’APK amb query, tancat', () => {
    render(<Ranures canals={[
      { id: 'app-store', nom: 'App Store', url: TESTFLIGHT },
      { id: 'apk-directe', nom: 'APK directe', url: `${APK}?v=2` },
      { id: 'testflight', nom: 'TestFlight', url: TESTFLIGHT }
    ]} />);
    expect(botons().map((boto) => [boto[0], boto[2]])).toEqual([[TESTFLIGHT, "Provar-la a l'iPhone i a l'iPad amb TestFlight"]]);
    expect(ranura().querySelectorAll('a')).toHaveLength(1);
  });

  test('el text ve del t() de la interfície (anglés): els botons, la suma i la guia', () => {
    const reserva = ui.t;
    ui.t = (clau, text) => EN[clau] || text;
    try {
      render(<Ranures canals={RANURES({ apk: APK, testflight: TESTFLIGHT })} />);
      expect(botons().map((boto) => boto[2])).toEqual(['Download the Android APK', 'Try it on iPhone and iPad with TestFlight', 'WordPress.org']);
      expect(ranura().querySelector(`a[href="${APK}.sha256"]`).textContent).toBe("Check the file's SHA-256 checksum");
      expect([...ranura().querySelectorAll('ol > li')].map((pas) => pas.textContent)).toEqual([
        "Install Apple's TestFlight app from the App Store.",
        'Open the TestFlight link and tap “Accept” to install Sóc de Poble.'
      ]);
    } finally {
      ui.t = reserva;
    }
  });

  test('a baix, ni la suma ni la guia; amb les ranures de veres (tancades), res que les nomene', () => {
    const canals = [{ id: 'apk-directe', nom: 'APK directe', url: APK }, { id: 'testflight', nom: 'TestFlight', url: TESTFLIGHT }];
    const { container } = render(<InstalaLaPwa instalacio={{ mode: 'menu', canals }} lloc="baix" />);
    expect([container.querySelectorAll('a').length, container.querySelectorAll('ol').length, container.querySelectorAll('.sdp-alerta').length]).toEqual([0, 0, 0]);
    cleanup();
    render(<Ranures />);
    // P0-62 · Dos enllaços (l'App Store i WordPress.org), cap download, cap guia ni cap suma.
    expect([ranura().querySelectorAll('a').length, ranura().querySelectorAll('a[download]').length, ranura().querySelectorAll('ol').length, ranura().querySelectorAll('p').length])
      .toEqual([2, 0, 0, 0]);
    expect(ranura().textContent).not.toMatch(/Google Play|TestFlight|APK|prompte|aviat|pròximament|https?:/i);
  });
});

/* Revisió adversarial (261028) · La decisió d'honestedat (cap botiga tancada,
   cap «pròximament») val per a TOTS els modes i els dos llocs, amb la guia
   oberta: no només per a Chrome amb l'oferta. */
describe('honestedat de cada mode', () => {
  test('cap mode porta cap enllaç ni anuncia cap botiga, ni dalt ni baix, ni amb la guia oberta', () => {
    for (const mode of ['directa', 'ios', 'safari-mac', 'menu', 'instalada']) {
      for (const lloc of ['dalt', 'baix']) {
        const { container } = render(<InstalaLaPwa instalacio={{ mode, instala: () => Promise.resolve('no-disponible'), canals: [] }} lloc={lloc} />);
        const boto = container.querySelector('button[aria-expanded]');
        if (boto) fireEvent.click(boto);
        expect([mode, lloc, boto ? boto.getAttribute('aria-expanded') : 'sense guia']).toEqual([mode, lloc, mode === 'directa' || mode === 'instalada' ? 'sense guia' : 'true']);
        expect([mode, lloc, container.querySelectorAll('a').length]).toEqual([mode, lloc, 0]);
        expect([mode, lloc, BOTIGUES.test(container.textContent)]).toEqual([mode, lloc, false]);
        cleanup();
      }
    }
  });
});

/* Revisió adversarial (261028) · La pàgina ja no s'obri dins de l'app nativa
   (nomesWeb); la guarda del ganxo és la defensa en profunditat i també es
   prova sola: amb captura i oferta, dins de l'app nativa no torna res. */
describe('el ganxo dins de l’app nativa', () => {
  test('amb captura i oferta, fora de l’app torna directa; dins, null', () => {
    const magatzem = creaInstalacio();
    const escoltes = new Map();
    const finestra = { isSecureContext: true, onbeforeinstallprompt: null, addEventListener: (tipus, funcio) => escoltes.set(tipus, funcio), removeEventListener() {} };
    finestra.self = finestra;
    finestra.top = finestra;
    magatzem.captura({ finestra, navegador: {} });
    escoltes.get('beforeinstallprompt')({ preventDefault() {}, prompt: () => Promise.resolve({ outcome: 'dismissed' }) });
    let vist = 'sense pintar';
    function Sonda() {
      vist = useInstalacioDeLaPagina(PAGINA_D_INSTALACIO, { magatzem });
      return null;
    }
    render(<Sonda />);
    expect(vist?.mode).toBe('directa');
    cleanup();
    window.Capacitor = { isNativePlatform: () => true };
    try {
      render(<Sonda />);
      expect(vist).toBeNull();
    } finally {
      delete window.Capacitor;
    }
  });
});

/* B9 (marató 261101_2143) · etiquetaDeBotiga, pura: la clau de cada botiga
   d'apps en les cinc llengües (amb els diccionaris de veres) i la mateixa
   reserva que el valor valencià; la resta, el nom del canal. */
describe('etiquetaDeBotiga (pura)', () => {
  test('cinc llengües per a Google Play i l’App Store; WordPress.org i un canal desconegut, el nom', () => {
    const esperats = [
      ['ca', CA, 'Disponible a Google Play', "Disponible a l'App Store"],
      ['es', ES, 'Disponible en Google Play', 'Disponible en el App Store'],
      ['en', EN, 'Get it on Google Play', 'Download on the App Store'],
      ['eu', EU, 'Eskuragarri Google Play-n', 'Eskuragarri App Store-n'],
      ['gl', GL, 'Dispoñible en Google Play', 'Dispoñible na App Store']
    ];
    for (const [codi, dicc, play, store] of esperats) {
      const t = (clau, reserva) => dicc[clau] || reserva;
      expect([codi, etiquetaDeBotiga({ id: 'google-play', nom: 'Google Play' }, t), etiquetaDeBotiga({ id: 'app-store', nom: 'App Store' }, t)])
        .toEqual([codi, play, store]);
      expect([codi, etiquetaDeBotiga({ id: 'wordpress-org', nom: 'WordPress.org' }, t)]).toEqual([codi, 'WordPress.org']);
    }
    // Sense traducció, la reserva és el valor valencià, caràcter a caràcter (Llei del Píxel).
    const reserva = (_, text) => text;
    expect([etiquetaDeBotiga({ id: 'google-play' }, reserva), etiquetaDeBotiga({ id: 'app-store' }, reserva)])
      .toEqual([CA['section.descarregues.botiga.googlePlay'], CA['section.descarregues.botiga.appStore']]);
    expect([etiquetaDeBotiga({ id: 'apk', nom: 'APK' }, reserva), etiquetaDeBotiga(null, reserva), etiquetaDeBotiga({ id: 'x' }, reserva)])
      .toEqual(['APK', '', '']);
  });

  /* IDEA-60 (T1, prompt 261102_1532) · Les dues ranures d'instal·lació
     immediata, en les cinc llengües (amb els diccionaris de veres), i la
     reserva és el valor valencià, caràcter a caràcter. Les tres claus més del
     bloc (la suma i els dos passos) són als cinc diccionaris, traduïdes. */
  test('cinc llengües per a l’APK directe i TestFlight; la reserva és el valor valencià', () => {
    const esperats = [
      ['ca', CA, "Descarregar l'APK d'Android", "Provar-la a l'iPhone i a l'iPad amb TestFlight"],
      ['es', ES, 'Descargar el APK de Android', 'Probarla en el iPhone y el iPad con TestFlight'],
      ['en', EN, 'Download the Android APK', 'Try it on iPhone and iPad with TestFlight'],
      ['eu', EU, 'Deskargatu Androiderako APKa', 'Probatu iPhonean eta iPadean TestFlight-ekin'],
      ['gl', GL, 'Descargar o APK de Android', 'Probala no iPhone e no iPad con TestFlight']
    ];
    for (const [codi, dicc, apk, testflight] of esperats) {
      const t = (clau, reserva) => dicc[clau] || reserva;
      expect([codi, etiquetaDeBotiga({ id: 'apk-directe', nom: 'APK directe' }, t), etiquetaDeBotiga({ id: 'testflight', nom: 'TestFlight' }, t)])
        .toEqual([codi, apk, testflight]);
    }
    const reserva = (_, text) => text;
    expect([etiquetaDeBotiga({ id: 'apk-directe' }, reserva), etiquetaDeBotiga({ id: 'testflight' }, reserva)])
      .toEqual([CA['section.descarregues.botiga.apk'], CA['section.descarregues.botiga.testflight']]);
    for (const clau of ['section.descarregues.botiga.apkSuma', 'section.descarregues.guia.testflight.pas1', 'section.descarregues.guia.testflight.pas2']) {
      expect([clau, typeof CA[clau]]).toEqual([clau, 'string']);
      for (const [codi, dicc] of [['es', ES], ['en', EN], ['eu', EU], ['gl', GL]]) {
        expect([clau, codi, typeof dicc[clau], dicc[clau] === CA[clau]]).toEqual([clau, codi, 'string', false]);
      }
    }
  });
});
