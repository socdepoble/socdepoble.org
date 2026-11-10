// @vitest-environment node
/* P1-69 (ordre del Mestre, 261028 20:13; decisions de l'onada 2 del Bloc H) ·
   Les ranures de les botigues de /page/descarregues: configuració que no
   pinta res sense adreça. Des del 01-11-2026 (ordre del Mestre 261101_0311,
   T1), WordPress.org és obert; Google Play i App Store, tancats. urlDeCanal
   només admet l'adreça pública de la fitxa de Sóc de Poble a cada botiga.
   B9 (marató 261101_2143) · Cap ?beta= ni /beta, i la guarda frasesCaducades
   sobre el lead, el subtítol i el cos reals de /page/descarregues.
   IDEA-60 (T1, prompt 261102_1532) · Dues ranures més, tancades: l'APK
   directe (el fitxer signat al domini propi) i TestFlight (l'única ranura on
   una adreça de proves és la bona). Quan s'òbriguen, les seues frases del
   cos caduquen, com les de les botigues.
   P0-62 / IDEA-193 (ordre del Mestre, 261108) · L'App Store és oberta amb
   la fitxa pública d'Apple (trackId 6826441844, publicada el 06-11-2026):
   el cos real ja no diu cap frase de botiga tancada d'Apple ni de proves. */
import { describe, expect, test } from 'vitest';
import { CANALS_DE_BOTIGA, FRASES_DE_BOTIGA_TANCADA, FRASES_DE_PROVES, canalsOberts, frasesCaducades, urlDeCanal } from './canalsDeBotiga.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';

const PLAY = 'https://play.google.com/store/apps/details?id=org.socdepoble.app';
const WORDPRESS = 'https://wordpress.org/plugins/socdepoble/';
/* P0-62 · La fitxa pública de Sóc de Poble a l'App Store (consulta d'Apple del 08-11-2026). */
const APP_STORE = 'https://apps.apple.com/es/app/soc-de-poble/id6826441844';
/* IDEA-60 · L'APK signat al domini propi i un enllaç públic de TestFlight. */
const APK = 'https://socdepoble.org/descarregues/socdepoble-android-latest.apk';
const TESTFLIGHT = 'https://testflight.apple.com/join/AbCd1234';

describe('CANALS_DE_BOTIGA', () => {
  test('cinc ranures congelades, en este ordre: Google Play, App Store, APK directe, TestFlight i WordPress.org', () => {
    expect(Object.isFrozen(CANALS_DE_BOTIGA)).toBe(true);
    expect(CANALS_DE_BOTIGA.every((canal) => Object.isFrozen(canal))).toBe(true);
    expect(CANALS_DE_BOTIGA.map((canal) => [canal.id, canal.nom])).toEqual([
      ['google-play', 'Google Play'],
      ['app-store', 'App Store'],
      ['apk-directe', 'APK directe'],
      ['testflight', 'TestFlight'],
      ['wordpress-org', 'WordPress.org']
    ]);
  });

  /* 01-11-2026 · El connector socdepoble 1.1.10 és públic al directori de
     WordPress.org (api.wordpress.org i la fitxa, 200). Les botigues mòbils no
     són obertes a tothom (actes 261024_0345 i 261026_1630): quan el Mestre
     en done les adreces públiques, esta prova canvia amb elles.
     IDEA-60 (02-11-2026) · L'APK encara no s'ha generat ni publicat i
     l'enllaç públic de TestFlight encara no existix: les dues ranures,
     tancades.
     P0-62 (08-11-2026) · L'App Store, oberta amb la fitxa pública d'Apple
     (trackId 6826441844): l'adreça passa FORMES['app-store'] tal com és. */
  test('l’App Store (fitxa id6826441844) i WordPress.org (connector socdepoble), oberts; Google Play, APK directe i TestFlight, tancats', () => {
    expect(CANALS_DE_BOTIGA.map((canal) => [canal.id, canal.url])).toEqual([
      ['google-play', null],
      ['app-store', APP_STORE],
      ['apk-directe', null],
      ['testflight', null],
      ['wordpress-org', WORDPRESS]
    ]);
    expect(urlDeCanal({ id: 'app-store', url: APP_STORE })).toBe(APP_STORE);
    expect(canalsOberts()).toEqual([
      { id: 'app-store', nom: 'App Store', url: APP_STORE },
      { id: 'wordpress-org', nom: 'WordPress.org', url: WORDPRESS }
    ]);
    // La mateixa adreça en una altra ranura no obri res: només és la fitxa de l'App Store.
    for (const id of ['google-play', 'apk-directe', 'testflight', 'wordpress-org']) expect([id, urlDeCanal({ id, url: APP_STORE })]).toEqual([id, null]);
  });
});

