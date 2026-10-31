// @vitest-environment node
/**
 * P0-19 (D10/D12) · Paritat verificable de CSP, capçaleres de seguretat (M-01)
 * i regles CORS de mitjans públics entre firebase.json, vercel.json, index.html
 * i vite.natiu.config.js.
 *
 * Context d'auditoria (Codex C-05 / Claude MEDIA-2 / P0-19):
 *   socdepoble.org es servix des de Firebase Hosting. Si una directiva de recurs
 *   (*-src, com media-src) està declarada al <meta http-equiv="Content-Security-Policy">
 *   d'index.html però falta a la capçalera HTTP de firebase.json o vercel.json,
 *   el navegador aplica la intersecció de totes dues polítiques i la capçalera
 *   fa caure eixe recurs a default-src (bloquejant àudio/vídeo HTTPS signat del Xat).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
// Node carrega la configuració real, fora de la transformació de Vitest de
// @vitejs/plugin-react. Cap còpia del generador ni inspecció de text font.
const natiu = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `
  import fs from 'node:fs';
  import {cspNativa,transformaIndexNatiu} from './vite.natiu.config.js';
  const origenBackend='https://backend.socdepoble.test';
  console.log(JSON.stringify({csp:cspNativa(origenBackend),html:transformaIndexNatiu(fs.readFileSync('index.html','utf8'),{origenBackend})}));
`], {cwd:process.cwd(),encoding:'utf8'}));

const arrel = process.cwd();
const lligJson = (cami) => JSON.parse(readFileSync(resolve(arrel, cami), 'utf8'));
const lligText = (cami) => readFileSync(resolve(arrel, cami), 'utf8');

/**
 * Converteix una cadena CSP en un diccionari ordenat { [directiva]: fonts[] }.
 * @param {string} cspText
 * @returns {Record<string, string[]>}
 */
function analitzaDirectivesCsp(cspText) {
  return Object.fromEntries(
    String(cspText)
      .split(';')
      .map((bloc) => bloc.trim())
      .filter(Boolean)
      .map((bloc) => {
        const [directiva, ...fonts] = bloc.split(/\s+/);
        return [directiva, fonts];
      }),
  );
}

/**
 * Verifica que cap directiva *-src declarada a la meta d'index.html quede absent
 * en una capçalera HTTP d'amfitrió (prevenint la caiguda silenciosa a default-src).
 * @param {Record<string, string[]>} metaDirectives
 * @param {Record<string, string[]>} headerDirectives
 * @returns {string[]}
 */
function directivesRecursAbsentsACapcalera(metaDirectives, headerDirectives) {
  return Object.keys(metaDirectives).filter(
    (nom) => nom.endsWith('-src') && !Array.isArray(headerDirectives[nom]),
  );
}

