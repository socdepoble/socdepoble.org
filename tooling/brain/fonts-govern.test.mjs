// Proves del compilador de /__iaia/govern.json (tooling/brain/fonts-govern.mjs). node --test.
// Ordre del Mestre del 30-10-2026 (B2) · Un Llibre Mestre de prova en un repositori git de mkdtemp:
// cap xarxa, cap escriptura fora del directori temporal, que s'esborra en acabar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  ESQUEMA_GOVERN, ErrorGovern, MIDA_MAXIMA_LLIBRE, PLA_LLIBRE, RUTA_LLIBRE, STATUS_MATRIU, celles, commitsForaDe, equivalentsDe,
  estatDelLlibre, gitDe, historiaDe, idDeFila, llegixHead, recullGovern, taulesDeMatriu
} from './fonts-govern.mjs';
import { normalitzaGovern } from '../../src/sections/consola/govern/governContent.js';
import { recompteVist, vistaMatriu } from '../../src/sections/consola/govern/matriuGovern.js';
import { empremtesDe } from '../../src/sections/consola/govern/certificacions.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));

/** Un Llibre amb el Banc d'Idees (que no és matriu), una H3 que diu «Matriu» i les tres matrius. */
function llibreDeProva({ commit = '0000000', fora = 'abcdef1234' } = {}) {
  return [
    '---', 'type: document', '---', '', '# Llibre de prova', '',
    '## 💡 1. Banc d\'Idees', '', '| ID Idea | Títol | Estat | Descripció |', '| :--- | :--- | :--- | :--- |',
    '| **`IDEA-01`** | **Una idea** | `[EN CARTERA]` | No és cap requeriment. |', '',
    '### 🏆 Matriu Universal de 15 Punts (no és cap secció de matriu)', '',
    '## 🔴 2. Matriu P0 · Bloquejants', '', '> **Criteri P0:** un paràgraf abans de la taula.', '',
    '| ID | Àmbit | Estat | Descripció del Deute Bloquejant | Fitxers Afectats |',
    '| :--- | :--- | :---: | :--- | :--- |',
    `| **\`P0-01\`** | **Seguretat** | \`[FET · ${commit}]\` | **Fuga tancada:** amb \`a|b\` dins del codi. | \`supabase/x.sql\` |`,
    '| **`P0-02`** | **Secrets** | `[PENDENT]` | Rotar el token. | Panell |',
    `| **\`P0-03\`** | **Fora** | \`[FET · ${fora}]\` | Un commit que no és a la història. | — |`,
    '', '## 🟡 3. Matriu P1 · Millores', '',
    '| ID | Àmbit | Estat | Descripció de la Millora | Fitxers Afectats |',
    '| :--- | :--- | :---: | :--- | :--- |',
    '| **`P1-01`** | **Fase E** | `[PARCIAL]` | Culminar. | `src/apps/bar/` |',
    '| **`P1-02`** | **Data** | `[FET · 261021]` | Sense commit. | `src/a.js` |',
    `| **\`P1-03\`** | **Revertit** | \`[FET · ${commit} · 261029 · REVERTIT PER L'ORDRE 0]\` | Amb qualificador. | \`src/b.js\` |`,
    '| **`P1-04`** | **Auditat** | `[AUDITAT · PENDENT · 261026]` | Auditat. | `src/c.js` |',
    '| **`P1-05`** | **Nova** | `[PRIORITAT 1 · 261029]` | Una prioritat. | `src/d.js` |',
    '', '## 🟢 4. Matriu P2 · Full de Ruta', '',
    '| ID | Àmbit | Estat | Descripció de l\'Evolució |',
    '| :--- | :--- | :---: | :--- |',
    '| **`P2-01`** | **Portes** | `[BACKLOG]` | Desplegar. |',
    '| **`P2-02`** | **Cel·les de més** | `[PARCIAL · 261024]` | Descripció | `src/e.js` |',
    '',
    '| **`P2-03`** | **Darrere de la línia en blanc** | `[PENDENT · 261025]` | Es compta igual. |',
    '', '## 🔒 5. Protocol', '', '| ID | No | És |', '| --- | --- | --- |', '| X | Y | Z |', ''
  ].join('\n');
}

