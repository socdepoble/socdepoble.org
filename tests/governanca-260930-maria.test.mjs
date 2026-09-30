/** Prova de laboratori del paquet C4 (T13 i T14) · torn 260930_0040.
 *
 *  Aplica en memòria els pegats de
 *  `_wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0040_governanca_claude/pegats/t13-t14-maria.mjs`
 *  contra el contingut ACTUAL del repositori i comprova el resultat: AGENTS.md i
 *  el seu mirall (amb la mateixa funció de la porta d'autoritat), el frontmatter
 *  de la skill (parseDocument + validateSchema, parseYamlLite i el lector de la
 *  Porta Frontmatter), les projeccions del catàleg, el hooks.json nou i el
 *  .gitignore. Després prova el nucli pur de l'adaptador des del laboratori i
 *  executa la prova que entrarà amb el codi dins d'un arbre de prova a
 *  os.tmpdir(), amb les portes reals enllaçades.
 *
 *  No escriu res fora d'os.tmpdir(). Si el laboratori s'arxiva, cada prova salta.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseDocument, validateSchema } from '../tooling/documental/core.mjs';
import { parseFrontmatter } from '../tooling/wiki/lib/frontmatter.mjs';
import { checkAuthority } from '../tooling/gates/porta-autoritat.mjs';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const LAB = path.join(REPO, '_wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0040_governanca_claude');
const PEGAT = path.join(LAB, 'pegats/t13-t14-maria.mjs');
const HOOK_LAB = path.join(LAB, 'nous/tooling/gates/antigravity-hook.mjs');
const HI_HA_LAB = fs.existsSync(PEGAT) && fs.existsSync(HOOK_LAB);

const pegats = HI_HA_LAB ? await import(pathToFileURL(PEGAT).href) : null;
const hook = HI_HA_LAB ? await import(pathToFileURL(HOOK_LAB).href) : null;

const SKILL = '.agents/skills/wiki-documentacio-i-reflex/SKILL.md';
const INDEX_SKILLS = '.agents/skills/00_INDEX_SKILLS.md';
const ROUTER = '.agents/skills_index.json';
const DESK = '_wiki_de_poble/04_escriptori';

const llig = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');
const esquema = () => JSON.parse(llig('tooling/wiki/schema.json'));
const op = (ruta) => pegats.operacions.find((o) => o.ruta === ruta);

function salta(t) {
  if (HI_HA_LAB) return false;
  t.skip('laboratori 260930_0040_governanca_claude absent o arxivat');
  return true;
}

/** Aplica totes les operacions en ordre, com el generador: el mapa `nous` creix pas a pas. */
function aplicaTot() {
  const nous = new Map();
  for (const o of pegats.operacions) {
    if (o.aplica) nous.set(o.ruta, o.aplica(llig(o.ruta), nous));
    else if (o.crea) nous.set(o.ruta, fs.readFileSync(path.join(LAB, o.crea), 'utf8'));
  }
  return nous;
}

/** Línies noves (que no eren a l'original): on cal mirar què cita la doctrina. */
const liniesNoves = (vell, nou) => {
  const velles = new Set(vell.split('\n'));
  return nou.split('\n').filter((l) => !velles.has(l));
};

/**
 * Camins que tractor-doctrina.mjs extrauria dels espais de codi: tokens amb
 * extensió coneguda. Els que porten `/` han d'existir; els que no, han de ser
 * noms únics coneguts (un nom base repetit al laboratori el faria ABSENT).
 */
function comprovaCamins(linies, on) {
  const UNICS = new Map([['document.mjs', 'tooling/wiki/document.mjs']]);
  for (const l of linies) {
    for (const m of l.matchAll(/`([^`\n]+)`/g)) {
      for (const cru of m[1].split(/\s+/)) {
        const t = cru.replace(/[.,;:]+$/, '');
        if (!/\.(?:md|mjs|cjs|js|jsx|json|css|html|txt|yaml|yml|sh|lock)$/i.test(t)) continue;
        if (/^aammdd_hhmm_/i.test(t)) continue;
        if (t.includes('/')) assert.ok(fs.existsSync(path.join(REPO, t)), `${on}: cita ${t}, que no existix`);
        else {
          assert.ok(UNICS.has(t), `${on}: ${t} sense camí; tractor-doctrina el resoldria per nom base`);
          assert.ok(fs.existsSync(path.join(REPO, UNICS.get(t))), `${on}: ${UNICS.get(t)} ha d'existir`);
        }
      }
    }
  }
}

/* ── Forma del paquet ─────────────────────────────────────────────────────── */

