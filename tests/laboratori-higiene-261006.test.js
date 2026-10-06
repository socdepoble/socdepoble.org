// @vitest-environment node
/** Corredor del laboratori 261006_0300_ledger_claude/t6_higiene (front T6b: higiene
 *  de l'orquestradora, briefing de taula del hook d'Antigravity i dues skills).
 *
 *  El paquet viu a `02_investigacio_ia/261006_0300_ledger_claude/t6_higiene/nous/`
 *  amb la ruta real i l'aplicarà el Mestre amb executor-mutacio.mjs i una lease.
 *  Mentre no s'aplique, este corredor construïx dues còpies del repositori a
 *  os.tmpdir(): la base (HEAD tal com és) i la del paquet (els fitxers de nous/
 *  superposats i el segell de skills recalculat com el deixaria l'executor), hi
 *  executa amb `node --test` la bateria que depén del hook, de les dues skills o
 *  del segell, i exigix que no hi haja cap fallada nova respecte de la base i que
 *  totes les proves noves del paquet passen. També passa l'ESLint del repositori
 *  pel codi nou, contrasta que prepara-pla.mjs no veu deriva, que la Petorreta
 *  amb el seu nom real passa validatePetorreta del seal, que la dependència del
 *  paquet 261006_0055 i la projecció del catàleg es detecten en Masos de prova,
 *  que core-identitat només canvia el pas 5 (byte a byte), i que amb el 0055
 *  superposat les proves del hook passen totes i les que porta el 0055 (v3,
 *  diagnosi i cognitive-preflight) no empitjoren respecte de HEAD + 0055 (ordre
 *  d'aplicació T2 → 0055 → este).
 *
 *  Patró: tests/laboratori-olivera-261006.test.js (paquet 261006_0055).
 *  Fa skip si el laboratori no hi és o si els fitxers instal·lats ja són els de
 *  nous/: llavors manen les proves reals i este corredor s'ha de retirar.
 *  Cap prova escriu al repositori, llevat de la de `--mode genera`, que només
 *  reescriu nous/.agents/skills/core-identitat/SKILL.md.txt; de
 *  90_arxiu_historic no es copia res.
 */
import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261006_0300_ledger_claude/t6_higiene';
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
const ACTIU = PAQUET.length > 0 && !APLICAT;

/** Bateria fixa: el hook, les dues skills, el segell i la cadena de seguretat. */
const FIXES = ['antigravity-hook', 'porta-olivera-diagnosi', 'cognitive-hook-safety', 'governanca-260930-olivera', 'backend_consolidacio',
  'security-chain', 'hooks-local', 'tractor-fortification', 'sistema_nervios', 'governanca-260930-segell', 'governanca-260930-maria',
  'governanca-260930-lease', 'mapa-consola', 'governanca-260930-mapa']
  .map((n) => `tests/${n}.test.mjs`);

/** La fixa més qualsevol prova que nomene el hook o les dues skills, i les que porta el paquet. */
function bateria() {
  const trobades = fs.readdirSync(path.join(REPO, 'tests')).filter((n) => n.endsWith('.test.mjs'))
    .filter((n) => /antigravity-hook|core-higiene-escriptori|core-identitat/.test(llig(path.join(REPO, 'tests', n)))).map((n) => `tests/${n}`);
  const delPaquet = PAQUET.filter((f) => /^tests\/[^/]+\.test\.mjs$/.test(f.ruta)).map((f) => f.ruta);
  return [...new Set([...FIXES, ...trobades, ...delPaquet])].filter((f) => fs.existsSync(path.join(REPO, f))).sort();
}

const WIKI = ['00_index.md', '01_ser', '02_saber', '03_actuar', '10_actes'];
const ARREL_SOLTS = ['AGENTS.md', 'CLAUDE.md', 'package.json', 'eslint.config.js', '.gitignore'];
/** El nucli de tractors que una prova de laboratori contrasta amb el seu. */
const CODI = ['src/sections/tractors', 'src/data'];
const INVESTIGACIO = '_wiki_de_poble/04_escriptori/02_investigacio_ia';

