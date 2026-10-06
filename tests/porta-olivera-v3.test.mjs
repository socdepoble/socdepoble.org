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
 *  Les proves «[261006 x]» fixen el paquet d'àncores (laboratori
 *  261006_0055_olivera_ancores_opus): artefactes de qualsevol extensió per nom,
 *  carpeta de sessió, reapuntat, despenjat amb la regla d'ancoratge, lot amb
 *  fallada, lock i rename de l'índex, remei dels fantasmes, --repara, --renomena
 *  i àncores d'una sola línia.
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
import { anchored } from '../tooling/documental/core.mjs';
import { knownRead } from '../tooling/gates/mutation-policy.mjs';
import { openTurn, checkTurn, handoffDocument } from '../tooling/documental/turns.mjs';
import { createDraft } from '../tooling/wiki/document.mjs';
import { fixture, validDoc } from './helpers/documental.mjs';

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
const sense = (nom) => nom.replace(/\.md$/, '');
/** Un fitxer qualsevol fora de l'Escriptori (arxiu, actes), camí des de l'arrel. */
const fitxer = (arrel, rel, text = '# arxivat\n') => {
  fs.mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
  fs.writeFileSync(path.join(arrel, rel), text);
};

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

/* ── 261006 · Paquet d'àncores ────────────────────────────────────────────── */

test('[261006] l’API nova que usen draft-write i les eines d’àncores és exportada', () => {
  for (const nom of ['PER_NOM', 'SECCIO_ARXIVATS', 'SECCIO_SENSE_DESTI', 'artefactes', 'nomsSolts', 'prosaIndex', 'resolAncora',
    'ancoresDe', 'apuntaA', 'insereixLlista', 'remeis', 'repara', 'renomena']) {
    assert.ok(nom in olivera, `falta l'exportació ${nom}`);
  }
});

test('[261006 a] artefactes de qualsevol extensió, doble i en majúscules, amb les categories compostes senceres', (t) => {
  const arrel = mas(t);
  for (const nom of [`${DIA}_1200_produccio_lighthouse.report.html`, `${DIA}_1201_produccio_captura.PNG`, `${DIA}_1202_macro_prompt_x.md`,
    `${DIA}_1203_micro_bundle_y.json`, `${DIA}_1204_pla_implementacio_z.md`, `${DIA}_1205_auditoria_sense_extensio`, 'notes humanes.md']) posa(arrel, nom);
  const per = Object.fromEntries(olivera.artefactes(arrel).map((d) => [d.nom, [d.categoria, d.ext]]));
  assert.deepEqual(per, {
    [`${DIA}_1200_produccio_lighthouse.report.html`]: ['produccio', '.report.html'],
    [`${DIA}_1201_produccio_captura.PNG`]: ['produccio', '.PNG'],
    [`${DIA}_1202_macro_prompt_x.md`]: ['macro_prompt', '.md'],
    [`${DIA}_1203_micro_bundle_y.json`]: ['micro_bundle', '.json'],
    [`${DIA}_1204_pla_implementacio_z.md`]: ['pla', '.md'],
  }, 'sense extensió o sense nom termodinàmic queden fora: límit declarat');
  assert.deepEqual(olivera.inventari(arrel).map((d) => `${d.nom}:${d.categoria}`).sort(),
    [`${DIA}_1202_macro_prompt_x.md:macro_prompt`, `${DIA}_1204_pla_implementacio_z.md:pla`], 'l’inventari d’envelliment continua sent només Markdown');
});

test('[261006 a] un macro_prompt de jornades anteriors és ranci i ix per nom', (t) => {
  const nom = `${VELL}_0900_macro_prompt_x.md`;
  const arrel = mas(t, `# Índex\n\n- [[${sense(nom)}]]\n`);
  posa(arrel, nom);
  assert.deepEqual(ranci(arrel, DIA).map((d) => d.nom), [nom]);
  assert.match(checkTaula(arrel).errors.join('\n'), /Escriptori sense classificar: 1 document/);
  assert.deepEqual(arxiva(arrel, { noms: [nom] }).moguts.map((m) => m.nota), ['mogut']);
  assert.equal(hi(arrel, `${ARXIU}/${nom}`), true);
  assert.equal(checkTaula(arrel).valid, true);
});

test('[261006 b] per nom ixen produccio de qualsevol extensió i avaluacio; --sec no mou res i estudi continua fora', (t) => {
  const arts = [`${DIA}_0032_produccio_lighthouse.report.html`, `${DIA}_0033_produccio_canvis.patch`, `${DIA}_0034_produccio_dades.json`, `${DIA}_0345_avaluacio_final.md`];
  const estudi = `${DIA}_0400_estudi_dades.json`;
  const arrel = mas(t, `# Índex\n\n## Recursos\n\n${arts.map((n) => `- [[${n}]]`).join('\n')}\n- [[${estudi}]]\n`);
  for (const n of arts) posa(arrel, n);
  posa(arrel, estudi, '{}\n');
  assert.equal(checkTaula(arrel).valid, true);
  const abans = index(arrel);
  assert.deepEqual(arxiva(arrel, { noms: arts, sec: true }).moguts.map((m) => m.nota), arts.map(() => 'simulació: es mouria'));
  assert.equal(hi(arrel, ARXIU), false);
  assert.equal(index(arrel), abans);

  const r = porta(arrel, ['--arxiva', ...arts.flatMap((n) => ['--nom', n])]);
  assert.equal(r.status, 0, r.stderr);
  for (const n of arts) {
    assert.equal(hi(arrel, `${ARXIU}/${n}`), true, n);
    assert.equal(hi(arrel, `${DESK}/${n}`), false, n);
  }
  assert.equal(index(arrel), `# Índex\n\n## Recursos\n\n- [[${estudi}]]\n`);
  assert.equal(checkTaula(arrel).valid, true);
  assert.match(r.stdout, /document\.mjs handoff .*0345_avaluacio_final\.md/);
  assert.doesNotMatch(r.stdout, /handoff .*\.json/, 'només els Markdown porten rebut de torn');
  assert.throws(() => arxivables(arrel, { noms: [estudi] }), /la categoria «estudi» no és de torn/);
});

