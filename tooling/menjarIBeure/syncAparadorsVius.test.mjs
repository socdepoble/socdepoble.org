import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planificaSyncAparador, preuEnCentims, textPlaAparador, origenCanonicAparador, urlCanonicaProducte } from './syncAparadorsVius.mjs';

const ORIGIN = 'https://botiga.example.org';
const SOURCE = Object.freeze({ source_id: '11000000-0000-4000-8000-000000000001', canonical_origin: ORIGIN,
  sync_consent: true, consented_at: '2026-11-01T00:00:00Z', enabled: true });
const EMPTY = Object.freeze({ state_version: 0, last_complete_scan_date: null, last_complete_scan_digest: null, products: [] });
const url = id => `${ORIGIN}/producte/p-${id}/`;
const woo = (id, price = '1250', stock = true, more = {}) => ({ id, name: `Producte ${id}`, permalink: url(id),
  prices: { currency_code: 'EUR', currency_minor_unit: 2, price }, is_in_stock: stock, ...more });
function captureWoo(rows, perPage = 100) {
  const count = Math.max(1, Math.ceil(rows.length / perPage));
  return { format: 'woocommerce', complete: true, pages: Array.from({ length: count }, (_, i) => ({
    url: `${ORIGIN}/wp-json/wc/store/v1/products?page=${i + 1}&per_page=${perPage}`, page: i + 1,
    per_page: perPage, total: rows.length, total_pages: Math.ceil(rows.length / perPage), status: 200,
    content_type: 'application/json; charset=utf-8', body: JSON.stringify(rows.slice(i * perPage, (i + 1) * perPage)) })) };
}
const previous = (id, more = {}) => ({ external_product_id: `woo:${id}`, external_source_url: url(id), title: `Títol humà ${id}`,
  price_cents: 1000, currency: 'EUR', in_stock: true, status: 'active', missing_streak: 0,
  last_seen_date: '2026-11-12', last_missing_scan_date: null, proposed_label: 'Etiqueta humana', approved_at: '2026-11-01T00:00:00Z', ...more });
const stateOf = rows => ({ state_version: 5, last_complete_scan_date: '2026-11-12', last_complete_scan_digest: 'a'.repeat(64), products: rows });
const run = (rows, state = EMPTY, observedOn = '2026-11-13', source = SOURCE) => planificaSyncAparador({ source, state, observedOn, capture: captureWoo(rows) });
function rejected(capture, state = stateOf([previous(1)]), reason) {
  const original = structuredClone(state);
  const result = planificaSyncAparador({ source: SOURCE, state, observedOn: '2026-11-13', capture });
  assert.equal(result.should_apply, false);
  assert.equal(result.plan.scan.status, 'rejected'); if (reason) assert.equal(result.plan.scan.reason, reason);
  assert.deepEqual(result.plan.product_changes, []); assert.deepEqual(result.plan.events, []);
  assert.deepEqual(result.next_state, original); assert.deepEqual(state, original);
  return result;
}
const ldProduct = (more = {}) => ({ '@type': 'Product', name: 'Producte de prova', url: url(1), sku: 'sku-1',
  offers: { '@type': 'Offer', priceCurrency: 'EUR', price: '12.50', availability: 'https://schema.org/InStock' }, ...more });
function captureLd(products, { html = null, more = {} } = {}) {
  const address = `${ORIGIN}/cataleg/`;
  return { format: 'jsonld', complete: true, expected_page_urls: [address], total_products: products.length,
    pages: [{ url: address, status: 200, content_type: html === null ? 'application/ld+json' : 'text/html',
      body: html ?? JSON.stringify({ '@graph': products }) }], ...more };
}

