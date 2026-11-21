#!/usr/bin/env node
/** P0-124 · Observació bounded de lectura. No publica, no repara servidors i no envia avisos.
 * El pressupost limita esta sonda, no acredita facturació cloud ni protecció contra DDoS.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import tls from 'node:tls';
import { Resolver } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import { esIpPublica } from '../node0/xarxa-node0.mjs';
import { escanejaLiterals } from './literals-secrets-node0.mjs';

export const LIMITS = Object.freeze({ requestsPerCycle: 16, bytesPerCycle: 2 * 1024 * 1024,
  cycleMs: 60000, requestMs: 8000, headerBytes: 16384, htmlBytes: 262144, jsonBytes: 65536,
  privateBytes: 16384, iterations: 3, intervalMin: 60000, intervalMax: 300000,
  configBytes: 16384, localFileBytes: 2 * 1024 * 1024, localBytes: 8 * 1024 * 1024,
  localEntries: 4096, localFiles: 512, findings: 64, outputBytes: 131072 });
const OWN = ['https://socdepoble.org', 'https://socdepoble.cat'];
const SEO_BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const SEO_PROFILES = Object.freeze({ normal: SEO_BROWSER_UA, googlebot: 'Googlebot/2.1', google: SEO_BROWSER_UA });
const SEO_DOMAINS = Object.freeze({ org: 'socdepoble.org', cat: 'socdepoble.cat' });
const SEO_LIMITS = Object.freeze({ nodes: 2048, links: 128, rules: 128, depth: 32 });
const TABLES = Object.freeze({ xat_fils: 'id', xat_participants: 'fil_id', xat_missatges: 'id', xat_adjunts: 'id',
  xat_reaccions: 'missatge_id', xat_missatges_destacats: 'missatge_id', xat_missatges_fixats: 'missatge_id', xat_missatges_amagats: 'missatge_id' });
const CODES = new Set(['INVALID_ARGUMENT', 'INVALID_CONFIG', 'UNSAFE_SOURCE', 'LOCAL_LIMIT', 'ORIGIN_REJECTED',
  'ADDRESS_REJECTED', 'DNS_FAILED', 'ABORTED', 'TIMEOUT', 'REQUEST_LIMIT', 'BYTE_LIMIT', 'HEADERS_LIMIT',
  'REDIRECT_REJECTED', 'UPGRADE_REJECTED', 'TLS_REJECTED', 'BODY_INCOMPLETE', 'ENCODING_REJECTED', 'TRANSPORT_FAILED']);
const fail = code => { throw Object.assign(new Error(code), { code }); };
const safeCode = error => CODES.has(error?.code) ? error.code : 'TRANSPORT_FAILED';
const DAY = 86400000;
const CLAIMED = Symbol('request-counted-by-audit');
const ANCESTORS = new Set(["'self'", "'none'", 'https://*.socdepoble.org', 'https://socdepoble.org',
  'https://*.sollutia.cat', 'https://sollutia.cat', 'https://*.sollutia.com', 'http://localhost:*']);
const v6Special = new BlockList();
for (const [ip, prefix] of [['2001::', 23], ['2002::', 16], ['3fff::', 20]]) v6Special.addSubnet(ip, prefix, 'ipv6');
export const addressAllowed = ip => esIpPublica(ip) && (ip.includes(':') ? !v6Special.check(ip, 'ipv6') : !ip.startsWith('192.88.99.'));
const int = (value, min, max) => typeof value === 'string' && /^\d{1,8}$/.test(value) && Number(value) >= min && Number(value) <= max ? Number(value) : fail('INVALID_ARGUMENT');

export function parseArgs(argv) {
  const options = { remote: false, json: false, iterations: 1, intervalMs: LIMITS.intervalMin };
  const seen = new Set();
  for (const arg of argv) {
    const [key, ...parts] = arg.split('='); const value = parts.join('=');
    if (seen.has(key)) fail('INVALID_ARGUMENT'); seen.add(key);
    if (key === '--json' && !parts.length) options.json = true;
    else if (key === '--remot' && !parts.length) options.remote = true;
    else if (key === '--seo' && !parts.length) options.seo = true;
    else if (key === '--domini' && Object.hasOwn(SEO_DOMAINS, value)) options.domain = value;
    else if (key === '--config' && value) options.configPath = value;
    else if (key === '--iterations') options.iterations = int(value, 1, LIMITS.iterations);
    else if (key === '--interval-ms') options.intervalMs = int(value, LIMITS.intervalMin, LIMITS.intervalMax);
    else fail('INVALID_ARGUMENT');
  }
  if ((!options.remote && (options.iterations !== 1 || options.configPath)) || (seen.has('--interval-ms') && options.iterations === 1)) fail('INVALID_ARGUMENT');
  if (options.seo && (!options.remote || options.configPath) || options.domain && !options.seo) fail('INVALID_ARGUMENT');
  return options;
}

function configValidated(config = {}) {
  if (!config || typeof config !== 'object' || Array.isArray(config)
    || Object.keys(config).some(key => !['supabaseUrl', 'publishableKey'].includes(key))) fail('INVALID_CONFIG');
  if (!Object.keys(config).length) return null;
  if (typeof config.supabaseUrl !== 'string' || typeof config.publishableKey !== 'string' || config.publishableKey.length > 4096) fail('INVALID_CONFIG');
  let url; try { url = new URL(config.supabaseUrl); } catch { fail('INVALID_CONFIG'); }
  if (url.protocol !== 'https:' || !/^[a-z0-9-]{1,63}\.supabase\.co$/.test(url.hostname)
    || url.username || url.password || url.port || url.search || url.hash || url.pathname !== '/') fail('INVALID_CONFIG');
  const key = config.publishableKey;
  let anonymous = /^sb_publishable_[A-Za-z0-9_-]{16,255}$/.test(key);
  if (!anonymous && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) {
    try { anonymous = JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role === 'anon'; } catch { anonymous = false; }
  }
  if (!anonymous) fail('INVALID_CONFIG');
  return { origin: url.origin, key };
}

function sourceBytes(file, max) {
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const before = fs.fstatSync(fd);
    if (!before.isFile() || before.nlink !== 1 || before.size > max) fail('LOCAL_LIMIT');
    const bytes = Buffer.alloc(before.size + 1);
    let size = 0;
    while (size < bytes.length) { const n = fs.readSync(fd, bytes, size, bytes.length - size, null); if (!n) break; size += n; }
    const after = fs.fstatSync(fd), named = fs.lstatSync(file);
    if (size !== before.size || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs
      || before.ctimeMs !== after.ctimeMs || named.isSymbolicLink() || named.ino !== after.ino || named.dev !== after.dev) fail('UNSAFE_SOURCE');
    return bytes.subarray(0, size);
  } finally { fs.closeSync(fd); }
}
function readConfig(root, relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').some(p => !p || p === '.' || p === '..' || /^\.env/i.test(p))) fail('INVALID_CONFIG');
  let current = root;
  for (const part of relative.split('/')) { current = path.join(current, part); if (fs.lstatSync(current).isSymbolicLink()) fail('INVALID_CONFIG'); }
  try { return JSON.parse(sourceBytes(current, LIMITS.configBytes).toString('utf8')); } catch { fail('INVALID_CONFIG'); }
}

function scanPublic(root) {
  const base = fs.existsSync(path.join(root, 'dist')) ? 'dist' : 'public';
  let bytes = 0, files = 0, entries = 1; const findings = [];
  // Els noms de fitxer també són entrada no fiable; no publiquem credencials
  // reconegudes ni segments opacs, i mai calculem un hash del valor ocultat.
  const reportPath = relative => relative.split('/').map(segment => (
    segment.length > 80 || /secret|token|password|passwd|credential|private[-_]?key|^eyJ|[%\\]/i.test(segment)
      || escanejaLiterals(segment, 'path-segment').length ? '[redacted]' : segment
  )).join('/');
  const add = values => {
    if (findings.length + values.length > LIMITS.findings) fail('LOCAL_LIMIT');
    findings.push(...values.map(value => ({ ...value, path: reportPath(value.path) })));
  };
  const walk = (relative, depth = 0) => {
    if (depth > 12) fail('LOCAL_LIMIT');
    const file = path.join(root, relative), stat = fs.lstatSync(file);
    if (stat.isSymbolicLink()) fail('UNSAFE_SOURCE');
    if (stat.isDirectory()) {
      const names = [], dir = fs.opendirSync(file);
      try {
        for (let entry = dir.readSync(); entry; entry = dir.readSync()) {
          if (++entries > LIMITS.localEntries) fail('LOCAL_LIMIT');
          names.push(entry.name);
        }
      } finally { dir.closeSync(); }
      for (const name of names.sort()) walk(relative + '/' + name, depth + 1);
      return;
    }
    if (!stat.isFile()) fail('UNSAFE_SOURCE');
    if (/^\.env(?:\.|$)/i.test(path.basename(relative)) || /\.(?:key|pem|p12|pfx|agekey|log)$/i.test(relative)) {
      add([{ ruleId: 'private-public-path', path: relative, line: 1 }]); return;
    }
    if (!/\.(?:[cm]?js|json|html|css|txt|xml|webmanifest)$/i.test(relative)) return;
    if (++files > LIMITS.localFiles || stat.size > LIMITS.localFileBytes || bytes + stat.size > LIMITS.localBytes) fail('LOCAL_LIMIT');
    const content = sourceBytes(file, LIMITS.localFileBytes); bytes += content.length;
    add(escanejaLiterals(content.toString('utf8'), relative));
  };
  try { walk(base); return { status: findings.length ? 'fail' : 'ok', root: base, files, bytes, findings, exhaustive: false }; }
  catch (error) { return { status: findings.length ? 'fail' : 'unknown', root: base, files, bytes, findings, code: safeCode(error), exhaustive: false }; }
}

function headersOf(raw) {
  const headers = {};
  for (const [key, value] of raw instanceof Headers ? raw.entries() : Object.entries(raw || {})) headers[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value);
  return headers;
}
export function auditaCapcaleres(raw, profile, origin) {
  const h = headersOf(raw), errors = [];
  const csp = new Map();
  for (const entry of (h['content-security-policy'] || '').split(';')) {
    const [name, ...values] = entry.trim().split(/\s+/);
    if (!name) continue;
    if (csp.has(name.toLowerCase())) errors.push('CSP_DUPLICATE');
    else csp.set(name.toLowerCase(), values);
  }
  const ancestors = csp.get('frame-ancestors') || [];
  if (!csp.get('default-src')?.includes("'self'") || csp.get('default-src')?.some(v => !["'self'", 'data:', 'blob:'].includes(v))
    || csp.get('script-src')?.join(' ') !== "'self'" || csp.has('script-src-elem') && csp.get('script-src-elem').join(' ') !== "'self'"
    || csp.has('script-src-attr') && csp.get('script-src-attr').join(' ') !== "'none'"
    || csp.get('object-src')?.join(' ') !== "'none'" || !["'self'", "'none'"].includes(csp.get('base-uri')?.join(' '))
    || !ancestors.length || ancestors.some(v => !ANCESTORS.has(v)) || ancestors.includes("'none'") && ancestors.length !== 1) errors.push('CSP_POLICY');
  const ages = (h['strict-transport-security'] || '').split(';').map(v => v.trim()).filter(v => /^max-age\s*=/i.test(v));
  const age = ages.length === 1 ? /^max-age\s*=\s*(\d{1,12})$/i.exec(ages[0])?.[1] : null;
  if (!age || Number(age) < 31536000) errors.push('HSTS_POLICY');
  if (h['x-content-type-options']?.toLowerCase() !== 'nosniff') errors.push('XCTO_POLICY');
  if (!['no-referrer', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin'].includes(h['referrer-policy'])) errors.push('REFERRER_POLICY');
  const acao = h['access-control-allow-origin'];
  if (acao && acao !== origin && !(['public-json', 'public-asset'].includes(profile) && acao === '*')) errors.push('ACAO_PROFILE');
  if (acao === '*' && h['access-control-allow-credentials']?.toLowerCase() === 'true') errors.push('ACAO_CREDENTIALS');
  return [...new Set(errors)];
}
export function auditaAnonim(response) {
  let data; try { data = JSON.parse(response.text); } catch { return { status: 'unknown', code: 'NON_JSON', policyVerified: false }; }
  if (response.status === 200 && Array.isArray(data)) return { status: data.length ? 'fail' : 'unknown', code: data.length ? 'PRIVATE_ROWS_EXPOSED' : 'NO_ROWS_OBSERVED', policyVerified: false };
  if ([401, 403].includes(response.status) && data?.code === '42501') return { status: 'ok', code: 'DENIAL_OBSERVED', policyVerified: false };
  return { status: 'unknown', code: response.status === 404 ? 'RESOURCE_NOT_VERIFIED' : [401, 403].includes(response.status) ? 'GATEWAY_OR_AUTH_UNKNOWN' : 'RESPONSE_NOT_VERIFIED', policyVerified: false };
}

function targetValidated(value, backendOrigin, seo = false) {
  let url; try { url = new URL(value); } catch { fail('ORIGIN_REJECTED'); }
  const seoOrigin = seo && ['http:', 'https:'].includes(url.protocol)
    && Object.values(SEO_DOMAINS).some(domain => [domain, 'www.' + domain].includes(url.hostname))
    && url.pathname === '/' && !url.search;
  if ((!seoOrigin && (url.protocol !== 'https:' || ![...OWN, ...(backendOrigin && /^https:\/\/[a-z0-9-]{1,63}\.supabase\.co$/.test(backendOrigin) ? [backendOrigin] : [])].includes(url.origin))) || url.username || url.password || url.hash || url.port
    || seo && !seoOrigin) fail('ORIGIN_REJECTED');
  return url;
}
function newBudget(iterations, intervalMs, now) {
  return { requests: 0, receivedBytes: 0, acceptedBytes: 0, dnsQueries: 0, dns: new Map(),
    maxRequests: LIMITS.requestsPerCycle * iterations, maxBytes: LIMITS.bytesPerCycle * iterations,
    deadline: now() + LIMITS.cycleMs * iterations + intervalMs * (iterations - 1) };
}
function acceptBytes(budget, cycle, count) {
  budget.receivedBytes += count;
  if (budget.acceptedBytes + count > budget.maxBytes || cycle.bytes + count > LIMITS.bytesPerCycle) fail('BYTE_LIMIT');
  budget.acceptedBytes += count; cycle.bytes += count;
}
async function resolveHost(host, { budget, signal, timeoutMs, resolverFactory }) {
  if (budget.dns.has(host)) return untilSignal(budget.dns.get(host), signal);
  const resolver = resolverFactory();
  let timer;
  const cancel = () => { resolver.cancel(); };
  const promise = (async () => {
    try {
      const interruption = new Promise((_, reject) => {
        timer = setTimeout(() => { cancel(); reject(Object.assign(new Error('TIMEOUT'), { code: 'TIMEOUT' })); }, timeoutMs);
        signal?.addEventListener('abort', cancel, { once: true });
      });
      budget.dnsQueries += 2;
      const families = await Promise.race([Promise.allSettled([resolver.resolve4(host), resolver.resolve6(host)]), interruption]);
      if (signal?.aborted) fail(signal.reason?.code === 'TIMEOUT' ? 'TIMEOUT' : 'ABORTED');
      const addresses = [];
      for (const [i, result] of families.entries()) {
        if (result.status === 'rejected') { if (!['ENODATA', 'ENOTFOUND'].includes(result.reason?.code)) fail('DNS_FAILED'); }
        else {
          if (!Array.isArray(result.value) || result.value.length > 16) fail('ADDRESS_REJECTED');
          for (const address of result.value) addresses.push({ address, family: i ? 6 : 4 });
        }
      }
      if (!addresses.length || addresses.length > 16 || addresses.some(v => typeof v.address !== 'string' || isIP(v.address) !== v.family || !addressAllowed(v.address))) fail('ADDRESS_REJECTED');
      return addresses;
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel); cancel(); }
  })();
  budget.dns.set(host, promise);
  try { return await promise; } catch (error) { budget.dns.delete(host); throw error; }
}

/** GET amb DNS fixat al socket. HTTP i redirects observats només per a les quatre variants SEO pròpies. */
export async function requestGet(value, options = {}, deps = {}) {
  const now = deps.now || Date.now;
  const budget = options.budget || newBudget(1, 0, now), cycle = options.cycle || { requests: 0, bytes: 0, deadline: now() + LIMITS.cycleMs };
  const seo = options.kind === 'seo-html';
  const target = targetValidated(value, options.backendOrigin, seo);
  if (seo && (!Object.hasOwn(SEO_PROFILES, options.profile) || Object.keys(options.headers || {}).length || options.backendOrigin)) fail('INVALID_ARGUMENT');
  if (options.method && options.method !== 'GET' || options.body !== undefined || Object.hasOwn(options, 'claimed')) fail('INVALID_ARGUMENT');
  if (Object.keys(options.headers || {}).some(key => key !== 'apikey')) fail('INVALID_ARGUMENT');
  if (options.headers?.apikey && (!options.backendOrigin || target.origin !== options.backendOrigin
    || !configValidated({ supabaseUrl: options.backendOrigin, publishableKey: options.headers.apikey }))) fail('INVALID_CONFIG');
  if (options.signal?.aborted) fail('ABORTED');
  if (!options[CLAIMED]) {
    if (budget.requests >= budget.maxRequests || cycle.requests >= LIMITS.requestsPerCycle) fail('REQUEST_LIMIT');
    budget.requests++; cycle.requests++;
  }
  if (options.timeoutMs !== undefined && (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)) fail('INVALID_ARGUMENT');
  if (options.maxBytes !== undefined && (!Number.isSafeInteger(options.maxBytes) || options.maxBytes < 1)) fail('INVALID_ARGUMENT');
  const timeoutMs = Math.min(options.timeoutMs ?? LIMITS.requestMs, LIMITS.requestMs, budget.deadline - now(), cycle.deadline - now());
  if (timeoutMs <= 0) fail('TIMEOUT');
  const control = new AbortController(); const abort = () => control.abort(Object.assign(new Error('ABORTED'), { code: 'ABORTED' }));
  options.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => control.abort(Object.assign(new Error('TIMEOUT'), { code: 'TIMEOUT' })), timeoutMs);
  const started = now();
  try {
    const addresses = await resolveHost(target.hostname, { budget, signal: control.signal, timeoutMs,
      resolverFactory: deps.resolverFactory || (() => new Resolver({ timeout: Math.min(timeoutMs, 2000), tries: 1 })) });
    if (control.signal.aborted) fail(control.signal.reason?.code === 'ABORTED' ? 'ABORTED' : 'TIMEOUT');
    if (now() - started >= timeoutMs) fail('TIMEOUT');
    return await new Promise((resolve, reject) => {
      let req, incoming, settled = false;
      const cleanup = () => control.signal.removeEventListener('abort', onAbort);
      const rejectOnce = error => { if (settled) return; settled = true; cleanup(); incoming?.destroy(); req?.destroy(); reject(error); };
      const onAbort = () => rejectOnce(Object.assign(new Error(options.signal?.aborted ? 'ABORTED' : 'TIMEOUT'), { code: options.signal?.aborted ? 'ABORTED' : 'TIMEOUT' }));
      control.signal.addEventListener('abort', onAbort, { once: true });
      if (control.signal.aborted) { onAbort(); return; }
      try {
        req = (deps.requestImpl || (target.protocol === 'http:' ? http.request : https.request))(target, { method: 'GET', agent: false, rejectUnauthorized: true,
          minVersion: 'TLSv1.2', servername: target.hostname, checkServerIdentity: tls.checkServerIdentity,
          maxHeaderSize: LIMITS.headerBytes, headers: { Accept: ['html', 'seo-html'].includes(options.kind) ? 'text/html' : 'application/json',
            'Accept-Encoding': 'identity', 'User-Agent': seo ? SEO_PROFILES[options.profile] : 'sdp-sentinella-blindatge/1',
            ...(seo && options.profile === 'google' ? { Referer: 'https://www.google.com/' } : {}), ...(options.headers || {}) },
          lookup: (_host, lookupOptions, callback) => {
            const selected = addresses.find(a => !lookupOptions.family || a.family === lookupOptions.family) || addresses[0];
            if (lookupOptions.all) callback(null, [selected]); else callback(null, selected.address, selected.family);
          } }, response => {
          incoming = response;
          response.on('error', () => rejectOnce(Object.assign(new Error('BODY_INCOMPLETE'), { code: 'BODY_INCOMPLETE' })));
          if (settled) { response.destroy(); return; }
          const status = response.statusCode, headers = headersOf(response.headers);
          if (!seo && status >= 300 && status < 400) { rejectOnce(Object.assign(new Error('REDIRECT_REJECTED'), { code: 'REDIRECT_REJECTED' })); return; }
          const cert = response.socket?.getPeerCertificate?.();
          const validTo = Date.parse(cert?.valid_to), validFrom = Date.parse(cert?.valid_from);
          if (target.protocol === 'https:' && (response.socket?.authorized !== true || !cert || tls.checkServerIdentity(target.hostname, cert)
            || !Number.isFinite(validTo) || !Number.isFinite(validFrom) || validTo <= now() || validFrom > now())) {
            rejectOnce(Object.assign(new Error('TLS_REJECTED'), { code: 'TLS_REJECTED' })); return;
          }
          if (headers['content-encoding'] && headers['content-encoding'] !== 'identity') { rejectOnce(Object.assign(new Error('ENCODING_REJECTED'), { code: 'ENCODING_REJECTED' })); return; }
          const hardMaximum = ['html', 'seo-html'].includes(options.kind) ? LIMITS.htmlBytes : options.kind === 'anonymous' ? LIMITS.privateBytes : LIMITS.jsonBytes;
          const maximum = Math.min(options.maxBytes ?? hardMaximum, hardMaximum), chunks = []; let size = 0;
          if (Number(headers['content-length']) > maximum) { rejectOnce(Object.assign(new Error('BYTE_LIMIT'), { code: 'BYTE_LIMIT' })); return; }
          response.on('data', chunk => {
            if (settled) return;
            try {
              if (size + chunk.length > maximum) { budget.receivedBytes += chunk.length; fail('BYTE_LIMIT'); }
              acceptBytes(budget, cycle, chunk.length); size += chunk.length; chunks.push(chunk);
            } catch (error) { rejectOnce(error); }
          });
          response.on('aborted', () => rejectOnce(Object.assign(new Error('BODY_INCOMPLETE'), { code: 'BODY_INCOMPLETE' })));
          response.on('close', () => { if (!response.complete) rejectOnce(Object.assign(new Error('BODY_INCOMPLETE'), { code: 'BODY_INCOMPLETE' })); });
          response.on('end', () => {
            if (settled) return;
            settled = true; cleanup();
            resolve({ status, headers, text: Buffer.concat(chunks).toString('utf8'), bytes: size, accounted: true,
              tls: target.protocol === 'http:' ? null : { authorized: true, validFrom: new Date(validFrom).toISOString(), validTo: new Date(validTo).toISOString(),
                daysRemaining: Math.floor((validTo - now()) / DAY), fingerprint256: cert.fingerprint256 || null } });
          });
        });
        req.on('error', error => {
          const code = ['CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'ERR_TLS_CERT_ALTNAME_INVALID',
            'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'SELF_SIGNED_CERT_IN_CHAIN', 'CERT_UNTRUSTED', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY'].includes(error.code) ? 'TLS_REJECTED' : 'TRANSPORT_FAILED';
          rejectOnce(Object.assign(new Error(code), { code }));
        });
        req.on('upgrade', (_response, socket) => { socket.on('error', () => {}); socket.destroy(); rejectOnce(Object.assign(new Error('UPGRADE_REJECTED'), { code: 'UPGRADE_REJECTED' })); });
        if (settled) req.destroy(); else req.end();
      } catch { rejectOnce(Object.assign(new Error('TRANSPORT_FAILED'), { code: 'TRANSPORT_FAILED' })); }
    });
  } finally { clearTimeout(timer); options.signal?.removeEventListener('abort', abort); }
}