test('[261006 b] l’informe diu quins artefactes de jornades anteriors poden eixir per nom, sense canviar el verd', (t) => {
  const json = `${VELL}_0900_produccio_dades.json`;
  const arrel = mas(t, `# Índex\n\n- [[${json}]]\n`);
  posa(arrel, json, '{}\n');
  const r = porta(arrel, ['--informe']);
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /Artefactes regulars visibles de primer nivell: 1; tots exigixen àncora/);
  assert.match(r.stdout, new RegExp(`Artefactes de jornades anteriors que poden eixir per nom \\(no fan caure la porta\\): 1 \\(${json}\\)`));
});

test('[261006 c] --sessio mou a una carpeta de sessió de l’arxiu; --sec no la crea i els valors dolents ixen amb 2', (t) => {
  const nom = `${DIA}_1200_prompt_sessio.md`;
  const S = '250101_Sessio_Prova';
  const arrel = mas(t, `# Índex\n\n- [[${sense(nom)}]]\n`);
  posa(arrel, nom);
  for (const dolent of ['../x', 'a/b', 'x', '250101_', '.', '250101_a/../b']) {
    const r = porta(arrel, ['--arxiva', '--nom', nom, '--sessio', dolent]);
    assert.equal(r.status, 2, dolent);
    assert.match(r.stderr, /--sessio .*aammdd_Nom/, dolent);
  }
  for (const args of [['--arxiva', '--nom', nom, '--sessio'], ['--arxiva', '--nom', nom, '--sessio='], ['--arxiva', '--sessio', S, '--sessio', S]]) {
    assert.equal(porta(arrel, args).status, 2, args.join(' '));
  }
  const fora = porta(arrel, ['--sessio', S]);
  assert.equal(fora.status, 2);
  assert.match(fora.stderr, /només valen amb --arxiva/);
  assert.equal(hi(arrel, ARXIU), false, 'cap valor dolent crea l’arxiu');
  assert.equal(hi(arrel, `${DESK}/${nom}`), true);

  const sec = porta(arrel, ['--arxiva', '--nom', nom, '--sessio', S, '--sec']);
  assert.equal(sec.status, 0, sec.stderr);
  assert.match(sec.stdout, new RegExp(`${nom} → ${ARXIU}/${S}/ \\(simulació: es mouria\\)`));
  assert.equal(hi(arrel, ARXIU), false, '--sec no crea cap carpeta');

  const real = porta(arrel, ['--arxiva', '--nom', nom, `--sessio=${S}`]);
  assert.equal(real.status, 0, real.stderr);
  assert.equal(hi(arrel, `${ARXIU}/${S}/${nom}`), true);
  assert.match(real.stdout, new RegExp(`--to ${ARXIU}/${S}/${nom}`));
  assert.equal(index(arrel), '# Índex\n\n');
  assert.equal(checkTaula(arrel).valid, true);
});

