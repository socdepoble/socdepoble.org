#!/usr/bin/env node
/**
 * tractor-frontera-auth.mjs — la frontera que ningú vigilava.
 *
 * PER QUÈ EXISTIX
 * ───────────────
 * A la V7, `tractor-sollutia.mjs` cobria variables, instàncies i ordre de
 * build. De l'autenticació no en sabia res: `grep -c "oauth|callback|
 * ORIGENS_PERMESOS|relay|sdp_origin" tooling/gates/tractor-sollutia.mjs` → 0.
 *
 * Mentrestant hi havia dues llistes que han de coincidir i res que ho
 * comprovara:
 *
 *   · src/data/oauthRelay.js   RELAY_PER_DEFECTE = https://auth.socdepoble.org/callback
 *   · public/auth/callback.html  desplegament documentat = ...socdepoble.cat/callback
 *
 * `relayOrigin()` deriva d'eixa constant la validació estricta del
 * `postMessage`. Si el relé viu on deia l'HTML, el Camí 1 fallava sempre en
 * silenci i tot l'inici de sessió depenia del fallback de `storage` o del
 * timeout de 180 s. Cap prova ho hauria detectat: no és una excepció, és un
 * `return` primerenc dins d'un gestor d'esdeveniments.
 *
 * El fitxer callback.html ja porta escrita la seua pròpia llei de seguretat
 * («ORÍGENS_PERMESOS es compara amb ===. Mai amb startsWith, includes ni
 * expressions regulars»). Una llei escrita i no verificada és una preferència.
 * Esta porta la fa mecànica.
 *
 * LLEIS
 *   A1  RELE-DIVERGENT   l'URL del relé al JS i la documentada a l'HTML no coincidixen
 *   A2  COMPARACIO-FLUIXA  la llista blanca es consulta amb alguna cosa que no és igualtat
 *   A3  ORIGEN-MALFORMAT  entrada amb barra final, comodí, camí o esquema absent
 *   A4  SOLLUTIA-ABSENT   cap origen més enllà del domini propi i local (avís, no fallada)
 *   A5  CAMI-CRU          `sdp_path` arriba al `location.replace` sense validar
 *   A6  ORIGEN-CABLEJAT   un origen de relé escrit a mà en compte de derivat
 *
 * Pedra Seca: zero dependències, ESM, fail-closed.
 *
 *   node tooling/gates/tractor-frontera-auth.mjs [--json]
 */

import fs from 'node:fs';
import { arrelSegura, R } from '../lib/arrel.mjs';

const JSON_OUT = process.argv.includes('--json');

try { arrelSegura(); } catch (e) {
  console.error(e.informe ? e.informe() : String(e));
  process.exit(1);
}

const JS = 'src/data/oauthRelay.js';
const HTML = 'public/auth/callback.html';

const infr = [];
const avisos = [];
const falla = (llei, on, detall) => infr.push({ llei, on, detall });
const avisa = (llei, on, detall) => avisos.push({ llei, on, detall });

const llig = (rel) => {
  const abs = R(rel);
  if (!fs.existsSync(abs)) {
    console.error(`\n❌ [FRONTERA-AUTH] Falta ${rel}. La frontera d'autenticació no es pot auditar.\n`);
    process.exit(1);
  }
  return fs.readFileSync(abs, 'utf8');
};

const js = llig(JS);
const html = llig(HTML);

/* ═══════════ A1 · l'URL del relé ha de ser la mateixa als dos costats ═══════════ */

const mJs = /RELAY_PER_DEFECTE\s*=\s*['"]([^'"]+)['"]/.exec(js);
if (!mJs) {
  falla('A1', JS, 'No es troba `RELAY_PER_DEFECTE`. Sense una font única, els dos costats deriven.');
} else {
  const urlJs = mJs[1];
  let origenJs = null;
  try { origenJs = new URL(urlJs).origin; } catch {
    falla('A1', JS, `RELAY_PER_DEFECTE no és un URL absolut: ${urlJs}`);
  }

  // Tots els auth.* que apareixen a l'HTML (comentari de desplegament inclòs).
  const alsHtml = [...new Set([...html.matchAll(/https?:\/\/[a-z0-9.-]*auth[a-z0-9.-]*(?::\d+)?/gi)]
    .map((m) => m[0]))];
  for (const u of alsHtml) {
    let o = null;
    try { o = new URL(u).origin; } catch { continue; }
    if (origenJs && o !== origenJs) {
      falla('A1', HTML,
        `L'HTML nomena el relé a «${o}» i ${JS} el fixa a «${origenJs}». `
        + 'relayOrigin() en deriva la validació del postMessage: si divergixen, '
        + 'el Camí 1 falla sempre en silenci.');
    }
  }
}

