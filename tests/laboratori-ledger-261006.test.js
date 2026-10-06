// @vitest-environment node
/** Corredor del laboratori 261006_0300_ledger_claude/t1_ledger (T1 del prompt 261006_0224).
 *
 *  El paquet viu a `02_investigacio_ia/261006_0300_ledger_claude/t1_ledger/nous/` amb
 *  la ruta real (fonts-vigilancia.mjs i les seues dues proves) i el LEDGER el separa
 *  prepara-pla.mjs en el moment de preparar el pla. L'aplicarà el Mestre amb
 *  executor-mutacio.mjs i una lease. Mentre no s'aplique, este corredor:
 *    · llig el LEDGER real i en fa còpies a os.tmpdir(): hi passa l'analitzador nou i
 *      el vell abans i després de la separació, en comprova la reversibilitat byte a
 *      byte i hi executa verify-ledger.mjs en procés fill (també les dues maneres de
 *      signar, sempre sobre còpies);
 *    · contrasta que prepara-pla.mjs no veu deriva i arma un pla que l'executor valida;
 *    · comprova que el paquet només canvia el que declara i que passa l'ESLint;
 *    · construïx dues còpies del repositori (base i paquet) i hi executa amb
 *      `node --test` la bateria que toca el LEDGER, fonts-vigilancia o mapa-consola:
 *      cap fallada nova fora de la deriva declarada, i totes les proves noves verdes.
 *  Fa skip si el laboratori no hi és, si l'executor ja ha deixat la transacció del
 *  paquet o si el codi ja és el de nous/ i les dues línies ja estan separades.
 *  Cap prova escriu al repositori; de 90_arxiu_historic no es copia res. El resum de
 *  xifres es deixa a os.tmpdir()/laboratori-ledger-261006.txt.
 *  No fa forense de git: l'única ordre de git és `git init` a les còpies. Treballa
 *  sobre el LEDGER del disc; l'historial de commits que cita el LLEGIU_PRIMER §4b
 *  no es reproduïx ací.
 */
import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261006_0300_ledger_claude/t1_ledger';
const LAB = path.join(REPO, REL_LAB);
const NOUS = path.join(LAB, 'nous');
const LEDGER = '.agents/LEDGER.md';
const sha = (valor) => createHash('sha256').update(valor).digest('hex');
const llig = (abs) => fs.readFileSync(abs, 'utf8');

const HI_HA_LAB = fs.existsSync(path.join(LAB, 'prepara-pla.mjs'));
const pla = HI_HA_LAB ? await import(pathToFileURL(path.join(LAB, 'prepara-pla.mjs')).href) : null;
const PAQUET = HI_HA_LAB ? pla.fitxersNous() : [];
const CODI_APLICAT = PAQUET.length > 0 && PAQUET.every((f) => fs.existsSync(path.join(REPO, f.ruta)) && llig(path.join(REPO, f.ruta)) === llig(path.join(NOUS, f.nou)));
const LEDGER_SEPARAT = HI_HA_LAB && pla.localitzaFusions(llig(path.join(REPO, LEDGER))).every((l) => l.estat === 'separada');
const TRANSACCIO = HI_HA_LAB ? pla.transaccio(REPO) : null;
const ACTIU = HI_HA_LAB && !TRANSACCIO && !(CODI_APLICAT && LEDGER_SEPARAT);

/** Resum de xifres per al LLEGIU_PRIMER: només es reescriu quan el corredor corre. */
const INFORME = path.join(os.tmpdir(), 'laboratori-ledger-261006.txt');
if (ACTIU) fs.writeFileSync(INFORME, '');
const nota = (text) => fs.appendFileSync(INFORME, `${text}\n`);

/** Els deu peus intercalats que l'auditoria Opus 261006_0025 §8.2 va comptar (prefix del hash). */
const PEUS_DE_LAUDITORIA = ['35a60965', '7c14407c', '948637b6', 'e235d645', 'bd911930', '47c0ce06', '0a2f3a6e', '24c17af2', '7f425b06', '68ba24ea'];
const marques = (text) => [...text.matchAll(/<!-- HASH: ([a-f0-9]{64}) -->/g)].map((m) => m[1]);

const tmp = (prefix) => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
function arrelAmbLedger(text) {
  const dir = tmp('lab-ledger-261006-');
  fs.mkdirSync(path.join(dir, '.agents'), { recursive: true });
  fs.writeFileSync(path.join(dir, LEDGER), text);
  return dir;
}
const netEnv = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(?:VITEST|SDP_ARREL$|CLAUDE_PROJECT_DIR$|NODE_OPTIONS$|NODE_ENV$|TEST$|NODE_TEST_CONTEXT$)/.test(k)));
/** verify-ledger.mjs real, en procés fill, sobre la còpia de `dir` (llig process.cwd()/.agents/LEDGER.md). */
const verifica = (dir, ...args) => spawnSync(process.execPath, [path.join(REPO, 'tooling/verify-ledger.mjs'), ...args], { cwd: dir, env: netEnv(), encoding: 'utf8' });

