/** Proves de la porta Olivera v3 (torn 260930_0040, tasca T5).
 *
 *  Cada prova fixa una fallada observada el 260929-30, no una hipòtesi:
 *    · a les 00:00 el rellotge va convertir en brossa el prompt que s'estava
 *      executant (ara decidix la declaració a «## Activitat en curs»);
 *    · no hi havia manera d'arxivar un document d'avui ja consumit, i el trasllat
 *      es va fer a mà per terminal i va deixar set àncores fantasma (`--arxiva --nom`);
 *    · un prompt fet bé des de `prompt_local.md` quedava bloquejat perquè la
 *      plantilla diu «0. Preflight» i la porta només coneixia «0. Abans de generar»;
 *    · sense bandera, la porta es penjava esperant un EOF per stdin just quan la
 *      skill d'higiene manava executar-la així.
 *  Totes les fixtures viuen a os.tmpdir(): cap prova toca l'Escriptori real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as olivera from '../tooling/gates/porta-olivera.mjs';

const { vius, ranci, checkTaula, checkOlivera, arxivables, arxiva, safata, avui } = olivera;

const PORTA = fileURLToPath(new URL('../tooling/gates/porta-olivera.mjs', import.meta.url));
const DESK = '_wiki_de_poble/04_escriptori';
const ARXIU = '_wiki_de_poble/90_arxiu_historic';
const DIA = avui();
// Una jornada que sempre és anterior a hui, encara que la prova creue la mitjanit.
const VELL = '250101';

function mas(t, index = '# Índex\n') {
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-olivera-v3-')));
  fs.mkdirSync(path.join(arrel, DESK), { recursive: true });
  fs.writeFileSync(path.join(arrel, DESK, '00_index_escriptori.md'), index);
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  return arrel;
}
const posa = (arrel, rel, text = '# prova\n') => {
  const f = path.join(arrel, DESK, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, text);
};
const index = (arrel) => fs.readFileSync(path.join(arrel, DESK, '00_index_escriptori.md'), 'utf8');
const hi = (arrel, rel) => fs.existsSync(path.join(arrel, rel));
const entorn = (arrel) => ({ ...process.env, SDP_ARREL: arrel });
const porta = (arrel, args, extra = {}) => spawnSync(process.execPath, [PORTA, ...args], { cwd: arrel, env: entorn(arrel), encoding: 'utf8', timeout: 10000, ...extra });

/* ── Viu per declaració ───────────────────────────────────────────────────── */

test('un document declarat viu a «## Activitat en curs» no és ranci, siga del dia que siga', (t) => {
  const arrel = mas(t, [
    '# Índex', '',
    `## Activitat en curs (${VELL}, consola)`, '',
    `- [[${VELL}_0900_prompt_viu]] — prompt en execució`,
    '### Un subapartat no tanca la secció',
    `- [[${VELL}_0905_pla_implementacio_viu|pla]]`,
    `- [[../90_arxiu_historic/${VELL}_0910_auditoria_amb_cami]] — una àncora amb camí no declara la taula`,
    '', '## Una altra secció', '',
    `- [[${VELL}_0910_auditoria_amb_cami]]`,
    `- [[${VELL}_0920_auditoria_consumida]]`, ''
  ].join('\n'));
  for (const nom of ['0900_prompt_viu', '0905_pla_implementacio_viu', '0910_auditoria_amb_cami', '0920_auditoria_consumida']) posa(arrel, `${VELL}_${nom}.md`);

  assert.deepEqual([...vius(arrel)].sort(), [`${VELL}_0900_prompt_viu`, `${VELL}_0905_pla_implementacio_viu`]);
  assert.deepEqual(ranci(arrel, DIA).map((d) => d.nom).sort(), [`${VELL}_0910_auditoria_amb_cami.md`, `${VELL}_0920_auditoria_consumida.md`]);
  const r = checkTaula(arrel);
  assert.equal(r.valid, false);
  assert.match(r.errors.join('\n'), /Escriptori sense classificar: 2 document/);
  assert.doesNotMatch(r.errors.join('\n'), /prompt_viu|pla_implementacio_viu/);
  // La declaració protegix del rellotge, però no fa desaparéixer la categoria: per nom encara pot eixir.
  assert.deepEqual(arxivables(arrel, { noms: [`${VELL}_0900_prompt_viu.md`] }).map((d) => d.nom), [`${VELL}_0900_prompt_viu.md`]);
});