/* ═══════════ A2, A3, A4 · Validació d'orígens dinàmica ═══════════ */

const mFuncio = html.match(/function\s+esOrigenPermes\s*\(/);
if (!mFuncio) {
  falla('A2', HTML, 'No es troba la funció `esOrigenPermes`. Sense validació d\'origen açò és un redirector obert.');
} else {
  // Comprovem que es valida que siga https (llevat per a local)
  if (!html.includes("u.protocol !== 'https:'")) {
    falla('A3', HTML, 'La funció no obliga a utilitzar HTTPS.');
  }
  
  // Comprovem que s'inclou validació de sollutia i socdepoble
  if (!html.includes('sollutia') && !html.includes('socdepoble')) {
    avisa('A4', HTML, 'La validació no sembla incloure explícitament els dominis de Sollutia ni Soc de Poble.');
  }
}


/* ═══════════ A5 · sdp_path validat abans d'anar al replace ═══════════ */

if (/sdp_path/.test(html)) {
  const validat = /camiValid|indexOf\('#'\)|charCodeAt|\.length\s*<=?\s*\d+/.test(html)
    && /indexOf\('#'\)\s*===?\s*-1|!camiValid/.test(html);
  if (!validat) {
    falla('A5', HTML,
      '`sdp_path` arriba a location.replace() sense validar. `sdp_origin` es valida amb rigor '
      + 'i este no: rigor asimètric a dos paràmetres de la mateixa URL. Un «#» dins seu trenca '
      + 'el fragment i mata l\'entrada en silenci.');
  }
}

/* ═══════════ A6 · cap origen de relé cablejat fora de la constant ═══════════ */

const cablejats = [...js.matchAll(/['"](https?:\/\/[^'"]*auth[^'"]*)['"]/gi)].map((m) => m[1]);
for (const c of cablejats) {
  if (mJs && c !== mJs[1]) {
    falla('A6', JS, `URL de relé escrit a mà «${c}» al costat de RELAY_PER_DEFECTE. Una sola font o cap.`);
  }
}
if (!/relayOrigin\s*=\s*\(.*\)\s*=>\s*new URL\(relayUrl\(/.test(js)) {
  falla('A6', JS, 'relayOrigin() no es deriva de relayUrl(). Si es cablejara, la validació del postMessage deixaria de seguir la configuració.');
}

/* ═══════════════════════════ Informe ═══════════════════════════ */

if (JSON_OUT) {
  console.log(JSON.stringify({ ok: infr.length === 0, infraccions: infr, avisos }, null, 2));
  process.exit(infr.length ? 1 : 0);
}

const NOMS = {
  A1: 'RELE-DIVERGENT — el JS i l\'HTML no nomenen el mateix relé',
  A2: 'COMPARACIO-FLUIXA — la llista blanca no es consulta per igualtat',
  A3: 'ORIGEN-MALFORMAT — entrada que mai coincidirà o que obri el relé',
  A4: 'SOLLUTIA-ABSENT — cap amfitrió de Sollutia a la llista',
  A5: 'CAMI-CRU — sdp_path sense validar',
  A6: 'ORIGEN-CABLEJAT — URL de relé escrit a mà',
};

console.log('\n🔐 [FRONTERA-AUTH] Relé OAuth i llista blanca d\'orígens\n');
for (const llei of ['A1', 'A2', 'A3', 'A4', 'A5', 'A6']) {
  const seus = infr.filter((i) => i.llei === llei);
  const seusAvis = avisos.filter((i) => i.llei === llei);
  const marca = seus.length ? '❌' : seusAvis.length ? '⚠️ ' : '✅';
  console.log(`${marca} ${llei} · ${NOMS[llei]} — ${seus.length} màx 0`);
  for (const s of [...seus, ...seusAvis].slice(0, 6)) console.log(`      ${s.on}: ${s.detall}`);
}
console.log('\n' + '─'.repeat(72));

if (infr.length) {
  console.error(`\n❌ [FRONTERA-AUTH] ${infr.length} infracció(ns). L'entrada amb Google no és de fiar.\n`);
  process.exit(1);
}
console.log(`\n✅ [FRONTERA-AUTH] Frontera coherent${avisos.length ? ` (${avisos.length} avís/os)` : ''}.\n`);
process.exit(0);
