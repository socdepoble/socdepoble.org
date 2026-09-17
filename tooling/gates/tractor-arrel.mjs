#!/usr/bin/env node
/**
 * tractor-arrel.mjs — LA PORTA QUE VIGILA LES PORTES
 *
 * PER QUÈ EXISTIX
 * ───────────────
 * L'auditoria 260830 no va trobar regles sense porta. Va trobar el contrari, i
 * és pitjor: portes que no arrancaven, que no trobaven el que vigilaven, o que
 * deien ✅ sense haver comprovat res. Cinc casos reals:
 *
 *   · tractor-cognitiu.mjs buscava `AGENTS.md` a l'arrel. L'"Operació Tret al
 *     Cap" l'havia mogut a `.agents/`. Només arrancava amb `--arrel=.`, un flag
 *     màgic amagat dins d'`npm run porta`.
 *   · project_paths.mjs exigia `_wiki_de_poble`, que és un repositori separat.
 *     Sense la Wiki clonada llançava un stack trace cru.
 *   · tractor-doctrina.mjs llegia les exempcions de `.agents/doctrina-ignora.txt`
 *     mentre el fitxer vivia a `tooling/gates/`. La llista mai es carregava.
 *   · design_guard.mjs va viure mesos declarat a `npm run porta` sense bloc CLI:
 *     Node l'importava, definia funcions i eixia amb codi 0. Mai va fallar
 *     perquè mai es va executar.
 *   · `npm run time-machine` apuntava a `tooling/gates/estela.sh`, esborrat.
 *
 * Cap d'aquests defectes és detectable llegint el codi amb bona fe. Tots ho són
 * mecànicament. Açò és el que fa aquesta porta.
 *
 * COMPROVA
 *   A1 · Cap eina calcula l'arrel pel seu compte (només tooling/lib/arrel.mjs)
 *   A2 · Tot script de `package.json` apunta a un fitxer que existix
 *   A3 · `main` / `module` / `exports` no prometen artefactes que ningú construix
 *   A4 · Tota porta de `tooling/gates/` té punt d'entrada CLI (arranca de veres)
 *   A5 · Tot fitxer de configuració citat pel tooling existix on el cita
 *
 * Zero dependències. Fail-closed.
 *
 * ÚS
 *   node tooling/gates/tractor-arrel.mjs
 *   node tooling/gates/tractor-arrel.mjs --json
 *   node tooling/gates/tractor-arrel.mjs --arrel=/ruta
 */

import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { R, rel, CAMINS, EXCLOSOS, arrelSegura, diagnostic, ErrorArrel } from '../lib/arrel.mjs';

const JSON_OUT = process.argv.includes('--json');

/** L'únic fitxer autoritzat a saber com es troba l'arrel. */
const CUSTODI = 'tooling/lib/arrel.mjs';

/** Fitxers que poden citar marcadors d'arrel sense ser el custodi. */
const EXEMPTS_A1 = new Set([
  CUSTODI,
  'tooling/gates/tractor-arrel.mjs',
  'tooling/verify-bios.mjs', // el seu ofici és precisament comprovar que hi són
]);

const infraccions = [];
const anota = (llei, fitxer, detall, pista) => infraccions.push({ llei, fitxer, detall, pista });

/* ═══════════════════════ Recorregut ═══════════════════════ */

function fitxers(dirRelatiu, exts = ['.mjs', '.cjs', '.js']) {
  const eixida = [];
  const arrelDir = R(dirRelatiu);
  if (!fs.existsSync(arrelDir)) return eixida;
  (function camina(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (EXCLOSOS.has(e.name)) continue;
      const c = path.join(d, e.name);
      if (e.isDirectory()) camina(c);
      else if (exts.includes(path.extname(e.name))) eixida.push(c);
    }
  }(arrelDir));
  return eixida;
}

const llegeix = (abs) => { try { return fs.readFileSync(abs, 'utf8'); } catch { return ''; } };

/* ═══════════════════════ A1 · Monopoli del descobriment d'arrel ═══════════════════════ */

/**
 * Detecta el patró «buscar un marcador d'arrel a mà». No busca noms de funció
 * (es poden dir com siga): busca la petjada semàntica, que és citar un marcador
 * estructural dins d'una comprovació d'existència o d'una llista de marcadors.
 */
