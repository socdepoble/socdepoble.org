/**
 * T71 · paginaDeText: de la ruta desada en connectar a la pàgina de text de
 * veres, amb la precedència de les rutes (TextRoute, PageDetailSection), i
 * les props que la pinten igual a TextSection i al lector de connexions.
 */
import { expect, test } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { RUTES_SENSE_PAGINA_DE_TEXT, pageKeyDeRuta, paginaDeRuta, propsDePaginaDeText } from './paginaDeText.js';
import { COPYRIGHT_SDP, dataHoraDeBarra } from '../../components/universal/editorial.js';

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
