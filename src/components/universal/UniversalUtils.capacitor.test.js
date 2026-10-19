/**
 * Fase C (Capacitor 8; ordre del Mestre, 261019) · isSafeUrl admet l'esquema
 * de l'app nativa d'iOS (capacitor:) al costat d'http: i https:, però només
 * quan la pàgina mateixa hi corre i l'adreça és del seu host: els fitxers i
 * les rutes de l'app. A la web i a Android (https://localhost), res no canvia.
 * La finestra es fixa amb vi.stubGlobal, com a BarraTaronja.test.jsx i
 * UniversalCard.vinyeta.test.jsx. Les dues finestres natives ixen de
 * capacitor.config.json: si l'esquema o el host hi canvien, cauen estes proves
 * i no l'app.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { esAvatarSegur, isSafeAsset, isSafeUrl } from './UniversalUtils.js';

const { server: SERVIDOR_NATIU } = JSON.parse(readFileSync(resolve(process.cwd(), 'capacitor.config.json'), 'utf8'));

const finestra = (origin, protocol, host) => Object.freeze({
  origin, protocol, host, hostname: host.split(':')[0], href: `${origin}/mur`, pathname: '/mur', search: '', hash: ''
});
const finestraNativa = (esquema) => finestra(`${esquema}://${SERVIDOR_NATIU.hostname}`, `${esquema}:`, SERVIDOR_NATIU.hostname);

const ORIGENS = Object.freeze({
  web: finestra('https://socdepoble.org', 'https:', 'socdepoble.org'),
  local: finestra('http://localhost:3340', 'http:', 'localhost:3340'),
  android: finestraNativa(SERVIDOR_NATIU.androidScheme),
  ios: finestraNativa(SERVIDOR_NATIU.iosScheme)
});

/* Els camins i les adreces de sempre: valen a totes les finestres. */
const PROPIS = ['/assets/system/ui/x.webp', '/gent/javillinares', '/mur?x=1#punt', 'gent/1', '?pagina=2'];
const EXTERNS = ['https://exemple.org/autora', 'http://exemple.org'];

/* Fora a totes les finestres, també a l'app nativa. */
const SEMPRE_FORA = [
  'javascript:alert(1)', 'JavaScript:alert(1)', 'java\tscript:alert(1)', ' javascript:alert(1)',
  '//altra.example/x', '/\t/altra.example', 'capacitor://altra.example/x', 'capacitor://LOCALHOST/x',
  'capacitor://localhost:8080/x', 'capacitor://pepa:clau@localhost/x', 'capacitor://localhost@altra.example/x',
  'capacitor:x', 'capacitor:///x', 'sdp-media://mitjans/a.webp', 'mailto:pepa@exemple.org',
  'data:text/html,<b>x</b>', 'blob:capacitor://localhost/u', 'file:///etc/passwd', '', null, undefined, 42
];

/* L'app nativa d'iOS: una adreça absoluta del seu host. */
const DE_L_APP_NATIVA = ['capacitor://localhost/assets/x.webp', 'CAPACITOR://localhost/gent/1', 'capacitor://localhost'];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe.each(Object.keys(ORIGENS))('isSafeUrl · finestra %s', (nom) => {
  test('els camins propis i les adreces http(s), com sempre; javascript:, «//» i els altres esquemes, fora', () => {
    vi.stubGlobal('location', ORIGENS[nom]);
    for (const url of [...PROPIS, ...EXTERNS]) expect([url, isSafeUrl(url)]).toEqual([url, true]);
    for (const url of SEMPRE_FORA) expect([url, isSafeUrl(url)]).toEqual([url, false]);
  });

  test('capacitor:// del host de l’app només val si la pàgina corre a l’app nativa d’iOS', () => {
    vi.stubGlobal('location', ORIGENS[nom]);
    for (const url of DE_L_APP_NATIVA) expect([url, isSafeUrl(url)]).toEqual([url, nom === 'ios']);
  });
});