test('[261006 c] un arxiu o una carpeta de sessió que són un symlink aturen el trasllat abans de moure res', (t) => {
  const nom = `${DIA}_1200_prompt_enllac.md`;
  const arrel = mas(t, `# Índex\n\n- [[${sense(nom)}]]\n`);
  posa(arrel, nom);
  const fora = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-olivera-fora-')));
  t.after(() => fs.rmSync(fora, { recursive: true, force: true }));
  fs.mkdirSync(path.join(arrel, ARXIU), { recursive: true });
  fs.symlinkSync(fora, path.join(arrel, ARXIU, '250101_Sessio_Enllac'));
  assert.throws(() => arxiva(arrel, { noms: [nom], sessio: '250101_Sessio_Enllac' }), /Estructura de l'arxiu invàlida/);
  assert.throws(() => arxiva(arrel, { noms: [nom], sessio: '250101_Sessio_Enllac', sec: true }), /Estructura de l'arxiu invàlida/);
  assert.equal(hi(arrel, `${DESK}/${nom}`), true);
  assert.deepEqual(fs.readdirSync(fora), []);
  assert.equal(index(arrel), `# Índex\n\n- [[${sense(nom)}]]\n`);
});

test('[261006 d] --reapunta: fora d’Activitat l’àncora porta camí i àlies; dins se n’ix; qui es queda sense cap la rep a la secció dels arxivats', (t) => {
  const x = `${DIA}_1200_produccio_x.json`;
  const y = `${DIA}_1201_auditoria_y.md`;
  const z = `${DIA}_1202_prompt_z.md`;
  const w = `${DIA}_1203_acta_w.md`;
  const S = '250101_Sessio_Prova';
  const A = `../90_arxiu_historic/${S}`;
  const arrel = mas(t, [
    '# Índex', '', '## Activitat en curs', '', `- [[${sense(y)}]]`, `- [[${sense(z)}]]`, '',
    '## Evidència', '', `- [[${x}|captura de producció]]`, `- ![[${x}]]`, `- [[${sense(w)}]]`, `| [[${sense(y)}\\|informe]] | fet |`, ''
  ].join('\n'));
  for (const n of [x, y, z, w]) posa(arrel, n);
  const r = arxiva(arrel, { noms: [x, y, z, w], sessio: S, reapunta: true });
  assert.deepEqual(r.moguts.map((m) => m.nota), ['mogut', 'mogut', 'mogut', 'mogut']);
  const text = index(arrel);
  assert.equal(text, [
    '# Índex', '', '## Activitat en curs', '',
    '## Evidència', '', `- [[${A}/${x}|captura de producció]]`, `- ![[${A}/${x}]]`, `- [[${A}/${sense(w)}]]`, `| [[${A}/${sense(y)}\\|informe]] | fet |`, '',
    `## ${olivera.SECCIO_ARXIVATS}`, '', `- [[${A}/${sense(z)}]]`, ''
  ].join('\n'), 'una àncora sense | ni # es reapunta sencera, sense repetir l’últim caràcter');
  assert.equal(checkTaula(arrel).valid, true, checkTaula(arrel).errors.join('\n'));
  for (const n of [x, y, z, w]) assert.ok(anchored(text, `${ARXIU}/${S}/${n}`), n);
  assert.equal(vius(arrel).size, 0, '«Activitat en curs» ja no llista cap arxivat');
});

test('[261006 d] --reapunta i handoff: un document ancorat només a «Activitat en curs» tanca el relleu sense «Document sense àncora»', (t) => {
  const root = fixture(t);
  const d = validDoc(root, { suffix: 'reapuntada' });
  fs.writeFileSync(path.join(root, d.file), d.content);
  const nom = path.basename(d.file);
  const desti = `${ARXIU}/${nom}`;
  fs.writeFileSync(path.join(root, DESK, '00_index_escriptori.md'), `---\ntype: index\nstatus: canonic\ndescription: Índex de treball de proves\n---\n# Índex\n\n## Activitat en curs\n\n- [[${sense(nom)}]]\n`);
  const r = porta(root, ['--arxiva', '--nom', nom, '--reapunta']);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes(`Relleu del torn: node tooling/wiki/document.mjs handoff --turn-id ${d.turn.turn_id} --file ${DESK}/${nom} --to ${desti}`), r.stdout);
  assert.match(index(root), new RegExp(`## Activitat en curs\\n\\n## ${olivera.SECCIO_ARXIVATS}\\n\\n- \\[\\[\\.\\./90_arxiu_historic/${sense(nom)}\\]\\]\\n$`));
  handoffDocument(root, d.turn.turn_id, d.file, desti);
  const errors = checkTurn(root, d.turn.turn_id).errors;
  assert.ok(!errors.some((e) => e.startsWith('Document sense àncora') || e.startsWith('Document eliminat sense relleu')), errors.join('\n'));
  assert.equal(checkTaula(root).valid, true, checkTaula(root).errors.join('\n'));
});

test('[261006 d] sense --reapunta, l’ordre impresa tampoc deixa el torn sense àncora: només els rebuts amb relleu possible reben camí', (t) => {
  const root = fixture(t);
  const obert = validDoc(root, { suffix: 'torn_obert' });
  const tancat = validDoc(root, { suffix: 'torn_tancat' });
  const solt = `${DIA}_1200_prompt_sense_rebut.md`;
  for (const d of [obert, tancat]) fs.writeFileSync(path.join(root, d.file), d.content);
  fs.writeFileSync(path.join(root, DESK, solt), '# prova\n');
  const [o, c] = [obert, tancat].map((d) => path.basename(d.file));
  fs.writeFileSync(path.join(root, DESK, '00_index_escriptori.md'), `---\ntype: index\nstatus: canonic\ndescription: Índex de treball de proves\n---\n# Índex\n\n## Activitat en curs\n\n${[o, c, solt].map((n) => `- [[${sense(n)}]]`).join('\n')}\n`);
  const registre = path.join(root, '.agents/runtime/turns', `${tancat.turn.turn_id}.json`);
  fs.writeFileSync(registre, JSON.stringify({ ...JSON.parse(fs.readFileSync(registre, 'utf8')), state: 'closed' }));

  const r = porta(root, ['--arxiva', '--nom', o, '--nom', c, '--nom', solt]);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes(`Relleu del torn: node tooling/wiki/document.mjs handoff --turn-id ${obert.turn.turn_id} --file ${DESK}/${o} --to ${ARXIU}/${o}`), r.stdout);
  assert.match(r.stdout, new RegExp(`Rebut del torn ${tancat.turn.turn_id} sense relleu possible \\(torn ja tancat\\)`));
  assert.ok(r.stdout.includes(`Si porta rebut de torn: node tooling/wiki/document.mjs handoff --turn-id ID --file ${DESK}/${solt}`), r.stdout);
  assert.match(index(root), new RegExp(`## Activitat en curs\\n\\n## ${olivera.SECCIO_ARXIVATS}\\n\\n- \\[\\[\\.\\./90_arxiu_historic/${sense(o)}\\]\\]\\n$`), 'només el rebut d’un torn obert rep l’àncora amb camí');
  handoffDocument(root, obert.turn.turn_id, obert.file, `${ARXIU}/${o}`);
  const errors = checkTurn(root, obert.turn.turn_id).errors;
  assert.ok(!errors.some((e) => e.startsWith('Document sense àncora') || e.startsWith('Document eliminat sense relleu')), errors.join('\n'));
  assert.equal(checkTaula(root).valid, true, checkTaula(root).errors.join('\n'));
});

