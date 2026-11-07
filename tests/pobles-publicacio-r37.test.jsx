import React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { poblesAmbUltimaPublicacio } from '../src/sections/pobles/clauDelPoble.js';
import { dataDElement } from '../src/components/universal/editorial.js';
import { buildPoblesDetailSectionMeta } from '../src/sections/detail/detailSectionMeta.jsx';
import { ArbreTerritorial } from '../src/sections/pobles/TerritoriDelPoble.jsx';
import { MemoryRouter } from '../src/app/contexts/RouterContext.jsx';
import { PAGE_COPY } from '../src/sections/text/pageContent.js';
import { CosAmbTargetes } from '../src/components/universal/richText/extensions/targetes/CosAmbTargetes.jsx';
import { segmentsAmbTargetes } from '../src/components/universal/richText/extensions/targetes/formaDelGrup.js';
import { sanitizeHtml } from '../src/utils/sanitize.js';
import ca from '../src/config/idiomes/ca.js';
import es from '../src/config/idiomes/es.js';
import en from '../src/config/idiomes/en.js';
import eu from '../src/config/idiomes/eu.js';
import gl from '../src/config/idiomes/gl.js';
afterEach(cleanup);
const origin = '2026-01-01T10:00:00Z';
const recent = '2026-11-01T10:00:00Z';
const town = { id: 'test-town', title: 'Test Town', created_at: origin };
const rellotge = actual => dataDElement({ created_at: actual._ultimaPublicacioPublica });

for (const collection of ['feedPosts', 'marketItems', 'events']) {
  for (const [reason, flags] of [['private', { visibility: 'private' }], ['draft', { status: 'draft' }], ['unpublished', { isPublished: false }]]) {
    test(`R89-independent · ${collection}/${reason} no canvia l'última publicació pública`, () => {
      const [actual] = poblesAmbUltimaPublicacio([town], { [collection]: [{ id: 'probe', poble_id: town.id, created_at: recent, ...flags }] });
      expect(actual.created_at).toBe(origin);
      expect(actual._ultimaPublicacioPublica).toBeNull();
    });
  }
  /* Arbitratge R11 (R37-L2-04) · T40: publish_date és la data triada al
     calendari i «No programa res»; el Mur la pinta encara que siga futura.
     No veta la publicació: la data de /pobles és created_at. */
  test(`R37 · ${collection}: publish_date futur NO veta; data = created_at`, () => {
    const [actual] = poblesAmbUltimaPublicacio([town], { [collection]: [{ id: 'probe', poble_id: town.id, created_at: recent, publish_date: '2099-01-01T10:00:00Z' }] });
    expect(actual._ultimaPublicacioPublica).toBe(recent);
    expect(Date.parse(rellotge(actual).dateTime)).toBe(Date.parse(recent));
  });
}
/* Arbitratge R11 (R37-L2-05) · created_at l'assigna el servidor: un client
   amb el rellotge endarrerit no descarta la publicació que acaba de fer. */
test('R37 · un created_at per davant del rellotge del client compta igualment', () => {
  const avancat = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const [actual] = poblesAmbUltimaPublicacio([town], { feedPosts: [{ id: 'probe', poble_id: town.id, created_at: avancat }] });
  expect(actual._ultimaPublicacioPublica).toBe(avancat);
});
/* Arbitratge R11 (sonda S6 del Loop 2) · El valor es conserva tal com ve:
   una data sense hora no pinta una hora 00:00 que la dada no porta. */
test('R37 · un created_at de només dia no inventa hora a la pastilla', () => {
  const [actual] = poblesAmbUltimaPublicacio([town], { feedPosts: [{ id: 'probe', poble_id: town.id, created_at: '2026-11-01' }] });
  expect(actual._ultimaPublicacioPublica).toBe('2026-11-01');
  expect(rellotge(actual)).toEqual(dataDElement({ created_at: '2026-11-01' }));
  expect(rellotge(actual).time).toBe('');
});
/* Arbitratge R11 (R37-L2-07) · Divergència acceptada respecte a T51, pendent
   de decisió del Mestre: /pobles diu l'última publicació pública declarada (i
   cap pastilla sense publicació); la pàgina del poble i el lector del MAS
   (buildPoblesDetailSectionMeta) continuen amb el naixement. Si el Mestre
   tria una sola data, esta prova ha de canviar amb detailSectionMeta.jsx. */
