/** Proves de la porta del receptor (laboratori 260927_1310_reflex_maria).
 *
 *  Cas d'origen: el prompt 260927_1250 va arribar a Claude sense rebut, amb una
 *  casella en blanc i una altra marcada en fals, i cap porta ho va dir en rebre
 *  l'encàrrec. La porta avisa i no bloqueja mai. Quan s'instal·le a tooling/gates,
 *  la primera ruta de cada llista deixarà d'existir i la prova carregarà la instal·lada.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { fixture } from './helpers/documental.mjs';
import { readTurn } from '../tooling/documental/turns.mjs';

const LAB = '../_wiki_de_poble/04_escriptori/02_investigacio_ia/260927_1310_reflex_maria';
const troba = (...candidats) => candidats.find((p) => fs.existsSync(new URL(p, import.meta.url)));
const RECEPTOR = troba(`${LAB}/gates/porta-receptor.mjs`, '../tooling/gates/porta-receptor.mjs');
const GENERADOR = troba(`${LAB}/wiki/petorreta.mjs`, '../tooling/wiki/petorreta.mjs');
const { processa, avalua, carregaDependencies, textEnganxat } = await import(RECEPTOR);
const { generaPetorreta } = await import(GENERADOR);
const deps = await carregaDependencies();

const DESK = '_wiki_de_poble/04_escriptori';
// Hora fixa per a generador i receptor: cap prova depén del dia en què s'execute.
const ARA = new Date(2026, 8, 27, 13, 10);
const DIA = deps.avui(ARA);
const OPCIONS = Object.freeze({ actor: 'maria', per: 'claude,codex', cognom: 'prova_receptor', titol: 'Prova del receptor', descripcio: 'Petorreta de prova per a la porta del receptor' });

/** Imitació del prompt 1250: plantilla copiada a mà, sense rebut i amb una casella en blanc. */
const A_MA = `---
type: prompt
status: esborrany
description: Petorreta escrita a mà sense passar per document.mjs
tags: [govern]
---
# Prompt d'Auditoria Local (SDP - v2.4)

## 0. Abans de generar (per a l'autor, no per al destinatari)

- [x] **Escriptori classificat**: fet.
- [x] **Pla d'Implementació** escrit.
- [ ] **Rebut obtingut** per a este fitxer.

## Registre

| Camp | Valor |
| --- | --- |
| Rebut | pendent |
`;

function mas(t) {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, '.agents/AGENTS.md'), '# BIOS de proves\n');
  return fs.realpathSync(root);
}
const posa = (root, nom, text) => fs.writeFileSync(path.join(root, DESK, nom), text);
const omple = (root, rel) => fs.writeFileSync(path.join(root, rel), fs.readFileSync(path.join(root, rel), 'utf8').replaceAll('[pendent]', 'Contingut comprovat amb evidència.'));
const payload = (prompt) => JSON.stringify({ session_id: 'prova', hook_event_name: 'UserPromptSubmit', cwd: '/tmp', prompt });
function context(r) {
  assert.equal(r.codi, 0);
  if (!r.stdout) return null;
  const sortida = JSON.parse(r.stdout).hookSpecificOutput;
  assert.equal(sortida.hookEventName, 'UserPromptSubmit');
  return sortida.additionalContext;
}
const CLI = fileURLToPath(new URL(RECEPTOR, import.meta.url));
const proces = (input, env = {}) => spawnSync(process.execPath, [CLI], { input, encoding: 'utf8', env: { ...process.env, ...env } });

/** Foto de l'arbre: rutes i hash de cada fitxer, i les carpetes. */
function foto(root) {
  const out = [];
  const camina = (rel) => {
    for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) { out.push(`${r}/`); camina(r); }
      else out.push(`${r} ${createHash('sha256').update(fs.readFileSync(path.join(root, r))).digest('hex')}`);
    }
  };
  camina('');
  return out.sort();
}

