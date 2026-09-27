/** Proves del generador d'una sola ordre (laboratori 260927_1310_reflex_maria).
 *
 *  Fixen la conducta que va fallar el 260927 amb el prompt 1250: petorreta i pla
 *  escrits a mà, sense rebut, amb caselles marcades en fals i cognoms diferents.
 *  Quan el generador s'instal·le a tooling/wiki, la primera ruta de CANDIDATS
 *  deixarà d'existir i la prova carregarà la instal·lada.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fixture } from './helpers/documental.mjs';
import { validateDocument } from '../tooling/documental/turns.mjs';
import { writeIndexedDraft } from '../tooling/documental/draft-write.mjs';
import { inspeccionaText } from '../tooling/gates/porta-plantilla-viva.mjs';
import { checkOlivera, avui } from '../tooling/gates/porta-olivera.mjs';

const CANDIDATS = [
  '../_wiki_de_poble/04_escriptori/02_investigacio_ia/260927_1310_reflex_maria/wiki/petorreta.mjs',
  '../tooling/wiki/petorreta.mjs'
];
const modul = CANDIDATS.find((p) => fs.existsSync(new URL(p, import.meta.url)));
const { generaPetorreta, normalitza, segell } = await import(modul);

const DESK = '_wiki_de_poble/04_escriptori';
const LOCK = '.agents/runtime/document-create.lock';
// Hora fixa: una execució que creua la mitjanit no pot canviar el dia a mitja prova.
const ARA = new Date(2026, 8, 27, 13, 10);
const OPCIONS = Object.freeze({ actor: 'maria', per: 'claude,codex', cognom: 'perfil_empresa', titol: 'Perfil d’empresa', descripcio: 'Auditoria i execució del perfil d’empresa per a Claude i Codex' });

/** Arrel de proves amb el contracte real i el marcador que exigix lib/arrel. */
function mas(t) {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, '.agents/AGENTS.md'), '# BIOS de proves\n');
  return fs.realpathSync(root);
}
const torns = (root) => {
  const dir = path.join(root, '.agents/runtime/turns');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => n.endsWith('.json')) : [];
};
const docs = (root) => fs.readdirSync(path.join(root, DESK)).filter((n) => /^\d{6}_\d{4}_/.test(n)).sort();
const llig = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const seccio0 = (raw) => /^## 0\. Abans de generar[^\n]*\n([\s\S]*?)(?=^## )/m.exec(raw)?.[1] ?? null;