test('R37 · divergència T51: /pobles diu l’última publicació; la pàgina del poble, el naixement', () => {
  const towns = [{ id: 'vell', title: 'Vell', content: '.', created_at: '2026-08-01T08:00:00Z' }];
  const publicacions = {
    feedPosts: [
      { id: 'p1', poble_id: 'vell', created_at: '2026-07-01T08:00:00Z' },
      { id: 'p2', poble_id: 'vell', created_at: '2026-09-15T08:00:00Z' }
    ],
    marketItems: [],
    events: []
  };
  const t = (_clau, fallback) => fallback ?? _clau;
  const [aPobles] = poblesAmbUltimaPublicacio(towns, publicacions);
  const [aLaPagina] = buildPoblesDetailSectionMeta({ towns, t, publicacions }).items;
  expect(aPobles._ultimaPublicacioPublica).toBe('2026-09-15T08:00:00Z');
  expect(aLaPagina.created_at).toBe('2026-07-01T08:00:00Z');
  const [senseMur] = poblesAmbUltimaPublicacio(towns, { feedPosts: [], marketItems: [], events: [] });
  const [paginaSenseMur] = buildPoblesDetailSectionMeta({ towns, t, publicacions: { feedPosts: [], marketItems: [], events: [] } }).items;
  expect(senseMur._ultimaPublicacioPublica).toBeNull();
  expect(rellotge(senseMur).dateTime).toBe('');
  expect(paginaSenseMur.created_at).toBe('2026-08-01T08:00:00Z');
});
test('R89-independent · una edició de fitxa no substitueix el rellotge de publicació', () => {
  const [actual] = poblesAmbUltimaPublicacio([{ ...town, updated_at: '2026-11-06T10:00:00Z' }], { feedPosts: [{ id: 'probe', poble_id: town.id, created_at: recent }] });
  expect(Date.parse(rellotge(actual).dateTime)).toBe(Date.parse(recent));
  expect(actual.created_at).toBe(origin);
  expect(actual.updated_at).toBe('2026-11-06T10:00:00Z');
});
test('R89-independent · un acte futur ja publicat compta quan es publica, no quan comença', () => {
  const [actual] = poblesAmbUltimaPublicacio([town], { events: [{ id: 'event', poble_id: town.id, created_at: recent, date: '2099-01-01', start_at: '2099-01-01T10:00:00Z' }] });
  expect(Date.parse(rellotge(actual).dateTime)).toBe(Date.parse(recent));
});
test('R89-independent · editar una publicació antiga no equival a una publicació nova', () => {
  const [actual] = poblesAmbUltimaPublicacio([town], { feedPosts: [{ id: 'post', poble_id: town.id, created_at: recent, updated_at: '2026-11-06T10:00:00Z' }] });
  expect(Date.parse(rellotge(actual).dateTime)).toBe(Date.parse(recent));
});
test('R37 · sense instant real o amb metadades privades anidades no fabrica cap data', () => {
  expect(poblesAmbUltimaPublicacio(null, null)).toEqual([]);
  const candidates = [null, { id: 'empty', poble_id: town.id }, { id: 'bad', poble_id: town.id, created_at: '2026-02-30' },
    { id: 'nested', poble_id: town.id, created_at: recent, attributes: { visibility: 'private' } },
    { id: 'nested-array', poble_id: town.id, created_at: recent, attributes: [] }];
  const [actual] = poblesAmbUltimaPublicacio([town], { feedPosts: candidates });
  expect(actual._ultimaPublicacioPublica).toBeNull(); expect(actual.created_at).toBe(origin);
  expect(rellotge(actual).dateTime).toBe('');
});
test.each(Object.entries({ ca, es, en, eu, gl }))('R89-independent · %s desplegable natiu amb nom localitzat', (_, dict) => {
  const t = (key, fallback) => dict[key] ?? fallback ?? key;
  const { container } = render(<MemoryRouter><ArbreTerritorial pobles={[]} t={t} /></MemoryRouter>);
  const nav = container.querySelector('nav.sdp-xarxa-pobles');
  const details = nav.querySelector('details.sdp-xarxa-pobles__desplegable');
  const summary = details.querySelector(':scope > summary');
  expect(nav.getAttribute('aria-label')).toBe(dict['section.pobles.territori']);
  expect(summary.textContent).toBe(dict['section.pobles.xarxa']);
  expect(details.open).toBe(false); fireEvent.click(summary); expect(details.open).toBe(true);
});
const clearSelector = '.sdp-amb-targetes .sdp-cos-tros > h2 ~ h2, .sdp-amb-targetes .sdp-cos-tros > h3 ~ h3, .sdp-amb-targetes > h2 ~ h2, .sdp-amb-targetes > h3 ~ h3';
test.each(['fediversity', 'node-zero'].flatMap(key => ['ca', 'es', 'en', 'eu', 'gl'].map(lang => [key, lang])))('R89-independent · %s/%s encapçalament R5–R10 real casa amb clear:both', (key, lang) => {
  const html = lang === 'ca' ? PAGE_COPY[key].html : PAGE_COPY[key].translations[lang].html;
  const { container } = render(<CosAmbTargetes segments={segmentsAmbTargetes(sanitizeHtml(html))} />);
  const prepared = [...container.querySelectorAll('h2,h3')].find(el => el.textContent.includes('R5–R10'));
  expect(prepared).toBeTruthy();
  expect(prepared.matches(clearSelector)).toBe(true);
  console.log(JSON.stringify({ key, lang, prepared: prepared.textContent, matchesClearBoth: prepared.matches(clearSelector), wrappers: container.querySelectorAll('.sdp-cos-tros').length }));
});