test('[261006 e] el despenjat resol amb la regla d’ancoratge i el cens d’abans: no s’emporta homònims', (t) => {
  const jpg = `${DIA}_1200_produccio_x.jpg`;
  const nota = `${jpg}.md`;
  const h = `${DIA}_1300_auditoria_h`;
  const arrel = mas(t, `# Índex\n\n- [[${jpg}]]\n- [[${nota}]]\n- [[${h}]]\n- [[${h}.md]]\n`);
  posa(arrel, jpg, 'imatge'); posa(arrel, nota); posa(arrel, h, 'recurs sense extensió'); posa(arrel, `${h}.md`);
  assert.deepEqual(olivera.ancoratge(arrel), { senseAncora: [], fantasma: [] });
  arxiva(arrel, { noms: [jpg, `${h}.md`] });
  assert.equal(index(arrel), `# Índex\n\n- [[${nota}]]\n- [[${h}]]\n`, 'x.jpg no s’emporta [[x.jpg.md]] ni H.md el [[H]] del recurs');
  assert.deepEqual(olivera.ancoratge(arrel), { senseAncora: [], fantasma: [] });
  assert.equal(checkTaula(arrel).valid, true);
});

test('[261006 f] col·lisió dins de la carpeta de sessió: el que xoca es queda amb l’àncora, la resta es mou i ix amb 1', (t) => {
  const a = `${DIA}_1200_prompt_a.md`;
  const b = `${DIA}_1201_prompt_b.md`;
  const S = '250101_Sessio_Prova';
  const arrel = mas(t, `# Índex\n\n- [[${sense(a)}]]\n- [[${sense(b)}]]\n`);
  posa(arrel, a); posa(arrel, b);
  fitxer(arrel, `${ARXIU}/${S}/${a}`, '# versió anterior\n');
  const r = porta(arrel, ['--arxiva', '--nom', a, '--nom', b, '--sessio', S]);
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stdout, new RegExp(`${a} → ${ARXIU}/${S}/ \\(ja existia a l’arxiu; no es sobreescriu\\)`));
  assert.equal(hi(arrel, `${DESK}/${a}`), true);
  assert.equal(fs.readFileSync(path.join(arrel, ARXIU, S, a), 'utf8'), '# versió anterior\n');
  assert.equal(hi(arrel, `${ARXIU}/${S}/${b}`), true);
  assert.equal(index(arrel), `# Índex\n\n- [[${sense(a)}]]\n`);
  assert.equal(checkTaula(arrel).valid, true);
});

test('[261006 f] un destí que apareix entre la comprovació i el trasllat no es trepitja', (t) => {
  const [a, b] = [`${DIA}_1200_prompt_carrera_a.md`, `${DIA}_1201_prompt_carrera_b.md`];
  const arrel = mas(t, `# Índex\n\n- [[${sense(a)}]]\n- [[${sense(b)}]]\n`);
  posa(arrel, a, '# a de la taula\n'); posa(arrel, b);
  const original = fs.linkSync;
  // Una altra mà deixa a l'arxiu un «a» just després de la comprovació d'existència.
  fs.linkSync = (de, cap, ...resta) => {
    if (String(cap).endsWith(a)) fs.writeFileSync(cap, '# a d’una altra mà\n');
    return original(de, cap, ...resta);
  };
  let r;
  try { r = arxiva(arrel, { noms: [a, b] }); } finally { fs.linkSync = original; }
  assert.deepEqual(r.moguts.map((m) => m.nota), ['ja existia a l’arxiu; no es sobreescriu', 'mogut']);
  assert.equal(fs.readFileSync(path.join(arrel, ARXIU, a), 'utf8'), '# a d’una altra mà\n', 'el destí aparegut no es trepitja');
  assert.equal(fs.readFileSync(path.join(arrel, DESK, a), 'utf8'), '# a de la taula\n');
  assert.equal(hi(arrel, `${ARXIU}/${b}`), true);
  assert.equal(index(arrel), `# Índex\n\n- [[${sense(a)}]]\n`);
  assert.equal(checkTaula(arrel).valid, true);
});

test('[261006 f] un trasllat que falla a mitjan lot: els ja moguts ixen de l’índex i l’error ho diu', (t) => {
  const [a, b, c] = ['a', 'b', 'c'].map((x) => `${DIA}_1200_prompt_lot_${x}.md`);
  const arrel = mas(t, `# Índex\n\n${[a, b, c].map((n) => `- [[${sense(n)}]]`).join('\n')}\n`);
  for (const n of [a, b, c]) posa(arrel, n);
  const original = fs.linkSync;
  fs.linkSync = (de, cap, ...resta) => {
    if (String(de).endsWith(b)) { const error = new Error('EIO: fallada sintètica'); error.code = 'EIO'; throw error; }
    return original(de, cap, ...resta);
  };
  let fallada = null;
  try { arxiva(arrel, { noms: [a, b, c] }); } catch (error) { fallada = error; } finally { fs.linkSync = original; }
  assert.match(fallada?.message ?? '', /EIO: fallada sintètica/);
  assert.match(fallada.message, new RegExp(`Moguts abans de la fallada.*${a}`));
  assert.equal(hi(arrel, `${ARXIU}/${a}`), true);
  assert.equal(hi(arrel, `${DESK}/${b}`), true);
  assert.equal(hi(arrel, `${DESK}/${c}`), true);
  assert.equal(index(arrel), `# Índex\n\n- [[${sense(b)}]]\n- [[${sense(c)}]]\n`);
  assert.deepEqual(olivera.ancoratge(arrel), { senseAncora: [], fantasma: [] });
  assert.equal(hi(arrel, '.agents/runtime/document-create.lock'), false, 'el lock es retira també amb fallada');
});

