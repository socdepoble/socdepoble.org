/**
 * T71 · paginaDeText: de la ruta desada en connectar a la pàgina de text de
 * veres, amb la precedència de les rutes (TextRoute, PageDetailSection), i
 * les props que la pinten igual a TextSection i al lector de connexions.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { RUTES_SENSE_PAGINA_DE_TEXT, pageKeyDeRuta, paginaDeRuta, propsDePaginaDeText, rutaVigentDePagina } from './paginaDeText.js';
import { COPYRIGHT_SDP, COPYRIGHT_VIQUIPEDIA, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { MAXIM_LEMA } from '../../data/limitsText.js';
import { DRETS_IMATGES, DRETS_TEXT, esFotoValida, esLlicenciaLliure, triaImatges } from '../pobles/pobleDeViquipedia.js';
/* VQ · Fase 3a (261030) · El panell, la cau i la regla de fitxa completa que la pàgina descriu. */
import { TEXTOS_VIQUIPEDIA } from '../pobles/CreditsDeViquipedia.jsx';
import { VIDA_MS } from '../pobles/cauDeViquipedia.js';
import { CAMPS_DE_FITXA } from '../pobles/fitxaDelPoble.js';
import { LLICENCIA_PER_DEFECTE, LLICENCIES, OPCIO_ACTUAL } from '../../components/universal/drets/llicencies.js';
import { accioDeLaPagina } from '../../config/systemPages.js';
import { ETIQUETES, IDS_PAGINES, LLINDAR_REBUTS_RANCIS_DIES, paginaConsola, paginesConsola } from '../consola/consolaPagines.js';
import { CONFIANCES, TIPUS_NODE } from '../consola/mapa/contracteMapa.js';
import { toDeColor } from '../consola/semafor.js';

/* ── La llei T8 (Gauntlet 261030, cicle 2) ────────────────────────────────
   Ordres del Mestre del 30-10-2026 (decisions 261030): entradilla → H3, i
   només etiquetes de prosa, enllaços vius i imatges locals. La llei i les
   seues eines viuen a lleiT8Prova.js (només per a les proves): la mateixa
   que passen els qui pinten el cos (PageDetailSection.consola.test.jsx i
   PublicacioDetall.sistema.test.jsx), sense cap còpia. */
import { cosDe, infraccionsT8, midesWebp } from '../../../tests/helpers/lleiT8Prova.js';

/* Gauntlet 261016_1530 (Bloc 3.6.3; F64) · Ampliada a posta: el manifest és a
   /anima, i /iaia (la seua ruta d'abans, ara la fitxa de la IAIA) i /ia es
   conserven com a àlies per a les connexions ja desades a una 'pagina'. */
test('les rutes de text amb pageKey propi: /anima i els àlies /iaia i /ia són «anima», amb query, fragment o barra final', () => {
  for (const ruta of ['/anima', '/anima?x=1', '/anima/', '/anima#reflexions', '/page/anima', '/page/ia']) expect([ruta, pageKeyDeRuta(ruta)]).toEqual([ruta, 'anima']);
  expect(paginaDeRuta('/anima')).toEqual({ pageKey: 'anima', page: PAGE_COPY.anima });
  for (const ruta of ['/iaia', '/iaia?x=1', '/iaia/', '/iaia#reflexions', '/ia']) expect(pageKeyDeRuta(ruta)).toBe('anima');
  expect(pageKeyDeRuta('/ia?x=1')).toBe('anima');
  expect(pageKeyDeRuta('/ia/')).toBe('anima');
  expect(pageKeyDeRuta('/ia#reflexions')).toBe('anima');
  expect(pageKeyDeRuta('/projecte')).toBe('projecte');
  expect(pageKeyDeRuta('/legal')).toBe('legal');
  expect(paginaDeRuta('/iaia')).toEqual({ pageKey: 'anima', page: PAGE_COPY.anima });
});

/* Bloc 3.6.3 · Revisió adversarial · La ruta on es llig hui la pàgina d'una
   connexió: les rutes velles del manifest porten a /anima (amb la consulta i
   el fragment), i cap altra ruta canvia. Sense açò, «Obri l'original» d'una
   connexió desada a /iaia acabava a la fitxa de la IAIA. */
test('rutaVigentDePagina: /iaia i /ia del manifest → /anima; la resta, tal qual', () => {
  expect(rutaVigentDePagina('/iaia')).toBe('/anima');
  expect(rutaVigentDePagina('/ia')).toBe('/anima');
  expect(rutaVigentDePagina('/iaia/')).toBe('/anima');
  expect(rutaVigentDePagina('/iaia#reflexions')).toBe('/anima#reflexions');
  expect(rutaVigentDePagina('/ia?origen=prova')).toBe('/anima?origen=prova');
  expect(rutaVigentDePagina('/iaia/?x=1#y')).toBe('/anima?x=1#y');
  for (const ruta of ['/anima', '/anima#reflexions', '/page/ia', '/projecte', '/legal', '/perfil/iaia-maria', '/iaia-maria',
    '/xat', '/wikidepoble?item=x', '/iaiaa', '/ia/x', '', 'https://socdepoble.org/iaia', '//iaia']) {
    expect([ruta, rutaVigentDePagina(ruta)]).toEqual([ruta, ruta]);
  }
  expect(rutaVigentDePagina(undefined)).toBeUndefined();
});

/* T8 (ordre del Mestre, 261001) · /fedivers, on porta la franja de l'amfitrió,
   és una pàgina de text de veres: per la ruta i per /page/fedivers (la ruta
   canònica de PAGE_ROUTE_MAP), sense h1 ni h2 dins del cos i sense cap
   títol acabat en punt. */