/* ══════════════════════ Bateria en dues còpies del repositori ══════════════════════ */

const WIKI = ['00_index.md', '01_ser', '02_saber', '03_actuar', '10_actes'];
const ARREL_SOLTS = ['AGENTS.md', 'CLAUDE.md', 'package.json', 'eslint.config.js', '.gitignore'];
const INVESTIGACIO = '_wiki_de_poble/04_escriptori/02_investigacio_ia';
const ESCRIPTORI = '_wiki_de_poble/04_escriptori';
const RUNTIME = path.join(REPO, '.agents', 'runtime');

/**
 * Còpia del repositori: tooling/, tests/, scripts/, .agents/ amb els torns però sense
 * la resta del runtime, .claude, .codex, .husky, la part viva de la Wiki, els
 * documents solts de l'Escriptori i les carpetes de laboratori (mai l'arxiu ni
 * 01_produccio), src i node_modules enllaçats i un git propi. Amb el paquet, els
 * fitxers de nous/ superposats i el LEDGER separat com el deixaria l'executor.
 */
function construeix(prefix, ambPaquet) {
  const dir = tmp(prefix);
  const fora = (src) => {
    if (/[\\/](?:node_modules|\.DS_Store|\.git)$/.test(src)) return false;
    if (src === RUNTIME || src.startsWith(path.join(RUNTIME, 'turns'))) return true;
    return !src.startsWith(RUNTIME + path.sep);
  };
  const copia = (rel) => {
    if (!fs.existsSync(path.join(REPO, rel))) return;
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.cpSync(path.join(REPO, rel), path.join(dir, rel), { recursive: true, filter: fora, verbatimSymlinks: true });
  };
  for (const rel of ['tooling', 'tests', 'scripts', '.agents', '.claude', '.codex', '.husky', ...ARREL_SOLTS]) copia(rel);
  for (const rel of WIKI) copia(`_wiki_de_poble/${rel}`);
  for (const e of fs.readdirSync(path.join(REPO, ESCRIPTORI), { withFileTypes: true })) if (e.isFile()) copia(`${ESCRIPTORI}/${e.name}`);
  for (const e of fs.readdirSync(path.join(REPO, INVESTIGACIO), { withFileTypes: true })) {
    if (e.isDirectory() && e.name !== '261006_0300_ledger_claude') copia(`${INVESTIGACIO}/${e.name}`);
  }
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  fs.symlinkSync(path.join(REPO, 'src'), path.join(dir, 'src'), 'dir');
  execFileSync('git', ['init', '-q'], { cwd: dir });
  if (ambPaquet) {
    for (const f of PAQUET) {
      fs.mkdirSync(path.dirname(path.join(dir, f.ruta)), { recursive: true });
      fs.copyFileSync(path.join(NOUS, f.nou), path.join(dir, f.ruta));
    }
    fs.writeFileSync(path.join(dir, LEDGER), pla.separa(llig(path.join(dir, LEDGER))).nou);
  }
  return dir;
}

/** Bateria: tot el que nomena el LEDGER, fonts-vigilancia o mapa-consola, més els corredors que hi depenen. */
function bateria() {
  const fixes = ['fonts-vigilancia', 'mapa-consola', 'governanca-260930-mapa', 'governanca-260930-lease', 'governanca-260930b-torns'].map((n) => `tests/${n}.test.mjs`);
  const trobades = fs.readdirSync(path.join(REPO, 'tests')).filter((n) => n.endsWith('.test.mjs'))
    .filter((n) => /fonts-vigilancia|mapa-consola|LEDGER|verify-ledger/.test(llig(path.join(REPO, 'tests', n)))).map((n) => `tests/${n}`);
  return [...new Set([...fixes, ...trobades])].filter((f) => fs.existsSync(path.join(REPO, f))).sort();
}

/** Resultats TAP per prova: clau «pare › fill» i estat pass, fail, skip o todo. */
function llegeixTap(text, arrel) {
  const resultats = new Map();
  const vistos = new Map();
  const pila = [];
  for (const linia of text.split('\n')) {
    const sub = /^( *)# Subtest: (.*)$/.exec(linia);
    if (sub) { pila.length = Math.floor(sub[1].length / 4); pila.push(sub[2]); continue; }
    const m = /^( *)(not ok|ok) \d+ - (.*)$/.exec(linia);
    if (!m) continue;
    let nom = m[3];
    let estat = m[2] === 'ok' ? 'pass' : 'fail';
    const directiva = / # (SKIP|TODO)\b.*$/.exec(nom);
    if (directiva) { nom = nom.slice(0, directiva.index); estat = directiva[1] === 'SKIP' ? 'skip' : 'todo'; }
    const clau = [...pila.slice(0, Math.floor(m[1].length / 4)), nom].join(' › ').split(arrel).join('<arrel>');
    const n = (vistos.get(clau) ?? 0) + 1;
    vistos.set(clau, n);
    resultats.set(n > 1 ? `${clau} #${n}` : clau, estat);
  }
  return resultats;
}

