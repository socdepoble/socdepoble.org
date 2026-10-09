// @vitest-environment node
/** Corredor del laboratori 261006_0055_olivera_ancores_opus (porta Olivera, àncores).
 *
 *  El paquet viu a `02_investigacio_ia/261006_0055_olivera_ancores_opus/nous/` amb
 *  la ruta real i l'aplicarà el Mestre amb executor-mutacio.mjs i una lease. Mentre
 *  no s'aplique, este corredor construïx dues còpies del repositori a os.tmpdir():
 *  la base (HEAD tal com és) i la del paquet (els fitxers de nous/ superposats), hi
 *  executa amb `node --test` la bateria que depén de la porta o de draft-write i
 *  exigix que no hi haja cap fallada nova respecte de la base (el que passava ha de
 *  passar i el que feia skip o todo no pot fallar) i que totes les proves noves del
 *  paquet passen. També passa l'ESLint del repositori pel codi nou i contrasta que
 *  prepara-pla.mjs no veu deriva.
 *
 *  Fa skip si el laboratori no hi és o si els fitxers instal·lats ja són els de
 *  nous/: llavors manen les proves reals i este corredor s'ha de retirar. També
 *  si l'executor n'ha deixat la transacció (Onada 7).
 *  Cap prova escriu al repositori; de 90_arxiu_historic no es copia res.
 */
import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261006_0055_olivera_ancores_opus';
const LAB = path.join(REPO, REL_LAB);
const NOUS = path.join(LAB, 'nous');
const sha = (valor) => createHash('sha256').update(valor).digest('hex');
const llig = (abs) => fs.readFileSync(abs, 'utf8');

/** Fitxers d'un directori, recursiu, amb camí relatiu posix. El `.DS_Store` del Finder no compta. */
function fitxersDe(dir, rel = '') {
  if (!fs.existsSync(path.join(dir, rel))) return [];
  return fs.readdirSync(path.join(dir, rel), { withFileTypes: true })
    .filter((e) => e.name !== '.DS_Store')
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .flatMap((e) => {
      const r = rel ? `${rel}/${e.name}` : e.name;
      return e.isDirectory() ? fitxersDe(dir, r) : [r];
    });
}

const PAQUET = fitxersDe(NOUS).map((nou) => ({ nou, ruta: nou.endsWith('.md.txt') ? nou.slice(0, -'.txt'.length) : nou }));
const APLICAT = PAQUET.length > 0 && PAQUET.every((f) => fs.existsSync(path.join(REPO, f.ruta)) && llig(path.join(REPO, f.ruta)) === llig(path.join(NOUS, f.nou)));

/**
 * Primera transacció acceptada de .agents/seal-transactions/ amb un prefix d'operationId, o
 * null. Mateix criteri que transaccio() de prepara-pla.mjs; un registre il·legible no compta.
 */
function transaccioAmb(prefix) {
  const dir = path.join(REPO, '.agents/seal-transactions');
  if (!fs.existsSync(dir)) return null;
  for (const nom of fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    let t;
    try { t = JSON.parse(llig(path.join(dir, nom))); } catch { continue; }
    if (t?.state === 'accepted' && typeof t.operationId === 'string' && t.operationId.startsWith(prefix) && Array.isArray(t.files)) return t;
  }
  return null;
}

/*
 * Onada 7 (261009): eixida per aplicació. L'executor ja va aplicar este paquet (operationId
 * `sdp-olivera-ancores-261006-*`), i la transacció porta cada fitxer de nous/ amb el sha que hi
 * va deixar (`after`). El corredor no ho veia perquè només mirava APLICAT, els bytes iguals als
 * de nous/: el paquet 261009_0400_higiene_claude ha reescrit després draft-write.mjs i la porta
 * Olivera sobre els que este va deixar, i APLICAT ja no pot ser cert. prepara-pla.mjs, a més,
 * es nega per la transacció. Sense transacció, el corredor comprova com fins ara.
 */
const APLICACIO = (() => {
  const t = transaccioAmb('sdp-olivera-ancores-261006-');
  const deixat = (f) => t.files.some((x) => x.path === f.ruta && x.after === sha(fs.readFileSync(path.join(NOUS, f.nou))));
  return t && PAQUET.length > 0 && PAQUET.every(deixat) ? t : null;
})();
const ACTIU = PAQUET.length > 0 && !APLICAT && !APLICACIO;