test('/fedivers es resol per la ruta i per /page/fedivers, i el cos comença en h3', () => {
  expect(pageKeyDeRuta('/fedivers')).toBe('fedivers');
  expect(pageKeyDeRuta('/fedivers?x=1')).toBe('fedivers');
  expect(pageKeyDeRuta('/page/fedivers')).toBe('fedivers');
  expect(paginaDeRuta('/fedivers')).toEqual({ pageKey: 'fedivers', page: PAGE_COPY.fedivers });
  const { title, subtitle, html } = PAGE_COPY.fedivers;
  expect([title, subtitle]).toEqual(['Nodes i Fedivers', 'Com es connecten els pobles?']);
  // La llei T8 (cicle 2, 261030): entradilla → H3, i només etiquetes de prosa, enllaços vius i imatges locals.
  expect(infraccionsT8(html)).toEqual([]);
  expect(title.trim().endsWith('.')).toBe(false);
  // Els dos nodes actius, clicables (ordre del Mestre); la negreta es queda.
  const enllacos = [...cosDe(html).querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.textContent]);
  expect(enllacos).toEqual([
    ['https://socdepoble.org', 'socdepoble.org'], ['https://gentdelatorre.net', 'gentdelatorre.net'],
    ['/perfil', 'perfil'], ['/mur', 'Mur'], ['/roadmap', 'full de ruta']
  ]);
  expect(html).toContain('<strong>socdepoble.org</strong></a>');
  // El Fedivers és horitzó, no funció: la pàgina ho diu.
  expect(html).toContain('Hui encara no està fet');
  // La franja només ix amb poc espai (isCompact a App.jsx); amb més, la barra negra només diu el nom.
  expect(html).toContain('si té poc espai, com al mòbil, una franja davall de la barra negra');
  expect(html).toContain('si en té més, la barra negra només en diu el nom');
});

/* Ordre del Mestre (261007) · «El Xat» viu a /page/xat (PageDetailSection),
   sense ruta pròpia: el lector de connexions la resol pel slug. /xat és el
   Xat (XatSection), no cap pàgina de text. «L'Ànima» continua a /iaia (des
   del Bloc 3.6.3, a /anima; /iaia en queda com a àlies de connexió). El
   cos seguix l'anatomia de la UniversalPage: cap h1 ni h2, comença en h3. */
test('261007 · /page/xat és «El Xat»; /xat no és cap pàgina; l’Ànima continua a /iaia', () => {
  expect(pageKeyDeRuta('/page/xat')).toBe('xat');
  expect(paginaDeRuta('/page/xat')).toEqual({ pageKey: 'xat', page: PAGE_COPY.xat });
  expect(paginaDeRuta('/page/xat?x=1#y')).toEqual({ pageKey: 'xat', page: PAGE_COPY.xat });
  expect(paginaDeRuta('/xat')).toBeNull();
  expect(paginaDeRuta('/iaia')).toEqual({ pageKey: 'anima', page: PAGE_COPY.anima });
  const { title, html, image, imageWidth, imageHeight, imageFetchPriority, date } = PAGE_COPY.xat;
  expect([title, image, imageWidth, imageHeight, imageFetchPriority]).toEqual(['El Xat', '/assets/uploads/brain/xat_portada.webp', 1024, 1024, 'high']);
  // La data que fixa el Mestre: 01:30 hora local del 07-10-2026 (capçalera de pageContent.js).
  expect(date).toBe('2026-10-07T01:30:00+02:00');
  // Escrit com a classe [12]: design_guard llig els literals de capçalera de qualsevol .js.
  expect(html).not.toMatch(/<h[12]\b/i);
  expect(html.trim()).toMatch(/^<h3>/);
  expect(propsDePaginaDeText(PAGE_COPY.xat, 'xat')).toMatchObject({ heroWidth: 1024, heroHeight: 1024, heroFetchPriority: 'high' });
});

/* Ordre del Mestre (261007) · «Drets d'autor» viu a /page/drets-autor
   (PageDetailSection), sense ruta ni component propis: una entrada de
   PAGE_COPY que pinta la UniversalPage de sempre. Etiqueta «Sistema», la data
   que fixa el Mestre (2026-01-30, 00:00 hora local, perquè isca avall del
   Mur) i un cos informatiu EXACTE: el codi és AGPL-3.0 (LICENSE), el
   contingut naix amb CC BY-NC-SA 4.0, les dos eixides privades i la llista
   de l'editor, que és el catàleg de llicencies.js sense cap invent. */