const GIT_NET = { ...process.env, GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0' };
for (const clau of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE']) delete GIT_NET[clau];
const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=Prova', '-c', 'user.email=prova@example.invalid', '-c', 'commit.gpgsign=false', ...args], { cwd, env: GIT_NET, encoding: 'utf8' }).trim();

/** Un repositori de prova amb un commit i el Llibre escrit després (al treball, com el d'ara). */
function masDeProva(t, { llibre = true } = {}) {
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-govern-')));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  git(arrel, 'init', '-q', '-b', 'main');
  fs.writeFileSync(path.join(arrel, 'README.md'), 'prova\n');
  git(arrel, 'add', 'README.md');
  git(arrel, 'commit', '-q', '-m', 'primer');
  const head = git(arrel, 'rev-parse', 'HEAD');
  if (llibre) {
    fs.mkdirSync(path.join(arrel, path.dirname(RUTA_LLIBRE)), { recursive: true });
    fs.writeFileSync(path.join(arrel, RUTA_LLIBRE), llibreDeProva({ commit: head.slice(0, 9) }));
  }
  return { arrel, head };
}

/* Tot el que hi ha davall d'una arrel (també .git): camí, mida i mtime. */
function instantania(arrel) {
  const eixida = [];
  const passa = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const ruta = path.join(dir, e.name);
      const s = fs.lstatSync(ruta);
      eixida.push([path.relative(arrel, ruta), e.isDirectory() ? 'd' : s.size, s.mtimeMs]);
      if (e.isDirectory()) passa(ruta);
    }
  };
  passa(arrel);
  return eixida;
}

test('celles: parteix per «|» fora del codi en línia i accepta «\\|»', () => {
  assert.deepEqual(celles('| a | `b|c` | d \\| e |'), ['a', '`b|c`', 'd | e']);
  assert.deepEqual(celles('| ``x | ` | y`` | z |'), ['``x | ` | y``', 'z']);
  assert.deepEqual(celles('a | b'), ['a', 'b']);
});

test('taulesDeMatriu: només les seccions H2 «Matriu P<n>», amb les seues files; el que tolera ho diu', () => {
  const { taules, avisos } = taulesDeMatriu(llibreDeProva());
  assert.deepEqual(taules.map((t) => [t.prioritat, t.files.length]), [['P0', 3], ['P1', 5], ['P2', 3]]);
  assert.deepEqual(taules.map((t) => t.columnes.total), [5, 5, 4]);
  assert.equal(taules[2].columnes.fitxers, null);
  // La cel·la de més de P2-02 s'ajunta a la descripció; la línia en blanc no perd P2-03.
  assert.equal(taules[2].files[1].celles[3], 'Descripció | `src/e.js`');
  assert.equal(taules[2].files[2].celles[0], '**`P2-03`**');
  assert.deepEqual(avisos.map((a) => [a.codi, a.prioritat]), [['fila-desquadrada', 'P2'], ['taula-partida', 'P2']]);
  // El codi en línia amb una barra no parteix la cel·la.
  assert.match(taules[0].files[0].celles[3], /`a\|b`/);
});

test('taulesDeMatriu: sense matriu, sense taula, sense «Estat» o sense separador, un ErrorGovern amb el seu codi', () => {
  const codi = (text) => { try { taulesDeMatriu(text); return null; } catch (e) { assert.ok(e instanceof ErrorGovern); return e.codi; } };
  assert.equal(codi('# Res\n\n## Banc\n\n| ID | Estat |\n| --- | --- |\n| A | B |\n'), 'sense-matriu');
  assert.equal(codi('## Matriu P0\n\nNomés text.\n\n## Altra\n'), 'taula-mal-formada');
  assert.equal(codi('## Matriu P0\n\n| ID | Àmbit | Descripció |\n| --- | --- | --- |\n| A | B | C |\n'), 'taula-mal-formada');
  assert.equal(codi('## Matriu P1\n\n| ID | Estat |\n| A | B |\n'), 'taula-mal-formada');
  assert.equal(codi('## Matriu P2\n\n| ID | Estat |\n| --- | --- |\n'), null, 'una taula buida no és cap error');
});