test('paquet: operacions ben formades, rutes úniques i permeses, dependències abans', (t) => {
  if (salta(t)) return;
  const vistes = [];
  for (const o of pegats.operacions) {
    assert.equal(typeof o.ruta, 'string');
    assert.ok(o.descripcio && typeof o.descripcio === 'string', `${o.ruta}: descripció`);
    assert.equal(['crea', 'substituix', 'aplica'].filter((k) => o[k] !== undefined).length, 1, `${o.ruta}: una sola forma`);
    assert.ok(!vistes.includes(o.ruta), `${o.ruta}: repetida`);
    assert.ok(!/^(?:\.agents\/SKILLS_SEAL\.json|\.agents\/runtime\/|\.agents\/seal-transactions\/|\.git\/|\.sdp-reflex\/)/.test(o.ruta), `${o.ruta}: l'executor la rebutja`);
    assert.ok(!o.ruta.toLowerCase().startsWith(`${DESK}/01_produccio/`), `${o.ruta}: zona humana`);
    for (const d of o.depen ?? []) assert.ok(vistes.includes(d), `${o.ruta}: depèn de ${d}, que ha d'anar abans`);
    if (o.crea) {
      assert.ok(o.crea.startsWith('nous/') && fs.existsSync(path.join(LAB, o.crea)), `${o.crea}: el contingut ha de viure al laboratori`);
      assert.ok(!fs.existsSync(path.join(REPO, o.ruta)), `${o.ruta}: crea només fitxers nous`);
    }
    vistes.push(o.ruta);
  }
});

test('paquet: el laboratori no porta .md i cada fitxer acaba amb salt de línia (eol-last)', (t) => {
  if (salta(t)) return;
  const fitxers = [PEGAT, HOOK_LAB, path.join(LAB, 'nous/tests/antigravity-hook.test.mjs')];
  for (const f of fitxers) assert.ok(fs.readFileSync(f, 'utf8').endsWith('\n'), `${path.relative(REPO, f)}: eol-last`);
  const mds = [];
  (function camina(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const c = path.join(dir, e.name);
      if (e.isDirectory()) camina(c);
      else if (/\.md$/i.test(e.name)) mds.push(path.relative(REPO, c));
    }
  }(LAB));
  assert.deepEqual(mds, [], 'la porta de documents els tractaria com a documents de l’Escriptori');
});

/* ── AGENTS.md i mirall ───────────────────────────────────────────────────── */

