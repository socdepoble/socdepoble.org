/**
 * T71 · paginaDeText: de la ruta desada en connectar a la pàgina de text de
 * veres, amb la precedència de les rutes (TextRoute, PageDetailSection), i
 * les props que la pinten igual a TextSection i al lector de connexions.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { RUTES_SENSE_PAGINA_DE_TEXT, pageKeyDeRuta, paginaDeRuta, propsDePaginaDeText } from './paginaDeText.js';
import { COPYRIGHT_SDP, COPYRIGHT_VIQUIPEDIA, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { MAXIM_LEMA } from '../../data/limitsText.js';
import { DRETS_IMATGES, DRETS_TEXT, esFotoValida, esLlicenciaLliure, triaImatges } from '../pobles/pobleDeViquipedia.js';
import { LLICENCIA_PER_DEFECTE, LLICENCIES, OPCIO_ACTUAL } from '../../components/universal/drets/llicencies.js';
import { consolaDemanaSessio } from '../../app/guards/guardaConsola.js';
import { accioDeLaPagina } from '../../config/systemPages.js';
import { ETIQUETES, IDS_PAGINES, LLINDAR_REBUTS_RANCIS_DIES, paginaConsola, paginesConsola } from '../consola/consolaPagines.js';
import { CONFIANCES, TIPUS_NODE } from '../consola/mapa/contracteMapa.js';
import { toDeColor } from '../consola/semafor.js';

test('les rutes de text amb pageKey propi: /iaia i l’àlies /ia són «anima», amb query, fragment o barra final', () => {
  for (const ruta of ['/iaia', '/iaia?x=1', '/iaia/', '/iaia#reflexions', '/ia']) expect(pageKeyDeRuta(ruta)).toBe('anima');
  expect(pageKeyDeRuta('/ia?x=1')).toBe('anima');
  expect(pageKeyDeRuta('/ia/')).toBe('anima');
  expect(pageKeyDeRuta('/ia#reflexions')).toBe('anima');
  expect(pageKeyDeRuta('/projecte')).toBe('projecte');
  expect(pageKeyDeRuta('/legal')).toBe('legal');
  expect(paginaDeRuta('/iaia')).toEqual({ pageKey: 'anima', page: PAGE_COPY.anima });
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
  // Escrit com a classe [12]: design_guard llig els literals de capçalera de qualsevol .js.
  expect(html).not.toMatch(/<h[12]\b/i);
  expect(html).toMatch(/<h3>/);
  // Només h3, p, ul, li i strong: cap enllaç extern ni cap atribut.
  expect([...html.matchAll(/<([a-z0-9]+)[\s>]/gi)].map((m) => m[1].toLowerCase()).filter((e) => !['h3', 'p', 'ul', 'li', 'strong'].includes(e))).toEqual([]);
  for (const titol of [title, ...[...html.matchAll(/<h3>([^<]*)<\/h3>/g)].map((m) => m[1])]) expect(titol.trim().endsWith('.')).toBe(false);
  // El Fedivers és horitzó, no funció: la pàgina ho diu.
  expect(html).toContain('Hui encara no està fet');
  // La franja només ix amb poc espai (isCompact a App.jsx); amb més, la barra negra només diu el nom.
  expect(html).toContain('si té poc espai, com al mòbil, una franja davall de la barra negra');
  expect(html).toContain('si en té més, la barra negra només en diu el nom');
});

/* Ordre del Mestre (261007) · «El Xat» viu a /page/xat (PageDetailSection),
   sense ruta pròpia: el lector de connexions la resol pel slug. /xat és el
   Xat (XatSection), no cap pàgina de text. «L'Ànima» continua a /iaia. El
   cos seguix l'anatomia de la UniversalPage: cap h1 ni h2, comença en h3. */
