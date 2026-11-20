import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  prefixMitjansPublics, classificaCamiMitja, esReferenciaMitjaPrivada,
  normalitzaVerificacioRecuperacio, urlAutoritzacioGoogle, bescanviaCodiOAuth,
  setBackendImplementation, validaBackendImplementation, getBackendImplementation, teCapacitat
} from '../src/data/backendPort.js';
import { CONTRACTE_NUCLI } from '../src/data/contracte.js';
import { estatPort } from '../src/data/backendPortEstat.js';
import { urlSocialDe } from '../src/config/imatgeSocial.js';
import { imatgeDe } from '../src/data/exportaMunicipiOpenData.js';
import { enllacDeRecuperacioEnText } from '../src/data/tornadaRecuperacio.js';
import { CASOS, executaCas, contextDeConformitat } from '../src/data/conformitat/kit.js';

const root = fileURLToPath(new URL('../', import.meta.url));

test('la frontera de mitjans és síncrona i manté les referències públiques sense sessió', () => {
  assert.equal(prefixMitjansPublics('https://propi.test/base'), 'https://propi.test/base/storage/v1/object/public/mitjans/');
  assert.deepEqual(classificaCamiMitja('/storage/v1/object/public/mitjans/poble/foto.webp'), { ref: 'sdp-media://mitjans/poble/foto.webp' });
  assert.deepEqual(classificaCamiMitja('/storage/v1/object/public/altre/foto.webp'), { ref: 'sdp-media://altre/foto.webp' });
  assert.equal(classificaCamiMitja('/fotos/lliure.webp'), null);
});

test('cap referència privada, signada, transformada o amb segments ambigus es torna pública', () => {
  for (const cami of [
    '/storage/v1/object/sign/mitjans/a.webp', '/storage/v1/object/authenticated/mitjans/a.webp',
    '/storage/v1/render/image/public/mitjans/a.webp', '/storage/v1/object/public/mitjans/../privat.webp',
    '/storage/v1/object/public/mitjans//a.webp', '/storage/v1/object/public/mitjans/%2e%2e/a.webp',
    '/storage/v1/object/public/mitjans%2Fa.webp', '/storage/v1/object/public/mitjans/a.webp?token=x'
  ]) assert.deepEqual(classificaCamiMitja(cami), { ref: null }, cami);
  for (const text of ['sdp-media://mitjans_privats/a', 'https://propi.test/storage/v1/object/sign/a', '/render/image/public/a'])
    assert.equal(esReferenciaMitjaPrivada(text), true);
  assert.equal(esReferenciaMitjaPrivada(null), false);
});

test('la verificació recovery manté token_hash i no accepta altres tipus ni tokens absents', () => {
  assert.deepEqual(normalitzaVerificacioRecuperacio(new URL('https://propi.test/auth/v1/verify?token=a%2Bb&type=recovery')),
    { href: 'https://propi.test/#token_hash=a%2Bb&type=recovery' });
  assert.deepEqual(normalitzaVerificacioRecuperacio(new URL('https://propi.test/auth/v1/verify?token_hash=prioritari&token=altre&type=recovery')),
    { href: 'https://propi.test/#token_hash=prioritari&type=recovery' });
  for (const query of ['?token=x&type=signup', '?type=recovery', '?token=&type=recovery'])
    assert.deepEqual(normalitzaVerificacioRecuperacio(new URL(`https://propi.test/auth/v1/verify${query}`)), { href: null });
  assert.equal(normalitzaVerificacioRecuperacio(new URL('https://propi.test/host#token_hash=x&type=recovery')), null);
});

test('autorització preserva PKCE i codifica literalment la tornada de l’amfitrió', () => {
  const tornada = 'https://host.test/article?q=a+b#x';
  const result = new URL(urlAutoritzacioGoogle('https://propi.test/base', 'repte+/', tornada));
  assert.equal(result.pathname, '/base/auth/v1/authorize');
  assert.deepEqual([...result.searchParams], [['provider', 'google'], ['code_challenge', 'repte+/'], ['code_challenge_method', 'S256'], ['redirect_to', tornada]]);
});

