/** Proves del tractor d'autosanació d'enllaços (laboratori 260924_1700_tractors_claude). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CANDIDATS = [
  '../_wiki_de_poble/04_escriptori/02_investigacio_ia/260924_1700_tractors_claude/wiki/tractor-autosanacio.mjs',
  '../tooling/wiki/tractor-autosanacio.mjs'
];
const modul = CANDIDATS.find((p) => fs.existsSync(new URL(p, import.meta.url)));
const { enllacos, analitza, aplica, reescriu, rutaObsidian } = await import(modul);

const W = '_wiki_de_poble';
function mas(t) {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-autosanacio-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  return arrel;
}
function posa(arrel, rel, text) {
  const abs = path.join(arrel, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text);
}

test('enllacos: wiki i markdown amb línia, ignorant codi', () => {
  const e = enllacos('# T\n[[a]] i [[b/c#s|Àlies]]\n```\n[[dins]]\n```\n`[[inline]]` [doc](../x.md) [web](https://x) ![img](i.png)\n');
  assert.deepEqual(e.map((x) => [x.tipus, x.linia, x.desti]), [
    ['wiki', 2, 'a'], ['wiki', 2, 'b/c#s|Àlies'], ['markdown', 6, '../x.md']
  ]);
});

test('moviment: un fitxer mogut (git D + ??) es reapunta conservant àlies i àncora', (t) => {
  const arrel = mas(t);
  posa(arrel, `${W}/00_index.md`, '# I\n- [[02_saber/00_index_identitat|Identitat]]\n- [[00_index_identitat#Regla]]\n');
  posa(arrel, `${W}/01_ser/00_index_identitat.md`, '# Identitat\n');
  const moviments = new Map([['00_index_identitat.md', new Set([`${W}/01_ser/00_index_identitat.md`])]]);
  const r = analitza(arrel, { moviments, arrels: [W] });
  // [[00_index_identitat#Regla]] resol pel nom curt: no és penjat. El de ruta vella sí.
  assert.equal(r.troballes.length, 1);
  assert.equal(r.troballes[0].motiu, 'moviment');
  assert.equal(r.troballes[0].reescriptura, '[[01_ser/00_index_identitat|Identitat]]');
  const tocats = aplica(arrel, r.troballes);
  assert.deepEqual(tocats, [`${W}/00_index.md`]);
  assert.equal(analitza(arrel, { moviments, arrels: [W] }).troballes.length, 0, 'idempotent: després d\'aplicar no queda res');
});

test('carpeta: el destí que ara és una carpeta amb un únic índex s\'hi reapunta', (t) => {
  const arrel = mas(t);
  posa(arrel, `${W}/01_ser/00_index_identitat.md`, '# I\n- [[03_consola_termodinamica]]\n');
  posa(arrel, `${W}/02_saber/03_consola_termodinamica/00_portada.md`, '# Portada\n');
  posa(arrel, `${W}/02_saber/03_consola_termodinamica/01_mapa.md`, '# Mapa\n');
  const r = analitza(arrel, { moviments: new Map(), arrels: [W] });
  assert.equal(r.troballes.length, 1);
  assert.equal(r.troballes[0].motiu, 'carpeta');
  assert.equal(r.troballes[0].reescriptura, '[[02_saber/03_consola_termodinamica/00_portada]]');
});

test('arxiu: un destí que només viu a 90_arxiu_historic és decisió humana, no cura mecànica', (t) => {
  const arrel = mas(t);
  posa(arrel, `${W}/00_index.md`, '# I\n- [[260901_acta_vella]]\n');
  posa(arrel, `${W}/90_arxiu_historic/260901_acta_vella.md`, '# Acta\n');
  const r = analitza(arrel, { moviments: new Map(), arrels: [W] });
  assert.equal(r.troballes[0].motiu, 'arxiu');
  assert.equal(r.troballes[0].aplicable, false);
  assert.equal(r.troballes[0].requires_human_decision, true);
  assert.deepEqual(aplica(arrel, r.troballes), []);
});

test('ambigu i cap: dos candidats o cap candidat no s\'inventen', (t) => {
  const arrel = mas(t);
  posa(arrel, `${W}/00_index.md`, '# I\n- [[SKILL]]\n- [[inexistent]]\n');
  posa(arrel, `${W}/a/SKILL.md`, '# a\n');
  posa(arrel, `${W}/b/SKILL.md`, '# b\n');
  const r = analitza(arrel, { moviments: new Map(), arrels: [W] });
  assert.deepEqual(r.troballes.map((x) => x.motiu), ['ambigu', 'cap']);
  assert.equal(r.aplicables, 0);
});

test('mai escriu a la zona humana ni a l\'arxiu, encara que tinguen enllaços penjats', (t) => {
  const arrel = mas(t);
  posa(arrel, `${W}/04_escriptori/01_produccio/nota.md`, '- [[02_saber/x]]\n');
  posa(arrel, `${W}/90_arxiu_historic/vell.md`, '- [[02_saber/x]]\n');
  posa(arrel, `${W}/01_ser/x.md`, '# x\n');
  const moviments = new Map([['x.md', new Set([`${W}/01_ser/x.md`])]]);
  const r = analitza(arrel, { moviments, arrels: [W] });
  assert.equal(r.troballes.length, 0, 'la zona humana i l\'arxiu no són fonts');
});

test('vault: [[../10_actes/x]] resol al repositori però no a Obsidian; la cura és la ruta del vault', (t) => {
  const arrel = mas(t);
  posa(arrel, `${W}/04_escriptori/00_index_escriptori.md`, '# I\n- [[../10_actes/260924_acta|Acta]]\n- [[../../AGENTS]]\n');
  posa(arrel, `${W}/10_actes/260924_acta.md`, '# Acta\n');
  posa(arrel, 'AGENTS.md', '# BIOS\n');
  const r = analitza(arrel, { moviments: new Map(), arrels: [W, 'AGENTS.md'] });
  assert.deepEqual(r.troballes.map((x) => [x.motiu, x.aplicable]), [['vault', true], ['fora-del-vault', false]]);
  assert.equal(r.troballes[0].reescriptura, '[[10_actes/260924_acta|Acta]]');
  aplica(arrel, r.troballes);
  assert.match(fs.readFileSync(path.join(arrel, `${W}/04_escriptori/00_index_escriptori.md`), 'utf8'), /\[\[10_actes\/260924_acta\|Acta\]\]/);
});

test('fora-del-vault: [[AGENTS]] resol al repositori però Obsidian no el pot veure', (t) => {
  const arrel = mas(t);
  posa(arrel, `${W}/00_index.md`, '# I\n- [[AGENTS]]\n');
  posa(arrel, 'AGENTS.md', '# BIOS\n');
  const r = analitza(arrel, { moviments: new Map(), arrels: [W, 'AGENTS.md'] });
  assert.equal(r.troballes.length, 1);
  assert.equal(r.troballes[0].motiu, 'fora-del-vault');
  assert.equal(r.troballes[0].requires_human_decision, true);
});

test('markdown: la reescriptura és relativa al fitxer font', () => {
  const e = { tipus: 'markdown', cru: '[Acta](../10_actes/vella.md#p)', desti: '../10_actes/vella.md#p' };
  assert.equal(reescriu(e, `${W}/10_actes/nova.md`, `${W}/02_saber/doc.md`), '[Acta](../10_actes/nova.md#p)');
  assert.equal(rutaObsidian(`${W}/01_ser/x.md`), '01_ser/x');
  assert.equal(rutaObsidian('AGENTS.md'), 'AGENTS');
});
