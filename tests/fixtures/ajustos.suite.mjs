/**
 * O6 T3: PHP CLI real + HTML/JS emés per ajustos.php, sense WordPress/BD/xarxa.
 * Les fronteres doblades i els límits són a ajustos.fixture.mjs. JSDOM executa
 * només els scripts inline locals; recursos externs desactivats per defecte.
 * La geometria, el nonce real i la integració WP Admin necessiten WordPress.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { JSDOM, VirtualConsole } from 'jsdom';
import { PHP_AJUSTOS } from './ajustos.fixture.mjs';

const PLUGIN = fileURLToPath(new URL('../../wordpress-plugin/', import.meta.url));
function cercaPhp() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  const studio = path.join(os.homedir(), '.studio/php-bin');
  const installed = fs.existsSync(studio)
    ? fs.readdirSync(studio).sort().reverse().map(version => path.join(studio, version, 'php'))
    : [];
  return ['php', ...installed].find(binary => spawnSync(binary, ['-v'], { timeout: 5000 }).status === 0);
}
const PHP = cercaPhp();
const PHP_OPTIONS = { skip: !PHP && 'PHP absent: instal·la PHP o indica PHP_BIN; també es detecta WordPress Studio.' };
const CODES = ['va', 'es', 'en', 'eu', 'gl'];
const SLOGANS = {
  va: 'Sóc de Poble. Portal de Pobles Connectats',
  es: 'Sóc de Poble. Portal de Pobles Connectats',
  en: 'Sóc de Poble. Portal of Connected Villages',
  eu: 'Sóc de Poble. Konektatutako Herrien Ataria',
  gl: 'Sóc de Poble. Portal de Pobos Conectados'
};

function php(input = {}) {
  const result = spawnSync(PHP, ['-d', 'display_errors=stderr', '-d', 'log_errors=0', '-d', 'allow_url_fopen=0', '-d', 'disable_functions=fsockopen,pfsockopen,stream_socket_client,curl_exec,curl_multi_exec', '-r', PHP_AJUSTOS, '--', PLUGIN], {
    input: JSON.stringify(input), encoding: 'utf8', timeout: 10000, maxBuffer: 4 * 1024 * 1024
  });
  assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
  assert.equal(result.stderr, '', 'cap avís PHP ocult');
  const data = JSON.parse(result.stdout);
  assert.deepEqual(data.requests, [], 'el renderer no fa peticions del host');
  assert.deepEqual(data.writes, [], 'obrir o traduir no desa opcions');
  return data;
}

function browser(t, data) {
  const errors = [], requests = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  const originalConfig = Object.freeze({ nomPoble: 'Amfitrió inalterat', poble: 'poble-real' });
  const dom = new JSDOM(data.html, {
    url: 'https://host.invalid/wp-admin/options-general.php?page=socdepoble',
    runScripts: 'dangerously', virtualConsole: console,
    beforeParse(window) {
      window.SocDePobleConfig = originalConfig;
      const blocked = name => (...args) => { requests.push({ name, args }); throw new Error('Network forbidden: ' + name); };
      window.fetch = blocked('fetch');
      window.XMLHttpRequest = blocked('XMLHttpRequest');
      window.WebSocket = blocked('WebSocket');
      window.navigator.sendBeacon = blocked('sendBeacon');
    }
  });
  t.after(() => dom.window.close());
  assert.deepEqual(errors, [], 'el JS real inicialitza sense errors');
  assert.deepEqual(requests, []);
  const root = dom.window.document.querySelector('.sdp-ajustos');
  assert.ok(root);
  return { dom, root, window: dom.window, document: dom.window.document, errors, requests, originalConfig };
}

function assertLanguage(view, code, copies) {
  const { root } = view;
  assert.equal(root.dataset.sdpLanguage, code);
  assert.equal(root.lang, code === 'va' ? 'ca-valencia' : code);
  assert.equal(root.querySelector('[data-sdp-text="slogan"]').textContent, SLOGANS[code]);
  assert.equal(root.querySelector('[role="tablist"]').getAttribute('aria-label'), copies[code].language);
  const active = root.querySelectorAll('[role="tab"][aria-selected="true"]');
  assert.equal(active.length, 1);
  assert.equal(active[0].dataset.sdpTab, code);
  assert.equal(active[0].tabIndex, 0);
  assert.equal(root.querySelector('[role="tabpanel"]').getAttribute('aria-labelledby'), active[0].id);
  for (const tab of root.querySelectorAll('[role="tab"]')) {
    assert.equal(tab.type, 'button');
    assert.equal(tab.getAttribute('aria-controls'), 'sdp-ajustos-panel');
    if (tab !== active[0]) assert.equal(tab.tabIndex, -1);
  }
  for (const node of root.querySelectorAll('[data-sdp-text]')) assert.equal(node.textContent, copies[code][node.dataset.sdpText]);
  for (const node of root.querySelectorAll('[data-sdp-html]')) {
    const expected = JSDOM.fragment(copies[code][node.dataset.sdpHtml]).textContent;
    assert.equal(node.textContent, expected);
    assert.ok(node.querySelector('strong'), node.dataset.sdpHtml + ' conserva negretes');
  }
}

test('O6 ajustos · cinc còpies completes, marca fixa, lemes exactes i negretes sense .mo', PHP_OPTIONS, () => {
  const { copies } = php();
  assert.deepEqual(Object.keys(copies), CODES);
  const keys = Object.keys(copies.va).sort();
  for (const code of CODES) {
    assert.deepEqual(Object.keys(copies[code]).sort(), keys, code);
    assert.equal(copies[code].slogan, SLOGANS[code]);
    assert.ok(Object.values(copies[code]).every(value => typeof value === 'string' && value.trim()), code);
    assert.equal((copies[code].intro.match(/<strong>/g) || []).length, 7, code);
    for (const value of Object.values(copies[code])) {
      assert.doesNotMatch(value, /<\/?(?:script|iframe|img|style)\b|\bon\w+=|javascript:/i);
    }
  }
  assert.doesNotMatch(copies.es.slogan, /Pueblos/);
});

test('O6 ajustos · locale d’usuari, fallback del lloc, prefixos i llengua desconeguda', PHP_OPTIONS, () => {
  const locales = ['ca', 'ca_valencia', 'ca-ES', 'VA', 'es_ES', 'es-MX', 'en_GB', 'EN-us', 'eu_ES', 'gl_ES', 'gl-PT', 'fr_FR', '', 42, false];
  assert.deepEqual(php({ locales }).locales, ['va', 'va', 'va', 'va', 'es', 'es', 'en', 'en', 'eu', 'gl', 'gl', 'va', 'va', 'va', 'va']);
  assert.equal(php({ user_locale: 'es_ES', site_locale: 'eu_ES' }).language, 'es');
  assert.equal(php({ user_locale: '', site_locale: 'eu_ES' }).language, 'eu');
  assert.equal(php({ without_user_locale: true, site_locale: 'gl_ES' }).language, 'gl');
  assert.equal(php({ user_locale: false, site_locale: 'gl_ES' }).language, 'gl');
  assert.equal(php({ user_locale: 'fr_FR', site_locale: 'en_US' }).language, 'va');
});

for (const code of CODES) test('O6 ajustos · PHP sense catàleg pinta íntegrament ' + code, PHP_OPTIONS, t => {
  const data = php({ user_locale: code });
  const view = browser(t, data);
  assertLanguage(view, code, data.copies);
  assert.equal(view.document.querySelectorAll('form').length, 1);
  assert.equal(view.root.querySelector('h1').textContent, 'Sóc de Poble');
  assert.equal(view.root.querySelectorAll('ol > li').length, 3);
  assert.equal(view.root.querySelectorAll('input[type="text"]').length, 2);
  assert.deepEqual(view.requests, []);
});

test('O6 ajustos · clics reals tradueixen, conserven formulari, dades i nonce i envien els dos camps', PHP_OPTIONS, t => {
  const data = php({ options: { nomPoble: 'Nom desat', poble: 'poble-desat' }, development_warning: true });
  const view = browser(t, data);
  const { root, window } = view;
  const form = root.querySelector('form'), nonce = form.querySelector('[name="_wpnonce"]');
  const name = form.querySelector('[name="socdepoble_enxufe[nomPoble]"]');
  const village = form.querySelector('[name="socdepoble_enxufe[poble]"]');
  assert.equal(name.value, 'Nom desat'); assert.equal(village.value, 'poble-desat');
  name.value = 'Nom escrit sense guardar'; village.value = 'altre-poble';
  name.setSelectionRange(2, 7);
  let submitted = null, count = 0;
  form.addEventListener('submit', event => {
    event.preventDefault(); count++;
    submitted = Object.fromEntries(new window.FormData(form, event.submitter));
  });
  for (const code of [...CODES, ...CODES.toReversed()]) {
    root.querySelector(`[data-sdp-tab="${code}"]`).click();
    assertLanguage(view, code, data.copies);
    assert.equal(root.querySelector('form'), form);
    assert.equal(form.querySelector('[name="_wpnonce"]'), nonce);
    assert.equal(form.querySelector('[name="socdepoble_enxufe[nomPoble]"]'), name);
    assert.equal(name.value, 'Nom escrit sense guardar');
    assert.equal(village.value, 'altre-poble');
    assert.equal(name.selectionStart, 2); assert.equal(name.selectionEnd, 7);
    assert.equal(count, 0, 'una pestanya no envia el formulari');
  }
  assert.equal(form.method, 'post'); assert.equal(form.getAttribute('action'), 'options.php');
  form.querySelector('[type="submit"]').click();
  assert.equal(count, 1);
  assert.equal(submitted.option_page, 'socdepoble_enxufe');
  assert.equal(submitted.action, 'update');
  assert.equal(submitted._wpnonce, 'fixture-nonce-ONLY-HOST-DOUBLE');
  assert.equal(submitted['socdepoble_enxufe[nomPoble]'], 'Nom escrit sense guardar');
  assert.equal(submitted['socdepoble_enxufe[poble]'], 'altre-poble');
  assert.ok(Object.keys(submitted).every(key => !/tenant|backend|language|flag|supabase|mode/i.test(key)));
  assert.equal(window.SocDePobleConfig, view.originalConfig);
  assert.deepEqual(view.requests, []); assert.deepEqual(view.errors, []);
});

test('O6 ajustos · teclat circular, Home/End i ARIA mouen focus i selecció sense enviar', PHP_OPTIONS, t => {
  const data = php(); const view = browser(t, data);
  const tabs = [...view.root.querySelectorAll('[role="tab"]')];
  tabs[0].focus();
  const key = (value, expected) => {
    const event = new view.window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true });
    view.document.activeElement.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
    assert.equal(view.document.activeElement, tabs[expected]);
    assertLanguage(view, CODES[expected], data.copies);
  };
  key('ArrowLeft', 4); key('ArrowRight', 0); key('End', 4); key('Home', 0); key('ArrowRight', 1);
  const event = new view.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  tabs[1].dispatchEvent(event); assert.equal(event.defaultPrevented, false);
  assert.equal(view.root.dataset.sdpLanguage, 'es');
  assert.deepEqual(view.requests, []); assert.deepEqual(view.errors, []);
});

test('O6 ajustos · API d’opcions única, dos camps i sanejador real sense cap clau de backend', PHP_OPTIONS, () => {
  const data = php({ sanitize: [null, false, 'text', [], { nomPoble: ['no'], poble: { no: true } }, { nomPoble: 'Nom públic', poble: 'poble-real', tenantId: 'secret', backend: 'https://evil.invalid', mode: 'mock', language: 'en', E2EE_ACTIU_PER_DEFECTE: true }, { nomPoble: '<img src=x onerror=alert(1)>Nom', poble: 'amb_underscore' }, { poble: 'a'.repeat(64) }, { poble: '%2f' }] });
  assert.equal(data.settings.length, 1);
  assert.equal(data.settings[0].name, 'socdepoble_enxufe');
  assert.equal(data.settings[0].args.sanitize_callback, 'socdepoble_enxufe_sanitza_opcio');
  assert.equal(data.settings[0].args.show_in_rest, false);
  assert.deepEqual(Object.values(data.fields).map(field => field.args.clau).sort(), ['nomPoble', 'poble']);
  for (const value of data.sanitized) assert.ok(Object.keys(value).every(key => ['nomPoble', 'poble'].includes(key)));
  assert.deepEqual(data.sanitized.slice(0, 5), [[], [], [], [], []]);
  assert.deepEqual(data.sanitized[5], { nomPoble: 'Nom públic', poble: 'poble-real' });
  assert.equal(data.sanitized[6].nomPoble, 'Nom');
  assert.equal(data.sanitized[6].poble, undefined);
  assert.deepEqual(data.sanitized[7], []); assert.deepEqual(data.sanitized[8], []);
});

test('O6 ajustos · valors desats hostils són text d’input i de referència, mai nodes executables', PHP_OPTIONS, t => {
  const payload = '"><img src=x onerror="globalThis.__optionAttack=1"><script>globalThis.__optionAttack=1</script>&quot;';
  const data = php({ options: { nomPoble: payload, poble: payload, backend: 'https://evil.invalid', tenantId: 'secret' } });
  const view = browser(t, data);
  assert.equal(view.window.__optionAttack, undefined);
  assert.equal(view.root.querySelectorAll('img,iframe,[onerror],[onload],[autofocus]').length, 0);
  assert.equal(view.root.querySelectorAll('script').length, 2, 'només JSON de còpies i script local previst');
  for (const input of view.root.querySelectorAll('input[type="text"]')) {
    assert.ok(input.value.includes('<img'));
    assert.deepEqual([...input.attributes].map(attr => attr.name).sort(), ['class', 'id', 'name', 'type', 'value']);
  }
  assert.ok(Object.keys(data.public_config).every(key => ['nomPoble', 'poble'].includes(key)));
  assert.equal(data.public_config.poble, undefined);
  assert.deepEqual(view.requests, []); assert.deepEqual(view.errors, []);
});

test('O6 ajustos · opcions antigues malformades no emeten avisos PHP ni Array al formulari', PHP_OPTIONS, t => {
  const data = php({ options: { nomPoble: ['valor-antic'], poble: { id: 'valor-antic' } } });
  const view = browser(t, data);
  assert.deepEqual([...view.root.querySelectorAll('input[type="text"]')].map(input => input.value), ['', '']);
  assert.deepEqual(view.requests, []); assert.deepEqual(view.errors, []);
});

test('O6 ajustos · cos llegible 17px/1.65, estil acotat i cap formulari sense manage_options', PHP_OPTIONS, t => {
  const data = php(); const view = browser(t, data);
  const style = view.window.getComputedStyle(view.root);
  assert.equal(style.fontSize, '17px'); assert.equal(style.lineHeight, '1.65');
  const css = view.root.querySelector('style').textContent;
  assert.match(css, /\.sdp-ajustos p,[^{}]+\{font-size:inherit;line-height:inherit\}/);
  assert.equal(view.window.getComputedStyle(view.root.querySelector('[type="submit"]')).fontSize, '16px');
  assert.equal(php({ can_manage: false }).html, '');
});

test('O6 ajustos · diagnosi i avís de desenvolupament canvien de llengua sense alterar dades', PHP_OPTIONS, t => {
  const data = php({ development_warning: true }); const view = browser(t, data);
  const codeValue = view.root.querySelector('.widefat td code'); const initialValue = codeValue.textContent;
  for (const code of CODES) {
    view.root.querySelector(`[data-sdp-tab="${code}"]`).click();
    assert.equal(view.root.querySelector('.widefat td code'), codeValue);
    assert.equal(codeValue.textContent, initialValue);
    assert.equal(view.root.querySelector('.widefat th').textContent, data.copies[code].app_version);
    assert.equal(view.root.querySelector('.notice').textContent, JSDOM.fragment(data.copies[code].development_warning).textContent);
  }
  assert.deepEqual(view.requests, []); assert.deepEqual(view.errors, []);
});

test('O6 ajustos · l’API de diagnosi conserva etiquetes originals i el renderer resol les del host', PHP_OPTIONS, t => {
  assert.equal(php({ user_locale: 'va' }).diagnosis['App version'], '1.1.0');
  const data = php({ user_locale: 'eu_ES', gettext_prefix: 'HOST: ' });
  assert.equal(data.diagnosis['HOST: App version'], '1.1.0');
  const view = browser(t, data);
  for (const code of CODES) {
    view.root.querySelector(`[data-sdp-tab="${code}"]`).click();
    assert.equal(view.root.querySelector('.widefat th').textContent, data.copies[code].app_version);
    assertLanguage(view, code, data.copies);
  }
});

test('O6 ajustos · JSON i JS passen pel punt de nonce de WordPress i funcionen sense breakout', PHP_OPTIONS, t => {
  const nonce = 'fixture-csp-nonce';
  const data = php({ inline_nonce: nonce, options: { nomPoble: '</script><script>globalThis.__nonceAttack=1</script>', poble: 'poble-real' } });
  assert.equal(data.inline_calls.length, 2, 'JSON i runner passen per wp_print_inline_script_tag');
  assert.equal(data.inline_calls[0].type, 'application/json');
  assert.ok(Object.hasOwn(data.inline_calls[0], 'data-sdp-copies'));
  const view = browser(t, data);
  const scripts = [...view.root.querySelectorAll('script')];
  assert.equal(scripts.length, 2);
  assert.ok(scripts.every(script => script.getAttribute('nonce') === nonce));
  assert.equal(view.window.__nonceAttack, undefined);
  view.root.querySelector('[data-sdp-tab="gl"]').click();
  assertLanguage(view, 'gl', data.copies);
  assert.deepEqual(view.requests, []); assert.deepEqual(view.errors, []);
  assert.deepEqual(php().inline_calls, [], 'el fallback sense API WP està cobert per les altres proves');
});
