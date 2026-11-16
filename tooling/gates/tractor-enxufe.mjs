#!/usr/bin/env node
/**
 * tractor-enxufe.mjs — LA LLEI DE L'ENXUFABILITAT, MECANITZADA
 *
 * L'AGENTS.md §8 diu que el Frontend s'ha d'escriure per a integrar-se
 * pacíficament a la plataforma de Sollutia i separar-se sense trauma. Fins
 * ara això era prosa: cap porta ho comprovava, i l'auditoria 260830 va trobar
 * que la llei era literalment inassolible (el port no s'exposava enlloc i el
 * pany es tancava abans que ningú poguera injectar res).
 *
 * Aquesta porta converteix la llei en una comprovació.
 *
 *   E1 · Cap mòdul importa `supabaseBackend.js` fora del port
 *        (Onada R30 · A3-ENX-02: ni el SDK del proveïdor pel seu nom de
 *        paquet, `@supabase/*`, fora de les zones d'adaptador)
 *   E2 · El contracte de `host.js` i els exports del port no divergixen
 *   E3 · El segellat NO viu dins del cicle de vida del Custom Element
 *   E4 · Una sola superfície global, i declarada
 *   E5 · El protocol del proveïdor viu a l'adaptador (Onada R30 · A3-ENX-03):
 *        cap mòdul de fora parla GoTrue, PostgREST, Realtime, Storage, Edge
 *        Functions o GraphQL, ni posa la capçalera apikey, més enllà de la
 *        línia base declarada (.agents/deute/.enxufe-deute.json, com la
 *        resta de portes amb deute). La porta no deixa passar res que no hi
 *        siga i obliga a llevar el deute pagat; que la línia base no cresca
 *        ho mira tests/tractor-enxufe.test.mjs contra HEAD
 *
 * Zero dependències. Anàlisi estàtica: no cal navegador ni node_modules.
 * Només llig: cap mode d'esta porta escriu al disc (mutation-policy.mjs la
 * té per lectura pura).
 *
 * ÚS
 *   node tooling/gates/tractor-enxufe.mjs [--json] [--arrel=/ruta]
 */

import fs from 'node:fs';
import path from 'node:path';
import { R, rel, CAMINS, EXCLOSOS, arrelSegura, diagnostic, ErrorArrel } from '../lib/arrel.mjs';

const JSON_OUT = process.argv.includes('--json');

const PORT = 'src/data/backendPort.js';
const HOST = 'src/host.js';
const EMBED = 'src/PedraSecaEmbed.jsx';

/* Onada R30 · A3-ENX-02 · Les zones on el SDK i el protocol del proveïdor
   tenen dret a viure: l'adaptador de Supabase i els adaptadors de la
   Frontissa (les mateixes que eximix no-restricted-imports a eslint.config.js). */
const ZONES_ADAPTADOR = Object.freeze(['src/data/supabase/', 'src/data/adaptadors/']);
const dinsDeLAdaptador = (r) => ZONES_ADAPTADOR.some((zona) => r.startsWith(zona));
const PAQUET_DEL_PROVEIDOR = /^@supabase\//;

const infraccions = [];
const anota = (llei, fitxer, detall, pista) => infraccions.push({ llei, fitxer, detall, pista });

function fonts() {
  const eixida = [];
  (function camina(d) {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (EXCLOSOS.has(e.name)) continue;
      const c = path.join(d, e.name);
      if (e.isDirectory()) camina(c);
      else if (/\.(js|jsx|mjs)$/.test(e.name)) eixida.push(c);
    }
  }(R(CAMINS.src)));
  return eixida;
}

const llegeix = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const senseComentaris = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .split('\n').map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1')).join('\n');

/* ═══════════════════════ E1 · El port és l'única porta ═══════════════════════ */

function permetImport(origen, desti) {
  if (!desti.startsWith('src/data/supabase/')) return true;

  return origen.startsWith('src/data/supabase/')
    || (
      origen === 'src/host.js'
      && desti === 'src/data/supabase/index.js'
    );
}

