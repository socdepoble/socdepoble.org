/**
 * Ordre del Mestre (261007) · Les pàgines del sistema que el Mur barreja amb
 * les publicacions (SYSTEM_PAGES) i la ruta on porta el copyright de totes
 * les targetes i capçaleres (RUTA_DRETS_AUTOR).
 *
 *  · «Drets d'autor» és una entrada més: /page/drets-autor (PageDetailSection,
 *    sense ruta nova ni component propi), sense acció gran.
 *  · Cada pàgina declarada té el seu copy a PAGE_COPY: una absent el Mur la
 *    descartaria en silenci (incident del 24-09) i la frontissa de contingut
 *    fallaria.
 * Onada 8 (261009; requeriments 261009_1300, punt 2) · La Consola i el
 * Cervell són pàgines del sistema (/page/consola i /page/cervell), amb el
 * botó «Obrir…» de la seua PÀGINA cap a l'eina; Disseny continua a /disseny.
 * Les tres porten la data literal del Mestre.
 * Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · El botó
 * de la TARGETA és una altra pregunta (accioDeLaTargeta: hui, només El Xat),
 * i la Consola i el Cervell repetixen el de la pàgina després del cos
 * (accioAlFinal). Les tres targetes de la maquinària porten etiquetes a
 * PAGE_COPY: Categoria i Etiqueta.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import '../../tests/helpers/diccionaris.js';
import fontApp from '../app/App.jsx?raw';
import { RUTA_CONSOLA, segmentPagina } from '../sections/consola/consolaPagines.js';
import { RUTA_DRETS_AUTOR, SYSTEM_PAGES, accioAlFinal, accioDeLaPagina, accioDeLaTargeta, esPaginaVisible } from './systemPages.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';
import { IDS_PLUGINS, RUTA_PLUGINS } from '../sections/plugins/registrePlugins.js';
import { createTranslator } from './i18n.js';
import { CANALS_DE_BOTIGA, canalsOberts } from './canalsDeBotiga.js';
import { resolvePageSlugPath } from './navigation.js';

describe('SYSTEM_PAGES', () => {
  test('«Drets d’autor» viu a /page/drets-autor, sense acció gran', () => {
    expect(SYSTEM_PAGES.find((pagina) => pagina.key === 'drets-autor')).toEqual({ key: 'drets-autor', isAvis: false, href: '/page/drets-autor' });
    expect(accioDeLaPagina('drets-autor')).toBeNull();
    // Sense ruta canònica: PageDetailSection no la redirigix enlloc.
    expect(resolvePageSlugPath('drets-autor')).toBeNull();
  });

  test('cap clau repetida, i cada pàgina declarada té el seu copy a PAGE_COPY', () => {
    const claus = SYSTEM_PAGES.map((pagina) => pagina.key);
    expect(new Set(claus).size).toBe(claus.length);
    expect(claus.filter((clau) => !Object.hasOwn(PAGE_COPY, clau))).toEqual([]);
  });

  test('immutables: la llista i cada entrada', () => {
    expect(Object.isFrozen(SYSTEM_PAGES)).toBe(true);
    for (const pagina of SYSTEM_PAGES) expect(Object.isFrozen(pagina), pagina.key).toBe(true);
  });
});

describe('Onada 8 · la Consola, el Cervell i Disseny són pàgines del sistema', () => {
  test('la Consola i el Cervell viuen a /page/<clau>, darrere de Disseny, sense ruta canònica', () => {
    const claus = SYSTEM_PAGES.map((pagina) => pagina.key);
    expect(claus.slice(claus.indexOf('disseny'), claus.indexOf('disseny') + 3)).toEqual(['disseny', 'consola', 'cervell']);
    expect(SYSTEM_PAGES.find((pagina) => pagina.key === 'disseny')).toEqual({ key: 'disseny', isAvis: false, href: '/disseny' });
    for (const clau of ['consola', 'cervell']) {
      expect(SYSTEM_PAGES.find((pagina) => pagina.key === clau)).toMatchObject({ key: clau, isAvis: false, href: `/page/${clau}` });
      // Sense ruta canònica: PageDetailSection la servix i no la redirigix enlloc.
      expect([clau, resolvePageSlugPath(clau)]).toEqual([clau, null]);
    }
    expect(fontApp.includes('<Route path="/page/:slug"')).toBe(true);
  });

  /* L'acció de la PÀGINA (el botó de davall de l'H1 de /page/consola i
     /page/cervell). toEqual: el retorn és exactament { id, verb, desti,
     varietat }, sense les marques `targeta` ni `final` del descriptor. */
  test('el botó gran «Obrir…» de la pàgina: la Consola a RUTA_CONSOLA i el Cervell a l’Explorador, cap còpia que divergisca', () => {
    expect(accioDeLaPagina('consola')).toEqual({ id: 'obrir-consola', verb: 'Obrir la Consola', desti: RUTA_CONSOLA, varietat: 'primari' });
    expect(accioDeLaPagina('cervell')).toEqual({ id: 'obrir-cervell', verb: 'Obrir el Cervell', desti: `${RUTA_CONSOLA}/explorador`, varietat: 'primari' });
    // L'Explorador és una pàgina de la Consola de veres; /consola/cervell, no.
    expect(segmentPagina('/explorador')).toBe('explorador');
    expect(segmentPagina('/cervell')).toBeNull();
    // Disseny no porta cap botó gran: conserva les seues etiquetes.
    expect(accioDeLaPagina('disseny')).toBeNull();
  });

  test('el text del botó passa pel traductor amb la seua clau, i en valencià és la reserva', () => {
    const en = createTranslator('en');
    expect(accioDeLaPagina('consola', en).verb).toBe('Open the Console');
    expect(accioDeLaPagina('cervell', en).verb).toBe('Open the Brain');
    const ca = createTranslator('ca');
    expect(accioDeLaPagina('consola', ca).verb).toBe('Obrir la Consola');
    expect(accioDeLaPagina('cervell', ca).verb).toBe('Obrir el Cervell');
  });

  /* Decisió D3 de MarIA · El botó porta a la ruta de la Consola (la prova del
     destí és la de dalt). Ordre del Mestre (30-10-2026, prompt 2208, T2.2) ·
     La ruta és oberta a tothom, en qualsevol entorn («qualsevol investigador
     que prenga el botó… puga entrar a la Consola»), i el botó és actiu també
     en producció (systemPages.js, OBRIR_CONSOLA). Derogat: «fora de
     desenvolupament, demana el rol de superadmin». La prova d'ací, que llegia
     la font d'App.jsx i la guarda, ha eixit amb la guarda (31-10-2026): que
     /consola i /consola/<id> es munten sense sessió, també amb DEV fals, ho
     prova el comportament a App.test.jsx, App.appsLocals.test.jsx i
     pageContent.fediversity.test.js. */

  test('les dates literals del Mestre (8, 9 i 10 de setembre, a les 00:00) i les imatges, a public/', () => {
    expect(PAGE_COPY.consola.date).toBe('2026-09-08T00:00:00+02:00');
    expect(PAGE_COPY.cervell.date).toBe('2026-09-09T00:00:00+02:00');
    expect(PAGE_COPY.disseny.date).toBe('2026-09-10T00:00:00+02:00');
    for (const clau of ['consola', 'cervell', 'disseny']) {
      expect([clau, existsSync(path.join(process.cwd(), 'public', PAGE_COPY[clau].image))]).toEqual([clau, true]);
      expect([clau, PAGE_COPY[clau].imageAlt.trim().length > 0]).toEqual([clau, true]);
    }
    expect(PAGE_COPY.cervell).toMatchObject({ title: 'El Cervell', image: '/assets/ui/plugins/cervell_vinyeta.jpg' });
    expect(PAGE_COPY.consola.image).toBe('/assets/ui/plugins/consola_vinyeta.jpg');
  });
});

/* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · Les
   targetes de la Consola, del Cervell i de Disseny viuen només al Mur. La
   Consola i el Cervell hi perden el botó gran (derogat de l'Onada 8) i porten
   Categoria i Etiqueta; a la seua pàgina, el botó va dalt i al final (M2). El
   Xat conserva el seu botó a la targeta (ordre del 261007, no derogada). */
describe('Onada 10 · el botó de la targeta, el del final de la pàgina i les etiquetes', () => {
  const CLAUS = SYSTEM_PAGES.map((pagina) => pagina.key);

  test('accioDeLaTargeta: només El Xat porta el botó a la targeta, i és la mateixa porta de la seua pàgina', () => {
    expect(CLAUS.filter((clau) => accioDeLaTargeta(clau))).toEqual(['xat']);
    expect(accioDeLaTargeta('xat')).toEqual({ id: 'anar-al-xat', verb: 'Anar al xat', desti: '/xat', varietat: 'primari' });
    expect(accioDeLaTargeta('xat')).toEqual(accioDeLaPagina('xat'));
    for (const clau of ['consola', 'cervell', 'disseny', 'drets-autor', 'no-hi-es', undefined]) {
      expect([clau, accioDeLaTargeta(clau)]).toEqual([clau, null]);
    }
    // El verb passa pel traductor, com el de la pàgina.
    const t = (clau, reserva) => (clau === 'section.xat.anarAlXat' ? 'Go to the chat' : reserva);
    expect(accioDeLaTargeta('xat', t).verb).toBe('Go to the chat');
    expect(accioDeLaTargeta('consola', t)).toBeNull();
  });

  test('accioAlFinal: la Consola i el Cervell repetixen el botó després del cos; la resta, no', () => {
    expect(CLAUS.filter((clau) => accioAlFinal(clau))).toEqual(['consola', 'cervell']);
    for (const clau of ['xat', 'disseny', 'drets-autor', 'no-hi-es', undefined]) {
      expect([clau, accioAlFinal(clau)]).toEqual([clau, false]);
    }
    // Cap botó al final sense un botó de pàgina que repetir.
    for (const clau of CLAUS.filter((candidata) => accioAlFinal(candidata))) {
      expect([clau, accioDeLaPagina(clau) !== null]).toEqual([clau, true]);
    }
  });

  test('les marques viuen al descriptor i no ixen al retorn d’accioDeLaPagina', () => {
    const accio = (clau) => SYSTEM_PAGES.find((pagina) => pagina.key === clau).accio;
    expect([accio('xat').targeta, accio('xat').final]).toEqual([true, undefined]);
    for (const clau of ['consola', 'cervell']) {
      expect([clau, accio(clau).targeta, accio(clau).final]).toEqual([clau, undefined, true]);
    }
    for (const clau of ['xat', 'consola', 'cervell']) {
      expect([clau, Object.keys(accioDeLaPagina(clau))]).toEqual([clau, ['id', 'verb', 'desti', 'varietat']]);
      expect([clau, Object.isFrozen(accio(clau))]).toEqual([clau, true]);
    }
  });

  /* Les etiquetes són la font única de la targeta, de la capçalera de la
     pàgina i de la targeta incrustada. Valors d'esborrany per al Mestre; el
     text «Sistema» es conserva a propòsit, perquè el filtre ?category= del
     Mur compara el text de les etiquetes (MurSection.jsx).
     P0-40/IDEA-167 (ordre directa del Mestre, 261107 05:23) · Fora «MUR»,
     «Disseny UI», «Manteniment» i «Graf»: Sistema + la categoria mare + les
     etiquetes canòniques (classificacioPaginesPubliques.js). R41 («Sistema»
     únic, sense «Mur») ho aplica també a Disseny. Arbitratge R46, Loop 3. */
  test('PAGE_COPY: la Consola i el Cervell porten Categoria i Etiqueta; Disseny, les seues dos i una tercera', () => {
    const TECNOLOGIA = '💻 Tecnologia Lliure, Dades Obertes i Disseny';
    expect(PAGE_COPY.consola.labels).toEqual([
      { text: 'Sistema', className: 'sdp-badge-system' },
      { text: TECNOLOGIA, className: 'sdp-badge-category' },
      { text: 'Node 0', className: 'sdp-badge-tag' },
      { text: 'Documentació', className: 'sdp-badge-tag' }
    ]);
    expect(PAGE_COPY.cervell.labels).toEqual([
      { text: 'Sistema', className: 'sdp-badge-system' },
      { text: TECNOLOGIA, className: 'sdp-badge-category' },
      { text: 'Node 0', className: 'sdp-badge-tag' },
      { text: 'Documentació', className: 'sdp-badge-tag' }
    ]);
    expect(PAGE_COPY.disseny.labels).toEqual([
      { text: 'Sistema', className: 'sdp-badge-system' },
      { text: TECNOLOGIA, className: 'sdp-badge-category' },
      { text: 'Pedra Seca', className: 'sdp-badge-tag' },
      { text: 'Documentació', className: 'sdp-badge-tag' }
    ]);
    for (const clau of ['consola', 'cervell']) {
      expect([clau, PAGE_COPY[clau].labels.some((etiqueta) => etiqueta.text === 'Sistema')]).toEqual([clau, true]);
    }
  });

  /* Decisió M3 del Mestre (261010) · El Rebost Domèstic i Salut es queden al
     Panell de Control (espai «La llar») i NO entren al Mur. El Mur i el
     Calendari pinten SYSTEM_PAGES: cap plugin del registre n'és una entrada,
     ni per la clau ni per la ruta. Qui en vulga afegir un ha de derogar M3, no
     pujar un recompte. */
  test('M3 · cap plugin del registre és una pàgina del sistema: el Rebost i Salut no entren al Mur', () => {
    expect(IDS_PLUGINS).toEqual(expect.arrayContaining(['rebost', 'salut']));
    expect(CLAUS.filter((clau) => IDS_PLUGINS.includes(clau))).toEqual([]);
    expect(SYSTEM_PAGES.filter((pagina) => pagina.href.startsWith(`${RUTA_PLUGINS}/`)).map((pagina) => pagina.key)).toEqual([]);
  });
});

