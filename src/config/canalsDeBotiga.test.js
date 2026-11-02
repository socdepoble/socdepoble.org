// @vitest-environment node
/* P1-69 (ordre del Mestre, 261028 20:13; decisions de l'onada 2 del Bloc H) ·
   Les ranures de les botigues de /page/descarregues: configuració que no
   pinta res sense adreça. Des del 01-11-2026 (ordre del Mestre 261101_0311,
   T1), WordPress.org és obert; Google Play i App Store, tancats. urlDeCanal
   només admet l'adreça pública de la fitxa de Sóc de Poble a cada botiga.
   B9 (marató 261101_2143) · Cap ?beta= ni /beta, i la guarda frasesCaducades
   sobre el lead, el subtítol i el cos reals de /page/descarregues. */
import { describe, expect, test } from 'vitest';
import { CANALS_DE_BOTIGA, FRASES_DE_BOTIGA_TANCADA, FRASES_DE_PROVES, canalsOberts, frasesCaducades, urlDeCanal } from './canalsDeBotiga.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';

const PLAY = 'https://play.google.com/store/apps/details?id=org.socdepoble.app';
const WORDPRESS = 'https://wordpress.org/plugins/socdepoble/';

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

  /* 01-11-2026 · El connector socdepoble 1.1.10 és públic al directori de
     WordPress.org (api.wordpress.org i la fitxa, 200). Les botigues mòbils no
     són obertes a tothom (actes 261024_0345 i 261026_1630): quan el Mestre
     en done les adreces públiques, esta prova canvia amb elles. */
  test('només WordPress.org és obert, amb la fitxa del connector socdepoble; Google Play i App Store, tancats', () => {
    expect(CANALS_DE_BOTIGA.map((canal) => [canal.id, canal.url])).toEqual([
      ['google-play', null],
      ['app-store', null],
      ['wordpress-org', WORDPRESS]
    ]);
    expect(canalsOberts()).toEqual([{ id: 'wordpress-org', nom: 'WordPress.org', url: WORDPRESS }]);
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
    // B9 · «beta» dins d'una altra paraula no és de proves, i un nom amb %-codis bons tampoc no es rebutja.
    expect(urlDeCanal({ id: 'app-store', url: 'https://apps.apple.com/app/betanzos/id1234567890' })).toBe('https://apps.apple.com/app/betanzos/id1234567890');
    expect(urlDeCanal({ id: 'app-store', url: 'https://apps.apple.com/es/app/s%C3%B3c-de-poble/id1234567890' }))
      .toBe('https://apps.apple.com/es/app/s%C3%B3c-de-poble/id1234567890');
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
      { id: 'wordpress-org', nom: '  ', url: WORDPRESS },
      null
    ];
    expect(canalsOberts(canals)).toEqual([{ id: 'google-play', nom: 'Google Play', url: PLAY }]);
    expect(canalsOberts('no és llista')).toEqual([]);
  });
});

/* B9 (marató 261101_2143; spec B9-BOTIGUES §3.2) · La pàgina no pot continuar
   parlant de proves el dia que s'òbriga una botiga d'apps. */
describe('frasesCaducades', () => {
  const PLAY_OBERT = [{ id: 'google-play' }];
  const STORE_OBERT = [{ id: 'app-store' }];
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

  /* La guarda real. Hui només és obert WordPress.org, i el text (cert hui)
     pot parlar de proves. Quan el Mestre òbriga Google Play o l'App Store en
     canalsDeBotiga.js, esta prova cau i diu quines frases sobren: es
     reescriu el text (annex A de la spec B9) i es torna a aprovar la
     frontissa (node tooling/gates/frontissa-contingut.mjs --aprova descarregues). */
  test('PAGE_COPY.descarregues (lead, subtítol i cos) no diu res caducat per als canals oberts de veres', () => {
    const { lead, subtitle, html } = PAGE_COPY.descarregues;
    // Els canals oberts de veres, explícits: la guarda no depén del valor per defecte de frasesCaducades.
    expect(frasesCaducades([lead, subtitle, html], canalsOberts()), "Una botiga d'apps oberta: reescriu PAGE_COPY.descarregues amb l'annex A de la spec B9-BOTIGUES i torna a aprovar la frontissa (node tooling/gates/frontissa-contingut.mjs --aprova descarregues --per Mestre)")
      .toEqual([]);
    /* La guarda mossega el text d'avui (el dia que es reescriga amb l'annex A, estes cinc línies se'n van amb ell):
       la cadena de veres, amb Google Play obert en una còpia de CANALS_DE_BOTIGA (canalsOberts → frasesCaducades),
       cau; amb una botiga d'apps oberta, el lead sol ja cau, i el lead suma al cos. */
    const ambPlay = CANALS_DE_BOTIGA.map((canal) => (canal.id === 'google-play' ? { ...canal, url: PLAY } : canal));
    expect(frasesCaducades([lead, subtitle, html], canalsOberts(ambPlay)).length).toBeGreaterThanOrEqual(1);
    expect(frasesCaducades([lead], PLAY_OBERT).length).toBeGreaterThanOrEqual(1);
    expect(frasesCaducades([lead], STORE_OBERT).length).toBeGreaterThanOrEqual(1);
    expect(frasesCaducades([lead, subtitle, html], PLAY_OBERT).length).toBeGreaterThan(frasesCaducades(html, PLAY_OBERT).length);
    expect(frases(frasesCaducades(html, STORE_OBERT))).toEqual(expect.arrayContaining(['app-store: TestFlight', 'app-store: grup de treball intern']));
  });
});