test('linked price and stock change produce exact cents and two stable audit keys', () => {
  const result = run([woo(1, '1299', false)], stateOf([previous(1)]));
  assert.equal(result.should_apply, true);
  assert.equal(result.plan.scan.status, 'complete'); assert.equal(result.plan.product_changes[0].mode, 'update_linked');
  assert.equal(result.next_state.products[0].price_cents, 1299); assert.equal(result.next_state.products[0].in_stock, false);
  assert.deepEqual(result.plan.events.map(e => e.kind).sort(), ['price_changed', 'stock_changed']);
  assert.ok(result.plan.events.every(e => /^[a-f0-9]{64}$/.test(e.event_key)));
  assert.deepEqual(result, run([woo(1, '1299', false)], stateOf([previous(1)])));
});
test('new product is pending_review, never active, with clean title and proposed human label', () => {
  const result = run([woo(1, '1250', true, { name: '<b>Oli &amp; pa</b><script>privat()</script>', categories: [{ name: '<em>Alimentació</em>' }], owner_user_id: 'AUTHORITY_SENTINEL', role: 'service_role', copyright: 'INVENTAT' })]);
  const row = result.next_state.products[0];
  assert.equal(row.status, 'pending_review'); assert.equal(row.title, 'Oli & pa'); assert.equal(row.proposed_label, 'Alimentació');
  assert.equal(result.plan.product_changes[0].mode, 'insert_pending_review'); assert.equal(row.approved_at, null);
  for (const value of ['AUTHORITY_SENTINEL', 'service_role', 'INVENTAT', 'owner_user_id', '<script>']) assert.ok(!JSON.stringify(result).includes(value));
});
test('existing editorial title, status and label are preserved; no slug/media/copyright/taxonomy mutations are emitted', () => {
  const state = stateOf([previous(1)]), original = structuredClone(state);
  const result = run([woo(1, '1400', true, { name: 'Títol extern nou', images: [{ src: 'https://attacker.example.org/a.jpg' }], categories: [{ name: 'Categoria forçada' }] })], state);
  assert.equal(result.next_state.products[0].title, original.products[0].title);
  assert.equal(result.next_state.products[0].proposed_label, 'Etiqueta humana'); assert.equal(result.next_state.products[0].status, 'active');
  assert.deepEqual(state, original);
  for (const key of ['slug', 'images', 'copyright', 'taxonomy', 'categories']) assert.ok(!Object.hasOwn(result.plan.product_changes[0].state, key));
});
test('pending proposal does not receive silent price, stock, title or approval updates', () => {
  const old = previous(1, { status: 'pending_review', approved_at: null });
  const result = run([woo(1, '9999', false)], stateOf([old]));
  assert.equal(result.plan.product_changes[0].mode, 'observe'); assert.equal(result.next_state.products[0].price_cents, 1000);
  assert.equal(result.next_state.products[0].in_stock, true); assert.deepEqual(result.plan.events, []);
});
test('same-day replay after applying next_state has no mutations or version advance', () => {
  const first = run([woo(1)]), second = run([woo(1)], first.next_state);
  assert.equal(first.should_apply, true); assert.equal(second.should_apply, false);
  assert.deepEqual(second.plan.product_changes, []); assert.deepEqual(second.plan.events, []); assert.deepEqual(second.next_state, first.next_state);
});
test('same day changed digest and older day cannot rewind prices', () => {
  const first = run([woo(1)]);
  assert.equal(run([woo(1, '9999')], first.next_state).plan.scan.reason, 'day_already_observed');
  assert.equal(run([woo(1)], first.next_state, '2026-11-12').plan.scan.reason, 'stale_scan');
});
test('two complete distinct daily observations propose hiding without deletion or automatic hiding', () => {
  const first = run([woo(2)], stateOf([previous(1), previous(2)]));
  assert.equal(first.next_state.products.find(p => p.external_product_id === 'woo:1').missing_streak, 1);
  assert.ok(!first.plan.events.some(e => e.kind === 'product_missing_in_source'));
  const replay = run([woo(2)], first.next_state); assert.deepEqual(replay.next_state, first.next_state);
  const second = run([woo(2)], first.next_state, '2026-11-14');
  const missing = second.plan.product_changes.find(p => p.external_product_id === 'woo:1');
  assert.equal(missing.proposed_status, 'seasonal_hidden'); assert.equal(missing.state.status, 'active'); assert.equal(missing.state.missing_streak, 2);
  assert.equal(second.next_state.products.length, 2); assert.equal(second.plan.events.filter(e => e.kind === 'product_missing_in_source').length, 1);
  const third = run([woo(2)], second.next_state, '2026-11-15'); assert.ok(!third.plan.events.some(e => e.kind === 'product_missing_in_source'));
});
test('error between accepted captures preserves streak; following complete absence can confirm it', () => {
  const first = run([woo(2)], stateOf([previous(1), previous(2)]));
  const bad = captureWoo([woo(2)]); bad.pages[0].status = 503;
  const failed = planificaSyncAparador({ source: SOURCE, state: first.next_state, observedOn: '2026-11-14', capture: bad });
  assert.deepEqual(failed.next_state, first.next_state);
  const next = run([woo(2)], failed.next_state, '2026-11-15'); assert.equal(next.next_state.products[0].missing_streak, 2);
});
test('complete presence resets a missing streak and dates', () => {
  const old = previous(1, { missing_streak: 1, last_missing_scan_date: '2026-11-12' });
  const result = run([woo(1)], stateOf([old]));
  assert.equal(result.next_state.products[0].missing_streak, 0); assert.equal(result.next_state.products[0].last_missing_scan_date, null);
});
test('returning seasonal product stays hidden and only produces owner review notice', () => {
  const result = run([woo(1)], stateOf([previous(1, { status: 'seasonal_hidden', missing_streak: 2, last_missing_scan_date: '2026-11-12' })]));
  assert.equal(result.next_state.products[0].status, 'seasonal_hidden');
  assert.ok(result.plan.events.some(e => e.kind === 'product_returned_to_source'));
  assert.ok(result.plan.product_changes.every(c => c.proposed_status !== 'active'));
});