test('estatDelLlibre: només és FET I SEGELLAT el FET amb commits de la història i, com a molt, una data', () => {
  const a = 'a'.repeat(40);
  const b = `b${'0'.repeat(39)}`;
  const h = historiaDe([a, b, `${'c'.repeat(8)}${'1'.repeat(32)}`, `${'c'.repeat(8)}${'2'.repeat(32)}`]);
  const casos = [
    ['`[FET · aaaaaaa]`', STATUS_MATRIU.fet],
    ['[FET · aaaaaaaa / b000000 · 261029]', STATUS_MATRIU.fet],
    ['[FET · aaaaaaa, b000000]', STATUS_MATRIU.fet],
    ['[FET · ddddddd]', '[FET · ddddddd]'],
    ['[FET · cccccccc]', '[FET · cccccccc]'], // ambigu: dos commits comencen igual
    ['[FET · aaaaaaa / ddddddd]', '[FET · aaaaaaa / ddddddd]'],
    ['[FET · 261021]', '[FET · 261021]'],
    ['[FET]', '[FET]'],
    ['[FET · aaaaaaa · CONTINU]', '[FET · aaaaaaa · CONTINU]'],
    ['[FET · aaaaaaa · 261029 · REVERTIT]', '[FET · aaaaaaa · 261029 · REVERTIT]'],
    ['[FET EN CODI · aaaaaaa]', '[FET EN CODI · aaaaaaa]'],
    ['[PARCIAL]', STATUS_MATRIU.parcial],
    ['[PARCIAL · C2120-01 FET · aaaaaaa]', STATUS_MATRIU.parcial],
    ['[PENDENT]', STATUS_MATRIU.pendent],
    ['[PENDENT DEL MESTRE · 261025]', STATUS_MATRIU.pendent],
    ['[AUDITAT · PENDENT · 261026]', STATUS_MATRIU.pendent],
    ['[BACKLOG]', STATUS_MATRIU.pendent],
    ['[NOVA · 261027]', '[NOVA · 261027]'],
    ['[PROPOSTA · 261025]', '[PROPOSTA · 261025]'],
    ['[FET I SEGELLAT]', null],
    ['', null]
  ];
  for (const [literal, status] of casos) assert.equal(estatDelLlibre(literal, h).status, status, literal);
  // L'evidència diu sempre el literal del Llibre i, si cal, per què no és segellat.
  assert.equal(estatDelLlibre('[FET · aaaaaaa]', h).evidencia, `El Llibre diu «[FET · aaaaaaa]». Segellat: el commit aaaaaaa és a la història del HEAD.`);
  assert.equal(estatDelLlibre('[FET · ddddddd]', h).evidencia, 'El Llibre diu «[FET · ddddddd]». No es dona per segellat: el commit ddddddd no és a la història del HEAD.');
  assert.match(estatDelLlibre('[FET · 261021]', h).evidencia, /no porta cap commit que es puga comprovar/);
  assert.match(estatDelLlibre('[FET · aaaaaaa · CONTINU]', h).evidencia, /porta més que un commit i una data/);
  assert.match(estatDelLlibre('[FET I SEGELLAT]', h).evidencia, /cap commit comprovat/);
  // Sense història (git no hi és), cap FET és segellat.
  assert.equal(estatDelLlibre('[FET · aaaaaaa]', null).status, '[FET · aaaaaaa]');
});

test('recullGovern: sdp.govern.v1 compilat del Llibre i del HEAD, que normalitzaGovern accepta i la Consola pinta viu', async (t) => {
  const { arrel, head } = masDeProva(t);
  const ara = new Date();
  const govern = await recullGovern(arrel, { ara });
  assert.deepEqual(Object.keys(govern), ['schema', 'generat', 'head', 'mcr', 'trasllat', 'font', 'avisos']);
  assert.equal(govern.schema, ESQUEMA_GOVERN);
  assert.equal(govern.generat, ara.toISOString());
  assert.equal(govern.head, head);
  assert.equal(govern.trasllat, null);
  assert.equal(govern.font, RUTA_LLIBRE);
  assert.equal(govern.mcr.baseline_head, head);
  assert.equal(govern.mcr.pla, PLA_LLIBRE);
  assert.equal(govern.mcr.at, fs.statSync(path.join(arrel, RUTA_LLIBRE)).mtime.toISOString());
  const normal = normalitzaGovern(JSON.parse(JSON.stringify(govern)));
  assert.equal(normal.head, head);
  assert.equal(normal.matriu.pla, PLA_LLIBRE);
  assert.equal(normal.matriu.plaDeclarat, true);
  assert.deepEqual(normal.matriu.files.map((f) => f.id), ['P0-01', 'P0-02', 'P0-03', 'P1-01', 'P1-02', 'P1-03', 'P1-04', 'P1-05', 'P2-01', 'P2-02', 'P2-03']);
  const vista = vistaMatriu(normal.matriu, { head: normal.head, ara: ara.getTime() });
  assert.equal(vista.caducitat.obsoleta, false);
  assert.equal(vista.caducitat.commitComprovat, true);
  assert.deepEqual(Object.fromEntries(vista.files.map((f) => [f.id, f.estatVist])), {
    'P0-01': 'fet', 'P0-02': 'pendent', 'P0-03': 'obsolet', 'P1-01': 'parcial', 'P1-02': 'obsolet', 'P1-03': 'obsolet',
    'P1-04': 'pendent', 'P1-05': 'obsolet', 'P2-01': 'pendent', 'P2-02': 'parcial', 'P2-03': 'pendent'
  });
  assert.deepEqual(recompteVist(vista.files), { fet: 1, parcial: 2, pendent: 4, obsolet: 4 });
  const p001 = vista.files[0];
  assert.equal(p001.font, 'Llibre Mestre · Matriu P0');
  assert.equal(p001.prioritat, 'P0');
  assert.equal(p001.requeriment, 'Seguretat: Fuga tancada: amb a|b dins del codi.');
  assert.match(p001.evidencia, /^El Llibre diu «\[FET · [0-9a-f]{9}\]»\. Segellat: el commit [0-9a-f]{9} és a la història del HEAD\. Fitxers afectats: supabase\/x\.sql$/);
  assert.equal(p001.responsable, null);
  assert.equal(p001.acceptacio, null);
  // El que la Consola pinta com a desconegut porta el literal del Llibre.
  assert.equal(vista.files.find((f) => f.id === 'P1-05').status, '[PRIORITAT 1 · 261029]');
  assert.deepEqual(govern.avisos.map((a) => a.codi), ['fila-desquadrada', 'taula-partida']);
});