test('261007 · /page/xat és «El Xat»; /xat no és cap pàgina; l’Ànima continua a /iaia', () => {
  expect(pageKeyDeRuta('/page/xat')).toBe('xat');
  expect(paginaDeRuta('/page/xat')).toEqual({ pageKey: 'xat', page: PAGE_COPY.xat });
  expect(paginaDeRuta('/page/xat?x=1#y')).toEqual({ pageKey: 'xat', page: PAGE_COPY.xat });
  expect(paginaDeRuta('/xat')).toBeNull();
  expect(paginaDeRuta('/iaia')).toEqual({ pageKey: 'anima', page: PAGE_COPY.anima });
  const { title, html, image, imageWidth, imageHeight, imageFetchPriority, date } = PAGE_COPY.xat;
  expect([title, image, imageWidth, imageHeight, imageFetchPriority]).toEqual(['El Xat', '/assets/uploads/brain/xat_portada.jpg', 1024, 1024, 'high']);
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
    // Només etiquetes de prosa, i un sol enllaç: el de la pàgina legal.
    const etiquetes = new Set([...html.matchAll(/<([a-z0-9]+)[\s>]/gi)].map((m) => m[1].toLowerCase()));
    expect([...etiquetes].filter((e) => !['h3', 'h4', 'p', 'ul', 'li', 'strong', 'code', 'a'].includes(e))).toEqual([]);
    expect([...html.matchAll(/<a\b[^>]*>/g)].map(([a]) => a)).toEqual(['<a href="/legal">']);
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
     registre, esta prova cau i la pàgina s'ha de posar al dia. */
  test('Onada 8 · la pàgina diu que l’eina de pobles nous encara no s’activa sola, i és veritat', () => {
    const viqui = textDe(html.slice(html.indexOf('<h3>La Viquipèdia'), html.indexOf('<h3>Per què triar')));
    expect(viqui).toContain('Hui encara no està fet del tot:');
    expect(viqui).toContain("encara no s'activa sola quan algú s'apunta des d'un poble nou, no guarda la targeta al servidor");
    const arrel = resolve(process.cwd(), 'src');
    const fonts = readdirSync(arrel, { recursive: true }).map(String)
      .filter((fitxer) => /\.(?:js|jsx)$/.test(fitxer) && !/\.test\.(?:js|jsx)$/.test(fitxer));
    const quiLaCrida = fonts.filter((fitxer) => !fitxer.endsWith('pobleDeViquipedia.js')
      && readFileSync(resolve(arrel, fitxer), 'utf8').includes('pobleDeViquipedia('));
    expect(quiLaCrida).toEqual([]);
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
   PageDetailSection) guanyen cos: sis paràgrafs seguits, sense cap títol,
   només etiquetes de prosa i negretes per a escanejar. El text diu NOMÉS el
   que fa el codi, i estes proves l'hi ancoren: si canvia el nombre de pàgines
   de la Consola, un títol, el semàfor, les classes de peça del graf o
   l'accés, la prova cau i la pàgina s'ha de tornar a escriure. */
describe('Onada 10 · /page/consola i /page/cervell: sis paràgrafs ancorats al codi', () => {
  const textDe = (tros) => tros.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
  const paragrafs = (html) => [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(([, cos]) => cos);

  test.each(['consola', 'cervell'])('%s: es resol pel slug, i el cos són sis paràgrafs amb negretes i res més', (clau) => {
    expect(pageKeyDeRuta(`/page/${clau}`)).toBe(clau);
    expect(paginaDeRuta(`/page/${clau}?x=1#y`)).toEqual({ pageKey: clau, page: PAGE_COPY[clau] });
    const { html } = PAGE_COPY[clau];
    // Cap títol. Escrit com a classe [1-6]: design_guard llig els literals de capçalera de qualsevol .js.
    expect(html).not.toMatch(/<h[1-6]\b/i);
    // Només etiquetes de prosa: paràgrafs i negretes.
    const etiquetes = [...html.matchAll(/<([a-z0-9]+)[\s>]/gi)].map((m) => m[1].toLowerCase());
    expect([...new Set(etiquetes)].sort()).toEqual(['p', 'strong']);
    expect(etiquetes.filter((etiqueta) => etiqueta === 'p')).toHaveLength(6);
    // Cap atribut: ni classe, ni estil, ni data-sdp-targetes; cap imatge ni cap enllaç.
    expect(html).not.toMatch(/<[a-z0-9]+\s/i);
    // El format del fitxer: salt de línia i sis espais davant de cada paràgraf, i res fora d'ells.
    const cossos = paragrafs(html);
    expect(cossos).toHaveLength(6);
    expect(html).toBe(`\n      ${cossos.map((cos) => `<p>${cos}</p>`).join('\n      ')}\n    `);
    for (const cos of cossos) {
      expect(cos).toContain('<strong>');
      expect(textDe(cos).length).toBeGreaterThan(80);
    }
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

  /* El paràgraf 6 de cada pàgina: qui hi entra i què hi veu. La decisió P7-A
     (el botó «Obrir…» no mira l'entorn) continua pendent (systemPages.js): si
     el Mestre obri la Consola a tothom o fa inert el botó, esta prova cau. */
  test.each(['consola', 'cervell'])('%s: l’accés que diu la pàgina és el de la ruta (superadmin fora de desenvolupament)', (clau) => {
    const text = textDe(PAGE_COPY[clau].html);
    // En qualsevol build la ruta passa per la barrera; només el servidor de desenvolupament l'obri.
    expect([consolaDemanaSessio(false), consolaDemanaSessio(true)]).toEqual([true, false]);
    expect(llig('src/app/App.jsx')).toContain('<RequireAuth rol="superadmin"><ConsolaSection /></RequireAuth>');
    expect(text).toContain('el rol «superadmin»');
    expect(llig('src/app/guards/RequireAuth.jsx')).toContain('>Accés restringit<');
    expect(text).toContain('veuràs l’avís «Accés restringit»');
    expect(text).toMatch(/Hui (la Consola només funciona|el Cervell només es veu) a l’ordinador de qui manté el Mas\./);
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