for (const [name, mutate] of [
  ['HTTP failure', c => { c.pages[0].status = 502; }],
  ['HTML instead of JSON', c => { c.pages[0].content_type = 'text/html'; }],
  ['truncated JSON', c => { c.pages[0].body = '[{"id":'; }],
  ['partial capture', c => { c.complete = false; }],
  ['missing page', c => { c.pages.pop(); }],
  ['duplicate page', c => { c.pages[1] = structuredClone(c.pages[0]); }],
  ['inconsistent totals', c => { c.pages[1].total++; }],
  ['filtered API URL', c => { c.pages[0].url += '&include=1'; }],
  ['wrong page URL', c => { c.pages[0].url = `${ORIGIN}/wp-json/wc/store/v1/products?page=99&per_page=1`; }],
  ['wrong body row count', c => { c.pages[0].body = '[]'; }],
  ['wrong currency', c => { const rows = JSON.parse(c.pages[0].body); rows[0].prices.currency_code = 'USD'; c.pages[0].body = JSON.stringify(rows); }],
  ['absent currency minor unit', c => { const rows = JSON.parse(c.pages[0].body); delete rows[0].prices.currency_minor_unit; c.pages[0].body = JSON.stringify(rows); }],
  ['variable price range', c => { const rows = JSON.parse(c.pages[0].body); rows[0].type = 'variable'; c.pages[0].body = JSON.stringify(rows); }],
  ['password protected source', c => { const rows = JSON.parse(c.pages[0].body); rows[0].is_password_protected = true; c.pages[0].body = JSON.stringify(rows); }]
]) test(`${name} leaves all streaks, dates and contents intact`, () => {
  const capture = captureWoo([woo(1), woo(2)], 1); mutate(capture);
  rejected(capture, stateOf([previous(1, { missing_streak: 1, last_missing_scan_date: '2026-11-12' })]));
});
test('suspicious empty catalogue never counts as a missing observation', () => rejected(captureWoo([]), stateOf([previous(1)]), 'suspicious_empty'));
test('new empty catalogue is a valid first complete snapshot', () => assert.equal(run([]).plan.scan.status, 'complete'));
test('pagination order and source property order do not change canonical plan', () => {
  const capture = captureWoo([woo(1), woo(2)], 1), input = { source: SOURCE, state: EMPTY, observedOn: '2026-11-13', capture };
  const before = structuredClone(input), a = planificaSyncAparador(input);
  capture.pages.reverse(); const b = planificaSyncAparador(input);
  assert.deepEqual(a, b); capture.pages.reverse(); assert.deepEqual(input, before);
});
test('duplicate external IDs or canonical URLs reject the whole snapshot', () => {
  rejected(captureWoo([woo(1), woo(1)]), EMPTY, 'duplicate_source');
  rejected(captureWoo([woo(1), woo(2, '1250', true, { permalink: url(1) })]), EMPTY, 'duplicate_source');
});
test('ID and URL pointing at different registered products is quarantined', () => rejected(captureWoo([woo(1, '1250', true, { permalink: url(2) })]), stateOf([previous(1), previous(2)]), 'identity_conflict'));
test('a changed linked permalink needs reconciliation, not a silent rewrite', () => rejected(captureWoo([woo(1, '1250', true, { permalink: url(3) })]), stateOf([previous(1)]), 'linked_url_changed'));