/**
 * Segell de skills tal com el deixa executor-mutacio.mjs quan aplica un pla que
 * toca .agents/skills (executor-mutacio.mjs:75-87): hash recalculat i una
 * transacció acceptada que el justifica.
 */
async function segellaComExecutor(dir) {
  const { calculaSegell } = await import(pathToFileURL(path.join(dir, 'tooling/gates/segella.mjs')).href);
  const segell = calculaSegell(dir);
  const id = randomUUID();
  const evidencia = path.join(dir, '.agents/seal-transactions');
  fs.mkdirSync(evidencia, { recursive: true });
  fs.writeFileSync(path.join(evidencia, `${id}.json`), `${JSON.stringify({
    id, state: 'accepted', kind: 'laboratori-higiene-261006', operationId: 'sdp-higiene-t6-261006-corredor',
    afterSeal: segell.hash, files: PAQUET.map((f) => f.ruta), manifest: segell.manifest,
  })}\n`);
  fs.writeFileSync(path.join(dir, '.agents/SKILLS_SEAL.json'), `${JSON.stringify({
    timestamp: new Date().toISOString(), hash: segell.hash, filesCount: segell.files.length, manifest: segell.manifest, transaction: id,
  }, null, 2)}\n`);
}

/**
 * Còpia del repositori per a la bateria: tooling/, tests/, scripts/, .agents/ sense
 * els registres de runtime, .claude, .codex i .husky, la part viva de la Wiki (mai
 * l'arxiu ni els documents de l'Escriptori, només les carpetes de laboratori que
 * lligen les proves), node_modules enllaçat i un git propi perquè els hooks de
 * Codex es localitzen.
 */