test('l’informe llista els vius, no exigix pla de hui i diu que els fantasmes fan caure la porta', (t) => {
  const arrel = mas(t, `# Índex\n\n## Activitat en curs\n\n- [[${VELL}_0900_prompt_viu]]\n`);
  posa(arrel, `${VELL}_0900_prompt_viu.md`);

  assert.equal(checkTaula(arrel).valid, true, 'la taula neta no depén del pla de hui');
  const petorreta = checkOlivera(arrel).errors;
  assert.equal(petorreta.length, 1, petorreta.join('\n'));
  assert.match(petorreta[0], /^Cap Pla d'Implementació de hui/, 'la petorreta sí que el demana');

  const net = porta(arrel, []);
  assert.equal(net.status, 0, net.stderr);
  assert.match(net.stdout, new RegExp(`Declarats vius a «## Activitat en curs» \\(es conserven\\): ${VELL}_0900_prompt_viu`));
  assert.match(net.stdout, /Cap Pla d'Implementació de hui: el demana l'escriptura d'una petorreta/);

  fs.appendFileSync(path.join(arrel, DESK, '00_index_escriptori.md'), '- [[fantasma]]\n');
  const brut = porta(arrel, ['--informe']);
  assert.equal(brut.status, 1);
  assert.match(brut.stdout, /❌ Àncores a documents absents \(fan caure la porta\): fantasma/);
});

test('la Safata d’Entrada amb elements embruta la taula, amb qualsevol caixa de nom', (t) => {
  const arrel = mas(t);
  posa(arrel, '00_Bandeja_d_Entrada/nota.txt', 'x');
  posa(arrel, '00_Bandeja_d_Entrada/.DS_Store', 'x');
  assert.deepEqual(safata(arrel), { carpeta: `${DESK}/00_Bandeja_d_Entrada`, elements: ['nota.txt'] });
  assert.match(checkTaula(arrel).errors.join('\n'), /Safata d'entrada amb 1 element/);
});

/* ── Arxivat per nom ──────────────────────────────────────────────────────── */

test('--arxiva --nom --sec no mou res; sense --sec mou el document d’avui i en despenja l’àncora', (t) => {
  const arrel = mas(t, `# Índex\n\n- [[${DIA}_1200_prompt_consumit]]\n- [[${DIA}_1300_pla_implementacio_viu]]\n`);
  posa(arrel, `${DIA}_1200_prompt_consumit.md`);
  posa(arrel, `${DIA}_1300_pla_implementacio_viu.md`);
  const abans = index(arrel);

  assert.deepEqual(arxiva(arrel, { noms: [`${DIA}_1200_prompt_consumit.md`], sec: true }).moguts.map((m) => m.nota), ['simulació: es mouria']);
  const sec = porta(arrel, ['--arxiva', '--nom', `${DIA}_1200_prompt_consumit.md`, '--sec']);
  assert.equal(sec.status, 0, sec.stderr);
  assert.match(sec.stdout, /Simulació \(--sec\)/);
  assert.match(sec.stdout, new RegExp(`${DIA}_1200_prompt_consumit\\.md → ${ARXIU}/ \\(simulació: es mouria\\)`));
  assert.equal(hi(arrel, `${DESK}/${DIA}_1200_prompt_consumit.md`), true, '--sec no mou cap fitxer');
  assert.equal(hi(arrel, ARXIU), false, '--sec no crea l’arxiu');
  assert.equal(index(arrel), abans, '--sec no toca l’índex');

  const real = porta(arrel, ['--arxiva', `--nom=${DIA}_1200_prompt_consumit`]);
  assert.equal(real.status, 0, real.stderr);
  assert.equal(hi(arrel, `${DESK}/${DIA}_1200_prompt_consumit.md`), false);
  assert.equal(hi(arrel, `${ARXIU}/${DIA}_1200_prompt_consumit.md`), true);
  assert.equal(index(arrel), `# Índex\n\n- [[${DIA}_1300_pla_implementacio_viu]]\n`, 'arxivar i despenjar l’àncora són un sol acte');
  assert.match(real.stdout, /document\.mjs handoff/);
  assert.equal(hi(arrel, `${DESK}/${DIA}_1300_pla_implementacio_viu.md`), true, 'el que no es nomena es queda');
});

test('--nom rebutja subcarpetes, noms absents i categories no transitòries sense moure res', (t) => {
  const arrel = mas(t, `# Índex\n\n- [[${DIA}_1200_prompt_bo]]\n- [[${DIA}_1210_nota_personal]]\n`);
  posa(arrel, `${DIA}_1200_prompt_bo.md`);
  posa(arrel, `${DIA}_1210_nota_personal.md`);
  posa(arrel, `02_investigacio_ia/${DIA}_1220_prompt_lab.md`);
  posa(arrel, `00_bandeja_d_entrada/${DIA}_1230_prompt_safata.md`);
  const abans = index(arrel);

  const casos = [
    [[`02_investigacio_ia/${DIA}_1220_prompt_lab.md`], /subcarpetes/],
    [[`${DESK}/00_bandeja_d_entrada/${DIA}_1230_prompt_safata.md`], /subcarpetes/],
    [['../../etc/passwd'], /subcarpetes/],
    [[`${DIA}_1210_nota_personal.md`], /la categoria «nota» no és de torn/],
    [['00_index_escriptori.md'], /no és cap document solt/],
    [[`${DIA}_9999_prompt_inexistent.md`], /no és cap document solt/],
    // Un sol nom dolent atura el lot sencer: el bo tampoc es mou.
    [[`${DIA}_1200_prompt_bo.md`, `${DIA}_1210_nota_personal.md`], /no és de torn/]
  ];
  for (const [noms, error] of casos) {
    assert.throws(() => arxivables(arrel, { noms }), error, noms.join(' '));
    const r = porta(arrel, ['--arxiva', ...noms.flatMap((n) => ['--nom', n])]);
    assert.equal(r.status, 2, `${noms.join(' ')} → ${r.stdout}`);
    assert.match(r.stderr, error);
  }

  assert.equal(hi(arrel, ARXIU), false);
  assert.equal(index(arrel), abans);
  for (const rel of [`${DIA}_1200_prompt_bo.md`, `${DIA}_1210_nota_personal.md`, `02_investigacio_ia/${DIA}_1220_prompt_lab.md`, `00_bandeja_d_entrada/${DIA}_1230_prompt_safata.md`]) {
    assert.equal(hi(arrel, `${DESK}/${rel}`), true, rel);
  }
});

test('les banderes mal combinades fallen tancat en compte de llegir-se com a informe', (t) => {
  const arrel = mas(t);
  for (const [args, error] of [
    [['--nom', 'x.md'], /només valen amb --arxiva/],
    [['--sec'], /només valen amb --arxiva/],
    [['--arxiva', '--nom'], /--nom necessita/],
    [['--arxiva', '--nom', '--sec'], /--nom necessita/],
    [['--hook', '--arxiva'], /un sol mode/],
    [['--arrel=/tmp'], /Argument desconegut/]
  ]) {
    const r = porta(arrel, args, { input: '' });
    assert.equal(r.status, 2, args.join(' '));
    assert.match(r.stderr, error, args.join(' '));
  }
});

/* ── Secció 0 ─────────────────────────────────────────────────────────────── */

test('«0. Preflight», el nom de la plantilla, s’accepta igual que «0. Abans de generar»', (t) => {
  const arrel = mas(t, `# Índex\n\n- [[${DIA}_1300_pla_implementacio_prova]]\n`);
  posa(arrel, `${DIA}_1300_pla_implementacio_prova.md`);
  const preflight = (casella) => `# Prompt\n\n## 0. Preflight (Per a l'agent orquestrador)\n\n- [${casella}] **Escriptori net i indexat**\n- [x] **Pla d'Implementació** generat.\n\n## Registre\n`;

  assert.deepEqual(checkOlivera(arrel, { contingut: preflight('x') }).errors, []);
  assert.deepEqual(checkOlivera(arrel, { contingut: "## 0. Abans de generar (per a l'autor)\n- [x] fet\n" }).errors, []);
  assert.match(checkOlivera(arrel, { contingut: preflight(' ') }).errors.join('\n'), /caselles sense marcar/);
  const sense = checkOlivera(arrel, { contingut: '# Prompt\n\n## Registre\n' }).errors.join('\n');
  assert.match(sense, /0\. Abans de generar/);
  assert.match(sense, /0\. Preflight/);

  // El mateix pel camí del hook, amb un Write de Claude cap a una petorreta nova.
  const payload = { tool_name: 'Write', tool_input: { file_path: `${DESK}/${DIA}_1300_prompt_claude.md`, content: preflight('x') } };
  const r = porta(arrel, ['--hook'], { input: JSON.stringify(payload) });
  assert.equal(r.status, 0, r.stderr);
});

test('la secció 0 de la plantilla viva prompt_local.md, amb les caselles marcades, passa la porta', (t) => {
  // És el contracte entre plantilla i porta: si algú torna a reanomenar la secció
  // en un dels dos costats, esta prova cau abans que cap prompt quede bloquejat.
  const url = new URL('../_wiki_de_poble/03_actuar/plantilles/prompt_local.md', import.meta.url);
  if (!fs.existsSync(url)) return t.skip('Wiki no clonada: no hi ha plantilla viva per contrastar');
  const arrel = mas(t, `# Índex\n\n- [[${DIA}_1300_pla_implementacio_prova]]\n`);
  posa(arrel, `${DIA}_1300_pla_implementacio_prova.md`);
  const plantilla = fs.readFileSync(url, 'utf8');
  const marcada = plantilla.replace(/^([ \t]*[-*+][ \t]+)\[[ \t]\]/gm, '$1[x]');
  assert.deepEqual(checkOlivera(arrel, { contingut: marcada }).errors, []);
  assert.match(checkOlivera(arrel, { contingut: plantilla }).errors.join('\n'), /caselles sense marcar/, 'tal com naix, la plantilla porta caselles per marcar');
});

/* ── Modes de la CLI ──────────────────────────────────────────────────────── */

test('sense bandera és informe i no llig stdin: acaba encara que stdin quede obert', async (t) => {
  const arrel = mas(t);
  // `spawnSync` tanca l'stdin del fill quan no rep `input` (EOF immediat), i amb
  // ell la penjada no es veuria mai. Ací l'stdin queda obert i ningú el tanca.
  const fill = spawn(process.execPath, [PORTA], { cwd: arrel, env: entorn(arrel), stdio: ['pipe', 'pipe', 'pipe'] });
  let eixida = '';
  fill.stdout.setEncoding('utf8');
  fill.stdout.on('data', (tros) => { eixida += tros; });
  const final = await new Promise((resolve) => {
    const rellotge = setTimeout(() => { fill.kill('SIGKILL'); resolve({ penjada: true }); }, 8000);
    fill.on('close', (codi) => { clearTimeout(rellotge); resolve({ penjada: false, codi }); });
  });
  fill.stdin.destroy();
  assert.equal(final.penjada, false, 'la porta s’ha quedat esperant un EOF que no arriba mai');
  assert.equal(final.codi, 0);
  assert.match(eixida, /\[Porta Olivera\] Escriptori: 0 documents solts\./);
});

test('--hook falla tancat sense payload i jutja el que rep', (t) => {
  const arrel = mas(t);
  const buit = porta(arrel, ['--hook'], { input: '' });
  assert.equal(buit.status, 2);
  assert.match(buit.stderr, /payload buit/);
  const corrupte = porta(arrel, ['--hook'], { input: '{' });
  assert.equal(corrupte.status, 2);
  assert.match(corrupte.stderr, /il·legible/);
  const lectura = porta(arrel, ['--hook'], { input: JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'README.md' } }) });
  assert.equal(lectura.status, 0, lectura.stderr);
});

test('l’API que importen hooks-local i les proves antigues es conserva', () => {
  for (const nom of ['ARREL', 'TRANSITORIES', 'avui', 'inventari', 'vius', 'ranci', 'plaDeHui', 'safata', 'ancoratge',
    'checkTaula', 'checkOlivera', 'esPetorreta', 'destiDeShell', 'checkPayload', 'arxivables', 'arxiva']) {
    assert.ok(nom in olivera, `falta l'exportació ${nom}`);
  }
  assert.equal(olivera.checkPayload({}).code, 2);
});