/* Ordre del Mestre (261026_2126; prompt i pla 261026_2130, tasca 1; P1-38) ·
   «Descàrregues i Aplicacions» és una pàgina del sistema més: /page/descarregues
   (PageDetailSection, sense component propi), sense acció gran (el prompt diu
   `accio: null`; ometre-la és el mateix), i /descarregues n'és l'adreça
   curta, una redirecció d'App.jsx.
   Revisió (261026_2126, segona volta) · La redirecció ja no s'ancora al
   literal de la font: la prova src/app/App.descarregues.test.jsx munta l'app
   de veres a /descarregues i hi veu /page/descarregues i l'H1. */
describe('261026_2126 · Descàrregues i Aplicacions', () => {
  test('viu a /page/descarregues, sense acció gran ni ruta canònica que la torne a redirigir', () => {
    expect(SYSTEM_PAGES.find((pagina) => pagina.key === 'descarregues')).toEqual({ key: 'descarregues', isAvis: false, href: '/page/descarregues', nomesWeb: true });
    expect(accioDeLaPagina('descarregues')).toBeNull();
    expect(accioDeLaTargeta('descarregues')).toBeNull();
    expect(accioAlFinal('descarregues')).toBe(false);
    /* Sense ruta canònica: /page/descarregues no redirigix a /descarregues,
       que hi redirigix (cap bucle). */
    expect(resolvePageSlugPath('descarregues')).toBeNull();
  });

  /* Ordre del Mestre (261027; auditoria Gauntlet R5, G1-01 i G5-01) · Dins de
     l'app nativa no hi és: nomena Android, Google Play i l'APK (regla 2.3.10
     de l'App Store). És l'única pàgina només web. */
  test('esPaginaVisible: a la web, totes; dins de l’app nativa, totes menys les només web', () => {
    expect(SYSTEM_PAGES.filter((pagina) => pagina.nomesWeb).map((pagina) => pagina.key)).toEqual(['descarregues']);
    expect(SYSTEM_PAGES.filter((pagina) => !esPaginaVisible(pagina.key)).map((pagina) => pagina.key)).toEqual([]);
    expect(SYSTEM_PAGES.filter((pagina) => !esPaginaVisible(pagina.key, { nativa: true })).map((pagina) => pagina.key)).toEqual(['descarregues']);
    // Una clau que no és de SYSTEM_PAGES no es decidix ací.
    expect(esPaginaVisible('una-nota-qualsevol', { nativa: true })).toBe(true);
  });

  test('el copy: títol del Mestre, data de l’ordre, la imatge sense text (no la «gamberro») i les tres etiquetes', () => {
    const copy = PAGE_COPY.descarregues;
    expect(copy).toMatchObject({
      date: '2026-09-09T22:07:00+02:00',
      title: 'Descàrregues i Aplicacions',
      image: '/assets/uploads/brain/nano_descarregues_app.webp',
      imageWidth: 1024,
      imageHeight: 1024,
      imageFetchPriority: 'high'
    });
    expect(existsSync(path.join(process.cwd(), 'public', copy.image))).toBe(true);
    expect(copy.imageAlt.trim().length).toBeGreaterThan(20);
    /* Revisió (261026_2126, segona volta) · L'alt diu el que pinta la imatge:
       el que cau a la cistella són robotets i cervellets amb potetes, no xips. */
    expect(copy.imageAlt).toContain('robotets i cervellets amb potetes');
    expect(copy.imageAlt).not.toMatch(/xips/i);
    // P0-40/IDEA-167 (ordre del Mestre, 261107 05:23) · fora «Descàrregues»: categoria mare i etiqueta canònica.
    expect(copy.labels).toEqual([
      { text: 'Sistema', className: 'sdp-badge-system' },
      { text: '💻 Tecnologia Lliure, Dades Obertes i Disseny', className: 'sdp-badge-category' },
      { text: 'Documentació', className: 'sdp-badge-tag' }
    ]);
  });

  /* Cap botiga mòbil ni cap APK no és oberta a tothom (actes 261024_0345 i
     261026_1630): la pàgina no hi porta cap enllaç, ni el de proves internes
     de Google Play. 01-11-2026 (ordre del Mestre 261101_0311, T1) · L'única
     adreça de fora que porta el cos és la d'un canal obert de
     canalsDeBotiga.js (hui, només la fitxa de WordPress.org), i la promesa
     «no enllaça botigues que encara no estan obertes» continua certa. Quan
     el Mestre òbriga un altre canal, esta prova canvia amb ell.
     P0-62 (08-11-2026) · L'App Store és oberta: el cos porta les adreces dels
     dos canals oberts, en l'ordre de canalsDeBotiga.js (la fitxa d'Apple i la
     de WordPress.org), i cap de Google Play, de TestFlight ni d'un APK. Ja no
     nomena TestFlight (FRASES_DE_BOTIGA_TANCADA['app-store']).
     P0-62 bis (08-11-2026; ordre del Mestre al xat de Claude) · DEROGA, per
     a una sola adreça, el «cap de Google Play»: els tres passos dels
     verificadors porten al pas 1 la pàgina on Google els apunta
     (ADRECA_VERIFICADORS). La guarda només l'admet exacta, una sola vegada i
     com a enllaç del primer element de la llista numerada de la Subtargeta
     «Els tres passos a Google Play», dins de l'apartat Google Play. Cap altra
     adreça de play.google.com, ni de proves internes. */
  test('honestedat: les úniques adreces de fora són les de les botigues obertes (App Store i WordPress.org) i, al pas 1 de Google Play, la dels verificadors; cap botiga tancada ni cap APK', () => {
    const { html } = PAGE_COPY.descarregues;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const oberts = canalsOberts().map((canal) => canal.url);
    expect(oberts).toEqual(['https://apps.apple.com/es/app/soc-de-poble/id6826441844', 'https://wordpress.org/plugins/socdepoble/']);
    const ADRECA_VERIFICADORS = 'https://play.google.com/apps/testing/org.socdepoble.app';
    // Les de veres, en l'ordre del cos: el pas 1 d'Android, la fitxa de l'App Store i la de WordPress.org.
    expect([...new Set([...html.matchAll(/https?:\/\/[^"'\s<]+/gi)].map((m) => m[0]))]).toEqual([ADRECA_VERIFICADORS, ...oberts]);
    expect(html.split(ADRECA_VERIFICADORS)).toHaveLength(2);
    expect([...doc.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.getAttribute('target'), a.getAttribute('rel')]))
      .toEqual([ADRECA_VERIFICADORS, ...oberts].map((url) => [url, '_blank', 'noopener noreferrer']));
    // On és: el primer pas de la llista numerada de la Subtargeta que ve després de l'H4 «Google Play».
    const verificadors = doc.querySelector(`a[href="${ADRECA_VERIFICADORS}"]`);
    const pas = verificadors.closest('li');
    const caixa = pas.closest('div.sdp-subtargeta');
    expect([pas.parentElement.tagName, pas.parentElement.firstElementChild === pas, caixa.firstElementChild.textContent])
      .toEqual(['OL', true, 'Els tres passos a Google Play']);
    let titol = caixa.previousElementSibling;
    while (titol && titol.tagName !== 'H4') titol = titol.previousElementSibling;
    expect(titol?.textContent).toBe('Google Play');
    // El text de l'enllaç és la mateixa adreça sense el protocol, també una sola vegada.
    const TEXT_VERIFICADORS = ADRECA_VERIFICADORS.replace('https://', '');
    expect([verificadors.textContent, html.split(TEXT_VERIFICADORS).length]).toEqual([TEXT_VERIFICADORS, 3]);
    // Fora d'eixa adreça exacta (l'href i el seu text), res de Google Play, de TestFlight, de proves internes ni d'un APK.
    expect(html.replace(ADRECA_VERIFICADORS, '').replace(TEXT_VERIFICADORS, '')).not.toMatch(/play\.google\.com|testflight\.apple\.com|internaltest|\.apk\b/i);
    // Cap canal tancat no porta adreça ni enllaç al cos.
    for (const canal of CANALS_DE_BOTIGA.filter((c) => c.url === null)) {
      expect([canal.id, [...doc.querySelectorAll('a')].some((a) => a.textContent.includes(canal.nom))]).toEqual([canal.id, false]);
    }
    expect(doc.body.textContent).toContain('Una promesa: esta pàgina no enllaça botigues que encara no estan obertes.');
    for (const cami of ['Google Play', 'APK', 'App Store', 'Windows, Mac i Linux', 'WordPress.org', 'CRDT', 'ADR-2026-08']) {
      expect([cami, html.includes(cami)]).toEqual([cami, true]);
    }
    expect(html).not.toMatch(/TestFlight/i);
    const text = new DOMParser().parseFromString(html, 'text/html').body.textContent;
    expect(text).toContain('hui això és una visió, no una funció');
  });

  /* Revisió (261026_2126, segona volta) · De cada camí, el que diuen les actes
     i res més: de l'APK, el fet i on eixirà l'enllaç, sense cap consell que
     ningú no ha demanat. P0-62 (08-11-2026) · De l'App Store, el que diu la
     consulta d'Apple del 08-11-2026 (versió 1.0 del 6 de novembre, gratis,
     iOS 16.0 o posterior) i l'enllaç a la fitxa, el mateix del canal obert.
     De Google Play, que encara no és per a tothom, sense cap enllaç.
     P0-62 bis (08-11-2026; ordre del Mestre al xat de Claude) · L'App Store,
     amb el botó gran de marca, centrat (div.sdp-accions, les classes
     canòniques de components.css). Google Play, amb els tres passos literals
     de les tres pantalles i l'únic enllaç d'instruccions del pas 1 (la prova
     de dalt en guarda l'adreça); la fitxa de la botiga, encara cap. */
  test('honestedat: de l’App Store, de Google Play i de l’APK, només el fet', () => {
    const { html } = PAGE_COPY.descarregues;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const text = doc.body.textContent.replace(/\s+/g, ' ');
    expect(text).toContain("Sóc de Poble ja és a l'App Store d'Apple per a iPhone i iPad, gratis: Apple en va publicar la versió 1.0 el 6 de novembre de 2026, i cal tindre iOS o iPadOS 16 o posterior.");
    const fitxa = doc.querySelector('a[href^="https://apps.apple.com/"]');
    expect([fitxa?.textContent, fitxa?.className, fitxa?.parentElement.className, fitxa?.parentElement.children.length])
      .toEqual(["Disponible a l'App Store", 'sdp-boto sdp-boto--marca sdp-boto--apple sdp-boto--gran', 'sdp-accions', 1]);
    expect(canalsOberts().find((canal) => canal.id === 'app-store')?.url).toBe(fitxa.getAttribute('href'));
    expect(text).not.toMatch(/encara no és a l[’']App Store|TestFlight|grup de treball intern/);
    expect(text).toContain("L'aplicació per a Android ja està donada d'alta a Google Play, però encara no està publicada per a tothom");
    // Els tres passos: una llista numerada de tres, amb els rètols de les pantalles literals, en anglés.
    const passos = [...doc.querySelectorAll('div.sdp-subtargeta ol > li')].map((li) => li.textContent.replace(/\s+/g, ' '));
    expect(passos).toHaveLength(3);
    expect(passos[0]).toMatch(/^Pas 1 · Pantalla 1\. Entra a play\.google\.com\/apps\/testing\/org\.socdepoble\.app i prem el botó blau gran «Become a tester» \(Convertir-se en verificador\)\.$/);
    expect(passos[1]).toMatch(/^Pas 2 · Pantalla 2, «You're a tester»\. NO toques el botó de baix, «Leave the program».*«download it on Google Play»\.$/);
    expect(passos[2]).toMatch(/^Pas 3 · Pantalla 3, Google Play\. Prem «Instal·lar» i deixa l'app instal·lada al mòbil\..*12 verificadors.*14 dies\.$/);
    expect(text).toContain("L'adreça del primer pas no és la fitxa de la botiga");
    expect(html).not.toContain('la fa servir el grup');
    expect(text).toContain("Hui encara no hi ha APK públic de Sóc de Poble. Quan n'hi haja un, l'enllaç oficial eixirà en esta pàgina.");
    expect(html).not.toContain('no instal·les');
  });

  /* 01-11-2026 (ordre del Mestre 261101_0311, T1) · DEROGA «de WordPress.org,
     l'aprovació i res més» (31-10-2026, Ronda 1: la fitxa encara no era
     pública). El connector socdepoble 1.1.10 és públic al directori
     (verificat en viu el 01-11-2026: la fitxa i api.wordpress.org, 200;
     Stable tag 1.1.10). El cos ho diu amb l'enllaç a la fitxa, i el codi curt
     i la plantilla que nomena són els del connector d'este repositori: si el
     connector els canvia, esta prova cau i el text s'ha de tornar a escriure.
     03-11-2026 (ordre 261103_0522; Gauntlet O7-9, ronda 2, PC-04) · SVN oficial
     comprovat en lectura: tags/1.1.12 r3781091, Stable tag 1.1.12 a
     trunk/readme.txt (r3781090), assets r3781093. Una sola veritat amb
     /versions i /fediversity: la versió publicada és la 1.1.12. */
  test('honestedat: de WordPress.org, la fitxa pública i com s’activa, ancorats al connector', () => {
    const { html } = PAGE_COPY.descarregues;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const text = doc.body.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('El connector oficial de Sóc de Poble, amb el nom «socdepoble», ja és públic al directori oficial de WordPress.org, en la versió 1.1.12: wordpress.org/plugins/socdepoble.');
    expect(text).toContain('el pot buscar, instal·lar i activar des del tauler del seu WordPress');
    const fitxa = doc.querySelector('a[href="https://wordpress.org/plugins/socdepoble/"]');
    expect(fitxa?.textContent).toBe('wordpress.org/plugins/socdepoble');
    // L'enllaç és el del canal obert de canalsDeBotiga.js, no una adreça escrita a banda.
    expect(canalsOberts().find((canal) => canal.id === 'wordpress-org')?.url).toBe(fitxa.getAttribute('href'));
    // El codi curt, l'atribut i la plantilla, els del connector (wordpress-plugin/includes/marcatge.php).
    const marcatge = readFileSync(path.join(process.cwd(), 'wordpress-plugin/includes/marcatge.php'), 'utf8');
    expect(marcatge).toMatch(/add_shortcode\(\s*'socdepoble_app'/);
    expect(marcatge).toMatch(/'poble'\s*=>\s*''/);
    expect(marcatge).toContain("__( 'Sóc de Poble · full screen', 'socdepoble' )");
    expect([...doc.querySelectorAll('code')].map((codi) => codi.textContent)).toEqual(['[socdepoble_app poble="la-torre-de-les-macanes"]']);
    expect(text).toContain('i amb la plantilla «Sóc de Poble · full screen», que es tria al quadre Plantilla de la pàgina. És el que ja fa gentdelatorre.net, la web de Gent de la Torre.');
    // La versió és una de les publicades pel connector (el registre de canvis del readme la porta).
    expect(readFileSync(path.join(process.cwd(), 'wordpress-plugin/readme.txt'), 'utf8')).toMatch(/^= 1\.1\.12 =$/m);
    // Res de les fases anteriors: ni «aprovat» a soles, ni la fitxa que «s'obri» més avant.
    expect(text).not.toMatch(/s'obri amb la primera versió|ha aprovat el connector/);
  });
});

/* Ordre del Mestre (30-10-2026; candidatura NLnet NGI Fediversity, expedient
   2026-08-1a6) · «Candidatura Europea NLnet · NGI Fediversity» és una pàgina
   del sistema més: /page/fediversity (PageDetailSection, sense component
   propi), sense acció gran i sense `nomesWeb` (el cos no nomena cap altra
   plataforma mòbil). /fediversity n'és l'adreça curta, una redirecció
   d'App.jsx (src/app/App.fediversity.test.jsx). El text i les seues
   afirmacions, a src/sections/text/pageContent.fediversity.test.js. */
describe('30-10-2026 · Candidatura Europea NLnet · NGI Fediversity', () => {
  test('viu a /page/fediversity, l’última de SYSTEM_PAGES, sense acció gran ni ruta canònica', () => {
    expect(SYSTEM_PAGES.at(-1)).toEqual({ key: 'fediversity', isAvis: false, href: '/page/fediversity' });
    expect(accioDeLaPagina('fediversity')).toBeNull();
    expect(accioDeLaTargeta('fediversity')).toBeNull();
    expect(accioAlFinal('fediversity')).toBe(false);
    // Sense ruta canònica: /page/fediversity no redirigix a /fediversity, que hi redirigix (cap bucle).
    expect(resolvePageSlugPath('fediversity')).toBeNull();
    // Es veu a la web i dins de l'app nativa.
    expect([esPaginaVisible('fediversity'), esPaginaVisible('fediversity', { nativa: true })]).toEqual([true, true]);
  });

  test('el copy: la portada a public/, amb alt, i les tres etiquetes', () => {
    const copy = PAGE_COPY.fediversity;
    expect(copy).toMatchObject({ title: 'Candidatura Europea NLnet · NGI Fediversity', image: '/assets/uploads/fediversity-hero.webp' });
    expect(existsSync(path.join(process.cwd(), 'public', copy.image))).toBe(true);
    expect(copy.imageAlt.trim().length).toBeGreaterThan(20);
    // P0-40/IDEA-167 (ordre del Mestre, 261107 05:23) · fora «Candidatura europea»: Sistema, la mare i dues etiquetes canòniques.
    expect(copy.labels.map((etiqueta) => etiqueta.className)).toEqual(['sdp-badge-system', 'sdp-badge-category', 'sdp-badge-tag', 'sdp-badge-tag']);
    expect(copy.labels.map((etiqueta) => etiqueta.text)).toEqual(['Sistema', '💻 Tecnologia Lliure, Dades Obertes i Disseny', 'NGI Fediversity', 'Documentació']);
  });
});

describe('RUTA_DRETS_AUTOR', () => {
  test('és la ruta de l’entrada «drets-autor»: una sola font per a la targeta i la capçalera', () => {
    expect(RUTA_DRETS_AUTOR).toBe('/page/drets-autor');
    expect(RUTA_DRETS_AUTOR).toBe(SYSTEM_PAGES.find((pagina) => pagina.key === 'drets-autor').href);
  });
});