describe('isSafeUrl · l’app nativa d’iOS (capacitor://localhost)', () => {
  test('capacitor.config.json servix l’app d’iOS a capacitor://localhost i l’Android a https://localhost', () => {
    expect([ORIGENS.ios.protocol, ORIGENS.ios.host]).toEqual(['capacitor:', 'localhost']);
    expect([ORIGENS.android.protocol, ORIGENS.android.host]).toEqual(['https:', 'localhost']);
  });

  test('un camí propi es resol a l’esquema natiu i ara passa', () => {
    vi.stubGlobal('location', ORIGENS.ios);
    // La finestra és de veres l'app nativa: un camí propi hi pren l'esquema capacitor:.
    expect(new URL('/gent/1', window.location.origin).protocol).toBe('capacitor:');
    expect(isSafeUrl('/gent/1')).toBe(true);
    expect(isSafeUrl('capacitor://localhost/gent/1')).toBe(true);
  });

  /* Si el WebView donara 'null' com a origen de l'esquema natiu (el parser
     d'URL ho fa), un camí relatiu es resol contra l'adreça de la pàgina. */
  test('amb l’origen «null», un camí propi continua passant; un altre host, no', () => {
    vi.stubGlobal('location', { ...ORIGENS.ios, origin: 'null' });
    for (const url of ['/assets/x.webp', '/gent/1', 'gent/1', '?pagina=2', 'capacitor://localhost/gent/1', 'https://exemple.org/autora']) {
      expect([url, isSafeUrl(url)]).toEqual([url, true]);
    }
    for (const url of ['capacitor://altra.example/x', '//altra.example/x', 'javascript:alert(1)']) {
      expect([url, isSafeUrl(url)]).toEqual([url, false]);
    }
  });

  test('una pàgina capacitor: sense host no admet cap adreça de l’esquema', () => {
    vi.stubGlobal('location', { origin: 'capacitor://', protocol: 'capacitor:', host: '', hostname: '', href: 'capacitor:///mur', pathname: '/mur', search: '', hash: '' });
    for (const url of ['/gent/1', 'capacitor:///gent/1', 'capacitor://localhost/gent/1']) {
      expect([url, isSafeUrl(url)]).toEqual([url, false]);
    }
    expect(isSafeUrl('https://exemple.org/autora')).toBe(true);
  });
});

describe('isSafeAsset i esAvatarSegur · les imatges pròpies a l’app nativa', () => {
  test('iOS: el recurs propi, l’absolut del host de l’app i data:image passen; un altre host o sdp-media://, no', () => {
    vi.stubGlobal('location', ORIGENS.ios);
    for (const url of ['/assets/system/ui/x.webp', 'capacitor://localhost/assets/x.webp', 'data:image/png;base64,iVBORw0KGgo=', 'https://cdn.exemple.org/a.png']) {
      expect([url, isSafeAsset(url)]).toEqual([url, true]);
    }
    for (const url of ['capacitor://altra.example/x.png', 'sdp-media://mitjans/a.webp', '//altra.example/a.png', 'javascript:alert(1)']) {
      expect([url, isSafeAsset(url)]).toEqual([url, false]);
    }
    expect(esAvatarSegur('/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png')).toBe(true);
    expect(esAvatarSegur('capacitor://altra.example/a.png')).toBe(false);
  });

  test('web i Android: un capacitor:// continua fora; la resta, com sempre', () => {
    for (const nom of ['web', 'android']) {
      vi.stubGlobal('location', ORIGENS[nom]);
      expect([nom, isSafeAsset('capacitor://localhost/assets/x.webp')]).toEqual([nom, false]);
      expect([nom, isSafeAsset('/assets/system/ui/x.webp')]).toEqual([nom, true]);
      expect([nom, isSafeAsset('data:image/png;base64,iVBORw0KGgo=')]).toEqual([nom, true]);
      vi.unstubAllGlobals();
    }
  });
});