test('Escriptori net: pla i petorreta amb la mateixa HHMM, secció 0 calculada i només [pendent] per omplir', (t) => {
  const root = mas(t);
  const r = generaPetorreta(root, OPCIONS, { ara: ARA });
  assert.equal(r.valid, true, r.errorsEstructurals.join('\n'));
  assert.deepEqual(r.errorsEstructurals, []);

  const pla = r.fitxers.pla.ruta, prompt = r.fitxers.petorreta.ruta;
  assert.equal(r.segell, '260927_1310');
  assert.equal(pla, `${DESK}/260927_1310_pla_implementacio_perfil_empresa.md`);
  assert.equal(prompt, `${DESK}/260927_1310_prompt_perfil_empresa.md`);
  assert.deepEqual(docs(root), [path.basename(pla), path.basename(prompt)].sort());

  const raw = llig(root, prompt);
  const s0 = seccio0(raw);
  assert.ok(s0, 'la petorreta porta la secció 0');
  assert.equal((s0.match(/^- \[x\] /gm) || []).length, 3, 'tres fets comprovats');
  assert.doesNotMatch(s0, /^[ \t]*[-*+][ \t]+\[[ \t]\]/m, 'cap casella buida');
  assert.match(s0, /\*\*Rebut obtingut\*\* per a este fitxer: `sdp:torn_/);
  assert.match(s0, /\(2026-09-27 13:10 \(hora local\), torn `torn_/, 'la mateixa hora que el nom del fitxer');
  assert.match(raw, /^\| Destinatari \| claude, codex \|$/m);
  assert.match(llig(root, pla), /^\*\*Estat del Pla:\*\* en elaboració$/m);

  // Tots els errors de `document.mjs check` són seccions o files encara [pendent], i ho diu l'eixida.
  assert.deepEqual(r.fitxers.petorreta.pendents, { seccions: ['Instrucció del torn', 'Tasques', 'Riscos'], registre: ['Model IA', 'Tokens consumits'] });
  assert.deepEqual(r.fitxers.pla.pendents, { seccions: ['Canvis proposats', 'Verificació', 'Riscos'], registre: ['Model IA', 'Tokens consumits'] });
  for (const f of Object.values(r.fitxers)) {
    const esperats = [...f.pendents.seccions.map((s) => `Secció absent o pendent: ${s}`), ...f.pendents.registre.map((k) => `Registre: falta ${k}`)];
    assert.deepEqual(validateDocument(root, llig(root, f.ruta), f.ruta, { closed: true }).sort(), esperats.sort(), f.ruta);
    assert.deepEqual(inspeccionaText(root, f.ruta, llig(root, f.ruta)).errors, [], `estructura de ${f.ruta}`);
  }
  assert.deepEqual(r.validacio, [pla, prompt].map((rel) => `node tooling/wiki/document.mjs check --file ${rel}`));

  // La porta Olivera instal·lada accepta la petorreta tal com naix: taula neta, pla d'avui i cap casella buida.
  assert.deepEqual(checkOlivera(root, { contingut: raw, dia: avui(ARA) }).errors, []);

  // Un sol torn, d'abast documental, amb un rebut per fitxer i la ruta que toca.
  assert.equal(torns(root).length, 1);
  const turn = JSON.parse(llig(root, `.agents/runtime/turns/${r.turn_id}.json`));
  assert.equal(r.caducitat, turn.expiresAt);
  assert.match(r.seguent.at(-1), /el torn caduca 24 h després d'obrir-se.*document\.mjs plan --turn-id torn_/);
  assert.equal(turn.scope, 'documents');
  assert.equal(turn.actor, 'maria');
  assert.deepEqual(Object.values(turn.receipts).map((x) => [x.route, x.file]).sort(), [['pla.implementacio', pla], ['prompt.local', prompt]].sort());
  assert.deepEqual(turn.ownedPaths, [pla, prompt], 'en arbre compartit, el torn només respon dels seus');

  // Omplir només els [pendent] deixa els dos documents vàlids.
  for (const rel of [pla, prompt]) {
    const ple = llig(root, rel).replaceAll('[pendent]', 'Contingut comprovat amb evidència.');
    assert.deepEqual(validateDocument(root, ple, rel, { closed: true }), [], rel);
  }
});

test('Escriptori brut: error clar abans d’obrir torn o crear cap fitxer', (t) => {
  const root = mas(t);
  fs.writeFileSync(path.join(root, DESK, '260101_0900_prompt_vell.md'), '# vell\n');
  assert.throws(() => generaPetorreta(root, OPCIONS, { ara: ARA }), /Escriptori brut: 1 document\(s\).*260101_0900_prompt_vell\.md.*No s'ha obert cap torn/s);
  assert.deepEqual(torns(root), []);
  assert.deepEqual(docs(root), ['260101_0900_prompt_vell.md']);
});

test('cognom que no és un slug: error abans de tocar res', (t) => {
  const root = mas(t);
  for (const cognom of ['Perfil Empresa', 'perfil-empresa', 'perfíl', '_perfil', 'perfil__empresa', '', undefined, 'x'.repeat(61)]) {
    assert.throws(() => generaPetorreta(root, { ...OPCIONS, cognom }), /--cognom: .* no és un slug/, String(cognom));
  }
  assert.deepEqual(torns(root), []);
  assert.deepEqual(docs(root), []);
});

test('destinataris, actor, títol, descripció i telemetria es validen', () => {
  assert.deepEqual(normalitza(OPCIONS).per, ['claude', 'codex']);
  assert.deepEqual(normalitza({ ...OPCIONS, per: ' Codex , codex ' }).per, ['codex']);
  assert.throws(() => normalitza({ ...OPCIONS, per: 'gemini' }), /--per: «gemini» no val/);
  assert.throws(() => normalitza({ ...OPCIONS, per: true }), /--per/);
  assert.throws(() => normalitza({ ...OPCIONS, actor: 'IAIA MarIA' }), /--actor/);
  assert.throws(() => normalitza({ ...OPCIONS, titol: 'dues\nlínies' }), /--titol/);
  assert.throws(() => normalitza({ ...OPCIONS, descripcio: 'massa curt' }), /--descripcio: .*en té 10/);
  assert.throws(() => normalitza({ ...OPCIONS, descripcio: 'x'.repeat(221) }), /--descripcio/);
  assert.throws(() => normalitza({ ...OPCIONS, model: true }), /--model/);
  assert.throws(() => normalitza({ ...OPCIONS, tokens: '10 | 20' }), /--tokens/);
  assert.equal(segell(new Date(2026, 8, 27, 9, 5)), '260927_0905');
});

test('un destí que ja existix no obri torn: cap rebut fantasma', (t) => {
  const root = mas(t);
  fs.writeFileSync(path.join(root, DESK, '260927_1310_prompt_perfil_empresa.md'), '# ja hi era\n');
  assert.throws(() => generaPetorreta(root, OPCIONS, { ara: ARA }), /260927_1310_prompt_perfil_empresa\.md: ja existix.*No s'ha obert cap torn/);
  assert.deepEqual(torns(root), []);
  assert.deepEqual(docs(root), ['260927_1310_prompt_perfil_empresa.md']);
});

test('lock orfe de writeIndexedDraft: error abans d’obrir torn, cap rebut fantasma', (t) => {
  const root = mas(t);
  fs.mkdirSync(path.join(root, '.agents/runtime'), { recursive: true });
  fs.writeFileSync(path.join(root, LOCK), '');
  assert.throws(() => generaPetorreta(root, OPCIONS, { ara: ARA, espera: 0 }), /document-create\.lock ocupat.*No s'ha obert cap torn/);
  assert.deepEqual(torns(root), []);
  assert.deepEqual(docs(root), []);
});

test('lock passatger a mitja escriptura: reintenta amb el mateix rebut i acaba vàlid', (t) => {
  const root = mas(t);
  let intents = 0;
  // Un altre agent agafa el lock just quan toca escriure la petorreta, i l'allibera al tercer intent.
  const escriu = (arrel, file, raw) => {
    if (file.endsWith('_prompt_perfil_empresa.md')) {
      intents += 1;
      if (intents === 1) fs.writeFileSync(path.join(root, LOCK), '');
      if (intents === 3) fs.rmSync(path.join(root, LOCK));
    }
    return writeIndexedDraft(arrel, file, raw);
  };
  const r = generaPetorreta(root, OPCIONS, { ara: ARA, espera: 0, escriu });
  assert.equal(r.valid, true, r.errorsEstructurals.join('\n'));
  assert.equal(intents, 3);
  const turn = JSON.parse(llig(root, `.agents/runtime/turns/${r.turn_id}.json`));
  assert.equal(Object.keys(turn.receipts).length, 2, 'un rebut per document, no un per intent');
  assert.equal(r.fitxers.petorreta.reflex.split(':')[2], Object.values(turn.receipts).find((x) => x.route === 'prompt.local').id);
  assert.equal(fs.existsSync(path.join(root, LOCK)), false);
});

test('lock que no s’allibera: l’error diu rebut fantasma i torn inservible', (t) => {
  const root = mas(t);
  let intents = 0;
  const escriu = (arrel, file, raw) => {
    if (file.endsWith('_prompt_perfil_empresa.md')) { intents += 1; fs.writeFileSync(path.join(root, LOCK), ''); }
    return writeIndexedDraft(arrel, file, raw);
  };
  assert.throws(() => generaPetorreta(root, OPCIONS, { ara: ARA, espera: 0, reintents: 3, escriu }),
    /No s'ha pogut crear .*260927_1310_prompt_perfil_empresa\.md.*Rebut fantasma: el torn torn_\S+ té el rebut sdp:torn_.*torn inservible, no el reutilitzes\..*El pla .*260927_1310_pla_implementacio_perfil_empresa\.md sí que s'ha creat/s);
  assert.equal(intents, 3, 'reintents acotats');
  assert.deepEqual(docs(root), ['260927_1310_pla_implementacio_perfil_empresa.md']);
  assert.equal(torns(root).length, 1);
});

test('model i tokens declarats omplin el Registre dels dos documents', (t) => {
  const root = mas(t);
  const r = generaPetorreta(root, { ...OPCIONS, model: 'Gemini 3 Pro', tokens: 'no exposat' }, { ara: ARA });
  for (const f of Object.values(r.fitxers)) {
    assert.deepEqual(f.pendents.registre, [], f.ruta);
    assert.match(llig(root, f.ruta), /^\| Model IA \| Gemini 3 Pro \|$/m);
    assert.match(llig(root, f.ruta), /^\| Tokens consumits \| no exposat \|$/m);
  }
});

test('CLI: una sola ordre amb JSON a l’eixida, i exit 1 amb l’Escriptori brut', (t) => {
  const root = mas(t);
  const cli = fileURLToPath(new URL(modul, import.meta.url));
  const args = ['--arrel', root, '--actor', 'maria', '--per', 'claude', '--cognom', 'prova_cli', '--titol', 'Prova de la CLI', '--descripcio', 'Petorreta generada per la CLI de proves'];
  const bo = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  assert.equal(bo.status, 0, bo.stderr);
  const r = JSON.parse(bo.stdout);
  assert.equal(r.valid, true);
  assert.match(r.turn_id, /^torn_/);
  assert.deepEqual(r.destinataris, ['claude']);
  // La CLI usa el rellotge real: es compara amb el segell que ella mateixa declara, no amb un avui() posterior.
  assert.match(r.segell, /^\d{6}_\d{4}$/);
  assert.equal(r.fitxers.petorreta.ruta, `${DESK}/${r.segell}_prompt_prova_cli.md`);

  fs.writeFileSync(path.join(root, DESK, '260101_0900_auditoria_vella.md'), '# vella\n');
  const brut = spawnSync(process.execPath, [cli, ...args.map((a) => (a === 'prova_cli' ? 'prova_cli_dos' : a))], { encoding: 'utf8' });
  assert.equal(brut.status, 1);
  assert.equal(JSON.parse(brut.stderr).valid, false);
  assert.match(JSON.parse(brut.stderr).error, /Escriptori brut/);
});