for (const [value, options, cents] of [
  ['1299', { minorUnit: 2 }, 1299], ['12', { minorUnit: 0 }, 1200], ['12500', { minorUnit: 3 }, 1250],
  ['0.29', {}, 29], [0.29, {}, 29], ['1.234,56', { locale: 'es-ES' }, 123456],
  ['1,234.56', { locale: 'en-GB' }, 123456], ['12,5', { locale: 'ca-ES' }, 1250],
  [12.5, { locale: 'es-ES' }, 1250], [12.5, { locale: 'ca-ES' }, 1250], [0.29, { locale: 'ca-ES' }, 29],
  ['9007199254740991', { minorUnit: 2 }, Number.MAX_SAFE_INTEGER]
]) test(`exact price ${value} ${JSON.stringify(options)}`, () => assert.equal(preuEnCentims(value, options), cents));
for (const [value, options = {}] of [['1.234,56'], ['1,234'], ['1.001'], ['-1'], ['1e2'], ['NaN'], ['0.001'], ['12501', { minorUnit: 3 }], ['9007199254740992', { minorUnit: 2 }], [Infinity], [1e20], [' 12.00'], ['12 €'], ['1.23', { locale: 'unknown' }]]) {
  test(`ambiguous or inexact price ${String(value)} is rejected`, () => assert.throws(() => preuEnCentims(value, options)));
}

for (const origin of ['http://botiga.example.org', 'https://localhost', 'https://127.0.0.1', 'https://2130706433', 'https://0x7f000001', 'https://[::1]', 'https://user:pass@botiga.example.org', 'https://botiga.example.org:444', 'https://botiga.example.org/path', 'https://botiga.local', 'https://botiga.example.org/?x=1']) {
  test(`unsafe configured origin ${origin} is rejected`, () => assert.throws(() => origenCanonicAparador(origin)));
}
test('purchase URL is same-origin HTTPS, strips tracking and keeps sorted meaningful selectors', () => {
  assert.equal(urlCanonicaProducte('/producte/a?z=2&utm_campaign=x&a=1#detall', ORIGIN), `${ORIGIN}/producte/a?a=1&z=2`);
  for (const address of ['https://attacker.example.org/p', '//attacker.example.org/p', 'javascript:alert(1)', 'https://botiga.example.org@attacker.example.org/p', '/p%0Asecret', '/p?a=1&a=2']) assert.throws(() => urlCanonicaProducte(address, ORIGIN));
});
test('revoked or disabled consent cannot build an executable plan', () => {
  for (const patch of [{ sync_consent: false }, { enabled: false }, { consented_at: null }, { source_id: {} }]) assert.throws(() => run([woo(1)], EMPTY, '2026-11-13', { ...SOURCE, ...patch }));
});
test('invalid calendar days and exhausted revisions fail closed', () => {
  assert.throws(() => run([woo(1)], EMPTY, '2026-02-30'));
  assert.throws(() => run([woo(1)], { ...EMPTY, state_version: Number.MAX_SAFE_INTEGER }));
});
test('future consent and contradictory historic dates cannot erase a missing streak', () => {
  assert.throws(() => run([woo(1)], EMPTY, '2026-11-13', { ...SOURCE, consented_at: '2026-11-14T00:00:00Z' }));
  for (const patch of [{ last_seen_date: '2026-11-14' }, { missing_streak: 1, last_missing_scan_date: null },
    { missing_streak: 0, last_missing_scan_date: '2026-11-12' }]) assert.throws(() => run([woo(1)], stateOf([previous(1, patch)])));
});
test('a historic observation cannot use an approval granted on a future UTC day', () => {
  assert.throws(() => run([woo(1)], stateOf([previous(1, { approved_at: '2026-11-14T00:00:00Z' })])));
  assert.equal(run([woo(1)], stateOf([previous(1, { approved_at: '2026-11-13T20:00:00Z' })])).should_apply, true);
});
test('normalised Unicode scalar limits remain valid input for the following daily scan', () => {
  const rows = [woo(1, '1250', true, { name: '🫒'.repeat(301) })];
  const first = run(rows), second = run(rows, first.next_state, '2026-11-14');
  assert.equal([...first.next_state.products[0].title].length, 300);
  assert.equal([...first.next_state.products[0].proposed_label].length, 80);
  assert.equal(second.should_apply, true); assert.equal(second.plan.events.length, 0);
});