/** Anàlisi estàtica: no executa scripts ni carrega CSS, imatges o iframes remots. */
async function seoHtml(text, baseUrl) {
  if (Buffer.byteLength(text) > LIMITS.htmlBytes) fail('BYTE_LIMIT');
  const { JSDOM, VirtualConsole } = await import('jsdom');
  const dom = new JSDOM(text, { url: baseUrl, virtualConsole: new VirtualConsole() });
  try {
    const document = dom.window.document;
    const nodes = document.querySelectorAll('*'), links = document.querySelectorAll('a[href]');
    if (nodes.length > SEO_LIMITS.nodes || links.length > SEO_LIMITS.links) fail('LOCAL_LIMIT');
    let rules = 0;
    for (const sheet of document.styleSheets) {
      const visit = entries => { for (const rule of entries || []) { if (++rules > SEO_LIMITS.rules) fail('LOCAL_LIMIT'); if (rule.cssRules) visit(rule.cssRules); } };
      visit(sheet.cssRules);
    }
    const cache = new Map(), findings = [];
    const hidden = element => {
      if (cache.has(element)) return cache.get(element);
      const style = dom.window.getComputedStyle(element), reasons = [];
      if (element.hasAttribute('hidden') || style.display === 'none') reasons.push('display:none');
      if (style.visibility === 'hidden') reasons.push('visibility:hidden');
      if (style.opacity && Number.parseFloat(style.opacity) === 0) reasons.push('opacity:0');
      if (style.fontSize && Number.parseFloat(style.fontSize) === 0) reasons.push('font-size:0');
      if (/px$/i.test(style.textIndent) && Number.parseFloat(style.textIndent) <= -9999) reasons.push('text-indent:-9999px');
      if (/px$/i.test(style.left) && Number.parseFloat(style.left) <= -9999) reasons.push('left:-9999px');
      cache.set(element, reasons); return reasons;
    };
    for (const [index, link] of [...links].entries()) {
      const reasons = new Set(); let depth = 0;
      for (let element = link; element; element = element.parentElement) {
        if (++depth > SEO_LIMITS.depth) fail('LOCAL_LIMIT');
        hidden(element).forEach(reason => reasons.add(reason));
      }
      if (reasons.size && findings.length < LIMITS.findings) findings.push({ ruleId: 'hidden-link-css', link: index + 1, reasons: [...reasons] });
    }
    const externalStylesheets = document.querySelectorAll('link[rel~="stylesheet"][href]').length;
    const title = document.title.replace(/\s+/g, ' ').trim();
    const description = document.querySelector('meta[name="description"]')?.content || '';
    const canonical = document.querySelector('link[rel~="canonical"]')?.getAttribute('href') || '';
    const hrefs = [...links].map(link => link.getAttribute('href'));
    document.querySelectorAll('script,style,noscript,template').forEach(element => element.remove());
    /* v1.2.18 · Gauntlet R1 (L3-03) · jsdom no executa scripts i analitza el
       <noscript> com a DOM: l'enllaç mailto de la closca (index.html) feia
       passar el #root buit per HTML observat, i la comparació eixia «ok» en
       compte d'inconclusiva. Els enllaços que diuen si hi ha contingut estàtic
       es compten després d'esborrar noscript i template, com el text del cos.
       Els hrefs de la projecció i el detector CSS continuen veient-los tots:
       un noscript diferent per a Googlebot continua sent cloaking observat. */
    const visibles = document.querySelectorAll('a[href]').length;
    const textNodes = [], walker = document.createTreeWalker(document.body, dom.window.NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const content = node.textContent.replace(/\s+/g, ' ').trim(); if (content) textNodes.push(content);
    }
    const body = textNodes.join(' ');
    return { projection: JSON.stringify({ title, description, canonical, hrefs, body }),
      observation: { status: findings.length ? 'fail' : !body && !visibles ? 'unknown' : 'ok',
        code: findings.length ? 'HIDDEN_LINK_CSS' : !body && !visibles ? 'SPA_SHELL_ONLY' : 'STATIC_HTML_OBSERVED',
        links: visibles, findings, externalStylesheets, staticOnly: true } };
  } finally { dom.window.close(); }
}
function seoTargets(domain = 'org') {
  const host = SEO_DOMAINS[domain];
  if (!host) fail('INVALID_ARGUMENT');
  return ['http:', 'https:'].flatMap(protocol => ['', 'www.'].flatMap(prefix => Object.keys(SEO_PROFILES).map(profile => ({
    id: `${domain}-${protocol.slice(0, -1)}-${prefix ? 'www' : 'apex'}-${profile}`,
    url: `${protocol}//${prefix}${host}/`, kind: 'seo-html', profile, maxBytes: LIMITS.htmlBytes,
  }))));
}
function seoRedirect(response, item) {
  let target;
  try { target = new URL(headersOf(response.headers).location, item.url); } catch { return null; }
  const host = SEO_DOMAINS[new URL(item.url).hostname.endsWith('.cat') ? 'cat' : 'org'];
  if (target.protocol !== 'https:' || target.hostname !== host || target.username || target.password
    || target.port || target.pathname !== '/' || target.search || target.hash || target.href === item.url) return null;
  return target.origin;
}
async function seoObservation(response, item) {
  if (new URL(item.url).protocol === 'https:' && response.tls?.authorized !== true) return {
    projection: null, observation: { status: 'fail', code: 'TLS_NOT_VERIFIED' } };
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const redirect = seoRedirect(response, item);
    return { projection: redirect ? `redirect:${response.status}:${redirect}` : null,
      observation: { status: redirect ? 'ok' : 'fail', code: redirect ? 'CANONICAL_REDIRECT_OBSERVED' : 'REDIRECT_TARGET_REJECTED',
        ...(redirect ? { redirectOrigin: redirect } : {}), followed: false, staticOnly: true } };
  }
  const headers = headersOf(response.headers);
  if (response.status !== 200 || !/^text\/html\b/i.test(headers['content-type'] || '')) return {
    projection: null, observation: { status: 'unknown', code: 'SEO_HTML_NOT_OBSERVED' } };
  const result = await seoHtml(response.text || '', item.url);
  /* v1.2.18 · Gauntlet R2 (L2R2-01) · Una closca servida amb 200 per http
     perdia el SPA_SHELL_ONLY en passar a INSECURE_HTTP_CONTENT, i compareSeo,
     que només mirava 'unknown', donava el triple per STATIC_VARIANTS_MATCH.
     La fila conserva spaShell perquè la comparació continue inconclusiva.
     La segona sobreescriptura (TLS_NOT_VERIFIED en https) era inabastable:
     la mateixa condició ja torna abans, a l'inici de la funció. */
  if (new URL(item.url).protocol === 'http:') result.observation = { ...result.observation, status: 'fail', code: 'INSECURE_HTTP_CONTENT',
    ...(result.observation.code === 'SPA_SHELL_ONLY' ? { spaShell: true } : {}) };
  return result;
}
function compareSeo(work, output, projections, cycle) {
  const result = [];
  for (let at = 0; at < work.length; at += 3) {
    const values = projections.slice(at, at + 3);
    const different = values.every(value => value !== null && value !== undefined) && new Set(values).size > 1;
    const comparable = values.every(value => value !== null && value !== undefined) && output.slice(at, at + 3).every(row => row.status !== 'unknown' && !row.spaShell);
    result.push({ id: work[at].id.replace(/-normal$/, ''), cycle, kind: 'seo-comparison',
      status: different ? 'fail' : comparable ? 'ok' : 'unknown',
      code: different ? 'CLOAKING_VARIANT_OBSERVED' : comparable ? 'STATIC_VARIANTS_MATCH' : 'STATIC_COMPARISON_INCONCLUSIVE',
      profiles: Object.keys(SEO_PROFILES), staticOnly: true });
  }
  return result;
}