/** Bateria fixa: tot el que importa la porta o draft-write, directament o pel circuit documental. */
const FIXES = ['porta-olivera-v3', 'porta-olivera-diagnosi', 'cognitive-preflight', 'cognitive-hook-safety', 'tractor-fortification',
  'sistema_nervios', 'cognitive-document-handoff', 'antigravity-hook', 'anticipacio-261003', 'document-create-race', 'documental',
  'document-command-policy', 'hooks-local', 'porta-reflex', 'security-chain', 'fortificacio', 'porta-receptor',
  'plantilla-viva-installacio', 'petorreta-generador', 'porta-olivera-v2', 'governanca-260930-olivera', 'governanca-260930-maria',
  'governanca-260930-lease', 'governanca-260930b-portes', 'governanca-260930b-torns', 'lint-torn-261002', 'olivera-arxiva-261002']
  .map((n) => `tests/${n}.test.mjs`);

/** La fixa més qualsevol prova que nomene la porta o draft-write, i les que porta el paquet. */
function bateria() {
  const trobades = fs.readdirSync(path.join(REPO, 'tests')).filter((n) => n.endsWith('.test.mjs'))
    .filter((n) => /porta-olivera|draft-write/.test(llig(path.join(REPO, 'tests', n)))).map((n) => `tests/${n}`);
  const delPaquet = PAQUET.filter((f) => /^tests\/[^/]+\.test\.mjs$/.test(f.ruta)).map((f) => f.ruta);
  return [...new Set([...FIXES, ...trobades, ...delPaquet])].filter((f) => fs.existsSync(path.join(REPO, f))).sort();
}

const WIKI = ['00_index.md', '01_ser', '02_saber', '03_actuar', '10_actes'];
const ARREL_SOLTS = ['AGENTS.md', 'CLAUDE.md', 'package.json', 'eslint.config.js', '.gitignore'];
/** El nucli de tractors que una prova de laboratori contrasta amb el seu. */
const CODI = ['src/sections/tractors'];
const INVESTIGACIO = '_wiki_de_poble/04_escriptori/02_investigacio_ia';

/**
 * Deriva declarada: assajos d'adopció d'un paquet de laboratori superat (suite
 * laboratory, preimatges congelades) que cauen per construcció davant de qualsevol
 * canvi a la porta. Comparen l'API instal·lada amb la seua còpia i hi superposen la
 * seua porta, sense els helpers que ara importa draft-write. El LLEGIU del 261002 ja
 * ho preveia per al 260930b: és el senyal per a rebasar-lo o arxivar-lo. És una
 * excepció a «cap fallada nova» i val només amb l'acceptació explícita del Mestre
 * (LLEGIU_PRIMER §2 i §5); només tolera que deixen de passar eixos noms exactes.
 */
const DERIVA_DECLARADA = Object.freeze({
  'tests/governanca-260930b-portes.test.mjs': [
    'les còpies noves són sintàcticament vàlides i conserven tota l’API exportada',
    'en una còpia de tooling/ amb el paquet passen les proves noves i les guardes que el importen',
  ],
});

/**
 * Còpia del repositori per a la bateria: tooling/, tests/, scripts/, .agents/ sense
 * els registres de runtime, .claude, .codex i .husky, la part viva de la Wiki (mai
 * l'arxiu ni els documents de l'Escriptori, només les carpetes de laboratori que
 * lligen les proves), node_modules enllaçat i un git propi perquè els hooks de
 * Codex es localitzen.
 */