test('JSON-LD graph supports source fallback via canonical URL without changing existing identity', () => {
  const result = planificaSyncAparador({ source: SOURCE, state: stateOf([previous(1)]), observedOn: '2026-11-13', capture: captureLd([ldProduct()]) });
  assert.equal(result.plan.scan.status, 'complete'); assert.equal(result.plan.product_changes[0].external_product_id, 'woo:1');
  assert.equal(result.next_state.products[0].price_cents, 1250); assert.equal(result.plan.product_changes[0].state.title, 'Títol humà 1');
});
test('JSON-LD HTML scanner handles quoted >, uppercase tags, comments and Unicode offsets', () => {
  const item = ldProduct();
  const html = `<!doctype html><p>İ és text</p><!-- <script type="application/ld+json">NO JSON</script> --><SCRIPT data-x='>' TYPE='application/ld+json'>${JSON.stringify(item)}</SCRIPT>`;
  const result = planificaSyncAparador({ source: SOURCE, state: EMPTY, observedOn: '2026-11-13', capture: captureLd([item], { html }) });
  assert.equal(result.plan.scan.status, 'complete'); assert.equal(result.plan.product_changes.length, 1);
});
for (const tag of ['textarea', 'title', 'style', 'xmp', 'iframe', 'noembed', 'noframes', 'noscript']) {
  test(`inert JSON-LD text inside ${tag} cannot update a linked price`, () => {
    const fake = ldProduct({ offers: { '@type': 'Offer', priceCurrency: 'EUR', price: '0.01' } });
    const real = ldProduct();
    const html = `<${tag}><script type="application/ld+json">${JSON.stringify(fake)}</script></${tag}><script type="application/ld+json">${JSON.stringify(real)}</script>`;
    const result = planificaSyncAparador({ source: SOURCE, state: stateOf([previous(1)]), observedOn: '2026-11-13', capture: captureLd([real], { html }) });
    assert.equal(result.should_apply, true); assert.equal(result.next_state.products[0].price_cents, 1250);
    const onlyFake = html.slice(0, html.indexOf(`</${tag}>`) + tag.length + 3);
    rejected(captureLd([real], { html: onlyFake }), stateOf([previous(1)]), 'inconsistent_totals');
  });
}
for (const tag of ['template', 'svg', 'math']) test(`ambiguous HTML context ${tag} fails closed`, () => {
  const item = ldProduct(), html = `<${tag}><script type="application/ld+json">${JSON.stringify(item)}</script></${tag}>`;
  rejected(captureLd([item], { html }), stateOf([previous(1)]), 'ambiguous_html_context');
});
test('unclosed raw text and plaintext cannot expose a fake script', () => {
  const item = ldProduct(), script = `<script type="application/ld+json">${JSON.stringify(item)}</script>`;
  rejected(captureLd([item], { html: `<textarea>${script}` }), stateOf([previous(1)]), 'truncated_html');
  rejected(captureLd([item], { html: `<plaintext>${script}` }), stateOf([previous(1)]), 'inconsistent_totals');
});
test('JSON-LD without stable ID uses deterministic URL hash', () => {
  const result = planificaSyncAparador({ source: SOURCE, state: EMPTY, observedOn: '2026-11-13', capture: captureLd([ldProduct({ sku: undefined })]) });
  assert.match(result.plan.product_changes[0].external_product_id, /^url:[a-f0-9]{64}$/);
});
test('JSON-LD locale is explicit and unknown availability does not erase known stock', () => {
  const item = ldProduct({ offers: { '@type': 'Offer', priceCurrency: 'EUR', price: '12,50', availability: 'https://schema.org/Unknown' } });
  const result = planificaSyncAparador({ source: { ...SOURCE, price_locale: 'es-ES' }, state: stateOf([previous(1)]), observedOn: '2026-11-13', capture: captureLd([item]) });
  assert.equal(result.next_state.products[0].in_stock, true); assert.equal(result.next_state.products[0].price_cents, 1250);
});
test('JSON-LD numeric prices follow JSON decimal grammar independently of display locale', () => {
  const item = ldProduct({ offers: { '@type': 'Offer', priceCurrency: 'EUR', price: 12.5 } });
  const result = planificaSyncAparador({ source: { ...SOURCE, price_locale: 'ca-ES' }, state: EMPTY, observedOn: '2026-11-13', capture: captureLd([item]) });
  assert.equal(result.should_apply, true); assert.equal(result.next_state.products[0].price_cents, 1250);
});
for (const [label, mutate] of [
  ['absent coverage manifest', c => { delete c.expected_page_urls; }],
  ['wrong catalogue total', c => { c.total_products = 2; }],
  ['truncated script', c => { c.pages[0].content_type = 'text/html'; c.pages[0].body = '<script type="application/ld+json">{}'; }],
  ['ambiguous offer range', c => { c.pages[0].body = JSON.stringify(ldProduct({ offers: { '@type': 'AggregateOffer', lowPrice: '1.00', priceCurrency: 'EUR' } })); }],
  ['unknown currency', c => { const item = ldProduct(); item.offers.priceCurrency = 'GBP'; c.pages[0].body = JSON.stringify(item); }],
  ['foreign purchase URL', c => { c.pages[0].body = JSON.stringify(ldProduct({ url: 'https://attacker.example.org/p' })); }]
]) test(`JSON-LD ${label} preserves all state`, () => { const capture = captureLd([ldProduct()]); mutate(capture); rejected(capture); });