test('transport OAuth conserva senyal, redirect fail-closed i resposta/error originals', async () => {
  const control = new AbortController(), response = Object.freeze({ status: 400 });
  let request;
  const result = await bescanviaCodiOAuth('codi', 'secret', { supabaseUrl: 'https://propi.test', supabaseAnonKey: 'publica' }, control.signal,
    async (...args) => { request = args; return response; });
  assert.equal(result, response);
  assert.equal(request[0], 'https://propi.test/auth/v1/token?grant_type=pkce');
  assert.equal(request[1].redirect, 'error');
  assert.equal(request[1].signal, control.signal);
  assert.equal(request[1].headers.apikey, 'publica');
  assert.deepEqual(JSON.parse(request[1].body), { auth_code: 'codi', code_verifier: 'secret' });
  const error = new Error('connexió fallida');
  assert.throws(() => bescanviaCodiOAuth('c', 'v', { supabaseUrl: 'https://propi.test', supabaseAnonKey: 'k' }, control.signal, () => { throw error; }), e => e === error);
});

test('CLI catàleg/economia publiquen estat no-zero davant error d’entrada', () => {
  for (const [file, status] of [['tooling/brain/cataleg_skills.mjs', 2], ['tooling/gates/tractor-economia-arrencada.mjs', 1]]) {
    const result = spawnSync(process.execPath, [path.join(root, file), '--argument-desconegut'], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, status, `${file}: ${result.stderr}`);
  }
});

test('Somiador no declara completat un cicle si falla el llaurador', () => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'sdp-r3219-somiador-'));
  try {
    for (const dir of ['.agents', '_wiki_de_poble/04_escriptori', 'tooling/wiki']) mkdirSync(path.join(fixture, dir), { recursive: true });
    writeFileSync(path.join(fixture, '.agents/AGENTS.md'), '# fixture\n');
    writeFileSync(path.join(fixture, '_wiki_de_poble/04_escriptori/00_index_escriptori.md'), '# index\n');
    writeFileSync(path.join(fixture, 'tooling/wiki/llaurador_indexs.mjs'), 'process.exitCode = 23;\n');
    const result = spawnSync(process.execPath, [path.join(root, 'tooling/brain/somiador.mjs')], {
      cwd: fixture, env: { ...process.env, SDP_ARREL: fixture }, encoding: 'utf8'
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Error al llaurador/);
    assert.doesNotMatch(result.stdout, /Cicle de son finalitzat/);
    assert.equal(readFileSync(path.join(fixture, '_wiki_de_poble/04_escriptori/00_index_escriptori.md'), 'utf8'), '# index\n');
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});