describe('261007 · /page/drets-autor és «Drets d’autor»', () => {
  const pagina = PAGE_COPY['drets-autor'];
  const html = pagina.html;
  const textDe = (tros) => tros.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  test('es resol pel slug i porta les props de qualsevol pàgina de text', () => {
    expect(pageKeyDeRuta('/page/drets-autor')).toBe('drets-autor');
    expect(paginaDeRuta('/page/drets-autor?x=1#y')).toEqual({ pageKey: 'drets-autor', page: pagina });
    expect(pageKeyDeRuta('/drets-autor')).toBeNull();
    expect(propsDePaginaDeText(pagina, 'drets-autor')).toEqual({
      title: "Drets d'autor",
      subtitle: 'Totes les llicències, explicades amb paraules de poble',
      lead: 'Per què el que publiques naix amb CC BY-NC-SA 4.0, què vol dir cada llicència i quan convé triar-ne una altra.',
      // La portada i el seu text alternatiu, literals: la il·lustració de
      // la pàgina, no les reserves de sempre (que també passarien).
      heroImage: '/assets/nano_cards/drets_autor_comic.jpg',
      heroAlt: "Un foraster intentant copiar una recepta mentre la gent del poble se'l mira rient (Còmic)",
      labels: [{ text: 'Sistema', className: 'sdp-badge-system' }],
      copyright: COPYRIGHT_SDP,
      ...dataHoraDeBarra({ creat: '2026-01-30T00:00:00+01:00' })
    });
  });

  test('la data del Mestre: 30-01-2026 a les 00:00 hora local (hivern, +01:00)', () => {
    expect(pagina.date).toBe('2026-01-30T00:00:00+01:00');
    expect(dataHoraDeBarra({ creat: pagina.date })).toMatchObject({ time: '00:00', date: '30/01/26' });
  });

  test('el títol, el subtítol i l’entradilla són els de la targeta incrustada a «Legal i privacitat»', () => {
    const targeta = PAGE_COPY.legal.html.match(/<div data-sdp-targeta="pagina:drets-autor"[^>]*>/)?.[0] ?? '';
    const atribut = (nom) => targeta.match(new RegExp(`${nom}="([^"]*)"`))?.[1];
    expect(atribut('data-ruta')).toBe('/page/drets-autor');
    expect([atribut('data-titol'), atribut('data-subtitol'), atribut('data-entradilla')]).toEqual([pagina.title, pagina.subtitle, pagina.lead]);
  });

  test('l’anatomia de la UniversalPage: cap h1 ni h2, títols h3 i h4 sense punt final, negretes per a escanejar', () => {
    // Escrit com a classe [12]: design_guard llig els literals de capçalera de qualsevol .js.
    expect(html).not.toMatch(/<h[12]\b/i);
    expect(html.trim()).toMatch(/^<h3>/);
    const titols = [...html.matchAll(/<h([34])>([^<]*)<\/h\1>/g)].map(([, nivell, text]) => [nivell, text]);
    /* Onada 8 (261009; requeriments 261009_1300, punt 6) · L'apartat nou de
       la Viquipèdia i Wikimedia Commons, darrere del contingut. */
    expect(titols.filter(([nivell]) => nivell === '3').map(([, text]) => text)).toEqual([
      'Dos coses, dos llicències',
      'El codi: AGPL-3.0, lliure i gratuït',
      'El contingut: CC BY-NC-SA 4.0 de sèrie',
      'La Viquipèdia i Wikimedia Commons: el que prenem i com ho citem',
      'Per què triar una llicència privada o el domini públic',
      "Les llicències que pots triar a l'editor"
    ]);
    expect(titols.filter(([nivell]) => nivell === '4').length).toBeGreaterThanOrEqual(4);
    for (const [, text] of titols) expect(text.trim().endsWith('.')).toBe(false);
    expect((html.match(/<strong>/g) || []).length).toBeGreaterThan(20);
    // La targeta canònica de Legal és l'única excepció a la prosa.
    // Validem tot el grup abans de llevar-lo: cap div arbitrari queda admés.
    const cos = new DOMParser().parseFromString(html, 'text/html').body;
    const grup = cos.querySelector('div[data-sdp-targetes]');
    const targeta = grup?.firstElementChild;
    const atributs = (element) => Object.fromEntries([...element.attributes].map(({ name, value }) => [name, value]));
    expect([...cos.querySelectorAll('div')]).toEqual([grup, targeta]);
    expect(atributs(grup)).toEqual({ 'data-sdp-targetes': '', class: 'sdp-targetes', 'data-forma': 'sola', 'data-alineacio': 'dreta' });
    expect(grup.children).toHaveLength(1);
    expect(atributs(targeta)).toEqual({
      'data-sdp-targeta': 'pagina:legal', class: 'sdp-targeta', 'data-ruta': '/legal',
      // L'embed conserva la instantània desada, no el copy viu de la destinació.
      'data-titol': 'Legal i privacitat',
      'data-subtitol': "Condicions d'ús, responsabilitat, protecció de dades i telemetria honesta",
      'data-entradilla': "Sense lletra menuda, sense galetes de seguiment i sense trampes. T'expliquem com funciona Sóc de Poble, quins drets tens i què fem per a protegir la teua intimitat.",
      'data-autor': 'Sóc de Poble', 'data-autor-ruta': '/projecte'
    });
    expect(targeta.childNodes).toHaveLength(1);
    expect(targeta.firstElementChild.outerHTML).toBe('<a href="/legal" rel="noopener noreferrer nofollow">Legal i privacitat</a>');
    grup.remove();
    // Fora de la targeta, només etiquetes de prosa i l'enllaç de /legal.
    const etiquetes = new Set([...cos.querySelectorAll('*')].map((element) => element.localName));
    expect([...etiquetes].filter((e) => !['h3', 'h4', 'p', 'ul', 'li', 'strong', 'code', 'a'].includes(e))).toEqual([]);
    expect([...cos.querySelectorAll('a')].map(atributs)).toEqual([{ href: '/legal' }]);
  });

  test('el codi: AGPL-3.0, el mateix que diu el fitxer LICENSE', () => {
    const llicencia = readFileSync(resolve(process.cwd(), 'LICENSE'), 'utf8');
    expect(llicencia).toContain('GNU Affero General Public License');
    expect(llicencia).toContain('either version 3 of the');
    const codi = textDe(html.slice(html.indexOf('<h3>El codi'), html.indexOf('<h3>El contingut')));
    expect(codi).toContain('AGPL-3.0 (GNU Affero General Public License, versió 3 o posterior)');
    expect(codi).toContain('LICENSE');
    for (const idea of ['gratuït', 'Fedivers', 'millorar-lo entre tots', 'plugins i funcionalitats atòmiques', "l'obligació de compartir les millores"]) {
      expect(codi, idea).toContain(idea);
    }
  });

  test('el contingut naix de sèrie amb CC BY-NC-SA 4.0 (LLICENCIA_PER_DEFECTE), i cada lletra s’explica', () => {
    expect(LLICENCIA_PER_DEFECTE).toBe('CC BY-NC-SA 4.0');
    const contingut = textDe(html.slice(html.indexOf('<h3>El contingut'), html.indexOf('<h3>Per què triar')));
    expect(contingut).toContain(`Una nota nova naix de sèrie amb la llicència ${LLICENCIA_PER_DEFECTE}`);
    expect(contingut).toContain('BY (Reconeixement): qui la use ha de dir que és teua.');
    expect(contingut).toContain('NC (No comercial): ningú no en pot fer negoci sense el teu permís.');
    expect(contingut).toContain("SA (Compartir igual): qui l'adapte o la millore l'ha de tornar al poble amb esta mateixa llicència.");
  });

  /* Onada 8 (261009; requeriments 261009_1300, punt 6) · L'apartat de la
     Viquipèdia diu NOMÉS el que fa el codi: el copyright dels pobles
     (COPYRIGHT_VIQUIPEDIA), l'atribució de l'eina de pobles nous (DRETS_TEXT
     i DRETS_IMATGES), les llicències i les fotos que admet (esLlicenciaLliure
     i esFotoValida), el límit de l'entradilla (MAXIM_LEMA) i les tres fotos
     (triaImatges). Si el codi canvia, esta prova cau i la pàgina s'ha de
     tornar a escriure. */
  test('Onada 8 · la Viquipèdia i Wikimedia Commons: el que diu la pàgina és el que fa el codi', () => {
    const viqui = textDe(html.slice(html.indexOf('<h3>La Viquipèdia'), html.indexOf('<h3>Per què triar')));
    expect(viqui).toContain('es publica amb CC BY-SA 4.0');
    expect(viqui).toContain(`«${COPYRIGHT_VIQUIPEDIA}»`);
    expect(viqui).toContain('«Publicat a la Viquipèdia»');
    expect(viqui).toContain(`«${DRETS_TEXT}»`);
    expect(viqui).toContain(`«${DRETS_IMATGES}»`);
    expect(viqui).toContain(`retallat si passa de ${MAXIM_LEMA} caràcters`);
    expect(viqui).toContain('CC0, domini públic, CC BY o CC BY-SA');
    for (const llicencia of ['CC0', 'Public domain', 'CC BY 4.0', 'CC BY-SA 3.0 es']) expect([llicencia, esLlicenciaLliure(llicencia)]).toEqual([llicencia, true]);
    for (const llicencia of ['CC BY-NC 4.0', 'CC BY-ND 4.0', 'CC BY-NC-SA 4.0']) expect([llicencia, esLlicenciaLliure(llicencia)]).toEqual([llicencia, false]);
    // «de 1000 píxels d'amplada o més» i «Mai l'escut, la bandera ni un mapa».
    expect(viqui).toContain("de 1000 píxels d'amplada o més");
    const foto = { src: 'https://upload.wikimedia.org/x.jpg', mime: 'image/jpeg', amplada: 1000, alcada: 600, fitxer: 'Plaça.jpg', llicencia: 'CC BY-SA 4.0' };
    expect(esFotoValida(foto)).toBe(true);
    expect(esFotoValida({ ...foto, amplada: 999 })).toBe(false);
    for (const fitxer of ['Escut de la Torre.jpg', 'Bandera de la Torre.jpg', 'Mapa de la Torre.jpg']) expect([fitxer, esFotoValida({ ...foto, fitxer })]).toEqual([fitxer, false]);
    // Tres fotos: la panoràmica, la de l'avatar i una de reserva.
    expect(Object.keys(triaImatges([]))).toEqual(['hero', 'avatar', 'reserva']);
  });

  /* Onada 8 · «Hui encara no està fet del tot»: cap mòdul de l'app crida
     l'eina (només ella mateixa i les proves). El dia que algú l'endolle al
     registre, esta prova cau i la pàgina s'ha de posar al dia.
     VQ · Fase 3a (ordre nocturna 261030_0252; 261030) · Ja l'han endollada:
     la crida UN sol mòdul, el panell diferit de la pàgina d'un poble amb la
     fitxa incompleta, i la pàgina diu el que fa (el botó, la cau de 30 dies,
     els crèdits, les fotos només en eixe apartat) i el que encara no (l'alta
     i el servidor, Fase 3c). Si algú la crida des d'un altre lloc, o el codi
     deixa de dir el que diu la pàgina, esta prova cau. */
  test('VQ · la pàgina diu que l’eina de pobles nous només treballa des del botó de la fitxa incompleta, i és veritat', () => {
    const viqui = textDe(html.slice(html.indexOf('<h3>La Viquipèdia'), html.indexOf('<h3>Per què triar')));
    const recte = (text) => text.replace(/’/g, "'");
    expect(viqui).not.toContain('Hui encara no està fet del tot');
    expect(viqui).toContain('Què fa hui i què encara no:');
    expect(viqui).toContain(`el botó «${recte(TEXTOS_VIQUIPEDIA.porta[1])}»`);
    expect(viqui).toContain(`«${recte(TEXTOS_VIQUIPEDIA.creditsTitol[1])}»`);
    expect(viqui).toContain('passats 30 dies, t\'oferix tornar-les a portar');
    expect(VIDA_MS.complet).toBe(30 * 24 * 60 * 60 * 1000);
    expect(viqui).toContain('sense canviar res del que la fitxa ja porta');
    expect(viqui).toContain('Les fotos de Commons només es mostren en eixe apartat, no a la capçalera ni a la targeta.');
    expect(viqui).toContain("Encara no s'activa sola quan algú s'apunta des d'un poble nou, no crea pobles nous i no guarda res al servidor");
    // Les dades que falten: les mateixes que fan incompleta una fitxa.
    expect(viqui).toContain("li falta l'entradilla, la foto, la província o la comarca");
    expect(CAMPS_DE_FITXA).toEqual(['content', 'image_url', 'provincia', 'comarca']);
    const arrel = resolve(process.cwd(), 'src');
    const fonts = readdirSync(arrel, { recursive: true }).map(String)
      .filter((fitxer) => /\.(?:js|jsx)$/.test(fitxer) && !/\.test\.(?:js|jsx)$/.test(fitxer));
    const quiLaCrida = fonts.filter((fitxer) => !fitxer.endsWith('pobleDeViquipedia.js')
      && readFileSync(resolve(arrel, fitxer), 'utf8').includes('pobleDeViquipedia('));
    expect(quiLaCrida.map((fitxer) => fitxer.split('\\').join('/'))).toEqual(['sections/pobles/PanellDeViquipedia.jsx']);
  });

  test('les eixides privades: «Copyright (C)», tots els drets reservats, i el domini públic CC0', () => {
    const privades = textDe(html.slice(html.indexOf('<h3>Per què triar'), html.indexOf('<h3>Les llicències')));
    expect(privades).toContain('«Copyright (C)», tots els drets reservats:');
    expect(privades).toContain('El domini públic, CC0:');
    expect(privades).toContain('renúncia irrevocable');
  });

  test('la llista de l’editor és el catàleg de llicencies.js: mateix ordre, mateixos noms i explicacions, cap invent', () => {
    const llista = html.slice(html.indexOf("<h3>Les llicències que pots triar a l'editor</h3>"));
    const elements = [...llista.matchAll(/<li><strong>([^<]*):<\/strong> ([^<]*)<\/li>/g)].map(([, nom, explicacio]) => [nom, explicacio]);
    // El catàleg escriu l'apòstrof tipogràfic; PAGE_COPY, el recte.
    const recte = (text) => text.replace(/’/g, "'");
    expect(elements).toEqual(LLICENCIES.map((l) => [l.codi ? `${l.codi} · ${l.nom}` : l.nom, recte(l.explicacio)]));
    // Cap codi de llicència que no siga del catàleg.
    const codis = new Set(LLICENCIES.map((l) => l.codi).filter(Boolean));
    for (const [codi] of llista.matchAll(/CC(?: BY(?:-[A-Z]{2})*| ?0) \d\.\d/g)) expect(codis.has(codi), codi).toBe(true);
    expect(llista).toContain(`«${OPCIO_ACTUAL.nom}»`);
  });

  /* Línia I1 (pla 261008_1201) · El paràgraf de l'editor diu el que fa hui
     la píndola de davall del títol (BotoDretsAutor: la llicència triada o
     «Elegir drets d'autor») i el copyright de davall del títol (PageFrame:
     dins de l'editor obri el selector; fora, enllaç a esta pàgina). */
  test('el paràgraf de l’editor: la píndola mostra la llicència triada, i el copyright de davall del títol també obri el selector dins de l’editor', () => {
    const llista = html.slice(html.indexOf("<h3>Les llicències que pots triar a l'editor</h3>"), html.indexOf('<h4>Les Creative Commons</h4>'));
    const paragraf = textDe(llista.slice(llista.indexOf('<p>')));
    expect(paragraf).toContain("la píndola de davall del títol mostra la llicència que has triat, o «Elegir drets d'autor» si encara no n'has triat cap");
    expect(paragraf).toContain('la pots tornar a canviar quan vulgues');
    expect(paragraf).toContain("Dins de l'editor, la línia del copyright de davall del títol també obri el selector");
    expect(paragraf).toContain("fora de l'editor i a les targetes, eixa línia és un enllaç a esta pàgina");
    expect(paragraf).toContain('Res no canvia fins que prems «Desar autoria»');
    // Ja no parla d'un botó que sempre diu «Elegir drets d'autor», i cap enllaç nou: l'únic continua sent el de /legal.
    expect(paragraf).not.toContain("Al botó «Elegir drets d'autor» de l'editor");
    expect(llista).not.toMatch(/<a\b/);
  });
});

/* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · «La
   Consola Termodinàmica» i «El Cervell» (/page/consola i /page/cervell,
   PageDetailSection) guanyen cos, només amb etiquetes de prosa i negretes per
   a escanejar. El text diu NOMÉS el que fa el codi, i estes proves l'hi
   ancoren: si canvia el nombre de pàgines de la Consola, un títol, el
   semàfor, les classes de peça del graf o l'accés, la prova cau i la pàgina
   s'ha de tornar a escriure.
   Cicle 2 del Gauntlet (ordres del Mestre del 30-10-2026) · DEROGA els «sis
   paràgrafs seguits, sense cap títol»: el cos seguix la llei T8 (entradilla →
   H3 → p, H4 i ul, amb hipervincles vius a cada vista que nomena), la portada
   és la il·lustració nova de 1024×1024, amb les seues mides i prioritat alta,
   i la Consola porta dins del cos la caldera de coure, que no és la portada. */
describe('Onada 10 i cicle 2 · /page/consola i /page/cervell: anatomia editorial ancorada al codi', () => {
  const textDe = (tros) => tros.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
  const paragrafs = (html) => [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(([, cos]) => cos);

  test.each(['consola', 'cervell'])('%s: es resol pel slug, i el cos seguix la llei T8: entradilla → H3, H4, enllaços vius i res més', (clau) => {
    expect(pageKeyDeRuta(`/page/${clau}`)).toBe(clau);
    expect(paginaDeRuta(`/page/${clau}?x=1#y`)).toEqual({ pageKey: clau, page: PAGE_COPY[clau] });
    const { html } = PAGE_COPY[clau];
    expect(infraccionsT8(html)).toEqual([]);
    // El format del fitxer: salt de línia i sis espais davant del primer H3, i el tancament de sempre.
    expect(html.startsWith('\n      <h3>')).toBe(true);
    expect(html.endsWith('</p>\n    ')).toBe(true);
    const cos = cosDe(html);
    expect(cos.querySelectorAll('h3').length).toBeGreaterThanOrEqual(3);
    expect(cos.querySelectorAll('h4').length).toBeGreaterThanOrEqual(1);
    // Cada vista nomenada porta el seu enllaç: com a mínim, la Consola o el seu Explorador.
    expect([...cos.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(expect.arrayContaining([clau === 'consola' ? '/consola' : '/consola/explorador']));
    // Els paràgrafs de sempre (a la Consola, dos d'ells són ara la llista de les nou pàgines).
    const cossos = paragrafs(html);
    expect(cossos.length).toBeGreaterThanOrEqual(clau === 'consola' ? 4 : 6);
    for (const tros of cossos) {
      expect(tros).toContain('<strong>');
      expect(textDe(tros).length).toBeGreaterThan(80);
    }
  });

  /* Ordres del Mestre (decisions 261030) · La portada és la il·lustració nova
     de 1024×1024 al mateix camí, amb imageWidth/imageHeight i prioritat alta,
     i no es repetix dins del cos (lliçó 261010). */
  test.each(['consola', 'cervell'])('%s: la portada nova, de 1024×1024, amb mides i prioritat alta, i no es repetix al cos', (clau) => {
    const pagina = PAGE_COPY[clau];
    expect(pagina).toMatchObject({ image: `/assets/ui/plugins/${clau}_vinyeta.jpg`, imageWidth: 1024, imageHeight: 1024, imageFetchPriority: 'high' });
    expect(midesWebp(pagina.image.replace(/\.jpg$/, '.webp'))).toEqual([1024, 1024]);
    expect(propsDePaginaDeText(pagina, clau)).toMatchObject({ heroImage: pagina.image, heroWidth: 1024, heroHeight: 1024, heroFetchPriority: 'high', heroAlt: pagina.imageAlt });
    expect(pagina.html).not.toContain(`${clau}_vinyeta`);
  });

  /* L'alt descriu el dibuix nou, sense interpretar-lo (versió «satisfacció
     naïf» de la Consola, ~01:55): cap «inventora boja» ni «somriure murri», i
     res de les vinyetes velles (la màquina de vapor, la bóta). */
  test('els alts descriuen les il·lustracions noves', () => {
    const { consola, cervell } = PAGE_COPY;
    for (const tros of ['IAIA MarIA', 'mocador groc', 'ulleres fosques de soldador', 'somriure tranquil', '«FUM-O-MÀTIC»', 'clau anglesa gegant', 'un gos amb un os a la boca']) expect([tros, consola.imageAlt.includes(tros)]).toEqual([tros, true]);
    expect(consola.imageAlt).not.toMatch(/inventora boja|somriure murri|màquina de vapor|un veí l’apreta/i);
    for (const tros of ['cervell mecànic gegant', 'erugues', 'plataforma de fusta', 'veïns sorpresos', 'una cabra i una gallina']) expect([tros, cervell.imageAlt.includes(tros)]).toEqual([tros, true]);
    expect(cervell.imageAlt).not.toMatch(/bóta|màquina d’escriure/);
    for (const alt of [consola.imageAlt, cervell.imageAlt]) expect(alt).not.toMatch(/\.$/);
  });

  test('consola: la caldera de coure, dins del cos, entre el segon i el tercer H3, i no és la portada', () => {
    const cos = cosDe(PAGE_COPY.consola.html);
    const imgs = [...cos.querySelectorAll('img')];
    expect(imgs.map((img) => img.getAttribute('src'))).toEqual(['/assets/uploads/consola-caldera.webp']);
    const [caldera] = imgs;
    expect([caldera.getAttribute('width'), caldera.getAttribute('height'), caldera.getAttribute('loading')]).toEqual(['1024', '1024', 'lazy']);
    expect(midesWebp('/assets/uploads/consola-caldera.webp')).toEqual([1024, 1024]);
    expect(existsSync(resolve(process.cwd(), 'public/assets/uploads/consola-caldera.png'))).toBe(true);
    for (const tros of ['caldera de coure', 'mocador groc', 'davantal taronja', 'boina i faixa roja', 'gat espantat']) expect([tros, caldera.getAttribute('alt').includes(tros)]).toEqual([tros, true]);
    expect(caldera.getAttribute('alt')).not.toBe(PAGE_COPY.consola.imageAlt);
    const ordre = [...cos.querySelectorAll('h3, img')].map((node) => node.tagName);
    expect(ordre).toEqual(['H3', 'H3', 'IMG', 'H3', 'H3']);
  });

  test('consola: les nou pàgines del tauler, enllaçades en l’ordre del tauler i amb el seu títol', () => {
    const cos = cosDe(PAGE_COPY.consola.html);
    const h4 = [...cos.querySelectorAll('h4')].find((h) => h.textContent === 'Les nou pàgines del tauler');
    expect(h4?.nextElementSibling?.tagName).toBe('UL');
    // El primer enllaç de cada element de la llista, el de la seua pàgina.
    const enllacos = [...h4.nextElementSibling.children].map((li) => li.querySelector('a')).map((a) => [a.getAttribute('href'), a.textContent]);
    expect(enllacos).toEqual(paginesConsola().map((pagina) => [pagina.ruta, `«${pagina.title}»`]));
    expect(h4.nextElementSibling.children).toHaveLength(IDS_PAGINES.length);
  });

  test('cervell: la Consola, l’Explorador, l’Inventari i el Calendari, enllaçats', () => {
    const hrefs = [...cosDe(PAGE_COPY.cervell.html).querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.textContent]);
    expect(hrefs).toEqual([
      ['/page/consola', 'Consola Termodinàmica'], [paginaConsola('explorador').ruta, `«${paginaConsola('explorador').title}»`],
      [paginaConsola('inventari').ruta, '«skills»'], [paginaConsola('calendari').ruta, 'tasques que corren soles']
    ]);
  });

  test('consola: «nou targetes» són les nou pàgines de la Consola, i cada títol és el que pinta el tauler', () => {
    const text = textDe(PAGE_COPY.consola.html);
    expect(IDS_PAGINES).toHaveLength(9);
    expect(text).toContain('trobes nou targetes, una per pàgina');
    const titols = paginesConsola().map((pagina) => pagina.title);
    expect(new Set(titols).size).toBe(9);
    for (const titol of titols) expect([titol, text.includes(`«${titol}»`)]).toEqual([titol, true]);
  });

  test('consola: el semàfor, «El Mas en xifres» i el botó són els de l’app', () => {
    const text = textDe(PAGE_COPY.consola.html);
    expect([ETIQUETES.reparar.to, ETIQUETES.important.to, ETIQUETES.enOrdre.to]).toEqual([toDeColor('roig'), toDeColor('taronja'), toDeColor('verd')]);
    expect(text).toContain(`«${ETIQUETES.reparar.text}» en roig, «${ETIQUETES.important.text}» en taronja o «${ETIQUETES.enOrdre.text}» en verd`);
    expect(llig('src/sections/consola/XifresMas.jsx')).toContain('>El Mas en xifres<');
    expect(text).toContain('«El Mas en xifres»');
    expect(text).toContain(`el botó «${accioDeLaPagina('consola').verb}»`);
  });

  /* Correcció de l'Onada 10 (261010) · El tercer paràgraf deia que «cada
     vegada» que una IA llig les fonts en queda un rebut, i que les IAs «anoten»
     el consum. Hui cap eina escriu rebuts al diari (matrix.mjs ho declara) i
     el diari de consum és un contracte proposat: el text diu el rebut pel que
     porta i pel llindar que el tauler marca. El dia que una eina torne a
     escriure rebuts, l'àncora de matrix.mjs cau i el paràgraf es pot tornar a
     escriure. */
  test('consola: el rebut es diu pel que porta, i «més d’una setmana» és el llindar del pols', () => {
    const text = textDe(PAGE_COPY.consola.html);
    expect(LLINDAR_REBUTS_RANCIS_DIES).toBe(7);
    expect(text).toContain('cada rebut diu quines fonts d’un protocol va llegir senceres una IA, amb l’empremta de cada fitxer');
    expect(text).toContain('si fa més d’una setmana que no n’arriba cap, el tauler ho marca');
    expect(text).toContain('els registres de consum que hi haja al diari de sessió');
    expect(llig('tooling/brain/matrix.mjs')).toContain('no autoritza escriptures ni deixa rebuts al diari');
    expect(text).not.toContain('cada vegada que una IA llig');
    expect(text).not.toContain('que les IAs anoten');
  });

  /* Correcció de l'Onada 10 (261010) · El cinqué paràgraf deia «no executa
     res» i que les fonts eren només fitxers del projecte. El compilador del
     Mapa executa git (lectura) i llig els llançadors de launchd de l'ordinador
     on es treballa: el text ho acota. Si el compilador deixa de fer-ho, esta
     prova cau i la frase s'ha de tornar a escriure. */
  test('consola: el que executa i d’on llig és el que fa el compilador del Mapa', () => {
    const text = textDe(PAGE_COPY.consola.html);
    const compilador = llig('tooling/brain/mapa-consola.mjs');
    expect(compilador).toContain("execFileSync('git'");
    expect(compilador).toContain("path.join(home, 'Library', 'LaunchAgents')");
    expect(text).not.toContain('no executa res');
    expect(text).toContain('no arregla, no esborra i no executa cap reparació');
    expect(text).toContain('dins del projecte, l’estat de git i les tasques programades del Mas a l’ordinador on es treballa');
  });

  /* El paràgraf 6 de cada pàgina: qui hi entra i què hi veu.
     Ordre del Mestre (30-10-2026, prompt 2208, T2.2) · Prova actualitzada a
     propòsit: /consola és de lectura pública en qualsevol entorn, i el botó
     «Obrir…» hi porta sense compte ni rol. Derogat: «superadmin fora de
     desenvolupament» i l'avís «Accés restringit». Si el text torna a
     prometre lectures en viu a la web publicada, esta prova cau. Que la ruta
     es munta sense sessió, també amb DEV fals, ho prova el comportament
     (App.test.jsx, App.appsLocals.test.jsx i pageContent.fediversity.test.js),
     no un literal de la font. */
  test.each([
    ['consola', 'On funciona hui', 'La Consola és oberta a tothom: el botó'],
    ['cervell', 'On es veu hui', 'El Cervell és obert a tothom: el botó']
  ])('%s: l’accés que diu la pàgina és el de la ruta (oberta a tothom, sense compte ni rol)', (clau, h3, obertura) => {
    const html = PAGE_COPY[clau].html;
    const text = textDe(html);
    // L'últim H3 és el de l'accés, i el seu paràgraf diu que és obert, sense compte ni rol.
    const cos = cosDe(html);
    const darrer = [...cos.querySelectorAll('h3')].at(-1);
    expect(darrer.textContent).toBe(h3);
    // textContent i no el marcatge intern: lint_logica_usuari no admet eixa API fora de sanitizeHtml.
    const paragraf = darrer.nextElementSibling.textContent.replace(/\s+/g, ' ').trim();
    expect(paragraf.startsWith(obertura)).toBe(true);
    expect(paragraf).toContain('sense demanar-te cap compte ni cap rol');
    expect(text).not.toMatch(/superadmin|Accés restringit|entres amb el teu compte/);
    // Les lectures en viu només les servix el servidor de desenvolupament; la web publicada llig
    // la instantània sanejada del build (decisió del Mestre, 31-10-2026; fontsConsola.js).
    const fonts = llig('src/sections/consola/fontsConsola.js');
    expect(fonts).toContain("if (import.meta.env.DEV === true) return ORIGEN_VIU;");
    expect(fonts).toContain("if (import.meta.env.SDP_CONSOLA_INSTANTANIA === '1') return ORIGEN_INSTANTANIA;");
    expect(paragraf).toContain('servidor de desenvolupament');
    expect(paragraf).toContain('instantània sanejada');
  });

  /* El que diu la Consola que hi ha a la web publicada és el que pinta el
     tauler de /consola fora de DEV: el Govern del Mestre, les nou targetes,
     l'Índex i el Diagnòstic (ConsolaSection.jsx · TaulerAmbGovern). */
  test('consola: l’estructura que mostra la web publicada és la del tauler', () => {
    const font = llig('src/sections/consola/ConsolaSection.jsx');
    for (const peca of ['<SeccioGovern govern={govern}', '<ConsolaTauler consola={consola}', '<IndexConsola fonts=', '<DiagnosiConsola fonts=']) {
      expect([peca, font.includes(peca)]).toEqual([peca, true]);
    }
    const text = textDe(PAGE_COPY.consola.html);
    expect(text).toContain('el Govern del Mestre, les nou targetes amb les seues pàgines, l’Índex i el Diagnòstic');
    expect(text).toContain('no s’inventa cap xifra per a omplir el buit');
  });

  test('sense dades: el que diuen les targetes de la Consola i la pàgina del Mapa', () => {
    expect(llig('src/sections/consola/consolaPagines.js')).toContain("absent: 'Dades no disponibles en este entorn'");
    expect(textDe(PAGE_COPY.consola.html)).toContain('les dades no estan disponibles en este entorn');
    expect(llig('src/sections/consola/ConsolaSection.jsx')).toContain('titol="Mapa no disponible"');
    expect(textDe(PAGE_COPY.cervell.html)).toContain('la pàgina dirà «Mapa no disponible»');
  });

  test('cervell: les nou classes de peça, la línia discontínua, el detall i els límits són els de l’Explorador', () => {
    const text = textDe(PAGE_COPY.cervell.html);
    expect(TIPUS_NODE).toHaveLength(9);
    expect(text).toContain('Hi ha peces de nou classes');
    // El botó porta a l'Explorador, que és una pàgina de la Consola amb eixe títol.
    const explorador = paginaConsola('explorador');
    expect(accioDeLaPagina('cervell')).toMatchObject({ verb: 'Obrir el Cervell', desti: explorador.ruta });
    expect(text).toContain(`a la pàgina «${explorador.title}», i el botó «${accioDeLaPagina('cervell').verb}» hi porta directament`);
    // La relació de la prosa (confiança 'inferit') es pinta discontínua.
    expect(CONFIANCES).toEqual(['declarat', 'derivat', 'inferit']);
    expect(llig('src/sections/consola/mapa/ExploradorMapa.jsx')).toContain('discontínua ix de la prosa');
    expect(text).toContain('Una línia discontínua ix de la prosa');
    // Els blocs del detall d'una peça, i el botó que només copia.
    const detall = llig('src/sections/consola/mapa/DetallPeca.jsx');
    for (const bloc of ['On viu', 'Què fa', 'Qui hi arriba', 'Avisos']) {
      expect([bloc, detall.includes(bloc), text.includes(bloc.toLowerCase())]).toEqual([bloc, true, true]);
    }
    expect(detall).toContain('Copiar l’ordre de reparació');
    expect(text).toContain('com a molt copia l’ordre de reparació');
    // El límit declarat dels scripts.
    expect(llig('src/sections/consola/mapa/grafMapa.js')).toContain('sap qui el crida, però no analitza què llig ni què escriu');
    expect(text).toContain('sap qui el crida, però no què llig ni què escriu');
  });
});

test('/disseny munta DesignSection: no es resol ni per la ruta ni per /page/disseny', () => {
  expect(PAGE_COPY.disseny).toBeTruthy();
  expect(pageKeyDeRuta('/disseny')).toBeNull();
  expect(pageKeyDeRuta('/disseny?pestanya=x')).toBeNull();
  expect(paginaDeRuta('/disseny')).toBeNull();
  expect(paginaDeRuta('/page/disseny')).toBeNull();
});

test('les rutes de kind «text» sense pageKey (i les excloses) no són cap pàgina', () => {
  for (const ruta of ['/connectar', '/control', '/realitat', '/connectar?item_id=x']) {
    expect(pageKeyDeRuta(ruta)).toBeNull();
    expect(paginaDeRuta(ruta, { pageCopy: { connectar: { title: 'X' } } })).toBeNull();
  }
  expect(RUTES_SENSE_PAGINA_DE_TEXT).toEqual(['/disseny', '/connectar', '/control', '/realitat']);
});

test('rutes que no són de text, ni internes ni segures: null', () => {
  for (const ruta of ['/mercat/samarreta', '/gent/u1', '/wikidepoble?item=x', '/', '', undefined, null, '//mal.example/ia', 'javascript:alert(1)', 'ia', '/ia extra', '/constructor', '/page/', '/page/a/b']) {
    expect(pageKeyDeRuta(ruta)).toBeNull();
    expect(paginaDeRuta(ruta)).toBeNull();
  }
});

test('/page/:slug: un slug canònic va per la seua ruta; la resta, pageCopy, pàgines i PAGE_COPY per eixe ordre', () => {
  expect(pageKeyDeRuta('/page/anima')).toBe('anima');
  expect(pageKeyDeRuta('/page/ia')).toBe('anima');
  // /skills redirigix a la Wiki: no és cap pàgina de text.
  expect(pageKeyDeRuta('/page/skills')).toBeNull();
  const core = { title: 'Pàgina del core' };
  const llista = { slug: 'festes', title: 'Festes de la llista' };
  expect(paginaDeRuta('/page/festes', { pageCopy: { festes: core }, pages: [llista] })).toEqual({ pageKey: 'festes', page: core });
  expect(paginaDeRuta('/page/festes', { pages: [llista] })).toEqual({ pageKey: 'festes', page: llista });
  expect(paginaDeRuta('/page/42', { pages: [{ id: 42, title: 'Per id' }] }).page.title).toBe('Per id');
  expect(paginaDeRuta('/page/notes')).toEqual({ pageKey: 'notes', page: PAGE_COPY.notes });
  expect(paginaDeRuta('/page/f%C3%A8sta', { pages: [{ slug: 'fèsta', title: 'Codificat' }] }).page.title).toBe('Codificat');
  expect(paginaDeRuta('/page/%E0%A4%A')).toBeNull();
  expect(paginaDeRuta('/page/no-hi-es', { pages: [] })).toBeNull();
});

test('claus pròpies només: «constructor» o «__proto__» no són cap pàgina', () => {
  expect(paginaDeRuta('/page/constructor')).toBeNull();
  expect(paginaDeRuta('/page/__proto__', { pageCopy: {} })).toBeNull();
  expect(paginaDeRuta('/page/toString', { pageCopy: {}, pages: 'no és llista' })).toBeNull();
});

test('el copy del core mana sobre PAGE_COPY, com a TextRoute', () => {
  const nova = { title: 'L’Ànima (core)', html: '<p>nou</p>' };
  expect(paginaDeRuta('/iaia', { pageCopy: { anima: nova } })).toEqual({ pageKey: 'anima', page: nova });
  // Les pàgines per slug només compten a /page/:slug.
  expect(paginaDeRuta('/iaia', { pages: [{ slug: 'anima', title: 'No' }] }).page).toBe(PAGE_COPY.anima);
});

test('propsDePaginaDeText: les de TextSection (hero resolt, etiquetes, drets i data del copy)', () => {
  expect(propsDePaginaDeText(PAGE_COPY.anima, 'anima', undefined)).toEqual({
    title: "L'Ànima de la IAIA",
    subtitle: PAGE_COPY.anima.subtitle,
    lead: PAGE_COPY.anima.lead,
    heroImage: '/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431.webp',
    heroWidth: 1024,
    heroHeight: 1024,
    heroFetchPriority: 'high',
    heroAlt: 'Il·lustració de la IAIA',
    labels: PAGE_COPY.anima.labels,
    copyright: COPYRIGHT_SDP,
    ...dataHoraDeBarra({ creat: PAGE_COPY.anima.date })
  });
  const senseRes = propsDePaginaDeText({ title: 'X' }, 'festes', (clau, alt) => (clau === 'section.text.page' ? 'Page' : alt));
  expect(senseRes.heroImage).toBe('/assets/uploads/brain/hero_panoramic_rural_view_1774720664221.png');
  expect(senseRes.labels).toEqual([
    { text: 'FESTES', className: 'sdp-badge-system' },
    { text: 'Page', className: 'sdp-badge-category' }
  ]);
  expect(senseRes).toMatchObject({ time: '', date: '', dateTime: '' });
  expect(propsDePaginaDeText({ title: 'X' }, 'x').labels[1].text).toBe('Pàgina');
});

/* Ordre del Mestre (261027; verificació dels retocs) · Dins de l'app nativa,
   una pàgina només web (Descàrregues) no es resol: el lector de connexions i
   la targeta incrustada no la pinten, com la ruta. Les altres, igual. */
test('261027 · dins de l’app nativa, /page/descarregues no es resol; /page/xat, sí', () => {
  expect(paginaDeRuta('/page/descarregues')).toEqual({ pageKey: 'descarregues', page: PAGE_COPY.descarregues });
  expect(paginaDeRuta('/page/descarregues', { nativa: true })).toBeNull();
  expect(paginaDeRuta('/page/xat', { nativa: true })).toEqual({ pageKey: 'xat', page: PAGE_COPY.xat });
  window.Capacitor = { isNativePlatform: () => true };
  try {
    expect(paginaDeRuta('/page/descarregues')).toBeNull();
  } finally {
    delete window.Capacitor;
  }
});