async function construeix(prefix, ambPaquet) {
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
    if (e.isDirectory()) copia(`${INVESTIGACIO}/${e.name}`);
  }
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  execFileSync('git', ['init', '-q'], { cwd: dir });
  if (ambPaquet) {
    for (const f of PAQUET) {
      fs.mkdirSync(path.dirname(path.join(dir, f.ruta)), { recursive: true });
      fs.copyFileSync(path.join(NOUS, f.nou), path.join(dir, f.ruta));
    }
    if (PAQUET.some((f) => f.ruta.startsWith('.agents/skills/'))) await segellaComExecutor(dir);
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

/** Regressions i proves noves d'un fitxer de la bateria. */
function compara(f, b, p, ambProvesNoves) {
  const out = { regressions: [], noves: [] };
  for (const [clau, estat] of b) {
    if (regressa(estat, p.get(clau))) out.regressions.push(`${f} :: ${clau} (${estat}) → ${p.get(clau) ?? 'absent'}`);
  }
  for (const [clau, estat] of p) {
    if (b.has(clau)) continue;
    if (ambProvesNoves.has(f)) out.noves.push(`${estat} · ${f} :: ${clau}`);
    else if (estat === 'fail') out.regressions.push(`${f} :: ${clau} → fail (nova al paquet)`);
  }
  return out;
}

/* core-identitat nova: l'original de HEAD amb el pas 5 just darrere del pas 4 i res més, byte a byte.
   L'eina d'edició de Claude no conserva l'espai final de la línia 20 («contradiccions. »): per això
   nous/ es genera des d'esta prova i no a mà. */
const PAS4_IDENTITAT = "4. Inspeccionar VISUALMENT l'escriptori (`_wiki_de_poble/04_escriptori/`).\n";
const pas5Identitat = () => llig(path.join(NOUS, '.agents/skills/core-identitat/SKILL.md.txt')).split('\n').find((l) => l.startsWith('5. '));
const identitatEsperada = (ara, pas5) => ara.replace(PAS4_IDENTITAT, `${PAS4_IDENTITAT}${pas5}\n`);

describe.skipIf(!ACTIU)('laboratori 261006_0300_ledger_claude/t6_higiene', () => {
  // L'única prova que escriu, i només dins de nous/: `npx vitest run tests/laboratori-higiene-261006.test.js --mode genera`.
  // Precedent: tests/laboratori-model-b-261006.test.js. Una còpia a mà no conserva l'espai final de la línia 20.
  test.runIf(import.meta.env.MODE === 'genera')('genera nous/.agents/skills/core-identitat/SKILL.md.txt des de HEAD i el pas 5', () => {
    const ara = llig(path.join(REPO, '.agents/skills/core-identitat/SKILL.md'));
    const pas5 = pas5Identitat();
    expect(pas5).toMatch(/^5\. Passar la porta/);
    expect(ara.split(PAS4_IDENTITAT).length, 'el pas 4 hi és una sola vegada').toBe(2);
    const desti = path.join(NOUS, '.agents/skills/core-identitat/SKILL.md.txt');
    expect(desti.startsWith(`${NOUS}${path.sep}`)).toBe(true);
    fs.writeFileSync(desti, identitatEsperada(ara, pas5));
    expect(llig(desti)).toContain('contradiccions. \n');
  });

  test('el codi del paquet, el generador del pla i este corredor passen l’ESLint del repositori sense cap missatge', async () => {
    const { ESLint } = await import('eslint');
    const eslint = new ESLint({ cwd: REPO });
    const fitxers = [
      ...PAQUET.filter((f) => f.nou.endsWith('.mjs')).map((f) => ({ abs: path.join(NOUS, f.nou), rel: f.ruta })),
      { abs: path.join(LAB, 'prepara-pla.mjs'), rel: `${REL_LAB}/prepara-pla.mjs` },
      { abs: fileURLToPath(import.meta.url), rel: 'tests/laboratori-higiene-261006.test.js' },
    ];
    const missatges = [];
    for (const { abs, rel } of fitxers) {
      const [r] = await eslint.lintText(llig(abs), { filePath: path.join(REPO, rel) });
      missatges.push(...r.messages.map((m) => `${rel}:${m.line} ${m.ruleId} ${m.message}`));
    }
    expect(missatges).toEqual([]);
  }, 120000);

  test('prepara-pla.mjs: fitxers pendents sobre la base fixada, dependència del 0055, pla que l’executor valida i Petorreta que el seal accepta', async () => {
    const pla = await import(pathToFileURL(path.join(LAB, 'prepara-pla.mjs')).href);
    const estat = pla.estat(REPO);
    const deriva = estat.filter((f) => f.estat !== 'pendent').map((f) => `${f.ruta}: ${f.estat} ${f.motiu ?? ''} (sha actual ${f.before})`);
    expect(deriva, PAQUET.map((f) => `${f.ruta} ${fs.existsSync(path.join(REPO, f.ruta)) ? sha(fs.readFileSync(path.join(REPO, f.ruta))) : 'absent'}`).join('\n')).toEqual([]);
    expect(Object.keys(pla.BASES).sort()).toEqual(PAQUET.map((f) => f.ruta).sort());
    expect(pla.ARREL).toBe(REPO);
    // Sense el 0055 aplicat, el flux real es nega: la skill 3.4.0 mana banderes que la porta de HEAD no coneix.
    if (!pla.dependencia0055(REPO).aplicat) await expect(pla.preparaPla(REPO)).rejects.toThrow(/Dependència: el paquet 261006_0055/);
    const { plan, targets, avisos } = await pla.preparaPla(REPO, { exigix0055: false });
    expect(plan.schema).toBe('sdp.mutation.v1');
    const projeccions = targets.filter((t) => pla.PROJECCIONS.includes(t));
    expect(targets.filter((t) => !pla.PROJECCIONS.includes(t)).sort()).toEqual(PAQUET.map((f) => f.ruta).sort());
    // O el catàleg no carrega i ho diu, o carrega i la description nova entra al pla amb la seua CAS.
    if (avisos.length) expect(projeccions).toEqual([]);
    else expect(projeccions).toContain('.agents/skills/00_INDEX_SKILLS.md');
    for (const f of plan.files.filter((x) => Object.hasOwn(pla.BASES, x.path))) expect(f.before).toBe(pla.BASES[f.path]);
    // Deriva: un original diferent del fixat no entra mai al pla.
    const falsa = Object.fromEntries(Object.keys(pla.BASES).map((k) => [k, '0'.repeat(64)]));
    expect(pla.estat(REPO, { bases: falsa }).every((f) => f.estat === 'deriva')).toBe(true);
    // La Petorreta amb el seu nom real passa la validació del seal (reflex_petorreta.mjs:795-825), també el títol de 8 a 12 paraules.
    const petorreta = pla.construeixPetorreta({ sessio: pla.SESSIO_ZERO, intentSha256: '0'.repeat(64), rulesSha256: '0'.repeat(64), planSha256: '0'.repeat(64), targets });
    const { validatePetorreta } = await import(pathToFileURL(path.join(REPO, 'tooling/wiki/reflex_petorreta.mjs')).href);
    expect(validatePetorreta(path.join(REPO, '.sdp-reflex/bootstrap/x', pla.NOM_PETORRETA), petorreta)).toEqual([]);
    const paraules = /^\d{6}_\d{4}_PROMPT_(.+)\.md$/.exec(pla.NOM_PETORRETA)[1].split('_').filter(Boolean).length;
    expect(paraules).toBeGreaterThanOrEqual(8);
    expect(paraules).toBeLessThanOrEqual(12);
    // El seal rebutjaria dades sensibles al manifest, a les fonts o a la Petorreta.
    const fonts = JSON.parse(pla.manifest()).sources.map((s) => llig(path.join(REPO, s.path)));
    expect([...fonts.flatMap(pla.sensibles), ...pla.sensibles(pla.manifest()), ...pla.sensibles(petorreta)]).toEqual([]);
  }, 120000);

  test('dependència del 0055 i projecció del catàleg: es detecten de veres en Masos de prova', async () => {
    const pla = await import(pathToFileURL(path.join(LAB, 'prepara-pla.mjs')).href);
    const temporals = [];
    const nou = (prefix) => { const d = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix))); temporals.push(d); return d; };
    const posa = (arrel, rel, contingut) => { fs.mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true }); fs.writeFileSync(path.join(arrel, rel), contingut); };
    try {
      // 0055: aplicat per transacció, per porta idèntica a la del seu nous/, i no aplicat amb una porta diferent.
      const { lab, fitxer, operacio } = pla.DEP_0055;
      const porta0055 = fs.existsSync(path.join(REPO, lab, 'nous', fitxer)) ? fs.readFileSync(path.join(REPO, lab, 'nous', fitxer)) : Buffer.from('// porta 0055\n');
      const a = nou('sdp-t6-dep-a-');
      posa(a, `.agents/seal-transactions/${randomUUID()}.json`, JSON.stringify({ id: 't', state: 'accepted', operationId: `${operacio}abcd1234`, files: [fitxer] }));
      expect(pla.dependencia0055(a).aplicat).toBe(true);
      const b = nou('sdp-t6-dep-b-');
      posa(b, `${lab}/nous/${fitxer}`, porta0055);
      posa(b, fitxer, porta0055);
      expect(pla.dependencia0055(b).aplicat).toBe(true);
      posa(b, fitxer, Buffer.concat([porta0055, Buffer.from('\n// una altra mà\n')]));
      expect(pla.dependencia0055(b)).toMatchObject({ aplicat: false, motiu: expect.stringMatching(/Apliqueu-lo primer/) });

      // Catàleg que carrega (com després del T2): dues skills de HEAD, les quatre fonts i les projeccions al dia.
      const { inventari, projeccions } = await import(pathToFileURL(path.join(REPO, 'tooling/brain/cataleg_skills.mjs')).href);
      const c = nou('sdp-t6-mas-cataleg-');
      for (const s of ['core-higiene-escriptori', 'core-identitat']) posa(c, `.agents/skills/${s}/SKILL.md`, fs.readFileSync(path.join(REPO, `.agents/skills/${s}/SKILL.md`)));
      for (const f of ['PROFILE.md', 'AGENTS.md', 'BASELINE.md', 'consell.json']) posa(c, `.agents/${f}`, fs.readFileSync(path.join(REPO, '.agents', f)));
      for (const [rel, text] of projeccions(inventari(c))) posa(c, rel, text);
      const indexAbans = fs.readFileSync(path.join(c, '.agents/skills/00_INDEX_SKILLS.md'));
      const r = await pla.projeccioCataleg(c, { modul: REPO });
      expect(r.carrega).toBe(true);
      expect(r.fitxers.map((f) => f.ruta)).toEqual(['.agents/skills/00_INDEX_SKILLS.md']);
      expect(r.fitxers[0].before).toBe(sha(indexAbans));
      expect(r.fitxers[0].contingut).toContain('[[core-higiene-escriptori/SKILL|core-higiene-escriptori]]: Usa-la en arrencar cada conversa');
      // Una altra mà ha tocat la projecció: deriva, mai una CAS sobre un fitxer que no és el que el paquet espera.
      posa(c, '.agents/skills/00_INDEX_SKILLS.md', `${indexAbans}\nretoc\n`);
      expect((await pla.projeccioCataleg(c, { modul: REPO })).deriva).toEqual(['.agents/skills/00_INDEX_SKILLS.md']);
      // El catàleg de HEAD no carrega (CS-01): ho diu i no projecta res.
      const h = await pla.projeccioCataleg(REPO);
      if (!h.carrega) expect(h.fitxers).toEqual([]);
    } finally {
      for (const d of temporals) fs.rmSync(d, { recursive: true, force: true });
    }
  }, 120000);

  test('les skills noves conserven nom, frontmatter, lliçons i bytes, i no escriuen cap motiu a l’índex', () => {
    for (const nom of ['core-higiene-escriptori', 'core-identitat']) {
      const ara = llig(path.join(REPO, `.agents/skills/${nom}/SKILL.md`));
      const nova = llig(path.join(NOUS, `.agents/skills/${nom}/SKILL.md.txt`));
      expect(nova.startsWith('---\n'), nom).toBe(true);
      expect(nova).toMatch(new RegExp(`^name: ${nom}$`, 'm'));
      expect(nova.endsWith('## Vincles\n- [[00_INDEX_SKILLS]]\n'), `${nom}: «Vincles» al final`).toBe(true);
      const llicons = (text) => (/## Lliçons del Mestre\n([\s\S]*?)\n## /.exec(text) ?? [null, ''])[1];
      expect(llicons(nova), `${nom}: les lliçons del Mestre no es toquen`).toBe(llicons(ara));
      for (const linia of ara.split('\n').filter((l) => /^\s*- \*\*\d{6} · /.test(l))) expect(nova.includes(linia), `${nom}: ${linia}`).toBe(true);
      // --arxiva només despenja el token: un motiu escrit al costat de l'àncora quedaria solt a l'índex.
      expect(nova, nom).not.toMatch(/\]\] · /);
      expect(nova, nom).not.toMatch(/al costat de l'àncora/);
    }
    const higiene = llig(path.join(NOUS, '.agents/skills/core-higiene-escriptori/SKILL.md.txt'));
    expect(/^description: (.*)$/m.exec(higiene)[1]).not.toMatch(/: /);
    expect(higiene).toMatch(/^version: 3\.4\.0$/m);
    expect(higiene).toMatch(/^ {2}- arrencada de sessió$/m);
    // Les ordres de la porta del 0055 que el seu LLEGIU (§5, línies 198-199 i 208-211) demana harmonitzar.
    for (const ordre of ['--repara', '--renomena VELL --a NOU', '--sessio aammdd_Nom', '--arxiva --nom FITXER', '--reapunta', '«## Arxivat amb la Porta Olivera»', 'ANC-06']) expect(higiene, ordre).toContain(ordre);
    // core-identitat: l'única diferència és el pas 5, byte a byte (també l'espai final de la línia 20).
    const ara = llig(path.join(REPO, '.agents/skills/core-identitat/SKILL.md'));
    const nova = llig(path.join(NOUS, '.agents/skills/core-identitat/SKILL.md.txt'));
    const pas5 = pas5Identitat();
    expect(pas5).toMatch(/^5\. Passar la porta/);
    expect(ara.split(PAS4_IDENTITAT).length, 'el pas 4 hi és una sola vegada').toBe(2);
    expect(nova).toBe(identitatEsperada(ara, pas5));
  });

  test('la bateria del hook, de les skills i del segell: cap fallada nova respecte de HEAD i totes les proves noves verdes', async () => {
    const fitxers = bateria();
    const base = await construeix('sdp-higiene-261006-base-', false);
    const paquet = await construeix('sdp-higiene-261006-paquet-', true);
    try {
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
      const noves = [];
      for (const f of fitxers) {
        const c = compara(f, deBase.get(f).resultats, delPaquet.get(f).resultats, ambProvesNoves);
        regressions.push(...c.regressions);
        noves.push(...c.noves);
      }
      const cb = compte([...deBase.values()]);
      const cp = compte([...delPaquet.values()]);
      const resum = `Bateria de ${fitxers.length} fitxers. Base (HEAD): ${cb.pass} pass · ${cb.fail} fail · ${cb.skip} skip. Paquet: ${cp.pass} pass · ${cp.fail} fail · ${cp.skip} skip. Proves noves: ${noves.length}. Repetits en sèrie: ${repetits.length ? repetits.join(', ') : 'cap'}.`;
      console.log(`[laboratori higiene 261006] ${resum}`);
      for (const f of fitxers) {
        const [b, p] = [compte([deBase.get(f)]), compte([delPaquet.get(f)])];
        if (b.fail || p.fail) console.log(`[laboratori higiene 261006]   ${f}: base ${b.pass}/${b.fail}/${b.skip} · paquet ${p.pass}/${p.fail}/${p.skip} (pass/fail/skip)`);
      }
      for (const n of noves) console.log(`[laboratori higiene 261006]   nova: ${n}`);
      // Vitest no mostra la consola d'una prova verda: el resum queda també a os.tmpdir().
      const detall = fitxers.map((f) => {
        const [b, p] = [compte([deBase.get(f)]), compte([delPaquet.get(f)])];
        return `${f}: base ${b.pass}/${b.fail}/${b.skip} · paquet ${p.pass}/${p.fail}/${p.skip}`;
      });
      try { fs.writeFileSync(path.join(os.tmpdir(), 'sdp-laboratori-higiene-261006.txt'), `${[resum, ...detall, ...noves].join('\n')}\n`); } catch { /* el resum no decidix res */ }
      expect(fitxers.every((f) => deBase.get(f).resultats.size > 0), 'cada fitxer ha de produir resultats a la base').toBe(true);
      expect(regressions, resum).toEqual([]);
      expect(noves.filter((n) => !n.startsWith('pass')), resum).toEqual([]);
      expect(noves.length, resum).toBeGreaterThan(0);
    } finally {
      fs.rmSync(base, { recursive: true, force: true });
      fs.rmSync(paquet, { recursive: true, force: true });
    }
  }, 20 * 60 * 1000);

  test('ordre d’aplicació: amb el 0055 superposat, el hook del paquet passa sencer i les proves del 0055 no empitjoren', async () => {
    const lab0055 = path.join(REPO, '_wiki_de_poble/04_escriptori/02_investigacio_ia/261006_0055_olivera_ancores_opus/nous');
    if (!fs.existsSync(lab0055)) return; // aplicat i arxivat: llavors mana la porta instal·lada, que ja prova la bateria
    const superposa0055 = (dir) => {
      for (const f of fitxersDe(lab0055)) {
        const ruta = f.endsWith('.md.txt') ? f.slice(0, -'.txt'.length) : f;
        fs.mkdirSync(path.dirname(path.join(dir, ruta)), { recursive: true });
        fs.copyFileSync(path.join(lab0055, f), path.join(dir, ruta));
      }
    };
    // Les proves que porta el 0055 (porta-olivera-diagnosi importa preTool del hook: el seu [CONTROL D10]), la del
    // hook i cognitive-hook-safety: són les del criteri d'acceptació de la Petorreta (prepara-pla.mjs).
    const fitxers = ['tests/antigravity-hook.test.mjs', 'tests/cognitive-hook-safety.test.mjs', ...fitxersDe(lab0055).filter((f) => /^tests\/[^/]+\.test\.mjs$/.test(f))];
    expect(fitxers).toEqual(expect.arrayContaining(['tests/porta-olivera-diagnosi.test.mjs', 'tests/cognitive-preflight.test.mjs', 'tests/porta-olivera-v3.test.mjs']));
    // Base: HEAD + 0055 (l'estat després del pas anterior de l'ordre). Paquet: HEAD + este paquet + 0055.
    const base = await construeix('sdp-higiene-261006-0055-base-', false);
    const dir = await construeix('sdp-higiene-261006-amb0055-', true);
    try {
      superposa0055(base);
      superposa0055(dir);
      const eixides = await enPiscina(fitxers.flatMap((f) => [() => corre(base, f), () => corre(dir, f)]), 3);
      const deBase = new Map(eixides.filter((_, i) => i % 2 === 0).map((e) => [e.fitxer, e]));
      const delPaquet = new Map(eixides.filter((_, i) => i % 2 === 1).map((e) => [e.fitxer, e]));
      const ambProvesNoves = new Set(['tests/antigravity-hook.test.mjs']);
      const dubtosos = (f) => {
        const c = compara(f, deBase.get(f).resultats, delPaquet.get(f).resultats, ambProvesNoves);
        const hookCaigut = f === 'tests/antigravity-hook.test.mjs' && [...delPaquet.get(f).resultats.values()].includes('fail');
        return c.regressions.length > 0 || c.noves.some((n) => !n.startsWith('pass')) || hookCaigut;
      };
      // Com a la bateria: una caiguda del paquet es repetix una vegada en sèrie i la segona execució mana.
      const repetits = fitxers.filter(dubtosos);
      for (const f of repetits) delPaquet.set(f, await corre(dir, f));
      const regressions = [];
      const noves = [];
      for (const f of fitxers) {
        const c = compara(f, deBase.get(f).resultats, delPaquet.get(f).resultats, ambProvesNoves);
        regressions.push(...c.regressions);
        noves.push(...c.noves);
      }
      const detall = fitxers.map((f) => {
        const [b, p] = [compte([deBase.get(f)]), compte([delPaquet.get(f)])];
        return `${f}: HEAD+0055 ${b.pass}/${b.fail}/${b.skip} · HEAD+t6+0055 ${p.pass}/${p.fail}/${p.skip} (pass/fail/skip)`;
      });
      const linia = `Amb el 0055 superposat. Proves noves: ${noves.length}. Repetits en sèrie: ${repetits.length ? repetits.join(', ') : 'cap'}.`;
      for (const l of [linia, ...detall]) console.log(`[laboratori higiene 261006] ${l}`);
      try { fs.writeFileSync(path.join(os.tmpdir(), 'sdp-laboratori-higiene-261006-0055.txt'), `${[linia, ...detall, ...noves].join('\n')}\n`); } catch { /* el resum no decidix res */ }
      expect(fitxers.every((f) => deBase.get(f).resultats.size > 0 && delPaquet.get(f).resultats.size > 0), detall.join('\n')).toBe(true);
      expect(regressions, detall.join('\n')).toEqual([]);
      expect(noves.filter((n) => !n.startsWith('pass')), detall.join('\n')).toEqual([]);
      const hook = delPaquet.get('tests/antigravity-hook.test.mjs');
      expect([...hook.resultats].filter(([, e]) => e === 'fail').map(([k]) => k), hook.err.slice(0, 2000)).toEqual([]);
    } finally {
      fs.rmSync(base, { recursive: true, force: true });
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 15 * 60 * 1000);
});