test('recullGovern: cap número de línia a les files, i l’empremta d’una fila no canvia si s’escriu damunt seu', async (t) => {
  const { arrel } = masDeProva(t);
  const fitxer = path.join(arrel, RUTA_LLIBRE);
  const abans = await recullGovern(arrel);
  fs.writeFileSync(fitxer, fs.readFileSync(fitxer, 'utf8').replace('# Llibre de prova\n', '# Llibre de prova\n\nUn paràgraf nou.\n\nUn altre.\n'));
  const despres = await recullGovern(arrel);
  assert.deepEqual(despres.mcr.requirements, abans.mcr.requirements);
  assert.equal(JSON.stringify(despres.mcr.requirements).match(/l[ií]nia \d/), null);
  const empremtes = async (g) => [...(await empremtesDe(normalitzaGovern(g).matriu)).entries()];
  assert.deepEqual(await empremtes(despres), await empremtes(abans));
  // Una fila que canvia, sí que canvia d'empremta (la decisió del Mestre és d'una versió anterior).
  fs.writeFileSync(fitxer, fs.readFileSync(fitxer, 'utf8').replace('Rotar el token.', 'Rotar el token ara.'));
  const canviada = new Map(await empremtes(await recullGovern(arrel)));
  const vella = new Map(await empremtes(abans));
  assert.notEqual(canviada.get('P0-02'), vella.get('P0-02'));
  assert.equal(canviada.get('P0-01'), vella.get('P0-01'));
});

test('recullGovern només llig: cap fitxer nou, cap fitxer canviat, ni al treball ni a .git', async (t) => {
  const { arrel } = masDeProva(t);
  const abans = instantania(arrel);
  await recullGovern(arrel);
  await recullGovern(arrel);
  assert.deepEqual(instantania(arrel), abans);
});