test('capacitat real alternativa, null/falsy definitius i canvi de backend sense mètodes heretats', () => {
  const anterior = { currentImpl: estatPort.currentImpl, isLocked: estatPort.isLocked, dispose: estatPort.dispose };
  try {
    const nucli = Object.fromEntries(CONTRACTE_NUCLI.map(n => [n, () => null]));
    const crides = [];
    const alternative = {
      ...nucli,
      prefixMitjansPublics: base => { crides.push(['prefix', base]); return ''; },
      classificaCamiMitja: cami => { crides.push(['cami', cami]); return null; },
      esReferenciaMitjaPrivada: () => false,
      normalitzaVerificacioRecuperacio: () => null,
      urlAutoritzacioGoogle: () => 'https://alt.test/entrada',
      bescanviaCodiOAuth: (...args) => { crides.push(['transport', ...args]); return 'resposta-alternativa'; }
    };
    setBackendImplementation(alternative);
    assert.equal(teCapacitat('protocolPublic'), true);
    assert.equal(teCapacitat('transportOAuth'), true);
    assert.equal(prefixMitjansPublics('https://input.test'), '');
    assert.equal(classificaCamiMitja('/storage/v1/object/public/mitjans/foto.webp'), null);
    assert.equal(esReferenciaMitjaPrivada('mitjans_privats/a'), false);
    assert.equal(normalitzaVerificacioRecuperacio(new URL('https://propi.test/auth/v1/verify?token=x&type=recovery')), null);
    assert.equal(urlAutoritzacioGoogle('base', 'repte', 'tornada'), 'https://alt.test/entrada');
    assert.equal(bescanviaCodiOAuth('x', 'y', {}), 'resposta-alternativa');
    assert.equal(crides.length, 3);
    const preparada = getBackendImplementation();
    assert.throws(() => validaBackendImplementation({ ...nucli, prefixMitjansPublics: () => 'parcial' }), /Capacitat parcial: protocolPublic/);
    assert.equal(getBackendImplementation(), preparada);
    setBackendImplementation(nucli);
    assert.equal(teCapacitat('protocolPublic'), false);
    assert.equal(classificaCamiMitja('/aliens/foto.webp'), null);
    assert.throws(() => bescanviaCodiOAuth('x', 'y', {}), /no està implementat/);
    assert.equal(crides.length, 3, 'el transport del backend anterior no sobreviu');
    setBackendImplementation({ ...alternative, classificaCamiMitja: () => Promise.reject(new Error('async indegut')) });
    assert.throws(() => classificaCamiMitja('/x'), /ha de ser síncron/);
  } finally { Object.assign(estatPort, anterior); }
});


test('consumidors revaliden prefix apagat i referències hostils d’un backend alternatiu', () => {
  const anterior = { currentImpl: estatPort.currentImpl, isLocked: estatPort.isLocked, dispose: estatPort.dispose };
  const backend = {
    ...Object.fromEntries(CONTRACTE_NUCLI.map(n => [n, () => null])),
    prefixMitjansPublics: () => '', classificaCamiMitja: () => null,
    esReferenciaMitjaPrivada: () => false, normalitzaVerificacioRecuperacio: () => null,
    urlAutoritzacioGoogle: () => 'https://alt.test/entrada'
  };
  try {
    for (const prefix of ['', null, false, '/relatiu/', 'https://u:p@alt.test/public/', 'https://alt.test/public/?token=secret', 'https://alt.test/public/#secret']) {
      setBackendImplementation({ ...backend, prefixMitjansPublics: () => prefix });
      assert.equal(urlSocialDe('sdp-media://mitjans/foto.webp', { supabaseUrl: 'https://provider.test' }), null, String(prefix));
    }
    setBackendImplementation({ ...backend, prefixMitjansPublics: () => 'https://alt.test/media/' });
    assert.equal(urlSocialDe('sdp-media://mitjans/foto.webp', { supabaseUrl: 'https://provider.test' }), 'https://alt.test/media/foto.webp');
    for (const ref of ['https://private.test/foto.webp?token=secret', '/privat/foto.webp', '', 'sdp-media://mitjans/../privat.webp', 'sdp-media://mitjans/%2e%2e/privat.webp', 'sdp-media://mitjans/a.webp?token=x']) {
      setBackendImplementation({ ...backend, classificaCamiMitja: () => ({ ref }) });
      assert.equal(imatgeDe('https://provider.test/media/public/foto.webp'), null, ref);
    }
    setBackendImplementation({ ...backend, classificaCamiMitja: () => ({ ref: 'sdp-media://mitjans/poble/foto.webp' }) });
    assert.equal(imatgeDe('https://provider.test/media/public/foto.webp'), 'sdp-media://mitjans/poble/foto.webp');
  } finally { Object.assign(estatPort, anterior); }
});