describe('P0-19 (D10/D12): Paritat estructural de CSP i capçaleres entre firebase.json i vercel.json', () => {
  const firebaseConfig = lligJson('firebase.json');
  const vercelConfig = lligJson('vercel.json');
  const indexHtml = lligText('index.html');

  const reglaGlobalFirebase = firebaseConfig.hosting.headers.find((r) => r.source === '**');
  const reglaGlobalVercel = vercelConfig.headers.find((r) => r.source === '/(.*)');

  const mapCapcaleres = (regla) =>
    Object.fromEntries((regla?.headers ?? []).map((h) => [h.key, h.value]));

  const capcaleresGlobalsFirebase = mapCapcaleres(reglaGlobalFirebase);
  const capcaleresGlobalsVercel = mapCapcaleres(reglaGlobalVercel);

  const cspFirebase = capcaleresGlobalsFirebase['Content-Security-Policy'];
  const cspVercel = capcaleresGlobalsVercel['Content-Security-Policy'];
  const matchMeta = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)">/.exec(
    indexHtml,
  );
  const cspMeta = matchMeta ? matchMeta[1] : '';

  const directivesFirebase = analitzaDirectivesCsp(cspFirebase);
  const directivesVercel = analitzaDirectivesCsp(cspVercel);
  const directivesMeta = analitzaDirectivesCsp(cspMeta);

  it('manté identitat byte a byte i directiva a directiva entre la CSP de firebase.json (**) i vercel.json (/(.*))', () => {
    expect(reglaGlobalFirebase).toBeDefined();
    expect(reglaGlobalVercel).toBeDefined();
    expect(cspFirebase).toBeTruthy();
    expect(cspFirebase).toBe(cspVercel);
    expect(directivesFirebase).toEqual(directivesVercel);
  });

  it('verifica les directives crítiques (media-src, img-src, connect-src, script-src, style-src, frame-ancestors) als dos amfitrions', () => {
    const esperades = {
      'default-src': ["'self'", 'data:', 'blob:'],
      'style-src': ["'self'", "'unsafe-inline'", 'https:'],
      'script-src': ["'self'"],
      'worker-src': ["'self'", 'blob:'],
      'connect-src': [
        "'self'",
        'data:',
        'https:',
        'wss:',
        'ws://localhost:*',
        'http://localhost:*',
      ],
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'media-src': ["'self'", 'data:', 'blob:', 'https:'],
      'font-src': ["'self'", 'https:', 'data:'],
      'frame-src': ["'self'", 'https:'],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'frame-ancestors': [
        "'self'",
        'https://*.socdepoble.org',
        'https://socdepoble.org',
        'https://*.sollutia.cat',
        'https://sollutia.cat',
        'https://*.sollutia.com',
        'http://localhost:*',
      ],
    };

    expect(directivesFirebase).toEqual(esperades);
    expect(directivesVercel).toEqual(esperades);

    // Cap script-src no admet unsafe-inline ni unsafe-eval
    expect(directivesFirebase['script-src']).not.toContain("'unsafe-inline'");
    expect(directivesFirebase['script-src']).not.toContain("'unsafe-eval'");
  });

  it('garanteix que media-src permet reproduir adjunts HTTPS signats, blob: i data: a web i natiu (P0-19)', () => {
    const fontsMediaRequerides = ["'self'", 'data:', 'blob:', 'https:'];

    for (const [, d] of [
      ['firebase.json', directivesFirebase],
      ['vercel.json', directivesVercel],
      ['index.html', directivesMeta],
    ]) {
      expect(d['media-src']).toEqual(expect.arrayContaining(fontsMediaRequerides));
      expect(d['img-src']).toEqual(expect.arrayContaining(fontsMediaRequerides));
    }

    const nativa = politicaEstrica(natiu.csp);
    expect(nativa['media-src']).toEqual(fontsMediaRequerides);
    expect(nativa['img-src']).toEqual(fontsMediaRequerides);
    expect(nativa['connect-src']).toEqual(["'self'", 'data:', 'https://backend.socdepoble.test', 'wss://backend.socdepoble.test']);
    expect(natiu.html).toContain(`content="${natiu.csp}">`);
  });

  it('detecta immediatament si una capçalera d’amfitrió omet media-src i estreny la meta (prova de mutació P0-19)', () => {
    expect(directivesRecursAbsentsACapcalera(directivesMeta, directivesFirebase)).toEqual([]);
    expect(directivesRecursAbsentsACapcalera(directivesMeta, directivesVercel)).toEqual([]);

    const cspSenseMediaSrc = cspFirebase.replace(/media-src\s+[^;]+;\s*/, '');
    const directivesMutades = analitzaDirectivesCsp(cspSenseMediaSrc);
    expect(directivesRecursAbsentsACapcalera(directivesMeta, directivesMutades)).toEqual([
      'media-src',
    ]);
  });

  it('manté paritat exacta en X-Content-Type-Options, Referrer-Policy i Permissions-Policy entre firebase.json i vercel.json', () => {
    const capcaleresSeguretat = {
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self)',
    };

    for (const [clau, valorEsperat] of Object.entries(capcaleresSeguretat)) {
      expect(capcaleresGlobalsFirebase[clau]).toBe(valorEsperat);
      expect(capcaleresGlobalsVercel[clau]).toBe(valorEsperat);
    }

    expect(reglaGlobalFirebase.headers.map((h) => h.key)).toEqual([
      'Content-Security-Policy',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
    ]);
    expect(reglaGlobalVercel.headers.map((h) => h.key)).toEqual([
      'Content-Security-Policy',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
    ]);
  });

  it('manté paritat exacta en les regles CORS dels mitjans públics (/assets/** vs /assets/(.*))', () => {
    const corsAssetsFirebase = firebaseConfig.hosting.headers.find(
      (r) => r.source === '/assets/**',
    );
    const corsAssetsVercel = vercelConfig.headers.find((r) => r.source === '/assets/(.*)');

    expect(corsAssetsFirebase).toBeDefined();
    expect(corsAssetsVercel).toBeDefined();

    const esperatCorsAssets = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Content-Range, ETag',
      'Access-Control-Allow-Headers': 'Range',
    };

    expect(mapCapcaleres(corsAssetsFirebase)).toEqual(esperatCorsAssets);
    expect(mapCapcaleres(corsAssetsVercel)).toEqual(esperatCorsAssets);
  });

  it('documenta i acota les diferències intencionades d’amfitrió entre Firebase Hosting i Vercel', () => {
    const fontsFirebase = firebaseConfig.hosting.headers.map(
      (r) => r.source ?? `regex:${r.regex}`,
    );
    const fontsVercel = vercelConfig.headers.map((r) => r.source);

    expect(fontsFirebase).toContain('/ap/**');
    expect(fontsFirebase).toContain('/assets/**');
    expect(fontsVercel).toEqual(expect.arrayContaining(['/(.*)', '/assets/(.*)', '/favicon.svg', '/favicon.ico', '/manifest.webmanifest']));
    expect(fontsFirebase.length).toBe(new Set(fontsFirebase).size);
    expect(fontsVercel.length).toBe(new Set(fontsVercel).size);
  });
});

