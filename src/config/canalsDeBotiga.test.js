// @vitest-environment node
/* P1-69 (ordre del Mestre, 261028 20:13; decisions de l'onada 2 del Bloc H) ·
   Les ranures de les botigues de /page/descarregues: configuració que no
   pinta res sense adreça. Hui totes tancades; urlDeCanal només admet
   l'adreça pública de la botiga de cada canal. */
import { describe, expect, test } from 'vitest';
import { CANALS_DE_BOTIGA, canalsOberts, urlDeCanal } from './canalsDeBotiga.js';

const PLAY = 'https://play.google.com/store/apps/details?id=org.socdepoble.app';

describe('CANALS_DE_BOTIGA', () => {
  test('tres ranures congelades: Google Play, App Store i WordPress.org', () => {
    expect(Object.isFrozen(CANALS_DE_BOTIGA)).toBe(true);
    expect(CANALS_DE_BOTIGA.every((canal) => Object.isFrozen(canal))).toBe(true);
    expect(CANALS_DE_BOTIGA.map((canal) => [canal.id, canal.nom])).toEqual([
      ['google-play', 'Google Play'],
      ['app-store', 'App Store'],
      ['wordpress-org', 'WordPress.org']
    ]);
  });

  /* Cap botiga no és oberta a tothom (actes 261024_0345 i 261026_1630).
     Quan el Mestre done les adreces públiques, esta prova canvia amb elles. */
  test('tot tancat: cap adreça, i cap canal obert', () => {
    expect(CANALS_DE_BOTIGA.every((canal) => canal.url === null)).toBe(true);
    expect(canalsOberts()).toEqual([]);
  });
});

describe('urlDeCanal', () => {
  test('admet l’adreça pública de la fitxa de cada botiga, normalitzada', () => {
    expect(urlDeCanal({ id: 'google-play', url: PLAY })).toBe(PLAY);
    expect(urlDeCanal({ id: 'google-play', url: `${PLAY}&hl=ca` })).toBe(`${PLAY}&hl=ca`);
    expect(urlDeCanal({ id: 'app-store', url: 'https://apps.apple.com/app/id1234567890' })).toBe('https://apps.apple.com/app/id1234567890');
    expect(urlDeCanal({ id: 'app-store', url: 'https://apps.apple.com/es/app/soc-de-poble/id1234567890' }))
      .toBe('https://apps.apple.com/es/app/soc-de-poble/id1234567890');
    expect(urlDeCanal({ id: 'wordpress-org', url: 'https://wordpress.org/plugins/socdepoble-enxufe/' }))
      .toBe('https://wordpress.org/plugins/socdepoble-enxufe/');
    expect(urlDeCanal({ id: 'google-play', url: 'HTTPS://PLAY.GOOGLE.COM/store/apps/details?id=org.socdepoble.app' })).toBe(PLAY);
  });

  test('rebutja tot el que no és eixa adreça, sense llançar', () => {
    const dolents = [
      ['google-play', null],
      ['google-play', undefined],
      ['google-play', 42],
      ['google-play', { href: PLAY }],
      ['google-play', ''],
      ['google-play', 'no és cap adreça'],
      ['google-play', PLAY.replace('https:', 'http:')],
      ['google-play', 'javascript:alert(1)'],
      ['google-play', 'https://u:p@play.google.com/store/apps/details?id=org.socdepoble.app'],
      ['google-play', 'https://play.google.com:8443/store/apps/details?id=org.socdepoble.app'],
      ['google-play', 'https://play.google.com.evil.org/store/apps/details?id=org.socdepoble.app'],
      ['google-play', 'https://evil.org/?u=play.google.com'],
      ['google-play', 'https://play.google.com/store/apps/details?id=com.altra.app'],
      ['google-play', 'https://play.google.com/apps/internaltest/4701234567890'],
      ['google-play', 'https://play.google.com/apps/testing/org.socdepoble.app'],
      ['google-play', 'https://apps.apple.com/app/id1234567890'],
      ['app-store', 'https://testflight.apple.com/join/ABCDEF12'],
      ['app-store', 'https://apps.apple.com/'],
      ['app-store', PLAY],
      ['wordpress-org', 'https://wordpress.org/'],
      ['wordpress-org', 'https://downloads.wordpress.org/plugin/socdepoble-enxufe.zip'],
      ['wordpress-org', 'https://es.wordpress.org/plugins/socdepoble-enxufe/'],
      ['apk', 'https://socdepoble.org/app.apk'],
      ['constructor', PLAY]
    ];
    for (const [id, url] of dolents) expect([id, String(url), urlDeCanal({ id, url })]).toEqual([id, String(url), null]);
    expect(urlDeCanal()).toBeNull();
    expect(urlDeCanal(null)).toBeNull();
  });
});

describe('canalsOberts', () => {
  test('només els que porten una adreça vàlida i un nom, en l’ordre de la llista', () => {
    const canals = [
      { id: 'google-play', nom: 'Google Play', url: PLAY },
      { id: 'app-store', nom: 'App Store', url: 'https://testflight.apple.com/join/ABCDEF12' },
      { id: 'wordpress-org', nom: '  ', url: 'https://wordpress.org/plugins/socdepoble-enxufe/' },
      null
    ];
    expect(canalsOberts(canals)).toEqual([{ id: 'google-play', nom: 'Google Play', url: PLAY }]);
    expect(canalsOberts('no és llista')).toEqual([]);
  });
});