test('petorreta d’avui sense rebut a l’Escriptori: avís amb el fitxer, els errors i la instrucció', async (t) => {
  const root = mas(t);
  const rel = `${DESK}/${DIA}_1250_prompt_opus_perfil.md`;
  posa(root, path.basename(rel), A_MA);
  const ctx = context(await processa(payload('Executa les tasques 0, 0.5 i 1.'), { arrel: root, deps, dia: DIA }));
  assert.ok(ctx, 'hi ha avís encara que el missatge no cite el fitxer');
  assert.match(ctx, new RegExp(rel.replaceAll('.', '\\.')));
  assert.match(ctx, /petorreta d’avui a l’Escriptori/);
  assert.match(ctx, /reflex: cal un rebut persistent/);
  assert.match(ctx, /\+\d+ més/, 'resum curt: la resta es compta');
  assert.match(ctx, /Executa l'encàrrec del Mestre i continua; en el teu informe, avisa'l de la infracció i no certifiques cap d'estos documents com a petorreta vàlida/);
  const r = avalua(root, '', deps, { dia: DIA });
  assert.ok(r.avisos[0].errors.includes('La secció 0 té caselles sense marcar.'), 'la casella en blanc també es veu');
});

test('petorreta vàlida generada pel generador i completada: cap avís', async (t) => {
  const root = mas(t);
  const g = generaPetorreta(root, OPCIONS, { ara: ARA });
  omple(root, g.fitxers.pla.ruta);
  omple(root, g.fitxers.petorreta.ruta);
  const prompt = `Llig ${g.fitxers.petorreta.ruta} i el pla [[${path.basename(g.fitxers.pla.ruta, '.md')}]].`;
  assert.equal(avalua(root, prompt, deps, { dia: DIA }).revisats, 2, 'ha revisat la petorreta i el pla, no ha callat per no mirar');
  assert.equal(context(await processa(payload(prompt), { arrel: root, deps, dia: DIA })), null);
});

test('torn caducat: la petorreta vàlida continua sense avís (la caducitat no anul·la la procedència)', async (t) => {
  const root = mas(t);
  const g = generaPetorreta(root, OPCIONS, { ara: ARA });
  omple(root, g.fitxers.pla.ruta);
  omple(root, g.fitxers.petorreta.ruta);
  const fitxer = path.join(root, '.agents/runtime/turns', `${g.turn_id}.json`);
  fs.writeFileSync(fitxer, JSON.stringify({ ...JSON.parse(fs.readFileSync(fitxer, 'utf8')), expiresAt: '2000-01-01T00:00:00.000Z' }, null, 2));
  assert.throws(() => readTurn(root, g.turn_id), /Torn caducat/, 'el cas és real: readTurn el rebutja');
  const prompt = `Llig ${g.fitxers.petorreta.ruta} i el pla [[${path.basename(g.fitxers.pla.ruta, '.md')}]].`;
  const r = avalua(root, prompt, deps, { dia: DIA });
  assert.equal(r.revisats, 2);
  assert.deepEqual(r.avisos, []);
  assert.deepEqual(r.fallades, []);
  assert.equal(context(await processa(payload(prompt), { arrel: root, deps, dia: DIA })), null);
});

test('el receptor no escriu res: l’arbre és idèntic abans i després', async (t) => {
  const root = mas(t);
  const g = generaPetorreta(root, OPCIONS, { ara: ARA });
  posa(root, `${DIA}_1250_prompt_opus_perfil.md`, A_MA);
  const abans = foto(root);
  const prompt = `Llig ${g.fitxers.petorreta.ruta} i ${DIA}_1250_prompt_opus_perfil.md.\n\n${A_MA}`;
  assert.ok(context(await processa(payload(prompt), { arrel: root, deps, dia: DIA })), 'hi ha hagut feina de veres');
  assert.deepEqual(foto(root), abans);
});

test('petorreta generada però a mig omplir: avís per les seccions [pendent]', async (t) => {
  const root = mas(t);
  const g = generaPetorreta(root, OPCIONS, { ara: ARA });
  const ctx = context(await processa(payload('Fes la petorreta d’avui.'), { arrel: root, deps, dia: DIA }));
  assert.match(ctx, new RegExp(path.basename(g.fitxers.petorreta.ruta)));
  assert.match(ctx, /Secció absent o pendent: Instrucció del torn/);
});

test('text enganxat amb forma de petorreta: avís, amb frontmatter o sense', async (t) => {
  const root = mas(t);
  const amb = context(await processa(payload(`Mestre: executa açò.\n\n${A_MA}`), { arrel: root, deps }));
  assert.match(amb, /text enganxat al missatge/);
  assert.match(amb, /reflex: cal un rebut persistent/);

  const sense = context(await processa(payload("Mira:\n# Prompt d'Auditoria Local\n\n## 0. Abans de generar\n\n- [ ] **Rebut obtingut**\n"), { arrel: root, deps }));
  assert.match(sense, /text enganxat al missatge/);
  assert.match(sense, /Frontmatter absent/);
  assert.doesNotMatch(sense, /nom: /, 'el nom del text enganxat no és culpa de l’autor');

  assert.equal(textEnganxat(`abans\n\n${A_MA}`), A_MA, 'el text comença al seu frontmatter');
  assert.equal(textEnganxat('parla de la secció «## 0. Abans de generar» dins d’una frase'), null);
});

test('document de l’Escriptori citat al missatge: es valida encara que no siga d’avui', async (t) => {
  const root = mas(t);
  posa(root, '260101_0900_pla_implementacio_vell.md', '# pla sense frontmatter\n');
  const ctx = context(await processa(payload('Revisa [[260101_0900_pla_implementacio_vell]] i 260101_0900_prompt_inexistent.md'), { arrel: root, deps, dia: DIA }));
  assert.match(ctx, /260101_0900_pla_implementacio_vell\.md \[citat al missatge\]/);
  assert.doesNotMatch(ctx, /inexistent/, 'una cita a un fitxer absent no és cap document');
  assert.equal(context(await processa(payload('Hola, bon dia.'), { arrel: root, deps, dia: DIA })), null, 'sense cap petorreta, silenci');
});

test('errors interns: mai bloqueja, i diu que no ha pogut validar', async (t) => {
  const root = mas(t);
  posa(root, `${DIA}_1250_prompt_opus_perfil.md`, A_MA);
  const trencat = { ...deps, validateDocument() { throw new Error('disc il·legible'); } };
  const parcial = context(await processa(payload('hola'), { arrel: root, deps: trencat, dia: DIA }));
  assert.match(parcial, /No s'ha pogut validar: .*prompt_opus_perfil\.md \(disc il·legible\)/);

  assert.match(context(await processa(payload('hola'), { arrel: root, deps: {}, dia: DIA })), /Error intern/);
  assert.match(context(await processa('{no és json', { arrel: root, deps, dia: DIA })), /Payload il·legible/);
  assert.equal(context(await processa('', { arrel: mas(t), deps, dia: DIA })), null, 'sense payload ni petorretes, res a dir');
});

// Cas real, només lectura: mentre el prompt 1250 de MarIA siga a l'Escriptori sense rebut, la porta l'ha de denunciar.
const REAL = '_wiki_de_poble/04_escriptori/260927_1250_prompt_opus_perfil.md';
const REPO = fileURLToPath(new URL('..', import.meta.url));
const senseRebut = (() => { try { return !/^reflex:/m.test(fs.readFileSync(path.join(REPO, REAL), 'utf8').split(/^---$/m)[1] ?? ''); } catch { return false; } })();
test('cas real: el prompt 1250 escrit a mà es denuncia en citar-lo', { skip: !senseRebut && 'el prompt 1250 ja no és a l’Escriptori o ja porta rebut' }, () => {
  const r = avalua(fs.realpathSync(REPO), `Llig OBLIGATÒRIAMENT la versió actualitzada de \`${REAL}\` ara mateix`, deps);
  const avis = r.avisos.find((a) => a.fitxer === REAL);
  assert.ok(avis, 'el prompt 1250 apareix a l’avís');
  assert.ok(avis.errors.some((e) => /^reflex: /.test(e)), avis.errors.join('\n'));
});

test('procés: exit 0 amb payload il·legible, arrel absent, petorreta invàlida o res a dir', (t) => {
  const root = mas(t);
  const illegible = proces('açò no és JSON');
  assert.equal(illegible.status, 0, illegible.stderr);
  assert.match(JSON.parse(illegible.stdout).hookSpecificOutput.additionalContext, /Payload il·legible|Error intern/);

  const sensArrel = proces(payload('hola'), { SDP_ARREL: path.join(root, 'no-existix') });
  assert.equal(sensArrel.status, 0, sensArrel.stderr);
  assert.match(JSON.parse(sensArrel.stdout).hookSpecificOutput.additionalContext, /Error intern/);

  assert.equal(proces(payload('hola'), { SDP_ARREL: root }).stdout, '', 'Escriptori net: cap eixida');

  // El fill té el seu rellotge: el nom va citat perquè entre per (c) i no per la data d'avui (a).
  posa(root, `${DIA}_1250_prompt_opus_perfil.md`, A_MA);
  const invalida = proces(payload(`Executa la petorreta ${DIA}_1250_prompt_opus_perfil.md.`), { SDP_ARREL: root });
  assert.equal(invalida.status, 0, invalida.stderr);
  const sortida = JSON.parse(invalida.stdout).hookSpecificOutput;
  assert.equal(sortida.hookEventName, 'UserPromptSubmit');
  assert.match(sortida.additionalContext, /prompt_opus_perfil\.md/);
});