// Mutation exercises the SAME assertion as the real config, including source
// removal, broadening and duplicate directives (first wins in browsers).
function politicaEstrica(cadena) {
  const blocs = cadena.split(';').map(b => b.trim()).filter(Boolean);
  const noms = blocs.map(b => b.split(/\s+/)[0]);
  expect(new Set(noms).size).toBe(noms.length);
  const directives = analitzaDirectivesCsp(cadena);
  expect(directives['script-src']).toEqual(["'self'"]);
  expect(directives['media-src']).toEqual(["'self'", 'data:', 'blob:', 'https:']);
  expect(directives['object-src']).toEqual(["'none'"]);
  return directives;
}
it('mutació real: el mateix validador rebutja omissió, ampliació insegura, duplicat i paritat trencada', () => {
  const firebase = lligJson('firebase.json');
  const original = firebase.hosting.headers.find(r => r.source === '**').headers.find(h => h.key === 'Content-Security-Policy').value;
  expect(() => politicaEstrica(original)).not.toThrow();
  for (const mutada of [
    original.replace(/media-src[^;]+;?/, ''),
    original.replace("script-src 'self'", "script-src 'self' 'unsafe-eval'"),
    original + "; script-src *",
    original.replace("media-src 'self' data: blob: https:", "media-src 'self'"),
  ]) expect(() => politicaEstrica(mutada)).toThrow();
  expect(() => politicaEstrica(natiu.csp)).not.toThrow();
  expect(() => politicaEstrica("media-src *; script-src *; " + natiu.csp)).toThrow();
  const vercel = lligJson('vercel.json');
  const v = vercel.headers.find(r => r.source === '/(.*)').headers.find(h => h.key === 'Content-Security-Policy');
  const validaParitat = () => expect(politicaEstrica(original)).toEqual(politicaEstrica(v.value));
  expect(validaParitat).not.toThrow();
  v.value = v.value.replace("font-src 'self' https: data:", "font-src 'self'");
  expect(validaParitat).toThrow();
});