function construeix(prefix, ambPaquet) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  const fora = (src) => !/[\\/](?:node_modules|\.DS_Store|\.git)$/.test(src) && !src.includes(`${path.sep}.agents${path.sep}runtime`);
  const copia = (rel) => {
    if (!fs.existsSync(path.join(REPO, rel))) return;
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.cpSync(path.join(REPO, rel), path.join(dir, rel), { recursive: true, filter: fora, verbatimSymlinks: true });
  };
  for (const rel of ['tooling', 'tests', 'scripts', '.agents', '.claude', '.codex', '.husky', ...ARREL_SOLTS, ...CODI]) copia(rel);
  for (const rel of WIKI) copia(`_wiki_de_poble/${rel}`);
  fs.mkdirSync(path.join(dir, INVESTIGACIO), { recursive: true });
  for (const e of fs.readdirSync(path.join(REPO, INVESTIGACIO), { withFileTypes: true })) {
    if (e.isDirectory() && `${INVESTIGACIO}/${e.name}` !== REL_LAB) copia(`${INVESTIGACIO}/${e.name}`);
  }
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  execFileSync('git', ['init', '-q'], { cwd: dir });
  if (ambPaquet) {
    for (const f of PAQUET) {
      fs.mkdirSync(path.dirname(path.join(dir, f.ruta)), { recursive: true });
      fs.copyFileSync(path.join(NOUS, f.nou), path.join(dir, f.ruta));
    }
  }
  return dir;
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
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(?:VITEST|SDP_ARREL$|CLAUDE_PROJECT_DIR$|NODE_OPTIONS$|NODE_ENV$|TEST$)/.test(k)));
  return new Promise((resolve) => {
    const fill = spawn(process.execPath, ['--test', '--test-reporter=tap', fitxer], { cwd: arrel, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    fill.stdout.on('data', (tros) => { out += tros; });
    fill.stderr.on('data', (tros) => { err += tros; });
    const rellotge = setTimeout(() => fill.kill('SIGKILL'), 5 * 60 * 1000);
    fill.on('close', (codi) => { clearTimeout(rellotge); resolve({ fitxer, codi, resultats: llegeixTap(out, arrel), err }); });
  });
}

/** Executa totes les tasques amb un límit de processos alhora. */
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

/** Regressions, deriva declarada i proves noves d'un fitxer de la bateria. */
function compara(f, b, p, ambProvesNoves) {
  const out = { regressions: [], declarades: [], noves: [] };
  for (const [clau, estat] of b) {
    if (!regressa(estat, p.get(clau))) continue;
    (estat === 'pass' && DERIVA_DECLARADA[f]?.includes(clau) ? out.declarades : out.regressions).push(`${f} :: ${clau} (${estat}) → ${p.get(clau) ?? 'absent'}`);
  }
  for (const [clau, estat] of p) {
    if (b.has(clau)) continue;
    if (ambProvesNoves.has(f)) out.noves.push(`${estat} · ${f} :: ${clau}`);
    else if (estat === 'fail') out.regressions.push(`${f} :: ${clau} → fail (nova al paquet)`);
  }
  return out;
}

describe.skipIf(!ACTIU)(`laboratori 261006_0055_olivera_ancores_opus${APLICACIO ? ` · retirat: aplicat per la transacció ${APLICACIO.id}` : ''}`, () => {
  test('el codi del paquet, el generador del pla i este corredor passen l’ESLint del repositori sense cap missatge', async () => {
    const { ESLint } = await import('eslint');
    const eslint = new ESLint({ cwd: REPO });
    const fitxers = [
      ...PAQUET.filter((f) => f.nou.endsWith('.mjs')).map((f) => ({ abs: path.join(NOUS, f.nou), rel: f.ruta })),
      { abs: path.join(LAB, 'prepara-pla.mjs'), rel: `${REL_LAB}/prepara-pla.mjs` },
      { abs: fileURLToPath(import.meta.url), rel: 'tests/laboratori-olivera-261006.test.js' },
    ];
    const missatges = [];
    for (const { abs, rel } of fitxers) {
      const [r] = await eslint.lintText(llig(abs), { filePath: path.join(REPO, rel) });
      missatges.push(...r.messages.map((m) => `${rel}:${m.line} ${m.ruleId} ${m.message}`));
    }
    expect(missatges).toEqual([]);
  }, 120000);

  test('prepara-pla.mjs veu cada fitxer de nous/ pendent sobre la base fixada i arma un pla que l’executor valida', async () => {
    const pla = await import(pathToFileURL(path.join(LAB, 'prepara-pla.mjs')).href);
    const estat = pla.estat(REPO);
    const deriva = estat.filter((f) => f.estat !== 'pendent').map((f) => `${f.ruta}: ${f.estat} ${f.motiu ?? ''} (sha actual ${f.before})`);
    expect(deriva, PAQUET.map((f) => `${f.ruta} ${fs.existsSync(path.join(REPO, f.ruta)) ? sha(fs.readFileSync(path.join(REPO, f.ruta))) : 'absent'}`).join('\n')).toEqual([]);
    expect(Object.keys(pla.BASES).sort()).toEqual(PAQUET.map((f) => f.ruta).sort());
    const { plan, targets } = await pla.preparaPla(REPO);
    expect(plan.schema).toBe('sdp.mutation.v1');
    expect(targets.sort()).toEqual(PAQUET.map((f) => f.ruta).sort());
    for (const f of plan.files) expect(f.before).toBe(pla.BASES[f.path]);
    // Deriva: un original diferent del fixat no entra mai al pla.
    const falsa = Object.fromEntries(Object.keys(pla.BASES).map((k) => [k, '0'.repeat(64)]));
    expect(pla.estat(REPO, { bases: falsa }).every((f) => f.estat === 'deriva')).toBe(true);
    // El seal rebutjaria dades sensibles al manifest o a la Petorreta.
    const petorreta = pla.construeixPetorreta({ sessio: pla.SESSIO_ZERO, intentSha256: '0'.repeat(64), rulesSha256: '0'.repeat(64), planSha256: '0'.repeat(64), targets });
    expect([...pla.sensibles(llig(path.join(REPO, pla.LLEGIU))), ...pla.sensibles(pla.manifest()), ...pla.sensibles(petorreta)]).toEqual([]);
  }, 120000);

  test('la bateria de la porta i de draft-write: cap fallada nova respecte de HEAD i totes les proves noves verdes', async () => {
    const fitxers = bateria();
    const base = construeix('sdp-olivera-261006-base-', false);
    const paquet = construeix('sdp-olivera-261006-paquet-', true);
    try {
      // Tres processos alhora: este corredor comparteix la CPU amb els workers de
      // Vitest, i moltes proves de la bateria tenen timeouts de 10 s.
      const tasques = fitxers.flatMap((f) => [() => corre(base, f), () => corre(paquet, f)]);
      const eixides = await enPiscina(tasques, 3);
      const deBase = new Map(eixides.filter((_, i) => i % 2 === 0).map((e) => [e.fitxer, e]));
      const delPaquet = new Map(eixides.filter((_, i) => i % 2 === 1).map((e) => [e.fitxer, e]));
      const ambProvesNoves = new Set(PAQUET.map((f) => f.ruta));
      const dubtosos = (f) => {
        const c = compara(f, deBase.get(f).resultats, delPaquet.get(f).resultats, ambProvesNoves);
        return c.regressions.length > 0 || c.noves.some((n) => !n.startsWith('pass'));
      };
      // Una caiguda del paquet es repetix una sola vegada, en sèrie, abans de declarar-la:
      // un timeout per càrrega no és una regressió. La segona execució mana.
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
      const resum = `Bateria de ${fitxers.length} fitxers. Base (HEAD): ${cb.pass} pass · ${cb.fail} fail · ${cb.skip} skip. Paquet: ${cp.pass} pass · ${cp.fail} fail · ${cp.skip} skip. Proves noves: ${noves.length}. Deriva declarada: ${declarades.length}. Repetits en sèrie: ${repetits.length ? repetits.join(', ') : 'cap'}.`;
      console.log(`[laboratori 261006] ${resum}`);
      for (const f of fitxers) {
        const [b, p] = [compte([deBase.get(f)]), compte([delPaquet.get(f)])];
        if (b.fail || p.fail) console.log(`[laboratori 261006]   ${f}: base ${b.pass}/${b.fail}/${b.skip} · paquet ${p.pass}/${p.fail}/${p.skip} (pass/fail/skip)`);
      }
      for (const d of declarades) console.log(`[laboratori 261006]   deriva declarada: ${d}`);
      expect(fitxers.every((f) => deBase.get(f).resultats.size > 0), 'cada fitxer ha de produir resultats a la base').toBe(true);
      expect(regressions, resum).toEqual([]);
      expect(noves.filter((n) => !n.startsWith('pass')), resum).toEqual([]);
      expect(noves.length, resum).toBeGreaterThan(0);
    } finally {
      fs.rmSync(base, { recursive: true, force: true });
      fs.rmSync(paquet, { recursive: true, force: true });
    }
  }, 20 * 60 * 1000);
});