describe('urlDeCanal', () => {
  test('admet l’adreça pública de la fitxa de cada botiga, normalitzada', () => {
    expect(urlDeCanal({ id: 'google-play', url: PLAY })).toBe(PLAY);
    expect(urlDeCanal({ id: 'google-play', url: `${PLAY}&hl=ca` })).toBe(`${PLAY}&hl=ca`);
    expect(urlDeCanal({ id: 'app-store', url: 'https://apps.apple.com/app/id1234567890' })).toBe('https://apps.apple.com/app/id1234567890');
    expect(urlDeCanal({ id: 'app-store', url: 'https://apps.apple.com/es/app/soc-de-poble/id1234567890' }))
      .toBe('https://apps.apple.com/es/app/soc-de-poble/id1234567890');
    expect(urlDeCanal({ id: 'wordpress-org', url: WORDPRESS })).toBe(WORDPRESS);
    expect(urlDeCanal({ id: 'wordpress-org', url: 'https://wordpress.org/plugins/socdepoble' })).toBe('https://wordpress.org/plugins/socdepoble');
    expect(urlDeCanal({ id: 'google-play', url: 'HTTPS://PLAY.GOOGLE.COM/store/apps/details?id=org.socdepoble.app' })).toBe(PLAY);
    // B9 · «beta» dins d'una altra paraula no és de proves, un nom amb %-codis bons tampoc no es rebutja,
    // i l'slug ASCII pur de la fitxa oberta passa net.
    expect(urlDeCanal({ id: 'app-store', url: 'https://apps.apple.com/app/betanzos/id1234567890' })).toBe('https://apps.apple.com/app/betanzos/id1234567890');
    expect(urlDeCanal({ id: 'app-store', url: 'https://apps.apple.com/es/app/s%C3%B3c-de-poble/id1234567890' }))
      .toBe('https://apps.apple.com/es/app/s%C3%B3c-de-poble/id1234567890');
    expect(urlDeCanal({ id: 'app-store', url: 'https://apps.apple.com/es/app/soc-de-poble/id6826441844' }))
      .toBe('https://apps.apple.com/es/app/soc-de-poble/id6826441844');
    // IDEA-60 · L'APK signat (el camí exacte) i l'enllaç públic de TestFlight (/join/ i un codi de 4 a 32 caràcters), normalitzats.
    expect(urlDeCanal({ id: 'apk-directe', url: APK })).toBe(APK);
    expect(urlDeCanal({ id: 'apk-directe', url: 'HTTPS://SOCDEPOBLE.ORG/descarregues/socdepoble-android-latest.apk' })).toBe(APK);
    // El host «testflight» no tanca la seua pròpia ranura: és el canal públic de proves que es vol enllaçar.
    expect(urlDeCanal({ id: 'testflight', url: TESTFLIGHT })).toBe(TESTFLIGHT);
    expect(urlDeCanal({ id: 'testflight', url: 'HTTPS://TESTFLIGHT.APPLE.COM/join/AbCd1234' })).toBe(TESTFLIGHT);
    expect(urlDeCanal({ id: 'testflight', url: 'https://testflight.apple.com/join/ABCD' })).toBe('https://testflight.apple.com/join/ABCD');
    expect(urlDeCanal({ id: 'testflight', url: `https://testflight.apple.com/join/${'a1'.repeat(16)}` }))
      .toBe(`https://testflight.apple.com/join/${'a1'.repeat(16)}`);
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
      // B9 · Una fitxa bona amb ?beta= o un camí /beta també és de proves (kits de Gemini i Codex).
      ['google-play', `${PLAY}&beta=1`],
      ['google-play', 'https://play.google.com/store/apps/details?beta=1&id=org.socdepoble.app'],
      ['app-store', 'https://apps.apple.com/app/id1234567890?beta=true'],
      ['app-store', 'https://apps.apple.com/app/beta/id123456789'],
      // «beta» com a paraula en qualsevol part de l'adreça, també amagada amb %-codis; un %-codi mal format, tancat.
      ['google-play', `${PLAY}&beta`],
      ['google-play', `${PLAY}#beta`],
      ['google-play', `${PLAY}&channel=beta`],
      ['google-play', `${PLAY}&%62eta=1`],
      ['google-play', `${PLAY}&q=%E0%A4%A`],
      ['app-store', 'https://apps.apple.com/app/soc-de-poble/id1234567890?beta'],
      ['app-store', 'https://apps.apple.com/app/soc-de-poble/id1234567890?Beta=1'],
      // P0-62 · La fitxa de veres tampoc no passa amb un paràmetre de proves, en http ni en un altre host.
      ['app-store', `${APP_STORE}?beta=1`],
      ['app-store', `${APP_STORE}#beta`],
      ['app-store', APP_STORE.replace('https:', 'http:')],
      ['app-store', APP_STORE.replace('apps.apple.com', 'apps.apple.com.evil.org')],
      ['google-play', 'https://apps.apple.com/app/id1234567890'],
      ['app-store', 'https://testflight.apple.com/join/ABCDEF12'],
      ['app-store', 'https://apps.apple.com/'],
      ['app-store', PLAY],
      ['wordpress-org', 'https://wordpress.org/'],
      ['wordpress-org', 'https://downloads.wordpress.org/plugin/socdepoble.zip'],
      ['wordpress-org', 'https://es.wordpress.org/plugins/socdepoble/'],
      ['wordpress-org', WORDPRESS.replace('https:', 'http:')],
      // La fitxa d'un altre connector no és la de Sóc de Poble (ni l'slug que no s'ha publicat mai).
      ['wordpress-org', 'https://wordpress.org/plugins/socdepoble-enxufe/'],
      ['wordpress-org', 'https://wordpress.org/plugins/soc-de-poble-mur/'],
      ['wordpress-org', 'https://wordpress.org/plugins/socdepoble/socdepoble/'],
      ['wordpress-org', 'https://wordpress.org/plugins/socdepoblex/'],
      // IDEA-60 · L'APK: només el fitxer signat al domini propi, en https, sense query ni fragment.
      ['apk-directe', APK.replace('https:', 'http:')],
      ['apk-directe', `${APK}?v=2`],
      ['apk-directe', `${APK}?beta=1`],
      ['apk-directe', `${APK}#x`],
      ['apk-directe', `${APK}/`],
      ['apk-directe', 'https://www.socdepoble.org/descarregues/socdepoble-android-latest.apk'],
      ['apk-directe', 'https://socdepoble.org.evil.org/descarregues/socdepoble-android-latest.apk'],
      ['apk-directe', 'https://socdepoble.org/socdepoble-android-latest.apk'],
      ['apk-directe', 'https://socdepoble.org/descarregues/socdepoble.apk'],
      ['apk-directe', 'https://socdepoble.org/descarregues/SOCDEPOBLE-ANDROID-LATEST.APK'],
      ['apk-directe', 'https://u:p@socdepoble.org/descarregues/socdepoble-android-latest.apk'],
      ['apk-directe', PLAY],
      // IDEA-60 · TestFlight: el host exacte, /join/ i un codi de 4 a 32 caràcters alfanumèrics, sense res més.
      ['testflight', TESTFLIGHT.replace('https:', 'http:')],
      ['testflight', 'https://testflight.apple.com/join/ABC'],
      ['testflight', `https://testflight.apple.com/join/${'a'.repeat(33)}`],
      ['testflight', 'https://testflight.apple.com/join/'],
      ['testflight', 'https://testflight.apple.com/join/AbCd1234/'],
      ['testflight', 'https://testflight.apple.com/join/AbCd-1234'],
      ['testflight', 'https://testflight.apple.com/v1/join/AbCd1234'],
      ['testflight', 'https://testflight.apple.com.evil.org/join/AbCd1234'],
      ['testflight', 'https://apps.apple.com/join/AbCd1234'],
      ['testflight', 'https://beta.itunes.apple.com/v1/invite/AbCd1234'],
      ['testflight', 'https://u:p@testflight.apple.com/join/AbCd1234'],
      ['testflight', 'https://testflight.apple.com:8443/join/AbCd1234'],
      // Sense query ni fragment (àrbitre T1b-A01): l'enllaç que es pinta és el públic, sense cap paràmetre de seguiment.
      ['testflight', `${TESTFLIGHT}?beta=1`],
      ['testflight', `${TESTFLIGHT}?utm_source=x`],
      ['testflight', `${TESTFLIGHT}?internaltest`],
      ['testflight', `${TESTFLIGHT}#x`],
      ['testflight', PLAY],
      // IDEA-60 · A la resta de ranures, una adreça de proves (testflight, internaltest, beta) continua tancant el canal.
      ['google-play', `${PLAY}&testflight=1`],
      ['wordpress-org', 'https://wordpress.org/plugins/socdepoble/?beta'],
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
      { id: 'app-store', nom: 'App Store', url: TESTFLIGHT },
      // IDEA-60 · L'APK amb query queda tancat; la mateixa adreça de TestFlight obri la seua ranura i no la de l'App Store.
      { id: 'apk-directe', nom: 'APK directe', url: `${APK}?v=2` },
      { id: 'testflight', nom: 'TestFlight', url: TESTFLIGHT },
      { id: 'wordpress-org', nom: '  ', url: WORDPRESS },
      null
    ];
    expect(canalsOberts(canals)).toEqual([
      { id: 'google-play', nom: 'Google Play', url: PLAY },
      { id: 'testflight', nom: 'TestFlight', url: TESTFLIGHT }
    ]);
    expect(canalsOberts([{ id: 'apk-directe', nom: 'APK directe', url: APK }])).toEqual([{ id: 'apk-directe', nom: 'APK directe', url: APK }]);
    expect(canalsOberts('no és llista')).toEqual([]);
  });
});