test('[261006 g] l’índex s’escriu dins del lock de draft-write, per temporal i rename, i no trepitja una edició concurrent', (t) => {
  const a = `${DIA}_1200_prompt_lock.md`;
  const arrel = mas(t, `# Índex\n\n- [[${sense(a)}]]\n`);
  posa(arrel, a);
  const lock = path.join(arrel, '.agents/runtime/document-create.lock');
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  fs.writeFileSync(lock, '');
  assert.throws(() => arxiva(arrel, { noms: [a] }), /Índex ocupat/);
  assert.equal(hi(arrel, `${DESK}/${a}`), true, 'amb el lock pres no es mou res');
  assert.equal(hi(arrel, ARXIU), false);
  fs.unlinkSync(lock);

  const fitxerIndex = path.join(arrel, DESK, '00_index_escriptori.md');
  const inode = fs.statSync(fitxerIndex).ino;
  const original = fs.writeFileSync;
  let injectat = false;
  fs.writeFileSync = (f, dades, ...resta) => {
    const r = original(f, dades, ...resta);
    if (!injectat && typeof f === 'number') { injectat = true; fs.appendFileSync(fitxerIndex, 'Text concurrent.\n'); }
    return r;
  };
  try { arxiva(arrel, { noms: [a] }); } finally { fs.writeFileSync = original; }
  assert.equal(injectat, true, 'la finestra entre la lectura i el rename s’exercita');
  assert.equal(index(arrel), '# Índex\n\nText concurrent.\n');
  assert.notEqual(fs.statSync(fitxerIndex).ino, inode, 'l’índex es reemplaça per rename, no es reescriu al seu inode');
  assert.deepEqual(fs.readdirSync(path.join(arrel, DESK)).filter((n) => n.endsWith('.tmp')), []);
  assert.equal(fs.existsSync(lock), false);
});

