/** Corredor del paquet 261002 «Olivera arxiva» (laboratori 261002_1745_olivera_arxiva_claude).
 *
 *  Inverteix un per un els defectes que fixa tests/porta-olivera-diagnosi.test.mjs
 *  (D1-D11) i les correccions del refutador que manen: O10 (`ask` → `force_ask`),
 *  O13 (noms `planificacio_*` i el missatge amb el prefix), O15 i O19 (rebuts
 *  duplicats del mateix fitxer).
 *
 *  El paquet viu a `02_investigacio_ia/261002_1745_olivera_arxiva_claude/nous/` i
 *  l'aplicarà l'executor amb una lease del Mestre. Les versions noves importen
 *  `../lib/arrel.mjs` i les portes germanes, i no es poden carregar des del
 *  laboratori: es construïx una còpia de tooling/ a os.tmpdir() amb els fitxers
 *  nous superposats i s'importen d'allí. Quan l'executor ja ha deixat la
 *  transacció acceptada del paquet (operationId `sdp-olivera-arxiva-261002-*` a
 *  `.agents/seal-transactions/`), s'importen els fitxers reals. Sense laboratori
 *  ni transacció, skip.
 *
 *  Totes les fixtures viuen a os.tmpdir(), amb noms i dades sintètics: cap prova
 *  toca l'Escriptori real ni cap torn real.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261002_1745_olivera_arxiva_claude';
const LAB = path.join(REPO, REL_LAB);
const NOUS = path.join(LAB, 'nous');
const OPERACIO = 'sdp-olivera-arxiva-261002-';
const DESK = '_wiki_de_poble/04_escriptori';
const ARXIU = '_wiki_de_poble/90_arxiu_historic';
const INDEX = `${DESK}/00_index_escriptori.md`;
// Una jornada que sempre és anterior a hui.
const VELL = '250101';
const sha = (valor) => createHash('sha256').update(valor).digest('hex');
const llig = (abs) => fs.readFileSync(abs, 'utf8');

/** Transacció acceptada del paquet, o null (mateix criteri que prepara-pla.mjs). */
function transaccio() {
  const dir = path.join(REPO, '.agents/seal-transactions');
  if (!fs.existsSync(dir)) return null;
  for (const nom of fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    let t;
    try { t = JSON.parse(llig(path.join(dir, nom))); } catch { continue; }
    if (t?.state === 'accepted' && typeof t.operationId === 'string' && t.operationId.startsWith(OPERACIO) && Array.isArray(t.files)) return t;
  }
  return null;
}

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

const TRANSACCIO = transaccio();
const HI_HA_LAB = fs.existsSync(NOUS);

/** Fitxers de l'arrel que lligen els hooks i les proves, a més de tooling/. */
const FONTS_ARREL = ['.agents/protocolledge.json', '.agents/hooks.json', '.agents/BOOTSTRAP.md', '.claude/settings.json', '.codex/hooks.json',
  'AGENTS.md', '_wiki_de_poble/01_ser/02_genotip.md', '_wiki_de_poble/00_index.md'];

/**
 * Còpia de tooling/ a os.tmpdir() amb els fitxers nous superposats, les fonts que
 * lligen hooks i proves, node_modules enllaçat i un marcador d'arrel propi: els
 * mòduls que resolen l'arrel en carregar-se ho fan dins de la còpia. És un
 * repositori git perquè els hooks de Codex es localitzen amb `git rev-parse`.
 */
function construeixArbre() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-olivera-arxiva-')));
  const fora = (src) => !/[\\/](?:node_modules|\.DS_Store)$/.test(src);
  for (const d of ['tooling', 'scripts/immunitari', 'tests/helpers']) {
    if (fs.existsSync(path.join(REPO, d))) fs.cpSync(path.join(REPO, d), path.join(dir, d), { recursive: true, filter: fora });
  }
  const router = JSON.parse(llig(path.join(REPO, '.agents/protocolledge.json')));
  for (const f of [...FONTS_ARREL, ...router.rutes.map((r) => r.plantilla)]) {
    if (!fs.existsSync(path.join(REPO, f))) continue;
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    fs.copyFileSync(path.join(REPO, f), path.join(dir, f));
  }
  for (const rel of fitxersDe(path.join(NOUS, 'tooling'))) {
    fs.mkdirSync(path.dirname(path.join(dir, 'tooling', rel)), { recursive: true });
    fs.copyFileSync(path.join(NOUS, 'tooling', rel), path.join(dir, 'tooling', rel));
  }
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  fs.writeFileSync(path.join(dir, '.agents/AGENTS.md'), '# BIOS de la còpia de proves\n');
  execFileSync('git', ['init', '-q'], { cwd: dir });
  return dir;
}

const ARBRE = !TRANSACCIO && HI_HA_LAB ? construeixArbre() : null;
after(() => { if (ARBRE) fs.rmSync(ARBRE, { recursive: true, force: true }); });
const BASE = TRANSACCIO ? REPO : ARBRE;
const importa = async (rel) => (BASE ? import(pathToFileURL(path.join(BASE, rel)).href) : null);
const olivera = await importa('tooling/gates/porta-olivera.mjs');
const hook = await importa('tooling/gates/antigravity-hook.mjs');
const torns = await importa('tooling/documental/turns.mjs');
const nucli = await importa('tooling/documental/core.mjs');
const local = await importa('tooling/gates/hooks-local.mjs');
const viva = await importa('tooling/gates/porta-plantilla-viva.mjs');
const context = await importa('tooling/brain/context-local.mjs');
const documentCli = await importa('tooling/wiki/document.mjs');
const ajuda = await importa('tests/helpers/documental.mjs');
const pla = !TRANSACCIO && HI_HA_LAB ? await import(pathToFileURL(path.join(LAB, 'prepara-pla.mjs')).href) : null;
const PORTA = BASE ? path.join(BASE, 'tooling/gates/porta-olivera.mjs') : null;
const HOOK = BASE ? path.join(BASE, 'tooling/gates/antigravity-hook.mjs') : null;
const DIA = olivera ? olivera.avui() : '000000';

function salta(t, { nomesLab = false } = {}) {
  if (!BASE) { t.skip('laboratori 261002_1745_olivera_arxiva_claude absent i paquet sense transacció'); return true; }
  if (nomesLab && !ARBRE) { t.skip(`paquet aplicat per l'executor (transacció ${TRANSACCIO.id}): el laboratori ja no mana`); return true; }
  return false;
}

/* ── Mas sintètic ─────────────────────────────────────────────────────────── */