test('conformitat refusa una implementació async abans de consumir el seu valor', async () => {
  const ctx = contextDeConformitat();
  const formes = CASOS.filter(c => c.capacitat === 'protocolPublic');
  assert.equal(formes.length, 5);
  for (const c of formes) {
    assert.equal(c.sincron, true);
    for (const result of [Promise.resolve('https://public.test/'), Promise.reject(new Error('async invalid'))]) {
      assert.deepEqual(await executaCas(c, { [c.metode]: () => result }, ctx),
        { estat: 'falla', falles: ['el mètode havia de ser síncron'], motiu: null });
    }
  }
});


test('la normalització alternativa recovery no amplia orígens ni accepta esquemes aliens', () => {
  const anterior = { currentImpl: estatPort.currentImpl, isLocked: estatPort.isLocked, dispose: estatPort.dispose };
  const backend = {
    ...Object.fromEntries(CONTRACTE_NUCLI.map(n => [n, () => null])),
    prefixMitjansPublics: () => '', classificaCamiMitja: () => null,
    esReferenciaMitjaPrivada: () => false, normalitzaVerificacioRecuperacio: () => null,
    urlAutoritzacioGoogle: () => 'https://alt.test/entrada'
  };
  const text = 'https://propi.test/auth/v1/verify?token=abcdefghijklmnop&type=recovery';
  try {
    for (const href of ['javascript:alert(1)', 'https://alien.test/#token_hash=abcdefghijklmnop&type=recovery', 'https://u:p@propi.test/#token_hash=abcdefghijklmnop&type=recovery', 'https://propi.test/#access_token=x&type=signup']) {
      setBackendImplementation({ ...backend, normalitzaVerificacioRecuperacio: () => ({ href }) });
      assert.equal(enllacDeRecuperacioEnText(text, { origens: ['https://propi.test'] }), null, href);
    }
    const href = 'https://propi.test/#token_hash=abcdefghijklmnop&type=recovery';
    setBackendImplementation({ ...backend, normalitzaVerificacioRecuperacio: () => ({ href }) });
    assert.deepEqual(enllacDeRecuperacioEnText(text, { origens: ['https://propi.test'] }), { href });
  } finally { Object.assign(estatPort, anterior); }
});


test('R32.19 · el transport per defecte és visible, preserva errors i no substituïx la injecció', () => {
  const estatAnterior = { currentImpl: estatPort.currentImpl, isLocked: estatPort.isLocked, dispose: estatPort.dispose };
  const fetchAnterior = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  const config = { supabaseUrl: 'https://propi.test', supabaseAnonKey: 'publica' };
  const control = new AbortController(), resposta = Object.freeze({ status: 204 });
  try {
    Object.assign(estatPort, { currentImpl: null, isLocked: false, dispose: null });
    globalThis.fetch = undefined;
    assert.throws(() => bescanviaCodiOAuth('codi', 'secret', config, control.signal), TypeError);
    const error = new Error('TRANSPORT_SYNTHETIC_THROW');
    globalThis.fetch = () => { throw error; };
    assert.throws(() => bescanviaCodiOAuth('codi', 'secret', config, control.signal), e => e === error);
    let peticio;
    globalThis.fetch = (...args) => { peticio = args; return resposta; };
    assert.equal(bescanviaCodiOAuth('codi', 'secret', config, control.signal), resposta);
    assert.equal(peticio[0], 'https://propi.test/auth/v1/token?grant_type=pkce');
    assert.deepEqual(peticio[1], {
      method: 'POST', redirect: 'error', signal: control.signal,
      headers: { apikey: 'publica', 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_code: 'codi', code_verifier: 'secret' })
    });
    globalThis.fetch = () => { throw new Error('GLOBAL_FALLBACK_PROHIBIT'); };
    assert.equal(bescanviaCodiOAuth('codi', 'secret', config, control.signal, () => resposta), resposta);
  } finally {
    if (fetchAnterior) Object.defineProperty(globalThis, 'fetch', fetchAnterior);
    else delete globalThis.fetch;
    Object.assign(estatPort, estatAnterior);
  }
});