test('[261006 g] un índex amb enllaç dur atura el trasllat abans de moure res', (t) => {
  const a = `${DIA}_1200_prompt_dur.md`;
  const arrel = mas(t, `# Índex\n\n- [[${sense(a)}]]\n`);
  posa(arrel, a);
  fs.linkSync(path.join(arrel, DESK, '00_index_escriptori.md'), path.join(arrel, 'index-enllac.md'));
  assert.throws(() => arxiva(arrel, { noms: [a] }), /Estructura de l'Escriptori invàlida/);
  assert.equal(hi(arrel, `${DESK}/${a}`), true);
  assert.equal(hi(arrel, ARXIU), false);
});

test('[261006 g] si l’índex no es pot reescriure després del trasllat, l’error ho diu i --repara ho cura', (t) => {
  const a = `${DIA}_1200_prompt_index_caigut.md`;
  const arrel = mas(t, `# Índex\n\n- [[${sense(a)}]]\n`);
  posa(arrel, a);
  const original = fs.renameSync;
  fs.renameSync = (de, cap, ...resta) => {
    if (String(de).endsWith('.tmp')) { const error = new Error('EIO: índex sintètic'); error.code = 'EIO'; throw error; }
    return original(de, cap, ...resta);
  };
  let fallada = null;
  try { arxiva(arrel, { noms: [a] }); } catch (error) { fallada = error; } finally { fs.renameSync = original; }
  assert.match(fallada?.message ?? '', /no s'ha pogut actualitzar: EIO: índex sintètic/);
  assert.match(fallada.message, new RegExp(`Moguts sense despenjar: ${a}`));
  assert.equal(hi(arrel, `${ARXIU}/${a}`), true);
  assert.deepEqual(olivera.ancoratge(arrel).fantasma, [sense(a)]);
  assert.deepEqual(fs.readdirSync(path.join(arrel, DESK)).filter((n) => n.endsWith('.tmp')), [], 'cap temporal abandonat');
  const r = olivera.repara(arrel);
  assert.deepEqual(r.unics.map((x) => x.ancora), [`../90_arxiu_historic/${sense(a)}`]);
  assert.equal(index(arrel), `# Índex\n\n- [[../90_arxiu_historic/${sense(a)}]]\n`);
  assert.equal(checkTaula(arrel).valid, true);
});

test('[261006 h] cada àncora fantasma diu on és el document, buscat només pel nom, o que no és a cap dels llocs cercats', (t) => {
  const S = '250101_Sessio_Prova';
  const arrel = mas(t, ['# Índex', '', '- [[250101_0900_auditoria_arrel]]', '- [[250101_0901_auditoria_sessio|àlies]]', '- [[250101_0902_acta_marmota]]',
    '- [[250101_0903_estudi_lab.md]]', '- [[250101_0904_prompt_perdut]]', '- [[250101_0905_prompt_doble]]', ''].join('\n'));
  fitxer(arrel, `${ARXIU}/250101_0900_auditoria_arrel.md`);
  fitxer(arrel, `${ARXIU}/${S}/250101_0901_auditoria_sessio.md`);
  fitxer(arrel, '_wiki_de_poble/10_actes/250101_0902_acta_marmota.md');
  fitxer(arrel, `${DESK}/02_investigacio_ia/250101_0903_estudi_lab.md`);
  fitxer(arrel, `${ARXIU}/250101_0905_prompt_doble.md`);
  fitxer(arrel, `${ARXIU}/${S}/250101_0905_prompt_doble.md`);
  // AGENTS §5: de l'arxiu només es lligen noms, mai contingut.
  const llegits = [];
  const [rf, of] = [fs.readFileSync, fs.openSync];
  fs.readFileSync = (f, ...r) => { if (String(f).includes('90_arxiu_historic')) llegits.push(String(f)); return rf(f, ...r); };
  fs.openSync = (f, ...r) => { if (String(f).includes('90_arxiu_historic')) llegits.push(String(f)); return of(f, ...r); };
  let taula;
  try { taula = checkTaula(arrel); } finally { fs.readFileSync = rf; fs.openSync = of; }
  assert.deepEqual(llegits, []);
  const error = taula.errors.find((e) => e.startsWith('Àncores a documents absents: '));
  assert.ok(error, taula.errors.join('\n'));
  assert.ok(error.includes(`250101_0900_auditoria_arrel → és a ${ARXIU}/250101_0900_auditoria_arrel.md; l'àncora bona és [[../90_arxiu_historic/250101_0900_auditoria_arrel]]`), error);
  assert.ok(error.includes(`250101_0901_auditoria_sessio → és a ${ARXIU}/${S}/250101_0901_auditoria_sessio.md; l'àncora bona és [[../90_arxiu_historic/${S}/250101_0901_auditoria_sessio]]`), error);
  assert.ok(error.includes("250101_0902_acta_marmota → és a _wiki_de_poble/10_actes/250101_0902_acta_marmota.md; l'àncora bona és [[../10_actes/250101_0902_acta_marmota]]"), error);
  assert.ok(error.includes(`250101_0903_estudi_lab.md → és a ${DESK}/02_investigacio_ia/250101_0903_estudi_lab.md; l'àncora bona és [[02_investigacio_ia/250101_0903_estudi_lab]]`), error);
  // La cerca té un sol nivell: el text no pot dir que el document no existix.
  assert.ok(error.includes(`250101_0904_prompt_perdut → no és a cap dels llocs cercats (${ARXIU}/ i les seues subcarpetes, _wiki_de_poble/10_actes/ i les subcarpetes de l'Escriptori; la cerca no baixa més d'un nivell)`), error);
  assert.doesNotMatch(error, /no és enlloc/);
  assert.match(error, /250101_0905_prompt_doble → ambigu: /);
  const cli = porta(arrel, ['--informe']);
  assert.equal(cli.status, 1);
  assert.match(cli.stdout, /❌ Àncores a documents absents \(fan caure la porta\): 250101_0900_auditoria_arrel → és a /);
});

test('[261006 i] --repara aplica els remeis únics conservant àlies, retira amb constància els que no tenen destí i no toca els ambigus', (t) => {
  const S = '250101_Sessio_Prova';
  const arrel = mas(t, ['# Índex', '', '## Activitat en curs', '', '- [[250101_0900_auditoria_arrel|feta]]', '',
    '## Altres', '', '| [[250101_0901_auditoria_sessio\\|sessió]] | x |', '- [[250101_0904_prompt_perdut]]', '- [[250101_0905_prompt_doble]]', ''].join('\n'));
  fitxer(arrel, `${ARXIU}/250101_0900_auditoria_arrel.md`);
  fitxer(arrel, `${ARXIU}/${S}/250101_0901_auditoria_sessio.md`);
  fitxer(arrel, `${ARXIU}/250101_0905_prompt_doble.md`);
  fitxer(arrel, `${ARXIU}/${S}/250101_0905_prompt_doble.md`);
  const abans = index(arrel);

  const sec = porta(arrel, ['--repara', '--sec']);
  assert.equal(sec.status, 1, sec.stderr);
  assert.match(sec.stdout, /Simulació \(--sec\)/);
  assert.match(sec.stdout, /250101_0904_prompt_perdut → sense destí: es retiraria/);
  assert.match(sec.stdout, /Avís: sense destí vol dir que no és als llocs cercats .*la cerca no baixa més d'un nivell.*comprova'l abans de reparar/);
  assert.equal(index(arrel), abans, '--sec no toca l’índex');

  const r = porta(arrel, ['--repara']);
  assert.equal(r.status, 1, 'l’ambigua queda per a una tria humana');
  assert.match(r.stdout, /250101_0905_prompt_doble → ambigua/);
  assert.ok(r.stdout.includes(`handoff --turn-id ID --file ${DESK}/250101_0900_auditoria_arrel.md --to ${ARXIU}/250101_0900_auditoria_arrel.md`), r.stdout);
  const text = index(arrel);
  assert.ok(text.startsWith(['# Índex', '', '## Activitat en curs', '', '- [[../90_arxiu_historic/250101_0900_auditoria_arrel|feta]]', '',
    '## Altres', '', `| [[../90_arxiu_historic/${S}/250101_0901_auditoria_sessio\\|sessió]] | x |`, '- [[250101_0905_prompt_doble]]', '',
    `## ${olivera.SECCIO_SENSE_DESTI}`, '', `- ${DIA} · \`250101_0904_prompt_perdut\`: `].join('\n')), text);
  assert.deepEqual(olivera.ancoratge(arrel).fantasma, ['250101_0905_prompt_doble'], 'la constància no és cap enllaç viu');

  fs.unlinkSync(path.join(arrel, ARXIU, S, '250101_0905_prompt_doble.md'));
  const segona = porta(arrel, ['--repara']);
  assert.equal(segona.status, 0, segona.stdout);
  assert.ok(index(arrel).includes('- [[../90_arxiu_historic/250101_0905_prompt_doble]]'));
  assert.equal(checkTaula(arrel).valid, true, checkTaula(arrel).errors.join('\n'));
  const res = porta(arrel, ['--repara']);
  assert.equal(res.status, 0);
  assert.match(res.stdout, /Cap àncora fantasma: res a reparar/);
});

test('[261006 i·j] --repara i --renomena són de MarIA o del Mestre: el hook de Claude i Codex no les compta com a lectura', () => {
  const arrel = fileURLToPath(new URL('..', import.meta.url));
  const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } });
  for (const ordre of ['node tooling/gates/porta-olivera.mjs --repara', 'node tooling/gates/porta-olivera.mjs --repara --sec',
    `node tooling/gates/porta-olivera.mjs --renomena ${DIA}_1200_pla_x.md --a ${DIA}_1200_pla_implementacio_x.md`,
    'node tooling/gates/porta-olivera.mjs --arxiva --sessio 250101_Sessio_Prova --reapunta']) {
    assert.equal(knownRead(bash(ordre), arrel), false, ordre);
  }
  assert.equal(knownRead(bash('node tooling/gates/porta-olivera.mjs --informe'), arrel), true, 'control: l’informe és lectura');
});