function targets(config) {
  const result = [
    { id: 'org-home', url: OWN[0] + '/', kind: 'html', maxBytes: LIMITS.htmlBytes },
    { id: 'org-ard', url: OWN[0] + '/.well-known/ard.json', kind: 'public-json', maxBytes: LIMITS.jsonBytes },
    { id: 'cat-home', url: OWN[1] + '/', kind: 'html', maxBytes: LIMITS.htmlBytes },
    { id: 'cat-status', url: OWN[1] + '/api/v1/node0/status', kind: 'public-json', maxBytes: LIMITS.jsonBytes },
  ];
  if (config) for (const [table, column] of Object.entries(TABLES)) result.push({ id: table, kind: 'anonymous',
    url: config.origin + '/rest/v1/' + table + '?select=' + column + '&limit=1', maxBytes: LIMITS.privateBytes });
  return result;
}
const sleep = (ms, signal) => new Promise((resolve, reject) => {
  const cancel = () => { clearTimeout(timer); reject(Object.assign(new Error('ABORTED'), { code: 'ABORTED' })); };
  const timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve(); }, ms);
  if (signal?.aborted) cancel(); else signal?.addEventListener('abort', cancel, { once: true });
});
function untilSignal(promise, signal) {
  return new Promise((resolve, reject) => {
    const cancel = () => reject(Object.assign(new Error('ABORTED'), { code: signal.reason?.code === 'TIMEOUT' ? 'TIMEOUT' : 'ABORTED' }));
    if (signal.aborted) cancel(); else signal.addEventListener('abort', cancel, { once: true });
    Promise.resolve(promise).then(value => { signal.removeEventListener('abort', cancel); resolve(value); }, error => { signal.removeEventListener('abort', cancel); reject(error); });
  });
}