test('untrusted getters, prototypes, cycles and authority keys cannot be copied or invoked', () => {
  let invoked = false;
  const bad = { source: SOURCE, state: EMPTY, observedOn: '2026-11-13', capture: captureWoo([woo(1)]) };
  Object.defineProperty(bad, 'extra', { enumerable: true, get() { invoked = true; throw new Error('GETTER_RAN'); } });
  assert.throws(() => planificaSyncAparador(bad)); assert.equal(invoked, false);
  assert.throws(() => planificaSyncAparador(Object.create({ source: SOURCE })));
  const cycle = {}; cycle.me = cycle; assert.throws(() => planificaSyncAparador(cycle));
  assert.throws(() => planificaSyncAparador(JSON.parse('{"__proto__":{"polluted":true}}')));
  assert.equal({}.polluted, undefined);
  assert.throws(() => run([woo(1)], { ...EMPTY, owner_user_id: 'not-an-authority' }));
});
test('linear text scanner is bounded before parsing and never returns raw markup', () => {
  assert.equal(textPlaAparador('&lt;b&gt;Pa&lt;/b&gt; &amp; oli<script>secret</script>'), 'Pa & oli');
  assert.equal(textPlaAparador('<'.repeat(8000)).length, 0);
  assert.throws(() => textPlaAparador('<'.repeat(8193)));
  rejected(captureWoo([woo(1, '1250', true, { name: { title: 'not text' } })]), EMPTY, 'invalid_text');
});
test('no implicit wall-clock, random identifier or network is used by the reducer', t => {
  t.mock.method(Date, 'now', () => { throw new Error('CLOCK_FORBIDDEN'); });
  t.mock.method(Math, 'random', () => { throw new Error('RANDOM_FORBIDDEN'); });
  t.mock.method(globalThis, 'fetch', () => { throw new Error('NETWORK_FORBIDDEN'); });
  assert.deepEqual(run([woo(1)]), run([woo(1)]));
});