for (const abs of fonts()) {
  const r = rel(abs).replace(/\\/g, '/');
  /* Onada R30 · A3-ENX-02 (àrbitre, P3) · El port té dret a importar
     l'adaptador pel camí relatiu, però no el SDK pel nom del paquet: abans
     se'l saltava sencer, i ESLint només cobrix @supabase/supabase-js. */
  const esPort = r === PORT;

  const text = senseComentaris(llegeix(abs) ?? '');
  
  // Buscar imports (dinàmics o estàtics) i reexports
  const importsReg = /(?:import|export)\s+(?:[^'"`]*?from\s+)?['"`]([^'"`]+)['"`]|import\(['"`]([^'"`]+)['"`]\)/g;
  const matches = [...text.matchAll(importsReg)];
  
  for (const match of matches) {
    const importStr = match[1] || match[2];
    if (!importStr) continue;
    
    // Simplificació ràpida de resolució, assumint que no usem àlies absoluts cap a data/supabase fora de host
    // Opcionalment si inclou supabase
    if (importStr.includes('supabase')) {
      const dirAbs = path.dirname(abs);
      let targetAbs = null;
      
      try {
        if (importStr.startsWith('.')) {
          targetAbs = path.resolve(dirAbs, importStr);
        } else if (importStr.startsWith('@/')) {
          targetAbs = path.resolve(R('src'), importStr.slice(2));
        } else {
          /* Onada R30 · A3-ENX-02 · Un paquet de node_modules no és el nostre
             adaptador, però `@supabase/*` és el SDK del proveïdor: importat
             des d'una secció o un component, salta el port igual que un camí
             relatiu cap a src/data/supabase/. Abans es deixava passar. */
          if (PAQUET_DEL_PROVEIDOR.test(importStr) && !dinsDeLAdaptador(r)) {
            anota('E1', r, `importa el SDK del proveïdor (${importStr}) fora de l'adaptador`,
              `El SDK només viu a ${ZONES_ADAPTADOR.join(' o ')}; la resta parla amb '${PORT}'.`);
          }
          continue;
        }
        if (esPort) continue;

        let targetRel = rel(targetAbs).replace(/\\/g, '/');
        
        // Assegurar extensió si és directori index.js (aproximació per a E1)
        if (!targetRel.endsWith('.js') && !targetRel.endsWith('.mjs') && !targetRel.endsWith('.jsx')) {
          if (fs.existsSync(R(targetRel + '.js'))) targetRel += '.js';
          else if (fs.existsSync(R(targetRel + '/index.js'))) targetRel += '/index.js';
        }

        if (!permetImport(r, targetRel)) {
          anota('E1', r, `importa directament ${targetRel} saltant-se el port`,
            `Importa de '${PORT}' o a través de l'API host.`);
        }
      } catch {
        // Ignorar errors de resolució ací
      }
    }
  }
}

/* ═══════════════════════ E2 · Contracte sincronitzat ═══════════════════════ */

const portText = llegeix(R(PORT));
const hostText = llegeix(R(HOST));

if (!portText) {
  anota('E2', PORT, 'no existix', 'sense port no hi ha enxufabilitat possible');
} else if (!hostText) {
  anota('E2', HOST, 'no existix: el port no té superfície pública',
    'sense host.js, `setBackendImplementation` no és abastable des de fora del bundle');
} else {
  const contracteText = llegeix(R('src/data/contracte.js'));
  if (!contracteText) {
    anota('E2', 'src/data/contracte.js', 'no existix', 'Cal per a llistar les capacitats.');
  } else {
    const alPort = [...portText.matchAll(/^export const (\w+) = /gm)].map((m) => m[1]).filter(k => k !== 'APP_SNAPSHOT_STORAGE_KEY' && k !== 'DATA_SYNC_CHANNEL_NAME' && k !== 'SECTION_SUBMISSIONS_STORAGE_KEY');
    
    const mNucli = /CONTRACTE_NUCLI = Object\.freeze\(\[([\s\S]*?)\]\)/.exec(senseComentaris(contracteText));
    const mCapacitats = /CAPACITATS = Object\.freeze\(\{([\s\S]*?)\}\)/.exec(senseComentaris(contracteText));
    
    let alContracte = mNucli ? [...mNucli[1].matchAll(/'(\w+)'/g)].map((x) => x[1]) : [];
    if (mCapacitats) {
      alContracte.push(...[...mCapacitats[1].matchAll(/'(\w+)'/g)].map((x) => x[1]));
    }

    for (const k of alPort.filter((x) => !alContracte.includes(x))) {
      anota('E2', HOST, `"${k}" es delega al port però no és al CONTRACTE_BACKEND`,
        'un host que implemente el contracte sencer es trobarà aquest mètode encara apuntant a Supabase');
    }
    for (const k of alContracte.filter((x) => !alPort.includes(x))) {
      anota('E2', HOST, `"${k}" és al CONTRACTE_BACKEND però el port no el delega`,
        'un host l\'implementarà i mai serà cridat: fallada muda');
    }
  }
}

