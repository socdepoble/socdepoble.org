/**
 * P1-69 (ordre del Mestre, 261028 20:13; decisions de l'onada 2 del Bloc H) ·
 * Les peces d'InstalaLaPwa.jsx soltes: la guia per agent d'usuari, el mode de
 * l'acció i les ranures de botiga pel ganxo, amb un magatzem nou a cada prova
 * (creaInstalacio). La pàgina sencera es prova a
 * PageDetailSection.descarregues.test.jsx.
 */
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: (_, reserva) => reserva })
}));

import { InstalaLaPwa, PAGINA_D_INSTALACIO, esEntradaPropia, guiaDInstalacio, modeDInstalacio, useInstalacioDeLaPagina } from './InstalaLaPwa.jsx';
import { creaInstalacio } from '../../pwa/instalacio.js';

const PLAY = 'https://play.google.com/store/apps/details?id=org.socdepoble.app';
const nav = (userAgent, maxTouchPoints = 0) => ({ userAgent, maxTouchPoints });
/* Res que anuncie una botiga encara tancada, ni cap adreça (decisió del Mestre: cap «pròximament»). */
const BOTIGUES = /Google Play|App Store|WordPress|TestFlight|APK|prompte|aviat|pròximament|https?:/i;

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
  test('hui, tot tancat: no pinta res, ni un enllaç ni cap «pròximament»', () => {
    render(<Ranures />);
    expect(ranura().childNodes).toHaveLength(0);
  });

  test('un canal amb l’adreça pública pinta exactament un enllaç, un botó normal', () => {
    render(<Ranures canals={[{ id: 'google-play', nom: 'Google Play', url: PLAY }, { id: 'app-store', nom: 'App Store', url: null }]} />);
    const enllacos = ranura().querySelectorAll('a');
    expect(enllacos).toHaveLength(1);
    expect([enllacos[0].getAttribute('href'), enllacos[0].className, enllacos[0].textContent])
      .toEqual([PLAY, 'sdp-boto sdp-boto--secundari sdp-boto--gran', 'Google Play']);
    expect(enllacos[0].parentElement.className).toBe('sdp-accions');
    expect(ranura().querySelectorAll('button')).toHaveLength(0);
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