/* B9 (marató 261101_2143; spec B9-BOTIGUES §3.2) · La pàgina no pot continuar
   parlant de proves el dia que s'òbriga una botiga d'apps. */
describe('frasesCaducades', () => {
  const PLAY_OBERT = [{ id: 'google-play' }];
  const STORE_OBERT = [{ id: 'app-store' }];
  /* IDEA-60 (T1, prompt 261102_1532) · Les dues ranures d'instal·lació immediata. */
  const APK_OBERT = [{ id: 'apk-directe' }];
  const TESTFLIGHT_OBERT = [{ id: 'testflight' }];
  const frases = (trobades) => trobades.map(({ id, frase }) => `${id}: ${frase}`);

  test('llistes congelades i regex sense quantificadors oberts', () => {
    expect(Object.isFrozen(FRASES_DE_BOTIGA_TANCADA)).toBe(true);
    expect(Object.values(FRASES_DE_BOTIGA_TANCADA).every((llista) => Object.isFrozen(llista))).toBe(true);
    expect(Object.isFrozen(FRASES_DE_PROVES)).toBe(true);
    const totes = [...Object.values(FRASES_DE_BOTIGA_TANCADA).flat(), ...FRASES_DE_PROVES];
    for (const re of totes) expect([re.source, /[*+?{]/.test(re.source)]).toEqual([re.source, false]);
  });

  test('una botiga oberta amb el text vell dona les seues frases; tancada, o amb un text nou, cap', () => {
    const vell = 'La 1.0.0 és per a les <strong>proves internes</strong>: només la pot instal·lar l’equip de proves. Encara no està publicada per a tothom.';
    expect(frases(frasesCaducades(vell, PLAY_OBERT))).toEqual([
      'google-play: proves internes',
      'google-play: no està publicada per a tothom',
      'google-play: equip de proves'
    ]);
    // Les frases de Google Play no són de l'App Store, i amb tot tancat (o només WordPress.org) no cau res.
    expect(frasesCaducades(vell, STORE_OBERT)).toEqual([]);
    expect(frasesCaducades(vell, [])).toEqual([]);
    expect(frasesCaducades(`${vell} Ara en proves.`, [{ id: 'wordpress-org' }])).toEqual([]);
    // L'esborrany de l'annex A (botigues obertes) passa.
    expect(frasesCaducades([
      "La web ja està oberta a tothom. Ací trobaràs com instal·lar-la des del navegador i com baixar l'aplicació de la teua botiga.",
      "L'aplicació per a Android és a Google Play, gratis i sense anuncis. Prem el botó «Disponible a Google Play» de dalt d'esta pàgina.",
      "L'aplicació per a iPhone i iPad és a l'App Store. Prem el botó «Disponible a l'App Store» de dalt d'esta pàgina."
    ], [...PLAY_OBERT, ...STORE_OBERT])).toEqual([]);
    // El text vell de l'App Store dona les seues quatre frases, i cap amb només Google Play obert.
    const vellApple = "Sóc de Poble encara no és a l'App Store. Es prova amb TestFlight i ja la pot instal·lar el grup de treball intern; no hi ha cap enllaç públic de proves.";
    expect(frases(frasesCaducades(vellApple, STORE_OBERT))).toEqual([
      'app-store: TestFlight',
      "app-store: encara no és a l[’']App Store",
      'app-store: enllaç públic de proves',
      'app-store: grup de treball intern'
    ]);
    expect(frasesCaducades(vellApple, PLAY_OBERT)).toEqual([]);
  });

  test('sense etiquetes, per damunt dels salts de línia i amb l’apòstrof tipogràfic', () => {
    expect(frases(frasesCaducades('La versió <strong class="x">beta</strong>', PLAY_OBERT))).toEqual(['google-play: \\bbeta\\b']);
    // «beta» dins d'una paraula o d'un atribut no és «beta».
    expect(frasesCaducades('<a href="/beta">alfabetari</a>', PLAY_OBERT)).toEqual([]);
    expect(frases(frasesCaducades('Sóc de Poble encara no és a <em>l’App Store</em>.', STORE_OBERT)))
      .toEqual(['app-store: encara no és a l[’\']App Store']);
    expect(frases(frasesCaducades('està en\n  <strong>proves</strong>\tinternes', PLAY_OBERT)))
      .toEqual(['google-play: proves internes', 'google-play: \\ben proves\\b']);
    // Les frases generals, una vegada per a totes les botigues d'apps obertes.
    expect(frasesCaducades('Hui, en quin punt estan les proves.', [...PLAY_OBERT, ...STORE_OBERT]))
      .toEqual([{ id: 'google-play+app-store', frase: 'en quin punt estan les proves' }]);
    // Una etiqueta separa paraules, i els textos també: «Android» i «beta» no s'enganxen.
    expect(frases(frasesCaducades('<li>Android</li><li>beta</li>', PLAY_OBERT))).toEqual(['google-play: \\bbeta\\b']);
    expect(frases(frasesCaducades(['Sóc de Poble', 'beta per a Android'], PLAY_OBERT))).toEqual(['google-play: \\bbeta\\b']);
    // Sense distingir majúscules.
    expect(frases(frasesCaducades('Versió Beta', PLAY_OBERT))).toEqual(['google-play: \\bbeta\\b']);
  });

  test('llig les entitats com el lector: apòstrof, espai dur i lletres, en nom, decimal o hex', () => {
    // L'entitat decimal d'un punt de codi (escrita així, design_guard no la pren per un color).
    const decimal = (codi) => `&#${codi};`;
    for (const apostrof of ['&rsquo;', decimal(0x2019), '&#x2019;', '&apos;', '&#39;']) {
      expect([apostrof, frases(frasesCaducades(`Sóc de Poble encara no és a l${apostrof}App Store.`, STORE_OBERT))])
        .toEqual([apostrof, ["app-store: encara no és a l[’']App Store"]]);
    }
    for (const espai of ['&nbsp;', decimal(0xa0), '&#xA0;']) {
      expect([espai, frases(frasesCaducades(`quins camins encara estan en${espai}proves`, PLAY_OBERT))])
        .toEqual([espai, ['google-play: \\ben proves\\b']]);
    }
    expect(frases(frasesCaducades('Encara no est&agrave; publicada per a tothom.', PLAY_OBERT)))
      .toEqual(['google-play: no està publicada per a tothom']);
    // Una sola passada: «&amp;rsquo;» es llig «&rsquo;», i una entitat desconeguda o fora de rang es queda com està.
    expect(frasesCaducades('encara no és a l&amp;rsquo;App Store', STORE_OBERT)).toEqual([]);
    expect(frasesCaducades('encara no és a l&betamax;App Store &#0; &#x110000;', STORE_OBERT)).toEqual([]);
  });

  test('mai llança: ignora el que no és text i el que no és llista', () => {
    expect(frasesCaducades(undefined, PLAY_OBERT)).toEqual([]);
    expect(frasesCaducades([null, 42, { toString: () => { throw new Error('no'); } }, 'en proves'], PLAY_OBERT))
      .toEqual([{ id: 'google-play', frase: '\\ben proves\\b' }]);
    expect(frasesCaducades('en proves', 'no és llista')).toEqual([]);
    expect(frasesCaducades('en proves', [null, undefined, 7])).toEqual([]);
  });

  test('lineal: molts «<» sense tancar no la paren (la regex /<[^>]*>/ tardaria segons)', () => {
    const t0 = performance.now();
    const trobades = frasesCaducades(`${'<'.repeat(60_000)} beta`, PLAY_OBERT);
    expect(performance.now() - t0).toBeLessThan(1500);
    expect(frases(trobades)).toEqual(['google-play: \\bbeta\\b']);
    // Ni molts «&» sense tancar (la lectura d'entitats també és lineal).
    const t1 = performance.now();
    const entitats = frasesCaducades(`${'&#x'.repeat(20_000)}${'&nbsp'.repeat(10_000)}${'&#1'.repeat(20_000)} en&nbsp;proves`, PLAY_OBERT);
    expect(performance.now() - t1).toBeLessThan(1500);
    expect(frases(entitats)).toEqual(['google-play: \\ben proves\\b']);
  });

  /* IDEA-60 (T1, prompt 261102_1532) · Les dues ranures noves sobre el cos
     real d'avui: obertes, troben les seues frases («Hui encara no hi ha APK
     públic», «hem demanat a Apple un enllaç públic»), el mecanisme
     d'honestedat de sempre; tancades, res. No són botigues d'apps: les frases
     generals de proves no hi compten.
     P0-62 (08-11-2026) · Amb l'App Store oberta, el cos ja no pot nomenar
     TestFlight (FRASES_DE_BOTIGA_TANCADA['app-store']): les frases de la
     ranura testflight ja no hi són i, sobre el cos real, no en troba cap. Les
     frases continuen a la llista i mosseguen el paràgraf vell de TestFlight
     (el de HEAD bcb067a27, vellTestflight, ací baix). */
  test('IDEA-60 · apk-directe obert sobre el cos real troba les seues frases; testflight, cap (P0-62); tancats, cap', () => {
    const { lead, subtitle, html } = PAGE_COPY.descarregues;
    expect(frases(frasesCaducades(html, APK_OBERT))).toEqual(['apk-directe: no hi ha APK públic', "apk-directe: Quan n[’']hi haja un"]);
    expect(frasesCaducades([lead, subtitle, html], TESTFLIGHT_OBERT)).toEqual([]);
    expect(html).not.toMatch(/TestFlight/i);
    expect(frasesCaducades('Versió beta, en proves. En quin punt estan les proves.', [...APK_OBERT, ...TESTFLIGHT_OBERT])).toEqual([]);
    // Les frases de cada ranura són seues: amb l'altra oberta, o amb WordPress.org, cap.
    expect(frasesCaducades("Hui encara no hi ha APK públic. Quan n'hi haja un, l'enllaç eixirà ací.", TESTFLIGHT_OBERT)).toEqual([]);
    expect(frasesCaducades('Hem demanat a Apple un enllaç públic. Mentre Apple no el revise, res.', APK_OBERT)).toEqual([]);
    expect(frasesCaducades([lead, subtitle, html], [{ id: 'wordpress-org' }])).toEqual([]);
    // Amb l'apòstrof tipogràfic i les etiquetes del cos, igual.
    expect(frases(frasesCaducades('<strong>Hui encara no hi ha APK públic</strong>. Quan n’hi haja un…', APK_OBERT)))
      .toEqual(['apk-directe: no hi ha APK públic', "apk-directe: Quan n[’']hi haja un"]);
    // Per la cadena de veres: la ranura oberta en una còpia de CANALS_DE_BOTIGA (canalsOberts → frasesCaducades) fa caure la guarda.
    const ambApk = CANALS_DE_BOTIGA.map((canal) => (canal.id === 'apk-directe' ? { ...canal, url: APK } : canal));
    expect(frasesCaducades([lead, subtitle, html], canalsOberts(ambApk)).map((trobada) => trobada.id)).toEqual(['apk-directe', 'apk-directe']);
    // P0-62 · TestFlight obert al costat de l'App Store oberta: el cos real ja no en diu res.
    const ambTestflight = CANALS_DE_BOTIGA.map((canal) => (canal.id === 'testflight' ? { ...canal, url: TESTFLIGHT } : canal));
    expect(frasesCaducades([lead, subtitle, html], canalsOberts(ambTestflight))).toEqual([]);
    /* P0-62 · Les frases de testflight encara mosseguen: el paràgraf de TestFlight del cos fins al 08-11-2026,
       amb la ranura oberta, dona les dues; i per la cadena de veres, també (al costat de les de l'App Store tancada). */
    const vellTestflight = "<p>La versió per a iPhone i iPad (iOS i iPadOS) es prova amb <strong>TestFlight</strong>, el programa de proves d'Apple. La versió <strong>1.0.0</strong> (1) ja la pot instal·lar el grup de <strong>treball intern</strong>, i hem demanat a Apple un <strong>enllaç públic</strong> de proves perquè s'hi puga apuntar més gent. Mentre Apple no el revise i l'aprove <strong>no el podem compartir</strong>; quan el tinguem, eixirà ací.</p>";
    expect(frases(frasesCaducades(vellTestflight, TESTFLIGHT_OBERT)))
      .toEqual(['testflight: hem demanat a Apple un enllaç públic', 'testflight: Mentre Apple no el revise']);
    expect(frasesCaducades(vellTestflight, canalsOberts(ambTestflight)).filter((trobada) => trobada.id === 'testflight').map((trobada) => trobada.frase))
      .toEqual(['hem demanat a Apple un enllaç públic', 'Mentre Apple no el revise']);
  });

  /* La guarda real. Fins al 08-11-2026 només era obert WordPress.org, i el
     text podia parlar de proves. P0-62 (08-11-2026) · L'App Store és oberta i
     el text s'ha reescrit: cap frase de botiga tancada d'Apple (TestFlight,
     «encara no és a l'App Store»…) ni de proves («beta», «en proves»).
     Google Play continua tancat i el text ho diu («no està publicada per a
     tothom»): el dia que el Mestre l'òbriga en canalsDeBotiga.js, esta prova
     cau i diu quines frases sobren, i es torna a aprovar la frontissa
     (node tooling/gates/frontissa-contingut.mjs --aprova descarregues). */
  test('PAGE_COPY.descarregues (lead, subtítol i cos) no diu res caducat per als canals oberts de veres', () => {
    const { lead, subtitle, html } = PAGE_COPY.descarregues;
    // Els canals oberts de veres, explícits: la guarda no depén del valor per defecte de frasesCaducades.
    expect(canalsOberts().map((canal) => canal.id)).toEqual(['app-store', 'wordpress-org']);
    expect(frasesCaducades([lead, subtitle, html], canalsOberts()), "Una botiga d'apps oberta: reescriu PAGE_COPY.descarregues amb l'annex A de la spec B9-BOTIGUES i torna a aprovar la frontissa (node tooling/gates/frontissa-contingut.mjs --aprova descarregues --per Mestre)")
      .toEqual([]);
    // L'App Store sola, explícita: ni les seues frases ni les generals de proves.
    expect(frasesCaducades([lead, subtitle, html], STORE_OBERT)).toEqual([]);
    /* La guarda mossega el text d'avui per a Google Play: la cadena de veres, amb Google Play obert en una còpia
       de CANALS_DE_BOTIGA (canalsOberts → frasesCaducades), cau per la frase que només és certa amb la botiga
       tancada. El dia que s'òbriga de veres, esta línia se'n va amb el text. */
    const ambPlay = CANALS_DE_BOTIGA.map((canal) => (canal.id === 'google-play' ? { ...canal, url: PLAY } : canal));
    expect(frases(frasesCaducades([lead, subtitle, html], canalsOberts(ambPlay)))).toEqual(['google-play: no està publicada per a tothom']);
  });
});