/* ═══════════════════════ E3 · El segellat fora del cicle de vida ═══════════════════════ */

const embedText = llegeix(R(EMBED));
if (!embedText) {
  anota('E3', EMBED, 'no existix', 'no es pot verificar on es tanca el pany');
} else {
  const net = senseComentaris(embedText);
  if (/freezeImplementation\s*\(/.test(net)) {
    anota('E3', EMBED, 'crida freezeImplementation() dins del component',
      `el pany s'ha de tancar a ${HOST}:arrenca(). Dins de connectedCallback la finestra `
      + "d'injecció és de zero mil·lisegons: customElements.define() dispara el callback "
      + "síncronament quan l'etiqueta ja és al DOM, que és el cas de WordPress");
  }
  if (hostText && !/freezeImplementation\s*\(\)/.test(senseComentaris(hostText))) {
    anota('E3', HOST, 'arrenca() no congela el backend',
      'sense segellat, una injecció tardana és un vector d\'atac');
  }
}

/* ═══════════════════════ E4 · Una sola superfície global ═══════════════════════ */

const PERMESOS_GLOBAL = /__SDP_(?:REACT_MOUNTED|GLOBAL_ERRORS_BOUND|OUTBOX_QUARANTINED)__/;

for (const abs of fonts()) {
  const r = rel(abs);
  if (r === HOST || /(?:^|\/)(?:__tests__|__mocks__)(?:\/|$)|\.(?:test|spec)\.[cm]?[jt]sx?$/.test(r)) continue;
  const text = senseComentaris(llegeix(abs) ?? '');
  for (const m of text.matchAll(/\b(?:window|globalThis)(?:\.([A-Za-z_$][\w$]*)|\[['"`]([A-Za-z_$][\w$]*)['"`]\])\s*=(?!=)/g)) {
    const prop = m[1] || m[2];
    if (PERMESOS_GLOBAL.test(prop)) continue;
    anota('E4', r, `assigna window.${prop} fora de ${HOST}`,
      `declara-ho a ${HOST}:exposaGlobal() perquè l'API pública siga un sol lloc auditable`);
  }
  for (const m of text.matchAll(/Object\.defineProperty\(\s*(?:window|globalThis)\s*,\s*['"`]([A-Za-z_$][\w$]*)['"`]/g)) {
    const prop = m[1];
    if (PERMESOS_GLOBAL.test(prop)) continue;
    anota('E4', r, `assigna window.${prop} (via defineProperty) fora de ${HOST}`,
      `declara-ho a ${HOST}:exposaGlobal() perquè l'API pública siga un sol lloc auditable`);
  }
}

/* ═══════════════════════ E5 · El protocol del proveïdor viu a l'adaptador ═══════════════════════
   Onada R30 · A3-ENX-03 · E1 mira els imports i no veu el mòdul de fora de
   l'adaptador que parla ell mateix el protocol de Supabase: un camí de GoTrue,
   PostgREST, Realtime, Storage, Edge Functions o GraphQL, o la capçalera
   apikey, al codi (no als comentaris). Cap port no tapa eixe mòdul: el dia de
   canviar de backend és una hora de dolor que cap altra llei no compta.
   Els que ja hi eren el 261115 són a la línia base, amb el seu motiu. La
   porta no deixa passar cap mòdul que no hi siga, ni cap senyal nou en un de
   conegut; una entrada que ja no casa amb l'arbre també és una infracció,
   perquè el deute pagat no torne a entrar pel forat que deixa. La porta només
   llig l'arbre i no pot saber si la línia base ha crescut: ho mira
   tests/tractor-enxufe.test.mjs contra HEAD (una entrada o un senyal nou hi
   entra amb el camp «alta»). Fora: les zones d'adaptador, les proves i el
   manifest generat de la Wiki. */

/* Onada R30 · àrbitre (P1) · El camí sencer, com a la resta de portes de deute:
   tractor-cadena.mjs (C3) pren tot literal solt «.x-deute.json» per un fitxer
   exigit a l'arrel, i un path.join amb el nom solt el posava en roig. */
const LINIA_BASE = '.agents/deute/.enxufe-deute.json';
const SENYALS_PROTOCOL = Object.freeze([
  ['GoTrue', /\/auth\/v1\b/],
  ['PostgREST', /\/rest\/v1\b/],
  ['Realtime', /\/realtime\/v1\b/],
  ['Storage', /\/storage\/v1\b/],
  ['Edge Functions', /\/functions\/v1\b/],
  ['GraphQL', /\/graphql\/v1\b/],
  /* Onada R30 · àrbitre (P3) · En posició de clau d'objecte (després de «{» o
     de «,») o en un Headers.set/append: un ternari amb una variable que es
     diu apikey (`ok ? apikey : null`) no és la capçalera. */
  ['capçalera apikey', /[{,]\s*['"]?apikey['"]?\s*:|\.(?:set|append)\(\s*['"]apikey['"]/],
]);
const NOMS_DE_SENYAL = new Set(SENYALS_PROTOCOL.map(([nom]) => nom));
const GENERATS_E5 = new Set(['src/data/wikiManifest.js']);
const esProva = (r) => /(?:^|\/)(?:__tests__|__mocks__)(?:\/|$)|\.(?:test|spec)\.[cm]?[jt]sx?$/.test(r);

/** La línia base d'E5: { camí → senyals declarats }. Sense fitxer, buida (una
 *  arrel de proves, o un arbre que ja l'ha pagada sencera); malformada, una
 *  infracció i buida, perquè mai no faça passar res. */
function liniaBaseE5() {
  const text = llegeix(R(LINIA_BASE));
  if (text === null) return new Map();
  let dades;
  try { dades = JSON.parse(text); } catch (err) {
    anota('E5', LINIA_BASE, `no és JSON vàlid (${err.message})`, 'repara-la: sense línia base, tot el deute conegut torna a ser infracció');
    return new Map();
  }
  const e5 = dades?.E5;
  if (!e5 || typeof e5 !== 'object' || Array.isArray(e5)) {
    anota('E5', LINIA_BASE, "no porta l'objecte E5", '{ "E5": { "<camí>": { "senyals": [...], "motiu": "..." } } }');
    return new Map();
  }
  const base = new Map();
  for (const [cami, entrada] of Object.entries(e5)) {
    const senyals = Array.isArray(entrada?.senyals) ? entrada.senyals : [];
    const desconeguts = senyals.filter((s) => !NOMS_DE_SENYAL.has(s));
    if (!senyals.length || desconeguts.length || typeof entrada?.motiu !== 'string' || !entrada.motiu.trim()) {
      anota('E5', LINIA_BASE, `${cami}: entrada sense senyals coneguts o sense motiu`,
        `senyals vàlids: ${[...NOMS_DE_SENYAL].join(', ')}; el motiu diu per què encara no és a l'adaptador`);
      continue;
    }
    base.set(cami, new Set(senyals));
  }
  return base;
}

const baseE5 = liniaBaseE5();
const protocolFora = new Map();
for (const abs of fonts()) {
  const r = rel(abs);
  if (dinsDeLAdaptador(r) || GENERATS_E5.has(r) || esProva(r)) continue;
  /* Onada R30 · àrbitre (P2) · Un camí dins d'un literal de regex porta les
     barres escapades (`\/storage\/v1`): es desfan abans de buscar-hi els
     senyals, després de llevar els comentaris. */
  const text = senseComentaris(llegeix(abs) ?? '').replace(/\\\//g, '/');
  const senyals = SENYALS_PROTOCOL.filter(([, re]) => re.test(text)).map(([nom]) => nom);
  if (senyals.length) protocolFora.set(r, senyals);
}
for (const [r, senyals] of protocolFora) {
  const declarats = baseE5.get(r) ?? new Set();
  const nous = senyals.filter((s) => !declarats.has(s));
  if (nous.length) {
    anota('E5', r, `parla el protocol del proveïdor (${nous.join(', ')}) fora de l'adaptador`,
      `mou-ho a ${ZONES_ADAPTADOR[0]} darrere de '${PORT}'; la línia base (${LINIA_BASE}) no és el lloc del deute nou`);
  }
}
for (const [cami, declarats] of baseE5) {
  const ara = new Set(protocolFora.get(cami) ?? []);
  const pagats = [...declarats].filter((s) => !ara.has(s));
  if (pagats.length) {
    anota('E5', LINIA_BASE, `${cami}: declara ${pagats.join(', ')} i l'arbre ja no ho porta`,
      "baixa la línia base: lleva eixos senyals (o l'entrada sencera), que el deute pagat no torne a entrar");
  }
}

/* ═══════════════════════ Informe ═══════════════════════ */

const LLEIS = {
  E1: "El port és l'única porta cap al backend",
  E2: 'Contracte del host sincronitzat amb el port',
  E3: 'El segellat viu fora del cicle de vida del component',
  E4: 'Una sola superfície global, i declarada',
  E5: "El protocol del proveïdor viu a l'adaptador",
};

function informe() {
  /* Onada R30 · A3-ENX-03 · El deute declarat es diu sempre, també en verd:
     un verd amb línia base no és un zero. */
  const liniaBase = { E5: [...baseE5.keys()].sort() };
  if (JSON_OUT) {
    console.log(JSON.stringify({ ok: !infraccions.length, arrel: arrelSegura(), infraccions, liniaBase }, null, 2));
    return infraccions.length ? 1 : 0;
  }
  console.log("\n🔌 TRACTOR D'ENXUFE — Llei de l'Enxufabilitat (AGENTS.md §8)");
  console.log(`   Arrel: ${arrelSegura()}`);
  console.log('─'.repeat(72));
  for (const [codi, nom] of Object.entries(LLEIS)) {
    const meues = infraccions.filter((i) => i.llei === codi);
    const deute = liniaBase[codi]?.length ? `  (línia base: ${liniaBase[codi].length} mòdul(s), deute declarat)` : '';
    if (!meues.length) { console.log(`  ✅ ${codi} · ${nom}${deute}`); continue; }
    console.log(`  ❌ ${codi} · ${nom}  (${meues.length})`);
    for (const i of meues.slice(0, 6)) {
      console.log(`       ${i.fitxer}`);
      console.log(`         · ${i.detall}`);
      if (i.pista) console.log(`           ↳ ${i.pista}`);
    }
    if (meues.length > 6) console.log(`       · … i ${meues.length - 6} més`);
  }
  console.log('─'.repeat(72));
  if (infraccions.length) {
    console.error(`\n❌ ${infraccions.length} infracció(ns). El dia de separar Frontend i Backend,`);
    console.error('   cadascuna serà una hora de dolor.\n');
    return 1;
  }
  console.log("\n✅ El port és abastable, el contracte quadra i el pany es tanca on toca.\n");
  return 0;
}

try {
  const d = diagnostic();
  if (d.error) { console.error(d.error.informe()); process.exit(2); }
  process.exit(informe());
} catch (err) {
  if (err instanceof ErrorArrel) { console.error(err.informe()); process.exit(2); }
  console.error(`\n❌ [TRACTOR-ENXUFE] Error inesperat: ${err.message}\n`);
  process.exit(2);
}