const PATRONS_A1 = [
  { re: /existsSync\s*\([^)]*['"`](?:\.agents\/)?AGENTS\.md['"`]/, què: 'comprovació manual del marcador AGENTS.md' },
  { re: /MARCADORS?\s*=\s*\[[^\]]*['"`]AGENTS\.md['"`]/, què: 'llista pròpia de marcadors d\'arrel' },
  { re: /REQUIRED_(?:FILES|DIRECTORIES)\s*=/, què: 'contracte estructural paral·lel' },
  { re: /function\s+(?:trobaArrel|discoverProjectRoot|findRoot|getProjectRoot)\b/, què: 'funció pròpia de descobriment d\'arrel' },
];

for (const abs of fitxers(CAMINS.tooling)) {
  const r = rel(abs);
  if (EXEMPTS_A1.has(r)) continue;
  const text = llegeix(abs);
  // Si el fitxer importa el custodi, qualsevol funció amb nom de descobriment
  // és una capa de compatibilitat que delega, no una implementació rival.
  // Sense aquesta excepció, un adaptador correcte quedaria marcat per sempre.
  if (/from\s+['"][^'"]*lib\/arrel\.mjs['"]/.test(text)) continue;
  for (const p of PATRONS_A1) {
    if (p.re.test(text)) {
      anota('A1', r, p.què,
        `importa { R, rel, CAMINS } de '${path.relative(path.dirname(r), CUSTODI).split(path.sep).join('/')}'`);
      break;
    }
  }
}

/* ═══════════════════════ A2 · Scripts de package.json vius ═══════════════════════ */

let pkg = null;
try { pkg = JSON.parse(llegeix(R('package.json'))); } catch { /* A2 ho reportarà */ }

if (!pkg) {
  anota('A2', 'package.json', 'no existix o no és JSON vàlid', 'sense manifest no es poden validar les portes');
} else {
  /* Extrau tota ruta de fitxer del cos d'un script i comprova que existix.
     Es reconeixen les invocacions habituals: node/sh/bash/python3 <fitxer>. */
  const RE_INVOCACIO = /(?:^|[\s&|;])(?:node|sh|bash|python3?|npx\s+\S+)\s+(--?\S+\s+)*([A-Za-z0-9_./-]+\.(?:mjs|cjs|js|sh|py))/g;
  for (const [nom, cos] of Object.entries(pkg.scripts ?? {})) {
    for (const m of String(cos).matchAll(RE_INVOCACIO)) {
      const objectiu = m[2];
      if (objectiu.startsWith('-')) continue;
      if (!fs.existsSync(R(objectiu))) {
        anota('A2', 'package.json', `l'script "${nom}" invoca ${objectiu}, que no existix`,
          'esborra l\'script o restaura el fitxer: un script mort enganya qui col·labore');
      }
    }
  }
}

/* ═══════════════════════ A3 · Punts d'entrada del paquet ═══════════════════════ */

if (pkg) {
  /** Cerca si alguna configuració de Vite declara `build.lib`. */
  const hiHaLib = fitxers('.', ['.js', '.mjs'])
    .filter((f) => /vite\..*config\.(js|mjs)$/.test(path.basename(f)))
    .some((f) => /\blib\s*:/.test(llegeix(f)));

  const promeses = [
    ['main', pkg.main],
    ['module', pkg.module],
    ...Object.entries(pkg.exports ?? {}).flatMap(([k, v]) => (typeof v === 'object'
      ? Object.entries(v).map(([cond, ruta]) => [`exports["${k}"].${cond}`, ruta])
      : [[`exports["${k}"]`, v]])),
  ].filter(([, v]) => typeof v === 'string');

  for (const [camp, ruta] of promeses) {
    const net = ruta.replace(/^\.\//, '');
    if (fs.existsSync(R(net))) continue;
    if (!hiHaLib) {
      anota('A3', 'package.json',
        `${camp} promet "${ruta}" però cap config de Vite declara build.lib`,
        'qui faça `npm install` i l\'importe rebrà un ERR_MODULE_NOT_FOUND');
    }
  }
}

/* ═══════════════════════ A4 · Les portes arranquen ═══════════════════════ */

/**
 * Una porta que només exporta i mai s'executa passa sempre. És el defecte que
 * `design_guard.mjs` documenta a la seua pròpia capçalera com a lliçó apresa.
 * Es reconeix un punt d'entrada per qualsevol d'aquestes formes:
 *   · crida de nivell superior:  main();  run();  principal();
 *   · guarda d'entrada directa:  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
 *   · eixida explícita:          process.exit(...)  fora d'una funció exportada
 */
const RE_ENTRADA = [
  /import\.meta\.url\s*===/,
  /^\s*(?:await\s+)?(?:main|run|principal|arrenca)\s*\(\s*\)\s*;?\s*$/m,
  /^\s*process\.exit\s*\(/m,
  /pathToFileURL\s*\(\s*process\.argv\[1\]\s*\)/,
];

for (const abs of fitxers(CAMINS.portes)) {
  const r = rel(abs);
  const text = llegeix(abs);
  if (!text.trim()) { anota('A4', r, 'fitxer buit dins de tooling/gates/', 'esborra\'l o implementa\'l'); continue; }
  if (!RE_ENTRADA.some((re) => re.test(text))) {
    anota('A4', r, 'no té punt d\'entrada CLI: Node l\'importaria i eixiria amb codi 0',
      'afig un bloc final: if (import.meta.url === `file://${process.argv[1]}`) { … }');
  }
}

/* ═══════════════════════ A5 · Configuracions citades existents ═══════════════════════ */

/**
 * Camins de configuració construïts dins del tooling que han d'existir al disc.
 * Es limita a literals amb extensió de configuració per no perseguir prosa.
 */
const RE_CONFIG = /['"`]((?:\.[a-z-]+|[a-z_][a-z0-9_-]*)(?:\/[A-Za-z0-9_.-]+)*\.(?:json|txt|lock|yaml|yml))['"`]/g;
const SALTA_A5 = /node_modules|package\.json|tsconfig|\$\{|\.\.\//;

/** Artefactes que els builds generen: no han d'existir al repositori net. */
const GENERAT_A5 = /(^|\/)(dist|build|coverage|\.sdp-[a-z]+)\//;

/**
 * Lleva comentaris abans de buscar literals. Sense això, una porta que
 * DOCUMENTA una ruta trencada (com fa aquesta mateixa) s'autodenuncia.
 */
function senseComentaris(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n').map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1')).join('\n');
}

for (const abs of [...fitxers(CAMINS.portes), ...fitxers(CAMINS.cervell), ...fitxers('tooling/lib')]) {
  const r = rel(abs);
  const text = senseComentaris(llegeix(abs));

  // Primera passada: recollir tots els literals i saber quins resolen.
  const citats = [];
  const vistos = new Set();
  for (const m of text.matchAll(RE_CONFIG)) {
    const cami = m[1];
    if (vistos.has(cami) || SALTA_A5.test(cami) || GENERAT_A5.test(cami)) continue;
    vistos.add(cami);
    if (!cami.includes('/')) continue;
    if (/deute|baseline|lock|manifest|index|snapshot/i.test(path.basename(cami))) continue;
    citats.push({ cami, existix: fs.existsSync(R(cami)), base: path.basename(cami) });
  }

  // Una cadena de candidats («busca ací, si no ací») és legítima mentre almenys
  // un dels emplaçaments resolga. Sense aquesta regla, un fallback correcte
  // quedaria marcat com a ruta morta.
  const resolts = new Set(citats.filter((c) => c.existix).map((c) => c.base));

  for (const c of citats) {
    if (c.existix || resolts.has(c.base)) continue;
    const alternatives = [];
    (function busca(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (EXCLOSOS.has(e.name)) continue;
        const x = path.join(d, e.name);
        if (e.isDirectory()) busca(x);
        else if (e.name === c.base) alternatives.push(rel(x));
      }
    }(arrelSegura()));
    anota('A5', r, `cita ${c.cami}, que no existix`,
      alternatives.length ? `potser volies: ${alternatives.slice(0, 3).join(' | ')}` : 'crea el fitxer o lleva la referència');
  }
}

/* ═══════════════════════ Informe ═══════════════════════ */

const LLEIS = {
  A1: 'Monopoli del descobriment d\'arrel',
  A2: 'Scripts de package.json vius',
  A3: 'Punts d\'entrada del paquet reals',
  A4: 'Les portes arranquen de veres',
  A5: 'Configuracions citades existents',
};

function informe() {
  if (JSON_OUT) {
    console.log(JSON.stringify({ ok: infraccions.length === 0, arrel: arrelSegura(), infraccions }, null, 2));
    return infraccions.length ? 1 : 0;
  }

  console.log('\n🚜 TRACTOR D\'ARREL — la porta que vigila les portes');
  console.log(`   Arrel: ${arrelSegura()}`);
  console.log('─'.repeat(72));

  for (const [codi, nom] of Object.entries(LLEIS)) {
    const meues = infraccions.filter((i) => i.llei === codi);
    if (!meues.length) { console.log(`  ✅ ${codi} · ${nom}`); continue; }
    console.log(`  ❌ ${codi} · ${nom}  (${meues.length})`);
    const perFitxer = new Map();
    for (const i of meues) {
      if (!perFitxer.has(i.fitxer)) perFitxer.set(i.fitxer, []);
      perFitxer.get(i.fitxer).push(i);
    }
    for (const [f, llista] of [...perFitxer].sort()) {
      console.log(`       ${f}`);
      for (const i of llista.slice(0, 4)) {
        console.log(`         · ${i.detall}`);
        if (i.pista) console.log(`           ↳ ${i.pista}`);
      }
      if (llista.length > 4) console.log(`         · … i ${llista.length - 4} més`);
    }
  }

  console.log('─'.repeat(72));
  if (infraccions.length) {
    console.error(`\n❌ ${infraccions.length} infracció(ns). Una porta que no arranca és pitjor que cap porta:\n`
      + '   dona un ✅ que ningú s\'ha guanyat.\n');
    return 1;
  }
  console.log('\n✅ Cap ruta morta. Les portes arranquen i vigilen el que diuen.\n');
  return 0;
}

try {
  const d = diagnostic();
  if (d.error) { console.error(d.error.informe()); process.exit(2); }
  process.exit(informe());
} catch (err) {
  if (err instanceof ErrorArrel) { console.error(err.informe()); process.exit(2); }
  console.error(`\n❌ [TRACTOR-ARREL] Error inesperat: ${err.message}\n`);
  process.exit(2);
}