function corre(arrel, fitxer) {
  return new Promise((resolve) => {
    const fill = spawn(process.execPath, ['--test', '--test-reporter=tap', fitxer], { cwd: arrel, env: netEnv(), stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    fill.stdout.on('data', (tros) => { out += tros; });
    fill.stderr.on('data', (tros) => { err += tros; });
    const rellotge = setTimeout(() => fill.kill('SIGKILL'), 5 * 60 * 1000);
    fill.on('close', (codi) => { clearTimeout(rellotge); resolve({ fitxer, codi, resultats: llegeixTap(out, arrel), err, out }); });
  });
}

async function enPiscina(tasques, limit) {
  const eixida = new Array(tasques.length);
  let seguent = 0;
  const treballador = async () => {
    while (seguent < tasques.length) {
      const i = seguent++;
      eixida[i] = await tasques[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasques.length) }, treballador));
  return eixida;
}

const compte = (execucions) => {
  const c = { pass: 0, fail: 0, skip: 0, todo: 0 };
  for (const e of execucions) for (const estat of e.resultats.values()) c[estat] += 1;
  return c;
};

/** Regressió: el que passava ja no passa, o el que no fallava (skip, todo) ara falla. */
const regressa = (base, paquet) => (base === 'pass' && paquet !== 'pass') || (base !== 'fail' && paquet === 'fail');

/**
 * Deriva declarada. Les proves dels corredors del laboratori 260930_0040 (paquet ja
 * aplicat i mai retirat) fan skip NOMÉS mentre tooling/brain/fonts-vigilancia.mjs
 * siga byte a byte el del laboratori (governanca-260930-mapa.test.mjs:24-27 i
 * governanca-260930-lease.test.mjs:21-25). Qualsevol canvi al fitxer les desperta
 * i, com que contrasten bases del 260930, cauen. Els dos fitxers són de la suite
 * laboratory (tooling/tests/node-suite-manifest.json:221 i :226), fora de test:ci
 * (run-node-tests.mjs:76-77). És una excepció a «cap fallada nova» i només val amb
 * l'acceptació explícita del Mestre (LLEGIU_PRIMER §5). Es toleren només estos noms
 * exactes, i només de skip a fail.
 */
const DERIVA_DECLARADA = Object.freeze({
  'tests/governanca-260930-mapa.test.mjs': [
    'operacions: forma, sha de partida i fitxers nous presents',
    'fitxers nous: sintaxi vàlida, cap import relatiu on no toca i la closca conserva la seua API',
  ],
  'tests/governanca-260930-lease.test.mjs': [
    'el pla es construïx sencer, sense rutes repetides, i el valida l’executor',
    'el relleu porta el torn a ESTAT i LEDGER, i el LEDGER queda ben signat',
    'la Petorreta i el manifest passarien el seal del Reflex',
  ],
});

/** Primera línia d'error del bloc TAP d'una prova caiguda (per al resum). */
function motiu(eixida, nom) {
  const linies = eixida.split('\n');
  const i = linies.findIndex((l) => /not ok \d+ - /.test(l) && l.includes(nom));
  if (i === -1) return '';
  const error = linies.slice(i + 1, i + 40).find((l) => /^\s*error: /.test(l));
  return error ? error.trim().slice(0, 220) : '';
}

function compara(f, b, p, ambProvesNoves) {
  const out = { regressions: [], declarades: [], noves: [] };
  for (const [clau, estat] of b) {
    if (!regressa(estat, p.get(clau))) continue;
    (estat === 'skip' && DERIVA_DECLARADA[f]?.includes(clau) ? out.declarades : out.regressions).push(`${f} :: ${clau} (${estat}) → ${p.get(clau) ?? 'absent'}`);
  }
  for (const [clau, estat] of p) {
    if (b.has(clau)) continue;
    if (ambProvesNoves.has(f)) out.noves.push(`${estat} · ${f} :: ${clau}`);
    else if (estat === 'fail') out.regressions.push(`${f} :: ${clau} → fail (nova al paquet)`);
  }
  return out;
}

/** El Mapa de la Consola d'una còpia, compilat sobre una arrel que només té un LEDGER. */
function mesuraMapa(copia, fitxers) {
  const runner = path.join(copia, 'mesura-ledger-261006.mjs');
  fs.writeFileSync(runner, [
    "import fs from 'node:fs';",
    "import os from 'node:os';",
    "import path from 'node:path';",
    "import { recullMapa } from './tooling/brain/mapa-consola.mjs';",
    'const out = {};',
    'for (const [nom, fitxer] of JSON.parse(process.argv[2])) {',
    "  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-ledger-mapa-'));",
    "  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-ledger-home-'));",
    "  fs.mkdirSync(path.join(arrel, '.agents'), { recursive: true });",
    "  fs.copyFileSync(fitxer, path.join(arrel, '.agents/LEDGER.md'));",
    "  const mapa = recullMapa(arrel, { home, plataforma: 'linux' });",
    '  const m = (n) => mapa.salut.find((x) => x.metrica === n)?.valor;',
    "  out[nom] = { fossils: m('ledger-fossils'), malformades: m('ledger-mal-formades'), integritat: m('integritat-ledger'), avis: mapa.avisos.find((a) => a.codi === 'ledger-invalid')?.evidencia ?? null, mapa };",
    '  fs.rmSync(arrel, { recursive: true, force: true });',
    '  fs.rmSync(home, { recursive: true, force: true });',
    '}',
    'console.log(JSON.stringify(out));', ''
  ].join('\n'));
  const r = spawnSync(process.execPath, [runner, JSON.stringify(fitxers)], { cwd: copia, env: netEnv(), encoding: 'utf8', timeout: 120000 });
  if (r.status !== 0) throw new Error(r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

describe.skipIf(!ACTIU)('laboratori 261006_0300_ledger_claude/t1_ledger', () => {
  test('el LEDGER real, en còpia temporal: els peus intercalats són història i, després de separar, cap anomalia', async () => {
    const nou = await import(pathToFileURL(path.join(NOUS, 'tooling/brain/fonts-vigilancia.mjs')).href);
    const vell = await import(pathToFileURL(path.join(REPO, 'tooling/brain/fonts-vigilancia.mjs')).href);
    const original = llig(path.join(REPO, LEDGER));
    const { nou: separat, insercions, llocs } = pla.separa(original);
    const [abans, despres] = [arrelAmbLedger(original), arrelAmbLedger(separat)];
    try {
      const a = nou.resumLedger(abans);
      const d = nou.resumLedger(despres);
      const av = vell.resumLedger(abans);
      const dv = vell.resumLedger(despres);
      // Cap peu esborrat, ni mogut d'ordre; els deu de l'auditoria hi són tots.
      expect(marques(separat)).toEqual(marques(original));
      for (const p of PEUS_DE_LAUDITORIA) expect(marques(original).some((h) => h.startsWith(p)), p).toBe(true);
      // Abans de separar: tots els intercalats són peus històrics i cap compta com a anomalia.
      expect(a.peusHistorics).toBe(marques(original).length - 1);
      expect(a.peusHistorics).toBeGreaterThanOrEqual(PEUS_DE_LAUDITORIA.length);
      expect(a.fossils).toBe(0);
      expect(a.malformades).toBe(llocs.filter((l) => l.estat === 'enganxada').length);
      expect(av.fossils, 'l’analitzador d’ara els compta tots com a fòssils').toBe(a.peusHistorics);
      expect(av.malformades).toBe(a.malformades);
      expect(a.entrades).toEqual(av.entrades);
      // Després de separar: els mateixos peus històrics, zero fòssils i zero línies mal formades.
      expect([d.peusHistorics, d.fossils, d.malformades]).toEqual([a.peusHistorics, 0, 0]);
      expect(dv.malformades).toBe(0);
      expect(d.entrades).toEqual(a.entrades);
      // Reversibilitat byte a byte, comprovada sense les funcions del paquet.
      expect(insercions).toHaveLength(2);
      let recompost = '';
      let des = 0;
      insercions.map((p, k) => p + k).forEach((s) => {
        expect(separat[s]).toBe('\n');
        recompost += separat.slice(des, s);
        des = s + 1;
      });
      recompost += separat.slice(des);
      expect(Buffer.from(recompost, 'utf8').equals(fs.readFileSync(path.join(REPO, LEDGER)))).toBe(true);
      expect(Buffer.byteLength(separat)).toBe(Buffer.byteLength(original) + 2);
      expect(pla.reversible(original, separat, insercions)).toBe(true);
      nota(`LEDGER real: ${Buffer.byteLength(original)} bytes, ${original.split('\n').length} línies, ${marques(original).length} marques HASH.`);
      nota(`  analitzador d'ara   · abans: fossils ${av.fossils}, malformades ${av.malformades} · després: fossils ${dv.fossils}, malformades ${dv.malformades}`);
      nota(`  analitzador del paquet · abans: peusHistorics ${a.peusHistorics}, fossils ${a.fossils}, malformades ${a.malformades} · després: peusHistorics ${d.peusHistorics}, fossils ${d.fossils}, malformades ${d.malformades}`);
      nota(`  fusions: ${llocs.map((l) => `${l.id} (línia ${l.linia}, ${l.estat})`).join('; ')}`);
      nota(`  entrades canòniques: ${a.entrades.length} abans i ${d.entrades.length} després`);
    } finally {
      fs.rmSync(abans, { recursive: true, force: true });
      fs.rmSync(despres, { recursive: true, force: true });
    }
  }, 60000);

  test('verify-ledger.mjs en procés fill sobre còpies: la signatura d’ara, la del split i les dues maneres de signar', () => {
    const original = llig(path.join(REPO, LEDGER));
    const separat = pla.separa(original).nou;
    const peuFinal = marques(original).at(-1);
    const dirs = [];
    const nova = (text) => { const d = arrelAmbLedger(text); dirs.push(d); return d; };
    try {
      const ara = verifica(nova(original));
      expect(ara.status).toBe(pla.signatura(original).valid ? 0 : 1);
      const explicacio = pla.explicaTrencament(original);
      nota(`verify-ledger sobre el LEDGER d'ara: exit ${ara.status} · peu final ${peuFinal.slice(0, 8)} · ${pla.signatura(original).valid ? 'vàlid' : `trencat; l'explica la línia ${explicacio.join(', ') || 'cap'}`}`);

      // LLEGIU §4: cap dels deu peus de l'auditoria segella ja el text que té davant,
      // amb «\n\n», amb «\n» o sense separador. Les línies d'abans no s'esborren
      // (immutabilitat), per tant un peu que hui no segella el seu prefix no ho farà mai.
      const segellaPrefix = (hash) => {
        const prefix = original.slice(0, original.indexOf(`<!-- HASH: ${hash} -->`));
        return [prefix, prefix.replace(/\n$/, ''), prefix.replace(/\n\n$/, '')].some((p) => sha(p) === hash);
      };
      const intercalats = PEUS_DE_LAUDITORIA.map((p) => marques(original).slice(0, -1).find((h) => h.startsWith(p)));
      expect(intercalats.every(Boolean)).toBe(true);
      const segellen = intercalats.filter(segellaPrefix).map((h) => h.slice(0, 8));
      expect(segellen, 'peus intercalats que encara segellen el seu prefix').toEqual([]);
      nota(`  peus de l'auditoria que encara segellen el seu prefix («\\n\\n», «\\n» o res): ${segellen.length ? segellen.join(', ') : 'cap'} de ${intercalats.length}.`);

      const despres = verifica(nova(separat));
      expect(despres.status).toBe(1);
      const cos = separat.slice(0, separat.lastIndexOf('\n\n<!-- HASH: '));
      expect(`${despres.stdout}${despres.stderr}`).toContain(sha(cos));
      nota(`verify-ledger després del split: exit ${despres.status} · hash esperat ${sha(cos).slice(0, 8)} (el peu ${peuFinal.slice(0, 8)} ja no casa)`);

      // (i) --sign directe: el peu final d'ara es REEMPLAÇA (verify-ledger.mjs:28 i :37).
      const directe = nova(separat);
      expect(verifica(directe, '--sign').status).toBe(0);
      expect(verifica(directe).status).toBe(0);
      const signatDirecte = llig(path.join(directe, LEDGER));
      expect(marques(signatDirecte)).not.toContain(peuFinal);
      expect(marques(signatDirecte)).toHaveLength(marques(original).length);
      nota(`  (i) --sign directe: exit 0; el peu ${peuFinal.slice(0, 8)} DESAPAREIX (reemplaçat per ${marques(signatDirecte).at(-1).slice(0, 8)}).`);

      // (ii) primer una entrada al FINAL i després --sign: el peu d'ara queda com a peu històric.
      const ambEntrada = nova(`${separat}\n\n261006 | prova | laboratori | entrada de relleu afegida al final abans de signar`);
      expect(verifica(ambEntrada, '--sign').status).toBe(0);
      expect(verifica(ambEntrada).status).toBe(0);
      const signatAmbEntrada = llig(path.join(ambEntrada, LEDGER));
      expect(marques(signatAmbEntrada)).toContain(peuFinal);
      expect(marques(signatAmbEntrada)).toHaveLength(marques(original).length + 1);
      expect(signatAmbEntrada.startsWith(separat)).toBe(true);
      nota(`  (ii) entrada al final i --sign: exit 0; ${peuFinal.slice(0, 8)} es conserva com a peu històric; ${marques(signatAmbEntrada).length} marques.`);
    } finally {
      for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
    }
  }, 60000);

  test('l’analitzador nou sobre les dues maneres de signar: tot vàlid i zero anomalies; (i) el peu final d’ara no torna, (ii) es conserva com a peu històric', async () => {
    const nou = await import(pathToFileURL(path.join(NOUS, 'tooling/brain/fonts-vigilancia.mjs')).href);
    const original = llig(path.join(REPO, LEDGER));
    const separat = pla.separa(original).nou;
    const peuFinal = marques(original).at(-1);
    const directe = arrelAmbLedger(separat);
    const ambEntrada = arrelAmbLedger(`${separat}\n\n261006 | prova | laboratori | entrada al final`);
    try {
      // (i) --sign directe: el peu final d'ara es reemplaça i no queda ni com a peu històric.
      expect(verifica(directe, '--sign').status).toBe(0);
      const i = nou.resumLedger(directe);
      expect([i.valid, i.fossils, i.malformades]).toEqual([true, 0, 0]);
      expect(i.peusHistorics).toBe(marques(original).length - 1);
      expect(marques(llig(path.join(directe, LEDGER)))).not.toContain(peuFinal);
      nota(`  (i) analitzador nou: valid ${i.valid}, fossils ${i.fossils}, malformades ${i.malformades}, peusHistorics ${i.peusHistorics}; ${peuFinal.slice(0, 8)} absent.`);

      // (ii) entrada al FINAL i després --sign: el peu final d'ara passa a ser un peu històric més.
      expect(verifica(ambEntrada, '--sign').status).toBe(0);
      const ii = nou.resumLedger(ambEntrada);
      expect([ii.valid, ii.fossils, ii.malformades]).toEqual([true, 0, 0]);
      expect(ii.peusHistorics).toBe(marques(original).length);
      expect(marques(llig(path.join(ambEntrada, LEDGER)))).toContain(peuFinal);
      nota(`  (ii) analitzador nou: valid ${ii.valid}, fossils ${ii.fossils}, malformades ${ii.malformades}, peusHistorics ${ii.peusHistorics}; ${peuFinal.slice(0, 8)} present.`);
    } finally {
      fs.rmSync(directe, { recursive: true, force: true });
      fs.rmSync(ambEntrada, { recursive: true, force: true });
    }
  }, 60000);

  test('prepara-pla.mjs: cap deriva sobre el disc d’ara, el pla el valida l’executor i el LEDGER entra amb els bytes del disc', async () => {
    const estat = pla.estat(REPO);
    expect(estat.filter((f) => f.estat === 'deriva').map((f) => `${f.ruta}: ${f.motiu}`)).toEqual([]);
    expect(Object.keys(pla.BASES).sort()).toEqual(PAQUET.map((f) => f.ruta).sort());
    const { plan, targets, ledger, scopes } = await pla.preparaPla(REPO);
    expect(plan.schema).toBe('sdp.mutation.v1');
    expect(plan.operationId.startsWith(pla.OPERACIO)).toBe(true);
    const disc = fs.readFileSync(path.join(REPO, LEDGER));
    for (const f of plan.files) {
      if (f.path === LEDGER) {
        expect(f.before).toBe(sha(disc));
        expect(f.content).toBe(pla.separa(disc.toString('utf8')).nou);
      } else {
        expect(f.before).toBe(pla.BASES[f.path]);
        expect(f.content).toBe(llig(path.join(NOUS, f.path)));
      }
    }
    const esperats = [...PAQUET.filter((f) => !CODI_APLICAT || llig(path.join(REPO, f.ruta)) !== llig(path.join(NOUS, f.nou))).map((f) => f.ruta), ...(LEDGER_SEPARAT ? [] : [LEDGER])].sort();
    expect(targets).toEqual(esperats);
    for (const s of scopes) expect(fs.existsSync(path.join(REPO, s)), s).toBe(true);
    nota(`prepara-pla: ${targets.length} fitxers al pla (${targets.join(', ')}); before del LEDGER ${sha(disc).slice(0, 12)}.`);
    for (const l of pla.liniesLedger(ledger)) nota(l);

    // Deriva del codi: un original diferent del fixat no entra mai al pla.
    const falsa = Object.fromEntries(Object.keys(pla.BASES).map((k) => [k, '0'.repeat(64)]));
    expect(pla.estat(REPO, { bases: falsa }).every((f) => f.estat === 'deriva')).toBe(true);
    // Deriva del LEDGER: una fusió absent o repetida atura el pla; una de ja separada es deixa estar.
    const text = disc.toString('utf8');
    const [f1, f2] = pla.FUSIONS;
    expect(() => pla.separa(text.replace(f1.abans + f1.despres, `${f1.abans} ${f1.despres}`))).toThrow(/LEDGER/);
    expect(() => pla.separa(`${text}\n${f2.abans}${f2.despres}`)).toThrow(/LEDGER/);
    const separat = pla.separa(text).nou;
    const repetit = pla.separa(separat);
    expect(repetit.insercions).toEqual([]);
    expect(repetit.nou).toBe(separat);
    expect(repetit.llocs.map((l) => l.estat)).toEqual(['separada', 'separada']);
    const mig = pla.separa(text.replace(f1.abans + f1.despres, `${f1.abans}\n${f1.despres}`));
    expect(mig.insercions).toHaveLength(1);
    // La Petorreta i el manifest passarien el seal.
    const { validatePetorreta } = await import(pathToFileURL(path.join(REPO, 'tooling/wiki/reflex_petorreta.mjs')).href);
    const petorreta = pla.construeixPetorreta({ sessio: pla.SESSIO_ZERO, intentSha256: '0'.repeat(64), rulesSha256: '0'.repeat(64), planSha256: sha(JSON.stringify(plan)), targets });
    expect(validatePetorreta(`/tmp/${pla.NOM_PETORRETA}`, petorreta)).toEqual([]);
    expect([...pla.sensibles(petorreta), ...pla.sensibles(pla.manifest()), ...(fs.existsSync(path.join(REPO, pla.LLEGIU)) ? pla.sensibles(llig(path.join(REPO, pla.LLEGIU))) : [])]).toEqual([]);
  }, 120000);

  test('el paquet només canvia el que declara: tres fitxers, mapa-consola.mjs intacte i cap import ni exportació nova', () => {
    expect(PAQUET.map((f) => f.ruta).sort()).toEqual(['tests/fonts-vigilancia.test.mjs', 'tests/mapa-consola.test.mjs', 'tooling/brain/fonts-vigilancia.mjs']);
    /** Línies de l'original que no apareixen, en ordre, a la versió nova. */
    const perdudes = (vell, nou) => {
      const b = nou.split('\n');
      let j = 0;
      const out = [];
      for (const l of vell.split('\n')) {
        let k = j;
        while (k < b.length && b[k] !== l) k += 1;
        if (k === b.length) out.push(l.trim());
        else j = k + 1;
      }
      return out;
    };
    const de = (r) => [llig(path.join(REPO, r)), llig(path.join(NOUS, r))];
    expect(perdudes(...de('tests/fonts-vigilancia.test.mjs'))).toEqual([
      'fossils: 1,',
      "assert.deepEqual(analitzaLedger(''), { valid: false, entrades: [], fossils: 0, malformades: 0 });",
    ]);
    expect(perdudes(...de('tests/mapa-consola.test.mjs'))).toEqual([
      "assert.deepEqual(claus(ledger), ['entrades', 'fossils', 'malformades', 'valid']);",
      'assert.ok(Number.isInteger(ledger.fossils) && Number.isInteger(ledger.malformades));',
    ]);
    // fonts-vigilancia: només el contracte del LEDGER, el comentari de `fossils` i el cos d'analitzaLedger.
    const [vell, nou] = de('tooling/brain/fonts-vigilancia.mjs');
    const zona = (text) => text.slice(text.indexOf('function entradaCanonica'), text.indexOf('/** Resum de `.agents/LEDGER.md`'));
    const fora = (text) => text.replace(zona(text), '<ZONA>').replace(/^ \* {3}ledger {5}null \|.*$/m, '<CONTRACTE>');
    expect(fora(nou)).toBe(fora(vell));
    expect(perdudes(vell, nou).every((l) => zona(vell).includes(l) || /^\* {3}ledger {5}null \|/.test(l))).toBe(true);
    const importacions = (codi) => [...codi.matchAll(/^\s*import\s[^'"]*?['"]([^'"]+)['"]/gm)].map((m) => m[1]);
    const exportacions = (codi) => [...codi.matchAll(/^export\s+(?:async\s+)?(?:function|const)\s+(\w+)/gm)].map((m) => m[1]).sort();
    expect(importacions(nou)).toEqual(importacions(vell));
    expect(exportacions(nou)).toEqual(exportacions(vell));
    expect(fs.existsSync(path.join(NOUS, 'tooling/brain/mapa-consola.mjs'))).toBe(false);
  });

  test('el codi del paquet, el generador del pla i este corredor passen l’ESLint del repositori sense cap missatge', async () => {
    const { ESLint } = await import('eslint');
    const eslint = new ESLint({ cwd: REPO });
    const fitxers = [
      ...PAQUET.map((f) => ({ abs: path.join(NOUS, f.nou), rel: f.ruta })),
      { abs: path.join(LAB, 'prepara-pla.mjs'), rel: `${REL_LAB}/prepara-pla.mjs` },
      { abs: fileURLToPath(import.meta.url), rel: 'tests/laboratori-ledger-261006.test.js' },
    ];
    const missatges = [];
    for (const { abs, rel } of fitxers) {
      const [r] = await eslint.lintText(llig(abs), { filePath: path.join(REPO, rel) });
      missatges.push(...r.messages.map((m) => `${rel}:${m.line} ${m.ruleId} ${m.message}`));
    }
    expect(missatges).toEqual([]);
  }, 120000);

  test('bateria en dues còpies del repositori: cap fallada nova fora de la deriva declarada, proves noves verdes i el Mapa sense fòssils', async () => {
    const fitxers = bateria();
    const base = construeix('sdp-ledger-261006-base-', false);
    const paquet = construeix('sdp-ledger-261006-paquet-', true);
    const ledgers = tmp('sdp-ledger-261006-ledgers-');
    try {
      // El Mapa de la Consola, amb la closca de cada còpia, sobre el LEDGER d'ara i el separat.
      const original = llig(path.join(REPO, LEDGER));
      fs.writeFileSync(path.join(ledgers, 'abans.md'), original);
      fs.writeFileSync(path.join(ledgers, 'despres.md'), pla.separa(original).nou);
      const parells = [['abans', path.join(ledgers, 'abans.md')], ['despres', path.join(ledgers, 'despres.md')]];
      const mapaBase = mesuraMapa(base, parells);
      const mapaPaquet = mesuraMapa(paquet, parells);
      nota(`Mapa (codi d'ara)     · abans: ledger-fossils ${mapaBase.abans.fossils}, ledger-mal-formades ${mapaBase.abans.malformades} · després: ${mapaBase.despres.fossils}, ${mapaBase.despres.malformades}`);
      nota(`Mapa (codi del paquet) · abans: ledger-fossils ${mapaPaquet.abans.fossils}, ledger-mal-formades ${mapaPaquet.abans.malformades} · després: ${mapaPaquet.despres.fossils}, ${mapaPaquet.despres.malformades}`);
      nota(`  avís ledger-invalid amb el paquet, després del split: ${mapaPaquet.despres.avis}`);
      expect([mapaPaquet.abans.fossils, mapaPaquet.despres.fossils, mapaPaquet.despres.malformades]).toEqual([0, 0, 0]);
      expect(mapaBase.abans.fossils).toBeGreaterThanOrEqual(PEUS_DE_LAUDITORIA.length);
      // La targeta «Línies del LEDGER» de la Consola amb cada Mapa: mateixa forma, només canvia el número.
      const { xifraDelMas } = await import('../src/sections/consola/xifresMas.js');
      const targeta = (mapa) => {
        const x = xifraDelMas('linies-ledger', mapa);
        return x ? `${x.titol} · ${x.subtitol}` : 'sense targeta';
      };
      const targetes = {
        base: targeta(mapaBase.abans.mapa),
        paquetAbans: targeta(mapaPaquet.abans.mapa),
        paquetDespres: targeta(mapaPaquet.despres.mapa),
      };
      nota(`Targeta «Línies del LEDGER» · codi d'ara: «${targetes.base}» · paquet abans del split: «${targetes.paquetAbans}» · paquet després: «${targetes.paquetDespres}»`);
      const forma = (x) => Object.keys(x ?? {}).sort().join(',');
      expect(forma(xifraDelMas('linies-ledger', mapaPaquet.despres.mapa))).toBe(forma(xifraDelMas('linies-ledger', mapaBase.abans.mapa)));

      const tasques = fitxers.flatMap((f) => [() => corre(base, f), () => corre(paquet, f)]);
      const eixides = await enPiscina(tasques, 3);
      const deBase = new Map(eixides.filter((_, i) => i % 2 === 0).map((e) => [e.fitxer, e]));
      const delPaquet = new Map(eixides.filter((_, i) => i % 2 === 1).map((e) => [e.fitxer, e]));
      const ambProvesNoves = new Set(PAQUET.map((f) => f.ruta));
      const dubtosos = (f) => {
        const c = compara(f, deBase.get(f).resultats, delPaquet.get(f).resultats, ambProvesNoves);
        return c.regressions.length > 0 || c.noves.some((n) => !n.startsWith('pass'));
      };
      // Una caiguda del paquet es repetix una sola vegada, en sèrie: un timeout per càrrega no és una regressió.
      const repetits = fitxers.filter(dubtosos);
      for (const f of repetits) delPaquet.set(f, await corre(paquet, f));
      const regressions = [];
      const declarades = [];
      const noves = [];
      for (const f of fitxers) {
        const c = compara(f, deBase.get(f).resultats, delPaquet.get(f).resultats, ambProvesNoves);
        regressions.push(...c.regressions);
        declarades.push(...c.declarades);
        noves.push(...c.noves);
      }
      const cb = compte([...deBase.values()]);
      const cp = compte([...delPaquet.values()]);
      const resum = `Bateria de ${fitxers.length} fitxers. Base: ${cb.pass} pass · ${cb.fail} fail · ${cb.skip} skip. Paquet: ${cp.pass} pass · ${cp.fail} fail · ${cp.skip} skip. Proves noves: ${noves.length}. Deriva declarada: ${declarades.length}. Repetits en sèrie: ${repetits.length ? repetits.join(', ') : 'cap'}.`;
      nota(resum);
      for (const f of fitxers) {
        const [b, p] = [compte([deBase.get(f)]), compte([delPaquet.get(f)])];
        nota(`  ${f}: base ${b.pass}/${b.fail}/${b.skip} · paquet ${p.pass}/${p.fail}/${p.skip} (pass/fail/skip)`);
      }
      for (const n of noves) nota(`  nova: ${n}`);
      for (const [f, noms] of Object.entries(DERIVA_DECLARADA)) {
        for (const nom of noms) if (declarades.some((d) => d.startsWith(`${f} :: ${nom} `))) nota(`  deriva declarada: ${f} :: ${nom} · ${motiu(delPaquet.get(f).out, nom)}`);
      }
      for (const r of regressions) nota(`  REGRESSIÓ: ${r}`);
      expect(fitxers.every((f) => deBase.get(f).resultats.size > 0), 'cada fitxer ha de produir resultats a la base').toBe(true);
      expect(regressions, resum).toEqual([]);
      expect(noves.filter((n) => !n.startsWith('pass')), resum).toEqual([]);
      expect(noves.length, resum).toBeGreaterThan(0);
    } finally {
      for (const d of [base, paquet, ledgers]) fs.rmSync(d, { recursive: true, force: true });
    }
  }, 20 * 60 * 1000);
});