test('AGENTS.md: §0.1 darrere de §0, pas 1 cap a context → create, §5 i §12; frontmatter i enllaços intactes', (t) => {
  if (salta(t)) return;
  const vell = llig('AGENTS.md');
  const nou = aplicaTot().get('AGENTS.md');
  const titol = '## 0.1 ESCRIPTORI NET I ORQUESTRADORA RESOLUTIVA (definició única)';
  assert.equal(nou.split(titol).length - 1, 1);
  const i0 = nou.indexOf('## 0. REGLA 0');
  const i01 = nou.indexOf(titol);
  const i1 = nou.indexOf('## 1. UN SOL CERVELL');
  assert.ok(i0 < i01 && i01 < i1, '§0.1 viu entre §0 i §1');
  const s01 = nou.slice(i01, i1);
  for (const pas of ['**Observa:**', '**Actua:**', '**Verifica:**', '**Informa:**']) assert.ok(s01.includes(pas), pas);
  assert.match(s01, /--arxiva --nom aammdd_hhmm_categoria_titol\.md/);
  assert.match(s01, /--sec/);
  assert.match(s01, /sense bandera fa l'informe/);
  assert.match(s01, /Claude i Codex no poden moure fitxers/);
  assert.match(nou, /document\.mjs context --turn-id ID --route RUTA --file CAMÍ/);
  assert.match(nou, /`prompt\.local` per a Claude i Codex, `prompt\.consell` per a les IAs externes, `pla\.implementacio` per al Pla/);
  assert.match(nou, /El que ja no val es trasllada, mai s'esborra/);
  assert.match(nou, /- \*\*04_escriptori\*\*: .*«## Activitat en curs».*Net no vol dir buit/);
  assert.ok(!nou.includes("s'ha de moure a quarantena."));
  assert.ok(!nou.includes('ES PERMET que hi hagen arxius'));
  // Frontmatter: el mateix, i vàlid contra l'esquema.
  const d = parseDocument(nou).data;
  assert.deepEqual(d, parseDocument(vell).data);
  assert.deepEqual(validateSchema(d, esquema()), []);
  // La porta d'autoritat comprova els enllaços markdown: cap de nou.
  const enllacos = (txt) => [...txt.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].map((m) => m[1]).sort();
  assert.deepEqual(enllacos(nou), enllacos(vell));
  assert.ok(!/\[\[/.test(liniesNoves(vell, nou).join('\n')), 'cap wikilink nou al BIOS');
  comprovaCamins(liniesNoves(vell, nou), 'AGENTS.md');
  assert.throws(() => op('AGENTS.md').aplica(nou), /ja hi és/);
});

test('AGENTS.md: les banderes citades són les de la porta Olivera v3 del laboratori', (t) => {
  if (salta(t)) return;
  const v3 = path.join(LAB, 'nous/tooling/gates/porta-olivera.mjs');
  if (!fs.existsSync(v3)) { t.skip('porta Olivera v3 absent del laboratori (àrea C3)'); return; }
  const font = fs.readFileSync(v3, 'utf8');
  assert.match(font, /export function checkTaula\(/);
  assert.match(font, /a === '--nom'/);
  assert.match(font, /a === '--sec'/);
  assert.match(font, /if \(!o\.hook\) \{ process\.exitCode = informe\(arrel\)/, 'sense bandera = informe');
});

test('mirall: còpia byte a byte de l’AGENTS.md final, i la porta d’autoritat ho accepta', (t) => {
  if (salta(t)) return;
  assert.equal(llig('.agents/AGENTS.md'), llig('AGENTS.md'), 'precondició: el mirall viu ja és igual (porta-autoritat en verd)');
  const nous = aplicaTot();
  const font = nous.get('AGENTS.md');
  assert.equal(nous.get('.agents/AGENTS.md'), font);
  const mirall = op('.agents/AGENTS.md');
  assert.deepEqual(mirall.depen, ['AGENTS.md']);
  assert.throws(() => mirall.aplica(llig('.agents/AGENTS.md')), /depèn de AGENTS\.md/);
  assert.equal(mirall.aplica(llig('.agents/AGENTS.md'), { 'AGENTS.md': font }), font, 'accepta també un objecte pla');
  assert.throws(() => mirall.aplica(font, { 'AGENTS.md': font }), /ja és còpia exacta/);

  // checkAuthority real sobre un arbre de prova: només mirem el veredicte del mirall.
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-mirall-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  fs.mkdirSync(path.join(arrel, '.agents'));
  fs.copyFileSync(path.join(REPO, '.agents/cervell.json'), path.join(arrel, '.agents/cervell.json'));
  fs.writeFileSync(path.join(arrel, 'AGENTS.md'), font);
  fs.writeFileSync(path.join(arrel, '.agents/AGENTS.md'), nous.get('.agents/AGENTS.md'));
  assert.ok(!checkAuthority(arrel).errors.includes('Mirall AGENTS divergent'));
  fs.writeFileSync(path.join(arrel, '.agents/AGENTS.md'), llig('.agents/AGENTS.md'));
  assert.ok(checkAuthority(arrel).errors.includes('Mirall AGENTS divergent'), 'la comprovació distingix un mirall vell');
});

/* ── Skill i projeccions ──────────────────────────────────────────────────── */

test('skill wiki-documentacio-i-reflex: frontmatter vàlid per als tres lectors, cos en positiu i història conservada', (t) => {
  if (salta(t)) return;
  const vell = llig(SKILL);
  const nou = aplicaTot().get(SKILL);
  const d = parseDocument(nou).data;
  assert.deepEqual(validateSchema(d, esquema()), []);
  const lite = parseFrontmatter(nou);
  assert.deepEqual(lite.errors, []);
  assert.equal(lite.data.description, pegats.DESCRIPCIO_REFLEX);
  assert.equal(d.description, pegats.DESCRIPCIO_REFLEX);
  const desc = pegats.DESCRIPCIO_REFLEX;
  assert.ok(desc.length >= 12 && desc.length <= 220 && [...desc].length <= 220, `descripció de ${desc.length} caràcters`);
  // Lector intern de la Porta Frontmatter: escalar pla en una sola línia, sense cometes ni «: ».
  assert.match(nou, /^description: [^"'\n][^\n]*$/m);
  assert.ok(!/:\s/.test(desc) && !desc.includes('#'));
  const dv = parseDocument(vell).data;
  for (const k of ['type', 'status', 'name', 'core', 'tags', 'triggers_on']) assert.deepEqual(d[k], dv[k], `${k} sense canvis`);
  assert.match(desc, /prompt\.local per a Claude i Codex/);
  assert.match(desc, /prompt\.consell/);
  assert.match(desc, /document\.mjs context i create/);

  assert.ok(nou.includes("- **Neteja prèvia:** la fa l'orquestradora (MarIA) o el Mestre"));
  assert.ok(!nou.includes('Es lliura oficialment a l\'Agent Claude'));
  assert.ok(!nou.includes('la IAIA HA DE netejar'));
  assert.equal(nou.split('- **260923** |').length - 1, 2, 'les dues lliçons 260923 continuen amb la seua data');
  assert.equal(nou.split('- **260930** | **L\'orquestradora resol la neteja en el torn**').length - 1, 1);
  assert.equal(nou.split('\n## Vincles\n').length - 1, 1);
  assert.ok(nou.endsWith('## Vincles\n- [[00_index]]\n') === vell.endsWith('## Vincles\n- [[00_index]]\n'), 'Vincles intactes');
  comprovaCamins(liniesNoves(vell, nou), SKILL);
  assert.throws(() => op(SKILL).aplica(nou), /ja hi és/);
});

test('projeccions: 00_INDEX_SKILLS.md i skills_index.json porten la descripció nova i res més', async (t) => {
  if (salta(t)) return;
  const nous = aplicaTot();
  const linia = `- [[wiki-documentacio-i-reflex/SKILL|wiki-documentacio-i-reflex]]: ${pegats.DESCRIPCIO_REFLEX}`;
  const vellIndex = llig(INDEX_SKILLS);
  const nouIndex = nous.get(INDEX_SKILLS);
  assert.equal(nouIndex.split(`\n${linia}\n`).length - 1, 1);
  assert.deepEqual(liniesNoves(vellIndex, nouIndex), [linia], 'només canvia la línia de la skill');
  assert.throws(() => op(INDEX_SKILLS).aplica(nouIndex, nous), /ja hi és/);

  // Projecció real de cataleg_skills.mjs amb la skill pedaçada, si l'índex d'ara ja n'és una projecció fidel.
  const { inventari, projeccions } = await import('../tooling/brain/cataleg_skills.mjs');
  let skills = null;
  try { skills = inventari(REPO); } catch (e) { t.diagnostic(`inventari() del catàleg no passa hui (${e.message}); només es compara la línia`); }
  if (skills) {
    const fidel = projeccions(skills).get(INDEX_SKILLS) === vellIndex;
    const pedacades = skills.map((s) => (s.id === 'wiki-documentacio-i-reflex' ? { ...s, description: parseFrontmatter(nous.get(SKILL)).data.description.replace(/\s+/g, ' ') } : s));
    if (fidel) assert.equal(projeccions(pedacades).get(INDEX_SKILLS), nouIndex);
    else t.diagnostic('00_INDEX_SKILLS.md ja divergia de la projecció abans del pegat; comparació estricta omesa');
  }

  if (!fs.existsSync(path.join(REPO, ROUTER))) { t.diagnostic(`${ROUTER} absent (és derivat i fora de git)`); return; }
  const vell = JSON.parse(llig(ROUTER));
  const nou = JSON.parse(nous.get(ROUTER));
  const entrada = nou.core.find((r) => r.name === 'wiki-documentacio-i-reflex');
  assert.equal(entrada.description, parseFrontmatter(nous.get(SKILL)).data.description);
  entrada.description = vell.core.find((r) => r.name === 'wiki-documentacio-i-reflex').description;
  assert.deepEqual(nou, vell, 'la resta de l’índex queda intacta');
  assert.throws(() => op(ROUTER).aplica(nous.get(ROUTER), nous), /ja porta la descripció nova/);
});

/* La Porta Frontmatter és un script (s'executa en importar-lo) i no jutja contingut
   en memòria. Ací es reproduïx el seu recorregut (tractor-frontmatter.mjs:190-235) i
   la seua validaVincles (:59-99) amb les funcions REALS de parse.mjs, i la prova
   primer comprova que l'emulació diu el mateix que el tractor sobre el disc d'ara. */
const aRegex = (p) => new RegExp('^' + p
  .replace(/[.+^${}()|[\]\\]/g, '\\$&')
  .replace(/\*\*\//g, '\u0001')
  .replace(/\*\*/g, '\u0000')
  .replace(/\*/g, '[^/]*')
  .replace(/\u0000/g, '.*')
  .replace(/\u0001/g, '(?:.*/)?') + '$');

function corpusFrontmatter(isDocumentArchive, substitucions = new Map()) {
  const abast = JSON.parse(llig('tooling/wiki/frontmatter-abast.json'));
  assert.deepEqual(abast.arrels, ['.'], 'l’emulació només coneix l’abast des de l’arrel');
  const exclou = abast.exclou.map((p) => aRegex(p.includes('/') ? p : `**/${p}`));
  const docs = [];
  (function recorre(rel) {
    let entrades;
    try { entrades = fs.readdirSync(rel ? path.join(REPO, rel) : REPO, { withFileTypes: true }); } catch { return; }
    for (const e of entrades) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (isDocumentArchive(r) || exclou.some((re) => re.test(r)) || e.isSymbolicLink()) continue;
      if (e.isDirectory()) recorre(r);
      else if (e.name.toLowerCase().endsWith('.md')) docs.push({ relPath: r, content: substitucions.get(r) ?? fs.readFileSync(path.join(REPO, r), 'utf8') });
    }
  }(''));
  return docs;
}

function validaVincles(doc, resolver, parse) {
  const p = parseFrontmatter(doc.content);
  if (p.malformed || p.errors.length) return ['YAML no llegible'];
  const seccions = [];
  let actual = null;
  for (const line of parse.liveMarkdown(p.body).split('\n')) {
    const h = /^ {0,3}(#{1,6})[\t ]+(.+?)(?:[\t ]+#+)?[\t ]*$/.exec(line);
    if (h && h[1].length <= 2) {
      actual = h[1].length === 2 && h[2] === 'Vincles' ? [] : null;
      if (actual) seccions.push(actual);
    } else if (actual) actual.push(line);
  }
  if (seccions.length !== 1) return ['Cal exactament una secció real ## Vincles'];
  const errors = [];
  let valids = 0;
  for (const line of seccions[0]) {
    if (!line.trim()) continue;
    const item = /^ {0,3}[-*][\t ]+(\[\[[^[\]\n]+\]\])[\t ]*$/.exec(line);
    if (!item || item[1].includes('\\')) { errors.push('Vincles només admet una llista de wikilinks sencers'); continue; }
    const links = parse.extractLinks(item[1]);
    if (links.length !== 1 || /[#^]/.test(links[0].target)) { errors.push('Cal enllaçar una nota sencera, sense fragments'); continue; }
    const r = parse.resolveLink(links[0], doc, resolver);
    if (r.status === 'resolved' && r.doc.relPath !== doc.relPath) valids++;
    else errors.push(`${links[0].target}: ${r.status === 'resolved' ? 'autoreferència' : r.status}`);
  }
  if (!valids) errors.push('Falta una nota interna única i diferent');
  return errors;
}

test('Porta Frontmatter: els fitxers que es modifiquen queden sense deute actiu (F9 d’AGENTS.md inclòs)', async (t) => {
  if (salta(t)) return;
  const parse = await import('../tooling/wiki/core/parse.mjs');
  const { isDocumentArchive } = await import('../tooling/lib/document-corpus.mjs');
  const tocats = ['AGENTS.md', '.agents/AGENTS.md', SKILL, INDEX_SKILLS];
  const vinclesDe = (docs) => {
    const resolver = parse.buildResolver(docs);
    return Object.fromEntries(tocats.map((r) => [r, validaVincles(docs.find((d) => d.relPath === r), resolver, parse)]));
  };

  // Hui: l'espai de codi de §9 amaga «## Vincles» d'AGENTS.md i del mirall.
  const hui = vinclesDe(corpusFrontmatter(isDocumentArchive));
  assert.deepEqual(hui['AGENTS.md'], ['Cal exactament una secció real ## Vincles']);
  assert.deepEqual(hui['.agents/AGENTS.md'], ['Cal exactament una secció real ## Vincles']);

  // L'emulació diu el mateix que el tractor real, i cap altra llei acusa estos fitxers.
  const r = spawnSync(process.execPath, ['tooling/wiki/tractor-frontmatter.mjs', '--json'], { cwd: REPO, encoding: 'utf8', timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
  let informe = null;
  try { informe = JSON.parse(r.stdout); } catch { t.diagnostic(`tractor-frontmatter no ha donat JSON (eixida ${r.status}); només compta l'emulació`); }
  if (informe) {
    for (const ruta of tocats) {
      const real = Object.entries(informe.fallades).flatMap(([llei, items]) => items.filter((i) => i.n === ruta).map((i) => (llei === 'F9' ? i.detall : `${llei} ${i.clau ?? ''}`)));
      assert.deepEqual(real, hui[ruta], `${ruta}: el tractor real i l'emulació coincidixen`);
    }
  }

  // Amb el paquet aplicat: cap F9 en cap dels quatre.
  const nous = aplicaTot();
  const despres = vinclesDe(corpusFrontmatter(isDocumentArchive, new Map(tocats.map((ruta) => [ruta, nous.get(ruta)]))));
  for (const ruta of tocats) assert.deepEqual(despres[ruta], [], `${ruta}: un fitxer modificat amb deute actiu fa caure el pre-commit (tractor-frontmatter.mjs:521-533)`);
});

/* ── Composició amb els pegats veïns ──────────────────────────────────────── */

/** Aplica una seqüència d'operacions sobre el contingut acumulat, com el generador. */
function encadena(seq) {
  const nous = new Map();
  for (const { o } of seq) {
    if (!o.aplica) { nous.set(o.ruta, fs.readFileSync(path.join(LAB, o.crea), 'utf8')); continue; }
    nous.set(o.ruta, o.aplica(nous.has(o.ruta) ? nous.get(o.ruta) : llig(o.ruta), nous));
  }
  return nous;
}

test('composició: amb els pegats veïns que toquen les mateixes rutes, l’ordre no canvia el resultat', async (t) => {
  if (salta(t)) return;
  const meves = new Set(pegats.operacions.map((o) => o.ruta));
  const seqAltres = [];
  for (const f of fs.readdirSync(path.join(LAB, 'pegats')).filter((n) => n.endsWith('.mjs') && n !== 't13-t14-maria.mjs').sort()) {
    const m = await import(pathToFileURL(path.join(LAB, 'pegats', f)).href);
    const ops = Array.isArray(m.operacions) ? m.operacions : [];
    // Les operacions veïnes sobre rutes meues, amb el tancament de les seues dependències.
    const cal = new Set(ops.filter((o) => meves.has(o.ruta) && !o.substituix).map((o) => o.ruta));
    let creix = true;
    while (creix) {
      creix = false;
      for (const o of ops) if (cal.has(o.ruta)) for (const d of o.depen ?? []) if (!cal.has(d)) { cal.add(d); creix = true; }
    }
    for (const o of ops) if (cal.has(o.ruta) && !o.substituix) seqAltres.push({ f, o });
  }
  if (!seqAltres.some(({ o }) => meves.has(o.ruta))) { t.skip('cap pegat veí toca rutes d’este paquet'); return; }
  t.diagnostic(`veïns: ${[...new Set(seqAltres.filter(({ o }) => meves.has(o.ruta)).map(({ f, o }) => `${f}:${o.ruta}`))].join(', ')}`);
  try { encadena(seqAltres); } catch (e) { t.skip(`els pegats veïns no s'apliquen sols sobre el disc d'ara (${e.message}); no és una col·lisió d'este paquet`); return; }

  const meus = pegats.operacions.map((o) => ({ f: 't13-t14-maria.mjs', o }));
  const a = encadena([...seqAltres, ...meus]);
  const b = encadena([...meus, ...seqAltres]);
  for (const ruta of meves) if (a.has(ruta)) assert.equal(a.get(ruta), b.get(ruta), `${ruta}: el resultat depén de l'ordre`);
  const index = a.get(INDEX_SKILLS);
  assert.ok(index.includes(`- [[wiki-documentacio-i-reflex/SKILL|wiki-documentacio-i-reflex]]: ${pegats.DESCRIPCIO_REFLEX}\n`), 'la línia d’este paquet sobreviu a la composició');
});

/* ── hooks.json i .gitignore ──────────────────────────────────────────────── */

test('.agents/hooks.json: format documentat, sense Stop ni description, ordres cap a l’adaptador', (t) => {
  if (salta(t)) return;
  const nous = aplicaTot();
  const h = JSON.parse(nous.get('.agents/hooks.json'));
  assert.deepEqual(Object.keys(h), ['sdp-olivera']);
  const spec = h['sdp-olivera'];
  assert.deepEqual(Object.keys(spec).sort(), ['PreInvocation', 'PreToolUse']);
  assert.deepEqual(spec.PreInvocation, [{ type: 'command', command: 'cd .. && node tooling/gates/antigravity-hook.mjs pre-invocation', timeout: 10 }]);
  assert.deepEqual(spec.PreToolUse, [{ matcher: '*', hooks: [{ type: 'command', command: 'cd .. && node tooling/gates/antigravity-hook.mjs pre-tool', timeout: 10 }] }]);
  assert.ok(nous.get('.agents/hooks.json').endsWith('}\n'));
  assert.ok(nous.has('tooling/gates/antigravity-hook.mjs'), 'l’script que criden les ordres entra al mateix paquet');
  assert.throws(() => op('.agents/hooks.json').aplica(nous.get('.agents/hooks.json')), /ja porta el hook/);
  assert.throws(() => op('.agents/hooks.json').aplica('{"hooks":[]}'), /no és el fitxer que va auditar H2/);
  const mapa = llig('src/sections/consola/mapa/construeixMapa.js');
  if (/Array\.isArray\(hooksAg\.hooks\)/.test(mapa)) {
    t.diagnostic('PENDENT src (Llei del Píxel): construeixMapa.js només llig el format antic de .agents/hooks.json; amb el nou, el node d’Antigravity desapareix del Mapa de la Consola.');
  }
});

test('.gitignore: l’interruptor queda fora de git just darrere dels punters locals; la traça ja cau en *.log', (t) => {
  if (salta(t)) return;
  const vell = llig('.gitignore');
  assert.ok(vell.split('\n').includes('*.log'), 'la traça .log ja és ignorada');
  const nou = aplicaTot().get('.gitignore');
  const linies = nou.split('\n');
  const i = linies.indexOf('.agents/runtime/torn_actiu*.json');
  assert.equal(linies[i + 3], '.agents/runtime/antigravity-hook.off');
  assert.equal(nou.split('.agents/runtime/antigravity-hook.off\n').length - 1, 1);
  assert.equal(nou.length - vell.length, linies.slice(i + 1, i + 4).join('\n').length + 1);
  assert.throws(() => op('.gitignore').aplica(nou), /ja hi és/);
});

/* ── Adaptador: nucli pur des del laboratori ──────────────────────────────── */

const ROOT = path.join(os.tmpdir(), 'sdp-mas-fals-lab');
const crida = (name, args) => ({ toolCall: { name, args }, stepIdx: 3, conversationId: 'c', workspacePaths: [ROOT], modelName: 'auto' });
const portesFalses = ({ olivera = [], plantilla = [], taula = { valid: true, errors: [] } } = {}) => ({
  esPetorreta: (rel) => /\/\d{6}_\d{4}_(?:prompt|petorreta)_[^/]+\.md$/.test(rel),
  vigilat: (nom) => /^\d{6}_\d{4}_(?:prompt|petorreta|pla)(?:_|\.md$)/.test(nom),
  operacio: (p) => ({ fitxer: path.relative(ROOT, p.toolArgs.TargetFile).split(path.sep).join('/'), contingut: p.toolArgs.CodeContent ?? '' }),
  olivera: () => olivera,
  plantilla: () => plantilla,
  taula: () => taula,
});

test('nucli: deny amb errors de les portes, allow net, ask per mv i per payload incomplet', (t) => {
  if (salta(t)) return;
  const prompt = crida('write_to_file', { TargetFile: path.join(ROOT, DESK, '260930_1200_prompt_x.md'), CodeContent: '# x\n' });
  assert.equal(hook.calenPortes('pre-tool', prompt, ROOT), 'escriptura');
  const r = hook.preTool(prompt, { root: ROOT, portes: portesFalses({ olivera: ['taula bruta'], plantilla: ['reflex: sense rebut'] }) });
  assert.equal(r.decision, 'deny');
  assert.match(r.reason, /taula bruta/);
  assert.match(r.reason, /\[Plantilla viva\] reflex: sense rebut/);
  assert.equal(hook.preTool(prompt, { root: ROOT, portes: portesFalses() }).decision, 'allow');
  assert.equal(hook.preTool(crida('run_command', { CommandLine: `mv ${DESK}/a.md ${DESK}/b.md` }), { root: ROOT }).decision, 'ask');
  assert.equal(hook.preTool(crida('run_command', { CommandLine: 'npm test' }), { root: ROOT }).decision, 'allow');
  assert.equal(hook.preTool(crida('view_file', { AbsolutePath: '/x' }), { root: ROOT }).decision, 'allow');
  assert.equal(hook.preTool({ stepIdx: 1 }, { root: ROOT }).decision, 'ask');
  assert.throws(() => hook.preTool(prompt, { root: ROOT }), /portes no carregades/);
});

test('nucli: PreInvocation injecta amb taula bruta i calla amb taula neta', (t) => {
  if (salta(t)) return;
  assert.deepEqual(hook.preInvocation({ portes: portesFalses() }), {});
  const r = hook.preInvocation({ portes: portesFalses({ taula: { valid: false, errors: ['Sense àncora a l’índex: a.md'] } }) });
  assert.match(r.injectSteps[0].ephemeralMessage, /observa .* → actua .* → verifica .* → informa/);
});

/* ── Adaptador: procés des del laboratori ─────────────────────────────────── */

function executaLab(arrel, mode, entrada) {
  const r = spawnSync(process.execPath, [HOOK_LAB, mode], {
    cwd: arrel, env: { ...process.env, SDP_ARREL: arrel }, input: JSON.stringify(entrada), encoding: 'utf8', timeout: 20000
  });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

test('procés al laboratori: interruptor, traça i fallada cap a ask quan les portes no carreguen', (t) => {
  if (salta(t)) return;
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-hook-lab-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  fs.mkdirSync(path.join(arrel, DESK), { recursive: true });
  const traca = path.join(arrel, hook.TRACA);

  assert.deepEqual(executaLab(arrel, 'pre-tool', crida('view_file', {})), { decision: 'allow' });
  assert.equal(fs.readFileSync(traca, 'utf8').trim().split('\n').length, 1);

  // Al laboratori no hi ha porta-reflex ni lib/arrel al costat: la càrrega falla i el hook pregunta.
  const r = executaLab(arrel, 'pre-tool', crida('write_to_file', { TargetFile: path.join(arrel, DESK, '260930_1200_prompt_x.md'), CodeContent: '# x\n' }));
  assert.equal(r.decision, 'ask');
  assert.match(r.reason, /error intern/);
  assert.match(executaLab(arrel, 'pre-invocation', { invocationNum: 1 }).injectSteps[0].ephemeralMessage, /no s'ha pogut comprovar/);

  fs.writeFileSync(path.join(arrel, hook.INTERRUPTOR), '');
  const abans = fs.readFileSync(traca, 'utf8');
  assert.deepEqual(executaLab(arrel, 'pre-tool', crida('run_command', { CommandLine: `mv ${DESK}/a.md b.md` })), { decision: 'allow' });
  assert.equal(fs.readFileSync(traca, 'utf8'), abans, 'apagat no traça');
});

/* ── La prova que entra amb el codi, en un arbre de prova ─────────────────── */

test('tests/antigravity-hook.test.mjs passa en un arbre de prova amb les portes reals enllaçades', (t) => {
  if (salta(t)) return;
  const v3 = path.join(LAB, 'nous/tooling/gates/porta-olivera.mjs');
  const oliveraViva = path.join(REPO, 'tooling/gates/porta-olivera.mjs');
  const teTaula = (f) => fs.existsSync(f) && /export function checkTaula\(/.test(fs.readFileSync(f, 'utf8'));
  if (!teTaula(v3) && !teTaula(oliveraViva)) { t.skip('cap porta Olivera amb checkTaula (ni instal·lada ni al laboratori de C3)'); return; }

  const arbre = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-arbre-hook-'));
  t.after(() => fs.rmSync(arbre, { recursive: true, force: true }));
  for (const d of ['tests', 'tooling/gates', '.agents']) fs.mkdirSync(path.join(arbre, d), { recursive: true });
  const nous = aplicaTot();
  fs.writeFileSync(path.join(arbre, 'tests/antigravity-hook.test.mjs'), nous.get('tests/antigravity-hook.test.mjs'));
  fs.writeFileSync(path.join(arbre, 'tooling/gates/antigravity-hook.mjs'), nous.get('tooling/gates/antigravity-hook.mjs'));
  fs.writeFileSync(path.join(arbre, '.agents/hooks.json'), nous.get('.agents/hooks.json'));
  // Node resol els symlinks: les portes enllaçades importen les seues dependències des del repositori.
  for (const f of ['porta-reflex.mjs', 'porta-plantilla-viva.mjs']) fs.symlinkSync(path.join(REPO, 'tooling/gates', f), path.join(arbre, 'tooling/gates', f));
  if (teTaula(v3)) {
    fs.copyFileSync(v3, path.join(arbre, 'tooling/gates/porta-olivera.mjs'));
    fs.symlinkSync(path.join(REPO, 'tooling/lib'), path.join(arbre, 'tooling/lib'), 'dir');
  } else {
    fs.symlinkSync(oliveraViva, path.join(arbre, 'tooling/gates/porta-olivera.mjs'));
  }

  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT; // si no, el node --test niat parla amb el pare en el seu protocol intern
  delete env.SDP_ARREL;
  const r = spawnSync(process.execPath, ['--test', path.join(arbre, 'tests/antigravity-hook.test.mjs')], {
    cwd: arbre, env, encoding: 'utf8', timeout: 180000, maxBuffer: 64 * 1024 * 1024
  });
  assert.equal(r.status, 0, `la prova del paquet ha fallat dins de l'arbre:\n${r.stdout.slice(-4000)}\n${r.stderr.slice(-2000)}`);
  assert.match(r.stdout, /(?:ℹ|#) fail 0/);
});