function mas(t, linies = ['# Índex', '']) {
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-olivera-arxiva-mas-')));
  fs.mkdirSync(path.join(arrel, DESK), { recursive: true });
  fs.writeFileSync(path.join(arrel, INDEX), [].concat(linies).join('\n'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  return arrel;
}
const posa = (arrel, nom, text = '# prova\n') => {
  fs.mkdirSync(path.dirname(path.join(arrel, DESK, nom)), { recursive: true });
  fs.writeFileSync(path.join(arrel, DESK, nom), text);
};
const index = (arrel) => llig(path.join(arrel, INDEX));
const aTaula = (arrel, nom) => fs.existsSync(path.join(arrel, DESK, nom));
const aArxiu = (arrel, nom) => fs.existsSync(path.join(arrel, ARXIU, nom));
const sense = (nom) => nom.replace(/\.md$/, '');
const registre = (root, id) => llig(path.join(root, '.agents/runtime/turns', `${id}.json`));
const porta = (arrel, args, extra = {}) => spawnSync(process.execPath, [PORTA, ...args], { cwd: arrel, env: { ...process.env, SDP_ARREL: arrel }, encoding: 'utf8', timeout: 30000, ...extra });
const senseArrel = () => { const e = { ...process.env }; delete e.SDP_ARREL; return e; };
/** Fixture documental dels helpers, amb el camí real (macOS: /var → /private/var). */
const fixture = (t) => fs.realpathSync(ajuda.fixture(t));

/* ── 0. El codi que entra ─────────────────────────────────────────────────── */

test('el codi del paquet, el generador del pla i este corredor passen l’ESLint del repositori sense cap missatge', async (t) => {
  if (!HI_HA_LAB) return t.skip('laboratori absent');
  const { ESLint } = await import('eslint');
  const eslint = new ESLint({ cwd: REPO });
  const fitxers = [
    ...fitxersDe(NOUS).filter((f) => f.endsWith('.mjs')).map((f) => ({ abs: path.join(NOUS, f), rel: f })),
    { abs: path.join(LAB, 'prepara-pla.mjs'), rel: `${REL_LAB}/prepara-pla.mjs` },
    { abs: fileURLToPath(import.meta.url), rel: 'tests/olivera-arxiva-261002.test.mjs' },
  ];
  assert.ok(fitxers.length >= 11, fitxers.map((f) => f.rel).join(', '));
  const missatges = [];
  for (const { abs, rel } of fitxers) {
    const [r] = await eslint.lintText(llig(abs), { filePath: path.join(REPO, rel) });
    missatges.push(...r.messages.map((m) => `${rel}:${m.line} ${m.ruleId} ${m.message}`));
  }
  assert.deepEqual(missatges, []);
});

/** Línies de l'original que el paquet substituïx a propòsit; qualsevol altra s'ha de conservar tal qual. */
const SUBSTITUIDES = {
  'tooling/documental/core.mjs': [
    "  const name = path.basename(file, '.md');",
    '  return [...clean.matchAll(/\\[\\[([^|\\]#]+)(?:[|#][^\\]]*)?\\]\\]/g)].some(m => m[1].trim() === name);',
  ],
  'tooling/documental/turns.mjs': [
    '    fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\\n`, {flag:\'wx\', mode:0o600});',
    "  if (!turn.plan || !fs.existsSync(path.join(root,turn.plan.file)) || hashFile(path.join(root, turn.plan.file)) !== turn.plan.hash) errors.push(`Pla absent o modificat: ${turn.plan?.file || '(sense pla)'}`);",
    "    if (!fs.existsSync(path.join(root,file))) { errors.push(`Document eliminat sense relleu: ${file}`); continue; }",
    "  const match=receiptPattern.exec(parseDocument(raw).data.reflex||'');",
    "  if(!match||match[1]!==id) throw new Error('Identitat del relleu divergent');",
    '    const receipt=turn.receipts[match[2]];',
    "    if(!receipt||receipt.file!==source) throw new Error('Rebut del relleu absent');",
    "    if(turn.plan?.file===source && turn.plan.hash!==digest) throw new Error('Pla modificat durant el relleu');",
    '    receipt.moves=[...(receipt.moves||[]),{from:source,to:target,hash:digest,at:new Date().toISOString()}];',
    '    if(turn.plan?.file===source) turn.plan.file=target;',
    '    turn.ownedPaths=[...new Set([...(turn.ownedPaths||[]).filter(p=>p!==source),target])];',
    '    // Preserve source history, while recognising that its absence is an intentional handoff.',
    '    turn.relocated=[...(turn.relocated||[]),source];',
    "    move(turn,turn.plan?'planned':'context_loaded','handoff');",
  ],
  'tooling/documental/command-policy.mjs': [
    "  const specifications={context:[['turn-id','route','file'],['turn-id','route','file']],create:[['turn-id','route','file','title','description','actor'],['turn-id','route','file','title','description']],plan:[['turn-id','file'],['turn-id','file']],check:[['file'],['file']],own:[['turn-id','file'],['turn-id','file']]};",
  ],
  'tooling/gates/mutation-policy.mjs': [
    "import {relativePath, humanZone} from '../documental/core.mjs';",
  ],
  'tooling/gates/porta-plantilla-viva.mjs': [
    '  if (/^\\d{6}_\\d{4}_/.test(nom)) return categoriaDelNom(nom) !== null;',
    '  catch (e) { informe.errors.push(`frontmatter: ${e.message}`); return informe; }',
    "    if (!permeses.includes(routeId)) informe.errors.push(`ruta: el rebut és de «${routeId}» i el nom demana ${permeses.join(' o ')}`);",
  ],
};

test('els fitxers retocats conserven cada línia de l’original menys les que substituïxen a propòsit', (t) => {
  if (salta(t, { nomesLab: true })) return;
  for (const [ruta, esperades] of Object.entries(SUBSTITUIDES)) {
    const original = path.join(REPO, ruta);
    const nou = llig(path.join(NOUS, ruta));
    if (llig(original) === nou) continue;
    const noves = new Set(nou.split('\n'));
    const perdudes = llig(original).split('\n').filter((l) => l.trim() && !noves.has(l));
    assert.deepEqual(perdudes, esperades, `${ruta}: ${JSON.stringify(perdudes)}`);
  }
});

test('porta-olivera i el hook d’Antigravity parteixen de la v3b del laboratori 260930b i en conserven l’API', async (t) => {
  if (salta(t, { nomesLab: true })) return;
  const exportats = (text) => [...text.matchAll(/^export (?:async )?(?:const|let|function|class) ([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  const v3b = path.join(REPO, '_wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0400_governanca_claude/nous/tooling/gates');
  for (const nom of ['porta-olivera.mjs', 'antigravity-hook.mjs']) {
    const nou = exportats(llig(path.join(NOUS, 'tooling/gates', nom)));
    const instal = exportats(llig(path.join(REPO, 'tooling/gates', nom)));
    assert.deepEqual(instal.filter((n) => !nou.includes(n)), [], `${nom}: API instal·lada perduda`);
    if (fs.existsSync(path.join(v3b, nom))) assert.deepEqual(exportats(llig(path.join(v3b, nom))).filter((n) => !nou.includes(n)), [], `${nom}: API de la v3b perduda`);
  }
});

/* ── 1. La seqüència de MarIA, ara amb l'eina ─────────────────────────────── */

test('D1+D2 invertits: la seqüència del 261002 es resol amb l’eina en un sol acte, i l’arxivat sense noms diu com moure els d’avui', (t) => {
  if (salta(t)) return;
  const g = `${DIA}_0045_pla_implementacio_gestoria.md`;
  const a = `${DIA}_0205_pla_implementacio_arbre_genealogic.md`;
  const v = `${DIA}_0310_visio_arquitectonica_expansio.md`;
  const fp = `${DIA}_1245_pla_implementacio_alarma_fatiga.md`;
  const fr = `${DIA}_1245_prompt_claude_alarma_fatiga.md`;
  const au = `${DIA}_1525_auditoria_claude.md`;
  const sis = [g, a, v, fp, fr, au];
  const arrel = mas(t, [
    '# Índex', '', '## Activitat en curs', '',
    ...[g, a, v, fp, fr].map((n) => `- [[${sense(n)}]]`),
    '', '## Altres enllaços', '',
    `- [[${sense(fp)}]]`, '', `- [[${sense(fr)}]]`, '', `- [[${sense(au)}]]`, ''
  ]);
  for (const n of sis) posa(arrel, n);
  assert.equal(olivera.checkTaula(arrel).valid, true);

  // D2: sense noms no es mou res d'avui, però la porta diu quins candidats hi ha i amb quina ordre.
  const buit = olivera.arxiva(arrel);
  assert.deepEqual(buit.moguts, []);
  assert.deepEqual(buit.candidats, [au], 'el de torn d’avui que ningú declara viu');
  const cli = porta(arrel, ['--arxiva']);
  assert.equal(cli.status, 0, cli.stderr);
  assert.match(cli.stdout, /--arxiva --sec --nom NOM\.md/);
  assert.match(cli.stdout, new RegExp(`sense declarar vius: ${au}`));

  // D1: per nom ixen els sis, la «visio» inclosa, i la taula queda neta sense tocar res a mà.
  const r = olivera.arxiva(arrel, { noms: sis });
  assert.deepEqual(r.moguts.map((m) => [m.nom, m.nota]), sis.map((n) => [n, 'mogut']));
  for (const n of sis) assert.ok(aArxiu(arrel, n) && !aTaula(arrel, n), n);
  const taula = olivera.checkTaula(arrel);
  assert.deepEqual(taula.errors, []);
  assert.deepEqual(olivera.ancoratge(arrel), { senseAncora: [], fantasma: [] });
  assert.equal(olivera.vius(arrel).size, 0, '«Activitat en curs» ja no llista cap arxivat');
  for (const n of sis) assert.match(index(arrel), new RegExp(`\\[\\[\\.\\./90_arxiu_historic/${sense(n)}\\]\\]`), `${n}: àncora cap a l'arxiu`);
  assert.match(index(arrel), new RegExp(`## ${olivera.SECCIO_ARXIVATS}\\n\\n- \\[\\[\\.\\./90_arxiu_historic/${sense(g)}\\]\\]`), 'els que només eren vius queden ancorats a la secció dels arxivats');
});

/* ── 2. Categories ────────────────────────────────────────────────────────── */

test('D1 invertit: per nom ix qualsevol categoria taxonòmica, els errors de noms ixen tots junts, i les categories fora del catàleg són un avís', (t) => {
  if (salta(t)) return;
  const noms = ['visio_x', 'brainstorming_x', 'estudi_x', 'planificacio_x'].map((c) => `${VELL}_0900_${c}.md`);
  const arrel = mas(t, ['# Índex', '', '## Altres', '', ...noms.map((n) => `- [[${sense(n)}]]`), '']);
  for (const n of noms) posa(arrel, n);
  const taula = olivera.checkTaula(arrel);
  assert.equal(taula.valid, true, 'cap error: AGENTS §0.1 només exigix arxivar els de torn consumits');
  const avisos = taula.avisos.join('\n');
  assert.match(avisos, /Categoria fora de tooling\/wiki\/taxonomia\.json: .*«planificacio».*«visio»/);
  assert.doesNotMatch(avisos.split('\n')[0], /«brainstorming»|«estudi»/);
  assert.match(avisos, /De jornades anteriors, fora de les categories de torn/);
  for (const n of noms) assert.deepEqual(olivera.arxivables(arrel, { noms: [n] }).map((d) => d.nom), [n]);
  const informe = porta(arrel, []);
  assert.equal(informe.status, 0);
  assert.match(informe.stdout, /⚠️ Categoria fora/);

  const abans = index(arrel);
  let error = null;
  assert.throws(() => olivera.arxiva(arrel, { noms: [noms[0], `02_investigacio_ia/${VELL}_0900_prompt_lab.md`, `${DIA}_9999_prompt_inexistent.md`] }), (e) => { error = e; return true; });
  assert.equal(error.codi, 2);
  assert.equal(error.errors.length, 2, error.message);
  assert.match(error.message, /2 noms no es poden arxivar; no s'ha mogut res/);
  for (const n of noms) assert.ok(aTaula(arrel, n), `${n}: un nom dolent no en mou cap`);
  assert.equal(index(arrel), abans);
});

/* ── 3. Àncores ───────────────────────────────────────────────────────────── */

test('D3 invertit: una àncora amb «.md» o amb «#secció» ancora i declara viu el document, i no és fantasma', (t) => {
  if (salta(t)) return;
  const a = `${VELL}_0900_prompt_a.md`;
  const b = `${VELL}_0905_auditoria_b.md`;
  const arrel = mas(t, ['# Índex', '', '## Activitat en curs', '', `- [[${a}]]`, `- [[${sense(b)}#T6]]`, '']);
  posa(arrel, a); posa(arrel, b);
  assert.deepEqual([...olivera.vius(arrel)].sort(), [sense(a), sense(b)]);
  assert.deepEqual(olivera.ancoratge(arrel), { senseAncora: [], fantasma: [] });
  assert.equal(olivera.checkTaula(arrel).valid, true);
});

test('D4 invertit: --arxiva reapunta les àncores en taula, prosa i «*», i no s’emporta l’àncora d’un altre document', (t) => {
  if (salta(t)) return;
  // D'avui: E es queda a la taula i no ha de caure per ranci, sinó només si perdera l'àncora.
  const [A, B, C, D, E] = ['a', 'b', 'c', 'd', 'e'].map((x) => `${DIA}_0900_auditoria_${x}.md`);
  const arrel = mas(t, [
    '# Índex', '', '## Treball', '',
    '| Document | Estat |', '| --- | --- |', `| [[${sense(A)}]] | consumit |`, '',
    `Vegeu també [[${sense(B)}]] per al context.`, '',
    `* [[${sense(C)}]]`, '',
    `- [[${sense(D)}]] · [[${sense(E)}]]`, ''
  ]);
  for (const n of [A, B, C, D, E]) posa(arrel, n);
  const r = olivera.arxiva(arrel, { noms: [A, B, C, D] });
  assert.equal(r.moguts.filter((m) => m.nota === 'mogut').length, 4);
  assert.deepEqual(olivera.ancoratge(arrel), { senseAncora: [], fantasma: [] });
  assert.equal(olivera.checkTaula(arrel).valid, true, 'just després d’un --arxiva, la porta continua verda');
  const text = index(arrel);
  for (const linia of [
    `| [[../90_arxiu_historic/${sense(A)}]] | consumit |`,
    `Vegeu també [[../90_arxiu_historic/${sense(B)}]] per al context.`,
    `* [[../90_arxiu_historic/${sense(C)}]]`,
    `- [[../90_arxiu_historic/${sense(D)}]] · [[${sense(E)}]]`,
  ]) assert.ok(text.split('\n').includes(linia), linia);
});

/* ── 4. Col·lisió i arrel ─────────────────────────────────────────────────── */

test('D5 invertit: una col·lisió amb l’arxiu no mou res, no toca l’índex, ho diu amb el remei i ix amb 1', (t) => {
  if (salta(t)) return;
  const x = `${VELL}_0900_auditoria_repetida.md`;
  const y = `${VELL}_0905_auditoria_neta.md`;
  const arrel = mas(t, ['# Índex', '', `- [[${sense(x)}]]`, `- [[${sense(y)}]]`, '']);
  posa(arrel, x); posa(arrel, y);
  fs.mkdirSync(path.join(arrel, ARXIU), { recursive: true });
  fs.writeFileSync(path.join(arrel, ARXIU, x), '# versió anterior\n');
  const abans = index(arrel);

  const sec = porta(arrel, ['--arxiva', '--sec', '--nom', x, '--nom', y]);
  assert.equal(sec.status, 0, sec.stderr);
  assert.match(sec.stdout, /col·lisió/);

  const p = porta(arrel, ['--arxiva', '--nom', x, '--nom', y]);
  assert.equal(p.status, 1, `${p.stdout}${p.stderr}`);
  assert.match(p.stderr, /Col·lisió amb l'arxiu: .*ja existix\. No s'ha mogut res/);
  assert.match(p.stderr, /Mestre/);
  assert.ok(aTaula(arrel, x) && aTaula(arrel, y), 'el lot sencer espera la decisió');
  assert.equal(index(arrel), abans);
  assert.equal(llig(path.join(arrel, ARXIU, x)), '# versió anterior\n', 'l’arxiu no se sobreescriu mai');
  assert.throws(() => olivera.arxiva(arrel, { noms: [x] }), (e) => e.codi === 1 && e.colisions.includes(x));
});

test('D6 invertit: l’arrel no és el cwd; des d’una subcarpeta i sense SDP_ARREL la porta veu l’Escriptori de l’arrel', (t) => {
  if (salta(t)) return;
  if (!ARBRE) {
    // Paquet aplicat: es comprova sobre el repositori real sense tocar res (només informe).
    const r = spawnSync(process.execPath, [PORTA], { cwd: path.join(REPO, '_wiki_de_poble'), env: senseArrel(), encoding: 'utf8', timeout: 30000 });
    assert.ok(r.stdout.includes(fs.realpathSync(REPO)), r.stdout);
    return;
  }
  const x = `${VELL}_0900_auditoria_rancia.md`;
  fs.mkdirSync(path.join(ARBRE, DESK), { recursive: true });
  fs.writeFileSync(path.join(ARBRE, INDEX), `# Índex\n\n- [[${sense(x)}]]\n`);
  fs.writeFileSync(path.join(ARBRE, DESK, x), '# prova\n');
  t.after(() => {
    fs.rmSync(path.join(ARBRE, DESK), { recursive: true, force: true });
    fs.rmSync(path.join(ARBRE, ARXIU), { recursive: true, force: true });
  });
  const cwd = path.join(ARBRE, '_wiki_de_poble');
  const inf = spawnSync(process.execPath, [PORTA], { cwd, env: senseArrel(), encoding: 'utf8', timeout: 30000 });
  assert.equal(inf.status, 1, 'la taula de l’arrel està bruta i la porta ho diu');
  assert.match(inf.stdout, /Escriptori: 1 documents solts/);
  assert.ok(inf.stdout.includes(`Arrel jutjada: ${ARBRE}`), inf.stdout);
  const sec = spawnSync(process.execPath, [PORTA, '--arxiva', '--sec', '--nom', x], { cwd, env: senseArrel(), encoding: 'utf8', timeout: 30000 });
  assert.equal(sec.status, 0, sec.stderr);
  assert.match(sec.stdout, /simulació: es mouria/);
});

/* ── 5. Relleu dels torns en el mateix acte ───────────────────────────────── */

test('D7 invertit: --arxiva fa el relleu, i l’àncora cap a l’arxiu val alhora per a la Porta Olivera i per al torn', (t) => {
  if (salta(t)) return;
  const root = fixture(t);
  const d = ajuda.validDoc(root, { suffix: 'consumida' });
  ajuda.writeDoc(root, d);
  const nom = path.basename(d.file);
  const desti = `${ARXIU}/${nom}`;

  const r = olivera.arxiva(root, { noms: [nom] });
  assert.deepEqual(r.moguts.map((m) => m.nota), ['mogut']);
  assert.deepEqual(r.moguts[0].relleu, { relleuats: [{ id: d.turn.turn_id, receipts: 1, plan: false, planModificat: false }], historics: [] });
  const errors = torns.checkTurn(root, d.turn.turn_id).errors;
  assert.ok(!errors.some((e) => e.startsWith('Document eliminat sense relleu')), errors.join('\n'));
  assert.ok(!errors.includes(`Document sense àncora: ${desti}`), errors.join('\n'));
  assert.ok(!errors.some((e) => e.startsWith(`${desti}:`)), `el document arxivat continua vàlid per al seu torn:\n${errors.join('\n')}`);
  assert.deepEqual(olivera.checkTaula(root).errors, []);
  assert.ok(index(root).includes(`[[../90_arxiu_historic/${sense(nom)}]]`));
  const rec = JSON.parse(registre(root, d.turn.turn_id));
  assert.ok(Object.values(rec.receipts).every((x) => x.file === desti));
  assert.deepEqual(rec.relocated, [d.file]);

  // anchored: el camí ha de dur on viu el fitxer; el nom pla continua valent.
  assert.equal(nucli.anchored(`- [[../90_arxiu_historic/${sense(nom)}]]`, desti), true);
  assert.equal(nucli.anchored(`- [[90_arxiu_historic/${sense(nom)}|àlies]]`, desti), true);
  assert.equal(nucli.anchored(`- [[${nom}]]`, d.file), true, '«.md» a l’àncora');
  assert.equal(nucli.anchored(`- [[../10_actes/${sense(nom)}]]`, desti), false, 'un camí que no du al fitxer no ancora');
  assert.equal(nucli.anchored(`\`[[../90_arxiu_historic/${sense(nom)}]]\``, desti), false, 'dins de codi no és una àncora');
});

test('D8, O15 i O19 invertits: el relleu reapunta tots els rebuts duplicats i el pla vinculat per un altre torn', (t) => {
  if (salta(t)) return;
  const root = fixture(t);
  const plaDoc = ajuda.validDoc(root, { route: 'pla.implementacio', suffix: 'pla_maria' });
  ajuda.writeDoc(root, plaDoc);
  const codex = ajuda.validDoc(root, { suffix: 'codex' });
  ajuda.writeDoc(root, codex);
  torns.bindPlan(root, codex.turn.turn_id, plaDoc.file);
  // `document.mjs context` cridat dues vegades per al mateix camí: dos rebuts del mateix fitxer.
  torns.deliverContext(root, plaDoc.turn.turn_id, { route: 'pla.implementacio', file: plaDoc.file });
  const nom = path.basename(plaDoc.file);
  const desti = `${ARXIU}/${nom}`;

  const r = olivera.arxiva(root, { noms: [nom] });
  const fets = Object.fromEntries(r.moguts[0].relleu.relleuats.map((x) => [x.id, [x.receipts, x.plan]]));
  assert.deepEqual(fets, { [plaDoc.turn.turn_id]: [2, false], [codex.turn.turn_id]: [0, true] });
  const maria = torns.checkTurn(root, plaDoc.turn.turn_id).errors;
  assert.ok(!maria.some((e) => e.startsWith('Document eliminat sense relleu')), maria.join('\n'));
  const deCodex = torns.checkTurn(root, codex.turn.turn_id).errors;
  assert.ok(!deCodex.some((e) => e.startsWith('Pla absent o modificat')), deCodex.join('\n'));
  assert.ok(Object.values(JSON.parse(registre(root, plaDoc.turn.turn_id)).receipts).every((x) => x.file === desti));
  assert.equal(JSON.parse(registre(root, codex.turn.turn_id)).plan.file, desti);
});

test('O15 i D8 per la via de handoff: després d’un trasllat a mà, handoff reapunta tots els rebuts i el pla vinculat amb el hash contrastat', (t) => {
  if (salta(t)) return;
  const root = fixture(t);
  const plaDoc = ajuda.validDoc(root, { route: 'pla.implementacio', suffix: 'pla_maria' });
  ajuda.writeDoc(root, plaDoc);
  const codex = ajuda.validDoc(root, { suffix: 'codex' });
  ajuda.writeDoc(root, codex);
  torns.bindPlan(root, codex.turn.turn_id, plaDoc.file);
  torns.deliverContext(root, plaDoc.turn.turn_id, { route: 'pla.implementacio', file: plaDoc.file });
  const nom = path.basename(plaDoc.file);
  const desti = `${ARXIU}/${nom}`;
  fs.mkdirSync(path.join(root, ARXIU), { recursive: true });
  fs.renameSync(path.join(root, plaDoc.file), path.join(root, desti));

  // El missatge del tancament diu l'ordre exacta, amb el destí real.
  const abans = torns.checkTurn(root, plaDoc.turn.turn_id).errors.find((e) => e.startsWith('Document eliminat sense relleu'));
  assert.equal(abans, `Document eliminat sense relleu: ${plaDoc.file}. És a ${desti}: registra el relleu amb node tooling/wiki/document.mjs handoff --turn-id ${plaDoc.turn.turn_id} --file ${plaDoc.file} --to ${desti}`);
  assert.ok(torns.checkTurn(root, codex.turn.turn_id).errors.some((e) => e.startsWith(`Pla absent o modificat: ${plaDoc.file}. És a ${desti}`)));

  // Relleu a mitges, com el deixa la versió instal·lada el 261002 (només el rebut del reflex, amb el seu `moves`): el nou el completa.
  relleuInstallat(root, plaDoc.turn.turn_id, plaDoc.file, desti);
  const aMitges = JSON.parse(registre(root, plaDoc.turn.turn_id));
  assert.equal(Object.values(aMitges.receipts).filter((x) => x.file === plaDoc.file).length, 1, 'queda el duplicat a l’origen');
  torns.handoffDocument(root, plaDoc.turn.turn_id, plaDoc.file, desti);
  assert.ok(Object.values(JSON.parse(registre(root, plaDoc.turn.turn_id)).receipts).every((x) => x.file === desti), 'els dos rebuts');
  assert.ok(!torns.checkTurn(root, plaDoc.turn.turn_id).errors.some((e) => e.startsWith('Document eliminat sense relleu')));
  torns.handoffDocument(root, codex.turn.turn_id, plaDoc.file, desti);
  assert.ok(!torns.checkTurn(root, codex.turn.turn_id).errors.some((e) => e.startsWith('Pla absent o modificat')));
  assert.throws(() => torns.handoffDocument(root, codex.turn.turn_id, plaDoc.file, desti), /Rebut del relleu absent/, 'un relleu no es registra dues vegades');

  // relocatePlan exigix el mateix contingut que es va vincular.
  const altre = fixture(t);
  const p2 = ajuda.validDoc(altre, { route: 'pla.implementacio', suffix: 'pla_dos' });
  ajuda.writeDoc(altre, p2);
  const c2 = ajuda.validDoc(altre, { suffix: 'codex_dos' });
  ajuda.writeDoc(altre, c2);
  torns.bindPlan(altre, c2.turn.turn_id, p2.file);
  const d2 = `${ARXIU}/${path.basename(p2.file)}`;
  fs.mkdirSync(path.join(altre, ARXIU), { recursive: true });
  fs.renameSync(path.join(altre, p2.file), path.join(altre, d2));
  fs.appendFileSync(path.join(altre, d2), '\nretocat després de vincular-lo\n');
  assert.throws(() => torns.relocatePlan(altre, c2.turn.turn_id, p2.file, d2), /Pla modificat durant el relleu/);
});

test('si el relleu falla, el document torna a la taula, cap torn canvia i la CLI ix amb 2', (t) => {
  if (salta(t)) return;
  const root = fixture(t);
  const plaDoc = ajuda.validDoc(root, { route: 'pla.implementacio', suffix: 'pla_bloquejat' });
  ajuda.writeDoc(root, plaDoc);
  const codex = ajuda.validDoc(root, { suffix: 'codex_ocupat' });
  ajuda.writeDoc(root, codex);
  torns.bindPlan(root, codex.turn.turn_id, plaDoc.file);
  const nom = path.basename(plaDoc.file);
  const pany = path.join(root, '.agents/runtime/turns', `${codex.turn.turn_id}.json.lock`);
  fs.writeFileSync(pany, '');
  const abans = { maria: registre(root, plaDoc.turn.turn_id), codex: registre(root, codex.turn.turn_id), index: index(root) };

  let error = null;
  assert.throws(() => olivera.arxiva(root, { noms: [nom] }), (e) => { error = e; return true; });
  assert.equal(error.codi, 2);
  assert.match(error.message, /Relleu de .* fallit .*el document torna a la taula i cap torn s'ha modificat/);
  assert.ok(aTaula(root, nom) && !aArxiu(root, nom));
  assert.equal(registre(root, plaDoc.turn.turn_id), abans.maria, 'el torn que sí que es podia escriure no queda a mitges');
  assert.equal(registre(root, codex.turn.turn_id), abans.codex);
  assert.equal(index(root), abans.index);

  const cli = porta(root, ['--arxiva', '--nom', nom]);
  assert.equal(cli.status, 2, cli.stdout);
  assert.match(cli.stderr, /fallit/);
  assert.ok(aTaula(root, nom));

  fs.unlinkSync(pany);
  assert.deepEqual(olivera.arxiva(root, { noms: [nom] }).moguts.map((m) => m.nota), ['mogut'], 'sense el pany, el mateix acte passa');
});

test('--arxiva --sec és l’Acte Reflex Pre-Arxivament mecànic: diu quins torns, quines línies d’ESTAT, quins laboratoris i quins documents el citen, i no toca res', (t) => {
  if (salta(t)) return;
  const root = fixture(t);
  const d = ajuda.validDoc(root, { suffix: 'citada' });
  ajuda.writeDoc(root, d);
  const nom = path.basename(d.file);
  fs.appendFileSync(path.join(root, '.agents/ESTAT.md'), `\n- Pendent: passar [[${sense(nom)}]] a Codex.\n`);
  const lab = `${DESK}/02_investigacio_ia/261002_0000_lab_prova/prepara-pla.mjs`;
  fs.mkdirSync(path.dirname(path.join(root, lab)), { recursive: true });
  fs.writeFileSync(path.join(root, lab), `export const PLA = '${DESK}/${nom}';\n`);
  const veí = '260922_0400_prompt_codex_prova.md';
  posa(root, veí, `# Prompt\n\nLlig [[${sense(nom)}]] abans de començar.\n`);
  fs.appendFileSync(path.join(root, INDEX), `\n- [[${sense(veí)}]]\n`);
  const abans = { torn: registre(root, d.turn.turn_id), index: index(root) };

  const r = olivera.arxiva(root, { noms: [nom], sec: true });
  const ref = r.moguts[0].referencies;
  assert.deepEqual(ref.torns.map((c) => [c.id, c.viu, c.rebuts, c.pla]), [[d.turn.turn_id, true, 1, false]]);
  assert.ok(ref.estat.length === 1 && ref.estat[0].startsWith('.agents/ESTAT.md:'), ref.estat.join(', '));
  assert.deepEqual(ref.laboratoris, [lab]);
  assert.deepEqual(ref.documents, [veí]);
  assert.ok(aTaula(root, nom));
  assert.equal(registre(root, d.turn.turn_id), abans.torn);
  assert.equal(index(root), abans.index);

  const cli = porta(root, ['--arxiva', '--sec', '--nom', nom]);
  assert.equal(cli.status, 0, cli.stderr);
  for (const que of [new RegExp(`torns: ${d.turn.turn_id} \\(viu, 1 rebut\\)`), /ESTAT: \.agents\/ESTAT\.md:\d+/, /laboratoris: .*261002_0000_lab_prova\/prepara-pla\.mjs/, new RegExp(`taula: ${veí}`), /Acte Reflex Pre-Arxivament/]) {
    assert.match(cli.stdout, que);
  }
});

/* ── 6. Missatges amb el remei concret ────────────────────────────────────── */

test('D2 invertit: cada error de la taula porta el remei, i una àncora fantasma d’un document ja arxivat diu l’àncora i l’ordre de relleu exactes', (t) => {
  if (salta(t)) return;
  const arrel = mas(t, ['# Índex', '', `- [[${VELL}_0900_auditoria_rancia]]`, '']);
  posa(arrel, `${VELL}_0900_auditoria_rancia.md`);
  posa(arrel, `${DIA}_1200_auditoria_sense_ancora.md`);
  const errors = olivera.checkTaula(arrel).errors.join('\n');
  assert.match(errors, /Escriptori sense classificar: .*--arxiva --sec i després --arxiva/);
  assert.match(errors, /Sense àncora a l’índex: .*--arxiva --nom NOM\.md/);
  assert.match(olivera.checkOlivera(arrel).errors.join('\n'), /«aammdd_hhmm_pla_implementacio_»: un «pla_» o un «planificacio_» no compten/);

  const root = fixture(t);
  const d = ajuda.validDoc(root, { suffix: 'moguda_a_ma' });
  ajuda.writeDoc(root, d);
  const nom = path.basename(d.file);
  fs.mkdirSync(path.join(root, ARXIU), { recursive: true });
  fs.renameSync(path.join(root, d.file), path.join(root, ARXIU, nom));
  const fantasma = olivera.checkTaula(root).errors.find((e) => e.startsWith('Àncores a documents absents'));
  assert.ok(fantasma.includes(`l'àncora és [[../90_arxiu_historic/${sense(nom)}]]`), fantasma);
  assert.ok(fantasma.includes(`node tooling/wiki/document.mjs handoff --turn-id ${d.turn.turn_id} --file ${d.file} --to ${ARXIU}/${nom}`), fantasma);
  assert.throws(() => olivera.arxivables(root, { noms: [nom] }), /ja és a _wiki_de_poble\/90_arxiu_historic\/ i no a la taula: el trasllat ja està fet/);
  const informe = porta(root, []);
  assert.equal(informe.status, 1);
  assert.ok(informe.stdout.includes(`--turn-id ${d.turn.turn_id}`), informe.stdout);
});

/* ── 7. Hooks ─────────────────────────────────────────────────────────────── */

test('D9 invertit: Claude i Codex poden observar, simular, verificar el tancament i fer el relleu dels seus documents; moure continua sent de MarIA', (t) => {
  if (salta(t)) return;
  const root = fixture(t);
  for (const file of [...context.SOURCES, 'tooling/wiki/document.mjs', 'tooling/gates/obrir_torn.mjs']) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.copyFileSync(path.join(BASE, file), path.join(root, file));
  }
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ scripts: {
    'porta:olivera': 'node tooling/gates/porta-olivera.mjs --informe',
    'olivera:arxiva': 'node tooling/gates/porta-olivera.mjs --arxiva',
    'porta:orfandat': 'node tooling/gates/tractor-orfandat.mjs',
  } }));
  const d = ajuda.validDoc(root, { suffix: 'de_claude' });
  ajuda.writeDoc(root, d);
  const nom = path.basename(d.file);
  const id = d.turn.turn_id;
  const bash = (command) => ({ hook_event_name: 'PreToolUse', tool_name: 'Bash', cwd: root, tool_input: { command } });
  const codi = (command) => local.checkLocal(bash(command), root).code;

  for (const ordre of [
    'node tooling/gates/porta-olivera.mjs',
    'node tooling/gates/porta-olivera.mjs --informe',
    'node tooling/gates/porta-olivera.mjs --arxiva --sec',
    `node tooling/gates/porta-olivera.mjs --arxiva --sec --nom ${nom}`,
    `node tooling/gates/porta-olivera.mjs --arxiva --sec --nom ${d.file}`,
    'npm run porta:orfandat',
    `node tooling/gates/tancament.mjs --check --turn-id ${id}`,
  ]) assert.equal(codi(ordre), 0, ordre);
  for (const ordre of [
    `node tooling/gates/porta-olivera.mjs --arxiva --nom ${nom}`,
    'node tooling/gates/porta-olivera.mjs --arxiva',
    'npm run olivera:arxiva',
    `node tooling/gates/tancament.mjs --close --turn-id ${id}`,
    `node tooling/gates/tancament.mjs --check --turn-id ${id} --close`,
    `node tooling/gates/porta-olivera.mjs --arxiva --sec --nom ${nom} && rm ${d.file}`,
  ]) assert.equal(codi(ordre), 2, ordre);

  // handoff: el relleu d'un trasllat ja fet, amb els límits d'own.
  const desti = `${ARXIU}/${nom}`;
  const handoff = `node tooling/wiki/document.mjs handoff --turn-id ${id} --file ${d.file} --to ${desti}`;
  assert.equal(codi(handoff), 2, 'mentre l’origen existix no hi ha trasllat a registrar');
  fs.mkdirSync(path.join(root, ARXIU), { recursive: true });
  fs.renameSync(path.join(root, d.file), path.join(root, desti));
  const r = local.checkLocal(bash(handoff), root);
  assert.equal(r.code, 0, r.errors?.join('\n'));
  assert.equal(r.authority.command, 'handoff');
  assert.equal(r.authority.to, desti);
  const alie = `${DESK}/260922_0300_auditoria_alie.md`;
  assert.equal(codi(`node tooling/wiki/document.mjs handoff --turn-id ${id} --file ${alie} --to ${ARXIU}/260922_0300_auditoria_alie.md`), 2, 'només documents del mateix torn');
  assert.equal(codi(`node tooling/wiki/document.mjs handoff --turn-id ${id} --file ${d.file} --to ${DESK}/01_produccio/${nom}`), 2, 'mai cap a la zona humana');
  assert.equal(codi(`node tooling/wiki/document.mjs handoff --turn-id ${id} --file ${d.file}`), 2, 'sense destí no hi ha relleu');
});

test('D10 i O10 invertits: el hook d’Antigravity força la pregunta davant de tot trasllat a mà i aprova sola la via canònica', (t) => {
  if (salta(t)) return;
  const root = path.join(os.tmpdir(), 'sdp-mas-fals-261002');
  const doc = `${DESK}/${DIA}_0310_visio_arquitectonica_expansio.md`;
  const run = (CommandLine, extra = {}) => hook.preTool({ toolCall: { name: 'run_command', args: { CommandLine, ...extra } } }, { root }).decision;
  const escriu = (rel) => hook.preTool({ toolCall: { name: 'write_to_file', args: { TargetFile: path.join(root, rel), CodeContent: 'x' } } }, { root }).decision;
  assert.equal(run(`node tooling/gates/porta-olivera.mjs --arxiva --sec --nom ${path.basename(doc)}`), 'allow');
  assert.equal(run(`node tooling/gates/porta-olivera.mjs --arxiva --nom ${path.basename(doc)}`), 'allow');
  assert.equal(run(`node tooling/wiki/document.mjs handoff --turn-id torn_00000000-0000-4000-8000-000000000000 --file ${doc} --to ${ARXIU}/${path.basename(doc)}`), 'allow');
  for (const ordre of [`mv ${doc} ${ARXIU}/`, `git mv ${doc} ${ARXIU}/`, `rm ${doc}`, `cp ${doc} ${ARXIU}/ && rm ${doc}`, `/bin/mv ${doc} ${ARXIU}/`,
    `node tooling/gates/porta-olivera.mjs --arxiva --nom ${path.basename(doc)} && rm ${doc}`]) {
    assert.equal(run(ordre), 'force_ask', ordre);
  }
  // O17: la còpia per shell del laboratori de fatiga a tooling/ i l'escriptura de governança amb eina.
  assert.equal(run('cp _wiki_de_poble/04_escriptori/02_investigacio_ia/261002_1510_tractor_fatiga_claude/nous/tooling/gates/fatiga-hook.mjs tooling/gates/'), 'force_ask');
  for (const rel of ['tooling/gates/fatiga-hook.mjs', '.agents/skills/core-higiene-escriptori/SKILL.md', 'AGENTS.md']) assert.equal(escriu(rel), 'force_ask', rel);
  assert.equal(escriu('.agents/ESTAT.md'), 'ask', 'el relleu de cada torn només pregunta');
});

test('procés: el hook real força la pregunta, ho deixa a la traça amb l’ordre i amb els secrets emmascarats', (t) => {
  if (salta(t)) return;
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-olivera-arxiva-hook-')));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  fs.mkdirSync(path.join(arrel, '.agents/runtime'), { recursive: true });
  fs.mkdirSync(path.join(arrel, DESK), { recursive: true });
  fs.writeFileSync(path.join(arrel, '.agents/AGENTS.md'), '# BIOS de prova\n');
  fs.writeFileSync(path.join(arrel, INDEX), '# Índex\n');
  const executa = (CommandLine) => {
    const r = spawnSync(process.execPath, [HOOK, 'pre-tool'], { cwd: arrel, env: { ...process.env, SDP_ARREL: arrel }, input: JSON.stringify({ toolCall: { name: 'run_command', args: { CommandLine } } }), encoding: 'utf8', timeout: 30000 });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim());
  };
  assert.equal(executa(`API_TOKEN=valor-secret-9 mv ${DESK}/a.md ${ARXIU}/`).decision, 'force_ask');
  assert.equal(executa('node tooling/gates/porta-olivera.mjs --arxiva --sec').decision, 'allow');
  const traca = llig(path.join(arrel, hook.TRACA)).trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(traca.map((l) => l.decisio), ['force_ask', 'allow']);
  assert.equal(traca[0].ordre, `API_TOKEN=*** mv ${DESK}/a.md ${ARXIU}/`);
  assert.ok(!llig(path.join(arrel, hook.TRACA)).includes('valor-secret-9'));
});

/* ── 8. La petorreta només jutja la taula mentre naix ─────────────────────── */

test('D11 invertit: editar una petorreta ja nascuda no la bloqueja un document nou d’un altre agent; mentre naix, la taula sí que es jutja', (t) => {
  if (salta(t)) return;
  const plaNom = `${DIA}_1650_pla_implementacio_massiva_claude.md`;
  const prompt = `${DIA}_1650_prompt_claude_massiu.md`;
  const arrel = mas(t, ['# Índex', '', '## Activitat en curs', '', `- [[${sense(plaNom)}]]`, `- [[${sense(prompt)}]]`, '']);
  posa(arrel, plaNom);
  const nascut = '# Prompt\n\n## 0. Preflight\n\n- [x] Escriptori net\n';
  posa(arrel, prompt, nascut);
  const aliena = `${DIA}_1700_auditoria_claude.md`;
  posa(arrel, aliena);
  const edicio = (content) => ({ tool_name: 'Write', tool_input: { file_path: path.join(arrel, DESK, prompt), content } });

  assert.equal(olivera.nascuda(arrel, `${DESK}/${prompt}`), true);
  assert.deepEqual(olivera.checkPayload(edicio(`${nascut}\nAfegit després.\n`), arrel), { code: 0, errors: [], file: `${DESK}/${prompt}` });
  const desmarcada = olivera.checkPayload(edicio('# Prompt\n\n## 0. Preflight\n\n- [ ] Escriptori net\n'), arrel);
  assert.equal(desmarcada.code, 2, 'la secció 0 s’ha de conservar completa');
  assert.match(desmarcada.errors.join('\n'), /caselles sense marcar/);

  // Tal com la deixa `document.mjs create`, amb les caselles per marcar: encara naix i la taula es jutja.
  posa(arrel, prompt, '# Prompt\n\n## 0. Preflight\n\n- [ ] Escriptori net\n');
  const naixent = olivera.checkPayload(edicio(nascut), arrel);
  assert.equal(naixent.code, 2);
  assert.match(naixent.errors.join('\n'), new RegExp(`Sense àncora a l’índex: ${aliena}`));
  // I una de nova, igual.
  const nova = olivera.checkPayload({ tool_name: 'Write', tool_input: { file_path: path.join(arrel, DESK, `${DIA}_1710_prompt_codex_nou.md`), content: nascut } }, arrel);
  assert.equal(nova.code, 2);
  assert.match(nova.errors.join('\n'), /Sense àncora/);
});

/* ── 9. Plantilla viva: noms parany i el prefix al missatge ───────────────── */

test('O13 invertit: un nom planificacio_* es vigila, i el missatge diu el prefix pla_implementacio_ en lloc de la id de la ruta', (t) => {
  if (salta(t)) return;
  assert.equal(viva.vigilat(`${DIA}_1635_planificacio_claude.md`), true);
  assert.equal(viva.vigilat(`${DIA}_0310_visio_arquitectonica_expansio.md`), false);
  assert.match(viva.suggeriment(`${DIA}_1635_planificacio_claude.md`), /«planificacio» és l'identificador d'una ruta, no una categoria: el nom ha de començar per «aammdd_hhmm_pla_implementacio_…» o «aammdd_hhmm_pla_…»/);

  const root = fixture(t);
  const turn = torns.openTurn(root, { scope: 'documents', actor: 'prova' });
  const escriu = (file) => {
    const delivery = torns.deliverContext(root, turn.turn_id, { route: 'pla.implementacio', file });
    const content = documentCli.draft(delivery, { title: 'Pla de prova', description: 'Pla per a provar els noms parany' }).replaceAll('[pendent]', 'Verificat.');
    return viva.inspeccionaText(root, file, content).errors;
  };
  const parany = escriu(`${DESK}/260922_1635_planificacio_claude.md`);
  assert.ok(parany.some((e) => e === 'nom: «planificacio» és l\'identificador d\'una ruta, no una categoria: per a la ruta «pla.implementacio» el nom ha de començar per «aammdd_hhmm_pla_implementacio_…»'), parany.join('\n'));
  const pla = escriu(`${DESK}/260922_1636_pla_claude.md`);
  assert.ok(pla.some((e) => e === 'ruta: el rebut és de la ruta «pla.implementacio», i un nom «pla_…» és de la ruta «planificacio». Per a «pla.implementacio» el nom ha de començar per «aammdd_hhmm_pla_implementacio_…»'), pla.join('\n'));
  assert.ok(![...parany, ...pla].some((e) => /el nom demana/.test(e)), 'cap missatge nomena la ruta com si fóra una categoria');
  assert.deepEqual(escriu(`${DESK}/260922_1637_pla_implementacio_claude.md`), [], 'el nom bo passa');
});

/* ── 10. En una còpia de tooling/ amb el paquet ───────────────────────────── */

/** Proves que entren amb el paquet (nous/tests) i guardes existents que importen els fitxers que canvien. */
const GUARDES = ['tests/sistema_nervios.test.mjs', 'tests/tractor-fortification.test.mjs', 'tests/hooks-local.test.mjs',
  'tests/document-command-policy.test.mjs', 'tests/documental.test.mjs', 'tests/porta-reflex.test.mjs', 'tests/security-chain.test.mjs'];

test('en la còpia de tooling/ amb el paquet passen les proves que viatgen amb ell i les guardes que l’importen', { timeout: 900000 }, (t) => {
  if (salta(t, { nomesLab: true })) return;
  const noves = fitxersDe(path.join(NOUS, 'tests')).map((f) => `tests/${f}`);
  assert.deepEqual(noves, ['tests/antigravity-hook.test.mjs', 'tests/porta-olivera-diagnosi.test.mjs', 'tests/porta-olivera-v3.test.mjs']);
  for (const f of noves) fs.copyFileSync(path.join(NOUS, f), path.join(ARBRE, f));
  for (const f of GUARDES) fs.copyFileSync(path.join(REPO, f), path.join(ARBRE, f));
  const env = { ...process.env };
  delete env.SDP_ARREL;
  delete env.CLAUDE_PROJECT_DIR;
  // Sense açò, el `node --test` fill parlaria el protocol intern del pare i no l'informe.
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...noves, ...GUARDES], { cwd: ARBRE, env, encoding: 'utf8', timeout: 880000, maxBuffer: 64 * 1024 * 1024 });
  // Només la part que diu què ha caigut: la sencera tapa la resta de l'informe del corredor.
  const caigudes = r.stdout.indexOf('✖ failing tests');
  const informe = `${caigudes >= 0 ? r.stdout.slice(caigudes, caigudes + 6000) : r.stdout.slice(-1500)}\n${r.stderr.slice(-1500)}`;
  assert.equal(r.status, 0, informe);
  assert.match(r.stdout, /ℹ fail 0/, informe);
  const passades = Number(/ℹ pass (\d+)/.exec(r.stdout)?.[1] ?? 0);
  const saltades = Number(/ℹ skipped (\d+)/.exec(r.stdout)?.[1] ?? 0);
  t.diagnostic(`${passades} proves passades i ${saltades} saltades a la còpia de tooling/`);
  assert.ok(passades >= 100, `només ${passades} proves passades:\n${informe}`);
});

/* ── 11. Generador del pla ────────────────────────────────────────────────── */

test('prepara-pla: fitxers contrastats amb el commit base, pla que l’executor accepta i Petorreta que el seal accepta', async (t) => {
  if (salta(t, { nomesLab: true })) return;
  assert.deepEqual(pla.fitxersNous().map((f) => f.ruta), [
    '.agents/skills/core-desbloqueig-portes/SKILL.md', '.agents/skills/core-higiene-escriptori/SKILL.md',
    'tests/antigravity-hook.test.mjs', 'tests/porta-olivera-diagnosi.test.mjs', 'tests/porta-olivera-v3.test.mjs',
    'tooling/documental/command-policy.mjs', 'tooling/documental/core.mjs', 'tooling/documental/turns.mjs',
    'tooling/gates/antigravity-hook.mjs', 'tooling/gates/mutation-policy.mjs', 'tooling/gates/porta-olivera.mjs', 'tooling/gates/porta-plantilla-viva.mjs',
  ]);
  // La diagnosi encara no és a cap commit: el sha fixat ha de ser el del fitxer d'ara.
  assert.equal(sha(fs.readFileSync(path.join(REPO, 'tests/porta-olivera-diagnosi.test.mjs'))), pla.SENSE_BASE['tests/porta-olivera-diagnosi.test.mjs']);
  const estat = pla.estat(REPO);
  const deriva = estat.filter((f) => f.estat === 'deriva');
  assert.deepEqual(deriva.map((f) => `${f.ruta}: ${f.motiu}`), [], 'cap original ha canviat des del commit base');
  if (estat.every((f) => f.estat === 'aplicat')) { t.skip('tot és al disc sense transacció: aplicat a mà?'); return; }
  const projeccions = await pla.projeccionsDelPaquet(REPO);
  assert.deepEqual(projeccions.map((p) => [p.ruta, p.estat]), [['.agents/manifest.yaml', 'pendent'], ['.agents/skills/00_INDEX_SKILLS.md', 'pendent']]);
  assert.match(projeccions[1].contingut, /- \[\[core-desbloqueig-portes\/SKILL\|core-desbloqueig-portes\]\]: Usa-la quan una porta/);
  assert.match(projeccions[0].contingut, / {2}- skills\/core-desbloqueig-portes\/SKILL\.md/);
  const { plan, scopes, targets } = await pla.preparaPla(REPO);
  assert.equal(plan.schema, 'sdp.mutation.v1');
  assert.ok(plan.operationId.startsWith(pla.OPERACIO));
  assert.equal(plan.files.find((f) => f.path === '.agents/skills/core-desbloqueig-portes/SKILL.md')?.before, null, 'la skill nova és una alta');
  assert.ok(plan.files.filter((f) => f.path !== '.agents/skills/core-desbloqueig-portes/SKILL.md').every((f) => /^[a-f0-9]{64}$/.test(f.before)));
  for (const f of plan.files) assert.doesNotMatch(f.path, /\.md\.txt$/, 'les normes entren com a .md');
  for (const tg of targets) assert.ok(scopes.some((s) => tg === s || tg.startsWith(`${s}/`)), `${tg} fora dels scopes`);
  const petorreta = pla.construeixPetorreta({ sessio: pla.SESSIO_ZERO, intentSha256: 'a'.repeat(64), rulesSha256: 'b'.repeat(64), planSha256: pla.sha(JSON.stringify(plan)), targets });
  const { validatePetorreta } = await import(pathToFileURL(path.join(REPO, 'tooling/wiki/reflex_petorreta.mjs')).href);
  assert.deepEqual(validatePetorreta(path.join(REPO, '.sdp-reflex/bootstrap/prova', pla.NOM_PETORRETA), petorreta), []);
  assert.deepEqual(pla.sensibles(petorreta), []);
  const manifest = JSON.parse(pla.manifest());
  assert.deepEqual(manifest.sources.map((s) => s.path), [pla.LLEGIU]);
  for (const s of manifest.sources) assert.deepEqual(pla.sensibles(llig(path.join(REPO, s.path))), [], s.path);
});

test('prepara-pla no escriu res i la skill que reescriu conserva el frontmatter del catàleg', (t) => {
  if (salta(t, { nomesLab: true })) return;
  const codi = llig(path.join(LAB, 'prepara-pla.mjs'));
  assert.doesNotMatch(codi, /\b(?:writeFileSync|appendFileSync|mkdirSync|renameSync|rmSync|unlinkSync|copyFileSync|cpSync|openSync)\b/);
  const ruta = '.agents/skills/core-higiene-escriptori/SKILL.md';
  const nova = llig(path.join(NOUS, `${ruta}.txt`));
  const real = llig(path.join(REPO, ruta));
  const camps = (text) => text.slice(0, text.indexOf('\n---\n', 4)).split('\n').filter((l) => !l.startsWith('version:'));
  assert.deepEqual(camps(nova), camps(real), 'name, description i triggers no canvien: l’índex de skills només afig la nova');
  for (const pas of ['--arxiva --sec --nom FITXER.md', '--arxiva --nom FITXER.md', 'mai les lleves abans de moure', 'mai `rm`, `mv` ni `cp` a mà', 'core-desbloqueig-portes']) {
    assert.ok(nova.includes(pas), `falta «${pas}»`);
  }
  const desbloqueig = llig(path.join(NOUS, '.agents/skills/core-desbloqueig-portes/SKILL.md.txt'));
  assert.match(desbloqueig, /^---\ntype: skill\nname: core-desbloqueig-portes\n/);
  assert.match(desbloqueig, /## Lliçons del Mestre/);
  assert.match(desbloqueig, /## Vincles\n- \[\[00_INDEX_SKILLS\]\]/);
});

/* ── 12. Correccions del revisor (OLIV-R1 a OLIV-R7) ─────────────────────── */

/**
 * El relleu tal com el fa la versió instal·lada el 261002 (tooling/documental/turns.mjs,
 * handoffDocument): només el rebut que nomena el reflex del document mogut, amb el
 * seu `moves`. És l'estat «a mitges» que la versió nova ha de saber completar.
 */
function relleuInstallat(root, id, from, to) {
  const fitxer = path.join(root, '.agents/runtime/turns', `${id}.json`);
  const torn = JSON.parse(llig(fitxer));
  const contingut = llig(path.join(root, to));
  const [, idTorn, idRebut] = nucli.receiptPattern.exec(nucli.parseDocument(contingut).data.reflex);
  assert.equal(idTorn, id, 'la versió instal·lada exigix que el reflex nomene el torn');
  const rebut = torn.receipts[idRebut];
  assert.equal(rebut.file, from, 'la versió instal·lada exigix el rebut del reflex a l’origen');
  const at = new Date().toISOString();
  rebut.file = to;
  rebut.moves = [...(rebut.moves || []), { from, to, hash: sha(contingut), at }];
  if (torn.plan?.file === from) torn.plan.file = to;
  torn.ownedPaths = [...new Set([...(torn.ownedPaths || []).filter((p) => p !== from), to])];
  torn.relocated = [...(torn.relocated || []), from];
  torn.verification = null;
  torn.state = torn.plan ? 'planned' : 'context_loaded';
  torn.history.push({ state: torn.state, action: 'handoff', at });
  fs.writeFileSync(fitxer, `${JSON.stringify(torn, null, 2)}\n`);
}

test('OLIV-R1: handoff no tapa un document esborrat amb un altre document viu del mateix torn; només completa el relleu que el rebut nomenat ja va fer des de l’origen', (t) => {
  if (salta(t)) return;
  const root = fixture(t);
  // Com 742f3fa2: un document esborrat amb dos rebuts i un altre de viu, emés per al seu camí.
  const esborrat = ajuda.validDoc(root, { suffix: 'esborrada' });
  ajuda.writeDoc(root, esborrat);
  const id = esborrat.turn.turn_id;
  torns.deliverContext(root, id, { route: 'auditoria', file: esborrat.file });
  const viu = ajuda.validDoc(root, { turn: esborrat.turn, suffix: 'viva' });
  ajuda.writeDoc(root, viu);
  fs.rmSync(path.join(root, esborrat.file));
  const abans = registre(root, id);
  assert.throws(() => torns.handoffDocument(root, id, esborrat.file, viu.file), /Identitat del relleu divergent/);
  assert.equal(registre(root, id), abans, 'cap rebut reapuntat cap al document viu');
  assert.ok(torns.checkTurn(root, id).errors.some((e) => e.startsWith(`Document eliminat sense relleu: ${esborrat.file}`)), 'l’esborrat continua dient-se');

  // El relleu a mitges legítim, encara que el document haja fet dos passos (reanomenat i arxivat):
  // el rebut nomenat porta el camí sencer des de l'origen, i el duplicat el seguix.
  const cami = ajuda.validDoc(root, { suffix: 'cami' });
  ajuda.writeDoc(root, cami);
  const idCami = cami.turn.turn_id;
  torns.deliverContext(root, idCami, { route: 'auditoria', file: cami.file });
  const reanomenat = `${DESK}/260922_0300_auditoria_cami_nou.md`;
  const arxivat = `${ARXIU}/260922_0300_auditoria_cami_nou.md`;
  fs.renameSync(path.join(root, cami.file), path.join(root, reanomenat));
  relleuInstallat(root, idCami, cami.file, reanomenat);
  fs.mkdirSync(path.join(root, ARXIU), { recursive: true });
  fs.renameSync(path.join(root, reanomenat), path.join(root, arxivat));
  relleuInstallat(root, idCami, reanomenat, arxivat);
  assert.equal(Object.values(JSON.parse(registre(root, idCami)).receipts).filter((x) => x.file === cami.file).length, 1, 'queda el duplicat a l’origen');
  torns.handoffDocument(root, idCami, cami.file, arxivat);
  assert.ok(Object.values(JSON.parse(registre(root, idCami)).receipts).every((x) => x.file === arxivat), 'els dos rebuts');
});

test('OLIV-R2: un verb entre cometes o dins d’una shell niuada (sh -c, bash -c) no escapa del force_ask', (t) => {
  if (salta(t)) return;
  const root = path.join(os.tmpdir(), 'sdp-mas-fals-261002');
  const doc = `${DESK}/${DIA}_0310_visio_arquitectonica_expansio.md`;
  const run = (CommandLine) => hook.preTool({ toolCall: { name: 'run_command', args: { CommandLine } } }, { root });
  for (const ordre of [
    `sh -c 'mv ${doc} ${ARXIU}/'`,
    `'rm' ${doc}`,
    `"mv" ${doc} /tmp/`,
    'bash -c "cp /tmp/x.mjs tooling/gates/"',
    `bash -lc "rm -f ${doc}"`,
    `zsh -c 'ls ${DESK}'`,
    "sh -c 'cat .agents/hooks.json'",
  ]) assert.equal(run(ordre).decision, 'force_ask', ordre);
  assert.match(run(`sh -c 'mv ${doc} ${ARXIU}/'`).reason, /--arxiva/);
  assert.match(run('bash -c "cp /tmp/x.mjs tooling/gates/"').reason, /executor-mutacio/);
  assert.equal(run("bash -c 'npm test'").decision, 'ask', 'una shell niuada que no toca res protegit continua sense objecció');
  assert.equal(run('npm run build -- --watch').decision, 'ask');
});

test('OLIV-R3: l’aprovació del flux a la Wiki és precondició de l’open, i prepara-pla ho recorda abans de l’ordre d’open', (t) => {
  if (salta(t, { nomesLab: true })) return;
  const llegiu = llig(path.join(LAB, 'LLEGIU_PRIMER.txt'));
  const ordre = llegiu.slice(llegiu.indexOf("3. ORDRE D'APLICACIÓ"), llegiu.indexOf('4. EL LABORATORI 260930b')).replace(/\s+/g, ' ');
  const aprovacio = ordre.search(/el Mestre l'aprov[ae] des de la pàgina/);
  const pas1 = ordre.search(/ 1\. node \S+\/prepara-pla\.mjs comprova/);
  assert.ok(aprovacio !== -1 && pas1 !== -1 && aprovacio < pas1, 'la Wiki aprovada va abans de l’open (lliçó 261002 de wiki-documentacio-i-reflex)');
  assert.equal(typeof pla.liniesOpen, 'function');
  const linies = pla.liniesOpen(['tooling']);
  const crida = linies.findIndex((l) => l.includes('reflex_petorreta.mjs open'));
  const abans = linies.slice(0, Math.max(crida, 0)).join(' ');
  assert.ok(crida > 0 && /a la Wiki/.test(abans) && /el Mestre l'aprova des de la pàgina/.test(abans), linies.join('\n'));
  assert.ok(linies[crida].includes('--scope=tooling'), 'l’ordre d’open no canvia');
});

test('OLIV-R4: el remei d’un document que el torn no cita no proposa un handoff impossible; diu qui el cita i com declarar la propietat', (t) => {
  if (salta(t)) return;
  const root = fixture(t);
  // Un document d'un altre agent, sense cap torn, i un altre amb rebut d'un torn viu: tots dos a la taula abans d'obrir el torn.
  const solt = `${DESK}/260922_0200_auditoria_alie.md`;
  fs.writeFileSync(path.join(root, solt), '# document d’un altre agent\n');
  const daltre = ajuda.validDoc(root, { suffix: 'daltre' });
  ajuda.writeDoc(root, daltre);
  const propi = ajuda.validDoc(root, { suffix: 'propia' });
  ajuda.writeDoc(root, propi);
  const id = propi.turn.turn_id;
  fs.mkdirSync(path.join(root, ARXIU), { recursive: true });
  for (const f of [solt, daltre.file]) fs.renameSync(path.join(root, f), path.join(root, ARXIU, path.basename(f)));

  const errors = torns.checkTurn(root, id).errors;
  const delSolt = errors.find((e) => e.startsWith(`Document eliminat sense relleu: ${solt}.`));
  const delDaltre = errors.find((e) => e.startsWith(`Document eliminat sense relleu: ${daltre.file}.`));
  assert.ok(delSolt && delDaltre, errors.join('\n'));
  for (const e of [delSolt, delDaltre]) {
    assert.doesNotMatch(e, new RegExp(`handoff --turn-id ${id}`), 'este torn no pot fer eixe relleu');
    assert.match(e, /Este torn no el cita/);
    assert.ok(e.includes(`own --turn-id ${id}`), e);
  }
  assert.throws(() => torns.handoffDocument(root, id, solt, `${ARXIU}/${path.basename(solt)}`), /Rebut del relleu absent/, 'el que proposava el missatge vell');
  // Per al d'un altre torn viu, l'ordre exacta d'eixe torn, que sí que funciona.
  const relleu = `node tooling/wiki/document.mjs handoff --turn-id ${daltre.turn.turn_id} --file ${daltre.file} --to ${ARXIU}/${path.basename(daltre.file)}`;
  assert.ok(delDaltre.includes(relleu), delDaltre);
  torns.handoffDocument(root, daltre.turn.turn_id, daltre.file, `${ARXIU}/${path.basename(daltre.file)}`);
  // I declarar la propietat dels documents propis els trau d'este torn.
  torns.ownPaths(root, id, [propi.file]);
  assert.ok(!torns.checkTurn(root, id).errors.some((e) => e.startsWith('Document eliminat sense relleu')));
  // Un document que el torn sí que cita conserva l'ordre de relleu del mateix torn.
  fs.renameSync(path.join(root, propi.file), path.join(root, ARXIU, path.basename(propi.file)));
  assert.ok(torns.checkTurn(root, id).errors.includes(`Document eliminat sense relleu: ${propi.file}. És a ${ARXIU}/${path.basename(propi.file)}: registra el relleu amb node tooling/wiki/document.mjs handoff --turn-id ${id} --file ${propi.file} --to ${ARXIU}/${path.basename(propi.file)}`));
});

test('OLIV-R5: --arxiva, amb --sec o sense, no diu «Res a arxivar» ni ix amb 0 si a l’arrel jutjada falta l’Escriptori o l’índex', (t) => {
  if (salta(t)) return;
  const buit = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-olivera-arxiva-buit-')));
  t.after(() => fs.rmSync(buit, { recursive: true, force: true }));
  for (const args of [['--arxiva'], ['--arxiva', '--sec']]) {
    const r = porta(buit, args);
    assert.equal(r.status, 2, `${args.join(' ')}: ${r.stdout}${r.stderr}`);
    assert.doesNotMatch(r.stdout, /Res a arxivar/);
    assert.match(r.stderr, /Escriptori absent/);
  }
  assert.throws(() => olivera.arxiva(buit), (e) => e.codi === 2 && /Escriptori absent/.test(e.message));
  fs.mkdirSync(path.join(buit, DESK), { recursive: true });
  const senseIndex = porta(buit, ['--arxiva', '--sec']);
  assert.equal(senseIndex.status, 2, senseIndex.stdout);
  assert.match(senseIndex.stderr, /00_index_escriptori\.md/);
});

test('OLIV-R6: cap prova d’este corredor passa en verd sense mirar res: totes comencen amb la guarda que salta', (t) => {
  if (!HI_HA_LAB) return t.skip('laboratori absent');
  const font = llig(fileURLToPath(import.meta.url));
  const proves = font.split(/^test\(/m).slice(1);
  assert.ok(proves.length >= 30, `${proves.length} proves`);
  const guarda = /^'(?:[^'\\]|\\.)*',\s*(?:\{[^}]*\},\s*)?(?:async\s+)?\(t\)\s*=>\s*\{\s*\n\s*if \((?:salta\(t\b|!HI_HA_LAB\))/;
  const senseGuarda = proves.filter((p) => !guarda.test(p)).map((p) => p.slice(0, 90));
  assert.deepEqual(senseGuarda, []);
});

test('OLIV-R7: una àncora amb àlies dins d’una taula ([[X\\|àlies]], com l’escriu Obsidian) ancora, declara viu i es reapunta', (t) => {
  if (salta(t)) return;
  const [A, B] = ['a', 'b'].map((x) => `${DIA}_0900_auditoria_taula_${x}.md`);
  const arrel = mas(t, [
    '# Índex', '', '## Activitat en curs', '', '| Document | Estat |', '| --- | --- |', `| [[${sense(A)}\\|àlies A]] | viu |`, '',
    '## Treball', '', '| Document | Estat |', '| --- | --- |', `| [[${sense(B)}\\|àlies B]] | consumit |`, ''
  ]);
  posa(arrel, A); posa(arrel, B);
  assert.deepEqual(olivera.ancoratge(arrel), { senseAncora: [], fantasma: [] });
  assert.deepEqual([...olivera.vius(arrel)], [sense(A)]);
  assert.equal(olivera.checkTaula(arrel).valid, true);
  assert.deepEqual(olivera.arxiva(arrel, { noms: [B] }).moguts.map((m) => m.nota), ['mogut']);
  assert.ok(index(arrel).split('\n').includes(`| [[../90_arxiu_historic/${sense(B)}\\|àlies B]] | consumit |`), index(arrel));
  assert.ok(!index(arrel).includes(`## ${olivera.SECCIO_ARXIVATS}`), 'l’àncora reapuntada ja l’ancora: no cal la secció dels arxivats');
  assert.deepEqual(olivera.ancoratge(arrel), { senseAncora: [], fantasma: [] });
  assert.equal(nucli.anchored(`| [[${sense(A)}\\|àlies]] | x |`, `${DESK}/${A}`), true);
  assert.equal(nucli.anchored(`| [[../90_arxiu_historic/${sense(B)}\\|àlies]] | x |`, `${ARXIU}/${B}`), true);
});