export async function auditaBlindatge(options = {}, deps = {}) {
  const now = deps.now || Date.now, root = options.root || arrelSegura();
  const iterations = options.iterations ?? 1, intervalMs = options.intervalMs ?? LIMITS.intervalMin;
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > LIMITS.iterations || !Number.isInteger(intervalMs)
    || intervalMs < LIMITS.intervalMin || intervalMs > LIMITS.intervalMax || !options.remote && iterations !== 1) fail('INVALID_ARGUMENT');
  if (options.seo && (!options.remote || options.configPath || options.config) || options.domain && (!options.seo || !Object.hasOwn(SEO_DOMAINS, options.domain))) fail('INVALID_ARGUMENT');
  const config = configValidated(options.config || (options.configPath ? readConfig(root, options.configPath) : {}));
  const budget = newBudget(iterations, intervalMs, now), localSecrets = scanPublic(root), cycles = [], results = [];
  let interrupted = false;
  if (options.remote) for (let i = 0; i < iterations; i++) {
    if (i) {
      try { await (deps.sleep || sleep)(intervalMs, options.signal); }
      catch { interrupted = true; break; }
    }
    if (options.signal?.aborted || now() >= budget.deadline) { interrupted = true; break; }
    const cycle = { requests: 0, bytes: 0, deadline: Math.min(now() + LIMITS.cycleMs, budget.deadline) };
    const control = new AbortController(), abort = () => control.abort(Object.assign(new Error('ABORTED'), { code: 'ABORTED' }));
    options.signal?.addEventListener('abort', abort, { once: true });
    const timeout = (deps.setTimer || setTimeout)(() => control.abort(Object.assign(new Error('TIMEOUT'), { code: 'TIMEOUT' })), Math.max(1, cycle.deadline - now()));
    const work = options.seo ? seoTargets(options.domain) : targets(config), output = new Array(work.length), projections = new Array(work.length).fill(null); let index = 0;
    try {
      await Promise.all(Array.from({ length: 2 }, async () => {
        for (let at = index++; at < work.length; at = index++) {
          const item = work[at];
          try {
            if (control.signal.aborted) fail(control.signal.reason?.code === 'TIMEOUT' ? 'TIMEOUT' : 'ABORTED');
            if (options.signal?.aborted) fail('ABORTED');
            if (now() >= cycle.deadline) fail('TIMEOUT');
            if (budget.requests >= budget.maxRequests || cycle.requests >= LIMITS.requestsPerCycle) fail('REQUEST_LIMIT');
            budget.requests++; cycle.requests++;
            const response = await untilSignal((deps.requestGet || requestGet)(item.url, { ...item, method: 'GET', [CLAIMED]: true,
              backendOrigin: config?.origin, headers: item.kind === 'anonymous' ? { apikey: config.key } : {}, budget, cycle, signal: control.signal }, deps), control.signal);
            const size = Buffer.byteLength(response.text || '');
            if (size > item.maxBytes) fail('BYTE_LIMIT');
            if (!response.accounted) acceptBytes(budget, cycle, size);
            const secrets = escanejaLiterals(response.text || '', item.id).slice(0, LIMITS.findings);
            let observation;
            if (item.kind === 'seo-html') {
              const seo = await seoObservation(response, item);
              observation = seo.observation; projections[at] = secrets.length ? null : seo.projection;
            }
            else if (item.kind === 'anonymous') observation = auditaAnonim(response);
            else {
              const headers = headersOf(response.headers), errors = auditaCapcaleres(headers, item.kind, new URL(item.url).origin);
              if (response.status !== 200) errors.push('HTTP_STATUS');
              if (response.tls?.authorized !== true) errors.push('TLS_NOT_VERIFIED');
              if (item.kind === 'html' && !/^text\/html\b/i.test(headers['content-type'] || '')) errors.push('CONTENT_TYPE');
              if (item.kind === 'public-json') {
                try { const json = JSON.parse(response.text); if (!json || typeof json !== 'object' || Array.isArray(json)) errors.push('JSON_SHAPE'); } catch { errors.push('CONTENT_TYPE'); }
              }
              observation = { status: errors.length ? 'fail' : response.tls?.daysRemaining < 14 ? 'unknown' : 'ok', code: errors.length ? 'PERIMETER_REGRESSION' : response.tls?.daysRemaining < 14 ? 'TLS_EXPIRY_SOON' : 'OBSERVATION_ACCEPTED', errors };
            }
            output[at] = { id: item.id, cycle: i + 1, kind: item.kind, httpStatus: response.status, bytes: size,
              ...observation, ...(secrets.length ? { status: 'fail', code: 'EXPOSED_SECRET', findings: secrets } : {}), tls: response.tls || null };
          } catch (error) { output[at] = { id: item.id, cycle: i + 1, kind: item.kind, status: 'unknown', code: safeCode(error) }; }
        }
      }));
    } finally { (deps.clearTimer || clearTimeout)(timeout); options.signal?.removeEventListener('abort', abort); }
    cycles.push({ cycle: i + 1, requests: cycle.requests, acceptedBytes: cycle.bytes }); results.push(...output);
    if (options.seo) results.push(...compareSeo(work, output, projections, i + 1));
    if (control.signal.aborted) { interrupted = true; break; }
  }
  const states = [localSecrets.status, ...results.map(r => r.status), ...(!options.remote || !options.seo && !config || interrupted ? ['unknown'] : [])];
  const status = states.includes('fail') ? 'fail' : states.includes('unknown') ? 'unknown' : 'ok';
  return { schema: 'sdp.sentinella-blindatge.v1', checkedAt: new Date(now()).toISOString(), status, scope: options.seo ? 'bounded-static-seo-observations' : 'bounded-observations',
    realNetwork: Boolean(options.remote && !deps.requestGet), localSecrets, cycles, results,
    usage: { requests: budget.requests, acceptedBytes: budget.acceptedBytes, receivedBytes: budget.receivedBytes, dnsQueries: budget.dnsQueries },
    budget: { maxRequests: budget.maxRequests, maxAcceptedBytes: budget.maxBytes, maxCycleMs: LIMITS.cycleMs,
      maxRunMs: LIMITS.cycleMs * iterations + intervalMs * (iterations - 1), requestMs: LIMITS.requestMs, concurrency: 2, retries: 0, redirects: 0 },
    billing: { status: 'unknown', code: 'NO_CLOUD_BILLING_TELEMETRY' },
    coverage: { rlsPolicyVerified: false, secretAbsenceProven: false, anonymousProbeConfigured: Boolean(config), globalAvailabilityProven: false,
      ...(options.seo ? { seoDomain: SEO_DOMAINS[options.domain || 'org'], seoVariants: 4, seoProfiles: 3, cloakingAbsenceProven: false, externalCssFetched: false } : {}) },
    notification: { prepared: Boolean(options.remote && status !== 'ok'), sent: false, transport: null },
    limits: ['Observacions de lectura, no certificació completa de RLS ni de disponibilitat.',
      '200 buit i 404 són inconclusius; 401/403 només acredita denegació si el protocol identifica permisos.',
      'El pressupost limita el robot; facturació i resistència global a DDoS no mesurades.',
      'El chunk que activa el límit pot haver arribat abans de destruir el socket. Cap avís WhatsApp enviat.',
      ...(options.seo ? ['SEO inspecciona HTML estàtic d’un domini per ronda; no executa JS ni carrega CSS extern o destinacions de redirecció.',
        'Una closca SPA buida deixa la comparació inconclusiva; la coincidència estàtica no prova absència de cloaking dinàmic.',
        'Useu --domini=cat en una ronda separada per comprovar el segon domini propi.'] : [])] };
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const stdout = deps.stdout || process.stdout, stderr = deps.stderr || process.stderr;
  try {
    const options = parseArgs(argv), report = await auditaBlindatge({ ...options, ...(deps.root ? { root: deps.root } : {}) }, deps);
    const text = JSON.stringify(report, null, options.json ? 2 : 0) + '\n';
    if (Buffer.byteLength(text) > LIMITS.outputBytes) fail('BYTE_LIMIT');
    stdout.write(text); return report.status === 'fail' ? 1 : report.status === 'unknown' ? 2 : 0;
  } catch (error) { stderr.write(JSON.stringify({ schema: 'sdp.sentinella-blindatge.v1', status: 'unknown', code: safeCode(error), notificationSent: false }) + '\n'); return 2; }
}
if (esMain(import.meta.url)) main().then(code => { process.exitCode = code; });