test('errors controlats: Llibre absent, enllaç simbòlic, massa gran i git absent, amb un text sense camins', async (t) => {
  const codiDe = async (promesa) => {
    try { await promesa; return null; } catch (e) {
      assert.ok(e instanceof ErrorGovern, String(e));
      assert.ok(!e.message.includes(os.tmpdir()) && !e.message.includes('/'), e.message);
      return e.codi;
    }
  };
  const sense = masDeProva(t, { llibre: false });
  assert.equal(await codiDe(recullGovern(sense.arrel)), 'llibre-absent');
  // Un enllaç simbòlic al Llibre no es seguix.
  const enllac = masDeProva(t, { llibre: false });
  const real = path.join(enllac.arrel, 'llibre_real.md');
  fs.writeFileSync(real, llibreDeProva());
  fs.mkdirSync(path.join(enllac.arrel, path.dirname(RUTA_LLIBRE)), { recursive: true });
  fs.symlinkSync(real, path.join(enllac.arrel, RUTA_LLIBRE));
  assert.equal(await codiDe(recullGovern(enllac.arrel)), 'llibre-absent');
  const gran = masDeProva(t, { llibre: false });
  fs.mkdirSync(path.join(gran.arrel, path.dirname(RUTA_LLIBRE)), { recursive: true });
  fs.writeFileSync(path.join(gran.arrel, RUTA_LLIBRE), Buffer.alloc(MIDA_MAXIMA_LLIBRE + 1, 0x61));
  assert.equal(await codiDe(recullGovern(gran.arrel)), 'llibre-massa-gran');
  // Fora de git (el sostre, GIT_CEILING_DIRECTORIES, el prova «GIT_CEILING_DIRECTORIES: …», més avall).
  const fora = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-govern-fora-')));
  t.after(() => fs.rmSync(fora, { recursive: true, force: true }));
  fs.mkdirSync(path.join(fora, path.dirname(RUTA_LLIBRE)), { recursive: true });
  fs.writeFileSync(path.join(fora, RUTA_LLIBRE), llibreDeProva());
  assert.equal(await codiDe(recullGovern(fora)), 'git-absent');
  // Un git que falla o que no torna cap commit.
  const ambLlibre = masDeProva(t);
  assert.equal(await codiDe(recullGovern(ambLlibre.arrel, { git: () => Promise.reject(Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' })) })), 'git-absent');
  assert.equal(await codiDe(recullGovern(ambLlibre.arrel, { git: async () => 'no és cap sha\n' })), 'git-absent');
  const malFormat = masDeProva(t);
  fs.writeFileSync(path.join(malFormat.arrel, RUTA_LLIBRE), '## Matriu P0\n\n| ID | Àmbit |\n| --- | --- |\n| A | B |\n');
  assert.equal(await codiDe(recullGovern(malFormat.arrel)), 'taula-mal-formada');
});

test('git: execFile amb arguments i sense shell; només rev-parse i rev-list', async (t) => {
  const { arrel, head } = masDeProva(t);
  const crides = [];
  const real = gitDe(arrel);
  const espia = (args) => { crides.push(args); return real(args); };
  const { head: llegit, historia } = await llegixHead(espia);
  assert.equal(llegit, head);
  assert.equal(historia.resol(head.slice(0, 7)), head);
  assert.deepEqual(crides.map((a) => a[0]), ['rev-parse', 'rev-list']);
  assert.ok(crides.every((a) => Array.isArray(a) && a.every((x) => typeof x === 'string')));
  const font = fs.readFileSync(path.join(AQUI, 'fonts-govern.mjs'), 'utf8');
  assert.match(font, /execFile\('git', args, opcions/);
  assert.match(font, /shell: false/);
  // Cap shell ni cap escriptura (un `.exec(` d'expressió regular no és cap procés).
  assert.doesNotMatch(font, /(?<![.\w])exec\(|execSync|spawnSync|shell: true|writeFile|appendFile|mkdirSync|rmSync|unlink|renameSync|copyFile/);
});

/* ── Gauntlet f4b, àrea «govern» (30-10-2026) ──────────────────────────── */

/* Un Llibre amb una sola taula de P0 i les files que es passen. */
const llibreP0 = (files) => [
  '# Llibre de prova', '', '## 🔴 2. Matriu P0 · Prova', '',
  '| ID | Àmbit | Estat | Descripció | Fitxers Afectats |', '| :--- | :--- | :---: | :--- | :--- |', ...files, ''
].join('\n');
const filaP0 = (id, estat) => `| **\`${id}\`** | **Prova** | \`${estat}\` | Descripció de ${id}. | — |`;
const escriuLlibre = (arrel, text) => {
  fs.mkdirSync(path.join(arrel, path.dirname(RUTA_LLIBRE)), { recursive: true });
  fs.writeFileSync(path.join(arrel, RUTA_LLIBRE), text);
};
/* Un commit que escriu un fitxer: torna el seu sha. */
const commitDe = (arrel, nom, text, missatge, ...mes) => {
  fs.writeFileSync(path.join(arrel, nom), text);
  git(arrel, 'add', nom);
  git(arrel, 'commit', '-q', '-m', missatge, ...mes);
  return git(arrel, 'rev-parse', 'HEAD');
};
const curt = (sha) => sha.slice(0, 9);
const idsDe = (text) => taulesDeMatriu(text).taules.flatMap((t) => t.files.map((f) => idDeFila(f, t.columnes)));
const avisosDe = (text) => taulesDeMatriu(text).avisos.map((a) => [a.codi, a.prioritat]);
const BASE = ['P0-01', 'P0-02', 'P0-03', 'P1-01', 'P1-02', 'P1-03', 'P1-04', 'P1-05', 'P2-01', 'P2-02', 'P2-03'];
const AVISOS_BASE = [['fila-desquadrada', 'P2'], ['taula-partida', 'P2']];

/* «revlist-all-viu» i «commits-rebasats-fals-negatiu» · El segell és la història del HEAD i no
   qualsevol branca: un commit d'una altra branca no es segella. Un commit reescrit (el mateix canvi
   amb un altre SHA, com els que deixa un rebase o un filter-branch) tampoc, però l'evidència diu el
   commit d'ara en lloc de deixar creure que la faena no hi és. */
test('el segell és la història del HEAD: un commit d’una altra branca no es segella, i un de reescrit es diu amb el commit d’ara', async (t) => {
  const { arrel } = masDeProva(t, { llibre: false });
  const DATA_C = '2026-10-21T10:00:00+02:00';
  git(arrel, 'checkout', '-q', '-b', 'altra');
  const reescrit = commitDe(arrel, 'a.txt', 'a\n', 'canvi a');
  const nomesAltra = commitDe(arrel, 'b.txt', 'b\n', 'canvi b');
  const mateixaData = commitDe(arrel, 'c.txt', 'c\n', 'canvi c', `--date=${DATA_C}`);
  git(arrel, 'checkout', '-q', 'main');
  commitDe(arrel, 'd.txt', 'd\n', 'main avança');
  git(arrel, 'cherry-pick', reescrit);
  const copia = git(arrel, 'rev-parse', 'HEAD');
  // El mateix autor, data i assumpte que «canvi c», amb un altre canvi: no és el mateix commit.
  commitDe(arrel, 'c.txt', 'c, un altre\n', 'canvi c', `--date=${DATA_C}`);
  escriuLlibre(arrel, llibreP0([
    filaP0('P0-01', `[FET · ${curt(reescrit)}]`), filaP0('P0-02', `[FET · ${curt(nomesAltra)}]`),
    filaP0('P0-03', `[FET · ${curt(mateixaData)}]`), filaP0('P0-04', `[FET · ${curt(copia)}]`)
  ]));
  const crides = [];
  const real = gitDe(arrel);
  const abans = instantania(arrel);
  const govern = await recullGovern(arrel, { git: (args) => { crides.push(args); return real(args); } });
  assert.deepEqual(instantania(arrel), abans, 'només llig');
  const per = Object.fromEntries(govern.mcr.requirements.map((r) => [r.id, r]));
  assert.equal(per['P0-04'].status, STATUS_MATRIU.fet);
  for (const [id, sha] of [['P0-01', reescrit], ['P0-02', nomesAltra], ['P0-03', mateixaData]]) {
    assert.equal(per[id].status, `[FET · ${curt(sha)}]`, id);
  }
  const fora = (sha) => `El Llibre diu «[FET · ${curt(sha)}]». No es dona per segellat: el commit ${curt(sha)} no és a la història del HEAD.`;
  assert.equal(per['P0-02'].evidence, `${fora(nomesAltra)} Fitxers afectats: —`);
  assert.equal(per['P0-03'].evidence, `${fora(mateixaData)} Fitxers afectats: —`);
  assert.equal(per['P0-01'].evidence, `${fora(reescrit)} El canvi de ${curt(reescrit)} sí que hi és, amb un altre commit (${curt(copia)}): `
    + 'el mateix autor, la mateixa data, el mateix assumpte i el mateix canvi als mateixos fitxers. Cal corregir el commit al Llibre. Fitxers afectats: —');
  // La Consola només pinta de verd el de la història.
  const vista = vistaMatriu(normalitzaGovern(JSON.parse(JSON.stringify(govern))).matriu, { head: govern.head });
  assert.deepEqual(vista.files.map((f) => [f.id, f.estatVist]), [['P0-01', 'obsolet'], ['P0-02', 'obsolet'], ['P0-03', 'obsolet'], ['P0-04', 'fet']]);
  // Només lectura: rev-parse, rev-list i log, sense signatures ni colors.
  assert.deepEqual([...new Set(crides.map((a) => a[0]))].sort(), ['log', 'rev-list', 'rev-parse']);
  assert.ok(crides.filter((a) => a[0] === 'log').every((a) => a.includes('--no-show-signature') && a.includes('--no-color')));
});

test('equivalentsDe i commitsForaDe: sense el commit, amb un git que falla o sense HEAD, cap equivalent; només els FET purs', async (t) => {
  const { arrel, head } = masDeProva(t, { llibre: false });
  assert.deepEqual([...(await equivalentsDe(gitDe(arrel), head, ['abcdef1234']))], []);
  assert.deepEqual([...(await equivalentsDe(() => Promise.reject(new Error('git')), head, [curt(head)]))], []);
  assert.deepEqual([...(await equivalentsDe(gitDe(arrel), 'no és cap sha', [curt(head)]))], []);
  assert.deepEqual([...(await equivalentsDe(gitDe(arrel), head, [curt(head)]))], [], 'un commit de la història no té cap equivalent');
  const h = historiaDe([head]);
  assert.deepEqual(commitsForaDe(`[FET · ${curt(head)} / ABCDEF1 · 261021]`, h), ['abcdef1']);
  assert.deepEqual(commitsForaDe('[FET · abcdef1 · CONTINU]', h), []);
  assert.deepEqual(commitsForaDe('[PARCIAL · abcdef1]', h), []);
  assert.equal(historiaDe([head]).equivalent('abcdef1'), null);
  assert.equal(historiaDe([head], new Map([['abcdef1', head]])).equivalent('ABCDEF1'), head);
});

/* «parser-seccions-fragil» · Només les tres seccions que es diuen «Matriu P<n>» porten files. */
test('taulesDeMatriu: una secció de matriu es diu «Matriu P<n>»; un H2 que només l’esmenta no tomba res ni hi afig files', () => {
  for (const titol of ['## Matriu P0', '## 2. Matriu P0 · Bloquejants', '## 🔴 2. Matriu P0 · Bloquejants', '## **Matriu P0**']) {
    assert.deepEqual(idsDe(`${titol}\n\n| ID | Estat |\n| --- | --- |\n| A | [PENDENT] |\n`), ['A'], titol);
  }
  assert.throws(() => taulesDeMatriu('## Rèplica sobre la Matriu P0\n\n| ID | Estat |\n| --- | --- |\n| A | B |\n'), { codi: 'sense-matriu' });
  const davantDelProtocol = (bloc) => llibreDeProva().replace('## 🔒 5. Protocol', `${bloc}\n\n## 🔒 5. Protocol`);
  const TAULA_CITA = '| ID | Estat | Nota |\n| --- | --- | --- |\n| **`P1-02`** | `[FET · 0000000]` | La cita. |';
  // Un H2 de crònica sense taula: abans, un 500 per a tot el Govern.
  const sensetaula = davantDelProtocol('## Rèplica de Codex sobre la Matriu P1 · 2026-10-31\n\nCap taula: només text.');
  assert.deepEqual(idsDe(sensetaula), BASE);
  assert.deepEqual(avisosDe(sensetaula), [...AVISOS_BASE, ['seccio-ignorada', 'P1']]);
  // Amb una taula que cita una fila: abans, una fila més (P1-02 dues vegades).
  const ambTaula = davantDelProtocol(`## Contrast Codex sobre la Matriu P1 · 2026-10-31\n\n${TAULA_CITA}`);
  assert.deepEqual(idsDe(ambTaula), BASE);
  assert.deepEqual(avisosDe(ambTaula), [...AVISOS_BASE, ['seccio-ignorada', 'P1']]);
  // Una segona secció amb el títol d'una matriu ja llegida.
  const repetida = davantDelProtocol(`## 🟡 3. Matriu P1 · Revisió de Codex\n\n${TAULA_CITA}`);
  assert.deepEqual(idsDe(repetida), BASE);
  assert.deepEqual(avisosDe(repetida), [...AVISOS_BASE, ['seccio-repetida', 'P1']]);
});

test('taulesDeMatriu: una taula aliena dins d’una secció de matriu (darrere d’un H3 o amb unes altres columnes) no en porta cap fila', () => {
  const davantDeP2 = (bloc) => llibreDeProva().replace('## 🟢 4. Matriu P2', `${bloc}\n\n## 🟢 4. Matriu P2`);
  const registre = davantDeP2('### Registre de canvis de la Matriu P1\n\n| Data | Canvi | Qui |\n| --- | --- | --- |\n| 261030 | P1-23 tancada | Claude |\n| 261031 | Revisió | Codex |');
  assert.deepEqual(idsDe(registre), BASE);
  assert.deepEqual(avisosDe(registre), [['taula-estranya', 'P1'], ...AVISOS_BASE]);
  // Darrere d'un H3, ni les files amb la forma de la matriu.
  const notes = davantDeP2('### Notes de P1\n\n| **`P1-99`** | **Nota** | `[PENDENT]` | Una nota. | `x` |');
  assert.deepEqual(idsDe(notes), BASE);
  assert.deepEqual(avisosDe(notes), [['taula-estranya', 'P1'], ...AVISOS_BASE]);
  // Sense H3: una capçalera amb unes altres columnes obri una taula que no és de la matriu.
  const altra = davantDeP2('| Data | Qui | Nota | Estat |\n| --- | --- | --- | --- |\n| 261031 | Codex | revisat | FET · d6ab025f4 |\n| **`P1-98`** | **x** | `[PENDENT]` | y |');
  assert.deepEqual(idsDe(altra), BASE);
  assert.deepEqual(avisosDe(altra), [['taula-estranya', 'P1'], ...AVISOS_BASE]);
});

/* «toleràncies-i-ceiling-sense-prova» · Les toleràncies que el codi declara, cada una amb la seua prova. */
test('taulesDeMatriu: la capçalera repetida no és cap fila, una fila curta es conserva, un id repetit es diu i una H1 tanca la secció', () => {
  const tolerat = llibreDeProva().replace('| **`P1-05`** |', [
    '| ID | Àmbit | Estat | Descripció de la Millora | Fitxers Afectats |', '| :--- | :--- | :---: | :--- | :--- |',
    '| **`P1-06`** | **Curta** | `[PENDENT]` |', '| **`P1-01`** | **Repetida** | `[PENDENT]` | Una altra. | `x` |', '| **`P1-05`** |'
  ].join('\n'));
  assert.deepEqual(idsDe(tolerat), [...BASE.slice(0, 7), 'P1-06', 'P1-01', ...BASE.slice(7)]);
  const { taules, avisos } = taulesDeMatriu(tolerat);
  assert.deepEqual(avisos.map((a) => [a.codi, a.prioritat]), [['capcalera-repetida', 'P1'], ['fila-desquadrada', 'P1'], ...AVISOS_BASE, ['id-repetit', 'P1']]);
  assert.deepEqual(avisos[1], { codi: 'fila-desquadrada', prioritat: 'P1', linia: avisos[1].linia, celles: 3, columnes: 5 });
  assert.equal(avisos.at(-1).id, 'P1-01');
  assert.deepEqual(taules[1].files[4].celles, ['**`P1-06`**', '**Curta**', '`[PENDENT]`']);
  // Una H1 tanca la secció: el que ve davall ja no és de cap matriu.
  const annex = llibreDeProva().replace('## 🔒 5. Protocol', '# Annex\n\n| **`Z9`** | **Fora** | `[PENDENT]` | Davall d’una H1. |\n\n## 🔒 5. Protocol');
  assert.deepEqual(idsDe(annex), BASE);
  assert.deepEqual(avisosDe(annex), AVISOS_BASE);
});

test('GIT_CEILING_DIRECTORIES: una arrel sense .git dins d’un altre repositori no hi puja a llegir el HEAD', async (t) => {
  const { arrel: pare } = masDeProva(t, { llibre: false });
  const fill = path.join(pare, 'fill');
  escriuLlibre(fill, llibreDeProva());
  await assert.rejects(recullGovern(fill), (e) => e instanceof ErrorGovern && e.codi === 'git-absent');
  // El mateix Llibre a l'arrel del repositori sí que es compila.
  escriuLlibre(pare, llibreDeProva());
  assert.equal((await recullGovern(pare)).mcr.requirements.length, BASE.length);
});

/* «vocabulari-en-cache» · La guarda contra el verd sense commit usa el vocabulari que se li passa. */
test('estatDelLlibre i recullGovern: amb el vocabulari d’ara, un estat que la Consola llegiria com a fet ix sense estat', async (t) => {
  const vocabulari = (s) => (/IMPLEMENTAT/.test(String(s)) ? 'fet' : null);
  assert.equal(estatDelLlibre('[IMPLEMENTAT]', historiaDe([])).status, '[IMPLEMENTAT]');
  assert.equal(estatDelLlibre('[IMPLEMENTAT]', historiaDe([]), { estatDeStatus: vocabulari }).status, null);
  const { arrel } = masDeProva(t, { llibre: false });
  escriuLlibre(arrel, llibreP0([filaP0('P0-01', '[IMPLEMENTAT]')]));
  assert.equal((await recullGovern(arrel)).mcr.requirements[0].status, '[IMPLEMENTAT]');
  const ambElDara = (await recullGovern(arrel, { estatDeStatus: vocabulari })).mcr.requirements[0];
  assert.equal(ambElDara.status, null);
  assert.match(ambElDara.evidence, /cap commit comprovat a la història del HEAD/);
});