test('[261006 j] --renomena reanomena dins de l’Escriptori, reescriu totes les formes d’àncora i dona el handoff exacte', (t) => {
  const root = fixture(t);
  const turn = openTurn(root, { scope: 'documents' });
  const vell = `${DIA}_1303_pla_opus.md`;
  const nou = `${DIA}_1303_pla_implementacio_opus.md`;
  const [v, n] = [sense(vell), sense(nou)];
  createDraft(root, turn.turn_id, { route: 'pla.implementacio', file: `${DESK}/${vell}`, title: 'Pla', description: 'Pla de prova per al reanomenat' });
  fs.appendFileSync(path.join(root, DESK, '00_index_escriptori.md'), ['', '## Referències', '', `- [[${vell}]]`, `- [[${v}|el pla]]`,
    `- [[04_escriptori/${v}#Canvis proposats]]`, `- ![[${v}]]`, `| [[${v}\\|pla]] | viu |`, `Exemple: \`[[${v}]]\``, ''].join('\n'));

  const sec = porta(root, ['--renomena', vell, '--a', nou, '--sec']);
  assert.equal(sec.status, 0, sec.stderr);
  assert.match(sec.stdout, /6 àncora\/es de l'índex es reescriurien/);
  assert.equal(hi(root, `${DESK}/${vell}`), true, '--sec no mou res');

  const r = porta(root, ['--renomena', `${DESK}/${vell}`, '--a', nou]);
  assert.equal(r.status, 0, r.stderr);
  const ordre = `node tooling/wiki/document.mjs handoff --turn-id ${turn.turn_id} --file ${DESK}/${vell} --to ${DESK}/${nou}`;
  assert.ok(r.stdout.includes(`Relleu del torn: ${ordre}`), r.stdout);
  assert.equal(hi(root, `${DESK}/${vell}`), false);
  assert.equal(hi(root, `${DESK}/${nou}`), true);
  const text = index(root);
  for (const forma of [`- [[${n}]]`, `- [[${nou}]]`, `- [[${n}|el pla]]`, `- [[04_escriptori/${n}#Canvis proposats]]`, `- ![[${n}]]`, `| [[${n}\\|pla]] | viu |`, `Exemple: \`[[${v}]]\``]) {
    assert.ok(text.includes(forma), forma);
  }
  assert.deepEqual(olivera.ancoratge(root), { senseAncora: [], fantasma: [] });
  handoffDocument(root, turn.turn_id, `${DESK}/${vell}`, `${DESK}/${nou}`);
  const errors = checkTurn(root, turn.turn_id).errors;
  assert.ok(!errors.some((e) => /sense relleu|sense àncora/.test(e)), errors.join('\n'));

  posa(root, `${DIA}_1400_pla_implementacio_ocupat.md`);
  for (const [args, error] of [
    [['--renomena', nou, '--a', `${DIA}_1400_pla_implementacio_ocupat.md`], /ja existix/],
    [['--renomena', nou, '--a', nou], /mateix nom/],
    [['--renomena', nou, '--a', 'notes humanes.md'], /no és un nom taxonòmic/],
    [['--renomena', nou, '--a', `${DIA}_1303_pla_implementacio_opus.json`], /conservar l'extensió/],
    [['--renomena', `${DIA}_9999_pla_absent.md`, '--a', `${DIA}_9999_pla_nou.md`], /no és cap document solt/],
    [['--renomena', nou, '--a', `02_investigacio_ia/${nou}`], /subcarpetes/],
    [['--renomena', nou], /van junts/],
    [['--a', nou], /van junts/],
    [['--renomena', nou, '--a', `${DIA}_1500_pla_x.md`, '--arxiva'], /un sol mode/],
  ]) {
    const p = porta(root, args);
    assert.equal(p.status, 2, args.join(' '));
    assert.match(p.stderr, error, args.join(' '));
  }
  assert.equal(hi(root, `${DESK}/${nou}`), true, 'cap error mou res');
});

test('[261006 j] --renomena no mou res si el relleu ja no és possible, i el retorn al nom del rebut no demana handoff', (t) => {
  const root = fixture(t);
  const turn = openTurn(root, { scope: 'documents' });
  const vell = `${DIA}_1303_pla_caducat.md`;
  const nou = `${DIA}_1303_pla_implementacio_caducat.md`;
  createDraft(root, turn.turn_id, { route: 'pla.implementacio', file: `${DESK}/${vell}`, title: 'Pla', description: 'Pla de prova per al reanomenat impossible' });
  const registre = path.join(root, '.agents/runtime/turns', `${turn.turn_id}.json`);
  const original = JSON.parse(fs.readFileSync(registre, 'utf8'));
  const abans = index(root);
  for (const [canvi, motiu] of [
    [{ expiresAt: new Date(Date.now() - 1000).toISOString() }, /torn caducat/],
    [{ expiresAt: new Date(Date.now() + 60 * 1000).toISOString() }, /a menys de 10 minuts de caducar/],
    [{ state: 'closed' }, /torn ja tancat/],
  ]) {
    fs.writeFileSync(registre, JSON.stringify({ ...original, ...canvi }));
    for (const args of [['--renomena', vell, '--a', nou, '--sec'], ['--renomena', vell, '--a', nou]]) {
      const r = porta(root, args);
      assert.equal(r.status, 2, `${args.join(' ')} → ${r.stdout}`);
      assert.match(r.stderr, /el relleu del torn .* no és possible/);
      assert.match(r.stderr, motiu);
      assert.equal(hi(root, `${DESK}/${vell}`), true, 'el document conserva el nom');
      assert.equal(hi(root, `${DESK}/${nou}`), false);
      assert.equal(index(root), abans, 'l’índex no es toca');
    }
  }
  // Un mv a mà ja l'havia reanomenat: el rebut continua sent del nom vell, i tornar-hi
  // és la recuperació, sense handoff, encara que el torn haja caducat.
  fs.writeFileSync(registre, JSON.stringify({ ...original, expiresAt: new Date(Date.now() - 1000).toISOString() }));
  fs.renameSync(path.join(root, DESK, vell), path.join(root, DESK, nou));
  fs.writeFileSync(path.join(root, DESK, '00_index_escriptori.md'), abans.replace(`[[${sense(vell)}]]`, `[[${sense(nou)}]]`));
  const retorn = porta(root, ['--renomena', nou, '--a', vell]);
  assert.equal(retorn.status, 0, retorn.stderr);
  assert.match(retorn.stdout, /El rebut del torn ja és del nom nou: el document torna al seu lloc i no cal cap handoff/);
  assert.doesNotMatch(retorn.stdout, /document\.mjs handoff/);
  assert.equal(hi(root, `${DESK}/${vell}`), true);
  assert.equal(index(root), abans);
});

test('[261006 j] --renomena no abreuja l’àncora si un recurs sense extensió es diu com el nom nou', (t) => {
  const vell = `${DIA}_1300_pla_x.md`;
  const nou = `${DIA}_1300_pla_implementacio_x.md`;
  const recurs = sense(nou);
  const arrel = mas(t, `# Índex\n\n- [[${sense(vell)}]]\n- [[${recurs}]]\n`);
  posa(arrel, vell);
  posa(arrel, recurs, 'recurs sense extensió');
  assert.deepEqual(olivera.ancoratge(arrel), { senseAncora: [], fantasma: [] });
  const r = porta(arrel, ['--renomena', vell, '--a', nou]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(index(arrel), `# Índex\n\n- [[${nou}]]\n- [[${recurs}]]\n`);
  assert.deepEqual(olivera.ancoratge(arrel), { senseAncora: [], fantasma: [] });
});

test('[261006 j] --renomena d’un artefacte sense rebut no demana handoff', (t) => {
  const [a, b] = [`${DIA}_1200_produccio_a.json`, `${DIA}_1200_produccio_b.json`];
  const arrel = mas(t, `# Índex\n\n- [[${a}]]\n`);
  posa(arrel, a, '{}\n');
  const r = porta(arrel, ['--renomena', a, '--a', b]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /no cal cap handoff/);
  assert.equal(index(arrel), `# Índex\n\n- [[${b}]]\n`);
  assert.equal(fs.readFileSync(path.join(arrel, DESK, b), 'utf8'), '{}\n');
  assert.equal(hi(arrel, '.agents/runtime/document-create.lock'), false);
});

test('[261006 k] un «[[» sense tancar no s’empassa l’àncora de la línia següent', (t) => {
  const y = `${DIA}_1200_prompt_y.md`;
  const arrel = mas(t, `# Índex\n\n## Activitat en curs\n\n- [[${DIA}_1100_prompt_mig_escrit\n- [[${sense(y)}]]\n`);
  posa(arrel, y);
  assert.deepEqual(olivera.ancoratge(arrel), { senseAncora: [], fantasma: [] });
  assert.ok(vius(arrel).has(sense(y)));
  assert.equal(checkTaula(arrel).valid, true);
});
