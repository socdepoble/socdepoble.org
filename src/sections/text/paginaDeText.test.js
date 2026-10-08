/**
 * T71 · paginaDeText: de la ruta desada en connectar a la pàgina de text de
 * veres, amb la precedència de les rutes (TextRoute, PageDetailSection), i
 * les props que la pinten igual a TextSection i al lector de connexions.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { RUTES_SENSE_PAGINA_DE_TEXT, pageKeyDeRuta, paginaDeRuta, propsDePaginaDeText } from './paginaDeText.js';
import { COPYRIGHT_SDP, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { LLICENCIA_PER_DEFECTE, LLICENCIES, OPCIO_ACTUAL } from '../../components/universal/drets/llicencies.js';

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
    expect(titols.filter(([nivell]) => nivell === '3').map(([, text]) => text)).toEqual([
      'Dos coses, dos llicències',
      'El codi: AGPL-3.0, lliure i gratuït',
      'El contingut: CC BY-NC-SA 4.0 de sèrie',
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
